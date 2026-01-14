# Feature Toggles System

Production-ready feature toggle implementation for managing feature releases and configurations.

## Overview

Build a complete feature toggle system with multiple toggle types, targeting rules, and gradual rollouts. This template provides a self-contained feature management solution without external dependencies.

## Quick Start

```bash
npm install uuid murmurhash redis
```

## TypeScript Implementation

### Feature Toggle Service

```typescript
// src/services/toggles/toggle-service.ts
import { v4 as uuidv4 } from 'uuid';
import murmurhash from 'murmurhash';
import { Redis } from 'ioredis';

// Toggle types
type ToggleType =
  | 'release'      // Simple on/off for releases
  | 'experiment'   // A/B testing toggles
  | 'ops'          // Operational toggles (kill switches)
  | 'permission'   // Feature permissions
  | 'config';      // Configuration toggles

interface Toggle {
  id: string;
  key: string;
  name: string;
  description?: string;
  type: ToggleType;
  enabled: boolean;
  strategies: Strategy[];
  variants?: Variant[];
  defaultVariant?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

interface Strategy {
  id: string;
  name: string;
  parameters: Record<string, any>;
  constraints?: Constraint[];
}

interface Constraint {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'regex' | 'semver_gt' | 'semver_lt';
  value: any;
}

interface Variant {
  name: string;
  weight: number;
  payload?: {
    type: 'string' | 'number' | 'boolean' | 'json';
    value: string;
  };
}

interface EvaluationContext {
  userId?: string;
  sessionId?: string;
  remoteAddress?: string;
  environment?: string;
  appVersion?: string;
  properties?: Record<string, any>;
}

interface EvaluationResult {
  enabled: boolean;
  variant?: string;
  payload?: any;
  reason: string;
}

// Built-in strategies
const STRATEGIES = {
  default: () => true,

  userWithId: (params: { userIds: string[] }, context: EvaluationContext) => {
    return params.userIds.includes(context.userId || '');
  },

  gradualRollout: (params: { percentage: number; groupId?: string }, context: EvaluationContext) => {
    const id = context.userId || context.sessionId || '';
    const group = params.groupId || 'default';
    const hash = murmurhash.v3(`${group}:${id}`);
    return (hash % 100) < params.percentage;
  },

  remoteAddress: (params: { ips: string[] }, context: EvaluationContext) => {
    return params.ips.includes(context.remoteAddress || '');
  },

  environment: (params: { environments: string[] }, context: EvaluationContext) => {
    return params.environments.includes(context.environment || '');
  },

  appVersion: (params: { minVersion?: string; maxVersion?: string }, context: EvaluationContext) => {
    const version = context.appVersion;
    if (!version) return false;

    const compare = (v1: string, v2: string): number => {
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);

      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 !== p2) return p1 - p2;
      }
      return 0;
    };

    if (params.minVersion && compare(version, params.minVersion) < 0) return false;
    if (params.maxVersion && compare(version, params.maxVersion) > 0) return false;
    return true;
  },

  dateTime: (params: { start?: string; end?: string }, context: EvaluationContext) => {
    const now = new Date();
    if (params.start && new Date(params.start) > now) return false;
    if (params.end && new Date(params.end) < now) return false;
    return true;
  },

  property: (params: { property: string; values: any[] }, context: EvaluationContext) => {
    const value = context.properties?.[params.property];
    return params.values.includes(value);
  },
};

class ToggleService {
  private redis: Redis;
  private toggles: Map<string, Toggle> = new Map();
  private refreshInterval?: NodeJS.Timeout;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.loadToggles();
  }

  // Load all toggles from storage
  private async loadToggles(): Promise<void> {
    const keys = await this.redis.keys('toggle:*');

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const toggle = JSON.parse(data) as Toggle;
        this.toggles.set(toggle.key, toggle);
      }
    }
  }

  // Start periodic refresh
  startRefresh(intervalMs = 30000): void {
    this.refreshInterval = setInterval(() => {
      this.loadToggles();
    }, intervalMs);
  }

  // Stop refresh
  stopRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  // Create toggle
  async createToggle(
    key: string,
    name: string,
    type: ToggleType,
    options?: {
      description?: string;
      enabled?: boolean;
      strategies?: Omit<Strategy, 'id'>[];
      variants?: Variant[];
      defaultVariant?: string;
      tags?: string[];
      metadata?: Record<string, any>;
      expiresAt?: Date;
    }
  ): Promise<Toggle> {
    if (this.toggles.has(key)) {
      throw new Error(`Toggle with key "${key}" already exists`);
    }

    const toggle: Toggle = {
      id: uuidv4(),
      key,
      name,
      type,
      description: options?.description,
      enabled: options?.enabled ?? false,
      strategies: (options?.strategies || []).map(s => ({ ...s, id: uuidv4() })),
      variants: options?.variants,
      defaultVariant: options?.defaultVariant,
      tags: options?.tags,
      metadata: options?.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: options?.expiresAt,
    };

    // Validate variants
    if (toggle.variants?.length) {
      const totalWeight = toggle.variants.reduce((sum, v) => sum + v.weight, 0);
      if (totalWeight !== 100) {
        throw new Error('Variant weights must sum to 100');
      }
    }

    await this.saveToggle(toggle);
    return toggle;
  }

  // Save toggle
  private async saveToggle(toggle: Toggle): Promise<void> {
    toggle.updatedAt = new Date();
    await this.redis.set(`toggle:${toggle.key}`, JSON.stringify(toggle));
    this.toggles.set(toggle.key, toggle);
  }

  // Update toggle
  async updateToggle(
    key: string,
    updates: Partial<Omit<Toggle, 'id' | 'key' | 'createdAt' | 'updatedAt'>>
  ): Promise<Toggle> {
    const toggle = this.toggles.get(key);
    if (!toggle) {
      throw new Error(`Toggle "${key}" not found`);
    }

    const updated = { ...toggle, ...updates };
    await this.saveToggle(updated);
    return updated;
  }

  // Delete toggle
  async deleteToggle(key: string): Promise<void> {
    await this.redis.del(`toggle:${key}`);
    this.toggles.delete(key);
  }

  // Get toggle
  getToggle(key: string): Toggle | undefined {
    return this.toggles.get(key);
  }

  // Get all toggles
  getAllToggles(): Toggle[] {
    return Array.from(this.toggles.values());
  }

  // Get toggles by type
  getTogglesByType(type: ToggleType): Toggle[] {
    return this.getAllToggles().filter(t => t.type === type);
  }

  // Get toggles by tag
  getTogglesByTag(tag: string): Toggle[] {
    return this.getAllToggles().filter(t => t.tags?.includes(tag));
  }

  // Evaluate toggle
  evaluate(key: string, context: EvaluationContext = {}): EvaluationResult {
    const toggle = this.toggles.get(key);

    if (!toggle) {
      return { enabled: false, reason: 'Toggle not found' };
    }

    // Check if expired
    if (toggle.expiresAt && new Date(toggle.expiresAt) < new Date()) {
      return { enabled: false, reason: 'Toggle expired' };
    }

    // Check if disabled
    if (!toggle.enabled) {
      return { enabled: false, reason: 'Toggle disabled' };
    }

    // No strategies means enabled for all
    if (!toggle.strategies.length) {
      return this.selectVariant(toggle, context, 'No strategies, enabled by default');
    }

    // Evaluate strategies (any match = enabled)
    for (const strategy of toggle.strategies) {
      if (this.evaluateStrategy(strategy, context)) {
        return this.selectVariant(toggle, context, `Strategy matched: ${strategy.name}`);
      }
    }

    return { enabled: false, reason: 'No strategy matched' };
  }

  // Evaluate strategy
  private evaluateStrategy(strategy: Strategy, context: EvaluationContext): boolean {
    // Check constraints first
    if (strategy.constraints?.length) {
      const constraintsMet = strategy.constraints.every(c =>
        this.evaluateConstraint(c, context)
      );
      if (!constraintsMet) return false;
    }

    // Evaluate strategy
    const strategyFn = STRATEGIES[strategy.name as keyof typeof STRATEGIES];
    if (!strategyFn) {
      console.warn(`Unknown strategy: ${strategy.name}`);
      return false;
    }

    return strategyFn(strategy.parameters, context);
  }

  // Evaluate constraint
  private evaluateConstraint(constraint: Constraint, context: EvaluationContext): boolean {
    const value = context.properties?.[constraint.field] ?? (context as any)[constraint.field];

    switch (constraint.operator) {
      case 'eq':
        return value === constraint.value;
      case 'neq':
        return value !== constraint.value;
      case 'gt':
        return value > constraint.value;
      case 'gte':
        return value >= constraint.value;
      case 'lt':
        return value < constraint.value;
      case 'lte':
        return value <= constraint.value;
      case 'in':
        return Array.isArray(constraint.value) && constraint.value.includes(value);
      case 'nin':
        return Array.isArray(constraint.value) && !constraint.value.includes(value);
      case 'regex':
        return new RegExp(constraint.value).test(String(value));
      default:
        return false;
    }
  }

  // Select variant
  private selectVariant(
    toggle: Toggle,
    context: EvaluationContext,
    reason: string
  ): EvaluationResult {
    if (!toggle.variants?.length) {
      return { enabled: true, reason };
    }

    // Consistent variant selection based on user/session
    const id = context.userId || context.sessionId || uuidv4();
    const hash = murmurhash.v3(`${toggle.key}:${id}`);
    const normalizedHash = hash % 100;

    let cumulative = 0;
    for (const variant of toggle.variants) {
      cumulative += variant.weight;
      if (normalizedHash < cumulative) {
        return {
          enabled: true,
          variant: variant.name,
          payload: variant.payload ? this.parsePayload(variant.payload) : undefined,
          reason: `${reason}, variant: ${variant.name}`,
        };
      }
    }

    // Fallback to default variant
    const defaultVariant = toggle.variants.find(v => v.name === toggle.defaultVariant);
    return {
      enabled: true,
      variant: defaultVariant?.name || toggle.variants[0].name,
      payload: defaultVariant?.payload ? this.parsePayload(defaultVariant.payload) : undefined,
      reason: `${reason}, fallback variant`,
    };
  }

  // Parse variant payload
  private parsePayload(payload: { type: string; value: string }): any {
    switch (payload.type) {
      case 'number':
        return Number(payload.value);
      case 'boolean':
        return payload.value === 'true';
      case 'json':
        return JSON.parse(payload.value);
      default:
        return payload.value;
    }
  }

  // Bulk evaluate toggles
  evaluateAll(context: EvaluationContext = {}): Record<string, EvaluationResult> {
    const results: Record<string, EvaluationResult> = {};

    for (const [key] of this.toggles) {
      results[key] = this.evaluate(key, context);
    }

    return results;
  }

  // Check if feature is enabled (simple boolean)
  isEnabled(key: string, context: EvaluationContext = {}): boolean {
    return this.evaluate(key, context).enabled;
  }

  // Get variant name
  getVariant(key: string, context: EvaluationContext = {}): string | null {
    const result = this.evaluate(key, context);
    return result.variant || null;
  }

  // Get payload
  getPayload<T>(key: string, context: EvaluationContext = {}): T | null {
    const result = this.evaluate(key, context);
    return result.payload || null;
  }
}

export const toggleService = new ToggleService(
  process.env.REDIS_URL || 'redis://localhost:6379'
);
```

### Toggle Admin Service

```typescript
// src/services/toggles/toggle-admin.ts
import { toggleService } from './toggle-service';

interface ToggleAuditEntry {
  toggleKey: string;
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable';
  changes?: Record<string, { before: any; after: any }>;
  performedBy: string;
  performedAt: Date;
}

interface ToggleMetrics {
  toggleKey: string;
  evaluations: number;
  enabledCount: number;
  disabledCount: number;
  variantCounts?: Record<string, number>;
  lastEvaluated?: Date;
}

class ToggleAdminService {
  private auditLog: ToggleAuditEntry[] = [];

  // Enable toggle
  async enableToggle(key: string, performedBy: string): Promise<void> {
    await toggleService.updateToggle(key, { enabled: true });
    this.logAudit(key, 'enable', performedBy);
  }

  // Disable toggle
  async disableToggle(key: string, performedBy: string): Promise<void> {
    await toggleService.updateToggle(key, { enabled: false });
    this.logAudit(key, 'disable', performedBy);
  }

  // Clone toggle
  async cloneToggle(
    sourceKey: string,
    newKey: string,
    newName: string,
    performedBy: string
  ): Promise<void> {
    const source = toggleService.getToggle(sourceKey);
    if (!source) {
      throw new Error(`Source toggle "${sourceKey}" not found`);
    }

    await toggleService.createToggle(newKey, newName, source.type, {
      description: source.description,
      enabled: false, // Start disabled
      strategies: source.strategies.map(s => ({
        name: s.name,
        parameters: { ...s.parameters },
        constraints: s.constraints?.map(c => ({ ...c })),
      })),
      variants: source.variants?.map(v => ({ ...v })),
      defaultVariant: source.defaultVariant,
      tags: source.tags,
      metadata: source.metadata,
    });

    this.logAudit(newKey, 'create', performedBy, {
      clonedFrom: { before: null, after: sourceKey },
    });
  }

  // Batch enable/disable
  async batchUpdateEnabled(
    keys: string[],
    enabled: boolean,
    performedBy: string
  ): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const key of keys) {
      try {
        await toggleService.updateToggle(key, { enabled });
        this.logAudit(key, enabled ? 'enable' : 'disable', performedBy);
        success.push(key);
      } catch {
        failed.push(key);
      }
    }

    return { success, failed };
  }

  // Update rollout percentage
  async updateRolloutPercentage(
    key: string,
    percentage: number,
    performedBy: string
  ): Promise<void> {
    const toggle = toggleService.getToggle(key);
    if (!toggle) {
      throw new Error(`Toggle "${key}" not found`);
    }

    const strategies = toggle.strategies.map(s => {
      if (s.name === 'gradualRollout') {
        return {
          ...s,
          parameters: { ...s.parameters, percentage },
        };
      }
      return s;
    });

    await toggleService.updateToggle(key, { strategies });
    this.logAudit(key, 'update', performedBy, {
      percentage: { before: toggle.strategies.find(s => s.name === 'gradualRollout')?.parameters.percentage, after: percentage },
    });
  }

  // Schedule toggle
  async scheduleToggle(
    key: string,
    action: 'enable' | 'disable',
    scheduledFor: Date,
    performedBy: string
  ): Promise<void> {
    // In production, this would use a job scheduler
    const delay = scheduledFor.getTime() - Date.now();

    if (delay > 0) {
      setTimeout(async () => {
        if (action === 'enable') {
          await this.enableToggle(key, performedBy);
        } else {
          await this.disableToggle(key, performedBy);
        }
      }, delay);
    }
  }

  // Get audit log
  getAuditLog(key?: string): ToggleAuditEntry[] {
    if (key) {
      return this.auditLog.filter(e => e.toggleKey === key);
    }
    return [...this.auditLog];
  }

  // Log audit entry
  private logAudit(
    toggleKey: string,
    action: ToggleAuditEntry['action'],
    performedBy: string,
    changes?: ToggleAuditEntry['changes']
  ): void {
    this.auditLog.push({
      toggleKey,
      action,
      changes,
      performedBy,
      performedAt: new Date(),
    });

    // Keep last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  // Get toggle summary
  getToggleSummary(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
    expiringSoon: string[];
  } {
    const toggles = toggleService.getAllToggles();
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      total: toggles.length,
      enabled: toggles.filter(t => t.enabled).length,
      disabled: toggles.filter(t => !t.enabled).length,
      byType: toggles.reduce((acc, t) => {
        acc[t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      expiringSoon: toggles
        .filter(t => t.expiresAt && new Date(t.expiresAt) < weekFromNow)
        .map(t => t.key),
    };
  }
}

export const toggleAdminService = new ToggleAdminService();
```

## Express.js API Routes

```typescript
// src/routes/toggles.ts
import { Router, Request, Response } from 'express';
import { toggleService } from '../services/toggles/toggle-service';
import { toggleAdminService } from '../services/toggles/toggle-admin';

const router = Router();

// Evaluate toggle
router.post('/evaluate/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const context = req.body;

    const result = toggleService.evaluate(key, {
      ...context,
      remoteAddress: req.ip,
    });

    res.json(result);
  } catch (error) {
    console.error('Evaluate error:', error);
    res.status(500).json({ error: 'Failed to evaluate toggle' });
  }
});

// Evaluate all toggles
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const context = req.body;

    const results = toggleService.evaluateAll({
      ...context,
      remoteAddress: req.ip,
    });

    res.json({ toggles: results });
  } catch (error) {
    console.error('Evaluate all error:', error);
    res.status(500).json({ error: 'Failed to evaluate toggles' });
  }
});

// Get all toggles
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, tag } = req.query;

    let toggles = toggleService.getAllToggles();

    if (type) {
      toggles = toggles.filter(t => t.type === type);
    }

    if (tag) {
      toggles = toggles.filter(t => t.tags?.includes(tag as string));
    }

    res.json({ toggles });
  } catch (error) {
    console.error('Get toggles error:', error);
    res.status(500).json({ error: 'Failed to get toggles' });
  }
});

// Get toggle
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const toggle = toggleService.getToggle(req.params.key);

    if (!toggle) {
      return res.status(404).json({ error: 'Toggle not found' });
    }

    res.json({ toggle });
  } catch (error) {
    console.error('Get toggle error:', error);
    res.status(500).json({ error: 'Failed to get toggle' });
  }
});

// Create toggle
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      key, name, type, description, enabled,
      strategies, variants, defaultVariant, tags, metadata,
    } = req.body;

    if (!key || !name || !type) {
      return res.status(400).json({ error: 'key, name, and type are required' });
    }

    const toggle = await toggleService.createToggle(key, name, type, {
      description,
      enabled,
      strategies,
      variants,
      defaultVariant,
      tags,
      metadata,
    });

    res.json({ toggle });
  } catch (error: any) {
    console.error('Create toggle error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update toggle
router.put('/:key', async (req: Request, res: Response) => {
  try {
    const toggle = await toggleService.updateToggle(req.params.key, req.body);
    res.json({ toggle });
  } catch (error: any) {
    console.error('Update toggle error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete toggle
router.delete('/:key', async (req: Request, res: Response) => {
  try {
    await toggleService.deleteToggle(req.params.key);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete toggle error:', error);
    res.status(500).json({ error: 'Failed to delete toggle' });
  }
});

// Enable toggle
router.post('/:key/enable', async (req: Request, res: Response) => {
  try {
    const { performedBy } = req.body;
    await toggleAdminService.enableToggle(req.params.key, performedBy || 'system');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Enable toggle error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Disable toggle
router.post('/:key/disable', async (req: Request, res: Response) => {
  try {
    const { performedBy } = req.body;
    await toggleAdminService.disableToggle(req.params.key, performedBy || 'system');
    res.json({ success: true });
  } catch (error: any) {
    console.error('Disable toggle error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get audit log
router.get('/:key/audit', async (req: Request, res: Response) => {
  try {
    const auditLog = toggleAdminService.getAuditLog(req.params.key);
    res.json({ auditLog });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to get audit log' });
  }
});

// Get summary
router.get('/admin/summary', async (req: Request, res: Response) => {
  try {
    const summary = toggleAdminService.getToggleSummary();
    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

export default router;
```

## React Integration

```typescript
// src/hooks/useToggle.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';

interface EvaluationResult {
  enabled: boolean;
  variant?: string;
  payload?: any;
}

interface ToggleContextValue {
  isLoaded: boolean;
  isEnabled: (key: string) => boolean;
  getVariant: (key: string) => string | null;
  getPayload: <T>(key: string) => T | null;
  refresh: () => Promise<void>;
  toggles: Record<string, EvaluationResult>;
}

const ToggleContext = createContext<ToggleContextValue | null>(null);

interface ToggleProviderProps {
  children: ReactNode;
  apiEndpoint: string;
  context?: Record<string, any>;
  refreshInterval?: number;
}

export function ToggleProvider({
  children,
  apiEndpoint,
  context = {},
  refreshInterval,
}: ToggleProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [toggles, setToggles] = useState<Record<string, EvaluationResult>>({});

  const fetchToggles = useCallback(async () => {
    try {
      const response = await fetch(`${apiEndpoint}/toggles/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      const data = await response.json();
      setToggles(data.toggles);
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch toggles:', error);
      setIsLoaded(true);
    }
  }, [apiEndpoint, context]);

  useEffect(() => {
    fetchToggles();

    if (refreshInterval) {
      const interval = setInterval(fetchToggles, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchToggles, refreshInterval]);

  const isEnabled = useCallback((key: string): boolean => {
    return toggles[key]?.enabled ?? false;
  }, [toggles]);

  const getVariant = useCallback((key: string): string | null => {
    return toggles[key]?.variant ?? null;
  }, [toggles]);

  const getPayload = useCallback(<T,>(key: string): T | null => {
    return toggles[key]?.payload ?? null;
  }, [toggles]);

  const value = useMemo(() => ({
    isLoaded,
    isEnabled,
    getVariant,
    getPayload,
    refresh: fetchToggles,
    toggles,
  }), [isLoaded, isEnabled, getVariant, getPayload, fetchToggles, toggles]);

  return (
    <ToggleContext.Provider value={value}>
      {children}
    </ToggleContext.Provider>
  );
}

export function useToggles(): ToggleContextValue {
  const context = useContext(ToggleContext);
  if (!context) {
    throw new Error('useToggles must be used within ToggleProvider');
  }
  return context;
}

// Hook for single toggle
export function useToggle(key: string): {
  enabled: boolean;
  variant: string | null;
  payload: any;
  isLoaded: boolean;
} {
  const { isEnabled, getVariant, getPayload, isLoaded } = useToggles();

  return useMemo(() => ({
    enabled: isEnabled(key),
    variant: getVariant(key),
    payload: getPayload(key),
    isLoaded,
  }), [isEnabled, getVariant, getPayload, isLoaded, key]);
}

// Boolean feature hook
export function useFeature(key: string, defaultValue = false): boolean {
  const { enabled, isLoaded } = useToggle(key);

  if (!isLoaded) return defaultValue;
  return enabled;
}

// Variant hook
export function useVariant<T extends string>(
  key: string,
  defaultVariant: T
): T {
  const { variant, isLoaded } = useToggle(key);

  if (!isLoaded || !variant) return defaultVariant;
  return variant as T;
}

// Payload hook
export function usePayload<T>(key: string, defaultPayload: T): T {
  const { payload, isLoaded } = useToggle(key);

  if (!isLoaded || payload === null) return defaultPayload;
  return payload;
}
```

### Toggle Components

```tsx
// src/components/Toggle.tsx
import React, { ReactNode } from 'react';
import { useFeature, useVariant, usePayload, useToggles } from '../hooks/useToggle';

// Feature gate
interface FeatureProps {
  toggleKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Feature({ toggleKey, children, fallback = null }: FeatureProps) {
  const enabled = useFeature(toggleKey);
  return <>{enabled ? children : fallback}</>;
}

// Variant renderer
interface VariantProps {
  toggleKey: string;
  variants: Record<string, ReactNode>;
  defaultVariant?: string;
}

export function Variant({ toggleKey, variants, defaultVariant = 'control' }: VariantProps) {
  const variant = useVariant(toggleKey, defaultVariant);
  return <>{variants[variant] || variants[defaultVariant] || null}</>;
}

// Config-driven component
interface ConfigProps<T> {
  toggleKey: string;
  defaultConfig: T;
  render: (config: T) => ReactNode;
}

export function Config<T>({ toggleKey, defaultConfig, render }: ConfigProps<T>) {
  const config = usePayload<T>(toggleKey, defaultConfig);
  return <>{render(config)}</>;
}

// Loading wrapper
interface TogglesReadyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function TogglesReady({ children, fallback = null }: TogglesReadyProps) {
  const { isLoaded } = useToggles();
  return <>{isLoaded ? children : fallback}</>;
}

// Multi-toggle gate
interface MultiFeatureProps {
  toggleKeys: string[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function MultiFeature({
  toggleKeys,
  requireAll = true,
  children,
  fallback = null,
}: MultiFeatureProps) {
  const { isEnabled, isLoaded } = useToggles();

  if (!isLoaded) return <>{fallback}</>;

  const enabled = requireAll
    ? toggleKeys.every(key => isEnabled(key))
    : toggleKeys.some(key => isEnabled(key));

  return <>{enabled ? children : fallback}</>;
}
```

## CLAUDE.md Integration

```markdown
## Feature Toggles

### Commands
- `toggle:create <key> <name> <type>` - Create toggle
- `toggle:enable <key>` - Enable toggle
- `toggle:disable <key>` - Disable toggle
- `toggle:evaluate <key> [context]` - Evaluate toggle
- `toggle:list` - List all toggles

### Key Files
- `src/services/toggles/toggle-service.ts` - Core service
- `src/services/toggles/toggle-admin.ts` - Admin operations
- `src/hooks/useToggle.tsx` - React hooks

### Toggle Types
- `release` - Feature releases (temporary)
- `experiment` - A/B tests
- `ops` - Kill switches
- `permission` - User permissions
- `config` - Dynamic configuration

### Strategies
- `default` - Always enabled
- `userWithId` - Specific user IDs
- `gradualRollout` - Percentage rollout
- `environment` - By environment
- `appVersion` - By app version
- `dateTime` - Time-based activation
```

## AI Suggestions

1. **Tech Debt Tracking**: Flag old toggles for removal
2. **Dependencies**: Track toggle dependencies to prevent conflicts
3. **Metrics**: Add evaluation metrics for observability
4. **Kill Switch**: Implement emergency kill switches for critical features
5. **Segmentation**: Create reusable user segments for targeting
6. **Scheduling**: Schedule toggle changes for releases
7. **Rollback**: One-click rollback for failed releases
8. **SDK**: Create lightweight client SDKs for various platforms
9. **Webhooks**: Notify external systems on toggle changes
10. **Documentation**: Auto-generate toggle documentation
