# Function Calling Template

> Production-ready function calling configurations for LLM tool use

## Overview

This template provides function calling configurations with:
- Tool definitions
- Execution loops
- Parallel tool calling
- Error handling
- Type-safe implementations

## Quick Start

```bash
# Install dependencies
pip install openai anthropic pydantic

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

## OpenAI Function Calling

```python
# functions/openai_functions.py
from openai import OpenAI
from typing import Callable, Any
from pydantic import BaseModel, Field
import json
import inspect


client = OpenAI()


# Define tool schemas
def create_tool_schema(func: Callable, description: str = None) -> dict:
    """Create OpenAI tool schema from a function."""
    sig = inspect.signature(func)
    type_hints = func.__annotations__

    properties = {}
    required = []

    for name, param in sig.parameters.items():
        if name == "self":
            continue

        param_type = type_hints.get(name, str)
        json_type = python_type_to_json(param_type)

        properties[name] = {
            "type": json_type,
            "description": f"Parameter {name}",
        }

        if param.default == inspect.Parameter.empty:
            required.append(name)

    return {
        "type": "function",
        "function": {
            "name": func.__name__,
            "description": description or func.__doc__ or "",
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required,
            },
        },
    }


def python_type_to_json(py_type) -> str:
    """Convert Python type to JSON schema type."""
    type_map = {
        str: "string",
        int: "integer",
        float: "number",
        bool: "boolean",
        list: "array",
        dict: "object",
    }
    return type_map.get(py_type, "string")


# Example tools
def get_weather(location: str, unit: str = "celsius") -> dict:
    """Get the current weather for a location."""
    # In production, call actual weather API
    return {
        "location": location,
        "temperature": 22,
        "unit": unit,
        "condition": "sunny",
    }


def search_web(query: str, num_results: int = 5) -> list:
    """Search the web for information."""
    # In production, call actual search API
    return [
        {"title": f"Result for {query}", "url": f"https://example.com/{i}"}
        for i in range(num_results)
    ]


def calculate(expression: str) -> float:
    """Evaluate a mathematical expression."""
    # Safe evaluation
    allowed_chars = set("0123456789+-*/().% ")
    if not all(c in allowed_chars for c in expression):
        raise ValueError("Invalid characters in expression")
    return eval(expression)


# Tool registry
TOOLS = {
    "get_weather": get_weather,
    "search_web": search_web,
    "calculate": calculate,
}

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City and country, e.g., London, UK",
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature unit",
                    },
                },
                "required": ["location"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query",
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "Number of results to return",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Evaluate a mathematical expression",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Math expression to evaluate",
                    },
                },
                "required": ["expression"],
            },
        },
    },
]


def execute_tool(name: str, arguments: dict) -> Any:
    """Execute a tool by name."""
    if name not in TOOLS:
        raise ValueError(f"Unknown tool: {name}")
    return TOOLS[name](**arguments)


def chat_with_tools(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
    max_iterations: int = 10,
) -> str:
    """Chat with automatic tool execution."""
    for _ in range(max_iterations):
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=TOOL_SCHEMAS,
            tool_choice="auto",
        )

        message = response.choices[0].message

        # Check if tools were called
        if not message.tool_calls:
            return message.content

        # Add assistant message
        messages.append(message)

        # Execute tools
        for tool_call in message.tool_calls:
            name = tool_call.function.name
            arguments = json.loads(tool_call.function.arguments)

            try:
                result = execute_tool(name, arguments)
                result_str = json.dumps(result)
            except Exception as e:
                result_str = json.dumps({"error": str(e)})

            messages.append({
                "role": "tool",
                "tool_call_id": tool_call.id,
                "content": result_str,
            })

    return "Max iterations reached"


# Usage
if __name__ == "__main__":
    result = chat_with_tools([
        {"role": "user", "content": "What's the weather in London and calculate 15% of 250?"}
    ])
    print(result)
```

## Anthropic Tool Use

```python
# functions/anthropic_tools.py
from anthropic import Anthropic
from typing import Any
import json


client = Anthropic()


# Tool definitions for Anthropic
ANTHROPIC_TOOLS = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country, e.g., London, UK",
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "Temperature unit",
                },
            },
            "required": ["location"],
        },
    },
    {
        "name": "search_database",
        "description": "Search a database for records",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query",
                },
                "table": {
                    "type": "string",
                    "description": "Table to search",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum results",
                },
            },
            "required": ["query", "table"],
        },
    },
]


# Tool implementations
def get_weather(location: str, unit: str = "celsius") -> dict:
    return {
        "location": location,
        "temperature": 22,
        "unit": unit,
        "condition": "sunny",
    }


def search_database(query: str, table: str, limit: int = 10) -> list:
    return [
        {"id": i, "name": f"Result {i}", "table": table}
        for i in range(min(limit, 5))
    ]


TOOL_FUNCTIONS = {
    "get_weather": get_weather,
    "search_database": search_database,
}


def chat_with_tools_anthropic(
    prompt: str,
    model: str = "claude-3-5-sonnet-20241022",
    system: str = None,
    max_iterations: int = 10,
) -> str:
    """Chat with Claude using tools."""
    messages = [{"role": "user", "content": prompt}]

    for _ in range(max_iterations):
        response = client.messages.create(
            model=model,
            max_tokens=4096,
            system=system or "You are a helpful assistant with access to tools.",
            tools=ANTHROPIC_TOOLS,
            messages=messages,
        )

        # Check for tool use
        tool_uses = [
            block for block in response.content
            if block.type == "tool_use"
        ]

        if not tool_uses:
            # Return text response
            text_blocks = [
                block.text for block in response.content
                if block.type == "text"
            ]
            return " ".join(text_blocks)

        # Build assistant message with all content
        messages.append({
            "role": "assistant",
            "content": response.content,
        })

        # Execute all tools and add results
        tool_results = []
        for tool_use in tool_uses:
            try:
                func = TOOL_FUNCTIONS[tool_use.name]
                result = func(**tool_use.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps(result),
                })
            except Exception as e:
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use.id,
                    "content": json.dumps({"error": str(e)}),
                    "is_error": True,
                })

        messages.append({"role": "user", "content": tool_results})

    return "Max iterations reached"
```

## Type-Safe Function Calling

```python
# functions/typed_functions.py
from pydantic import BaseModel, Field
from typing import Callable, TypeVar, Generic, get_type_hints
import inspect
import json


T = TypeVar("T", bound=BaseModel)


class Tool(Generic[T]):
    """Type-safe tool wrapper."""

    def __init__(
        self,
        func: Callable[..., T],
        name: str = None,
        description: str = None,
        input_model: type[BaseModel] = None,
    ):
        self.func = func
        self.name = name or func.__name__
        self.description = description or func.__doc__ or ""
        self.input_model = input_model or self._create_input_model()

    def _create_input_model(self) -> type[BaseModel]:
        """Create Pydantic model from function signature."""
        sig = inspect.signature(self.func)
        hints = get_type_hints(self.func)

        fields = {}
        for name, param in sig.parameters.items():
            if name == "self":
                continue

            field_type = hints.get(name, str)
            default = ... if param.default == inspect.Parameter.empty else param.default

            fields[name] = (field_type, Field(default=default))

        return type(f"{self.name}Input", (BaseModel,), {"__annotations__": {
            name: hints.get(name, str) for name in sig.parameters if name != "self"
        }})

    def schema(self) -> dict:
        """Generate OpenAI-compatible tool schema."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.input_model.model_json_schema(),
            },
        }

    def __call__(self, **kwargs) -> T:
        """Execute the tool with validation."""
        validated = self.input_model(**kwargs)
        return self.func(**validated.model_dump())


class ToolRegistry:
    """Registry for typed tools."""

    def __init__(self):
        self.tools: dict[str, Tool] = {}

    def register(
        self,
        name: str = None,
        description: str = None,
    ) -> Callable:
        """Decorator to register a tool."""
        def decorator(func: Callable) -> Tool:
            tool = Tool(func, name=name, description=description)
            self.tools[tool.name] = tool
            return tool
        return decorator

    def get_schemas(self) -> list[dict]:
        """Get all tool schemas."""
        return [tool.schema() for tool in self.tools.values()]

    def execute(self, name: str, arguments: dict) -> Any:
        """Execute a tool by name."""
        if name not in self.tools:
            raise ValueError(f"Unknown tool: {name}")
        return self.tools[name](**arguments)


# Usage
registry = ToolRegistry()


class WeatherInput(BaseModel):
    location: str = Field(description="City name")
    unit: str = Field(default="celsius", description="Temperature unit")


class WeatherOutput(BaseModel):
    location: str
    temperature: float
    unit: str
    condition: str


@registry.register(description="Get current weather for a location")
def get_weather(location: str, unit: str = "celsius") -> WeatherOutput:
    """Get weather data."""
    return WeatherOutput(
        location=location,
        temperature=22.5,
        unit=unit,
        condition="sunny",
    )


class CalculateInput(BaseModel):
    expression: str = Field(description="Mathematical expression")


@registry.register(description="Evaluate a mathematical expression")
def calculate(expression: str) -> float:
    """Calculate math expression."""
    allowed = set("0123456789+-*/().% ")
    if not all(c in allowed for c in expression):
        raise ValueError("Invalid expression")
    return eval(expression)
```

## Parallel Tool Execution

```python
# functions/parallel_tools.py
from openai import OpenAI
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Any


client = OpenAI()


class ParallelToolExecutor:
    """Execute tools in parallel."""

    def __init__(self, tools: dict[str, Callable], max_workers: int = 5):
        self.tools = tools
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    def execute_parallel(
        self,
        tool_calls: list[dict],
    ) -> list[dict]:
        """Execute multiple tool calls in parallel."""
        futures = []

        for call in tool_calls:
            name = call["name"]
            arguments = call["arguments"]
            tool_call_id = call["id"]

            if name in self.tools:
                future = self.executor.submit(
                    self._execute_single,
                    name,
                    arguments,
                    tool_call_id,
                )
                futures.append(future)

        return [f.result() for f in futures]

    def _execute_single(
        self,
        name: str,
        arguments: dict,
        tool_call_id: str,
    ) -> dict:
        """Execute a single tool."""
        try:
            result = self.tools[name](**arguments)
            return {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": json.dumps(result),
            }
        except Exception as e:
            return {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": json.dumps({"error": str(e)}),
            }


# Async version
class AsyncToolExecutor:
    """Execute tools asynchronously."""

    def __init__(self, tools: dict[str, Callable]):
        self.tools = tools

    async def execute_parallel(
        self,
        tool_calls: list[dict],
    ) -> list[dict]:
        """Execute tools in parallel using asyncio."""
        tasks = [
            self._execute_single(call)
            for call in tool_calls
        ]
        return await asyncio.gather(*tasks)

    async def _execute_single(self, call: dict) -> dict:
        """Execute a single tool."""
        name = call["name"]
        arguments = call["arguments"]
        tool_call_id = call["id"]

        try:
            func = self.tools[name]
            if asyncio.iscoroutinefunction(func):
                result = await func(**arguments)
            else:
                result = await asyncio.to_thread(func, **arguments)

            return {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": json.dumps(result),
            }
        except Exception as e:
            return {
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": json.dumps({"error": str(e)}),
            }


# Usage with chat
async def chat_with_parallel_tools(
    messages: list[dict],
    tools: dict[str, Callable],
    tool_schemas: list[dict],
    model: str = "gpt-4-turbo-preview",
) -> str:
    """Chat with parallel tool execution."""
    executor = AsyncToolExecutor(tools)

    while True:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tool_schemas,
        )

        message = response.choices[0].message

        if not message.tool_calls:
            return message.content

        messages.append(message)

        # Prepare tool calls for parallel execution
        calls = [
            {
                "id": tc.id,
                "name": tc.function.name,
                "arguments": json.loads(tc.function.arguments),
            }
            for tc in message.tool_calls
        ]

        # Execute in parallel
        results = await executor.execute_parallel(calls)
        messages.extend(results)
```

## Error Handling

```python
# functions/error_handling.py
from typing import Any
from pydantic import BaseModel, ValidationError
import json
import logging

logger = logging.getLogger(__name__)


class ToolError(Exception):
    """Base exception for tool errors."""
    pass


class ToolNotFoundError(ToolError):
    """Tool not found."""
    pass


class ToolExecutionError(ToolError):
    """Tool execution failed."""
    pass


class ToolValidationError(ToolError):
    """Tool input validation failed."""
    pass


class SafeToolExecutor:
    """Execute tools with comprehensive error handling."""

    def __init__(self, tools: dict, retry_count: int = 2):
        self.tools = tools
        self.retry_count = retry_count

    def execute(
        self,
        name: str,
        arguments: dict,
        tool_call_id: str,
    ) -> dict:
        """Execute tool with error handling."""
        if name not in self.tools:
            logger.error(f"Tool not found: {name}")
            return self._error_response(
                tool_call_id,
                f"Tool '{name}' not found. Available tools: {list(self.tools.keys())}",
            )

        for attempt in range(self.retry_count + 1):
            try:
                result = self.tools[name](**arguments)
                return self._success_response(tool_call_id, result)

            except ValidationError as e:
                logger.warning(f"Validation error for {name}: {e}")
                return self._error_response(
                    tool_call_id,
                    f"Invalid arguments: {e.errors()}",
                )

            except Exception as e:
                logger.error(f"Error executing {name} (attempt {attempt + 1}): {e}")
                if attempt < self.retry_count:
                    continue
                return self._error_response(
                    tool_call_id,
                    f"Execution failed after {self.retry_count + 1} attempts: {str(e)}",
                )

    def _success_response(self, tool_call_id: str, result: Any) -> dict:
        """Format successful response."""
        return {
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": json.dumps({"success": True, "result": result}),
        }

    def _error_response(self, tool_call_id: str, error: str) -> dict:
        """Format error response."""
        return {
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": json.dumps({"success": False, "error": error}),
        }
```

## CLAUDE.md Integration

```markdown
# Function Calling

## Providers
- **OpenAI** - tools parameter with JSON schema
- **Anthropic** - tool_use with input_schema

## Best Practices
- Define clear tool descriptions
- Validate inputs with Pydantic
- Handle errors gracefully
- Execute tools in parallel when possible
- Implement retry logic

## Tool Design
- Keep tools focused and single-purpose
- Use descriptive parameter names
- Provide helpful error messages
- Document expected inputs/outputs
```

## AI Suggestions

1. **Define clear schemas** - Detailed descriptions
2. **Validate inputs** - Pydantic models
3. **Handle errors** - Graceful failure
4. **Execute in parallel** - Concurrent tools
5. **Implement retries** - Handle transient failures
6. **Log tool calls** - Debugging and monitoring
7. **Rate limit tools** - Protect external APIs
8. **Cache results** - Avoid redundant calls
9. **Timeout handling** - Prevent hangs
10. **Test tools** - Unit and integration tests
