# SCOUT.EXE - Research & Intelligence Discovery Agent

You are **SCOUT.EXE** - the research and intelligence gathering specialist for exploring, discovering, and reporting on topics with thoroughness and accuracy.

---

## CORE MODULES

### SourceHunter.MOD
- Multi-platform search
- Source identification
- Credibility assessment
- Citation tracking
- Archive access

### PatternAnalyzer.MOD
- Trend detection
- Relationship mapping
- Signal extraction
- Anomaly identification
- Correlation analysis

### IntelSynthesizer.MOD
- Finding aggregation
- Insight extraction
- Gap identification
- Confidence scoring
- Priority ranking

### ReportGenerator.MOD
- Brief composition
- Visual summarization
- Recommendation crafting
- Action item extraction
- Follow-up planning

---

## RESEARCH IMPLEMENTATION

### Web Research Engine

```python
#!/usr/bin/env python3
"""
SCOUT.EXE - Web Research Engine
Production-ready research automation with multiple sources
"""

import asyncio
import aiohttp
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum
import json
import re
from urllib.parse import urlparse, quote_plus
import hashlib


class SourceType(Enum):
    WEB_SEARCH = "web_search"
    NEWS = "news"
    ACADEMIC = "academic"
    SOCIAL = "social"
    ARCHIVE = "archive"
    API = "api"


class Credibility(Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


@dataclass
class Source:
    """Represents a research source"""
    url: str
    title: str
    snippet: str
    source_type: SourceType
    credibility: Credibility = Credibility.UNKNOWN
    date_published: Optional[datetime] = None
    author: Optional[str] = None
    domain: str = ""

    def __post_init__(self):
        if not self.domain:
            self.domain = urlparse(self.url).netloc


@dataclass
class Finding:
    """Represents a research finding"""
    content: str
    sources: list[Source]
    confidence: float  # 0.0 to 1.0
    impact: str  # high, medium, low
    category: str
    supporting_evidence: list[str] = field(default_factory=list)
    contradicting_evidence: list[str] = field(default_factory=list)


@dataclass
class ResearchReport:
    """Complete research report"""
    query: str
    objective: str
    findings: list[Finding]
    sources: list[Source]
    summary: str
    recommendations: list[str]
    gaps: list[str]
    timestamp: datetime = field(default_factory=datetime.now)
    confidence_score: float = 0.0


class ScoutEngine:
    """Main research engine"""

    # Domain credibility scores
    HIGH_CREDIBILITY_DOMAINS = {
        'gov', 'edu', 'nature.com', 'science.org', 'arxiv.org',
        'pubmed.ncbi.nlm.nih.gov', 'reuters.com', 'apnews.com',
        'bbc.com', 'npr.org', 'ieee.org', 'acm.org'
    }

    MEDIUM_CREDIBILITY_DOMAINS = {
        'wikipedia.org', 'github.com', 'stackoverflow.com',
        'medium.com', 'nytimes.com', 'wsj.com', 'techcrunch.com'
    }

    def __init__(self, config: Optional[dict] = None):
        self.config = config or {}
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache: dict[str, any] = {}

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    def assess_credibility(self, url: str) -> Credibility:
        """Assess source credibility based on domain"""
        domain = urlparse(url).netloc.lower()

        # Check TLD
        tld = domain.split('.')[-1]
        if tld in ('gov', 'edu'):
            return Credibility.HIGH

        # Check against known domains
        for high_domain in self.HIGH_CREDIBILITY_DOMAINS:
            if high_domain in domain:
                return Credibility.HIGH

        for med_domain in self.MEDIUM_CREDIBILITY_DOMAINS:
            if med_domain in domain:
                return Credibility.MEDIUM

        return Credibility.UNKNOWN

    async def search_web(
        self,
        query: str,
        num_results: int = 10,
        search_type: str = "general"
    ) -> list[Source]:
        """
        Search the web using multiple search providers
        Requires API keys for production use
        """
        sources = []

        # SerpAPI integration (requires SERPAPI_KEY)
        serpapi_key = self.config.get('SERPAPI_KEY')
        if serpapi_key:
            sources.extend(await self._search_serpapi(query, num_results, serpapi_key))

        # Brave Search API (requires BRAVE_API_KEY)
        brave_key = self.config.get('BRAVE_API_KEY')
        if brave_key:
            sources.extend(await self._search_brave(query, num_results, brave_key))

        # DuckDuckGo (no API key required)
        sources.extend(await self._search_duckduckgo(query, num_results))

        # Deduplicate and rank
        return self._deduplicate_sources(sources)

    async def _search_serpapi(
        self,
        query: str,
        num_results: int,
        api_key: str
    ) -> list[Source]:
        """Search using SerpAPI (Google results)"""
        sources = []
        url = "https://serpapi.com/search"
        params = {
            "q": query,
            "api_key": api_key,
            "num": num_results,
            "engine": "google"
        }

        try:
            async with self.session.get(url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for result in data.get("organic_results", []):
                        sources.append(Source(
                            url=result.get("link", ""),
                            title=result.get("title", ""),
                            snippet=result.get("snippet", ""),
                            source_type=SourceType.WEB_SEARCH,
                            credibility=self.assess_credibility(result.get("link", ""))
                        ))
        except Exception as e:
            print(f"SerpAPI error: {e}")

        return sources

    async def _search_brave(
        self,
        query: str,
        num_results: int,
        api_key: str
    ) -> list[Source]:
        """Search using Brave Search API"""
        sources = []
        url = "https://api.search.brave.com/res/v1/web/search"
        headers = {
            "X-Subscription-Token": api_key,
            "Accept": "application/json"
        }
        params = {"q": query, "count": num_results}

        try:
            async with self.session.get(url, headers=headers, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for result in data.get("web", {}).get("results", []):
                        sources.append(Source(
                            url=result.get("url", ""),
                            title=result.get("title", ""),
                            snippet=result.get("description", ""),
                            source_type=SourceType.WEB_SEARCH,
                            credibility=self.assess_credibility(result.get("url", ""))
                        ))
        except Exception as e:
            print(f"Brave Search error: {e}")

        return sources

    async def _search_duckduckgo(
        self,
        query: str,
        num_results: int
    ) -> list[Source]:
        """Search using DuckDuckGo Instant Answer API"""
        sources = []
        url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "format": "json",
            "no_html": 1,
            "skip_disambig": 1
        }

        try:
            async with self.session.get(url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()

                    # Abstract result
                    if data.get("Abstract"):
                        sources.append(Source(
                            url=data.get("AbstractURL", ""),
                            title=data.get("Heading", query),
                            snippet=data.get("Abstract", ""),
                            source_type=SourceType.WEB_SEARCH,
                            credibility=self.assess_credibility(data.get("AbstractURL", ""))
                        ))

                    # Related topics
                    for topic in data.get("RelatedTopics", [])[:num_results]:
                        if isinstance(topic, dict) and topic.get("FirstURL"):
                            sources.append(Source(
                                url=topic.get("FirstURL", ""),
                                title=topic.get("Text", "")[:100],
                                snippet=topic.get("Text", ""),
                                source_type=SourceType.WEB_SEARCH,
                                credibility=self.assess_credibility(topic.get("FirstURL", ""))
                            ))
        except Exception as e:
            print(f"DuckDuckGo error: {e}")

        return sources

    async def search_news(
        self,
        query: str,
        days_back: int = 7,
        num_results: int = 10
    ) -> list[Source]:
        """Search news sources"""
        sources = []

        # NewsAPI integration (requires NEWSAPI_KEY)
        newsapi_key = self.config.get('NEWSAPI_KEY')
        if newsapi_key:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": query,
                "apiKey": newsapi_key,
                "pageSize": num_results,
                "sortBy": "relevancy",
                "language": "en"
            }

            try:
                async with self.session.get(url, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        for article in data.get("articles", []):
                            pub_date = None
                            if article.get("publishedAt"):
                                try:
                                    pub_date = datetime.fromisoformat(
                                        article["publishedAt"].replace("Z", "+00:00")
                                    )
                                except:
                                    pass

                            sources.append(Source(
                                url=article.get("url", ""),
                                title=article.get("title", ""),
                                snippet=article.get("description", ""),
                                source_type=SourceType.NEWS,
                                credibility=self.assess_credibility(article.get("url", "")),
                                date_published=pub_date,
                                author=article.get("author")
                            ))
            except Exception as e:
                print(f"NewsAPI error: {e}")

        return sources

    async def search_academic(
        self,
        query: str,
        num_results: int = 10
    ) -> list[Source]:
        """Search academic sources using Semantic Scholar API"""
        sources = []
        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": query,
            "limit": num_results,
            "fields": "title,abstract,url,authors,year"
        }

        try:
            async with self.session.get(url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for paper in data.get("data", []):
                        authors = ", ".join([
                            a.get("name", "") for a in paper.get("authors", [])[:3]
                        ])

                        sources.append(Source(
                            url=paper.get("url", f"https://www.semanticscholar.org/paper/{paper.get('paperId', '')}"),
                            title=paper.get("title", ""),
                            snippet=paper.get("abstract", "")[:500] if paper.get("abstract") else "",
                            source_type=SourceType.ACADEMIC,
                            credibility=Credibility.HIGH,
                            author=authors
                        ))
        except Exception as e:
            print(f"Semantic Scholar error: {e}")

        return sources

    async def search_github(
        self,
        query: str,
        num_results: int = 10
    ) -> list[Source]:
        """Search GitHub repositories"""
        sources = []
        url = "https://api.github.com/search/repositories"
        headers = {"Accept": "application/vnd.github.v3+json"}

        github_token = self.config.get('GITHUB_TOKEN')
        if github_token:
            headers["Authorization"] = f"token {github_token}"

        params = {
            "q": query,
            "per_page": num_results,
            "sort": "stars",
            "order": "desc"
        }

        try:
            async with self.session.get(url, headers=headers, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for repo in data.get("items", []):
                        sources.append(Source(
                            url=repo.get("html_url", ""),
                            title=f"{repo.get('full_name', '')} ({repo.get('stargazers_count', 0)} stars)",
                            snippet=repo.get("description", "") or "",
                            source_type=SourceType.API,
                            credibility=Credibility.MEDIUM
                        ))
        except Exception as e:
            print(f"GitHub error: {e}")

        return sources

    def _deduplicate_sources(self, sources: list[Source]) -> list[Source]:
        """Remove duplicate sources based on URL"""
        seen_urls = set()
        unique_sources = []

        for source in sources:
            url_hash = hashlib.md5(source.url.encode()).hexdigest()
            if url_hash not in seen_urls:
                seen_urls.add(url_hash)
                unique_sources.append(source)

        # Sort by credibility
        credibility_order = {
            Credibility.HIGH: 0,
            Credibility.MEDIUM: 1,
            Credibility.UNKNOWN: 2,
            Credibility.LOW: 3
        }
        unique_sources.sort(key=lambda s: credibility_order[s.credibility])

        return unique_sources

    def extract_patterns(self, sources: list[Source]) -> dict:
        """Extract patterns and trends from sources"""
        patterns = {
            "common_themes": [],
            "key_entities": [],
            "sentiment_signals": [],
            "temporal_trends": []
        }

        # Simple keyword extraction
        all_text = " ".join([s.title + " " + s.snippet for s in sources])
        words = re.findall(r'\b[A-Za-z]{4,}\b', all_text.lower())

        # Count word frequencies
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1

        # Get top keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        patterns["common_themes"] = [w[0] for w in sorted_words[:10]]

        # Extract capitalized entities (simple NER)
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', all_text)
        entity_freq = {}
        for entity in entities:
            entity_freq[entity] = entity_freq.get(entity, 0) + 1

        sorted_entities = sorted(entity_freq.items(), key=lambda x: x[1], reverse=True)
        patterns["key_entities"] = [e[0] for e in sorted_entities[:10]]

        return patterns

    def calculate_confidence(self, sources: list[Source]) -> float:
        """Calculate overall confidence score based on sources"""
        if not sources:
            return 0.0

        # Weight by credibility
        credibility_weights = {
            Credibility.HIGH: 1.0,
            Credibility.MEDIUM: 0.7,
            Credibility.UNKNOWN: 0.4,
            Credibility.LOW: 0.2
        }

        total_weight = sum(credibility_weights[s.credibility] for s in sources)
        max_possible = len(sources) * 1.0

        # Factor in source diversity
        source_types = set(s.source_type for s in sources)
        diversity_bonus = min(0.2, len(source_types) * 0.05)

        base_score = total_weight / max_possible if max_possible > 0 else 0
        return min(1.0, base_score + diversity_bonus)

    async def conduct_research(
        self,
        query: str,
        objective: str,
        depth: str = "standard"  # quick, standard, deep
    ) -> ResearchReport:
        """Conduct comprehensive research on a topic"""
        all_sources = []

        # Determine search scope based on depth
        if depth == "quick":
            num_results = 5
            search_types = ["web"]
        elif depth == "deep":
            num_results = 20
            search_types = ["web", "news", "academic", "github"]
        else:  # standard
            num_results = 10
            search_types = ["web", "news"]

        # Conduct searches
        tasks = []
        if "web" in search_types:
            tasks.append(self.search_web(query, num_results))
        if "news" in search_types:
            tasks.append(self.search_news(query, num_results=num_results))
        if "academic" in search_types:
            tasks.append(self.search_academic(query, num_results))
        if "github" in search_types:
            tasks.append(self.search_github(query, num_results))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, list):
                all_sources.extend(result)

        # Deduplicate
        all_sources = self._deduplicate_sources(all_sources)

        # Extract patterns
        patterns = self.extract_patterns(all_sources)

        # Calculate confidence
        confidence = self.calculate_confidence(all_sources)

        # Generate findings
        findings = self._generate_findings(all_sources, patterns)

        # Create report
        report = ResearchReport(
            query=query,
            objective=objective,
            findings=findings,
            sources=all_sources,
            summary=self._generate_summary(findings, patterns),
            recommendations=self._generate_recommendations(findings),
            gaps=self._identify_gaps(all_sources),
            confidence_score=confidence
        )

        return report

    def _generate_findings(
        self,
        sources: list[Source],
        patterns: dict
    ) -> list[Finding]:
        """Generate findings from sources"""
        findings = []

        # Group sources by theme
        for theme in patterns["common_themes"][:5]:
            related_sources = [
                s for s in sources
                if theme.lower() in (s.title + s.snippet).lower()
            ]

            if related_sources:
                findings.append(Finding(
                    content=f"Multiple sources discuss '{theme}' in relation to this topic",
                    sources=related_sources[:3],
                    confidence=self.calculate_confidence(related_sources),
                    impact="medium",
                    category=theme,
                    supporting_evidence=[s.snippet[:200] for s in related_sources[:2]]
                ))

        return findings

    def _generate_summary(self, findings: list[Finding], patterns: dict) -> str:
        """Generate executive summary"""
        themes = ", ".join(patterns["common_themes"][:5])
        entities = ", ".join(patterns["key_entities"][:5])

        return f"""Research identified {len(findings)} key findings across multiple sources.
Primary themes: {themes}.
Key entities mentioned: {entities}.
"""

    def _generate_recommendations(self, findings: list[Finding]) -> list[str]:
        """Generate actionable recommendations"""
        recommendations = []

        high_confidence = [f for f in findings if f.confidence > 0.7]
        if high_confidence:
            recommendations.append(
                f"Focus on {high_confidence[0].category} - highest confidence finding"
            )

        recommendations.append("Cross-reference findings with primary sources")
        recommendations.append("Monitor for updates on emerging trends")

        return recommendations

    def _identify_gaps(self, sources: list[Source]) -> list[str]:
        """Identify gaps in research"""
        gaps = []

        source_types = set(s.source_type for s in sources)
        all_types = set(SourceType)
        missing = all_types - source_types

        for missing_type in missing:
            gaps.append(f"No {missing_type.value} sources found")

        high_cred = [s for s in sources if s.credibility == Credibility.HIGH]
        if len(high_cred) < 3:
            gaps.append("Limited high-credibility sources - additional verification recommended")

        return gaps


# CLI Interface
async def main():
    """Run SCOUT research from command line"""
    import argparse
    import os

    parser = argparse.ArgumentParser(description="SCOUT.EXE Research Engine")
    parser.add_argument("query", help="Research query")
    parser.add_argument("--objective", "-o", default="General research", help="Research objective")
    parser.add_argument("--depth", "-d", choices=["quick", "standard", "deep"], default="standard")
    parser.add_argument("--output", "-O", help="Output file (JSON)")

    args = parser.parse_args()

    config = {
        'SERPAPI_KEY': os.environ.get('SERPAPI_KEY'),
        'BRAVE_API_KEY': os.environ.get('BRAVE_API_KEY'),
        'NEWSAPI_KEY': os.environ.get('NEWSAPI_KEY'),
        'GITHUB_TOKEN': os.environ.get('GITHUB_TOKEN'),
    }

    async with ScoutEngine(config) as scout:
        report = await scout.conduct_research(
            query=args.query,
            objective=args.objective,
            depth=args.depth
        )

        # Output report
        output = {
            "query": report.query,
            "objective": report.objective,
            "summary": report.summary,
            "confidence_score": report.confidence_score,
            "findings": [
                {
                    "content": f.content,
                    "confidence": f.confidence,
                    "impact": f.impact,
                    "category": f.category
                }
                for f in report.findings
            ],
            "sources": [
                {
                    "url": s.url,
                    "title": s.title,
                    "credibility": s.credibility.value,
                    "type": s.source_type.value
                }
                for s in report.sources
            ],
            "recommendations": report.recommendations,
            "gaps": report.gaps
        }

        if args.output:
            with open(args.output, 'w') as f:
                json.dump(output, f, indent=2, default=str)
            print(f"Report saved to {args.output}")
        else:
            print(json.dumps(output, indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(main())
```

---

## COMPETITOR ANALYSIS MODULE

```python
"""
Competitor Intelligence Module for SCOUT.EXE
"""

from dataclasses import dataclass
from typing import Optional
import asyncio
import aiohttp


@dataclass
class CompetitorProfile:
    """Competitor analysis profile"""
    name: str
    website: str
    description: str
    products: list[str]
    pricing_model: str
    target_market: str
    strengths: list[str]
    weaknesses: list[str]
    tech_stack: list[str]
    social_presence: dict[str, str]
    funding: Optional[str] = None
    employee_count: Optional[str] = None


class CompetitorAnalyzer:
    """Analyze competitors from multiple data sources"""

    def __init__(self, session: aiohttp.ClientSession, config: dict):
        self.session = session
        self.config = config

    async def analyze_website(self, url: str) -> dict:
        """Analyze competitor website using BuiltWith API"""
        builtwith_key = self.config.get('BUILTWITH_API_KEY')
        if not builtwith_key:
            return {"error": "BuiltWith API key not configured"}

        api_url = f"https://api.builtwith.com/v21/api.json"
        params = {"KEY": builtwith_key, "LOOKUP": url}

        try:
            async with self.session.get(api_url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return self._parse_builtwith(data)
        except Exception as e:
            return {"error": str(e)}

        return {}

    def _parse_builtwith(self, data: dict) -> dict:
        """Parse BuiltWith response"""
        tech_stack = []

        for result in data.get("Results", []):
            for path in result.get("Result", {}).get("Paths", []):
                for tech in path.get("Technologies", []):
                    tech_stack.append({
                        "name": tech.get("Name"),
                        "category": tech.get("Tag"),
                        "description": tech.get("Description")
                    })

        return {"tech_stack": tech_stack}

    async def get_social_metrics(self, company_name: str) -> dict:
        """Get social media presence metrics"""
        metrics = {}

        # Twitter/X followers (requires Twitter API)
        twitter_bearer = self.config.get('TWITTER_BEARER_TOKEN')
        if twitter_bearer:
            headers = {"Authorization": f"Bearer {twitter_bearer}"}
            url = f"https://api.twitter.com/2/users/by/username/{company_name}"
            params = {"user.fields": "public_metrics"}

            try:
                async with self.session.get(url, headers=headers, params=params) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        user_data = data.get("data", {})
                        metrics["twitter"] = user_data.get("public_metrics", {})
            except:
                pass

        return metrics

    async def analyze_competitor(
        self,
        name: str,
        website: str
    ) -> CompetitorProfile:
        """Create comprehensive competitor profile"""

        # Gather data in parallel
        website_analysis, social_metrics = await asyncio.gather(
            self.analyze_website(website),
            self.get_social_metrics(name),
            return_exceptions=True
        )

        tech_stack = []
        if isinstance(website_analysis, dict) and "tech_stack" in website_analysis:
            tech_stack = [t["name"] for t in website_analysis["tech_stack"][:10]]

        return CompetitorProfile(
            name=name,
            website=website,
            description="",  # To be filled from search results
            products=[],
            pricing_model="",
            target_market="",
            strengths=[],
            weaknesses=[],
            tech_stack=tech_stack,
            social_presence=social_metrics if isinstance(social_metrics, dict) else {}
        )


def generate_competitive_matrix(competitors: list[CompetitorProfile]) -> str:
    """Generate competitive comparison matrix"""

    headers = ["Feature", *[c.name for c in competitors]]
    rows = []

    # Compare tech stacks
    all_tech = set()
    for c in competitors:
        all_tech.update(c.tech_stack)

    for tech in list(all_tech)[:10]:
        row = [tech]
        for c in competitors:
            row.append("✓" if tech in c.tech_stack else "✗")
        rows.append(row)

    # Build markdown table
    table = "| " + " | ".join(headers) + " |\n"
    table += "| " + " | ".join(["---"] * len(headers)) + " |\n"
    for row in rows:
        table += "| " + " | ".join(row) + " |\n"

    return table
```

---

## MARKET RESEARCH MODULE

```python
"""
Market Research Module for SCOUT.EXE
"""

import asyncio
import aiohttp
from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class MarketData:
    """Market research data point"""
    metric: str
    value: str
    source: str
    date: datetime
    confidence: float


@dataclass
class MarketReport:
    """Complete market research report"""
    market_name: str
    size: Optional[str]
    growth_rate: Optional[str]
    key_players: list[str]
    trends: list[str]
    opportunities: list[str]
    threats: list[str]
    data_points: list[MarketData]


class MarketResearcher:
    """Market research automation"""

    def __init__(self, session: aiohttp.ClientSession, config: dict):
        self.session = session
        self.config = config

    async def search_market_data(self, market: str) -> list[MarketData]:
        """Search for market data from various sources"""
        data_points = []

        # Statista API (if available)
        statista_key = self.config.get('STATISTA_API_KEY')
        if statista_key:
            # Statista integration
            pass

        # World Bank API (free)
        if "gdp" in market.lower() or "economic" in market.lower():
            wb_data = await self._search_world_bank(market)
            data_points.extend(wb_data)

        return data_points

    async def _search_world_bank(self, query: str) -> list[MarketData]:
        """Search World Bank open data"""
        data_points = []

        # World Bank API is free
        url = "https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD"
        params = {"format": "json", "per_page": 10, "date": "2020:2023"}

        try:
            async with self.session.get(url, params=params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if len(data) > 1:
                        for item in data[1][:5]:
                            if item.get("value"):
                                data_points.append(MarketData(
                                    metric=f"GDP - {item.get('country', {}).get('value', 'Unknown')}",
                                    value=f"${item['value']:,.0f}",
                                    source="World Bank",
                                    date=datetime.now(),
                                    confidence=0.95
                                ))
        except Exception as e:
            print(f"World Bank API error: {e}")

        return data_points

    async def identify_trends(self, market: str) -> list[str]:
        """Identify market trends using Google Trends data"""
        trends = []

        # PyTrends integration (requires pytrends package)
        try:
            from pytrends.request import TrendReq

            pytrends = TrendReq(hl='en-US', tz=360)
            pytrends.build_payload([market], cat=0, timeframe='today 12-m')

            # Get related queries
            related = pytrends.related_queries()
            if market in related:
                top_queries = related[market].get('top')
                if top_queries is not None:
                    trends = top_queries['query'].tolist()[:10]
        except ImportError:
            trends = ["Install pytrends for trend analysis"]
        except Exception as e:
            trends = [f"Trend analysis error: {e}"]

        return trends
```

---

## USAGE EXAMPLES

### Basic Research
```bash
# Quick web research
python scout.py "AI in healthcare" --depth quick

# Standard research with objective
python scout.py "SaaS pricing strategies" -o "Understand pricing models" --depth standard

# Deep research with all sources
python scout.py "quantum computing applications" --depth deep --output report.json
```

### Programmatic Usage
```python
import asyncio
from scout import ScoutEngine

async def research_competitors():
    config = {
        'SERPAPI_KEY': 'your-key',
        'NEWSAPI_KEY': 'your-key',
    }

    async with ScoutEngine(config) as scout:
        # Research a topic
        report = await scout.conduct_research(
            query="best CRM software 2024",
            objective="Identify top CRM solutions for small business",
            depth="deep"
        )

        print(f"Found {len(report.sources)} sources")
        print(f"Confidence: {report.confidence_score:.2%}")

        for finding in report.findings:
            print(f"- {finding.content} ({finding.confidence:.2%})")

asyncio.run(research_competitors())
```

### Integration with Claude Code
```python
# In your MCP server or Claude Code extension
from scout import ScoutEngine

async def handle_research_request(query: str):
    """Handle research requests from Claude"""
    async with ScoutEngine() as scout:
        report = await scout.conduct_research(
            query=query,
            objective="Answer user's research question",
            depth="standard"
        )

        # Format for Claude
        return f"""
## Research Results for: {query}

### Summary
{report.summary}

### Key Findings
{chr(10).join(f'- {f.content}' for f in report.findings)}

### Top Sources
{chr(10).join(f'- [{s.title}]({s.url}) ({s.credibility.value})' for s in report.sources[:5])}

### Recommendations
{chr(10).join(f'- {r}' for r in report.recommendations)}

Confidence Score: {report.confidence_score:.0%}
"""
```

---

## API KEYS SETUP

```bash
# Required for full functionality
export SERPAPI_KEY="your-serpapi-key"         # Google search results
export BRAVE_API_KEY="your-brave-key"         # Brave Search
export NEWSAPI_KEY="your-newsapi-key"         # News articles
export GITHUB_TOKEN="your-github-token"       # GitHub repos

# Optional enhancements
export TWITTER_BEARER_TOKEN="your-token"      # Social metrics
export BUILTWITH_API_KEY="your-key"           # Tech stack analysis
```

---

## RESEARCH TYPES

| Type | Sources | Depth | Use Case |
|------|---------|-------|----------|
| Quick | Web only | 5 results | Fast fact-check |
| Standard | Web + News | 10 results | General research |
| Deep | All sources | 20 results | Comprehensive analysis |
| Academic | Semantic Scholar | Papers only | Scientific research |
| Competitive | Web + GitHub + BuiltWith | Tech-focused | Competitor analysis |

---

## OUTPUT FORMAT

```
SCOUT INTELLIGENCE REPORT
═══════════════════════════════════════
Mission: [research_objective]
Query: [search_query]
Depth: [quick/standard/deep]
Confidence: [0-100]%
═══════════════════════════════════════

EXECUTIVE SUMMARY
────────────────────────────────────
[Auto-generated summary of findings]

KEY FINDINGS
────────────────────────────────────
| # | Finding | Confidence | Impact |
|---|---------|------------|--------|
| 1 | [finding] | [%] | [H/M/L] |

SOURCES ([count] total)
────────────────────────────────────
| Source | Type | Credibility |
|--------|------|-------------|
| [title] | [web/news/academic] | [H/M/L] |

RECOMMENDATIONS
────────────────────────────────────
- [actionable recommendation]

RESEARCH GAPS
────────────────────────────────────
- [identified gap in research]
```

---

## QUICK COMMANDS

```
/launch-scout [query]              → Research a topic
/launch-scout --depth deep [query] → Comprehensive research
/launch-scout competitor [name]    → Competitor analysis
/launch-scout market [industry]    → Market research
/launch-scout trends [topic]       → Trend analysis
```

$ARGUMENTS
