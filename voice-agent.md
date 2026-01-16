---
name: voice-agent
description: Autonomous voice/phone agent for calls, IVR, and voice assistants
version: 1.0.0
category: agents
tags: [voice, phone, twilio, vapi, ivr, call-center]
---

# Voice Agent

Autonomous agent for handling phone calls, voice interactions, and conversational IVR systems.

## Agent Configuration

```json
{
  "agent_id": "voice-agent-v1",
  "name": "Voice Agent",
  "type": "ConversationalAgent",
  "version": "1.0.0",
  "description": "Handles inbound/outbound phone calls with natural conversation",
  "capabilities": {
    "inbound_calls": true,
    "outbound_calls": true,
    "voicemail_detection": true,
    "call_transfer": true,
    "dtmf_handling": true,
    "speech_recognition": true,
    "text_to_speech": true,
    "call_recording": true,
    "sentiment_analysis": true
  },
  "integrations": ["twilio", "vapi", "bland", "retell", "vonage"],
  "memory": {
    "type": "conversation",
    "retention": "call_duration",
    "context_window": 50
  }
}
```

## System Prompt

```
You are a professional voice agent handling phone calls. Your responses will be converted to speech, so follow these guidelines:

VOICE INTERACTION RULES:
1. Keep responses concise (1-2 sentences max per turn)
2. Use natural, conversational language
3. Avoid technical jargon unless speaking to technical users
4. Spell out numbers for clarity (e.g., "one two three" not "123")
5. Use phonetic spelling for emails/codes when needed
6. Pause naturally with "..." for emphasis
7. Confirm important information by repeating it back
8. Handle interruptions gracefully

CALL FLOW:
1. Greet warmly and identify yourself/company
2. Determine caller intent within first 30 seconds
3. Gather required information efficiently
4. Provide clear next steps or resolution
5. Confirm understanding before ending
6. End with professional closing

ESCALATION TRIGGERS:
- Caller requests human agent
- Caller expresses frustration 3+ times
- Issue outside defined capabilities
- Legal/compliance sensitive topics
- Emergency situations

PROHIBITED:
- Making promises you cannot keep
- Sharing confidential information
- Arguing with callers
- Putting callers on extended holds without updates
```

## Tool Definitions

### Core Tools

```typescript
const voiceTools = [
  {
    name: "transfer_call",
    description: "Transfer the call to another agent or department",
    parameters: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "Phone number or extension to transfer to"
        },
        department: {
          type: "string",
          enum: ["sales", "support", "billing", "technical", "manager"]
        },
        warm_transfer: {
          type: "boolean",
          description: "Whether to brief the receiving agent first"
        },
        context: {
          type: "string",
          description: "Summary to pass to receiving agent"
        }
      },
      required: ["destination"]
    }
  },
  {
    name: "send_sms",
    description: "Send an SMS to the caller",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "SMS content (max 160 chars)"
        },
        include_link: {
          type: "string",
          description: "Optional URL to include"
        }
      },
      required: ["message"]
    }
  },
  {
    name: "schedule_callback",
    description: "Schedule a callback for the caller",
    parameters: {
      type: "object",
      properties: {
        datetime: {
          type: "string",
          description: "ISO datetime for callback"
        },
        reason: {
          type: "string",
          description: "Purpose of callback"
        },
        preferred_agent: {
          type: "string",
          description: "Specific agent if requested"
        }
      },
      required: ["datetime", "reason"]
    }
  },
  {
    name: "lookup_customer",
    description: "Look up customer information by phone or email",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string" },
        email: { type: "string" },
        account_id: { type: "string" }
      }
    }
  },
  {
    name: "create_ticket",
    description: "Create a support ticket from the call",
    parameters: {
      type: "object",
      properties: {
        subject: { type: "string" },
        description: { type: "string" },
        priority: {
          type: "string",
          enum: ["low", "medium", "high", "urgent"]
        },
        category: { type: "string" }
      },
      required: ["subject", "description"]
    }
  },
  {
    name: "check_availability",
    description: "Check appointment/schedule availability",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string" },
        service_type: { type: "string" },
        duration_minutes: { type: "number" }
      },
      required: ["date"]
    }
  },
  {
    name: "book_appointment",
    description: "Book an appointment for the caller",
    parameters: {
      type: "object",
      properties: {
        datetime: { type: "string" },
        service_type: { type: "string" },
        notes: { type: "string" }
      },
      required: ["datetime", "service_type"]
    }
  },
  {
    name: "play_audio",
    description: "Play a pre-recorded audio message",
    parameters: {
      type: "object",
      properties: {
        audio_id: {
          type: "string",
          enum: ["hold_music", "transfer_notice", "recording_notice", "goodbye"]
        }
      },
      required: ["audio_id"]
    }
  },
  {
    name: "collect_dtmf",
    description: "Collect touch-tone input from caller",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        num_digits: { type: "number" },
        timeout_seconds: { type: "number", default: 10 }
      },
      required: ["prompt", "num_digits"]
    }
  },
  {
    name: "end_call",
    description: "End the current call",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["resolved", "transferred", "callback_scheduled", "caller_hangup", "escalated"]
        },
        summary: { type: "string" }
      },
      required: ["reason"]
    }
  }
];
```

## Call Flow Templates

### Inbound Support Call

```yaml
flow: inbound_support
triggers:
  - inbound_call
  - department: support

steps:
  - greeting:
      message: "Thank you for calling {company}. My name is {agent_name}. How can I help you today?"

  - identify_caller:
      tool: lookup_customer
      fallback: "I don't see an account with that number. Could you provide your email address?"

  - determine_intent:
      categories:
        - billing_inquiry
        - technical_issue
        - general_question
        - complaint
        - cancel_service

  - handle_request:
      max_turns: 10
      escalation_threshold: 3

  - resolution:
      confirm: "Just to confirm, I've {action_taken}. Is there anything else I can help you with?"

  - closing:
      message: "Thank you for calling {company}. Have a great day!"
      tool: end_call
```

### Outbound Sales Call

```yaml
flow: outbound_sales
triggers:
  - scheduled_campaign
  - lead_score: ">= 50"

steps:
  - voicemail_detection:
      on_voicemail: leave_message
      on_human: continue

  - introduction:
      message: "Hi, this is {agent_name} from {company}. I'm reaching out because {reason}. Do you have a moment?"
      handle_no: "No problem, when would be a better time to call back?"

  - qualification:
      questions:
        - "Are you currently using {product_category}?"
        - "What's your biggest challenge with {pain_point}?"
        - "Who else is involved in decisions like this?"

  - value_proposition:
      personalize: true
      max_duration: 60_seconds

  - next_steps:
      options:
        - schedule_demo
        - send_info
        - callback
        - not_interested

  - closing:
      message: "Thanks for your time, {first_name}. {next_step_confirmation}"
```

### Appointment Reminder

```yaml
flow: appointment_reminder
triggers:
  - scheduled: "24h before appointment"

steps:
  - introduction:
      message: "Hi, this is an automated call from {company} to remind you of your appointment tomorrow at {time}."

  - confirmation:
      tool: collect_dtmf
      prompt: "Press 1 to confirm, 2 to reschedule, or 3 to cancel."

  - handle_response:
      "1":
        message: "Great, we'll see you tomorrow at {time}. Goodbye!"
        action: confirm_appointment
      "2":
        message: "Let me check our availability..."
        action: reschedule_flow
      "3":
        message: "I've cancelled your appointment. Would you like to reschedule?"
        action: cancel_appointment
```

## Integration Examples

### Twilio Voice (Node.js)

```typescript
import Twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';

const twilio = new Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const anthropic = new Anthropic();

// Webhook for incoming calls
app.post('/voice/incoming', async (req, res) => {
  const twiml = new Twilio.twiml.VoiceResponse();

  // Start conversation
  const gather = twiml.gather({
    input: 'speech',
    action: '/voice/respond',
    speechTimeout: 'auto',
    language: 'en-US'
  });

  gather.say({
    voice: 'Polly.Joanna'
  }, 'Thank you for calling. How can I help you today?');

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle speech input
app.post('/voice/respond', async (req, res) => {
  const userSpeech = req.body.SpeechResult;
  const callSid = req.body.CallSid;

  // Get conversation history from cache
  const history = await getConversationHistory(callSid);

  // Generate response with Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: VOICE_AGENT_SYSTEM_PROMPT,
    messages: [
      ...history,
      { role: 'user', content: userSpeech }
    ],
    tools: voiceTools
  });

  // Process tool calls or generate speech
  const twiml = new Twilio.twiml.VoiceResponse();

  if (response.stop_reason === 'tool_use') {
    await handleToolCall(response, callSid, twiml);
  } else {
    const agentResponse = response.content[0].text;

    const gather = twiml.gather({
      input: 'speech',
      action: '/voice/respond',
      speechTimeout: 'auto'
    });

    gather.say({ voice: 'Polly.Joanna' }, agentResponse);
  }

  // Save to history
  await saveConversationHistory(callSid, userSpeech, response);

  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle tool execution
async function handleToolCall(response, callSid, twiml) {
  const toolUse = response.content.find(c => c.type === 'tool_use');

  switch (toolUse.name) {
    case 'transfer_call':
      twiml.say('Please hold while I transfer your call.');
      twiml.dial().number(toolUse.input.destination);
      break;

    case 'send_sms':
      await twilio.messages.create({
        to: req.body.From,
        from: process.env.TWILIO_NUMBER,
        body: toolUse.input.message
      });
      twiml.say("I've sent that information to your phone via text message.");
      break;

    case 'end_call':
      twiml.say('Thank you for calling. Goodbye!');
      twiml.hangup();
      break;

    // ... handle other tools
  }
}
```

### VAPI Integration

```typescript
import { Vapi } from '@vapi-ai/server-sdk';

const vapi = new Vapi({ apiKey: process.env.VAPI_API_KEY });

// Create voice agent
const agent = await vapi.assistants.create({
  name: 'Support Agent',
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    systemPrompt: VOICE_AGENT_SYSTEM_PROMPT,
    tools: voiceTools
  },
  voice: {
    provider: 'elevenlabs',
    voiceId: 'rachel'
  },
  firstMessage: 'Thank you for calling. How can I help you today?',
  endCallPhrases: ['goodbye', 'bye', 'that\'s all'],
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2'
  },
  recordingEnabled: true,
  silenceTimeoutSeconds: 30
});

// Start outbound call
const call = await vapi.calls.create({
  assistantId: agent.id,
  customer: {
    number: '+1234567890'
  },
  phoneNumber: {
    twilioPhoneNumber: process.env.TWILIO_NUMBER
  }
});

// Handle call events via webhook
app.post('/vapi/webhook', async (req, res) => {
  const { type, call, transcript } = req.body;

  switch (type) {
    case 'call-started':
      console.log(`Call started: ${call.id}`);
      break;

    case 'tool-call':
      const result = await executeVoiceTool(req.body.toolCall);
      res.json({ result });
      return;

    case 'call-ended':
      await saveCallRecord({
        callId: call.id,
        duration: call.duration,
        transcript: transcript,
        outcome: call.endedReason
      });
      break;
  }

  res.json({ success: true });
});
```

### Bland.ai Integration

```typescript
import Bland from 'bland-ai';

const bland = new Bland(process.env.BLAND_API_KEY);

// Create and dispatch call
const call = await bland.calls.create({
  phone_number: '+1234567890',
  task: `You are a friendly appointment reminder agent for ${companyName}.
         Call to remind about appointment on ${appointmentDate}.
         Confirm, reschedule, or cancel based on their preference.`,
  voice: 'nat',
  reduce_latency: true,
  wait_for_greeting: true,
  first_sentence: `Hi, this is a reminder call from ${companyName} about your upcoming appointment.`,
  model: 'enhanced',
  tools: [
    {
      name: 'confirm_appointment',
      description: 'Mark appointment as confirmed',
      parameters: {}
    },
    {
      name: 'reschedule_appointment',
      description: 'Reschedule to new date/time',
      parameters: {
        new_datetime: { type: 'string' }
      }
    },
    {
      name: 'cancel_appointment',
      description: 'Cancel the appointment',
      parameters: {
        reason: { type: 'string' }
      }
    }
  ],
  webhook: 'https://yourapp.com/bland/webhook'
});
```

## Voice-Specific Prompts

### Handling Common Scenarios

```typescript
const voiceScenarios = {
  // Caller is upset
  angry_caller: `
    I can hear that you're frustrated, and I completely understand.
    Let me do everything I can to help resolve this for you right now.
    {pause}
    Can you tell me exactly what happened?
  `,

  // Caller is confused
  confused_caller: `
    No problem, let me explain that differently.
    {simplified_explanation}
    Does that make more sense?
  `,

  // Background noise
  noisy_environment: `
    I'm having a little trouble hearing you clearly.
    Could you repeat that for me?
  `,

  // Caller going off-topic
  redirect: `
    I understand. Let me make sure we get your main issue resolved first.
    You mentioned {original_issue}. Let's take care of that, and then I'm happy to help with anything else.
  `,

  // Verification required
  verify_identity: `
    For security purposes, I need to verify your identity.
    Can you confirm the last four digits of your account number?
  `,

  // Hold message
  placing_on_hold: `
    I need to look something up for you. This will just take a moment.
    Please hold.
    {hold_music}
    Thanks for holding. I found what I was looking for.
  `
};
```

## Analytics & Reporting

```typescript
interface CallMetrics {
  call_id: string;
  duration_seconds: number;
  wait_time_seconds: number;
  hold_time_seconds: number;
  sentiment_scores: number[];  // Per-turn sentiment
  resolution: 'resolved' | 'escalated' | 'callback' | 'abandoned';
  first_call_resolution: boolean;
  transfer_count: number;
  tools_used: string[];
  topics_discussed: string[];
  customer_satisfaction?: number;  // Post-call survey
}

// Generate call summary
async function generateCallSummary(transcript: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Summarize this call transcript in 3-4 bullet points:

      ${transcript}

      Include: Main issue, Resolution, Follow-up needed (if any)`
    }]
  });

  return response.content[0].text;
}
```

## Deployment Checklist

- [ ] Configure voice provider (Twilio/VAPI/Bland)
- [ ] Set up phone number(s)
- [ ] Configure speech recognition settings
- [ ] Select and test TTS voice
- [ ] Set up call recording storage
- [ ] Configure webhook endpoints
- [ ] Test voicemail detection
- [ ] Set up call transfer routing
- [ ] Configure business hours
- [ ] Set up after-hours handling
- [ ] Test escalation paths
- [ ] Configure analytics/logging
- [ ] Set up quality monitoring
