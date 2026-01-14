# PostHog Analytics

## Overview
Complete PostHog integration for product analytics, feature flags, session recording, A/B testing, and user tracking with self-hosted or cloud deployment support.

## Quick Start
```bash
npm install posthog-js posthog-node
```

## Implementation

### TypeScript PostHog Service
```typescript
// posthog.service.ts
import { PostHog } from 'posthog-node';
import posthogJs from 'posthog-js';

interface PostHogConfig {
  apiKey: string;
  host?: string;
  flushAt?: number;
  flushInterval?: number;
  personalApiKey?: string; // For feature flags and experiments
}

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined | string[] | Record<string, unknown>;
}

interface UserProperties {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface FeatureFlag {
  key: string;
  enabled: boolean;
  variant?: string;
  payload?: Record<string, unknown>;
}

interface Experiment {
  key: string;
  variant: string;
}

interface GroupProperties {
  groupType: string;
  groupKey: string;
  properties?: Record<string, unknown>;
}

interface CohortPerson {
  distinctId: string;
  properties: Record<string, unknown>;
}

class PostHogServerService {
  private client: PostHog;
  private personalApiKey?: string;
  private host: string;

  constructor(config: PostHogConfig) {
    this.client = new PostHog(config.apiKey, {
      host: config.host || 'https://app.posthog.com',
      flushAt: config.flushAt || 20,
      flushInterval: config.flushInterval || 10000,
    });

    this.personalApiKey = config.personalApiKey;
    this.host = config.host || 'https://app.posthog.com';
  }

  // Capture event
  capture(
    distinctId: string,
    event: string,
    properties?: EventProperties,
    groups?: Record<string, string>
  ): void {
    this.client.capture({
      distinctId,
      event,
      properties,
      groups,
    });
  }

  // Identify user
  identify(
    distinctId: string,
    properties?: UserProperties,
    groups?: Record<string, string>
  ): void {
    this.client.identify({
      distinctId,
      properties,
      groups,
    });
  }

  // Set user properties (without event)
  setPersonProperties(
    distinctId: string,
    properties: UserProperties,
    propertiesSetOnce?: UserProperties
  ): void {
    if (properties) {
      this.client.capture({
        distinctId,
        event: '$set',
        properties: { $set: properties },
      });
    }

    if (propertiesSetOnce) {
      this.client.capture({
        distinctId,
        event: '$set_once',
        properties: { $set_once: propertiesSetOnce },
      });
    }
  }

  // Alias (merge identities)
  alias(distinctId: string, alias: string): void {
    this.client.alias({
      distinctId,
      alias,
    });
  }

  // Group analytics
  groupIdentify(group: GroupProperties): void {
    this.client.groupIdentify({
      groupType: group.groupType,
      groupKey: group.groupKey,
      properties: group.properties,
    });
  }

  // Feature Flags
  async isFeatureEnabled(
    key: string,
    distinctId: string,
    options?: {
      groups?: Record<string, string>;
      personProperties?: Record<string, unknown>;
      groupProperties?: Record<string, Record<string, unknown>>;
      onlyEvaluateLocally?: boolean;
      sendFeatureFlagEvents?: boolean;
    }
  ): Promise<boolean> {
    return await this.client.isFeatureEnabled(key, distinctId, options) ?? false;
  }

  async getFeatureFlag(
    key: string,
    distinctId: string,
    options?: {
      groups?: Record<string, string>;
      personProperties?: Record<string, unknown>;
      groupProperties?: Record<string, Record<string, unknown>>;
      onlyEvaluateLocally?: boolean;
      sendFeatureFlagEvents?: boolean;
    }
  ): Promise<string | boolean | undefined> {
    return await this.client.getFeatureFlag(key, distinctId, options);
  }

  async getFeatureFlagPayload(
    key: string,
    distinctId: string,
    matchValue?: string | boolean
  ): Promise<Record<string, unknown> | undefined> {
    return await this.client.getFeatureFlagPayload(key, distinctId, matchValue);
  }

  async getAllFlags(
    distinctId: string,
    options?: {
      groups?: Record<string, string>;
      personProperties?: Record<string, unknown>;
      groupProperties?: Record<string, Record<string, unknown>>;
      onlyEvaluateLocally?: boolean;
    }
  ): Promise<Record<string, string | boolean>> {
    return await this.client.getAllFlags(distinctId, options);
  }

  // Reload feature flags (for local evaluation)
  async reloadFeatureFlags(): Promise<void> {
    await this.client.reloadFeatureFlags();
  }

  // Page view
  pageView(
    distinctId: string,
    url: string,
    properties?: EventProperties
  ): void {
    this.capture(distinctId, '$pageview', {
      $current_url: url,
      ...properties,
    });
  }

  // Screen view (mobile)
  screenView(
    distinctId: string,
    screenName: string,
    properties?: EventProperties
  ): void {
    this.capture(distinctId, '$screen', {
      $screen_name: screenName,
      ...properties,
    });
  }

  // Revenue tracking
  trackRevenue(
    distinctId: string,
    amount: number,
    currency: string = 'USD',
    properties?: EventProperties
  ): void {
    this.capture(distinctId, 'purchase', {
      $revenue: amount,
      $currency: currency,
      ...properties,
    });
  }

  // Flush events
  async flush(): Promise<void> {
    await this.client.flush();
  }

  // Shutdown
  async shutdown(): Promise<void> {
    await this.client.shutdown();
  }

  // API Methods (require personal API key)
  async getPersons(options: {
    limit?: number;
    offset?: number;
    search?: string;
    cohort?: number;
  } = {}): Promise<CohortPerson[]> {
    if (!this.personalApiKey) {
      throw new Error('Personal API key required for this operation');
    }

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));
    if (options.search) params.append('search', options.search);
    if (options.cohort) params.append('cohort', String(options.cohort));

    const response = await fetch(`${this.host}/api/persons/?${params}`, {
      headers: {
        Authorization: `Bearer ${this.personalApiKey}`,
      },
    });

    const data = await response.json();
    return data.results.map((p: any) => ({
      distinctId: p.distinct_ids[0],
      properties: p.properties,
    }));
  }

  async getCohorts(): Promise<Array<{ id: number; name: string; count: number }>> {
    if (!this.personalApiKey) {
      throw new Error('Personal API key required for this operation');
    }

    const response = await fetch(`${this.host}/api/cohort/`, {
      headers: {
        Authorization: `Bearer ${this.personalApiKey}`,
      },
    });

    const data = await response.json();
    return data.results.map((c: any) => ({
      id: c.id,
      name: c.name,
      count: c.count,
    }));
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    if (!this.personalApiKey) {
      throw new Error('Personal API key required for this operation');
    }

    const response = await fetch(`${this.host}/api/feature_flag/`, {
      headers: {
        Authorization: `Bearer ${this.personalApiKey}`,
      },
    });

    const data = await response.json();
    return data.results.map((f: any) => ({
      key: f.key,
      enabled: f.active,
      variant: f.filters?.multivariate?.variants?.[0]?.key,
    }));
  }

  async getExperiments(): Promise<Experiment[]> {
    if (!this.personalApiKey) {
      throw new Error('Personal API key required for this operation');
    }

    const response = await fetch(`${this.host}/api/experiments/`, {
      headers: {
        Authorization: `Bearer ${this.personalApiKey}`,
      },
    });

    const data = await response.json();
    return data.results.map((e: any) => ({
      key: e.feature_flag?.key,
      variant: e.parameters?.feature_flag_variants?.[0]?.key || 'control',
    }));
  }
}

// Browser client (singleton)
class PostHogBrowserService {
  private initialized = false;

  init(apiKey: string, options?: {
    apiHost?: string;
    autocapture?: boolean;
    capturePageview?: boolean;
    capturePageleave?: boolean;
    disableSessionRecording?: boolean;
    persistence?: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
    bootstrap?: {
      distinctID?: string;
      featureFlags?: Record<string, string | boolean>;
    };
  }): void {
    if (this.initialized) return;

    posthogJs.init(apiKey, {
      api_host: options?.apiHost || 'https://app.posthog.com',
      autocapture: options?.autocapture ?? true,
      capture_pageview: options?.capturePageview ?? true,
      capture_pageleave: options?.capturePageleave ?? true,
      disable_session_recording: options?.disableSessionRecording ?? false,
      persistence: options?.persistence || 'localStorage',
      bootstrap: options?.bootstrap,
    });

    this.initialized = true;
  }

  capture(event: string, properties?: EventProperties): void {
    posthogJs.capture(event, properties);
  }

  identify(distinctId: string, properties?: UserProperties): void {
    posthogJs.identify(distinctId, properties);
  }

  reset(): void {
    posthogJs.reset();
  }

  alias(alias: string): void {
    posthogJs.alias(alias);
  }

  setPersonProperties(properties: UserProperties): void {
    posthogJs.people.set(properties);
  }

  setPersonPropertiesOnce(properties: UserProperties): void {
    posthogJs.people.set_once(properties);
  }

  group(groupType: string, groupKey: string, properties?: Record<string, unknown>): void {
    posthogJs.group(groupType, groupKey, properties);
  }

  isFeatureEnabled(key: string): boolean {
    return posthogJs.isFeatureEnabled(key) ?? false;
  }

  getFeatureFlag(key: string): string | boolean | undefined {
    return posthogJs.getFeatureFlag(key);
  }

  getFeatureFlagPayload(key: string): Record<string, unknown> | undefined {
    return posthogJs.getFeatureFlagPayload(key);
  }

  onFeatureFlags(callback: (flags: string[]) => void): void {
    posthogJs.onFeatureFlags(callback);
  }

  reloadFeatureFlags(): void {
    posthogJs.reloadFeatureFlags();
  }

  startSessionRecording(): void {
    posthogJs.startSessionRecording();
  }

  stopSessionRecording(): void {
    posthogJs.stopSessionRecording();
  }

  optIn(): void {
    posthogJs.opt_in_capturing();
  }

  optOut(): void {
    posthogJs.opt_out_capturing();
  }

  hasOptedOut(): boolean {
    return posthogJs.has_opted_out_capturing();
  }

  getDistinctId(): string {
    return posthogJs.get_distinct_id();
  }

  getSessionId(): string | undefined {
    return posthogJs.get_session_id?.();
  }
}

export const posthogServer = new PostHogServerService({
  apiKey: process.env.POSTHOG_API_KEY!,
  host: process.env.POSTHOG_HOST,
  personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
});

export const posthogBrowser = new PostHogBrowserService();
```

### Express.js Middleware & Routes
```typescript
// middleware/posthog.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { posthogServer } from '../services/posthog.service';

export function posthogMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Track page views for server-rendered pages
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const distinctId = req.user?.id || req.sessionID || 'anonymous';

    posthogServer.pageView(distinctId, `${req.protocol}://${req.hostname}${req.originalUrl}`, {
      $referrer: req.headers.referer,
      $user_agent: req.headers['user-agent'],
      $ip: req.ip,
    });
  }

  next();
}

// routes/analytics.routes.ts
import { Router, Request, Response } from 'express';
import { posthogServer } from '../services/posthog.service';

const router = Router();

// Track event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { event, properties, groups } = req.body;
    const distinctId = req.user?.id || req.body.distinctId;

    if (!distinctId) {
      res.status(400).json({ success: false, error: 'distinctId required' });
      return;
    }

    posthogServer.capture(distinctId, event, properties, groups);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Identify user
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { distinctId, properties, groups } = req.body;

    if (!distinctId) {
      res.status(400).json({ success: false, error: 'distinctId required' });
      return;
    }

    posthogServer.identify(distinctId, properties, groups);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get feature flag
router.get('/feature-flags/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const distinctId = req.user?.id || (req.query.distinctId as string);

    if (!distinctId) {
      res.status(400).json({ success: false, error: 'distinctId required' });
      return;
    }

    const enabled = await posthogServer.isFeatureEnabled(key, distinctId);
    const variant = await posthogServer.getFeatureFlag(key, distinctId);
    const payload = await posthogServer.getFeatureFlagPayload(key, distinctId);

    res.json({
      success: true,
      data: { key, enabled, variant, payload },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get all feature flags for user
router.get('/feature-flags', async (req: Request, res: Response) => {
  try {
    const distinctId = req.user?.id || (req.query.distinctId as string);

    if (!distinctId) {
      res.status(400).json({ success: false, error: 'distinctId required' });
      return;
    }

    const flags = await posthogServer.getAllFlags(distinctId);
    res.json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Group identify
router.post('/groups', async (req: Request, res: Response) => {
  try {
    const { groupType, groupKey, properties } = req.body;

    posthogServer.groupIdentify({ groupType, groupKey, properties });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get cohorts (requires personal API key)
router.get('/cohorts', async (req: Request, res: Response) => {
  try {
    const cohorts = await posthogServer.getCohorts();
    res.json({ success: true, data: cohorts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
```

### React PostHog Provider & Hooks
```tsx
// components/PostHogProvider.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { posthogBrowser } from '../services/posthog.service';

interface PostHogContextType {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  isFeatureEnabled: (key: string) => boolean;
  getFeatureFlag: (key: string) => string | boolean | undefined;
  getFeatureFlagPayload: (key: string) => Record<string, unknown> | undefined;
  group: (groupType: string, groupKey: string, properties?: Record<string, unknown>) => void;
  startSessionRecording: () => void;
  stopSessionRecording: () => void;
  optIn: () => void;
  optOut: () => void;
}

const PostHogContext = createContext<PostHogContextType | null>(null);

interface PostHogProviderProps {
  apiKey: string;
  apiHost?: string;
  children: ReactNode;
  autocapture?: boolean;
  capturePageview?: boolean;
  disableSessionRecording?: boolean;
  bootstrap?: {
    distinctID?: string;
    featureFlags?: Record<string, string | boolean>;
  };
}

export const PostHogProvider: React.FC<PostHogProviderProps> = ({
  apiKey,
  apiHost,
  children,
  autocapture = true,
  capturePageview = true,
  disableSessionRecording = false,
  bootstrap,
}) => {
  useEffect(() => {
    posthogBrowser.init(apiKey, {
      apiHost,
      autocapture,
      capturePageview,
      disableSessionRecording,
      bootstrap,
    });
  }, [apiKey, apiHost, autocapture, capturePageview, disableSessionRecording, bootstrap]);

  const value: PostHogContextType = {
    capture: posthogBrowser.capture.bind(posthogBrowser),
    identify: posthogBrowser.identify.bind(posthogBrowser),
    reset: posthogBrowser.reset.bind(posthogBrowser),
    isFeatureEnabled: posthogBrowser.isFeatureEnabled.bind(posthogBrowser),
    getFeatureFlag: posthogBrowser.getFeatureFlag.bind(posthogBrowser),
    getFeatureFlagPayload: posthogBrowser.getFeatureFlagPayload.bind(posthogBrowser),
    group: posthogBrowser.group.bind(posthogBrowser),
    startSessionRecording: posthogBrowser.startSessionRecording.bind(posthogBrowser),
    stopSessionRecording: posthogBrowser.stopSessionRecording.bind(posthogBrowser),
    optIn: posthogBrowser.optIn.bind(posthogBrowser),
    optOut: posthogBrowser.optOut.bind(posthogBrowser),
  };

  return (
    <PostHogContext.Provider value={value}>
      {children}
    </PostHogContext.Provider>
  );
};

// Hooks
export function usePostHog(): PostHogContextType {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
}

export function useFeatureFlag(key: string): {
  enabled: boolean;
  variant: string | boolean | undefined;
  payload: Record<string, unknown> | undefined;
  loading: boolean;
} {
  const [loading, setLoading] = React.useState(true);
  const [enabled, setEnabled] = React.useState(false);
  const [variant, setVariant] = React.useState<string | boolean | undefined>();
  const [payload, setPayload] = React.useState<Record<string, unknown> | undefined>();

  useEffect(() => {
    // Wait for feature flags to load
    posthogBrowser.onFeatureFlags(() => {
      setEnabled(posthogBrowser.isFeatureEnabled(key));
      setVariant(posthogBrowser.getFeatureFlag(key));
      setPayload(posthogBrowser.getFeatureFlagPayload(key));
      setLoading(false);
    });

    // Also check immediately in case flags are already loaded
    const currentEnabled = posthogBrowser.isFeatureEnabled(key);
    if (currentEnabled !== undefined) {
      setEnabled(currentEnabled);
      setVariant(posthogBrowser.getFeatureFlag(key));
      setPayload(posthogBrowser.getFeatureFlagPayload(key));
      setLoading(false);
    }
  }, [key]);

  return { enabled, variant, payload, loading };
}

export function useFeatureFlagEnabled(key: string): boolean {
  const { enabled } = useFeatureFlag(key);
  return enabled;
}

// Feature Flag Component
export const FeatureFlag: React.FC<{
  flag: string;
  match?: string | boolean;
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ flag, match, children, fallback = null }) => {
  const { enabled, variant, loading } = useFeatureFlag(flag);

  if (loading) return null;

  // If match is specified, check for specific variant
  if (match !== undefined) {
    return variant === match ? <>{children}</> : <>{fallback}</>;
  }

  // Otherwise just check if enabled
  return enabled ? <>{children}</> : <>{fallback}</>;
};

// A/B Test Component
export const ABTest: React.FC<{
  flag: string;
  control: ReactNode;
  variants: Record<string, ReactNode>;
}> = ({ flag, control, variants }) => {
  const { variant, loading } = useFeatureFlag(flag);

  if (loading) return null;

  if (variant && typeof variant === 'string' && variants[variant]) {
    return <>{variants[variant]}</>;
  }

  return <>{control}</>;
};

// Analytics Event Tracking
export const useTrackEvent = () => {
  const { capture } = usePostHog();

  return React.useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      capture(event, properties);
    },
    [capture]
  );
};

// Page View Tracking Hook
export const usePageView = (pageName?: string) => {
  const { capture } = usePostHog();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      capture('$pageview', {
        $current_url: window.location.href,
        page_name: pageName,
      });
    }
  }, [pageName, capture]);
};

// User Identification Hook
export const useIdentifyUser = () => {
  const { identify, reset } = usePostHog();

  const identifyUser = React.useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      identify(userId, traits);
    },
    [identify]
  );

  const clearUser = React.useCallback(() => {
    reset();
  }, [reset]);

  return { identifyUser, clearUser };
};
```

### Python FastAPI Implementation
```python
# posthog_service.py
from datetime import datetime
from typing import Optional, Dict, List, Any
from posthog import Posthog
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Initialize PostHog
posthog = Posthog(
    project_api_key="your-project-api-key",
    host="https://app.posthog.com"
)


class TrackEventRequest(BaseModel):
    distinct_id: str
    event: str
    properties: Optional[Dict[str, Any]] = None
    groups: Optional[Dict[str, str]] = None


class IdentifyRequest(BaseModel):
    distinct_id: str
    properties: Optional[Dict[str, Any]] = None


class GroupIdentifyRequest(BaseModel):
    group_type: str
    group_key: str
    properties: Optional[Dict[str, Any]] = None


class PostHogService:
    def __init__(self, client: Posthog):
        self.client = client

    def capture(
        self,
        distinct_id: str,
        event: str,
        properties: Optional[Dict[str, Any]] = None,
        groups: Optional[Dict[str, str]] = None
    ) -> None:
        self.client.capture(
            distinct_id=distinct_id,
            event=event,
            properties=properties,
            groups=groups
        )

    def identify(
        self,
        distinct_id: str,
        properties: Optional[Dict[str, Any]] = None
    ) -> None:
        self.client.identify(
            distinct_id=distinct_id,
            properties=properties
        )

    def alias(self, distinct_id: str, alias: str) -> None:
        self.client.alias(
            distinct_id=distinct_id,
            alias=alias
        )

    def group_identify(
        self,
        group_type: str,
        group_key: str,
        properties: Optional[Dict[str, Any]] = None
    ) -> None:
        self.client.group_identify(
            group_type=group_type,
            group_key=group_key,
            properties=properties
        )

    def is_feature_enabled(
        self,
        key: str,
        distinct_id: str,
        groups: Optional[Dict[str, str]] = None,
        person_properties: Optional[Dict[str, Any]] = None,
        group_properties: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> bool:
        return self.client.feature_enabled(
            key=key,
            distinct_id=distinct_id,
            groups=groups,
            person_properties=person_properties,
            group_properties=group_properties
        ) or False

    def get_feature_flag(
        self,
        key: str,
        distinct_id: str,
        groups: Optional[Dict[str, str]] = None,
        person_properties: Optional[Dict[str, Any]] = None,
        group_properties: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Optional[str]:
        return self.client.get_feature_flag(
            key=key,
            distinct_id=distinct_id,
            groups=groups,
            person_properties=person_properties,
            group_properties=group_properties
        )

    def get_feature_flag_payload(
        self,
        key: str,
        distinct_id: str,
        match_value: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        return self.client.get_feature_flag_payload(
            key=key,
            distinct_id=distinct_id,
            match_value=match_value
        )

    def get_all_flags(
        self,
        distinct_id: str,
        groups: Optional[Dict[str, str]] = None,
        person_properties: Optional[Dict[str, Any]] = None,
        group_properties: Optional[Dict[str, Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        return self.client.get_all_flags(
            distinct_id=distinct_id,
            groups=groups,
            person_properties=person_properties,
            group_properties=group_properties
        )

    def page_view(
        self,
        distinct_id: str,
        url: str,
        properties: Optional[Dict[str, Any]] = None
    ) -> None:
        self.capture(
            distinct_id=distinct_id,
            event="$pageview",
            properties={
                "$current_url": url,
                **(properties or {})
            }
        )

    def flush(self) -> None:
        self.client.flush()

    def shutdown(self) -> None:
        self.client.shutdown()


# Initialize service
posthog_service = PostHogService(posthog)


def get_distinct_id(request: Request) -> str:
    """Extract distinct_id from request."""
    # Try to get from user
    if hasattr(request.state, "user") and request.state.user:
        return request.state.user.id

    # Try to get from header
    distinct_id = request.headers.get("X-Distinct-ID")
    if distinct_id:
        return distinct_id

    # Try to get from cookie
    distinct_id = request.cookies.get("posthog_distinct_id")
    if distinct_id:
        return distinct_id

    return "anonymous"


@router.post("/track")
async def track_event(data: TrackEventRequest):
    try:
        posthog_service.capture(
            distinct_id=data.distinct_id,
            event=data.event,
            properties=data.properties,
            groups=data.groups
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/identify")
async def identify_user(data: IdentifyRequest):
    try:
        posthog_service.identify(
            distinct_id=data.distinct_id,
            properties=data.properties
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/groups")
async def group_identify(data: GroupIdentifyRequest):
    try:
        posthog_service.group_identify(
            group_type=data.group_type,
            group_key=data.group_key,
            properties=data.properties
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-flags/{key}")
async def get_feature_flag(
    key: str,
    distinct_id: str = Depends(get_distinct_id)
):
    try:
        enabled = posthog_service.is_feature_enabled(key, distinct_id)
        variant = posthog_service.get_feature_flag(key, distinct_id)
        payload = posthog_service.get_feature_flag_payload(key, distinct_id)

        return {
            "success": True,
            "data": {
                "key": key,
                "enabled": enabled,
                "variant": variant,
                "payload": payload
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-flags")
async def get_all_flags(distinct_id: str = Depends(get_distinct_id)):
    try:
        flags = posthog_service.get_all_flags(distinct_id)
        return {"success": True, "data": flags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Middleware for automatic page view tracking
async def posthog_middleware(request: Request, call_next):
    response = await call_next(request)

    # Track page views for non-API GET requests
    if request.method == "GET" and not request.url.path.startswith("/api"):
        distinct_id = get_distinct_id(request)
        posthog_service.page_view(
            distinct_id=distinct_id,
            url=str(request.url),
            properties={
                "referrer": request.headers.get("referer"),
                "user_agent": request.headers.get("user-agent")
            }
        )

    return response
```

## CLAUDE.md Integration
```markdown
## PostHog Analytics Commands

### Event tracking
"Track sign_up event for user_123 with plan=pro"
"Capture purchase event with revenue $99"
"Track page view for /dashboard"

### User management
"Identify user user_123 with email user@example.com"
"Set user property company=Acme for user_123"
"Add user to company group"

### Feature flags
"Check if new_checkout_flow is enabled for user"
"Get all feature flags for user_123"
"Get feature flag payload for pricing_experiment"

### Session recording
"Start session recording"
"Stop session recording"
```

## AI Suggestions
1. Add automatic funnel analysis for key flows
2. Implement custom dashboards via API
3. Add cohort-based feature flag targeting
4. Create retention analysis automation
5. Build real-time event streaming
6. Add user property enrichment
7. Implement cross-platform identity resolution
8. Create automated insight reports
9. Add anomaly detection for metrics
10. Build custom event taxonomy validation
