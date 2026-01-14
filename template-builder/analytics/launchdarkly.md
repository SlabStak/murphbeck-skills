# LaunchDarkly Feature Flags

Production-ready LaunchDarkly integration for feature flags, experimentation, and targeted rollouts.

## Overview

LaunchDarkly is the leading feature management platform for controlled rollouts, A/B testing, and feature flagging at scale. This template provides complete integration with server-side and client-side SDKs.

## Quick Start

```bash
npm install @launchdarkly/node-server-sdk @launchdarkly/js-client-sdk
```

## TypeScript Implementation

### Server-Side SDK

```typescript
// src/services/launchdarkly-server.ts
import * as LaunchDarkly from '@launchdarkly/node-server-sdk';

interface LaunchDarklyConfig {
  sdkKey: string;
  offline?: boolean;
  baseUri?: string;
  streamUri?: string;
  eventsUri?: string;
  timeout?: number;
  logger?: LaunchDarkly.LDLogger;
}

interface UserContext {
  key: string;
  kind?: 'user' | 'multi';
  anonymous?: boolean;
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  ip?: string;
  country?: string;
  custom?: Record<string, any>;
  privateAttributes?: string[];
}

interface MultiContext {
  kind: 'multi';
  user?: UserContext;
  organization?: {
    key: string;
    name?: string;
    plan?: string;
    [key: string]: any;
  };
  device?: {
    key: string;
    type?: string;
    os?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type Context = UserContext | MultiContext;

class LaunchDarklyServerService {
  private client: LaunchDarkly.LDClient | null = null;
  private initialized = false;

  async initialize(config: LaunchDarklyConfig): Promise<void> {
    const options: LaunchDarkly.LDOptions = {
      offline: config.offline,
      baseUri: config.baseUri,
      streamUri: config.streamUri,
      eventsUri: config.eventsUri,
      timeout: config.timeout || 5,
      logger: config.logger || LaunchDarkly.basicLogger({
        level: 'info',
      }),
    };

    this.client = LaunchDarkly.init(config.sdkKey, options);

    try {
      await this.client.waitForInitialization();
      this.initialized = true;
    } catch (error) {
      console.error('LaunchDarkly initialization failed:', error);
      throw error;
    }
  }

  // Create context from user data
  createContext(user: UserContext): LaunchDarkly.LDContext {
    const context: LaunchDarkly.LDContext = {
      kind: user.kind || 'user',
      key: user.key,
      anonymous: user.anonymous,
      name: user.name,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      ip: user.ip,
      country: user.country,
      ...user.custom,
    };

    if (user.privateAttributes?.length) {
      context._meta = {
        privateAttributes: user.privateAttributes,
      };
    }

    return context;
  }

  // Create multi-context
  createMultiContext(contexts: MultiContext): LaunchDarkly.LDContext {
    return contexts as LaunchDarkly.LDContext;
  }

  // Get boolean flag
  async getBooleanFlag(
    flagKey: string,
    context: Context,
    defaultValue = false
  ): Promise<boolean> {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.variation(flagKey, ldContext, defaultValue);
  }

  // Get string flag
  async getStringFlag(
    flagKey: string,
    context: Context,
    defaultValue = ''
  ): Promise<string> {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.variation(flagKey, ldContext, defaultValue);
  }

  // Get number flag
  async getNumberFlag(
    flagKey: string,
    context: Context,
    defaultValue = 0
  ): Promise<number> {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.variation(flagKey, ldContext, defaultValue);
  }

  // Get JSON flag
  async getJsonFlag<T>(
    flagKey: string,
    context: Context,
    defaultValue: T
  ): Promise<T> {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.variation(flagKey, ldContext, defaultValue);
  }

  // Get variation detail (with reason)
  async getVariationDetail<T>(
    flagKey: string,
    context: Context,
    defaultValue: T
  ): Promise<LaunchDarkly.LDEvaluationDetail> {
    if (!this.client || !this.initialized) {
      return {
        value: defaultValue,
        variationIndex: null,
        reason: { kind: 'ERROR', errorKind: 'CLIENT_NOT_READY' },
      };
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.variationDetail(flagKey, ldContext, defaultValue);
  }

  // Get all flags
  async getAllFlags(context: Context): Promise<LaunchDarkly.LDFlagsState> {
    if (!this.client || !this.initialized) {
      throw new Error('LaunchDarkly client not initialized');
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.allFlagsState(ldContext);
  }

  // Track event
  track(
    eventKey: string,
    context: Context,
    data?: any,
    metricValue?: number
  ): void {
    if (!this.client || !this.initialized) {
      return;
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    this.client.track(eventKey, ldContext, data, metricValue);
  }

  // Identify context (for analytics)
  identify(context: Context): void {
    if (!this.client || !this.initialized) {
      return;
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    this.client.identify(ldContext);
  }

  // Secure mode hash
  async secureModeHash(context: Context): Promise<string> {
    if (!this.client || !this.initialized) {
      throw new Error('LaunchDarkly client not initialized');
    }

    const ldContext = 'kind' in context && context.kind === 'multi'
      ? this.createMultiContext(context as MultiContext)
      : this.createContext(context as UserContext);

    return this.client.secureModeHash(ldContext);
  }

  // Flush events
  async flush(): Promise<void> {
    if (!this.client) return;
    await this.client.flush();
  }

  // Close client
  async close(): Promise<void> {
    if (!this.client) return;
    await this.client.close();
  }

  // Check if initialized
  isInitialized(): boolean {
    return this.initialized;
  }

  // Wait for initialization
  async waitForInitialization(): Promise<void> {
    if (!this.client) {
      throw new Error('LaunchDarkly client not created');
    }
    await this.client.waitForInitialization();
  }
}

export const launchDarklyServer = new LaunchDarklyServerService();

// Initialize on module load
launchDarklyServer.initialize({
  sdkKey: process.env.LAUNCHDARKLY_SDK_KEY!,
}).catch(console.error);
```

### Client-Side SDK

```typescript
// src/services/launchdarkly-client.ts
import * as LDClient from '@launchdarkly/js-client-sdk';

interface LaunchDarklyClientConfig {
  clientSideId: string;
  context: LDClient.LDContext;
  options?: LDClient.LDOptions;
  hash?: string; // For secure mode
}

interface FlagChangeCallback {
  (current: any, previous: any): void;
}

class LaunchDarklyClientService {
  private client: LDClient.LDClient | null = null;
  private initialized = false;
  private flagListeners: Map<string, Set<FlagChangeCallback>> = new Map();

  async initialize(config: LaunchDarklyClientConfig): Promise<void> {
    const options: LDClient.LDOptions = {
      hash: config.hash,
      bootstrap: 'localStorage',
      ...config.options,
    };

    this.client = LDClient.initialize(
      config.clientSideId,
      config.context,
      options
    );

    return new Promise((resolve, reject) => {
      this.client!.on('ready', () => {
        this.initialized = true;
        resolve();
      });

      this.client!.on('failed', (error) => {
        reject(error);
      });
    });
  }

  // Get boolean flag
  getBooleanFlag(flagKey: string, defaultValue = false): boolean {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }
    return this.client.variation(flagKey, defaultValue);
  }

  // Get string flag
  getStringFlag(flagKey: string, defaultValue = ''): string {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }
    return this.client.variation(flagKey, defaultValue);
  }

  // Get number flag
  getNumberFlag(flagKey: string, defaultValue = 0): number {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }
    return this.client.variation(flagKey, defaultValue);
  }

  // Get JSON flag
  getJsonFlag<T>(flagKey: string, defaultValue: T): T {
    if (!this.client || !this.initialized) {
      return defaultValue;
    }
    return this.client.variation(flagKey, defaultValue);
  }

  // Get variation detail
  getVariationDetail(flagKey: string, defaultValue: any): LDClient.LDEvaluationDetail {
    if (!this.client || !this.initialized) {
      return {
        value: defaultValue,
        variationIndex: null,
        reason: { kind: 'ERROR', errorKind: 'CLIENT_NOT_READY' },
      };
    }
    return this.client.variationDetail(flagKey, defaultValue);
  }

  // Get all flags
  getAllFlags(): LDClient.LDFlagSet {
    if (!this.client || !this.initialized) {
      return {};
    }
    return this.client.allFlags();
  }

  // Track event
  track(eventKey: string, data?: any, metricValue?: number): void {
    if (!this.client || !this.initialized) {
      return;
    }
    this.client.track(eventKey, data, metricValue);
  }

  // Identify new context
  async identify(context: LDClient.LDContext, hash?: string): Promise<void> {
    if (!this.client) {
      throw new Error('LaunchDarkly client not initialized');
    }
    await this.client.identify(context, hash);
  }

  // Watch flag changes
  onFlagChange(flagKey: string, callback: FlagChangeCallback): () => void {
    if (!this.client) {
      return () => {};
    }

    const listener = (current: any, previous: any) => {
      callback(current, previous);
    };

    this.client.on(`change:${flagKey}`, listener);

    return () => {
      this.client?.off(`change:${flagKey}`, listener);
    };
  }

  // Watch any flag change
  onAnyFlagChange(callback: (changes: Record<string, { current: any; previous: any }>) => void): () => void {
    if (!this.client) {
      return () => {};
    }

    this.client.on('change', callback);

    return () => {
      this.client?.off('change', callback);
    };
  }

  // Flush events
  async flush(): Promise<void> {
    if (!this.client) return;
    await this.client.flush();
  }

  // Close client
  async close(): Promise<void> {
    if (!this.client) return;
    await this.client.close();
  }
}

export const launchDarklyClient = new LaunchDarklyClientService();
```

## Express.js API Routes

```typescript
// src/routes/launchdarkly.ts
import { Router, Request, Response } from 'express';
import { launchDarklyServer } from '../services/launchdarkly-server';

const router = Router();

// Evaluate single flag
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const { flagKey, context, defaultValue } = req.body;

    if (!flagKey || !context) {
      return res.status(400).json({
        error: 'flagKey and context are required'
      });
    }

    const value = await launchDarklyServer.getBooleanFlag(
      flagKey,
      context,
      defaultValue ?? false
    );

    res.json({ flagKey, value });
  } catch (error) {
    console.error('Flag evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate flag' });
  }
});

// Evaluate with detail
router.post('/evaluate/detail', async (req: Request, res: Response) => {
  try {
    const { flagKey, context, defaultValue } = req.body;

    if (!flagKey || !context) {
      return res.status(400).json({
        error: 'flagKey and context are required'
      });
    }

    const detail = await launchDarklyServer.getVariationDetail(
      flagKey,
      context,
      defaultValue
    );

    res.json({ flagKey, ...detail });
  } catch (error) {
    console.error('Flag evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate flag' });
  }
});

// Get all flags for context
router.post('/flags', async (req: Request, res: Response) => {
  try {
    const { context, clientSideOnly } = req.body;

    if (!context) {
      return res.status(400).json({ error: 'context is required' });
    }

    const flags = await launchDarklyServer.getAllFlags(context);

    res.json({
      flags: flags.toJSON(),
      valid: flags.valid,
    });
  } catch (error) {
    console.error('Get flags error:', error);
    res.status(500).json({ error: 'Failed to get flags' });
  }
});

// Track event
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { eventKey, context, data, metricValue } = req.body;

    if (!eventKey || !context) {
      return res.status(400).json({
        error: 'eventKey and context are required'
      });
    }

    launchDarklyServer.track(eventKey, context, data, metricValue);

    res.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Get secure mode hash
router.post('/secure-hash', async (req: Request, res: Response) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({ error: 'context is required' });
    }

    const hash = await launchDarklyServer.secureModeHash(context);

    res.json({ hash });
  } catch (error) {
    console.error('Secure hash error:', error);
    res.status(500).json({ error: 'Failed to generate secure hash' });
  }
});

// Flush events
router.post('/flush', async (req: Request, res: Response) => {
  try {
    await launchDarklyServer.flush();
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
// src/hooks/useLaunchDarkly.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode
} from 'react';
import { launchDarklyClient } from '../services/launchdarkly-client';
import * as LDClient from '@launchdarkly/js-client-sdk';

interface LaunchDarklyContextValue {
  isReady: boolean;
  flags: LDClient.LDFlagSet;
  getBooleanFlag: (key: string, defaultValue?: boolean) => boolean;
  getStringFlag: (key: string, defaultValue?: string) => string;
  getNumberFlag: (key: string, defaultValue?: number) => number;
  getJsonFlag: <T>(key: string, defaultValue: T) => T;
  track: (eventKey: string, data?: any, metricValue?: number) => void;
  identify: (context: LDClient.LDContext) => Promise<void>;
}

const LaunchDarklyContext = createContext<LaunchDarklyContextValue | null>(null);

interface LaunchDarklyProviderProps {
  children: ReactNode;
  clientSideId: string;
  context: LDClient.LDContext;
  options?: LDClient.LDOptions;
}

export function LaunchDarklyProvider({
  children,
  clientSideId,
  context,
  options,
}: LaunchDarklyProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [flags, setFlags] = useState<LDClient.LDFlagSet>({});

  useEffect(() => {
    const init = async () => {
      try {
        await launchDarklyClient.initialize({
          clientSideId,
          context,
          options,
        });

        setFlags(launchDarklyClient.getAllFlags());
        setIsReady(true);

        // Listen for flag changes
        const unsubscribe = launchDarklyClient.onAnyFlagChange((changes) => {
          setFlags(launchDarklyClient.getAllFlags());
        });

        return unsubscribe;
      } catch (error) {
        console.error('LaunchDarkly initialization failed:', error);
      }
    };

    init();

    return () => {
      launchDarklyClient.close();
    };
  }, [clientSideId, context, options]);

  const getBooleanFlag = useCallback((key: string, defaultValue = false) => {
    return launchDarklyClient.getBooleanFlag(key, defaultValue);
  }, []);

  const getStringFlag = useCallback((key: string, defaultValue = '') => {
    return launchDarklyClient.getStringFlag(key, defaultValue);
  }, []);

  const getNumberFlag = useCallback((key: string, defaultValue = 0) => {
    return launchDarklyClient.getNumberFlag(key, defaultValue);
  }, []);

  const getJsonFlag = useCallback(<T,>(key: string, defaultValue: T) => {
    return launchDarklyClient.getJsonFlag(key, defaultValue);
  }, []);

  const track = useCallback((eventKey: string, data?: any, metricValue?: number) => {
    launchDarklyClient.track(eventKey, data, metricValue);
  }, []);

  const identify = useCallback(async (newContext: LDClient.LDContext) => {
    await launchDarklyClient.identify(newContext);
    setFlags(launchDarklyClient.getAllFlags());
  }, []);

  const value = useMemo(() => ({
    isReady,
    flags,
    getBooleanFlag,
    getStringFlag,
    getNumberFlag,
    getJsonFlag,
    track,
    identify,
  }), [isReady, flags, getBooleanFlag, getStringFlag, getNumberFlag, getJsonFlag, track, identify]);

  return (
    <LaunchDarklyContext.Provider value={value}>
      {children}
    </LaunchDarklyContext.Provider>
  );
}

export function useLaunchDarkly(): LaunchDarklyContextValue {
  const context = useContext(LaunchDarklyContext);
  if (!context) {
    throw new Error('useLaunchDarkly must be used within LaunchDarklyProvider');
  }
  return context;
}

// Boolean flag hook
export function useFlag(flagKey: string, defaultValue = false): boolean {
  const { getBooleanFlag, isReady, flags } = useLaunchDarkly();

  // Re-render when flags change
  return useMemo(() => {
    if (!isReady) return defaultValue;
    return getBooleanFlag(flagKey, defaultValue);
  }, [isReady, flags, flagKey, defaultValue, getBooleanFlag]);
}

// String variant hook
export function useVariant(flagKey: string, defaultValue = ''): string {
  const { getStringFlag, isReady, flags } = useLaunchDarkly();

  return useMemo(() => {
    if (!isReady) return defaultValue;
    return getStringFlag(flagKey, defaultValue);
  }, [isReady, flags, flagKey, defaultValue, getStringFlag]);
}

// JSON flag hook
export function useJsonFlag<T>(flagKey: string, defaultValue: T): T {
  const { getJsonFlag, isReady, flags } = useLaunchDarkly();

  return useMemo(() => {
    if (!isReady) return defaultValue;
    return getJsonFlag(flagKey, defaultValue);
  }, [isReady, flags, flagKey, defaultValue, getJsonFlag]);
}

// Flag change listener hook
export function useFlagChange(
  flagKey: string,
  callback: (current: any, previous: any) => void
): void {
  useEffect(() => {
    const unsubscribe = launchDarklyClient.onFlagChange(flagKey, callback);
    return unsubscribe;
  }, [flagKey, callback]);
}
```

### Feature Flag Components

```tsx
// src/components/LaunchDarklyFeature.tsx
import React, { ReactNode, useMemo } from 'react';
import { useFlag, useVariant, useLaunchDarkly } from '../hooks/useLaunchDarkly';

// Feature gate component
interface FeatureProps {
  flagKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Feature({ flagKey, children, fallback = null }: FeatureProps) {
  const isEnabled = useFlag(flagKey, false);
  return <>{isEnabled ? children : fallback}</>;
}

// Variant rendering
interface VariantProps {
  flagKey: string;
  variants: Record<string, ReactNode>;
  defaultVariant?: string;
}

export function Variant({ flagKey, variants, defaultVariant = 'control' }: VariantProps) {
  const variant = useVariant(flagKey, defaultVariant);
  return <>{variants[variant] ?? variants[defaultVariant] ?? null}</>;
}

// A/B Test component with automatic tracking
interface ABTestProps {
  experimentKey: string;
  variants: {
    control: ReactNode;
    treatment: ReactNode;
  };
  trackImpression?: boolean;
}

export function ABTest({
  experimentKey,
  variants,
  trackImpression = true
}: ABTestProps) {
  const { getBooleanFlag, track, isReady } = useLaunchDarkly();

  const isInTreatment = useMemo(() => {
    if (!isReady) return false;
    return getBooleanFlag(experimentKey, false);
  }, [isReady, experimentKey, getBooleanFlag]);

  // Track impression
  React.useEffect(() => {
    if (isReady && trackImpression) {
      track(`${experimentKey}-impression`, {
        variant: isInTreatment ? 'treatment' : 'control',
      });
    }
  }, [isReady, experimentKey, isInTreatment, trackImpression, track]);

  return <>{isInTreatment ? variants.treatment : variants.control}</>;
}

// Multi-variant test
interface MultiVariantTestProps {
  experimentKey: string;
  variants: Record<string, ReactNode>;
  defaultVariant: string;
  trackImpression?: boolean;
}

export function MultiVariantTest({
  experimentKey,
  variants,
  defaultVariant,
  trackImpression = true,
}: MultiVariantTestProps) {
  const { getStringFlag, track, isReady } = useLaunchDarkly();

  const currentVariant = useMemo(() => {
    if (!isReady) return defaultVariant;
    return getStringFlag(experimentKey, defaultVariant);
  }, [isReady, experimentKey, defaultVariant, getStringFlag]);

  React.useEffect(() => {
    if (isReady && trackImpression) {
      track(`${experimentKey}-impression`, { variant: currentVariant });
    }
  }, [isReady, experimentKey, currentVariant, trackImpression, track]);

  return <>{variants[currentVariant] ?? variants[defaultVariant]}</>;
}

// Loading state while flags load
interface FlagsReadyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function FlagsReady({ children, fallback = null }: FlagsReadyProps) {
  const { isReady } = useLaunchDarkly();
  return <>{isReady ? children : fallback}</>;
}
```

## Python Implementation

```python
# launchdarkly_service.py
import ldclient
from ldclient import Context
from ldclient.config import Config
from typing import Dict, Any, Optional, Union
import os

class LaunchDarklyService:
    def __init__(
        self,
        sdk_key: Optional[str] = None,
        offline: bool = False,
        base_uri: Optional[str] = None,
        events_uri: Optional[str] = None,
        stream_uri: Optional[str] = None
    ):
        sdk_key = sdk_key or os.environ.get('LAUNCHDARKLY_SDK_KEY')

        config = Config(
            sdk_key=sdk_key,
            offline=offline,
            base_uri=base_uri,
            events_uri=events_uri,
            stream_uri=stream_uri
        )

        ldclient.set_config(config)
        self.client = ldclient.get()

    def create_context(
        self,
        key: str,
        kind: str = 'user',
        name: Optional[str] = None,
        email: Optional[str] = None,
        anonymous: bool = False,
        custom: Optional[Dict[str, Any]] = None,
        private_attributes: Optional[list] = None
    ) -> Context:
        """Create a user context."""
        builder = Context.builder(key).kind(kind)

        if name:
            builder.name(name)
        if anonymous:
            builder.anonymous(True)
        if custom:
            for k, v in custom.items():
                builder.set(k, v)
        if private_attributes:
            for attr in private_attributes:
                builder.private(attr)

        return builder.build()

    def create_multi_context(
        self,
        contexts: list[Context]
    ) -> Context:
        """Create a multi-context from multiple contexts."""
        builder = Context.multi_builder()
        for ctx in contexts:
            builder.add(ctx)
        return builder.build()

    def get_boolean_flag(
        self,
        flag_key: str,
        context: Context,
        default: bool = False
    ) -> bool:
        """Get boolean flag value."""
        return self.client.variation(flag_key, context, default)

    def get_string_flag(
        self,
        flag_key: str,
        context: Context,
        default: str = ''
    ) -> str:
        """Get string flag value."""
        return self.client.variation(flag_key, context, default)

    def get_number_flag(
        self,
        flag_key: str,
        context: Context,
        default: Union[int, float] = 0
    ) -> Union[int, float]:
        """Get number flag value."""
        return self.client.variation(flag_key, context, default)

    def get_json_flag(
        self,
        flag_key: str,
        context: Context,
        default: Any = None
    ) -> Any:
        """Get JSON flag value."""
        return self.client.variation(flag_key, context, default)

    def get_variation_detail(
        self,
        flag_key: str,
        context: Context,
        default: Any
    ) -> Dict[str, Any]:
        """Get flag variation with evaluation details."""
        detail = self.client.variation_detail(flag_key, context, default)
        return {
            'value': detail.value,
            'variation_index': detail.variation_index,
            'reason': detail.reason
        }

    def get_all_flags(
        self,
        context: Context
    ) -> Dict[str, Any]:
        """Get all flags for a context."""
        state = self.client.all_flags_state(context)
        return state.to_json_dict()

    def track(
        self,
        event_key: str,
        context: Context,
        data: Optional[Any] = None,
        metric_value: Optional[float] = None
    ) -> None:
        """Track a custom event."""
        self.client.track(event_key, context, data, metric_value)

    def identify(self, context: Context) -> None:
        """Identify a context."""
        self.client.identify(context)

    def flush(self) -> None:
        """Flush events to LaunchDarkly."""
        self.client.flush()

    def close(self) -> None:
        """Close the client."""
        self.client.close()

    def is_initialized(self) -> bool:
        """Check if client is initialized."""
        return self.client.is_initialized()


# FastAPI routes
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/launchdarkly", tags=["launchdarkly"])
ld_service = LaunchDarklyService()

class ContextModel(BaseModel):
    key: str
    kind: str = 'user'
    name: Optional[str] = None
    email: Optional[str] = None
    anonymous: bool = False
    custom: Optional[Dict[str, Any]] = None

class EvaluateRequest(BaseModel):
    flag_key: str
    context: ContextModel
    default_value: Any = None

class TrackRequest(BaseModel):
    event_key: str
    context: ContextModel
    data: Optional[Any] = None
    metric_value: Optional[float] = None

def build_context(ctx: ContextModel) -> Context:
    return ld_service.create_context(
        key=ctx.key,
        kind=ctx.kind,
        name=ctx.name,
        anonymous=ctx.anonymous,
        custom=ctx.custom
    )

@router.post("/evaluate")
async def evaluate_flag(request: EvaluateRequest):
    try:
        context = build_context(request.context)
        value = ld_service.client.variation(
            request.flag_key,
            context,
            request.default_value
        )
        return {"flag_key": request.flag_key, "value": value}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate/detail")
async def evaluate_flag_detail(request: EvaluateRequest):
    try:
        context = build_context(request.context)
        detail = ld_service.get_variation_detail(
            request.flag_key,
            context,
            request.default_value
        )
        return {"flag_key": request.flag_key, **detail}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flags")
async def get_all_flags(context: ContextModel):
    try:
        ctx = build_context(context)
        flags = ld_service.get_all_flags(ctx)
        return {"flags": flags}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/track")
async def track_event(request: TrackRequest):
    try:
        context = build_context(request.context)
        ld_service.track(
            request.event_key,
            context,
            request.data,
            request.metric_value
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flush")
async def flush_events():
    try:
        ld_service.flush()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_status():
    return {"initialized": ld_service.is_initialized()}
```

## CLAUDE.md Integration

```markdown
## LaunchDarkly Feature Flags

### Commands
- `ld:flag <key> <context>` - Evaluate feature flag
- `ld:track <event> <context> [data]` - Track custom event
- `ld:flags <context>` - Get all flags for context

### Key Files
- `src/services/launchdarkly-server.ts` - Server SDK
- `src/services/launchdarkly-client.ts` - Client SDK
- `src/hooks/useLaunchDarkly.tsx` - React integration

### Context Best Practices
- Always include `key` for user identification
- Use `kind: 'multi'` for multi-context targeting
- Mark PII with `privateAttributes`
- Use `anonymous: true` for unauthenticated users
```

## AI Suggestions

1. **Targeting Rules**: Create sophisticated targeting rules based on user attributes
2. **Percentage Rollouts**: Implement gradual rollouts with percentage-based targeting
3. **Prerequisites**: Use flag prerequisites for dependent features
4. **Scheduling**: Schedule flag changes for coordinated releases
5. **Experimentation**: Run A/B tests with statistical significance tracking
6. **Segments**: Create reusable user segments for targeting
7. **Audit Log**: Monitor flag changes with the audit log API
8. **Relay Proxy**: Deploy relay proxy for reduced latency
9. **SDK Wrappers**: Create domain-specific wrappers for common patterns
10. **Flag Lifecycle**: Implement flag cleanup workflows for technical debt
