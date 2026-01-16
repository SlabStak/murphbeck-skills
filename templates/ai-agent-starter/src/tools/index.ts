export { Tool, type ToolResult, type ToolParameters } from "./base";
export { CalculatorTool } from "./calculator";
export { WebSearchTool } from "./web-search";

// Tool registry for dynamic tool loading
import { Tool } from "./base";
import { CalculatorTool } from "./calculator";
import { WebSearchTool } from "./web-search";

export const toolRegistry: Record<string, new () => Tool> = {
  calculator: CalculatorTool,
  web_search: WebSearchTool,
};

export function createTool(name: string): Tool | null {
  const ToolClass = toolRegistry[name];
  if (!ToolClass) return null;
  return new ToolClass();
}

export function createAllTools(): Tool[] {
  return Object.values(toolRegistry).map((ToolClass) => new ToolClass());
}
