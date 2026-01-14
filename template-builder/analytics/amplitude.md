# Amplitude Analytics Integration

Production-ready Amplitude analytics with user tracking, cohorts, and behavioral analysis.

## Overview

Amplitude provides product analytics focused on user behavior, retention analysis, and growth metrics. This template implements comprehensive Amplitude integration with server-side and client-side tracking.

## Quick Start

```bash
npm install @amplitude/analytics-node @amplitude/analytics-browser
```

## TypeScript Implementation

### Server-Side Analytics Service

```typescript
// src/services/amplitude-server.ts
import * as amplitude from '@amplitude/analytics-node';
import { createHash } from 'crypto';

interface AmplitudeConfig {
  apiKey: string;
  serverUrl?: string;
  flushQueueSize?: number;
  flushIntervalMillis?: number;
  minIdLength?: number;
}

interface EventProperties {
  [key: string]: any;
}

interface UserProperties {
  [key: string]: any;
}

interface GroupProperties {
  [key: string]: any;
}

interface IdentifyOperation {
  property: string;
  value: any;
}

interface RevenueEvent {
  productId: string;
  quantity: number;
  price: number;
  revenueType?: string;
  receipt?: string;
  receiptSig?: string;
  eventProperties?: EventProperties;
}

class AmplitudeServerService {
  private initialized = false;

  constructor(private config: AmplitudeConfig) {
    this.initialize();
  }

  private initialize(): void {
    amplitude.init(this.config.apiKey, {
      serverUrl: this.config.serverUrl,
      flushQueueSize: this.config.flushQueueSize || 30,
      flushIntervalMillis: this.config.flushIntervalMillis || 10000,
      minIdLength: this.config.minIdLength || 1,
    });
    this.initialized = true;
  }

  // Track event
  async track(
    eventName: string,
    userId?: string,
    deviceId?: string,
    eventProperties?: EventProperties,
    userProperties?: UserProperties
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Amplitude not initialized');
    }

    const event: amplitude.Types.BaseEvent = {
      event_type: eventName,
      user_id: userId,
      device_id: deviceId,
      event_properties: eventProperties,
      user_properties: userProperties,
      time: Date.now(),
    };

    amplitude.track(event);
  }

  // Identify user
  async identify(
    userId: string,
    userProperties: UserProperties,
    deviceId?: string
  ): Promise<void> {
    const identifyEvent = new amplitude.Identify();

    for (const [key, value] of Object.entries(userProperties)) {
      identifyEvent.set(key, value);
    }

    amplitude.identify(identifyEvent, {
      user_id: userId,
      device_id: deviceId,
    });
  }

  // Set user properties with operations
  async setUserProperties(
    userId: string,
    operations: {
      set?: UserProperties;
      setOnce?: UserProperties;
      add?: Record<string, number>;
      append?: Record<string, any>;
      prepend?: Record<string, any>;
      unset?: string[];
    }
  ): Promise<void> {
    const identifyEvent = new amplitude.Identify();

    if (operations.set) {
      for (const [key, value] of Object.entries(operations.set)) {
        identifyEvent.set(key, value);
      }
    }

    if (operations.setOnce) {
      for (const [key, value] of Object.entries(operations.setOnce)) {
        identifyEvent.setOnce(key, value);
      }
    }

    if (operations.add) {
      for (const [key, value] of Object.entries(operations.add)) {
        identifyEvent.add(key, value);
      }
    }

    if (operations.append) {
      for (const [key, value] of Object.entries(operations.append)) {
        identifyEvent.append(key, value);
      }
    }

    if (operations.prepend) {
      for (const [key, value] of Object.entries(operations.prepend)) {
        identifyEvent.prepend(key, value);
      }
    }

    if (operations.unset) {
      for (const key of operations.unset) {
        identifyEvent.unset(key);
      }
    }

    amplitude.identify(identifyEvent, { user_id: userId });
  }

  // Track revenue
  async trackRevenue(
    userId: string,
    revenue: RevenueEvent
  ): Promise<void> {
    const revenueEvent = new amplitude.Revenue()
      .setProductId(revenue.productId)
      .setQuantity(revenue.quantity)
      .setPrice(revenue.price);

    if (revenue.revenueType) {
      revenueEvent.setRevenueType(revenue.revenueType);
    }

    if (revenue.receipt && revenue.receiptSig) {
      revenueEvent.setReceipt(revenue.receipt, revenue.receiptSig);
    }

    if (revenue.eventProperties) {
      revenueEvent.setEventProperties(revenue.eventProperties);
    }

    amplitude.revenue(revenueEvent, { user_id: userId });
  }

  // Group identification
  async setGroup(
    userId: string,
    groupType: string,
    groupName: string | string[]
  ): Promise<void> {
    amplitude.setGroup(groupType, groupName, { user_id: userId });
  }

  // Group properties
  async groupIdentify(
    groupType: string,
    groupName: string,
    groupProperties: GroupProperties
  ): Promise<void> {
    const identifyEvent = new amplitude.Identify();

    for (const [key, value] of Object.entries(groupProperties)) {
      identifyEvent.set(key, value);
    }

    amplitude.groupIdentify(groupType, groupName, identifyEvent);
  }

  // Flush events
  async flush(): Promise<void> {
    await amplitude.flush();
  }

  // Generate anonymous device ID
  generateDeviceId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 22);
  }
}

export const amplitudeServer = new AmplitudeServerService({
  apiKey: process.env.AMPLITUDE_API_KEY!,
  serverUrl: process.env.AMPLITUDE_SERVER_URL,
  flushQueueSize: 30,
  flushIntervalMillis: 10000,
});
```

### Browser-Side Analytics

```typescript
// src/services/amplitude-browser.ts
import * as amplitude from '@amplitude/analytics-browser';

interface AmplitudeBrowserConfig {
  apiKey: string;
  userId?: string;
  deviceId?: string;
  serverUrl?: string;
  autocapture?: boolean;
  defaultTracking?: {
    sessions?: boolean;
    pageViews?: boolean;
    formInteractions?: boolean;
    fileDownloads?: boolean;
  };
}

interface EventOptions {
  userId?: string;
  deviceId?: string;
  time?: number;
  sessionId?: number;
  insertId?: string;
}

class AmplitudeBrowserService {
  private initialized = false;

  async initialize(config: AmplitudeBrowserConfig): Promise<void> {
    await amplitude.init(config.apiKey, config.userId, {
      deviceId: config.deviceId,
      serverUrl: config.serverUrl,
      autocapture: config.autocapture !== false ? {
        elementInteractions: true,
        pageViews: config.defaultTracking?.pageViews !== false,
        sessions: config.defaultTracking?.sessions !== false,
        formInteractions: config.defaultTracking?.formInteractions !== false,
        fileDownloads: config.defaultTracking?.fileDownloads !== false,
      } : false,
    }).promise;

    this.initialized = true;
  }

  // Track event
  track(
    eventName: string,
    eventProperties?: Record<string, any>,
    options?: EventOptions
  ): void {
    if (!this.initialized) {
      console.warn('Amplitude not initialized');
      return;
    }

    amplitude.track(eventName, eventProperties, options);
  }

  // Identify user
  setUserId(userId: string | undefined): void {
    amplitude.setUserId(userId);
  }

  // Set user properties
  identify(userProperties: Record<string, any>): void {
    const identifyEvent = new amplitude.Identify();

    for (const [key, value] of Object.entries(userProperties)) {
      identifyEvent.set(key, value);
    }

    amplitude.identify(identifyEvent);
  }

  // Set user property once
  setOnce(property: string, value: any): void {
    const identifyEvent = new amplitude.Identify();
    identifyEvent.setOnce(property, value);
    amplitude.identify(identifyEvent);
  }

  // Increment numeric property
  add(property: string, value: number): void {
    const identifyEvent = new amplitude.Identify();
    identifyEvent.add(property, value);
    amplitude.identify(identifyEvent);
  }

  // Track revenue
  trackRevenue(
    productId: string,
    quantity: number,
    price: number,
    revenueType?: string
  ): void {
    const revenue = new amplitude.Revenue()
      .setProductId(productId)
      .setQuantity(quantity)
      .setPrice(price);

    if (revenueType) {
      revenue.setRevenueType(revenueType);
    }

    amplitude.revenue(revenue);
  }

  // Set group
  setGroup(groupType: string, groupName: string | string[]): void {
    amplitude.setGroup(groupType, groupName);
  }

  // Get device ID
  getDeviceId(): string | undefined {
    return amplitude.getDeviceId();
  }

  // Get session ID
  getSessionId(): number | undefined {
    return amplitude.getSessionId();
  }

  // Reset user (logout)
  reset(): void {
    amplitude.reset();
  }

  // Flush events
  async flush(): Promise<void> {
    await amplitude.flush().promise;
  }
}

export const amplitudeBrowser = new AmplitudeBrowserService();
```

### Experiment Client (A/B Testing)

```typescript
// src/services/amplitude-experiment.ts
import { Experiment, ExperimentClient, Variant } from '@amplitude/experiment-js-client';

interface ExperimentConfig {
  deploymentKey: string;
  serverUrl?: string;
  fetchTimeoutMillis?: number;
  retryFetchOnFailure?: boolean;
}

interface ExperimentUser {
  user_id?: string;
  device_id?: string;
  user_properties?: Record<string, any>;
}

class AmplitudeExperimentService {
  private client: ExperimentClient | null = null;
  private variants: Record<string, Variant> = {};

  async initialize(config: ExperimentConfig): Promise<void> {
    this.client = Experiment.initializeWithAmplitudeAnalytics(
      config.deploymentKey,
      {
        serverUrl: config.serverUrl,
        fetchTimeoutMillis: config.fetchTimeoutMillis || 10000,
        retryFetchOnFailure: config.retryFetchOnFailure !== false,
      }
    );
  }

  // Fetch variants for user
  async fetchVariants(user?: ExperimentUser): Promise<Record<string, Variant>> {
    if (!this.client) {
      throw new Error('Experiment client not initialized');
    }

    await this.client.fetch(user);
    this.variants = this.client.all();
    return this.variants;
  }

  // Get variant for flag
  getVariant(flagKey: string): Variant | undefined {
    if (!this.client) {
      return undefined;
    }

    return this.client.variant(flagKey);
  }

  // Check if variant is enabled
  isEnabled(flagKey: string, defaultValue = false): boolean {
    const variant = this.getVariant(flagKey);

    if (!variant) {
      return defaultValue;
    }

    return variant.value === 'on' || variant.value === 'true' || variant.value === true;
  }

  // Get variant value
  getValue<T>(flagKey: string, defaultValue: T): T {
    const variant = this.getVariant(flagKey);

    if (!variant || variant.value === undefined) {
      return defaultValue;
    }

    return variant.value as T;
  }

  // Get payload
  getPayload<T>(flagKey: string): T | undefined {
    const variant = this.getVariant(flagKey);
    return variant?.payload as T | undefined;
  }

  // Exposure tracking
  exposure(flagKey: string): void {
    if (!this.client) {
      return;
    }

    this.client.exposure(flagKey);
  }

  // Get all variants
  getAllVariants(): Record<string, Variant> {
    return this.variants;
  }
}

export const amplitudeExperiment = new AmplitudeExperimentService();
```

## Express.js API Routes

```typescript
// src/routes/amplitude.ts
import { Router, Request, Response } from 'express';
import { amplitudeServer } from '../services/amplitude-server';

const router = Router();

// Track event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { eventName, userId, deviceId, eventProperties, userProperties } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    await amplitudeServer.track(
      eventName,
      userId,
      deviceId,
      eventProperties,
      userProperties
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Identify user
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { userId, userProperties, deviceId } = req.body;

    if (!userId || !userProperties) {
      return res.status(400).json({ error: 'userId and userProperties are required' });
    }

    await amplitudeServer.identify(userId, userProperties, deviceId);

    res.json({ success: true });
  } catch (error) {
    console.error('Identify error:', error);
    res.status(500).json({ error: 'Failed to identify user' });
  }
});

// Set user properties
router.post('/user-properties', async (req: Request, res: Response) => {
  try {
    const { userId, operations } = req.body;

    if (!userId || !operations) {
      return res.status(400).json({ error: 'userId and operations are required' });
    }

    await amplitudeServer.setUserProperties(userId, operations);

    res.json({ success: true });
  } catch (error) {
    console.error('User properties error:', error);
    res.status(500).json({ error: 'Failed to set user properties' });
  }
});

// Track revenue
router.post('/revenue', async (req: Request, res: Response) => {
  try {
    const { userId, productId, quantity, price, revenueType, eventProperties } = req.body;

    if (!userId || !productId || !quantity || !price) {
      return res.status(400).json({
        error: 'userId, productId, quantity, and price are required'
      });
    }

    await amplitudeServer.trackRevenue(userId, {
      productId,
      quantity,
      price,
      revenueType,
      eventProperties,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Revenue error:', error);
    res.status(500).json({ error: 'Failed to track revenue' });
  }
});

// Set group
router.post('/group', async (req: Request, res: Response) => {
  try {
    const { userId, groupType, groupName } = req.body;

    if (!userId || !groupType || !groupName) {
      return res.status(400).json({
        error: 'userId, groupType, and groupName are required'
      });
    }

    await amplitudeServer.setGroup(userId, groupType, groupName);

    res.json({ success: true });
  } catch (error) {
    console.error('Set group error:', error);
    res.status(500).json({ error: 'Failed to set group' });
  }
});

// Group identify
router.post('/group-identify', async (req: Request, res: Response) => {
  try {
    const { groupType, groupName, groupProperties } = req.body;

    if (!groupType || !groupName || !groupProperties) {
      return res.status(400).json({
        error: 'groupType, groupName, and groupProperties are required'
      });
    }

    await amplitudeServer.groupIdentify(groupType, groupName, groupProperties);

    res.json({ success: true });
  } catch (error) {
    console.error('Group identify error:', error);
    res.status(500).json({ error: 'Failed to identify group' });
  }
});

// Flush events
router.post('/flush', async (req: Request, res: Response) => {
  try {
    await amplitudeServer.flush();
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
// src/hooks/useAmplitude.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { amplitudeBrowser } from '../services/amplitude-browser';
import { amplitudeExperiment } from '../services/amplitude-experiment';

interface AmplitudeContextValue {
  isInitialized: boolean;
  track: (eventName: string, eventProperties?: Record<string, any>) => void;
  identify: (userProperties: Record<string, any>) => void;
  setUserId: (userId: string | undefined) => void;
  trackRevenue: (productId: string, quantity: number, price: number, revenueType?: string) => void;
  setGroup: (groupType: string, groupName: string | string[]) => void;
  getVariant: (flagKey: string) => any;
  isFeatureEnabled: (flagKey: string, defaultValue?: boolean) => boolean;
  reset: () => void;
}

const AmplitudeContext = createContext<AmplitudeContextValue | null>(null);

interface AmplitudeProviderProps {
  children: ReactNode;
  apiKey: string;
  experimentDeploymentKey?: string;
  userId?: string;
  autocapture?: boolean;
}

export function AmplitudeProvider({
  children,
  apiKey,
  experimentDeploymentKey,
  userId,
  autocapture = true,
}: AmplitudeProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await amplitudeBrowser.initialize({
        apiKey,
        userId,
        autocapture,
        defaultTracking: {
          sessions: true,
          pageViews: true,
          formInteractions: true,
          fileDownloads: true,
        },
      });

      if (experimentDeploymentKey) {
        await amplitudeExperiment.initialize({
          deploymentKey: experimentDeploymentKey,
        });
        await amplitudeExperiment.fetchVariants({ user_id: userId });
      }

      setIsInitialized(true);
    };

    init();
  }, [apiKey, experimentDeploymentKey, userId, autocapture]);

  const track = (eventName: string, eventProperties?: Record<string, any>) => {
    amplitudeBrowser.track(eventName, eventProperties);
  };

  const identify = (userProperties: Record<string, any>) => {
    amplitudeBrowser.identify(userProperties);
  };

  const setUserId = (newUserId: string | undefined) => {
    amplitudeBrowser.setUserId(newUserId);
  };

  const trackRevenue = (
    productId: string,
    quantity: number,
    price: number,
    revenueType?: string
  ) => {
    amplitudeBrowser.trackRevenue(productId, quantity, price, revenueType);
  };

  const setGroup = (groupType: string, groupName: string | string[]) => {
    amplitudeBrowser.setGroup(groupType, groupName);
  };

  const getVariant = (flagKey: string) => {
    return amplitudeExperiment.getValue(flagKey, null);
  };

  const isFeatureEnabled = (flagKey: string, defaultValue = false) => {
    return amplitudeExperiment.isEnabled(flagKey, defaultValue);
  };

  const reset = () => {
    amplitudeBrowser.reset();
  };

  const value: AmplitudeContextValue = {
    isInitialized,
    track,
    identify,
    setUserId,
    trackRevenue,
    setGroup,
    getVariant,
    isFeatureEnabled,
    reset,
  };

  return (
    <AmplitudeContext.Provider value={value}>
      {children}
    </AmplitudeContext.Provider>
  );
}

export function useAmplitude(): AmplitudeContextValue {
  const context = useContext(AmplitudeContext);
  if (!context) {
    throw new Error('useAmplitude must be used within AmplitudeProvider');
  }
  return context;
}

// Feature flag hook
export function useAmplitudeFeature(flagKey: string, defaultValue = false): boolean {
  const { isFeatureEnabled } = useAmplitude();
  return isFeatureEnabled(flagKey, defaultValue);
}

// Variant hook
export function useAmplitudeVariant<T>(flagKey: string, defaultValue: T): T {
  const { getVariant } = useAmplitude();
  const variant = getVariant(flagKey);
  return variant !== null ? variant : defaultValue;
}

// Page tracking hook
export function useAmplitudePageView(pageName: string, properties?: Record<string, any>) {
  const { track, isInitialized } = useAmplitude();

  useEffect(() => {
    if (isInitialized) {
      track('Page Viewed', {
        page_name: pageName,
        ...properties,
      });
    }
  }, [isInitialized, pageName]);
}
```

### Feature Flag Component

```tsx
// src/components/AmplitudeFeature.tsx
import React, { ReactNode } from 'react';
import { useAmplitudeFeature, useAmplitudeVariant } from '../hooks/useAmplitude';

interface FeatureProps {
  flagKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Feature({ flagKey, children, fallback = null }: FeatureProps) {
  const isEnabled = useAmplitudeFeature(flagKey);
  return <>{isEnabled ? children : fallback}</>;
}

interface VariantProps<T> {
  flagKey: string;
  variants: Record<string, ReactNode>;
  defaultVariant: T;
}

export function Variant<T extends string>({
  flagKey,
  variants,
  defaultVariant
}: VariantProps<T>) {
  const variant = useAmplitudeVariant(flagKey, defaultVariant);
  return <>{variants[variant as string] || variants[defaultVariant]}</>;
}

// Example usage
export function ExampleFeatures() {
  return (
    <div>
      <Feature flagKey="new-checkout-flow">
        <NewCheckoutComponent />
      </Feature>

      <Variant
        flagKey="homepage-hero"
        variants={{
          control: <HeroControl />,
          variant_a: <HeroVariantA />,
          variant_b: <HeroVariantB />,
        }}
        defaultVariant="control"
      />
    </div>
  );
}

function NewCheckoutComponent() {
  return <div>New checkout flow</div>;
}

function HeroControl() {
  return <div>Control hero</div>;
}

function HeroVariantA() {
  return <div>Hero variant A</div>;
}

function HeroVariantB() {
  return <div>Hero variant B</div>;
}
```

## Python Implementation

```python
# amplitude_service.py
from amplitude import Amplitude, BaseEvent, Identify, Revenue, EventOptions
from typing import Dict, Any, Optional, List
import os
import hashlib
import time

class AmplitudeService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        server_url: Optional[str] = None,
        flush_queue_size: int = 30,
        flush_interval_millis: int = 10000
    ):
        self.client = Amplitude(
            api_key or os.environ.get('AMPLITUDE_API_KEY'),
            configuration={
                'server_url': server_url,
                'flush_queue_size': flush_queue_size,
                'flush_interval_millis': flush_interval_millis,
            }
        )

    def track(
        self,
        event_name: str,
        user_id: Optional[str] = None,
        device_id: Optional[str] = None,
        event_properties: Optional[Dict[str, Any]] = None,
        user_properties: Optional[Dict[str, Any]] = None
    ) -> None:
        """Track an event."""
        event = BaseEvent(
            event_type=event_name,
            user_id=user_id,
            device_id=device_id,
            event_properties=event_properties,
            user_properties=user_properties,
            time=int(time.time() * 1000)
        )
        self.client.track(event)

    def identify(
        self,
        user_id: str,
        user_properties: Dict[str, Any],
        device_id: Optional[str] = None
    ) -> None:
        """Identify a user with properties."""
        identify = Identify()
        for key, value in user_properties.items():
            identify.set(key, value)

        self.client.identify(
            identify,
            EventOptions(user_id=user_id, device_id=device_id)
        )

    def set_user_properties(
        self,
        user_id: str,
        set_props: Optional[Dict[str, Any]] = None,
        set_once_props: Optional[Dict[str, Any]] = None,
        add_props: Optional[Dict[str, int]] = None,
        append_props: Optional[Dict[str, Any]] = None,
        unset_props: Optional[List[str]] = None
    ) -> None:
        """Set user properties with various operations."""
        identify = Identify()

        if set_props:
            for key, value in set_props.items():
                identify.set(key, value)

        if set_once_props:
            for key, value in set_once_props.items():
                identify.set_once(key, value)

        if add_props:
            for key, value in add_props.items():
                identify.add(key, value)

        if append_props:
            for key, value in append_props.items():
                identify.append(key, value)

        if unset_props:
            for key in unset_props:
                identify.unset(key)

        self.client.identify(identify, EventOptions(user_id=user_id))

    def track_revenue(
        self,
        user_id: str,
        product_id: str,
        quantity: int,
        price: float,
        revenue_type: Optional[str] = None,
        receipt: Optional[str] = None,
        receipt_sig: Optional[str] = None
    ) -> None:
        """Track a revenue event."""
        revenue = Revenue(
            product_id=product_id,
            quantity=quantity,
            price=price,
            revenue_type=revenue_type,
            receipt=receipt,
            receipt_sig=receipt_sig
        )
        self.client.revenue(revenue, EventOptions(user_id=user_id))

    def set_group(
        self,
        user_id: str,
        group_type: str,
        group_name: str
    ) -> None:
        """Add user to a group."""
        self.client.set_group(
            group_type,
            group_name,
            EventOptions(user_id=user_id)
        )

    def group_identify(
        self,
        group_type: str,
        group_name: str,
        group_properties: Dict[str, Any]
    ) -> None:
        """Set properties for a group."""
        identify = Identify()
        for key, value in group_properties.items():
            identify.set(key, value)

        self.client.group_identify(group_type, group_name, identify)

    def flush(self) -> None:
        """Flush queued events."""
        self.client.flush()

    def shutdown(self) -> None:
        """Shutdown the client."""
        self.client.shutdown()

    @staticmethod
    def generate_device_id() -> str:
        """Generate a random device ID."""
        data = f"{time.time()}-{os.urandom(16).hex()}"
        return hashlib.sha256(data.encode()).hexdigest()[:22]


# FastAPI routes
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/amplitude", tags=["amplitude"])
amplitude_service = AmplitudeService()

class TrackEventRequest(BaseModel):
    event_name: str
    user_id: Optional[str] = None
    device_id: Optional[str] = None
    event_properties: Optional[Dict[str, Any]] = None
    user_properties: Optional[Dict[str, Any]] = None

class IdentifyRequest(BaseModel):
    user_id: str
    user_properties: Dict[str, Any]
    device_id: Optional[str] = None

class UserPropertiesRequest(BaseModel):
    user_id: str
    set_props: Optional[Dict[str, Any]] = None
    set_once_props: Optional[Dict[str, Any]] = None
    add_props: Optional[Dict[str, int]] = None
    append_props: Optional[Dict[str, Any]] = None
    unset_props: Optional[List[str]] = None

class RevenueRequest(BaseModel):
    user_id: str
    product_id: str
    quantity: int
    price: float
    revenue_type: Optional[str] = None

class GroupRequest(BaseModel):
    user_id: str
    group_type: str
    group_name: str

class GroupIdentifyRequest(BaseModel):
    group_type: str
    group_name: str
    group_properties: Dict[str, Any]

@router.post("/track")
async def track_event(request: TrackEventRequest):
    try:
        amplitude_service.track(
            event_name=request.event_name,
            user_id=request.user_id,
            device_id=request.device_id,
            event_properties=request.event_properties,
            user_properties=request.user_properties
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/identify")
async def identify_user(request: IdentifyRequest):
    try:
        amplitude_service.identify(
            user_id=request.user_id,
            user_properties=request.user_properties,
            device_id=request.device_id
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/user-properties")
async def set_user_properties(request: UserPropertiesRequest):
    try:
        amplitude_service.set_user_properties(
            user_id=request.user_id,
            set_props=request.set_props,
            set_once_props=request.set_once_props,
            add_props=request.add_props,
            append_props=request.append_props,
            unset_props=request.unset_props
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/revenue")
async def track_revenue(request: RevenueRequest):
    try:
        amplitude_service.track_revenue(
            user_id=request.user_id,
            product_id=request.product_id,
            quantity=request.quantity,
            price=request.price,
            revenue_type=request.revenue_type
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/group")
async def set_group(request: GroupRequest):
    try:
        amplitude_service.set_group(
            user_id=request.user_id,
            group_type=request.group_type,
            group_name=request.group_name
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/group-identify")
async def group_identify(request: GroupIdentifyRequest):
    try:
        amplitude_service.group_identify(
            group_type=request.group_type,
            group_name=request.group_name,
            group_properties=request.group_properties
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flush")
async def flush_events():
    try:
        amplitude_service.flush()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Amplitude Analytics

### Commands
- `amplitude:track <event> [userId] [properties]` - Track event
- `amplitude:identify <userId> <properties>` - Set user properties
- `amplitude:revenue <userId> <productId> <quantity> <price>` - Track revenue

### Key Files
- `src/services/amplitude-server.ts` - Server-side SDK
- `src/services/amplitude-browser.ts` - Browser SDK
- `src/services/amplitude-experiment.ts` - A/B testing
- `src/hooks/useAmplitude.tsx` - React integration

### Event Naming Convention
- Use past tense for completed actions: "Button Clicked", "Form Submitted"
- Use title case with spaces
- Include context: "Checkout Started", "Checkout Completed"

### User Property Naming
- Use snake_case for properties: `first_name`, `plan_type`
- Prefix computed properties: `computed_ltv`, `computed_segment`
```

## AI Suggestions

1. **Cohort Integration**: Implement cohort sync to target users in specific behavioral segments
2. **Taxonomy Planning**: Use Amplitude's taxonomy features for consistent event naming
3. **Session Replay**: Enable session replay for debugging user experiences
4. **Data Destinations**: Configure data streaming to data warehouses
5. **Retention Analysis**: Build custom retention analysis dashboards
6. **Funnel Optimization**: Create conversion funnels with drop-off analysis
7. **User Paths**: Implement pathfinder analysis for user journey mapping
8. **Recommendations**: Use Amplitude Recommend for personalization
9. **Governance**: Implement event blocking and property rules
10. **Real-time Alerts**: Set up anomaly detection for key metrics
