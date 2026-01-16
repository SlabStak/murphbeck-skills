export { Agent } from "./agent";
export * from "./agent/types";
export * from "./agent/prompts";
export * from "./tools";
export { MemoryManager } from "./memory";

// Re-export for convenience
import { Agent } from "./agent";
import { MemoryManager } from "./memory";
import { createAllTools } from "./tools";

export function createAgent(options?: {
  withTools?: boolean;
  withMemory?: boolean;
  memoryPath?: string;
}) {
  const memory = options?.withMemory
    ? new MemoryManager({ persistPath: options.memoryPath })
    : undefined;

  const tools = options?.withTools ? createAllTools() : undefined;

  return new Agent({
    memory,
    tools,
  });
}
