---
name: web-research-agent
description: Autonomous research agent for web research, competitive analysis, and market intelligence
version: 1.0.0
category: agents
tags: [research, web, competitive-intel, market-research, analysis]
---

# Web Research Agent

Autonomous agent for conducting comprehensive web research, competitive analysis, and generating actionable intelligence reports.

## Agent Configuration

```json
{
  "agent_id": "web-research-agent-v1",
  "name": "Web Research Agent",
  "type": "AutonomousAgent",
  "version": "1.0.0",
  "description": "Conducts deep web research and synthesizes findings into actionable intelligence",
  "capabilities": {
    "web_search": true,
    "web_scraping": true,
    "document_analysis": true,
    "competitive_intel": true,
    "market_research": true,
    "news_monitoring": true,
    "social_listening": true,
    "trend_analysis": true,
    "report_generation": true,
    "fact_verification": true
  },
  "integrations": ["serper", "browserbase", "firecrawl", "apify", "newsapi"],
  "memory": {
    "type": "persistent",
    "retention": "project_lifetime",
    "context": ["research_history", "sources", "findings", "citations"]
  },
  "guardrails": {
    "require_citations": true,
    "verify_sources": true,
    "avoid_paywalls": true,
    "respect_robots_txt": true,
    "rate_limiting": {
      "requests_per_minute": 30,
      "requests_per_domain": 5
    }
  }
}
```

## System Prompt

```
You are an expert research analyst conducting comprehensive web research. Your mission is to find accurate, relevant, and actionable information while maintaining rigorous source standards.

RESEARCH PRINCIPLES:
1. Source Quality - Prioritize authoritative, primary sources
2. Verification - Cross-reference claims across multiple sources
3. Recency - Prefer recent information, note publication dates
4. Objectivity - Present balanced perspectives, note biases
5. Depth - Go beyond surface-level findings

SOURCE HIERARCHY:
Tier 1 (Most Reliable):
- Academic papers, peer-reviewed journals
- Official company sources (SEC filings, press releases)
- Government data and statistics
- Industry reports from established firms

Tier 2 (Reliable):
- Major news outlets (WSJ, NYT, Reuters, Bloomberg)
- Industry publications
- Expert blogs and analysis
- Company blogs and documentation

Tier 3 (Use with Caution):
- General news sites
- Wikipedia (as starting point only)
- Social media (for sentiment, not facts)
- Anonymous sources

RESEARCH METHODOLOGY:
1. DEFINE - Clarify research question and scope
2. SEARCH - Conduct broad initial search
3. FILTER - Evaluate source quality and relevance
4. EXTRACT - Pull key information and quotes
5. VERIFY - Cross-reference important claims
6. SYNTHESIZE - Combine findings into coherent narrative
7. CITE - Document all sources properly

OUTPUT STANDARDS:
- Always cite sources with URLs
- Note confidence levels for claims
- Flag conflicting information
- Distinguish facts from opinions
- Include publication dates
- Note potential biases

PROHIBITED:
- Presenting unverified claims as facts
- Using paywalled content without attribution
- Ignoring conflicting evidence
- Cherry-picking supporting data only
- Fabricating or hallucinating sources
```

## Tool Definitions

```typescript
const researchTools = [
  {
    name: "web_search",
    description: "Search the web for information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        num_results: { type: "number", default: 10 },
        search_type: {
          type: "string",
          enum: ["general", "news", "academic", "images"]
        },
        date_range: {
          type: "string",
          enum: ["day", "week", "month", "year", "all"]
        },
        site_filter: { type: "string", description: "Limit to specific domain" },
        exclude_sites: { type: "array", items: { type: "string" } }
      },
      required: ["query"]
    }
  },
  {
    name: "scrape_page",
    description: "Extract content from a web page",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        extract: {
          type: "string",
          enum: ["full_text", "main_content", "structured_data", "links", "metadata"]
        },
        wait_for: { type: "string", description: "CSS selector to wait for" },
        screenshot: { type: "boolean", default: false }
      },
      required: ["url"]
    }
  },
  {
    name: "search_news",
    description: "Search news articles",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        sources: { type: "array", items: { type: "string" } },
        from_date: { type: "string" },
        to_date: { type: "string" },
        language: { type: "string", default: "en" },
        sort_by: {
          type: "string",
          enum: ["relevancy", "popularity", "publishedAt"]
        }
      },
      required: ["query"]
    }
  },
  {
    name: "search_academic",
    description: "Search academic papers and research",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        source: {
          type: "string",
          enum: ["google_scholar", "arxiv", "semantic_scholar", "pubmed"]
        },
        year_from: { type: "number" },
        year_to: { type: "number" },
        cited_by_min: { type: "number" }
      },
      required: ["query"]
    }
  },
  {
    name: "analyze_company",
    description: "Research a company comprehensively",
    parameters: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        domain: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "overview",
              "financials",
              "leadership",
              "products",
              "competitors",
              "news",
              "funding",
              "employees",
              "tech_stack",
              "reviews"
            ]
          }
        }
      },
      required: ["company_name"]
    }
  },
  {
    name: "competitive_analysis",
    description: "Analyze competitors for a company or product",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string" },
        competitors: { type: "array", items: { type: "string" } },
        dimensions: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "pricing",
              "features",
              "positioning",
              "market_share",
              "reviews",
              "strengths",
              "weaknesses"
            ]
          }
        }
      },
      required: ["subject"]
    }
  },
  {
    name: "market_research",
    description: "Research a market or industry",
    parameters: {
      type: "object",
      properties: {
        market: { type: "string" },
        include: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "size",
              "growth",
              "trends",
              "players",
              "segments",
              "regulations",
              "forecasts"
            ]
          }
        },
        geography: { type: "string" }
      },
      required: ["market"]
    }
  },
  {
    name: "monitor_topic",
    description: "Set up monitoring for a topic",
    parameters: {
      type: "object",
      properties: {
        topic: { type: "string" },
        keywords: { type: "array", items: { type: "string" } },
        sources: { type: "array", items: { type: "string" } },
        frequency: {
          type: "string",
          enum: ["realtime", "hourly", "daily", "weekly"]
        },
        alert_threshold: { type: "string" }
      },
      required: ["topic", "keywords"]
    }
  },
  {
    name: "verify_claim",
    description: "Fact-check a claim across multiple sources",
    parameters: {
      type: "object",
      properties: {
        claim: { type: "string" },
        context: { type: "string" },
        min_sources: { type: "number", default: 3 }
      },
      required: ["claim"]
    }
  },
  {
    name: "extract_data",
    description: "Extract structured data from web content",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        schema: {
          type: "object",
          description: "JSON schema for data to extract"
        },
        pagination: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["next_button", "infinite_scroll", "page_numbers"] },
            max_pages: { type: "number" }
          }
        }
      },
      required: ["url", "schema"]
    }
  },
  {
    name: "generate_report",
    description: "Generate a research report",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        research_id: { type: "string" },
        format: {
          type: "string",
          enum: ["executive_summary", "full_report", "briefing", "comparison"]
        },
        sections: { type: "array", items: { type: "string" } },
        include_sources: { type: "boolean", default: true }
      },
      required: ["title", "research_id", "format"]
    }
  },
  {
    name: "save_finding",
    description: "Save a research finding for later use",
    parameters: {
      type: "object",
      properties: {
        finding: { type: "string" },
        source_url: { type: "string" },
        source_name: { type: "string" },
        confidence: {
          type: "string",
          enum: ["high", "medium", "low"]
        },
        tags: { type: "array", items: { type: "string" } },
        quote: { type: "string" }
      },
      required: ["finding", "source_url", "confidence"]
    }
  }
];
```

## Research Templates

### Company Deep Dive

```yaml
research_template: company_deep_dive
output: comprehensive_company_report

phases:
  - phase: basic_info
    searches:
      - query: "{{company_name}} company overview"
      - query: "site:{{domain}}"
      - query: "{{company_name}} crunchbase OR linkedin"

  - phase: leadership
    searches:
      - query: "{{company_name}} CEO founder leadership team"
      - query: "{{company_name}} executives linkedin"
    extract:
      - names
      - titles
      - backgrounds

  - phase: financials
    searches:
      - query: "{{company_name}} revenue funding valuation"
      - query: "{{company_name}} SEC filing 10-K 10-Q"
      - query: "{{company_name}} funding round series"
    sources:
      - pitchbook
      - crunchbase
      - sec.gov

  - phase: products
    actions:
      - scrape: "{{domain}}/products"
      - scrape: "{{domain}}/pricing"
      - search: "{{company_name}} product features review"

  - phase: market_position
    searches:
      - query: "{{company_name}} competitors comparison"
      - query: "{{company_name}} market share industry"
      - query: "{{company_name}} vs {{competitor}}"

  - phase: news_sentiment
    actions:
      - search_news:
          query: "{{company_name}}"
          from_date: "-90d"
      - analyze_sentiment: true

  - phase: reviews_feedback
    searches:
      - query: "{{company_name}} reviews G2 Capterra"
      - query: "{{company_name}} glassdoor reviews"
      - query: "{{company_name}} customer testimonials"

output_sections:
  - executive_summary
  - company_overview
  - leadership_team
  - products_and_services
  - financial_overview
  - competitive_landscape
  - recent_news
  - strengths_and_weaknesses
  - sources
```

### Competitive Analysis

```yaml
research_template: competitive_analysis
inputs:
  - company: string
  - competitors: array

phases:
  - phase: identify_competitors
    if: competitors.length == 0
    actions:
      - search: "{{company}} competitors alternatives"
      - search: "{{company}} vs"
      - search: "best {{industry}} software companies"

  - phase: feature_comparison
    for_each: [company, ...competitors]
    actions:
      - scrape_pricing: "{{item.domain}}/pricing"
      - scrape_features: "{{item.domain}}/features"
      - search: "{{item.name}} features capabilities"

  - phase: positioning_analysis
    for_each: [company, ...competitors]
    actions:
      - analyze_messaging: "{{item.domain}}"
      - search: "{{item.name}} target market customers"

  - phase: review_comparison
    actions:
      - search: "{{company}} vs {{competitor}} G2 comparison"
      - extract_ratings: g2_crowd
      - extract_ratings: capterra

  - phase: market_share
    actions:
      - search: "{{industry}} market share 2024"
      - search: "{{industry}} industry report"

output:
  format: comparison_matrix
  sections:
    - overview_comparison
    - feature_matrix
    - pricing_comparison
    - positioning_map
    - review_scores
    - strengths_weaknesses
    - recommendations
```

### Market Research

```yaml
research_template: market_research
inputs:
  - market: string
  - geography: string (optional)

phases:
  - phase: market_definition
    searches:
      - query: "{{market}} market definition scope"
      - query: "{{market}} industry classification"

  - phase: market_size
    searches:
      - query: "{{market}} market size 2024 2025"
      - query: "{{market}} TAM SAM SOM"
      - query: "{{market}} revenue worldwide"
    sources:
      - statista
      - ibisworld
      - grandviewresearch

  - phase: growth_trends
    searches:
      - query: "{{market}} market growth rate CAGR"
      - query: "{{market}} industry trends 2024 2025"
      - query: "{{market}} future outlook forecast"

  - phase: key_players
    searches:
      - query: "{{market}} top companies leaders"
      - query: "{{market}} market share by company"
      - query: "{{market}} emerging players startups"

  - phase: segments
    searches:
      - query: "{{market}} market segments categories"
      - query: "{{market}} customer segments"
      - query: "{{market}} vertical markets"

  - phase: drivers_barriers
    searches:
      - query: "{{market}} market drivers growth factors"
      - query: "{{market}} market challenges barriers"
      - query: "{{market}} regulations compliance"

  - phase: geography
    if: geography
    searches:
      - query: "{{market}} market {{geography}}"
      - query: "{{market}} regional analysis"

output_sections:
  - executive_summary
  - market_definition
  - market_size_and_growth
  - key_players
  - market_segments
  - trends_and_drivers
  - challenges_and_barriers
  - regional_analysis
  - outlook_and_forecasts
  - methodology_and_sources
```

## Integration Examples

### Research Pipeline

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { Serper } from 'serper-sdk';
import { Firecrawl } from 'firecrawl-sdk';

const anthropic = new Anthropic();
const serper = new Serper({ apiKey: process.env.SERPER_API_KEY });
const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

class WebResearchAgent {
  private findings: Finding[] = [];
  private sources: Source[] = [];

  async conductResearch(query: string, depth: 'quick' | 'standard' | 'deep' = 'standard') {
    // Phase 1: Initial search
    const searchResults = await this.webSearch(query, {
      num_results: depth === 'deep' ? 20 : 10
    });

    // Phase 2: Analyze and filter results
    const relevantUrls = await this.filterResults(searchResults, query);

    // Phase 3: Deep scrape relevant pages
    for (const url of relevantUrls) {
      const content = await this.scrapePage(url);
      const findings = await this.extractFindings(content, query);
      this.findings.push(...findings);
      this.sources.push({ url, title: content.title, date: content.publishDate });
    }

    // Phase 4: Cross-reference and verify
    const verifiedFindings = await this.verifyFindings(this.findings);

    // Phase 5: Synthesize report
    const report = await this.synthesizeReport(verifiedFindings, query);

    return {
      report,
      findings: verifiedFindings,
      sources: this.sources
    };
  }

  async webSearch(query: string, options: SearchOptions) {
    const results = await serper.search({
      q: query,
      num: options.num_results,
      type: options.search_type || 'search'
    });

    return results.organic;
  }

  async scrapePage(url: string) {
    const result = await firecrawl.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      includeTags: ['article', 'main', 'p', 'h1', 'h2', 'h3'],
      excludeTags: ['nav', 'footer', 'aside']
    });

    return {
      url,
      title: result.metadata?.title,
      content: result.markdown,
      publishDate: result.metadata?.publishDate
    };
  }

  async extractFindings(content: PageContent, query: string) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: RESEARCH_AGENT_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Extract key findings relevant to: "${query}"

Source: ${content.url}
Title: ${content.title}
Published: ${content.publishDate}

Content:
${content.content.substring(0, 8000)}

Extract findings as JSON array:
[
  {
    "finding": "Key fact or insight",
    "quote": "Direct quote if applicable",
    "confidence": "high|medium|low",
    "tags": ["relevant", "tags"]
  }
]`
      }]
    });

    return JSON.parse(response.content[0].text);
  }

  async verifyFindings(findings: Finding[]) {
    const verifiedFindings: Finding[] = [];

    for (const finding of findings) {
      if (finding.confidence === 'high') {
        verifiedFindings.push(finding);
        continue;
      }

      // Cross-reference lower confidence findings
      const verificationSearch = await this.webSearch(finding.finding, {
        num_results: 5
      });

      const corroborated = verificationSearch.length >= 2;
      if (corroborated) {
        finding.confidence = 'medium';
        finding.verified = true;
        finding.corroborating_sources = verificationSearch.slice(0, 3).map(r => r.link);
        verifiedFindings.push(finding);
      }
    }

    return verifiedFindings;
  }

  async synthesizeReport(findings: Finding[], query: string) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: RESEARCH_AGENT_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Synthesize these research findings into a comprehensive report.

Research Question: ${query}

Findings:
${JSON.stringify(findings, null, 2)}

Sources:
${JSON.stringify(this.sources, null, 2)}

Generate a well-structured report with:
1. Executive Summary
2. Key Findings (with citations)
3. Analysis
4. Conclusions
5. Sources

Use markdown formatting and cite sources inline [Source Name](URL).`
      }]
    });

    return response.content[0].text;
  }
}
```

### Automated Monitoring

```typescript
class ResearchMonitor {
  async setupMonitoring(config: MonitorConfig) {
    // Create monitoring job
    const job = await cron.schedule(config.frequency, async () => {
      // Run search
      const results = await this.searchNews(config.keywords);

      // Filter for significant changes
      const significant = await this.filterSignificant(results, config.threshold);

      if (significant.length > 0) {
        // Generate alert
        const summary = await this.summarizeUpdates(significant);

        // Send notification
        await this.notify(config.channels, {
          topic: config.topic,
          summary,
          items: significant
        });
      }
    });

    return job;
  }

  async searchNews(keywords: string[]) {
    const results = [];
    for (const keyword of keywords) {
      const news = await newsapi.everything({
        q: keyword,
        sortBy: 'publishedAt',
        from: this.lastCheck
      });
      results.push(...news.articles);
    }
    return this.deduplicateResults(results);
  }
}
```

## Report Formats

### Executive Briefing

```markdown
# {{title}}
**Date:** {{date}}
**Prepared by:** Research Agent

## Executive Summary
{{executive_summary}}

## Key Findings
{{#each key_findings}}
- **{{this.finding}}** ({{this.confidence}} confidence)
  - Source: [{{this.source_name}}]({{this.source_url}})
{{/each}}

## Recommendations
{{recommendations}}

## Sources
{{#each sources}}
{{@index}}. [{{this.title}}]({{this.url}}) - {{this.date}}
{{/each}}
```

### Competitive Matrix

```markdown
# Competitive Analysis: {{subject}}
**Date:** {{date}}

## Overview

| Company | Founded | Funding | Employees | Revenue Est. |
|---------|---------|---------|-----------|--------------|
{{#each companies}}
| {{this.name}} | {{this.founded}} | {{this.funding}} | {{this.employees}} | {{this.revenue}} |
{{/each}}

## Feature Comparison

| Feature | {{#each companies}}{{this.name}} | {{/each}}
|---------|{{#each companies}}:---:|{{/each}}
{{#each features}}
| {{this.name}} | {{#each ../companies}}{{lookup this.features @../index}} | {{/each}}
{{/each}}

## Pricing Comparison
{{pricing_comparison}}

## Strengths & Weaknesses
{{#each companies}}
### {{this.name}}
**Strengths:** {{this.strengths}}
**Weaknesses:** {{this.weaknesses}}
{{/each}}

## Recommendations
{{recommendations}}
```

## Deployment Checklist

- [ ] Configure search API (Serper/SerpAPI)
- [ ] Set up web scraping (Firecrawl/Browserbase)
- [ ] Configure news API (NewsAPI/Newsdata)
- [ ] Set up rate limiting
- [ ] Configure caching layer
- [ ] Set up findings database
- [ ] Create report templates
- [ ] Configure monitoring alerts
- [ ] Set up source verification
- [ ] Test across different research types
- [ ] Configure output formats
- [ ] Set up citation management
