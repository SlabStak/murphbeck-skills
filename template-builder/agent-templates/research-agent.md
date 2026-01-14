# Research Agent Template

## Overview
Comprehensive research agent setup with web search, information synthesis, source validation, and knowledge extraction capabilities.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod cheerio
```

## Core Research Agent

### src/agents/research/agent.ts
```typescript
// src/agents/research/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

interface Source {
  id: string;
  url?: string;
  title: string;
  content: string;
  credibility: number;
  timestamp: number;
  type: 'web' | 'document' | 'api' | 'database';
}

interface ResearchFinding {
  id: string;
  topic: string;
  summary: string;
  details: string;
  sources: string[];
  confidence: number;
  timestamp: number;
}

interface ResearchReport {
  id: string;
  query: string;
  findings: ResearchFinding[];
  sources: Source[];
  summary: string;
  createdAt: number;
  completedAt?: number;
}

interface ResearchConfig {
  maxSources: number;
  minCredibility: number;
  searchDepth: 'shallow' | 'medium' | 'deep';
  includeAnalysis: boolean;
  model: string;
}

export class ResearchAgent {
  private client: Anthropic;
  private config: ResearchConfig;
  private sources: Map<string, Source> = new Map();
  private reports: Map<string, ResearchReport> = new Map();

  constructor(config: Partial<ResearchConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      maxSources: 10,
      minCredibility: 0.6,
      searchDepth: 'medium',
      includeAnalysis: true,
      model: 'claude-sonnet-4-20250514',
      ...config
    };
  }

  // Main research method
  async research(query: string): Promise<ResearchReport> {
    const report: ResearchReport = {
      id: uuidv4(),
      query,
      findings: [],
      sources: [],
      summary: '',
      createdAt: Date.now()
    };

    console.log(`[Research] Starting research: ${query}`);

    try {
      // Step 1: Generate search queries
      const searchQueries = await this.generateSearchQueries(query);
      console.log(`[Research] Generated ${searchQueries.length} search queries`);

      // Step 2: Gather sources
      for (const searchQuery of searchQueries) {
        const sources = await this.searchSources(searchQuery);
        sources.forEach(s => {
          if (!this.sources.has(s.id)) {
            this.sources.set(s.id, s);
            report.sources.push(s);
          }
        });

        if (report.sources.length >= this.config.maxSources) break;
      }
      console.log(`[Research] Gathered ${report.sources.length} sources`);

      // Step 3: Extract findings
      report.findings = await this.extractFindings(query, report.sources);
      console.log(`[Research] Extracted ${report.findings.length} findings`);

      // Step 4: Synthesize summary
      report.summary = await this.synthesizeSummary(query, report.findings);
      report.completedAt = Date.now();

      this.reports.set(report.id, report);
      return report;
    } catch (error) {
      console.error(`[Research] Error: ${error}`);
      report.summary = `Research failed: ${error}`;
      report.completedAt = Date.now();
      return report;
    }
  }

  // Generate search queries from research question
  private async generateSearchQueries(query: string): Promise<string[]> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      system: 'Generate search queries to research a topic. Output a JSON array of search query strings.',
      messages: [{
        role: 'user',
        content: `Research question: "${query}"

Generate ${this.config.searchDepth === 'deep' ? '5-7' : this.config.searchDepth === 'medium' ? '3-5' : '2-3'} specific search queries that would help answer this question.

Consider different angles:
- Direct answers
- Background/context
- Expert opinions
- Recent developments
- Counter-arguments

Output as JSON array of strings.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch {
        return [query];
      }
    }
    return [query];
  }

  // Search for sources (placeholder - implement with actual search API)
  private async searchSources(query: string): Promise<Source[]> {
    // This is a placeholder - implement with actual search API
    // Examples: Bing API, Google Custom Search, SerpAPI, Tavily
    console.log(`[Research] Searching: ${query}`);

    // Simulate source gathering
    const source: Source = {
      id: uuidv4(),
      title: `Search results for: ${query}`,
      content: `Simulated search results for: ${query}. In production, integrate with a search API.`,
      credibility: 0.7,
      timestamp: Date.now(),
      type: 'web'
    };

    return [source];
  }

  // Extract findings from sources
  private async extractFindings(
    query: string,
    sources: Source[]
  ): Promise<ResearchFinding[]> {
    const sourceContent = sources
      .map((s, i) => `[Source ${i + 1}] ${s.title}\n${s.content}`)
      .join('\n\n');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      system: `You are a research analyst. Extract key findings from sources.
Output a JSON array of findings with: topic, summary, details, sourceNumbers (array), confidence (0-1).`,
      messages: [{
        role: 'user',
        content: `Research question: "${query}"

Sources:
${sourceContent}

Extract the key findings. For each finding:
1. Identify the topic/aspect
2. Provide a concise summary
3. Include relevant details
4. Note which source numbers support it
5. Rate your confidence (0-1)

Output as JSON array.`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];

    try {
      const match = content.text.match(/\[[\s\S]*\]/);
      if (!match) return [];

      const findingsData = JSON.parse(match[0]) as Array<{
        topic: string;
        summary: string;
        details: string;
        sourceNumbers: number[];
        confidence: number;
      }>;

      return findingsData.map(f => ({
        id: uuidv4(),
        topic: f.topic,
        summary: f.summary,
        details: f.details,
        sources: f.sourceNumbers.map(n => sources[n - 1]?.id).filter(Boolean),
        confidence: f.confidence,
        timestamp: Date.now()
      }));
    } catch {
      return [];
    }
  }

  // Synthesize findings into summary
  private async synthesizeSummary(
    query: string,
    findings: ResearchFinding[]
  ): Promise<string> {
    const findingsText = findings
      .map(f => `- ${f.topic}: ${f.summary} (confidence: ${f.confidence})`)
      .join('\n');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Research question: "${query}"

Key findings:
${findingsText}

Write a comprehensive summary that:
1. Directly addresses the research question
2. Synthesizes the key findings
3. Notes any conflicting information
4. Identifies gaps in the research
5. Provides actionable insights

Keep it well-organized and informative.`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  // Deep dive into a specific aspect
  async deepDive(reportId: string, topic: string): Promise<ResearchFinding[]> {
    const report = this.reports.get(reportId);
    if (!report) throw new Error('Report not found');

    console.log(`[Research] Deep diving into: ${topic}`);

    // Generate specific queries for the topic
    const queries = await this.generateSearchQueries(`${report.query} - ${topic}`);

    // Gather more sources
    const newSources: Source[] = [];
    for (const query of queries.slice(0, 3)) {
      const sources = await this.searchSources(query);
      newSources.push(...sources);
    }

    // Extract additional findings
    const findings = await this.extractFindings(
      `${report.query} - specifically about ${topic}`,
      newSources
    );

    // Add to report
    report.sources.push(...newSources);
    report.findings.push(...findings);

    return findings;
  }

  // Validate a claim against sources
  async validateClaim(claim: string): Promise<{
    supported: boolean;
    confidence: number;
    evidence: string[];
    counterEvidence: string[];
  }> {
    const sources = await this.searchSources(`"${claim}" fact check`);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      system: `You are a fact-checker. Evaluate claims against evidence.`,
      messages: [{
        role: 'user',
        content: `Claim: "${claim}"

Available sources:
${sources.map(s => `- ${s.title}: ${s.content}`).join('\n')}

Evaluate this claim. Output JSON:
{
  "supported": boolean,
  "confidence": 0-1,
  "evidence": ["supporting evidence"],
  "counterEvidence": ["contradicting evidence"]
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
      supported: false,
      confidence: 0,
      evidence: [],
      counterEvidence: []
    };
  }

  // Get report
  getReport(reportId: string): ResearchReport | undefined {
    return this.reports.get(reportId);
  }

  // Export report as markdown
  exportAsMarkdown(reportId: string): string {
    const report = this.reports.get(reportId);
    if (!report) return '';

    let md = `# Research Report\n\n`;
    md += `**Query:** ${report.query}\n\n`;
    md += `**Date:** ${new Date(report.createdAt).toISOString()}\n\n`;

    md += `## Summary\n\n${report.summary}\n\n`;

    md += `## Key Findings\n\n`;
    report.findings.forEach((f, i) => {
      md += `### ${i + 1}. ${f.topic}\n\n`;
      md += `${f.summary}\n\n`;
      md += `${f.details}\n\n`;
      md += `*Confidence: ${(f.confidence * 100).toFixed(0)}%*\n\n`;
    });

    md += `## Sources\n\n`;
    report.sources.forEach((s, i) => {
      md += `${i + 1}. ${s.title}`;
      if (s.url) md += ` - [Link](${s.url})`;
      md += `\n`;
    });

    return md;
  }
}
```

### src/agents/research/web-scraper.ts
```typescript
// src/agents/research/web-scraper.ts
import * as cheerio from 'cheerio';

interface ScrapedContent {
  title: string;
  description: string;
  content: string;
  links: string[];
  images: string[];
}

export class WebScraper {
  private userAgent = 'ResearchBot/1.0';

  async scrape(url: string): Promise<ScrapedContent> {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': this.userAgent }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      return this.parseHtml(html, url);
    } catch (error) {
      throw new Error(`Failed to scrape ${url}: ${error}`);
    }
  }

  private parseHtml(html: string, baseUrl: string): ScrapedContent {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, iframe').remove();

    // Extract title
    const title = $('title').text().trim() ||
                  $('h1').first().text().trim() ||
                  'Untitled';

    // Extract description
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') ||
                       '';

    // Extract main content
    const content = this.extractMainContent($);

    // Extract links
    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          links.push(absoluteUrl);
        } catch {}
      }
    });

    // Extract images
    const images: string[] = [];
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          images.push(absoluteUrl);
        } catch {}
      }
    });

    return {
      title,
      description,
      content: content.substring(0, 10000), // Limit content size
      links: [...new Set(links)].slice(0, 50),
      images: [...new Set(images)].slice(0, 20)
    };
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Try common content selectors
    const contentSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        return element.text().replace(/\s+/g, ' ').trim();
      }
    }

    // Fallback to body
    return $('body').text().replace(/\s+/g, ' ').trim();
  }
}
```

### src/agents/research/knowledge-base.ts
```typescript
// src/agents/research/knowledge-base.ts

interface KnowledgeEntry {
  id: string;
  topic: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
}

export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private topicIndex: Map<string, Set<string>> = new Map();

  // Add knowledge entry
  add(entry: Omit<KnowledgeEntry, 'createdAt' | 'updatedAt'>): void {
    const now = Date.now();
    const fullEntry: KnowledgeEntry = {
      ...entry,
      createdAt: now,
      updatedAt: now
    };

    this.entries.set(entry.id, fullEntry);

    // Index by topic
    if (!this.topicIndex.has(entry.topic)) {
      this.topicIndex.set(entry.topic, new Set());
    }
    this.topicIndex.get(entry.topic)!.add(entry.id);
  }

  // Get entry by ID
  get(id: string): KnowledgeEntry | undefined {
    return this.entries.get(id);
  }

  // Search by topic
  getByTopic(topic: string): KnowledgeEntry[] {
    const ids = this.topicIndex.get(topic);
    if (!ids) return [];
    return Array.from(ids).map(id => this.entries.get(id)!).filter(Boolean);
  }

  // Search by keyword
  search(query: string): KnowledgeEntry[] {
    const queryLower = query.toLowerCase();
    return Array.from(this.entries.values()).filter(entry =>
      entry.topic.toLowerCase().includes(queryLower) ||
      entry.content.toLowerCase().includes(queryLower)
    );
  }

  // Update entry
  update(id: string, updates: Partial<KnowledgeEntry>): void {
    const entry = this.entries.get(id);
    if (entry) {
      Object.assign(entry, updates, { updatedAt: Date.now() });
    }
  }

  // Delete entry
  delete(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      this.topicIndex.get(entry.topic)?.delete(id);
      this.entries.delete(id);
    }
  }

  // Get all topics
  getTopics(): string[] {
    return Array.from(this.topicIndex.keys());
  }

  // Export as JSON
  export(): object {
    return {
      entries: Array.from(this.entries.values()),
      topics: this.getTopics()
    };
  }

  // Import from JSON
  import(data: { entries: KnowledgeEntry[] }): void {
    for (const entry of data.entries) {
      this.entries.set(entry.id, entry);
      if (!this.topicIndex.has(entry.topic)) {
        this.topicIndex.set(entry.topic, new Set());
      }
      this.topicIndex.get(entry.topic)!.add(entry.id);
    }
  }
}
```

## Usage Example

### src/agents/research/example.ts
```typescript
// src/agents/research/example.ts
import { ResearchAgent } from './agent';
import { KnowledgeBase } from './knowledge-base';

async function main() {
  const agent = new ResearchAgent({
    searchDepth: 'medium',
    maxSources: 5
  });

  console.log('=== Research Agent Demo ===\n');

  // Conduct research
  const report = await agent.research(
    'What are the best practices for building scalable microservices architecture?'
  );

  console.log('\n=== Research Report ===\n');
  console.log('Query:', report.query);
  console.log('Sources found:', report.sources.length);
  console.log('Findings:', report.findings.length);

  console.log('\n--- Summary ---');
  console.log(report.summary);

  console.log('\n--- Key Findings ---');
  report.findings.forEach((f, i) => {
    console.log(`\n${i + 1}. ${f.topic}`);
    console.log(`   ${f.summary}`);
    console.log(`   Confidence: ${(f.confidence * 100).toFixed(0)}%`);
  });

  // Validate a claim
  console.log('\n=== Claim Validation ===\n');
  const validation = await agent.validateClaim(
    'Microservices are always better than monolithic architectures'
  );
  console.log('Claim supported:', validation.supported);
  console.log('Confidence:', (validation.confidence * 100).toFixed(0) + '%');

  // Export as markdown
  console.log('\n=== Markdown Export ===\n');
  const markdown = agent.exportAsMarkdown(report.id);
  console.log(markdown.substring(0, 500) + '...');
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Research Agent

### Features
- Multi-query search strategy
- Source credibility assessment
- Finding extraction and synthesis
- Claim validation
- Knowledge base integration

### Usage
```typescript
const agent = new ResearchAgent({
  searchDepth: 'deep',
  maxSources: 10
});

const report = await agent.research('Your research question');
```

### Search Depth
- `shallow`: 2-3 queries, quick results
- `medium`: 3-5 queries, balanced
- `deep`: 5-7 queries, comprehensive

### Output Formats
```typescript
// Markdown export
const md = agent.exportAsMarkdown(reportId);

// JSON export
const report = agent.getReport(reportId);
```

### Claim Validation
```typescript
const result = await agent.validateClaim('Some claim to verify');
```
```

## AI Suggestions

1. **Source ranking** - Prioritize credible sources
2. **Citation tracking** - Proper attribution
3. **Bias detection** - Identify source bias
4. **Gap analysis** - Find missing information
5. **Timeline construction** - Historical context
6. **Expert identification** - Find authorities
7. **Comparison tables** - Structured comparisons
8. **Visual summaries** - Charts and graphs
9. **Follow-up questions** - Suggest next research
10. **Collaborative research** - Multi-agent research
