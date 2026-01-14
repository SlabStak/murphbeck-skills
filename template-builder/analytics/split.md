# Split.io Feature Flags & Experimentation

Production-ready Split.io integration for feature flags, experimentation, and data-driven decisions.

## Overview

Split.io combines feature flags with experimentation and data analytics to enable safe feature releases and measure impact. This template provides complete Split integration with server and client SDKs.

## Quick Start

```bash
npm install @splitsoftware/splitio @splitsoftware/splitio-react
```

## TypeScript Implementation

### Server-Side SDK

```typescript
// src/services/split-server.ts
import { SplitFactory, IBrowserSettings } from '@splitsoftware/splitio';

interface SplitConfig {
  authorizationKey: string;
  features?: Record<string, string>;
  scheduler?: {
    featuresRefreshRate?: number;
    segmentsRefreshRate?: number;
    impressionsRefreshRate?: number;
    eventsPushRate?: number;
  };
}

interface UserAttributes {
  [key: string]: string | number | boolean | string[];
}

interface TrackEvent {
  trafficType: string;
  key: string;
  eventType: string;
  value?: number;
  properties?: Record<string, any>;
}

class SplitServerService {
  private factory: SplitIO.ISDK | null = null;
  private client: SplitIO.IClient | null = null;
  private manager: SplitIO.IManager | null = null;
  private initialized = false;

  async initialize(config: SplitConfig): Promise<void> {
    const settings: SplitIO.IBrowserSettings = {
      core: {
        authorizationKey: config.authorizationKey,
      },
      scheduler: config.scheduler,
      features: config.features,
      startup: {
        readyTimeout: 10,
      },
    };

    this.factory = SplitFactory(settings);
    this.client = this.factory.client();
    this.manager = this.factory.manager();

    return new Promise((resolve, reject) => {
      this.client!.on(this.client!.Event.SDK_READY, () => {
        this.initialized = true;
        resolve();
      });

      this.client!.on(this.client!.Event.SDK_READY_TIMED_OUT, () => {
        console.warn('Split SDK ready timed out, using cache');
        this.initialized = true;
        resolve();
      });

      setTimeout(() => {
        if (!this.initialized) {
          reject(new Error('Split SDK initialization timeout'));
        }
      }, 15000);
    });
  }

  // Get treatment for a feature flag
  getTreatment(
    key: string,
    splitName: string,
    attributes?: UserAttributes
  ): string {
    if (!this.client || !this.initialized) {
      return 'control';
    }
    return this.client.getTreatment(key, splitName, attributes);
  }

  // Get treatment with config
  getTreatmentWithConfig(
    key: string,
    splitName: string,
    attributes?: UserAttributes
  ): SplitIO.TreatmentWithConfig {
    if (!this.client || !this.initialized) {
      return { treatment: 'control', config: null };
    }
    return this.client.getTreatmentWithConfig(key, splitName, attributes);
  }

  // Get multiple treatments
  getTreatments(
    key: string,
    splitNames: string[],
    attributes?: UserAttributes
  ): SplitIO.Treatments {
    if (!this.client || !this.initialized) {
      const treatments: SplitIO.Treatments = {};
      splitNames.forEach(name => treatments[name] = 'control');
      return treatments;
    }
    return this.client.getTreatments(key, splitNames, attributes);
  }

  // Get multiple treatments with config
  getTreatmentsWithConfig(
    key: string,
    splitNames: string[],
    attributes?: UserAttributes
  ): SplitIO.TreatmentsWithConfig {
    if (!this.client || !this.initialized) {
      const treatments: SplitIO.TreatmentsWithConfig = {};
      splitNames.forEach(name => treatments[name] = { treatment: 'control', config: null });
      return treatments;
    }
    return this.client.getTreatmentsWithConfig(key, splitNames, attributes);
  }

  // Track event
  track(event: TrackEvent): boolean {
    if (!this.client || !this.initialized) {
      return false;
    }

    return this.client.track(
      event.trafficType,
      event.key,
      event.eventType,
      event.value,
      event.properties
    );
  }

  // Get all splits (for debugging)
  getSplits(): SplitIO.SplitView[] {
    if (!this.manager) {
      return [];
    }
    return this.manager.splits();
  }

  // Get split names
  getSplitNames(): string[] {
    if (!this.manager) {
      return [];
    }
    return this.manager.names();
  }

  // Get specific split
  getSplit(splitName: string): SplitIO.SplitView | null {
    if (!this.manager) {
      return null;
    }
    return this.manager.split(splitName);
  }

  // Create client for specific key
  createClient(key: string, trafficType?: string): SplitIO.IClient {
    if (!this.factory) {
      throw new Error('Split factory not initialized');
    }
    return this.factory.client(key, trafficType);
  }

  // Destroy client
  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
    }
  }

  isReady(): boolean {
    return this.initialized;
  }
}

export const splitServer = new SplitServerService();

// Initialize
splitServer.initialize({
  authorizationKey: process.env.SPLIT_API_KEY!,
}).catch(console.error);
```

### Impression Listener

```typescript
// src/services/split-impressions.ts
import { ImpressionListener, SplitIO } from '@splitsoftware/splitio';

interface ImpressionData {
  impression: SplitIO.ImpressionData;
  attributes?: SplitIO.Attributes;
  ip?: string;
  hostname?: string;
  sdkLanguageVersion?: string;
}

class SplitImpressionListener implements ImpressionListener {
  private impressions: ImpressionData[] = [];
  private maxBatchSize = 100;
  private flushCallback?: (impressions: ImpressionData[]) => void;

  constructor(options?: {
    maxBatchSize?: number;
    onFlush?: (impressions: ImpressionData[]) => void;
  }) {
    this.maxBatchSize = options?.maxBatchSize || 100;
    this.flushCallback = options?.onFlush;
  }

  logImpression(impressionData: ImpressionData): void {
    this.impressions.push({
      ...impressionData,
      ip: process.env.HOST_IP,
      hostname: process.env.HOSTNAME,
    });

    if (this.impressions.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.impressions.length === 0) return;

    const batch = [...this.impressions];
    this.impressions = [];

    if (this.flushCallback) {
      this.flushCallback(batch);
    }

    // Could also send to analytics
    console.log(`Flushed ${batch.length} Split impressions`);
  }

  getImpressions(): ImpressionData[] {
    return [...this.impressions];
  }
}

export const splitImpressionListener = new SplitImpressionListener({
  maxBatchSize: 50,
  onFlush: async (impressions) => {
    // Send to your analytics system
    // await analyticsService.trackImpressions(impressions);
  },
});
```

## Express.js API Routes

```typescript
// src/routes/split.ts
import { Router, Request, Response } from 'express';
import { splitServer } from '../services/split-server';

const router = Router();

// Get treatment
router.post('/treatment', async (req: Request, res: Response) => {
  try {
    const { key, splitName, attributes } = req.body;

    if (!key || !splitName) {
      return res.status(400).json({
        error: 'key and splitName are required'
      });
    }

    const treatment = splitServer.getTreatment(key, splitName, attributes);

    res.json({ splitName, treatment });
  } catch (error) {
    console.error('Get treatment error:', error);
    res.status(500).json({ error: 'Failed to get treatment' });
  }
});

// Get treatment with config
router.post('/treatment-with-config', async (req: Request, res: Response) => {
  try {
    const { key, splitName, attributes } = req.body;

    if (!key || !splitName) {
      return res.status(400).json({
        error: 'key and splitName are required'
      });
    }

    const result = splitServer.getTreatmentWithConfig(key, splitName, attributes);

    res.json({
      splitName,
      treatment: result.treatment,
      config: result.config ? JSON.parse(result.config) : null,
    });
  } catch (error) {
    console.error('Get treatment error:', error);
    res.status(500).json({ error: 'Failed to get treatment' });
  }
});

// Get multiple treatments
router.post('/treatments', async (req: Request, res: Response) => {
  try {
    const { key, splitNames, attributes } = req.body;

    if (!key || !splitNames || !Array.isArray(splitNames)) {
      return res.status(400).json({
        error: 'key and splitNames array are required'
      });
    }

    const treatments = splitServer.getTreatments(key, splitNames, attributes);

    res.json({ treatments });
  } catch (error) {
    console.error('Get treatments error:', error);
    res.status(500).json({ error: 'Failed to get treatments' });
  }
});

// Track event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { trafficType, key, eventType, value, properties } = req.body;

    if (!trafficType || !key || !eventType) {
      return res.status(400).json({
        error: 'trafficType, key, and eventType are required'
      });
    }

    const success = splitServer.track({
      trafficType,
      key,
      eventType,
      value,
      properties,
    });

    res.json({ success });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get split info
router.get('/split/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const split = splitServer.getSplit(name);

    if (!split) {
      return res.status(404).json({ error: 'Split not found' });
    }

    res.json({ split });
  } catch (error) {
    console.error('Get split error:', error);
    res.status(500).json({ error: 'Failed to get split' });
  }
});

// Get all splits
router.get('/splits', async (req: Request, res: Response) => {
  try {
    const splits = splitServer.getSplits();
    res.json({ splits, count: splits.length });
  } catch (error) {
    console.error('Get splits error:', error);
    res.status(500).json({ error: 'Failed to get splits' });
  }
});

// Get split names
router.get('/names', async (req: Request, res: Response) => {
  try {
    const names = splitServer.getSplitNames();
    res.json({ names, count: names.length });
  } catch (error) {
    console.error('Get split names error:', error);
    res.status(500).json({ error: 'Failed to get split names' });
  }
});

// Health check
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    ready: splitServer.isReady(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

## React Integration

```typescript
// src/hooks/useSplit.tsx
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { SplitFactoryProvider, useSplitClient, useSplitTreatments } from '@splitsoftware/splitio-react';

interface SplitContextValue {
  isReady: boolean;
  getTreatment: (splitName: string, attributes?: SplitIO.Attributes) => string;
  getTreatmentWithConfig: (splitName: string, attributes?: SplitIO.Attributes) => SplitIO.TreatmentWithConfig;
  track: (eventType: string, value?: number, properties?: Record<string, any>) => boolean;
}

// Provider setup
interface SplitProviderProps {
  children: ReactNode;
  authorizationKey: string;
  userKey: string;
  trafficType?: string;
  attributes?: SplitIO.Attributes;
}

export function SplitProvider({
  children,
  authorizationKey,
  userKey,
  trafficType = 'user',
  attributes,
}: SplitProviderProps) {
  const config: SplitIO.IBrowserSettings = {
    core: {
      authorizationKey,
      key: userKey,
      trafficType,
    },
    startup: {
      readyTimeout: 10,
    },
  };

  return (
    <SplitFactoryProvider config={config} attributes={attributes}>
      {children}
    </SplitFactoryProvider>
  );
}

// Hook for single treatment
export function useTreatment(
  splitName: string,
  attributes?: SplitIO.Attributes
): { treatment: string; config: any; isReady: boolean } {
  const { treatments, isReady } = useSplitTreatments({
    names: [splitName],
    attributes,
  });

  const result = treatments[splitName] || { treatment: 'control', config: null };

  return {
    treatment: result.treatment,
    config: result.config ? JSON.parse(result.config) : null,
    isReady,
  };
}

// Hook for multiple treatments
export function useTreatments(
  splitNames: string[],
  attributes?: SplitIO.Attributes
): { treatments: Record<string, string>; isReady: boolean } {
  const { treatments, isReady } = useSplitTreatments({
    names: splitNames,
    attributes,
  });

  const simpleTreatments = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(treatments)) {
      result[key] = value.treatment;
    }
    return result;
  }, [treatments]);

  return { treatments: simpleTreatments, isReady };
}

// Hook for tracking
export function useTrack() {
  const client = useSplitClient();

  return useMemo(() => ({
    track: (eventType: string, value?: number, properties?: Record<string, any>) => {
      if (!client.client) return false;
      return client.client.track(eventType, value, properties);
    },
    isReady: client.isReady,
  }), [client]);
}

// Boolean feature flag hook
export function useFeatureFlag(
  splitName: string,
  attributes?: SplitIO.Attributes
): boolean {
  const { treatment, isReady } = useTreatment(splitName, attributes);

  if (!isReady) return false;
  return treatment === 'on' || treatment === 'true';
}

// Variant hook with default
export function useVariant<T extends string>(
  splitName: string,
  defaultVariant: T,
  attributes?: SplitIO.Attributes
): T {
  const { treatment, isReady } = useTreatment(splitName, attributes);

  if (!isReady || treatment === 'control') {
    return defaultVariant;
  }

  return treatment as T;
}
```

### Split Components

```tsx
// src/components/SplitFeature.tsx
import React, { ReactNode, useEffect } from 'react';
import { useTreatment, useFeatureFlag, useTrack } from '../hooks/useSplit';

// Feature gate
interface FeatureProps {
  splitName: string;
  children: ReactNode;
  fallback?: ReactNode;
  attributes?: SplitIO.Attributes;
}

export function Feature({
  splitName,
  children,
  fallback = null,
  attributes
}: FeatureProps) {
  const isEnabled = useFeatureFlag(splitName, attributes);
  return <>{isEnabled ? children : fallback}</>;
}

// Treatment rendering
interface TreatmentProps {
  splitName: string;
  treatments: Record<string, ReactNode>;
  attributes?: SplitIO.Attributes;
}

export function Treatment({
  splitName,
  treatments,
  attributes
}: TreatmentProps) {
  const { treatment, isReady } = useTreatment(splitName, attributes);

  if (!isReady) {
    return <>{treatments['control'] || null}</>;
  }

  return <>{treatments[treatment] || treatments['control'] || null}</>;
}

// A/B Test with tracking
interface ABTestProps {
  splitName: string;
  control: ReactNode;
  treatment: ReactNode;
  trackImpression?: boolean;
  attributes?: SplitIO.Attributes;
}

export function ABTest({
  splitName,
  control,
  treatment: treatmentElement,
  trackImpression = true,
  attributes,
}: ABTestProps) {
  const { treatment, isReady } = useTreatment(splitName, attributes);
  const { track } = useTrack();

  useEffect(() => {
    if (isReady && trackImpression) {
      track(`${splitName}_impression`, undefined, { treatment });
    }
  }, [isReady, splitName, treatment, trackImpression, track]);

  if (!isReady || treatment === 'control' || treatment === 'off') {
    return <>{control}</>;
  }

  return <>{treatmentElement}</>;
}

// Config-driven component
interface ConfigDrivenProps<T> {
  splitName: string;
  render: (config: T) => ReactNode;
  fallback?: ReactNode;
  attributes?: SplitIO.Attributes;
}

export function ConfigDriven<T>({
  splitName,
  render,
  fallback = null,
  attributes,
}: ConfigDrivenProps<T>) {
  const { treatment, config, isReady } = useTreatment(splitName, attributes);

  if (!isReady || treatment === 'off' || !config) {
    return <>{fallback}</>;
  }

  return <>{render(config as T)}</>;
}

// Track conversion component
interface TrackConversionProps {
  eventType: string;
  value?: number;
  properties?: Record<string, any>;
  children: (track: () => void) => ReactNode;
}

export function TrackConversion({
  eventType,
  value,
  properties,
  children,
}: TrackConversionProps) {
  const { track: trackEvent } = useTrack();

  const handleTrack = () => {
    trackEvent(eventType, value, properties);
  };

  return <>{children(handleTrack)}</>;
}

// Example usage
function ExampleUsage() {
  return (
    <div>
      {/* Simple feature flag */}
      <Feature splitName="new-header">
        <NewHeader />
      </Feature>

      {/* Multiple treatments */}
      <Treatment
        splitName="checkout-flow"
        treatments={{
          control: <CheckoutV1 />,
          v2: <CheckoutV2 />,
          v3: <CheckoutV3 />,
        }}
      />

      {/* A/B test */}
      <ABTest
        splitName="pricing-experiment"
        control={<OriginalPricing />}
        treatment={<NewPricing />}
      />

      {/* Config-driven */}
      <ConfigDriven<{ buttonColor: string; buttonText: string }>
        splitName="cta-config"
        render={(config) => (
          <button style={{ backgroundColor: config.buttonColor }}>
            {config.buttonText}
          </button>
        )}
      />

      {/* Track conversion */}
      <TrackConversion eventType="purchase" value={99.99}>
        {(track) => (
          <button onClick={track}>Complete Purchase</button>
        )}
      </TrackConversion>
    </div>
  );
}

function NewHeader() {
  return <header>New Header</header>;
}

function CheckoutV1() {
  return <div>Checkout V1</div>;
}

function CheckoutV2() {
  return <div>Checkout V2</div>;
}

function CheckoutV3() {
  return <div>Checkout V3</div>;
}

function OriginalPricing() {
  return <div>Original Pricing</div>;
}

function NewPricing() {
  return <div>New Pricing</div>;
}
```

## Python Implementation

```python
# split_service.py
from splitio import get_factory
from splitio.client.client import Client
from splitio.client.manager import SplitManager
from typing import Dict, Any, Optional, List, Union
import os

class SplitService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        ready_timeout: int = 10,
        features_refresh_rate: int = 30,
        segments_refresh_rate: int = 30
    ):
        api_key = api_key or os.environ.get('SPLIT_API_KEY')

        config = {
            'ready': ready_timeout,
            'featuresRefreshRate': features_refresh_rate,
            'segmentsRefreshRate': segments_refresh_rate,
        }

        self.factory = get_factory(api_key, config=config)
        self.client: Client = self.factory.client()
        self.manager: SplitManager = self.factory.manager()

        # Wait for SDK to be ready
        self.factory.block_until_ready(ready_timeout)

    def get_treatment(
        self,
        key: str,
        split_name: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> str:
        """Get treatment for a split."""
        return self.client.get_treatment(key, split_name, attributes)

    def get_treatment_with_config(
        self,
        key: str,
        split_name: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get treatment with configuration."""
        result = self.client.get_treatment_with_config(key, split_name, attributes)
        return {
            'treatment': result['treatment'],
            'config': result['config']
        }

    def get_treatments(
        self,
        key: str,
        split_names: List[str],
        attributes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, str]:
        """Get treatments for multiple splits."""
        return self.client.get_treatments(key, split_names, attributes)

    def get_treatments_with_config(
        self,
        key: str,
        split_names: List[str],
        attributes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """Get treatments with configs for multiple splits."""
        return self.client.get_treatments_with_config(key, split_names, attributes)

    def track(
        self,
        key: str,
        traffic_type: str,
        event_type: str,
        value: Optional[float] = None,
        properties: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Track an event."""
        return self.client.track(key, traffic_type, event_type, value, properties)

    def get_splits(self) -> List[Dict[str, Any]]:
        """Get all splits."""
        return [self._split_to_dict(s) for s in self.manager.splits()]

    def get_split(self, split_name: str) -> Optional[Dict[str, Any]]:
        """Get a specific split."""
        split = self.manager.split(split_name)
        if split:
            return self._split_to_dict(split)
        return None

    def get_split_names(self) -> List[str]:
        """Get all split names."""
        return self.manager.split_names()

    def _split_to_dict(self, split) -> Dict[str, Any]:
        """Convert split view to dictionary."""
        return {
            'name': split.name,
            'traffic_type': split.traffic_type,
            'killed': split.killed,
            'treatments': split.treatments,
            'change_number': split.change_number,
            'configs': split.configs
        }

    def is_feature_on(
        self,
        key: str,
        split_name: str,
        attributes: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Check if feature is enabled."""
        treatment = self.get_treatment(key, split_name, attributes)
        return treatment == 'on' or treatment == 'true'

    def destroy(self) -> None:
        """Destroy the client."""
        self.client.destroy()


# FastAPI routes
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/split", tags=["split"])
split_service = SplitService()

class TreatmentRequest(BaseModel):
    key: str
    split_name: str
    attributes: Optional[Dict[str, Any]] = None

class TreatmentsRequest(BaseModel):
    key: str
    split_names: List[str]
    attributes: Optional[Dict[str, Any]] = None

class TrackRequest(BaseModel):
    key: str
    traffic_type: str
    event_type: str
    value: Optional[float] = None
    properties: Optional[Dict[str, Any]] = None

@router.post("/treatment")
async def get_treatment(request: TreatmentRequest):
    try:
        treatment = split_service.get_treatment(
            request.key,
            request.split_name,
            request.attributes
        )
        return {"split_name": request.split_name, "treatment": treatment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/treatment-with-config")
async def get_treatment_with_config(request: TreatmentRequest):
    try:
        result = split_service.get_treatment_with_config(
            request.key,
            request.split_name,
            request.attributes
        )
        return {"split_name": request.split_name, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/treatments")
async def get_treatments(request: TreatmentsRequest):
    try:
        treatments = split_service.get_treatments(
            request.key,
            request.split_names,
            request.attributes
        )
        return {"treatments": treatments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track")
async def track_event(request: TrackRequest):
    try:
        success = split_service.track(
            request.key,
            request.traffic_type,
            request.event_type,
            request.value,
            request.properties
        )
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/splits")
async def get_splits():
    try:
        splits = split_service.get_splits()
        return {"splits": splits, "count": len(splits)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/split/{name}")
async def get_split(name: str):
    try:
        split = split_service.get_split(name)
        if not split:
            raise HTTPException(status_code=404, detail="Split not found")
        return {"split": split}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/names")
async def get_split_names():
    try:
        names = split_service.get_split_names()
        return {"names": names, "count": len(names)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Split.io Feature Flags

### Commands
- `split:treatment <key> <split>` - Get treatment
- `split:track <key> <type> <event>` - Track event
- `split:splits` - List all splits

### Key Files
- `src/services/split-server.ts` - Server SDK
- `src/hooks/useSplit.tsx` - React integration
- `src/components/SplitFeature.tsx` - React components

### Traffic Types
- `user` - Individual users
- `account` - B2B accounts
- `anonymous` - Pre-signup visitors

### Treatment Values
- `on` / `off` - Binary flags
- `control` - Default/baseline
- Custom strings for multi-variant tests
```

## AI Suggestions

1. **Targeting Rules**: Build sophisticated targeting with Split's rule engine
2. **Metric Integration**: Connect Split to your data warehouse for impact analysis
3. **Kill Switch**: Implement instant kill switches for problematic features
4. **Gradual Rollout**: Use percentage-based rollouts for safe releases
5. **Segments**: Create reusable segments for common user groups
6. **Dependencies**: Set up feature dependencies for complex rollouts
7. **Environments**: Manage flags across dev/staging/production
8. **Impressions**: Analyze impression data for exposure insights
9. **Traffic Allocation**: Control traffic distribution for experiments
10. **Statistical Analysis**: Use Split's stats engine for experiment results
