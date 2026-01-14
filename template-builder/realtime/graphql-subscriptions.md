# GraphQL Subscriptions Templates

Production-ready GraphQL subscription patterns for real-time data with Apollo and other servers.

## Overview

- **Transports**: WebSocket, SSE
- **Pub/Sub**: In-memory, Redis, Kafka
- **Filtering**: Per-subscription filtering
- **Authentication**: Connection-level auth

## Quick Start

```bash
# Apollo Server
npm install @apollo/server graphql-ws ws graphql-subscriptions

# Redis PubSub
npm install graphql-redis-subscriptions ioredis

# Yoga Server
npm install graphql-yoga

# Client
npm install @apollo/client graphql-ws
```

## Apollo Server Setup

```typescript
// src/graphql/server.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub, withFilter } from 'graphql-subscriptions';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';

// Type definitions
const typeDefs = `#graphql
  type Message {
    id: ID!
    content: String!
    author: User!
    room: String!
    createdAt: String!
  }

  type User {
    id: ID!
    name: String!
    status: UserStatus!
  }

  enum UserStatus {
    ONLINE
    AWAY
    OFFLINE
  }

  type Notification {
    id: ID!
    type: NotificationType!
    title: String!
    message: String!
    data: String
    createdAt: String!
  }

  enum NotificationType {
    INFO
    WARNING
    ERROR
    SUCCESS
  }

  type Query {
    messages(room: String!): [Message!]!
    user(id: ID!): User
  }

  type Mutation {
    sendMessage(room: String!, content: String!): Message!
    updateUserStatus(status: UserStatus!): User!
  }

  type Subscription {
    messageAdded(room: String!): Message!
    userStatusChanged(userId: ID): User!
    notification(userId: ID!): Notification!
  }
`;

// PubSub instance
const pubsub = new PubSub();

// Event names
const EVENTS = {
  MESSAGE_ADDED: 'MESSAGE_ADDED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  NOTIFICATION: 'NOTIFICATION',
};

// Context type
interface Context {
  user?: {
    id: string;
    name: string;
  };
}

// Resolvers
const resolvers = {
  Query: {
    messages: async (_: unknown, { room }: { room: string }) => {
      // Fetch messages from database
      return [];
    },
    user: async (_: unknown, { id }: { id: string }) => {
      // Fetch user from database
      return null;
    },
  },

  Mutation: {
    sendMessage: async (
      _: unknown,
      { room, content }: { room: string; content: string },
      context: Context
    ) => {
      const message = {
        id: crypto.randomUUID(),
        content,
        author: context.user,
        room,
        createdAt: new Date().toISOString(),
      };

      // Save to database
      // await db.messages.create(message);

      // Publish to subscribers
      await pubsub.publish(EVENTS.MESSAGE_ADDED, {
        messageAdded: message,
        room,
      });

      return message;
    },

    updateUserStatus: async (
      _: unknown,
      { status }: { status: string },
      context: Context
    ) => {
      const user = {
        id: context.user!.id,
        name: context.user!.name,
        status,
      };

      // Update database
      // await db.users.update(user.id, { status });

      // Publish status change
      await pubsub.publish(EVENTS.USER_STATUS_CHANGED, {
        userStatusChanged: user,
      });

      return user;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.MESSAGE_ADDED]),
        (payload, variables) => {
          // Filter by room
          return payload.room === variables.room;
        }
      ),
    },

    userStatusChanged: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.USER_STATUS_CHANGED]),
        (payload, variables) => {
          // If userId provided, filter to that user
          if (variables.userId) {
            return payload.userStatusChanged.id === variables.userId;
          }
          return true;
        }
      ),
    },

    notification: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.NOTIFICATION]),
        (payload, variables, context) => {
          // Only receive own notifications
          return payload.notification.userId === variables.userId;
        }
      ),
    },
  },
};

// Server setup
async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Create schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // WebSocket server
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // WebSocket handler with context
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Extract auth from connection params
        const token = ctx.connectionParams?.authToken as string;

        if (token) {
          // Verify token and get user
          // const user = await verifyToken(token);
          const user = { id: '1', name: 'User' }; // Mock
          return { user };
        }

        return {};
      },
      onConnect: async (ctx) => {
        console.log('Client connected');
        // Validate connection
        const token = ctx.connectionParams?.authToken;
        if (!token) {
          // Allow connection but with limited access
        }
        return true;
      },
      onDisconnect: (ctx, code, reason) => {
        console.log('Client disconnected', { code, reason });
      },
    },
    wsServer
  );

  // Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // HTTP context
        const token = req.headers.authorization?.replace('Bearer ', '');
        // const user = token ? await verifyToken(token) : null;
        return { user: { id: '1', name: 'User' } };
      },
    })
  );

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions at ws://localhost:${PORT}/graphql`);
  });
}

startServer();
```

## Redis PubSub for Scaling

```typescript
// src/graphql/redis-pubsub.ts
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

// Redis options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

// Create PubSub with Redis
export const pubsub = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
  reviver: (key, value) => {
    // Handle date parsing
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value);
    }
    return value;
  },
});

// With message transformation
export const pubsubWithTransform = new RedisPubSub({
  publisher: new Redis(redisOptions),
  subscriber: new Redis(redisOptions),
  messageEventName: 'messageBuffer',
  pmessageEventName: 'pmessageBuffer',
});

// Usage in resolvers
const resolvers = {
  Subscription: {
    messageAdded: {
      subscribe: (_: unknown, { room }: { room: string }) => {
        // Subscribe to room-specific channel
        return pubsub.asyncIterator(`MESSAGE_ADDED.${room}`);
      },
    },
  },

  Mutation: {
    sendMessage: async (
      _: unknown,
      { room, content }: { room: string; content: string },
      context: Context
    ) => {
      const message = {
        id: crypto.randomUUID(),
        content,
        room,
        author: context.user,
        createdAt: new Date(),
      };

      // Publish to room-specific channel
      await pubsub.publish(`MESSAGE_ADDED.${room}`, {
        messageAdded: message,
      });

      return message;
    },
  },
};
```

## Client Implementation

```typescript
// src/client/apollo-client.ts
import {
  ApolloClient,
  InMemoryCache,
  split,
  HttpLink,
  ApolloLink,
} from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
  uri: process.env.GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql',
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
    connectionParams: () => ({
      authToken: localStorage.getItem('token'),
    }),
    on: {
      connected: () => console.log('WebSocket connected'),
      closed: () => console.log('WebSocket closed'),
      error: (error) => console.error('WebSocket error', error),
    },
    retryAttempts: 5,
    shouldRetry: () => true,
  })
);

// Split based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

// Apollo Client
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
```

## React Hooks

```typescript
// src/hooks/useSubscription.ts
import { gql, useSubscription, useQuery, useMutation } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';

// GraphQL operations
const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded($room: String!) {
    messageAdded(room: $room) {
      id
      content
      author {
        id
        name
      }
      createdAt
    }
  }
`;

const MESSAGES_QUERY = gql`
  query GetMessages($room: String!) {
    messages(room: $room) {
      id
      content
      author {
        id
        name
      }
      createdAt
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($room: String!, $content: String!) {
    sendMessage(room: $room, content: $content) {
      id
      content
      author {
        id
        name
      }
      createdAt
    }
  }
`;

const USER_STATUS_SUBSCRIPTION = gql`
  subscription OnUserStatusChanged($userId: ID) {
    userStatusChanged(userId: $userId) {
      id
      name
      status
    }
  }
`;

const NOTIFICATION_SUBSCRIPTION = gql`
  subscription OnNotification($userId: ID!) {
    notification(userId: $userId) {
      id
      type
      title
      message
      data
      createdAt
    }
  }
`;

// Message types
interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  status: 'ONLINE' | 'AWAY' | 'OFFLINE';
}

interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  data?: string;
  createdAt: string;
}

// Chat room hook
export function useChatRoom(room: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  // Initial messages query
  const { data, loading } = useQuery(MESSAGES_QUERY, {
    variables: { room },
    onCompleted: (data) => {
      setMessages(data.messages);
    },
  });

  // Subscription for new messages
  useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { room },
    onData: ({ data }) => {
      if (data.data?.messageAdded) {
        setMessages((prev) => [...prev, data.data.messageAdded]);
      }
    },
  });

  // Send message mutation
  const [sendMessageMutation] = useMutation(SEND_MESSAGE_MUTATION);

  const sendMessage = useCallback(
    async (content: string) => {
      await sendMessageMutation({
        variables: { room, content },
        optimisticResponse: {
          sendMessage: {
            __typename: 'Message',
            id: `temp-${Date.now()}`,
            content,
            author: {
              __typename: 'User',
              id: 'current-user',
              name: 'You',
            },
            createdAt: new Date().toISOString(),
          },
        },
      });
    },
    [room, sendMessageMutation]
  );

  return {
    messages,
    loading,
    sendMessage,
  };
}

// User presence hook
export function useUserPresence(userIds?: string[]) {
  const [users, setUsers] = useState<Map<string, User>>(new Map());

  useSubscription(USER_STATUS_SUBSCRIPTION, {
    variables: { userId: null }, // Subscribe to all users
    onData: ({ data }) => {
      if (data.data?.userStatusChanged) {
        const user = data.data.userStatusChanged;
        setUsers((prev) => new Map(prev).set(user.id, user));
      }
    },
  });

  return {
    users: Array.from(users.values()),
    getUser: (id: string) => users.get(id),
  };
}

// Notifications hook
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useSubscription(NOTIFICATION_SUBSCRIPTION, {
    variables: { userId },
    onData: ({ data }) => {
      if (data.data?.notification) {
        setNotifications((prev) => [data.data.notification, ...prev]);
      }
    },
  });

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    clearNotification,
    unreadCount: notifications.length,
  };
}

// React component example
function ChatRoom({ roomId }: { roomId: string }) {
  const { messages, loading, sendMessage } = useChatRoom(roomId);
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await sendMessage(input);
      setInput('');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.author.name}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Python Implementation

```python
# src/graphql/subscriptions.py
from typing import AsyncGenerator, Any
from strawberry import Schema, type, field, mutation, subscription
from strawberry.types import Info
from strawberry.scalars import JSON
import strawberry
from datetime import datetime
import asyncio
from dataclasses import dataclass
from enum import Enum

# PubSub implementation
class PubSub:
    def __init__(self):
        self._subscribers: dict[str, list[asyncio.Queue]] = {}

    async def publish(self, channel: str, message: Any) -> None:
        if channel in self._subscribers:
            for queue in self._subscribers[channel]:
                await queue.put(message)

    async def subscribe(self, channel: str) -> AsyncGenerator[Any, None]:
        queue: asyncio.Queue = asyncio.Queue()

        if channel not in self._subscribers:
            self._subscribers[channel] = []
        self._subscribers[channel].append(queue)

        try:
            while True:
                message = await queue.get()
                yield message
        finally:
            self._subscribers[channel].remove(queue)


pubsub = PubSub()


@strawberry.enum
class UserStatus(Enum):
    ONLINE = "ONLINE"
    AWAY = "AWAY"
    OFFLINE = "OFFLINE"


@strawberry.enum
class NotificationType(Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    SUCCESS = "SUCCESS"


@strawberry.type
class User:
    id: str
    name: str
    status: UserStatus


@strawberry.type
class Message:
    id: str
    content: str
    author: User
    room: str
    created_at: datetime


@strawberry.type
class Notification:
    id: str
    type: NotificationType
    title: str
    message: str
    data: str | None
    created_at: datetime


@strawberry.type
class Query:
    @strawberry.field
    def messages(self, room: str) -> list[Message]:
        # Fetch from database
        return []

    @strawberry.field
    def user(self, id: str) -> User | None:
        # Fetch from database
        return None


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def send_message(
        self,
        room: str,
        content: str,
        info: Info,
    ) -> Message:
        import uuid

        # Get user from context
        user = info.context.get("user", User(id="1", name="Anonymous", status=UserStatus.ONLINE))

        message = Message(
            id=str(uuid.uuid4()),
            content=content,
            author=user,
            room=room,
            created_at=datetime.utcnow(),
        )

        # Publish to subscribers
        await pubsub.publish(f"messages:{room}", message)

        return message

    @strawberry.mutation
    async def update_user_status(
        self,
        status: UserStatus,
        info: Info,
    ) -> User:
        user = info.context.get("user")
        user.status = status

        await pubsub.publish("user_status", user)

        return user


@strawberry.type
class Subscription:
    @strawberry.subscription
    async def message_added(
        self,
        room: str,
    ) -> AsyncGenerator[Message, None]:
        async for message in pubsub.subscribe(f"messages:{room}"):
            yield message

    @strawberry.subscription
    async def user_status_changed(
        self,
        user_id: str | None = None,
    ) -> AsyncGenerator[User, None]:
        async for user in pubsub.subscribe("user_status"):
            if user_id is None or user.id == user_id:
                yield user

    @strawberry.subscription
    async def notification(
        self,
        user_id: str,
        info: Info,
    ) -> AsyncGenerator[Notification, None]:
        async for notification in pubsub.subscribe(f"notifications:{user_id}"):
            yield notification


# Create schema
schema = Schema(
    query=Query,
    mutation=Mutation,
    subscription=Subscription,
)

# FastAPI integration
from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter

app = FastAPI()

graphql_app = GraphQLRouter(
    schema,
    context_getter=lambda: {"user": User(id="1", name="User", status=UserStatus.ONLINE)},
)

app.include_router(graphql_app, prefix="/graphql")
```

## CLAUDE.md Integration

```markdown
# GraphQL Subscriptions

## Endpoints
- HTTP: `POST /graphql`
- WebSocket: `ws://localhost:4000/graphql`

## Subscriptions
```graphql
subscription {
  messageAdded(room: "general") {
    id
    content
    author { name }
  }
}
```

## Events
- `MESSAGE_ADDED` - New chat message
- `USER_STATUS_CHANGED` - User presence update
- `NOTIFICATION` - User notification

## Authentication
Pass `authToken` in connection params for WebSocket.

## Scaling
Use Redis PubSub for multi-server deployment.
```

## AI Suggestions

1. **Connection authentication** - Validate on connect, not per-message
2. **Subscription filtering** - Use withFilter for targeted delivery
3. **Batched updates** - Debounce rapid state changes
4. **Error handling** - Graceful subscription error recovery
5. **Type safety** - Use code generation for client types
6. **Memory management** - Clean up idle subscriptions
7. **Rate limiting** - Limit subscription frequency
8. **Deduplication** - Prevent duplicate events
9. **Reconnection** - Handle network interruptions
10. **Monitoring** - Track active subscriptions and throughput
