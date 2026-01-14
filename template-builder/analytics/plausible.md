# Plausible Analytics

Production-ready Plausible integration for privacy-focused, cookie-free web analytics.

## Overview

Plausible is a lightweight, privacy-friendly analytics platform that doesn't use cookies or track personal data. This template provides complete Plausible integration with event tracking and API access.

## Quick Start

```bash
npm install plausible-tracker
# Or for script tag approach, no package needed
```

## TypeScript Implementation

### Browser Analytics Service

```typescript
// src/services/plausible-browser.ts
import Plausible from 'plausible-tracker';

interface PlausibleConfig {
  domain: string;
  apiHost?: string;
  trackLocalhost?: boolean;
  hashMode?: boolean;
}

interface EventOptions {
  callback?: () => void;
  props?: Record<string, string | number | boolean>;
  revenue?: {
    currency: string;
    amount: number;
  };
}

interface PageviewOptions {
  url?: string;
  referrer?: string | null;
  deviceWidth?: number;
}

class PlausibleBrowserService {
  private plausible: ReturnType<typeof Plausible> | null = null;
  private domain: string = '';
  private enabled = true;

  initialize(config: PlausibleConfig): void {
    this.domain = config.domain;

    this.plausible = Plausible({
      domain: config.domain,
      apiHost: config.apiHost || 'https://plausible.io',
      trackLocalhost: config.trackLocalhost || false,
      hashMode: config.hashMode || false,
    });
  }

  // Track page view
  trackPageview(options?: PageviewOptions): void {
    if (!this.plausible || !this.enabled) return;
    this.plausible.trackPageview(options);
  }

  // Track custom event
  trackEvent(
    eventName: string,
    options?: EventOptions
  ): void {
    if (!this.plausible || !this.enabled) return;
    this.plausible.trackEvent(eventName, options);
  }

  // Enable automatic page view tracking
  enableAutoPageviews(): () => void {
    if (!this.plausible) return () => {};
    return this.plausible.enableAutoPageviews();
  }

  // Enable automatic outbound link tracking
  enableAutoOutboundTracking(): () => void {
    if (!this.plausible) return () => {};
    return this.plausible.enableAutoOutboundTracking();
  }

  // Enable file download tracking
  enableAutoFileDownloads(): () => void {
    if (!this.enabled) return () => {};

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a');

      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      const fileExtensions = ['pdf', 'xlsx', 'docx', 'txt', 'csv', 'zip', 'rar'];
      const extension = href.split('.').pop()?.toLowerCase();

      if (extension && fileExtensions.includes(extension)) {
        this.trackEvent('File Download', {
          props: {
            url: href,
            extension,
          },
        });
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }

  // Track 404 errors
  track404(): void {
    if (typeof window === 'undefined') return;

    this.trackEvent('404', {
      props: {
        path: window.location.pathname,
      },
    });
  }

  // Track form submissions
  trackFormSubmission(formName: string, props?: Record<string, any>): void {
    this.trackEvent('Form Submission', {
      props: {
        form: formName,
        ...props,
      },
    });
  }

  // Track button click
  trackButtonClick(buttonName: string, props?: Record<string, any>): void {
    this.trackEvent('Button Click', {
      props: {
        button: buttonName,
        ...props,
      },
    });
  }

  // Track signup
  trackSignup(method?: string): void {
    this.trackEvent('Signup', {
      props: method ? { method } : undefined,
    });
  }

  // Track login
  trackLogin(method?: string): void {
    this.trackEvent('Login', {
      props: method ? { method } : undefined,
    });
  }

  // Track purchase with revenue
  trackPurchase(
    amount: number,
    currency = 'USD',
    props?: Record<string, any>
  ): void {
    this.trackEvent('Purchase', {
      revenue: { currency, amount },
      props,
    });
  }

  // Enable/disable tracking
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // Check if tracking is enabled
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const plausibleBrowser = new PlausibleBrowserService();
```

### API Service for Server-Side

```typescript
// src/services/plausible-api.ts
import fetch from 'node-fetch';

interface PlausibleAPIConfig {
  siteId: string;
  apiKey: string;
  apiHost?: string;
}

interface StatsQuery {
  period?: '12mo' | '6mo' | 'month' | '30d' | '7d' | 'day' | 'custom';
  date?: string;
  filters?: string;
  metrics?: string[];
  compare?: 'previous_period';
}

interface TimeseriesQuery extends StatsQuery {
  interval?: 'date' | 'month';
}

interface BreakdownQuery extends StatsQuery {
  property: string;
  limit?: number;
  page?: number;
}

interface RealtimeQuery {
  filters?: string;
}

interface SendEventParams {
  name: string;
  url: string;
  referrer?: string;
  domain?: string;
  screenWidth?: number;
  props?: Record<string, string | number | boolean>;
}

class PlausibleAPIService {
  private apiKey: string;
  private siteId: string;
  private baseUrl: string;

  constructor(config: PlausibleAPIConfig) {
    this.apiKey = config.apiKey;
    this.siteId = config.siteId;
    this.baseUrl = config.apiHost || 'https://plausible.io';
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            url.searchParams.set(key, value.join(','));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      });
    }

    url.searchParams.set('site_id', this.siteId);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Plausible API error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // Get realtime visitors
  async getRealtimeVisitors(query?: RealtimeQuery): Promise<number> {
    const result = await this.request<number>('/api/v1/stats/realtime/visitors', query);
    return result;
  }

  // Get aggregate stats
  async getAggregateStats(query?: StatsQuery): Promise<{
    results: Record<string, { value: number; change?: number }>;
  }> {
    return this.request('/api/v1/stats/aggregate', {
      period: query?.period || '30d',
      date: query?.date,
      filters: query?.filters,
      metrics: query?.metrics?.join(',') || 'visitors,pageviews,bounce_rate,visit_duration',
      compare: query?.compare,
    });
  }

  // Get timeseries data
  async getTimeseries(query?: TimeseriesQuery): Promise<{
    results: Array<{
      date: string;
      visitors?: number;
      pageviews?: number;
      bounce_rate?: number;
      visit_duration?: number;
      visits?: number;
    }>;
  }> {
    return this.request('/api/v1/stats/timeseries', {
      period: query?.period || '30d',
      date: query?.date,
      filters: query?.filters,
      metrics: query?.metrics?.join(',') || 'visitors',
      interval: query?.interval || 'date',
    });
  }

  // Get breakdown by property
  async getBreakdown(query: BreakdownQuery): Promise<{
    results: Array<Record<string, any>>;
  }> {
    return this.request('/api/v1/stats/breakdown', {
      period: query.period || '30d',
      date: query.date,
      filters: query.filters,
      metrics: query.metrics?.join(',') || 'visitors',
      property: query.property,
      limit: query.limit || 100,
      page: query.page || 1,
    });
  }

  // Get top pages
  async getTopPages(query?: StatsQuery & { limit?: number }): Promise<{
    results: Array<{ page: string; visitors: number; pageviews?: number }>;
  }> {
    return this.getBreakdown({
      ...query,
      property: 'event:page',
      limit: query?.limit || 10,
    }) as any;
  }

  // Get top sources
  async getTopSources(query?: StatsQuery & { limit?: number }): Promise<{
    results: Array<{ source: string; visitors: number }>;
  }> {
    return this.getBreakdown({
      ...query,
      property: 'visit:source',
      limit: query?.limit || 10,
    }) as any;
  }

  // Get top countries
  async getTopCountries(query?: StatsQuery & { limit?: number }): Promise<{
    results: Array<{ country: string; visitors: number }>;
  }> {
    return this.getBreakdown({
      ...query,
      property: 'visit:country',
      limit: query?.limit || 10,
    }) as any;
  }

  // Get devices breakdown
  async getDevices(query?: StatsQuery): Promise<{
    results: Array<{ device: string; visitors: number }>;
  }> {
    return this.getBreakdown({
      ...query,
      property: 'visit:device',
    }) as any;
  }

  // Get browsers breakdown
  async getBrowsers(query?: StatsQuery): Promise<{
    results: Array<{ browser: string; visitors: number }>;
  }> {
    return this.getBreakdown({
      ...query,
      property: 'visit:browser',
    }) as any;
  }

  // Get custom event breakdown
  async getEventBreakdown(
    eventName: string,
    property: string,
    query?: StatsQuery & { limit?: number }
  ): Promise<{
    results: Array<Record<string, any>>;
  }> {
    return this.getBreakdown({
      ...query,
      property: `event:props:${property}`,
      filters: `event:name==${eventName}${query?.filters ? ';' + query.filters : ''}`,
      limit: query?.limit || 100,
    });
  }

  // Send event from server (for server-side tracking)
  async sendEvent(params: SendEventParams): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'plausible-server-sdk',
      },
      body: JSON.stringify({
        name: params.name,
        url: params.url,
        referrer: params.referrer,
        domain: params.domain || this.siteId,
        screen_width: params.screenWidth,
        props: params.props,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send event: ${response.status}`);
    }
  }
}

export const plausibleAPI = new PlausibleAPIService({
  siteId: process.env.PLAUSIBLE_SITE_ID!,
  apiKey: process.env.PLAUSIBLE_API_KEY!,
  apiHost: process.env.PLAUSIBLE_API_HOST,
});
```

## Express.js API Routes

```typescript
// src/routes/plausible.ts
import { Router, Request, Response } from 'express';
import { plausibleAPI } from '../services/plausible-api';

const router = Router();

// Get realtime visitors
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const { filters } = req.query;
    const visitors = await plausibleAPI.getRealtimeVisitors({
      filters: filters as string,
    });
    res.json({ visitors });
  } catch (error) {
    console.error('Realtime visitors error:', error);
    res.status(500).json({ error: 'Failed to get realtime visitors' });
  }
});

// Get aggregate stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { period, date, filters, metrics, compare } = req.query;

    const stats = await plausibleAPI.getAggregateStats({
      period: period as any,
      date: date as string,
      filters: filters as string,
      metrics: metrics ? (metrics as string).split(',') : undefined,
      compare: compare as any,
    });

    res.json(stats);
  } catch (error) {
    console.error('Aggregate stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get timeseries
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const { period, date, filters, metrics, interval } = req.query;

    const data = await plausibleAPI.getTimeseries({
      period: period as any,
      date: date as string,
      filters: filters as string,
      metrics: metrics ? (metrics as string).split(',') : undefined,
      interval: interval as any,
    });

    res.json(data);
  } catch (error) {
    console.error('Timeseries error:', error);
    res.status(500).json({ error: 'Failed to get timeseries' });
  }
});

// Get top pages
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const { period, limit } = req.query;

    const pages = await plausibleAPI.getTopPages({
      period: period as any,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    res.json(pages);
  } catch (error) {
    console.error('Top pages error:', error);
    res.status(500).json({ error: 'Failed to get top pages' });
  }
});

// Get top sources
router.get('/sources', async (req: Request, res: Response) => {
  try {
    const { period, limit } = req.query;

    const sources = await plausibleAPI.getTopSources({
      period: period as any,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    res.json(sources);
  } catch (error) {
    console.error('Top sources error:', error);
    res.status(500).json({ error: 'Failed to get top sources' });
  }
});

// Get top countries
router.get('/countries', async (req: Request, res: Response) => {
  try {
    const { period, limit } = req.query;

    const countries = await plausibleAPI.getTopCountries({
      period: period as any,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    res.json(countries);
  } catch (error) {
    console.error('Top countries error:', error);
    res.status(500).json({ error: 'Failed to get top countries' });
  }
});

// Get breakdown
router.get('/breakdown', async (req: Request, res: Response) => {
  try {
    const { property, period, filters, limit, page } = req.query;

    if (!property) {
      return res.status(400).json({ error: 'property is required' });
    }

    const breakdown = await plausibleAPI.getBreakdown({
      property: property as string,
      period: period as any,
      filters: filters as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
      page: page ? parseInt(page as string, 10) : 1,
    });

    res.json(breakdown);
  } catch (error) {
    console.error('Breakdown error:', error);
    res.status(500).json({ error: 'Failed to get breakdown' });
  }
});

// Send server-side event
router.post('/event', async (req: Request, res: Response) => {
  try {
    const { name, url, referrer, props } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: 'name and url are required' });
    }

    await plausibleAPI.sendEvent({
      name,
      url,
      referrer,
      props,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Send event error:', error);
    res.status(500).json({ error: 'Failed to send event' });
  }
});

export default router;
```

## React Integration

```typescript
// src/hooks/usePlausible.tsx
import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { plausibleBrowser } from '../services/plausible-browser';

interface PlausibleContextValue {
  trackPageview: (options?: { url?: string; referrer?: string }) => void;
  trackEvent: (eventName: string, props?: Record<string, any>) => void;
  trackRevenue: (amount: number, currency?: string, props?: Record<string, any>) => void;
}

const PlausibleContext = createContext<PlausibleContextValue | null>(null);

interface PlausibleProviderProps {
  children: ReactNode;
  domain: string;
  apiHost?: string;
  trackLocalhost?: boolean;
  hashMode?: boolean;
  autoPageviews?: boolean;
  autoOutboundLinks?: boolean;
}

export function PlausibleProvider({
  children,
  domain,
  apiHost,
  trackLocalhost = false,
  hashMode = false,
  autoPageviews = true,
  autoOutboundLinks = true,
}: PlausibleProviderProps) {
  useEffect(() => {
    plausibleBrowser.initialize({
      domain,
      apiHost,
      trackLocalhost,
      hashMode,
    });

    const cleanups: (() => void)[] = [];

    if (autoPageviews) {
      cleanups.push(plausibleBrowser.enableAutoPageviews());
    }

    if (autoOutboundLinks) {
      cleanups.push(plausibleBrowser.enableAutoOutboundTracking());
    }

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [domain, apiHost, trackLocalhost, hashMode, autoPageviews, autoOutboundLinks]);

  const trackPageview = useCallback((options?: { url?: string; referrer?: string }) => {
    plausibleBrowser.trackPageview(options);
  }, []);

  const trackEvent = useCallback((eventName: string, props?: Record<string, any>) => {
    plausibleBrowser.trackEvent(eventName, { props });
  }, []);

  const trackRevenue = useCallback((amount: number, currency = 'USD', props?: Record<string, any>) => {
    plausibleBrowser.trackPurchase(amount, currency, props);
  }, []);

  const value: PlausibleContextValue = {
    trackPageview,
    trackEvent,
    trackRevenue,
  };

  return (
    <PlausibleContext.Provider value={value}>
      {children}
    </PlausibleContext.Provider>
  );
}

export function usePlausible(): PlausibleContextValue {
  const context = useContext(PlausibleContext);
  if (!context) {
    throw new Error('usePlausible must be used within PlausibleProvider');
  }
  return context;
}

// Page tracking hook
export function usePlausiblePageview(
  pageName?: string,
  enabled = true
) {
  const { trackPageview, trackEvent } = usePlausible();

  useEffect(() => {
    if (!enabled) return;

    trackPageview();

    if (pageName) {
      trackEvent('Page View', { page: pageName });
    }
  }, [enabled, pageName, trackPageview, trackEvent]);
}

// Event tracking hook
export function usePlausibleEvent() {
  const { trackEvent } = usePlausible();

  return useCallback(
    (eventName: string, props?: Record<string, any>) => {
      trackEvent(eventName, props);
    },
    [trackEvent]
  );
}

// Click tracking hook
export function usePlausibleClick(
  eventName: string,
  props?: Record<string, any>
) {
  const { trackEvent } = usePlausible();

  return useCallback(() => {
    trackEvent(eventName, props);
  }, [trackEvent, eventName, props]);
}
```

### Plausible Components

```tsx
// src/components/PlausibleTracking.tsx
import React, { ReactNode, useEffect } from 'react';
import { usePlausible, usePlausibleClick } from '../hooks/usePlausible';

// Tracked button
interface TrackedButtonProps {
  eventName: string;
  props?: Record<string, any>;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TrackedButton({
  eventName,
  props,
  onClick,
  children,
  className,
  disabled,
}: TrackedButtonProps) {
  const handleClick = usePlausibleClick(eventName, props);

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

// Tracked link
interface TrackedLinkProps {
  href: string;
  eventName: string;
  props?: Record<string, any>;
  children: ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

export function TrackedLink({
  href,
  eventName,
  props,
  children,
  className,
  target,
  rel,
}: TrackedLinkProps) {
  const { trackEvent } = usePlausible();

  const handleClick = () => {
    trackEvent(eventName, { url: href, ...props });
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  );
}

// Track visibility
interface TrackVisibilityProps {
  eventName: string;
  props?: Record<string, any>;
  threshold?: number;
  children: ReactNode;
}

export function TrackVisibility({
  eventName,
  props,
  threshold = 0.5,
  children,
}: TrackVisibilityProps) {
  const { trackEvent } = usePlausible();
  const ref = React.useRef<HTMLDivElement>(null);
  const tracked = React.useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            trackEvent(eventName, props);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [eventName, props, threshold, trackEvent]);

  return <div ref={ref}>{children}</div>;
}

// Track form submission
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
  const { trackEvent } = usePlausible();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    trackEvent('Form Submit', { form: formName });

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  );
}
```

## Python Implementation

```python
# plausible_service.py
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
import os

class PlausibleService:
    def __init__(
        self,
        site_id: Optional[str] = None,
        api_key: Optional[str] = None,
        api_host: str = 'https://plausible.io'
    ):
        self.site_id = site_id or os.environ.get('PLAUSIBLE_SITE_ID')
        self.api_key = api_key or os.environ.get('PLAUSIBLE_API_KEY')
        self.api_host = api_host
        self.headers = {
            'Authorization': f'Bearer {self.api_key}'
        }

    async def _request(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Any:
        """Make API request."""
        async with httpx.AsyncClient() as client:
            url = f'{self.api_host}{endpoint}'
            params = params or {}
            params['site_id'] = self.site_id

            response = await client.get(
                url,
                params=params,
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_realtime_visitors(
        self,
        filters: Optional[str] = None
    ) -> int:
        """Get realtime visitor count."""
        params = {}
        if filters:
            params['filters'] = filters

        return await self._request(
            '/api/v1/stats/realtime/visitors',
            params
        )

    async def get_aggregate_stats(
        self,
        period: str = '30d',
        date: Optional[str] = None,
        filters: Optional[str] = None,
        metrics: Optional[List[str]] = None,
        compare: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get aggregate statistics."""
        params = {
            'period': period,
            'metrics': ','.join(metrics) if metrics else 'visitors,pageviews,bounce_rate,visit_duration'
        }
        if date:
            params['date'] = date
        if filters:
            params['filters'] = filters
        if compare:
            params['compare'] = compare

        return await self._request('/api/v1/stats/aggregate', params)

    async def get_timeseries(
        self,
        period: str = '30d',
        date: Optional[str] = None,
        filters: Optional[str] = None,
        metrics: Optional[List[str]] = None,
        interval: str = 'date'
    ) -> Dict[str, Any]:
        """Get timeseries data."""
        params = {
            'period': period,
            'interval': interval,
            'metrics': ','.join(metrics) if metrics else 'visitors'
        }
        if date:
            params['date'] = date
        if filters:
            params['filters'] = filters

        return await self._request('/api/v1/stats/timeseries', params)

    async def get_breakdown(
        self,
        property: str,
        period: str = '30d',
        date: Optional[str] = None,
        filters: Optional[str] = None,
        metrics: Optional[List[str]] = None,
        limit: int = 100,
        page: int = 1
    ) -> Dict[str, Any]:
        """Get breakdown by property."""
        params = {
            'property': property,
            'period': period,
            'limit': limit,
            'page': page,
            'metrics': ','.join(metrics) if metrics else 'visitors'
        }
        if date:
            params['date'] = date
        if filters:
            params['filters'] = filters

        return await self._request('/api/v1/stats/breakdown', params)

    async def get_top_pages(
        self,
        period: str = '30d',
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get top pages."""
        return await self.get_breakdown(
            property='event:page',
            period=period,
            limit=limit
        )

    async def get_top_sources(
        self,
        period: str = '30d',
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get top traffic sources."""
        return await self.get_breakdown(
            property='visit:source',
            period=period,
            limit=limit
        )

    async def get_top_countries(
        self,
        period: str = '30d',
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get top countries."""
        return await self.get_breakdown(
            property='visit:country',
            period=period,
            limit=limit
        )

    async def send_event(
        self,
        name: str,
        url: str,
        referrer: Optional[str] = None,
        props: Optional[Dict[str, Any]] = None
    ) -> None:
        """Send server-side event."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f'{self.api_host}/api/event',
                json={
                    'name': name,
                    'url': url,
                    'domain': self.site_id,
                    'referrer': referrer,
                    'props': props
                },
                headers={'User-Agent': 'plausible-python-sdk'}
            )
            response.raise_for_status()


# FastAPI routes
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/plausible", tags=["plausible"])
plausible_service = PlausibleService()

class SendEventRequest(BaseModel):
    name: str
    url: str
    referrer: Optional[str] = None
    props: Optional[Dict[str, Any]] = None

@router.get("/realtime")
async def get_realtime(filters: Optional[str] = None):
    try:
        visitors = await plausible_service.get_realtime_visitors(filters)
        return {"visitors": visitors}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_stats(
    period: str = '30d',
    date: Optional[str] = None,
    filters: Optional[str] = None,
    metrics: Optional[str] = None,
    compare: Optional[str] = None
):
    try:
        stats = await plausible_service.get_aggregate_stats(
            period=period,
            date=date,
            filters=filters,
            metrics=metrics.split(',') if metrics else None,
            compare=compare
        )
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/timeseries")
async def get_timeseries(
    period: str = '30d',
    interval: str = 'date',
    metrics: Optional[str] = None
):
    try:
        data = await plausible_service.get_timeseries(
            period=period,
            interval=interval,
            metrics=metrics.split(',') if metrics else None
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pages")
async def get_pages(period: str = '30d', limit: int = 10):
    try:
        return await plausible_service.get_top_pages(period, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sources")
async def get_sources(period: str = '30d', limit: int = 10):
    try:
        return await plausible_service.get_top_sources(period, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/event")
async def send_event(request: SendEventRequest):
    try:
        await plausible_service.send_event(
            name=request.name,
            url=request.url,
            referrer=request.referrer,
            props=request.props
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Plausible Analytics

### Commands
- `plausible:realtime` - Get realtime visitors
- `plausible:stats [period]` - Get aggregate stats
- `plausible:pages [limit]` - Get top pages

### Key Files
- `src/services/plausible-browser.ts` - Browser tracking
- `src/services/plausible-api.ts` - Stats API
- `src/hooks/usePlausible.tsx` - React hooks

### Event Names
- Custom events must be registered in Plausible dashboard
- Use consistent naming: "Form Submit", "Button Click"
- Props are limited to strings and numbers
```

## AI Suggestions

1. **Self-Hosted**: Deploy Plausible Community Edition for full data ownership
2. **Goals**: Set up conversion goals for key metrics
3. **Custom Events**: Track meaningful user interactions
4. **Revenue**: Enable revenue tracking for e-commerce
5. **Funnels**: Create funnels for conversion analysis
6. **Filters**: Use filters to segment traffic
7. **UTM**: Track campaign parameters automatically
8. **API Dashboard**: Build custom dashboards with API
9. **Proxy**: Set up API proxy to avoid ad blockers
10. **Export**: Schedule regular data exports
