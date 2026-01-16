import Database from "better-sqlite3";
import type { Conversation, Message } from "../agent/types";

export interface MemoryConfig {
  persistPath?: string;
  maxConversations?: number;
  maxMessagesPerConversation?: number;
}

export class MemoryManager {
  private db: Database.Database;
  private config: Required<MemoryConfig>;

  constructor(config: MemoryConfig = {}) {
    this.config = {
      persistPath: config.persistPath || "./data/memory.db",
      maxConversations: config.maxConversations || 100,
      maxMessagesPerConversation: config.maxMessagesPerConversation || 50,
    };

    this.db = new Database(this.config.persistPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        tool_use TEXT,
        tool_results TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_conversation
        ON messages(conversation_id);

      CREATE INDEX IF NOT EXISTS idx_conversations_updated
        ON conversations(updated_at DESC);
    `);
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const upsertConversation = this.db.prepare(`
      INSERT OR REPLACE INTO conversations (id, created_at, updated_at, metadata)
      VALUES (?, ?, ?, ?)
    `);

    const deleteMessages = this.db.prepare(`
      DELETE FROM messages WHERE conversation_id = ?
    `);

    const insertMessage = this.db.prepare(`
      INSERT INTO messages (conversation_id, role, content, timestamp, tool_use, tool_results)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction(() => {
      upsertConversation.run(
        conversation.id,
        conversation.createdAt.toISOString(),
        conversation.updatedAt.toISOString(),
        conversation.metadata ? JSON.stringify(conversation.metadata) : null
      );

      deleteMessages.run(conversation.id);

      // Only keep the last N messages
      const messages = conversation.messages.slice(
        -this.config.maxMessagesPerConversation
      );

      for (const msg of messages) {
        insertMessage.run(
          conversation.id,
          msg.role,
          msg.content,
          msg.timestamp?.toISOString() || new Date().toISOString(),
          msg.toolUse ? JSON.stringify(msg.toolUse) : null,
          msg.toolResults ? JSON.stringify(msg.toolResults) : null
        );
      }
    });

    transaction();
    await this.pruneOldConversations();
  }

  async loadConversation(id: string): Promise<Conversation | null> {
    const conv = this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id) as
      | {
          id: string;
          created_at: string;
          updated_at: string;
          metadata: string | null;
        }
      | undefined;

    if (!conv) return null;

    const messages = this.db
      .prepare(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC"
      )
      .all(id) as Array<{
      role: string;
      content: string;
      timestamp: string;
      tool_use: string | null;
      tool_results: string | null;
    }>;

    return {
      id: conv.id,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      metadata: conv.metadata ? JSON.parse(conv.metadata) : undefined,
      messages: messages.map((m) => ({
        role: m.role as Message["role"],
        content: m.content,
        timestamp: new Date(m.timestamp),
        toolUse: m.tool_use ? JSON.parse(m.tool_use) : undefined,
        toolResults: m.tool_results ? JSON.parse(m.tool_results) : undefined,
      })),
    };
  }

  async listConversations(limit = 20): Promise<Conversation[]> {
    const convs = this.db
      .prepare(
        "SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ?"
      )
      .all(limit) as Array<{
      id: string;
      created_at: string;
      updated_at: string;
      metadata: string | null;
    }>;

    return convs.map((conv) => ({
      id: conv.id,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      metadata: conv.metadata ? JSON.parse(conv.metadata) : undefined,
      messages: [], // Don't load all messages for list view
    }));
  }

  async deleteConversation(id: string): Promise<void> {
    this.db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    const results = this.db
      .prepare(
        `
      SELECT DISTINCT c.* FROM conversations c
      JOIN messages m ON c.id = m.conversation_id
      WHERE m.content LIKE ?
      ORDER BY c.updated_at DESC
      LIMIT 20
    `
      )
      .all(`%${query}%`) as Array<{
      id: string;
      created_at: string;
      updated_at: string;
      metadata: string | null;
    }>;

    return results.map((conv) => ({
      id: conv.id,
      createdAt: new Date(conv.created_at),
      updatedAt: new Date(conv.updated_at),
      metadata: conv.metadata ? JSON.parse(conv.metadata) : undefined,
      messages: [],
    }));
  }

  private async pruneOldConversations(): Promise<void> {
    const count = this.db
      .prepare("SELECT COUNT(*) as count FROM conversations")
      .get() as { count: number };

    if (count.count > this.config.maxConversations) {
      const toDelete = count.count - this.config.maxConversations;
      this.db
        .prepare(
          `
        DELETE FROM conversations WHERE id IN (
          SELECT id FROM conversations ORDER BY updated_at ASC LIMIT ?
        )
      `
        )
        .run(toDelete);
    }
  }

  close(): void {
    this.db.close();
  }
}
