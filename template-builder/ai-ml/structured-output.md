# Structured Output Template

> Production-ready structured output configurations for LLM applications

## Overview

This template provides structured output configurations with:
- Pydantic model validation
- JSON mode and schema enforcement
- Function calling patterns
- Output parsing
- Type-safe responses

## Quick Start

```bash
# Install dependencies
pip install openai anthropic pydantic instructor
pip install langchain-openai

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

## Instructor Library

```python
# structured/instructor_usage.py
import instructor
from openai import OpenAI
from anthropic import Anthropic
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


# Initialize clients with instructor
openai_client = instructor.from_openai(OpenAI())
anthropic_client = instructor.from_anthropic(Anthropic())


# Define output schemas
class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class SentimentAnalysis(BaseModel):
    """Sentiment analysis result."""
    text: str = Field(description="The analyzed text")
    sentiment: Sentiment = Field(description="The detected sentiment")
    confidence: float = Field(ge=0, le=1, description="Confidence score")
    key_phrases: List[str] = Field(description="Key phrases contributing to sentiment")


class Entity(BaseModel):
    """Named entity."""
    text: str = Field(description="The entity text")
    type: Literal["person", "organization", "location", "date", "product"] = Field(
        description="Entity type"
    )
    start_index: int = Field(description="Start position in text")
    end_index: int = Field(description="End position in text")


class EntityExtraction(BaseModel):
    """Entity extraction result."""
    entities: List[Entity] = Field(description="Extracted entities")
    text: str = Field(description="Original text")


class Classification(BaseModel):
    """Text classification result."""
    category: str = Field(description="Primary category")
    subcategory: Optional[str] = Field(description="Subcategory if applicable")
    confidence: float = Field(ge=0, le=1, description="Classification confidence")
    reasoning: str = Field(description="Explanation for classification")


# Sentiment Analysis
def analyze_sentiment(text: str) -> SentimentAnalysis:
    """Analyze sentiment of text."""
    return openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        response_model=SentimentAnalysis,
        messages=[
            {
                "role": "system",
                "content": "Analyze the sentiment of the provided text.",
            },
            {"role": "user", "content": text},
        ],
    )


# Entity Extraction
def extract_entities(text: str) -> EntityExtraction:
    """Extract named entities from text."""
    return openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        response_model=EntityExtraction,
        messages=[
            {
                "role": "system",
                "content": "Extract all named entities from the text with their positions.",
            },
            {"role": "user", "content": text},
        ],
    )


# Classification with retry
def classify_text(text: str, categories: List[str]) -> Classification:
    """Classify text into categories with validation."""
    return openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        response_model=Classification,
        max_retries=3,
        messages=[
            {
                "role": "system",
                "content": f"Classify the text into one of these categories: {categories}",
            },
            {"role": "user", "content": text},
        ],
    )


# Usage
if __name__ == "__main__":
    # Sentiment
    result = analyze_sentiment("I absolutely love this product! Best purchase ever.")
    print(f"Sentiment: {result.sentiment}, Confidence: {result.confidence}")

    # Entities
    entities = extract_entities("John works at Google in San Francisco.")
    for entity in entities.entities:
        print(f"{entity.text}: {entity.type}")
```

## OpenAI Native Structured Outputs

```python
# structured/openai_native.py
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional
import json


client = OpenAI()


class Step(BaseModel):
    """A reasoning step."""
    explanation: str = Field(description="Explanation of this step")
    output: str = Field(description="Output of this step")


class MathSolution(BaseModel):
    """Math problem solution with steps."""
    steps: List[Step] = Field(description="Solution steps")
    final_answer: str = Field(description="The final answer")


class CodeReview(BaseModel):
    """Code review result."""
    issues: List[str] = Field(description="List of issues found")
    suggestions: List[str] = Field(description="Improvement suggestions")
    overall_quality: int = Field(ge=1, le=10, description="Quality score 1-10")
    summary: str = Field(description="Review summary")


def solve_math_problem(problem: str) -> MathSolution:
    """Solve a math problem with structured output."""
    response = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {
                "role": "system",
                "content": "Solve the math problem step by step.",
            },
            {"role": "user", "content": problem},
        ],
        response_format=MathSolution,
    )

    return response.choices[0].message.parsed


def review_code(code: str, language: str = "python") -> CodeReview:
    """Review code with structured feedback."""
    response = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {
                "role": "system",
                "content": f"Review the following {language} code for issues and improvements.",
            },
            {"role": "user", "content": code},
        ],
        response_format=CodeReview,
    )

    return response.choices[0].message.parsed


# JSON Mode (simpler, less strict)
def extract_data_json_mode(text: str, schema: dict) -> dict:
    """Extract data using JSON mode."""
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {
                "role": "system",
                "content": f"Extract data from the text according to this schema: {json.dumps(schema)}",
            },
            {"role": "user", "content": text},
        ],
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


# Usage
if __name__ == "__main__":
    # Solve math
    solution = solve_math_problem("What is 15% of 240?")
    print(f"Answer: {solution.final_answer}")
    for step in solution.steps:
        print(f"  - {step.explanation}: {step.output}")

    # Code review
    code = """
def add(a, b):
    return a + b
"""
    review = review_code(code)
    print(f"Quality: {review.overall_quality}/10")
```

## Anthropic Structured Outputs

```python
# structured/anthropic_structured.py
from anthropic import Anthropic
from pydantic import BaseModel, Field
from typing import List, Optional
import json


client = Anthropic()


class AnalysisResult(BaseModel):
    """Analysis result."""
    summary: str = Field(description="Brief summary")
    key_findings: List[str] = Field(description="Key findings")
    recommendations: List[str] = Field(description="Recommendations")
    confidence: float = Field(ge=0, le=1, description="Confidence level")


def get_structured_response(
    prompt: str,
    schema: type[BaseModel],
    system_prompt: str = "You are a helpful assistant.",
) -> BaseModel:
    """Get structured response from Claude."""
    # Generate schema description
    schema_json = schema.model_json_schema()

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        system=f"""{system_prompt}

Always respond with valid JSON matching this schema:
{json.dumps(schema_json, indent=2)}

Only output the JSON, no other text.""",
        messages=[{"role": "user", "content": prompt}],
    )

    # Parse response
    content = response.content[0].text
    data = json.loads(content)
    return schema.model_validate(data)


# Tool use for structured output
def structured_tool_use(prompt: str, output_schema: type[BaseModel]) -> BaseModel:
    """Use tool calling for structured output."""
    tool = {
        "name": "format_response",
        "description": "Format the response according to the schema",
        "input_schema": output_schema.model_json_schema(),
    }

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=4096,
        tools=[tool],
        tool_choice={"type": "tool", "name": "format_response"},
        messages=[{"role": "user", "content": prompt}],
    )

    # Extract tool use
    for block in response.content:
        if block.type == "tool_use" and block.name == "format_response":
            return output_schema.model_validate(block.input)

    raise ValueError("No tool use in response")


# Usage
if __name__ == "__main__":
    result = get_structured_response(
        "Analyze the market trends for electric vehicles in 2024",
        AnalysisResult,
        "You are a market analyst.",
    )
    print(f"Summary: {result.summary}")
```

## LangChain Output Parsers

```python
# structured/langchain_parsers.py
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import JsonOutputParser, PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from typing import List


# Define output schema
class ProductReview(BaseModel):
    """Product review analysis."""
    product_name: str = Field(description="Name of the product")
    rating: int = Field(description="Rating from 1 to 5")
    pros: List[str] = Field(description="Positive aspects")
    cons: List[str] = Field(description="Negative aspects")
    recommendation: str = Field(description="Buy recommendation")


class QuestionAnswer(BaseModel):
    """Question and answer pair."""
    question: str = Field(description="The question")
    answer: str = Field(description="The answer")
    confidence: float = Field(description="Confidence in the answer")
    sources: List[str] = Field(description="Source references")


# Pydantic parser
def analyze_review(review_text: str) -> ProductReview:
    """Analyze a product review."""
    parser = PydanticOutputParser(pydantic_object=ProductReview)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Analyze the product review and extract structured information.\n{format_instructions}",
        ),
        ("human", "{review}"),
    ])

    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)

    chain = prompt | llm | parser

    return chain.invoke({
        "review": review_text,
        "format_instructions": parser.get_format_instructions(),
    })


# JSON parser with schema
def extract_qa(text: str) -> dict:
    """Extract Q&A from text."""
    parser = JsonOutputParser(pydantic_object=QuestionAnswer)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Extract question and answer pairs from the text.\n{format_instructions}",
        ),
        ("human", "{text}"),
    ])

    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)

    chain = prompt | llm | parser

    return chain.invoke({
        "text": text,
        "format_instructions": parser.get_format_instructions(),
    })


# With retry on parsing errors
from langchain.output_parsers import RetryOutputParser


def robust_extraction(text: str, schema: type[BaseModel]) -> BaseModel:
    """Extract data with retry on parsing errors."""
    parser = PydanticOutputParser(pydantic_object=schema)

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Extract information according to the schema.\n{format_instructions}",
        ),
        ("human", "{text}"),
    ])

    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)

    retry_parser = RetryOutputParser.from_llm(
        parser=parser,
        llm=llm,
        max_retries=3,
    )

    chain = prompt | llm

    response = chain.invoke({
        "text": text,
        "format_instructions": parser.get_format_instructions(),
    })

    return retry_parser.parse_with_prompt(response.content, prompt)
```

## Complex Schema Patterns

```python
# structured/complex_schemas.py
from pydantic import BaseModel, Field, validator, root_validator
from typing import List, Optional, Dict, Any, Union, Literal
from datetime import datetime
from enum import Enum


class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"


class SubTask(BaseModel):
    """A subtask within a task."""
    title: str = Field(min_length=1, max_length=200)
    completed: bool = False
    estimated_hours: Optional[float] = Field(ge=0, le=100)


class Task(BaseModel):
    """A task with validation."""
    title: str = Field(min_length=1, max_length=200, description="Task title")
    description: str = Field(description="Task description")
    priority: Priority = Field(default=Priority.MEDIUM)
    status: TaskStatus = Field(default=TaskStatus.TODO)
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    subtasks: List[SubTask] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list, max_length=10)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @validator("tags", each_item=True)
    def validate_tag(cls, v):
        if not v.strip():
            raise ValueError("Tags cannot be empty")
        return v.lower().strip()

    @root_validator
    def validate_task(cls, values):
        status = values.get("status")
        due_date = values.get("due_date")

        if status == TaskStatus.DONE and due_date and due_date > datetime.now():
            # Allow completing before due date
            pass

        return values


class ProjectPlan(BaseModel):
    """A complete project plan."""
    name: str = Field(description="Project name")
    description: str = Field(description="Project description")
    goals: List[str] = Field(min_length=1, description="Project goals")
    tasks: List[Task] = Field(description="Project tasks")
    milestones: List[Dict[str, Any]] = Field(description="Project milestones")
    estimated_completion: Optional[datetime] = None

    def total_estimated_hours(self) -> float:
        total = 0
        for task in self.tasks:
            for subtask in task.subtasks:
                if subtask.estimated_hours:
                    total += subtask.estimated_hours
        return total


# Discriminated unions
class TextContent(BaseModel):
    type: Literal["text"] = "text"
    text: str


class ImageContent(BaseModel):
    type: Literal["image"] = "image"
    url: str
    alt_text: Optional[str] = None


class CodeContent(BaseModel):
    type: Literal["code"] = "code"
    code: str
    language: str


ContentBlock = Union[TextContent, ImageContent, CodeContent]


class Document(BaseModel):
    """A document with mixed content."""
    title: str
    content: List[ContentBlock]
    created_at: datetime = Field(default_factory=datetime.now)

    @property
    def text_content(self) -> str:
        """Extract all text content."""
        return " ".join(
            block.text for block in self.content if isinstance(block, TextContent)
        )
```

## Validation and Error Handling

```python
# structured/validation.py
from pydantic import BaseModel, Field, ValidationError
from typing import TypeVar, Type, Optional
import instructor
from openai import OpenAI
import logging

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class StructuredOutputManager:
    """Manage structured output with validation and retries."""

    def __init__(self, max_retries: int = 3):
        self.client = instructor.from_openai(OpenAI())
        self.max_retries = max_retries

    def extract(
        self,
        prompt: str,
        output_type: Type[T],
        model: str = "gpt-4-turbo-preview",
        system_prompt: str = None,
    ) -> T:
        """Extract structured data with validation."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            return self.client.chat.completions.create(
                model=model,
                response_model=output_type,
                max_retries=self.max_retries,
                messages=messages,
            )
        except ValidationError as e:
            logger.error(f"Validation failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            raise

    def extract_with_fallback(
        self,
        prompt: str,
        output_type: Type[T],
        fallback: T,
        **kwargs,
    ) -> T:
        """Extract with fallback on failure."""
        try:
            return self.extract(prompt, output_type, **kwargs)
        except Exception as e:
            logger.warning(f"Falling back due to: {e}")
            return fallback

    def batch_extract(
        self,
        prompts: list[str],
        output_type: Type[T],
        **kwargs,
    ) -> list[Optional[T]]:
        """Extract from multiple prompts."""
        results = []
        for prompt in prompts:
            try:
                result = self.extract(prompt, output_type, **kwargs)
                results.append(result)
            except Exception as e:
                logger.error(f"Failed for prompt: {prompt[:50]}... Error: {e}")
                results.append(None)
        return results


# Custom validation decorators
def validate_output(output_type: Type[T]):
    """Decorator to validate function output."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            if isinstance(result, dict):
                return output_type.model_validate(result)
            return result
        return wrapper
    return decorator
```

## CLAUDE.md Integration

```markdown
# Structured Output

## Libraries
- **Instructor** - Type-safe extraction
- **OpenAI** - Native structured outputs
- **LangChain** - Output parsers

## Best Practices
- Define Pydantic models for schemas
- Use Field descriptions for better results
- Implement retry logic for validation
- Handle parsing errors gracefully

## Schema Design
- Use clear field names and descriptions
- Add validation constraints (min, max, regex)
- Use enums for fixed options
- Support optional fields appropriately
```

## AI Suggestions

1. **Use Instructor library** - Type-safe extraction
2. **Define clear schemas** - Pydantic models
3. **Add field descriptions** - Better LLM understanding
4. **Implement retries** - Handle validation failures
5. **Use validation constraints** - Ensure data quality
6. **Handle errors gracefully** - Fallback values
7. **Test edge cases** - Validate schema coverage
8. **Monitor extraction quality** - Track success rates
9. **Version schemas** - Handle schema evolution
10. **Document schemas** - Clear API documentation
