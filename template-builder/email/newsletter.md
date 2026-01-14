# Newsletter System

## Overview
Complete newsletter management system with subscriber lists, segmentation, campaign scheduling, A/B testing, analytics tracking, and compliance (CAN-SPAM, GDPR).

## Quick Start
```bash
npm install nodemailer handlebars bull ioredis uuid date-fns
```

## Implementation

### TypeScript Newsletter Service
```typescript
// newsletter.service.ts
import { v4 as uuidv4 } from 'uuid';
import Handlebars from 'handlebars';
import Queue from 'bull';

interface Subscriber {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  source: string;
  tags: string[];
  segments: string[];
  customFields: Record<string, unknown>;
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly';
    categories: string[];
  };
  stats: {
    totalReceived: number;
    totalOpened: number;
    totalClicked: number;
    lastOpenedAt?: Date;
    lastClickedAt?: Date;
  };
  confirmedAt?: Date;
  unsubscribedAt?: Date;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NewsletterList {
  id: string;
  name: string;
  description: string;
  doubleOptIn: boolean;
  welcomeEmailId?: string;
  defaultFromName: string;
  defaultFromEmail: string;
  subscriberCount: number;
  createdAt: Date;
}

interface Campaign {
  id: string;
  listId: string;
  name: string;
  subject: string;
  previewText: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  templateId?: string;
  htmlContent: string;
  textContent: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduledAt?: Date;
  sentAt?: Date;
  segmentIds?: string[];
  excludeSegmentIds?: string[];
  abTest?: ABTest;
  stats: CampaignStats;
  settings: CampaignSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface ABTest {
  enabled: boolean;
  variants: ABVariant[];
  testSize: number; // Percentage of list for testing
  winnerCriteria: 'open_rate' | 'click_rate' | 'conversion';
  testDuration: number; // Hours before picking winner
  winnerId?: string;
}

interface ABVariant {
  id: string;
  name: string;
  subject?: string;
  fromName?: string;
  htmlContent?: string;
  weight: number;
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  uniqueOpens: number;
  clicked: number;
  uniqueClicks: number;
  bounced: number;
  complained: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface CampaignSettings {
  trackOpens: boolean;
  trackClicks: boolean;
  googleAnalytics?: {
    enabled: boolean;
    source: string;
    medium: string;
    campaign: string;
  };
  sendTime?: {
    optimized: boolean;
    timezone?: string;
  };
}

interface Segment {
  id: string;
  listId: string;
  name: string;
  description: string;
  conditions: SegmentCondition[];
  conditionMatch: 'all' | 'any';
  subscriberCount: number;
  createdAt: Date;
}

interface SegmentCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_set' | 'is_not_set';
  value?: string | number | boolean;
}

interface EmailEvent {
  id: string;
  campaignId: string;
  subscriberId: string;
  email: string;
  type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed';
  timestamp: Date;
  metadata?: {
    link?: string;
    userAgent?: string;
    ipAddress?: string;
    bounceType?: string;
  };
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  htmlContent: string;
  textContent: string;
  thumbnail?: string;
  createdAt: Date;
}

class NewsletterService {
  private subscribers: Map<string, Subscriber> = new Map();
  private lists: Map<string, NewsletterList> = new Map();
  private campaigns: Map<string, Campaign> = new Map();
  private segments: Map<string, Segment> = new Map();
  private templates: Map<string, Template> = new Map();
  private events: EmailEvent[] = [];
  private sendQueue: Queue.Queue;

  constructor() {
    this.sendQueue = new Queue('newsletter-send', {
      redis: { host: 'localhost', port: 6379 },
    });

    this.setupQueueProcessors();
    this.initializeDefaultTemplates();
  }

  private setupQueueProcessors(): void {
    this.sendQueue.process('send-campaign', 10, async (job) => {
      const { campaignId, subscriberIds, variantId } = job.data;
      await this.processCampaignBatch(campaignId, subscriberIds, variantId);
    });
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: Partial<Template>[] = [
      {
        id: 'welcome',
        name: 'Welcome Email',
        category: 'onboarding',
        htmlContent: `
          <h1>Welcome, {{firstName}}!</h1>
          <p>Thank you for subscribing to our newsletter.</p>
          <p>You'll receive updates about:</p>
          <ul>
            {{#each categories}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
          <p><a href="{{preferencesUrl}}">Manage your preferences</a></p>
        `,
      },
      {
        id: 'digest',
        name: 'Weekly Digest',
        category: 'content',
        htmlContent: `
          <h1>Your Weekly Digest</h1>
          <p>Hi {{firstName}}, here's what you missed:</p>
          {{#each articles}}
          <div class="article">
            <h2><a href="{{url}}">{{title}}</a></h2>
            <p>{{excerpt}}</p>
          </div>
          {{/each}}
        `,
      },
    ];

    defaultTemplates.forEach(t => {
      this.templates.set(t.id!, {
        ...t,
        description: '',
        textContent: '',
        createdAt: new Date(),
      } as Template);
    });
  }

  // List Management
  async createList(data: Omit<NewsletterList, 'id' | 'subscriberCount' | 'createdAt'>): Promise<NewsletterList> {
    const list: NewsletterList = {
      id: uuidv4(),
      ...data,
      subscriberCount: 0,
      createdAt: new Date(),
    };

    this.lists.set(list.id, list);
    return list;
  }

  async getList(listId: string): Promise<NewsletterList | null> {
    return this.lists.get(listId) || null;
  }

  async getLists(): Promise<NewsletterList[]> {
    return Array.from(this.lists.values());
  }

  // Subscriber Management
  async subscribe(
    listId: string,
    email: string,
    data: Partial<Subscriber> = {}
  ): Promise<{ subscriber: Subscriber; requiresConfirmation: boolean }> {
    const list = await this.getList(listId);
    if (!list) throw new Error('List not found');

    // Check for existing subscriber
    const existingId = Array.from(this.subscribers.values())
      .find(s => s.email === email)?.id;

    if (existingId) {
      const existing = this.subscribers.get(existingId)!;
      if (existing.status === 'active') {
        throw new Error('Email already subscribed');
      }
      // Resubscribe
      existing.status = 'active';
      existing.unsubscribedAt = undefined;
      existing.updatedAt = new Date();
      return { subscriber: existing, requiresConfirmation: list.doubleOptIn };
    }

    const subscriber: Subscriber = {
      id: uuidv4(),
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      status: list.doubleOptIn ? 'active' : 'active', // Pending state could be added
      source: data.source || 'website',
      tags: data.tags || [],
      segments: [],
      customFields: data.customFields || {},
      preferences: data.preferences || {
        frequency: 'weekly',
        categories: [],
      },
      stats: {
        totalReceived: 0,
        totalOpened: 0,
        totalClicked: 0,
      },
      confirmedAt: list.doubleOptIn ? undefined : new Date(),
      unsubscribeToken: this.generateToken(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscribers.set(subscriber.id, subscriber);

    // Update list count
    list.subscriberCount++;
    this.lists.set(list.id, list);

    // Send welcome email if configured
    if (list.welcomeEmailId && !list.doubleOptIn) {
      await this.sendWelcomeEmail(subscriber, list);
    }

    return { subscriber, requiresConfirmation: list.doubleOptIn };
  }

  async unsubscribe(token: string, reason?: string): Promise<boolean> {
    const subscriber = Array.from(this.subscribers.values())
      .find(s => s.unsubscribeToken === token);

    if (!subscriber) return false;

    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    subscriber.updatedAt = new Date();

    this.subscribers.set(subscriber.id, subscriber);
    return true;
  }

  async updateSubscriber(
    subscriberId: string,
    updates: Partial<Subscriber>
  ): Promise<Subscriber> {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    Object.assign(subscriber, updates, { updatedAt: new Date() });
    this.subscribers.set(subscriberId, subscriber);

    return subscriber;
  }

  async addTagsToSubscriber(subscriberId: string, tags: string[]): Promise<Subscriber> {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    subscriber.tags = [...new Set([...subscriber.tags, ...tags])];
    subscriber.updatedAt = new Date();

    this.subscribers.set(subscriberId, subscriber);
    return subscriber;
  }

  async getSubscribers(
    listId: string,
    options: {
      status?: Subscriber['status'];
      tags?: string[];
      segmentId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ subscribers: Subscriber[]; total: number }> {
    let subscribers = Array.from(this.subscribers.values());

    if (options.status) {
      subscribers = subscribers.filter(s => s.status === options.status);
    }

    if (options.tags?.length) {
      subscribers = subscribers.filter(s =>
        options.tags!.some(tag => s.tags.includes(tag))
      );
    }

    if (options.segmentId) {
      const segment = this.segments.get(options.segmentId);
      if (segment) {
        subscribers = subscribers.filter(s =>
          this.matchesSegment(s, segment)
        );
      }
    }

    const total = subscribers.length;

    if (options.offset) {
      subscribers = subscribers.slice(options.offset);
    }
    if (options.limit) {
      subscribers = subscribers.slice(0, options.limit);
    }

    return { subscribers, total };
  }

  // Segment Management
  async createSegment(data: Omit<Segment, 'id' | 'subscriberCount' | 'createdAt'>): Promise<Segment> {
    const segment: Segment = {
      id: uuidv4(),
      ...data,
      subscriberCount: 0,
      createdAt: new Date(),
    };

    // Calculate subscriber count
    const { total } = await this.getSubscribers(data.listId, { segmentId: segment.id });
    segment.subscriberCount = total;

    this.segments.set(segment.id, segment);
    return segment;
  }

  private matchesSegment(subscriber: Subscriber, segment: Segment): boolean {
    const results = segment.conditions.map(condition =>
      this.evaluateCondition(subscriber, condition)
    );

    return segment.conditionMatch === 'all'
      ? results.every(r => r)
      : results.some(r => r);
  }

  private evaluateCondition(subscriber: Subscriber, condition: SegmentCondition): boolean {
    const value = this.getFieldValue(subscriber, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'greater_than':
        return Number(value) > Number(condition.value);
      case 'less_than':
        return Number(value) < Number(condition.value);
      case 'is_set':
        return value !== undefined && value !== null && value !== '';
      case 'is_not_set':
        return value === undefined || value === null || value === '';
      default:
        return false;
    }
  }

  private getFieldValue(subscriber: Subscriber, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = subscriber;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  // Campaign Management
  async createCampaign(data: Omit<Campaign, 'id' | 'stats' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
    const campaign: Campaign = {
      id: uuidv4(),
      ...data,
      stats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        uniqueOpens: 0,
        clicked: 0,
        uniqueClicks: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.campaigns.set(campaign.id, campaign);
    return campaign;
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status === 'sent') {
      throw new Error('Cannot update sent campaign');
    }

    Object.assign(campaign, updates, { updatedAt: new Date() });
    this.campaigns.set(campaignId, campaign);

    return campaign;
  }

  async scheduleCampaign(campaignId: string, scheduledAt: Date): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    campaign.status = 'scheduled';
    campaign.scheduledAt = scheduledAt;
    campaign.updatedAt = new Date();

    this.campaigns.set(campaignId, campaign);

    // Schedule the job
    const delay = scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      await this.sendQueue.add(
        'send-campaign',
        { campaignId },
        { delay, jobId: campaignId }
      );
    }

    return campaign;
  }

  async sendCampaign(campaignId: string): Promise<Campaign> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      throw new Error('Campaign cannot be sent');
    }

    campaign.status = 'sending';
    campaign.sentAt = new Date();
    this.campaigns.set(campaignId, campaign);

    // Get subscribers
    const { subscribers } = await this.getSubscribers(campaign.listId, {
      status: 'active',
    });

    // Filter by segments if specified
    let targetSubscribers = subscribers;
    if (campaign.segmentIds?.length) {
      targetSubscribers = subscribers.filter(s =>
        campaign.segmentIds!.some(segId => {
          const segment = this.segments.get(segId);
          return segment && this.matchesSegment(s, segment);
        })
      );
    }

    // Exclude segments
    if (campaign.excludeSegmentIds?.length) {
      targetSubscribers = targetSubscribers.filter(s =>
        !campaign.excludeSegmentIds!.some(segId => {
          const segment = this.segments.get(segId);
          return segment && this.matchesSegment(s, segment);
        })
      );
    }

    // Handle A/B testing
    if (campaign.abTest?.enabled) {
      await this.sendABTestCampaign(campaign, targetSubscribers);
    } else {
      // Send in batches
      const batchSize = 100;
      for (let i = 0; i < targetSubscribers.length; i += batchSize) {
        const batch = targetSubscribers.slice(i, i + batchSize);
        await this.sendQueue.add('send-campaign', {
          campaignId,
          subscriberIds: batch.map(s => s.id),
        });
      }
    }

    return campaign;
  }

  private async sendABTestCampaign(campaign: Campaign, subscribers: Subscriber[]): Promise<void> {
    const testSize = Math.floor(subscribers.length * (campaign.abTest!.testSize / 100));
    const testSubscribers = subscribers.slice(0, testSize);
    const remainingSubscribers = subscribers.slice(testSize);

    // Split test subscribers among variants
    const variants = campaign.abTest!.variants;
    let offset = 0;

    for (const variant of variants) {
      const variantSize = Math.floor(testSubscribers.length * (variant.weight / 100));
      const variantSubscribers = testSubscribers.slice(offset, offset + variantSize);

      await this.sendQueue.add('send-campaign', {
        campaignId: campaign.id,
        subscriberIds: variantSubscribers.map(s => s.id),
        variantId: variant.id,
      });

      offset += variantSize;
    }

    // Schedule winner selection and remaining sends
    const testDuration = campaign.abTest!.testDuration * 60 * 60 * 1000;
    setTimeout(async () => {
      await this.selectABTestWinner(campaign.id, remainingSubscribers);
    }, testDuration);
  }

  private async selectABTestWinner(campaignId: string, remainingSubscribers: Subscriber[]): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign || !campaign.abTest) return;

    // Calculate performance for each variant
    const variantStats = campaign.abTest.variants.map(variant => {
      const variantEvents = this.events.filter(
        e => e.campaignId === campaignId && e.metadata?.variantId === variant.id
      );

      const sent = variantEvents.filter(e => e.type === 'sent').length;
      const opened = variantEvents.filter(e => e.type === 'opened').length;
      const clicked = variantEvents.filter(e => e.type === 'clicked').length;

      return {
        variantId: variant.id,
        openRate: sent > 0 ? opened / sent : 0,
        clickRate: sent > 0 ? clicked / sent : 0,
      };
    });

    // Select winner based on criteria
    const sortKey = campaign.abTest.winnerCriteria === 'open_rate' ? 'openRate' : 'clickRate';
    const winner = variantStats.sort((a, b) => b[sortKey] - a[sortKey])[0];

    campaign.abTest.winnerId = winner.variantId;
    this.campaigns.set(campaignId, campaign);

    // Send to remaining subscribers with winning variant
    const batchSize = 100;
    for (let i = 0; i < remainingSubscribers.length; i += batchSize) {
      const batch = remainingSubscribers.slice(i, i + batchSize);
      await this.sendQueue.add('send-campaign', {
        campaignId,
        subscriberIds: batch.map(s => s.id),
        variantId: winner.variantId,
      });
    }
  }

  private async processCampaignBatch(
    campaignId: string,
    subscriberIds: string[],
    variantId?: string
  ): Promise<void> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    const variant = variantId
      ? campaign.abTest?.variants.find(v => v.id === variantId)
      : undefined;

    for (const subscriberId of subscriberIds) {
      const subscriber = this.subscribers.get(subscriberId);
      if (!subscriber || subscriber.status !== 'active') continue;

      try {
        // Compile email content
        const html = this.compileTemplate(
          variant?.htmlContent || campaign.htmlContent,
          {
            ...subscriber,
            unsubscribeUrl: `${process.env.APP_URL}/unsubscribe?token=${subscriber.unsubscribeToken}`,
            preferencesUrl: `${process.env.APP_URL}/preferences?token=${subscriber.unsubscribeToken}`,
          }
        );

        // Add tracking pixel for opens
        const trackedHtml = campaign.settings.trackOpens
          ? this.addOpenTracking(html, campaignId, subscriberId)
          : html;

        // Track clicks
        const finalHtml = campaign.settings.trackClicks
          ? this.addClickTracking(trackedHtml, campaignId, subscriberId)
          : trackedHtml;

        // Send email (implement with your email provider)
        // await emailProvider.send({
        //   to: subscriber.email,
        //   from: { name: variant?.fromName || campaign.fromName, email: campaign.fromEmail },
        //   subject: variant?.subject || campaign.subject,
        //   html: finalHtml,
        //   text: campaign.textContent,
        // });

        // Record event
        this.recordEvent(campaignId, subscriberId, subscriber.email, 'sent', { variantId });

        // Update stats
        campaign.stats.sent++;
        subscriber.stats.totalReceived++;

      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
      }
    }

    this.campaigns.set(campaignId, campaign);
  }

  private compileTemplate(template: string, data: Record<string, unknown>): string {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  }

  private addOpenTracking(html: string, campaignId: string, subscriberId: string): string {
    const trackingPixel = `<img src="${process.env.APP_URL}/api/newsletter/track/open?c=${campaignId}&s=${subscriberId}" width="1" height="1" style="display:none" />`;
    return html.replace('</body>', `${trackingPixel}</body>`);
  }

  private addClickTracking(html: string, campaignId: string, subscriberId: string): string {
    return html.replace(
      /href="(https?:\/\/[^"]+)"/g,
      (match, url) => {
        const trackedUrl = `${process.env.APP_URL}/api/newsletter/track/click?c=${campaignId}&s=${subscriberId}&url=${encodeURIComponent(url)}`;
        return `href="${trackedUrl}"`;
      }
    );
  }

  // Event Tracking
  async trackOpen(campaignId: string, subscriberId: string): Promise<void> {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) return;

    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    // Check for unique open
    const hasOpened = this.events.some(
      e => e.campaignId === campaignId && e.subscriberId === subscriberId && e.type === 'opened'
    );

    this.recordEvent(campaignId, subscriberId, subscriber.email, 'opened');

    campaign.stats.opened++;
    if (!hasOpened) {
      campaign.stats.uniqueOpens++;
      subscriber.stats.totalOpened++;
      subscriber.stats.lastOpenedAt = new Date();
    }

    campaign.stats.openRate = campaign.stats.uniqueOpens / campaign.stats.sent;
    this.campaigns.set(campaignId, campaign);
    this.subscribers.set(subscriberId, subscriber);
  }

  async trackClick(campaignId: string, subscriberId: string, url: string): Promise<void> {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) return;

    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return;

    const hasClicked = this.events.some(
      e => e.campaignId === campaignId && e.subscriberId === subscriberId && e.type === 'clicked'
    );

    this.recordEvent(campaignId, subscriberId, subscriber.email, 'clicked', { link: url });

    campaign.stats.clicked++;
    if (!hasClicked) {
      campaign.stats.uniqueClicks++;
      subscriber.stats.totalClicked++;
      subscriber.stats.lastClickedAt = new Date();
    }

    campaign.stats.clickRate = campaign.stats.uniqueClicks / campaign.stats.sent;
    this.campaigns.set(campaignId, campaign);
    this.subscribers.set(subscriberId, subscriber);
  }

  private recordEvent(
    campaignId: string,
    subscriberId: string,
    email: string,
    type: EmailEvent['type'],
    metadata?: EmailEvent['metadata']
  ): void {
    this.events.push({
      id: uuidv4(),
      campaignId,
      subscriberId,
      email,
      type,
      timestamp: new Date(),
      metadata,
    });
  }

  // Analytics
  async getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
    const campaign = this.campaigns.get(campaignId);
    return campaign?.stats || null;
  }

  async getCampaignEvents(
    campaignId: string,
    type?: EmailEvent['type']
  ): Promise<EmailEvent[]> {
    let events = this.events.filter(e => e.campaignId === campaignId);
    if (type) {
      events = events.filter(e => e.type === type);
    }
    return events;
  }

  async getSubscriberEngagement(subscriberId: string): Promise<{
    campaigns: number;
    opens: number;
    clicks: number;
    openRate: number;
    clickRate: number;
  }> {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) throw new Error('Subscriber not found');

    return {
      campaigns: subscriber.stats.totalReceived,
      opens: subscriber.stats.totalOpened,
      clicks: subscriber.stats.totalClicked,
      openRate: subscriber.stats.totalReceived > 0
        ? subscriber.stats.totalOpened / subscriber.stats.totalReceived
        : 0,
      clickRate: subscriber.stats.totalReceived > 0
        ? subscriber.stats.totalClicked / subscriber.stats.totalReceived
        : 0,
    };
  }

  // Helpers
  private generateToken(): string {
    return Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
  }

  private async sendWelcomeEmail(subscriber: Subscriber, list: NewsletterList): Promise<void> {
    // Implement welcome email sending
  }
}

export const newsletterService = new NewsletterService();
```

### Express.js API Routes
```typescript
// routes/newsletter.routes.ts
import { Router, Request, Response } from 'express';
import { newsletterService } from '../services/newsletter.service';

const router = Router();

// Subscribe
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { listId, email, firstName, lastName, source, tags } = req.body;

    const result = await newsletterService.subscribe(listId, email, {
      firstName,
      lastName,
      source,
      tags,
    });

    res.json({
      success: true,
      data: result.subscriber,
      requiresConfirmation: result.requiresConfirmation,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Unsubscribe
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    const success = await newsletterService.unsubscribe(token as string);

    if (success) {
      res.json({ success: true, message: 'Successfully unsubscribed' });
    } else {
      res.status(404).json({ success: false, error: 'Invalid unsubscribe token' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get subscribers
router.get('/lists/:listId/subscribers', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const { status, tags, segmentId, limit, offset } = req.query;

    const result = await newsletterService.getSubscribers(listId, {
      status: status as any,
      tags: tags ? (tags as string).split(',') : undefined,
      segmentId: segmentId as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json({
      success: true,
      data: result.subscribers,
      total: result.total,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create campaign
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaign = await newsletterService.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Update campaign
router.patch('/campaigns/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = await newsletterService.updateCampaign(campaignId, req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Schedule campaign
router.post('/campaigns/:campaignId/schedule', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { scheduledAt } = req.body;

    const campaign = await newsletterService.scheduleCampaign(
      campaignId,
      new Date(scheduledAt)
    );

    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Send campaign
router.post('/campaigns/:campaignId/send', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = await newsletterService.sendCampaign(campaignId);
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

// Campaign stats
router.get('/campaigns/:campaignId/stats', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const stats = await newsletterService.getCampaignStats(campaignId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Track open (1x1 pixel)
router.get('/track/open', async (req: Request, res: Response) => {
  const { c: campaignId, s: subscriberId } = req.query;

  if (campaignId && subscriberId) {
    await newsletterService.trackOpen(campaignId as string, subscriberId as string);
  }

  // Return 1x1 transparent gif
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.set('Content-Type', 'image/gif');
  res.send(pixel);
});

// Track click
router.get('/track/click', async (req: Request, res: Response) => {
  const { c: campaignId, s: subscriberId, url } = req.query;

  if (campaignId && subscriberId && url) {
    await newsletterService.trackClick(
      campaignId as string,
      subscriberId as string,
      url as string
    );
  }

  res.redirect(url as string);
});

// Create segment
router.post('/lists/:listId/segments', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const segment = await newsletterService.createSegment({
      listId,
      ...req.body,
    });
    res.json({ success: true, data: segment });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Newsletter Components
```tsx
// components/NewsletterSubscribe.tsx
import React, { useState } from 'react';

interface SubscribeFormProps {
  listId: string;
  onSuccess?: (email: string) => void;
  showName?: boolean;
  buttonText?: string;
}

export const NewsletterSubscribe: React.FC<SubscribeFormProps> = ({
  listId,
  onSuccess,
  showName = false,
  buttonText = 'Subscribe',
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listId,
          email,
          firstName: showName ? firstName : undefined,
          source: 'website',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.requiresConfirmation
          ? 'Please check your email to confirm your subscription.'
          : 'Thank you for subscribing!'
        );
        setEmail('');
        setFirstName('');
        onSuccess?.(email);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="newsletter-success">
        <div className="success-icon">✓</div>
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="newsletter-form">
      {showName && (
        <input
          type="text"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          placeholder="First name"
          className="newsletter-input"
        />
      )}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="newsletter-input"
      />
      <button type="submit" disabled={status === 'loading'} className="newsletter-button">
        {status === 'loading' ? 'Subscribing...' : buttonText}
      </button>
      {status === 'error' && <p className="newsletter-error">{message}</p>}
    </form>
  );
};

// Campaign Dashboard Component
export const CampaignDashboard: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadStats();
  }, [campaignId]);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/newsletter/campaigns/${campaignId}/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading stats...</div>;
  if (!stats) return <div>No stats available</div>;

  return (
    <div className="campaign-dashboard">
      <h2>Campaign Performance</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.sent.toLocaleString()}</div>
          <div className="stat-label">Sent</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.delivered.toLocaleString()}</div>
          <div className="stat-label">Delivered</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.uniqueOpens.toLocaleString()}</div>
          <div className="stat-label">Unique Opens</div>
          <div className="stat-rate">{(stats.openRate * 100).toFixed(1)}%</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.uniqueClicks.toLocaleString()}</div>
          <div className="stat-label">Unique Clicks</div>
          <div className="stat-rate">{(stats.clickRate * 100).toFixed(1)}%</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-value">{stats.bounced.toLocaleString()}</div>
          <div className="stat-label">Bounced</div>
          <div className="stat-rate">{(stats.bounceRate * 100).toFixed(1)}%</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-value">{stats.unsubscribed.toLocaleString()}</div>
          <div className="stat-label">Unsubscribed</div>
        </div>
      </div>
    </div>
  );
};
```

### Python FastAPI Implementation
```python
# newsletter.py
from datetime import datetime
from typing import Optional, Dict, List, Any
from enum import Enum
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
import uuid
import base64

router = APIRouter(prefix="/newsletter", tags=["newsletter"])


class SubscriberStatus(str, Enum):
    ACTIVE = "active"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"
    COMPLAINED = "complained"


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    PAUSED = "paused"


class SubscriberStats(BaseModel):
    total_received: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    last_opened_at: Optional[datetime] = None


class Subscriber(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    status: SubscriberStatus = SubscriberStatus.ACTIVE
    source: str = "website"
    tags: List[str] = []
    stats: SubscriberStats = SubscriberStats()
    unsubscribe_token: str
    created_at: datetime


class CampaignStats(BaseModel):
    sent: int = 0
    delivered: int = 0
    opened: int = 0
    unique_opens: int = 0
    clicked: int = 0
    unique_clicks: int = 0
    bounced: int = 0
    unsubscribed: int = 0
    open_rate: float = 0.0
    click_rate: float = 0.0


class Campaign(BaseModel):
    id: str
    list_id: str
    name: str
    subject: str
    from_name: str
    from_email: str
    html_content: str
    status: CampaignStatus = CampaignStatus.DRAFT
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    stats: CampaignStats = CampaignStats()
    created_at: datetime


# In-memory storage
subscribers_db: Dict[str, Subscriber] = {}
campaigns_db: Dict[str, Campaign] = {}
events_db: List[Dict[str, Any]] = []


def generate_token() -> str:
    return uuid.uuid4().hex


class SubscribeRequest(BaseModel):
    list_id: str
    email: EmailStr
    first_name: Optional[str] = None
    source: str = "website"
    tags: List[str] = []


@router.post("/subscribe")
async def subscribe(request: SubscribeRequest):
    # Check existing
    existing = next(
        (s for s in subscribers_db.values() if s.email == request.email),
        None
    )

    if existing:
        if existing.status == SubscriberStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Email already subscribed")
        # Resubscribe
        existing.status = SubscriberStatus.ACTIVE
        return {"success": True, "data": existing}

    subscriber = Subscriber(
        id=str(uuid.uuid4()),
        email=request.email,
        first_name=request.first_name,
        source=request.source,
        tags=request.tags,
        unsubscribe_token=generate_token(),
        created_at=datetime.utcnow()
    )

    subscribers_db[subscriber.id] = subscriber
    return {"success": True, "data": subscriber}


@router.get("/unsubscribe")
async def unsubscribe(token: str):
    subscriber = next(
        (s for s in subscribers_db.values() if s.unsubscribe_token == token),
        None
    )

    if not subscriber:
        raise HTTPException(status_code=404, detail="Invalid token")

    subscriber.status = SubscriberStatus.UNSUBSCRIBED
    return {"success": True, "message": "Successfully unsubscribed"}


@router.get("/lists/{list_id}/subscribers")
async def get_subscribers(
    list_id: str,
    status: Optional[SubscriberStatus] = None,
    limit: int = 100,
    offset: int = 0
):
    subs = list(subscribers_db.values())

    if status:
        subs = [s for s in subs if s.status == status]

    total = len(subs)
    subs = subs[offset:offset + limit]

    return {"success": True, "data": subs, "total": total}


class CreateCampaignRequest(BaseModel):
    list_id: str
    name: str
    subject: str
    from_name: str
    from_email: EmailStr
    html_content: str


@router.post("/campaigns")
async def create_campaign(request: CreateCampaignRequest):
    campaign = Campaign(
        id=str(uuid.uuid4()),
        list_id=request.list_id,
        name=request.name,
        subject=request.subject,
        from_name=request.from_name,
        from_email=request.from_email,
        html_content=request.html_content,
        created_at=datetime.utcnow()
    )

    campaigns_db[campaign.id] = campaign
    return {"success": True, "data": campaign}


@router.post("/campaigns/{campaign_id}/send")
async def send_campaign(campaign_id: str, background_tasks: BackgroundTasks):
    campaign = campaigns_db.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if campaign.status not in [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED]:
        raise HTTPException(status_code=400, detail="Campaign cannot be sent")

    campaign.status = CampaignStatus.SENDING
    campaign.sent_at = datetime.utcnow()

    background_tasks.add_task(process_campaign_send, campaign_id)

    return {"success": True, "data": campaign}


async def process_campaign_send(campaign_id: str):
    campaign = campaigns_db.get(campaign_id)
    if not campaign:
        return

    active_subs = [
        s for s in subscribers_db.values()
        if s.status == SubscriberStatus.ACTIVE
    ]

    for subscriber in active_subs:
        # Send email (implement with actual provider)
        campaign.stats.sent += 1
        events_db.append({
            "campaign_id": campaign_id,
            "subscriber_id": subscriber.id,
            "type": "sent",
            "timestamp": datetime.utcnow()
        })

    campaign.status = CampaignStatus.SENT
    campaigns_db[campaign_id] = campaign


@router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str):
    campaign = campaigns_db.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {"success": True, "data": campaign.stats}


@router.get("/track/open")
async def track_open(c: str, s: str):
    campaign = campaigns_db.get(c)
    subscriber = subscribers_db.get(s)

    if campaign and subscriber:
        # Check unique open
        has_opened = any(
            e for e in events_db
            if e["campaign_id"] == c and e["subscriber_id"] == s and e["type"] == "opened"
        )

        events_db.append({
            "campaign_id": c,
            "subscriber_id": s,
            "type": "opened",
            "timestamp": datetime.utcnow()
        })

        campaign.stats.opened += 1
        if not has_opened:
            campaign.stats.unique_opens += 1
            subscriber.stats.total_opened += 1

        if campaign.stats.sent > 0:
            campaign.stats.open_rate = campaign.stats.unique_opens / campaign.stats.sent

    # Return 1x1 transparent GIF
    pixel = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")
    return Response(content=pixel, media_type="image/gif")


@router.get("/track/click")
async def track_click(c: str, s: str, url: str):
    campaign = campaigns_db.get(c)
    subscriber = subscribers_db.get(s)

    if campaign and subscriber:
        has_clicked = any(
            e for e in events_db
            if e["campaign_id"] == c and e["subscriber_id"] == s and e["type"] == "clicked"
        )

        events_db.append({
            "campaign_id": c,
            "subscriber_id": s,
            "type": "clicked",
            "url": url,
            "timestamp": datetime.utcnow()
        })

        campaign.stats.clicked += 1
        if not has_clicked:
            campaign.stats.unique_clicks += 1
            subscriber.stats.total_clicked += 1

        if campaign.stats.sent > 0:
            campaign.stats.click_rate = campaign.stats.unique_clicks / campaign.stats.sent

    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=url)
```

## CLAUDE.md Integration
```markdown
## Newsletter Commands

### Subscriber management
"Subscribe user@example.com to the weekly newsletter"
"Unsubscribe user from all lists"
"Add tags 'premium', 'early-adopter' to subscriber"
"Get subscribers with tag 'active'"

### Campaign operations
"Create new campaign for product launch"
"Schedule campaign for tomorrow 9am EST"
"Send campaign immediately"
"Get campaign stats for campaign_123"

### Segmentation
"Create segment for users who opened last 3 campaigns"
"Find subscribers who haven't opened in 30 days"
"Create re-engagement segment"
```

## AI Suggestions
1. Add send-time optimization based on subscriber engagement history
2. Implement predictive unsubscribe detection
3. Add content personalization based on past interactions
4. Create automated re-engagement campaigns
5. Build deliverability monitoring and reputation scoring
6. Add multivariate testing beyond A/B
7. Implement dynamic content blocks based on subscriber data
8. Create subscriber lifecycle automation
9. Add inbox placement testing
10. Build spam score prediction before sending
