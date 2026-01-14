# A/B Testing Framework

Production-ready A/B testing implementation for running experiments and measuring impact.

## Overview

Build a complete A/B testing framework with experiment management, user assignment, statistical analysis, and results tracking. This template provides everything needed for data-driven experimentation.

## Quick Start

```bash
npm install uuid murmurhash redis @clickhouse/client
```

## TypeScript Implementation

### Experiment Service

```typescript
// src/services/experiments/experiment-service.ts
import { v4 as uuidv4 } from 'uuid';
import murmurhash from 'murmurhash';
import { Redis } from 'ioredis';

interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Variant[];
  targetingRules?: TargetingRule[];
  metrics: Metric[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100
  isControl: boolean;
  config?: Record<string, any>;
}

interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in' | 'not_in' | 'regex';
  value: any;
}

interface Metric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'count' | 'duration';
  eventName: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'unique';
}

interface UserContext {
  userId?: string;
  anonymousId: string;
  attributes?: Record<string, any>;
}

interface Assignment {
  experimentId: string;
  variantId: string;
  variantName: string;
  timestamp: Date;
}

class ExperimentService {
  private redis: Redis;
  private experiments: Map<string, Experiment> = new Map();

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.loadExperiments();
  }

  // Load experiments from storage
  private async loadExperiments(): Promise<void> {
    const keys = await this.redis.keys('experiment:*');

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const experiment = JSON.parse(data) as Experiment;
        this.experiments.set(experiment.id, experiment);
      }
    }
  }

  // Create experiment
  async createExperiment(
    name: string,
    variants: Omit<Variant, 'id'>[],
    options?: {
      description?: string;
      targetingRules?: TargetingRule[];
      metrics?: Omit<Metric, 'id'>[];
    }
  ): Promise<Experiment> {
    const experiment: Experiment = {
      id: uuidv4(),
      name,
      description: options?.description,
      status: 'draft',
      variants: variants.map(v => ({ ...v, id: uuidv4() })),
      targetingRules: options?.targetingRules,
      metrics: (options?.metrics || []).map(m => ({ ...m, id: uuidv4() })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate weights sum to 100
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error('Variant weights must sum to 100');
    }

    // Ensure one control variant
    const controlCount = experiment.variants.filter(v => v.isControl).length;
    if (controlCount !== 1) {
      throw new Error('Exactly one variant must be marked as control');
    }

    await this.saveExperiment(experiment);
    return experiment;
  }

  // Save experiment
  private async saveExperiment(experiment: Experiment): Promise<void> {
    experiment.updatedAt = new Date();
    await this.redis.set(`experiment:${experiment.id}`, JSON.stringify(experiment));
    this.experiments.set(experiment.id, experiment);
  }

  // Get experiment
  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  // Get all experiments
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  // Start experiment
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'running';
    experiment.startDate = new Date();
    await this.saveExperiment(experiment);
  }

  // Pause experiment
  async pauseExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'paused';
    await this.saveExperiment(experiment);
  }

  // Complete experiment
  async completeExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.status = 'completed';
    experiment.endDate = new Date();
    await this.saveExperiment(experiment);
  }

  // Assign user to variant
  async assignVariant(
    experimentId: string,
    context: UserContext
  ): Promise<Assignment | null> {
    const experiment = this.experiments.get(experimentId);

    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check targeting rules
    if (!this.matchesTargeting(experiment, context)) {
      return null;
    }

    // Check for existing assignment
    const userKey = context.userId || context.anonymousId;
    const existingAssignment = await this.redis.hget(
      `assignments:${experimentId}`,
      userKey
    );

    if (existingAssignment) {
      return JSON.parse(existingAssignment);
    }

    // Assign new variant
    const variant = this.selectVariant(experiment, userKey);
    const assignment: Assignment = {
      experimentId,
      variantId: variant.id,
      variantName: variant.name,
      timestamp: new Date(),
    };

    await this.redis.hset(
      `assignments:${experimentId}`,
      userKey,
      JSON.stringify(assignment)
    );

    // Track exposure
    await this.trackExposure(experimentId, variant.id, context);

    return assignment;
  }

  // Select variant based on user key
  private selectVariant(experiment: Experiment, userKey: string): Variant {
    // Use consistent hashing for deterministic assignment
    const hash = murmurhash.v3(`${experiment.id}:${userKey}`);
    const normalizedHash = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (normalizedHash < cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to control
    return experiment.variants.find(v => v.isControl)!;
  }

  // Check if user matches targeting rules
  private matchesTargeting(experiment: Experiment, context: UserContext): boolean {
    if (!experiment.targetingRules?.length) {
      return true;
    }

    return experiment.targetingRules.every(rule => {
      const value = context.attributes?.[rule.attribute];
      return this.evaluateRule(rule, value);
    });
  }

  // Evaluate single targeting rule
  private evaluateRule(rule: TargetingRule, value: any): boolean {
    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'contains':
        return String(value).includes(rule.value);
      case 'gt':
        return value > rule.value;
      case 'lt':
        return value < rule.value;
      case 'in':
        return Array.isArray(rule.value) && rule.value.includes(value);
      case 'not_in':
        return Array.isArray(rule.value) && !rule.value.includes(value);
      case 'regex':
        return new RegExp(rule.value).test(String(value));
      default:
        return true;
    }
  }

  // Track exposure
  private async trackExposure(
    experimentId: string,
    variantId: string,
    context: UserContext
  ): Promise<void> {
    const date = new Date().toISOString().split('T')[0];

    await this.redis.hincrby(`exposures:${experimentId}:${date}`, variantId, 1);
    await this.redis.pfadd(
      `exposures:${experimentId}:${variantId}:users`,
      context.userId || context.anonymousId
    );
  }

  // Get user's variant for experiment
  async getUserVariant(
    experimentId: string,
    context: UserContext
  ): Promise<Assignment | null> {
    const userKey = context.userId || context.anonymousId;
    const assignment = await this.redis.hget(`assignments:${experimentId}`, userKey);

    return assignment ? JSON.parse(assignment) : null;
  }

  // Get all user's experiments
  async getUserExperiments(context: UserContext): Promise<Assignment[]> {
    const assignments: Assignment[] = [];
    const userKey = context.userId || context.anonymousId;

    for (const experiment of this.experiments.values()) {
      if (experiment.status !== 'running') continue;

      const assignment = await this.assignVariant(experiment.id, context);
      if (assignment) {
        assignments.push(assignment);
      }
    }

    return assignments;
  }
}

export const experimentService = new ExperimentService(
  process.env.REDIS_URL || 'redis://localhost:6379'
);
```

### Results Analysis Service

```typescript
// src/services/experiments/results-service.ts
import { createClient, ClickHouseClient } from '@clickhouse/client';
import { Redis } from 'ioredis';

interface ExperimentResults {
  experimentId: string;
  variants: VariantResults[];
  totalParticipants: number;
  duration: {
    start: Date;
    end: Date;
    days: number;
  };
}

interface VariantResults {
  variantId: string;
  variantName: string;
  isControl: boolean;
  participants: number;
  metrics: MetricResults[];
}

interface MetricResults {
  metricId: string;
  metricName: string;
  value: number;
  conversionRate?: number;
  improvement?: number;
  confidence?: number;
  significant?: boolean;
}

interface ConversionData {
  variantId: string;
  conversions: number;
  participants: number;
}

class ResultsService {
  private clickhouse: ClickHouseClient;
  private redis: Redis;

  constructor(clickhouseUrl: string, redisUrl: string) {
    this.clickhouse = createClient({ host: clickhouseUrl });
    this.redis = new Redis(redisUrl);
  }

  // Initialize schema
  async initializeSchema(): Promise<void> {
    await this.clickhouse.command({
      query: `
        CREATE TABLE IF NOT EXISTS experiment_events (
          experiment_id String,
          variant_id String,
          user_id String,
          event_type LowCardinality(String),
          event_name String,
          event_value Float64,
          timestamp DateTime64(3),
          date Date MATERIALIZED toDate(timestamp)
        )
        ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (experiment_id, variant_id, timestamp)
      `,
    });
  }

  // Track conversion event
  async trackConversion(
    experimentId: string,
    variantId: string,
    userId: string,
    eventName: string,
    value?: number
  ): Promise<void> {
    await this.clickhouse.insert({
      table: 'experiment_events',
      values: [{
        experiment_id: experimentId,
        variant_id: variantId,
        user_id: userId,
        event_type: 'conversion',
        event_name: eventName,
        event_value: value || 1,
        timestamp: new Date().toISOString(),
      }],
      format: 'JSONEachRow',
    });
  }

  // Get experiment results
  async getResults(
    experimentId: string,
    variants: Array<{ id: string; name: string; isControl: boolean }>,
    metricName: string
  ): Promise<ExperimentResults> {
    // Get participant counts
    const participantCounts = await this.getParticipantCounts(experimentId, variants);

    // Get conversion data
    const conversionData = await this.getConversionData(experimentId, metricName);

    // Calculate results for each variant
    const variantResults: VariantResults[] = [];
    const controlData = conversionData.find(d =>
      variants.find(v => v.id === d.variantId)?.isControl
    );

    for (const variant of variants) {
      const data = conversionData.find(d => d.variantId === variant.id);
      const participants = participantCounts.get(variant.id) || 0;

      const conversionRate = participants > 0
        ? (data?.conversions || 0) / participants
        : 0;

      let improvement: number | undefined;
      let confidence: number | undefined;
      let significant: boolean | undefined;

      if (!variant.isControl && controlData) {
        const controlRate = controlData.participants > 0
          ? controlData.conversions / controlData.participants
          : 0;

        if (controlRate > 0) {
          improvement = ((conversionRate - controlRate) / controlRate) * 100;
        }

        // Calculate statistical significance
        const stats = this.calculateSignificance(
          data?.conversions || 0,
          participants,
          controlData.conversions,
          controlData.participants
        );

        confidence = stats.confidence;
        significant = stats.significant;
      }

      variantResults.push({
        variantId: variant.id,
        variantName: variant.name,
        isControl: variant.isControl,
        participants,
        metrics: [{
          metricId: metricName,
          metricName,
          value: data?.conversions || 0,
          conversionRate: conversionRate * 100,
          improvement,
          confidence,
          significant,
        }],
      });
    }

    const totalParticipants = variantResults.reduce((sum, v) => sum + v.participants, 0);

    return {
      experimentId,
      variants: variantResults,
      totalParticipants,
      duration: {
        start: new Date(), // Would come from experiment
        end: new Date(),
        days: 0,
      },
    };
  }

  // Get participant counts per variant
  private async getParticipantCounts(
    experimentId: string,
    variants: Array<{ id: string }>
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    for (const variant of variants) {
      const count = await this.redis.pfcount(
        `exposures:${experimentId}:${variant.id}:users`
      );
      counts.set(variant.id, count);
    }

    return counts;
  }

  // Get conversion data from ClickHouse
  private async getConversionData(
    experimentId: string,
    metricName: string
  ): Promise<ConversionData[]> {
    const results = await this.clickhouse.query({
      query: `
        SELECT
          variant_id as variantId,
          uniqExact(user_id) as conversions,
          count() as events
        FROM experiment_events
        WHERE experiment_id = {experimentId:String}
          AND event_name = {metricName:String}
        GROUP BY variant_id
      `,
      query_params: { experimentId, metricName },
      format: 'JSONEachRow',
    }).then(r => r.json<{ variantId: string; conversions: number }[]>());

    return results.map(r => ({
      variantId: r.variantId,
      conversions: r.conversions,
      participants: 0, // Will be filled from Redis
    }));
  }

  // Calculate statistical significance (z-test)
  private calculateSignificance(
    treatmentConversions: number,
    treatmentSamples: number,
    controlConversions: number,
    controlSamples: number
  ): { confidence: number; significant: boolean } {
    if (treatmentSamples === 0 || controlSamples === 0) {
      return { confidence: 0, significant: false };
    }

    const p1 = treatmentConversions / treatmentSamples;
    const p2 = controlConversions / controlSamples;
    const p = (treatmentConversions + controlConversions) / (treatmentSamples + controlSamples);

    const se = Math.sqrt(p * (1 - p) * (1 / treatmentSamples + 1 / controlSamples));

    if (se === 0) {
      return { confidence: 0, significant: false };
    }

    const z = (p1 - p2) / se;
    const confidence = this.zToConfidence(Math.abs(z));
    const significant = confidence >= 95;

    return { confidence, significant };
  }

  // Convert z-score to confidence level
  private zToConfidence(z: number): number {
    // Approximation of normal CDF
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    const cdf = 0.5 * (1.0 + sign * y);
    const twoTailed = 2 * (1 - cdf);

    return (1 - twoTailed) * 100;
  }

  // Calculate required sample size
  calculateRequiredSampleSize(
    baselineConversion: number,
    minimumDetectableEffect: number,
    power = 0.8,
    significanceLevel = 0.05
  ): number {
    const alpha = significanceLevel;
    const beta = 1 - power;

    const zAlpha = this.getZScore(1 - alpha / 2);
    const zBeta = this.getZScore(1 - beta);

    const p1 = baselineConversion;
    const p2 = baselineConversion * (1 + minimumDetectableEffect);
    const pAvg = (p1 + p2) / 2;

    const n = Math.pow(zAlpha * Math.sqrt(2 * pAvg * (1 - pAvg)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2) /
      Math.pow(p2 - p1, 2);

    return Math.ceil(n);
  }

  // Get z-score for probability
  private getZScore(p: number): number {
    // Approximation
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;

    const a = [
      -3.969683028665376e+01, 2.209460984245205e+02,
      -2.759285104469687e+02, 1.383577518672690e+02,
      -3.066479806614716e+01, 2.506628277459239e+00
    ];

    const b = [
      -5.447609879822406e+01, 1.615858368580409e+02,
      -1.556989798598866e+02, 6.680131188771972e+01,
      -1.328068155288572e+01
    ];

    const c = [
      -7.784894002430293e-03, -3.223964580411365e-01,
      -2.400758277161838e+00, -2.549732539343734e+00,
      4.374664141464968e+00, 2.938163982698783e+00
    ];

    const d = [
      7.784695709041462e-03, 3.224671290700398e-01,
      2.445134137142996e+00, 3.754408661907416e+00
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
  }
}

export const resultsService = new ResultsService(
  process.env.CLICKHOUSE_URL || 'http://localhost:8123',
  process.env.REDIS_URL || 'redis://localhost:6379'
);
```

## Express.js API Routes

```typescript
// src/routes/experiments.ts
import { Router, Request, Response } from 'express';
import { experimentService } from '../services/experiments/experiment-service';
import { resultsService } from '../services/experiments/results-service';

const router = Router();

// Create experiment
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, variants, description, targetingRules, metrics } = req.body;

    if (!name || !variants?.length) {
      return res.status(400).json({ error: 'name and variants are required' });
    }

    const experiment = await experimentService.createExperiment(
      name,
      variants,
      { description, targetingRules, metrics }
    );

    res.json({ experiment });
  } catch (error: any) {
    console.error('Create experiment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all experiments
router.get('/', async (req: Request, res: Response) => {
  try {
    const experiments = experimentService.getAllExperiments();
    res.json({ experiments });
  } catch (error) {
    console.error('Get experiments error:', error);
    res.status(500).json({ error: 'Failed to get experiments' });
  }
});

// Get experiment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const experiment = experimentService.getExperiment(req.params.id);

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.json({ experiment });
  } catch (error) {
    console.error('Get experiment error:', error);
    res.status(500).json({ error: 'Failed to get experiment' });
  }
});

// Start experiment
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    await experimentService.startExperiment(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Start experiment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Pause experiment
router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    await experimentService.pauseExperiment(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Pause experiment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Complete experiment
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    await experimentService.completeExperiment(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Complete experiment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Assign variant
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { userId, anonymousId, attributes } = req.body;

    if (!anonymousId) {
      return res.status(400).json({ error: 'anonymousId is required' });
    }

    const assignment = await experimentService.assignVariant(
      req.params.id,
      { userId, anonymousId, attributes }
    );

    res.json({ assignment });
  } catch (error) {
    console.error('Assign variant error:', error);
    res.status(500).json({ error: 'Failed to assign variant' });
  }
});

// Get user's assignments
router.post('/assignments', async (req: Request, res: Response) => {
  try {
    const { userId, anonymousId, attributes } = req.body;

    if (!anonymousId) {
      return res.status(400).json({ error: 'anonymousId is required' });
    }

    const assignments = await experimentService.getUserExperiments({
      userId,
      anonymousId,
      attributes,
    });

    res.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Track conversion
router.post('/:id/convert', async (req: Request, res: Response) => {
  try {
    const { variantId, userId, eventName, value } = req.body;

    if (!variantId || !userId || !eventName) {
      return res.status(400).json({
        error: 'variantId, userId, and eventName are required'
      });
    }

    await resultsService.trackConversion(
      req.params.id,
      variantId,
      userId,
      eventName,
      value
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Track conversion error:', error);
    res.status(500).json({ error: 'Failed to track conversion' });
  }
});

// Get results
router.get('/:id/results', async (req: Request, res: Response) => {
  try {
    const { metric } = req.query;
    const experiment = experimentService.getExperiment(req.params.id);

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const results = await resultsService.getResults(
      req.params.id,
      experiment.variants,
      metric as string || 'conversion'
    );

    res.json({ results });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

// Calculate sample size
router.post('/calculator/sample-size', async (req: Request, res: Response) => {
  try {
    const {
      baselineConversion,
      minimumDetectableEffect,
      power,
      significanceLevel
    } = req.body;

    const sampleSize = resultsService.calculateRequiredSampleSize(
      baselineConversion,
      minimumDetectableEffect,
      power,
      significanceLevel
    );

    res.json({ sampleSize, perVariant: sampleSize });
  } catch (error) {
    console.error('Calculate sample size error:', error);
    res.status(500).json({ error: 'Failed to calculate sample size' });
  }
});

export default router;
```

## React Integration

```typescript
// src/hooks/useExperiment.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react';

interface Assignment {
  experimentId: string;
  variantId: string;
  variantName: string;
}

interface ExperimentContextValue {
  isLoaded: boolean;
  getVariant: (experimentId: string) => string | null;
  trackConversion: (experimentId: string, eventName: string, value?: number) => void;
  assignments: Map<string, Assignment>;
}

const ExperimentContext = createContext<ExperimentContextValue | null>(null);

interface ExperimentProviderProps {
  children: ReactNode;
  apiEndpoint: string;
  anonymousId: string;
  userId?: string;
  attributes?: Record<string, any>;
}

export function ExperimentProvider({
  children,
  apiEndpoint,
  anonymousId,
  userId,
  attributes,
}: ExperimentProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [assignments, setAssignments] = useState<Map<string, Assignment>>(new Map());

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const response = await fetch(`${apiEndpoint}/experiments/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anonymousId, userId, attributes }),
        });

        const data = await response.json();

        const assignmentMap = new Map<string, Assignment>();
        for (const assignment of data.assignments) {
          assignmentMap.set(assignment.experimentId, assignment);
        }

        setAssignments(assignmentMap);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load experiments:', error);
        setIsLoaded(true);
      }
    };

    loadAssignments();
  }, [apiEndpoint, anonymousId, userId, attributes]);

  const getVariant = useCallback((experimentId: string): string | null => {
    const assignment = assignments.get(experimentId);
    return assignment?.variantName || null;
  }, [assignments]);

  const trackConversion = useCallback(async (
    experimentId: string,
    eventName: string,
    value?: number
  ) => {
    const assignment = assignments.get(experimentId);
    if (!assignment) return;

    try {
      await fetch(`${apiEndpoint}/experiments/${experimentId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: assignment.variantId,
          userId: userId || anonymousId,
          eventName,
          value,
        }),
      });
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  }, [apiEndpoint, assignments, userId, anonymousId]);

  const value: ExperimentContextValue = {
    isLoaded,
    getVariant,
    trackConversion,
    assignments,
  };

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
}

export function useExperiment(): ExperimentContextValue {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiment must be used within ExperimentProvider');
  }
  return context;
}

// Hook for specific experiment
export function useVariant(experimentId: string): {
  variant: string | null;
  isControl: boolean;
  isLoaded: boolean;
} {
  const { getVariant, isLoaded } = useExperiment();

  const variant = getVariant(experimentId);
  const isControl = variant === 'control' || variant === null;

  return { variant, isControl, isLoaded };
}

// Hook for tracking conversions
export function useConversionTracker(experimentId: string) {
  const { trackConversion } = useExperiment();

  return useCallback((eventName: string, value?: number) => {
    trackConversion(experimentId, eventName, value);
  }, [trackConversion, experimentId]);
}
```

### A/B Test Components

```tsx
// src/components/ABTest.tsx
import React, { ReactNode, useEffect, useRef } from 'react';
import { useVariant, useConversionTracker, useExperiment } from '../hooks/useExperiment';

// Simple A/B test
interface ABTestProps {
  experimentId: string;
  control: ReactNode;
  treatment: ReactNode;
  trackImpression?: boolean;
}

export function ABTest({
  experimentId,
  control,
  treatment,
  trackImpression = true,
}: ABTestProps) {
  const { variant, isControl, isLoaded } = useVariant(experimentId);
  const trackConversion = useConversionTracker(experimentId);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (isLoaded && trackImpression && !impressionTracked.current) {
      impressionTracked.current = true;
      trackConversion('impression');
    }
  }, [isLoaded, trackImpression, trackConversion]);

  if (!isLoaded) {
    return <>{control}</>;
  }

  return <>{isControl ? control : treatment}</>;
}

// Multi-variant test
interface MultiVariantTestProps {
  experimentId: string;
  variants: Record<string, ReactNode>;
  fallback?: ReactNode;
  trackImpression?: boolean;
}

export function MultiVariantTest({
  experimentId,
  variants,
  fallback = null,
  trackImpression = true,
}: MultiVariantTestProps) {
  const { variant, isLoaded } = useVariant(experimentId);
  const trackConversion = useConversionTracker(experimentId);
  const impressionTracked = useRef(false);

  useEffect(() => {
    if (isLoaded && trackImpression && !impressionTracked.current) {
      impressionTracked.current = true;
      trackConversion('impression');
    }
  }, [isLoaded, trackImpression, trackConversion]);

  if (!isLoaded || !variant) {
    return <>{fallback || variants['control'] || null}</>;
  }

  return <>{variants[variant] || variants['control'] || fallback}</>;
}

// Conversion tracking button
interface ConversionButtonProps {
  experimentId: string;
  eventName: string;
  value?: number;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ConversionButton({
  experimentId,
  eventName,
  value,
  onClick,
  children,
  className,
  disabled,
}: ConversionButtonProps) {
  const trackConversion = useConversionTracker(experimentId);

  const handleClick = () => {
    trackConversion(eventName, value);
    onClick?.();
  };

  return (
    <button onClick={handleClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
}

// Experiments ready wrapper
interface ExperimentsReadyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ExperimentsReady({ children, fallback = null }: ExperimentsReadyProps) {
  const { isLoaded } = useExperiment();
  return <>{isLoaded ? children : fallback}</>;
}
```

## CLAUDE.md Integration

```markdown
## A/B Testing

### Commands
- `experiment:create <name> [variants]` - Create experiment
- `experiment:start <id>` - Start experiment
- `experiment:results <id>` - Get results
- `experiment:sample-size` - Calculate required sample size

### Key Files
- `src/services/experiments/experiment-service.ts` - Experiment management
- `src/services/experiments/results-service.ts` - Statistical analysis
- `src/hooks/useExperiment.tsx` - React integration

### Variant Naming
- `control` - Always the baseline
- `treatment` - For simple A/B tests
- `variant_a`, `variant_b` - For multi-variant tests

### Statistical Significance
- Default confidence threshold: 95%
- Uses two-proportion z-test
- Requires minimum sample size for validity
```

## AI Suggestions

1. **Multi-Armed Bandits**: Implement adaptive traffic allocation
2. **Bayesian Analysis**: Add Bayesian statistical methods
3. **Metric Guards**: Set up automatic experiment stopping rules
4. **Interaction Effects**: Detect when experiments conflict
5. **Holdout Groups**: Implement long-term holdout analysis
6. **Segmentation**: Analyze results by user segments
7. **Sequential Testing**: Enable early stopping with sequential analysis
8. **Feature Interactions**: Test feature flag combinations
9. **Revenue Impact**: Calculate incremental revenue lift
10. **Documentation**: Auto-generate experiment reports
