# Memory-Augmented Agent Template

## Overview
Comprehensive memory-augmented agent setup with short-term, long-term, and episodic memory systems for persistent context and learning.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid better-sqlite3
```

## Core Memory Agent

### src/agents/memory/types.ts
```typescript
// src/agents/memory/types.ts

export interface MemoryEntry {
  id: string;
  type: 'fact' | 'episode' | 'skill' | 'preference' | 'context';
  content: string;
  embedding?: number[];
  metadata: {
    source?: string;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    importance: number;
    tags: string[];
  };
}

export interface ShortTermMemory {
  workingContext: Map<string, unknown>;
  recentMessages: Array<{ role: string; content: string }>;
  activeGoals: string[];
  currentFocus: string | null;
}

export interface LongTermMemory {
  facts: Map<string, MemoryEntry>;
  episodes: Map<string, MemoryEntry>;
  skills: Map<string, MemoryEntry>;
  preferences: Map<string, MemoryEntry>;
}

export interface MemoryQuery {
  query: string;
  types?: MemoryEntry['type'][];
  limit?: number;
  minImportance?: number;
  tags?: string[];
  timeRange?: { start: number; end: number };
}

export interface MemoryConfig {
  shortTermCapacity: number;
  longTermThreshold: number;
  consolidationInterval: number;
  forgettingRate: number;
  embeddingModel?: string;
}
```

### src/agents/memory/agent.ts
```typescript
// src/agents/memory/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  MemoryEntry,
  ShortTermMemory,
  LongTermMemory,
  MemoryQuery,
  MemoryConfig
} from './types';

export class MemoryAgent {
  private client: Anthropic;
  private config: MemoryConfig;
  private shortTerm: ShortTermMemory;
  private longTerm: LongTermMemory;
  private consolidationTimer?: NodeJS.Timeout;

  constructor(config: Partial<MemoryConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      shortTermCapacity: 10,
      longTermThreshold: 0.7,
      consolidationInterval: 300000, // 5 minutes
      forgettingRate: 0.01,
      ...config
    };

    this.shortTerm = {
      workingContext: new Map(),
      recentMessages: [],
      activeGoals: [],
      currentFocus: null
    };

    this.longTerm = {
      facts: new Map(),
      episodes: new Map(),
      skills: new Map(),
      preferences: new Map()
    };

    this.startConsolidation();
  }

  // Store information
  async remember(content: string, type: MemoryEntry['type'] = 'fact', metadata: Partial<MemoryEntry['metadata']> = {}): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      id: uuidv4(),
      type,
      content,
      metadata: {
        timestamp: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
        importance: metadata.importance ?? await this.calculateImportance(content),
        tags: metadata.tags || [],
        source: metadata.source
      }
    };

    // Store based on type
    const storage = this.getStorageForType(type);
    storage.set(entry.id, entry);

    console.log(`[Memory] Stored ${type}: ${content.substring(0, 50)}...`);
    return entry;
  }

  // Recall memories
  async recall(query: MemoryQuery): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    const types = query.types || ['fact', 'episode', 'skill', 'preference', 'context'];

    for (const type of types) {
      const storage = this.getStorageForType(type as MemoryEntry['type']);

      for (const entry of storage.values()) {
        // Filter by criteria
        if (query.minImportance && entry.metadata.importance < query.minImportance) continue;
        if (query.tags && !query.tags.some(t => entry.metadata.tags.includes(t))) continue;
        if (query.timeRange) {
          if (entry.metadata.timestamp < query.timeRange.start) continue;
          if (entry.metadata.timestamp > query.timeRange.end) continue;
        }

        // Check relevance
        const relevance = await this.calculateRelevance(query.query, entry);
        if (relevance > 0.3) {
          results.push(entry);
          entry.metadata.accessCount++;
          entry.metadata.lastAccessed = Date.now();
        }
      }
    }

    // Sort by relevance and importance
    results.sort((a, b) =>
      (b.metadata.importance + b.metadata.accessCount * 0.1) -
      (a.metadata.importance + a.metadata.accessCount * 0.1)
    );

    return results.slice(0, query.limit || 10);
  }

  // Update working context
  setContext(key: string, value: unknown): void {
    this.shortTerm.workingContext.set(key, value);
  }

  // Get working context
  getContext(key: string): unknown {
    return this.shortTerm.workingContext.get(key);
  }

  // Add message to short-term
  addMessage(role: string, content: string): void {
    this.shortTerm.recentMessages.push({ role, content });

    // Trim if exceeds capacity
    while (this.shortTerm.recentMessages.length > this.config.shortTermCapacity) {
      const removed = this.shortTerm.recentMessages.shift();
      // Consider consolidating removed message
      this.maybeConsolidate(removed?.content || '');
    }
  }

  // Set current focus
  setFocus(focus: string): void {
    this.shortTerm.currentFocus = focus;
  }

  // Add goal
  addGoal(goal: string): void {
    if (!this.shortTerm.activeGoals.includes(goal)) {
      this.shortTerm.activeGoals.push(goal);
    }
  }

  // Remove goal
  removeGoal(goal: string): void {
    this.shortTerm.activeGoals = this.shortTerm.activeGoals.filter(g => g !== goal);
  }

  // Record an episode
  async recordEpisode(description: string, details: unknown): Promise<MemoryEntry> {
    const content = JSON.stringify({ description, details });
    return this.remember(content, 'episode', {
      importance: 0.8,
      tags: ['episode', 'interaction']
    });
  }

  // Learn a skill
  async learnSkill(name: string, description: string, examples?: string[]): Promise<MemoryEntry> {
    const content = JSON.stringify({ name, description, examples });
    return this.remember(content, 'skill', {
      importance: 0.9,
      tags: ['skill', name]
    });
  }

  // Store preference
  async storePreference(category: string, preference: string, strength: number = 0.8): Promise<MemoryEntry> {
    const content = JSON.stringify({ category, preference, strength });
    return this.remember(content, 'preference', {
      importance: strength,
      tags: ['preference', category]
    });
  }

  // Chat with memory
  async chat(message: string): Promise<string> {
    // Add to short-term
    this.addMessage('user', message);

    // Recall relevant memories
    const memories = await this.recall({ query: message, limit: 5 });
    const memoryContext = memories.map(m =>
      `[${m.type}] ${m.content}`
    ).join('\n');

    // Build context from working memory
    const workingContext = Object.fromEntries(this.shortTerm.workingContext);

    // Generate response
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an AI assistant with persistent memory.

Working Context:
${JSON.stringify(workingContext, null, 2)}

Active Goals:
${this.shortTerm.activeGoals.join('\n') || 'None'}

Current Focus: ${this.shortTerm.currentFocus || 'General conversation'}

Relevant Memories:
${memoryContext || 'No relevant memories found'}

Use your memories to provide personalized, context-aware responses.
When you learn something new worth remembering, mention it.`,
      messages: this.shortTerm.recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    const content = response.content[0];
    const reply = content.type === 'text' ? content.text : '';

    // Add response to short-term
    this.addMessage('assistant', reply);

    // Extract and store new information
    await this.extractAndStore(message, reply);

    return reply;
  }

  // Extract important information from conversation
  private async extractAndStore(userMessage: string, assistantReply: string): Promise<void> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 500,
      system: `Extract important information to remember from the conversation.
Output JSON: { "facts": [], "preferences": [], "shouldRemember": boolean }`,
      messages: [{
        role: 'user',
        content: `User: ${userMessage}\nAssistant: ${assistantReply}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return;

    try {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (!match) return;

      const extracted = JSON.parse(match[0]);

      for (const fact of extracted.facts || []) {
        await this.remember(fact, 'fact', { importance: 0.6 });
      }

      for (const pref of extracted.preferences || []) {
        await this.storePreference('inferred', pref, 0.7);
      }
    } catch {}
  }

  // Calculate importance of content
  private async calculateImportance(content: string): Promise<number> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Rate the importance of remembering this (0.0-1.0): "${content.substring(0, 200)}"\nRespond with only a number.`
      }]
    });

    const text = response.content[0];
    if (text.type === 'text') {
      const num = parseFloat(text.text);
      if (!isNaN(num)) return Math.max(0, Math.min(1, num));
    }
    return 0.5;
  }

  // Calculate relevance of entry to query
  private async calculateRelevance(query: string, entry: MemoryEntry): Promise<number> {
    // Simple keyword matching (in production, use embeddings)
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = entry.content.toLowerCase().split(/\s+/);

    const matches = queryWords.filter(w => contentWords.includes(w)).length;
    return matches / queryWords.length;
  }

  // Get storage for type
  private getStorageForType(type: MemoryEntry['type']): Map<string, MemoryEntry> {
    switch (type) {
      case 'fact': return this.longTerm.facts;
      case 'episode': return this.longTerm.episodes;
      case 'skill': return this.longTerm.skills;
      case 'preference': return this.longTerm.preferences;
      default: return this.longTerm.facts;
    }
  }

  // Maybe consolidate short-term to long-term
  private async maybeConsolidate(content: string): Promise<void> {
    if (!content || content.length < 10) return;

    const importance = await this.calculateImportance(content);
    if (importance >= this.config.longTermThreshold) {
      await this.remember(content, 'context', { importance });
    }
  }

  // Start periodic consolidation
  private startConsolidation(): void {
    this.consolidationTimer = setInterval(async () => {
      await this.consolidate();
    }, this.config.consolidationInterval);
  }

  // Consolidate memories
  private async consolidate(): Promise<void> {
    console.log('[Memory] Running consolidation...');

    // Apply forgetting curve
    for (const storage of [this.longTerm.facts, this.longTerm.episodes]) {
      for (const [id, entry] of storage) {
        const age = Date.now() - entry.metadata.lastAccessed;
        const decay = Math.exp(-this.config.forgettingRate * age / 86400000); // Daily decay

        if (entry.metadata.importance * decay < 0.1) {
          storage.delete(id);
          console.log(`[Memory] Forgot: ${entry.content.substring(0, 30)}...`);
        }
      }
    }
  }

  // Export memories
  export(): object {
    return {
      shortTerm: {
        workingContext: Object.fromEntries(this.shortTerm.workingContext),
        recentMessages: this.shortTerm.recentMessages,
        activeGoals: this.shortTerm.activeGoals,
        currentFocus: this.shortTerm.currentFocus
      },
      longTerm: {
        facts: Array.from(this.longTerm.facts.values()),
        episodes: Array.from(this.longTerm.episodes.values()),
        skills: Array.from(this.longTerm.skills.values()),
        preferences: Array.from(this.longTerm.preferences.values())
      }
    };
  }

  // Import memories
  import(data: any): void {
    if (data.shortTerm) {
      this.shortTerm.workingContext = new Map(Object.entries(data.shortTerm.workingContext || {}));
      this.shortTerm.recentMessages = data.shortTerm.recentMessages || [];
      this.shortTerm.activeGoals = data.shortTerm.activeGoals || [];
      this.shortTerm.currentFocus = data.shortTerm.currentFocus;
    }

    if (data.longTerm) {
      for (const entry of data.longTerm.facts || []) {
        this.longTerm.facts.set(entry.id, entry);
      }
      for (const entry of data.longTerm.episodes || []) {
        this.longTerm.episodes.set(entry.id, entry);
      }
      for (const entry of data.longTerm.skills || []) {
        this.longTerm.skills.set(entry.id, entry);
      }
      for (const entry of data.longTerm.preferences || []) {
        this.longTerm.preferences.set(entry.id, entry);
      }
    }
  }

  // Get memory statistics
  getStats(): object {
    return {
      shortTerm: {
        contextSize: this.shortTerm.workingContext.size,
        messageCount: this.shortTerm.recentMessages.length,
        goalCount: this.shortTerm.activeGoals.length
      },
      longTerm: {
        facts: this.longTerm.facts.size,
        episodes: this.longTerm.episodes.size,
        skills: this.longTerm.skills.size,
        preferences: this.longTerm.preferences.size
      }
    };
  }

  // Cleanup
  destroy(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
    }
  }
}
```

### src/agents/memory/persistence.ts
```typescript
// src/agents/memory/persistence.ts
import Database from 'better-sqlite3';
import { MemoryEntry } from './types';

export class MemoryPersistence {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding BLOB,
        timestamp INTEGER NOT NULL,
        access_count INTEGER DEFAULT 0,
        last_accessed INTEGER NOT NULL,
        importance REAL NOT NULL,
        tags TEXT,
        source TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_importance ON memories(importance);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp);
    `);
  }

  save(entry: MemoryEntry): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memories
      (id, type, content, embedding, timestamp, access_count, last_accessed, importance, tags, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.id,
      entry.type,
      entry.content,
      entry.embedding ? Buffer.from(new Float32Array(entry.embedding).buffer) : null,
      entry.metadata.timestamp,
      entry.metadata.accessCount,
      entry.metadata.lastAccessed,
      entry.metadata.importance,
      JSON.stringify(entry.metadata.tags),
      entry.metadata.source || null
    );
  }

  load(id: string): MemoryEntry | null {
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return this.rowToEntry(row);
  }

  search(query: {
    type?: string;
    minImportance?: number;
    limit?: number;
  }): MemoryEntry[] {
    let sql = 'SELECT * FROM memories WHERE 1=1';
    const params: unknown[] = [];

    if (query.type) {
      sql += ' AND type = ?';
      params.push(query.type);
    }

    if (query.minImportance) {
      sql += ' AND importance >= ?';
      params.push(query.minImportance);
    }

    sql += ' ORDER BY importance DESC, last_accessed DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(this.rowToEntry);
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
    stmt.run(id);
  }

  private rowToEntry(row: any): MemoryEntry {
    return {
      id: row.id,
      type: row.type,
      content: row.content,
      embedding: row.embedding
        ? Array.from(new Float32Array(row.embedding.buffer))
        : undefined,
      metadata: {
        timestamp: row.timestamp,
        accessCount: row.access_count,
        lastAccessed: row.last_accessed,
        importance: row.importance,
        tags: JSON.parse(row.tags || '[]'),
        source: row.source
      }
    };
  }

  close(): void {
    this.db.close();
  }
}
```

## Usage Example

### src/agents/memory/example.ts
```typescript
// src/agents/memory/example.ts
import { MemoryAgent } from './agent';

async function main() {
  const agent = new MemoryAgent({
    shortTermCapacity: 5,
    longTermThreshold: 0.6
  });

  console.log('=== Memory Agent Demo ===\n');

  // Store some facts
  await agent.remember('User prefers dark mode', 'preference');
  await agent.remember('Project deadline is December 15th', 'fact');
  await agent.remember('User is working on a TypeScript project', 'fact');

  // Learn a skill
  await agent.learnSkill(
    'code_review',
    'Review code for bugs, security issues, and best practices',
    ['Check for SQL injection', 'Verify input validation']
  );

  // Set context
  agent.setContext('projectName', 'MyApp');
  agent.setContext('language', 'TypeScript');
  agent.setFocus('Development assistance');
  agent.addGoal('Help user complete the project');

  // Have a conversation
  console.log('Starting conversation...\n');

  const response1 = await agent.chat(
    'Can you help me with my TypeScript project? I need to add authentication.'
  );
  console.log('User: Can you help me with my TypeScript project?');
  console.log('Agent:', response1.substring(0, 300) + '...\n');

  const response2 = await agent.chat(
    'What do you remember about my preferences?'
  );
  console.log('User: What do you remember about my preferences?');
  console.log('Agent:', response2.substring(0, 300) + '...\n');

  // Show memory stats
  console.log('=== Memory Stats ===');
  console.log(JSON.stringify(agent.getStats(), null, 2));

  // Recall memories
  console.log('\n=== Recalling memories about "project" ===');
  const memories = await agent.recall({ query: 'project', limit: 3 });
  memories.forEach(m => {
    console.log(`- [${m.type}] ${m.content}`);
  });

  // Export memories
  const exported = agent.export();
  console.log('\n=== Exported Memory Structure ===');
  console.log(`Facts: ${(exported as any).longTerm.facts.length}`);
  console.log(`Preferences: ${(exported as any).longTerm.preferences.length}`);

  agent.destroy();
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Memory Agent

### Memory Types
- `fact`: General knowledge and information
- `episode`: Interaction history and events
- `skill`: Learned capabilities
- `preference`: User preferences
- `context`: Contextual information

### Usage
```typescript
const agent = new MemoryAgent();

// Store memories
await agent.remember('Information to store', 'fact');
await agent.storePreference('category', 'preference value');
await agent.learnSkill('skill_name', 'description');

// Recall memories
const memories = await agent.recall({ query: 'search term' });

// Chat with memory
const response = await agent.chat('User message');
```

### Working Context
```typescript
agent.setContext('key', 'value');
agent.setFocus('Current task focus');
agent.addGoal('Active goal');
```

### Persistence
```typescript
const exported = agent.export();
agent.import(exported);
```
```

## AI Suggestions

1. **Semantic search** - Vector similarity for recall
2. **Memory compression** - Summarize old memories
3. **Importance decay** - Time-based importance
4. **Reinforcement** - Strengthen accessed memories
5. **Contradiction detection** - Find conflicting info
6. **Memory visualization** - Knowledge graph
7. **Selective forgetting** - Privacy-aware deletion
8. **Cross-session persistence** - Database storage
9. **Memory sharing** - Multi-agent memory
10. **Attention mechanism** - Focus-aware recall
