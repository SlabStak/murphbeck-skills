# Conversational Agent Template

## Overview
Comprehensive conversational agent setup with context management, personality systems, intent detection, and multi-turn dialogue handling.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid
```

## Core Conversational Agent

### src/agents/conversational/agent.ts
```typescript
// src/agents/conversational/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    intent?: string;
    sentiment?: string;
    entities?: Record<string, string>;
  };
}

interface Conversation {
  id: string;
  messages: Message[];
  context: Record<string, unknown>;
  startedAt: number;
  lastActivityAt: number;
}

interface PersonalityConfig {
  name: string;
  traits: string[];
  tone: string;
  responseStyle: 'concise' | 'detailed' | 'casual' | 'formal';
  examples?: { user: string; assistant: string }[];
}

interface AgentConfig {
  personality: PersonalityConfig;
  maxContextMessages: number;
  temperature: number;
  model: string;
  enableIntentDetection: boolean;
  enableSentimentAnalysis: boolean;
}

export class ConversationalAgent {
  private client: Anthropic;
  private conversations: Map<string, Conversation> = new Map();
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      personality: {
        name: 'Assistant',
        traits: ['helpful', 'friendly', 'knowledgeable'],
        tone: 'professional yet warm',
        responseStyle: 'detailed'
      },
      maxContextMessages: 20,
      temperature: 0.7,
      model: 'claude-sonnet-4-20250514',
      enableIntentDetection: true,
      enableSentimentAnalysis: false,
      ...config
    };
  }

  // Start a new conversation
  startConversation(initialContext?: Record<string, unknown>): string {
    const conversationId = uuidv4();
    const now = Date.now();

    this.conversations.set(conversationId, {
      id: conversationId,
      messages: [],
      context: initialContext || {},
      startedAt: now,
      lastActivityAt: now
    });

    return conversationId;
  }

  // Get or create conversation
  private getConversation(conversationId?: string): Conversation {
    if (conversationId && this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId)!;
    }

    const newId = this.startConversation();
    return this.conversations.get(newId)!;
  }

  // Build system prompt from personality
  private buildSystemPrompt(): string {
    const { personality } = this.config;

    let prompt = `You are ${personality.name}, a conversational assistant.

Personality Traits: ${personality.traits.join(', ')}
Tone: ${personality.tone}
Response Style: ${personality.responseStyle}

Guidelines:
- Maintain a consistent personality throughout the conversation
- Remember context from earlier in the conversation
- Ask clarifying questions when needed
- Be ${personality.traits.join(', ')}`;

    if (personality.responseStyle === 'concise') {
      prompt += '\n- Keep responses brief and to the point';
    } else if (personality.responseStyle === 'detailed') {
      prompt += '\n- Provide thorough, well-explained responses';
    } else if (personality.responseStyle === 'casual') {
      prompt += '\n- Use casual, friendly language';
    } else if (personality.responseStyle === 'formal') {
      prompt += '\n- Maintain formal, professional language';
    }

    if (personality.examples && personality.examples.length > 0) {
      prompt += '\n\nExample interactions:';
      personality.examples.forEach((ex, i) => {
        prompt += `\n${i + 1}. User: "${ex.user}"\n   Assistant: "${ex.assistant}"`;
      });
    }

    return prompt;
  }

  // Detect intent from user message
  private async detectIntent(message: string): Promise<string> {
    if (!this.config.enableIntentDetection) return 'general';

    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 50,
      temperature: 0,
      system: 'Classify the user intent. Respond with a single word or short phrase.',
      messages: [{
        role: 'user',
        content: `Classify the intent: "${message}"

Options: greeting, question, request, complaint, feedback, goodbye, clarification, other`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text.toLowerCase().trim() : 'other';
  }

  // Analyze sentiment
  private async analyzeSentiment(message: string): Promise<string> {
    if (!this.config.enableSentimentAnalysis) return 'neutral';

    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 20,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Classify sentiment (positive/negative/neutral): "${message}"`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text.toLowerCase().trim() : 'neutral';
  }

  // Send a message and get response
  async chat(
    userMessage: string,
    conversationId?: string
  ): Promise<{ response: string; conversationId: string }> {
    const conversation = this.getConversation(conversationId);

    // Detect intent and sentiment
    const [intent, sentiment] = await Promise.all([
      this.detectIntent(userMessage),
      this.analyzeSentiment(userMessage)
    ]);

    // Add user message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      metadata: { intent, sentiment }
    };
    conversation.messages.push(userMsg);
    conversation.lastActivityAt = Date.now();

    // Build message history for API
    const historyMessages = conversation.messages
      .slice(-this.config.maxContextMessages)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    // Add context to system prompt if present
    let systemPrompt = this.buildSystemPrompt();
    if (Object.keys(conversation.context).length > 0) {
      systemPrompt += `\n\nConversation Context:\n${JSON.stringify(conversation.context, null, 2)}`;
    }

    // Get response
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages: historyMessages
    });

    const content = response.content[0];
    const assistantMessage = content.type === 'text' ? content.text : '';

    // Add assistant message
    const assistantMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: assistantMessage,
      timestamp: Date.now()
    };
    conversation.messages.push(assistantMsg);

    return {
      response: assistantMessage,
      conversationId: conversation.id
    };
  }

  // Stream response
  async *chatStream(
    userMessage: string,
    conversationId?: string
  ): AsyncGenerator<string, { conversationId: string }> {
    const conversation = this.getConversation(conversationId);

    // Add user message
    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    conversation.messages.push(userMsg);
    conversation.lastActivityAt = Date.now();

    // Build messages
    const historyMessages = conversation.messages
      .slice(-this.config.maxContextMessages)
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    // Stream response
    const stream = await this.client.messages.stream({
      model: this.config.model,
      max_tokens: 2000,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(),
      messages: historyMessages
    });

    let fullResponse = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text;
        yield event.delta.text;
      }
    }

    // Save assistant message
    const assistantMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now()
    };
    conversation.messages.push(assistantMsg);

    return { conversationId: conversation.id };
  }

  // Update conversation context
  updateContext(conversationId: string, context: Record<string, unknown>): void {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.context = { ...conversation.context, ...context };
    }
  }

  // Get conversation history
  getHistory(conversationId: string): Message[] {
    return this.conversations.get(conversationId)?.messages || [];
  }

  // Clear conversation
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  // Get conversation summary
  async summarizeConversation(conversationId: string): Promise<string> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.messages.length === 0) {
      return 'No conversation to summarize';
    }

    const transcript = conversation.messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Summarize this conversation:\n\n${transcript}`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }
}
```

### src/agents/conversational/personalities.ts
```typescript
// src/agents/conversational/personalities.ts

export const personalities = {
  // Professional assistant
  professional: {
    name: 'Alex',
    traits: ['professional', 'efficient', 'knowledgeable', 'precise'],
    tone: 'formal and business-like',
    responseStyle: 'detailed' as const,
    examples: [
      {
        user: 'Can you help me with this report?',
        assistant: 'I would be happy to assist you with your report. Could you please provide more details about the subject matter and desired format?'
      }
    ]
  },

  // Friendly helper
  friendly: {
    name: 'Sam',
    traits: ['friendly', 'supportive', 'patient', 'encouraging'],
    tone: 'warm and approachable',
    responseStyle: 'casual' as const,
    examples: [
      {
        user: 'I need some help',
        assistant: 'Hey there! I am totally here to help. What can I do for you today?'
      }
    ]
  },

  // Technical expert
  technical: {
    name: 'Taylor',
    traits: ['technical', 'precise', 'thorough', 'analytical'],
    tone: 'informative and detailed',
    responseStyle: 'detailed' as const,
    examples: [
      {
        user: 'How does this work?',
        assistant: 'Let me explain the technical details. The process involves several key components...'
      }
    ]
  },

  // Creative companion
  creative: {
    name: 'Jordan',
    traits: ['creative', 'imaginative', 'enthusiastic', 'playful'],
    tone: 'energetic and inspiring',
    responseStyle: 'casual' as const,
    examples: [
      {
        user: 'I need some ideas',
        assistant: 'Oh, I love brainstorming! Lets dive into some creative possibilities together!'
      }
    ]
  },

  // Empathetic counselor
  empathetic: {
    name: 'Morgan',
    traits: ['empathetic', 'understanding', 'supportive', 'calm'],
    tone: 'gentle and reassuring',
    responseStyle: 'detailed' as const,
    examples: [
      {
        user: 'I am feeling overwhelmed',
        assistant: 'I hear you, and its completely okay to feel that way. Lets take this one step at a time together.'
      }
    ]
  },

  // Concise assistant
  concise: {
    name: 'Pat',
    traits: ['efficient', 'direct', 'clear', 'focused'],
    tone: 'straightforward',
    responseStyle: 'concise' as const,
    examples: [
      {
        user: 'What time is it?',
        assistant: 'Its 3:45 PM.'
      }
    ]
  }
};

export type PersonalityType = keyof typeof personalities;
```

### src/agents/conversational/intent-handler.ts
```typescript
// src/agents/conversational/intent-handler.ts
import Anthropic from '@anthropic-ai/sdk';

interface IntentHandler {
  intent: string;
  handler: (message: string, context: Record<string, unknown>) => Promise<string>;
}

export class IntentRouter {
  private client: Anthropic;
  private handlers: Map<string, IntentHandler['handler']> = new Map();
  private defaultHandler: IntentHandler['handler'];

  constructor() {
    this.client = new Anthropic();

    // Default handler
    this.defaultHandler = async (message) => {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: message }]
      });
      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    };

    // Register built-in handlers
    this.registerBuiltInHandlers();
  }

  private registerBuiltInHandlers(): void {
    // Greeting handler
    this.registerHandler('greeting', async (message) => {
      const greetings = [
        'Hello! How can I help you today?',
        'Hi there! What can I do for you?',
        'Hey! Great to hear from you. How can I assist?'
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    });

    // Goodbye handler
    this.registerHandler('goodbye', async () => {
      const farewells = [
        'Goodbye! Have a great day!',
        'Take care! Feel free to come back anytime.',
        'Bye for now! It was nice chatting with you.'
      ];
      return farewells[Math.floor(Math.random() * farewells.length)];
    });

    // Clarification handler
    this.registerHandler('clarification', async (message, context) => {
      return `I want to make sure I understand correctly. ${message}\n\nCould you provide more details about what you're looking for?`;
    });

    // Complaint handler
    this.registerHandler('complaint', async (message) => {
      return `I'm sorry to hear that you're experiencing issues. I want to help resolve this for you. Could you tell me more about what's happening?`;
    });
  }

  registerHandler(intent: string, handler: IntentHandler['handler']): void {
    this.handlers.set(intent, handler);
  }

  async detectIntent(message: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 50,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Classify the intent of this message into one category:
Message: "${message}"

Categories: greeting, question, request, complaint, feedback, goodbye, clarification, other

Respond with just the category name.`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text.toLowerCase().trim() : 'other';
  }

  async route(
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<{ intent: string; response: string }> {
    const intent = await this.detectIntent(message);
    const handler = this.handlers.get(intent) || this.defaultHandler;
    const response = await handler(message, context);

    return { intent, response };
  }
}
```

### src/agents/conversational/context-manager.ts
```typescript
// src/agents/conversational/context-manager.ts

interface ContextSlot {
  name: string;
  value: unknown;
  confidence: number;
  source: 'user' | 'inferred' | 'system';
  timestamp: number;
}

interface ConversationContext {
  slots: Map<string, ContextSlot>;
  topics: string[];
  userProfile: Record<string, unknown>;
  sessionData: Record<string, unknown>;
}

export class ContextManager {
  private context: ConversationContext;
  private slotDefinitions: Map<string, { type: string; required: boolean }> = new Map();

  constructor() {
    this.context = {
      slots: new Map(),
      topics: [],
      userProfile: {},
      sessionData: {}
    };
  }

  // Define expected slots
  defineSlot(name: string, type: string, required: boolean = false): void {
    this.slotDefinitions.set(name, { type, required });
  }

  // Set a slot value
  setSlot(
    name: string,
    value: unknown,
    confidence: number = 1.0,
    source: ContextSlot['source'] = 'user'
  ): void {
    this.context.slots.set(name, {
      name,
      value,
      confidence,
      source,
      timestamp: Date.now()
    });
  }

  // Get a slot value
  getSlot(name: string): unknown {
    return this.context.slots.get(name)?.value;
  }

  // Check if slot exists
  hasSlot(name: string): boolean {
    return this.context.slots.has(name);
  }

  // Clear a slot
  clearSlot(name: string): void {
    this.context.slots.delete(name);
  }

  // Get missing required slots
  getMissingSlots(): string[] {
    const missing: string[] = [];
    for (const [name, def] of this.slotDefinitions) {
      if (def.required && !this.hasSlot(name)) {
        missing.push(name);
      }
    }
    return missing;
  }

  // Add topic to conversation
  addTopic(topic: string): void {
    if (!this.context.topics.includes(topic)) {
      this.context.topics.push(topic);
    }
  }

  // Get current topics
  getTopics(): string[] {
    return [...this.context.topics];
  }

  // Update user profile
  updateUserProfile(data: Record<string, unknown>): void {
    this.context.userProfile = { ...this.context.userProfile, ...data };
  }

  // Get user profile
  getUserProfile(): Record<string, unknown> {
    return { ...this.context.userProfile };
  }

  // Set session data
  setSessionData(key: string, value: unknown): void {
    this.context.sessionData[key] = value;
  }

  // Get session data
  getSessionData(key: string): unknown {
    return this.context.sessionData[key];
  }

  // Export context as JSON
  export(): Record<string, unknown> {
    return {
      slots: Object.fromEntries(this.context.slots),
      topics: this.context.topics,
      userProfile: this.context.userProfile,
      sessionData: this.context.sessionData
    };
  }

  // Import context from JSON
  import(data: Record<string, unknown>): void {
    if (data.slots) {
      const slots = data.slots as Record<string, ContextSlot>;
      this.context.slots = new Map(Object.entries(slots));
    }
    if (data.topics) {
      this.context.topics = data.topics as string[];
    }
    if (data.userProfile) {
      this.context.userProfile = data.userProfile as Record<string, unknown>;
    }
    if (data.sessionData) {
      this.context.sessionData = data.sessionData as Record<string, unknown>;
    }
  }

  // Clear all context
  clear(): void {
    this.context = {
      slots: new Map(),
      topics: [],
      userProfile: {},
      sessionData: {}
    };
  }
}
```

## Usage Example

### src/agents/conversational/example.ts
```typescript
// src/agents/conversational/example.ts
import { ConversationalAgent } from './agent';
import { personalities } from './personalities';
import { IntentRouter } from './intent-handler';

async function main() {
  // Create agent with friendly personality
  const agent = new ConversationalAgent({
    personality: personalities.friendly,
    enableIntentDetection: true,
    temperature: 0.8
  });

  // Start conversation
  const convId = agent.startConversation({
    userName: 'User',
    topic: 'general assistance'
  });

  console.log('=== Conversational Agent Demo ===\n');

  // Have a conversation
  const messages = [
    'Hi there!',
    'I need help understanding TypeScript generics',
    'Can you show me an example?',
    'That makes sense, thanks!'
  ];

  for (const msg of messages) {
    console.log(`User: ${msg}`);
    const { response } = await agent.chat(msg, convId);
    console.log(`Agent: ${response}\n`);
  }

  // Get summary
  console.log('=== Conversation Summary ===');
  const summary = await agent.summarizeConversation(convId);
  console.log(summary);

  // Demo streaming
  console.log('\n=== Streaming Demo ===');
  console.log('User: Explain async/await in simple terms');
  process.stdout.write('Agent: ');

  for await (const chunk of agent.chatStream('Explain async/await in simple terms', convId)) {
    process.stdout.write(chunk);
  }
  console.log('\n');
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Conversational Agent

### Personalities
- `professional`: Formal, business-like
- `friendly`: Warm, approachable
- `technical`: Detailed, analytical
- `creative`: Imaginative, playful
- `empathetic`: Supportive, calm
- `concise`: Direct, efficient

### Usage
```typescript
import { ConversationalAgent } from './agent';
import { personalities } from './personalities';

const agent = new ConversationalAgent({
  personality: personalities.friendly
});

const convId = agent.startConversation();
const { response } = await agent.chat('Hello!', convId);
```

### Features
- Multi-turn conversation memory
- Intent detection
- Sentiment analysis
- Context management
- Conversation summarization
- Streaming responses

### Context
```typescript
agent.updateContext(convId, { userName: 'Alice' });
```
```

## AI Suggestions

1. **Personality adaptation** - Adjust based on user
2. **Emotion recognition** - Detect user emotions
3. **Topic tracking** - Follow conversation threads
4. **Proactive suggestions** - Offer relevant help
5. **Memory persistence** - Long-term user memory
6. **Multi-language** - Handle multiple languages
7. **Conversation analytics** - Track patterns
8. **Handoff support** - Transfer to humans
9. **Response caching** - Cache common responses
10. **A/B testing** - Test different approaches
