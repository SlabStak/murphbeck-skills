import * as readline from "readline";
import { Agent } from "../src/agent";
import { MemoryManager } from "../src/memory";
import { createAllTools } from "../src/tools";
import "dotenv/config";

async function main() {
  console.log("Initializing AI Agent...\n");

  const memory = new MemoryManager({
    persistPath: "./data/chat.db",
  });

  const agent = new Agent({
    memory,
    tools: createAllTools(),
    systemPrompt: `You are a helpful AI assistant. Be concise but thorough in your responses.
You have access to tools for calculations and web search. Use them when needed.`,
  });

  // Subscribe to events
  agent.on((event) => {
    if (event.type === "tool:start") {
      const data = event.data as { tool: string };
      console.log(`\n[Using tool: ${data.tool}]`);
    }
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("AI Agent ready! Type your message (or 'exit' to quit).\n");

  const prompt = () => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === "exit") {
        console.log("\nGoodbye!");
        memory.close();
        rl.close();
        return;
      }

      if (!trimmed) {
        prompt();
        return;
      }

      try {
        console.log("\nAssistant: ", "");

        // Use streaming for responses
        const stream = agent.streamChat(trimmed);
        for await (const chunk of stream) {
          process.stdout.write(chunk);
        }

        console.log("\n");
      } catch (error) {
        console.error(
          "\nError:",
          error instanceof Error ? error.message : "Unknown error"
        );
        console.log("");
      }

      prompt();
    });
  };

  prompt();
}

main().catch(console.error);
