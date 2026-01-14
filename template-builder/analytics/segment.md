# Segment Customer Data Platform

Production-ready Segment integration for unified customer data collection and routing.

## Overview

Segment is a Customer Data Platform (CDP) that collects, cleans, and routes customer data to hundreds of destinations. This template provides complete Segment integration with server-side tracking, browser analytics, and destination management.

## Quick Start

```bash
npm install @segment/analytics-node @segment/analytics-next
```

## TypeScript Implementation

### Server-Side Analytics

```typescript
// src/services/segment-server.ts
import { Analytics } from '@segment/analytics-node';

interface SegmentConfig {
  writeKey: string;
  flushAt?: number;
  flushInterval?: number;
  maxRetries?: number;
  disable?: boolean;
}

interface IdentifyTraits {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  company?: {
    name?: string;
    id?: string;
    industry?: string;
    employeeCount?: number;
    plan?: string;
  };
  [key: string]: any;
}

interface TrackProperties {
  [key: string]: any;
}

interface PageProperties {
  name?: string;
  path?: string;
  referrer?: string;
  search?: string;
  title?: string;
  url?: string;
  [key: string]: any;
}

interface GroupTraits {
  name?: string;
  industry?: string;
  employees?: number;
  plan?: string;
  [key: string]: any;
}

interface Context {
  ip?: string;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  campaign?: {
    name?: string;
    source?: string;
    medium?: string;
    term?: string;
    content?: string;
  };
  device?: {
    id?: string;
    advertisingId?: string;
    manufacturer?: string;
    model?: string;
    type?: string;
  };
  [key: string]: any;
}

class SegmentServerService {
  private analytics: Analytics;
  private enabled: boolean;

  constructor(config: SegmentConfig) {
    this.enabled = !config.disable;
    this.analytics = new Analytics({
      writeKey: config.writeKey,
      flushAt: config.flushAt || 20,
      flushInterval: config.flushInterval || 10000,
      maxRetries: config.maxRetries || 3,
      disable: config.disable,
    });
  }

  // Identify a user
  identify(
    userId: string,
    traits?: IdentifyTraits,
    context?: Context,
    timestamp?: Date,
    anonymousId?: string
  ): void {
    if (!this.enabled) return;

    this.analytics.identify({
      userId,
      traits,
      context,
      timestamp,
      anonymousId,
    });
  }

  // Track an event
  track(
    userId: string,
    event: string,
    properties?: TrackProperties,
    context?: Context,
    timestamp?: Date,
    anonymousId?: string
  ): void {
    if (!this.enabled) return;

    this.analytics.track({
      userId,
      event,
      properties,
      context,
      timestamp,
      anonymousId,
    });
  }

  // Track anonymous event
  trackAnonymous(
    anonymousId: string,
    event: string,
    properties?: TrackProperties,
    context?: Context,
    timestamp?: Date
  ): void {
    if (!this.enabled) return;

    this.analytics.track({
      anonymousId,
      event,
      properties,
      context,
      timestamp,
    });
  }

  // Track page view
  page(
    userId: string,
    category?: string,
    name?: string,
    properties?: PageProperties,
    context?: Context,
    timestamp?: Date,
    anonymousId?: string
  ): void {
    if (!this.enabled) return;

    this.analytics.page({
      userId,
      category,
      name,
      properties,
      context,
      timestamp,
      anonymousId,
    });
  }

  // Track screen view (mobile)
  screen(
    userId: string,
    name: string,
    properties?: TrackProperties,
    context?: Context,
    timestamp?: Date,
    anonymousId?: string
  ): void {
    if (!this.enabled) return;

    this.analytics.screen({
      userId,
      name,
      properties,
      context,
      timestamp,
      anonymousId,
    });
  }

  // Group user
  group(
    userId: string,
    groupId: string,
    traits?: GroupTraits,
    context?: Context,
    timestamp?: Date,
    anonymousId?: string
  ): void {
    if (!this.enabled) return;

    this.analytics.group({
      userId,
      groupId,
      traits,
      context,
      timestamp,
      anonymousId,
    });
  }

  // Alias user IDs
  alias(
    userId: string,
    previousId: string,
    context?: Context,
    timestamp?: Date
  ): void {
    if (!this.enabled) return;

    this.analytics.alias({
      userId,
      previousId,
      context,
      timestamp,
    });
  }

  // Flush events
  async flush(): Promise<void> {
    if (!this.enabled) return;
    await this.analytics.flush();
  }

  // Close connection
  async close(): Promise<void> {
    await this.analytics.closeAndFlush();
  }
}

export const segmentServer = new SegmentServerService({
  writeKey: process.env.SEGMENT_WRITE_KEY!,
  flushAt: 20,
  flushInterval: 10000,
});
```

### Browser-Side Analytics

```typescript
// src/services/segment-browser.ts
import { AnalyticsBrowser } from '@segment/analytics-next';

interface SegmentBrowserConfig {
  writeKey: string;
  cdnURL?: string;
  plugins?: any[];
}

interface TrackOptions {
  context?: Record<string, any>;
  integrations?: Record<string, boolean>;
  anonymousId?: string;
  timestamp?: Date;
}

class SegmentBrowserService {
  private analytics: AnalyticsBrowser | null = null;
  private initialized = false;
  private writeKey: string;

  constructor(writeKey: string) {
    this.writeKey = writeKey;
  }

  async initialize(config?: Partial<SegmentBrowserConfig>): Promise<void> {
    if (this.initialized) return;

    const [response] = await AnalyticsBrowser.load({
      writeKey: this.writeKey,
      cdnURL: config?.cdnURL,
      plugins: config?.plugins,
    });

    this.analytics = response;
    this.initialized = true;
  }

  // Identify user
  identify(
    userId?: string,
    traits?: Record<string, any>,
    options?: TrackOptions
  ): void {
    if (!this.analytics) return;

    if (userId) {
      this.analytics.identify(userId, traits, options);
    } else {
      this.analytics.identify(traits, options);
    }
  }

  // Track event
  track(
    event: string,
    properties?: Record<string, any>,
    options?: TrackOptions
  ): void {
    if (!this.analytics) return;
    this.analytics.track(event, properties, options);
  }

  // Page view
  page(
    category?: string,
    name?: string,
    properties?: Record<string, any>,
    options?: TrackOptions
  ): void {
    if (!this.analytics) return;
    this.analytics.page(category, name, properties, options);
  }

  // Group user
  group(
    groupId: string,
    traits?: Record<string, any>,
    options?: TrackOptions
  ): void {
    if (!this.analytics) return;
    this.analytics.group(groupId, traits, options);
  }

  // Alias
  alias(userId: string, previousId?: string, options?: TrackOptions): void {
    if (!this.analytics) return;
    this.analytics.alias(userId, previousId, options);
  }

  // Reset (logout)
  reset(): void {
    if (!this.analytics) return;
    this.analytics.reset();
  }

  // Get anonymous ID
  async getAnonymousId(): Promise<string | undefined> {
    if (!this.analytics) return undefined;
    const user = await this.analytics.user();
    return user.anonymousId();
  }

  // Get user ID
  async getUserId(): Promise<string | undefined> {
    if (!this.analytics) return undefined;
    const user = await this.analytics.user();
    return user.id();
  }

  // Get traits
  async getTraits(): Promise<Record<string, any> | undefined> {
    if (!this.analytics) return undefined;
    const user = await this.analytics.user();
    return user.traits();
  }

  // Ready callback
  ready(callback: () => void): void {
    if (!this.analytics) return;
    this.analytics.ready(callback);
  }

  // Debug mode
  debug(enabled = true): void {
    if (!this.analytics) return;
    this.analytics.debug(enabled);
  }

  // Enable/disable integrations
  setIntegrations(integrations: Record<string, boolean>): void {
    if (!this.analytics) return;
    // Store integrations settings for future calls
    // This is typically done per-call in options
  }
}

export const segmentBrowser = new SegmentBrowserService(
  process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY!
);
```

### Middleware for Server-Side Tracking

```typescript
// src/middleware/segment-tracking.ts
import { Request, Response, NextFunction } from 'express';
import { segmentServer } from '../services/segment-server';

interface TrackingOptions {
  excludePaths?: string[];
  includeQueryParams?: boolean;
  trackingEventName?: string;
}

export function segmentTrackingMiddleware(options: TrackingOptions = {}) {
  const {
    excludePaths = ['/health', '/favicon.ico'],
    includeQueryParams = false,
    trackingEventName = 'Page Viewed',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const userId = (req as any).user?.id;
    const anonymousId = req.cookies?.ajs_anonymous_id || req.headers['x-anonymous-id'];

    if (userId || anonymousId) {
      const properties: Record<string, any> = {
        path: req.path,
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        referrer: req.get('referrer'),
        userAgent: req.get('user-agent'),
      };

      if (includeQueryParams && Object.keys(req.query).length > 0) {
        properties.query = req.query;
      }

      const context = {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        locale: req.get('accept-language')?.split(',')[0],
      };

      if (userId) {
        segmentServer.page(userId, undefined, req.path, properties, context);
      } else if (anonymousId) {
        segmentServer.page(
          '',
          undefined,
          req.path,
          properties,
          context,
          undefined,
          anonymousId as string
        );
      }
    }

    next();
  };
}

// E-commerce tracking helpers
export class EcommerceTracker {
  constructor(private userId: string, private anonymousId?: string) {}

  productViewed(product: {
    productId: string;
    sku?: string;
    category?: string;
    name: string;
    brand?: string;
    variant?: string;
    price: number;
    quantity?: number;
    currency?: string;
    position?: number;
    url?: string;
    imageUrl?: string;
  }): void {
    segmentServer.track(this.userId, 'Product Viewed', {
      product_id: product.productId,
      sku: product.sku,
      category: product.category,
      name: product.name,
      brand: product.brand,
      variant: product.variant,
      price: product.price,
      quantity: product.quantity || 1,
      currency: product.currency || 'USD',
      position: product.position,
      url: product.url,
      image_url: product.imageUrl,
    }, undefined, undefined, this.anonymousId);
  }

  productAdded(product: {
    cartId: string;
    productId: string;
    sku?: string;
    category?: string;
    name: string;
    brand?: string;
    variant?: string;
    price: number;
    quantity: number;
    currency?: string;
  }): void {
    segmentServer.track(this.userId, 'Product Added', {
      cart_id: product.cartId,
      product_id: product.productId,
      sku: product.sku,
      category: product.category,
      name: product.name,
      brand: product.brand,
      variant: product.variant,
      price: product.price,
      quantity: product.quantity,
      currency: product.currency || 'USD',
    }, undefined, undefined, this.anonymousId);
  }

  checkoutStarted(checkout: {
    orderId?: string;
    value: number;
    revenue?: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    coupon?: string;
    currency?: string;
    products: Array<{
      productId: string;
      sku?: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }): void {
    segmentServer.track(this.userId, 'Checkout Started', {
      order_id: checkout.orderId,
      value: checkout.value,
      revenue: checkout.revenue,
      shipping: checkout.shipping,
      tax: checkout.tax,
      discount: checkout.discount,
      coupon: checkout.coupon,
      currency: checkout.currency || 'USD',
      products: checkout.products.map(p => ({
        product_id: p.productId,
        sku: p.sku,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      })),
    }, undefined, undefined, this.anonymousId);
  }

  orderCompleted(order: {
    orderId: string;
    total: number;
    revenue: number;
    shipping?: number;
    tax?: number;
    discount?: number;
    coupon?: string;
    currency?: string;
    products: Array<{
      productId: string;
      sku?: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  }): void {
    segmentServer.track(this.userId, 'Order Completed', {
      order_id: order.orderId,
      total: order.total,
      revenue: order.revenue,
      shipping: order.shipping,
      tax: order.tax,
      discount: order.discount,
      coupon: order.coupon,
      currency: order.currency || 'USD',
      products: order.products.map(p => ({
        product_id: p.productId,
        sku: p.sku,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      })),
    }, undefined, undefined, this.anonymousId);
  }
}
```

## Express.js API Routes

```typescript
// src/routes/segment.ts
import { Router, Request, Response } from 'express';
import { segmentServer } from '../services/segment-server';

const router = Router();

// Identify user
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { userId, traits, anonymousId } = req.body;

    if (!userId && !anonymousId) {
      return res.status(400).json({ error: 'userId or anonymousId is required' });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    segmentServer.identify(
      userId,
      traits,
      context,
      new Date(),
      anonymousId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Identify error:', error);
    res.status(500).json({ error: 'Failed to identify user' });
  }
});

// Track event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { userId, event, properties, anonymousId } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    if (!userId && !anonymousId) {
      return res.status(400).json({ error: 'userId or anonymousId is required' });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (userId) {
      segmentServer.track(userId, event, properties, context, new Date(), anonymousId);
    } else {
      segmentServer.trackAnonymous(anonymousId, event, properties, context, new Date());
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Page view
router.post('/page', async (req: Request, res: Response) => {
  try {
    const { userId, category, name, properties, anonymousId } = req.body;

    const context = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    segmentServer.page(
      userId || '',
      category,
      name,
      properties,
      context,
      new Date(),
      anonymousId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Page error:', error);
    res.status(500).json({ error: 'Failed to track page' });
  }
});

// Group
router.post('/group', async (req: Request, res: Response) => {
  try {
    const { userId, groupId, traits, anonymousId } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'groupId is required' });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    segmentServer.group(
      userId || '',
      groupId,
      traits,
      context,
      new Date(),
      anonymousId
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Group error:', error);
    res.status(500).json({ error: 'Failed to group user' });
  }
});

// Alias
router.post('/alias', async (req: Request, res: Response) => {
  try {
    const { userId, previousId } = req.body;

    if (!userId || !previousId) {
      return res.status(400).json({ error: 'userId and previousId are required' });
    }

    const context = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    segmentServer.alias(userId, previousId, context, new Date());

    res.json({ success: true });
  } catch (error) {
    console.error('Alias error:', error);
    res.status(500).json({ error: 'Failed to alias user' });
  }
});

// Flush
router.post('/flush', async (req: Request, res: Response) => {
  try {
    await segmentServer.flush();
    res.json({ success: true });
  } catch (error) {
    console.error('Flush error:', error);
    res.status(500).json({ error: 'Failed to flush events' });
  }
});

export default router;
```

## React Integration

```typescript
// src/hooks/useSegment.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { segmentBrowser } from '../services/segment-browser';

interface SegmentContextValue {
  isReady: boolean;
  identify: (userId?: string, traits?: Record<string, any>) => void;
  track: (event: string, properties?: Record<string, any>) => void;
  page: (category?: string, name?: string, properties?: Record<string, any>) => void;
  group: (groupId: string, traits?: Record<string, any>) => void;
  reset: () => void;
}

const SegmentContext = createContext<SegmentContextValue | null>(null);

interface SegmentProviderProps {
  children: ReactNode;
  writeKey: string;
  cdnURL?: string;
}

export function SegmentProvider({
  children,
  writeKey,
  cdnURL
}: SegmentProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await segmentBrowser.initialize({ cdnURL });
      segmentBrowser.ready(() => {
        setIsReady(true);
      });
    };

    init();
  }, [writeKey, cdnURL]);

  const identify = useCallback((userId?: string, traits?: Record<string, any>) => {
    segmentBrowser.identify(userId, traits);
  }, []);

  const track = useCallback((event: string, properties?: Record<string, any>) => {
    segmentBrowser.track(event, properties);
  }, []);

  const page = useCallback((category?: string, name?: string, properties?: Record<string, any>) => {
    segmentBrowser.page(category, name, properties);
  }, []);

  const group = useCallback((groupId: string, traits?: Record<string, any>) => {
    segmentBrowser.group(groupId, traits);
  }, []);

  const reset = useCallback(() => {
    segmentBrowser.reset();
  }, []);

  const value: SegmentContextValue = {
    isReady,
    identify,
    track,
    page,
    group,
    reset,
  };

  return (
    <SegmentContext.Provider value={value}>
      {children}
    </SegmentContext.Provider>
  );
}

export function useSegment(): SegmentContextValue {
  const context = useContext(SegmentContext);
  if (!context) {
    throw new Error('useSegment must be used within SegmentProvider');
  }
  return context;
}

// Track click hook
export function useTrackClick(eventName: string, properties?: Record<string, any>) {
  const { track } = useSegment();

  return useCallback((additionalProps?: Record<string, any>) => {
    track(eventName, { ...properties, ...additionalProps });
  }, [track, eventName, properties]);
}

// Page tracking hook
export function usePageTracking(pageName: string, properties?: Record<string, any>) {
  const { page, isReady } = useSegment();

  useEffect(() => {
    if (isReady) {
      page(undefined, pageName, properties);
    }
  }, [isReady, pageName, page]);
}

// Form submission tracking
export function useTrackForm(formName: string) {
  const { track } = useSegment();

  const trackSubmit = useCallback((formData: Record<string, any>) => {
    track('Form Submitted', {
      form_name: formName,
      ...formData,
    });
  }, [track, formName]);

  const trackStart = useCallback(() => {
    track('Form Started', { form_name: formName });
  }, [track, formName]);

  const trackError = useCallback((error: string) => {
    track('Form Error', {
      form_name: formName,
      error_message: error
    });
  }, [track, formName]);

  return { trackSubmit, trackStart, trackError };
}
```

### Tracking Components

```tsx
// src/components/SegmentTracking.tsx
import React, { useEffect, ReactNode } from 'react';
import { useSegment, usePageTracking } from '../hooks/useSegment';

// Track link clicks
interface TrackedLinkProps {
  href: string;
  eventName: string;
  properties?: Record<string, any>;
  children: ReactNode;
  className?: string;
}

export function TrackedLink({
  href,
  eventName,
  properties,
  children,
  className
}: TrackedLinkProps) {
  const { track } = useSegment();

  const handleClick = () => {
    track(eventName, {
      link_url: href,
      ...properties,
    });
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// Track button clicks
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
  disabled
}: TrackedButtonProps) {
  const { track } = useSegment();

  const handleClick = () => {
    track(eventName, properties);
    onClick?.();
  };

  return (
    <button onClick={handleClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
}

// Page wrapper for automatic tracking
interface TrackedPageProps {
  name: string;
  category?: string;
  properties?: Record<string, any>;
  children: ReactNode;
}

export function TrackedPage({
  name,
  category,
  properties,
  children
}: TrackedPageProps) {
  const { page, isReady } = useSegment();

  useEffect(() => {
    if (isReady) {
      page(category, name, properties);
    }
  }, [isReady, name, category, properties, page]);

  return <>{children}</>;
}

// Visibility tracking
interface TrackVisibilityProps {
  eventName: string;
  properties?: Record<string, any>;
  threshold?: number;
  children: ReactNode;
}

export function TrackVisibility({
  eventName,
  properties,
  threshold = 0.5,
  children
}: TrackVisibilityProps) {
  const { track } = useSegment();
  const ref = React.useRef<HTMLDivElement>(null);
  const hasTracked = React.useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true;
            track(eventName, properties);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eventName, properties, threshold, track]);

  return <div ref={ref}>{children}</div>;
}
```

## Python Implementation

```python
# segment_service.py
import analytics
from typing import Dict, Any, Optional, List
from datetime import datetime
import os

class SegmentService:
    def __init__(
        self,
        write_key: Optional[str] = None,
        debug: bool = False,
        on_error: Optional[callable] = None,
        send: bool = True,
        max_queue_size: int = 10000,
        flush_at: int = 100,
        flush_interval: float = 0.5
    ):
        write_key = write_key or os.environ.get('SEGMENT_WRITE_KEY')

        analytics.write_key = write_key
        analytics.debug = debug
        analytics.send = send
        analytics.max_queue_size = max_queue_size
        analytics.flush_at = flush_at
        analytics.flush_interval = flush_interval

        if on_error:
            analytics.on_error = on_error

    def identify(
        self,
        user_id: str,
        traits: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        anonymous_id: Optional[str] = None,
        integrations: Optional[Dict[str, bool]] = None
    ) -> None:
        """Identify a user with traits."""
        analytics.identify(
            user_id=user_id,
            traits=traits,
            context=context,
            timestamp=timestamp,
            anonymous_id=anonymous_id,
            integrations=integrations
        )

    def track(
        self,
        user_id: str,
        event: str,
        properties: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        anonymous_id: Optional[str] = None,
        integrations: Optional[Dict[str, bool]] = None
    ) -> None:
        """Track an event."""
        analytics.track(
            user_id=user_id,
            event=event,
            properties=properties,
            context=context,
            timestamp=timestamp,
            anonymous_id=anonymous_id,
            integrations=integrations
        )

    def page(
        self,
        user_id: str,
        category: Optional[str] = None,
        name: Optional[str] = None,
        properties: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        anonymous_id: Optional[str] = None,
        integrations: Optional[Dict[str, bool]] = None
    ) -> None:
        """Track a page view."""
        analytics.page(
            user_id=user_id,
            category=category,
            name=name,
            properties=properties,
            context=context,
            timestamp=timestamp,
            anonymous_id=anonymous_id,
            integrations=integrations
        )

    def screen(
        self,
        user_id: str,
        name: str,
        properties: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        anonymous_id: Optional[str] = None,
        integrations: Optional[Dict[str, bool]] = None
    ) -> None:
        """Track a screen view (mobile)."""
        analytics.screen(
            user_id=user_id,
            name=name,
            properties=properties,
            context=context,
            timestamp=timestamp,
            anonymous_id=anonymous_id,
            integrations=integrations
        )

    def group(
        self,
        user_id: str,
        group_id: str,
        traits: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        anonymous_id: Optional[str] = None,
        integrations: Optional[Dict[str, bool]] = None
    ) -> None:
        """Associate user with a group."""
        analytics.group(
            user_id=user_id,
            group_id=group_id,
            traits=traits,
            context=context,
            timestamp=timestamp,
            anonymous_id=anonymous_id,
            integrations=integrations
        )

    def alias(
        self,
        user_id: str,
        previous_id: str,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
        integrations: Optional[Dict[str, bool]] = None
    ) -> None:
        """Alias two user IDs."""
        analytics.alias(
            user_id=user_id,
            previous_id=previous_id,
            context=context,
            timestamp=timestamp,
            integrations=integrations
        )

    def flush(self) -> None:
        """Flush queued messages."""
        analytics.flush()

    def shutdown(self) -> None:
        """Shutdown the analytics client."""
        analytics.shutdown()


# E-commerce tracking
class EcommerceTracker:
    def __init__(self, segment_service: SegmentService):
        self.segment = segment_service

    def product_viewed(
        self,
        user_id: str,
        product_id: str,
        name: str,
        price: float,
        category: Optional[str] = None,
        sku: Optional[str] = None,
        brand: Optional[str] = None,
        variant: Optional[str] = None,
        currency: str = 'USD'
    ) -> None:
        self.segment.track(
            user_id=user_id,
            event='Product Viewed',
            properties={
                'product_id': product_id,
                'name': name,
                'price': price,
                'category': category,
                'sku': sku,
                'brand': brand,
                'variant': variant,
                'currency': currency
            }
        )

    def product_added(
        self,
        user_id: str,
        cart_id: str,
        product_id: str,
        name: str,
        price: float,
        quantity: int,
        category: Optional[str] = None,
        currency: str = 'USD'
    ) -> None:
        self.segment.track(
            user_id=user_id,
            event='Product Added',
            properties={
                'cart_id': cart_id,
                'product_id': product_id,
                'name': name,
                'price': price,
                'quantity': quantity,
                'category': category,
                'currency': currency
            }
        )

    def checkout_started(
        self,
        user_id: str,
        order_id: str,
        value: float,
        products: List[Dict[str, Any]],
        currency: str = 'USD',
        coupon: Optional[str] = None
    ) -> None:
        self.segment.track(
            user_id=user_id,
            event='Checkout Started',
            properties={
                'order_id': order_id,
                'value': value,
                'currency': currency,
                'coupon': coupon,
                'products': products
            }
        )

    def order_completed(
        self,
        user_id: str,
        order_id: str,
        total: float,
        revenue: float,
        products: List[Dict[str, Any]],
        currency: str = 'USD',
        shipping: Optional[float] = None,
        tax: Optional[float] = None,
        discount: Optional[float] = None,
        coupon: Optional[str] = None
    ) -> None:
        self.segment.track(
            user_id=user_id,
            event='Order Completed',
            properties={
                'order_id': order_id,
                'total': total,
                'revenue': revenue,
                'currency': currency,
                'shipping': shipping,
                'tax': tax,
                'discount': discount,
                'coupon': coupon,
                'products': products
            }
        )


# FastAPI routes
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/segment", tags=["segment"])
segment_service = SegmentService()

class IdentifyRequest(BaseModel):
    user_id: str
    traits: Optional[Dict[str, Any]] = None
    anonymous_id: Optional[str] = None

class TrackRequest(BaseModel):
    user_id: Optional[str] = None
    event: str
    properties: Optional[Dict[str, Any]] = None
    anonymous_id: Optional[str] = None

class PageRequest(BaseModel):
    user_id: Optional[str] = None
    category: Optional[str] = None
    name: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    anonymous_id: Optional[str] = None

class GroupRequest(BaseModel):
    user_id: str
    group_id: str
    traits: Optional[Dict[str, Any]] = None
    anonymous_id: Optional[str] = None

class AliasRequest(BaseModel):
    user_id: str
    previous_id: str

@router.post("/identify")
async def identify_user(request: IdentifyRequest, req: Request):
    try:
        context = {
            'ip': req.client.host if req.client else None,
            'userAgent': req.headers.get('user-agent')
        }
        segment_service.identify(
            user_id=request.user_id,
            traits=request.traits,
            anonymous_id=request.anonymous_id,
            context=context
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track")
async def track_event(request: TrackRequest, req: Request):
    try:
        if not request.user_id and not request.anonymous_id:
            raise HTTPException(status_code=400, detail="user_id or anonymous_id required")

        context = {
            'ip': req.client.host if req.client else None,
            'userAgent': req.headers.get('user-agent')
        }
        segment_service.track(
            user_id=request.user_id or '',
            event=request.event,
            properties=request.properties,
            anonymous_id=request.anonymous_id,
            context=context
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/page")
async def track_page(request: PageRequest, req: Request):
    try:
        context = {
            'ip': req.client.host if req.client else None,
            'userAgent': req.headers.get('user-agent')
        }
        segment_service.page(
            user_id=request.user_id or '',
            category=request.category,
            name=request.name,
            properties=request.properties,
            anonymous_id=request.anonymous_id,
            context=context
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/group")
async def group_user(request: GroupRequest, req: Request):
    try:
        context = {
            'ip': req.client.host if req.client else None,
            'userAgent': req.headers.get('user-agent')
        }
        segment_service.group(
            user_id=request.user_id,
            group_id=request.group_id,
            traits=request.traits,
            anonymous_id=request.anonymous_id,
            context=context
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alias")
async def alias_user(request: AliasRequest, req: Request):
    try:
        context = {
            'ip': req.client.host if req.client else None,
            'userAgent': req.headers.get('user-agent')
        }
        segment_service.alias(
            user_id=request.user_id,
            previous_id=request.previous_id,
            context=context
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flush")
async def flush_events():
    try:
        segment_service.flush()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Segment CDP

### Commands
- `segment:identify <userId> [traits]` - Identify user
- `segment:track <userId> <event> [properties]` - Track event
- `segment:page <userId> [name] [properties]` - Track page view
- `segment:group <userId> <groupId> [traits]` - Group user

### Key Files
- `src/services/segment-server.ts` - Server-side SDK
- `src/services/segment-browser.ts` - Browser SDK
- `src/middleware/segment-tracking.ts` - Express middleware
- `src/hooks/useSegment.tsx` - React hooks

### Spec Events
Follow Segment's spec for standard events:
- E-commerce: Product Viewed, Product Added, Order Completed
- B2B: Account Created, Signed Up, Trial Started
- Mobile: Application Opened, Push Notification Tapped
```

## AI Suggestions

1. **Identity Resolution**: Implement cross-device identity stitching with alias calls
2. **Destination Functions**: Create custom destination functions for specialized routing
3. **Protocols**: Use Segment Protocols for event schema validation
4. **Personas**: Implement computed traits and audiences with Personas
5. **Replay**: Set up event replay for new destination backfills
6. **Consent Management**: Integrate with consent management for GDPR/CCPA
7. **Source Functions**: Build custom sources for non-standard data
8. **Data Lakes**: Configure warehouse destinations for raw data access
9. **Privacy Portal**: Implement user data deletion workflows
10. **Integration Filtering**: Set up per-destination event filtering
