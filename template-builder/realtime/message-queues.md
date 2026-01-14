# Message Queue Templates

Production-ready message queue patterns supporting multiple backends with unified abstractions.

## Overview

- **Backends**: Redis, SQS, Bull, BullMQ, Bee-Queue
- **Features**: Delayed jobs, retries, priorities, rate limiting
- **Patterns**: Work queues, fan-out, request-reply
- **Monitoring**: Job tracking, metrics, admin UIs

## Quick Start

```bash
# BullMQ (recommended)
npm install bullmq ioredis

# Bull (legacy)
npm install bull

# AWS SQS
npm install @aws-sdk/client-sqs

# Bee-Queue (lightweight)
npm install bee-queue
```

## BullMQ Implementation

```typescript
// src/queues/bullmq.ts
import { Queue, Worker, Job, QueueEvents, FlowProducer } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';

interface QueueConfig {
  name: string;
  connection: IORedis;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: { type: 'exponential' | 'fixed'; delay: number };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

interface JobData {
  [key: string]: unknown;
}

// Connection
const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

// Queue Manager
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private events: Map<string, QueueEvents> = new Map();
  private connection: IORedis;

  constructor(redisConnection: IORedis) {
    this.connection = redisConnection;
  }

  createQueue(config: QueueConfig): Queue {
    const queue = new Queue(config.name, {
      connection: this.connection,
      defaultJobOptions: {
        attempts: config.defaultJobOptions?.attempts ?? 3,
        backoff: config.defaultJobOptions?.backoff ?? {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: config.defaultJobOptions?.removeOnComplete ?? 100,
        removeOnFail: config.defaultJobOptions?.removeOnFail ?? 1000,
      },
    });

    this.queues.set(config.name, queue);

    // Setup queue events
    const events = new QueueEvents(config.name, {
      connection: this.connection,
    });

    events.on('completed', ({ jobId, returnvalue }) => {
      logger.debug(`Job ${jobId} completed`, { returnvalue });
    });

    events.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed`, { failedReason });
    });

    this.events.set(config.name, events);

    return queue;
  }

  createWorker<T extends JobData, R>(
    queueName: string,
    processor: (job: Job<T>) => Promise<R>,
    options: {
      concurrency?: number;
      limiter?: { max: number; duration: number };
    } = {}
  ): Worker<T, R> {
    const worker = new Worker<T, R>(
      queueName,
      async (job) => {
        logger.info(`Processing job ${job.id}`, {
          name: job.name,
          data: job.data,
          attemptsMade: job.attemptsMade,
        });

        try {
          const result = await processor(job);
          return result;
        } catch (error) {
          logger.error(`Job ${job.id} error`, { error });
          throw error;
        }
      },
      {
        connection: this.connection,
        concurrency: options.concurrency ?? 5,
        limiter: options.limiter,
      }
    );

    worker.on('error', (error) => {
      logger.error('Worker error', { error, queueName });
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  async closeAll(): Promise<void> {
    await Promise.all([
      ...Array.from(this.workers.values()).map((w) => w.close()),
      ...Array.from(this.queues.values()).map((q) => q.close()),
      ...Array.from(this.events.values()).map((e) => e.close()),
    ]);
  }
}

// Typed Queue Wrapper
export class TypedQueue<TData extends JobData, TResult = void> {
  private queue: Queue<TData, TResult>;

  constructor(queue: Queue<TData, TResult>) {
    this.queue = queue;
  }

  async add(
    name: string,
    data: TData,
    options?: {
      delay?: number;
      priority?: number;
      jobId?: string;
      repeat?: { pattern: string } | { every: number };
    }
  ): Promise<Job<TData, TResult>> {
    return this.queue.add(name, data, options);
  }

  async addBulk(
    jobs: Array<{ name: string; data: TData; opts?: { delay?: number; priority?: number } }>
  ): Promise<Job<TData, TResult>[]> {
    return this.queue.addBulk(jobs);
  }

  async getJob(jobId: string): Promise<Job<TData, TResult> | undefined> {
    return this.queue.getJob(jobId);
  }

  async getJobs(
    types: Array<'completed' | 'failed' | 'delayed' | 'active' | 'wait'>,
    start = 0,
    end = 100
  ): Promise<Job<TData, TResult>[]> {
    return this.queue.getJobs(types, start, end);
  }

  async pause(): Promise<void> {
    await this.queue.pause();
  }

  async resume(): Promise<void> {
    await this.queue.resume();
  }

  async drain(): Promise<void> {
    await this.queue.drain();
  }

  async clean(
    grace: number,
    limit: number,
    type: 'completed' | 'failed' | 'delayed' | 'active' | 'wait'
  ): Promise<string[]> {
    return this.queue.clean(grace, limit, type);
  }
}

// Email Queue Example
interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

const queueManager = new QueueManager(connection);

export const emailQueue = new TypedQueue<EmailJobData>(
  queueManager.createQueue({
    name: 'emails',
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    },
  })
);

// Email worker
queueManager.createWorker<EmailJobData, void>(
  'emails',
  async (job) => {
    const { to, subject, template, data } = job.data;
    // await sendEmail({ to, subject, template, data });
    logger.info(`Email sent to ${to}`);
  },
  { concurrency: 10 }
);

// Usage
await emailQueue.add('welcome', {
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  data: { name: 'John' },
});
```

## Job Flows (Parent-Child)

```typescript
// src/queues/flows.ts
import { FlowProducer, Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis();

// Flow producer for job dependencies
const flowProducer = new FlowProducer({ connection });

// Define job types
interface OrderJobData {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

interface InventoryJobData {
  orderId: string;
  productId: string;
  quantity: number;
}

interface ShippingJobData {
  orderId: string;
  address: string;
}

interface NotificationJobData {
  orderId: string;
  userId: string;
  type: 'order_confirmed' | 'order_shipped';
}

// Create order processing flow
export async function createOrderFlow(
  orderId: string,
  items: Array<{ productId: string; quantity: number }>,
  address: string,
  userId: string
): Promise<void> {
  const inventoryJobs = items.map((item) => ({
    name: 'reserve-inventory',
    queueName: 'inventory',
    data: {
      orderId,
      productId: item.productId,
      quantity: item.quantity,
    } as InventoryJobData,
  }));

  await flowProducer.add({
    name: 'process-order',
    queueName: 'orders',
    data: { orderId, items } as OrderJobData,
    children: [
      ...inventoryJobs,
      {
        name: 'prepare-shipping',
        queueName: 'shipping',
        data: { orderId, address } as ShippingJobData,
        children: [
          {
            name: 'notify-customer',
            queueName: 'notifications',
            data: {
              orderId,
              userId,
              type: 'order_confirmed',
            } as NotificationJobData,
          },
        ],
      },
    ],
  });
}

// Workers
const orderWorker = new Worker<OrderJobData>(
  'orders',
  async (job) => {
    // Wait for all children to complete
    const childrenValues = await job.getChildrenValues();
    console.log('All children completed:', childrenValues);

    // Process order
    return { processed: true, orderId: job.data.orderId };
  },
  { connection }
);

const inventoryWorker = new Worker<InventoryJobData>(
  'inventory',
  async (job) => {
    const { productId, quantity } = job.data;
    // Reserve inventory
    return { reserved: true, productId, quantity };
  },
  { connection }
);

const shippingWorker = new Worker<ShippingJobData>(
  'shipping',
  async (job) => {
    // Prepare shipping label
    return { labelCreated: true, trackingNumber: 'TRK123' };
  },
  { connection }
);

const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job) => {
    // Send notification
    return { sent: true };
  },
  { connection }
);
```

## Scheduled and Repeatable Jobs

```typescript
// src/queues/scheduler.ts
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis();

interface ScheduledJobData {
  taskType: string;
  payload: Record<string, unknown>;
}

const schedulerQueue = new Queue<ScheduledJobData>('scheduler', {
  connection,
});

// Cron-based repeatable jobs
export async function setupScheduledJobs(): Promise<void> {
  // Daily report at midnight
  await schedulerQueue.add(
    'daily-report',
    { taskType: 'report', payload: { type: 'daily' } },
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
        tz: 'America/New_York',
      },
      jobId: 'daily-report', // Unique ID prevents duplicates
    }
  );

  // Hourly cleanup
  await schedulerQueue.add(
    'cleanup',
    { taskType: 'cleanup', payload: {} },
    {
      repeat: {
        every: 60 * 60 * 1000, // Every hour
      },
      jobId: 'hourly-cleanup',
    }
  );

  // Weekly digest on Mondays
  await schedulerQueue.add(
    'weekly-digest',
    { taskType: 'digest', payload: { type: 'weekly' } },
    {
      repeat: {
        pattern: '0 9 * * 1', // Monday at 9 AM
      },
      jobId: 'weekly-digest',
    }
  );
}

// Delayed jobs
export async function scheduleDelayedJob(
  name: string,
  data: ScheduledJobData,
  delayMs: number
): Promise<Job<ScheduledJobData>> {
  return schedulerQueue.add(name, data, {
    delay: delayMs,
  });
}

// Schedule for specific time
export async function scheduleAtTime(
  name: string,
  data: ScheduledJobData,
  scheduledTime: Date
): Promise<Job<ScheduledJobData>> {
  const delay = scheduledTime.getTime() - Date.now();

  if (delay <= 0) {
    throw new Error('Scheduled time must be in the future');
  }

  return schedulerQueue.add(name, data, { delay });
}

// Worker
const schedulerWorker = new Worker<ScheduledJobData>(
  'scheduler',
  async (job) => {
    const { taskType, payload } = job.data;

    switch (taskType) {
      case 'report':
        // Generate report
        break;
      case 'cleanup':
        // Run cleanup
        break;
      case 'digest':
        // Send digest
        break;
      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  },
  { connection }
);

// List repeatable jobs
export async function listRepeatableJobs(): Promise<void> {
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  console.log('Repeatable jobs:', repeatableJobs);
}

// Remove repeatable job
export async function removeRepeatableJob(
  name: string,
  repeatOpts: { pattern?: string; every?: number }
): Promise<boolean> {
  return schedulerQueue.removeRepeatableByKey(
    `${name}:::${repeatOpts.pattern || repeatOpts.every}`
  );
}
```

## AWS SQS Implementation

```typescript
// src/queues/sqs.ts
import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageBatchCommand,
  Message,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import { logger } from '../utils/logger';

interface SQSConfig {
  region: string;
  queueUrl: string;
  visibilityTimeout?: number;
  waitTimeSeconds?: number;
  maxNumberOfMessages?: number;
}

interface SQSMessage<T> {
  id: string;
  body: T;
  receiptHandle: string;
  attributes: Record<string, string>;
}

export class SQSQueue<T> {
  private client: SQSClient;
  private queueUrl: string;
  private config: Required<Omit<SQSConfig, 'region' | 'queueUrl'>>;
  private isPolling = false;

  constructor(config: SQSConfig) {
    this.client = new SQSClient({ region: config.region });
    this.queueUrl = config.queueUrl;
    this.config = {
      visibilityTimeout: config.visibilityTimeout ?? 30,
      waitTimeSeconds: config.waitTimeSeconds ?? 20,
      maxNumberOfMessages: config.maxNumberOfMessages ?? 10,
    };
  }

  async send(
    message: T,
    options?: {
      delaySeconds?: number;
      messageGroupId?: string;
      messageDeduplicationId?: string;
    }
  ): Promise<string> {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      DelaySeconds: options?.delaySeconds,
      MessageGroupId: options?.messageGroupId,
      MessageDeduplicationId: options?.messageDeduplicationId,
    });

    const response = await this.client.send(command);
    return response.MessageId!;
  }

  async sendBatch(
    messages: Array<{ id: string; body: T; delaySeconds?: number }>
  ): Promise<void> {
    const entries = messages.map((msg) => ({
      Id: msg.id,
      MessageBody: JSON.stringify(msg.body),
      DelaySeconds: msg.delaySeconds,
    }));

    const command = new SendMessageBatchCommand({
      QueueUrl: this.queueUrl,
      Entries: entries,
    });

    await this.client.send(command);
  }

  async receive(): Promise<SQSMessage<T>[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: this.config.maxNumberOfMessages,
      WaitTimeSeconds: this.config.waitTimeSeconds,
      VisibilityTimeout: this.config.visibilityTimeout,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
    });

    const response = await this.client.send(command);

    return (response.Messages || []).map((msg) => ({
      id: msg.MessageId!,
      body: JSON.parse(msg.Body!) as T,
      receiptHandle: msg.ReceiptHandle!,
      attributes: msg.Attributes || {},
    }));
  }

  async delete(receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.client.send(command);
  }

  async poll(
    handler: (message: SQSMessage<T>) => Promise<void>,
    options?: { stopOnError?: boolean }
  ): Promise<void> {
    this.isPolling = true;

    while (this.isPolling) {
      try {
        const messages = await this.receive();

        await Promise.all(
          messages.map(async (message) => {
            try {
              await handler(message);
              await this.delete(message.receiptHandle);
            } catch (error) {
              logger.error('Message processing error', {
                error,
                messageId: message.id,
              });

              if (options?.stopOnError) {
                throw error;
              }
            }
          })
        );
      } catch (error) {
        logger.error('SQS poll error', { error });

        if (options?.stopOnError) {
          this.isPolling = false;
          throw error;
        }

        // Wait before retrying
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  stop(): void {
    this.isPolling = false;
  }

  async getQueueAttributes(): Promise<Record<string, string>> {
    const command = new GetQueueAttributesCommand({
      QueueUrl: this.queueUrl,
      AttributeNames: ['All'],
    });

    const response = await this.client.send(command);
    return response.Attributes || {};
  }
}

// Usage
const queue = new SQSQueue<{ userId: string; action: string }>({
  region: 'us-east-1',
  queueUrl: process.env.SQS_QUEUE_URL!,
});

// Send message
await queue.send({ userId: '123', action: 'process' });

// Poll and process
queue.poll(async (message) => {
  console.log('Processing:', message.body);
});
```

## Python Implementation

```python
# src/queues/celery_queue.py
from celery import Celery, Task
from celery.result import AsyncResult
from typing import Any, Callable, TypeVar
from functools import wraps
import logging

# Configure Celery
app = Celery(
    'tasks',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/1',
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3300,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

logger = logging.getLogger(__name__)

T = TypeVar('T')


# Base task with retry logic
class BaseTask(Task):
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3}
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error(f'Task {task_id} failed: {exc}')

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f'Task {task_id} completed')

    def on_retry(self, exc, task_id, args, kwargs, einfo):
        logger.warning(f'Task {task_id} retrying: {exc}')


# Email task
@app.task(base=BaseTask, bind=True)
def send_email(self, to: str, subject: str, template: str, data: dict):
    logger.info(f'Sending email to {to}')
    # Send email logic
    return {'sent': True, 'to': to}


# Processing task with progress
@app.task(base=BaseTask, bind=True)
def process_data(self, items: list[dict]):
    total = len(items)
    results = []

    for i, item in enumerate(items):
        # Process item
        results.append({'processed': True, 'item': item})

        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'current': i + 1, 'total': total}
        )

    return results


# Chain tasks
@app.task(base=BaseTask)
def step_one(data: dict) -> dict:
    return {**data, 'step_one': True}


@app.task(base=BaseTask)
def step_two(data: dict) -> dict:
    return {**data, 'step_two': True}


@app.task(base=BaseTask)
def step_three(data: dict) -> dict:
    return {**data, 'step_three': True}


# Usage patterns
def example_usage():
    # Simple task
    result = send_email.delay(
        to='user@example.com',
        subject='Welcome',
        template='welcome',
        data={'name': 'John'},
    )

    # Check result
    if result.ready():
        print(result.get())

    # Chain
    from celery import chain
    workflow = chain(
        step_one.s({'input': 'data'}),
        step_two.s(),
        step_three.s(),
    )
    result = workflow.apply_async()

    # Group (parallel)
    from celery import group
    job = group([
        send_email.s('user1@example.com', 'Hi', 'greeting', {}),
        send_email.s('user2@example.com', 'Hi', 'greeting', {}),
    ])
    result = job.apply_async()

    # Chord (group + callback)
    from celery import chord
    callback = step_three.s()
    job = chord([step_one.s({'i': i}) for i in range(10)], callback)
    result = job.apply_async()

    # Scheduled task
    from datetime import datetime, timedelta
    send_email.apply_async(
        args=['user@example.com', 'Reminder', 'reminder', {}],
        eta=datetime.utcnow() + timedelta(hours=1),
    )

    # Periodic tasks (in celery beat schedule)
    app.conf.beat_schedule = {
        'daily-cleanup': {
            'task': 'tasks.cleanup',
            'schedule': 86400.0,  # Every 24 hours
        },
        'hourly-report': {
            'task': 'tasks.generate_report',
            'schedule': 3600.0,  # Every hour
        },
    }


# Task status helper
def get_task_status(task_id: str) -> dict:
    result = AsyncResult(task_id, app=app)

    return {
        'id': task_id,
        'status': result.status,
        'ready': result.ready(),
        'successful': result.successful() if result.ready() else None,
        'result': result.result if result.ready() else None,
        'traceback': result.traceback if result.failed() else None,
    }
```

## CLAUDE.md Integration

```markdown
# Message Queues

## Commands
- `npm run queue:start` - Start queue workers
- `npm run queue:monitor` - Open Bull Board UI
- `npm run queue:clean` - Clean old jobs

## Queues
- `emails` - Email delivery queue
- `notifications` - Push notifications
- `exports` - Data export jobs
- `scheduler` - Scheduled tasks

## Job Types
- Immediate: Process as soon as available
- Delayed: Schedule for future processing
- Repeatable: Cron-based recurring jobs
- Priority: Higher priority processed first

## Monitoring
- Bull Board: http://localhost:3000/admin/queues
- Redis Insight for queue inspection

## Patterns
- Use flows for job dependencies
- Set appropriate retry strategies
- Implement dead letter handling
```

## AI Suggestions

1. **Rate limiting** - Use limiter option to prevent overload
2. **Job priorities** - Higher priority jobs processed first
3. **Progress tracking** - Update job progress for long tasks
4. **Batch processing** - Use addBulk for multiple jobs
5. **Flow dependencies** - Parent-child job relationships
6. **Graceful shutdown** - Drain workers before stopping
7. **Job deduplication** - Use jobId to prevent duplicates
8. **Dead letter queues** - Handle permanently failed jobs
9. **Metrics collection** - Track queue depth and latency
10. **Admin dashboard** - Bull Board or Arena for monitoring
