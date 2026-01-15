# PROJECT.ASHERAI.EXE - AsherAI Development Environment

You are **PROJECT.ASHERAI.EXE** — the dedicated development environment and context provider for the AsherAI intelligent assistant platform.

---

## SYSTEM CONTEXT

```python
"""
AsherAI Project Development Environment
Full-stack AI assistant platform development toolkit
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Any, Callable, Tuple
from enum import Enum, auto
from datetime import datetime, timedelta
from pathlib import Path
import json
import subprocess
import re
import hashlib
from abc import ABC, abstractmethod


# ============================================================
# ENUMS - Type-safe classifications for AsherAI development
# ============================================================

class ComponentType(Enum):
    """AsherAI system component types"""
    AI_ENGINE = "ai_engine"
    MODEL_INTEGRATION = "model_integration"
    PROMPT_MANAGER = "prompt_manager"
    RESPONSE_PROCESSOR = "response_processor"
    CONVERSATION_HANDLER = "conversation_handler"
    MEMORY_SYSTEM = "memory_system"
    CONTEXT_MANAGER = "context_manager"
    API_LAYER = "api_layer"
    REST_ENDPOINT = "rest_endpoint"
    WEBSOCKET_HANDLER = "websocket_handler"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    USER_INTERFACE = "user_interface"
    COMPONENT = "component"
    PAGE = "page"
    STATE_MANAGEMENT = "state_management"
    DATA_LAYER = "data_layer"
    DATABASE = "database"
    CACHE = "cache"
    FILE_STORAGE = "file_storage"
    PLUGIN_SYSTEM = "plugin_system"
    WEBHOOK_HANDLER = "webhook_handler"
    SCHEDULER = "scheduler"


class ModelProvider(Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    MISTRAL = "mistral"
    COHERE = "cohere"
    OLLAMA = "ollama"
    AZURE_OPENAI = "azure_openai"
    AWS_BEDROCK = "aws_bedrock"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"
    CUSTOM = "custom"


class ModelCapability(Enum):
    """Model capability flags"""
    TEXT_GENERATION = "text_generation"
    CODE_GENERATION = "code_generation"
    FUNCTION_CALLING = "function_calling"
    VISION = "vision"
    AUDIO = "audio"
    EMBEDDING = "embedding"
    REASONING = "reasoning"
    LONG_CONTEXT = "long_context"
    STREAMING = "streaming"
    FINE_TUNED = "fine_tuned"


class ConversationState(Enum):
    """Conversation lifecycle states"""
    INITIALIZED = "initialized"
    ACTIVE = "active"
    WAITING_USER = "waiting_user"
    WAITING_MODEL = "waiting_model"
    PROCESSING = "processing"
    TOOL_EXECUTION = "tool_execution"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"
    ARCHIVED = "archived"


class MemoryType(Enum):
    """Memory system types"""
    SHORT_TERM = "short_term"
    LONG_TERM = "long_term"
    EPISODIC = "episodic"
    SEMANTIC = "semantic"
    PROCEDURAL = "procedural"
    WORKING = "working"
    VECTOR_STORE = "vector_store"
    KNOWLEDGE_GRAPH = "knowledge_graph"


class PromptType(Enum):
    """Prompt template types"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    FUNCTION = "function"
    TOOL = "tool"
    FEW_SHOT = "few_shot"
    CHAIN_OF_THOUGHT = "chain_of_thought"
    TREE_OF_THOUGHT = "tree_of_thought"
    REFLECTION = "reflection"
    SUMMARIZATION = "summarization"


class APIEndpointType(Enum):
    """API endpoint classifications"""
    CHAT_COMPLETION = "chat_completion"
    STREAMING = "streaming"
    CONVERSATION = "conversation"
    MEMORY = "memory"
    CONTEXT = "context"
    MODEL_CONFIG = "model_config"
    USER_MANAGEMENT = "user_management"
    ANALYTICS = "analytics"
    WEBHOOK = "webhook"
    HEALTH = "health"


class UIComponentType(Enum):
    """Frontend component types"""
    CHAT_INTERFACE = "chat_interface"
    MESSAGE_LIST = "message_list"
    INPUT_BOX = "input_box"
    TYPING_INDICATOR = "typing_indicator"
    CODE_BLOCK = "code_block"
    FILE_UPLOAD = "file_upload"
    SETTINGS_PANEL = "settings_panel"
    MODEL_SELECTOR = "model_selector"
    HISTORY_SIDEBAR = "history_sidebar"
    SEARCH_BOX = "search_box"
    TOAST_NOTIFICATION = "toast_notification"
    MODAL = "modal"
    LOADING_SPINNER = "loading_spinner"


class BuildTarget(Enum):
    """Build and deployment targets"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    DOCKER = "docker"
    SERVERLESS = "serverless"
    EDGE = "edge"


class TestType(Enum):
    """Test categories"""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    PROMPT = "prompt"
    MODEL = "model"
    PERFORMANCE = "performance"
    SECURITY = "security"
    ACCESSIBILITY = "accessibility"


class FeatureFlag(Enum):
    """Feature toggles"""
    STREAMING_RESPONSES = "streaming_responses"
    FUNCTION_CALLING = "function_calling"
    MULTI_MODAL = "multi_modal"
    MEMORY_PERSISTENCE = "memory_persistence"
    CONVERSATION_BRANCHING = "conversation_branching"
    MODEL_FALLBACK = "model_fallback"
    RATE_LIMITING = "rate_limiting"
    ANALYTICS = "analytics"
    PLUGIN_SYSTEM = "plugin_system"
    CUSTOM_PROMPTS = "custom_prompts"


# ============================================================
# DATA CLASSES - Structured data models
# ============================================================

@dataclass
class ModelConfig:
    """LLM model configuration"""
    provider: ModelProvider
    model_id: str
    api_key_env: str
    capabilities: List[ModelCapability] = field(default_factory=list)
    max_tokens: int = 4096
    temperature: float = 0.7
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    timeout_seconds: int = 30
    retry_attempts: int = 3
    fallback_model: Optional[str] = None
    custom_endpoint: Optional[str] = None

    def to_api_params(self) -> Dict[str, Any]:
        """Convert to API request parameters"""
        return {
            "model": self.model_id,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "frequency_penalty": self.frequency_penalty,
            "presence_penalty": self.presence_penalty,
        }

    def supports(self, capability: ModelCapability) -> bool:
        """Check if model supports capability"""
        return capability in self.capabilities


@dataclass
class PromptTemplate:
    """Prompt template definition"""
    name: str
    prompt_type: PromptType
    template: str
    variables: List[str] = field(default_factory=list)
    version: str = "1.0.0"
    description: str = ""
    examples: List[Dict[str, str]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def render(self, **kwargs) -> str:
        """Render template with variables"""
        result = self.template
        for var in self.variables:
            if var in kwargs:
                result = result.replace(f"{{{var}}}", str(kwargs[var]))
        return result

    def validate_variables(self, provided: Dict[str, Any]) -> List[str]:
        """Return list of missing required variables"""
        return [v for v in self.variables if v not in provided]


@dataclass
class Message:
    """Chat message"""
    role: str
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    message_id: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    tool_results: List[Dict[str, Any]] = field(default_factory=list)

    def __post_init__(self):
        if not self.message_id:
            self.message_id = hashlib.md5(
                f"{self.role}{self.content}{self.timestamp}".encode()
            ).hexdigest()[:12]

    def to_api_format(self) -> Dict[str, Any]:
        """Convert to API message format"""
        msg = {"role": self.role, "content": self.content}
        if self.tool_calls:
            msg["tool_calls"] = self.tool_calls
        return msg


@dataclass
class Conversation:
    """Conversation session"""
    conversation_id: str
    title: str = ""
    messages: List[Message] = field(default_factory=list)
    state: ConversationState = ConversationState.INITIALIZED
    model_config: Optional[ModelConfig] = None
    system_prompt: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    parent_id: Optional[str] = None
    branch_point: Optional[int] = None

    def add_message(self, role: str, content: str) -> Message:
        """Add message to conversation"""
        msg = Message(role=role, content=content)
        self.messages.append(msg)
        self.updated_at = datetime.now()
        return msg

    def get_context_window(self, max_messages: int = 20) -> List[Message]:
        """Get recent messages for context"""
        return self.messages[-max_messages:]

    def fork(self, branch_point: int) -> 'Conversation':
        """Create branch from conversation"""
        return Conversation(
            conversation_id=hashlib.md5(
                f"{self.conversation_id}{datetime.now()}".encode()
            ).hexdigest()[:12],
            title=f"{self.title} (branch)",
            messages=self.messages[:branch_point + 1].copy(),
            model_config=self.model_config,
            system_prompt=self.system_prompt,
            parent_id=self.conversation_id,
            branch_point=branch_point,
        )

    def token_estimate(self) -> int:
        """Estimate total tokens in conversation"""
        total_chars = sum(len(m.content) for m in self.messages)
        return total_chars // 4  # Rough estimate


@dataclass
class MemoryEntry:
    """Memory system entry"""
    entry_id: str
    memory_type: MemoryType
    content: str
    embedding: Optional[List[float]] = None
    relevance_score: float = 1.0
    access_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    last_accessed: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_expired(self) -> bool:
        """Check if memory entry has expired"""
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at

    def access(self) -> None:
        """Record access to this memory"""
        self.access_count += 1
        self.last_accessed = datetime.now()


@dataclass
class ToolDefinition:
    """Tool/function definition for AI"""
    name: str
    description: str
    parameters: Dict[str, Any]
    handler: Optional[Callable] = None
    required_permissions: List[str] = field(default_factory=list)
    timeout_seconds: int = 30
    enabled: bool = True

    def to_function_schema(self) -> Dict[str, Any]:
        """Convert to OpenAI function schema"""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            }
        }


@dataclass
class APIEndpoint:
    """API endpoint definition"""
    path: str
    method: str
    endpoint_type: APIEndpointType
    handler: str
    middleware: List[str] = field(default_factory=list)
    rate_limit: Optional[int] = None
    auth_required: bool = True
    request_schema: Optional[Dict] = None
    response_schema: Optional[Dict] = None

    def get_route_key(self) -> str:
        """Get unique route identifier"""
        return f"{self.method.upper()}:{self.path}"


@dataclass
class UIComponent:
    """Frontend UI component"""
    name: str
    component_type: UIComponentType
    file_path: str
    props: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    state_hooks: List[str] = field(default_factory=list)
    tests_exist: bool = False
    storybook_exists: bool = False


@dataclass
class TestResult:
    """Test execution result"""
    test_name: str
    test_type: TestType
    passed: bool
    duration_ms: float
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    assertions: int = 0
    coverage_percent: Optional[float] = None


@dataclass
class BuildResult:
    """Build execution result"""
    target: BuildTarget
    success: bool
    duration_seconds: float
    output_path: Optional[str] = None
    bundle_size_kb: Optional[float] = None
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ProjectMetrics:
    """Project health metrics"""
    lines_of_code: int = 0
    test_coverage: float = 0.0
    api_endpoints: int = 0
    ui_components: int = 0
    prompts_defined: int = 0
    models_configured: int = 0
    memory_entries: int = 0
    open_issues: int = 0
    last_commit: Optional[datetime] = None
    build_status: Optional[str] = None


# ============================================================
# ENGINE CLASSES - Core AsherAI functionality
# ============================================================

class ArchitectureRegistry:
    """AsherAI architecture component registry"""

    # Core system architecture
    ARCHITECTURE = {
        "ai_engine": {
            "path": "src/engine",
            "components": [
                ComponentType.MODEL_INTEGRATION,
                ComponentType.PROMPT_MANAGER,
                ComponentType.RESPONSE_PROCESSOR,
                ComponentType.CONVERSATION_HANDLER,
            ],
            "description": "Core AI processing and LLM integration",
        },
        "memory_system": {
            "path": "src/memory",
            "components": [
                ComponentType.MEMORY_SYSTEM,
                ComponentType.CONTEXT_MANAGER,
            ],
            "description": "Short and long-term memory management",
        },
        "api_layer": {
            "path": "src/api",
            "components": [
                ComponentType.REST_ENDPOINT,
                ComponentType.WEBSOCKET_HANDLER,
                ComponentType.AUTHENTICATION,
                ComponentType.AUTHORIZATION,
            ],
            "description": "Backend API services",
        },
        "frontend": {
            "path": "src/web",
            "components": [
                ComponentType.USER_INTERFACE,
                ComponentType.COMPONENT,
                ComponentType.PAGE,
                ComponentType.STATE_MANAGEMENT,
            ],
            "description": "React-based user interface",
        },
        "data_layer": {
            "path": "src/data",
            "components": [
                ComponentType.DATABASE,
                ComponentType.CACHE,
                ComponentType.FILE_STORAGE,
            ],
            "description": "Data persistence and caching",
        },
        "plugins": {
            "path": "src/plugins",
            "components": [
                ComponentType.PLUGIN_SYSTEM,
                ComponentType.WEBHOOK_HANDLER,
            ],
            "description": "Extensibility and integrations",
        },
    }

    # Default model configurations
    DEFAULT_MODELS = {
        "primary": ModelConfig(
            provider=ModelProvider.ANTHROPIC,
            model_id="claude-sonnet-4-20250514",
            api_key_env="ANTHROPIC_API_KEY",
            capabilities=[
                ModelCapability.TEXT_GENERATION,
                ModelCapability.CODE_GENERATION,
                ModelCapability.FUNCTION_CALLING,
                ModelCapability.REASONING,
                ModelCapability.LONG_CONTEXT,
            ],
            max_tokens=8192,
        ),
        "fast": ModelConfig(
            provider=ModelProvider.ANTHROPIC,
            model_id="claude-3-5-haiku-20241022",
            api_key_env="ANTHROPIC_API_KEY",
            capabilities=[
                ModelCapability.TEXT_GENERATION,
                ModelCapability.CODE_GENERATION,
                ModelCapability.STREAMING,
            ],
            max_tokens=4096,
            temperature=0.5,
        ),
        "vision": ModelConfig(
            provider=ModelProvider.OPENAI,
            model_id="gpt-4o",
            api_key_env="OPENAI_API_KEY",
            capabilities=[
                ModelCapability.TEXT_GENERATION,
                ModelCapability.VISION,
                ModelCapability.FUNCTION_CALLING,
            ],
            max_tokens=4096,
        ),
        "embedding": ModelConfig(
            provider=ModelProvider.OPENAI,
            model_id="text-embedding-3-small",
            api_key_env="OPENAI_API_KEY",
            capabilities=[ModelCapability.EMBEDDING],
            max_tokens=8191,
        ),
    }

    @classmethod
    def get_component_paths(cls, component_type: ComponentType) -> List[str]:
        """Get file paths for a component type"""
        paths = []
        for layer, info in cls.ARCHITECTURE.items():
            if component_type in info["components"]:
                paths.append(info["path"])
        return paths

    @classmethod
    def get_layer_info(cls, layer_name: str) -> Optional[Dict]:
        """Get information about an architecture layer"""
        return cls.ARCHITECTURE.get(layer_name)


class ModelManager:
    """Manage LLM model configurations and selection"""

    def __init__(self):
        self.models: Dict[str, ModelConfig] = {}
        self.active_model: Optional[str] = None
        self._load_defaults()

    def _load_defaults(self) -> None:
        """Load default model configurations"""
        self.models = ArchitectureRegistry.DEFAULT_MODELS.copy()
        self.active_model = "primary"

    def add_model(self, name: str, config: ModelConfig) -> None:
        """Register a new model configuration"""
        self.models[name] = config

    def get_model(self, name: str) -> Optional[ModelConfig]:
        """Get model configuration by name"""
        return self.models.get(name)

    def select_model(self, name: str) -> bool:
        """Set active model"""
        if name in self.models:
            self.active_model = name
            return True
        return False

    def get_active(self) -> Optional[ModelConfig]:
        """Get currently active model"""
        if self.active_model:
            return self.models.get(self.active_model)
        return None

    def select_for_capability(self, capability: ModelCapability) -> Optional[ModelConfig]:
        """Find best model for a capability"""
        for name, config in self.models.items():
            if config.supports(capability):
                return config
        return None

    def list_models(self) -> List[Tuple[str, ModelConfig]]:
        """List all registered models"""
        return list(self.models.items())


class PromptManager:
    """Manage prompt templates and rendering"""

    def __init__(self):
        self.templates: Dict[str, PromptTemplate] = {}
        self._load_core_prompts()

    def _load_core_prompts(self) -> None:
        """Load core system prompts"""
        self.templates["system_default"] = PromptTemplate(
            name="system_default",
            prompt_type=PromptType.SYSTEM,
            template="""You are AsherAI, an intelligent assistant built to help users with various tasks.

Core capabilities:
- Natural language understanding and generation
- Code assistance and debugging
- Research and analysis
- Creative writing and brainstorming
- Task planning and execution

Guidelines:
- Be helpful, harmless, and honest
- Provide clear and concise responses
- Ask clarifying questions when needed
- Acknowledge limitations when appropriate""",
            variables=[],
        )

        self.templates["code_assistant"] = PromptTemplate(
            name="code_assistant",
            prompt_type=PromptType.SYSTEM,
            template="""You are AsherAI's code assistant module.

Language expertise: {languages}
Project context: {project_context}

Guidelines:
- Write clean, well-documented code
- Follow best practices for the target language
- Explain complex logic clearly
- Suggest tests for new functionality""",
            variables=["languages", "project_context"],
        )

        self.templates["summarization"] = PromptTemplate(
            name="summarization",
            prompt_type=PromptType.SUMMARIZATION,
            template="""Summarize the following conversation, preserving key information:

{conversation}

Provide a concise summary that captures:
1. Main topics discussed
2. Key decisions made
3. Action items identified
4. Important context to remember""",
            variables=["conversation"],
        )

    def add_template(self, template: PromptTemplate) -> None:
        """Register a prompt template"""
        self.templates[template.name] = template

    def get_template(self, name: str) -> Optional[PromptTemplate]:
        """Get template by name"""
        return self.templates.get(name)

    def render(self, template_name: str, **kwargs) -> Optional[str]:
        """Render a template with variables"""
        template = self.templates.get(template_name)
        if template:
            missing = template.validate_variables(kwargs)
            if missing:
                raise ValueError(f"Missing variables: {missing}")
            return template.render(**kwargs)
        return None

    def list_templates(self, prompt_type: Optional[PromptType] = None) -> List[PromptTemplate]:
        """List templates, optionally filtered by type"""
        templates = list(self.templates.values())
        if prompt_type:
            templates = [t for t in templates if t.prompt_type == prompt_type]
        return templates


class ConversationManager:
    """Manage conversation sessions"""

    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
        self.active_conversation: Optional[str] = None

    def create(self, title: str = "", system_prompt: str = "") -> Conversation:
        """Create new conversation"""
        conv_id = hashlib.md5(
            f"{title}{datetime.now()}".encode()
        ).hexdigest()[:12]

        conv = Conversation(
            conversation_id=conv_id,
            title=title or f"Conversation {len(self.conversations) + 1}",
            system_prompt=system_prompt,
        )
        self.conversations[conv_id] = conv
        self.active_conversation = conv_id
        return conv

    def get(self, conv_id: str) -> Optional[Conversation]:
        """Get conversation by ID"""
        return self.conversations.get(conv_id)

    def get_active(self) -> Optional[Conversation]:
        """Get currently active conversation"""
        if self.active_conversation:
            return self.conversations.get(self.active_conversation)
        return None

    def switch(self, conv_id: str) -> bool:
        """Switch active conversation"""
        if conv_id in self.conversations:
            self.active_conversation = conv_id
            return True
        return False

    def list_recent(self, limit: int = 10) -> List[Conversation]:
        """List recent conversations"""
        sorted_convs = sorted(
            self.conversations.values(),
            key=lambda c: c.updated_at,
            reverse=True
        )
        return sorted_convs[:limit]

    def branch(self, conv_id: str, branch_point: int) -> Optional[Conversation]:
        """Create branch from existing conversation"""
        source = self.conversations.get(conv_id)
        if source and 0 <= branch_point < len(source.messages):
            branched = source.fork(branch_point)
            self.conversations[branched.conversation_id] = branched
            return branched
        return None

    def delete(self, conv_id: str) -> bool:
        """Delete conversation"""
        if conv_id in self.conversations:
            del self.conversations[conv_id]
            if self.active_conversation == conv_id:
                self.active_conversation = None
            return True
        return False


class MemorySystem:
    """AI memory management system"""

    def __init__(self):
        self.memories: Dict[str, MemoryEntry] = {}
        self.type_index: Dict[MemoryType, Set[str]] = {
            mt: set() for mt in MemoryType
        }

    def store(self, content: str, memory_type: MemoryType,
              ttl_hours: Optional[int] = None, **metadata) -> MemoryEntry:
        """Store new memory entry"""
        entry_id = hashlib.md5(
            f"{content}{datetime.now()}".encode()
        ).hexdigest()[:12]

        expires_at = None
        if ttl_hours:
            expires_at = datetime.now() + timedelta(hours=ttl_hours)

        entry = MemoryEntry(
            entry_id=entry_id,
            memory_type=memory_type,
            content=content,
            expires_at=expires_at,
            metadata=metadata,
        )

        self.memories[entry_id] = entry
        self.type_index[memory_type].add(entry_id)
        return entry

    def retrieve(self, entry_id: str) -> Optional[MemoryEntry]:
        """Retrieve memory by ID"""
        entry = self.memories.get(entry_id)
        if entry and not entry.is_expired():
            entry.access()
            return entry
        return None

    def search_by_type(self, memory_type: MemoryType) -> List[MemoryEntry]:
        """Get all memories of a type"""
        entries = []
        for entry_id in self.type_index[memory_type]:
            entry = self.memories.get(entry_id)
            if entry and not entry.is_expired():
                entries.append(entry)
        return sorted(entries, key=lambda e: e.relevance_score, reverse=True)

    def get_context_memories(self, limit: int = 10) -> List[MemoryEntry]:
        """Get most relevant memories for context"""
        valid_entries = [
            e for e in self.memories.values()
            if not e.is_expired()
        ]
        sorted_entries = sorted(
            valid_entries,
            key=lambda e: (e.relevance_score, e.access_count),
            reverse=True
        )
        return sorted_entries[:limit]

    def cleanup_expired(self) -> int:
        """Remove expired memory entries"""
        expired_ids = [
            eid for eid, entry in self.memories.items()
            if entry.is_expired()
        ]
        for eid in expired_ids:
            entry = self.memories.pop(eid)
            self.type_index[entry.memory_type].discard(eid)
        return len(expired_ids)

    def get_stats(self) -> Dict[str, int]:
        """Get memory system statistics"""
        return {
            "total": len(self.memories),
            **{mt.value: len(ids) for mt, ids in self.type_index.items()}
        }


class ToolRegistry:
    """Manage AI tool definitions"""

    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._register_core_tools()

    def _register_core_tools(self) -> None:
        """Register core system tools"""
        self.tools["web_search"] = ToolDefinition(
            name="web_search",
            description="Search the web for information",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "num_results": {"type": "integer", "default": 5},
                },
                "required": ["query"],
            },
        )

        self.tools["code_execute"] = ToolDefinition(
            name="code_execute",
            description="Execute code in a sandboxed environment",
            parameters={
                "type": "object",
                "properties": {
                    "language": {"type": "string", "enum": ["python", "javascript"]},
                    "code": {"type": "string", "description": "Code to execute"},
                },
                "required": ["language", "code"],
            },
            required_permissions=["code_execution"],
        )

        self.tools["file_read"] = ToolDefinition(
            name="file_read",
            description="Read contents of a file",
            parameters={
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "File path"},
                },
                "required": ["path"],
            },
            required_permissions=["file_access"],
        )

    def register(self, tool: ToolDefinition) -> None:
        """Register a new tool"""
        self.tools[tool.name] = tool

    def get(self, name: str) -> Optional[ToolDefinition]:
        """Get tool by name"""
        return self.tools.get(name)

    def get_enabled(self) -> List[ToolDefinition]:
        """Get all enabled tools"""
        return [t for t in self.tools.values() if t.enabled]

    def get_schemas(self) -> List[Dict]:
        """Get function schemas for API calls"""
        return [t.to_function_schema() for t in self.get_enabled()]

    def enable(self, name: str) -> bool:
        """Enable a tool"""
        if name in self.tools:
            self.tools[name].enabled = True
            return True
        return False

    def disable(self, name: str) -> bool:
        """Disable a tool"""
        if name in self.tools:
            self.tools[name].enabled = False
            return True
        return False


class TestRunner:
    """Test execution engine"""

    def __init__(self, project_path: Path):
        self.project_path = project_path
        self.results: List[TestResult] = []

    def run_unit_tests(self) -> List[TestResult]:
        """Run unit tests"""
        results = []
        # Check for test frameworks
        if (self.project_path / "package.json").exists():
            result = self._run_npm_test()
            results.append(result)
        if (self.project_path / "pytest.ini").exists() or \
           (self.project_path / "pyproject.toml").exists():
            result = self._run_pytest()
            results.append(result)
        self.results.extend(results)
        return results

    def _run_npm_test(self) -> TestResult:
        """Run npm test"""
        start = datetime.now()
        try:
            result = subprocess.run(
                ["npm", "test", "--", "--passWithNoTests"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300,
            )
            duration = (datetime.now() - start).total_seconds() * 1000
            return TestResult(
                test_name="npm_test",
                test_type=TestType.UNIT,
                passed=result.returncode == 0,
                duration_ms=duration,
                error_message=result.stderr if result.returncode != 0 else None,
            )
        except Exception as e:
            return TestResult(
                test_name="npm_test",
                test_type=TestType.UNIT,
                passed=False,
                duration_ms=0,
                error_message=str(e),
            )

    def _run_pytest(self) -> TestResult:
        """Run pytest"""
        start = datetime.now()
        try:
            result = subprocess.run(
                ["pytest", "-v", "--tb=short"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300,
            )
            duration = (datetime.now() - start).total_seconds() * 1000
            return TestResult(
                test_name="pytest",
                test_type=TestType.UNIT,
                passed=result.returncode == 0,
                duration_ms=duration,
                error_message=result.stderr if result.returncode != 0 else None,
            )
        except Exception as e:
            return TestResult(
                test_name="pytest",
                test_type=TestType.UNIT,
                passed=False,
                duration_ms=0,
                error_message=str(e),
            )

    def run_prompt_tests(self, prompts: List[PromptTemplate]) -> List[TestResult]:
        """Validate prompt templates"""
        results = []
        for prompt in prompts:
            passed = True
            error = None

            # Check template syntax
            if "{" in prompt.template:
                for var in prompt.variables:
                    if f"{{{var}}}" not in prompt.template:
                        passed = False
                        error = f"Variable {var} declared but not used"
                        break

            results.append(TestResult(
                test_name=f"prompt_{prompt.name}",
                test_type=TestType.PROMPT,
                passed=passed,
                duration_ms=0,
                error_message=error,
            ))

        self.results.extend(results)
        return results

    def get_summary(self) -> Dict[str, Any]:
        """Get test results summary"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        return {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": (passed / total * 100) if total > 0 else 0,
            "by_type": {
                tt.value: sum(1 for r in self.results if r.test_type == tt and r.passed)
                for tt in TestType
            }
        }


class BuildEngine:
    """Build and deployment engine"""

    def __init__(self, project_path: Path):
        self.project_path = project_path
        self.results: List[BuildResult] = []

    def build(self, target: BuildTarget = BuildTarget.DEVELOPMENT) -> BuildResult:
        """Execute build for target"""
        start = datetime.now()
        errors = []
        warnings = []

        try:
            if target == BuildTarget.DEVELOPMENT:
                result = self._build_dev()
            elif target == BuildTarget.PRODUCTION:
                result = self._build_prod()
            elif target == BuildTarget.DOCKER:
                result = self._build_docker()
            else:
                result = self._build_dev()

            duration = (datetime.now() - start).total_seconds()

            build_result = BuildResult(
                target=target,
                success=result.get("success", False),
                duration_seconds=duration,
                output_path=result.get("output"),
                bundle_size_kb=result.get("size"),
                errors=result.get("errors", []),
                warnings=result.get("warnings", []),
            )

        except Exception as e:
            build_result = BuildResult(
                target=target,
                success=False,
                duration_seconds=(datetime.now() - start).total_seconds(),
                errors=[str(e)],
            )

        self.results.append(build_result)
        return build_result

    def _build_dev(self) -> Dict[str, Any]:
        """Development build"""
        if (self.project_path / "package.json").exists():
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
            )
            return {
                "success": result.returncode == 0,
                "errors": [result.stderr] if result.returncode != 0 else [],
            }
        return {"success": True}

    def _build_prod(self) -> Dict[str, Any]:
        """Production build"""
        if (self.project_path / "package.json").exists():
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                env={**dict(subprocess.os.environ), "NODE_ENV": "production"},
            )
            return {
                "success": result.returncode == 0,
                "errors": [result.stderr] if result.returncode != 0 else [],
            }
        return {"success": True}

    def _build_docker(self) -> Dict[str, Any]:
        """Docker build"""
        dockerfile = self.project_path / "Dockerfile"
        if not dockerfile.exists():
            return {"success": False, "errors": ["Dockerfile not found"]}

        result = subprocess.run(
            ["docker", "build", "-t", "asherai:latest", "."],
            cwd=self.project_path,
            capture_output=True,
            text=True,
        )
        return {
            "success": result.returncode == 0,
            "errors": [result.stderr] if result.returncode != 0 else [],
        }

    def get_last_result(self) -> Optional[BuildResult]:
        """Get most recent build result"""
        return self.results[-1] if self.results else None


class MetricsCollector:
    """Collect project metrics"""

    def __init__(self, project_path: Path):
        self.project_path = project_path

    def collect(self) -> ProjectMetrics:
        """Collect all project metrics"""
        return ProjectMetrics(
            lines_of_code=self._count_loc(),
            test_coverage=self._get_coverage(),
            api_endpoints=self._count_endpoints(),
            ui_components=self._count_components(),
            prompts_defined=self._count_prompts(),
            last_commit=self._get_last_commit(),
            build_status=self._get_build_status(),
        )

    def _count_loc(self) -> int:
        """Count lines of code"""
        total = 0
        extensions = {".py", ".ts", ".tsx", ".js", ".jsx"}
        for ext in extensions:
            for f in self.project_path.rglob(f"*{ext}"):
                if "node_modules" not in str(f) and ".git" not in str(f):
                    try:
                        total += sum(1 for _ in open(f))
                    except:
                        pass
        return total

    def _get_coverage(self) -> float:
        """Get test coverage percentage"""
        coverage_file = self.project_path / "coverage" / "coverage-summary.json"
        if coverage_file.exists():
            try:
                data = json.loads(coverage_file.read_text())
                return data.get("total", {}).get("lines", {}).get("pct", 0)
            except:
                pass
        return 0.0

    def _count_endpoints(self) -> int:
        """Count API endpoints"""
        count = 0
        api_path = self.project_path / "src" / "api"
        if api_path.exists():
            for f in api_path.rglob("*.ts"):
                try:
                    content = f.read_text()
                    count += content.count("@Get(") + content.count("@Post(")
                    count += content.count("@Put(") + content.count("@Delete(")
                    count += content.count(".get(") + content.count(".post(")
                except:
                    pass
        return count

    def _count_components(self) -> int:
        """Count UI components"""
        count = 0
        components_path = self.project_path / "src" / "components"
        if components_path.exists():
            for f in components_path.rglob("*.tsx"):
                count += 1
        return count

    def _count_prompts(self) -> int:
        """Count defined prompts"""
        count = 0
        prompts_path = self.project_path / "src" / "prompts"
        if prompts_path.exists():
            for f in prompts_path.rglob("*.ts"):
                try:
                    content = f.read_text()
                    count += content.count("PromptTemplate")
                except:
                    pass
        return count

    def _get_last_commit(self) -> Optional[datetime]:
        """Get last commit timestamp"""
        try:
            result = subprocess.run(
                ["git", "log", "-1", "--format=%ct"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                return datetime.fromtimestamp(int(result.stdout.strip()))
        except:
            pass
        return None

    def _get_build_status(self) -> Optional[str]:
        """Get CI build status"""
        # Check for common CI status files
        if (self.project_path / ".github" / "workflows").exists():
            return "github_actions"
        return None


# ============================================================
# MAIN ORCHESTRATOR
# ============================================================

class AsherAIEngine:
    """Main AsherAI project development engine"""

    def __init__(self, project_path: Optional[Path] = None):
        self.project_path = project_path or Path.cwd()
        self.model_manager = ModelManager()
        self.prompt_manager = PromptManager()
        self.conversation_manager = ConversationManager()
        self.memory_system = MemorySystem()
        self.tool_registry = ToolRegistry()
        self.metrics: Optional[ProjectMetrics] = None
        self.feature_flags: Dict[FeatureFlag, bool] = {
            ff: True for ff in FeatureFlag
        }

    def initialize(self) -> Dict[str, Any]:
        """Initialize project environment"""
        status = {
            "project_path": str(self.project_path),
            "git_status": self._check_git(),
            "dependencies": self._check_dependencies(),
            "environment": self._check_environment(),
            "models": len(self.model_manager.models),
            "prompts": len(self.prompt_manager.templates),
            "tools": len(self.tool_registry.get_enabled()),
        }
        return status

    def _check_git(self) -> Dict[str, Any]:
        """Check git repository status"""
        try:
            result = subprocess.run(
                ["git", "status", "--porcelain", "-b"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
            )
            lines = result.stdout.strip().split("\n")
            branch = lines[0].replace("## ", "").split("...")[0] if lines else "unknown"
            modified = len([l for l in lines[1:] if l.strip()])
            return {
                "branch": branch,
                "modified_files": modified,
                "clean": modified == 0,
            }
        except:
            return {"error": "Not a git repository"}

    def _check_dependencies(self) -> Dict[str, Any]:
        """Check project dependencies"""
        deps = {"npm": False, "python": False}

        if (self.project_path / "package.json").exists():
            deps["npm"] = True
            node_modules = self.project_path / "node_modules"
            deps["npm_installed"] = node_modules.exists()

        if (self.project_path / "requirements.txt").exists() or \
           (self.project_path / "pyproject.toml").exists():
            deps["python"] = True

        return deps

    def _check_environment(self) -> Dict[str, Any]:
        """Check environment variables"""
        required_vars = [
            "ANTHROPIC_API_KEY",
            "OPENAI_API_KEY",
            "DATABASE_URL",
        ]
        env_status = {}
        for var in required_vars:
            env_status[var] = var in subprocess.os.environ
        return env_status

    def collect_metrics(self) -> ProjectMetrics:
        """Collect project metrics"""
        collector = MetricsCollector(self.project_path)
        self.metrics = collector.collect()
        return self.metrics

    def run_tests(self) -> Dict[str, Any]:
        """Run all tests"""
        runner = TestRunner(self.project_path)
        runner.run_unit_tests()
        runner.run_prompt_tests(self.prompt_manager.list_templates())
        return runner.get_summary()

    def build(self, target: BuildTarget = BuildTarget.DEVELOPMENT) -> BuildResult:
        """Build project"""
        engine = BuildEngine(self.project_path)
        return engine.build(target)

    def get_architecture_summary(self) -> Dict[str, Any]:
        """Get architecture overview"""
        summary = {}
        for layer, info in ArchitectureRegistry.ARCHITECTURE.items():
            layer_path = self.project_path / info["path"]
            summary[layer] = {
                "description": info["description"],
                "path": info["path"],
                "exists": layer_path.exists(),
                "components": [c.value for c in info["components"]],
            }
        return summary

    def create_conversation(self, title: str = "") -> Conversation:
        """Create new AI conversation"""
        system_prompt = self.prompt_manager.render("system_default") or ""
        return self.conversation_manager.create(title, system_prompt)

    def set_feature_flag(self, flag: FeatureFlag, enabled: bool) -> None:
        """Set feature flag state"""
        self.feature_flags[flag] = enabled

    def get_feature_flag(self, flag: FeatureFlag) -> bool:
        """Get feature flag state"""
        return self.feature_flags.get(flag, False)


# ============================================================
# REPORTER - Status visualization
# ============================================================

class AsherAIReporter:
    """Generate AsherAI project reports"""

    COMPONENT_ICONS = {
        ComponentType.AI_ENGINE: "🧠",
        ComponentType.MODEL_INTEGRATION: "🤖",
        ComponentType.PROMPT_MANAGER: "📝",
        ComponentType.CONVERSATION_HANDLER: "💬",
        ComponentType.MEMORY_SYSTEM: "🧬",
        ComponentType.API_LAYER: "🔌",
        ComponentType.USER_INTERFACE: "🖥️",
        ComponentType.DATABASE: "💾",
        ComponentType.PLUGIN_SYSTEM: "🔧",
    }

    BUILD_ICONS = {
        BuildTarget.DEVELOPMENT: "🔨",
        BuildTarget.STAGING: "🎭",
        BuildTarget.PRODUCTION: "🚀",
        BuildTarget.DOCKER: "🐳",
    }

    TEST_ICONS = {
        TestType.UNIT: "🧪",
        TestType.INTEGRATION: "🔗",
        TestType.E2E: "🌐",
        TestType.PROMPT: "📋",
    }

    @staticmethod
    def progress_bar(value: float, max_value: float = 100, width: int = 20) -> str:
        """Generate visual progress bar"""
        filled = int((value / max_value) * width)
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}] {value:.1f}%"

    def generate_status_report(self, engine: AsherAIEngine) -> str:
        """Generate comprehensive status report"""
        status = engine.initialize()
        metrics = engine.collect_metrics()
        arch = engine.get_architecture_summary()

        report = []
        report.append("```")
        report.append("PROJECT: ASHERAI")
        report.append("═" * 55)
        report.append(f"Status: Active Development")
        report.append(f"Path: {status['project_path']}")
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        report.append("═" * 55)
        report.append("")

        # Git Status
        git = status.get("git_status", {})
        report.append("GIT STATUS")
        report.append("─" * 40)
        if "error" not in git:
            report.append(f"  Branch: {git.get('branch', 'unknown')}")
            report.append(f"  Status: {'✓ Clean' if git.get('clean') else f'⚠ {git.get(\"modified_files\", 0)} modified'}")
        else:
            report.append(f"  {git.get('error')}")
        report.append("")

        # Architecture Status
        report.append("ARCHITECTURE")
        report.append("─" * 40)
        for layer, info in arch.items():
            status_icon = "✓" if info["exists"] else "○"
            report.append(f"  {status_icon} {layer.upper()}")
            report.append(f"    └─ {info['description']}")
        report.append("")

        # AI Components
        report.append("AI COMPONENTS")
        report.append("─" * 40)
        report.append(f"  Models Configured: {status.get('models', 0)}")
        report.append(f"  Prompt Templates: {status.get('prompts', 0)}")
        report.append(f"  Tools Available: {status.get('tools', 0)}")
        report.append("")

        # Metrics
        report.append("PROJECT METRICS")
        report.append("─" * 40)
        report.append(f"  Lines of Code: {metrics.lines_of_code:,}")
        report.append(f"  Test Coverage: {self.progress_bar(metrics.test_coverage)}")
        report.append(f"  API Endpoints: {metrics.api_endpoints}")
        report.append(f"  UI Components: {metrics.ui_components}")
        report.append(f"  Prompts Defined: {metrics.prompts_defined}")
        report.append("")

        # Environment
        report.append("ENVIRONMENT")
        report.append("─" * 40)
        env = status.get("environment", {})
        for var, configured in env.items():
            icon = "✓" if configured else "✗"
            report.append(f"  {icon} {var}")
        report.append("")

        # Feature Flags
        report.append("FEATURE FLAGS")
        report.append("─" * 40)
        for flag, enabled in engine.feature_flags.items():
            icon = "●" if enabled else "○"
            report.append(f"  {icon} {flag.value}")
        report.append("")

        report.append("═" * 55)
        report.append("Ready for development assistance.")
        report.append("```")

        return "\n".join(report)

    def generate_architecture_report(self, engine: AsherAIEngine) -> str:
        """Generate architecture documentation"""
        arch = engine.get_architecture_summary()

        report = []
        report.append("```")
        report.append("ASHERAI ARCHITECTURE")
        report.append("═" * 55)
        report.append("")
        report.append("┌─────────────────────────────────────────────────────┐")
        report.append("│              ASHERAI SYSTEM ARCHITECTURE            │")
        report.append("├─────────────────────────────────────────────────────┤")
        report.append("│                                                     │")
        report.append("│  ┌─────────────┐     ┌─────────────┐               │")
        report.append("│  │   Frontend  │────▶│   API Layer │               │")
        report.append("│  │   (React)   │     │  (REST/WS)  │               │")
        report.append("│  └─────────────┘     └──────┬──────┘               │")
        report.append("│                            │                        │")
        report.append("│                     ┌──────▼──────┐                │")
        report.append("│                     │  AI Engine  │                │")
        report.append("│                     │  (LLM Core) │                │")
        report.append("│                     └──────┬──────┘                │")
        report.append("│          ┌────────────────┼────────────────┐      │")
        report.append("│          │                │                │       │")
        report.append("│   ┌──────▼─────┐  ┌──────▼──────┐  ┌──────▼─────┐│")
        report.append("│   │   Memory   │  │   Prompts   │  │   Tools    ││")
        report.append("│   │   System   │  │   Manager   │  │  Registry  ││")
        report.append("│   └────────────┘  └─────────────┘  └────────────┘│")
        report.append("│                                                   │")
        report.append("│   ┌───────────────────────────────────────────┐  │")
        report.append("│   │              DATA LAYER                    │  │")
        report.append("│   │  Database │ Cache │ File Storage │ Vectors │  │")
        report.append("│   └───────────────────────────────────────────┘  │")
        report.append("│                                                   │")
        report.append("└─────────────────────────────────────────────────────┘")
        report.append("")

        for layer, info in arch.items():
            report.append(f"■ {layer.upper()}")
            report.append(f"  Path: {info['path']}")
            report.append(f"  Status: {'Active' if info['exists'] else 'Not initialized'}")
            report.append(f"  Components: {', '.join(info['components'])}")
            report.append("")

        report.append("```")
        return "\n".join(report)

    def generate_test_report(self, results: Dict[str, Any]) -> str:
        """Generate test results report"""
        report = []
        report.append("```")
        report.append("TEST RESULTS")
        report.append("═" * 40)
        report.append(f"Total: {results['total']}")
        report.append(f"Passed: {results['passed']} ✓")
        report.append(f"Failed: {results['failed']} ✗")
        report.append(f"Pass Rate: {self.progress_bar(results['pass_rate'])}")
        report.append("")
        report.append("By Type:")
        for test_type, count in results.get("by_type", {}).items():
            icon = self.TEST_ICONS.get(TestType(test_type), "○")
            report.append(f"  {icon} {test_type}: {count}")
        report.append("```")
        return "\n".join(report)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI argument parser"""
    import argparse

    parser = argparse.ArgumentParser(
        prog="asherai",
        description="AsherAI Development Environment CLI"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show project status")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build project")
    build_parser.add_argument(
        "--target",
        choices=["dev", "staging", "prod", "docker"],
        default="dev",
        help="Build target"
    )

    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests")
    test_parser.add_argument("--type", choices=["unit", "integration", "e2e", "all"], default="all")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Deploy to environment")
    deploy_parser.add_argument("environment", choices=["staging", "production"])
    deploy_parser.add_argument("--dry-run", action="store_true")

    # Conversation command
    conv_parser = subparsers.add_parser("conversation", help="Manage conversations")
    conv_parser.add_argument("action", choices=["list", "create", "switch", "delete"])
    conv_parser.add_argument("--id", help="Conversation ID")
    conv_parser.add_argument("--title", help="Conversation title")

    # Model command
    model_parser = subparsers.add_parser("model", help="Manage models")
    model_parser.add_argument("action", choices=["list", "select", "info"])
    model_parser.add_argument("--name", help="Model name")

    # Prompt command
    prompt_parser = subparsers.add_parser("prompt", help="Manage prompts")
    prompt_parser.add_argument("action", choices=["list", "show", "test"])
    prompt_parser.add_argument("--name", help="Prompt template name")

    # Memory command
    memory_parser = subparsers.add_parser("memory", help="Memory system operations")
    memory_parser.add_argument("action", choices=["stats", "cleanup", "search"])
    memory_parser.add_argument("--type", help="Memory type filter")

    # Architecture command
    arch_parser = subparsers.add_parser("architecture", help="Show architecture")
    arch_parser.add_argument("--layer", help="Specific layer to show")

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="Show project metrics")
    metrics_parser.add_argument("--refresh", action="store_true")

    return parser


def main():
    """CLI entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = AsherAIEngine()
    reporter = AsherAIReporter()

    if args.command == "status":
        if args.json:
            import json
            print(json.dumps(engine.initialize(), indent=2))
        else:
            print(reporter.generate_status_report(engine))

    elif args.command == "build":
        target_map = {
            "dev": BuildTarget.DEVELOPMENT,
            "staging": BuildTarget.STAGING,
            "prod": BuildTarget.PRODUCTION,
            "docker": BuildTarget.DOCKER,
        }
        target = target_map[args.target]
        result = engine.build(target)
        icon = "✓" if result.success else "✗"
        print(f"{icon} Build {result.target.value}: {'Success' if result.success else 'Failed'}")
        print(f"  Duration: {result.duration_seconds:.2f}s")
        if result.errors:
            for error in result.errors:
                print(f"  Error: {error}")

    elif args.command == "test":
        results = engine.run_tests()
        print(reporter.generate_test_report(results))

    elif args.command == "architecture":
        print(reporter.generate_architecture_report(engine))

    elif args.command == "metrics":
        metrics = engine.collect_metrics()
        print(f"Lines of Code: {metrics.lines_of_code:,}")
        print(f"Test Coverage: {metrics.test_coverage:.1f}%")
        print(f"API Endpoints: {metrics.api_endpoints}")
        print(f"UI Components: {metrics.ui_components}")

    elif args.command == "model":
        if args.action == "list":
            for name, config in engine.model_manager.list_models():
                active = "●" if name == engine.model_manager.active_model else "○"
                print(f"{active} {name}: {config.provider.value}/{config.model_id}")
        elif args.action == "select" and args.name:
            if engine.model_manager.select_model(args.name):
                print(f"Selected model: {args.name}")
            else:
                print(f"Model not found: {args.name}")
        elif args.action == "info" and args.name:
            config = engine.model_manager.get_model(args.name)
            if config:
                print(f"Model: {config.model_id}")
                print(f"Provider: {config.provider.value}")
                print(f"Capabilities: {[c.value for c in config.capabilities]}")

    elif args.command == "conversation":
        if args.action == "list":
            for conv in engine.conversation_manager.list_recent():
                active = "●" if conv.conversation_id == engine.conversation_manager.active_conversation else "○"
                print(f"{active} {conv.conversation_id}: {conv.title} ({len(conv.messages)} msgs)")
        elif args.action == "create":
            conv = engine.create_conversation(args.title or "")
            print(f"Created conversation: {conv.conversation_id}")

    elif args.command == "memory":
        if args.action == "stats":
            stats = engine.memory_system.get_stats()
            print("Memory System Stats:")
            for key, value in stats.items():
                print(f"  {key}: {value}")
        elif args.action == "cleanup":
            removed = engine.memory_system.cleanup_expired()
            print(f"Removed {removed} expired entries")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

| Command | Description |
|---------|-------------|
| `/project-asherai` | Activate AsherAI project context |
| `/project-asherai status` | Show comprehensive project status |
| `/project-asherai build [--target]` | Build project for target |
| `/project-asherai test` | Run all test suites |
| `/project-asherai deploy [env]` | Deploy to environment |
| `/project-asherai architecture` | Show system architecture |
| `/project-asherai model list` | List configured models |
| `/project-asherai conversation list` | List conversations |
| `/project-asherai metrics` | Show project metrics |

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    ASHERAI ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND LAYER                                             │
│  ├── User Interface (React + TypeScript)                    │
│  │   ├── Chat Interface                                     │
│  │   ├── Settings Panel                                     │
│  │   └── History Sidebar                                    │
│  └── State Management (Zustand/Redux)                       │
│                                                             │
│  API LAYER                                                  │
│  ├── REST Endpoints (Express/Fastify)                       │
│  ├── WebSocket Handlers (Socket.io)                         │
│  ├── Authentication (JWT/OAuth)                             │
│  └── Rate Limiting                                          │
│                                                             │
│  AI ENGINE                                                  │
│  ├── Model Integration                                      │
│  │   ├── Anthropic (Claude)                                 │
│  │   ├── OpenAI (GPT-4)                                     │
│  │   └── Local (Ollama)                                     │
│  ├── Prompt Management                                      │
│  │   ├── Template System                                    │
│  │   ├── Variable Injection                                 │
│  │   └── Version Control                                    │
│  ├── Conversation Handler                                   │
│  │   ├── Session Management                                 │
│  │   ├── Context Window                                     │
│  │   └── Branching Support                                  │
│  └── Tool Registry                                          │
│      ├── Function Calling                                   │
│      └── Custom Tools                                       │
│                                                             │
│  MEMORY SYSTEM                                              │
│  ├── Short-term Memory                                      │
│  ├── Long-term Memory                                       │
│  ├── Vector Store (Embeddings)                              │
│  └── Knowledge Graph                                        │
│                                                             │
│  DATA LAYER                                                 │
│  ├── PostgreSQL (Primary)                                   │
│  ├── Redis (Cache)                                          │
│  └── S3/MinIO (File Storage)                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## DEVELOPMENT PATTERNS

### Model Configuration
```python
# Configure primary model
engine = AsherAIEngine()
config = ModelConfig(
    provider=ModelProvider.ANTHROPIC,
    model_id="claude-sonnet-4-20250514",
    api_key_env="ANTHROPIC_API_KEY",
    capabilities=[
        ModelCapability.TEXT_GENERATION,
        ModelCapability.FUNCTION_CALLING,
    ],
    max_tokens=8192,
)
engine.model_manager.add_model("custom", config)
```

### Conversation Management
```python
# Create and manage conversations
conv = engine.create_conversation("Feature Planning")
conv.add_message("user", "Let's plan the new feature")
conv.add_message("assistant", "I'll help you plan...")

# Branch conversation
branched = engine.conversation_manager.branch(
    conv.conversation_id,
    branch_point=0
)
```

### Memory System
```python
# Store contextual memory
engine.memory_system.store(
    content="User prefers detailed explanations",
    memory_type=MemoryType.LONG_TERM,
    relevance_score=0.9,
)

# Retrieve context memories
memories = engine.memory_system.get_context_memories(limit=5)
```

### Prompt Templates
```python
# Define custom prompt
template = PromptTemplate(
    name="code_review",
    prompt_type=PromptType.SYSTEM,
    template="Review this {language} code: {code}",
    variables=["language", "code"],
)
engine.prompt_manager.add_template(template)

# Render prompt
rendered = engine.prompt_manager.render(
    "code_review",
    language="Python",
    code="def hello(): pass"
)
```

$ARGUMENTS
