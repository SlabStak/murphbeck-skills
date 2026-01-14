# Evaluation Agent Template

## Overview
Comprehensive evaluation agent setup with quality assessment, benchmarking, A/B testing, and continuous improvement capabilities.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid
```

## Core Evaluation Agent

### src/agents/evaluation/types.ts
```typescript
// src/agents/evaluation/types.ts

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  scoringGuide: string;
  minScore: number;
  maxScore: number;
}

export interface EvaluationResult {
  id: string;
  targetId: string;
  targetType: string;
  criteria: CriteriaScore[];
  overallScore: number;
  feedback: string;
  recommendations: string[];
  timestamp: number;
  evaluatorId?: string;
}

export interface CriteriaScore {
  criteriaId: string;
  score: number;
  justification: string;
}

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  metrics: BenchmarkMetric[];
}

export interface TestCase {
  id: string;
  input: unknown;
  expectedOutput?: unknown;
  evaluationCriteria: string[];
}

export interface BenchmarkMetric {
  name: string;
  type: 'accuracy' | 'latency' | 'quality' | 'custom';
  threshold?: number;
}

export interface BenchmarkResult {
  benchmarkId: string;
  results: TestCaseResult[];
  metrics: Record<string, number>;
  summary: string;
  timestamp: number;
}

export interface TestCaseResult {
  testCaseId: string;
  output: unknown;
  score: number;
  passed: boolean;
  details: string;
}

export interface EvaluationConfig {
  model: string;
  defaultCriteria: EvaluationCriteria[];
  passingThreshold: number;
  enableDetailedFeedback: boolean;
}
```

### src/agents/evaluation/agent.ts
```typescript
// src/agents/evaluation/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  EvaluationCriteria,
  EvaluationResult,
  CriteriaScore,
  Benchmark,
  BenchmarkResult,
  TestCaseResult,
  EvaluationConfig
} from './types';

export class EvaluationAgent {
  private client: Anthropic;
  private config: EvaluationConfig;
  private criteria: Map<string, EvaluationCriteria> = new Map();
  private benchmarks: Map<string, Benchmark> = new Map();
  private evaluationHistory: EvaluationResult[] = [];

  constructor(config: Partial<EvaluationConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      model: 'claude-sonnet-4-20250514',
      defaultCriteria: [],
      passingThreshold: 0.7,
      enableDetailedFeedback: true,
      ...config
    };

    this.initializeDefaultCriteria();
  }

  // Initialize default evaluation criteria
  private initializeDefaultCriteria(): void {
    const defaultCriteria: EvaluationCriteria[] = [
      {
        id: 'accuracy',
        name: 'Accuracy',
        description: 'How accurate and factually correct is the output?',
        weight: 0.25,
        scoringGuide: '1: Completely wrong, 3: Partially correct, 5: Fully accurate',
        minScore: 1,
        maxScore: 5
      },
      {
        id: 'relevance',
        name: 'Relevance',
        description: 'How relevant is the response to the input/query?',
        weight: 0.25,
        scoringGuide: '1: Off-topic, 3: Partially relevant, 5: Highly relevant',
        minScore: 1,
        maxScore: 5
      },
      {
        id: 'completeness',
        name: 'Completeness',
        description: 'Does the response fully address all aspects?',
        weight: 0.2,
        scoringGuide: '1: Very incomplete, 3: Partially complete, 5: Fully complete',
        minScore: 1,
        maxScore: 5
      },
      {
        id: 'clarity',
        name: 'Clarity',
        description: 'How clear and well-organized is the response?',
        weight: 0.15,
        scoringGuide: '1: Confusing, 3: Somewhat clear, 5: Very clear',
        minScore: 1,
        maxScore: 5
      },
      {
        id: 'helpfulness',
        name: 'Helpfulness',
        description: 'How helpful and actionable is the response?',
        weight: 0.15,
        scoringGuide: '1: Not helpful, 3: Somewhat helpful, 5: Very helpful',
        minScore: 1,
        maxScore: 5
      }
    ];

    defaultCriteria.forEach(c => this.criteria.set(c.id, c));
  }

  // Add custom criteria
  addCriteria(criteria: Omit<EvaluationCriteria, 'id'>): EvaluationCriteria {
    const fullCriteria: EvaluationCriteria = {
      id: uuidv4(),
      ...criteria
    };
    this.criteria.set(fullCriteria.id, fullCriteria);
    return fullCriteria;
  }

  // Evaluate a target
  async evaluate(
    target: unknown,
    context: { input?: unknown; expectedOutput?: unknown; targetType?: string } = {},
    criteriaIds?: string[]
  ): Promise<EvaluationResult> {
    const selectedCriteria = criteriaIds
      ? criteriaIds.map(id => this.criteria.get(id)).filter(Boolean) as EvaluationCriteria[]
      : Array.from(this.criteria.values());

    console.log(`[Evaluation] Evaluating against ${selectedCriteria.length} criteria`);

    const criteriaScores: CriteriaScore[] = [];

    for (const criteria of selectedCriteria) {
      const score = await this.evaluateCriteria(target, context, criteria);
      criteriaScores.push(score);
    }

    // Calculate weighted overall score
    const totalWeight = selectedCriteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = criteriaScores.reduce((sum, cs) => {
      const criteria = this.criteria.get(cs.criteriaId)!;
      const normalizedScore = (cs.score - criteria.minScore) / (criteria.maxScore - criteria.minScore);
      return sum + normalizedScore * criteria.weight;
    }, 0);

    const overallScore = weightedSum / totalWeight;

    // Generate feedback and recommendations
    const { feedback, recommendations } = await this.generateFeedback(
      target,
      context,
      criteriaScores,
      overallScore
    );

    const result: EvaluationResult = {
      id: uuidv4(),
      targetId: typeof target === 'object' && target !== null ? (target as any).id || '' : '',
      targetType: context.targetType || 'unknown',
      criteria: criteriaScores,
      overallScore,
      feedback,
      recommendations,
      timestamp: Date.now()
    };

    this.evaluationHistory.push(result);
    return result;
  }

  // Evaluate single criteria
  private async evaluateCriteria(
    target: unknown,
    context: { input?: unknown; expectedOutput?: unknown },
    criteria: EvaluationCriteria
  ): Promise<CriteriaScore> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      system: `You are an evaluation expert. Score outputs based on specific criteria.

Criteria: ${criteria.name}
Description: ${criteria.description}
Scoring Guide: ${criteria.scoringGuide}
Score Range: ${criteria.minScore} to ${criteria.maxScore}

Output JSON only: { "score": number, "justification": "explanation" }`,
      messages: [{
        role: 'user',
        content: `Evaluate this output:

${context.input ? `Input: ${JSON.stringify(context.input)}` : ''}
${context.expectedOutput ? `Expected: ${JSON.stringify(context.expectedOutput)}` : ''}

Actual Output:
${JSON.stringify(target, null, 2)}

Score for "${criteria.name}"`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\{[\s\S]*\}/);
        if (match) {
          const result = JSON.parse(match[0]);
          return {
            criteriaId: criteria.id,
            score: Math.max(criteria.minScore, Math.min(criteria.maxScore, result.score)),
            justification: result.justification
          };
        }
      } catch {}
    }

    return {
      criteriaId: criteria.id,
      score: (criteria.minScore + criteria.maxScore) / 2,
      justification: 'Unable to evaluate'
    };
  }

  // Generate feedback and recommendations
  private async generateFeedback(
    target: unknown,
    context: { input?: unknown; expectedOutput?: unknown },
    scores: CriteriaScore[],
    overallScore: number
  ): Promise<{ feedback: string; recommendations: string[] }> {
    if (!this.config.enableDetailedFeedback) {
      return {
        feedback: `Overall score: ${(overallScore * 100).toFixed(1)}%`,
        recommendations: []
      };
    }

    const scoresText = scores.map(s => {
      const criteria = this.criteria.get(s.criteriaId);
      return `${criteria?.name}: ${s.score} - ${s.justification}`;
    }).join('\n');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Based on this evaluation, provide feedback and recommendations:

Overall Score: ${(overallScore * 100).toFixed(1)}%

Individual Scores:
${scoresText}

Output JSON:
{
  "feedback": "overall assessment",
  "recommendations": ["specific improvement 1", "specific improvement 2", ...]
}`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch {}
    }

    return {
      feedback: `Score: ${(overallScore * 100).toFixed(1)}%`,
      recommendations: []
    };
  }

  // Create a benchmark
  createBenchmark(
    name: string,
    description: string,
    testCases: Benchmark['testCases'],
    metrics: Benchmark['metrics']
  ): Benchmark {
    const benchmark: Benchmark = {
      id: uuidv4(),
      name,
      description,
      testCases,
      metrics
    };

    this.benchmarks.set(benchmark.id, benchmark);
    return benchmark;
  }

  // Run a benchmark
  async runBenchmark(
    benchmarkId: string,
    executor: (input: unknown) => Promise<unknown>
  ): Promise<BenchmarkResult> {
    const benchmark = this.benchmarks.get(benchmarkId);
    if (!benchmark) throw new Error(`Benchmark not found: ${benchmarkId}`);

    console.log(`[Evaluation] Running benchmark: ${benchmark.name}`);

    const results: TestCaseResult[] = [];
    const startTime = Date.now();
    let totalScore = 0;
    let passedCount = 0;

    for (const testCase of benchmark.testCases) {
      const caseStart = Date.now();

      try {
        const output = await executor(testCase.input);
        const caseDuration = Date.now() - caseStart;

        // Evaluate the output
        const evaluation = await this.evaluate(
          output,
          {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput
          },
          testCase.evaluationCriteria
        );

        const passed = evaluation.overallScore >= this.config.passingThreshold;
        if (passed) passedCount++;
        totalScore += evaluation.overallScore;

        results.push({
          testCaseId: testCase.id,
          output,
          score: evaluation.overallScore,
          passed,
          details: evaluation.feedback
        });
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          output: null,
          score: 0,
          passed: false,
          details: `Error: ${error}`
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const avgScore = totalScore / benchmark.testCases.length;
    const passRate = passedCount / benchmark.testCases.length;

    // Calculate metrics
    const metrics: Record<string, number> = {
      averageScore: avgScore,
      passRate,
      totalDuration,
      averageLatency: totalDuration / benchmark.testCases.length
    };

    for (const metric of benchmark.metrics) {
      if (metric.type === 'accuracy') {
        metrics[metric.name] = avgScore;
      } else if (metric.type === 'latency') {
        metrics[metric.name] = totalDuration / benchmark.testCases.length;
      }
    }

    // Generate summary
    const summary = await this.generateBenchmarkSummary(benchmark, results, metrics);

    return {
      benchmarkId,
      results,
      metrics,
      summary,
      timestamp: Date.now()
    };
  }

  // Generate benchmark summary
  private async generateBenchmarkSummary(
    benchmark: Benchmark,
    results: TestCaseResult[],
    metrics: Record<string, number>
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Summarize these benchmark results:

Benchmark: ${benchmark.name}
Test Cases: ${results.length}
Passed: ${results.filter(r => r.passed).length}

Metrics:
${Object.entries(metrics).map(([k, v]) => `${k}: ${v}`).join('\n')}

Provide a brief summary of performance and key insights.`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : 'Benchmark complete.';
  }

  // Compare two outputs (A/B testing)
  async compare(
    outputA: unknown,
    outputB: unknown,
    context: { input?: unknown } = {}
  ): Promise<{
    winner: 'A' | 'B' | 'tie';
    scores: { A: number; B: number };
    comparison: string;
  }> {
    const [evalA, evalB] = await Promise.all([
      this.evaluate(outputA, context),
      this.evaluate(outputB, context)
    ]);

    let winner: 'A' | 'B' | 'tie';
    if (Math.abs(evalA.overallScore - evalB.overallScore) < 0.05) {
      winner = 'tie';
    } else {
      winner = evalA.overallScore > evalB.overallScore ? 'A' : 'B';
    }

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Compare these two outputs:

Output A (Score: ${(evalA.overallScore * 100).toFixed(1)}%):
${JSON.stringify(outputA, null, 2)}

Output B (Score: ${(evalB.overallScore * 100).toFixed(1)}%):
${JSON.stringify(outputB, null, 2)}

Provide a brief comparison of strengths and weaknesses.`
      }]
    });

    const content = response.content[0];

    return {
      winner,
      scores: {
        A: evalA.overallScore,
        B: evalB.overallScore
      },
      comparison: content.type === 'text' ? content.text : ''
    };
  }

  // Get evaluation history
  getHistory(filter?: { targetType?: string; minScore?: number }): EvaluationResult[] {
    let results = [...this.evaluationHistory];

    if (filter?.targetType) {
      results = results.filter(r => r.targetType === filter.targetType);
    }
    if (filter?.minScore !== undefined) {
      results = results.filter(r => r.overallScore >= filter.minScore);
    }

    return results;
  }

  // Get criteria
  getCriteria(): EvaluationCriteria[] {
    return Array.from(this.criteria.values());
  }

  // Get statistics
  getStats(): {
    totalEvaluations: number;
    averageScore: number;
    passRate: number;
    criteriaStats: Record<string, { avg: number; min: number; max: number }>;
  } {
    if (this.evaluationHistory.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        passRate: 0,
        criteriaStats: {}
      };
    }

    const avgScore = this.evaluationHistory.reduce(
      (sum, e) => sum + e.overallScore, 0
    ) / this.evaluationHistory.length;

    const passRate = this.evaluationHistory.filter(
      e => e.overallScore >= this.config.passingThreshold
    ).length / this.evaluationHistory.length;

    const criteriaStats: Record<string, { scores: number[] }> = {};
    this.evaluationHistory.forEach(e => {
      e.criteria.forEach(c => {
        if (!criteriaStats[c.criteriaId]) {
          criteriaStats[c.criteriaId] = { scores: [] };
        }
        criteriaStats[c.criteriaId].scores.push(c.score);
      });
    });

    const formattedStats: Record<string, { avg: number; min: number; max: number }> = {};
    Object.entries(criteriaStats).forEach(([id, { scores }]) => {
      formattedStats[id] = {
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        min: Math.min(...scores),
        max: Math.max(...scores)
      };
    });

    return {
      totalEvaluations: this.evaluationHistory.length,
      averageScore: avgScore,
      passRate,
      criteriaStats: formattedStats
    };
  }
}
```

## Usage Example

### src/agents/evaluation/example.ts
```typescript
// src/agents/evaluation/example.ts
import { EvaluationAgent } from './agent';

async function main() {
  const agent = new EvaluationAgent({
    passingThreshold: 0.7,
    enableDetailedFeedback: true
  });

  console.log('=== Evaluation Agent Demo ===\n');

  // Evaluate a response
  const response = {
    answer: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
    examples: ['let x: number = 5;', 'interface User { name: string; }']
  };

  console.log('1. Evaluating a response...\n');
  const evaluation = await agent.evaluate(
    response,
    { input: 'What is TypeScript?' }
  );

  console.log(`Overall Score: ${(evaluation.overallScore * 100).toFixed(1)}%`);
  console.log('\nCriteria Scores:');
  evaluation.criteria.forEach(c => {
    console.log(`  ${c.criteriaId}: ${c.score} - ${c.justification.substring(0, 50)}...`);
  });
  console.log('\nFeedback:', evaluation.feedback);
  console.log('\nRecommendations:');
  evaluation.recommendations.forEach(r => console.log(`  - ${r}`));

  // A/B comparison
  console.log('\n2. Comparing two outputs...\n');
  const outputA = 'TypeScript is JavaScript with types.';
  const outputB = 'TypeScript is a strongly typed programming language that builds on JavaScript. It adds static type definitions, interfaces, and other features that help catch errors at compile time rather than runtime.';

  const comparison = await agent.compare(outputA, outputB, {
    input: 'Explain TypeScript briefly'
  });

  console.log(`Winner: Output ${comparison.winner}`);
  console.log(`Scores: A=${(comparison.scores.A * 100).toFixed(1)}%, B=${(comparison.scores.B * 100).toFixed(1)}%`);
  console.log('\nComparison:', comparison.comparison.substring(0, 300) + '...');

  // Create and run benchmark
  console.log('\n3. Running benchmark...\n');
  const benchmark = agent.createBenchmark(
    'Question Answering',
    'Evaluate Q&A capabilities',
    [
      { id: 'tc1', input: 'What is 2+2?', expectedOutput: '4', evaluationCriteria: ['accuracy'] },
      { id: 'tc2', input: 'Capital of France?', expectedOutput: 'Paris', evaluationCriteria: ['accuracy'] }
    ],
    [{ name: 'accuracy', type: 'accuracy' }]
  );

  const benchmarkResult = await agent.runBenchmark(benchmark.id, async (input) => {
    // Mock executor
    if (input === 'What is 2+2?') return '4';
    if (input === 'Capital of France?') return 'Paris';
    return 'Unknown';
  });

  console.log('Benchmark Results:');
  console.log(`  Pass Rate: ${(benchmarkResult.metrics.passRate * 100).toFixed(1)}%`);
  console.log(`  Average Score: ${(benchmarkResult.metrics.averageScore * 100).toFixed(1)}%`);
  console.log('\nSummary:', benchmarkResult.summary);

  // Show stats
  console.log('\n=== Overall Stats ===');
  console.log(agent.getStats());
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Evaluation Agent

### Default Criteria
- Accuracy (25%): Factual correctness
- Relevance (25%): Response relevance
- Completeness (20%): Full coverage
- Clarity (15%): Organization
- Helpfulness (15%): Actionability

### Basic Evaluation
```typescript
const result = await agent.evaluate(output, { input: 'query' });
console.log(result.overallScore, result.feedback);
```

### A/B Comparison
```typescript
const comparison = await agent.compare(outputA, outputB);
console.log(comparison.winner);
```

### Benchmarking
```typescript
const benchmark = agent.createBenchmark('name', 'desc', testCases, metrics);
const results = await agent.runBenchmark(benchmark.id, executor);
```

### Custom Criteria
```typescript
agent.addCriteria({
  name: 'Custom',
  description: 'My criteria',
  weight: 0.2,
  scoringGuide: '1-5 scale',
  minScore: 1,
  maxScore: 5
});
```
```

## AI Suggestions

1. **Rubric generation** - Auto-create criteria
2. **Inter-rater reliability** - Multiple evaluators
3. **Calibration sets** - Standardize scoring
4. **Regression testing** - Track changes
5. **Error analysis** - Categorize failures
6. **Human feedback** - Collect annotations
7. **Confidence intervals** - Score uncertainty
8. **Trend analysis** - Performance over time
9. **Comparative ranking** - Elo-style ratings
10. **Export reports** - PDF/HTML summaries
