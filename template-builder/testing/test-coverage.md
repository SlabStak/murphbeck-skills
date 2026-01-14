# Test Coverage Templates

Production-ready test coverage patterns with Istanbul/nyc, pytest-cov, and coverage analysis.

## Overview

- **Line Coverage**: Statement execution tracking
- **Branch Coverage**: Decision path coverage
- **Function Coverage**: Function call coverage
- **Coverage Reporting**: HTML, LCOV, Cobertura formats

## Quick Start

```bash
# Jest (built-in Istanbul)
npm test -- --coverage

# Vitest
npm install -D @vitest/coverage-v8

# nyc for Node.js
npm install -D nyc

# Python
pip install pytest-cov coverage
```

## Jest Coverage Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/types.ts',
    '!src/generated/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Per-file thresholds
    './src/services/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/utils/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  // Custom coverage provider (v8 or babel)
  coverageProvider: 'v8',
  // Fail on coverage threshold
  testFailureExitCode: 1,
};

export default config;
```

## Vitest Coverage Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      enabled: true,
      reporter: ['text', 'text-summary', 'html', 'lcov', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.d.ts',
        'src/types/',
      ],
      // Coverage thresholds
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
      // Per-file thresholds
      perFile: true,
      // All files (including uncovered)
      all: true,
      // Clean coverage before run
      clean: true,
      // Skip full coverage for files
      skipFull: false,
    },
  },
});
```

## nyc Configuration

```json
// .nycrc.json
{
  "all": true,
  "include": ["src/**/*.ts"],
  "exclude": [
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.spec.ts",
    "src/index.ts",
    "src/types/**"
  ],
  "extension": [".ts", ".tsx"],
  "reporter": ["text", "text-summary", "html", "lcov", "cobertura"],
  "report-dir": "./coverage",
  "temp-dir": "./.nyc_output",
  "check-coverage": true,
  "branches": 80,
  "lines": 80,
  "functions": 80,
  "statements": 80,
  "per-file": true,
  "skip-full": false,
  "clean": true,
  "source-map": true,
  "instrument": true,
  "cache": true
}
```

```typescript
// nyc.config.js
module.exports = {
  all: true,
  include: ['src/**/*.ts'],
  exclude: [
    '**/*.d.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
    'src/migrations/**',
    'src/generated/**',
  ],
  reporter: ['text', 'html', 'lcov'],
  'report-dir': './coverage',
  'check-coverage': true,
  branches: 80,
  lines: 80,
  functions: 80,
  statements: 80,
  // Per-glob thresholds
  'per-file': {
    'src/services/**/*.ts': {
      branches: 90,
      lines: 90,
      functions: 90,
      statements: 90,
    },
  },
};
```

## Python pytest-cov Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
addopts = [
    "--cov=src",
    "--cov-report=term-missing",
    "--cov-report=html:coverage/html",
    "--cov-report=xml:coverage/coverage.xml",
    "--cov-report=lcov:coverage/lcov.info",
    "--cov-fail-under=80",
    "--cov-branch",
]

[tool.coverage.run]
branch = true
source = ["src"]
omit = [
    "*/__pycache__/*",
    "*/tests/*",
    "*/.venv/*",
    "*/migrations/*",
    "*/__init__.py",
]
relative_files = true
parallel = true

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
    "if typing.TYPE_CHECKING:",
    "@abstractmethod",
    "@abc.abstractmethod",
]
fail_under = 80
show_missing = true
skip_covered = false
precision = 2

[tool.coverage.html]
directory = "coverage/html"
title = "Coverage Report"
show_contexts = true

[tool.coverage.xml]
output = "coverage/coverage.xml"
```

```ini
# .coveragerc (alternative)
[run]
branch = True
source = src
omit =
    */__pycache__/*
    */tests/*
    */.venv/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise NotImplementedError
    if TYPE_CHECKING:

fail_under = 80
show_missing = True
precision = 2

[html]
directory = coverage/html

[xml]
output = coverage/coverage.xml
```

## Coverage Analysis Scripts

```typescript
// scripts/coverage-analysis.ts
import * as fs from 'fs';
import * as path from 'path';

interface CoverageEntry {
  path: string;
  statementMap: Record<string, { start: Location; end: Location }>;
  fnMap: Record<string, { name: string; loc: { start: Location; end: Location } }>;
  branchMap: Record<string, { type: string; locations: Location[] }>;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
}

interface Location {
  line: number;
  column: number;
}

interface CoverageSummary {
  lines: { total: number; covered: number; pct: number };
  statements: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
}

function analyzeCoverage(coveragePath: string): void {
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));

  const uncovered: Array<{
    file: string;
    type: 'line' | 'function' | 'branch';
    location: string;
  }> = [];

  for (const [file, data] of Object.entries(coverage) as [string, CoverageEntry][]) {
    // Find uncovered statements
    for (const [id, count] of Object.entries(data.s)) {
      if (count === 0) {
        const loc = data.statementMap[id];
        uncovered.push({
          file: path.relative(process.cwd(), file),
          type: 'line',
          location: `line ${loc.start.line}`,
        });
      }
    }

    // Find uncovered functions
    for (const [id, count] of Object.entries(data.f)) {
      if (count === 0) {
        const fn = data.fnMap[id];
        uncovered.push({
          file: path.relative(process.cwd(), file),
          type: 'function',
          location: `${fn.name} (line ${fn.loc.start.line})`,
        });
      }
    }

    // Find uncovered branches
    for (const [id, counts] of Object.entries(data.b)) {
      counts.forEach((count, idx) => {
        if (count === 0) {
          const branch = data.branchMap[id];
          uncovered.push({
            file: path.relative(process.cwd(), file),
            type: 'branch',
            location: `${branch.type} branch ${idx + 1} (line ${branch.locations[idx]?.line || 'unknown'})`,
          });
        }
      });
    }
  }

  // Group by file
  const byFile = new Map<string, typeof uncovered>();
  for (const item of uncovered) {
    const existing = byFile.get(item.file) || [];
    existing.push(item);
    byFile.set(item.file, existing);
  }

  console.log('\n=== Uncovered Code Analysis ===\n');
  console.log(`Total uncovered items: ${uncovered.length}\n`);

  // Files with most uncovered code
  const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);

  console.log('Files with most uncovered code:');
  for (const [file, items] of sorted.slice(0, 10)) {
    console.log(`\n${file} (${items.length} items):`);
    const functions = items.filter(i => i.type === 'function');
    const branches = items.filter(i => i.type === 'branch');
    const lines = items.filter(i => i.type === 'line');

    if (functions.length > 0) {
      console.log(`  Functions: ${functions.map(f => f.location).join(', ')}`);
    }
    if (branches.length > 0) {
      console.log(`  Branches: ${branches.length}`);
    }
    if (lines.length > 0) {
      console.log(`  Lines: ${lines.length}`);
    }
  }
}

// Run analysis
analyzeCoverage('./coverage/coverage-final.json');
```

```python
# scripts/coverage_analysis.py
"""Analyze coverage data and generate insights."""
import json
from pathlib import Path
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class UncoveredItem:
    file: str
    line: int
    item_type: str
    name: str = ""


def analyze_coverage(coverage_file: Path) -> None:
    """Analyze coverage JSON file."""
    with open(coverage_file) as f:
        data = json.load(f)

    uncovered = []

    for file_path, file_data in data.items():
        # Find uncovered lines
        missing_lines = file_data.get("missing_lines", [])
        for line in missing_lines:
            uncovered.append(UncoveredItem(
                file=file_path,
                line=line,
                item_type="line",
            ))

        # Find uncovered branches
        missing_branches = file_data.get("missing_branches", [])
        for branch in missing_branches:
            uncovered.append(UncoveredItem(
                file=file_path,
                line=branch[0],
                item_type="branch",
                name=f"branch to line {branch[1]}",
            ))

    # Group by file
    by_file = defaultdict(list)
    for item in uncovered:
        by_file[item.file].append(item)

    print("\n=== Coverage Analysis ===\n")
    print(f"Total uncovered items: {len(uncovered)}\n")

    # Sort by count
    sorted_files = sorted(by_file.items(), key=lambda x: -len(x[1]))

    print("Files with most uncovered code:")
    for file_path, items in sorted_files[:10]:
        lines = [i for i in items if i.item_type == "line"]
        branches = [i for i in items if i.item_type == "branch"]

        print(f"\n{file_path}:")
        print(f"  Lines: {len(lines)}")
        print(f"  Branches: {len(branches)}")

        if lines:
            line_nums = [i.line for i in lines]
            print(f"  Uncovered lines: {format_line_ranges(line_nums)}")


def format_line_ranges(lines: list[int]) -> str:
    """Format line numbers as ranges."""
    if not lines:
        return ""

    lines = sorted(set(lines))
    ranges = []
    start = lines[0]
    end = lines[0]

    for line in lines[1:]:
        if line == end + 1:
            end = line
        else:
            ranges.append(f"{start}-{end}" if start != end else str(start))
            start = end = line

    ranges.append(f"{start}-{end}" if start != end else str(start))
    return ", ".join(ranges)


if __name__ == "__main__":
    analyze_coverage(Path("coverage/coverage.json"))
```

## Coverage Enforcement

```typescript
// scripts/check-coverage.ts
import * as fs from 'fs';

interface CoverageSummary {
  total: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
  [file: string]: {
    lines: { pct: number };
    statements: { pct: number };
    functions: { pct: number };
    branches: { pct: number };
  };
}

interface Thresholds {
  global: ThresholdSet;
  perFile?: Record<string, ThresholdSet>;
}

interface ThresholdSet {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

const thresholds: Thresholds = {
  global: {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 80,
  },
  perFile: {
    'src/services/': {
      lines: 90,
      statements: 90,
      functions: 90,
      branches: 90,
    },
    'src/utils/': {
      lines: 95,
      statements: 95,
      functions: 95,
      branches: 95,
    },
  },
};

function checkCoverage(): boolean {
  const summary: CoverageSummary = JSON.parse(
    fs.readFileSync('coverage/coverage-summary.json', 'utf-8')
  );

  let passed = true;
  const failures: string[] = [];

  // Check global thresholds
  const global = summary.total;
  for (const [metric, threshold] of Object.entries(thresholds.global)) {
    const actual = global[metric as keyof typeof global].pct;
    if (actual < threshold) {
      passed = false;
      failures.push(`Global ${metric}: ${actual.toFixed(1)}% < ${threshold}%`);
    }
  }

  // Check per-file thresholds
  if (thresholds.perFile) {
    for (const [pattern, fileThresholds] of Object.entries(thresholds.perFile)) {
      for (const [file, fileCoverage] of Object.entries(summary)) {
        if (file === 'total' || !file.includes(pattern)) continue;

        for (const [metric, threshold] of Object.entries(fileThresholds)) {
          const actual = fileCoverage[metric as keyof typeof fileCoverage].pct;
          if (actual < threshold) {
            passed = false;
            failures.push(
              `${file} ${metric}: ${actual.toFixed(1)}% < ${threshold}%`
            );
          }
        }
      }
    }
  }

  // Report results
  if (passed) {
    console.log('✅ All coverage thresholds met');
  } else {
    console.log('❌ Coverage thresholds not met:\n');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }

  return passed;
}

checkCoverage();
```

## CI Coverage Integration

```yaml
# .github/workflows/coverage.yml
name: Coverage

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage

      - name: Check coverage thresholds
        run: npm run coverage:check

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const summary = JSON.parse(
              fs.readFileSync('./coverage/coverage-summary.json')
            );
            const total = summary.total;

            const status = (pct) => pct >= 80 ? '✅' : pct >= 60 ? '⚠️' : '❌';

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Coverage Report

              | Metric | Coverage |
              |--------|----------|
              | ${status(total.lines.pct)} Lines | ${total.lines.pct.toFixed(1)}% |
              | ${status(total.statements.pct)} Statements | ${total.statements.pct.toFixed(1)}% |
              | ${status(total.functions.pct)} Functions | ${total.functions.pct.toFixed(1)}% |
              | ${status(total.branches.pct)} Branches | ${total.branches.pct.toFixed(1)}% |
              `
            });
```

## CLAUDE.md Integration

```markdown
# Test Coverage

## Commands
- `npm test -- --coverage` - Run with coverage
- `npm run coverage:check` - Check thresholds
- `npm run coverage:report` - Generate HTML report
- `pytest --cov` - Python coverage

## Thresholds
- Global: 80% all metrics
- Services: 90% all metrics
- Utils: 95% all metrics

## Coverage Types
- Line: Statement execution
- Branch: Decision paths
- Function: Function calls
- Statement: All statements

## Best Practices
- Don't chase 100% coverage
- Focus on critical paths
- Test edge cases thoroughly
- Review uncovered code regularly
```

## AI Suggestions

1. **Coverage trends** - Track coverage over time
2. **Delta coverage** - Coverage on changed files
3. **Coverage gaps** - Identify untested scenarios
4. **Risk-based coverage** - Prioritize critical code
5. **Coverage visualization** - Interactive coverage maps
6. **Coverage prediction** - Estimate coverage for new code
7. **Smart thresholds** - Dynamic thresholds per module
8. **Coverage badges** - README coverage badges
9. **Coverage diff** - PR coverage comparisons
10. **Coverage correlation** - Coverage vs bug density
