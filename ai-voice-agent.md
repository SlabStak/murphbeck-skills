# VOICE.AGENT.EXE - AI Voice Agent Builder

You are **VOICE.AGENT.EXE** - the AI specialist for designing and building production-ready voice AI agents that can make calls, handle inbound calls, and conduct natural phone conversations.

---

## CORE MODULES

### PlatformEngine.MOD
- Vapi integration
- Bland.ai configuration
- Retell AI setup
- Custom implementations

### VoiceEngine.MOD
- Text-to-speech (TTS)
- Speech-to-text (STT)
- Voice cloning
- SSML markup

### ConversationFlow.MOD
- Turn-taking logic
- Intent detection
- State machines
- Fallback handling

### TelephonyEngine.MOD
- Twilio integration
- Phone number provisioning
- Call routing
- Recording & transcription

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
VOICE.AGENT.EXE - AI Voice Agent Builder
Production-ready voice AI agent generator for phone automation.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable
from enum import Enum
from pathlib import Path
import json


# ============================================================
# ENUMS - Platform & Voice Types
# ============================================================

class VoicePlatform(Enum):
    """Voice AI platforms."""
    VAPI = "vapi"
    BLAND = "bland"
    RETELL = "retell"
    CUSTOM = "custom"

    @property
    def display_name(self) -> str:
        """Platform display name."""
        names = {
            "vapi": "Vapi",
            "bland": "Bland.ai",
            "retell": "Retell AI",
            "custom": "Custom Implementation"
        }
        return names.get(self.value, self.value.title())

    @property
    def api_base_url(self) -> str:
        """API base URL."""
        urls = {
            "vapi": "https://api.vapi.ai",
            "bland": "https://api.bland.ai/v1",
            "retell": "https://api.retellai.com",
            "custom": ""
        }
        return urls.get(self.value, "")

    @property
    def pricing_model(self) -> str:
        """Pricing model description."""
        pricing = {
            "vapi": "Per-minute pricing (~$0.05-0.10/min)",
            "bland": "Per-minute pricing (~$0.09/min)",
            "retell": "Per-minute pricing (~$0.07/min)",
            "custom": "Infrastructure costs only"
        }
        return pricing.get(self.value, "")

    @property
    def features(self) -> List[str]:
        """Platform features."""
        features = {
            "vapi": ["Function calling", "Squads (multi-agent)", "Voicemail detection", "Custom LLMs"],
            "bland": ["Pathway builder", "Batch calling", "Custom voices", "Webhooks"],
            "retell": ["Low latency", "Custom LLMs", "Call analytics", "Sentiment analysis"],
            "custom": ["Full control", "No vendor lock-in", "Custom everything"]
        }
        return features.get(self.value, [])


class TTSProvider(Enum):
    """Text-to-Speech providers."""
    ELEVENLABS = "elevenlabs"
    OPENAI = "openai"
    PLAYHT = "playht"
    DEEPGRAM = "deepgram"
    AZURE = "azure"
    GOOGLE = "google"
    CARTESIA = "cartesia"

    @property
    def display_name(self) -> str:
        """Provider display name."""
        names = {
            "elevenlabs": "ElevenLabs",
            "openai": "OpenAI TTS",
            "playht": "PlayHT",
            "deepgram": "Deepgram Aura",
            "azure": "Azure Speech",
            "google": "Google Cloud TTS",
            "cartesia": "Cartesia"
        }
        return names.get(self.value, self.value.title())

    @property
    def latency_class(self) -> str:
        """Latency classification."""
        latency = {
            "elevenlabs": "low",
            "openai": "medium",
            "playht": "low",
            "deepgram": "ultra-low",
            "azure": "low",
            "google": "low",
            "cartesia": "ultra-low"
        }
        return latency.get(self.value, "medium")

    @property
    def voice_quality(self) -> str:
        """Voice quality rating."""
        quality = {
            "elevenlabs": "excellent",
            "openai": "good",
            "playht": "excellent",
            "deepgram": "good",
            "azure": "good",
            "google": "good",
            "cartesia": "excellent"
        }
        return quality.get(self.value, "good")

    @property
    def supports_cloning(self) -> bool:
        """Whether provider supports voice cloning."""
        cloning = {
            "elevenlabs": True,
            "openai": False,
            "playht": True,
            "deepgram": False,
            "azure": True,
            "google": False,
            "cartesia": True
        }
        return cloning.get(self.value, False)


class STTProvider(Enum):
    """Speech-to-Text providers."""
    DEEPGRAM = "deepgram"
    OPENAI_WHISPER = "openai_whisper"
    ASSEMBLYAI = "assemblyai"
    AZURE = "azure"
    GOOGLE = "google"
    GLADIA = "gladia"

    @property
    def display_name(self) -> str:
        """Provider display name."""
        names = {
            "deepgram": "Deepgram",
            "openai_whisper": "OpenAI Whisper",
            "assemblyai": "AssemblyAI",
            "azure": "Azure Speech",
            "google": "Google Speech-to-Text",
            "gladia": "Gladia"
        }
        return names.get(self.value, self.value.title())

    @property
    def real_time(self) -> bool:
        """Whether provider supports real-time streaming."""
        streaming = {
            "deepgram": True,
            "openai_whisper": False,
            "assemblyai": True,
            "azure": True,
            "google": True,
            "gladia": True
        }
        return streaming.get(self.value, False)

    @property
    def accuracy_rating(self) -> str:
        """Accuracy rating."""
        accuracy = {
            "deepgram": "excellent",
            "openai_whisper": "excellent",
            "assemblyai": "excellent",
            "azure": "good",
            "google": "good",
            "gladia": "good"
        }
        return accuracy.get(self.value, "good")


class LLMProvider(Enum):
    """LLM providers for conversation."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GROQ = "groq"
    TOGETHER = "together"
    CUSTOM = "custom"

    @property
    def models(self) -> List[str]:
        """Available models."""
        models = {
            "openai": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
            "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
            "groq": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
            "together": ["meta-llama/Llama-3.3-70B-Instruct-Turbo"],
            "custom": []
        }
        return models.get(self.value, [])


class CallDirection(Enum):
    """Call direction."""
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    BOTH = "both"


class ConversationState(Enum):
    """Conversation states."""
    GREETING = "greeting"
    IDENTIFICATION = "identification"
    DISCOVERY = "discovery"
    PRESENTATION = "presentation"
    OBJECTION_HANDLING = "objection_handling"
    CLOSING = "closing"
    SCHEDULING = "scheduling"
    TRANSFER = "transfer"
    FAREWELL = "farewell"
    VOICEMAIL = "voicemail"

    @property
    def typical_prompts(self) -> List[str]:
        """Typical prompts for this state."""
        prompts = {
            "greeting": ["Hello, this is {agent_name} from {company}."],
            "identification": ["May I speak with {contact_name}?", "Who am I speaking with?"],
            "discovery": ["What are your current challenges with...?"],
            "presentation": ["Let me tell you about how we can help..."],
            "objection_handling": ["I understand your concern..."],
            "closing": ["Based on our conversation, shall we...?"],
            "scheduling": ["What time works best for you?"],
            "transfer": ["Let me connect you with a specialist..."],
            "farewell": ["Thank you for your time. Have a great day!"],
            "voicemail": ["Hi, this is {agent_name}. I'm calling about..."]
        }
        return prompts.get(self.value, [])


class IntentType(Enum):
    """User intent types."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    QUESTION = "question"
    OBJECTION = "objection"
    REQUEST_CALLBACK = "request_callback"
    REQUEST_INFO = "request_info"
    REQUEST_HUMAN = "request_human"
    UNCLEAR = "unclear"


# ============================================================
# DATACLASSES - Agent Components
# ============================================================

@dataclass
class VoiceConfig:
    """Voice configuration."""
    provider: TTSProvider
    voice_id: str
    speed: float = 1.0
    pitch: float = 1.0
    stability: float = 0.75
    similarity_boost: float = 0.75
    style: float = 0.0
    use_ssml: bool = True

    @classmethod
    def elevenlabs_professional(cls, voice_id: str = "21m00Tcm4TlvDq8ikWAM") -> "VoiceConfig":
        """Professional ElevenLabs voice."""
        return cls(
            provider=TTSProvider.ELEVENLABS,
            voice_id=voice_id,
            speed=1.0,
            stability=0.8,
            similarity_boost=0.8
        )

    @classmethod
    def openai_alloy(cls) -> "VoiceConfig":
        """OpenAI Alloy voice."""
        return cls(
            provider=TTSProvider.OPENAI,
            voice_id="alloy",
            speed=1.0
        )

    @classmethod
    def deepgram_aura(cls, voice_id: str = "aura-asteria-en") -> "VoiceConfig":
        """Deepgram Aura voice for low latency."""
        return cls(
            provider=TTSProvider.DEEPGRAM,
            voice_id=voice_id,
            speed=1.0
        )

    def to_vapi_config(self) -> Dict[str, Any]:
        """Convert to Vapi voice configuration."""
        if self.provider == TTSProvider.ELEVENLABS:
            return {
                "provider": "11labs",
                "voiceId": self.voice_id,
                "stability": self.stability,
                "similarityBoost": self.similarity_boost,
                "style": self.style,
                "speed": self.speed
            }
        elif self.provider == TTSProvider.OPENAI:
            return {
                "provider": "openai",
                "voiceId": self.voice_id,
                "speed": self.speed
            }
        elif self.provider == TTSProvider.DEEPGRAM:
            return {
                "provider": "deepgram",
                "voiceId": self.voice_id
            }
        return {}


@dataclass
class TranscriptionConfig:
    """Transcription configuration."""
    provider: STTProvider
    language: str = "en"
    model: str = "nova-2"
    endpointing: int = 300  # ms of silence before end of speech
    keywords: List[str] = field(default_factory=list)

    @classmethod
    def deepgram_default(cls) -> "TranscriptionConfig":
        """Default Deepgram configuration."""
        return cls(
            provider=STTProvider.DEEPGRAM,
            model="nova-2",
            endpointing=300
        )

    @classmethod
    def high_accuracy(cls) -> "TranscriptionConfig":
        """High accuracy configuration."""
        return cls(
            provider=STTProvider.DEEPGRAM,
            model="nova-2",
            endpointing=400
        )


@dataclass
class FunctionDefinition:
    """Function/tool that the agent can call."""
    name: str
    description: str
    parameters: Dict[str, Any]
    handler_url: Optional[str] = None
    is_async: bool = False
    timeout_seconds: int = 10

    def to_openai_function(self) -> Dict[str, Any]:
        """Convert to OpenAI function format."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters
        }

    def to_vapi_function(self) -> Dict[str, Any]:
        """Convert to Vapi function format."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "server": {
                "url": self.handler_url
            } if self.handler_url else None
        }

    @classmethod
    def book_appointment(cls, webhook_url: str) -> "FunctionDefinition":
        """Pre-built appointment booking function."""
        return cls(
            name="book_appointment",
            description="Book an appointment for the caller",
            parameters={
                "type": "object",
                "properties": {
                    "date": {"type": "string", "description": "Date in YYYY-MM-DD format"},
                    "time": {"type": "string", "description": "Time in HH:MM format"},
                    "service": {"type": "string", "description": "Service being booked"},
                    "name": {"type": "string", "description": "Customer name"},
                    "phone": {"type": "string", "description": "Customer phone number"}
                },
                "required": ["date", "time", "name"]
            },
            handler_url=webhook_url
        )

    @classmethod
    def transfer_call(cls, webhook_url: str) -> "FunctionDefinition":
        """Pre-built call transfer function."""
        return cls(
            name="transfer_call",
            description="Transfer the call to a human agent",
            parameters={
                "type": "object",
                "properties": {
                    "department": {
                        "type": "string",
                        "enum": ["sales", "support", "billing"],
                        "description": "Department to transfer to"
                    },
                    "reason": {"type": "string", "description": "Reason for transfer"}
                },
                "required": ["department"]
            },
            handler_url=webhook_url
        )

    @classmethod
    def end_call(cls) -> "FunctionDefinition":
        """Pre-built end call function."""
        return cls(
            name="end_call",
            description="End the phone call",
            parameters={
                "type": "object",
                "properties": {
                    "reason": {"type": "string", "description": "Reason for ending the call"}
                }
            }
        )


@dataclass
class ConversationStep:
    """A step in the conversation flow."""
    state: ConversationState
    system_prompt: str
    transition_rules: Dict[IntentType, ConversationState] = field(default_factory=dict)
    max_attempts: int = 3
    fallback_state: Optional[ConversationState] = None

    def to_pathway_step(self) -> Dict[str, Any]:
        """Convert to Bland.ai pathway format."""
        return {
            "name": self.state.value,
            "prompt": self.system_prompt,
            "transitions": {
                intent.value: next_state.value
                for intent, next_state in self.transition_rules.items()
            }
        }


@dataclass
class AgentPersona:
    """Agent personality and style."""
    name: str
    company: str
    role: str = "AI Assistant"
    personality_traits: List[str] = field(default_factory=list)
    communication_style: str = "professional and friendly"
    knowledge_areas: List[str] = field(default_factory=list)
    prohibited_topics: List[str] = field(default_factory=list)

    def to_system_prompt(self) -> str:
        """Generate system prompt from persona."""
        traits = ", ".join(self.personality_traits) if self.personality_traits else "helpful and professional"
        knowledge = ", ".join(self.knowledge_areas) if self.knowledge_areas else "general assistance"

        prompt = f"""You are {self.name}, a {self.role} at {self.company}.

PERSONALITY:
- Communication style: {self.communication_style}
- Traits: {traits}

KNOWLEDGE AREAS:
{knowledge}

IMPORTANT GUIDELINES:
- Keep responses concise and conversational (phone format)
- Don't use markdown, bullet points, or formatting
- Speak naturally as if on a phone call
- Ask one question at a time
- Confirm important information by repeating it back
- If you don't understand, ask for clarification
"""

        if self.prohibited_topics:
            prohibited = ", ".join(self.prohibited_topics)
            prompt += f"\nNEVER discuss: {prohibited}"

        return prompt

    @classmethod
    def sales_rep(cls, name: str, company: str) -> "AgentPersona":
        """Sales representative persona."""
        return cls(
            name=name,
            company=company,
            role="Sales Representative",
            personality_traits=["friendly", "enthusiastic", "patient", "helpful"],
            communication_style="warm and consultative",
            knowledge_areas=["product features", "pricing", "competitors", "use cases"],
            prohibited_topics=["internal company matters", "confidential data"]
        )

    @classmethod
    def support_agent(cls, name: str, company: str) -> "AgentPersona":
        """Customer support agent persona."""
        return cls(
            name=name,
            company=company,
            role="Customer Support Agent",
            personality_traits=["empathetic", "patient", "solution-oriented"],
            communication_style="calm and reassuring",
            knowledge_areas=["troubleshooting", "account management", "billing"],
            prohibited_topics=["internal policies", "unreleased features"]
        )

    @classmethod
    def appointment_setter(cls, name: str, company: str) -> "AgentPersona":
        """Appointment setting agent persona."""
        return cls(
            name=name,
            company=company,
            role="Scheduling Coordinator",
            personality_traits=["efficient", "organized", "friendly"],
            communication_style="professional and concise",
            knowledge_areas=["scheduling", "services offered", "availability"]
        )


@dataclass
class AgentConfig:
    """Complete voice agent configuration."""
    name: str
    persona: AgentPersona
    voice: VoiceConfig
    transcription: TranscriptionConfig
    platform: VoicePlatform = VoicePlatform.VAPI
    llm_provider: LLMProvider = LLMProvider.OPENAI
    llm_model: str = "gpt-4o"
    direction: CallDirection = CallDirection.BOTH
    functions: List[FunctionDefinition] = field(default_factory=list)
    conversation_flow: List[ConversationStep] = field(default_factory=list)
    first_message: Optional[str] = None
    voicemail_message: Optional[str] = None
    max_call_duration: int = 600  # seconds
    silence_timeout: int = 30  # seconds
    webhook_url: Optional[str] = None
    recording_enabled: bool = True

    @classmethod
    def sales_agent(cls, name: str, company: str) -> "AgentConfig":
        """Pre-built sales agent configuration."""
        persona = AgentPersona.sales_rep(name, company)
        return cls(
            name=f"{company}-sales-agent",
            persona=persona,
            voice=VoiceConfig.elevenlabs_professional(),
            transcription=TranscriptionConfig.deepgram_default(),
            direction=CallDirection.OUTBOUND,
            first_message=f"Hi, this is {name} from {company}. Do you have a moment to chat?",
            voicemail_message=f"Hi, this is {name} from {company}. I'm calling to discuss how we can help your business. Please call us back at your convenience.",
            functions=[
                FunctionDefinition.book_appointment(""),
                FunctionDefinition.transfer_call(""),
                FunctionDefinition.end_call()
            ]
        )

    @classmethod
    def support_agent(cls, name: str, company: str) -> "AgentConfig":
        """Pre-built support agent configuration."""
        persona = AgentPersona.support_agent(name, company)
        return cls(
            name=f"{company}-support-agent",
            persona=persona,
            voice=VoiceConfig.deepgram_aura(),  # Low latency for support
            transcription=TranscriptionConfig.deepgram_default(),
            direction=CallDirection.INBOUND,
            first_message=f"Thank you for calling {company} support. My name is {name}. How can I help you today?",
            functions=[
                FunctionDefinition.transfer_call(""),
                FunctionDefinition.end_call()
            ]
        )

    @classmethod
    def appointment_agent(cls, name: str, company: str) -> "AgentConfig":
        """Pre-built appointment scheduling agent."""
        persona = AgentPersona.appointment_setter(name, company)
        return cls(
            name=f"{company}-scheduler",
            persona=persona,
            voice=VoiceConfig.elevenlabs_professional(),
            transcription=TranscriptionConfig.deepgram_default(),
            direction=CallDirection.BOTH,
            first_message=f"Hi, this is {name} from {company}. I'm calling to schedule your appointment. Is now a good time?",
            functions=[
                FunctionDefinition.book_appointment(""),
                FunctionDefinition.end_call()
            ]
        )


# ============================================================
# PLATFORM CODE GENERATORS
# ============================================================

class VapiGenerator:
    """Generate Vapi assistant configuration."""

    def __init__(self, config: AgentConfig):
        self.config = config

    def generate_assistant(self) -> Dict[str, Any]:
        """Generate Vapi assistant JSON."""
        return {
            "name": self.config.name,
            "model": {
                "provider": self.config.llm_provider.value,
                "model": self.config.llm_model,
                "messages": [
                    {
                        "role": "system",
                        "content": self.config.persona.to_system_prompt()
                    }
                ],
                "tools": [f.to_openai_function() for f in self.config.functions]
            },
            "voice": self.config.voice.to_vapi_config(),
            "transcriber": {
                "provider": self.config.transcription.provider.value.replace("_", "-"),
                "model": self.config.transcription.model,
                "language": self.config.transcription.language
            },
            "firstMessage": self.config.first_message,
            "voicemailMessage": self.config.voicemail_message,
            "endCallMessage": "Thank you for your time. Goodbye!",
            "serverUrl": self.config.webhook_url,
            "recordingEnabled": self.config.recording_enabled,
            "silenceTimeoutSeconds": self.config.silence_timeout,
            "maxDurationSeconds": self.config.max_call_duration
        }

    def generate_phone_number_config(self) -> Dict[str, Any]:
        """Generate phone number configuration."""
        return {
            "provider": "twilio",
            "assistantId": "{assistant_id}",
            "fallbackDestination": {
                "type": "number",
                "number": "+1XXXXXXXXXX"  # Fallback number
            }
        }

    def generate_outbound_call(self, to_number: str, from_number: str) -> Dict[str, Any]:
        """Generate outbound call configuration."""
        return {
            "assistantId": "{assistant_id}",
            "customer": {
                "number": to_number
            },
            "phoneNumberId": "{phone_number_id}",
            # OR direct number:
            # "phoneNumber": from_number
        }


class BlandGenerator:
    """Generate Bland.ai configuration."""

    def __init__(self, config: AgentConfig):
        self.config = config

    def generate_pathway(self) -> Dict[str, Any]:
        """Generate Bland.ai pathway."""
        nodes = []
        edges = []

        for i, step in enumerate(self.config.conversation_flow):
            nodes.append({
                "id": step.state.value,
                "type": "default",
                "data": {
                    "name": step.state.value,
                    "prompt": step.system_prompt,
                    "transfer": step.state == ConversationState.TRANSFER
                }
            })

            for intent, next_state in step.transition_rules.items():
                edges.append({
                    "id": f"{step.state.value}-{next_state.value}",
                    "source": step.state.value,
                    "target": next_state.value,
                    "label": intent.value
                })

        return {
            "name": self.config.name,
            "nodes": nodes,
            "edges": edges
        }

    def generate_call_config(self, to_number: str) -> Dict[str, Any]:
        """Generate Bland.ai call configuration."""
        return {
            "phone_number": to_number,
            "task": self.config.persona.to_system_prompt(),
            "voice": self.config.voice.voice_id,
            "first_sentence": self.config.first_message,
            "wait_for_greeting": True,
            "record": self.config.recording_enabled,
            "max_duration": self.config.max_call_duration,
            "webhook": self.config.webhook_url,
            "tools": [f.to_openai_function() for f in self.config.functions]
        }


class CustomGenerator:
    """Generate custom voice agent implementation."""

    def __init__(self, config: AgentConfig):
        self.config = config

    def generate_server(self) -> str:
        """Generate custom voice agent server."""
        return f'''#!/usr/bin/env python3
"""
{self.config.name} - Custom Voice Agent Server
Generated by VOICE.AGENT.EXE
"""

import asyncio
import json
import logging
from typing import Optional, Dict, Any

from fastapi import FastAPI, WebSocket, HTTPException
from pydantic import BaseModel
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("{self.config.name}")

app = FastAPI(title="{self.config.name}")


# ============================================================
# CONFIGURATION
# ============================================================

SYSTEM_PROMPT = """{self.config.persona.to_system_prompt()}"""

FIRST_MESSAGE = "{self.config.first_message or 'Hello! How can I help you today?'}"


# ============================================================
# TTS CLIENT
# ============================================================

class TTSClient:
    """Text-to-Speech client."""

    def __init__(self, provider: str = "{self.config.voice.provider.value}"):
        self.provider = provider
        self.voice_id = "{self.config.voice.voice_id}"

    async def synthesize(self, text: str) -> bytes:
        """Convert text to speech audio."""
        if self.provider == "elevenlabs":
            return await self._elevenlabs_synthesize(text)
        elif self.provider == "openai":
            return await self._openai_synthesize(text)
        elif self.provider == "deepgram":
            return await self._deepgram_synthesize(text)
        raise ValueError(f"Unknown TTS provider: {{self.provider}}")

    async def _elevenlabs_synthesize(self, text: str) -> bytes:
        """ElevenLabs TTS."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{{self.voice_id}}",
                headers={{
                    "xi-api-key": "{{ELEVENLABS_API_KEY}}",
                    "Content-Type": "application/json"
                }},
                json={{
                    "text": text,
                    "model_id": "eleven_turbo_v2",
                    "voice_settings": {{
                        "stability": {self.config.voice.stability},
                        "similarity_boost": {self.config.voice.similarity_boost}
                    }}
                }}
            )
            return response.content

    async def _openai_synthesize(self, text: str) -> bytes:
        """OpenAI TTS."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/speech",
                headers={{
                    "Authorization": "Bearer {{OPENAI_API_KEY}}",
                    "Content-Type": "application/json"
                }},
                json={{
                    "model": "tts-1",
                    "input": text,
                    "voice": self.voice_id
                }}
            )
            return response.content

    async def _deepgram_synthesize(self, text: str) -> bytes:
        """Deepgram Aura TTS."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.deepgram.com/v1/speak?model={{self.voice_id}}",
                headers={{
                    "Authorization": "Token {{DEEPGRAM_API_KEY}}",
                    "Content-Type": "application/json"
                }},
                json={{"text": text}}
            )
            return response.content


# ============================================================
# STT CLIENT
# ============================================================

class STTClient:
    """Speech-to-Text client."""

    def __init__(self, provider: str = "{self.config.transcription.provider.value}"):
        self.provider = provider

    async def transcribe_stream(self, websocket: WebSocket) -> str:
        """Transcribe streaming audio."""
        if self.provider == "deepgram":
            return await self._deepgram_stream(websocket)
        raise ValueError(f"Unknown STT provider: {{self.provider}}")

    async def _deepgram_stream(self, websocket: WebSocket) -> str:
        """Deepgram streaming transcription."""
        # Connect to Deepgram WebSocket
        import websockets

        dg_url = "wss://api.deepgram.com/v1/listen?model={self.config.transcription.model}&encoding=linear16&sample_rate=16000"

        async with websockets.connect(
            dg_url,
            extra_headers={{"Authorization": "Token {{DEEPGRAM_API_KEY}}"}}
        ) as dg_ws:
            # Forward audio from client to Deepgram
            async def forward_audio():
                try:
                    while True:
                        data = await websocket.receive_bytes()
                        await dg_ws.send(data)
                except Exception:
                    await dg_ws.send(json.dumps({{"type": "CloseStream"}}))

            # Receive transcriptions from Deepgram
            async def receive_transcripts():
                transcripts = []
                async for msg in dg_ws:
                    data = json.loads(msg)
                    if data.get("type") == "Results":
                        transcript = data["channel"]["alternatives"][0]["transcript"]
                        if transcript:
                            transcripts.append(transcript)
                            if data["is_final"]:
                                return " ".join(transcripts)
                return " ".join(transcripts)

            await asyncio.gather(forward_audio(), receive_transcripts())


# ============================================================
# LLM CLIENT
# ============================================================

class LLMClient:
    """LLM client for conversation."""

    def __init__(self, provider: str = "{self.config.llm_provider.value}"):
        self.provider = provider
        self.model = "{self.config.llm_model}"
        self.messages = [
            {{"role": "system", "content": SYSTEM_PROMPT}}
        ]

    async def generate_response(self, user_message: str) -> str:
        """Generate LLM response."""
        self.messages.append({{"role": "user", "content": user_message}})

        if self.provider == "openai":
            response = await self._openai_generate()
        elif self.provider == "anthropic":
            response = await self._anthropic_generate()
        else:
            raise ValueError(f"Unknown LLM provider: {{self.provider}}")

        self.messages.append({{"role": "assistant", "content": response}})
        return response

    async def _openai_generate(self) -> str:
        """OpenAI completion."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={{
                    "Authorization": "Bearer {{OPENAI_API_KEY}}",
                    "Content-Type": "application/json"
                }},
                json={{
                    "model": self.model,
                    "messages": self.messages,
                    "temperature": 0.7,
                    "max_tokens": 150  # Keep responses short for phone
                }},
                timeout=30.0
            )
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def _anthropic_generate(self) -> str:
        """Anthropic completion."""
        async with httpx.AsyncClient() as client:
            # Convert messages format
            system = self.messages[0]["content"]
            messages = self.messages[1:]

            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={{
                    "x-api-key": "{{ANTHROPIC_API_KEY}}",
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }},
                json={{
                    "model": self.model,
                    "max_tokens": 150,
                    "system": system,
                    "messages": messages
                }},
                timeout=30.0
            )
            data = response.json()
            return data["content"][0]["text"]


# ============================================================
# VOICE AGENT
# ============================================================

class VoiceAgent:
    """Main voice agent class."""

    def __init__(self):
        self.tts = TTSClient()
        self.stt = STTClient()
        self.llm = LLMClient()

    async def handle_call(self, websocket: WebSocket):
        """Handle a voice call."""
        await websocket.accept()
        logger.info("Call connected")

        try:
            # Send first message
            first_audio = await self.tts.synthesize(FIRST_MESSAGE)
            await websocket.send_bytes(first_audio)

            # Main conversation loop
            while True:
                # Listen for user speech
                user_text = await self.stt.transcribe_stream(websocket)
                logger.info(f"User said: {{user_text}}")

                if not user_text:
                    continue

                # Generate response
                response_text = await self.llm.generate_response(user_text)
                logger.info(f"Agent response: {{response_text}}")

                # Synthesize and send audio
                response_audio = await self.tts.synthesize(response_text)
                await websocket.send_bytes(response_audio)

                # Check for end conditions
                if self._should_end_call(response_text):
                    break

        except Exception as e:
            logger.error(f"Call error: {{e}}")
        finally:
            logger.info("Call ended")

    def _should_end_call(self, response: str) -> bool:
        """Check if the call should end."""
        end_phrases = ["goodbye", "have a great day", "thanks for calling"]
        return any(phrase in response.lower() for phrase in end_phrases)


# ============================================================
# API ENDPOINTS
# ============================================================

agent = VoiceAgent()


@app.websocket("/call")
async def call_endpoint(websocket: WebSocket):
    """WebSocket endpoint for voice calls."""
    await agent.handle_call(websocket)


@app.post("/outbound")
async def outbound_call(to_number: str, from_number: str):
    """Initiate an outbound call."""
    # This would integrate with Twilio/Vonage
    return {{"status": "call_initiated", "to": to_number, "from": from_number}}


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {{"status": "healthy", "agent": "{self.config.name}"}}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

    def generate_requirements(self) -> str:
        """Generate requirements.txt."""
        return """fastapi>=0.100.0
uvicorn>=0.23.0
websockets>=11.0
httpx>=0.24.0
pydantic>=2.0.0
python-dotenv>=1.0.0
"""

    def generate_env_template(self) -> str:
        """Generate .env.example."""
        return f"""# Voice Agent Configuration

# LLM Provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# TTS Provider ({self.config.voice.provider.value})
ELEVENLABS_API_KEY=...
# PLAYHT_API_KEY=...
# PLAYHT_USER_ID=...

# STT Provider ({self.config.transcription.provider.value})
DEEPGRAM_API_KEY=...
# ASSEMBLYAI_API_KEY=...

# Telephony
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Webhooks
WEBHOOK_SECRET=...
"""


# ============================================================
# REPORTER
# ============================================================

class VoiceAgentReporter:
    """Generate reports about voice agent configurations."""

    @staticmethod
    def agent_dashboard(config: AgentConfig) -> str:
        """Generate agent overview dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    VOICE AGENT - CONFIGURATION                       ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Name: {config.name:<61} ║",
            f"║  Platform: {config.platform.display_name:<57} ║",
            f"║  Direction: {config.direction.value:<56} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  PERSONA                                                             ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Name: {config.persona.name:<61} ║",
            f"║  Role: {config.persona.role:<61} ║",
            f"║  Company: {config.persona.company:<58} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  VOICE                                                               ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  TTS Provider: {config.voice.provider.display_name:<53} ║",
            f"║  Voice ID: {config.voice.voice_id:<57} ║",
            f"║  Latency: {config.voice.provider.latency_class:<58} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  TRANSCRIPTION                                                       ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  STT Provider: {config.transcription.provider.display_name:<53} ║",
            f"║  Model: {config.transcription.model:<60} ║",
            f"║  Real-time: {'Yes' if config.transcription.provider.real_time else 'No':<56} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  LLM                                                                 ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Provider: {config.llm_provider.value:<57} ║",
            f"║  Model: {config.llm_model:<60} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Functions: {len(config.functions):<56} ║"
        ]

        for func in config.functions:
            lines.append(f"║    • {func.name:<63} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def platform_comparison() -> str:
        """Generate platform comparison."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    PLATFORM COMPARISON                               ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Platform     │ Pricing        │ Key Features                        ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for platform in VoicePlatform:
            features = ", ".join(platform.features[:2])
            lines.append(f"║  {platform.display_name:<12} │ {platform.pricing_model[:14]:<14} │ {features:<35} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# ============================================================
# CLI
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="VOICE.AGENT.EXE - Build AI voice agents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a sales agent for Vapi
  python voice-agent.py create --type sales --platform vapi --name "Sarah" --company "Acme Inc"

  # Create a support agent
  python voice-agent.py create --type support --platform bland --company "TechCorp"

  # Generate custom implementation
  python voice-agent.py create --type appointment --platform custom --output ./agent

  # Compare platforms
  python voice-agent.py compare
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a voice agent")
    create_parser.add_argument("--type", choices=["sales", "support", "appointment", "custom"], required=True)
    create_parser.add_argument("--platform", choices=["vapi", "bland", "retell", "custom"], default="vapi")
    create_parser.add_argument("--name", default="Alex", help="Agent name")
    create_parser.add_argument("--company", default="Company", help="Company name")
    create_parser.add_argument("--output", "-o", default="./voice-agent", help="Output directory")

    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare platforms")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration")

    # List command
    list_parser = subparsers.add_parser("list", help="List options")
    list_parser.add_argument("--what", choices=["platforms", "voices", "stt", "llm"], default="platforms")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "create":
        # Create agent configuration
        if args.type == "sales":
            config = AgentConfig.sales_agent(args.name, args.company)
        elif args.type == "support":
            config = AgentConfig.support_agent(args.name, args.company)
        elif args.type == "appointment":
            config = AgentConfig.appointment_agent(args.name, args.company)
        else:
            # Custom - start with minimal
            persona = AgentPersona(name=args.name, company=args.company)
            config = AgentConfig(
                name=f"{args.company}-agent",
                persona=persona,
                voice=VoiceConfig.elevenlabs_professional(),
                transcription=TranscriptionConfig.deepgram_default()
            )

        config.platform = VoicePlatform(args.platform)

        # Generate output
        output_path = Path(args.output)
        output_path.mkdir(parents=True, exist_ok=True)

        if config.platform == VoicePlatform.VAPI:
            generator = VapiGenerator(config)
            assistant = generator.generate_assistant()
            (output_path / "assistant.json").write_text(json.dumps(assistant, indent=2))
            print(f"Created Vapi assistant config: {output_path}/assistant.json")

        elif config.platform == VoicePlatform.BLAND:
            generator = BlandGenerator(config)
            pathway = generator.generate_pathway()
            (output_path / "pathway.json").write_text(json.dumps(pathway, indent=2))
            print(f"Created Bland.ai pathway: {output_path}/pathway.json")

        elif config.platform == VoicePlatform.CUSTOM:
            generator = CustomGenerator(config)
            (output_path / "server.py").write_text(generator.generate_server())
            (output_path / "requirements.txt").write_text(generator.generate_requirements())
            (output_path / ".env.example").write_text(generator.generate_env_template())
            print(f"Created custom voice agent in: {output_path}/")

        print("\n" + VoiceAgentReporter.agent_dashboard(config))

    elif args.command == "compare":
        print(VoiceAgentReporter.platform_comparison())

    elif args.command == "list":
        if args.what == "platforms":
            print("\nVoice Platforms:")
            for p in VoicePlatform:
                print(f"  {p.value:<10} - {p.display_name} - {p.pricing_model}")
        elif args.what == "voices":
            print("\nTTS Providers:")
            for p in TTSProvider:
                cloning = "Cloning" if p.supports_cloning else ""
                print(f"  {p.value:<12} - {p.display_name:<15} Latency: {p.latency_class:<10} {cloning}")
        elif args.what == "stt":
            print("\nSTT Providers:")
            for p in STTProvider:
                streaming = "Streaming" if p.real_time else "Batch"
                print(f"  {p.value:<15} - {p.display_name:<20} {streaming}")
        elif args.what == "llm":
            print("\nLLM Providers:")
            for p in LLMProvider:
                models = ", ".join(p.models[:2])
                print(f"  {p.value:<12} - {models}")

    elif args.command == "demo":
        print("=" * 70)
        print("VOICE.AGENT.EXE - DEMONSTRATION")
        print("=" * 70)

        config = AgentConfig.sales_agent("Sarah", "TechFlow AI")
        print("\n" + VoiceAgentReporter.agent_dashboard(config))

        print("\n" + VoiceAgentReporter.platform_comparison())

        print("\n" + "-" * 70)
        print("SAMPLE FIRST MESSAGE:")
        print("-" * 70)
        print(config.first_message)

        print("\n" + "-" * 70)
        print("SYSTEM PROMPT (first 30 lines):")
        print("-" * 70)
        prompt = config.persona.to_system_prompt()
        for line in prompt.split("\n")[:30]:
            print(line)


if __name__ == "__main__":
    main()
```

---

## USAGE

### Quick Start

```bash
# Create a sales agent for Vapi
python voice-agent.py create --type sales --platform vapi --name "Sarah" --company "Acme"

# Create a support agent for Bland.ai
python voice-agent.py create --type support --platform bland --company "TechCorp"

# Create a custom implementation
python voice-agent.py create --type appointment --platform custom --output ./my-agent

# Compare platforms
python voice-agent.py compare
```

### Agent Types

| Type | Use Case | Direction |
|------|----------|-----------|
| `sales` | Outbound sales calls | Outbound |
| `support` | Customer support | Inbound |
| `appointment` | Scheduling calls | Both |
| `custom` | Build your own | Both |

### Platforms

| Platform | Best For | Pricing |
|----------|----------|---------|
| Vapi | Production apps | ~$0.05-0.10/min |
| Bland.ai | Batch calling | ~$0.09/min |
| Retell | Low latency | ~$0.07/min |
| Custom | Full control | Infra only |

---

## QUICK COMMANDS

```
/voice-agent sales       → Create sales agent
/voice-agent support     → Create support agent
/voice-agent appointment → Create scheduler
/voice-agent compare     → Compare platforms
```

$ARGUMENTS
