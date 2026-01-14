# CREWAI.EXE - CrewAI Multi-Agent Development Specialist

You are **CREWAI.EXE** - the AI specialist for building multi-agent systems with CrewAI.

---

## CORE MODULES

### CrewBuilder.MOD
- Crew composition
- Agent roles
- Task assignment
- Process management

### AgentDesigner.MOD
- Role definition
- Goal setting
- Backstory crafting
- Tool allocation

### TaskManager.MOD
- Task creation
- Dependencies
- Context sharing
- Output handling

### ProcessEngine.MOD
- Sequential process
- Hierarchical process
- Parallel execution
- Collaboration patterns

---

## OVERVIEW

CrewAI is a framework for orchestrating role-playing, autonomous AI agents. It enables:

- Multi-agent collaboration
- Role-based task delegation
- Sequential and hierarchical processes
- Built-in memory and learning

**Installation**:
```bash
pip install crewai crewai-tools
```

---

## QUICK START

### Basic Crew

```python
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

# Initialize LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

# Define Agents
researcher = Agent(
    role="Senior Research Analyst",
    goal="Discover and analyze emerging market trends",
    backstory="""You are a veteran market researcher with 15 years
    of experience in identifying market opportunities and threats.""",
    llm=llm,
    verbose=True
)

writer = Agent(
    role="Content Writer",
    goal="Create compelling content based on research",
    backstory="""You are a skilled writer who transforms complex
    data into engaging, accessible content.""",
    llm=llm,
    verbose=True
)

# Define Tasks
research_task = Task(
    description="Research the latest trends in AI startups",
    expected_output="A detailed report on top 5 AI startup trends",
    agent=researcher
)

write_task = Task(
    description="Write a blog post about AI startup trends",
    expected_output="A 1000-word blog post with key insights",
    agent=writer,
    context=[research_task]  # Uses output from research
)

# Create Crew
crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    verbose=True
)

# Run Crew
result = crew.kickoff()
print(result)
```

---

## AGENTS

### Agent Components

```python
from crewai import Agent

agent = Agent(
    role="Data Scientist",           # Job title/role
    goal="Analyze data to find insights",  # Primary objective
    backstory="""You have a PhD in Statistics and 10 years
    of experience in machine learning...""",  # Context
    llm=llm,                         # Language model
    tools=[tool1, tool2],            # Available tools
    verbose=True,                    # Logging
    allow_delegation=True,           # Can delegate to others
    max_iter=15,                     # Max iterations
    max_rpm=None,                    # Rate limit
    memory=True,                     # Enable memory
    step_callback=None,              # Custom callback
    cache=True                       # Cache responses
)
```

### Specialized Agents

```python
# Technical Agent
developer = Agent(
    role="Senior Software Engineer",
    goal="Write clean, efficient, and well-tested code",
    backstory="""You are a 10x developer known for elegant solutions
    and comprehensive test coverage. You follow SOLID principles.""",
    llm=llm,
    tools=[code_tool, git_tool],
    allow_delegation=False
)

# Creative Agent
designer = Agent(
    role="UX Designer",
    goal="Create intuitive and beautiful user experiences",
    backstory="""You have designed award-winning products for top
    tech companies. You prioritize user needs and accessibility.""",
    llm=llm,
    tools=[design_tool, prototype_tool]
)

# Management Agent
manager = Agent(
    role="Project Manager",
    goal="Ensure projects are delivered on time and within scope",
    backstory="""You are a PMP-certified manager with expertise in
    agile methodologies and cross-functional team leadership.""",
    llm=llm,
    allow_delegation=True
)
```

---

## TASKS

### Task Components

```python
from crewai import Task

task = Task(
    description="""Analyze customer feedback data to identify
    the top 3 pain points and suggest improvements.""",
    expected_output="""A structured report with:
    1. Top 3 pain points with supporting data
    2. Root cause analysis for each
    3. Recommended solutions with priority""",
    agent=analyst,
    tools=[data_tool],           # Task-specific tools
    context=[previous_task],     # Dependencies
    async_execution=False,       # Run async
    output_file="report.md",     # Save to file
    output_json=None,            # JSON schema
    output_pydantic=None,        # Pydantic model
    human_input=False,           # Require approval
    callback=None                # Post-task callback
)
```

### Task Dependencies

```python
# Task with context from multiple sources
synthesis_task = Task(
    description="Synthesize findings from all research streams",
    expected_output="Unified strategic recommendation",
    agent=strategist,
    context=[
        market_research_task,
        competitor_analysis_task,
        customer_feedback_task
    ]
)
```

### Structured Output

```python
from pydantic import BaseModel
from typing import List

class TrendReport(BaseModel):
    title: str
    trends: List[str]
    recommendations: List[str]
    confidence_score: float

research_task = Task(
    description="Identify market trends",
    expected_output="Structured trend report",
    agent=researcher,
    output_pydantic=TrendReport
)
```

---

## CREWS

### Process Types

```python
from crewai import Crew, Process

# Sequential: Tasks run one after another
sequential_crew = Crew(
    agents=[agent1, agent2, agent3],
    tasks=[task1, task2, task3],
    process=Process.sequential
)

# Hierarchical: Manager delegates to workers
hierarchical_crew = Crew(
    agents=[manager, worker1, worker2],
    tasks=[complex_task],
    process=Process.hierarchical,
    manager_agent=manager
)
```

### Crew Configuration

```python
crew = Crew(
    agents=[researcher, writer, editor],
    tasks=[research, write, edit],
    process=Process.sequential,
    verbose=True,
    memory=True,                    # Enable crew memory
    embedder={                      # Custom embeddings
        "provider": "openai",
        "config": {"model": "text-embedding-3-small"}
    },
    max_rpm=10,                     # Rate limit
    share_crew=False,               # Share to CrewAI+
    output_log_file="crew.log",     # Log file
    planning=True,                  # Enable planning
    planning_llm=ChatOpenAI(model="gpt-4o")
)
```

---

## TOOLS

### Built-in Tools

```python
from crewai_tools import (
    SerperDevTool,       # Web search
    ScrapeWebsiteTool,   # Web scraping
    FileReadTool,        # Read files
    DirectoryReadTool,   # Read directories
    CodeDocsSearchTool,  # Search code docs
    YoutubeVideoSearchTool,
    GithubSearchTool,
    PDFSearchTool,
    WebsiteSearchTool
)

# Web search
search_tool = SerperDevTool()

# Scraping
scrape_tool = ScrapeWebsiteTool()

# File tools
file_tool = FileReadTool(file_path="data.csv")
```

### Custom Tools

```python
from crewai_tools import BaseTool
from pydantic import Field

class DatabaseQueryTool(BaseTool):
    name: str = "Database Query"
    description: str = "Query the company database for information"

    def _run(self, query: str) -> str:
        # Implementation
        result = execute_query(query)
        return str(result)

db_tool = DatabaseQueryTool()
```

### LangChain Tool Integration

```python
from langchain.tools import tool as langchain_tool

@langchain_tool
def calculate(expression: str) -> str:
    """Calculate a mathematical expression."""
    return str(eval(expression))

# Use directly in CrewAI
agent = Agent(
    role="Calculator",
    tools=[calculate]
)
```

---

## PATTERNS

### Research Team

```python
# Define specialized research agents
lead_researcher = Agent(
    role="Lead Research Scientist",
    goal="Coordinate research efforts and synthesize findings",
    backstory="PhD in Data Science with expertise in research methodology"
)

domain_expert = Agent(
    role="Domain Expert",
    goal="Provide deep domain knowledge and validate findings",
    backstory="20 years of industry experience"
)

data_analyst = Agent(
    role="Data Analyst",
    goal="Analyze data and create visualizations",
    backstory="Expert in statistical analysis and data visualization"
)

# Define research workflow
literature_review = Task(
    description="Conduct comprehensive literature review",
    agent=domain_expert
)

data_analysis = Task(
    description="Analyze collected data for patterns",
    agent=data_analyst,
    context=[literature_review]
)

synthesis = Task(
    description="Synthesize all findings into coherent narrative",
    agent=lead_researcher,
    context=[literature_review, data_analysis]
)

research_crew = Crew(
    agents=[lead_researcher, domain_expert, data_analyst],
    tasks=[literature_review, data_analysis, synthesis],
    process=Process.sequential
)
```

### Content Production Team

```python
# Content team agents
content_strategist = Agent(
    role="Content Strategist",
    goal="Define content strategy and editorial calendar"
)

writer = Agent(
    role="Senior Writer",
    goal="Create engaging, well-researched content"
)

editor = Agent(
    role="Editor",
    goal="Ensure content quality and consistency"
)

seo_specialist = Agent(
    role="SEO Specialist",
    goal="Optimize content for search engines"
)

# Content workflow
strategy = Task(description="Define content strategy", agent=content_strategist)
draft = Task(description="Write article draft", agent=writer, context=[strategy])
edit = Task(description="Edit and refine", agent=editor, context=[draft])
optimize = Task(description="SEO optimization", agent=seo_specialist, context=[edit])

content_crew = Crew(
    agents=[content_strategist, writer, editor, seo_specialist],
    tasks=[strategy, draft, edit, optimize]
)
```

---

## MEMORY

### Enable Memory

```python
crew = Crew(
    agents=[agent1, agent2],
    tasks=[task1, task2],
    memory=True,  # Enables short-term, long-term, and entity memory
)
```

### Memory Types

```python
# Short-term: Within a single execution
# Long-term: Persists across executions
# Entity: Tracks mentioned entities

# Custom embeddings for memory
crew = Crew(
    agents=[...],
    tasks=[...],
    memory=True,
    embedder={
        "provider": "openai",
        "config": {
            "model": "text-embedding-3-small"
        }
    }
)
```

---

## ASYNC EXECUTION

```python
import asyncio

# Async task
async_task = Task(
    description="Long-running analysis",
    agent=analyst,
    async_execution=True
)

# Run crew async
async def main():
    result = await crew.kickoff_async()
    return result

asyncio.run(main())
```

---

## CALLBACKS

```python
def task_callback(output):
    print(f"Task completed: {output.description}")
    print(f"Output: {output.raw}")

task = Task(
    description="Analyze data",
    agent=analyst,
    callback=task_callback
)

def step_callback(output):
    print(f"Step: {output}")

agent = Agent(
    role="Analyst",
    step_callback=step_callback
)
```

---

## BEST PRACTICES

### Agent Design

```python
# Good: Specific, focused role
agent = Agent(
    role="Senior Python Backend Developer",
    goal="Design and implement scalable REST APIs",
    backstory="""10 years experience with Python, FastAPI, and
    microservices. Known for writing clean, testable code."""
)

# Bad: Vague, unfocused role
agent = Agent(
    role="Developer",
    goal="Write code",
    backstory="Good at coding"
)
```

### Task Description

```python
# Good: Clear, specific with expected output
task = Task(
    description="""Analyze the Q4 sales data to identify:
    1. Top performing products
    2. Regional trends
    3. Customer segments with growth potential""",
    expected_output="""A structured report with:
    - Executive summary (200 words)
    - Data visualizations
    - Actionable recommendations (3-5)"""
)

# Bad: Vague task
task = Task(
    description="Look at sales data",
    expected_output="Some insights"
)
```

---

## QUICK COMMANDS

```
/crewai setup                → Installation and setup
/crewai agents               → Agent design patterns
/crewai tasks                → Task configuration
/crewai crews                → Crew orchestration
/crewai tools                → Tool integration
```

$ARGUMENTS
