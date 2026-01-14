# Architecture Decision Records (ADR) Template

## Overview
Templates and tools for documenting architecture decisions with structured ADR format, decision tracking, and historical context.

## Quick Start
```bash
mkdir -p docs/adr
npm install adr-tools
adr init docs/adr
adr new "Use PostgreSQL for primary database"
```

## ADR Template

### ADR-NNNN-title.md
```markdown
# ADR-0001: Use PostgreSQL as Primary Database

| Field | Value |
|-------|-------|
| **Status** | Proposed / Accepted / Deprecated / Superseded |
| **Date** | 2024-01-15 |
| **Deciders** | @architect, @tech-lead, @dba |
| **Consulted** | @security-team, @ops-team |
| **Informed** | Engineering Team |

## Context

### Problem Statement

We need to select a primary database for our new microservices architecture. The database must support our requirements for:

- High availability and fault tolerance
- ACID transactions
- Complex queries with joins
- JSON document storage
- Full-text search
- Horizontal read scaling

### Current State

Currently, we use MySQL 5.7 for all data storage needs. This has served us well but has limitations:

- Limited JSON support
- No native full-text search
- Complex replication setup
- Limited parallel query execution

### Constraints

- Must support 10,000+ concurrent connections
- 99.99% availability requirement
- Data must be encrypted at rest and in transit
- Must comply with SOC2 and GDPR
- Budget: $50k/year for managed service

### Assumptions

- Read traffic will be 10x write traffic
- Data will grow to 5TB within 2 years
- We can accept eventual consistency for read replicas
- Team has experience with SQL databases

## Decision Drivers

1. **Performance** - Query performance for complex analytical queries
2. **Reliability** - High availability and disaster recovery
3. **Developer Experience** - Ease of use and familiar tooling
4. **Scalability** - Ability to scale horizontally
5. **Cost** - Total cost of ownership
6. **Ecosystem** - Available tools, libraries, and expertise

## Considered Options

### Option 1: PostgreSQL

**Description:** Open-source relational database with extensive features.

**Pros:**
- ✅ Excellent JSON support (JSONB)
- ✅ Built-in full-text search
- ✅ Advanced indexing (GiST, GIN, BRIN)
- ✅ Strong ACID compliance
- ✅ Extensive ecosystem
- ✅ Logical replication for read replicas
- ✅ Team familiarity

**Cons:**
- ❌ Complex clustering setup
- ❌ Write scaling requires sharding
- ❌ Higher memory requirements

**Evaluation:**
- Performance: ⭐⭐⭐⭐⭐
- Reliability: ⭐⭐⭐⭐
- Developer Experience: ⭐⭐⭐⭐⭐
- Scalability: ⭐⭐⭐
- Cost: ⭐⭐⭐⭐

### Option 2: MySQL 8.0

**Description:** Upgraded version of our current database.

**Pros:**
- ✅ Team familiarity
- ✅ Improved JSON support
- ✅ Good replication options
- ✅ Low migration effort

**Cons:**
- ❌ Still limited JSON functionality
- ❌ No native full-text search for JSONB
- ❌ Less advanced indexing
- ❌ Weaker query optimizer

**Evaluation:**
- Performance: ⭐⭐⭐
- Reliability: ⭐⭐⭐⭐
- Developer Experience: ⭐⭐⭐⭐
- Scalability: ⭐⭐⭐
- Cost: ⭐⭐⭐⭐⭐

### Option 3: CockroachDB

**Description:** Distributed SQL database with automatic sharding.

**Pros:**
- ✅ Automatic horizontal scaling
- ✅ Built-in high availability
- ✅ PostgreSQL wire protocol
- ✅ Geo-partitioning

**Cons:**
- ❌ Higher latency for single-node queries
- ❌ Limited ecosystem
- ❌ Higher operational complexity
- ❌ More expensive

**Evaluation:**
- Performance: ⭐⭐⭐
- Reliability: ⭐⭐⭐⭐⭐
- Developer Experience: ⭐⭐⭐
- Scalability: ⭐⭐⭐⭐⭐
- Cost: ⭐⭐

### Option 4: MongoDB

**Description:** Document database with flexible schema.

**Pros:**
- ✅ Flexible schema
- ✅ Native JSON storage
- ✅ Good horizontal scaling
- ✅ Built-in sharding

**Cons:**
- ❌ No ACID transactions (multi-document)
- ❌ Complex query limitations
- ❌ JOIN operations limited
- ❌ Team needs training

**Evaluation:**
- Performance: ⭐⭐⭐⭐
- Reliability: ⭐⭐⭐
- Developer Experience: ⭐⭐⭐
- Scalability: ⭐⭐⭐⭐
- Cost: ⭐⭐⭐

## Decision

**We will use PostgreSQL 15 as our primary database.**

### Rationale

1. **Best feature fit:** PostgreSQL's JSONB support, full-text search, and advanced indexing directly address our requirements without additional services.

2. **Team expertise:** Our team has extensive SQL experience, and PostgreSQL's standards compliance means minimal learning curve.

3. **Ecosystem:** Rich ecosystem of tools (pgAdmin, pg_dump, logical replication) and cloud-managed options (AWS RDS, Google Cloud SQL).

4. **Performance:** Benchmark tests showed PostgreSQL outperforming MySQL for our query patterns, especially complex JOINs and JSON queries.

5. **Future-proofing:** PostgreSQL's extension system (PostGIS, TimescaleDB, pg_vector) allows future expansion without database changes.

## Consequences

### Positive

- ✅ Single database for relational and JSON data
- ✅ No need for separate search service initially
- ✅ Simplified operations with one database type
- ✅ Better query performance for complex analytics

### Negative

- ❌ Migration effort from MySQL required
- ❌ Need to learn PostgreSQL-specific features
- ❌ Horizontal write scaling will require future ADR

### Neutral

- ➡️ Need to establish PostgreSQL best practices
- ➡️ Update monitoring for PostgreSQL metrics
- ➡️ Train ops team on PostgreSQL administration

## Implementation

### Migration Plan

1. **Phase 1 (Week 1-2):** Set up PostgreSQL infrastructure
2. **Phase 2 (Week 3-4):** Migrate schema and test data
3. **Phase 3 (Week 5-6):** Dual-write to both databases
4. **Phase 4 (Week 7-8):** Cutover and decommission MySQL

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Query latency P99 | < 100ms | Prometheus |
| Availability | 99.99% | Uptime monitoring |
| Migration downtime | < 1 hour | Maintenance window |

## Validation

### Technical Validation

- [x] Benchmark completed showing 30% improvement
- [x] PoC with production-like data successful
- [x] Security review passed
- [ ] DR testing scheduled

### Business Validation

- [x] Cost analysis approved by finance
- [x] Timeline approved by product
- [ ] Training plan approved by HR

## Related Decisions

- **Supersedes:** ADR-0000 (Initial MySQL selection)
- **Related:** ADR-0010 (Caching Strategy)
- **Enables:** ADR-0020 (Full-text Search Implementation)

## Notes

### Open Questions

- Q: Should we use Citus for horizontal scaling?
- A: Deferred to future ADR when needed.

### Meeting Notes

- 2024-01-10: Initial discussion, PostgreSQL and CockroachDB shortlisted
- 2024-01-12: Benchmark results reviewed, PostgreSQL selected
- 2024-01-15: ADR approved by architecture review board

## References

- [PostgreSQL 15 Release Notes](https://www.postgresql.org/docs/15/release-15.html)
- [Benchmark Results](./benchmarks/postgres-vs-mysql.md)
- [Migration Guide](./guides/mysql-to-postgres.md)

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2024-01-15 | @architect | Initial proposal |
| 2024-01-18 | @tech-lead | Added benchmark results |
| 2024-01-20 | @architect | Status changed to Accepted |
```

## Lightweight ADR Format

### ADR-NNNN-short.md
```markdown
# ADR-0002: Use TypeScript for Backend Services

## Status

Accepted

## Context

We need to choose a programming language for our new backend services. The team has experience with JavaScript, Python, and Go.

## Decision

We will use TypeScript for all new backend services.

## Consequences

- Type safety reduces runtime errors
- Shared code between frontend and backend
- Requires build step
- Team needs TypeScript training
```

## ADR Tools

### ADR Generator
```typescript
// tools/adr-generator.ts
import * as fs from 'fs';
import * as path from 'path';

interface ADRConfig {
  title: string;
  status?: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  deciders: string[];
  context: string;
  options: ADROption[];
  decision?: string;
  consequences?: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

interface ADROption {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
}

class ADRGenerator {
  private adrDir: string;

  constructor(adrDir = './docs/adr') {
    this.adrDir = adrDir;
  }

  getNextNumber(): number {
    const files = fs.readdirSync(this.adrDir)
      .filter(f => f.match(/^ADR-\d{4}/));

    if (files.length === 0) return 1;

    const numbers = files.map(f => {
      const match = f.match(/ADR-(\d{4})/);
      return match ? parseInt(match[1]) : 0;
    });

    return Math.max(...numbers) + 1;
  }

  generate(config: ADRConfig): string {
    const number = this.getNextNumber();
    const paddedNumber = String(number).padStart(4, '0');
    const slug = this.slugify(config.title);
    const filename = `ADR-${paddedNumber}-${slug}.md`;

    const content = this.buildContent(paddedNumber, config);

    const outputPath = path.join(this.adrDir, filename);
    fs.writeFileSync(outputPath, content);

    // Update index
    this.updateIndex();

    return outputPath;
  }

  private buildContent(number: string, config: ADRConfig): string {
    const date = new Date().toISOString().split('T')[0];

    let content = `# ADR-${number}: ${config.title}

| Field | Value |
|-------|-------|
| **Status** | ${config.status || 'Proposed'} |
| **Date** | ${date} |
| **Deciders** | ${config.deciders.join(', ')} |

## Context

${config.context}

## Considered Options

`;

    for (const option of config.options) {
      content += `### ${option.name}

${option.description}

**Pros:**
${option.pros.map(p => `- ✅ ${p}`).join('\n')}

**Cons:**
${option.cons.map(c => `- ❌ ${c}`).join('\n')}

`;
    }

    if (config.decision) {
      content += `## Decision

${config.decision}

`;
    }

    if (config.consequences) {
      content += `## Consequences

### Positive
${config.consequences.positive.map(p => `- ✅ ${p}`).join('\n')}

### Negative
${config.consequences.negative.map(n => `- ❌ ${n}`).join('\n')}

### Neutral
${config.consequences.neutral.map(n => `- ➡️ ${n}`).join('\n')}
`;
    }

    return content;
  }

  private updateIndex(): void {
    const files = fs.readdirSync(this.adrDir)
      .filter(f => f.match(/^ADR-\d{4}.*\.md$/))
      .sort();

    let index = `# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the project.

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
`;

    for (const file of files) {
      const content = fs.readFileSync(path.join(this.adrDir, file), 'utf-8');
      const titleMatch = content.match(/^# ADR-\d{4}: (.+)$/m);
      const statusMatch = content.match(/\*\*Status\*\*\s*\|\s*(.+?)\s*\|/);
      const dateMatch = content.match(/\*\*Date\*\*\s*\|\s*(.+?)\s*\|/);

      const title = titleMatch?.[1] || 'Unknown';
      const status = statusMatch?.[1] || 'Unknown';
      const date = dateMatch?.[1] || 'Unknown';
      const adrNumber = file.match(/ADR-(\d{4})/)?.[1] || '0000';

      index += `| [ADR-${adrNumber}](./${file}) | ${title} | ${status} | ${date} |\n`;
    }

    index += `
## Statuses

- **Proposed** - Under discussion
- **Accepted** - Approved and in effect
- **Deprecated** - No longer recommended
- **Superseded** - Replaced by another ADR

## Creating a New ADR

\`\`\`bash
npm run adr:new "Title of the decision"
\`\`\`

## Template

See [ADR-0000-template.md](./ADR-0000-template.md) for the full template.
`;

    fs.writeFileSync(path.join(this.adrDir, 'README.md'), index);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

  supersede(oldAdrNumber: string, newConfig: ADRConfig): string {
    // Mark old ADR as superseded
    const oldFile = fs.readdirSync(this.adrDir)
      .find(f => f.startsWith(`ADR-${oldAdrNumber}`));

    if (oldFile) {
      const oldPath = path.join(this.adrDir, oldFile);
      let oldContent = fs.readFileSync(oldPath, 'utf-8');
      oldContent = oldContent.replace(
        /\*\*Status\*\*\s*\|\s*.+?\s*\|/,
        `**Status** | Superseded |`
      );
      fs.writeFileSync(oldPath, oldContent);
    }

    // Create new ADR with reference to old
    newConfig.context = `This ADR supersedes ADR-${oldAdrNumber}.\n\n${newConfig.context}`;
    return this.generate(newConfig);
  }
}

export { ADRGenerator };
```

### ADR CLI
```typescript
// tools/adr-cli.ts
import { program } from 'commander';
import { ADRGenerator } from './adr-generator';
import * as readline from 'readline';

const generator = new ADRGenerator();

program
  .name('adr')
  .description('Architecture Decision Records management tool')
  .version('1.0.0');

program
  .command('new <title>')
  .description('Create a new ADR')
  .option('-s, --status <status>', 'Initial status', 'Proposed')
  .option('-d, --deciders <deciders>', 'Comma-separated deciders')
  .action(async (title, options) => {
    const deciders = options.deciders?.split(',') || ['@author'];

    const path = generator.generate({
      title,
      status: options.status,
      deciders,
      context: 'TODO: Describe the context',
      options: [
        {
          name: 'Option 1',
          description: 'TODO: Describe option 1',
          pros: ['Pro 1'],
          cons: ['Con 1']
        },
        {
          name: 'Option 2',
          description: 'TODO: Describe option 2',
          pros: ['Pro 1'],
          cons: ['Con 1']
        }
      ]
    });

    console.log(`Created: ${path}`);
  });

program
  .command('list')
  .description('List all ADRs')
  .option('--status <status>', 'Filter by status')
  .action((options) => {
    // List implementation
  });

program
  .command('supersede <old-number> <new-title>')
  .description('Create new ADR that supersedes an existing one')
  .action((oldNumber, newTitle) => {
    const path = generator.supersede(oldNumber, {
      title: newTitle,
      deciders: ['@author'],
      context: 'TODO: Describe why this supersedes the old decision',
      options: []
    });

    console.log(`Created: ${path}`);
    console.log(`ADR-${oldNumber} marked as Superseded`);
  });

program.parse();
```

## CLAUDE.md Integration

```markdown
## Architecture Decision Records

### ADR Format
- Use numbered format: ADR-NNNN-title.md
- Include status, date, deciders
- Document context, options, decision
- Track consequences (positive/negative/neutral)

### Statuses
- Proposed - Under discussion
- Accepted - Approved and active
- Deprecated - No longer recommended
- Superseded - Replaced by newer ADR

### Commands
- `npm run adr:new "Title"` - Create new ADR
- `npm run adr:list` - List all ADRs
- `npm run adr:supersede N "Title"` - Supersede existing

### When to Create ADR
- Technology choices
- Architecture patterns
- API design decisions
- Security approaches
- Any decision with long-term impact
```

## AI Suggestions

1. **Auto-generate ADRs** - Create from code reviews
2. **Decision tracking** - Monitor ADR status
3. **Impact analysis** - Link ADRs to code
4. **Option comparison** - Generate comparison tables
5. **Consequence prediction** - Suggest consequences
6. **Related ADR linking** - Auto-link related decisions
7. **Search and discovery** - Full-text ADR search
8. **Timeline visualization** - Show decision history
9. **Team assignment** - Route ADRs to reviewers
10. **Compliance checking** - Verify required approvals
