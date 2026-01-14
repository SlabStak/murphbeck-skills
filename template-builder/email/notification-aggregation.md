# Notification Aggregation System

## Overview
Intelligent notification aggregation and batching system that groups related notifications, prevents notification fatigue, and delivers digests based on user preferences and activity patterns.

## Quick Start
```bash
npm install bull ioredis date-fns lodash handlebars
```

## Implementation

### TypeScript Notification Aggregation Service
```typescript
// notification-aggregation.service.ts
import Queue from 'bull';
import { format, differenceInMinutes, startOfDay, addHours } from 'date-fns';
import _ from 'lodash';

interface Notification {
  id: string;
  userId: string;
  type: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  groupKey?: string; // For grouping related notifications
  actors?: Actor[]; // Who triggered this notification
  target?: Target; // What the notification is about
  createdAt: Date;
}

interface Actor {
  id: string;
  name: string;
  avatar?: string;
  type: string;
}

interface Target {
  id: string;
  type: string;
  name: string;
  url?: string;
}

interface AggregatedNotification {
  id: string;
  userId: string;
  type: string;
  category: string;
  groupKey: string;
  notifications: Notification[];
  actors: Actor[];
  target?: Target;
  count: number;
  summary: string;
  firstAt: Date;
  lastAt: Date;
  sentAt?: Date;
}

interface NotificationDigest {
  id: string;
  userId: string;
  type: 'immediate' | 'hourly' | 'daily' | 'weekly';
  categories: Map<string, AggregatedNotification[]>;
  totalCount: number;
  generatedAt: Date;
}

interface AggregationRule {
  id: string;
  name: string;
  category: string;
  type?: string;
  groupBy: string[]; // Fields to group by
  windowMinutes: number;
  maxBatchSize: number;
  summaryTemplate: string;
  collapseThreshold: number; // After N notifications, collapse
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface UserAggregationPrefs {
  userId: string;
  enabled: boolean;
  defaultFrequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  categoryFrequencies: Record<string, 'instant' | 'hourly' | 'daily' | 'weekly'>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:MM
    end: string;
    timezone: string;
  };
  digestTime?: string; // HH:MM for daily/weekly digests
  digestDay?: number; // Day of week for weekly (0-6)
}

class NotificationAggregationService {
  private pendingNotifications: Map<string, Notification[]> = new Map();
  private aggregatedGroups: Map<string, AggregatedNotification> = new Map();
  private userPrefs: Map<string, UserAggregationPrefs> = new Map();
  private rules: Map<string, AggregationRule> = new Map();
  private aggregationQueue: Queue.Queue;
  private digestQueue: Queue.Queue;

  constructor() {
    this.aggregationQueue = new Queue('notification-aggregation', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.digestQueue = new Queue('notification-digest', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.setupDefaultRules();
    this.setupQueueProcessors();
    this.setupDigestScheduler();
  }

  private setupDefaultRules(): void {
    const defaultRules: AggregationRule[] = [
      // Social interactions
      {
        id: 'likes',
        name: 'Like Aggregation',
        category: 'social',
        type: 'like',
        groupBy: ['target.id', 'target.type'],
        windowMinutes: 60,
        maxBatchSize: 100,
        summaryTemplate: '{{actorSummary}} liked your {{target.type}}',
        collapseThreshold: 3,
        priority: 'low',
      },
      {
        id: 'comments',
        name: 'Comment Aggregation',
        category: 'social',
        type: 'comment',
        groupBy: ['target.id'],
        windowMinutes: 30,
        maxBatchSize: 50,
        summaryTemplate: '{{count}} new comments on "{{target.name}}"',
        collapseThreshold: 5,
        priority: 'normal',
      },
      {
        id: 'follows',
        name: 'Follow Aggregation',
        category: 'social',
        type: 'follow',
        groupBy: ['userId'],
        windowMinutes: 120,
        maxBatchSize: 100,
        summaryTemplate: '{{actorSummary}} and {{remainingCount}} others followed you',
        collapseThreshold: 3,
        priority: 'low',
      },
      // Mentions - higher priority, shorter window
      {
        id: 'mentions',
        name: 'Mention Aggregation',
        category: 'communication',
        type: 'mention',
        groupBy: ['target.id'],
        windowMinutes: 15,
        maxBatchSize: 20,
        summaryTemplate: '{{actorSummary}} mentioned you in "{{target.name}}"',
        collapseThreshold: 3,
        priority: 'high',
      },
      // Messages - even higher priority
      {
        id: 'messages',
        name: 'Message Aggregation',
        category: 'communication',
        type: 'message',
        groupBy: ['actors.0.id'], // Group by sender
        windowMinutes: 5,
        maxBatchSize: 10,
        summaryTemplate: '{{count}} new messages from {{actors.0.name}}',
        collapseThreshold: 5,
        priority: 'high',
      },
      // System notifications
      {
        id: 'system',
        name: 'System Notification Aggregation',
        category: 'system',
        groupBy: ['type'],
        windowMinutes: 60,
        maxBatchSize: 50,
        summaryTemplate: '{{count}} {{type}} notifications',
        collapseThreshold: 10,
        priority: 'normal',
      },
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  private setupQueueProcessors(): void {
    // Process aggregation windows
    this.aggregationQueue.process('flush-group', async (job) => {
      const { groupKey } = job.data;
      await this.flushAggregationGroup(groupKey);
    });

    // Process digest generation
    this.digestQueue.process('generate-digest', async (job) => {
      const { userId, digestType } = job.data;
      await this.generateAndSendDigest(userId, digestType);
    });
  }

  private setupDigestScheduler(): void {
    // Schedule hourly digest processing
    this.digestQueue.add(
      'process-hourly-digests',
      {},
      { repeat: { cron: '0 * * * *' } } // Every hour
    );

    // Schedule daily digest processing
    this.digestQueue.add(
      'process-daily-digests',
      {},
      { repeat: { cron: '0 9 * * *' } } // 9 AM daily
    );

    // Schedule weekly digest processing
    this.digestQueue.add(
      'process-weekly-digests',
      {},
      { repeat: { cron: '0 9 * * 1' } } // Monday 9 AM
    );
  }

  // Add a notification for aggregation
  async addNotification(notification: Notification): Promise<{
    immediate: boolean;
    groupKey?: string;
  }> {
    const prefs = await this.getUserPrefs(notification.userId);
    const rule = this.findMatchingRule(notification);

    // Check if should be sent immediately
    if (this.shouldSendImmediately(notification, prefs, rule)) {
      return { immediate: true };
    }

    // Generate group key
    const groupKey = this.generateGroupKey(notification, rule);
    notification.groupKey = groupKey;

    // Add to pending notifications
    const pending = this.pendingNotifications.get(groupKey) || [];
    pending.push(notification);
    this.pendingNotifications.set(groupKey, pending);

    // Update or create aggregation group
    await this.updateAggregationGroup(groupKey, notification, rule);

    // Schedule flush if this is first notification in group
    if (pending.length === 1) {
      await this.aggregationQueue.add(
        'flush-group',
        { groupKey },
        { delay: (rule?.windowMinutes || 30) * 60 * 1000 }
      );
    }

    // Check if we've hit max batch size
    if (rule && pending.length >= rule.maxBatchSize) {
      await this.flushAggregationGroup(groupKey);
    }

    return { immediate: false, groupKey };
  }

  private shouldSendImmediately(
    notification: Notification,
    prefs: UserAggregationPrefs,
    rule?: AggregationRule
  ): boolean {
    // Urgent notifications always go immediately
    if (notification.priority === 'urgent') return true;

    // User disabled aggregation
    if (!prefs.enabled) return true;

    // User wants instant delivery for this category
    const categoryFreq = prefs.categoryFrequencies[notification.category];
    if (categoryFreq === 'instant') return true;

    // No rule found, send immediately
    if (!rule) return true;

    return false;
  }

  private findMatchingRule(notification: Notification): AggregationRule | undefined {
    // Find most specific rule
    for (const rule of this.rules.values()) {
      if (rule.category === notification.category) {
        if (rule.type && rule.type !== notification.type) continue;
        return rule;
      }
    }
    return undefined;
  }

  private generateGroupKey(notification: Notification, rule?: AggregationRule): string {
    const parts = [notification.userId, notification.category, notification.type];

    if (rule?.groupBy) {
      for (const field of rule.groupBy) {
        const value = _.get(notification, field);
        if (value !== undefined) {
          parts.push(String(value));
        }
      }
    }

    return parts.join(':');
  }

  private async updateAggregationGroup(
    groupKey: string,
    notification: Notification,
    rule?: AggregationRule
  ): Promise<void> {
    let group = this.aggregatedGroups.get(groupKey);

    if (!group) {
      group = {
        id: groupKey,
        userId: notification.userId,
        type: notification.type,
        category: notification.category,
        groupKey,
        notifications: [],
        actors: [],
        target: notification.target,
        count: 0,
        summary: '',
        firstAt: notification.createdAt,
        lastAt: notification.createdAt,
      };
    }

    group.notifications.push(notification);
    group.count = group.notifications.length;
    group.lastAt = notification.createdAt;

    // Update actors list (unique)
    if (notification.actors) {
      for (const actor of notification.actors) {
        if (!group.actors.find(a => a.id === actor.id)) {
          group.actors.push(actor);
        }
      }
    }

    // Generate summary
    group.summary = this.generateSummary(group, rule);

    this.aggregatedGroups.set(groupKey, group);
  }

  private generateSummary(group: AggregatedNotification, rule?: AggregationRule): string {
    const template = rule?.summaryTemplate || '{{count}} notifications';

    const actorNames = group.actors.slice(0, 3).map(a => a.name);
    const actorSummary = this.formatActorList(actorNames, group.actors.length);

    const context = {
      count: group.count,
      actors: group.actors,
      actorSummary,
      remainingCount: Math.max(0, group.actors.length - 3),
      target: group.target,
      type: group.type,
      category: group.category,
    };

    // Simple template replacement
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      return String(_.get(context, key.trim()) ?? match);
    });
  }

  private formatActorList(names: string[], total: number): string {
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;

    const remaining = total - 2;
    if (remaining > 0) {
      return `${names[0]}, ${names[1]}, and ${remaining} others`;
    }
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  }

  // Flush an aggregation group (send the aggregated notification)
  private async flushAggregationGroup(groupKey: string): Promise<void> {
    const group = this.aggregatedGroups.get(groupKey);
    if (!group || group.count === 0) return;

    const pending = this.pendingNotifications.get(groupKey) || [];
    if (pending.length === 0) return;

    const prefs = await this.getUserPrefs(group.userId);

    // Check if should add to digest instead
    const categoryFreq = prefs.categoryFrequencies[group.category] || prefs.defaultFrequency;

    if (categoryFreq !== 'instant' && categoryFreq !== 'hourly') {
      // Store for digest
      await this.addToDigestQueue(group, categoryFreq);
    } else {
      // Send aggregated notification
      await this.sendAggregatedNotification(group);
    }

    // Clear the group
    this.pendingNotifications.delete(groupKey);
    this.aggregatedGroups.delete(groupKey);
  }

  private async sendAggregatedNotification(group: AggregatedNotification): Promise<void> {
    group.sentAt = new Date();

    // Determine which channels to use
    const notificationPayload = {
      userId: group.userId,
      type: 'aggregated',
      category: group.category,
      title: group.summary,
      body: this.generateAggregatedBody(group),
      data: {
        groupKey: group.groupKey,
        count: group.count,
        actors: group.actors.slice(0, 5),
        target: group.target,
        notificationIds: group.notifications.map(n => n.id),
      },
    };

    // Send via notification service (implement based on your notification infrastructure)
    // await notificationService.send(notificationPayload);

    console.log('Sending aggregated notification:', notificationPayload);
  }

  private generateAggregatedBody(group: AggregatedNotification): string {
    if (group.count === 1) {
      return group.notifications[0].body;
    }

    // Show preview of latest notifications
    const previews = group.notifications
      .slice(-3)
      .map(n => `• ${n.body}`)
      .join('\n');

    return `${group.summary}\n\n${previews}`;
  }

  // Digest Management
  private digestStorage: Map<string, Map<string, AggregatedNotification[]>> = new Map();

  private async addToDigestQueue(
    group: AggregatedNotification,
    frequency: 'daily' | 'weekly'
  ): Promise<void> {
    const digestKey = `${group.userId}:${frequency}`;
    let digest = this.digestStorage.get(digestKey);

    if (!digest) {
      digest = new Map();
      this.digestStorage.set(digestKey, digest);
    }

    const categoryGroups = digest.get(group.category) || [];
    categoryGroups.push(group);
    digest.set(group.category, categoryGroups);
  }

  async generateAndSendDigest(
    userId: string,
    digestType: 'hourly' | 'daily' | 'weekly'
  ): Promise<NotificationDigest | null> {
    const digestKey = `${userId}:${digestType}`;
    const stored = this.digestStorage.get(digestKey);

    if (!stored || stored.size === 0) return null;

    let totalCount = 0;
    const categories = new Map<string, AggregatedNotification[]>();

    for (const [category, groups] of stored.entries()) {
      categories.set(category, groups);
      totalCount += groups.reduce((sum, g) => sum + g.count, 0);
    }

    const digest: NotificationDigest = {
      id: `${userId}-${digestType}-${Date.now()}`,
      userId,
      type: digestType,
      categories,
      totalCount,
      generatedAt: new Date(),
    };

    // Generate and send digest email
    await this.sendDigestEmail(digest);

    // Clear stored notifications
    this.digestStorage.delete(digestKey);

    return digest;
  }

  private async sendDigestEmail(digest: NotificationDigest): Promise<void> {
    const sections: string[] = [];

    for (const [category, groups] of digest.categories.entries()) {
      const categoryTotal = groups.reduce((sum, g) => sum + g.count, 0);
      sections.push(`\n## ${this.formatCategoryName(category)} (${categoryTotal})`);

      for (const group of groups) {
        sections.push(`\n### ${group.summary}`);

        // Show recent items
        const recentItems = group.notifications.slice(-5);
        for (const item of recentItems) {
          sections.push(`- ${item.title}: ${item.body}`);
        }

        if (group.notifications.length > 5) {
          sections.push(`_...and ${group.notifications.length - 5} more_`);
        }
      }
    }

    const emailContent = {
      to: digest.userId, // Would need to look up email
      subject: this.getDigestSubject(digest),
      html: this.generateDigestHtml(digest, sections),
      text: sections.join('\n'),
    };

    // Send via email service
    console.log('Sending digest:', emailContent);
  }

  private getDigestSubject(digest: NotificationDigest): string {
    const period = {
      hourly: 'Last Hour',
      daily: 'Today',
      weekly: 'This Week',
    }[digest.type];

    return `Your ${period}'s Notifications (${digest.totalCount} new)`;
  }

  private generateDigestHtml(digest: NotificationDigest, sections: string[]): string {
    // Simple HTML generation - use a proper template in production
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; max-width: 600px; margin: 0 auto; }
            h2 { color: #333; border-bottom: 1px solid #eee; }
            h3 { color: #666; }
            ul { list-style: none; padding: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          </style>
        </head>
        <body>
          <h1>Your Notification Digest</h1>
          <p>${digest.totalCount} notifications since your last digest.</p>
          ${sections.join('')}
          <p><a href="/notifications">View all notifications</a></p>
        </body>
      </html>
    `;
  }

  private formatCategoryName(category: string): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // User Preferences Management
  async getUserPrefs(userId: string): Promise<UserAggregationPrefs> {
    let prefs = this.userPrefs.get(userId);

    if (!prefs) {
      prefs = {
        userId,
        enabled: true,
        defaultFrequency: 'hourly',
        categoryFrequencies: {
          social: 'hourly',
          communication: 'instant',
          marketing: 'daily',
          system: 'hourly',
        },
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC',
        },
        digestTime: '09:00',
        digestDay: 1, // Monday
      };
      this.userPrefs.set(userId, prefs);
    }

    return prefs;
  }

  async updateUserPrefs(
    userId: string,
    updates: Partial<UserAggregationPrefs>
  ): Promise<UserAggregationPrefs> {
    const prefs = await this.getUserPrefs(userId);
    Object.assign(prefs, updates);
    this.userPrefs.set(userId, prefs);
    return prefs;
  }

  // Analytics
  async getAggregationStats(userId: string): Promise<{
    pendingCount: number;
    groupsCount: number;
    digestPendingCount: number;
  }> {
    let pendingCount = 0;
    let groupsCount = 0;

    for (const [key, notifications] of this.pendingNotifications.entries()) {
      if (key.startsWith(userId)) {
        pendingCount += notifications.length;
        groupsCount++;
      }
    }

    let digestPendingCount = 0;
    for (const [key, categories] of this.digestStorage.entries()) {
      if (key.startsWith(userId)) {
        for (const groups of categories.values()) {
          digestPendingCount += groups.reduce((sum, g) => sum + g.count, 0);
        }
      }
    }

    return { pendingCount, groupsCount, digestPendingCount };
  }
}

export const notificationAggregationService = new NotificationAggregationService();
```

### Express.js API Routes
```typescript
// routes/notification-aggregation.routes.ts
import { Router, Request, Response } from 'express';
import { notificationAggregationService } from '../services/notification-aggregation.service';

const router = Router();

// Add notification (internal API)
router.post('/notifications', async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    const result = await notificationAggregationService.addNotification(notification);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get user aggregation preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const prefs = await notificationAggregationService.getUserPrefs(userId);

    res.json({
      success: true,
      data: prefs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update user aggregation preferences
router.patch('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const prefs = await notificationAggregationService.updateUserPrefs(userId, req.body);

    res.json({
      success: true,
      data: prefs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get aggregation stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await notificationAggregationService.getAggregationStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manually trigger digest (for testing)
router.post('/digest/trigger', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type = 'daily' } = req.body;

    const digest = await notificationAggregationService.generateAndSendDigest(userId, type);

    res.json({
      success: true,
      data: digest,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Aggregation Settings Component
```tsx
// components/AggregationSettings.tsx
import React, { useState, useEffect } from 'react';

interface AggregationPrefs {
  enabled: boolean;
  defaultFrequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  categoryFrequencies: Record<string, string>;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  digestTime?: string;
  digestDay?: number;
}

const FREQUENCY_OPTIONS = [
  { value: 'instant', label: 'Instant', description: 'Send immediately' },
  { value: 'hourly', label: 'Hourly', description: 'Batch and send every hour' },
  { value: 'daily', label: 'Daily', description: 'Include in daily digest' },
  { value: 'weekly', label: 'Weekly', description: 'Include in weekly digest' },
];

const CATEGORIES = [
  { id: 'social', name: 'Social', description: 'Likes, comments, follows' },
  { id: 'communication', name: 'Communication', description: 'Messages, mentions' },
  { id: 'marketing', name: 'Marketing', description: 'Promotions, updates' },
  { id: 'system', name: 'System', description: 'Account and security' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AggregationSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<AggregationPrefs | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    const response = await fetch('/api/aggregation/preferences');
    const data = await response.json();
    if (data.success) {
      setPrefs(data.data);
    }
  };

  const savePrefs = async (updates: Partial<AggregationPrefs>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/aggregation/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (data.success) {
        setPrefs(data.data);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return <div>Loading...</div>;

  return (
    <div className="aggregation-settings">
      <h2>Notification Batching</h2>
      <p className="description">
        Control how notifications are grouped and delivered to reduce notification fatigue.
      </p>

      <section className="setting-section">
        <label className="toggle-setting">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={e => savePrefs({ enabled: e.target.checked })}
            disabled={saving}
          />
          <span>Enable notification batching</span>
        </label>
        <p className="help-text">
          When enabled, similar notifications will be grouped together.
        </p>
      </section>

      {prefs.enabled && (
        <>
          <section className="setting-section">
            <h3>Default Frequency</h3>
            <div className="frequency-options">
              {FREQUENCY_OPTIONS.map(option => (
                <label key={option.value} className="frequency-option">
                  <input
                    type="radio"
                    name="defaultFrequency"
                    value={option.value}
                    checked={prefs.defaultFrequency === option.value}
                    onChange={e => savePrefs({ defaultFrequency: e.target.value as any })}
                    disabled={saving}
                  />
                  <div className="option-content">
                    <span className="option-label">{option.label}</span>
                    <span className="option-description">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="setting-section">
            <h3>Category Settings</h3>
            <p className="help-text">Override frequency for specific notification types.</p>

            <div className="category-settings">
              {CATEGORIES.map(category => (
                <div key={category.id} className="category-row">
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <span className="category-description">{category.description}</span>
                  </div>
                  <select
                    value={prefs.categoryFrequencies[category.id] || prefs.defaultFrequency}
                    onChange={e => savePrefs({
                      categoryFrequencies: {
                        ...prefs.categoryFrequencies,
                        [category.id]: e.target.value,
                      },
                    })}
                    disabled={saving}
                  >
                    {FREQUENCY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section className="setting-section">
            <h3>Digest Schedule</h3>

            <div className="digest-settings">
              <div className="setting-row">
                <label>Daily digest time</label>
                <input
                  type="time"
                  value={prefs.digestTime || '09:00'}
                  onChange={e => savePrefs({ digestTime: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="setting-row">
                <label>Weekly digest day</label>
                <select
                  value={prefs.digestDay ?? 1}
                  onChange={e => savePrefs({ digestDay: Number(e.target.value) })}
                  disabled={saving}
                >
                  {DAYS.map((day, index) => (
                    <option key={day} value={index}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="setting-section">
            <h3>Quiet Hours</h3>

            <label className="toggle-setting">
              <input
                type="checkbox"
                checked={prefs.quietHours?.enabled ?? false}
                onChange={e => savePrefs({
                  quietHours: { ...prefs.quietHours!, enabled: e.target.checked },
                })}
                disabled={saving}
              />
              <span>Enable quiet hours</span>
            </label>

            {prefs.quietHours?.enabled && (
              <div className="quiet-hours-settings">
                <div className="setting-row">
                  <label>Start time</label>
                  <input
                    type="time"
                    value={prefs.quietHours.start}
                    onChange={e => savePrefs({
                      quietHours: { ...prefs.quietHours!, start: e.target.value },
                    })}
                    disabled={saving}
                  />
                </div>
                <div className="setting-row">
                  <label>End time</label>
                  <input
                    type="time"
                    value={prefs.quietHours.end}
                    onChange={e => savePrefs({
                      quietHours: { ...prefs.quietHours!, end: e.target.value },
                    })}
                    disabled={saving}
                  />
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {saving && <div className="saving-indicator">Saving...</div>}
    </div>
  );
};
```

### Python FastAPI Implementation
```python
# notification_aggregation.py
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from enum import Enum
from pydantic import BaseModel
from fastapi import APIRouter, Depends
import asyncio

router = APIRouter(prefix="/aggregation", tags=["aggregation"])


class Priority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Frequency(str, Enum):
    INSTANT = "instant"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"


class Actor(BaseModel):
    id: str
    name: str
    avatar: Optional[str] = None
    type: str = "user"


class Target(BaseModel):
    id: str
    type: str
    name: str
    url: Optional[str] = None


class Notification(BaseModel):
    id: str
    user_id: str
    type: str
    category: str
    title: str
    body: str
    data: Dict[str, Any] = {}
    priority: Priority = Priority.NORMAL
    group_key: Optional[str] = None
    actors: List[Actor] = []
    target: Optional[Target] = None
    created_at: datetime


class AggregatedNotification(BaseModel):
    id: str
    user_id: str
    type: str
    category: str
    group_key: str
    notifications: List[Notification] = []
    actors: List[Actor] = []
    target: Optional[Target] = None
    count: int = 0
    summary: str = ""
    first_at: datetime
    last_at: datetime
    sent_at: Optional[datetime] = None


class AggregationRule(BaseModel):
    id: str
    name: str
    category: str
    type: Optional[str] = None
    group_by: List[str] = []
    window_minutes: int = 30
    max_batch_size: int = 50
    summary_template: str = "{{count}} notifications"
    collapse_threshold: int = 5
    priority: Priority = Priority.NORMAL


class UserAggregationPrefs(BaseModel):
    user_id: str
    enabled: bool = True
    default_frequency: Frequency = Frequency.HOURLY
    category_frequencies: Dict[str, Frequency] = {}
    digest_time: str = "09:00"
    digest_day: int = 1


# Storage
pending_notifications: Dict[str, List[Notification]] = {}
aggregated_groups: Dict[str, AggregatedNotification] = {}
user_prefs: Dict[str, UserAggregationPrefs] = {}
digest_storage: Dict[str, Dict[str, List[AggregatedNotification]]] = {}

# Default rules
DEFAULT_RULES: Dict[str, AggregationRule] = {
    "likes": AggregationRule(
        id="likes",
        name="Like Aggregation",
        category="social",
        type="like",
        group_by=["target.id"],
        window_minutes=60,
        max_batch_size=100,
        summary_template="{{actor_summary}} liked your post",
        collapse_threshold=3,
        priority=Priority.LOW
    ),
    "comments": AggregationRule(
        id="comments",
        name="Comment Aggregation",
        category="social",
        type="comment",
        group_by=["target.id"],
        window_minutes=30,
        max_batch_size=50,
        summary_template="{{count}} new comments",
        collapse_threshold=5,
        priority=Priority.NORMAL
    ),
    "messages": AggregationRule(
        id="messages",
        name="Message Aggregation",
        category="communication",
        type="message",
        group_by=["actors.0.id"],
        window_minutes=5,
        max_batch_size=10,
        summary_template="{{count}} new messages",
        collapse_threshold=5,
        priority=Priority.HIGH
    ),
}


def get_nested_value(obj: Any, path: str) -> Any:
    """Get nested value from object using dot notation."""
    parts = path.split(".")
    current = obj

    for part in parts:
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list):
            try:
                current = current[int(part)]
            except (IndexError, ValueError):
                return None
        elif hasattr(current, part):
            current = getattr(current, part)
        else:
            return None

    return current


def generate_group_key(notification: Notification, rule: Optional[AggregationRule]) -> str:
    """Generate a group key for aggregation."""
    parts = [notification.user_id, notification.category, notification.type]

    if rule and rule.group_by:
        for field in rule.group_by:
            value = get_nested_value(notification.dict(), field)
            if value is not None:
                parts.append(str(value))

    return ":".join(parts)


def find_matching_rule(notification: Notification) -> Optional[AggregationRule]:
    """Find the most specific matching rule."""
    for rule in DEFAULT_RULES.values():
        if rule.category == notification.category:
            if rule.type and rule.type != notification.type:
                continue
            return rule
    return None


def format_actor_list(names: List[str], total: int) -> str:
    """Format a list of actor names."""
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"

    remaining = total - 2
    if remaining > 0:
        return f"{names[0]}, {names[1]}, and {remaining} others"
    return f"{', '.join(names[:-1])}, and {names[-1]}"


def generate_summary(group: AggregatedNotification, rule: Optional[AggregationRule]) -> str:
    """Generate summary text for aggregated notification."""
    template = rule.summary_template if rule else "{{count}} notifications"

    actor_names = [a.name for a in group.actors[:3]]
    actor_summary = format_actor_list(actor_names, len(group.actors))

    # Simple template replacement
    summary = template.replace("{{count}}", str(group.count))
    summary = summary.replace("{{actor_summary}}", actor_summary)

    if group.target:
        summary = summary.replace("{{target.name}}", group.target.name)
        summary = summary.replace("{{target.type}}", group.target.type)

    return summary


async def get_user_prefs(user_id: str) -> UserAggregationPrefs:
    """Get or create user preferences."""
    if user_id not in user_prefs:
        user_prefs[user_id] = UserAggregationPrefs(
            user_id=user_id,
            category_frequencies={
                "social": Frequency.HOURLY,
                "communication": Frequency.INSTANT,
                "marketing": Frequency.DAILY,
            }
        )
    return user_prefs[user_id]


async def add_notification(notification: Notification) -> Dict[str, Any]:
    """Add a notification for potential aggregation."""
    prefs = await get_user_prefs(notification.user_id)
    rule = find_matching_rule(notification)

    # Check if should send immediately
    if notification.priority == Priority.URGENT:
        return {"immediate": True}

    if not prefs.enabled:
        return {"immediate": True}

    cat_freq = prefs.category_frequencies.get(
        notification.category,
        prefs.default_frequency
    )
    if cat_freq == Frequency.INSTANT:
        return {"immediate": True}

    # Generate group key
    group_key = generate_group_key(notification, rule)
    notification.group_key = group_key

    # Add to pending
    if group_key not in pending_notifications:
        pending_notifications[group_key] = []
    pending_notifications[group_key].append(notification)

    # Update aggregation group
    if group_key not in aggregated_groups:
        aggregated_groups[group_key] = AggregatedNotification(
            id=group_key,
            user_id=notification.user_id,
            type=notification.type,
            category=notification.category,
            group_key=group_key,
            target=notification.target,
            first_at=notification.created_at,
            last_at=notification.created_at
        )

    group = aggregated_groups[group_key]
    group.notifications.append(notification)
    group.count = len(group.notifications)
    group.last_at = notification.created_at

    # Add unique actors
    for actor in notification.actors:
        if not any(a.id == actor.id for a in group.actors):
            group.actors.append(actor)

    group.summary = generate_summary(group, rule)

    # Check if should flush
    if rule and len(pending_notifications[group_key]) >= rule.max_batch_size:
        await flush_group(group_key)

    return {"immediate": False, "group_key": group_key}


async def flush_group(group_key: str) -> None:
    """Flush an aggregation group."""
    if group_key not in aggregated_groups:
        return

    group = aggregated_groups[group_key]
    prefs = await get_user_prefs(group.user_id)

    cat_freq = prefs.category_frequencies.get(
        group.category,
        prefs.default_frequency
    )

    if cat_freq in [Frequency.DAILY, Frequency.WEEKLY]:
        # Store for digest
        digest_key = f"{group.user_id}:{cat_freq.value}"
        if digest_key not in digest_storage:
            digest_storage[digest_key] = {}
        if group.category not in digest_storage[digest_key]:
            digest_storage[digest_key][group.category] = []
        digest_storage[digest_key][group.category].append(group)
    else:
        # Send aggregated notification
        group.sent_at = datetime.utcnow()
        # await send_aggregated_notification(group)
        print(f"Sending aggregated notification: {group.summary}")

    # Clear
    if group_key in pending_notifications:
        del pending_notifications[group_key]
    if group_key in aggregated_groups:
        del aggregated_groups[group_key]


# API Routes
@router.post("/notifications")
async def add_notification_endpoint(notification: Notification):
    result = await add_notification(notification)
    return {"success": True, "data": result}


@router.get("/preferences")
async def get_preferences(user_id: str = Depends(get_current_user_id)):
    prefs = await get_user_prefs(user_id)
    return {"success": True, "data": prefs}


@router.patch("/preferences")
async def update_preferences(
    updates: Dict[str, Any],
    user_id: str = Depends(get_current_user_id)
):
    prefs = await get_user_prefs(user_id)

    for key, value in updates.items():
        if hasattr(prefs, key):
            setattr(prefs, key, value)

    user_prefs[user_id] = prefs
    return {"success": True, "data": prefs}


@router.get("/stats")
async def get_stats(user_id: str = Depends(get_current_user_id)):
    pending_count = sum(
        len(notifs)
        for key, notifs in pending_notifications.items()
        if key.startswith(user_id)
    )

    groups_count = sum(
        1 for key in aggregated_groups.keys()
        if key.startswith(user_id)
    )

    digest_count = 0
    for key, categories in digest_storage.items():
        if key.startswith(user_id):
            for groups in categories.values():
                digest_count += sum(g.count for g in groups)

    return {
        "success": True,
        "data": {
            "pending_count": pending_count,
            "groups_count": groups_count,
            "digest_pending_count": digest_count
        }
    }


def get_current_user_id() -> str:
    return "user_123"
```

## CLAUDE.md Integration
```markdown
## Notification Aggregation Commands

### Aggregation operations
"Add notification for aggregation"
"Flush aggregation group for user"
"Generate daily digest for user"

### Preference management
"Get user aggregation preferences"
"Set social notifications to hourly batching"
"Enable quiet hours from 10pm to 8am"

### Analytics
"Get aggregation stats for user"
"Check pending notifications count"
"View digest queue status"
```

## AI Suggestions
1. Add ML-based optimal batch size prediction per user
2. Implement engagement-based frequency adjustment
3. Add cross-device notification deduplication
4. Create smart summary generation with NLP
5. Build notification importance scoring
6. Implement user activity pattern learning
7. Add real-time aggregation preview
8. Create A/B testing for aggregation windows
9. Build notification fatigue detection
10. Implement contextual delivery timing
