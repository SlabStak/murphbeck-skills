import express from "express";
import { Agent } from "../agent";
import { MemoryManager } from "../memory";
import { createAllTools } from "../tools";
import "dotenv/config";

const app = express();
app.use(express.json());

// Initialize memory and agent
const memory = new MemoryManager({
  persistPath: process.env.DATABASE_URL || "./data/agent.db",
});

const agent = new Agent({
  memory,
  tools: createAllTools(),
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await agent.chat(message, conversation_id);
    const conversation = agent.getConversation(conversation_id || "");

    res.json({
      response,
      conversation_id: conversation?.id,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

// Streaming chat endpoint
app.post("/chat/stream", async (req, res) => {
  try {
    const { message, conversation_id } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = agent.streamChat(message, conversation_id);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Stream error:", error);
    res.write(
      `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`
    );
    res.end();
  }
});

// Get conversation
app.get("/conversations/:id", async (req, res) => {
  try {
    const conversation = await memory.loadConversation(req.params.id);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List conversations
app.get("/conversations", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const conversations = await memory.listConversations(limit);
    res.json(conversations);
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete conversation
app.delete("/conversations/:id", async (req, res) => {
  try {
    await memory.deleteConversation(req.params.id);
    agent.clearConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search conversations
app.get("/search", async (req, res) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const results = await memory.searchConversations(query);
    res.json(results);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const PORT = parseInt(process.env.PORT || "3000");
const HOST = process.env.HOST || "localhost";

app.listen(PORT, HOST, () => {
  console.log(`Agent API server running at http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  memory.close();
  process.exit(0);
});
