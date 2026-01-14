# Event Tracking System

Production-ready event tracking implementation for capturing user interactions and behavioral data.

## Overview

Build a comprehensive event tracking system for capturing user behavior, interactions, and custom events across web and mobile applications. This template provides standardized event schemas and tracking utilities.

## Quick Start

```bash
npm install uuid @segment/analytics-node
```

## TypeScript Implementation

### Event Tracking Service

```typescript
// src/services/tracking/event-tracker.ts
import { v4 as uuidv4 } from 'uuid';

// Standard event types
type EventType =
  | 'page_view'
  | 'click'
  | 'form_submit'
  | 'scroll'
  | 'video_play'
  | 'video_pause'
  | 'video_complete'
  | 'search'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'purchase'
  | 'sign_up'
  | 'login'
  | 'logout'
  | 'share'
  | 'error'
  | 'custom';

interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  anonymousId: string;
  context: EventContext;
}

interface EventContext {
  page: {
    path: string;
    url: string;
    title: string;
    referrer?: string;
    search?: string;
    hash?: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    osVersion?: string;
    browser: string;
    browserVersion?: string;
    screenWidth: number;
    screenHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    pixelRatio: number;
  };
  session: {
    id: string;
    isNew: boolean;
    pageCount: number;
    duration: number;
  };
  campaign?: {
    source?: string;
    medium?: string;
    name?: string;
    term?: string;
    content?: string;
  };
  locale?: string;
  timezone?: string;
}

// Specific event interfaces
interface PageViewEvent extends BaseEvent {
  type: 'page_view';
  properties: {
    pageName?: string;
    category?: string;
  };
}

interface ClickEvent extends BaseEvent {
  type: 'click';
  properties: {
    element: string;
    elementId?: string;
    elementClass?: string;
    elementText?: string;
    href?: string;
    targetUrl?: string;
    position?: { x: number; y: number };
  };
}

interface FormSubmitEvent extends BaseEvent {
  type: 'form_submit';
  properties: {
    formId?: string;
    formName: string;
    formAction?: string;
    fields?: Record<string, boolean>; // field -> was filled
    success: boolean;
    errorMessage?: string;
  };
}

interface ScrollEvent extends BaseEvent {
  type: 'scroll';
  properties: {
    depth: number; // 0-100
    direction: 'down' | 'up';
    maxDepth: number;
  };
}

interface SearchEvent extends BaseEvent {
  type: 'search';
  properties: {
    query: string;
    resultsCount: number;
    category?: string;
    filters?: Record<string, any>;
    hasResults: boolean;
  };
}

interface EcommerceEvent extends BaseEvent {
  type: 'add_to_cart' | 'remove_from_cart' | 'purchase';
  properties: {
    productId: string;
    productName: string;
    category?: string;
    price: number;
    quantity: number;
    currency: string;
    orderId?: string;
    total?: number;
  };
}

interface VideoEvent extends BaseEvent {
  type: 'video_play' | 'video_pause' | 'video_complete';
  properties: {
    videoId: string;
    videoTitle: string;
    duration: number;
    currentTime: number;
    percentComplete: number;
    quality?: string;
    isAutoplay?: boolean;
  };
}

interface ErrorEvent extends BaseEvent {
  type: 'error';
  properties: {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    errorCode?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, any>;
  };
}

interface CustomEvent extends BaseEvent {
  type: 'custom';
  name: string;
  properties: Record<string, any>;
}

type TrackedEvent =
  | PageViewEvent
  | ClickEvent
  | FormSubmitEvent
  | ScrollEvent
  | SearchEvent
  | EcommerceEvent
  | VideoEvent
  | ErrorEvent
  | CustomEvent;

// Event tracking configuration
interface TrackingConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  debug: boolean;
  sampling?: number; // 0-1
  excludePaths?: RegExp[];
  customHeaders?: Record<string, string>;
}

class EventTracker {
  private config: TrackingConfig;
  private queue: TrackedEvent[] = [];
  private sessionId: string;
  private anonymousId: string;
  private userId?: string;
  private sessionStart: number;
  private pageCount = 0;
  private flushTimer?: NodeJS.Timeout;
  private maxScrollDepth = 0;

  constructor(config: Partial<TrackingConfig>) {
    this.config = {
      endpoint: '/api/events',
      batchSize: 10,
      flushInterval: 5000,
      debug: false,
      ...config,
    };

    this.sessionId = this.getOrCreateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.sessionStart = Date.now();

    this.startFlushTimer();
  }

  // Initialize tracking
  init(): void {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  // Set user ID
  identify(userId: string): void {
    this.userId = userId;
    localStorage.setItem('tracking_user_id', userId);
  }

  // Get or create session ID
  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('tracking_session_id');
    if (stored) return stored;

    const newId = uuidv4();
    sessionStorage.setItem('tracking_session_id', newId);
    return newId;
  }

  // Get or create anonymous ID
  private getOrCreateAnonymousId(): string {
    const stored = localStorage.getItem('tracking_anonymous_id');
    if (stored) return stored;

    const newId = uuidv4();
    localStorage.setItem('tracking_anonymous_id', newId);
    return newId;
  }

  // Build context
  private buildContext(): EventContext {
    const ua = navigator.userAgent;
    const urlParams = new URLSearchParams(window.location.search);

    return {
      page: {
        path: window.location.pathname,
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        search: window.location.search,
        hash: window.location.hash,
      },
      device: {
        type: this.getDeviceType(),
        os: this.getOS(ua),
        browser: this.getBrowser(ua),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
      },
      session: {
        id: this.sessionId,
        isNew: this.pageCount === 0,
        pageCount: this.pageCount,
        duration: Date.now() - this.sessionStart,
      },
      campaign: {
        source: urlParams.get('utm_source') || undefined,
        medium: urlParams.get('utm_medium') || undefined,
        name: urlParams.get('utm_campaign') || undefined,
        term: urlParams.get('utm_term') || undefined,
        content: urlParams.get('utm_content') || undefined,
      },
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Device detection
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // OS detection
  private getOS(ua: string): string {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown';
  }

  // Browser detection
  private getBrowser(ua: string): string {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  // Create base event
  private createEvent<T extends EventType>(type: T): BaseEvent {
    return {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId,
      anonymousId: this.anonymousId,
      context: this.buildContext(),
    };
  }

  // Track page view
  pageView(properties?: { pageName?: string; category?: string }): void {
    this.pageCount++;

    const event: PageViewEvent = {
      ...this.createEvent('page_view'),
      properties: properties || {},
    };

    this.enqueue(event);
  }

  // Track click
  click(element: HTMLElement | string, properties?: Partial<ClickEvent['properties']>): void {
    const el = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    const event: ClickEvent = {
      ...this.createEvent('click'),
      properties: {
        element: el?.tagName || 'unknown',
        elementId: el?.id,
        elementClass: el?.className,
        elementText: el?.textContent?.slice(0, 100),
        href: (el as HTMLAnchorElement)?.href,
        ...properties,
      },
    };

    this.enqueue(event);
  }

  // Track form submission
  formSubmit(formName: string, properties: Partial<FormSubmitEvent['properties']>): void {
    const event: FormSubmitEvent = {
      ...this.createEvent('form_submit'),
      properties: {
        formName,
        success: true,
        ...properties,
      },
    };

    this.enqueue(event);
  }

  // Track scroll depth
  scroll(depth: number, direction: 'down' | 'up' = 'down'): void {
    if (depth > this.maxScrollDepth) {
      this.maxScrollDepth = depth;
    }

    const event: ScrollEvent = {
      ...this.createEvent('scroll'),
      properties: {
        depth,
        direction,
        maxDepth: this.maxScrollDepth,
      },
    };

    this.enqueue(event);
  }

  // Track search
  search(query: string, resultsCount: number, properties?: Partial<SearchEvent['properties']>): void {
    const event: SearchEvent = {
      ...this.createEvent('search'),
      properties: {
        query,
        resultsCount,
        hasResults: resultsCount > 0,
        ...properties,
      },
    };

    this.enqueue(event);
  }

  // Track ecommerce events
  addToCart(product: EcommerceEvent['properties']): void {
    const event: EcommerceEvent = {
      ...this.createEvent('add_to_cart'),
      properties: product,
    };

    this.enqueue(event);
  }

  removeFromCart(product: EcommerceEvent['properties']): void {
    const event: EcommerceEvent = {
      ...this.createEvent('remove_from_cart'),
      properties: product,
    };

    this.enqueue(event);
  }

  purchase(order: EcommerceEvent['properties']): void {
    const event: EcommerceEvent = {
      ...this.createEvent('purchase'),
      properties: order,
    };

    this.enqueue(event);
  }

  // Track video events
  videoPlay(properties: VideoEvent['properties']): void {
    const event: VideoEvent = {
      ...this.createEvent('video_play'),
      properties,
    };

    this.enqueue(event);
  }

  videoPause(properties: VideoEvent['properties']): void {
    const event: VideoEvent = {
      ...this.createEvent('video_pause'),
      properties,
    };

    this.enqueue(event);
  }

  videoComplete(properties: VideoEvent['properties']): void {
    const event: VideoEvent = {
      ...this.createEvent('video_complete'),
      properties,
    };

    this.enqueue(event);
  }

  // Track error
  error(properties: ErrorEvent['properties']): void {
    const event: ErrorEvent = {
      ...this.createEvent('error'),
      properties,
    };

    this.enqueue(event);
  }

  // Track custom event
  track(name: string, properties: Record<string, any> = {}): void {
    const event: CustomEvent = {
      ...this.createEvent('custom'),
      name,
      properties,
    };

    this.enqueue(event);
  }

  // Enqueue event
  private enqueue(event: TrackedEvent): void {
    // Apply sampling
    if (this.config.sampling && Math.random() > this.config.sampling) {
      return;
    }

    // Check excluded paths
    if (this.config.excludePaths?.some(re => re.test(window.location.pathname))) {
      return;
    }

    if (this.config.debug) {
      console.log('[EventTracker]', event);
    }

    this.queue.push(event);

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Start flush timer
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  // Flush events
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.customHeaders,
        },
        body: JSON.stringify({ events }),
        keepalive: true,
      });
    } catch (error) {
      console.error('[EventTracker] Flush failed:', error);
      // Re-queue events on failure
      this.queue = [...events, ...this.queue];
    }
  }

  // Destroy tracker
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

export const eventTracker = new EventTracker({
  endpoint: process.env.NEXT_PUBLIC_EVENTS_ENDPOINT || '/api/events',
  debug: process.env.NODE_ENV === 'development',
});
```

### Auto-Tracking Service

```typescript
// src/services/tracking/auto-tracker.ts
import { eventTracker } from './event-tracker';

interface AutoTrackingConfig {
  clicks: boolean;
  forms: boolean;
  scroll: boolean;
  pageViews: boolean;
  outboundLinks: boolean;
  downloads: boolean;
  engagement: boolean;
}

class AutoTracker {
  private config: AutoTrackingConfig;
  private scrollThresholds = [25, 50, 75, 90, 100];
  private scrolledDepths = new Set<number>();
  private cleanupFunctions: (() => void)[] = [];

  constructor(config: Partial<AutoTrackingConfig> = {}) {
    this.config = {
      clicks: true,
      forms: true,
      scroll: true,
      pageViews: true,
      outboundLinks: true,
      downloads: true,
      engagement: true,
      ...config,
    };
  }

  // Start auto-tracking
  start(): void {
    if (typeof window === 'undefined') return;

    if (this.config.pageViews) {
      this.trackPageViews();
    }

    if (this.config.clicks) {
      this.trackClicks();
    }

    if (this.config.forms) {
      this.trackForms();
    }

    if (this.config.scroll) {
      this.trackScroll();
    }

    if (this.config.outboundLinks) {
      this.trackOutboundLinks();
    }

    if (this.config.downloads) {
      this.trackDownloads();
    }

    if (this.config.engagement) {
      this.trackEngagement();
    }
  }

  // Stop auto-tracking
  stop(): void {
    this.cleanupFunctions.forEach(fn => fn());
    this.cleanupFunctions = [];
  }

  // Track page views
  private trackPageViews(): void {
    eventTracker.pageView();

    // Track SPA navigation
    const handlePopState = () => {
      eventTracker.pageView();
    };

    window.addEventListener('popstate', handlePopState);

    this.cleanupFunctions.push(() => {
      window.removeEventListener('popstate', handlePopState);
    });
  }

  // Track clicks
  private trackClicks(): void {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Only track meaningful clicks
      const clickableElements = ['A', 'BUTTON', 'INPUT', 'SELECT'];
      const clickable = target.closest(
        clickableElements.map(el => el.toLowerCase()).join(',')
      ) as HTMLElement | null;

      if (!clickable) return;

      // Skip tracking for elements with data-no-track
      if (clickable.dataset.noTrack === 'true') return;

      eventTracker.click(clickable, {
        position: { x: e.clientX, y: e.clientY },
      });
    };

    document.addEventListener('click', handleClick);

    this.cleanupFunctions.push(() => {
      document.removeEventListener('click', handleClick);
    });
  }

  // Track form submissions
  private trackForms(): void {
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const formName = form.name || form.id || 'unknown';

      // Collect which fields were filled
      const fields: Record<string, boolean> = {};
      const elements = form.elements;

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLInputElement;
        if (el.name && el.type !== 'submit' && el.type !== 'button') {
          fields[el.name] = !!el.value;
        }
      }

      eventTracker.formSubmit(formName, {
        formId: form.id,
        formAction: form.action,
        fields,
      });
    };

    document.addEventListener('submit', handleSubmit);

    this.cleanupFunctions.push(() => {
      document.removeEventListener('submit', handleSubmit);
    });
  }

  // Track scroll depth
  private trackScroll(): void {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          const clientHeight = document.documentElement.clientHeight;
          const scrollTop = window.scrollY;

          const scrollPercent = Math.round(
            (scrollTop / (scrollHeight - clientHeight)) * 100
          );

          // Track threshold crossings
          for (const threshold of this.scrollThresholds) {
            if (scrollPercent >= threshold && !this.scrolledDepths.has(threshold)) {
              this.scrolledDepths.add(threshold);
              eventTracker.scroll(threshold, 'down');
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    this.cleanupFunctions.push(() => {
      window.removeEventListener('scroll', handleScroll);
    });
  }

  // Track outbound links
  private trackOutboundLinks(): void {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a') as HTMLAnchorElement;

      if (!link?.href) return;

      try {
        const linkUrl = new URL(link.href);
        const currentHost = window.location.hostname;

        if (linkUrl.hostname !== currentHost) {
          eventTracker.track('outbound_link', {
            url: link.href,
            text: link.textContent?.slice(0, 100),
            destination: linkUrl.hostname,
          });
        }
      } catch {
        // Invalid URL, skip tracking
      }
    };

    document.addEventListener('click', handleClick);

    this.cleanupFunctions.push(() => {
      document.removeEventListener('click', handleClick);
    });
  }

  // Track file downloads
  private trackDownloads(): void {
    const downloadExtensions = [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'zip', 'rar', '7z', 'tar', 'gz',
      'mp3', 'mp4', 'wav', 'avi', 'mov',
      'jpg', 'jpeg', 'png', 'gif', 'svg',
      'exe', 'dmg', 'apk', 'msi',
    ];

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a') as HTMLAnchorElement;

      if (!link?.href) return;

      const extension = link.href.split('.').pop()?.toLowerCase();

      if (extension && downloadExtensions.includes(extension)) {
        eventTracker.track('file_download', {
          url: link.href,
          extension,
          fileName: link.href.split('/').pop(),
        });
      }
    };

    document.addEventListener('click', handleClick);

    this.cleanupFunctions.push(() => {
      document.removeEventListener('click', handleClick);
    });
  }

  // Track engagement time
  private trackEngagement(): void {
    let isVisible = true;
    let engagementTime = 0;
    let lastUpdate = Date.now();
    let interval: NodeJS.Timeout;

    const updateEngagement = () => {
      if (isVisible) {
        const now = Date.now();
        engagementTime += now - lastUpdate;
        lastUpdate = now;
      }
    };

    const handleVisibilityChange = () => {
      updateEngagement();
      isVisible = document.visibilityState === 'visible';
      lastUpdate = Date.now();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track engagement every 30 seconds
    interval = setInterval(() => {
      updateEngagement();
      if (engagementTime > 0) {
        eventTracker.track('engagement_time', {
          duration: engagementTime,
          durationSeconds: Math.round(engagementTime / 1000),
        });
      }
    }, 30000);

    this.cleanupFunctions.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    });
  }
}

export const autoTracker = new AutoTracker();
```

## Express.js API Routes

```typescript
// src/routes/events.ts
import { Router, Request, Response } from 'express';
import { Redis } from 'ioredis';

const router = Router();
const redis = new Redis(process.env.REDIS_URL!);

// Batch receive events
router.post('/', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'events array is required' });
    }

    // Enrich events with server-side data
    const enrichedEvents = events.map((event: any) => ({
      ...event,
      receivedAt: new Date().toISOString(),
      serverContext: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    }));

    // Queue for processing
    for (const event of enrichedEvents) {
      await redis.lpush('events:queue', JSON.stringify(event));
    }

    // Update real-time counters
    const date = new Date().toISOString().split('T')[0];
    const pageViews = events.filter((e: any) => e.type === 'page_view').length;

    if (pageViews > 0) {
      await redis.incrby(`stats:pageviews:${date}`, pageViews);
    }

    // Count unique sessions
    const sessions = new Set(events.map((e: any) => e.sessionId));
    for (const sessionId of sessions) {
      await redis.pfadd(`stats:sessions:${date}`, sessionId);
    }

    res.json({
      success: true,
      received: events.length,
    });
  } catch (error) {
    console.error('Events error:', error);
    res.status(500).json({ error: 'Failed to process events' });
  }
});

// Get realtime stats
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const hour = now.getHours();

    const pageviews = await redis.get(`stats:pageviews:${date}`) || '0';
    const sessions = await redis.pfcount(`stats:sessions:${date}`);

    res.json({
      pageviews: parseInt(pageviews, 10),
      sessions,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Realtime stats error:', error);
    res.status(500).json({ error: 'Failed to get realtime stats' });
  }
});

export default router;
```

## React Integration

```typescript
// src/hooks/useTracking.tsx
import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { eventTracker } from '../services/tracking/event-tracker';
import { autoTracker } from '../services/tracking/auto-tracker';

interface TrackingContextValue {
  track: (eventName: string, properties?: Record<string, any>) => void;
  identify: (userId: string) => void;
  pageView: (properties?: { pageName?: string; category?: string }) => void;
  click: (element: string, properties?: Record<string, any>) => void;
  formSubmit: (formName: string, properties?: Record<string, any>) => void;
  search: (query: string, resultsCount: number) => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

interface TrackingProviderProps {
  children: ReactNode;
  autoTrack?: boolean;
}

export function TrackingProvider({
  children,
  autoTrack = true
}: TrackingProviderProps) {
  useEffect(() => {
    eventTracker.init();

    if (autoTrack) {
      autoTracker.start();
    }

    return () => {
      autoTracker.stop();
      eventTracker.destroy();
    };
  }, [autoTrack]);

  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    eventTracker.track(eventName, properties);
  }, []);

  const identify = useCallback((userId: string) => {
    eventTracker.identify(userId);
  }, []);

  const pageView = useCallback((properties?: { pageName?: string; category?: string }) => {
    eventTracker.pageView(properties);
  }, []);

  const click = useCallback((element: string, properties?: Record<string, any>) => {
    eventTracker.click(element, properties);
  }, []);

  const formSubmit = useCallback((formName: string, properties?: Record<string, any>) => {
    eventTracker.formSubmit(formName, { success: true, ...properties });
  }, []);

  const search = useCallback((query: string, resultsCount: number) => {
    eventTracker.search(query, resultsCount);
  }, []);

  const value: TrackingContextValue = {
    track,
    identify,
    pageView,
    click,
    formSubmit,
    search,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within TrackingProvider');
  }
  return context;
}

// Track click hook
export function useTrackClick(
  eventName: string,
  properties?: Record<string, any>
) {
  const { track } = useTracking();

  return useCallback(() => {
    track(eventName, properties);
  }, [track, eventName, properties]);
}

// Track page view hook
export function usePageTracking(pageName?: string, category?: string) {
  const { pageView } = useTracking();

  useEffect(() => {
    pageView({ pageName, category });
  }, [pageView, pageName, category]);
}
```

### Tracking Components

```tsx
// src/components/Tracking.tsx
import React, { ReactNode, useEffect, useRef } from 'react';
import { useTracking, useTrackClick } from '../hooks/useTracking';

// Tracked button
interface TrackedButtonProps {
  eventName: string;
  properties?: Record<string, any>;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TrackedButton({
  eventName,
  properties,
  onClick,
  children,
  className,
  disabled,
}: TrackedButtonProps) {
  const handleClick = useTrackClick(eventName, properties);

  const handleButtonClick = () => {
    handleClick();
    onClick?.();
  };

  return (
    <button
      onClick={handleButtonClick}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// Track visibility
interface TrackVisibilityProps {
  eventName: string;
  properties?: Record<string, any>;
  threshold?: number;
  trackOnce?: boolean;
  children: ReactNode;
}

export function TrackVisibility({
  eventName,
  properties,
  threshold = 0.5,
  trackOnce = true,
  children,
}: TrackVisibilityProps) {
  const { track } = useTracking();
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (trackOnce && tracked.current) return;
            tracked.current = true;
            track(eventName, properties);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eventName, properties, threshold, trackOnce, track]);

  return <div ref={ref}>{children}</div>;
}

// Tracked form
interface TrackedFormProps {
  formName: string;
  onSubmit: (data: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
}

export function TrackedForm({
  formName,
  onSubmit,
  children,
  className,
}: TrackedFormProps) {
  const { formSubmit } = useTracking();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    formSubmit(formName, {
      formId: e.currentTarget.id,
    });

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
```

## CLAUDE.md Integration

```markdown
## Event Tracking

### Commands
- `tracking:track <event> [properties]` - Track custom event
- `tracking:pageview [name]` - Track page view
- `tracking:identify <userId>` - Identify user

### Key Files
- `src/services/tracking/event-tracker.ts` - Core tracker
- `src/services/tracking/auto-tracker.ts` - Auto-tracking
- `src/hooks/useTracking.tsx` - React hooks

### Event Naming Convention
- Use snake_case for event names
- Action + Object pattern: `button_click`, `form_submit`
- Standard events: `page_view`, `sign_up`, `purchase`

### Auto-Tracked Events
- Page views (all routes)
- Click events (buttons, links)
- Form submissions
- Scroll depth (25%, 50%, 75%, 90%, 100%)
- Outbound links
- File downloads
```

## AI Suggestions

1. **Event Schema**: Define strict TypeScript schemas for all events
2. **Batching**: Optimize network with event batching
3. **Offline Support**: Queue events when offline
4. **Sampling**: Implement traffic sampling for high-volume sites
5. **PII Filtering**: Automatically scrub PII from events
6. **Debug Mode**: Add detailed console logging for development
7. **Performance**: Use requestIdleCallback for non-critical tracking
8. **Validation**: Validate events against schemas before sending
9. **Attribution**: Track multi-touch attribution
10. **Enrichment**: Server-side event enrichment with geolocation
