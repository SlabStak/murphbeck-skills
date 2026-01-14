# Unleash Feature Flags

Production-ready Unleash integration for open-source feature flag management and gradual rollouts.

## Overview

Unleash is an open-source feature management platform that provides powerful feature toggles with fine-grained control. This template implements complete Unleash integration with server-side SDK and React support.

## Quick Start

```bash
npm install unleash-client @unleash/proxy-client-react
```

## TypeScript Implementation

### Server-Side SDK

```typescript
// src/services/unleash-server.ts
import { Unleash, initialize, startUnleash } from 'unleash-client';

interface UnleashConfig {
  url: string;
  appName: string;
  instanceId?: string;
  environment?: string;
  customHeaders?: Record<string, string>;
  refreshInterval?: number;
  metricsInterval?: number;
  strategies?: any[];
}

interface UnleashContext {
  userId?: string;
  sessionId?: string;
  remoteAddress?: string;
  environment?: string;
  appName?: string;
  currentTime?: Date;
  properties?: Record<string, string>;
}

interface FeatureToggle {
  name: string;
  enabled: boolean;
  variant?: {
    name: string;
    payload?: {
      type: string;
      value: string;
    };
    enabled: boolean;
  };
}

class UnleashServerService {
  private client: Unleash | null = null;
  private initialized = false;

  async initialize(config: UnleashConfig): Promise<void> {
    this.client = initialize({
      url: config.url,
      appName: config.appName,
      instanceId: config.instanceId || `${config.appName}-${Date.now()}`,
      environment: config.environment || 'development',
      customHeaders: config.customHeaders,
      refreshInterval: config.refreshInterval || 15000,
      metricsInterval: config.metricsInterval || 60000,
      strategies: config.strategies,
    });

    return new Promise((resolve, reject) => {
      this.client!.on('ready', () => {
        this.initialized = true;
        resolve();
      });

      this.client!.on('error', (error) => {
        console.error('Unleash error:', error);
        reject(error);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.initialized) {
          this.initialized = true;
          resolve();
        }
      }, 10000);
    });
  }

  // Check if feature is enabled
  isEnabled(
    featureName: string,
    context?: UnleashContext,
    defaultValue = false
  ): boolean {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }

    return this.client.isEnabled(featureName, context, defaultValue);
  }

  // Get variant
  getVariant(
    featureName: string,
    context?: UnleashContext
  ): {
    name: string;
    payload?: { type: string; value: string };
    enabled: boolean;
  } {
    if (!this.client || !this.initialized) {
      return { name: 'disabled', enabled: false };
    }

    return this.client.getVariant(featureName, context);
  }

  // Get feature toggle details
  getFeatureToggle(featureName: string): FeatureToggle | undefined {
    if (!this.client) return undefined;

    const toggle = this.client.getFeatureToggleDefinition(featureName);
    if (!toggle) return undefined;

    return {
      name: toggle.name,
      enabled: toggle.enabled,
    };
  }

  // Get all feature toggles
  getAllToggles(): string[] {
    if (!this.client) return [];

    const definitions = this.client.getFeatureToggleDefinitions();
    return definitions.map(d => d.name);
  }

  // Count enabled features
  count(featureName: string, enabled: boolean): void {
    if (!this.client) return;
    this.client.count(featureName, enabled);
  }

  // Send metrics
  sendMetrics(): void {
    if (!this.client) return;
    this.client.sendMetrics();
  }

  // Destroy client
  destroy(): void {
    if (this.client) {
      this.client.destroy();
    }
  }

  isReady(): boolean {
    return this.initialized;
  }

  // Create context from request
  createContext(
    userId?: string,
    sessionId?: string,
    remoteAddress?: string,
    properties?: Record<string, string>
  ): UnleashContext {
    return {
      userId,
      sessionId,
      remoteAddress,
      properties,
      currentTime: new Date(),
    };
  }
}

export const unleashServer = new UnleashServerService();

// Initialize
unleashServer.initialize({
  url: process.env.UNLEASH_URL || 'http://localhost:4242/api',
  appName: process.env.UNLEASH_APP_NAME || 'my-app',
  instanceId: process.env.UNLEASH_INSTANCE_ID,
  environment: process.env.NODE_ENV,
  customHeaders: process.env.UNLEASH_API_TOKEN
    ? { Authorization: process.env.UNLEASH_API_TOKEN }
    : undefined,
}).catch(console.error);
```

### Custom Strategy Implementation

```typescript
// src/services/unleash-strategies.ts
import { Strategy } from 'unleash-client';

// User ID list strategy
export class UserIdStrategy extends Strategy {
  constructor() {
    super('userIds');
  }

  isEnabled(
    parameters: { userIds: string },
    context: { userId?: string }
  ): boolean {
    if (!context.userId) return false;

    const userIds = parameters.userIds
      .split(',')
      .map(id => id.trim());

    return userIds.includes(context.userId);
  }
}

// Beta users strategy
export class BetaUserStrategy extends Strategy {
  constructor() {
    super('betaUsers');
  }

  isEnabled(
    parameters: Record<string, string>,
    context: { properties?: { isBetaUser?: string } }
  ): boolean {
    return context.properties?.isBetaUser === 'true';
  }
}

// Geographic region strategy
export class GeoRegionStrategy extends Strategy {
  constructor() {
    super('geoRegion');
  }

  isEnabled(
    parameters: { regions: string },
    context: { properties?: { region?: string } }
  ): boolean {
    if (!context.properties?.region) return false;

    const allowedRegions = parameters.regions
      .split(',')
      .map(r => r.trim().toLowerCase());

    return allowedRegions.includes(context.properties.region.toLowerCase());
  }
}

// Time-based strategy
export class TimeBasedStrategy extends Strategy {
  constructor() {
    super('timeBased');
  }

  isEnabled(
    parameters: { startHour: string; endHour: string; timezone?: string },
    context: { currentTime?: Date }
  ): boolean {
    const now = context.currentTime || new Date();
    const hour = now.getHours();

    const startHour = parseInt(parameters.startHour, 10);
    const endHour = parseInt(parameters.endHour, 10);

    if (startHour <= endHour) {
      return hour >= startHour && hour < endHour;
    } else {
      // Handles overnight periods (e.g., 22:00 to 06:00)
      return hour >= startHour || hour < endHour;
    }
  }
}

// Percentage by property strategy
export class PercentageByPropertyStrategy extends Strategy {
  constructor() {
    super('percentageByProperty');
  }

  isEnabled(
    parameters: { percentage: string; property: string },
    context: { properties?: Record<string, string> }
  ): boolean {
    const property = parameters.property;
    const value = context.properties?.[property];

    if (!value) return false;

    const percentage = parseInt(parameters.percentage, 10);
    const hash = this.hashString(value);
    const normalizedHash = hash % 100;

    return normalizedHash < percentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export const customStrategies = [
  new UserIdStrategy(),
  new BetaUserStrategy(),
  new GeoRegionStrategy(),
  new TimeBasedStrategy(),
  new PercentageByPropertyStrategy(),
];
```

## Express.js API Routes

```typescript
// src/routes/unleash.ts
import { Router, Request, Response } from 'express';
import { unleashServer } from '../services/unleash-server';

const router = Router();

// Check if feature is enabled
router.post('/enabled', async (req: Request, res: Response) => {
  try {
    const { featureName, context } = req.body;

    if (!featureName) {
      return res.status(400).json({ error: 'featureName is required' });
    }

    const unleashContext = {
      ...context,
      remoteAddress: req.ip,
    };

    const enabled = unleashServer.isEnabled(featureName, unleashContext);

    res.json({ featureName, enabled });
  } catch (error) {
    console.error('Feature check error:', error);
    res.status(500).json({ error: 'Failed to check feature' });
  }
});

// Get variant
router.post('/variant', async (req: Request, res: Response) => {
  try {
    const { featureName, context } = req.body;

    if (!featureName) {
      return res.status(400).json({ error: 'featureName is required' });
    }

    const unleashContext = {
      ...context,
      remoteAddress: req.ip,
    };

    const variant = unleashServer.getVariant(featureName, unleashContext);

    res.json({ featureName, variant });
  } catch (error) {
    console.error('Get variant error:', error);
    res.status(500).json({ error: 'Failed to get variant' });
  }
});

// Check multiple features
router.post('/features', async (req: Request, res: Response) => {
  try {
    const { featureNames, context } = req.body;

    if (!featureNames || !Array.isArray(featureNames)) {
      return res.status(400).json({ error: 'featureNames array is required' });
    }

    const unleashContext = {
      ...context,
      remoteAddress: req.ip,
    };

    const features: Record<string, boolean> = {};
    for (const name of featureNames) {
      features[name] = unleashServer.isEnabled(name, unleashContext);
    }

    res.json({ features });
  } catch (error) {
    console.error('Features check error:', error);
    res.status(500).json({ error: 'Failed to check features' });
  }
});

// Get all toggle names
router.get('/toggles', async (req: Request, res: Response) => {
  try {
    const toggles = unleashServer.getAllToggles();
    res.json({ toggles, count: toggles.length });
  } catch (error) {
    console.error('Get toggles error:', error);
    res.status(500).json({ error: 'Failed to get toggles' });
  }
});

// Health check
router.get('/health', async (req: Request, res: Response) => {
  res.json({
    ready: unleashServer.isReady(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

## React Integration

```typescript
// src/hooks/useUnleash.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { UnleashClient, IConfig } from '@unleash/proxy-client-react';

interface UnleashContextValue {
  isReady: boolean;
  isEnabled: (featureName: string) => boolean;
  getVariant: (featureName: string) => { name: string; payload?: any; enabled: boolean };
  updateContext: (context: Record<string, string>) => void;
}

const UnleashContext = createContext<UnleashContextValue | null>(null);

interface UnleashProviderProps {
  children: ReactNode;
  url: string;
  clientKey: string;
  appName: string;
  refreshInterval?: number;
  context?: Record<string, string>;
}

export function UnleashProvider({
  children,
  url,
  clientKey,
  appName,
  refreshInterval = 15,
  context: initialContext,
}: UnleashProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<UnleashClient | null>(null);

  useEffect(() => {
    const config: IConfig = {
      url,
      clientKey,
      appName,
      refreshInterval,
    };

    const unleashClient = new UnleashClient(config);

    if (initialContext) {
      unleashClient.updateContext(initialContext);
    }

    unleashClient.on('ready', () => {
      setIsReady(true);
    });

    unleashClient.start();
    setClient(unleashClient);

    return () => {
      unleashClient.stop();
    };
  }, [url, clientKey, appName, refreshInterval]);

  const isEnabled = useCallback((featureName: string) => {
    if (!client) return false;
    return client.isEnabled(featureName);
  }, [client]);

  const getVariant = useCallback((featureName: string) => {
    if (!client) return { name: 'disabled', enabled: false };
    return client.getVariant(featureName);
  }, [client]);

  const updateContext = useCallback((context: Record<string, string>) => {
    if (client) {
      client.updateContext(context);
    }
  }, [client]);

  const value: UnleashContextValue = {
    isReady,
    isEnabled,
    getVariant,
    updateContext,
  };

  return (
    <UnleashContext.Provider value={value}>
      {children}
    </UnleashContext.Provider>
  );
}

export function useUnleash(): UnleashContextValue {
  const context = useContext(UnleashContext);
  if (!context) {
    throw new Error('useUnleash must be used within UnleashProvider');
  }
  return context;
}

// Feature flag hook
export function useFeatureFlag(featureName: string, defaultValue = false): boolean {
  const { isEnabled, isReady } = useUnleash();

  if (!isReady) return defaultValue;
  return isEnabled(featureName);
}

// Variant hook
export function useVariant(featureName: string): {
  name: string;
  payload?: any;
  enabled: boolean;
} {
  const { getVariant, isReady } = useUnleash();

  if (!isReady) return { name: 'disabled', enabled: false };
  return getVariant(featureName);
}

// Multiple flags hook
export function useFeatureFlags(featureNames: string[]): Record<string, boolean> {
  const { isEnabled, isReady } = useUnleash();

  const flags: Record<string, boolean> = {};
  for (const name of featureNames) {
    flags[name] = isReady ? isEnabled(name) : false;
  }

  return flags;
}
```

### Unleash Components

```tsx
// src/components/UnleashFeature.tsx
import React, { ReactNode } from 'react';
import { useFeatureFlag, useVariant, useUnleash } from '../hooks/useUnleash';

// Feature gate
interface FeatureProps {
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Feature({ name, children, fallback = null }: FeatureProps) {
  const enabled = useFeatureFlag(name);
  return <>{enabled ? children : fallback}</>;
}

// Variant renderer
interface VariantProps {
  name: string;
  variants: Record<string, ReactNode>;
  defaultVariant?: string;
}

export function Variant({ name, variants, defaultVariant = 'disabled' }: VariantProps) {
  const variant = useVariant(name);
  return <>{variants[variant.name] || variants[defaultVariant] || null}</>;
}

// Variant with payload
interface VariantPayloadProps<T> {
  name: string;
  render: (payload: T, enabled: boolean) => ReactNode;
  fallback?: ReactNode;
}

export function VariantPayload<T>({
  name,
  render,
  fallback = null
}: VariantPayloadProps<T>) {
  const variant = useVariant(name);

  if (!variant.enabled || !variant.payload) {
    return <>{fallback}</>;
  }

  const payload = typeof variant.payload === 'string'
    ? JSON.parse(variant.payload)
    : variant.payload;

  return <>{render(payload as T, variant.enabled)}</>;
}

// Loading wrapper
interface FlagsReadyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function FlagsReady({ children, fallback = null }: FlagsReadyProps) {
  const { isReady } = useUnleash();
  return <>{isReady ? children : fallback}</>;
}

// A/B Test component
interface ABTestProps {
  featureName: string;
  control: ReactNode;
  treatment: ReactNode;
}

export function ABTest({ featureName, control, treatment }: ABTestProps) {
  const enabled = useFeatureFlag(featureName);
  return <>{enabled ? treatment : control}</>;
}

// Multi-variant test
interface MultiVariantProps {
  featureName: string;
  variants: {
    [key: string]: ReactNode;
  };
}

export function MultiVariant({ featureName, variants }: MultiVariantProps) {
  const variant = useVariant(featureName);

  if (!variant.enabled) {
    return <>{variants['control'] || variants['disabled'] || null}</>;
  }

  return <>{variants[variant.name] || variants['control'] || null}</>;
}
```

## Python Implementation

```python
# unleash_service.py
from UnleashClient import UnleashClient
from UnleashClient.strategies import Strategy
from typing import Dict, Any, Optional, List
import os
import hashlib

class UnleashService:
    def __init__(
        self,
        url: Optional[str] = None,
        app_name: Optional[str] = None,
        instance_id: Optional[str] = None,
        environment: Optional[str] = None,
        custom_headers: Optional[Dict[str, str]] = None,
        refresh_interval: int = 15,
        metrics_interval: int = 60
    ):
        url = url or os.environ.get('UNLEASH_URL', 'http://localhost:4242/api')
        app_name = app_name or os.environ.get('UNLEASH_APP_NAME', 'my-app')

        self.client = UnleashClient(
            url=url,
            app_name=app_name,
            instance_id=instance_id,
            environment=environment or os.environ.get('UNLEASH_ENVIRONMENT', 'development'),
            custom_headers=custom_headers,
            refresh_interval=refresh_interval,
            metrics_interval=metrics_interval
        )

        # Register custom strategies
        self._register_strategies()

        # Initialize client
        self.client.initialize_client()

    def _register_strategies(self) -> None:
        """Register custom strategies."""
        self.client.register_custom_strategies({
            'userIds': UserIdListStrategy(),
            'betaUsers': BetaUserStrategy(),
        })

    def is_enabled(
        self,
        feature_name: str,
        context: Optional[Dict[str, Any]] = None,
        default: bool = False
    ) -> bool:
        """Check if feature is enabled."""
        return self.client.is_enabled(feature_name, context, default)

    def get_variant(
        self,
        feature_name: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Get variant for feature."""
        variant = self.client.get_variant(feature_name, context)
        return {
            'name': variant.get('name', 'disabled'),
            'payload': variant.get('payload'),
            'enabled': variant.get('enabled', False)
        }

    def get_all_toggles(self) -> List[str]:
        """Get all toggle names."""
        return list(self.client.features.keys()) if self.client.features else []

    def create_context(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        remote_address: Optional[str] = None,
        properties: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Create context dictionary."""
        context = {}
        if user_id:
            context['userId'] = user_id
        if session_id:
            context['sessionId'] = session_id
        if remote_address:
            context['remoteAddress'] = remote_address
        if properties:
            context['properties'] = properties
        return context

    def destroy(self) -> None:
        """Destroy client."""
        self.client.destroy()


# Custom strategies
class UserIdListStrategy(Strategy):
    """Enable feature for specific user IDs."""

    def load_provisioning(self) -> list:
        return [{"name": "userIds", "type": "string"}]

    def apply(self, context: Dict[str, Any] = None) -> bool:
        if not context or 'userId' not in context:
            return False

        user_ids = self.parameters.get('userIds', '').split(',')
        user_ids = [uid.strip() for uid in user_ids]

        return context['userId'] in user_ids


class BetaUserStrategy(Strategy):
    """Enable feature for beta users."""

    def load_provisioning(self) -> list:
        return []

    def apply(self, context: Dict[str, Any] = None) -> bool:
        if not context:
            return False

        properties = context.get('properties', {})
        return properties.get('isBetaUser') == 'true'


# FastAPI routes
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter(prefix="/unleash", tags=["unleash"])
unleash_service = UnleashService()

class FeatureCheckRequest(BaseModel):
    feature_name: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    properties: Optional[Dict[str, str]] = None

class MultiFeaturesRequest(BaseModel):
    feature_names: List[str]
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    properties: Optional[Dict[str, str]] = None

@router.post("/enabled")
async def check_enabled(request: FeatureCheckRequest, req: Request):
    try:
        context = unleash_service.create_context(
            user_id=request.user_id,
            session_id=request.session_id,
            remote_address=req.client.host if req.client else None,
            properties=request.properties
        )
        enabled = unleash_service.is_enabled(request.feature_name, context)
        return {"feature_name": request.feature_name, "enabled": enabled}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/variant")
async def get_variant(request: FeatureCheckRequest, req: Request):
    try:
        context = unleash_service.create_context(
            user_id=request.user_id,
            session_id=request.session_id,
            remote_address=req.client.host if req.client else None,
            properties=request.properties
        )
        variant = unleash_service.get_variant(request.feature_name, context)
        return {"feature_name": request.feature_name, "variant": variant}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/features")
async def check_features(request: MultiFeaturesRequest, req: Request):
    try:
        context = unleash_service.create_context(
            user_id=request.user_id,
            session_id=request.session_id,
            remote_address=req.client.host if req.client else None,
            properties=request.properties
        )
        features = {}
        for name in request.feature_names:
            features[name] = unleash_service.is_enabled(name, context)
        return {"features": features}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/toggles")
async def get_toggles():
    try:
        toggles = unleash_service.get_all_toggles()
        return {"toggles": toggles, "count": len(toggles)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Unleash Feature Flags

### Commands
- `unleash:enabled <feature> [userId]` - Check if feature enabled
- `unleash:variant <feature> [userId]` - Get feature variant
- `unleash:toggles` - List all toggles

### Key Files
- `src/services/unleash-server.ts` - Server SDK
- `src/services/unleash-strategies.ts` - Custom strategies
- `src/hooks/useUnleash.tsx` - React integration

### Activation Strategies
- `default` - Simple on/off
- `userWithId` - Enable for specific users
- `gradualRolloutUserId` - Percentage by user ID
- `gradualRolloutSessionId` - Percentage by session
- `remoteAddress` - Enable by IP range
- `applicationHostname` - Enable by hostname
```

## AI Suggestions

1. **Self-Hosted**: Deploy Unleash server for full control over feature flags
2. **GitOps**: Manage flag configurations via version control
3. **Strategies**: Create custom strategies for domain-specific targeting
4. **Constraints**: Use constraints for complex targeting rules
5. **Variants**: Implement A/B testing with weighted variants
6. **Environments**: Separate flag states across environments
7. **Tags**: Organize flags with project and team tags
8. **Metrics**: Analyze flag usage with built-in metrics
9. **SDK Proxy**: Use Unleash Edge for frontend applications
10. **Audit Log**: Track all flag changes for compliance
