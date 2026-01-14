# Changelog Management

Production-ready changelog generation and management following Keep a Changelog format.

## Overview

Automate changelog generation from git commits, pull requests, and conventional commits. This template implements the Keep a Changelog format with semantic versioning support.

## Quick Start

```bash
npm install conventional-changelog-cli @semantic-release/changelog semver
```

## TypeScript Implementation

### Changelog Generator Service

```typescript
// src/services/docs/changelog-generator.ts
import { execSync } from 'child_process';
import * as semver from 'semver';

interface ChangelogEntry {
  type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security';
  description: string;
  scope?: string;
  breaking?: boolean;
  issue?: string;
  pr?: string;
  author?: string;
  commit?: string;
}

interface ChangelogVersion {
  version: string;
  date: string;
  entries: ChangelogEntry[];
  compareUrl?: string;
}

interface ConventionalCommit {
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking: boolean;
  issues: string[];
  hash: string;
  author: string;
  date: string;
}

interface ChangelogConfig {
  repoUrl?: string;
  types?: Record<string, ChangelogEntry['type']>;
  scopes?: string[];
  includeCommitHash?: boolean;
  includeAuthor?: boolean;
}

class ChangelogGenerator {
  private config: ChangelogConfig;

  // Map conventional commit types to changelog categories
  private readonly typeMapping: Record<string, ChangelogEntry['type']> = {
    feat: 'added',
    feature: 'added',
    add: 'added',
    fix: 'fixed',
    bugfix: 'fixed',
    hotfix: 'fixed',
    docs: 'changed',
    style: 'changed',
    refactor: 'changed',
    perf: 'changed',
    test: 'changed',
    build: 'changed',
    ci: 'changed',
    chore: 'changed',
    revert: 'removed',
    deprecate: 'deprecated',
    security: 'security',
    breaking: 'changed',
  };

  constructor(config: ChangelogConfig = {}) {
    this.config = {
      includeCommitHash: true,
      includeAuthor: false,
      ...config,
    };

    if (config.types) {
      Object.assign(this.typeMapping, config.types);
    }
  }

  // Parse conventional commit message
  parseCommit(commitLine: string): ConventionalCommit | null {
    // Format: hash|author|date|subject|body
    const parts = commitLine.split('|');
    if (parts.length < 4) return null;

    const [hash, author, date, subject, body = ''] = parts;

    // Parse conventional commit format: type(scope): subject
    const conventionalMatch = subject.match(
      /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/
    );

    if (!conventionalMatch) return null;

    const [, type, scope, breakingMark, commitSubject] = conventionalMatch;

    // Extract issues from body or subject
    const issueMatches = `${subject} ${body}`.match(/#(\d+)/g) || [];
    const issues = issueMatches.map(m => m.replace('#', ''));

    // Check for BREAKING CHANGE in body
    const breaking = !!breakingMark || /BREAKING CHANGE/i.test(body);

    return {
      type: type.toLowerCase(),
      scope,
      subject: commitSubject,
      body,
      breaking,
      issues,
      hash: hash.substring(0, 7),
      author,
      date,
    };
  }

  // Get commits between tags
  getCommitsBetween(fromTag: string, toRef = 'HEAD'): ConventionalCommit[] {
    try {
      const format = '%H|%an|%ai|%s|%b';
      const range = fromTag ? `${fromTag}..${toRef}` : toRef;

      const output = execSync(
        `git log ${range} --format="${format}" --no-merges`,
        { encoding: 'utf-8' }
      );

      return output
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => this.parseCommit(line))
        .filter((commit): commit is ConventionalCommit => commit !== null);
    } catch {
      return [];
    }
  }

  // Get all tags
  getTags(): string[] {
    try {
      const output = execSync(
        'git tag --sort=-version:refname',
        { encoding: 'utf-8' }
      );

      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  // Convert commits to changelog entries
  commitsToEntries(commits: ConventionalCommit[]): ChangelogEntry[] {
    return commits.map(commit => {
      const type = this.typeMapping[commit.type] || 'changed';

      const entry: ChangelogEntry = {
        type,
        description: commit.subject,
        scope: commit.scope,
        breaking: commit.breaking,
        commit: this.config.includeCommitHash ? commit.hash : undefined,
        author: this.config.includeAuthor ? commit.author : undefined,
      };

      if (commit.issues.length > 0) {
        entry.issue = commit.issues[0];
      }

      return entry;
    });
  }

  // Group entries by type
  groupEntriesByType(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
    const groups: Record<string, ChangelogEntry[]> = {
      added: [],
      changed: [],
      deprecated: [],
      removed: [],
      fixed: [],
      security: [],
    };

    for (const entry of entries) {
      groups[entry.type].push(entry);
    }

    return groups;
  }

  // Generate version section
  generateVersionSection(version: ChangelogVersion): string {
    const lines: string[] = [];

    // Version header
    const header = version.compareUrl
      ? `## [${version.version}](${version.compareUrl}) - ${version.date}`
      : `## [${version.version}] - ${version.date}`;

    lines.push(header);
    lines.push('');

    // Group entries
    const grouped = this.groupEntriesByType(version.entries);

    const typeHeaders: Record<string, string> = {
      added: '### Added',
      changed: '### Changed',
      deprecated: '### Deprecated',
      removed: '### Removed',
      fixed: '### Fixed',
      security: '### Security',
    };

    for (const [type, entries] of Object.entries(grouped)) {
      if (entries.length === 0) continue;

      lines.push(typeHeaders[type]);
      lines.push('');

      for (const entry of entries) {
        let line = `- ${entry.description}`;

        if (entry.scope) {
          line = `- **${entry.scope}:** ${entry.description}`;
        }

        if (entry.breaking) {
          line = `- **BREAKING:** ${entry.description}`;
        }

        const refs: string[] = [];
        if (entry.issue && this.config.repoUrl) {
          refs.push(`[#${entry.issue}](${this.config.repoUrl}/issues/${entry.issue})`);
        }
        if (entry.pr && this.config.repoUrl) {
          refs.push(`[!${entry.pr}](${this.config.repoUrl}/pull/${entry.pr})`);
        }
        if (entry.commit && this.config.repoUrl) {
          refs.push(`[\`${entry.commit}\`](${this.config.repoUrl}/commit/${entry.commit})`);
        }
        if (entry.author) {
          refs.push(`@${entry.author}`);
        }

        if (refs.length > 0) {
          line += ` (${refs.join(', ')})`;
        }

        lines.push(line);
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  // Generate full changelog
  generateChangelog(versions: ChangelogVersion[]): string {
    const lines: string[] = [];

    // Header
    lines.push('# Changelog');
    lines.push('');
    lines.push('All notable changes to this project will be documented in this file.');
    lines.push('');
    lines.push('The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),');
    lines.push('and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).');
    lines.push('');

    // Versions
    for (const version of versions) {
      lines.push(this.generateVersionSection(version));
    }

    return lines.join('\n');
  }

  // Generate changelog from git history
  generateFromGit(): string {
    const tags = this.getTags();
    const versions: ChangelogVersion[] = [];

    // Add unreleased section
    const unreleasedCommits = this.getCommitsBetween(tags[0] || '');
    if (unreleasedCommits.length > 0) {
      versions.push({
        version: 'Unreleased',
        date: new Date().toISOString().split('T')[0],
        entries: this.commitsToEntries(unreleasedCommits),
        compareUrl: this.config.repoUrl && tags[0]
          ? `${this.config.repoUrl}/compare/${tags[0]}...HEAD`
          : undefined,
      });
    }

    // Add tagged versions
    for (let i = 0; i < tags.length; i++) {
      const currentTag = tags[i];
      const previousTag = tags[i + 1];

      const commits = this.getCommitsBetween(previousTag || '', currentTag);
      const tagDate = this.getTagDate(currentTag);

      versions.push({
        version: currentTag.replace(/^v/, ''),
        date: tagDate,
        entries: this.commitsToEntries(commits),
        compareUrl: this.config.repoUrl && previousTag
          ? `${this.config.repoUrl}/compare/${previousTag}...${currentTag}`
          : undefined,
      });
    }

    return this.generateChangelog(versions);
  }

  // Get tag date
  private getTagDate(tag: string): string {
    try {
      const output = execSync(
        `git log -1 --format=%ai ${tag}`,
        { encoding: 'utf-8' }
      );
      return output.trim().split(' ')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  // Determine next version based on commits
  determineNextVersion(currentVersion: string, commits: ConventionalCommit[]): string {
    let releaseType: 'major' | 'minor' | 'patch' = 'patch';

    for (const commit of commits) {
      if (commit.breaking) {
        releaseType = 'major';
        break;
      }

      if (['feat', 'feature'].includes(commit.type)) {
        if (releaseType !== 'major') {
          releaseType = 'minor';
        }
      }
    }

    return semver.inc(currentVersion, releaseType) || currentVersion;
  }

  // Add new version entry
  addVersion(
    changelogContent: string,
    version: string,
    entries: ChangelogEntry[]
  ): string {
    const newVersion: ChangelogVersion = {
      version,
      date: new Date().toISOString().split('T')[0],
      entries,
    };

    const newSection = this.generateVersionSection(newVersion);

    // Insert after header
    const unreleasedIndex = changelogContent.indexOf('## [Unreleased]');
    const firstVersionIndex = changelogContent.indexOf('## [', unreleasedIndex > -1 ? unreleasedIndex + 1 : 0);

    if (firstVersionIndex > -1) {
      return (
        changelogContent.slice(0, firstVersionIndex) +
        newSection +
        '\n' +
        changelogContent.slice(firstVersionIndex)
      );
    }

    return changelogContent + '\n' + newSection;
  }
}

export { ChangelogGenerator, ChangelogEntry, ChangelogVersion, ChangelogConfig };
```

### Changelog Parser

```typescript
// src/services/docs/changelog-parser.ts
import { ChangelogEntry, ChangelogVersion } from './changelog-generator';

class ChangelogParser {
  // Parse changelog markdown
  parse(content: string): ChangelogVersion[] {
    const versions: ChangelogVersion[] = [];
    const versionRegex = /^## \[([^\]]+)\](?:\([^)]+\))?\s*-?\s*(.*)$/gm;

    let match;
    const versionMatches: Array<{ version: string; date: string; index: number }> = [];

    while ((match = versionRegex.exec(content)) !== null) {
      versionMatches.push({
        version: match[1],
        date: match[2].trim(),
        index: match.index,
      });
    }

    for (let i = 0; i < versionMatches.length; i++) {
      const { version, date, index } = versionMatches[i];
      const nextIndex = versionMatches[i + 1]?.index || content.length;
      const sectionContent = content.slice(index, nextIndex);

      versions.push({
        version,
        date,
        entries: this.parseEntries(sectionContent),
      });
    }

    return versions;
  }

  // Parse entries from version section
  private parseEntries(sectionContent: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    const typeMap: Record<string, ChangelogEntry['type']> = {
      added: 'added',
      changed: 'changed',
      deprecated: 'deprecated',
      removed: 'removed',
      fixed: 'fixed',
      security: 'security',
    };

    let currentType: ChangelogEntry['type'] = 'changed';

    const lines = sectionContent.split('\n');

    for (const line of lines) {
      // Check for type header
      const typeMatch = line.match(/^###\s+(\w+)/i);
      if (typeMatch) {
        const type = typeMatch[1].toLowerCase();
        if (typeMap[type]) {
          currentType = typeMap[type];
        }
        continue;
      }

      // Check for entry
      const entryMatch = line.match(/^-\s+(.+)$/);
      if (entryMatch) {
        const entryText = entryMatch[1];
        const entry = this.parseEntry(entryText, currentType);
        entries.push(entry);
      }
    }

    return entries;
  }

  // Parse individual entry
  private parseEntry(text: string, type: ChangelogEntry['type']): ChangelogEntry {
    const entry: ChangelogEntry = { type, description: text };

    // Check for scope: **scope:** description
    const scopeMatch = text.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
    if (scopeMatch) {
      entry.scope = scopeMatch[1];
      entry.description = scopeMatch[2];
    }

    // Check for breaking change
    if (text.includes('**BREAKING:**') || text.includes('**BREAKING**')) {
      entry.breaking = true;
      entry.description = entry.description.replace(/\*\*BREAKING\*\*:?\s*/g, '');
    }

    // Extract issue references
    const issueMatch = entry.description.match(/#(\d+)/);
    if (issueMatch) {
      entry.issue = issueMatch[1];
    }

    // Extract PR references
    const prMatch = entry.description.match(/!(\d+)/);
    if (prMatch) {
      entry.pr = prMatch[1];
    }

    // Clean description (remove references at end)
    entry.description = entry.description
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim();

    return entry;
  }

  // Get version by number
  getVersion(content: string, version: string): ChangelogVersion | null {
    const versions = this.parse(content);
    return versions.find(v => v.version === version) || null;
  }

  // Get latest version
  getLatestVersion(content: string): ChangelogVersion | null {
    const versions = this.parse(content);
    // Skip "Unreleased"
    return versions.find(v => v.version !== 'Unreleased') || null;
  }

  // Get unreleased changes
  getUnreleased(content: string): ChangelogVersion | null {
    const versions = this.parse(content);
    return versions.find(v => v.version === 'Unreleased') || null;
  }
}

export { ChangelogParser };
```

## Express.js API

```typescript
// src/routes/changelog.ts
import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ChangelogGenerator, ChangelogEntry } from '../services/docs/changelog-generator';
import { ChangelogParser } from '../services/docs/changelog-parser';

const router = Router();
const parser = new ChangelogParser();

// Get changelog
router.get('/', async (req: Request, res: Response) => {
  try {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');

    if (!existsSync(changelogPath)) {
      return res.status(404).json({ error: 'Changelog not found' });
    }

    const content = readFileSync(changelogPath, 'utf-8');
    const versions = parser.parse(content);

    res.json({ versions });
  } catch (error) {
    console.error('Get changelog error:', error);
    res.status(500).json({ error: 'Failed to get changelog' });
  }
});

// Get specific version
router.get('/version/:version', async (req: Request, res: Response) => {
  try {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    const content = readFileSync(changelogPath, 'utf-8');
    const version = parser.getVersion(content, req.params.version);

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({ version });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ error: 'Failed to get version' });
  }
});

// Get unreleased changes
router.get('/unreleased', async (req: Request, res: Response) => {
  try {
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    const content = readFileSync(changelogPath, 'utf-8');
    const unreleased = parser.getUnreleased(content);

    res.json({ unreleased });
  } catch (error) {
    console.error('Get unreleased error:', error);
    res.status(500).json({ error: 'Failed to get unreleased' });
  }
});

// Generate changelog from git
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { repoUrl, includeCommitHash, includeAuthor } = req.body;

    const generator = new ChangelogGenerator({
      repoUrl,
      includeCommitHash,
      includeAuthor,
    });

    const content = generator.generateFromGit();

    res.json({ content });
  } catch (error) {
    console.error('Generate changelog error:', error);
    res.status(500).json({ error: 'Failed to generate changelog' });
  }
});

// Add new entry
router.post('/entry', async (req: Request, res: Response) => {
  try {
    const entry: ChangelogEntry = req.body;
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');

    let content = existsSync(changelogPath)
      ? readFileSync(changelogPath, 'utf-8')
      : '';

    // Add to unreleased section
    const unreleasedMatch = content.match(/## \[Unreleased\][^\n]*\n/);

    if (unreleasedMatch) {
      const insertPoint = unreleasedMatch.index! + unreleasedMatch[0].length;
      const typeHeader = `### ${entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}`;

      // Check if type section exists
      const typeIndex = content.indexOf(typeHeader, insertPoint);
      const nextVersionIndex = content.indexOf('## [', insertPoint);

      if (typeIndex > -1 && (nextVersionIndex === -1 || typeIndex < nextVersionIndex)) {
        // Add to existing type section
        const lineEnd = content.indexOf('\n', typeIndex);
        const entryLine = `\n- ${entry.description}`;
        content = content.slice(0, lineEnd) + entryLine + content.slice(lineEnd);
      } else {
        // Create new type section
        const newSection = `\n${typeHeader}\n\n- ${entry.description}\n`;

        if (nextVersionIndex > -1) {
          content = content.slice(0, nextVersionIndex) + newSection + content.slice(nextVersionIndex);
        } else {
          content += newSection;
        }
      }
    }

    writeFileSync(changelogPath, content);

    res.json({ success: true });
  } catch (error) {
    console.error('Add entry error:', error);
    res.status(500).json({ error: 'Failed to add entry' });
  }
});

// Release version
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { version } = req.body;
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    let content = readFileSync(changelogPath, 'utf-8');

    const date = new Date().toISOString().split('T')[0];

    // Replace [Unreleased] with new version
    content = content.replace(
      /## \[Unreleased\]/,
      `## [Unreleased]\n\n## [${version}] - ${date}`
    );

    writeFileSync(changelogPath, content);

    res.json({ success: true, version, date });
  } catch (error) {
    console.error('Release error:', error);
    res.status(500).json({ error: 'Failed to release' });
  }
});

export default router;
```

## CLI Tool

```typescript
// src/cli/changelog-cli.ts
import { program } from 'commander';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ChangelogGenerator, ChangelogEntry } from '../services/docs/changelog-generator';
import { ChangelogParser } from '../services/docs/changelog-parser';

program
  .name('changelog')
  .description('Changelog management CLI')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize changelog')
  .option('-o, --output <path>', 'Output file', 'CHANGELOG.md')
  .action((options) => {
    const content = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
`;

    writeFileSync(options.output, content);
    console.log(`Initialized changelog: ${options.output}`);
  });

program
  .command('generate')
  .description('Generate changelog from git commits')
  .option('-o, --output <path>', 'Output file', 'CHANGELOG.md')
  .option('--repo <url>', 'Repository URL')
  .action((options) => {
    const generator = new ChangelogGenerator({
      repoUrl: options.repo,
    });

    const content = generator.generateFromGit();
    writeFileSync(options.output, content);
    console.log(`Generated changelog: ${options.output}`);
  });

program
  .command('add <type> <description>')
  .description('Add entry to unreleased section')
  .option('-s, --scope <scope>', 'Entry scope')
  .option('-b, --breaking', 'Breaking change')
  .option('-i, --issue <number>', 'Issue number')
  .action((type, description, options) => {
    const entry: ChangelogEntry = {
      type: type as ChangelogEntry['type'],
      description,
      scope: options.scope,
      breaking: options.breaking,
      issue: options.issue,
    };

    // Add entry to changelog
    console.log(`Added ${type}: ${description}`);
  });

program
  .command('release <version>')
  .description('Release unreleased changes as new version')
  .action((version) => {
    const changelogPath = 'CHANGELOG.md';
    let content = readFileSync(changelogPath, 'utf-8');

    const date = new Date().toISOString().split('T')[0];

    content = content.replace(
      /## \[Unreleased\]/,
      `## [Unreleased]\n\n## [${version}] - ${date}`
    );

    writeFileSync(changelogPath, content);
    console.log(`Released version ${version}`);
  });

program
  .command('show [version]')
  .description('Show changelog for version')
  .action((version) => {
    const parser = new ChangelogParser();
    const content = readFileSync('CHANGELOG.md', 'utf-8');

    if (version) {
      const versionData = parser.getVersion(content, version);
      console.log(JSON.stringify(versionData, null, 2));
    } else {
      const latest = parser.getLatestVersion(content);
      console.log(JSON.stringify(latest, null, 2));
    }
  });

program.parse();
```

## CLAUDE.md Integration

```markdown
## Changelog Management

### Commands
- `changelog:init` - Initialize CHANGELOG.md
- `changelog:generate` - Generate from git commits
- `changelog:add <type> <desc>` - Add entry
- `changelog:release <version>` - Release version

### Key Files
- `src/services/docs/changelog-generator.ts` - Generator
- `src/services/docs/changelog-parser.ts` - Parser
- `CHANGELOG.md` - Project changelog

### Entry Types
- `added` - New features
- `changed` - Changes to existing functionality
- `deprecated` - Soon-to-be removed features
- `removed` - Removed features
- `fixed` - Bug fixes
- `security` - Security fixes

### Conventional Commits
- `feat:` → Added
- `fix:` → Fixed
- `docs:` → Changed
- `BREAKING CHANGE:` → Breaking
```

## AI Suggestions

1. **CI Integration**: Generate changelog in CI/CD pipeline
2. **PR Descriptions**: Extract changelog entries from PRs
3. **Validation**: Validate changelog format in pre-commit
4. **Auto-Release**: Trigger releases based on changelog
5. **Multi-Format**: Export to JSON, RSS, or email
6. **Notifications**: Notify users of new releases
7. **Diff View**: Show diff between versions
8. **Deprecation Tracking**: Track deprecated feature timelines
9. **Breaking Changes**: Highlight migration guides
10. **Statistics**: Analyze release patterns and velocity
