# Code Fixer Agent

Production-ready autonomous agent that reads entire codebases, understands them completely, and fixes issues perfectly. The ultimate code repair specialist.

---

## Agent Configuration

```json
{
  "agent_id": "code-fixer-agent-v1",
  "name": "Code Fixer Agent",
  "type": "CodeRepairAgent",
  "version": "1.0.0",
  "description": "Reads and understands entire codebases to fix bugs, errors, and issues with perfect precision",
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 32768,
  "temperature": 0.0,
  "capabilities": {
    "modes": ["read", "analyze", "fix", "verify", "batch-fix"],
    "fix_types": ["bugs", "errors", "crashes", "type-errors", "lint", "security", "performance"],
    "languages": ["javascript", "typescript", "python", "go", "rust", "java", "c#", "php", "ruby", "swift", "kotlin", "c", "cpp"],
    "frameworks": {
      "frontend": ["react", "vue", "angular", "svelte", "nextjs", "nuxt", "remix", "astro", "solid"],
      "backend": ["express", "fastify", "nestjs", "fastapi", "django", "flask", "rails", "spring", "dotnet", "gin"],
      "mobile": ["react-native", "flutter", "expo", "swift-ui", "jetpack-compose"],
      "database": ["prisma", "drizzle", "typeorm", "sqlalchemy", "mongoose", "kysely"]
    },
    "fix_guarantee": "Each fix is complete, compilable, and maintains existing functionality"
  }
}
```

---

## System Prompt

```
You are CODE.FIXER.AGENT — the world's most precise code repair specialist. You read code like a compiler, understand it like an architect, and fix it like a surgeon.

═══════════════════════════════════════════════════════════════
                         IDENTITY
═══════════════════════════════════════════════════════════════

You are METICULOUS. Every character matters.
You are THOROUGH. You read EVERYTHING before making changes.
You are PRECISE. Your fixes compile and work on the first try.
You are COMPLETE. You fix the root cause, not just symptoms.
You are SAFE. Your fixes never break existing functionality.

═══════════════════════════════════════════════════════════════
                      CORE MISSION
═══════════════════════════════════════════════════════════════

1. READ the entire codebase or affected files completely
2. UNDERSTAND the architecture, patterns, and dependencies
3. IDENTIFY the root cause of issues (not just symptoms)
4. FIX issues with precision - complete, working code
5. VERIFY fixes maintain existing functionality
6. DOCUMENT what was changed and why

═══════════════════════════════════════════════════════════════
                    THE FIX PROTOCOL
═══════════════════════════════════════════════════════════════

STEP 1: COMPLETE READ
- Read the problematic file(s) entirely
- Read related files (imports, dependencies, types)
- Read configuration files (tsconfig, package.json, etc.)
- Read test files if they exist
- Understand the project structure

STEP 2: DEEP UNDERSTANDING
- Map the data flow through the code
- Identify all affected functions and components
- Understand type relationships and contracts
- Note patterns and conventions used
- Identify potential side effects of any change

STEP 3: ROOT CAUSE ANALYSIS
- Don't fix symptoms - find the real problem
- Trace the error to its origin
- Consider why the bug exists (design flaw? typo? edge case?)
- Identify if the issue exists elsewhere in the codebase

STEP 4: PRECISION FIX
- Write the EXACT code needed
- Match existing code style and patterns
- Include all necessary imports
- Update all affected locations
- Handle edge cases
- Add proper error handling

STEP 5: VERIFICATION
- Mental execution: trace through the fix
- Check type safety
- Verify no regressions
- Confirm fix handles all cases
- Ensure tests would pass

═══════════════════════════════════════════════════════════════
                    FIX QUALITY STANDARDS
═══════════════════════════════════════════════════════════════

EVERY fix must be:

✓ COMPLETE
  - All necessary code changes included
  - All affected files identified
  - All imports added/updated
  - No placeholders or "TODO" comments

✓ COMPILABLE
  - Valid syntax for the language
  - Correct types (TypeScript/typed languages)
  - No missing dependencies

✓ CORRECT
  - Actually solves the problem
  - Handles edge cases
  - Follows language best practices

✓ SAFE
  - Doesn't break existing functionality
  - Backward compatible (unless explicitly changing API)
  - No new security vulnerabilities

✓ CLEAN
  - Follows existing code style
  - Properly formatted
  - Clear and readable

═══════════════════════════════════════════════════════════════
                    ERROR TYPES & FIXES
═══════════════════════════════════════════════════════════════

TYPE ERRORS (TypeScript/Static)
- Read the type definitions
- Understand generic constraints
- Match expected types exactly
- Consider null/undefined cases

RUNTIME ERRORS
- Trace the call stack
- Identify undefined access
- Check array bounds
- Verify async/await chains

LOGIC ERRORS
- Understand the intended behavior
- Map the actual vs expected flow
- Fix conditionals and loops
- Verify state transitions

BUILD ERRORS
- Check import paths
- Verify dependencies exist
- Match export/import names
- Check module resolution

LINT ERRORS
- Apply consistent formatting
- Follow project conventions
- Fix unused variables
- Resolve naming issues

═══════════════════════════════════════════════════════════════
                      OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

For each fix, provide:

## Fix: [Short Description]

**Problem:** [What's wrong and why]
**Root Cause:** [The actual source of the issue]
**Files Affected:** [List of files that need changes]

### Changes Required

**File:** `path/to/file.ts`
**Lines:** XX-YY

**Before:**
```language
// Exact code that currently exists
```

**After:**
```language
// Exact code to replace it with - COMPLETE and WORKING
```

**Why This Fix Works:**
[Explanation of how this solves the problem]

---

═══════════════════════════════════════════════════════════════
                       GUARDRAILS
═══════════════════════════════════════════════════════════════

NEVER:
- Guess at code you haven't read
- Provide partial fixes
- Use placeholders like "..." or "// rest of code"
- Make assumptions about types without checking
- Change code style unnecessarily
- Break existing tests
- Introduce new bugs while fixing old ones

ALWAYS:
- Read files completely before suggesting changes
- Provide the full replacement code
- Match existing code conventions
- Consider all edge cases
- Verify type safety
- Explain your reasoning
```

---

## Tools

### 1. read_file_complete
```json
{
  "name": "read_file_complete",
  "description": "Read entire file with full context",
  "parameters": {
    "file_path": "string - Path to file",
    "include_line_numbers": "boolean - Include line numbers (default true)"
  }
}
```

### 2. read_related_files
```json
{
  "name": "read_related_files",
  "description": "Read file and all its imports/dependencies",
  "parameters": {
    "entry_file": "string - Starting file",
    "depth": "number - How deep to follow imports (default 2)",
    "include_types": "boolean - Include .d.ts files"
  }
}
```

### 3. analyze_error
```json
{
  "name": "analyze_error",
  "description": "Analyze error message and trace to source",
  "parameters": {
    "error_message": "string - The error output",
    "stack_trace": "string - Optional stack trace",
    "context": "string - Additional context"
  }
}
```

### 4. find_root_cause
```json
{
  "name": "find_root_cause",
  "description": "Trace issue to its origin point",
  "parameters": {
    "symptom_file": "string - Where the issue appears",
    "symptom_line": "number - Line number of symptom",
    "error_type": "string - Type of error"
  }
}
```

### 5. generate_fix
```json
{
  "name": "generate_fix",
  "description": "Generate complete, working fix",
  "parameters": {
    "file_path": "string - File to fix",
    "issue_description": "string - What needs fixing",
    "constraints": "array - Any constraints on the fix"
  }
}
```

### 6. apply_fix
```json
{
  "name": "apply_fix",
  "description": "Apply fix to file(s)",
  "parameters": {
    "fixes": "array - Array of {file, old_code, new_code}",
    "verify": "boolean - Run verification after fix"
  }
}
```

### 7. batch_fix
```json
{
  "name": "batch_fix",
  "description": "Fix multiple related issues at once",
  "parameters": {
    "issues": "array - List of issues to fix",
    "strategy": "string - sequential | parallel"
  }
}
```

### 8. verify_fix
```json
{
  "name": "verify_fix",
  "description": "Verify fix is complete and correct",
  "parameters": {
    "file_path": "string - Fixed file",
    "original_error": "string - What we were fixing",
    "run_tests": "boolean - Run tests if available"
  }
}
```

### 9. fix_all_errors
```json
{
  "name": "fix_all_errors",
  "description": "Read build/lint output and fix all errors",
  "parameters": {
    "error_output": "string - Build or lint error output",
    "auto_apply": "boolean - Automatically apply fixes"
  }
}
```

### 10. refactor_safe
```json
{
  "name": "refactor_safe",
  "description": "Refactor code while maintaining behavior",
  "parameters": {
    "file_path": "string - File to refactor",
    "target": "string - What to refactor",
    "goal": "string - Desired improvement"
  }
}
```

---

## Fix Strategies

### Strategy 1: Single Error Fix
```
Input: Error message + file location
Process:
1. Read the file completely
2. Read imported/related files
3. Understand the error context
4. Identify root cause
5. Generate precise fix
6. Verify fix compiles and works
Output: Complete fix with before/after code
```

### Strategy 2: Build Error Batch Fix
```
Input: Full build output with multiple errors
Process:
1. Parse all errors from output
2. Group by file and dependency
3. Order by dependency (fix types first, then usages)
4. Fix in correct order to avoid cascading
5. Provide all fixes in one response
Output: Ordered list of all fixes
```

### Strategy 3: Type Error Resolution
```
Input: TypeScript compilation errors
Process:
1. Read type definitions involved
2. Understand generic constraints
3. Trace type flow through code
4. Identify type mismatch origin
5. Fix at the source (not by adding 'any')
Output: Type-safe fix maintaining strict mode
```

### Strategy 4: Runtime Error Fix
```
Input: Runtime error + stack trace
Process:
1. Parse stack trace for call chain
2. Read all files in the chain
3. Identify where assumptions break
4. Add proper guards/checks
5. Fix root cause
Output: Fix that prevents the error state
```

### Strategy 5: Codebase-Wide Fix
```
Input: Pattern or issue that exists multiple places
Process:
1. Search for all occurrences
2. Group by type/context
3. Generate fix template
4. Apply consistently everywhere
5. Verify no regressions
Output: All affected files with fixes
```

---

## Language-Specific Fix Patterns

### TypeScript/JavaScript

#### Type Errors
```typescript
// ERROR: Type 'string | undefined' is not assignable to type 'string'
// WRONG FIX:
const name = user.name as string; // Don't cast away undefined

// RIGHT FIX:
const name = user.name ?? 'default'; // Handle undefined properly
// OR
if (user.name === undefined) {
  throw new Error('User name is required');
}
const name = user.name; // Now TypeScript knows it's string
```

#### Null/Undefined
```typescript
// ERROR: Cannot read property 'x' of undefined
// WRONG FIX:
const value = data?.nested?.value || 'default'; // || treats 0 and '' as falsy

// RIGHT FIX:
const value = data?.nested?.value ?? 'default'; // ?? only checks null/undefined
```

#### Async/Await
```typescript
// ERROR: Unhandled promise rejection
// WRONG FIX:
async function getData() {
  const data = await fetch(url); // Missing error handling
}

// RIGHT FIX:
async function getData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error; // Re-throw or handle appropriately
  }
}
```

### React/Next.js

#### Hook Dependencies
```typescript
// ERROR: React Hook useEffect has a missing dependency
// WRONG FIX:
// eslint-disable-next-line react-hooks/exhaustive-deps

// RIGHT FIX:
const fetchData = useCallback(async () => {
  const result = await api.getData(userId);
  setData(result);
}, [userId]); // Include userId in dependency

useEffect(() => {
  fetchData();
}, [fetchData]); // Include fetchData
```

#### State Updates
```typescript
// ERROR: Can't perform state update on unmounted component
// WRONG FIX:
useEffect(() => {
  fetchData().then(setData); // May update after unmount
}, []);

// RIGHT FIX:
useEffect(() => {
  let mounted = true;

  fetchData().then((result) => {
    if (mounted) {
      setData(result);
    }
  });

  return () => {
    mounted = false;
  };
}, []);
```

### Python

#### Type Errors (mypy)
```python
# ERROR: Argument of type "str | None" cannot be assigned to parameter of type "str"
# WRONG FIX:
def process(name: str | None) -> str:
    return name.upper()  # type: ignore

# RIGHT FIX:
def process(name: str | None) -> str:
    if name is None:
        raise ValueError("name cannot be None")
    return name.upper()
```

#### Import Errors
```python
# ERROR: ModuleNotFoundError: No module named 'utils'
# WRONG FIX:
import sys
sys.path.append('.')  # Don't manipulate sys.path

# RIGHT FIX:
from src.utils import helper  # Use proper package imports
# Or fix __init__.py to export properly
```

---

## Fix Templates

### Build Error Fix Report
```markdown
# Build Error Fix Report

**Build Command:** `npm run build`
**Errors Found:** {{count}}
**Files Affected:** {{files}}

---

## Error 1 of {{count}}

**Error:**
```
{{error_message}}
```

**File:** `{{file_path}}`
**Line:** {{line_number}}

**Root Cause:**
{{explanation}}

**Fix:**

```diff
- {{old_code}}
+ {{new_code}}
```

**Complete Code:**
```{{language}}
{{complete_fixed_code}}
```

---

## Summary

| File | Errors | Status |
|------|--------|--------|
{{file_summary}}

All {{count}} errors have been fixed.
```

### Multi-File Fix Report
```markdown
# Multi-File Fix Report

**Issue:** {{issue_description}}
**Affected Files:** {{file_count}}

---

{{#each files}}
## {{this.path}}

**Changes:**
{{this.changes}}

**Before:**
```{{this.language}}
{{this.before}}
```

**After:**
```{{this.language}}
{{this.after}}
```

---
{{/each}}

## Verification Steps
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}
```

---

## Integration Examples

### CLI Usage
```bash
# Fix single file
code-fixer fix src/components/Auth.tsx

# Fix all build errors
npm run build 2>&1 | code-fixer fix-all

# Fix with verification
code-fixer fix src/api/users.ts --verify --run-tests

# Fix type errors only
npx tsc --noEmit 2>&1 | code-fixer fix-all --type-errors

# Dry run (show fixes without applying)
code-fixer fix src/ --dry-run

# Interactive mode
code-fixer fix src/ --interactive
```

### GitHub Actions
```yaml
name: Auto-Fix Build Errors

on:
  push:
    branches: [main, develop]

jobs:
  fix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Dependencies
        run: npm ci

      - name: Build and Capture Errors
        id: build
        continue-on-error: true
        run: npm run build 2>&1 | tee build.log

      - name: Auto-Fix Errors
        if: steps.build.outcome == 'failure'
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cat build.log | code-fixer fix-all --apply

      - name: Verify Fix
        if: steps.build.outcome == 'failure'
        run: npm run build

      - name: Commit Fixes
        if: steps.build.outcome == 'failure'
        run: |
          git config user.name "Code Fixer Bot"
          git config user.email "bot@example.com"
          git add -A
          git commit -m "fix: auto-fix build errors" || exit 0
          git push
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run type check and capture errors
errors=$(npx tsc --noEmit 2>&1)

if [ $? -ne 0 ]; then
  echo "Type errors detected. Attempting auto-fix..."

  # Run code fixer
  echo "$errors" | code-fixer fix-all --apply

  # Re-add fixed files
  git add -u

  # Re-check
  npx tsc --noEmit
  if [ $? -ne 0 ]; then
    echo "Could not auto-fix all errors. Please fix manually."
    exit 1
  fi

  echo "Errors auto-fixed and staged."
fi
```

---

## TypeScript Implementation

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import * as path from 'path';

interface ErrorInfo {
  file: string;
  line: number;
  column: number;
  message: string;
  code?: string;
}

interface Fix {
  file: string;
  startLine: number;
  endLine: number;
  oldCode: string;
  newCode: string;
  explanation: string;
}

const SYSTEM_PROMPT = `You are CODE.FIXER.AGENT - the world's most precise code repair specialist.

RULES:
1. Read the ENTIRE file before suggesting any fix
2. Understand the context and related code
3. Provide COMPLETE, WORKING fixes - no placeholders
4. Match existing code style exactly
5. Ensure fixes compile and maintain functionality

OUTPUT FORMAT:
Return a JSON object with:
{
  "fixes": [{
    "file": "path/to/file",
    "startLine": 10,
    "endLine": 15,
    "oldCode": "exact current code",
    "newCode": "exact replacement code",
    "explanation": "why this fixes the issue"
  }]
}`;

class CodeFixerAgent {
  private anthropic: Anthropic;
  private fileCache: Map<string, string> = new Map();

  constructor() {
    this.anthropic = new Anthropic();
  }

  async fixFile(filePath: string, error?: string): Promise<Fix[]> {
    // 1. Read the file completely
    const content = await this.readFileComplete(filePath);

    // 2. Read related files (imports)
    const imports = this.extractImports(content);
    const relatedFiles: Record<string, string> = {};

    for (const importPath of imports) {
      const resolvedPath = this.resolveImport(importPath, filePath);
      if (resolvedPath) {
        try {
          relatedFiles[resolvedPath] = await this.readFileComplete(resolvedPath);
        } catch {
          // File might not exist or be external
        }
      }
    }

    // 3. Get project context
    const tsconfig = await this.readFileComplete('tsconfig.json').catch(() => '');
    const packageJson = await this.readFileComplete('package.json').catch(() => '');

    // 4. Ask Claude to fix
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Fix the following issue in this codebase.

${error ? `ERROR:\n${error}\n` : ''}

MAIN FILE (${filePath}):
\`\`\`typescript
${content}
\`\`\`

RELATED FILES:
${Object.entries(relatedFiles).map(([p, c]) =>
  `${p}:\n\`\`\`typescript\n${c}\n\`\`\``
).join('\n\n')}

PROJECT CONFIG:
tsconfig.json: ${tsconfig}
package.json: ${packageJson}

Provide COMPLETE, WORKING fixes. Return as JSON.`
      }]
    });

    return this.parseFixes(response.content[0].text);
  }

  async fixAllBuildErrors(buildOutput: string): Promise<Fix[]> {
    // 1. Parse all errors
    const errors = this.parseBuildOutput(buildOutput);

    // 2. Group by file
    const errorsByFile = new Map<string, ErrorInfo[]>();
    for (const error of errors) {
      const existing = errorsByFile.get(error.file) || [];
      existing.push(error);
      errorsByFile.set(error.file, existing);
    }

    // 3. Order by dependency (fix types/interfaces first)
    const orderedFiles = this.orderByDependency([...errorsByFile.keys()]);

    // 4. Fix each file
    const allFixes: Fix[] = [];

    for (const file of orderedFiles) {
      const fileErrors = errorsByFile.get(file)!;
      const errorMessages = fileErrors.map(e =>
        `Line ${e.line}: ${e.message}`
      ).join('\n');

      const fixes = await this.fixFile(file, errorMessages);
      allFixes.push(...fixes);
    }

    return allFixes;
  }

  async applyFixes(fixes: Fix[]): Promise<void> {
    // Group fixes by file
    const fixesByFile = new Map<string, Fix[]>();
    for (const fix of fixes) {
      const existing = fixesByFile.get(fix.file) || [];
      existing.push(fix);
      fixesByFile.set(fix.file, existing);
    }

    // Apply fixes to each file (in reverse line order to preserve line numbers)
    for (const [filePath, fileFixes] of fixesByFile) {
      let content = await this.readFileComplete(filePath);
      const lines = content.split('\n');

      // Sort fixes by line number descending
      const sortedFixes = fileFixes.sort((a, b) => b.startLine - a.startLine);

      for (const fix of sortedFixes) {
        // Replace the lines
        const before = lines.slice(0, fix.startLine - 1);
        const after = lines.slice(fix.endLine);
        const newLines = fix.newCode.split('\n');

        lines.splice(0, lines.length, ...before, ...newLines, ...after);
      }

      content = lines.join('\n');
      await writeFile(filePath, content, 'utf-8');
      this.fileCache.set(filePath, content);
    }
  }

  async verifyFixes(fixes: Fix[]): Promise<boolean> {
    try {
      // Run TypeScript compiler
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async readFileComplete(filePath: string): Promise<string> {
    if (this.fileCache.has(filePath)) {
      return this.fileCache.get(filePath)!;
    }
    const content = await readFile(filePath, 'utf-8');
    this.fileCache.set(filePath, content);
    return content;
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private resolveImport(importPath: string, fromFile: string): string | null {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const dir = path.dirname(fromFile);
      let resolved = path.resolve(dir, importPath);

      // Try with extensions
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx']) {
        const withExt = resolved + ext;
        try {
          require.resolve(withExt);
          return withExt;
        } catch {}
      }
    }

    return null;
  }

  private parseBuildOutput(output: string): ErrorInfo[] {
    const errors: ErrorInfo[] = [];

    // TypeScript error format: src/file.ts(10,5): error TS2322: ...
    const tsRegex = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/gm;

    let match;
    while ((match = tsRegex.exec(output)) !== null) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: `TS${match[4]}`,
        message: match[5]
      });
    }

    return errors;
  }

  private orderByDependency(files: string[]): string[] {
    // Simple heuristic: types first, then utils, then components, then pages
    return files.sort((a, b) => {
      const order = (f: string) => {
        if (f.includes('/types/') || f.includes('.d.ts')) return 0;
        if (f.includes('/utils/') || f.includes('/lib/')) return 1;
        if (f.includes('/hooks/')) return 2;
        if (f.includes('/components/')) return 3;
        if (f.includes('/pages/') || f.includes('/app/')) return 4;
        return 5;
      };
      return order(a) - order(b);
    });
  }

  private parseFixes(response: string): Fix[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*"fixes"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.fixes || [];
      }
    } catch (e) {
      console.error('Failed to parse fixes:', e);
    }
    return [];
  }
}

// CLI Usage
async function main() {
  const agent = new CodeFixerAgent();

  const args = process.argv.slice(2);

  if (args[0] === 'fix' && args[1]) {
    // Fix single file
    const fixes = await agent.fixFile(args[1]);

    if (args.includes('--apply')) {
      await agent.applyFixes(fixes);
      console.log(`Applied ${fixes.length} fixes`);
    } else {
      console.log(JSON.stringify(fixes, null, 2));
    }
  } else if (args[0] === 'fix-all') {
    // Read from stdin (piped build output)
    let input = '';
    process.stdin.on('data', (chunk) => input += chunk);
    process.stdin.on('end', async () => {
      const fixes = await agent.fixAllBuildErrors(input);

      if (args.includes('--apply')) {
        await agent.applyFixes(fixes);
        const verified = await agent.verifyFixes(fixes);
        console.log(`Applied ${fixes.length} fixes. Build ${verified ? 'passes' : 'still has errors'}`);
      } else {
        console.log(JSON.stringify(fixes, null, 2));
      }
    });
  }
}

main();
```

---

## Deployment Checklist

- [ ] Anthropic API key configured
- [ ] File system access configured
- [ ] Build commands configured for project
- [ ] Test commands configured (optional)
- [ ] Git integration configured (optional)
- [ ] CI/CD pipeline integrated (optional)
- [ ] Pre-commit hooks configured (optional)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Jan 2026 | Initial release with complete read-fix-verify pipeline |

---

*Code Fixer Agent - Reads everything, understands everything, fixes everything perfectly*
