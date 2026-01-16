import { Tool, type ToolResult, type ToolParameters } from "./base";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class WebSearchTool extends Tool {
  name = "web_search";
  description =
    "Search the web for current information. Use this when you need up-to-date information or facts you're unsure about.";

  parameters: ToolParameters = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
      num_results: {
        type: "number",
        description: "Number of results to return (default: 5, max: 10)",
      },
    },
    required: ["query"],
  };

  private apiKey?: string;

  constructor() {
    super();
    this.apiKey = process.env.TAVILY_API_KEY || process.env.SERP_API_KEY;
  }

  async execute(params: {
    query: string;
    num_results?: number;
  }): Promise<ToolResult> {
    const numResults = Math.min(params.num_results || 5, 10);

    // If no API key, return mock results for development
    if (!this.apiKey) {
      console.warn("No search API key configured. Returning mock results.");
      return this.success({
        query: params.query,
        results: [
          {
            title: "Mock Search Result",
            url: "https://example.com",
            snippet:
              "This is a mock search result. Configure TAVILY_API_KEY or SERP_API_KEY for real results.",
          },
        ],
      });
    }

    try {
      // Use Tavily API if available
      if (process.env.TAVILY_API_KEY) {
        return await this.searchWithTavily(params.query, numResults);
      }

      // Fall back to SerpAPI
      if (process.env.SERP_API_KEY) {
        return await this.searchWithSerp(params.query, numResults);
      }

      return this.error("No search API configured");
    } catch (error) {
      return this.error(
        `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private async searchWithTavily(
    query: string,
    numResults: number
  ): Promise<ToolResult> {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        max_results: numResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();

    const results: SearchResult[] = data.results.map(
      (r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      })
    );

    return this.success({ query, results });
  }

  private async searchWithSerp(
    query: string,
    numResults: number
  ): Promise<ToolResult> {
    const params = new URLSearchParams({
      api_key: process.env.SERP_API_KEY!,
      q: query,
      num: numResults.toString(),
    });

    const response = await fetch(
      `https://serpapi.com/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.statusText}`);
    }

    const data = await response.json();

    const results: SearchResult[] = (data.organic_results || []).map(
      (r: { title: string; link: string; snippet: string }) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      })
    );

    return this.success({ query, results });
  }
}
