# Code Snippets Template

## Overview
Comprehensive code snippets setup with VS Code snippets, Emmet customizations, and team-shared snippet libraries for productivity.

## Quick Start
```bash
# Create snippets folder
mkdir -p .vscode
# Create snippets file
touch .vscode/project.code-snippets
```

## VS Code Snippets

### .vscode/project.code-snippets
```json
{
  // React Components
  "React Functional Component": {
    "prefix": "rfc",
    "scope": "typescriptreact",
    "body": [
      "interface ${1:${TM_FILENAME_BASE}}Props {",
      "  ${2:className}?: string;",
      "}",
      "",
      "export function ${1:${TM_FILENAME_BASE}}({ ${2:className} }: ${1:${TM_FILENAME_BASE}}Props) {",
      "  return (",
      "    <div className={${2:className}}>",
      "      $0",
      "    </div>",
      "  );",
      "}",
      "",
      "${1:${TM_FILENAME_BASE}}.displayName = '${1:${TM_FILENAME_BASE}}';"
    ],
    "description": "React Functional Component with TypeScript"
  },

  "React Server Component": {
    "prefix": "rsc",
    "scope": "typescriptreact",
    "body": [
      "interface ${1:${TM_FILENAME_BASE}}Props {",
      "  ${2:params}: { ${3:id}: string };",
      "}",
      "",
      "export default async function ${1:${TM_FILENAME_BASE}}({ ${2:params} }: ${1:${TM_FILENAME_BASE}}Props) {",
      "  const { ${3:id} } = await ${2:params};",
      "  const data = await fetch${4:Data}(${3:id});",
      "",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "Next.js Server Component"
  },

  "React Client Component": {
    "prefix": "rcc",
    "scope": "typescriptreact",
    "body": [
      "'use client';",
      "",
      "import { useState } from 'react';",
      "",
      "interface ${1:${TM_FILENAME_BASE}}Props {",
      "  ${2:initialValue}?: ${3:string};",
      "}",
      "",
      "export function ${1:${TM_FILENAME_BASE}}({ ${2:initialValue} }: ${1:${TM_FILENAME_BASE}}Props) {",
      "  const [${4:state}, set${4/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});",
      "",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "}"
    ],
    "description": "React Client Component"
  },

  // Hooks
  "React useState Hook": {
    "prefix": "ust",
    "scope": "typescriptreact,typescript",
    "body": [
      "const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState<${2:string}>(${3:''});"
    ],
    "description": "useState hook with TypeScript"
  },

  "React useEffect Hook": {
    "prefix": "uef",
    "scope": "typescriptreact,typescript",
    "body": [
      "useEffect(() => {",
      "  ${1:// effect}",
      "  $0",
      "  return () => {",
      "    ${2:// cleanup}",
      "  };",
      "}, [${3:dependencies}]);"
    ],
    "description": "useEffect hook with cleanup"
  },

  "React useCallback Hook": {
    "prefix": "ucb",
    "scope": "typescriptreact,typescript",
    "body": [
      "const ${1:memoizedCallback} = useCallback(",
      "  (${2:args}) => {",
      "    $0",
      "  },",
      "  [${3:dependencies}]",
      ");"
    ],
    "description": "useCallback hook"
  },

  "React useMemo Hook": {
    "prefix": "umm",
    "scope": "typescriptreact,typescript",
    "body": [
      "const ${1:memoizedValue} = useMemo(() => {",
      "  return ${2:computeExpensiveValue};",
      "}, [${3:dependencies}]);"
    ],
    "description": "useMemo hook"
  },

  "Custom Hook": {
    "prefix": "hook",
    "scope": "typescript,typescriptreact",
    "body": [
      "import { useState, useCallback } from 'react';",
      "",
      "interface Use${1:${TM_FILENAME_BASE/use(.*)/$1/}}Options {",
      "  ${2:initialValue}?: ${3:string};",
      "}",
      "",
      "interface Use${1:${TM_FILENAME_BASE/use(.*)/$1/}}Return {",
      "  ${4:value}: ${3:string};",
      "  ${5:setValue}: (value: ${3:string}) => void;",
      "}",
      "",
      "export function use${1:${TM_FILENAME_BASE/use(.*)/$1/}}(",
      "  options: Use${1:${TM_FILENAME_BASE/use(.*)/$1/}}Options = {}",
      "): Use${1:${TM_FILENAME_BASE/use(.*)/$1/}}Return {",
      "  const { ${2:initialValue} = ${6:''} } = options;",
      "  const [${4:value}, set${4/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});",
      "",
      "  const ${5:setValue} = useCallback((newValue: ${3:string}) => {",
      "    set${4/(.*)/${1:/capitalize}/}(newValue);",
      "  }, []);",
      "",
      "  return { ${4:value}, ${5:setValue} };",
      "}"
    ],
    "description": "Custom React Hook"
  },

  // API Routes
  "Next.js API Route Handler": {
    "prefix": "apiroute",
    "scope": "typescript",
    "body": [
      "import { NextRequest, NextResponse } from 'next/server';",
      "",
      "export async function GET(request: NextRequest) {",
      "  try {",
      "    const { searchParams } = new URL(request.url);",
      "    const ${1:id} = searchParams.get('${1:id}');",
      "",
      "    const data = await ${2:fetchData}(${1:id});",
      "",
      "    return NextResponse.json({ data });",
      "  } catch (error) {",
      "    return NextResponse.json(",
      "      { error: 'Internal Server Error' },",
      "      { status: 500 }",
      "    );",
      "  }",
      "}",
      "",
      "export async function POST(request: NextRequest) {",
      "  try {",
      "    const body = await request.json();",
      "",
      "    const result = await ${3:createData}(body);",
      "",
      "    return NextResponse.json({ data: result }, { status: 201 });",
      "  } catch (error) {",
      "    return NextResponse.json(",
      "      { error: 'Internal Server Error' },",
      "      { status: 500 }",
      "    );",
      "  }",
      "}"
    ],
    "description": "Next.js App Router API Route"
  },

  // Testing
  "Vitest Test Suite": {
    "prefix": "testfile",
    "scope": "typescript,typescriptreact",
    "body": [
      "import { describe, it, expect, vi, beforeEach } from 'vitest';",
      "",
      "describe('${1:${TM_FILENAME_BASE/(.+)\\.test/$1/}}', () => {",
      "  beforeEach(() => {",
      "    vi.clearAllMocks();",
      "  });",
      "",
      "  it('should ${2:do something}', () => {",
      "    $0",
      "    expect(${3:result}).toBe(${4:expected});",
      "  });",
      "});"
    ],
    "description": "Vitest test file"
  },

  "React Testing Library Test": {
    "prefix": "rtltest",
    "scope": "typescriptreact",
    "body": [
      "import { render, screen } from '@testing-library/react';",
      "import userEvent from '@testing-library/user-event';",
      "import { describe, it, expect, vi } from 'vitest';",
      "",
      "import { ${1:Component} } from './${1:Component}';",
      "",
      "describe('${1:Component}', () => {",
      "  it('renders correctly', () => {",
      "    render(<${1:Component} />);",
      "    expect(screen.getByRole('${2:button}')).toBeInTheDocument();",
      "  });",
      "",
      "  it('handles user interaction', async () => {",
      "    const user = userEvent.setup();",
      "    const ${3:onClick} = vi.fn();",
      "",
      "    render(<${1:Component} ${3:onClick}={${3:onClick}} />);",
      "",
      "    await user.click(screen.getByRole('${2:button}'));",
      "",
      "    expect(${3:onClick}).toHaveBeenCalled();",
      "  });",
      "});"
    ],
    "description": "React Testing Library test"
  },

  // TypeScript
  "TypeScript Interface": {
    "prefix": "interface",
    "scope": "typescript,typescriptreact",
    "body": [
      "interface ${1:Name} {",
      "  ${2:property}: ${3:type};",
      "  $0",
      "}"
    ],
    "description": "TypeScript interface"
  },

  "TypeScript Type": {
    "prefix": "type",
    "scope": "typescript,typescriptreact",
    "body": [
      "type ${1:Name} = {",
      "  ${2:property}: ${3:type};",
      "  $0",
      "};"
    ],
    "description": "TypeScript type alias"
  },

  "TypeScript Enum": {
    "prefix": "enum",
    "scope": "typescript,typescriptreact",
    "body": [
      "enum ${1:Name} {",
      "  ${2:Value} = '${2:Value}',",
      "  $0",
      "}"
    ],
    "description": "TypeScript enum"
  },

  // Console
  "Console Log": {
    "prefix": "clg",
    "scope": "javascript,typescript,javascriptreact,typescriptreact",
    "body": ["console.log('${1:label}:', ${2:value});"],
    "description": "Console log with label"
  },

  "Console Debug Object": {
    "prefix": "cdo",
    "scope": "javascript,typescript,javascriptreact,typescriptreact",
    "body": ["console.log('${1:object}:', JSON.stringify(${1:object}, null, 2));"],
    "description": "Console log object as JSON"
  },

  // Imports
  "Import React": {
    "prefix": "imr",
    "scope": "typescriptreact",
    "body": ["import React from 'react';"],
    "description": "Import React"
  },

  "Import useState": {
    "prefix": "imus",
    "scope": "typescriptreact,typescript",
    "body": ["import { useState } from 'react';"],
    "description": "Import useState"
  },

  "Import useEffect": {
    "prefix": "imue",
    "scope": "typescriptreact,typescript",
    "body": ["import { useEffect } from 'react';"],
    "description": "Import useEffect"
  },

  // Async/Await
  "Try-Catch Async": {
    "prefix": "trycatch",
    "scope": "javascript,typescript,typescriptreact",
    "body": [
      "try {",
      "  const result = await ${1:asyncFunction}();",
      "  $0",
      "} catch (error) {",
      "  console.error('Error:', error);",
      "  throw error;",
      "}"
    ],
    "description": "Try-catch block with async"
  },

  // Documentation
  "JSDoc Function": {
    "prefix": "jsdoc",
    "scope": "javascript,typescript,typescriptreact",
    "body": [
      "/**",
      " * ${1:Description}",
      " *",
      " * @param {${2:type}} ${3:param} - ${4:Description}",
      " * @returns {${5:type}} ${6:Description}",
      " */",
      "$0"
    ],
    "description": "JSDoc function documentation"
  },

  // CSS/Tailwind
  "Tailwind Component Classes": {
    "prefix": "twcn",
    "scope": "typescriptreact",
    "body": [
      "import { cn } from '@/lib/utils';",
      "",
      "const ${1:classes} = cn(",
      "  '${2:base-classes}',",
      "  ${3:conditional} && '${4:conditional-classes}'",
      ");"
    ],
    "description": "Tailwind cn utility"
  }
}
```

## Keyboard Shortcuts

### .vscode/keybindings.json
```json
[
  // File Navigation
  {
    "key": "cmd+p",
    "command": "workbench.action.quickOpen"
  },
  {
    "key": "cmd+shift+p",
    "command": "workbench.action.showCommands"
  },
  {
    "key": "cmd+b",
    "command": "workbench.action.toggleSidebarVisibility"
  },

  // Editor
  {
    "key": "cmd+d",
    "command": "editor.action.addSelectionToNextFindMatch"
  },
  {
    "key": "cmd+shift+l",
    "command": "editor.action.selectHighlights"
  },
  {
    "key": "alt+up",
    "command": "editor.action.moveLinesUpAction"
  },
  {
    "key": "alt+down",
    "command": "editor.action.moveLinesDownAction"
  },
  {
    "key": "shift+alt+up",
    "command": "editor.action.copyLinesUpAction"
  },
  {
    "key": "shift+alt+down",
    "command": "editor.action.copyLinesDownAction"
  },

  // Multi-cursor
  {
    "key": "cmd+alt+up",
    "command": "editor.action.insertCursorAbove"
  },
  {
    "key": "cmd+alt+down",
    "command": "editor.action.insertCursorBelow"
  },

  // Refactoring
  {
    "key": "f2",
    "command": "editor.action.rename"
  },
  {
    "key": "cmd+.",
    "command": "editor.action.quickFix"
  },
  {
    "key": "ctrl+shift+r",
    "command": "editor.action.refactor"
  },

  // Terminal
  {
    "key": "cmd+`",
    "command": "workbench.action.terminal.toggleTerminal"
  },
  {
    "key": "cmd+shift+`",
    "command": "workbench.action.terminal.new"
  },

  // Search
  {
    "key": "cmd+shift+f",
    "command": "workbench.action.findInFiles"
  },
  {
    "key": "cmd+shift+h",
    "command": "workbench.action.replaceInFiles"
  },

  // Git
  {
    "key": "cmd+shift+g",
    "command": "workbench.view.scm"
  },

  // Custom
  {
    "key": "cmd+k cmd+f",
    "command": "editor.action.formatDocument"
  },
  {
    "key": "cmd+k cmd+s",
    "command": "workbench.action.files.saveAll"
  },
  {
    "key": "cmd+k cmd+w",
    "command": "workbench.action.closeAllEditors"
  }
]
```

## Emmet Configuration

### .vscode/settings.json (Emmet section)
```json
{
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "emmet.triggerExpansionOnTab": true,
  "emmet.preferences": {
    "jsx.enabled": true
  },
  "emmet.variables": {
    "lang": "en",
    "charset": "UTF-8"
  },
  "emmet.syntaxProfiles": {
    "html": {
      "attr_quotes": "double"
    },
    "jsx": {
      "self_closing_tag": true
    }
  },
  "emmet.extensionsPath": [".vscode/emmet"]
}
```

### .vscode/emmet/snippets.json
```json
{
  "html": {
    "snippets": {
      "!!": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n\t<meta charset=\"UTF-8\">\n\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${0}\n</body>\n</html>",
      "btn": "<button type=\"${1:button}\" class=\"${2:btn}\">${0}</button>",
      "inp": "<input type=\"${1:text}\" name=\"${2}\" id=\"${2}\" placeholder=\"${3}\" />",
      "link:css": "<link rel=\"stylesheet\" href=\"${1:style}.css\" />"
    }
  },
  "jsx": {
    "snippets": {
      "div.": "<div className=\"${1}\">${0}</div>",
      "btn.": "<button className=\"${1}\" onClick={${2}}>${0}</button>",
      "inp.": "<input\n\ttype=\"${1:text}\"\n\tvalue={${2}}\n\tonChange={(e) => ${3}(e.target.value)}\n\tclassName=\"${4}\"\n/>"
    }
  },
  "css": {
    "snippets": {
      "flex-center": "display: flex;\njustify-content: center;\nalign-items: center;",
      "grid-center": "display: grid;\nplace-items: center;",
      "absolute-center": "position: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);"
    }
  }
}
```

## Snippet Generator

### scripts/generate-snippets.ts
```typescript
// scripts/generate-snippets.ts
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface Snippet {
  prefix: string;
  scope?: string;
  body: string[];
  description: string;
}

interface SnippetFile {
  [key: string]: Snippet;
}

async function generateSnippet(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n📝 Snippet Generator\n');

  const name = await question('Snippet name: ');
  const prefix = await question('Trigger prefix: ');
  const scope = await question('Language scope (leave empty for all): ');
  const description = await question('Description: ');

  console.log('\nEnter snippet body (empty line to finish):');
  const bodyLines: string[] = [];
  let line: string;

  while ((line = await question('')) !== '') {
    bodyLines.push(line);
  }

  rl.close();

  const snippet: Snippet = {
    prefix,
    body: bodyLines,
    description
  };

  if (scope) {
    snippet.scope = scope;
  }

  // Read existing snippets
  const snippetPath = '.vscode/project.code-snippets';
  let snippets: SnippetFile = {};

  if (fs.existsSync(snippetPath)) {
    snippets = JSON.parse(fs.readFileSync(snippetPath, 'utf-8'));
  }

  // Add new snippet
  snippets[name] = snippet;

  // Write back
  fs.mkdirSync('.vscode', { recursive: true });
  fs.writeFileSync(snippetPath, JSON.stringify(snippets, null, 2));

  console.log(`\n✅ Snippet "${name}" added to ${snippetPath}`);
  console.log(`\nTrigger: ${prefix}`);
}

// Convert code to snippet body
function codeToSnippetBody(code: string): string[] {
  return code.split('\n').map((line, index) => {
    // Convert to snippet format with tab stops
    return line
      .replace(/\t/g, '\\t')
      .replace(/\$/g, '\\$');
  });
}

// Export snippets to markdown documentation
function exportSnippetsToMarkdown(): void {
  const snippetPath = '.vscode/project.code-snippets';

  if (!fs.existsSync(snippetPath)) {
    console.log('No snippets file found');
    return;
  }

  const snippets: SnippetFile = JSON.parse(
    fs.readFileSync(snippetPath, 'utf-8')
  );

  let markdown = '# Code Snippets Reference\n\n';
  markdown += '| Prefix | Name | Description | Scope |\n';
  markdown += '|--------|------|-------------|-------|\n';

  Object.entries(snippets).forEach(([name, snippet]) => {
    markdown += `| \`${snippet.prefix}\` | ${name} | ${snippet.description} | ${snippet.scope || 'all'} |\n`;
  });

  markdown += '\n## Snippet Details\n\n';

  Object.entries(snippets).forEach(([name, snippet]) => {
    markdown += `### ${name}\n\n`;
    markdown += `**Prefix:** \`${snippet.prefix}\`\n\n`;
    markdown += `**Description:** ${snippet.description}\n\n`;
    if (snippet.scope) {
      markdown += `**Scope:** ${snippet.scope}\n\n`;
    }
    markdown += '```\n' + snippet.body.join('\n') + '\n```\n\n';
  });

  fs.writeFileSync('docs/snippets.md', markdown);
  console.log('✅ Snippets exported to docs/snippets.md');
}

generateSnippet();
```

## CLAUDE.md Integration

```markdown
## Code Snippets

### Common Prefixes
| Prefix | Description |
|--------|-------------|
| `rfc` | React Functional Component |
| `rsc` | React Server Component |
| `rcc` | React Client Component |
| `ust` | useState hook |
| `uef` | useEffect hook |
| `hook` | Custom hook |
| `testfile` | Vitest test suite |
| `clg` | Console log |

### Creating Snippets
```bash
npm run generate:snippet
```

### Keyboard Shortcuts
- `Cmd+D` - Select next occurrence
- `Alt+Up/Down` - Move line
- `Cmd+.` - Quick fix
- `F2` - Rename symbol

### Emmet
- `div.classname` → `<div className="classname"></div>`
- `btn.primary` → `<button className="primary"></button>`
```

## AI Suggestions

1. **Smart snippets** - Context-aware suggestions
2. **Snippet sharing** - Team snippet sync
3. **Usage analytics** - Track snippet usage
4. **Auto-generation** - Generate from patterns
5. **Snippet search** - Find existing snippets
6. **Variable support** - Dynamic placeholders
7. **Multi-file** - Cross-file snippets
8. **Snippet testing** - Verify snippet output
9. **Import/export** - Share snippet packs
10. **IDE-agnostic** - Cross-editor support
