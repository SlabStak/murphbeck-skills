# Real-Time Notifications Templates

Production-ready patterns for push notifications and real-time alerts.

## Overview

- **In-app**: WebSocket/SSE notifications
- **Push**: Web Push API, mobile notifications
- **Email/SMS**: Async notification delivery
- **Preferences**: User notification settings

## Quick Start

```bash
# WebSocket notifications
npm install socket.io ioredis

# Web Push
npm install web-push

# Firebase
npm install firebase-admin

# Python
pip install python-socketio pywebpush firebase-admin
```

## Notification Service

```typescript
// src/notifications/service.ts
import { Server } from 'socket.io';
import Redis from 'ioredis';
import webpush from 'web-push';
import { logger } from '../utils/logger';

// Types
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'mention'
  | 'message'
  | 'system';

interface NotificationChannel {
  inApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
}

interface UserPreferences {
  userId: string;
  channels: {
    [key in NotificationType]?: NotificationChannel;
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  };
  timezone: string;
}

// Web Push configuration
webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Notification service
export class NotificationService {
  private io: Server;
  private redis: Redis;
  private publisher: Redis;

  constructor(io: Server, redis: Redis) {
    this.io = io;
    this.redis = redis;
    this.publisher = redis.duplicate();

    this.setupSocketHandlers();
    this.setupRedisSubscriber();
  }

  private setupSocketHandlers(): void {
    const notifications = this.io.of('/notifications');

    notifications.on('connection', (socket) => {
      const userId = socket.data.userId;

      // Join user's notification room
      socket.join(`user:${userId}`);

      // Send unread count on connect
      this.getUnreadCount(userId).then((count) => {
        socket.emit('unread:count', { count });
      });

      // Mark as read
      socket.on('notification:read', async (notificationId: string) => {
        await this.markAsRead(userId, notificationId);
        socket.emit('notification:updated', { id: notificationId, read: true });
      });

      // Mark all as read
      socket.on('notifications:read-all', async () => {
        await this.markAllAsRead(userId);
        socket.emit('notifications:cleared');
      });

      // Get history
      socket.on('notifications:get', async (options: { limit?: number; offset?: number }) => {
        const notifications = await this.getNotifications(userId, options);
        socket.emit('notifications:list', notifications);
      });
    });
  }

  private setupRedisSubscriber(): void {
    const subscriber = this.redis.duplicate();
    subscriber.subscribe('notifications');

    subscriber.on('message', (_, message) => {
      const { userId, notification } = JSON.parse(message);
      this.io.of('/notifications').to(`user:${userId}`).emit('notification:new', notification);
    });
  }

  // Send notification
  async send(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<Notification> {
    const fullNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      userId,
      read: false,
      createdAt: new Date(),
    };

    // Get user preferences
    const preferences = await this.getUserPreferences(userId);
    const channels = preferences.channels[notification.type] || {
      inApp: true,
      push: false,
      email: false,
      sms: false,
    };

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      channels.push = false;
      channels.sms = false;
    }

    // Store notification
    await this.storeNotification(fullNotification);

    // In-app notification via WebSocket
    if (channels.inApp) {
      await this.publisher.publish(
        'notifications',
        JSON.stringify({ userId, notification: fullNotification })
      );
    }

    // Web Push notification
    if (channels.push) {
      await this.sendPushNotification(userId, fullNotification);
    }

    // Email notification
    if (channels.email) {
      await this.queueEmailNotification(userId, fullNotification);
    }

    // SMS notification
    if (channels.sms) {
      await this.queueSMSNotification(userId, fullNotification);
    }

    return fullNotification;
  }

  // Bulk send
  async sendToMany(
    userIds: string[],
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.send(userId, notification))
    );
  }

  // Broadcast to all
  async broadcast(
    notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<void> {
    this.io.of('/notifications').emit('notification:broadcast', {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    });
  }

  // Store notification
  private async storeNotification(notification: Notification): Promise<void> {
    const key = `notifications:${notification.userId}`;

    await this.redis
      .multi()
      .lpush(key, JSON.stringify(notification))
      .ltrim(key, 0, 99) // Keep last 100
      .incr(`notifications:unread:${notification.userId}`)
      .exec();
  }

  // Get notifications
  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Notification[]> {
    const { limit = 20, offset = 0 } = options;

    const data = await this.redis.lrange(
      `notifications:${userId}`,
      offset,
      offset + limit - 1
    );

    return data.map((item) => {
      const n = JSON.parse(item);
      n.createdAt = new Date(n.createdAt);
      return n;
    });
  }

  // Mark as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notifications = await this.getNotifications(userId, { limit: 100 });
    const index = notifications.findIndex((n) => n.id === notificationId);

    if (index !== -1 && !notifications[index].read) {
      notifications[index].read = true;

      await this.redis.lset(
        `notifications:${userId}`,
        index,
        JSON.stringify(notifications[index])
      );

      await this.redis.decr(`notifications:unread:${userId}`);
    }
  }

  // Mark all as read
  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId, { limit: 100 });
    const unread = notifications.filter((n) => !n.read);

    const pipeline = this.redis.multi();

    unread.forEach((n, originalIndex) => {
      n.read = true;
      pipeline.lset(`notifications:${userId}`, originalIndex, JSON.stringify(n));
    });

    pipeline.set(`notifications:unread:${userId}`, '0');
    await pipeline.exec();
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.redis.get(`notifications:unread:${userId}`);
    return parseInt(count || '0');
  }

  // Web Push
  async sendPushNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    const subscriptions = await this.getPushSubscriptions(userId);

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icon.png',
      badge: '/badge.png',
      data: {
        url: notification.actionUrl,
        notificationId: notification.id,
      },
    });

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, payload).catch((error) => {
          if (error.statusCode === 410) {
            // Subscription expired, remove it
            this.removePushSubscription(userId, sub.endpoint);
          }
        })
      )
    );
  }

  // Save push subscription
  async savePushSubscription(
    userId: string,
    subscription: webpush.PushSubscription
  ): Promise<void> {
    await this.redis.hset(
      `push:subscriptions:${userId}`,
      subscription.endpoint,
      JSON.stringify(subscription)
    );
  }

  // Get push subscriptions
  private async getPushSubscriptions(
    userId: string
  ): Promise<webpush.PushSubscription[]> {
    const data = await this.redis.hgetall(`push:subscriptions:${userId}`);
    return Object.values(data).map((s) => JSON.parse(s));
  }

  // Remove push subscription
  private async removePushSubscription(
    userId: string,
    endpoint: string
  ): Promise<void> {
    await this.redis.hdel(`push:subscriptions:${userId}`, endpoint);
  }

  // Email notification (queue for async processing)
  private async queueEmailNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    await this.redis.rpush(
      'notifications:email:queue',
      JSON.stringify({ userId, notification })
    );
  }

  // SMS notification (queue for async processing)
  private async queueSMSNotification(
    userId: string,
    notification: Notification
  ): Promise<void> {
    await this.redis.rpush(
      'notifications:sms:queue',
      JSON.stringify({ userId, notification })
    );
  }

  // User preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const data = await this.redis.get(`notifications:preferences:${userId}`);

    if (data) {
      return JSON.parse(data);
    }

    // Default preferences
    return {
      userId,
      channels: {
        info: { inApp: true, push: false, email: false, sms: false },
        success: { inApp: true, push: false, email: false, sms: false },
        warning: { inApp: true, push: true, email: false, sms: false },
        error: { inApp: true, push: true, email: true, sms: false },
        mention: { inApp: true, push: true, email: false, sms: false },
        message: { inApp: true, push: true, email: false, sms: false },
        system: { inApp: true, push: true, email: true, sms: false },
      },
      timezone: 'UTC',
    };
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };

    await this.redis.set(
      `notifications:preferences:${userId}`,
      JSON.stringify(updated)
    );
  }

  // Check quiet hours
  private isQuietHours(preferences: UserPreferences): boolean {
    if (!preferences.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Spans midnight
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }
}
```

## React Hook

```typescript
// src/hooks/useNotifications.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

export function useNotifications(token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/notifications', {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png',
        });
      }
    });

    socket.on('notification:broadcast', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    socket.on('notifications:list', (list: Notification[]) => {
      setNotifications(list);
    });

    socket.on('unread:count', ({ count }) => {
      setUnreadCount(count);
    });

    socket.on('notification:updated', ({ id, read }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read } : n))
      );
      if (read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });

    socket.on('notifications:cleared', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    // Load initial notifications
    socket.emit('notifications:get', { limit: 20 });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const markAsRead = useCallback((notificationId: string) => {
    socketRef.current?.emit('notification:read', notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    socketRef.current?.emit('notifications:read-all');
  }, []);

  const loadMore = useCallback(() => {
    socketRef.current?.emit('notifications:get', {
      limit: 20,
      offset: notifications.length,
    });
  }, [notifications.length]);

  return {
    notifications,
    unreadCount,
    connected,
    markAsRead,
    markAllAsRead,
    loadMore,
  };
}

// Service Worker registration for Web Push
export async function registerPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Push registration failed:', error);
    return null;
  }
}
```

## Service Worker

```typescript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body,
    icon: data.icon || '/icon.png',
    badge: data.badge || '/badge.png',
    data: data.data,
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if app is already open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

## Python Implementation

```python
# src/notifications/service.py
import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum
import json
import uuid
import redis.asyncio as redis
from pywebpush import webpush, WebPushException


class NotificationType(Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    MENTION = "mention"
    MESSAGE = "message"
    SYSTEM = "system"


@dataclass
class Notification:
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[dict] = None
    action_url: Optional[str] = None
    read: bool = False
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "userId": self.user_id,
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "actionUrl": self.action_url,
            "read": self.read,
            "createdAt": self.created_at.isoformat(),
        }


class NotificationService:
    def __init__(
        self,
        redis_client: redis.Redis,
        vapid_private_key: str,
        vapid_public_key: str,
        vapid_email: str,
    ):
        self.redis = redis_client
        self.publisher = redis_client
        self.vapid_private_key = vapid_private_key
        self.vapid_public_key = vapid_public_key
        self.vapid_email = vapid_email

    async def send(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        data: Optional[dict] = None,
        action_url: Optional[str] = None,
    ) -> Notification:
        notification = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            data=data,
            action_url=action_url,
        )

        # Store notification
        await self._store_notification(notification)

        # Publish for real-time delivery
        await self.publisher.publish(
            "notifications",
            json.dumps({
                "userId": user_id,
                "notification": notification.to_dict(),
            }),
        )

        # Send push notification
        await self._send_push(user_id, notification)

        return notification

    async def _store_notification(self, notification: Notification) -> None:
        key = f"notifications:{notification.user_id}"

        await self.redis.lpush(key, json.dumps(notification.to_dict()))
        await self.redis.ltrim(key, 0, 99)
        await self.redis.incr(f"notifications:unread:{notification.user_id}")

    async def get_notifications(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        key = f"notifications:{user_id}"
        data = await self.redis.lrange(key, offset, offset + limit - 1)
        return [json.loads(item) for item in data]

    async def mark_as_read(self, user_id: str, notification_id: str) -> None:
        notifications = await self.get_notifications(user_id, limit=100)

        for i, n in enumerate(notifications):
            if n["id"] == notification_id and not n["read"]:
                n["read"] = True
                await self.redis.lset(
                    f"notifications:{user_id}",
                    i,
                    json.dumps(n),
                )
                await self.redis.decr(f"notifications:unread:{user_id}")
                break

    async def get_unread_count(self, user_id: str) -> int:
        count = await self.redis.get(f"notifications:unread:{user_id}")
        return int(count) if count else 0

    async def _send_push(
        self,
        user_id: str,
        notification: Notification,
    ) -> None:
        subscriptions = await self._get_push_subscriptions(user_id)

        payload = json.dumps({
            "title": notification.title,
            "body": notification.message,
            "icon": "/icon.png",
            "data": {
                "url": notification.action_url,
                "notificationId": notification.id,
            },
        })

        for sub in subscriptions:
            try:
                webpush(
                    subscription_info=sub,
                    data=payload,
                    vapid_private_key=self.vapid_private_key,
                    vapid_claims={"sub": f"mailto:{self.vapid_email}"},
                )
            except WebPushException as e:
                if e.response.status_code == 410:
                    await self._remove_push_subscription(user_id, sub["endpoint"])

    async def save_push_subscription(
        self,
        user_id: str,
        subscription: dict,
    ) -> None:
        await self.redis.hset(
            f"push:subscriptions:{user_id}",
            subscription["endpoint"],
            json.dumps(subscription),
        )

    async def _get_push_subscriptions(self, user_id: str) -> list[dict]:
        data = await self.redis.hgetall(f"push:subscriptions:{user_id}")
        return [json.loads(v) for v in data.values()]

    async def _remove_push_subscription(
        self,
        user_id: str,
        endpoint: str,
    ) -> None:
        await self.redis.hdel(f"push:subscriptions:{user_id}", endpoint)
```

## CLAUDE.md Integration

```markdown
# Real-Time Notifications

## Channels
- In-app (WebSocket)
- Web Push
- Email
- SMS

## Events
- `notification:new` - New notification
- `notification:read` - Mark as read
- `notifications:read-all` - Mark all read
- `unread:count` - Update badge

## Types
- info, success, warning, error
- mention, message, system

## Configuration
- VAPID keys for Web Push
- Quiet hours settings
- Per-type channel preferences
```

## AI Suggestions

1. **Batching** - Aggregate similar notifications
2. **Rate limiting** - Prevent notification spam
3. **Priority levels** - Urgent vs normal delivery
4. **Digest emails** - Daily/weekly summaries
5. **Quiet hours** - Respect do-not-disturb
6. **Delivery tracking** - Track open/click rates
7. **Template system** - Consistent notification format
8. **Localization** - Multi-language support
9. **Fallback channels** - Try email if push fails
10. **Retention policy** - Auto-cleanup old notifications
