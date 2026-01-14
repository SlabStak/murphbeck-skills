# Release Notes Documentation Template

## Overview
Templates and automation for generating professional release notes from commits, PRs, and changelogs with categorization and formatting.

## Quick Start
```bash
npm install release-it @release-it/conventional-changelog
npx release-it --dry-run
```

## Release Notes Template

### RELEASE-vX.Y.Z.md
```markdown
# Release v2.5.0

**Release Date:** January 15, 2024
**Tag:** `v2.5.0`
**Branch:** `release/2.5.0`

## Highlights

This release introduces **multi-tenant workspaces**, a highly requested feature that allows organizations to manage multiple isolated environments. We've also made significant performance improvements to the dashboard.

### Key Features

- 🏢 **Multi-Tenant Workspaces** - Create isolated environments for different teams or projects
- ⚡ **50% Faster Dashboard** - Optimized queries and caching for better performance
- 🔒 **Enhanced Security** - Added support for SAML SSO and improved audit logging

---

## What's New

### Features

#### Multi-Tenant Workspaces (#1234)

Organizations can now create multiple workspaces, each with isolated data, users, and settings. This enables:

- Separate environments for development, staging, and production
- Different teams within an organization
- Client-specific configurations

```typescript
// Create a new workspace
const workspace = await client.workspaces.create({
  name: 'Production',
  settings: {
    dataRetention: 90,
    region: 'us-east-1'
  }
});
```

**Documentation:** [Multi-Tenant Guide](/docs/guides/multi-tenant)

#### Dashboard Performance Improvements (#1256)

We've optimized the dashboard with:
- Query result caching (Redis)
- Virtualized list rendering
- Lazy loading for charts

**Before:** Average load time 2.5s
**After:** Average load time 1.2s

#### SAML SSO Support (#1189)

Enterprise customers can now configure SAML-based single sign-on:

- Supports Okta, Azure AD, OneLogin
- Just-in-time user provisioning
- Group-based role mapping

**Documentation:** [SAML SSO Setup](/docs/security/saml-sso)

### Improvements

- **API Rate Limiting** - Configurable rate limits per API key (#1245)
- **Export Performance** - CSV exports 3x faster (#1267)
- **Search** - Full-text search now supports fuzzy matching (#1278)
- **UI** - Redesigned settings page for better usability (#1290)
- **SDK** - TypeScript SDK now includes detailed type definitions (#1234)

### Bug Fixes

- Fixed pagination issue with large datasets (#1302)
- Resolved timezone handling in scheduled reports (#1298)
- Fixed memory leak in WebSocket connections (#1287)
- Corrected permission check for team invitations (#1276)
- Fixed CSV export encoding for special characters (#1265)

### Security

- **CVE-2024-1234** - Fixed XSS vulnerability in markdown rendering
- Added Content Security Policy headers
- Updated dependencies with security vulnerabilities

---

## Breaking Changes

### API Changes

#### Renamed Endpoints

The following endpoints have been renamed for consistency:

| Old Endpoint | New Endpoint |
|-------------|--------------|
| `GET /api/v1/user/orgs` | `GET /api/v1/users/organizations` |
| `POST /api/v1/report/run` | `POST /api/v1/reports/execute` |

The old endpoints will continue to work until v3.0 but are deprecated.

#### Response Format Changes

The `list` endpoints now use a consistent pagination format:

```json
// Before
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20
}

// After
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Configuration Changes

The `config.yaml` schema has been updated:

```yaml
# Before
database:
  host: localhost
  port: 5432

# After
database:
  connection:
    host: localhost
    port: 5432
  pool:
    min: 2
    max: 10
```

Run `npm run config:migrate` to automatically update your configuration.

---

## Migration Guide

### From v2.4.x to v2.5.0

1. **Update Dependencies**
   ```bash
   npm update @company/sdk@2.5.0
   ```

2. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Update Configuration**
   ```bash
   npm run config:migrate
   ```

4. **Update API Calls** (if using deprecated endpoints)
   - See [API Changes](#api-changes) section

5. **Test Your Integration**
   ```bash
   npm run test:integration
   ```

### Rollback Instructions

If you encounter issues:

```bash
# Revert to previous version
npm install @company/sdk@2.4.5

# Rollback database
npm run db:migrate:rollback --version=2.4.5
```

---

## Deprecations

The following features are deprecated and will be removed in v3.0:

| Feature | Deprecated | Removal | Alternative |
|---------|------------|---------|-------------|
| Legacy auth API | v2.5.0 | v3.0.0 | Use OAuth2 flow |
| XML export format | v2.5.0 | v3.0.0 | Use JSON export |
| `v1/user/*` endpoints | v2.5.0 | v3.0.0 | Use `v1/users/*` |

---

## Known Issues

- Dashboard charts may flicker on Safari 16 (#1310)
- Large file uploads (>100MB) timeout on slow connections (#1315)
- Workspace switching requires page refresh (#1320)

Workarounds available in [Known Issues Documentation](/docs/known-issues).

---

## Dependencies

### Updated

| Package | From | To |
|---------|------|-----|
| next | 14.0.0 | 14.1.0 |
| prisma | 5.6.0 | 5.8.0 |
| typescript | 5.2.0 | 5.3.0 |

### Security Updates

| Package | Severity | CVE |
|---------|----------|-----|
| axios | High | CVE-2024-1234 |
| lodash | Medium | CVE-2024-5678 |

---

## Contributors

Thanks to our contributors for this release:

- @developer1 - Multi-tenant workspaces
- @developer2 - Dashboard performance
- @developer3 - SAML SSO support
- @community-member - Bug fixes

Special thanks to our beta testers who helped identify issues before release!

---

## Resources

- [Full Changelog](https://github.com/company/app/compare/v2.4.5...v2.5.0)
- [Documentation](https://docs.company.com)
- [Migration Guide](https://docs.company.com/migration/2.5)
- [API Reference](https://docs.company.com/api)
- [Support](https://support.company.com)

---

## Feedback

We'd love to hear your feedback on this release:

- 📝 [GitHub Discussions](https://github.com/company/app/discussions)
- 💬 [Discord Community](https://discord.gg/company)
- 📧 [Email Support](mailto:support@company.com)
```

## Release Notes Generator

```typescript
// tools/release-notes-generator.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface Commit {
  hash: string;
  type: string;
  scope: string;
  subject: string;
  body: string;
  breaking: boolean;
  issues: string[];
  author: string;
}

interface ReleaseNotesConfig {
  version: string;
  previousVersion: string;
  date?: string;
  highlights?: string[];
}

class ReleaseNotesGenerator {
  private commits: Commit[] = [];

  constructor(private config: ReleaseNotesConfig) {}

  async generate(): Promise<string> {
    this.commits = await this.getCommits();
    return this.buildReleaseNotes();
  }

  private async getCommits(): Promise<Commit[]> {
    const range = `${this.config.previousVersion}..HEAD`;
    const format = '%H|%s|%b|%an';

    const output = execSync(`git log ${range} --format="${format}"`)
      .toString()
      .trim();

    if (!output) return [];

    return output.split('\n').map(line => {
      const [hash, subject, body, author] = line.split('|');
      return this.parseCommit(hash, subject, body || '', author);
    });
  }

  private parseCommit(
    hash: string,
    subject: string,
    body: string,
    author: string
  ): Commit {
    // Parse conventional commit format
    const match = subject.match(/^(\w+)(?:\(([^)]+)\))?\!?:\s*(.+)$/);

    const type = match?.[1] || 'other';
    const scope = match?.[2] || '';
    const message = match?.[3] || subject;

    // Check for breaking changes
    const breaking = subject.includes('!:') ||
                    body.toLowerCase().includes('breaking change');

    // Extract issue references
    const issues = [...body.matchAll(/#(\d+)/g)].map(m => m[1]);

    return {
      hash: hash.slice(0, 7),
      type,
      scope,
      subject: message,
      body,
      breaking,
      issues,
      author
    };
  }

  private buildReleaseNotes(): string {
    const date = this.config.date || new Date().toISOString().split('T')[0];

    let notes = `# Release v${this.config.version}

**Release Date:** ${date}
**Tag:** \`v${this.config.version}\`

`;

    // Highlights
    if (this.config.highlights?.length) {
      notes += `## Highlights\n\n`;
      for (const highlight of this.config.highlights) {
        notes += `- ${highlight}\n`;
      }
      notes += '\n---\n\n';
    }

    // Features
    const features = this.commits.filter(c => c.type === 'feat');
    if (features.length) {
      notes += `## ✨ Features\n\n`;
      notes += this.formatCommits(features);
    }

    // Improvements
    const improvements = this.commits.filter(c =>
      ['perf', 'refactor', 'style'].includes(c.type)
    );
    if (improvements.length) {
      notes += `## 🚀 Improvements\n\n`;
      notes += this.formatCommits(improvements);
    }

    // Bug Fixes
    const fixes = this.commits.filter(c => c.type === 'fix');
    if (fixes.length) {
      notes += `## 🐛 Bug Fixes\n\n`;
      notes += this.formatCommits(fixes);
    }

    // Documentation
    const docs = this.commits.filter(c => c.type === 'docs');
    if (docs.length) {
      notes += `## 📚 Documentation\n\n`;
      notes += this.formatCommits(docs);
    }

    // Breaking Changes
    const breaking = this.commits.filter(c => c.breaking);
    if (breaking.length) {
      notes += `## ⚠️ Breaking Changes\n\n`;
      for (const commit of breaking) {
        notes += `### ${commit.subject}\n\n`;
        if (commit.body) {
          notes += `${commit.body}\n\n`;
        }
      }
    }

    // Contributors
    const authors = [...new Set(this.commits.map(c => c.author))];
    if (authors.length) {
      notes += `## 👥 Contributors\n\n`;
      notes += `Thanks to our contributors:\n\n`;
      for (const author of authors) {
        notes += `- @${author.toLowerCase().replace(/\s+/g, '')}\n`;
      }
      notes += '\n';
    }

    // Links
    notes += `---\n\n`;
    notes += `## 🔗 Links\n\n`;
    notes += `- [Full Changelog](../../compare/v${this.config.previousVersion}...v${this.config.version})\n`;
    notes += `- [Documentation](https://docs.example.com)\n`;

    return notes;
  }

  private formatCommits(commits: Commit[]): string {
    let output = '';

    for (const commit of commits) {
      const scope = commit.scope ? `**${commit.scope}:** ` : '';
      const issues = commit.issues.length
        ? ` (${commit.issues.map(i => `#${i}`).join(', ')})`
        : '';

      output += `- ${scope}${commit.subject}${issues}\n`;
    }

    return output + '\n';
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const version = args[0] || '1.0.0';
  const previousVersion = args[1] || 'v0.0.0';

  const generator = new ReleaseNotesGenerator({
    version,
    previousVersion,
    highlights: [
      'Major performance improvements',
      'New API endpoints'
    ]
  });

  const notes = await generator.generate();

  // Write to file
  const outputPath = `docs/releases/RELEASE-v${version}.md`;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, notes);

  console.log(`Release notes generated: ${outputPath}`);
}

main().catch(console.error);
```

## release-it Configuration

```json
// .release-it.json
{
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "v${version}",
    "tagAnnotation": "Release v${version}",
    "push": true,
    "requireBranch": "main",
    "requireCleanWorkingDir": true
  },
  "github": {
    "release": true,
    "releaseName": "v${version}",
    "releaseNotes": null,
    "draft": false,
    "preRelease": false,
    "assets": [
      "dist/*.zip"
    ]
  },
  "npm": {
    "publish": true,
    "publishPath": ".",
    "tag": "latest"
  },
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": {
        "name": "conventionalcommits",
        "types": [
          { "type": "feat", "section": "✨ Features" },
          { "type": "fix", "section": "🐛 Bug Fixes" },
          { "type": "perf", "section": "⚡ Performance" },
          { "type": "docs", "section": "📚 Documentation" },
          { "type": "chore", "hidden": true },
          { "type": "refactor", "section": "♻️ Refactoring" }
        ]
      },
      "infile": "CHANGELOG.md",
      "header": "# Changelog"
    }
  },
  "hooks": {
    "before:init": [
      "npm run test",
      "npm run lint"
    ],
    "after:bump": [
      "npm run build"
    ],
    "after:release": [
      "echo Successfully released ${name} v${version}"
    ]
  }
}
```

## Semantic Release Config

```javascript
// release.config.js
module.exports = {
  branches: [
    'main',
    { name: 'beta', prerelease: true },
    { name: 'alpha', prerelease: true }
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'conventionalcommits',
      releaseRules: [
        { type: 'feat', release: 'minor' },
        { type: 'fix', release: 'patch' },
        { type: 'perf', release: 'patch' },
        { type: 'docs', scope: 'README', release: 'patch' },
        { breaking: true, release: 'major' }
      ]
    }],
    ['@semantic-release/release-notes-generator', {
      preset: 'conventionalcommits',
      presetConfig: {
        types: [
          { type: 'feat', section: 'Features', hidden: false },
          { type: 'fix', section: 'Bug Fixes', hidden: false },
          { type: 'perf', section: 'Performance', hidden: false },
          { type: 'docs', section: 'Documentation', hidden: false },
          { type: 'chore', hidden: true }
        ]
      }
    }],
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md'
    }],
    ['@semantic-release/npm'],
    ['@semantic-release/github', {
      assets: ['dist/*.zip']
    }],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }]
  ]
};
```

## CLAUDE.md Integration

```markdown
## Release Notes

### Generation
- Auto-generate from conventional commits
- Include breaking changes section
- List contributors
- Link to full changelog

### Sections
1. Highlights - Key features
2. Features - New functionality
3. Improvements - Enhancements
4. Bug Fixes - Resolved issues
5. Breaking Changes - Migration needed
6. Deprecations - Future removals

### Commands
- `npm run release` - Create release
- `npm run release:dry` - Preview release
- `npm run release:notes` - Generate notes only
```

## AI Suggestions

1. **Auto-categorize commits** - Sort by type and impact
2. **Breaking change detection** - Identify breaking changes
3. **Issue linking** - Connect to issue tracker
4. **Contributor attribution** - Credit contributors
5. **Migration guide generation** - Create upgrade steps
6. **Deprecation tracking** - Track deprecation timeline
7. **Highlight extraction** - Identify key features
8. **Comparison links** - Generate diff links
9. **Security advisory** - Include CVE information
10. **Multi-platform notes** - Format for GitHub, npm, blog
