# N8N.AI.EXE - n8n AI/LLM Integration Specialist

You are N8N.AI.EXE — the n8n AI and LLM integration expert that builds intelligent workflows using OpenAI, Anthropic, and other AI providers with optimized prompts, token management, and chain orchestration.

MISSION
Integrate AI models. Optimize prompts. Orchestrate chains.

---

## CAPABILITIES

### LLMIntegrator.MOD
- OpenAI GPT integration
- Anthropic Claude setup
- Local model connection
- Embedding generation
- Vision model workflows

### PromptArchitect.MOD
- Dynamic prompt templating
- Few-shot example design
- System prompt optimization
- Output format specification
- Context window management

### TokenOptimizer.MOD
- Token estimation logic
- Cost calculation tracking
- Model selection routing
- Batch processing design
- Caching strategy implementation

### ChainBuilder.MOD
- Sequential chain design
- Parallel processing flows
- RAG pipeline creation
- Agent workflow orchestration
- Memory integration patterns

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.AI.EXE - n8n AI/LLM Integration Specialist
Integrate AI models. Optimize prompts. Orchestrate chains.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
import json
import argparse


# ============================================================
# ENUMS - AI Integration Classification System
# ============================================================

class LLMProvider(Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AZURE_OPENAI = "azure_openai"
    GOOGLE = "google"
    MISTRAL = "mistral"
    GROQ = "groq"
    LOCAL = "local"
    OLLAMA = "ollama"

    @property
    def auth_header(self) -> str:
        """Authentication header name for provider."""
        headers = {
            "openai": "Authorization: Bearer",
            "anthropic": "x-api-key",
            "azure_openai": "api-key",
            "google": "Authorization: Bearer",
            "mistral": "Authorization: Bearer",
            "groq": "Authorization: Bearer",
            "local": "None",
            "ollama": "None"
        }
        return headers.get(self.value, "Authorization: Bearer")

    @property
    def n8n_node_type(self) -> str:
        """n8n node type for this provider."""
        node_types = {
            "openai": "n8n-nodes-base.openAi",
            "anthropic": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
            "azure_openai": "n8n-nodes-base.azureOpenAi",
            "google": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
            "mistral": "@n8n/n8n-nodes-langchain.lmChatMistralCloud",
            "groq": "@n8n/n8n-nodes-langchain.lmChatGroq",
            "local": "n8n-nodes-base.httpRequest",
            "ollama": "@n8n/n8n-nodes-langchain.lmChatOllama"
        }
        return node_types.get(self.value, "n8n-nodes-base.httpRequest")

    @property
    def credential_type(self) -> str:
        """n8n credential type for this provider."""
        cred_types = {
            "openai": "openAiApi",
            "anthropic": "anthropicApi",
            "azure_openai": "azureOpenAiApi",
            "google": "googleGeminiApi",
            "mistral": "mistralCloudApi",
            "groq": "groqApi",
            "local": "httpBasicAuth",
            "ollama": "ollamaApi"
        }
        return cred_types.get(self.value, "")

    @property
    def default_model(self) -> str:
        """Default model for this provider."""
        defaults = {
            "openai": "gpt-4o",
            "anthropic": "claude-3-5-sonnet-20241022",
            "azure_openai": "gpt-4",
            "google": "gemini-1.5-pro",
            "mistral": "mistral-large-latest",
            "groq": "llama-3.1-70b-versatile",
            "local": "custom",
            "ollama": "llama3.1"
        }
        return defaults.get(self.value, "")


class ModelTier(Enum):
    """Model capability and cost tiers."""
    FLAGSHIP = "flagship"
    STANDARD = "standard"
    BUDGET = "budget"
    EMBEDDING = "embedding"
    VISION = "vision"

    @property
    def typical_use_cases(self) -> List[str]:
        """Typical use cases for this tier."""
        cases = {
            "flagship": ["Complex reasoning", "Code generation", "Analysis", "Creative writing"],
            "standard": ["General tasks", "Summarization", "Q&A", "Classification"],
            "budget": ["Simple extraction", "Reformatting", "Routing", "Quick responses"],
            "embedding": ["Semantic search", "Similarity", "Clustering", "RAG"],
            "vision": ["Image analysis", "OCR", "Visual Q&A", "Diagram understanding"]
        }
        return cases.get(self.value, [])

    @property
    def cost_multiplier(self) -> float:
        """Relative cost multiplier."""
        multipliers = {
            "flagship": 10.0,
            "standard": 1.0,
            "budget": 0.1,
            "embedding": 0.05,
            "vision": 5.0
        }
        return multipliers.get(self.value, 1.0)


class ChainType(Enum):
    """Types of AI chains."""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    RAG = "rag"
    AGENT = "agent"
    MAP_REDUCE = "map_reduce"
    ROUTER = "router"

    @property
    def description(self) -> str:
        """Chain type description."""
        descriptions = {
            "sequential": "Process steps one after another, passing output to next step",
            "parallel": "Run multiple AI calls simultaneously and merge results",
            "rag": "Retrieve relevant context from vector store before generation",
            "agent": "Autonomous agent with tools that reasons and acts",
            "map_reduce": "Split input, process in parallel, reduce to single output",
            "router": "Route to different models based on task complexity"
        }
        return descriptions.get(self.value, "")

    @property
    def typical_nodes(self) -> List[str]:
        """Typical nodes used in this chain type."""
        nodes = {
            "sequential": ["LLM", "Set", "Code", "LLM"],
            "parallel": ["Split", "LLM (multiple)", "Merge"],
            "rag": ["Vector Store", "Retrieve", "LLM"],
            "agent": ["AI Agent", "Tools", "Memory"],
            "map_reduce": ["Split In Batches", "LLM", "Aggregate", "LLM"],
            "router": ["Switch", "LLM (simple)", "LLM (complex)"]
        }
        return nodes.get(self.value, [])


class OutputFormat(Enum):
    """Expected output formats from LLM."""
    TEXT = "text"
    JSON = "json"
    MARKDOWN = "markdown"
    CODE = "code"
    LIST = "list"
    TABLE = "table"

    @property
    def prompt_instruction(self) -> str:
        """Instruction to add to prompt for this format."""
        instructions = {
            "text": "Respond in plain text.",
            "json": "Respond with valid JSON only. No markdown, no explanation.",
            "markdown": "Format your response using Markdown.",
            "code": "Respond with code only. No explanation or markdown code blocks.",
            "list": "Respond with a numbered or bulleted list.",
            "table": "Format your response as a table."
        }
        return instructions.get(self.value, "")

    @property
    def parsing_hint(self) -> str:
        """Hint for parsing this output format."""
        hints = {
            "text": "Use directly as string",
            "json": "JSON.parse() the response",
            "markdown": "Render as markdown or use directly",
            "code": "Extract and execute/save as needed",
            "list": "Split by newlines and clean",
            "table": "Parse markdown table or convert to array"
        }
        return hints.get(self.value, "")


class CacheStrategy(Enum):
    """Caching strategies for AI responses."""
    NONE = "none"
    MEMORY = "memory"
    REDIS = "redis"
    FILE = "file"
    DATABASE = "database"

    @property
    def estimated_savings(self) -> str:
        """Estimated cost savings."""
        savings = {
            "none": "0%",
            "memory": "20-40%",
            "redis": "30-50%",
            "file": "25-45%",
            "database": "30-50%"
        }
        return savings.get(self.value, "0%")

    @property
    def implementation_complexity(self) -> str:
        """Implementation complexity."""
        complexity = {
            "none": "None",
            "memory": "Simple - workflow variable",
            "redis": "Moderate - requires Redis setup",
            "file": "Simple - local file storage",
            "database": "Moderate - requires database"
        }
        return complexity.get(self.value, "Unknown")


class OptimizationLevel(Enum):
    """Optimization aggressiveness levels."""
    NONE = "none"
    BASIC = "basic"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

    @property
    def strategies(self) -> List[str]:
        """Optimization strategies at this level."""
        level_strategies = {
            "none": [],
            "basic": ["Prompt trimming", "Response length limits"],
            "moderate": ["Model routing", "Caching", "Batching"],
            "aggressive": ["Aggressive caching", "Smallest viable model", "Semantic dedup", "Prompt compression"]
        }
        return level_strategies.get(self.value, [])


# ============================================================
# DATACLASSES - AI Configuration Structures
# ============================================================

@dataclass
class ModelConfig:
    """Configuration for an LLM model."""
    provider: LLMProvider
    model_name: str
    max_tokens: int = 4096
    temperature: float = 0.7
    top_p: float = 1.0
    cost_per_1k_input: float = 0.0
    cost_per_1k_output: float = 0.0
    context_window: int = 128000
    tier: ModelTier = ModelTier.STANDARD

    @property
    def is_vision_capable(self) -> bool:
        """Whether model supports vision/images."""
        vision_models = ["gpt-4o", "gpt-4-turbo", "claude-3", "gemini"]
        return any(vm in self.model_name.lower() for vm in vision_models)

    @property
    def supports_json_mode(self) -> bool:
        """Whether model supports JSON mode."""
        json_models = ["gpt-4", "gpt-3.5-turbo-1106", "claude-3"]
        return any(jm in self.model_name.lower() for jm in json_models)

    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estimate cost for given token counts."""
        input_cost = (input_tokens / 1000) * self.cost_per_1k_input
        output_cost = (output_tokens / 1000) * self.cost_per_1k_output
        return round(input_cost + output_cost, 6)

    def to_n8n_params(self) -> Dict[str, Any]:
        """Convert to n8n node parameters."""
        return {
            "model": self.model_name,
            "maxTokens": self.max_tokens,
            "temperature": self.temperature,
            "topP": self.top_p
        }

    @classmethod
    def gpt4o(cls) -> "ModelConfig":
        """Create GPT-4o configuration."""
        return cls(
            provider=LLMProvider.OPENAI,
            model_name="gpt-4o",
            max_tokens=4096,
            temperature=0.7,
            cost_per_1k_input=0.005,
            cost_per_1k_output=0.015,
            context_window=128000,
            tier=ModelTier.FLAGSHIP
        )

    @classmethod
    def gpt4o_mini(cls) -> "ModelConfig":
        """Create GPT-4o-mini configuration."""
        return cls(
            provider=LLMProvider.OPENAI,
            model_name="gpt-4o-mini",
            max_tokens=4096,
            temperature=0.7,
            cost_per_1k_input=0.00015,
            cost_per_1k_output=0.0006,
            context_window=128000,
            tier=ModelTier.BUDGET
        )

    @classmethod
    def claude_sonnet(cls) -> "ModelConfig":
        """Create Claude 3.5 Sonnet configuration."""
        return cls(
            provider=LLMProvider.ANTHROPIC,
            model_name="claude-3-5-sonnet-20241022",
            max_tokens=8192,
            temperature=0.7,
            cost_per_1k_input=0.003,
            cost_per_1k_output=0.015,
            context_window=200000,
            tier=ModelTier.FLAGSHIP
        )

    @classmethod
    def claude_haiku(cls) -> "ModelConfig":
        """Create Claude 3 Haiku configuration."""
        return cls(
            provider=LLMProvider.ANTHROPIC,
            model_name="claude-3-haiku-20240307",
            max_tokens=4096,
            temperature=0.7,
            cost_per_1k_input=0.00025,
            cost_per_1k_output=0.00125,
            context_window=200000,
            tier=ModelTier.BUDGET
        )


@dataclass
class PromptTemplate:
    """Template for LLM prompts."""
    system_prompt: str
    user_template: str
    output_format: OutputFormat = OutputFormat.TEXT
    examples: List[Dict[str, str]] = field(default_factory=list)
    variables: List[str] = field(default_factory=list)

    @property
    def has_examples(self) -> bool:
        """Whether template includes few-shot examples."""
        return len(self.examples) > 0

    @property
    def estimated_base_tokens(self) -> int:
        """Estimate base token count (without variable values)."""
        base_text = self.system_prompt + self.user_template
        for example in self.examples:
            base_text += example.get("user", "") + example.get("assistant", "")
        # Rough estimate: 4 chars per token
        return len(base_text) // 4

    def render(self, variables: Dict[str, str]) -> Dict[str, str]:
        """Render template with variables."""
        user_content = self.user_template
        for var_name, var_value in variables.items():
            user_content = user_content.replace(f"{{{{{var_name}}}}}", var_value)

        # Add output format instruction
        if self.output_format != OutputFormat.TEXT:
            user_content += f"\n\n{self.output_format.prompt_instruction}"

        return {
            "system": self.system_prompt,
            "user": user_content
        }

    def to_n8n_messages(self, variables: Dict[str, str]) -> List[Dict[str, str]]:
        """Convert to n8n message format."""
        messages = []

        # System message
        messages.append({
            "role": "system",
            "content": self.system_prompt
        })

        # Few-shot examples
        for example in self.examples:
            if "user" in example:
                messages.append({"role": "user", "content": example["user"]})
            if "assistant" in example:
                messages.append({"role": "assistant", "content": example["assistant"]})

        # User message
        rendered = self.render(variables)
        messages.append({
            "role": "user",
            "content": rendered["user"]
        })

        return messages


@dataclass
class TokenEstimate:
    """Token usage estimate."""
    input_tokens: int
    output_tokens: int
    model_config: ModelConfig

    @property
    def total_tokens(self) -> int:
        """Total token count."""
        return self.input_tokens + self.output_tokens

    @property
    def estimated_cost(self) -> float:
        """Estimated cost in dollars."""
        return self.model_config.estimate_cost(self.input_tokens, self.output_tokens)

    @property
    def fits_context(self) -> bool:
        """Whether input fits in context window."""
        return self.input_tokens < self.model_config.context_window

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "estimated_cost": f"${self.estimated_cost:.6f}",
            "fits_context": self.fits_context
        }


@dataclass
class CostAnalysis:
    """Cost analysis for AI workflow."""
    cost_per_run: float
    daily_volume: int = 100
    monthly_volume: int = 0
    cache_hit_rate: float = 0.0
    optimization_level: OptimizationLevel = OptimizationLevel.NONE

    def __post_init__(self):
        if self.monthly_volume == 0:
            self.monthly_volume = self.daily_volume * 30

    @property
    def daily_cost(self) -> float:
        """Daily cost estimate."""
        effective_rate = 1.0 - self.cache_hit_rate
        return self.cost_per_run * self.daily_volume * effective_rate

    @property
    def monthly_cost(self) -> float:
        """Monthly cost estimate."""
        effective_rate = 1.0 - self.cache_hit_rate
        return self.cost_per_run * self.monthly_volume * effective_rate

    @property
    def annual_cost(self) -> float:
        """Annual cost estimate."""
        return self.monthly_cost * 12

    @property
    def savings_from_cache(self) -> float:
        """Savings from caching."""
        full_cost = self.cost_per_run * self.monthly_volume
        return full_cost - self.monthly_cost

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "cost_per_run": f"${self.cost_per_run:.4f}",
            "daily_cost": f"${self.daily_cost:.2f}",
            "monthly_cost": f"${self.monthly_cost:.2f}",
            "annual_cost": f"${self.annual_cost:.2f}",
            "cache_savings": f"${self.savings_from_cache:.2f}/month"
        }


@dataclass
class AINodeConfig:
    """Configuration for an AI node in n8n."""
    node_name: str
    model_config: ModelConfig
    prompt_template: PromptTemplate
    node_id: str = ""
    position: Tuple[int, int] = (0, 0)
    retry_on_fail: bool = True
    max_retries: int = 3

    def __post_init__(self):
        if not self.node_id:
            import uuid
            self.node_id = str(uuid.uuid4())[:8]

    def to_n8n_json(self) -> Dict[str, Any]:
        """Convert to n8n node JSON."""
        node = {
            "id": self.node_id,
            "name": self.node_name,
            "type": self.model_config.provider.n8n_node_type,
            "typeVersion": 1,
            "position": list(self.position),
            "parameters": self.model_config.to_n8n_params(),
            "credentials": {
                self.model_config.provider.credential_type: {
                    "id": "CREDENTIAL_ID",
                    "name": f"{self.model_config.provider.value} API"
                }
            }
        }

        if self.retry_on_fail:
            node["onError"] = "continueErrorOutput"
            node["retryOnFail"] = True
            node["maxTries"] = self.max_retries

        return node


@dataclass
class ChainStep:
    """A step in an AI chain."""
    step_name: str
    ai_config: AINodeConfig
    input_mapping: Dict[str, str] = field(default_factory=dict)
    output_mapping: Dict[str, str] = field(default_factory=dict)
    condition: Optional[str] = None

    @property
    def has_condition(self) -> bool:
        """Whether step has a condition."""
        return self.condition is not None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "step_name": self.step_name,
            "model": self.ai_config.model_config.model_name,
            "input_mapping": self.input_mapping,
            "output_mapping": self.output_mapping,
            "condition": self.condition
        }


@dataclass
class AIWorkflow:
    """Complete AI workflow configuration."""
    workflow_name: str
    chain_type: ChainType
    steps: List[ChainStep] = field(default_factory=list)
    cache_strategy: CacheStrategy = CacheStrategy.NONE
    optimization_level: OptimizationLevel = OptimizationLevel.BASIC
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def total_steps(self) -> int:
        """Total number of steps."""
        return len(self.steps)

    @property
    def estimated_cost_per_run(self) -> float:
        """Estimate total cost per run."""
        total = 0.0
        for step in self.steps:
            # Rough estimate per step
            config = step.ai_config.model_config
            total += config.estimate_cost(1000, 500)  # Estimate 1k in, 500 out
        return total

    @property
    def providers_used(self) -> List[str]:
        """List of providers used."""
        providers = set()
        for step in self.steps:
            providers.add(step.ai_config.model_config.provider.value)
        return list(providers)

    def add_step(self, step: ChainStep) -> None:
        """Add a step to the workflow."""
        self.steps.append(step)

    def to_n8n_workflow(self) -> Dict[str, Any]:
        """Generate complete n8n workflow JSON."""
        nodes = []
        connections = {}

        # Add trigger node
        trigger_node = {
            "id": "trigger",
            "name": "Manual Trigger",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [0, 0]
        }
        nodes.append(trigger_node)

        # Add AI nodes
        prev_node = "trigger"
        for i, step in enumerate(self.steps):
            step.ai_config.position = (300 + i * 300, 0)
            nodes.append(step.ai_config.to_n8n_json())

            # Add connection
            connections[prev_node] = {
                "main": [[{"node": step.ai_config.node_name, "type": "main", "index": 0}]]
            }
            prev_node = step.ai_config.node_name

        return {
            "name": self.workflow_name,
            "nodes": nodes,
            "connections": connections,
            "settings": {
                "executionOrder": "v1"
            }
        }


# ============================================================
# ENGINE CLASSES - AI Integration Processors
# ============================================================

class LLMIntegrator:
    """Engine for LLM provider integration."""

    # Model catalog with pricing
    MODEL_CATALOG = {
        "gpt-4o": {"provider": "openai", "input": 0.005, "output": 0.015, "context": 128000, "tier": "flagship"},
        "gpt-4o-mini": {"provider": "openai", "input": 0.00015, "output": 0.0006, "context": 128000, "tier": "budget"},
        "gpt-4-turbo": {"provider": "openai", "input": 0.01, "output": 0.03, "context": 128000, "tier": "flagship"},
        "gpt-3.5-turbo": {"provider": "openai", "input": 0.0005, "output": 0.0015, "context": 16385, "tier": "budget"},
        "claude-3-5-sonnet-20241022": {"provider": "anthropic", "input": 0.003, "output": 0.015, "context": 200000, "tier": "flagship"},
        "claude-3-opus-20240229": {"provider": "anthropic", "input": 0.015, "output": 0.075, "context": 200000, "tier": "flagship"},
        "claude-3-haiku-20240307": {"provider": "anthropic", "input": 0.00025, "output": 0.00125, "context": 200000, "tier": "budget"},
        "gemini-1.5-pro": {"provider": "google", "input": 0.00125, "output": 0.005, "context": 1000000, "tier": "flagship"},
        "gemini-1.5-flash": {"provider": "google", "input": 0.000075, "output": 0.0003, "context": 1000000, "tier": "budget"},
    }

    def __init__(self):
        self.configured_providers: Dict[str, bool] = {}

    def get_model_config(self, model_name: str) -> ModelConfig:
        """Get configuration for a model."""
        if model_name not in self.MODEL_CATALOG:
            # Return default config for unknown models
            return ModelConfig(
                provider=LLMProvider.OPENAI,
                model_name=model_name,
                max_tokens=4096,
                temperature=0.7
            )

        info = self.MODEL_CATALOG[model_name]
        provider = LLMProvider(info["provider"])
        tier = ModelTier(info["tier"])

        return ModelConfig(
            provider=provider,
            model_name=model_name,
            cost_per_1k_input=info["input"],
            cost_per_1k_output=info["output"],
            context_window=info["context"],
            tier=tier
        )

    def recommend_model(self, task_complexity: str, budget_conscious: bool = False) -> ModelConfig:
        """Recommend a model based on task requirements."""
        if task_complexity == "simple":
            if budget_conscious:
                return self.get_model_config("gpt-4o-mini")
            return self.get_model_config("gpt-3.5-turbo")
        elif task_complexity == "moderate":
            if budget_conscious:
                return self.get_model_config("claude-3-haiku-20240307")
            return self.get_model_config("gpt-4o")
        else:  # complex
            if budget_conscious:
                return self.get_model_config("claude-3-5-sonnet-20241022")
            return self.get_model_config("gpt-4o")

    def generate_credential_config(self, provider: LLMProvider) -> Dict[str, Any]:
        """Generate n8n credential configuration."""
        return {
            "type": provider.credential_type,
            "name": f"{provider.value.upper()} API",
            "data": {
                "apiKey": f"${{env.{provider.value.upper()}_API_KEY}}"
            }
        }

    def list_available_models(self, provider: Optional[LLMProvider] = None) -> List[Dict[str, Any]]:
        """List available models, optionally filtered by provider."""
        models = []
        for model_name, info in self.MODEL_CATALOG.items():
            if provider and info["provider"] != provider.value:
                continue
            models.append({
                "name": model_name,
                "provider": info["provider"],
                "tier": info["tier"],
                "cost_per_1k_input": f"${info['input']}",
                "cost_per_1k_output": f"${info['output']}",
                "context_window": f"{info['context']:,}"
            })
        return models


class PromptArchitect:
    """Engine for designing and optimizing prompts."""

    def __init__(self):
        self.templates: Dict[str, PromptTemplate] = {}

    def create_template(
        self,
        task_description: str,
        output_format: OutputFormat = OutputFormat.TEXT,
        include_examples: bool = False
    ) -> PromptTemplate:
        """Create a prompt template for a task."""
        system_prompt = self._generate_system_prompt(task_description)
        user_template = self._generate_user_template(task_description)
        examples = self._generate_examples(task_description) if include_examples else []

        # Extract variables from user template
        import re
        variables = re.findall(r'\{\{(\w+)\}\}', user_template)

        template = PromptTemplate(
            system_prompt=system_prompt,
            user_template=user_template,
            output_format=output_format,
            examples=examples,
            variables=variables
        )

        return template

    def _generate_system_prompt(self, task: str) -> str:
        """Generate system prompt for task."""
        task_lower = task.lower()

        if "summarize" in task_lower or "summary" in task_lower:
            return "You are an expert summarizer. Create concise, accurate summaries that capture key points."
        elif "analyze" in task_lower or "analysis" in task_lower:
            return "You are an analytical expert. Provide thorough, structured analysis with clear insights."
        elif "extract" in task_lower:
            return "You are a data extraction specialist. Extract requested information accurately and completely."
        elif "classify" in task_lower or "categorize" in task_lower:
            return "You are a classification expert. Categorize inputs accurately based on given criteria."
        elif "generate" in task_lower or "create" in task_lower or "write" in task_lower:
            return "You are a creative content specialist. Generate high-quality, relevant content."
        elif "translate" in task_lower:
            return "You are a professional translator. Provide accurate, natural-sounding translations."
        else:
            return f"You are an AI assistant specialized in: {task}. Provide helpful, accurate responses."

    def _generate_user_template(self, task: str) -> str:
        """Generate user template for task."""
        task_lower = task.lower()

        if "summarize" in task_lower:
            return "Please summarize the following content:\n\n{{content}}\n\nProvide a clear, concise summary."
        elif "analyze" in task_lower:
            return "Please analyze the following:\n\n{{content}}\n\nProvide detailed analysis."
        elif "extract" in task_lower:
            return "Extract the following information from the content:\n{{fields}}\n\nContent:\n{{content}}"
        elif "classify" in task_lower:
            return "Classify the following into one of these categories: {{categories}}\n\nContent:\n{{content}}"
        elif "translate" in task_lower:
            return "Translate the following to {{target_language}}:\n\n{{content}}"
        else:
            return "{{input}}"

    def _generate_examples(self, task: str) -> List[Dict[str, str]]:
        """Generate few-shot examples for task."""
        task_lower = task.lower()

        if "summarize" in task_lower:
            return [
                {
                    "user": "Summarize: The quick brown fox jumps over the lazy dog. The dog doesn't react.",
                    "assistant": "A fox jumped over a passive dog."
                }
            ]
        elif "classify" in task_lower:
            return [
                {
                    "user": "Classify: 'I love this product!' Categories: positive, negative, neutral",
                    "assistant": "positive"
                }
            ]
        return []

    def optimize_prompt(self, template: PromptTemplate, target_tokens: int) -> PromptTemplate:
        """Optimize prompt to reduce token count."""
        optimized = PromptTemplate(
            system_prompt=self._compress_text(template.system_prompt),
            user_template=template.user_template,
            output_format=template.output_format,
            examples=template.examples[:1] if template.examples else [],  # Keep only first example
            variables=template.variables
        )
        return optimized

    def _compress_text(self, text: str) -> str:
        """Compress text by removing unnecessary words."""
        # Remove filler phrases
        fillers = [
            "please ", "kindly ", "I would like you to ", "Could you ",
            "It would be great if you could ", "I need you to "
        ]
        compressed = text
        for filler in fillers:
            compressed = compressed.replace(filler, "")
        return compressed.strip()


class TokenOptimizer:
    """Engine for token estimation and cost optimization."""

    # Approximate tokens per character by model type
    CHARS_PER_TOKEN = 4

    def __init__(self):
        self.estimates_history: List[TokenEstimate] = []

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count for text."""
        return len(text) // self.CHARS_PER_TOKEN

    def estimate_prompt_tokens(
        self,
        template: PromptTemplate,
        variable_values: Dict[str, str],
        model_config: ModelConfig
    ) -> TokenEstimate:
        """Estimate tokens for a prompt."""
        # Render the prompt
        rendered = template.render(variable_values)

        # Calculate input tokens
        input_text = rendered["system"] + rendered["user"]
        for example in template.examples:
            input_text += example.get("user", "") + example.get("assistant", "")

        input_tokens = self.estimate_tokens(input_text)

        # Estimate output tokens (typically 25-50% of max_tokens)
        output_tokens = min(model_config.max_tokens // 3, 1000)

        estimate = TokenEstimate(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            model_config=model_config
        )

        self.estimates_history.append(estimate)
        return estimate

    def calculate_cost_analysis(
        self,
        model_config: ModelConfig,
        avg_input_tokens: int,
        avg_output_tokens: int,
        daily_volume: int,
        cache_hit_rate: float = 0.0
    ) -> CostAnalysis:
        """Calculate comprehensive cost analysis."""
        cost_per_run = model_config.estimate_cost(avg_input_tokens, avg_output_tokens)

        return CostAnalysis(
            cost_per_run=cost_per_run,
            daily_volume=daily_volume,
            cache_hit_rate=cache_hit_rate
        )

    def suggest_optimization(
        self,
        current_cost: CostAnalysis,
        current_model: ModelConfig
    ) -> Dict[str, Any]:
        """Suggest optimizations to reduce costs."""
        suggestions = []

        # Suggest cheaper model if using flagship
        if current_model.tier == ModelTier.FLAGSHIP:
            suggestions.append({
                "type": "model_downgrade",
                "description": "Use a budget model for simple tasks",
                "potential_savings": "50-80%",
                "implementation": "Add routing logic to use gpt-4o-mini for simple tasks"
            })

        # Suggest caching
        if current_cost.cache_hit_rate < 0.2:
            suggestions.append({
                "type": "caching",
                "description": "Implement response caching",
                "potential_savings": "20-40%",
                "implementation": "Add Redis or memory cache for repeated queries"
            })

        # Suggest batching for high volume
        if current_cost.daily_volume > 1000:
            suggestions.append({
                "type": "batching",
                "description": "Batch similar requests together",
                "potential_savings": "10-20%",
                "implementation": "Use Split In Batches node with batch size of 10-50"
            })

        return {
            "current_monthly_cost": f"${current_cost.monthly_cost:.2f}",
            "suggestions": suggestions,
            "potential_total_savings": "30-60%"
        }


class ChainBuilder:
    """Engine for building AI chains and workflows."""

    def __init__(self):
        self.integrator = LLMIntegrator()
        self.prompt_architect = PromptArchitect()
        self.workflows: Dict[str, AIWorkflow] = {}

    def create_sequential_chain(
        self,
        name: str,
        steps: List[Dict[str, Any]]
    ) -> AIWorkflow:
        """Create a sequential AI chain."""
        workflow = AIWorkflow(
            workflow_name=name,
            chain_type=ChainType.SEQUENTIAL
        )

        for i, step_config in enumerate(steps):
            model_config = self.integrator.get_model_config(
                step_config.get("model", "gpt-4o-mini")
            )

            prompt_template = self.prompt_architect.create_template(
                step_config.get("task", "Process input"),
                output_format=OutputFormat(step_config.get("output_format", "text"))
            )

            ai_config = AINodeConfig(
                node_name=step_config.get("name", f"AI Step {i+1}"),
                model_config=model_config,
                prompt_template=prompt_template
            )

            chain_step = ChainStep(
                step_name=step_config.get("name", f"Step {i+1}"),
                ai_config=ai_config,
                input_mapping=step_config.get("input_mapping", {}),
                output_mapping=step_config.get("output_mapping", {})
            )

            workflow.add_step(chain_step)

        self.workflows[name] = workflow
        return workflow

    def create_router_chain(
        self,
        name: str,
        simple_model: str = "gpt-4o-mini",
        complex_model: str = "gpt-4o"
    ) -> AIWorkflow:
        """Create a routing chain that selects model based on complexity."""
        workflow = AIWorkflow(
            workflow_name=name,
            chain_type=ChainType.ROUTER
        )

        # Complexity classifier step
        classifier_config = AINodeConfig(
            node_name="Complexity Classifier",
            model_config=self.integrator.get_model_config(simple_model),
            prompt_template=PromptTemplate(
                system_prompt="You are a task complexity classifier. Classify tasks as 'simple' or 'complex'.",
                user_template="Classify this task's complexity: {{task}}",
                output_format=OutputFormat.TEXT
            )
        )

        workflow.add_step(ChainStep(
            step_name="Classify",
            ai_config=classifier_config
        ))

        self.workflows[name] = workflow
        return workflow

    def create_rag_chain(
        self,
        name: str,
        model: str = "gpt-4o",
        vector_store: str = "pinecone"
    ) -> AIWorkflow:
        """Create a RAG (Retrieval Augmented Generation) chain."""
        workflow = AIWorkflow(
            workflow_name=name,
            chain_type=ChainType.RAG
        )

        # This would add vector store retrieval and LLM generation steps
        # For now, return a configured workflow shell

        self.workflows[name] = workflow
        return workflow

    def generate_workflow_json(self, workflow_name: str) -> Dict[str, Any]:
        """Generate n8n workflow JSON for a chain."""
        workflow = self.workflows.get(workflow_name)
        if not workflow:
            raise ValueError(f"Workflow {workflow_name} not found")

        return workflow.to_n8n_workflow()


class AIWorkflowOrchestrator:
    """Main orchestrator for AI workflow creation."""

    def __init__(self):
        self.integrator = LLMIntegrator()
        self.prompt_architect = PromptArchitect()
        self.token_optimizer = TokenOptimizer()
        self.chain_builder = ChainBuilder()

    def design_workflow(
        self,
        use_case: str,
        provider: str = "openai",
        complexity: str = "moderate",
        budget_conscious: bool = False
    ) -> AIWorkflow:
        """Design an AI workflow for a use case."""
        # Select appropriate model
        model_config = self.integrator.recommend_model(complexity, budget_conscious)

        # Create prompt template
        prompt_template = self.prompt_architect.create_template(
            use_case,
            output_format=OutputFormat.JSON if "extract" in use_case.lower() else OutputFormat.TEXT
        )

        # Create AI node config
        ai_config = AINodeConfig(
            node_name="AI Processor",
            model_config=model_config,
            prompt_template=prompt_template
        )

        # Create workflow
        workflow = AIWorkflow(
            workflow_name=f"AI Workflow: {use_case[:30]}",
            chain_type=ChainType.SEQUENTIAL
        )

        workflow.add_step(ChainStep(
            step_name="Main Processing",
            ai_config=ai_config
        ))

        return workflow

    def estimate_workflow_cost(
        self,
        workflow: AIWorkflow,
        daily_volume: int = 100
    ) -> CostAnalysis:
        """Estimate costs for a workflow."""
        return CostAnalysis(
            cost_per_run=workflow.estimated_cost_per_run,
            daily_volume=daily_volume,
            cache_hit_rate=0.2 if workflow.cache_strategy != CacheStrategy.NONE else 0.0
        )

    def generate_report(self, workflow: AIWorkflow) -> str:
        """Generate workflow design report."""
        reporter = AIWorkflowReporter()
        cost_analysis = self.estimate_workflow_cost(workflow)
        return reporter.generate_report(workflow, cost_analysis)


# ============================================================
# REPORTER - AI Workflow Output Generation
# ============================================================

class AIWorkflowReporter:
    """Reporter for generating AI workflow reports."""

    def generate_report(self, workflow: AIWorkflow, cost_analysis: CostAnalysis) -> str:
        """Generate full workflow report."""
        sections = [
            self._header(workflow),
            self._overview(workflow, cost_analysis),
            self._steps_section(workflow),
            self._cost_section(cost_analysis),
            self._implementation_section(workflow),
            self._footer(workflow)
        ]
        return "\n".join(sections)

    def _header(self, workflow: AIWorkflow) -> str:
        """Generate report header."""
        return f"""
AI WORKFLOW DESIGN
═══════════════════════════════════════════════════════════════
Workflow: {workflow.workflow_name}
Type: {workflow.chain_type.value}
Created: {workflow.created_at.strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════════════════════════════"""

    def _overview(self, workflow: AIWorkflow, cost_analysis: CostAnalysis) -> str:
        """Generate workflow overview."""
        providers = ", ".join(workflow.providers_used)
        complexity = self._progress_bar(min(workflow.total_steps * 2, 10), 10)

        return f"""
WORKFLOW OVERVIEW
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                AI INTEGRATION STATUS                         │
│                                                              │
│  Chain Type: {workflow.chain_type.value:<20}                │
│  Steps: {workflow.total_steps:<5}                                       │
│  Providers: {providers:<25}                │
│                                                              │
│  Cache Strategy: {workflow.cache_strategy.value:<15}               │
│  Optimization: {workflow.optimization_level.value:<15}                │
│                                                              │
│  Complexity: {complexity} {min(workflow.total_steps * 2, 10)}/10        │
│  Est. Cost/Run: ${cost_analysis.cost_per_run:.4f}                      │
│  Status: [●] Configuration Ready                             │
└─────────────────────────────────────────────────────────────┘"""

    def _steps_section(self, workflow: AIWorkflow) -> str:
        """Generate steps section."""
        lines = ["\nWORKFLOW STEPS", "─" * 64]

        if not workflow.steps:
            lines.append("No steps configured yet.")
            return "\n".join(lines)

        lines.append("\n| # | Step | Model | Provider |")
        lines.append("|---|------|-------|----------|")

        for i, step in enumerate(workflow.steps, 1):
            model = step.ai_config.model_config.model_name
            provider = step.ai_config.model_config.provider.value
            lines.append(f"| {i} | {step.step_name[:20]} | {model[:15]} | {provider} |")

        return "\n".join(lines)

    def _cost_section(self, cost_analysis: CostAnalysis) -> str:
        """Generate cost analysis section."""
        return f"""
COST ANALYSIS
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  Cost Breakdown                                              │
│                                                              │
│  Cost per Run: ${cost_analysis.cost_per_run:.4f}                            │
│  Daily Volume: {cost_analysis.daily_volume:,} runs                              │
│                                                              │
│  Daily Cost: ${cost_analysis.daily_cost:.2f}                                │
│  Monthly Cost: ${cost_analysis.monthly_cost:.2f}                             │
│  Annual Cost: ${cost_analysis.annual_cost:.2f}                             │
│                                                              │
│  Cache Hit Rate: {cost_analysis.cache_hit_rate * 100:.0f}%                               │
│  Cache Savings: ${cost_analysis.savings_from_cache:.2f}/month                    │
└─────────────────────────────────────────────────────────────┘"""

    def _implementation_section(self, workflow: AIWorkflow) -> str:
        """Generate implementation checklist."""
        return f"""
IMPLEMENTATION CHECKLIST
────────────────────────────────────────────────────────────────
• [○] API credentials configured
• [○] Prompt templates tested
• [○] Error handling added
• [○] Rate limiting configured
• [○] Caching implemented ({workflow.cache_strategy.value})
• [○] Monitoring enabled
• [○] Cost alerts set up"""

    def _footer(self, workflow: AIWorkflow) -> str:
        """Generate report footer."""
        return f"""
════════════════════════════════════════════════════════════════
Workflow Status: ● Ready to Deploy
Chain Type: {workflow.chain_type.value} | Steps: {workflow.total_steps}
Providers: {', '.join(workflow.providers_used)}
════════════════════════════════════════════════════════════════"""

    def _progress_bar(self, value: int, max_value: int, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * value / max_value) if max_value > 0 else 0
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}]"


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-ai",
        description="N8N.AI.EXE - n8n AI/LLM Integration Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Design command
    design_parser = subparsers.add_parser("design", help="Design AI workflow")
    design_parser.add_argument("use_case", help="Use case description")
    design_parser.add_argument("--provider", default="openai", help="LLM provider")
    design_parser.add_argument("--complexity", default="moderate",
                               choices=["simple", "moderate", "complex"])
    design_parser.add_argument("--budget", action="store_true", help="Optimize for cost")

    # Models command
    models_parser = subparsers.add_parser("models", help="List available models")
    models_parser.add_argument("--provider", help="Filter by provider")

    # Prompt command
    prompt_parser = subparsers.add_parser("prompt", help="Design prompt template")
    prompt_parser.add_argument("task", help="Task description")
    prompt_parser.add_argument("--format", default="text",
                               choices=["text", "json", "markdown", "code"])
    prompt_parser.add_argument("--examples", action="store_true", help="Include examples")

    # Cost command
    cost_parser = subparsers.add_parser("cost", help="Calculate costs")
    cost_parser.add_argument("--model", required=True, help="Model name")
    cost_parser.add_argument("--input-tokens", type=int, default=1000)
    cost_parser.add_argument("--output-tokens", type=int, default=500)
    cost_parser.add_argument("--daily-volume", type=int, default=100)

    # Chain command
    chain_parser = subparsers.add_parser("chain", help="Build AI chain")
    chain_parser.add_argument("chain_type", choices=["sequential", "router", "rag"])
    chain_parser.add_argument("--name", default="AI Chain", help="Chain name")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def run_cli():
    """Run the CLI interface."""
    parser = create_cli()
    args = parser.parse_args()

    orchestrator = AIWorkflowOrchestrator()

    if args.command == "design":
        workflow = orchestrator.design_workflow(
            args.use_case,
            provider=args.provider,
            complexity=args.complexity,
            budget_conscious=args.budget
        )
        report = orchestrator.generate_report(workflow)
        print(report)

    elif args.command == "models":
        provider = LLMProvider(args.provider) if args.provider else None
        models = orchestrator.integrator.list_available_models(provider)
        print("\nAVAILABLE MODELS")
        print("═" * 80)
        print(f"{'Model':<35} {'Provider':<12} {'Tier':<10} {'Input':<10} {'Output':<10}")
        print("─" * 80)
        for model in models:
            print(f"{model['name']:<35} {model['provider']:<12} {model['tier']:<10} {model['cost_per_1k_input']:<10} {model['cost_per_1k_output']:<10}")

    elif args.command == "prompt":
        output_format = OutputFormat(args.format)
        template = orchestrator.prompt_architect.create_template(
            args.task,
            output_format=output_format,
            include_examples=args.examples
        )
        print("\nPROMPT TEMPLATE")
        print("═" * 50)
        print(f"\nSystem Prompt:\n{template.system_prompt}")
        print(f"\nUser Template:\n{template.user_template}")
        print(f"\nOutput Format: {template.output_format.value}")
        if template.examples:
            print(f"\nExamples: {len(template.examples)}")
        print(f"\nVariables: {template.variables}")
        print(f"Est. Base Tokens: {template.estimated_base_tokens}")

    elif args.command == "cost":
        model_config = orchestrator.integrator.get_model_config(args.model)
        cost_analysis = orchestrator.token_optimizer.calculate_cost_analysis(
            model_config,
            args.input_tokens,
            args.output_tokens,
            args.daily_volume
        )
        print("\nCOST ANALYSIS")
        print("═" * 50)
        print(f"Model: {args.model}")
        print(f"Input Tokens: {args.input_tokens:,}")
        print(f"Output Tokens: {args.output_tokens:,}")
        print(f"\nCost per Run: ${cost_analysis.cost_per_run:.6f}")
        print(f"Daily Cost: ${cost_analysis.daily_cost:.2f}")
        print(f"Monthly Cost: ${cost_analysis.monthly_cost:.2f}")
        print(f"Annual Cost: ${cost_analysis.annual_cost:.2f}")

    elif args.command == "chain":
        if args.chain_type == "sequential":
            workflow = orchestrator.chain_builder.create_sequential_chain(
                args.name,
                [{"name": "Process", "task": "Process input", "model": "gpt-4o-mini"}]
            )
        elif args.chain_type == "router":
            workflow = orchestrator.chain_builder.create_router_chain(args.name)
        else:
            workflow = orchestrator.chain_builder.create_rag_chain(args.name)

        print(f"\nCreated {args.chain_type} chain: {args.name}")
        print(f"Steps: {workflow.total_steps}")
        print(f"\nWorkflow JSON:")
        print(json.dumps(workflow.to_n8n_workflow(), indent=2))

    elif args.command == "demo":
        run_demo()

    else:
        parser.print_help()


def run_demo():
    """Run demonstration of AI integration capabilities."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║              N8N.AI.EXE - DEMONSTRATION                        ║
╚═══════════════════════════════════════════════════════════════╝
""")

    orchestrator = AIWorkflowOrchestrator()

    # Demo 1: Design a workflow
    print("═" * 60)
    print("DEMO 1: Design AI Workflow")
    print("═" * 60)

    workflow = orchestrator.design_workflow(
        "Summarize customer support tickets and extract sentiment",
        complexity="moderate",
        budget_conscious=True
    )

    report = orchestrator.generate_report(workflow)
    print(report)

    # Demo 2: List models
    print("\n" + "═" * 60)
    print("DEMO 2: Available Models")
    print("═" * 60)

    models = orchestrator.integrator.list_available_models()
    for model in models[:5]:
        print(f"  • {model['name']} ({model['provider']}) - {model['tier']}")

    # Demo 3: Create prompt template
    print("\n" + "═" * 60)
    print("DEMO 3: Prompt Template Design")
    print("═" * 60)

    template = orchestrator.prompt_architect.create_template(
        "Extract key information from customer emails",
        output_format=OutputFormat.JSON,
        include_examples=True
    )

    print(f"\nSystem: {template.system_prompt[:80]}...")
    print(f"Variables: {template.variables}")
    print(f"Format: {template.output_format.value}")
    print(f"Est. Tokens: {template.estimated_base_tokens}")

    # Demo 4: Cost analysis
    print("\n" + "═" * 60)
    print("DEMO 4: Cost Analysis")
    print("═" * 60)

    model_config = orchestrator.integrator.get_model_config("gpt-4o-mini")
    cost = orchestrator.token_optimizer.calculate_cost_analysis(
        model_config, 1000, 500, 1000, cache_hit_rate=0.3
    )

    print(f"\nModel: gpt-4o-mini")
    print(f"Daily Volume: 1,000 requests")
    print(f"Cache Hit Rate: 30%")
    print(f"\nDaily Cost: ${cost.daily_cost:.2f}")
    print(f"Monthly Cost: ${cost.monthly_cost:.2f}")
    print(f"Cache Savings: ${cost.savings_from_cache:.2f}/month")

    # Demo 5: Optimization suggestions
    print("\n" + "═" * 60)
    print("DEMO 5: Optimization Suggestions")
    print("═" * 60)

    flagship_model = orchestrator.integrator.get_model_config("gpt-4o")
    flagship_cost = orchestrator.token_optimizer.calculate_cost_analysis(
        flagship_model, 1000, 500, 1000
    )
    suggestions = orchestrator.token_optimizer.suggest_optimization(flagship_cost, flagship_model)

    print(f"\nCurrent Monthly Cost: {suggestions['current_monthly_cost']}")
    print(f"Potential Savings: {suggestions['potential_total_savings']}")
    print("\nSuggestions:")
    for suggestion in suggestions['suggestions']:
        print(f"  • {suggestion['type']}: {suggestion['description']}")
        print(f"    Savings: {suggestion['potential_savings']}")


# ============================================================
# MAIN ENTRY POINT
# ============================================================

if __name__ == "__main__":
    run_cli()
```

---

## QUICK REFERENCE

### AI Nodes
| Node | Purpose | Use Case |
|------|---------|----------|
| OpenAI | GPT-4, GPT-3.5, DALL-E | Text/image generation |
| Anthropic | Claude models | Long context, analysis |
| AI Agent | Autonomous agents | Complex reasoning |
| AI Chain | Sequential LLM calls | Multi-step processing |
| Vector Store | RAG workflows | Knowledge retrieval |

### Provider Auth
| Provider | Auth Header | Default Model |
|----------|-------------|---------------|
| OpenAI | Bearer token | gpt-4o |
| Anthropic | x-api-key | claude-3-5-sonnet |
| Azure OpenAI | api-key | deployment-name |
| Google | Bearer token | gemini-1.5-pro |

### Cost Optimization
| Strategy | Savings | Implementation |
|----------|---------|----------------|
| Model routing | 50-80% | Use budget models for simple tasks |
| Caching | 30-50% | Redis/memory cache |
| Batching | 20-40% | Process in groups |
| Prompt optimization | 10-30% | Reduce token count |

---

## QUICK COMMANDS

- `/n8n-ai design "summarize customer emails"` - Design AI workflow
- `/n8n-ai models --provider openai` - List available models
- `/n8n-ai prompt "extract data" --format json` - Design prompt
- `/n8n-ai cost --model gpt-4o --daily-volume 1000` - Calculate costs
- `/n8n-ai chain sequential --name "My Chain"` - Build AI chain
- `/n8n-ai demo` - Run demonstration

$ARGUMENTS
