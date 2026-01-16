import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuidv4 } from "uuid";
import type {
  AgentConfig,
  AgentResponse,
  Conversation,
  Message,
  ToolUseBlock,
  ToolResultBlock,
  AgentEvent,
  AgentEventHandler,
} from "./types";
import { buildSystemPrompt, DEFAULT_SYSTEM_PROMPT } from "./prompts";
import type { Tool } from "../tools/base";
import type { MemoryManager } from "../memory";

export class Agent {
  private client: Anthropic;
  private config: Required<
    Pick<AgentConfig, "model" | "maxTokens" | "temperature" | "maxRetries">
  > &
    AgentConfig;
  private tools: Map<string, Tool> = new Map();
  private memory?: MemoryManager;
  private conversations: Map<string, Conversation> = new Map();
  private eventHandlers: Set<AgentEventHandler> = new Set();

  constructor(config: AgentConfig = {}) {
    this.client = new Anthropic();
    this.config = {
      name: config.name || "assistant",
      model: config.model || process.env.AGENT_MODEL || "claude-sonnet-4-20250514",
      systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 60000,
      ...config,
    };

    // Register tools
    if (config.tools) {
      for (const tool of config.tools) {
        this.tools.set(tool.name, tool);
      }
    }

    this.memory = config.memory;
  }

  // Event handling
  on(handler: AgentEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emit(event: AgentEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error("Event handler error:", error);
      }
    }
  }

  // Main chat method
  async chat(
    message: string,
    conversationId?: string
  ): Promise<string> {
    const conversation = this.getOrCreateConversation(conversationId);

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    this.emit({
      type: "message:start",
      data: { conversationId: conversation.id, message },
      timestamp: new Date(),
    });

    try {
      // Build messages for API
      const messages = this.buildMessages(conversation);

      // Get response
      const response = await this.sendMessage(messages);

      // Handle tool use if needed
      let finalResponse = response;
      while (finalResponse.stopReason === "tool_use" && finalResponse.toolUse) {
        const toolResults = await this.executeTools(finalResponse.toolUse);

        // Add assistant message with tool use
        conversation.messages.push({
          role: "assistant",
          content: finalResponse.content,
          toolUse: finalResponse.toolUse,
          timestamp: new Date(),
        });

        // Continue conversation with tool results
        const continueMessages = this.buildMessages(conversation, toolResults);
        finalResponse = await this.sendMessage(continueMessages);
      }

      // Add final assistant message
      conversation.messages.push({
        role: "assistant",
        content: finalResponse.content,
        timestamp: new Date(),
      });

      conversation.updatedAt = new Date();

      this.emit({
        type: "message:end",
        data: {
          conversationId: conversation.id,
          response: finalResponse.content,
        },
        timestamp: new Date(),
      });

      // Save to memory if available
      if (this.memory) {
        await this.memory.saveConversation(conversation);
      }

      return finalResponse.content;
    } catch (error) {
      this.emit({
        type: "error",
        data: { error, conversationId: conversation.id },
        timestamp: new Date(),
      });
      throw error;
    }
  }

  // Streaming chat
  async *streamChat(
    message: string,
    conversationId?: string
  ): AsyncGenerator<string> {
    const conversation = this.getOrCreateConversation(conversationId);

    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    const messages = this.buildMessages(conversation);
    const systemPrompt = this.buildSystemPrompt();

    const stream = await this.client.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    });

    let fullContent = "";

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullContent += event.delta.text;
        yield event.delta.text;
      }
    }

    conversation.messages.push({
      role: "assistant",
      content: fullContent,
      timestamp: new Date(),
    });

    conversation.updatedAt = new Date();
  }

  // Private methods
  private getOrCreateConversation(id?: string): Conversation {
    if (id && this.conversations.has(id)) {
      return this.conversations.get(id)!;
    }

    const conversation: Conversation = {
      id: id || uuidv4(),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  private buildSystemPrompt(): string {
    const toolDescriptions = this.tools.size > 0
      ? Array.from(this.tools.values())
          .map((t) => `- ${t.name}: ${t.description}`)
          .join("\n")
      : undefined;

    return buildSystemPrompt({
      base: this.config.systemPrompt,
      tools: toolDescriptions,
    });
  }

  private buildMessages(
    conversation: Conversation,
    toolResults?: ToolResultBlock[]
  ): Array<{ role: string; content: unknown }> {
    const messages: Array<{ role: string; content: unknown }> = [];

    for (const msg of conversation.messages) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        if (msg.toolUse && msg.toolUse.length > 0) {
          messages.push({
            role: "assistant",
            content: [
              { type: "text", text: msg.content },
              ...msg.toolUse.map((tu) => ({
                type: "tool_use",
                id: tu.id,
                name: tu.name,
                input: tu.input,
              })),
            ],
          });
        } else {
          messages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    // Add tool results if present
    if (toolResults && toolResults.length > 0) {
      messages.push({
        role: "user",
        content: toolResults.map((tr) => ({
          type: "tool_result",
          tool_use_id: tr.toolUseId,
          content: tr.content,
          is_error: tr.isError,
        })),
      });
    }

    return messages;
  }

  private async sendMessage(
    messages: Array<{ role: string; content: unknown }>
  ): Promise<AgentResponse> {
    const systemPrompt = this.buildSystemPrompt();

    const tools =
      this.tools.size > 0
        ? Array.from(this.tools.values()).map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.parameters,
          }))
        : undefined;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      tools: tools as Anthropic.Tool[],
    });

    // Extract content and tool use
    let content = "";
    const toolUse: ToolUseBlock[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text;
      } else if (block.type === "tool_use") {
        toolUse.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    return {
      content,
      toolUse: toolUse.length > 0 ? toolUse : undefined,
      stopReason: response.stop_reason as AgentResponse["stopReason"],
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  private async executeTools(
    toolUseBlocks: ToolUseBlock[]
  ): Promise<ToolResultBlock[]> {
    const results: ToolResultBlock[] = [];

    for (const block of toolUseBlocks) {
      const tool = this.tools.get(block.name);

      this.emit({
        type: "tool:start",
        data: { tool: block.name, input: block.input },
        timestamp: new Date(),
      });

      if (!tool) {
        results.push({
          toolUseId: block.id,
          content: `Error: Unknown tool "${block.name}"`,
          isError: true,
        });
        continue;
      }

      try {
        const result = await tool.execute(block.input);
        results.push({
          toolUseId: block.id,
          content: JSON.stringify(result.data),
          isError: !result.success,
        });

        this.emit({
          type: "tool:end",
          data: { tool: block.name, result },
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          toolUseId: block.id,
          content: `Error: ${errorMessage}`,
          isError: true,
        });

        this.emit({
          type: "tool:end",
          data: { tool: block.name, error: errorMessage },
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  // Public getters
  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values());
  }

  clearConversation(id: string): void {
    this.conversations.delete(id);
  }
}

export * from "./types";
export * from "./prompts";
