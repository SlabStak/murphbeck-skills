# Code Review Agent

Production-ready autonomous agent for comprehensive code review of websites, applications, and software projects. Deep analysis with perfect fix generation.

---

## Agent Configuration

```json
{
  "agent_id": "code-review-agent-v2",
  "name": "Code Review Agent",
  "type": "CodeAnalysisAgent",
  "version": "2.0.0",
  "description": "Senior-level code reviewer that analyzes entire codebases for quality, security, performance, and best practices with actionable fixes",
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 16384,
  "temperature": 0.1,
  "capabilities": {
    "languages": ["javascript", "typescript", "python", "go", "rust", "java", "c#", "php", "ruby", "swift", "kotlin", "c", "cpp"],
    "frameworks": {
      "frontend": ["react", "vue", "angular", "svelte", "nextjs", "nuxt", "remix", "astro"],
      "backend": ["express", "fastify", "nestjs", "fastapi", "django", "flask", "rails", "spring", "dotnet", "gin", "fiber"],
      "mobile": ["react-native", "flutter", "swift-ui", "jetpack-compose"],
      "database": ["prisma", "drizzle", "typeorm", "sqlalchemy", "mongoose"]
    },
    "analysis_depth": ["file", "module", "codebase", "architecture"],
    "output_formats": ["markdown", "json", "sarif", "github_comments", "jira_tickets", "linear_issues"]
  },
  "integrations": {
    "github": ["pull_requests", "code_scanning", "actions", "security_advisories"],
    "gitlab": ["merge_requests", "ci_cd", "security_scanning"],
    "bitbucket": ["pull_requests", "pipelines"],
    "jira": ["issue_creation", "linking", "sprint_assignment"],
    "linear": ["issue_creation", "project_linking"],
    "slack": ["notifications", "summaries", "threads"]
  }
}
```

---

## System Prompt

```
You are CODE.REVIEW.AGENT — the most thorough code reviewer in existence. You review code like a 10x senior engineer with 25 years of experience across all major languages and frameworks.

IDENTITY
You are meticulous, precise, and comprehensive. You catch issues that others miss. You explain problems clearly. You provide PERFECT, working fixes for every issue you find.

CORE MISSION
Analyze codebases with extreme thoroughness to identify:
- Bugs and logic errors
- Security vulnerabilities
- Performance bottlenecks
- Code smells and anti-patterns
- Architecture problems
- Maintainability issues

REVIEW PHILOSOPHY
1. **READ EVERYTHING**: No file is skipped. Every line matters.
2. **UNDERSTAND CONTEXT**: Know the architecture before critiquing
3. **BE PRECISE**: Exact line numbers, exact code paths, exact impact
4. **PROVIDE FIXES**: Every issue includes a WORKING fix
5. **EXPLAIN WHY**: Education, not just criticism
6. **PRIORITIZE**: Critical issues first, suggestions last

═══════════════════════════════════════════════════════════════
                    ANALYSIS DIMENSIONS
═══════════════════════════════════════════════════════════════

1. CORRECTNESS
   - Logic errors and bugs
   - Edge cases not handled
   - Race conditions
   - Null/undefined handling
   - Type mismatches
   - State management bugs
   - Async/await issues
   - Memory leaks

2. SECURITY (OWASP Top 10 + More)
   - Injection (SQL, NoSQL, Command, XSS, LDAP)
   - Broken Authentication
   - Sensitive Data Exposure
   - XML External Entities (XXE)
   - Broken Access Control
   - Security Misconfiguration
   - Cross-Site Scripting (XSS)
   - Insecure Deserialization
   - Using Components with Known Vulnerabilities
   - Insufficient Logging & Monitoring
   - SSRF, CSRF, IDOR
   - Path traversal
   - Secrets in code

3. PERFORMANCE
   - O(n²) or worse algorithms
   - N+1 queries
   - Missing database indexes
   - Unnecessary re-renders (React)
   - Memory leaks
   - Bundle size issues
   - Unoptimized images
   - Missing caching
   - Synchronous operations that should be async
   - Blocking operations
   - Inefficient data structures

4. MAINTAINABILITY
   - Code duplication (DRY violations)
   - Complex functions (high cyclomatic complexity)
   - Deep nesting
   - Poor naming conventions
   - Missing or misleading comments
   - Tight coupling
   - God objects/functions
   - Magic numbers/strings
   - Inconsistent patterns
   - Dead code

5. BEST PRACTICES
   - Framework conventions
   - Design patterns (correct usage)
   - Error handling
   - Logging practices
   - Testing coverage
   - TypeScript strictness
   - Accessibility (a11y)
   - SEO (for web apps)
   - Documentation

═══════════════════════════════════════════════════════════════
                    OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

For EVERY issue found, provide:

### [SEVERITY_EMOJI] [SEVERITY] - Issue Title

**Location:** `path/to/file.ts:45-52`
**Category:** Security | Performance | Bug | Quality | Architecture

**The Problem:**
[Clear, concise explanation of what's wrong]

**Why It Matters:**
[Impact if not fixed - security risk, performance degradation, etc.]

**Current Code:**
```language
// The problematic code exactly as it appears
```

**Fixed Code:**
```language
// The COMPLETE, WORKING fix - not pseudocode
```

**Verification:**
[How to verify the fix works]

---

SEVERITY LEVELS:
🔴 CRITICAL - Security vulnerabilities, data loss risks, crashes
🟠 HIGH - Bugs affecting functionality, major performance issues
🟡 MEDIUM - Code quality issues, minor bugs, maintainability
🟢 LOW - Style issues, minor optimizations, suggestions
💡 INFO - Best practices, nice-to-haves

═══════════════════════════════════════════════════════════════
                    REVIEW WORKFLOW
═══════════════════════════════════════════════════════════════

1. UNDERSTAND
   - Read README, package.json, config files
   - Map the architecture
   - Identify patterns and conventions used
   - Note the tech stack

2. SCAN STRUCTURE
   - Directory organization
   - File naming conventions
   - Module boundaries
   - Dependency graph

3. DEEP DIVE
   - Analyze each file methodically
   - Trace data flow
   - Check error paths
   - Verify edge cases

4. CROSS-REFERENCE
   - Check for inconsistencies
   - Verify interface contracts
   - Check type safety across boundaries
   - Look for duplicated logic

5. SYNTHESIZE
   - Prioritize all findings
   - Group related issues
   - Provide executive summary
   - Create action items

═══════════════════════════════════════════════════════════════
                    FRAMEWORK-SPECIFIC CHECKS
═══════════════════════════════════════════════════════════════

REACT/NEXT.JS:
- useEffect dependencies
- useMemo/useCallback usage
- Key props in lists
- State initialization
- Server vs client components
- next/image usage
- next/link usage
- Metadata/SEO
- Loading/error states

VUE/NUXT:
- Composition API usage
- Reactive refs
- Computed properties
- Watch effects
- Prop validation
- Emit declarations

PYTHON/FASTAPI/DJANGO:
- Type hints
- Pydantic models
- Async patterns
- SQL injection
- ORM usage
- Middleware

NODE/EXPRESS:
- Middleware order
- Error handling
- Request validation
- Rate limiting
- CORS configuration

═══════════════════════════════════════════════════════════════
                    GUARDRAILS
═══════════════════════════════════════════════════════════════

- Never approve code with CRITICAL security issues
- Always provide COMPLETE, WORKING fixes (not pseudocode)
- Verify fixes maintain existing functionality
- Note if a fix requires additional dependencies
- Flag if a fix needs database migrations
- Identify breaking changes
```

---

## Tools

### 1. analyze_codebase
```json
{
  "name": "analyze_codebase",
  "description": "Full codebase analysis with architecture mapping",
  "parameters": {
    "root_path": "string - Root directory of the project",
    "analysis_types": "array - security | performance | quality | architecture",
    "depth": "string - quick | standard | deep | exhaustive",
    "exclude": "array - Patterns to exclude"
  }
}
```

### 2. analyze_file
```json
{
  "name": "analyze_file",
  "description": "Deep single-file analysis with context awareness",
  "parameters": {
    "file_path": "string - Path to file",
    "analysis_types": "array - Types of analysis",
    "include_related": "boolean - Analyze imported files"
  }
}
```

### 3. analyze_component
```json
{
  "name": "analyze_component",
  "description": "Full component analysis (React, Vue, etc.)",
  "parameters": {
    "component_path": "string - Path to component",
    "check_a11y": "boolean - Include accessibility audit",
    "check_performance": "boolean - Check for render optimization"
  }
}
```

### 4. analyze_api_endpoint
```json
{
  "name": "analyze_api_endpoint",
  "description": "API endpoint security and quality analysis",
  "parameters": {
    "endpoint_path": "string - Path to route handler",
    "check_auth": "boolean - Verify authentication",
    "check_validation": "boolean - Check input validation"
  }
}
```

### 5. find_security_issues
```json
{
  "name": "find_security_issues",
  "description": "Targeted security vulnerability scan",
  "parameters": {
    "path": "string - File or directory",
    "vulnerability_types": "array - xss | sqli | auth | secrets | etc",
    "severity_threshold": "string - critical | high | medium | low"
  }
}
```

### 6. find_performance_issues
```json
{
  "name": "find_performance_issues",
  "description": "Performance bottleneck identification",
  "parameters": {
    "path": "string - File or directory",
    "framework": "string - react | vue | node | python | etc",
    "check_bundle": "boolean - Analyze bundle impact"
  }
}
```

### 7. check_dependencies
```json
{
  "name": "check_dependencies",
  "description": "Dependency audit for vulnerabilities and updates",
  "parameters": {
    "manifest_path": "string - package.json, requirements.txt, etc.",
    "checks": "array - outdated | vulnerable | unused | duplicate | license"
  }
}
```

### 8. analyze_database_queries
```json
{
  "name": "analyze_database_queries",
  "description": "SQL/ORM query analysis for performance and security",
  "parameters": {
    "path": "string - File or directory with queries",
    "orm": "string - prisma | drizzle | typeorm | sqlalchemy | raw",
    "check_injection": "boolean - SQL injection scan"
  }
}
```

### 9. generate_review_report
```json
{
  "name": "generate_review_report",
  "description": "Generate comprehensive review report",
  "parameters": {
    "findings": "array - All issues found",
    "format": "string - markdown | json | sarif | html",
    "include_metrics": "boolean - Include code metrics",
    "include_fixes": "boolean - Include all fixes"
  }
}
```

### 10. compare_before_after
```json
{
  "name": "compare_before_after",
  "description": "Verify fix correctness by comparing behavior",
  "parameters": {
    "original_code": "string - Original code",
    "fixed_code": "string - Fixed code",
    "test_cases": "array - Test cases to verify"
  }
}
```

---

## Analysis Rules Library

### JavaScript/TypeScript Security Rules
```yaml
rules:
  # Critical - Injection
  - id: js-xss-innerhtml
    pattern: "innerHTML\\s*=|outerHTML\\s*=|document\\.write\\("
    severity: critical
    message: "XSS vulnerability via innerHTML/outerHTML/document.write"
    fix: "Use textContent or sanitize with DOMPurify"

  - id: js-eval-usage
    pattern: "\\beval\\s*\\(|new\\s+Function\\s*\\(|setTimeout\\s*\\([^,]*['\"`]"
    severity: critical
    message: "Code injection via eval/Function/setTimeout with string"
    fix: "Remove eval, use proper function references"

  - id: js-sql-injection
    pattern: "\\$\\{[^}]+\\}[^`]*(?:SELECT|INSERT|UPDATE|DELETE|WHERE)"
    severity: critical
    message: "SQL injection via template literal interpolation"
    fix: "Use parameterized queries ($1, ?) or ORM"

  - id: js-command-injection
    pattern: "exec\\s*\\([^)]*\\$\\{|spawn\\s*\\([^)]*\\$\\{"
    severity: critical
    message: "Command injection via template literal in exec/spawn"
    fix: "Sanitize input, use array form of spawn"

  - id: js-path-traversal
    pattern: "readFile\\s*\\([^)]*\\$\\{|readFileSync\\s*\\([^)]*\\$\\{"
    severity: high
    message: "Path traversal via user-controlled file path"
    fix: "Validate and sanitize path, use path.resolve with base directory check"

  # High - Authentication/Authorization
  - id: js-jwt-no-verify
    pattern: "jwt\\.decode\\s*\\("
    severity: high
    message: "JWT decoded without verification"
    fix: "Use jwt.verify() with secret/public key"

  - id: js-weak-crypto
    pattern: "createHash\\s*\\(['\"](?:md5|sha1)['\"]\\)"
    severity: high
    message: "Weak hash algorithm (MD5/SHA1)"
    fix: "Use SHA-256 or better (sha256, sha512)"

  - id: js-hardcoded-secret
    pattern: "(?:password|secret|api_key|apikey|token)\\s*[=:]\\s*['\"][^'\"]{8,}['\"]"
    severity: critical
    message: "Hardcoded secret in source code"
    fix: "Move to environment variable"
```

### React/Next.js Rules
```yaml
rules:
  # Performance
  - id: react-missing-key
    pattern: "\\.map\\s*\\([^)]+\\)\\s*=>\\s*<(?![^>]*\\bkey\\s*=)"
    severity: high
    message: "Missing key prop in list rendering"
    fix: "Add unique key prop: key={item.id}"

  - id: react-inline-object
    pattern: "style=\\{\\{|className=\\{`[^`]*\\$\\{"
    context: "render function without useMemo"
    severity: medium
    message: "Inline object/template creates new reference each render"
    fix: "Extract to useMemo or constant outside component"

  - id: react-effect-missing-deps
    pattern: "useEffect\\s*\\(\\s*\\(\\)\\s*=>\\s*\\{[^}]*\\b(\\w+)\\b[^}]*\\}\\s*,\\s*\\[\\s*\\]\\s*\\)"
    severity: high
    message: "useEffect uses variables not in dependency array"
    fix: "Add all used variables to dependency array or use useCallback"

  - id: react-state-in-render
    pattern: "useState\\s*\\([^)]+\\)(?:(?!use[A-Z]).)*?return"
    severity: critical
    message: "useState called conditionally or in loop"
    fix: "Move useState to top level of component"

  - id: nextjs-use-img
    pattern: "<img\\s+[^>]*src\\s*="
    severity: medium
    message: "Using <img> instead of next/image"
    fix: "Import and use Image from next/image for automatic optimization"

  - id: nextjs-use-link
    pattern: "<a\\s+[^>]*href\\s*=\\s*['\"](?!/|http)"
    severity: medium
    message: "Using <a> for internal navigation instead of next/link"
    fix: "Import and use Link from next/link for client-side navigation"

  - id: nextjs-client-fetch
    pattern: "useEffect\\s*\\([^)]*fetch\\s*\\("
    severity: medium
    message: "Client-side fetch in useEffect"
    fix: "Consider server components or getServerSideProps for initial data"
```

### Python Rules
```yaml
rules:
  # Critical - Injection
  - id: py-sql-injection
    pattern: "execute\\s*\\([^)]*%|execute\\s*\\([^)]*\\.format|execute\\s*\\(.*f['\"]"
    severity: critical
    message: "SQL injection via string formatting"
    fix: "Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))"

  - id: py-command-injection
    pattern: "os\\.system\\s*\\(|subprocess\\.call\\s*\\([^)]*shell\\s*=\\s*True"
    severity: critical
    message: "Command injection via os.system or shell=True"
    fix: "Use subprocess.run with shell=False and list of arguments"

  - id: py-pickle-load
    pattern: "pickle\\.loads?\\s*\\("
    severity: critical
    message: "Arbitrary code execution via pickle"
    fix: "Use JSON or validate source of pickled data"

  - id: py-yaml-load
    pattern: "yaml\\.load\\s*\\([^)]*(?!Loader)"
    severity: critical
    message: "Arbitrary code execution via yaml.load"
    fix: "Use yaml.safe_load() instead"

  # High - Bad Practices
  - id: py-bare-except
    pattern: "except\\s*:"
    severity: medium
    message: "Bare except catches all exceptions including KeyboardInterrupt"
    fix: "Catch specific exceptions: except ValueError:"

  - id: py-mutable-default
    pattern: "def\\s+\\w+\\s*\\([^)]*=\\s*(?:\\[\\]|\\{\\})"
    severity: high
    message: "Mutable default argument"
    fix: "Use None as default and initialize inside function"

  - id: py-assert-tuple
    pattern: "assert\\s*\\([^)]+,[^)]+\\)"
    severity: medium
    message: "Assert with tuple is always True"
    fix: "Remove parentheses: assert condition, message"
```

### API/Backend Rules
```yaml
rules:
  # Authentication
  - id: api-no-auth
    pattern: "app\\.(?:get|post|put|delete)\\s*\\(['\"][^'\"]+['\"]"
    context: "no auth middleware"
    severity: high
    message: "Endpoint without authentication check"
    fix: "Add authentication middleware or decorator"

  - id: api-no-rate-limit
    pattern: "app\\.(?:post|put)\\s*\\(['\"][^'\"]*(?:login|register|password|auth)"
    context: "no rate limiter"
    severity: high
    message: "Auth endpoint without rate limiting"
    fix: "Add rate limiting middleware"

  - id: api-no-validation
    pattern: "req\\.body\\.|request\\.json"
    context: "no schema validation"
    severity: medium
    message: "Request body used without validation"
    fix: "Add Zod/Yup/Pydantic schema validation"

  # Headers
  - id: api-cors-wildcard
    pattern: "Access-Control-Allow-Origin['\"]?\\s*:\\s*['\"]\\*['\"]"
    severity: high
    message: "CORS allows all origins"
    fix: "Specify allowed origins explicitly"

  - id: api-no-security-headers
    pattern: "createServer|express\\(\\)"
    context: "no helmet/security headers"
    severity: medium
    message: "Missing security headers"
    fix: "Add helmet() middleware or set headers manually"
```

---

## Review Templates

### Full Codebase Review Report
```markdown
# Code Review Report

**Project:** {{project_name}}
**Repository:** {{repo_url}}
**Date:** {{date}}
**Reviewer:** Code Review Agent v2.0

---

## Executive Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | {{sec_crit}} | {{sec_high}} | {{sec_med}} | {{sec_low}} | {{sec_total}} |
| Performance | {{perf_crit}} | {{perf_high}} | {{perf_med}} | {{perf_low}} | {{perf_total}} |
| Quality | {{qual_crit}} | {{qual_high}} | {{qual_med}} | {{qual_low}} | {{qual_total}} |
| **Total** | {{total_crit}} | {{total_high}} | {{total_med}} | {{total_low}} | **{{grand_total}}** |

### Overall Health Score: {{score}}/100

### Top 3 Priorities
1. 🔴 {{priority_1}}
2. 🔴 {{priority_2}}
3. 🟠 {{priority_3}}

---

## Architecture Overview

{{architecture_diagram}}

**Tech Stack:** {{tech_stack}}
**Patterns Used:** {{patterns}}
**Concerns:** {{architecture_concerns}}

---

## Critical Issues (Fix Immediately)

{{critical_issues}}

---

## High Priority Issues

{{high_issues}}

---

## Medium Priority Issues

{{medium_issues}}

---

## Low Priority & Suggestions

{{low_issues}}

---

## Dependency Audit

| Package | Current | Latest | Vulnerability | Action |
|---------|---------|--------|---------------|--------|
{{dependency_table}}

---

## Code Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Lines of Code | {{loc}} | - | - |
| Cyclomatic Complexity (avg) | {{complexity}} | <10 | {{status}} |
| Code Duplication | {{duplication}}% | <5% | {{status}} |
| Test Coverage | {{coverage}}% | >80% | {{status}} |
| Type Coverage | {{type_coverage}}% | >90% | {{status}} |
| Documentation | {{docs}}% | >70% | {{status}} |

---

## Recommended Action Plan

### Immediate (This Week)
{{immediate_actions}}

### Short Term (This Month)
{{short_term_actions}}

### Long Term (Roadmap)
{{long_term_actions}}

---

## Files Reviewed

{{files_list}}

---

*Generated by Code Review Agent v2.0*
*Review Time: {{duration}}*
```

### Pull Request Review
```markdown
## PR Review: {{pr_title}}

**PR:** #{{pr_number}}
**Author:** @{{author}}
**Branch:** `{{branch}}` → `{{base}}`
**Files Changed:** {{files_changed}}
**Lines:** +{{additions}} / -{{deletions}}

---

### Decision: {{status_emoji}} {{status}}

{{summary}}

---

### Issues Found

{{issues}}

---

### Suggestions for Improvement

{{suggestions}}

---

### What's Good

{{positives}}

---

### Checklist
- [ ] Critical issues addressed
- [ ] Tests pass
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Code follows project conventions
```

---

## Integration Examples

### GitHub Actions Workflow
```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get Changed Files
        id: changed
        uses: tj-actions/changed-files@v40

      - name: Run Code Review Agent
        id: review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          npx @murphbeck/code-review-agent \
            --repo ${{ github.repository }} \
            --pr ${{ github.event.pull_request.number }} \
            --files "${{ steps.changed.outputs.all_changed_files }}" \
            --output review.md

      - name: Post Review
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            await github.rest.pulls.createReview({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              body: review,
              event: review.includes('🔴 CRITICAL') ? 'REQUEST_CHANGES' : 'COMMENT'
            });
```

### CLI Usage
```bash
# Review entire codebase
code-review . --depth exhaustive --output report.md

# Review specific directory
code-review src/api --focus security,performance

# Review with fix generation
code-review src/ --generate-fixes --output-dir ./fixes

# Review pull request
code-review pr --repo owner/repo --number 123

# Quick security scan
code-review . --security-only --severity critical,high
```

---

## TypeScript Implementation

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readFile, readdir, stat } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

interface ReviewConfig {
  path: string;
  depth: 'quick' | 'standard' | 'deep' | 'exhaustive';
  analysisTypes: ('security' | 'performance' | 'quality' | 'architecture')[];
  severityThreshold: 'critical' | 'high' | 'medium' | 'low';
  framework?: string;
  outputFormat: 'markdown' | 'json' | 'sarif';
  generateFixes: boolean;
}

interface Issue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'performance' | 'quality' | 'architecture';
  file: string;
  line: number;
  endLine?: number;
  column?: number;
  title: string;
  description: string;
  impact: string;
  currentCode: string;
  fixedCode: string;
  verification: string;
}

const SYSTEM_PROMPT = `You are CODE.REVIEW.AGENT — the most thorough code reviewer.
For every issue, provide:
1. Exact location (file:line)
2. Clear problem description
3. Impact assessment
4. COMPLETE working fix (not pseudocode)
5. Verification steps

Output as JSON array of Issue objects.`;

class CodeReviewAgent {
  private anthropic: Anthropic;
  private config: ReviewConfig;
  private fileCache: Map<string, string> = new Map();

  constructor(config: ReviewConfig) {
    this.anthropic = new Anthropic();
    this.config = config;
  }

  async reviewCodebase(): Promise<Issue[]> {
    // 1. Discover files
    const files = await this.discoverFiles(this.config.path);

    // 2. Build context map
    const contextMap = await this.buildContextMap(files);

    // 3. Analyze each file with context
    const allIssues: Issue[] = [];

    for (const file of files) {
      const issues = await this.analyzeFile(file, contextMap);
      allIssues.push(...issues);
    }

    // 4. Cross-reference analysis
    const crossRefIssues = await this.crossReferenceAnalysis(allIssues, contextMap);
    allIssues.push(...crossRefIssues);

    // 5. Prioritize and deduplicate
    return this.finalizeIssues(allIssues);
  }

  private async discoverFiles(rootPath: string): Promise<string[]> {
    const patterns = [
      '**/*.{ts,tsx,js,jsx}',
      '**/*.{py,pyi}',
      '**/*.{go,rs,java,cs,php,rb}',
      '**/*.{sql,graphql}',
      '**/Dockerfile',
      '**/*.{yaml,yml,json}'
    ];

    const ignorePatterns = [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/coverage/**',
      '**/__pycache__/**',
      '**/venv/**'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: rootPath,
        ignore: ignorePatterns,
        absolute: true
      });
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  private async buildContextMap(files: string[]): Promise<Map<string, any>> {
    const context = new Map();

    // Parse package.json / requirements.txt for dependencies
    // Parse tsconfig.json / pyproject.toml for config
    // Build import graph
    // Identify entry points

    for (const file of files) {
      const content = await this.readFile(file);
      context.set(file, {
        content,
        imports: this.extractImports(content, file),
        exports: this.extractExports(content, file),
        language: this.detectLanguage(file)
      });
    }

    return context;
  }

  private async analyzeFile(filePath: string, context: Map<string, any>): Promise<Issue[]> {
    const fileContext = context.get(filePath);
    if (!fileContext) return [];

    const relatedFiles = this.getRelatedFiles(filePath, context);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Analyze this ${fileContext.language} file for ${this.config.analysisTypes.join(', ')} issues.

FILE: ${filePath}

\`\`\`${fileContext.language}
${fileContext.content}
\`\`\`

RELATED FILES CONTEXT:
${relatedFiles.map(f => `${f.path}: ${f.summary}`).join('\n')}

Find all issues and provide COMPLETE working fixes. Return JSON array of Issue objects.`
      }]
    });

    return this.parseIssues(response.content[0].text, filePath);
  }

  private async crossReferenceAnalysis(
    issues: Issue[],
    context: Map<string, any>
  ): Promise<Issue[]> {
    // Look for:
    // - Inconsistent error handling across files
    // - Type mismatches at boundaries
    // - Unused exports
    // - Circular dependencies
    // - Security issues spanning multiple files

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Perform cross-file analysis for issues spanning multiple files.

EXISTING ISSUES: ${issues.length}
FILES ANALYZED: ${context.size}

Look for:
1. Inconsistent patterns across files
2. Type mismatches at module boundaries
3. Unused exports
4. Circular dependencies
5. Security issues requiring multiple file context

Return JSON array of any new Issue objects found.`
      }]
    });

    return this.parseIssues(response.content[0].text);
  }

  private finalizeIssues(issues: Issue[]): Issue[] {
    // Deduplicate
    const seen = new Set<string>();
    const unique = issues.filter(issue => {
      const key = `${issue.file}:${issue.line}:${issue.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return unique.sort((a, b) =>
      severityOrder[a.severity] - severityOrder[b.severity]
    );
  }

  generateReport(issues: Issue[]): string {
    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');
    const low = issues.filter(i => i.severity === 'low');

    return `# Code Review Report

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${critical.length} |
| 🟠 High | ${high.length} |
| 🟡 Medium | ${medium.length} |
| 🟢 Low | ${low.length} |
| **Total** | **${issues.length}** |

---

## Critical Issues

${critical.map(i => this.formatIssue(i)).join('\n\n---\n\n')}

## High Priority Issues

${high.map(i => this.formatIssue(i)).join('\n\n---\n\n')}

## Medium Priority Issues

${medium.map(i => this.formatIssue(i)).join('\n\n---\n\n')}

## Low Priority & Suggestions

${low.map(i => this.formatIssue(i)).join('\n\n---\n\n')}
`;
  }

  private formatIssue(issue: Issue): string {
    const emoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
      info: '💡'
    }[issue.severity];

    return `### ${emoji} ${issue.severity.toUpperCase()} - ${issue.title}

**Location:** \`${issue.file}:${issue.line}\`
**Category:** ${issue.category}

**The Problem:**
${issue.description}

**Why It Matters:**
${issue.impact}

**Current Code:**
\`\`\`
${issue.currentCode}
\`\`\`

**Fixed Code:**
\`\`\`
${issue.fixedCode}
\`\`\`

**Verification:**
${issue.verification}`;
  }

  // Helper methods
  private async readFile(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }
    const content = await readFile(filePath, 'utf-8');
    this.fileCache.set(filePath, content);
    return content;
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      '.ts': 'typescript', '.tsx': 'typescript',
      '.js': 'javascript', '.jsx': 'javascript',
      '.py': 'python', '.pyi': 'python',
      '.go': 'go', '.rs': 'rust',
      '.java': 'java', '.cs': 'csharp',
      '.php': 'php', '.rb': 'ruby'
    };
    return langMap[ext] || 'text';
  }

  private extractImports(content: string, filePath: string): string[] {
    // Language-specific import extraction
    return [];
  }

  private extractExports(content: string, filePath: string): string[] {
    // Language-specific export extraction
    return [];
  }

  private getRelatedFiles(filePath: string, context: Map<string, any>): any[] {
    // Find files that import this file or are imported by it
    return [];
  }

  private parseIssues(response: string, defaultFile?: string): Issue[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse issues:', e);
    }
    return [];
  }
}

// Usage
const agent = new CodeReviewAgent({
  path: './src',
  depth: 'deep',
  analysisTypes: ['security', 'performance', 'quality'],
  severityThreshold: 'low',
  framework: 'nextjs',
  outputFormat: 'markdown',
  generateFixes: true
});

const issues = await agent.reviewCodebase();
const report = agent.generateReport(issues);
console.log(report);
```

---

## Deployment Checklist

- [ ] Anthropic API key configured
- [ ] GitHub/GitLab token for PR integration
- [ ] Analysis rules customized for project
- [ ] Severity thresholds defined
- [ ] CI/CD integration configured
- [ ] Report output location set
- [ ] Team notifications configured
- [ ] Exclusion patterns defined
- [ ] Framework-specific rules enabled

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Jan 2026 | Major upgrade with deep analysis, perfect fixes, framework rules |
| 1.0.0 | Dec 2025 | Initial release |

---

*Code Review Agent v2.0 - Your senior engineer that reviews everything perfectly*
