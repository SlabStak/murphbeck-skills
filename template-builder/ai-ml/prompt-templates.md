# Prompt Engineering Templates

> Production-ready prompt templates and engineering patterns for LLM applications

## Overview

This template provides prompt engineering configurations with:
- Structured prompt templates
- System prompt patterns
- Output formatting
- Chain-of-thought prompting
- Few-shot learning

## Quick Start

```python
# Install dependencies
pip install jinja2 pydantic

# Basic prompt template
from string import Template

template = Template("Translate '$text' to $language")
prompt = template.substitute(text="Hello", language="Spanish")
```

## Prompt Templates Library

```python
# prompts/templates.py
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import json


class PromptRole(Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class Message:
    role: PromptRole
    content: str


class PromptTemplate:
    """Flexible prompt template with variable substitution."""

    def __init__(self, template: str, variables: List[str] = None):
        self.template = template
        self.variables = variables or self._extract_variables()

    def _extract_variables(self) -> List[str]:
        """Extract {variable} placeholders from template."""
        import re
        return re.findall(r'\{(\w+)\}', self.template)

    def format(self, **kwargs) -> str:
        """Format template with provided variables."""
        missing = set(self.variables) - set(kwargs.keys())
        if missing:
            raise ValueError(f"Missing variables: {missing}")
        return self.template.format(**kwargs)

    def partial(self, **kwargs) -> 'PromptTemplate':
        """Create partial template with some variables filled."""
        new_template = self.template.format(**{
            k: v if k in kwargs else f'{{{k}}}'
            for k, v in {v: f'{{{v}}}' for v in self.variables}.items()
        })
        for k, v in kwargs.items():
            new_template = new_template.replace(f'{{{k}}}', str(v))
        return PromptTemplate(new_template)


# System prompts
SYSTEM_PROMPTS = {
    "assistant": """You are a helpful AI assistant. Provide accurate, relevant information.
Be concise but thorough. Ask clarifying questions when needed.""",

    "coder": """You are an expert software engineer. Write clean, efficient, well-documented code.
Follow best practices and design patterns. Explain your reasoning.
Always consider edge cases and error handling.""",

    "analyst": """You are a data analyst. Analyze information carefully and provide clear insights.
Use structured formats for presenting findings. Support conclusions with evidence.
Identify patterns, anomalies, and actionable recommendations.""",

    "writer": """You are a professional writer. Create clear, engaging content.
Adapt your tone and style to the audience. Use proper grammar and structure.
Be creative while maintaining accuracy.""",

    "tutor": """You are a patient and knowledgeable tutor. Explain concepts clearly.
Break down complex topics into understandable parts. Use examples and analogies.
Encourage questions and provide positive feedback.""",

    "reviewer": """You are a thorough code reviewer. Identify issues, suggest improvements.
Focus on: correctness, performance, security, maintainability, and readability.
Provide specific, actionable feedback with examples.""",
}


# Task-specific templates
TASK_TEMPLATES = {
    "summarize": PromptTemplate("""Summarize the following text in {length} sentences.
Focus on the main points and key takeaways.

Text:
{text}

Summary:"""),

    "translate": PromptTemplate("""Translate the following text from {source_lang} to {target_lang}.
Maintain the original meaning and tone.

Text:
{text}

Translation:"""),

    "explain": PromptTemplate("""Explain {topic} as if explaining to a {audience}.
Use simple language and relevant examples.

Explanation:"""),

    "analyze": PromptTemplate("""Analyze the following {content_type}:

{content}

Provide:
1. Key findings
2. Patterns or trends
3. Potential issues
4. Recommendations

Analysis:"""),

    "code_review": PromptTemplate("""Review the following {language} code:

```{language}
{code}
```

Analyze for:
- Correctness
- Performance
- Security
- Best practices
- Code style

Review:"""),

    "generate_tests": PromptTemplate("""Generate unit tests for the following {language} function:

```{language}
{code}
```

Test framework: {framework}
Include: edge cases, error cases, and typical use cases.

Tests:"""),

    "refactor": PromptTemplate("""Refactor the following {language} code to improve {goal}:

```{language}
{code}
```

Requirements:
- Maintain existing functionality
- Explain changes made
- Consider backward compatibility

Refactored code:"""),

    "document": PromptTemplate("""Generate documentation for the following {language} code:

```{language}
{code}
```

Include:
- Description
- Parameters
- Return values
- Examples
- Exceptions

Documentation:"""),
}


# Chain-of-thought templates
COT_TEMPLATES = {
    "reasoning": PromptTemplate("""Let's solve this step by step.

Problem: {problem}

Step 1: Understand the problem
Step 2: Identify relevant information
Step 3: Develop a solution approach
Step 4: Execute the solution
Step 5: Verify the result

Solution:"""),

    "math": PromptTemplate("""Solve this math problem step by step, showing all work.

Problem: {problem}

Let me work through this:
1. First, I'll identify what we're solving for...
2. Next, I'll set up the equation...
3. Then, I'll solve step by step...
4. Finally, I'll verify my answer...

Solution:"""),

    "debugging": PromptTemplate("""Debug this code systematically.

Code:
```{language}
{code}
```

Error/Issue: {error}

Debugging process:
1. Understand the expected behavior
2. Identify where the error occurs
3. Analyze potential causes
4. Propose and test fixes
5. Verify the solution

Analysis:"""),
}


# Few-shot templates
class FewShotTemplate:
    """Template with example demonstrations."""

    def __init__(
        self,
        instruction: str,
        examples: List[Dict[str, str]],
        input_key: str = "input",
        output_key: str = "output",
    ):
        self.instruction = instruction
        self.examples = examples
        self.input_key = input_key
        self.output_key = output_key

    def format(self, **kwargs) -> str:
        """Format template with examples and input."""
        parts = [self.instruction, "\n\nExamples:\n"]

        for i, example in enumerate(self.examples, 1):
            parts.append(f"\nExample {i}:")
            parts.append(f"Input: {example[self.input_key]}")
            parts.append(f"Output: {example[self.output_key]}\n")

        parts.append("\nNow, process this:")
        parts.append(f"Input: {kwargs.get(self.input_key, '')}")
        parts.append("Output:")

        return "\n".join(parts)


# Example few-shot templates
SENTIMENT_FEW_SHOT = FewShotTemplate(
    instruction="Classify the sentiment of the text as positive, negative, or neutral.",
    examples=[
        {"input": "I love this product!", "output": "positive"},
        {"input": "This is terrible.", "output": "negative"},
        {"input": "It's okay, nothing special.", "output": "neutral"},
    ],
)

ENTITY_FEW_SHOT = FewShotTemplate(
    instruction="Extract named entities (person, organization, location) from the text.",
    examples=[
        {
            "input": "John works at Google in New York.",
            "output": '{"persons": ["John"], "organizations": ["Google"], "locations": ["New York"]}',
        },
        {
            "input": "Apple announced a new iPhone at their Cupertino headquarters.",
            "output": '{"persons": [], "organizations": ["Apple"], "locations": ["Cupertino"]}',
        },
    ],
)


# Output format templates
OUTPUT_FORMATS = {
    "json": """Respond in valid JSON format matching this schema:
{schema}

Response:""",

    "markdown": """Format your response in Markdown with:
- Headers for sections
- Bullet points for lists
- Code blocks for code
- Bold for emphasis

Response:""",

    "structured": """Provide your response in this exact format:

## Summary
[Brief summary]

## Key Points
- Point 1
- Point 2
- Point 3

## Details
[Detailed explanation]

## Recommendations
1. First recommendation
2. Second recommendation

Response:""",

    "table": """Present the information in a table format:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data     | Data     | Data     |

Response:""",
}


def build_prompt(
    system: str = None,
    task_template: str = None,
    output_format: str = None,
    examples: List[Dict] = None,
    **kwargs,
) -> List[Message]:
    """Build a complete prompt with all components."""
    messages = []

    # System message
    if system:
        system_content = SYSTEM_PROMPTS.get(system, system)
        messages.append(Message(PromptRole.SYSTEM, system_content))

    # User message
    user_content_parts = []

    # Task template
    if task_template:
        template = TASK_TEMPLATES.get(task_template)
        if template:
            user_content_parts.append(template.format(**kwargs))
        else:
            user_content_parts.append(task_template.format(**kwargs))

    # Examples
    if examples:
        user_content_parts.append("\n\nExamples:")
        for i, ex in enumerate(examples, 1):
            user_content_parts.append(f"\nExample {i}:")
            for k, v in ex.items():
                user_content_parts.append(f"{k}: {v}")

    # Output format
    if output_format:
        format_instruction = OUTPUT_FORMATS.get(output_format, output_format)
        user_content_parts.append(f"\n\n{format_instruction}")

    if user_content_parts:
        messages.append(Message(PromptRole.USER, "\n".join(user_content_parts)))

    return messages


# Usage
if __name__ == "__main__":
    # Basic template
    template = TASK_TEMPLATES["summarize"]
    prompt = template.format(
        text="Long article about AI...",
        length="3",
    )
    print(prompt)

    # Few-shot
    sentiment_prompt = SENTIMENT_FEW_SHOT.format(
        input="This movie was absolutely fantastic!",
    )
    print(sentiment_prompt)

    # Build complete prompt
    messages = build_prompt(
        system="coder",
        task_template="code_review",
        output_format="structured",
        language="python",
        code="def add(a, b): return a + b",
    )
    for msg in messages:
        print(f"{msg.role.value}: {msg.content[:100]}...")
```

## Jinja2 Templates

```python
# prompts/jinja_templates.py
from jinja2 import Environment, BaseLoader, select_autoescape
from typing import Dict, Any, List


# Jinja2 environment
env = Environment(
    loader=BaseLoader(),
    autoescape=select_autoescape(),
    trim_blocks=True,
    lstrip_blocks=True,
)


# Template definitions
JINJA_TEMPLATES = {
    "code_generation": """
{% if system_context %}
Context: {{ system_context }}
{% endif %}

Generate {{ language }} code that:
{% for requirement in requirements %}
- {{ requirement }}
{% endfor %}

{% if constraints %}
Constraints:
{% for constraint in constraints %}
- {{ constraint }}
{% endfor %}
{% endif %}

{% if examples %}
Examples:
{% for example in examples %}
Input: {{ example.input }}
Output:
```{{ language }}
{{ example.output }}
```
{% endfor %}
{% endif %}

Now generate code for:
{{ task }}

```{{ language }}
""",

    "conversation": """
{% for message in history %}
{{ message.role }}: {{ message.content }}
{% endfor %}

User: {{ user_input }}