# Notification Preferences

## Overview
Comprehensive notification preferences system allowing users to control how, when, and what notifications they receive across all channels (email, push, SMS, in-app).

## Quick Start
```bash
npm install zod date-fns lodash
```

## Implementation

### TypeScript Notification Preferences Service
```typescript
// notification-preferences.service.ts
import { z } from 'zod';

// Schemas
const TimeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM format
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

const QuietHoursSchema = z.object({
  enabled: z.boolean(),
  timezone: z.string(),
  schedule: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6), // 0 = Sunday
    ranges: z.array(TimeRangeSchema),
  })),
  allowUrgent: z.boolean(),
});

const ChannelPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  inApp: z.boolean(),
});

const CategoryPreferenceSchema = z.object({
  categoryId: z.string(),
  enabled: z.boolean(),
  channels: ChannelPreferencesSchema,
  frequency: z.enum(['instant', 'hourly', 'daily', 'weekly']),
  digest: z.boolean(),
});

const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  globalEnabled: z.boolean(),
  channels: ChannelPreferencesSchema,
  categories: z.array(CategoryPreferenceSchema),
  quietHours: QuietHoursSchema,
  digestSettings: z.object({
    enabled: z.boolean(),
    frequency: z.enum(['daily', 'weekly']),
    dayOfWeek: z.number().optional(), // For weekly digest
    timeOfDay: z.string(), // HH:MM format
    timezone: z.string(),
  }),
  unsubscribeToken: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;
type ChannelPreferences = z.infer<typeof ChannelPreferencesSchema>;
type CategoryPreference = z.infer<typeof CategoryPreferenceSchema>;
type QuietHours = z.infer<typeof QuietHoursSchema>;

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  defaultChannels: ChannelPreferences;
  allowDisable: boolean;
  group: string;
}

interface DeliveryDecision {
  shouldDeliver: boolean;
  channel: string | null;
  reason: string;
  delayUntil?: Date;
  addToDigest?: boolean;
}

interface DigestItem {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  createdAt: Date;
}

class NotificationPreferencesService {
  private db: Map<string, NotificationPreferences> = new Map();
  private categories: Map<string, NotificationCategory> = new Map();
  private digestQueue: Map<string, DigestItem[]> = new Map();

  constructor() {
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories(): void {
    const defaultCategories: NotificationCategory[] = [
      // Account & Security
      {
        id: 'security_alerts',
        name: 'Security Alerts',
        description: 'Login attempts, password changes, and security notifications',
        defaultEnabled: true,
        defaultChannels: { email: true, push: true, sms: true, inApp: true },
        allowDisable: false,
        group: 'Account & Security',
      },
      {
        id: 'account_updates',
        name: 'Account Updates',
        description: 'Profile changes, billing updates, and account activity',
        defaultEnabled: true,
        defaultChannels: { email: true, push: false, sms: false, inApp: true },
        allowDisable: true,
        group: 'Account & Security',
      },
      // Communication
      {
        id: 'direct_messages',
        name: 'Direct Messages',
        description: 'New messages from other users',
        defaultEnabled: true,
        defaultChannels: { email: true, push: true, sms: false, inApp: true },
        allowDisable: true,
        group: 'Communication',
      },
      {
        id: 'mentions',
        name: 'Mentions',
        description: 'When someone mentions you in a post or comment',
        defaultEnabled: true,
        defaultChannels: { email: false, push: true, sms: false, inApp: true },
        allowDisable: true,
        group: 'Communication',
      },
      {
        id: 'comments',
        name: 'Comments',
        description: 'New comments on your posts or content',
        defaultEnabled: true,
        defaultChannels: { email: false, push: true, sms: false, inApp: true },
        allowDisable: true,
        group: 'Communication',
      },
      // Activity
      {
        id: 'likes',
        name: 'Likes & Reactions',
        description: 'When someone likes or reacts to your content',
        defaultEnabled: false,
        defaultChannels: { email: false, push: false, sms: false, inApp: true },
        allowDisable: true,
        group: 'Activity',
      },
      {
        id: 'followers',
        name: 'New Followers',
        description: 'When someone follows your profile',
        defaultEnabled: true,
        defaultChannels: { email: false, push: true, sms: false, inApp: true },
        allowDisable: true,
        group: 'Activity',
      },
      // Marketing
      {
        id: 'product_updates',
        name: 'Product Updates',
        description: 'New features, improvements, and announcements',
        defaultEnabled: true,
        defaultChannels: { email: true, push: false, sms: false, inApp: true },
        allowDisable: true,
        group: 'Marketing',
      },
      {
        id: 'promotions',
        name: 'Promotions & Offers',
        description: 'Special deals, discounts, and promotional content',
        defaultEnabled: false,
        defaultChannels: { email: true, push: false, sms: false, inApp: false },
        allowDisable: true,
        group: 'Marketing',
      },
      {
        id: 'newsletter',
        name: 'Newsletter',
        description: 'Weekly or monthly newsletter digest',
        defaultEnabled: true,
        defaultChannels: { email: true, push: false, sms: false, inApp: false },
        allowDisable: true,
        group: 'Marketing',
      },
      // Transactions
      {
        id: 'order_updates',
        name: 'Order Updates',
        description: 'Order confirmations, shipping, and delivery updates',
        defaultEnabled: true,
        defaultChannels: { email: true, push: true, sms: true, inApp: true },
        allowDisable: false,
        group: 'Transactions',
      },
      {
        id: 'payment_updates',
        name: 'Payment Updates',
        description: 'Payment confirmations, refunds, and billing',
        defaultEnabled: true,
        defaultChannels: { email: true, push: false, sms: false, inApp: true },
        allowDisable: false,
        group: 'Transactions',
      },
    ];

    defaultCategories.forEach(cat => this.categories.set(cat.id, cat));
  }

  // Create default preferences for new user
  async createDefaultPreferences(userId: string): Promise<NotificationPreferences> {
    const unsubscribeToken = this.generateToken();

    const categoryPrefs: CategoryPreference[] = Array.from(this.categories.values()).map(cat => ({
      categoryId: cat.id,
      enabled: cat.defaultEnabled,
      channels: { ...cat.defaultChannels },
      frequency: 'instant' as const,
      digest: false,
    }));

    const preferences: NotificationPreferences = {
      userId,
      globalEnabled: true,
      channels: {
        email: true,
        push: true,
        sms: false,
        inApp: true,
      },
      categories: categoryPrefs,
      quietHours: {
        enabled: false,
        timezone: 'UTC',
        schedule: [
          { dayOfWeek: 0, ranges: [{ start: '22:00', end: '08:00' }] },
          { dayOfWeek: 1, ranges: [{ start: '22:00', end: '08:00' }] },
          { dayOfWeek: 2, ranges: [{ start: '22:00', end: '08:00' }] },
          { dayOfWeek: 3, ranges: [{ start: '22:00', end: '08:00' }] },
          { dayOfWeek: 4, ranges: [{ start: '22:00', end: '08:00' }] },
          { dayOfWeek: 5, ranges: [{ start: '23:00', end: '09:00' }] },
          { dayOfWeek: 6, ranges: [{ start: '23:00', end: '09:00' }] },
        ],
        allowUrgent: true,
      },
      digestSettings: {
        enabled: false,
        frequency: 'daily',
        timeOfDay: '09:00',
        timezone: 'UTC',
      },
      unsubscribeToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.set(userId, preferences);
    return preferences;
  }

  // Get user preferences
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    return this.db.get(userId) || null;
  }

  // Update global preferences
  async updateGlobalPreferences(
    userId: string,
    updates: Partial<Pick<NotificationPreferences, 'globalEnabled' | 'channels'>>
  ): Promise<NotificationPreferences> {
    const prefs = await this.getOrCreatePreferences(userId);

    if (updates.globalEnabled !== undefined) {
      prefs.globalEnabled = updates.globalEnabled;
    }
    if (updates.channels) {
      prefs.channels = { ...prefs.channels, ...updates.channels };
    }

    prefs.updatedAt = new Date();
    this.db.set(userId, prefs);
    return prefs;
  }

  // Update category preference
  async updateCategoryPreference(
    userId: string,
    categoryId: string,
    updates: Partial<Omit<CategoryPreference, 'categoryId'>>
  ): Promise<CategoryPreference> {
    const prefs = await this.getOrCreatePreferences(userId);
    const category = this.categories.get(categoryId);

    if (!category) {
      throw new Error(`Category not found: ${categoryId}`);
    }

    // Don't allow disabling mandatory categories
    if (!category.allowDisable && updates.enabled === false) {
      throw new Error(`Category ${categoryId} cannot be disabled`);
    }

    let catPref = prefs.categories.find(c => c.categoryId === categoryId);

    if (!catPref) {
      catPref = {
        categoryId,
        enabled: category.defaultEnabled,
        channels: { ...category.defaultChannels },
        frequency: 'instant',
        digest: false,
      };
      prefs.categories.push(catPref);
    }

    Object.assign(catPref, updates);
    prefs.updatedAt = new Date();
    this.db.set(userId, prefs);

    return catPref;
  }

  // Update quiet hours
  async updateQuietHours(
    userId: string,
    quietHours: Partial<QuietHours>
  ): Promise<QuietHours> {
    const prefs = await this.getOrCreatePreferences(userId);
    prefs.quietHours = { ...prefs.quietHours, ...quietHours };
    prefs.updatedAt = new Date();
    this.db.set(userId, prefs);
    return prefs.quietHours;
  }

  // Update digest settings
  async updateDigestSettings(
    userId: string,
    digestSettings: Partial<NotificationPreferences['digestSettings']>
  ): Promise<NotificationPreferences['digestSettings']> {
    const prefs = await this.getOrCreatePreferences(userId);
    prefs.digestSettings = { ...prefs.digestSettings, ...digestSettings };
    prefs.updatedAt = new Date();
    this.db.set(userId, prefs);
    return prefs.digestSettings;
  }

  // Check if notification should be delivered
  async shouldDeliver(
    userId: string,
    categoryId: string,
    channel: keyof ChannelPreferences,
    isUrgent: boolean = false
  ): Promise<DeliveryDecision> {
    const prefs = await this.getPreferences(userId);

    if (!prefs) {
      return { shouldDeliver: true, channel, reason: 'No preferences set, using defaults' };
    }

    // Check global enabled
    if (!prefs.globalEnabled) {
      return { shouldDeliver: false, channel: null, reason: 'Notifications globally disabled' };
    }

    // Check channel enabled globally
    if (!prefs.channels[channel]) {
      return { shouldDeliver: false, channel: null, reason: `Channel ${channel} globally disabled` };
    }

    // Check category preference
    const catPref = prefs.categories.find(c => c.categoryId === categoryId);
    if (catPref) {
      if (!catPref.enabled) {
        return { shouldDeliver: false, channel: null, reason: `Category ${categoryId} disabled` };
      }
      if (!catPref.channels[channel]) {
        return { shouldDeliver: false, channel: null, reason: `Channel ${channel} disabled for category` };
      }

      // Check if should be added to digest
      if (catPref.digest && catPref.frequency !== 'instant') {
        return {
          shouldDeliver: false,
          channel: null,
          reason: 'Added to digest',
          addToDigest: true,
        };
      }
    }

    // Check quiet hours
    if (prefs.quietHours.enabled) {
      const inQuietHours = this.isInQuietHours(prefs.quietHours);
      if (inQuietHours) {
        if (isUrgent && prefs.quietHours.allowUrgent) {
          return { shouldDeliver: true, channel, reason: 'Urgent notification during quiet hours' };
        }

        const nextActiveTime = this.getNextActiveTime(prefs.quietHours);
        return {
          shouldDeliver: false,
          channel: null,
          reason: 'In quiet hours',
          delayUntil: nextActiveTime,
        };
      }
    }

    return { shouldDeliver: true, channel, reason: 'All checks passed' };
  }

  // Check delivery for all channels
  async getDeliveryChannels(
    userId: string,
    categoryId: string,
    isUrgent: boolean = false
  ): Promise<{ channel: keyof ChannelPreferences; shouldDeliver: boolean }[]> {
    const channels: (keyof ChannelPreferences)[] = ['email', 'push', 'sms', 'inApp'];
    const results = await Promise.all(
      channels.map(async channel => ({
        channel,
        shouldDeliver: (await this.shouldDeliver(userId, categoryId, channel, isUrgent)).shouldDeliver,
      }))
    );
    return results;
  }

  // Add notification to digest queue
  async addToDigest(
    userId: string,
    categoryId: string,
    title: string,
    body: string,
    data: Record<string, unknown> = {}
  ): Promise<void> {
    const key = `${userId}:${categoryId}`;
    const items = this.digestQueue.get(key) || [];

    items.push({
      id: this.generateToken(),
      userId,
      categoryId,
      title,
      body,
      data,
      createdAt: new Date(),
    });

    this.digestQueue.set(key, items);
  }

  // Get digest items for user
  async getDigestItems(userId: string): Promise<Map<string, DigestItem[]>> {
    const result = new Map<string, DigestItem[]>();

    for (const [key, items] of this.digestQueue.entries()) {
      if (key.startsWith(`${userId}:`)) {
        const categoryId = key.split(':')[1];
        result.set(categoryId, items);
      }
    }

    return result;
  }

  // Clear digest items after sending
  async clearDigest(userId: string): Promise<void> {
    for (const key of this.digestQueue.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.digestQueue.delete(key);
      }
    }
  }

  // Unsubscribe via token
  async unsubscribeByToken(
    token: string,
    categoryId?: string
  ): Promise<{ success: boolean; userId?: string }> {
    for (const [userId, prefs] of this.db.entries()) {
      if (prefs.unsubscribeToken === token) {
        if (categoryId) {
          const category = this.categories.get(categoryId);
          if (category && category.allowDisable) {
            await this.updateCategoryPreference(userId, categoryId, { enabled: false });
          }
        } else {
          // Unsubscribe from all non-mandatory categories
          for (const cat of this.categories.values()) {
            if (cat.allowDisable) {
              await this.updateCategoryPreference(userId, cat.id, { enabled: false });
            }
          }
        }
        return { success: true, userId };
      }
    }
    return { success: false };
  }

  // Get all categories
  getCategories(): NotificationCategory[] {
    return Array.from(this.categories.values());
  }

  // Get categories grouped
  getCategoriesGrouped(): Map<string, NotificationCategory[]> {
    const grouped = new Map<string, NotificationCategory[]>();

    for (const cat of this.categories.values()) {
      const group = grouped.get(cat.group) || [];
      group.push(cat);
      grouped.set(cat.group, group);
    }

    return grouped;
  }

  // Export preferences (GDPR)
  async exportPreferences(userId: string): Promise<object> {
    const prefs = await this.getPreferences(userId);
    const digestItems = await this.getDigestItems(userId);

    return {
      preferences: prefs,
      pendingDigestItems: Object.fromEntries(digestItems),
      categories: this.getCategories(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Helper methods
  private async getOrCreatePreferences(userId: string): Promise<NotificationPreferences> {
    let prefs = await this.getPreferences(userId);
    if (!prefs) {
      prefs = await this.createDefaultPreferences(userId);
    }
    return prefs;
  }

  private isInQuietHours(quietHours: QuietHours): boolean {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: quietHours.timezone }));
    const dayOfWeek = userTime.getDay();
    const currentTime = `${userTime.getHours().toString().padStart(2, '0')}:${userTime.getMinutes().toString().padStart(2, '0')}`;

    const daySchedule = quietHours.schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (!daySchedule) return false;

    for (const range of daySchedule.ranges) {
      if (range.start <= range.end) {
        // Same day range
        if (currentTime >= range.start && currentTime <= range.end) {
          return true;
        }
      } else {
        // Overnight range (e.g., 22:00 to 08:00)
        if (currentTime >= range.start || currentTime <= range.end) {
          return true;
        }
      }
    }

    return false;
  }

  private getNextActiveTime(quietHours: QuietHours): Date {
    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: quietHours.timezone }));
    const dayOfWeek = userTime.getDay();

    const daySchedule = quietHours.schedule.find(s => s.dayOfWeek === dayOfWeek);
    if (daySchedule && daySchedule.ranges.length > 0) {
      const range = daySchedule.ranges[0];
      const [hours, minutes] = range.end.split(':').map(Number);
      const nextActive = new Date(userTime);
      nextActive.setHours(hours, minutes, 0, 0);

      if (nextActive <= userTime) {
        nextActive.setDate(nextActive.getDate() + 1);
      }

      return nextActive;
    }

    return now;
  }

  private generateToken(): string {
    return Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
```

### Express.js API Routes
```typescript
// routes/notification-preferences.routes.ts
import { Router, Request, Response } from 'express';
import { notificationPreferencesService } from '../services/notification-preferences.service';

const router = Router();

// Get user preferences
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    let prefs = await notificationPreferencesService.getPreferences(userId);

    if (!prefs) {
      prefs = await notificationPreferencesService.createDefaultPreferences(userId);
    }

    res.json({
      success: true,
      data: prefs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get all notification categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const grouped = req.query.grouped === 'true';

    if (grouped) {
      const categories = notificationPreferencesService.getCategoriesGrouped();
      res.json({
        success: true,
        data: Object.fromEntries(categories),
      });
    } else {
      const categories = notificationPreferencesService.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update global preferences
router.patch('/preferences/global', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { globalEnabled, channels } = req.body;

    const prefs = await notificationPreferencesService.updateGlobalPreferences(
      userId,
      { globalEnabled, channels }
    );

    res.json({
      success: true,
      data: prefs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update category preference
router.patch('/preferences/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId } = req.params;
    const updates = req.body;

    const catPref = await notificationPreferencesService.updateCategoryPreference(
      userId,
      categoryId,
      updates
    );

    res.json({
      success: true,
      data: catPref,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Update quiet hours
router.patch('/preferences/quiet-hours', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const quietHours = await notificationPreferencesService.updateQuietHours(
      userId,
      req.body
    );

    res.json({
      success: true,
      data: quietHours,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update digest settings
router.patch('/preferences/digest', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const digestSettings = await notificationPreferencesService.updateDigestSettings(
      userId,
      req.body
    );

    res.json({
      success: true,
      data: digestSettings,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Unsubscribe via token (no auth required)
router.get('/unsubscribe/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { category } = req.query;

    const result = await notificationPreferencesService.unsubscribeByToken(
      token,
      category as string | undefined
    );

    if (result.success) {
      res.json({
        success: true,
        message: category
          ? `Unsubscribed from ${category} notifications`
          : 'Unsubscribed from all non-essential notifications',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Invalid unsubscribe token',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Check delivery status
router.post('/preferences/check-delivery', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { categoryId, isUrgent } = req.body;

    const channels = await notificationPreferencesService.getDeliveryChannels(
      userId,
      categoryId,
      isUrgent
    );

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Export preferences (GDPR)
router.get('/preferences/export', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const exportData = await notificationPreferencesService.exportPreferences(userId);

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Notification Preferences Component
```tsx
// components/NotificationPreferences.tsx
import React, { useState, useEffect } from 'react';

interface ChannelPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  inApp: boolean;
}

interface CategoryPreference {
  categoryId: string;
  enabled: boolean;
  channels: ChannelPreferences;
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly';
  digest: boolean;
}

interface QuietHours {
  enabled: boolean;
  timezone: string;
  schedule: { dayOfWeek: number; ranges: { start: string; end: string }[] }[];
  allowUrgent: boolean;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  allowDisable: boolean;
  group: string;
}

interface NotificationPreferences {
  globalEnabled: boolean;
  channels: ChannelPreferences;
  categories: CategoryPreference[];
  quietHours: QuietHours;
  digestSettings: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    dayOfWeek?: number;
    timeOfDay: string;
    timezone: string;
  };
}

const CHANNEL_LABELS: Record<keyof ChannelPreferences, { label: string; icon: string }> = {
  email: { label: 'Email', icon: '📧' },
  push: { label: 'Push', icon: '🔔' },
  sms: { label: 'SMS', icon: '📱' },
  inApp: { label: 'In-App', icon: '💬' },
};

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const NotificationPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [categories, setCategories] = useState<Record<string, NotificationCategory[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'channels' | 'schedule'>('categories');

  useEffect(() => {
    loadPreferences();
    loadCategories();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();
      if (data.success) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/notifications/categories?grouped=true');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const updateGlobalEnabled = async (enabled: boolean) => {
    setSaving(true);
    try {
      await fetch('/api/notifications/preferences/global', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalEnabled: enabled }),
      });
      setPreferences(prev => prev ? { ...prev, globalEnabled: enabled } : null);
    } finally {
      setSaving(false);
    }
  };

  const updateChannel = async (channel: keyof ChannelPreferences, enabled: boolean) => {
    setSaving(true);
    try {
      await fetch('/api/notifications/preferences/global', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels: { [channel]: enabled } }),
      });
      setPreferences(prev => prev ? {
        ...prev,
        channels: { ...prev.channels, [channel]: enabled },
      } : null);
    } finally {
      setSaving(false);
    }
  };

  const updateCategoryPreference = async (
    categoryId: string,
    updates: Partial<CategoryPreference>
  ) => {
    setSaving(true);
    try {
      await fetch(`/api/notifications/preferences/category/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setPreferences(prev => {
        if (!prev) return null;
        const updatedCategories = prev.categories.map(cat =>
          cat.categoryId === categoryId ? { ...cat, ...updates } : cat
        );
        return { ...prev, categories: updatedCategories };
      });
    } finally {
      setSaving(false);
    }
  };

  const updateQuietHours = async (updates: Partial<QuietHours>) => {
    setSaving(true);
    try {
      await fetch('/api/notifications/preferences/quiet-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      setPreferences(prev => prev ? {
        ...prev,
        quietHours: { ...prev.quietHours, ...updates },
      } : null);
    } finally {
      setSaving(false);
    }
  };

  const getCategoryPreference = (categoryId: string): CategoryPreference | undefined => {
    return preferences?.categories.find(c => c.categoryId === categoryId);
  };

  if (loading) {
    return <div className="preferences-loading">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="preferences-error">Failed to load preferences</div>;
  }

  return (
    <div className="notification-preferences">
      <div className="preferences-header">
        <h2>Notification Preferences</h2>
        <label className="global-toggle">
          <input
            type="checkbox"
            checked={preferences.globalEnabled}
            onChange={e => updateGlobalEnabled(e.target.checked)}
            disabled={saving}
          />
          <span>Enable notifications</span>
        </label>
      </div>

      {!preferences.globalEnabled && (
        <div className="preferences-disabled-notice">
          All notifications are currently disabled. Enable notifications to customize your preferences.
        </div>
      )}

      <div className="preferences-tabs">
        <button
          className={activeTab === 'categories' ? 'active' : ''}
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button
          className={activeTab === 'channels' ? 'active' : ''}
          onClick={() => setActiveTab('channels')}
        >
          Channels
        </button>
        <button
          className={activeTab === 'schedule' ? 'active' : ''}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="categories-section">
          {Object.entries(categories).map(([group, cats]) => (
            <div key={group} className="category-group">
              <h3>{group}</h3>
              {cats.map(cat => {
                const pref = getCategoryPreference(cat.id);
                return (
                  <div key={cat.id} className="category-item">
                    <div className="category-header">
                      <label className="category-toggle">
                        <input
                          type="checkbox"
                          checked={pref?.enabled ?? true}
                          onChange={e => updateCategoryPreference(cat.id, { enabled: e.target.checked })}
                          disabled={saving || !cat.allowDisable || !preferences.globalEnabled}
                        />
                        <span className="category-name">{cat.name}</span>
                      </label>
                      {!cat.allowDisable && (
                        <span className="required-badge">Required</span>
                      )}
                    </div>
                    <p className="category-description">{cat.description}</p>

                    {pref?.enabled && (
                      <div className="category-channels">
                        {(Object.keys(CHANNEL_LABELS) as (keyof ChannelPreferences)[]).map(channel => (
                          <label key={channel} className="channel-toggle">
                            <input
                              type="checkbox"
                              checked={pref.channels[channel]}
                              onChange={e => updateCategoryPreference(cat.id, {
                                channels: { ...pref.channels, [channel]: e.target.checked },
                              })}
                              disabled={saving || !preferences.channels[channel]}
                            />
                            <span>{CHANNEL_LABELS[channel].icon} {CHANNEL_LABELS[channel].label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'channels' && (
        <div className="channels-section">
          <h3>Global Channel Settings</h3>
          <p>Enable or disable notification channels across all categories.</p>

          {(Object.keys(CHANNEL_LABELS) as (keyof ChannelPreferences)[]).map(channel => (
            <div key={channel} className="channel-setting">
              <label>
                <input
                  type="checkbox"
                  checked={preferences.channels[channel]}
                  onChange={e => updateChannel(channel, e.target.checked)}
                  disabled={saving || !preferences.globalEnabled}
                />
                <span className="channel-icon">{CHANNEL_LABELS[channel].icon}</span>
                <span className="channel-label">{CHANNEL_LABELS[channel].label}</span>
              </label>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="schedule-section">
          <h3>Quiet Hours</h3>
          <p>Set times when you don't want to receive notifications.</p>

          <label className="quiet-hours-toggle">
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={e => updateQuietHours({ enabled: e.target.checked })}
              disabled={saving || !preferences.globalEnabled}
            />
            <span>Enable quiet hours</span>
          </label>

          {preferences.quietHours.enabled && (
            <>
              <div className="timezone-select">
                <label>Timezone</label>
                <select
                  value={preferences.quietHours.timezone}
                  onChange={e => updateQuietHours({ timezone: e.target.value })}
                  disabled={saving}
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div className="schedule-grid">
                {DAYS_OF_WEEK.map((day, index) => {
                  const daySchedule = preferences.quietHours.schedule.find(
                    s => s.dayOfWeek === index
                  );
                  const range = daySchedule?.ranges[0];

                  return (
                    <div key={day} className="day-schedule">
                      <span className="day-name">{day}</span>
                      <input
                        type="time"
                        value={range?.start || '22:00'}
                        onChange={e => {
                          const newSchedule = preferences.quietHours.schedule.map(s =>
                            s.dayOfWeek === index
                              ? { ...s, ranges: [{ ...s.ranges[0], start: e.target.value }] }
                              : s
                          );
                          updateQuietHours({ schedule: newSchedule });
                        }}
                        disabled={saving}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={range?.end || '08:00'}
                        onChange={e => {
                          const newSchedule = preferences.quietHours.schedule.map(s =>
                            s.dayOfWeek === index
                              ? { ...s, ranges: [{ ...s.ranges[0], end: e.target.value }] }
                              : s
                          );
                          updateQuietHours({ schedule: newSchedule });
                        }}
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>

              <label className="allow-urgent-toggle">
                <input
                  type="checkbox"
                  checked={preferences.quietHours.allowUrgent}
                  onChange={e => updateQuietHours({ allowUrgent: e.target.checked })}
                  disabled={saving}
                />
                <span>Allow urgent notifications during quiet hours</span>
              </label>
            </>
          )}
        </div>
      )}

      {saving && <div className="saving-indicator">Saving...</div>}
    </div>
  );
};
```

### Python FastAPI Implementation
```python
# notification_preferences.py
from datetime import datetime, time
from typing import Optional, Dict, List, Any
from enum import Enum
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Depends
import pytz

router = APIRouter(prefix="/notifications", tags=["notifications"])

class Frequency(str, Enum):
    INSTANT = "instant"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"

class DigestFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"

class TimeRange(BaseModel):
    start: str  # HH:MM format
    end: str

class DaySchedule(BaseModel):
    day_of_week: int  # 0-6
    ranges: List[TimeRange]

class ChannelPreferences(BaseModel):
    email: bool = True
    push: bool = True
    sms: bool = False
    in_app: bool = True

class QuietHours(BaseModel):
    enabled: bool = False
    timezone: str = "UTC"
    schedule: List[DaySchedule] = []
    allow_urgent: bool = True

class DigestSettings(BaseModel):
    enabled: bool = False
    frequency: DigestFrequency = DigestFrequency.DAILY
    day_of_week: Optional[int] = None
    time_of_day: str = "09:00"
    timezone: str = "UTC"

class CategoryPreference(BaseModel):
    category_id: str
    enabled: bool = True
    channels: ChannelPreferences = Field(default_factory=ChannelPreferences)
    frequency: Frequency = Frequency.INSTANT
    digest: bool = False

class NotificationPreferences(BaseModel):
    user_id: str
    global_enabled: bool = True
    channels: ChannelPreferences = Field(default_factory=ChannelPreferences)
    categories: List[CategoryPreference] = []
    quiet_hours: QuietHours = Field(default_factory=QuietHours)
    digest_settings: DigestSettings = Field(default_factory=DigestSettings)
    unsubscribe_token: str
    created_at: datetime
    updated_at: datetime

class NotificationCategory(BaseModel):
    id: str
    name: str
    description: str
    default_enabled: bool
    default_channels: ChannelPreferences
    allow_disable: bool
    group: str

class DeliveryDecision(BaseModel):
    should_deliver: bool
    channel: Optional[str]
    reason: str
    delay_until: Optional[datetime] = None
    add_to_digest: bool = False

class NotificationPreferencesService:
    def __init__(self):
        self.db: Dict[str, NotificationPreferences] = {}
        self.categories: Dict[str, NotificationCategory] = {}
        self.digest_queue: Dict[str, List[Dict[str, Any]]] = {}
        self._init_default_categories()

    def _init_default_categories(self):
        default_categories = [
            NotificationCategory(
                id="security_alerts",
                name="Security Alerts",
                description="Login attempts, password changes, and security notifications",
                default_enabled=True,
                default_channels=ChannelPreferences(email=True, push=True, sms=True, in_app=True),
                allow_disable=False,
                group="Account & Security"
            ),
            NotificationCategory(
                id="account_updates",
                name="Account Updates",
                description="Profile changes, billing updates, and account activity",
                default_enabled=True,
                default_channels=ChannelPreferences(email=True, push=False, sms=False, in_app=True),
                allow_disable=True,
                group="Account & Security"
            ),
            NotificationCategory(
                id="direct_messages",
                name="Direct Messages",
                description="New messages from other users",
                default_enabled=True,
                default_channels=ChannelPreferences(email=True, push=True, sms=False, in_app=True),
                allow_disable=True,
                group="Communication"
            ),
            NotificationCategory(
                id="mentions",
                name="Mentions",
                description="When someone mentions you in a post or comment",
                default_enabled=True,
                default_channels=ChannelPreferences(email=False, push=True, sms=False, in_app=True),
                allow_disable=True,
                group="Communication"
            ),
            NotificationCategory(
                id="order_updates",
                name="Order Updates",
                description="Order confirmations, shipping, and delivery updates",
                default_enabled=True,
                default_channels=ChannelPreferences(email=True, push=True, sms=True, in_app=True),
                allow_disable=False,
                group="Transactions"
            ),
            NotificationCategory(
                id="promotions",
                name="Promotions & Offers",
                description="Special deals, discounts, and promotional content",
                default_enabled=False,
                default_channels=ChannelPreferences(email=True, push=False, sms=False, in_app=False),
                allow_disable=True,
                group="Marketing"
            ),
        ]

        for cat in default_categories:
            self.categories[cat.id] = cat

    def _generate_token(self) -> str:
        import secrets
        return secrets.token_urlsafe(24)

    async def create_default_preferences(self, user_id: str) -> NotificationPreferences:
        category_prefs = [
            CategoryPreference(
                category_id=cat.id,
                enabled=cat.default_enabled,
                channels=cat.default_channels.model_copy(),
                frequency=Frequency.INSTANT,
                digest=False
            )
            for cat in self.categories.values()
        ]

        default_schedule = [
            DaySchedule(day_of_week=i, ranges=[TimeRange(start="22:00", end="08:00")])
            for i in range(7)
        ]

        prefs = NotificationPreferences(
            user_id=user_id,
            global_enabled=True,
            channels=ChannelPreferences(),
            categories=category_prefs,
            quiet_hours=QuietHours(schedule=default_schedule),
            digest_settings=DigestSettings(),
            unsubscribe_token=self._generate_token(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self.db[user_id] = prefs
        return prefs

    async def get_preferences(self, user_id: str) -> Optional[NotificationPreferences]:
        return self.db.get(user_id)

    async def get_or_create_preferences(self, user_id: str) -> NotificationPreferences:
        prefs = await self.get_preferences(user_id)
        if not prefs:
            prefs = await self.create_default_preferences(user_id)
        return prefs

    async def update_global_preferences(
        self,
        user_id: str,
        global_enabled: Optional[bool] = None,
        channels: Optional[ChannelPreferences] = None
    ) -> NotificationPreferences:
        prefs = await self.get_or_create_preferences(user_id)

        if global_enabled is not None:
            prefs.global_enabled = global_enabled
        if channels:
            prefs.channels = channels

        prefs.updated_at = datetime.utcnow()
        self.db[user_id] = prefs
        return prefs

    async def update_category_preference(
        self,
        user_id: str,
        category_id: str,
        **updates
    ) -> CategoryPreference:
        prefs = await self.get_or_create_preferences(user_id)
        category = self.categories.get(category_id)

        if not category:
            raise ValueError(f"Category not found: {category_id}")

        if not category.allow_disable and updates.get("enabled") is False:
            raise ValueError(f"Category {category_id} cannot be disabled")

        cat_pref = next(
            (c for c in prefs.categories if c.category_id == category_id),
            None
        )

        if not cat_pref:
            cat_pref = CategoryPreference(
                category_id=category_id,
                enabled=category.default_enabled,
                channels=category.default_channels.model_copy()
            )
            prefs.categories.append(cat_pref)

        for key, value in updates.items():
            if hasattr(cat_pref, key):
                setattr(cat_pref, key, value)

        prefs.updated_at = datetime.utcnow()
        self.db[user_id] = prefs
        return cat_pref

    def _is_in_quiet_hours(self, quiet_hours: QuietHours) -> bool:
        if not quiet_hours.enabled:
            return False

        try:
            tz = pytz.timezone(quiet_hours.timezone)
        except Exception:
            tz = pytz.UTC

        now = datetime.now(tz)
        day_of_week = now.weekday()
        # Convert Python weekday (Mon=0) to JS weekday (Sun=0)
        js_day = (day_of_week + 1) % 7

        current_time = now.strftime("%H:%M")

        day_schedule = next(
            (s for s in quiet_hours.schedule if s.day_of_week == js_day),
            None
        )

        if not day_schedule:
            return False

        for time_range in day_schedule.ranges:
            if time_range.start <= time_range.end:
                if time_range.start <= current_time <= time_range.end:
                    return True
            else:
                if current_time >= time_range.start or current_time <= time_range.end:
                    return True

        return False

    async def should_deliver(
        self,
        user_id: str,
        category_id: str,
        channel: str,
        is_urgent: bool = False
    ) -> DeliveryDecision:
        prefs = await self.get_preferences(user_id)

        if not prefs:
            return DeliveryDecision(
                should_deliver=True,
                channel=channel,
                reason="No preferences set, using defaults"
            )

        if not prefs.global_enabled:
            return DeliveryDecision(
                should_deliver=False,
                channel=None,
                reason="Notifications globally disabled"
            )

        if not getattr(prefs.channels, channel.replace("-", "_"), False):
            return DeliveryDecision(
                should_deliver=False,
                channel=None,
                reason=f"Channel {channel} globally disabled"
            )

        cat_pref = next(
            (c for c in prefs.categories if c.category_id == category_id),
            None
        )

        if cat_pref:
            if not cat_pref.enabled:
                return DeliveryDecision(
                    should_deliver=False,
                    channel=None,
                    reason=f"Category {category_id} disabled"
                )

            channel_attr = channel.replace("-", "_")
            if not getattr(cat_pref.channels, channel_attr, False):
                return DeliveryDecision(
                    should_deliver=False,
                    channel=None,
                    reason=f"Channel {channel} disabled for category"
                )

            if cat_pref.digest and cat_pref.frequency != Frequency.INSTANT:
                return DeliveryDecision(
                    should_deliver=False,
                    channel=None,
                    reason="Added to digest",
                    add_to_digest=True
                )

        if self._is_in_quiet_hours(prefs.quiet_hours):
            if is_urgent and prefs.quiet_hours.allow_urgent:
                return DeliveryDecision(
                    should_deliver=True,
                    channel=channel,
                    reason="Urgent notification during quiet hours"
                )

            return DeliveryDecision(
                should_deliver=False,
                channel=None,
                reason="In quiet hours"
            )

        return DeliveryDecision(
            should_deliver=True,
            channel=channel,
            reason="All checks passed"
        )

    def get_categories(self) -> List[NotificationCategory]:
        return list(self.categories.values())

    def get_categories_grouped(self) -> Dict[str, List[NotificationCategory]]:
        grouped: Dict[str, List[NotificationCategory]] = {}
        for cat in self.categories.values():
            if cat.group not in grouped:
                grouped[cat.group] = []
            grouped[cat.group].append(cat)
        return grouped


# Initialize service
preferences_service = NotificationPreferencesService()


# API Routes
@router.get("/preferences")
async def get_preferences(user_id: str = Depends(get_current_user_id)):
    prefs = await preferences_service.get_or_create_preferences(user_id)
    return {"success": True, "data": prefs}


@router.get("/categories")
async def get_categories(grouped: bool = False):
    if grouped:
        return {"success": True, "data": preferences_service.get_categories_grouped()}
    return {"success": True, "data": preferences_service.get_categories()}


@router.patch("/preferences/global")
async def update_global_preferences(
    global_enabled: Optional[bool] = None,
    channels: Optional[ChannelPreferences] = None,
    user_id: str = Depends(get_current_user_id)
):
    prefs = await preferences_service.update_global_preferences(
        user_id, global_enabled, channels
    )
    return {"success": True, "data": prefs}


@router.patch("/preferences/category/{category_id}")
async def update_category_preference(
    category_id: str,
    enabled: Optional[bool] = None,
    channels: Optional[ChannelPreferences] = None,
    frequency: Optional[Frequency] = None,
    digest: Optional[bool] = None,
    user_id: str = Depends(get_current_user_id)
):
    updates = {}
    if enabled is not None:
        updates["enabled"] = enabled
    if channels is not None:
        updates["channels"] = channels
    if frequency is not None:
        updates["frequency"] = frequency
    if digest is not None:
        updates["digest"] = digest

    try:
        cat_pref = await preferences_service.update_category_preference(
            user_id, category_id, **updates
        )
        return {"success": True, "data": cat_pref}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/preferences/check-delivery")
async def check_delivery(
    category_id: str,
    channel: str,
    is_urgent: bool = False,
    user_id: str = Depends(get_current_user_id)
):
    decision = await preferences_service.should_deliver(
        user_id, category_id, channel, is_urgent
    )
    return {"success": True, "data": decision}


def get_current_user_id() -> str:
    # Placeholder - implement actual auth
    return "user_123"
```

## CLAUDE.md Integration
```markdown
## Notification Preferences Commands

### Check delivery status
"Check if user can receive email notifications for category X"
"Which channels are enabled for direct_messages?"
"Is the user in quiet hours right now?"

### Manage preferences
"Disable push notifications globally for user"
"Enable email digest for marketing notifications"
"Set quiet hours from 10pm to 7am"

### Common operations
- Get user notification preferences
- Update category-specific channel settings
- Configure quiet hours schedule
- Enable/disable notification digest
- Export preferences for GDPR
```

## AI Suggestions
1. Add A/B testing for notification frequency optimization
2. Implement smart notification batching based on user engagement
3. Add machine learning to predict optimal delivery times
4. Create notification fatigue detection and auto-adjustment
5. Build cross-device preference sync
6. Add notification importance scoring
7. Implement gradual notification reduction for inactive users
8. Create preference templates for common user types
9. Add notification analytics dashboard
10. Build preference migration tools for platform changes
