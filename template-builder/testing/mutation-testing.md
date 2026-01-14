# Mutation Testing Templates

Production-ready mutation testing patterns with Stryker, mutmut, and PITest for test quality validation.

## Overview

- **Mutation Analysis**: Test suite effectiveness measurement
- **Mutation Operators**: Common code mutation patterns
- **Survivor Analysis**: Identify weak test coverage
- **CI Integration**: Automated mutation testing pipelines

## Quick Start

```bash
# JavaScript/TypeScript (Stryker)
npm install -D @stryker-mutator/core @stryker-mutator/jest-runner

# Python (mutmut)
pip install mutmut

# Java (PITest)
mvn org.pitest:pitest-maven:mutationCoverage
```

## Stryker Configuration (TypeScript)

```javascript
// stryker.conf.js
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.ts',
    enableFindRelatedTests: true,
  },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/types.ts',
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50, // Fail if mutation score drops below 50%
  },
  timeoutMS: 10000,
  timeoutFactor: 2,
  concurrency: 4,
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  logLevel: 'info',
  dashboard: {
    project: 'github.com/org/repo',
    version: process.env.GITHUB_SHA || 'local',
    module: 'core',
  },
  // Incremental mode for faster runs
  incremental: true,
  incrementalFile: '.stryker-incremental.json',
  // Ignore specific mutations
  ignorers: [
    'logging', // Don't mutate logging statements
  ],
  mutator: {
    excludedMutations: [
      'StringLiteral', // Don't mutate string literals
    ],
  },
};
```

```typescript
// stryker.conf.ts (TypeScript config)
import type { PartialStrykerOptions } from '@stryker-mutator/api/core';

const config: PartialStrykerOptions = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  // Per-file thresholds
  files: [
    {
      pattern: 'src/critical/**/*.ts',
      threshold: 85,
    },
  ],
};

export default config;
```

## Vitest + Stryker Integration

```javascript
// stryker.conf.js (Vitest)
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  coverageAnalysis: 'perTest',
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
};
```

## Python mutmut Configuration

```toml
# pyproject.toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
runner = "pytest -x"
backup = false
dict_synonyms = "Struct, NamedStruct"
# Mutations to skip
skip_patterns = [
    "return None",
    "pass",
]

[tool.mutmut.mutate_except]
# Files to exclude
"**/migrations/*.py" = true
"**/settings.py" = true
"**/conftest.py" = true
```

```python
# tests/mutation/conftest.py
"""Configuration for mutation testing."""
import pytest
from pathlib import Path


def pytest_configure(config):
    """Configure pytest for mutation testing."""
    config.addinivalue_line(
        "markers",
        "mutation: mark test as mutation test",
    )


@pytest.fixture(scope="session")
def mutation_results():
    """Load mutation testing results."""
    results_file = Path(".mutmut-cache")
    if results_file.exists():
        import sqlite3
        conn = sqlite3.connect(str(results_file))
        cursor = conn.execute(
            "SELECT * FROM mutant WHERE status != 'ok'"
        )
        survivors = cursor.fetchall()
        conn.close()
        return survivors
    return []
```

```python
# tests/mutation/test_mutation_score.py
"""Tests for mutation score compliance."""
import pytest
import subprocess
import json


class TestMutationScore:
    """Verify mutation testing results."""

    @pytest.fixture
    def mutation_report(self):
        """Run mutmut and get results."""
        result = subprocess.run(
            ["mutmut", "results", "--json"],
            capture_output=True,
            text=True,
        )
        return json.loads(result.stdout) if result.stdout else {}

    def test_minimum_mutation_score(self, mutation_report):
        """Test that mutation score meets minimum threshold."""
        total = mutation_report.get("total_mutants", 0)
        killed = mutation_report.get("killed", 0)

        if total == 0:
            pytest.skip("No mutations found")

        score = (killed / total) * 100
        assert score >= 60, f"Mutation score {score:.1f}% below threshold 60%"

    def test_no_critical_survivors(self, mutation_report):
        """Test that critical code has no surviving mutants."""
        survivors = mutation_report.get("survivors", [])

        critical_survivors = [
            s for s in survivors
            if "security" in s.get("file", "").lower()
            or "auth" in s.get("file", "").lower()
            or "payment" in s.get("file", "").lower()
        ]

        assert len(critical_survivors) == 0, (
            f"Critical code has {len(critical_survivors)} surviving mutants"
        )

    def test_mutation_coverage_per_module(self, mutation_report):
        """Test mutation coverage per module."""
        modules = mutation_report.get("by_module", {})

        for module, stats in modules.items():
            if stats.get("total", 0) > 0:
                score = (stats["killed"] / stats["total"]) * 100
                assert score >= 50, (
                    f"Module {module} has mutation score {score:.1f}%"
                )
```

## Mutation Testing Best Practices

```typescript
// src/utils/calculator.ts
// Example code to mutation test
export function calculate(a: number, b: number, operation: string): number {
  switch (operation) {
    case 'add':
      return a + b;  // Mutant: a - b
    case 'subtract':
      return a - b;  // Mutant: a + b
    case 'multiply':
      return a * b;  // Mutant: a / b
    case 'divide':
      if (b === 0) {  // Mutant: b !== 0
        throw new Error('Division by zero');
      }
      return a / b;  // Mutant: a * b
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

export function isEven(n: number): boolean {
  return n % 2 === 0;  // Mutants: n % 2 !== 0, n % 2 === 1
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;  // Mutants: value <= min, value > min
  if (value > max) return max;  // Mutants: value >= max, value < max
  return value;
}
```

```typescript
// tests/calculator.test.ts
// Tests that will kill mutants
import { calculate, isEven, clamp } from '../src/utils/calculator';

describe('calculate', () => {
  // These tests will kill arithmetic operator mutations
  describe('add', () => {
    it('returns sum of two positive numbers', () => {
      expect(calculate(2, 3, 'add')).toBe(5);
    });

    it('returns sum with negative numbers', () => {
      expect(calculate(-2, 3, 'add')).toBe(1);
    });

    // This test specifically kills the a - b mutation
    it('is commutative', () => {
      expect(calculate(2, 3, 'add')).toBe(calculate(3, 2, 'add'));
    });
  });

  describe('subtract', () => {
    it('returns difference', () => {
      expect(calculate(5, 3, 'subtract')).toBe(2);
    });

    // Kills a + b mutation
    it('returns negative when second larger', () => {
      expect(calculate(3, 5, 'subtract')).toBe(-2);
    });
  });

  describe('divide', () => {
    // Kills b !== 0 mutation
    it('throws on division by zero', () => {
      expect(() => calculate(5, 0, 'divide')).toThrow('Division by zero');
    });

    // Kills a * b mutation
    it('returns correct quotient', () => {
      expect(calculate(10, 2, 'divide')).toBe(5);
    });

    it('handles decimal results', () => {
      expect(calculate(5, 2, 'divide')).toBe(2.5);
    });
  });
});

describe('isEven', () => {
  // These tests kill n % 2 !== 0 and n % 2 === 1 mutations
  it('returns true for even numbers', () => {
    expect(isEven(0)).toBe(true);
    expect(isEven(2)).toBe(true);
    expect(isEven(-4)).toBe(true);
  });

  it('returns false for odd numbers', () => {
    expect(isEven(1)).toBe(false);
    expect(isEven(-3)).toBe(false);
  });
});

describe('clamp', () => {
  // Boundary tests kill comparison mutations
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  // Kills value <= min mutation
  it('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  // Kills value < min mutation
  it('returns min when value below min', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  // Kills value >= max mutation
  it('returns max when value equals max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  // Kills value > max mutation
  it('returns max when value above max', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
```

## CI Integration

```yaml
# .github/workflows/mutation.yml
name: Mutation Testing

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # For incremental mode

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Restore mutation cache
        uses: actions/cache@v4
        with:
          path: .stryker-incremental.json
          key: stryker-${{ github.base_ref }}-${{ hashFiles('src/**/*.ts') }}
          restore-keys: |
            stryker-${{ github.base_ref }}-
            stryker-

      - name: Run mutation tests
        run: npx stryker run --incremental

      - name: Upload mutation report
        uses: actions/upload-artifact@v4
        with:
          name: mutation-report
          path: reports/mutation/

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json'));

            const score = (report.killed / report.total * 100).toFixed(1);
            const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## ${status} Mutation Testing Results

              | Metric | Value |
              |--------|-------|
              | Mutation Score | ${score}% |
              | Killed | ${report.killed} |
              | Survived | ${report.survived} |
              | Total | ${report.total} |

              [View full report](${process.env.REPORT_URL})`
            });
```

## Survivor Analysis

```typescript
// scripts/analyze-survivors.ts
import * as fs from 'fs';

interface Mutant {
  id: string;
  mutatorName: string;
  fileName: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  status: 'Killed' | 'Survived' | 'NoCoverage' | 'Timeout';
  replacement?: string;
}

interface MutationReport {
  schemaVersion: string;
  thresholds: { high: number; low: number; break: number };
  files: Record<string, { mutants: Mutant[] }>;
}

function analyzeSurvivors(reportPath: string): void {
  const report: MutationReport = JSON.parse(
    fs.readFileSync(reportPath, 'utf-8')
  );

  const survivors: Array<Mutant & { file: string }> = [];

  for (const [file, { mutants }] of Object.entries(report.files)) {
    for (const mutant of mutants) {
      if (mutant.status === 'Survived') {
        survivors.push({ ...mutant, file });
      }
    }
  }

  // Group by file
  const byFile = new Map<string, typeof survivors>();
  for (const survivor of survivors) {
    const existing = byFile.get(survivor.file) || [];
    existing.push(survivor);
    byFile.set(survivor.file, existing);
  }

  console.log('\n=== Surviving Mutants Analysis ===\n');
  console.log(`Total survivors: ${survivors.length}\n`);

  // Group by mutation type
  const byType = new Map<string, number>();
  for (const survivor of survivors) {
    byType.set(
      survivor.mutatorName,
      (byType.get(survivor.mutatorName) || 0) + 1
    );
  }

  console.log('By mutation type:');
  for (const [type, count] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\nBy file:');
  for (const [file, mutants] of byFile.entries()) {
    console.log(`\n${file} (${mutants.length} survivors):`);
    for (const mutant of mutants.slice(0, 5)) {
      console.log(
        `  Line ${mutant.location.start.line}: ${mutant.mutatorName}`
      );
    }
    if (mutants.length > 5) {
      console.log(`  ... and ${mutants.length - 5} more`);
    }
  }

  // Suggest test improvements
  console.log('\n=== Suggested Improvements ===\n');
  suggestImprovements(survivors);
}

function suggestImprovements(survivors: Array<Mutant & { file: string }>): void {
  const suggestions = new Map<string, string[]>();

  for (const survivor of survivors) {
    const filesuggestions = suggestions.get(survivor.file) || [];

    switch (survivor.mutatorName) {
      case 'ConditionalExpression':
        filesuggestions.push(
          `Add boundary tests for condition at line ${survivor.location.start.line}`
        );
        break;
      case 'ArithmeticOperator':
        filesuggestions.push(
          `Add tests with different operand values at line ${survivor.location.start.line}`
        );
        break;
      case 'EqualityOperator':
        filesuggestions.push(
          `Add equality boundary tests at line ${survivor.location.start.line}`
        );
        break;
      default:
        filesuggestions.push(
          `Review test coverage for ${survivor.mutatorName} at line ${survivor.location.start.line}`
        );
    }

    suggestions.set(survivor.file, filesuggestions);
  }

  for (const [file, filesuggestions] of suggestions.entries()) {
    console.log(`${file}:`);
    [...new Set(filesuggestions)].forEach(s => console.log(`  - ${s}`));
  }
}

// Run analysis
analyzeSurvivors('./reports/mutation/mutation.json');
```

## CLAUDE.md Integration

```markdown
# Mutation Testing

## Commands
- `npx stryker run` - Run full mutation testing
- `npx stryker run --incremental` - Run incremental
- `mutmut run` - Python mutation testing
- `mutmut results` - View mutation results

## Mutation Operators
- Arithmetic: +, -, *, /
- Comparison: ==, !=, <, >, <=, >=
- Logical: &&, ||, !
- String: empty, concat
- Array: push, pop, slice

## Thresholds
- High: 80% (green)
- Low: 60% (yellow)
- Break: 50% (fail build)

## Best Practices
- Focus on critical paths
- Use incremental mode in CI
- Review survivors regularly
- Don't mutate test utilities
```

## AI Suggestions

1. **Smart mutation selection** - AI-guided mutation prioritization
2. **Equivalent mutant detection** - Detect semantic duplicates
3. **Test generation** - Generate tests to kill survivors
4. **Mutation clustering** - Group similar mutations
5. **Historical analysis** - Track mutation score trends
6. **Critical path focus** - Prioritize business-critical code
7. **Timeout optimization** - Smart timeout calculation
8. **Parallel execution** - Optimize mutation test parallelism
9. **Delta mutation** - Only test changed code
10. **Mutation debugging** - Interactive survivor exploration
