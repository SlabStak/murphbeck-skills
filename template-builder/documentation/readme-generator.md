# README Generator

Production-ready README generation with templates, badges, and automatic content extraction.

## Overview

Automatically generate comprehensive README files from project structure, package.json, and code analysis. This template provides templates, badges, and intelligent content generation.

## Quick Start

```bash
npm install glob handlebars marked
```

## TypeScript Implementation

### README Generator Service

```typescript
// src/services/docs/readme-generator.ts
import Handlebars from 'handlebars';
import { glob } from 'glob';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ProjectInfo {
  name: string;
  description: string;
  version: string;
  license: string;
  author?: string | { name: string; email?: string; url?: string };
  repository?: string | { type: string; url: string };
  homepage?: string;
  keywords?: string[];
  engines?: { node?: string; npm?: string };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ReadmeSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Badge {
  label: string;
  url: string;
  link?: string;
}

interface ReadmeConfig {
  projectRoot: string;
  template?: string;
  sections?: string[];
  badges?: Badge[];
  customSections?: ReadmeSection[];
  includeTOC?: boolean;
  includeContributing?: boolean;
  includeLicense?: boolean;
  includeChangelog?: boolean;
}

class ReadmeGenerator {
  private config: ReadmeConfig;
  private projectInfo: ProjectInfo | null = null;

  constructor(config: ReadmeConfig) {
    this.config = {
      includeTOC: true,
      includeContributing: true,
      includeLicense: true,
      includeChangelog: true,
      ...config,
    };

    this.loadProjectInfo();
    this.registerHelpers();
  }

  // Load project info from package.json
  private loadProjectInfo(): void {
    const packagePath = join(this.config.projectRoot, 'package.json');

    if (existsSync(packagePath)) {
      const content = readFileSync(packagePath, 'utf-8');
      this.projectInfo = JSON.parse(content);
    }
  }

  // Register Handlebars helpers
  private registerHelpers(): void {
    Handlebars.registerHelper('badge', (label: string, url: string, link?: string) => {
      const img = `![${label}](${url})`;
      return link ? `[${img}](${link})` : img;
    });

    Handlebars.registerHelper('codeBlock', (code: string, language?: string) => {
      return `\`\`\`${language || ''}\n${code}\n\`\`\``;
    });

    Handlebars.registerHelper('link', (text: string, url: string) => {
      return `[${text}](${url})`;
    });

    Handlebars.registerHelper('list', (items: string[]) => {
      return items.map(item => `- ${item}`).join('\n');
    });

    Handlebars.registerHelper('table', (headers: string[], rows: string[][]) => {
      const headerRow = `| ${headers.join(' | ')} |`;
      const separator = `| ${headers.map(() => '---').join(' | ')} |`;
      const dataRows = rows.map(row => `| ${row.join(' | ')} |`).join('\n');
      return `${headerRow}\n${separator}\n${dataRows}`;
    });
  }

  // Generate badges
  generateBadges(): string {
    const badges: Badge[] = this.config.badges || [];

    // Auto-generate common badges
    if (this.projectInfo) {
      const repoUrl = this.getRepoUrl();

      if (repoUrl && repoUrl.includes('github.com')) {
        const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/');

        badges.push(
          {
            label: 'Build Status',
            url: `https://github.com/${owner}/${repo}/actions/workflows/ci.yml/badge.svg`,
            link: `https://github.com/${owner}/${repo}/actions`,
          },
          {
            label: 'npm version',
            url: `https://img.shields.io/npm/v/${this.projectInfo.name}`,
            link: `https://www.npmjs.com/package/${this.projectInfo.name}`,
          },
          {
            label: 'License',
            url: `https://img.shields.io/badge/license-${this.projectInfo.license}-blue`,
            link: '#license',
          }
        );
      }
    }

    return badges
      .map(badge => {
        const img = `![${badge.label}](${badge.url})`;
        return badge.link ? `[${img}](${badge.link})` : img;
      })
      .join(' ');
  }

  // Get repository URL
  private getRepoUrl(): string | null {
    if (!this.projectInfo?.repository) return null;

    if (typeof this.projectInfo.repository === 'string') {
      return this.projectInfo.repository;
    }

    return this.projectInfo.repository.url?.replace(/^git\+/, '').replace(/\.git$/, '') || null;
  }

  // Generate installation section
  generateInstallation(): string {
    if (!this.projectInfo) return '';

    const sections: string[] = [];

    // npm install
    sections.push('### npm');
    sections.push('```bash');
    sections.push(`npm install ${this.projectInfo.name}`);
    sections.push('```');

    // yarn
    sections.push('\n### yarn');
    sections.push('```bash');
    sections.push(`yarn add ${this.projectInfo.name}`);
    sections.push('```');

    // pnpm
    sections.push('\n### pnpm');
    sections.push('```bash');
    sections.push(`pnpm add ${this.projectInfo.name}`);
    sections.push('```');

    return sections.join('\n');
  }

  // Generate usage section from examples
  async generateUsage(): Promise<string> {
    const exampleFiles = await glob('examples/**/*.{ts,js,tsx,jsx}', {
      cwd: this.config.projectRoot,
    });

    if (exampleFiles.length === 0) {
      return this.generateBasicUsage();
    }

    const sections: string[] = [];

    for (const file of exampleFiles.slice(0, 3)) {
      const content = readFileSync(join(this.config.projectRoot, file), 'utf-8');
      const name = file.replace(/^examples\//, '').replace(/\.[^.]+$/, '');

      sections.push(`### ${this.formatName(name)}`);
      sections.push('```typescript');
      sections.push(content.trim());
      sections.push('```');
      sections.push('');
    }

    return sections.join('\n');
  }

  // Generate basic usage from main export
  private generateBasicUsage(): string {
    if (!this.projectInfo) return '';

    return `\`\`\`typescript
import { ${this.getMainExport()} } from '${this.projectInfo.name}';

// Your code here
\`\`\``;
  }

  // Get main export name
  private getMainExport(): string {
    const name = this.projectInfo?.name || 'module';
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  // Generate API documentation section
  async generateAPI(): Promise<string> {
    const typeFiles = await glob('src/**/*.ts', {
      cwd: this.config.projectRoot,
      ignore: ['**/*.test.ts', '**/*.spec.ts'],
    });

    const sections: string[] = ['## API Reference', ''];

    // Extract exported functions and classes
    for (const file of typeFiles.slice(0, 5)) {
      const content = readFileSync(join(this.config.projectRoot, file), 'utf-8');
      const exports = this.extractExports(content);

      if (exports.length > 0) {
        sections.push(`### ${this.formatName(file.replace('src/', '').replace('.ts', ''))}`);
        sections.push('');

        for (const exp of exports) {
          sections.push(`#### \`${exp.name}\``);
          if (exp.description) {
            sections.push(exp.description);
          }
          if (exp.signature) {
            sections.push('```typescript');
            sections.push(exp.signature);
            sections.push('```');
          }
          sections.push('');
        }
      }
    }

    return sections.join('\n');
  }

  // Extract exports from TypeScript file
  private extractExports(content: string): Array<{
    name: string;
    type: string;
    signature?: string;
    description?: string;
  }> {
    const exports: Array<{
      name: string;
      type: string;
      signature?: string;
      description?: string;
    }> = [];

    // Match exported functions
    const funcRegex = /\/\*\*\s*([\s\S]*?)\*\/\s*export\s+(?:async\s+)?function\s+(\w+)([^{]*)/g;
    let match;

    while ((match = funcRegex.exec(content)) !== null) {
      exports.push({
        name: match[2],
        type: 'function',
        signature: `function ${match[2]}${match[3].trim()}`,
        description: this.parseJSDoc(match[1]),
      });
    }

    // Match exported classes
    const classRegex = /\/\*\*\s*([\s\S]*?)\*\/\s*export\s+class\s+(\w+)/g;

    while ((match = classRegex.exec(content)) !== null) {
      exports.push({
        name: match[2],
        type: 'class',
        description: this.parseJSDoc(match[1]),
      });
    }

    return exports;
  }

  // Parse JSDoc comment
  private parseJSDoc(comment: string): string {
    const lines = comment
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => !line.startsWith('@'));

    return lines.join(' ').trim();
  }

  // Generate scripts section
  generateScripts(): string {
    if (!this.projectInfo?.scripts) return '';

    const sections: string[] = ['## Available Scripts', ''];

    const commonScripts = ['dev', 'build', 'test', 'lint', 'start'];

    for (const script of commonScripts) {
      if (this.projectInfo.scripts[script]) {
        sections.push(`### \`npm run ${script}\``);
        sections.push('');
        sections.push(this.getScriptDescription(script));
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  // Get script description
  private getScriptDescription(script: string): string {
    const descriptions: Record<string, string> = {
      dev: 'Runs the development server with hot reloading.',
      build: 'Builds the project for production.',
      test: 'Runs the test suite.',
      lint: 'Runs the linter to check code style.',
      start: 'Starts the production server.',
    };

    return descriptions[script] || `Runs the \`${script}\` script.`;
  }

  // Generate contributing section
  generateContributing(): string {
    const contributingPath = join(this.config.projectRoot, 'CONTRIBUTING.md');

    if (existsSync(contributingPath)) {
      return 'See [CONTRIBUTING.md](CONTRIBUTING.md) for details.';
    }

    return `Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request`;
  }

  // Generate license section
  generateLicense(): string {
    if (!this.projectInfo?.license) return '';

    return `This project is licensed under the ${this.projectInfo.license} License - see the [LICENSE](LICENSE) file for details.`;
  }

  // Generate table of contents
  generateTOC(content: string): string {
    const headings = content.match(/^##\s+.+$/gm) || [];

    const toc = headings.map(heading => {
      const text = heading.replace(/^##\s+/, '');
      const anchor = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `- [${text}](#${anchor})`;
    });

    return ['## Table of Contents', '', ...toc].join('\n');
  }

  // Format name for display
  private formatName(name: string): string {
    return name
      .split(/[-_/]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Generate complete README
  async generate(): Promise<string> {
    const sections: string[] = [];

    // Title and badges
    if (this.projectInfo) {
      sections.push(`# ${this.projectInfo.name}`);
      sections.push('');
      sections.push(this.generateBadges());
      sections.push('');

      if (this.projectInfo.description) {
        sections.push(this.projectInfo.description);
        sections.push('');
      }
    }

    // Features (if available)
    const featuresPath = join(this.config.projectRoot, 'FEATURES.md');
    if (existsSync(featuresPath)) {
      sections.push('## Features');
      sections.push('');
      sections.push(readFileSync(featuresPath, 'utf-8'));
      sections.push('');
    }

    // Installation
    sections.push('## Installation');
    sections.push('');
    sections.push(this.generateInstallation());
    sections.push('');

    // Usage
    sections.push('## Usage');
    sections.push('');
    sections.push(await this.generateUsage());
    sections.push('');

    // API
    sections.push(await this.generateAPI());
    sections.push('');

    // Scripts
    const scripts = this.generateScripts();
    if (scripts) {
      sections.push(scripts);
    }

    // Contributing
    if (this.config.includeContributing) {
      sections.push('## Contributing');
      sections.push('');
      sections.push(this.generateContributing());
      sections.push('');
    }

    // License
    if (this.config.includeLicense && this.projectInfo?.license) {
      sections.push('## License');
      sections.push('');
      sections.push(this.generateLicense());
      sections.push('');
    }

    let content = sections.join('\n');

    // Insert TOC after badges
    if (this.config.includeTOC) {
      const toc = this.generateTOC(content);
      const insertPoint = content.indexOf('## ');
      content = content.slice(0, insertPoint) + toc + '\n\n' + content.slice(insertPoint);
    }

    return content;
  }
}

export { ReadmeGenerator, ReadmeConfig, ProjectInfo };
```

### CLI Tool

```typescript
// src/cli/readme-cli.ts
import { program } from 'commander';
import { ReadmeGenerator } from '../services/docs/readme-generator';
import { writeFileSync } from 'fs';
import { join } from 'path';

program
  .name('readme-gen')
  .description('Generate README.md from project')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate README.md')
  .option('-o, --output <path>', 'Output file path', 'README.md')
  .option('-r, --root <path>', 'Project root directory', '.')
  .option('--no-toc', 'Exclude table of contents')
  .option('--no-contributing', 'Exclude contributing section')
  .option('--no-license', 'Exclude license section')
  .action(async (options) => {
    const generator = new ReadmeGenerator({
      projectRoot: options.root,
      includeTOC: options.toc,
      includeContributing: options.contributing,
      includeLicense: options.license,
    });

    const content = await generator.generate();
    const outputPath = join(options.root, options.output);

    writeFileSync(outputPath, content);
    console.log(`README generated: ${outputPath}`);
  });

program
  .command('validate')
  .description('Validate existing README')
  .option('-f, --file <path>', 'README file path', 'README.md')
  .action((options) => {
    // Validation logic
    console.log(`Validating ${options.file}...`);
  });

program.parse();
```

## README Templates

### Standard Template

```handlebars
{{! templates/standard.hbs }}
# {{name}}

{{badges}}

{{description}}

## Table of Contents

{{toc}}

## Features

{{#each features}}
- {{this}}
{{/each}}

## Installation

{{installation}}

## Quick Start

{{quickStart}}

## Usage

{{usage}}

## API Reference

{{api}}

## Configuration

{{configuration}}

## Examples

{{examples}}

## Contributing

{{contributing}}

## License

{{license}}

## Acknowledgments

{{acknowledgments}}
```

### Minimal Template

```handlebars
{{! templates/minimal.hbs }}
# {{name}}

{{badges}}

{{description}}

## Installation

```bash
npm install {{name}}
```

## Usage

{{usage}}

## License

{{license}}
```

## Express.js API

```typescript
// src/routes/readme.ts
import { Router, Request, Response } from 'express';
import { ReadmeGenerator } from '../services/docs/readme-generator';

const router = Router();

// Generate README
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { projectRoot, options } = req.body;

    if (!projectRoot) {
      return res.status(400).json({ error: 'projectRoot is required' });
    }

    const generator = new ReadmeGenerator({
      projectRoot,
      ...options,
    });

    const content = await generator.generate();

    res.json({ content });
  } catch (error) {
    console.error('README generation error:', error);
    res.status(500).json({ error: 'Failed to generate README' });
  }
});

// Preview README
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { projectRoot } = req.body;

    const generator = new ReadmeGenerator({ projectRoot });
    const content = await generator.generate();

    // Convert to HTML for preview
    const { marked } = await import('marked');
    const html = marked(content);

    res.json({ markdown: content, html });
  } catch (error) {
    console.error('README preview error:', error);
    res.status(500).json({ error: 'Failed to preview README' });
  }
});

export default router;
```

## Python Implementation

```python
# readme_generator.py
import os
import json
import re
from typing import Dict, List, Optional, Any
from pathlib import Path
from dataclasses import dataclass

@dataclass
class Badge:
    label: str
    url: str
    link: Optional[str] = None

    def to_markdown(self) -> str:
        img = f"![{self.label}]({self.url})"
        return f"[{img}]({self.link})" if self.link else img


class ReadmeGenerator:
    def __init__(
        self,
        project_root: str,
        include_toc: bool = True,
        include_contributing: bool = True,
        include_license: bool = True
    ):
        self.project_root = Path(project_root)
        self.include_toc = include_toc
        self.include_contributing = include_contributing
        self.include_license = include_license
        self.project_info = self._load_project_info()

    def _load_project_info(self) -> Optional[Dict[str, Any]]:
        """Load project info from package.json or pyproject.toml."""
        package_json = self.project_root / 'package.json'
        pyproject = self.project_root / 'pyproject.toml'

        if package_json.exists():
            with open(package_json) as f:
                return json.load(f)

        if pyproject.exists():
            import tomli
            with open(pyproject, 'rb') as f:
                data = tomli.load(f)
                return data.get('project', data.get('tool', {}).get('poetry', {}))

        return None

    def generate_badges(self) -> str:
        """Generate badge markdown."""
        badges: List[Badge] = []

        if self.project_info:
            name = self.project_info.get('name', '')

            badges.extend([
                Badge(
                    label='PyPI version',
                    url=f'https://img.shields.io/pypi/v/{name}',
                    link=f'https://pypi.org/project/{name}'
                ),
                Badge(
                    label='Python versions',
                    url=f'https://img.shields.io/pypi/pyversions/{name}',
                    link=f'https://pypi.org/project/{name}'
                ),
                Badge(
                    label='License',
                    url=f'https://img.shields.io/pypi/l/{name}',
                    link='#license'
                ),
            ])

        return ' '.join(badge.to_markdown() for badge in badges)

    def generate_installation(self) -> str:
        """Generate installation instructions."""
        if not self.project_info:
            return ''

        name = self.project_info.get('name', 'package')

        return f"""### pip

```bash
pip install {name}
```

### poetry

```bash
poetry add {name}
```

### pipenv

```bash
pipenv install {name}
```"""

    def generate_usage(self) -> str:
        """Generate usage examples."""
        examples_dir = self.project_root / 'examples'

        if examples_dir.exists():
            examples = list(examples_dir.glob('*.py'))[:3]
            sections = []

            for example in examples:
                name = example.stem.replace('_', ' ').title()
                content = example.read_text()
                sections.append(f"### {name}\n\n```python\n{content}\n```")

            return '\n\n'.join(sections)

        # Basic usage
        if self.project_info:
            name = self.project_info.get('name', 'module')
            return f"""```python
from {name} import main

# Your code here
```"""

        return ''

    def generate_api(self) -> str:
        """Generate API documentation."""
        src_dir = self.project_root / 'src'

        if not src_dir.exists():
            src_dir = self.project_root

        sections = ['## API Reference\n']

        for py_file in list(src_dir.rglob('*.py'))[:5]:
            if py_file.name.startswith('_'):
                continue

            content = py_file.read_text()
            exports = self._extract_exports(content)

            if exports:
                module_name = py_file.stem
                sections.append(f"### {module_name}\n")

                for export in exports:
                    sections.append(f"#### `{export['name']}`\n")
                    if export.get('docstring'):
                        sections.append(f"{export['docstring']}\n")

        return '\n'.join(sections)

    def _extract_exports(self, content: str) -> List[Dict[str, str]]:
        """Extract functions and classes from Python file."""
        exports = []

        # Match functions
        func_pattern = r'def\s+(\w+)\s*\([^)]*\)\s*(?:->.*?)?:\s*(?:"""(.*?)""")?'
        for match in re.finditer(func_pattern, content, re.DOTALL):
            if not match.group(1).startswith('_'):
                exports.append({
                    'name': match.group(1),
                    'type': 'function',
                    'docstring': match.group(2).strip() if match.group(2) else None
                })

        # Match classes
        class_pattern = r'class\s+(\w+).*?:\s*(?:"""(.*?)""")?'
        for match in re.finditer(class_pattern, content, re.DOTALL):
            exports.append({
                'name': match.group(1),
                'type': 'class',
                'docstring': match.group(2).strip() if match.group(2) else None
            })

        return exports

    def generate_contributing(self) -> str:
        """Generate contributing section."""
        contributing_file = self.project_root / 'CONTRIBUTING.md'

        if contributing_file.exists():
            return 'See [CONTRIBUTING.md](CONTRIBUTING.md) for details.'

        return """Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request"""

    def generate_license(self) -> str:
        """Generate license section."""
        license_name = self.project_info.get('license', '') if self.project_info else ''

        if not license_name:
            license_file = self.project_root / 'LICENSE'
            if license_file.exists():
                content = license_file.read_text()
                if 'MIT' in content:
                    license_name = 'MIT'
                elif 'Apache' in content:
                    license_name = 'Apache-2.0'

        if license_name:
            return f"This project is licensed under the {license_name} License - see the [LICENSE](LICENSE) file for details."

        return ''

    def generate_toc(self, content: str) -> str:
        """Generate table of contents."""
        headings = re.findall(r'^##\s+(.+)$', content, re.MULTILINE)

        toc_items = []
        for heading in headings:
            anchor = re.sub(r'[^a-z0-9]+', '-', heading.lower()).strip('-')
            toc_items.append(f"- [{heading}](#{anchor})")

        return "## Table of Contents\n\n" + '\n'.join(toc_items)

    def generate(self) -> str:
        """Generate complete README."""
        sections = []

        # Title and badges
        if self.project_info:
            name = self.project_info.get('name', 'Project')
            sections.append(f"# {name}\n")
            sections.append(self.generate_badges())
            sections.append('')

            description = self.project_info.get('description', '')
            if description:
                sections.append(description)
                sections.append('')

        # Installation
        sections.append("## Installation\n")
        sections.append(self.generate_installation())
        sections.append('')

        # Usage
        sections.append("## Usage\n")
        sections.append(self.generate_usage())
        sections.append('')

        # API
        sections.append(self.generate_api())
        sections.append('')

        # Contributing
        if self.include_contributing:
            sections.append("## Contributing\n")
            sections.append(self.generate_contributing())
            sections.append('')

        # License
        if self.include_license:
            license_section = self.generate_license()
            if license_section:
                sections.append("## License\n")
                sections.append(license_section)
                sections.append('')

        content = '\n'.join(sections)

        # Insert TOC
        if self.include_toc:
            toc = self.generate_toc(content)
            first_section = content.find('## ')
            content = content[:first_section] + toc + '\n\n' + content[first_section:]

        return content


# CLI
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Generate README.md')
    parser.add_argument('--root', default='.', help='Project root directory')
    parser.add_argument('--output', default='README.md', help='Output file')
    parser.add_argument('--no-toc', action='store_true', help='Exclude TOC')

    args = parser.parse_args()

    generator = ReadmeGenerator(
        project_root=args.root,
        include_toc=not args.no_toc
    )

    content = generator.generate()

    output_path = Path(args.root) / args.output
    output_path.write_text(content)
    print(f"README generated: {output_path}")
```

## CLAUDE.md Integration

```markdown
## README Generator

### Commands
- `readme:generate` - Generate README from project
- `readme:preview` - Preview README as HTML
- `readme:validate` - Validate README structure

### Key Files
- `src/services/docs/readme-generator.ts` - Generator service
- `templates/` - README templates

### Template Variables
- `{{name}}` - Project name
- `{{description}}` - Project description
- `{{badges}}` - Status badges
- `{{installation}}` - Install instructions
- `{{usage}}` - Usage examples
- `{{api}}` - API reference
- `{{contributing}}` - Contributing guide
- `{{license}}` - License info
```

## AI Suggestions

1. **Auto-Update**: Watch for changes and regenerate README
2. **Screenshots**: Auto-capture and include screenshots
3. **Badges Service**: Integrate with shields.io for dynamic badges
4. **Changelog Link**: Auto-link to CHANGELOG.md
5. **Code Examples**: Extract examples from test files
6. **Multi-Language**: Generate README in multiple languages
7. **Validation**: Validate links and code blocks
8. **SEO**: Optimize README for GitHub search
9. **Templates**: Create industry-specific templates
10. **CI Integration**: Generate README in CI pipeline
