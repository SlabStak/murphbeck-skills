import type { Tool } from "../tools/base";
import type { MemoryManager } from "../memory";

export interface AgentConfig {
  name?: string;
  model?: string;
  systemPrompt?: string;
  tools?: Tool[];
  memory?: MemoryManager;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  toolUse?: ToolUseBlock[];
  toolResults?: ToolResultBlock[];
}

export interface ToolUseBlock {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  toolUseId: string;
  content: string;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  toolUse?: ToolUseBlock[];
  stopReason: "end_turn" | "tool_use" | "max_tokens";
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface StreamChunk {
  type: "text" | "tool_use" | "done";
  content?: string;
  toolUse?: ToolUseBlock;
}

export type AgentEventType =
  | "message:start"
  | "message:stream"
  | "message:end"
  | "tool:start"
  | "tool:end"
  | "error";

export interface AgentEvent {
  type: AgentEventType;
  data: unknown;
  timestamp: Date;
}

export type AgentEventHandler = (event: AgentEvent) => void;
