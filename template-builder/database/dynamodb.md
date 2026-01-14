# AWS DynamoDB Template

## Overview

Complete AWS DynamoDB setup with TypeScript, single-table design patterns, document client, transactions, streams, and best practices for serverless applications.

## Installation

```bash
# AWS SDK v3
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install @aws-sdk/util-dynamodb

# Optional utilities
npm install uuid nanoid
npm install -D @types/uuid
```

## Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# DynamoDB
DYNAMODB_TABLE_NAME=myapp-table
DYNAMODB_ENDPOINT=http://localhost:8000  # For local development

# Optional
DYNAMODB_GSI1_NAME=GSI1
DYNAMODB_GSI2_NAME=GSI2
```

## Project Structure

```
src/
├── db/
│   ├── dynamodb/
│   │   ├── client.ts
│   │   ├── config.ts
│   │   ├── types.ts
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   ├── Post.ts
│   │   │   └── Comment.ts
│   │   ├── repositories/
│   │   │   ├── BaseRepository.ts
│   │   │   ├── UserRepository.ts
│   │   │   └── PostRepository.ts
│   │   └── utils/
│   │       ├── keys.ts
│   │       └── expressions.ts
```

## DynamoDB Client Configuration

```typescript
// src/db/dynamodb/client.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  TransactGetCommand,
} from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.NODE_ENV === 'development' || process.env.DYNAMODB_ENDPOINT;

// Base DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocal && {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

// Document client with marshalling options
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table name
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'myapp-table';

// Index names
export const GSI1_NAME = process.env.DYNAMODB_GSI1_NAME || 'GSI1';
export const GSI2_NAME = process.env.DYNAMODB_GSI2_NAME || 'GSI2';

// Export commands for direct use
export {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
  TransactGetCommand,
};

export { dynamoClient };
```

## Single Table Design Types

```typescript
// src/db/dynamodb/types.ts
export interface BaseEntity {
  PK: string;           // Partition key
  SK: string;           // Sort key
  GSI1PK?: string;      // Global Secondary Index 1 partition key
  GSI1SK?: string;      // Global Secondary Index 1 sort key
  GSI2PK?: string;      // Global Secondary Index 2 partition key
  GSI2SK?: string;      // Global Secondary Index 2 sort key
  entityType: string;   // Entity type discriminator
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
  ttl?: number;         // Time to live (Unix timestamp)
}

// User entity
export interface UserEntity extends BaseEntity {
  entityType: 'USER';
  userId: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  loginCount: number;
  metadata: Record<string, any>;
}

// Profile entity (part of User aggregate)
export interface ProfileEntity extends BaseEntity {
  entityType: 'PROFILE';
  userId: string;
  bio?: string;
  avatar?: string;
  website?: string;
  location?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  socialLinks: Record<string, string>;
  preferences: Record<string, any>;
}

// Post entity
export interface PostEntity extends BaseEntity {
  entityType: 'POST';
  postId: string;
  authorId: string;
  categoryId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  viewCount: number;
  likeCount: number;
  tags: string[];
  metadata: Record<string, any>;
}

// Comment entity
export interface CommentEntity extends BaseEntity {
  entityType: 'COMMENT';
  commentId: string;
  postId: string;
  authorId: string;
  parentId?: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  likeCount: number;
}

// Category entity
export interface CategoryEntity extends BaseEntity {
  entityType: 'CATEGORY';
  categoryId: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
}

// Tag entity
export interface TagEntity extends BaseEntity {
  entityType: 'TAG';
  tagId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  postCount: number;
}

// Post-Tag relationship
export interface PostTagEntity extends BaseEntity {
  entityType: 'POST_TAG';
  postId: string;
  tagId: string;
}

// Session entity (for auth)
export interface SessionEntity extends BaseEntity {
  entityType: 'SESSION';
  sessionId: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
}

// Union type for all entities
export type Entity =
  | UserEntity
  | ProfileEntity
  | PostEntity
  | CommentEntity
  | CategoryEntity
  | TagEntity
  | PostTagEntity
  | SessionEntity;
```

## Key Generation Utilities

```typescript
// src/db/dynamodb/utils/keys.ts
import { nanoid } from 'nanoid';

// Key prefixes
export const PREFIXES = {
  USER: 'USER#',
  PROFILE: 'PROFILE#',
  POST: 'POST#',
  COMMENT: 'COMMENT#',
  CATEGORY: 'CATEGORY#',
  TAG: 'TAG#',
  SESSION: 'SESSION#',
  EMAIL: 'EMAIL#',
  SLUG: 'SLUG#',
} as const;

// Generate unique IDs
export const generateId = () => nanoid(21);
export const generateShortId = () => nanoid(12);

// User keys
export const userKeys = {
  pk: (userId: string) => `${PREFIXES.USER}${userId}`,
  sk: () => 'METADATA',
  gsi1pk: (email: string) => `${PREFIXES.EMAIL}${email.toLowerCase()}`,
  gsi1sk: () => 'USER',
};

// Profile keys (stored with user)
export const profileKeys = {
  pk: (userId: string) => `${PREFIXES.USER}${userId}`,
  sk: () => 'PROFILE',
};

// Post keys
export const postKeys = {
  pk: (postId: string) => `${PREFIXES.POST}${postId}`,
  sk: () => 'METADATA',
  // By author
  gsi1pk: (authorId: string) => `${PREFIXES.USER}${authorId}`,
  gsi1sk: (createdAt: string) => `POST#${createdAt}`,
  // By slug (for lookup)
  gsi2pk: (slug: string) => `${PREFIXES.SLUG}${slug}`,
  gsi2sk: () => 'POST',
  // By category
  categoryPk: (categoryId: string) => `${PREFIXES.CATEGORY}${categoryId}`,
  categorySk: (publishedAt: string) => `POST#${publishedAt}`,
};

// Comment keys
export const commentKeys = {
  pk: (postId: string) => `${PREFIXES.POST}${postId}`,
  sk: (commentId: string) => `COMMENT#${commentId}`,
  // By author
  gsi1pk: (authorId: string) => `${PREFIXES.USER}${authorId}`,
  gsi1sk: (createdAt: string) => `COMMENT#${createdAt}`,
  // Replies
  replySk: (parentId: string, commentId: string) => `COMMENT#${parentId}#REPLY#${commentId}`,
};

// Category keys
export const categoryKeys = {
  pk: () => 'CATEGORIES',
  sk: (categoryId: string) => `${PREFIXES.CATEGORY}${categoryId}`,
  // By slug
  gsi1pk: (slug: string) => `${PREFIXES.SLUG}${slug}`,
  gsi1sk: () => 'CATEGORY',
  // Hierarchical (children of parent)
  gsi2pk: (parentId: string | null) => parentId ? `PARENT#${parentId}` : 'ROOT',
  gsi2sk: (sortOrder: number, categoryId: string) => `ORDER#${String(sortOrder).padStart(5, '0')}#${categoryId}`,
};

// Tag keys
export const tagKeys = {
  pk: () => 'TAGS',
  sk: (tagId: string) => `${PREFIXES.TAG}${tagId}`,
  gsi1pk: (slug: string) => `${PREFIXES.SLUG}${slug}`,
  gsi1sk: () => 'TAG',
};

// Post-Tag relationship keys
export const postTagKeys = {
  pk: (postId: string) => `${PREFIXES.POST}${postId}`,
  sk: (tagId: string) => `TAG#${tagId}`,
  // Reverse lookup (posts by tag)
  gsi1pk: (tagId: string) => `${PREFIXES.TAG}${tagId}`,
  gsi1sk: (postId: string) => `POST#${postId}`,
};

// Session keys
export const sessionKeys = {
  pk: (sessionId: string) => `${PREFIXES.SESSION}${sessionId}`,
  sk: () => 'METADATA',
  // By user (list all user sessions)
  gsi1pk: (userId: string) => `${PREFIXES.USER}${userId}`,
  gsi1sk: (sessionId: string) => `SESSION#${sessionId}`,
};

// Parse ID from key
export function parseIdFromKey(key: string, prefix: string): string {
  return key.replace(prefix, '');
}
```

## Expression Builders

```typescript
// src/db/dynamodb/utils/expressions.ts
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

type AttributeValue = string | number | boolean | null | string[] | Record<string, any>;

interface UpdateExpressionParts {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, AttributeValue>;
}

// Build update expression from object
export function buildUpdateExpression(
  updates: Record<string, AttributeValue>,
  options: { skipKeys?: string[] } = {}
): UpdateExpressionParts {
  const { skipKeys = ['PK', 'SK', 'entityType', 'createdAt'] } = options;

  const setExpressions: string[] = [];
  const removeExpressions: string[] = [];
  const attributeNames: Record<string, string> = {};
  const attributeValues: Record<string, AttributeValue> = {};

  let index = 0;

  for (const [key, value] of Object.entries(updates)) {
    if (skipKeys.includes(key)) continue;

    const nameKey = `#attr${index}`;
    const valueKey = `:val${index}`;

    attributeNames[nameKey] = key;

    if (value === null || value === undefined) {
      removeExpressions.push(nameKey);
    } else {
      setExpressions.push(`${nameKey} = ${valueKey}`);
      attributeValues[valueKey] = value;
    }

    index++;
  }

  // Always update updatedAt
  if (!skipKeys.includes('updatedAt')) {
    const nameKey = `#attr${index}`;
    const valueKey = `:val${index}`;
    attributeNames[nameKey] = 'updatedAt';
    attributeValues[valueKey] = new Date().toISOString();
    setExpressions.push(`${nameKey} = ${valueKey}`);
  }

  let expression = '';
  if (setExpressions.length > 0) {
    expression += `SET ${setExpressions.join(', ')}`;
  }
  if (removeExpressions.length > 0) {
    expression += ` REMOVE ${removeExpressions.join(', ')}`;
  }

  return {
    UpdateExpression: expression.trim(),
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
  };
}

// Build condition expression
export function buildConditionExpression(
  conditions: Record<string, { operator: string; value?: any }>
): {
  ConditionExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, any>;
} {
  const parts: string[] = [];
  const attributeNames: Record<string, string> = {};
  const attributeValues: Record<string, any> = {};

  let index = 0;

  for (const [key, condition] of Object.entries(conditions)) {
    const nameKey = `#cond${index}`;
    attributeNames[nameKey] = key;

    switch (condition.operator) {
      case 'exists':
        parts.push(`attribute_exists(${nameKey})`);
        break;
      case 'not_exists':
        parts.push(`attribute_not_exists(${nameKey})`);
        break;
      case '=':
      case '<>':
      case '<':
      case '<=':
      case '>':
      case '>=':
        const valueKey = `:cond${index}`;
        attributeValues[valueKey] = condition.value;
        parts.push(`${nameKey} ${condition.operator} ${valueKey}`);
        break;
      case 'begins_with':
        const beginValueKey = `:cond${index}`;
        attributeValues[beginValueKey] = condition.value;
        parts.push(`begins_with(${nameKey}, ${beginValueKey})`);
        break;
      case 'contains':
        const containsValueKey = `:cond${index}`;
        attributeValues[containsValueKey] = condition.value;
        parts.push(`contains(${nameKey}, ${containsValueKey})`);
        break;
      case 'between':
        const [low, high] = condition.value as [any, any];
        const lowKey = `:cond${index}low`;
        const highKey = `:cond${index}high`;
        attributeValues[lowKey] = low;
        attributeValues[highKey] = high;
        parts.push(`${nameKey} BETWEEN ${lowKey} AND ${highKey}`);
        break;
    }

    index++;
  }

  return {
    ConditionExpression: parts.join(' AND '),
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
  };
}

// Build filter expression for query/scan
export function buildFilterExpression(
  filters: Record<string, any>
): {
  FilterExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, any>;
} {
  const parts: string[] = [];
  const attributeNames: Record<string, string> = {};
  const attributeValues: Record<string, any> = {};

  let index = 0;

  for (const [key, value] of Object.entries(filters)) {
    const nameKey = `#filter${index}`;
    const valueKey = `:filter${index}`;

    attributeNames[nameKey] = key;
    attributeValues[valueKey] = value;
    parts.push(`${nameKey} = ${valueKey}`);

    index++;
  }

  return {
    FilterExpression: parts.join(' AND '),
    ExpressionAttributeNames: attributeNames,
    ExpressionAttributeValues: attributeValues,
  };
}

// Merge expression parts
export function mergeExpressions(
  ...expressions: Array<{
    ExpressionAttributeNames?: Record<string, string>;
    ExpressionAttributeValues?: Record<string, any>;
  }>
): {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, any>;
} {
  return expressions.reduce(
    (acc, exp) => ({
      ExpressionAttributeNames: {
        ...acc.ExpressionAttributeNames,
        ...exp.ExpressionAttributeNames,
      },
      ExpressionAttributeValues: {
        ...acc.ExpressionAttributeValues,
        ...exp.ExpressionAttributeValues,
      },
    }),
    { ExpressionAttributeNames: {}, ExpressionAttributeValues: {} }
  );
}
```

## Base Repository

```typescript
// src/db/dynamodb/repositories/BaseRepository.ts
import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
  GSI2_NAME,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchGetCommand,
  BatchWriteCommand,
  TransactWriteCommand,
} from '../client';
import { BaseEntity } from '../types';
import { buildUpdateExpression } from '../utils/expressions';

export interface QueryOptions {
  limit?: number;
  startKey?: Record<string, any>;
  scanForward?: boolean;
  consistentRead?: boolean;
}

export interface QueryResult<T> {
  items: T[];
  lastKey?: Record<string, any>;
  count: number;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected tableName: string = TABLE_NAME;

  // Get single item
  async get(pk: string, sk: string): Promise<T | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
      })
    );
    return (result.Item as T) || null;
  }

  // Put item (create or replace)
  async put(item: T): Promise<T> {
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
    return item;
  }

  // Put with condition (create only if not exists)
  async create(item: T): Promise<T> {
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );
    return item;
  }

  // Update item
  async update(
    pk: string,
    sk: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      buildUpdateExpression(updates as Record<string, any>);

    try {
      const result = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
          ConditionExpression: 'attribute_exists(PK)',
          ReturnValues: 'ALL_NEW',
        })
      );
      return result.Attributes as T;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return null;
      }
      throw error;
    }
  }

  // Delete item
  async delete(pk: string, sk: string): Promise<boolean> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { PK: pk, SK: sk },
          ConditionExpression: 'attribute_exists(PK)',
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        return false;
      }
      throw error;
    }
  }

  // Query by partition key
  async queryByPK(
    pk: string,
    options: QueryOptions & { skPrefix?: string; skBetween?: [string, string] } = {}
  ): Promise<QueryResult<T>> {
    const { limit, startKey, scanForward = true, consistentRead, skPrefix, skBetween } = options;

    let keyCondition = 'PK = :pk';
    const expressionValues: Record<string, any> = { ':pk': pk };

    if (skPrefix) {
      keyCondition += ' AND begins_with(SK, :skPrefix)';
      expressionValues[':skPrefix'] = skPrefix;
    } else if (skBetween) {
      keyCondition += ' AND SK BETWEEN :skStart AND :skEnd';
      expressionValues[':skStart'] = skBetween[0];
      expressionValues[':skEnd'] = skBetween[1];
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
        Limit: limit,
        ExclusiveStartKey: startKey,
        ScanIndexForward: scanForward,
        ConsistentRead: consistentRead,
      })
    );

    return {
      items: (result.Items as T[]) || [],
      lastKey: result.LastEvaluatedKey,
      count: result.Count || 0,
    };
  }

  // Query GSI1
  async queryGSI1(
    gsi1pk: string,
    options: QueryOptions & { skPrefix?: string } = {}
  ): Promise<QueryResult<T>> {
    const { limit, startKey, scanForward = true, skPrefix } = options;

    let keyCondition = 'GSI1PK = :gsi1pk';
    const expressionValues: Record<string, any> = { ':gsi1pk': gsi1pk };

    if (skPrefix) {
      keyCondition += ' AND begins_with(GSI1SK, :skPrefix)';
      expressionValues[':skPrefix'] = skPrefix;
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: GSI1_NAME,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
        Limit: limit,
        ExclusiveStartKey: startKey,
        ScanIndexForward: scanForward,
      })
    );

    return {
      items: (result.Items as T[]) || [],
      lastKey: result.LastEvaluatedKey,
      count: result.Count || 0,
    };
  }

  // Query GSI2
  async queryGSI2(
    gsi2pk: string,
    options: QueryOptions & { skPrefix?: string } = {}
  ): Promise<QueryResult<T>> {
    const { limit, startKey, scanForward = true, skPrefix } = options;

    let keyCondition = 'GSI2PK = :gsi2pk';
    const expressionValues: Record<string, any> = { ':gsi2pk': gsi2pk };

    if (skPrefix) {
      keyCondition += ' AND begins_with(GSI2SK, :skPrefix)';
      expressionValues[':skPrefix'] = skPrefix;
    }

    const result = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: GSI2_NAME,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
        Limit: limit,
        ExclusiveStartKey: startKey,
        ScanIndexForward: scanForward,
      })
    );

    return {
      items: (result.Items as T[]) || [],
      lastKey: result.LastEvaluatedKey,
      count: result.Count || 0,
    };
  }

  // Batch get items
  async batchGet(keys: Array<{ PK: string; SK: string }>): Promise<T[]> {
    if (keys.length === 0) return [];

    // DynamoDB limits batch get to 100 items
    const chunks = this.chunkArray(keys, 100);
    const results: T[] = [];

    for (const chunk of chunks) {
      const result = await docClient.send(
        new BatchGetCommand({
          RequestItems: {
            [this.tableName]: {
              Keys: chunk,
            },
          },
        })
      );

      if (result.Responses?.[this.tableName]) {
        results.push(...(result.Responses[this.tableName] as T[]));
      }
    }

    return results;
  }

  // Batch write items
  async batchWrite(
    items: Array<{ put?: T; delete?: { PK: string; SK: string } }>
  ): Promise<void> {
    if (items.length === 0) return;

    // DynamoDB limits batch write to 25 items
    const chunks = this.chunkArray(items, 25);

    for (const chunk of chunks) {
      const requests = chunk.map((item) => {
        if (item.put) {
          return { PutRequest: { Item: item.put } };
        }
        if (item.delete) {
          return { DeleteRequest: { Key: item.delete } };
        }
        throw new Error('Invalid batch write item');
      });

      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.tableName]: requests,
          },
        })
      );
    }
  }

  // Transaction write
  async transactWrite(
    operations: Array<{
      put?: { item: T; condition?: string };
      update?: {
        key: { PK: string; SK: string };
        updates: Partial<T>;
        condition?: string;
      };
      delete?: { key: { PK: string; SK: string }; condition?: string };
      check?: { key: { PK: string; SK: string }; condition: string };
    }>
  ): Promise<void> {
    const transactItems = operations.map((op) => {
      if (op.put) {
        return {
          Put: {
            TableName: this.tableName,
            Item: op.put.item,
            ...(op.put.condition && { ConditionExpression: op.put.condition }),
          },
        };
      }
      if (op.update) {
        const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
          buildUpdateExpression(op.update.updates as Record<string, any>);
        return {
          Update: {
            TableName: this.tableName,
            Key: op.update.key,
            UpdateExpression,
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            ...(op.update.condition && { ConditionExpression: op.update.condition }),
          },
        };
      }
      if (op.delete) {
        return {
          Delete: {
            TableName: this.tableName,
            Key: op.delete.key,
            ...(op.delete.condition && { ConditionExpression: op.delete.condition }),
          },
        };
      }
      if (op.check) {
        return {
          ConditionCheck: {
            TableName: this.tableName,
            Key: op.check.key,
            ConditionExpression: op.check.condition,
          },
        };
      }
      throw new Error('Invalid transaction operation');
    });

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      })
    );
  }

  // Scan table (use sparingly)
  async scan(
    options: QueryOptions & { filter?: Record<string, any> } = {}
  ): Promise<QueryResult<T>> {
    const { limit, startKey, filter } = options;

    const params: any = {
      TableName: this.tableName,
      Limit: limit,
      ExclusiveStartKey: startKey,
    };

    if (filter) {
      const filterParts: string[] = [];
      const expressionNames: Record<string, string> = {};
      const expressionValues: Record<string, any> = {};

      Object.entries(filter).forEach(([key, value], index) => {
        const nameKey = `#f${index}`;
        const valueKey = `:f${index}`;
        expressionNames[nameKey] = key;
        expressionValues[valueKey] = value;
        filterParts.push(`${nameKey} = ${valueKey}`);
      });

      params.FilterExpression = filterParts.join(' AND ');
      params.ExpressionAttributeNames = expressionNames;
      params.ExpressionAttributeValues = expressionValues;
    }

    const result = await docClient.send(new ScanCommand(params));

    return {
      items: (result.Items as T[]) || [],
      lastKey: result.LastEvaluatedKey,
      count: result.Count || 0,
    };
  }

  // Increment counter
  async increment(
    pk: string,
    sk: string,
    field: keyof T,
    amount: number = 1
  ): Promise<number> {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: 'SET #field = if_not_exists(#field, :zero) + :amount, #updatedAt = :now',
        ExpressionAttributeNames: {
          '#field': field as string,
          '#updatedAt': 'updatedAt',
        },
        ExpressionAttributeValues: {
          ':amount': amount,
          ':zero': 0,
          ':now': new Date().toISOString(),
        },
        ReturnValues: 'UPDATED_NEW',
      })
    );

    return result.Attributes?.[field as string] || 0;
  }

  // Helper to chunk arrays
  protected chunkArray<U>(array: U[], size: number): U[][] {
    const chunks: U[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

## User Repository

```typescript
// src/db/dynamodb/repositories/UserRepository.ts
import bcrypt from 'bcrypt';
import { BaseRepository, QueryResult, QueryOptions } from './BaseRepository';
import { UserEntity, ProfileEntity } from '../types';
import { userKeys, profileKeys, generateId, PREFIXES, parseIdFromKey } from '../utils/keys';

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserEntity['role'];
}

export interface UserWithProfile extends Omit<UserEntity, 'passwordHash'> {
  profile?: Omit<ProfileEntity, 'PK' | 'SK' | 'entityType'>;
}

export class UserRepository extends BaseRepository<UserEntity> {
  // Create user with profile
  async createUser(input: CreateUserInput): Promise<UserEntity> {
    const userId = generateId();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(input.password, 12);

    const user: UserEntity = {
      PK: userKeys.pk(userId),
      SK: userKeys.sk(),
      GSI1PK: userKeys.gsi1pk(input.email),
      GSI1SK: userKeys.gsi1sk(),
      entityType: 'USER',
      userId,
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role || 'user',
      status: 'pending',
      emailVerified: false,
      loginCount: 0,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    const profile: ProfileEntity = {
      PK: profileKeys.pk(userId),
      SK: profileKeys.sk(),
      entityType: 'PROFILE',
      userId,
      socialLinks: {},
      preferences: {},
      createdAt: now,
      updatedAt: now,
    };

    // Use transaction to create both atomically
    await this.transactWrite([
      {
        put: {
          item: user,
          condition: 'attribute_not_exists(PK)',
        },
      },
      {
        put: {
          item: profile as any,
          condition: 'attribute_not_exists(PK) AND attribute_not_exists(SK)',
        },
      },
    ]);

    return user;
  }

  // Find user by ID
  async findById(userId: string): Promise<UserEntity | null> {
    return this.get(userKeys.pk(userId), userKeys.sk());
  }

  // Find user by email
  async findByEmail(email: string): Promise<UserEntity | null> {
    const result = await this.queryGSI1(userKeys.gsi1pk(email), { limit: 1 });
    return result.items[0] || null;
  }

  // Find user with profile
  async findWithProfile(userId: string): Promise<UserWithProfile | null> {
    const result = await this.queryByPK(userKeys.pk(userId));

    if (result.items.length === 0) return null;

    const user = result.items.find((item) => item.entityType === 'USER') as UserEntity;
    const profile = result.items.find((item) => item.entityType === 'PROFILE') as ProfileEntity;

    if (!user) return null;

    const { passwordHash, PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...safeUser } = user;

    return {
      ...safeUser,
      profile: profile
        ? {
            bio: profile.bio,
            avatar: profile.avatar,
            website: profile.website,
            location: profile.location,
            dateOfBirth: profile.dateOfBirth,
            phoneNumber: profile.phoneNumber,
            socialLinks: profile.socialLinks,
            preferences: profile.preferences,
            userId: profile.userId,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          }
        : undefined,
    };
  }

  // Verify password
  async verifyPassword(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }

  // Update user
  async updateUser(
    userId: string,
    updates: Partial<Omit<UserEntity, 'PK' | 'SK' | 'entityType' | 'userId' | 'email'>>
  ): Promise<UserEntity | null> {
    return this.update(userKeys.pk(userId), userKeys.sk(), updates);
  }

  // Update profile
  async updateProfile(
    userId: string,
    updates: Partial<Omit<ProfileEntity, 'PK' | 'SK' | 'entityType' | 'userId'>>
  ): Promise<ProfileEntity | null> {
    const result = await this.update(
      profileKeys.pk(userId),
      profileKeys.sk(),
      updates as any
    );
    return result as unknown as ProfileEntity;
  }

  // Verify email
  async verifyEmail(userId: string): Promise<UserEntity | null> {
    return this.updateUser(userId, {
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
      status: 'active',
    });
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await this.increment(userKeys.pk(userId), userKeys.sk(), 'loginCount', 1);
    await this.update(userKeys.pk(userId), userKeys.sk(), {
      lastLoginAt: new Date().toISOString(),
    } as any);
  }

  // Change password
  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const result = await this.update(userKeys.pk(userId), userKeys.sk(), {
      passwordHash,
    } as any);
    return result !== null;
  }

  // Delete user (soft delete by updating status)
  async softDelete(userId: string): Promise<boolean> {
    const result = await this.update(userKeys.pk(userId), userKeys.sk(), {
      status: 'inactive',
      deletedAt: new Date().toISOString(),
    } as any);
    return result !== null;
  }

  // Hard delete user and profile
  async hardDelete(userId: string): Promise<boolean> {
    await this.transactWrite([
      { delete: { key: { PK: userKeys.pk(userId), SK: userKeys.sk() } } },
      { delete: { key: { PK: profileKeys.pk(userId), SK: profileKeys.sk() } } },
    ]);
    return true;
  }

  // List all users (paginated scan - use carefully)
  async listUsers(options: QueryOptions & { status?: string }): Promise<QueryResult<UserWithProfile>> {
    const filter: Record<string, any> = { entityType: 'USER' };
    if (options.status) {
      filter.status = options.status;
    }

    const result = await this.scan({ ...options, filter });

    const users = await Promise.all(
      result.items.map((user) => this.findWithProfile(user.userId))
    );

    return {
      items: users.filter((u): u is UserWithProfile => u !== null),
      lastKey: result.lastKey,
      count: result.count,
    };
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// src/db/dynamodb/repositories/PostRepository.ts
import { BaseRepository, QueryResult, QueryOptions } from './BaseRepository';
import { PostEntity, PostTagEntity } from '../types';
import { postKeys, postTagKeys, generateId, PREFIXES } from '../utils/keys';

export interface CreatePostInput {
  authorId: string;
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tags?: string[];
  status?: PostEntity['status'];
  featuredImage?: string;
}

export class PostRepository extends BaseRepository<PostEntity> {
  // Generate slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  // Create post
  async createPost(input: CreatePostInput): Promise<PostEntity> {
    const postId = generateId();
    const now = new Date().toISOString();
    const slug = this.generateSlug(input.title);

    const post: PostEntity = {
      PK: postKeys.pk(postId),
      SK: postKeys.sk(),
      GSI1PK: postKeys.gsi1pk(input.authorId),
      GSI1SK: postKeys.gsi1sk(now),
      GSI2PK: postKeys.gsi2pk(slug),
      GSI2SK: postKeys.gsi2sk(),
      entityType: 'POST',
      postId,
      authorId: input.authorId,
      categoryId: input.categoryId,
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      featuredImage: input.featuredImage,
      status: input.status || 'draft',
      viewCount: 0,
      likeCount: 0,
      tags: input.tags || [],
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    // Create post and tag relationships in transaction
    const operations: any[] = [
      { put: { item: post, condition: 'attribute_not_exists(PK)' } },
    ];

    // Add tag relationships
    if (input.tags?.length) {
      for (const tagId of input.tags) {
        const postTag: PostTagEntity = {
          PK: postTagKeys.pk(postId),
          SK: postTagKeys.sk(tagId),
          GSI1PK: postTagKeys.gsi1pk(tagId),
          GSI1SK: postTagKeys.gsi1sk(postId),
          entityType: 'POST_TAG',
          postId,
          tagId,
          createdAt: now,
          updatedAt: now,
        };
        operations.push({ put: { item: postTag } });
      }
    }

    await this.transactWrite(operations);
    return post;
  }

  // Find post by ID
  async findById(postId: string): Promise<PostEntity | null> {
    return this.get(postKeys.pk(postId), postKeys.sk());
  }

  // Find post by slug
  async findBySlug(slug: string): Promise<PostEntity | null> {
    const result = await this.queryGSI2(postKeys.gsi2pk(slug), { limit: 1 });
    return result.items[0] || null;
  }

  // Get posts by author
  async findByAuthor(
    authorId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<PostEntity>> {
    return this.queryGSI1(postKeys.gsi1pk(authorId), {
      ...options,
      skPrefix: 'POST#',
      scanForward: false, // Most recent first
    });
  }

  // Get published posts
  async findPublished(options: QueryOptions = {}): Promise<QueryResult<PostEntity>> {
    // This requires a scan with filter - consider a GSI on status if frequently queried
    return this.scan({
      ...options,
      filter: { entityType: 'POST', status: 'published' },
    });
  }

  // Update post
  async updatePost(
    postId: string,
    updates: Partial<Omit<PostEntity, 'PK' | 'SK' | 'entityType' | 'postId' | 'authorId'>>
  ): Promise<PostEntity | null> {
    // If title changed, update slug and GSI2
    if (updates.title) {
      updates.slug = this.generateSlug(updates.title);
      (updates as any).GSI2PK = postKeys.gsi2pk(updates.slug);
    }

    return this.update(postKeys.pk(postId), postKeys.sk(), updates);
  }

  // Publish post
  async publish(postId: string): Promise<PostEntity | null> {
    return this.updatePost(postId, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    });
  }

  // Archive post
  async archive(postId: string): Promise<PostEntity | null> {
    return this.updatePost(postId, { status: 'archived' });
  }

  // Increment view count
  async incrementViews(postId: string): Promise<number> {
    return this.increment(postKeys.pk(postId), postKeys.sk(), 'viewCount');
  }

  // Increment like count
  async incrementLikes(postId: string): Promise<number> {
    return this.increment(postKeys.pk(postId), postKeys.sk(), 'likeCount');
  }

  // Get post tags
  async getPostTags(postId: string): Promise<string[]> {
    const result = await this.queryByPK(postKeys.pk(postId), { skPrefix: 'TAG#' });
    return result.items.map((item: any) => item.tagId);
  }

  // Get posts by tag
  async findByTag(
    tagId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult<PostEntity>> {
    const result = await this.queryGSI1(postTagKeys.gsi1pk(tagId), {
      ...options,
      skPrefix: 'POST#',
    });

    // Fetch full post data
    const postIds = result.items.map((item: any) => item.postId);
    const posts = await this.batchGet(
      postIds.map((id) => ({ PK: postKeys.pk(id), SK: postKeys.sk() }))
    );

    return {
      items: posts,
      lastKey: result.lastKey,
      count: posts.length,
    };
  }

  // Delete post
  async deletePost(postId: string): Promise<boolean> {
    // Get all items with this post PK (post + tags)
    const result = await this.queryByPK(postKeys.pk(postId));

    if (result.items.length === 0) return false;

    // Batch delete all items
    await this.batchWrite(
      result.items.map((item) => ({
        delete: { PK: item.PK, SK: item.SK },
      }))
    );

    return true;
  }
}

export const postRepository = new PostRepository();
```

## Next.js Server Actions

```typescript
// src/app/actions/dynamo-users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { userRepository, CreateUserInput } from '@/db/dynamodb/repositories/UserRepository';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function createUser(formData: FormData) {
  const input = CreateUserSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName') || undefined,
    lastName: formData.get('lastName') || undefined,
  });

  try {
    const user = await userRepository.createUser(input);
    revalidatePath('/admin/users');
    return { success: true, userId: user.userId };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return { success: false, error: 'Email already exists' };
    }
    throw error;
  }
}

export async function getUserById(userId: string) {
  return userRepository.findWithProfile(userId);
}

export async function getUserByEmail(email: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) return null;
  return userRepository.findWithProfile(user.userId);
}

export async function updateUser(
  userId: string,
  updates: { firstName?: string; lastName?: string; status?: string }
) {
  const user = await userRepository.updateUser(userId, updates as any);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const deleted = await userRepository.softDelete(userId);
  if (!deleted) {
    return { success: false, error: 'User not found' };
  }
  revalidatePath('/admin/users');
  return { success: true };
}
```

## React Hooks

```typescript
// src/hooks/useDynamoUser.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserById, updateUser } from '@/app/actions/dynamo-users';
import type { UserWithProfile } from '@/db/dynamodb/repositories/UserRepository';

export function useUser(userId: string | null) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setUser(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getUserById(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const update = useCallback(
    async (updates: Parameters<typeof updateUser>[1]) => {
      if (!userId) return { success: false, error: 'No user ID' };

      const result = await updateUser(userId, updates);
      if (result.success) {
        await fetchUser();
      }
      return result;
    },
    [userId, fetchUser]
  );

  return { user, loading, error, refetch: fetchUser, update };
}
```

## Local Development Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    ports:
      - '8000:8000'
    command: '-jar DynamoDBLocal.jar -sharedDb -dbPath /data'
    volumes:
      - dynamodb-data:/data

volumes:
  dynamodb-data:
```

```typescript
// scripts/create-table.ts
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

async function createTable() {
  const tableName = process.env.DYNAMODB_TABLE_NAME || 'myapp-table';

  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`Table ${tableName} already exists`);
    return;
  } catch (error: any) {
    if (error.name !== 'ResourceNotFoundException') throw error;
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' },
      ],
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'GSI1PK', AttributeType: 'S' },
        { AttributeName: 'GSI1SK', AttributeType: 'S' },
        { AttributeName: 'GSI2PK', AttributeType: 'S' },
        { AttributeName: 'GSI2SK', AttributeType: 'S' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            { AttributeName: 'GSI1PK', KeyType: 'HASH' },
            { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: 'GSI2',
          KeySchema: [
            { AttributeName: 'GSI2PK', KeyType: 'HASH' },
            { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
  );

  console.log(`Table ${tableName} created successfully`);
}

createTable().catch(console.error);
```

## Testing

```typescript
// src/db/dynamodb/__tests__/UserRepository.test.ts
import { userRepository } from '../repositories/UserRepository';

// Use DynamoDB Local for testing
beforeAll(async () => {
  process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
});

describe('UserRepository', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  let testUserId: string;

  describe('createUser', () => {
    it('should create a user with profile', async () => {
      const user = await userRepository.createUser({
        email: testEmail,
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(user.userId).toBeDefined();
      expect(user.email).toBe(testEmail.toLowerCase());
      expect(user.status).toBe('pending');

      testUserId = user.userId;
    });

    it('should fail on duplicate email', async () => {
      await expect(
        userRepository.createUser({
          email: testEmail,
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await userRepository.findByEmail(testEmail);
      expect(user?.userId).toBe(testUserId);
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findWithProfile', () => {
    it('should return user with profile', async () => {
      const user = await userRepository.findWithProfile(testUserId);

      expect(user?.userId).toBe(testUserId);
      expect(user?.profile).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const user = await userRepository.verifyPassword(testEmail, 'password123');
      expect(user).not.toBeNull();
    });

    it('should reject wrong password', async () => {
      const user = await userRepository.verifyPassword(testEmail, 'wrongpassword');
      expect(user).toBeNull();
    });
  });

  afterAll(async () => {
    if (testUserId) {
      await userRepository.hardDelete(testUserId);
    }
  });
});
```

## CLAUDE.md Integration

```markdown
## Database - AWS DynamoDB

### Setup
- Run `docker-compose up -d` for local DynamoDB
- Run `npx ts-node scripts/create-table.ts` to create table

### Patterns
- Single-table design with PK/SK pattern
- GSI1 for email lookups and author queries
- GSI2 for slug lookups
- Entity type stored in `entityType` field

### Key Files
- `src/db/dynamodb/client.ts` - DynamoDB client configuration
- `src/db/dynamodb/utils/keys.ts` - Key generation utilities
- `src/db/dynamodb/repositories/` - Entity-specific repositories

### Access Patterns
- User by ID: `PK=USER#<id>, SK=METADATA`
- User by email: `GSI1PK=EMAIL#<email>`
- Posts by author: `GSI1PK=USER#<authorId>, SK begins_with POST#`
- Post by slug: `GSI2PK=SLUG#<slug>`
```

## AI Suggestions

1. **Implement DynamoDB Streams** - Add CDC for syncing to Elasticsearch or analytics
2. **Add TTL for sessions** - Auto-expire session records using DynamoDB TTL
3. **Create backup automation** - Use AWS Backup or Point-in-Time Recovery
4. **Implement Global Tables** - Multi-region replication for disaster recovery
5. **Add PartiQL support** - SQL-like queries for complex access patterns
6. **Create cost analyzer** - Monitor RCU/WCU usage and optimize capacity
7. **Implement sparse indexes** - Reduce GSI costs by projecting only needed attributes
8. **Add DAX caching** - In-memory caching for microsecond latency
9. **Create migration tools** - Scripts for schema evolution and data backfills
10. **Implement export to S3** - Periodic exports for data lake integration
