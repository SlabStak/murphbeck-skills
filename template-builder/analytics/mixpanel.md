# Mixpanel Analytics

## Overview
Complete Mixpanel integration for product analytics with event tracking, user profiles, cohorts, funnels, and retention analysis across web, mobile, and server environments.

## Quick Start
```bash
npm install mixpanel mixpanel-browser
```

## Implementation

### TypeScript Mixpanel Service
```typescript
// mixpanel.service.ts
import Mixpanel from 'mixpanel';
import mixpanelBrowser from 'mixpanel-browser';

interface MixpanelConfig {
  token: string;
  apiSecret?: string; // For server-side import API
  host?: string;
}

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined | string[] | Date;
}

interface UserProfile {
  $email?: string;
  $name?: string;
  $first_name?: string;
  $last_name?: string;
  $phone?: string;
  $avatar?: string;
  $city?: string;
  $region?: string;
  $country_code?: string;
  $timezone?: string;
  $created?: Date;
  [key: string]: unknown;
}

interface GroupProfile {
  $name?: string;
  [key: string]: unknown;
}

class MixpanelServerService {
  private client: Mixpanel.Mixpanel;
  private apiSecret?: string;
  private token: string;

  constructor(config: MixpanelConfig) {
    this.client = Mixpanel.init(config.token, {
      host: config.host || 'api.mixpanel.com',
    });
    this.apiSecret = config.apiSecret;
    this.token = config.token;
  }

  // Track event
  track(
    distinctId: string,
    event: string,
    properties?: EventProperties
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.track(event, {
        distinct_id: distinctId,
        ...properties,
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Track multiple events (batch)
  trackBatch(events: Array<{
    event: string;
    distinctId: string;
    properties?: EventProperties;
    time?: Date;
  }>): Promise<void> {
    return new Promise((resolve, reject) => {
      const batch = events.map(e => ({
        event: e.event,
        properties: {
          distinct_id: e.distinctId,
          time: e.time ? Math.floor(e.time.getTime() / 1000) : undefined,
          ...e.properties,
        },
      }));

      this.client.track_batch(batch, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Identify user (alias)
  alias(distinctId: string, alias: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.alias(distinctId, alias, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Set user profile properties
  peopleSet(distinctId: string, properties: UserProfile): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.set(distinctId, properties, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Set properties only if not already set
  peopleSetOnce(distinctId: string, properties: UserProfile): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.set_once(distinctId, properties, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Increment numeric property
  peopleIncrement(
    distinctId: string,
    property: string,
    by: number = 1
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.increment(distinctId, property, by, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Append to list property
  peopleAppend(
    distinctId: string,
    property: string,
    value: unknown
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.append(distinctId, property, value, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Union with list property (add unique values)
  peopleUnion(
    distinctId: string,
    property: string,
    values: unknown[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.union(distinctId, property, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Remove from list property
  peopleRemove(
    distinctId: string,
    property: string,
    value: unknown
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.remove(distinctId, property, value, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Unset user properties
  peopleUnset(distinctId: string, properties: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.unset(distinctId, properties, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Delete user profile
  peopleDelete(distinctId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.delete_user(distinctId, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Track revenue
  peopleTrackCharge(
    distinctId: string,
    amount: number,
    properties?: EventProperties
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.people.track_charge(distinctId, amount, properties, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Group analytics
  groupSet(
    groupKey: string,
    groupId: string,
    properties: GroupProfile
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.groups.set(groupKey, groupId, properties, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  groupSetOnce(
    groupKey: string,
    groupId: string,
    properties: GroupProfile
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.groups.set_once(groupKey, groupId, properties, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  groupUnion(
    groupKey: string,
    groupId: string,
    property: string,
    values: unknown[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.groups.union(groupKey, groupId, property, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Import historical data (requires API secret)
  async importEvents(events: Array<{
    event: string;
    distinctId: string;
    time: Date;
    properties?: EventProperties;
  }>): Promise<void> {
    if (!this.apiSecret) {
      throw new Error('API secret required for data import');
    }

    const importData = events.map(e => ({
      event: e.event,
      properties: {
        distinct_id: e.distinctId,
        time: Math.floor(e.time.getTime() / 1000),
        $insert_id: `${e.distinctId}-${e.event}-${e.time.getTime()}`,
        ...e.properties,
      },
    }));

    const response = await fetch('https://api.mixpanel.com/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${this.apiSecret}:`).toString('base64')}`,
      },
      body: JSON.stringify(importData),
    });

    if (!response.ok) {
      throw new Error(`Import failed: ${await response.text()}`);
    }
  }

  // Export data (requires API secret)
  async exportEvents(options: {
    fromDate: Date;
    toDate: Date;
    event?: string;
    limit?: number;
  }): Promise<unknown[]> {
    if (!this.apiSecret) {
      throw new Error('API secret required for data export');
    }

    const params = new URLSearchParams({
      from_date: options.fromDate.toISOString().split('T')[0],
      to_date: options.toDate.toISOString().split('T')[0],
    });

    if (options.event) params.append('event', JSON.stringify([options.event]));
    if (options.limit) params.append('limit', String(options.limit));

    const response = await fetch(
      `https://data.mixpanel.com/api/2.0/export?${params}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.apiSecret}:`).toString('base64')}`,
        },
      }
    );

    const text = await response.text();
    return text.split('\n').filter(Boolean).map(line => JSON.parse(line));
  }
}

// Browser client
class MixpanelBrowserService {
  private initialized = false;

  init(token: string, options?: {
    debug?: boolean;
    trackPageview?: boolean;
    persistence?: 'cookie' | 'localStorage';
    crossSubdomainCookie?: boolean;
    secureCookie?: boolean;
    propertyBlacklist?: string[];
    apiHost?: string;
    appHost?: string;
    cdnHost?: string;
    disableCookie?: boolean;
    disablePersistence?: boolean;
    ignoreDnt?: boolean;
    batchRequests?: boolean;
    batchFlushInterval?: number;
  }): void {
    if (this.initialized) return;

    mixpanelBrowser.init(token, {
      debug: options?.debug ?? false,
      track_pageview: options?.trackPageview ?? true,
      persistence: options?.persistence || 'cookie',
      cross_subdomain_cookie: options?.crossSubdomainCookie ?? true,
      secure_cookie: options?.secureCookie ?? true,
      property_blacklist: options?.propertyBlacklist || [],
      api_host: options?.apiHost || 'https://api-js.mixpanel.com',
      app_host: options?.appHost || 'https://mixpanel.com',
      cdn: options?.cdnHost || 'https://cdn.mxpnl.com',
      disable_cookie: options?.disableCookie ?? false,
      disable_persistence: options?.disablePersistence ?? false,
      ignore_dnt: options?.ignoreDnt ?? false,
      batch_requests: options?.batchRequests ?? true,
      batch_flush_interval_ms: options?.batchFlushInterval || 5000,
    });

    this.initialized = true;
  }

  track(event: string, properties?: EventProperties): void {
    mixpanelBrowser.track(event, properties);
  }

  trackLinks(selector: string, event: string, properties?: EventProperties | (() => EventProperties)): void {
    mixpanelBrowser.track_links(selector, event, properties);
  }

  trackForms(selector: string, event: string, properties?: EventProperties | (() => EventProperties)): void {
    mixpanelBrowser.track_forms(selector, event, properties);
  }

  timeEvent(event: string): void {
    mixpanelBrowser.time_event(event);
  }

  identify(distinctId: string): void {
    mixpanelBrowser.identify(distinctId);
  }

  alias(alias: string, distinctId?: string): void {
    mixpanelBrowser.alias(alias, distinctId);
  }

  reset(): void {
    mixpanelBrowser.reset();
  }

  getDistinctId(): string {
    return mixpanelBrowser.get_distinct_id();
  }

  register(properties: EventProperties): void {
    mixpanelBrowser.register(properties);
  }

  registerOnce(properties: EventProperties): void {
    mixpanelBrowser.register_once(properties);
  }

  unregister(property: string): void {
    mixpanelBrowser.unregister(property);
  }

  // People methods
  peopleSet(properties: UserProfile): void {
    mixpanelBrowser.people.set(properties);
  }

  peopleSetOnce(properties: UserProfile): void {
    mixpanelBrowser.people.set_once(properties);
  }

  peopleIncrement(property: string | Record<string, number>): void {
    mixpanelBrowser.people.increment(property);
  }

  peopleAppend(property: string, value: unknown): void {
    mixpanelBrowser.people.append(property, value);
  }

  peopleUnion(property: string, values: unknown[]): void {
    mixpanelBrowser.people.union(property, values);
  }

  peopleRemove(property: string, value: unknown): void {
    mixpanelBrowser.people.remove(property, value);
  }

  peopleUnset(properties: string[]): void {
    mixpanelBrowser.people.unset(properties);
  }

  peopleTrackCharge(amount: number, properties?: EventProperties): void {
    mixpanelBrowser.people.track_charge(amount, properties);
  }

  // Group methods
  setGroup(groupKey: string, groupId: string | string[]): void {
    mixpanelBrowser.set_group(groupKey, groupId);
  }

  addGroup(groupKey: string, groupId: string): void {
    mixpanelBrowser.add_group(groupKey, groupId);
  }

  removeGroup(groupKey: string, groupId: string): void {
    mixpanelBrowser.remove_group(groupKey, groupId);
  }

  // Opt-out
  optInTracking(): void {
    mixpanelBrowser.opt_in_tracking();
  }

  optOutTracking(): void {
    mixpanelBrowser.opt_out_tracking();
  }

  hasOptedOut(): boolean {
    return mixpanelBrowser.has_opted_out_tracking();
  }

  hasOptedIn(): boolean {
    return mixpanelBrowser.has_opted_in_tracking();
  }

  clearOptInOut(): void {
    mixpanelBrowser.clear_opt_in_out_tracking();
  }
}

export const mixpanelServer = new MixpanelServerService({
  token: process.env.MIXPANEL_TOKEN!,
  apiSecret: process.env.MIXPANEL_API_SECRET,
});

export const mixpanelBrowser = new MixpanelBrowserService();
```

### Express.js API Routes
```typescript
// routes/mixpanel.routes.ts
import { Router, Request, Response } from 'express';
import { mixpanelServer } from '../services/mixpanel.service';

const router = Router();

// Track event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { distinctId, event, properties } = req.body;

    await mixpanelServer.track(distinctId, event, properties);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Track batch events
router.post('/track/batch', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    await mixpanelServer.trackBatch(events);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Alias user
router.post('/alias', async (req: Request, res: Response) => {
  try {
    const { distinctId, alias } = req.body;

    await mixpanelServer.alias(distinctId, alias);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Set user profile
router.post('/people/set', async (req: Request, res: Response) => {
  try {
    const { distinctId, properties } = req.body;

    await mixpanelServer.peopleSet(distinctId, properties);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Set user profile once
router.post('/people/set-once', async (req: Request, res: Response) => {
  try {
    const { distinctId, properties } = req.body;

    await mixpanelServer.peopleSetOnce(distinctId, properties);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Increment user property
router.post('/people/increment', async (req: Request, res: Response) => {
  try {
    const { distinctId, property, by } = req.body;

    await mixpanelServer.peopleIncrement(distinctId, property, by);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Track revenue
router.post('/people/charge', async (req: Request, res: Response) => {
  try {
    const { distinctId, amount, properties } = req.body;

    await mixpanelServer.peopleTrackCharge(distinctId, amount, properties);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete user
router.delete('/people/:distinctId', async (req: Request, res: Response) => {
  try {
    const { distinctId } = req.params;

    await mixpanelServer.peopleDelete(distinctId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Set group profile
router.post('/groups/set', async (req: Request, res: Response) => {
  try {
    const { groupKey, groupId, properties } = req.body;

    await mixpanelServer.groupSet(groupKey, groupId, properties);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Import historical data
router.post('/import', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    await mixpanelServer.importEvents(events.map((e: any) => ({
      ...e,
      time: new Date(e.time),
    })));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Export data
router.get('/export', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, event, limit } = req.query;

    const data = await mixpanelServer.exportEvents({
      fromDate: new Date(fromDate as string),
      toDate: new Date(toDate as string),
      event: event as string,
      limit: limit ? Number(limit) : undefined,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React Mixpanel Provider & Hooks
```tsx
// components/MixpanelProvider.tsx
import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { mixpanelBrowser } from '../services/mixpanel.service';

interface MixpanelContextType {
  track: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string) => void;
  alias: (alias: string) => void;
  reset: () => void;
  getDistinctId: () => string;
  register: (properties: Record<string, unknown>) => void;
  registerOnce: (properties: Record<string, unknown>) => void;
  peopleSet: (properties: Record<string, unknown>) => void;
  peopleSetOnce: (properties: Record<string, unknown>) => void;
  peopleIncrement: (property: string | Record<string, number>) => void;
  trackCharge: (amount: number, properties?: Record<string, unknown>) => void;
  setGroup: (groupKey: string, groupId: string | string[]) => void;
  timeEvent: (event: string) => void;
  optIn: () => void;
  optOut: () => void;
  hasOptedOut: () => boolean;
}

const MixpanelContext = createContext<MixpanelContextType | null>(null);

interface MixpanelProviderProps {
  token: string;
  children: ReactNode;
  debug?: boolean;
  trackPageview?: boolean;
  persistence?: 'cookie' | 'localStorage';
}

export const MixpanelProvider: React.FC<MixpanelProviderProps> = ({
  token,
  children,
  debug = false,
  trackPageview = true,
  persistence = 'cookie',
}) => {
  useEffect(() => {
    mixpanelBrowser.init(token, {
      debug,
      trackPageview,
      persistence,
    });
  }, [token, debug, trackPageview, persistence]);

  const value: MixpanelContextType = {
    track: mixpanelBrowser.track.bind(mixpanelBrowser),
    identify: mixpanelBrowser.identify.bind(mixpanelBrowser),
    alias: mixpanelBrowser.alias.bind(mixpanelBrowser),
    reset: mixpanelBrowser.reset.bind(mixpanelBrowser),
    getDistinctId: mixpanelBrowser.getDistinctId.bind(mixpanelBrowser),
    register: mixpanelBrowser.register.bind(mixpanelBrowser),
    registerOnce: mixpanelBrowser.registerOnce.bind(mixpanelBrowser),
    peopleSet: mixpanelBrowser.peopleSet.bind(mixpanelBrowser),
    peopleSetOnce: mixpanelBrowser.peopleSetOnce.bind(mixpanelBrowser),
    peopleIncrement: mixpanelBrowser.peopleIncrement.bind(mixpanelBrowser),
    trackCharge: mixpanelBrowser.peopleTrackCharge.bind(mixpanelBrowser),
    setGroup: mixpanelBrowser.setGroup.bind(mixpanelBrowser),
    timeEvent: mixpanelBrowser.timeEvent.bind(mixpanelBrowser),
    optIn: mixpanelBrowser.optInTracking.bind(mixpanelBrowser),
    optOut: mixpanelBrowser.optOutTracking.bind(mixpanelBrowser),
    hasOptedOut: mixpanelBrowser.hasOptedOut.bind(mixpanelBrowser),
  };

  return (
    <MixpanelContext.Provider value={value}>
      {children}
    </MixpanelContext.Provider>
  );
};

export function useMixpanel(): MixpanelContextType {
  const context = useContext(MixpanelContext);
  if (!context) {
    throw new Error('useMixpanel must be used within a MixpanelProvider');
  }
  return context;
}

// Track event hook
export function useTrackEvent() {
  const { track, timeEvent } = useMixpanel();

  const trackEvent = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      track(event, properties);
    },
    [track]
  );

  const trackTimedEvent = useCallback(
    (event: string, callback: () => Promise<void> | void) => {
      timeEvent(event);
      const result = callback();
      if (result instanceof Promise) {
        return result.finally(() => track(event));
      }
      track(event);
    },
    [track, timeEvent]
  );

  return { trackEvent, trackTimedEvent };
}

// User identification hook
export function useIdentifyUser() {
  const { identify, reset, peopleSet, peopleSetOnce } = useMixpanel();

  const identifyUser = useCallback(
    (userId: string, properties?: Record<string, unknown>) => {
      identify(userId);
      if (properties) {
        peopleSet(properties);
      }
    },
    [identify, peopleSet]
  );

  const setUserProperties = useCallback(
    (properties: Record<string, unknown>, once = false) => {
      if (once) {
        peopleSetOnce(properties);
      } else {
        peopleSet(properties);
      }
    },
    [peopleSet, peopleSetOnce]
  );

  return { identifyUser, clearUser: reset, setUserProperties };
}

// Revenue tracking hook
export function useRevenueTracking() {
  const { trackCharge, track } = useMixpanel();

  const trackRevenue = useCallback(
    (amount: number, properties?: Record<string, unknown>) => {
      trackCharge(amount, properties);
      track('Revenue', { amount, ...properties });
    },
    [trackCharge, track]
  );

  return { trackRevenue };
}

// Page tracking component
export const MixpanelPageTracker: React.FC<{
  pageName: string;
  properties?: Record<string, unknown>;
}> = ({ pageName, properties }) => {
  const { track } = useMixpanel();

  useEffect(() => {
    track('Page View', {
      page_name: pageName,
      url: window.location.href,
      path: window.location.pathname,
      ...properties,
    });
  }, [pageName, properties, track]);

  return null;
};

// Click tracking component
export const TrackClick: React.FC<{
  event: string;
  properties?: Record<string, unknown>;
  children: ReactNode;
}> = ({ event, properties, children }) => {
  const { track } = useMixpanel();

  const handleClick = () => {
    track(event, properties);
  };

  return (
    <span onClick={handleClick}>
      {children}
    </span>
  );
};
```

### Python Implementation
```python
# mixpanel_service.py
from typing import Optional, Dict, Any, List
from datetime import datetime
import json
import base64
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/mixpanel", tags=["mixpanel"])

MIXPANEL_TOKEN = "your-mixpanel-token"
MIXPANEL_API_SECRET = "your-api-secret"


class TrackRequest(BaseModel):
    distinct_id: str
    event: str
    properties: Optional[Dict[str, Any]] = None


class PeopleSetRequest(BaseModel):
    distinct_id: str
    properties: Dict[str, Any]


class ChargeRequest(BaseModel):
    distinct_id: str
    amount: float
    properties: Optional[Dict[str, Any]] = None


class MixpanelService:
    def __init__(self, token: str, api_secret: Optional[str] = None):
        self.token = token
        self.api_secret = api_secret
        self.track_url = "https://api.mixpanel.com/track"
        self.engage_url = "https://api.mixpanel.com/engage"
        self.import_url = "https://api.mixpanel.com/import"

    async def track(
        self,
        distinct_id: str,
        event: str,
        properties: Optional[Dict[str, Any]] = None
    ) -> bool:
        data = {
            "event": event,
            "properties": {
                "token": self.token,
                "distinct_id": distinct_id,
                **(properties or {})
            }
        }

        encoded = base64.b64encode(json.dumps([data]).encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.track_url,
                data={"data": encoded}
            )
            return response.text == "1"

    async def track_batch(
        self,
        events: List[Dict[str, Any]]
    ) -> bool:
        data = [
            {
                "event": e["event"],
                "properties": {
                    "token": self.token,
                    "distinct_id": e["distinct_id"],
                    **(e.get("properties") or {})
                }
            }
            for e in events
        ]

        encoded = base64.b64encode(json.dumps(data).encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.track_url,
                data={"data": encoded}
            )
            return response.text == "1"

    async def people_set(
        self,
        distinct_id: str,
        properties: Dict[str, Any]
    ) -> bool:
        data = {
            "$token": self.token,
            "$distinct_id": distinct_id,
            "$set": properties
        }

        encoded = base64.b64encode(json.dumps([data]).encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.engage_url,
                data={"data": encoded}
            )
            return response.text == "1"

    async def people_set_once(
        self,
        distinct_id: str,
        properties: Dict[str, Any]
    ) -> bool:
        data = {
            "$token": self.token,
            "$distinct_id": distinct_id,
            "$set_once": properties
        }

        encoded = base64.b64encode(json.dumps([data]).encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.engage_url,
                data={"data": encoded}
            )
            return response.text == "1"

    async def people_increment(
        self,
        distinct_id: str,
        property_name: str,
        by: int = 1
    ) -> bool:
        data = {
            "$token": self.token,
            "$distinct_id": distinct_id,
            "$add": {property_name: by}
        }

        encoded = base64.b64encode(json.dumps([data]).encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.engage_url,
                data={"data": encoded}
            )
            return response.text == "1"

    async def track_charge(
        self,
        distinct_id: str,
        amount: float,
        properties: Optional[Dict[str, Any]] = None
    ) -> bool:
        charge_data = {"$amount": amount}
        if properties:
            charge_data.update(properties)

        data = {
            "$token": self.token,
            "$distinct_id": distinct_id,
            "$append": {"$transactions": charge_data}
        }

        encoded = base64.b64encode(json.dumps([data]).encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.engage_url,
                data={"data": encoded}
            )
            return response.text == "1"

    async def import_events(
        self,
        events: List[Dict[str, Any]]
    ) -> bool:
        if not self.api_secret:
            raise ValueError("API secret required for import")

        data = [
            {
                "event": e["event"],
                "properties": {
                    "distinct_id": e["distinct_id"],
                    "time": int(e["time"].timestamp()) if isinstance(e["time"], datetime) else e["time"],
                    "$insert_id": f"{e['distinct_id']}-{e['event']}-{e.get('time', '')}",
                    **(e.get("properties") or {})
                }
            }
            for e in events
        ]

        auth = base64.b64encode(f"{self.api_secret}:".encode()).decode()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.import_url,
                headers={
                    "Authorization": f"Basic {auth}",
                    "Content-Type": "application/json"
                },
                json=data
            )
            return response.status_code == 200


# Initialize service
mixpanel = MixpanelService(MIXPANEL_TOKEN, MIXPANEL_API_SECRET)


@router.post("/track")
async def track_event(request: TrackRequest):
    success = await mixpanel.track(
        request.distinct_id,
        request.event,
        request.properties
    )
    return {"success": success}


@router.post("/people/set")
async def people_set(request: PeopleSetRequest):
    success = await mixpanel.people_set(
        request.distinct_id,
        request.properties
    )
    return {"success": success}


@router.post("/people/charge")
async def track_charge(request: ChargeRequest):
    success = await mixpanel.track_charge(
        request.distinct_id,
        request.amount,
        request.properties
    )
    return {"success": success}
```

## CLAUDE.md Integration
```markdown
## Mixpanel Analytics Commands

### Event tracking
"Track sign_up event for user_123"
"Track purchase event with $99 revenue"
"Import historical events from CSV"

### User profiles
"Set user email and name"
"Increment login_count for user"
"Track $50 charge for user_123"

### Groups
"Set company group properties"
"Add user to company group"

### Data management
"Export events from last 30 days"
"Delete user profile for GDPR"
```

## AI Suggestions
1. Build automatic funnel tracking
2. Add cohort analysis automation
3. Create retention reports
4. Implement A/B test analysis
5. Add property type validation
6. Build event taxonomy management
7. Create anomaly detection
8. Add cross-platform identity merge
9. Implement data quality alerts
10. Build custom report generation
