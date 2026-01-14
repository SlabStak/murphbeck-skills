# LangChain Agent Template

> Production-ready LangChain agent configurations for AI-powered applications

## Overview

This template provides LangChain configurations with:
- ReAct agents with tools
- Conversation memory
- RAG pipelines
- Custom chains
- Output parsing

## Quick Start

```bash
# Install LangChain
pip install langchain langchain-openai langchain-anthropic langchain-community

# Install additional packages
pip install chromadb tiktoken

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

## Basic Agent Setup

```python
# agents/basic_agent.py
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain.tools import Tool, StructuredTool
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from pydantic import BaseModel, Field
from typing import Type
import json


# Initialize LLM
def get_llm(provider: str = "openai", model: str | None = None):
    """Get LLM instance by provider."""
    if provider == "openai":
        return ChatOpenAI(
            model=model or "gpt-4-turbo-preview",
            temperature=0.7,
            max_tokens=4096,
        )
    elif provider == "anthropic":
        return ChatAnthropic(
            model=model or "claude-3-5-sonnet-20241022",
            temperature=0.7,
            max_tokens=4096,
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")


# Define tools
def search_web(query: str) -> str:
    """Search the web for information."""
    # Implement actual search logic
    return f"Search results for: {query}"


def calculate(expression: str) -> str:
    """Evaluate a mathematical expression."""
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"Error: {e}"


def get_weather(location: str) -> str:
    """Get weather for a location."""
    # Implement actual weather API call
    return f"Weather for {location}: 72°F, Sunny"


# Tool definitions
tools = [
    Tool(
        name="search",
        func=search_web,
        description="Search the web for information. Input should be a search query.",
    ),
    Tool(
        name="calculator",
        func=calculate,
        description="Calculate mathematical expressions. Input should be a valid math expression.",
    ),
    Tool(
        name="weather",
        func=get_weather,
        description="Get current weather for a location. Input should be a city name.",
    ),
]


# Structured tool with Pydantic
class SearchInput(BaseModel):
    query: str = Field(description="The search query")
    num_results: int = Field(default=5, description="Number of results to return")


def structured_search(query: str, num_results: int = 5) -> str:
    """Search with structured input."""
    return f"Top {num_results} results for: {query}"


structured_tool = StructuredTool.from_function(
    func=structured_search,
    name="structured_search",
    description="Search with configurable result count",
    args_schema=SearchInput,
)


# ReAct agent prompt
REACT_PROMPT = PromptTemplate.from_template("""Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}""")


def create_agent(llm=None, tools_list=None):
    """Create a ReAct agent."""
    if llm is None:
        llm = get_llm()
    if tools_list is None:
        tools_list = tools

    agent = create_react_agent(llm, tools_list, REACT_PROMPT)

    return AgentExecutor(
        agent=agent,
        tools=tools_list,
        verbose=True,
        max_iterations=10,
        early_stopping_method="force",
        handle_parsing_errors=True,
    )


# Usage
if __name__ == "__main__":
    agent = create_agent()
    result = agent.invoke({"input": "What's the weather in San Francisco?"})
    print(result["output"])
```

## Conversation Agent with Memory

```python
# agents/conversation_agent.py
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain_core.messages import SystemMessage
from langchain.tools import Tool


# Conversation memory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
)

# Summary memory for long conversations
summary_memory = ConversationSummaryMemory(
    llm=ChatOpenAI(model="gpt-3.5-turbo"),
    memory_key="chat_history",
    return_messages=True,
)


# Conversation prompt
CONVERSATION_PROMPT = ChatPromptTemplate.from_messages([
    SystemMessage(content="""You are a helpful AI assistant.
You have access to tools to help answer questions.
Always be helpful, accurate, and concise."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])


def create_conversation_agent(tools_list: list[Tool], use_summary: bool = False):
    """Create a conversation agent with memory."""
    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.7)

    agent = create_openai_functions_agent(llm, tools_list, CONVERSATION_PROMPT)

    return AgentExecutor(
        agent=agent,
        tools=tools_list,
        memory=summary_memory if use_summary else memory,
        verbose=True,
        max_iterations=10,
    )


class ConversationManager:
    """Manage conversation state and agent."""

    def __init__(self, tools: list[Tool], use_summary: bool = False):
        self.agent = create_conversation_agent(tools, use_summary)
        self.history = []

    def chat(self, message: str) -> str:
        """Send a message and get a response."""
        result = self.agent.invoke({"input": message})
        self.history.append({"role": "user", "content": message})
        self.history.append({"role": "assistant", "content": result["output"]})
        return result["output"]

    def clear_memory(self):
        """Clear conversation memory."""
        self.agent.memory.clear()
        self.history = []

    def get_history(self) -> list[dict]:
        """Get conversation history."""
        return self.history
```

## RAG Agent

```python
# agents/rag_agent.py
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain_core.documents import Document
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools.retriever import create_retriever_tool
import os


class RAGAgent:
    """RAG-powered agent with document retrieval."""

    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        collection_name: str = "documents",
    ):
        self.embeddings = OpenAIEmbeddings()
        self.persist_directory = persist_directory
        self.collection_name = collection_name

        # Initialize or load vector store
        self.vector_store = Chroma(
            collection_name=collection_name,
            embedding_function=self.embeddings,
            persist_directory=persist_directory,
        )

        # Text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

        # LLM
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)

    def add_documents(self, texts: list[str], metadatas: list[dict] | None = None):
        """Add documents to the vector store."""
        documents = [
            Document(page_content=text, metadata=meta or {})
            for text, meta in zip(texts, metadatas or [{}] * len(texts))
        ]

        splits = self.text_splitter.split_documents(documents)
        self.vector_store.add_documents(splits)

    def add_file(self, file_path: str, metadata: dict | None = None):
        """Add a file to the vector store."""
        with open(file_path, "r") as f:
            content = f.read()

        self.add_documents(
            [content],
            [{"source": file_path, **(metadata or {})}],
        )

    def query(self, question: str, k: int = 4) -> str:
        """Query the RAG system."""
        retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": k},
        )

        qa_prompt = PromptTemplate.from_template("""Use the following context to answer the question.
If you don't know the answer, say so. Don't make up information.

Context: {context}

Question: {question}

Answer:""")

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            chain_type_kwargs={"prompt": qa_prompt},
            return_source_documents=True,
        )

        result = qa_chain.invoke({"query": question})
        return result["result"]

    def get_retriever_tool(self, name: str = "search_docs", description: str = None):
        """Get a retriever tool for use in agents."""
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 4})

        return create_retriever_tool(
            retriever,
            name=name,
            description=description or "Search through documents for relevant information",
        )

    def create_agent(self, additional_tools: list = None):
        """Create an agent with RAG capabilities."""
        tools = [self.get_retriever_tool()]
        if additional_tools:
            tools.extend(additional_tools)

        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant with access to a document database."),
            ("human", "{input}"),
            ("placeholder", "{agent_scratchpad}"),
        ])

        agent = create_openai_functions_agent(self.llm, tools, prompt)

        return AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            max_iterations=5,
        )


# Usage
if __name__ == "__main__":
    rag = RAGAgent()

    # Add documents
    rag.add_documents([
        "LangChain is a framework for developing applications powered by language models.",
        "RAG stands for Retrieval Augmented Generation.",
        "Vector stores are used to store and retrieve embeddings.",
    ])

    # Query
    answer = rag.query("What is LangChain?")
    print(answer)
```

## Custom Chain

```python
# chains/custom_chain.py
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from pydantic import BaseModel, Field
from typing import List


# Output schema
class Analysis(BaseModel):
    summary: str = Field(description="Brief summary of the content")
    key_points: List[str] = Field(description="Key points extracted")
    sentiment: str = Field(description="Overall sentiment: positive, negative, or neutral")
    confidence: float = Field(description="Confidence score 0-1")


# Create chain with structured output
def create_analysis_chain():
    """Create a chain that analyzes text and returns structured output."""
    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0)
    parser = JsonOutputParser(pydantic_object=Analysis)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """Analyze the following text and return a JSON object with:
- summary: A brief summary
- key_points: List of key points
- sentiment: positive, negative, or neutral
- confidence: Your confidence score from 0 to 1

{format_instructions}"""),
        ("human", "{text}"),
    ])

    chain = (
        {"text": RunnablePassthrough(), "format_instructions": lambda _: parser.get_format_instructions()}
        | prompt
        | llm
        | parser
    )

    return chain


# Multi-step chain
def create_research_chain():
    """Create a multi-step research chain."""
    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.7)

    # Step 1: Generate research questions
    questions_prompt = ChatPromptTemplate.from_messages([
        ("system", "Generate 3 research questions about the topic."),
        ("human", "Topic: {topic}"),
    ])

    # Step 2: Research each question
    research_prompt = ChatPromptTemplate.from_messages([
        ("system", "Provide a detailed answer to the research question."),
        ("human", "Question: {question}"),
    ])

    # Step 3: Synthesize findings
    synthesis_prompt = ChatPromptTemplate.from_messages([
        ("system", "Synthesize the research findings into a cohesive summary."),
        ("human", "Findings:\n{findings}"),
    ])

    def parse_questions(text: str) -> list[str]:
        """Parse questions from LLM output."""
        return [q.strip() for q in text.split("\n") if q.strip()]

    def research_questions(questions: list[str]) -> str:
        """Research each question."""
        findings = []
        for q in questions[:3]:  # Limit to 3
            result = (research_prompt | llm | StrOutputParser()).invoke({"question": q})
            findings.append(f"Q: {q}\nA: {result}\n")
        return "\n".join(findings)

    chain = (
        questions_prompt
        | llm
        | StrOutputParser()
        | RunnableLambda(parse_questions)
        | RunnableLambda(research_questions)
        | {"findings": RunnablePassthrough()}
        | synthesis_prompt
        | llm
        | StrOutputParser()
    )

    return chain


# Parallel chain
def create_parallel_analysis_chain():
    """Create a chain that runs multiple analyses in parallel."""
    llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.7)

    sentiment_prompt = ChatPromptTemplate.from_template(
        "Analyze the sentiment of this text: {text}"
    )
    summary_prompt = ChatPromptTemplate.from_template(
        "Summarize this text in one sentence: {text}"
    )
    topics_prompt = ChatPromptTemplate.from_template(
        "List the main topics in this text: {text}"
    )

    chain = {
        "sentiment": sentiment_prompt | llm | StrOutputParser(),
        "summary": summary_prompt | llm | StrOutputParser(),
        "topics": topics_prompt | llm | StrOutputParser(),
        "original": RunnablePassthrough(),
    }

    return chain


# Usage
if __name__ == "__main__":
    # Analysis chain
    analysis_chain = create_analysis_chain()
    result = analysis_chain.invoke("LangChain is an amazing framework for building AI applications.")
    print(result)

    # Research chain
    research_chain = create_research_chain()
    result = research_chain.invoke({"topic": "quantum computing"})
    print(result)
```

## CLAUDE.md Integration

```markdown
# LangChain Agent

## Installation
```bash
pip install langchain langchain-openai langchain-anthropic
```

## Key Components
- **Agents**: ReAct, OpenAI Functions, etc.
- **Tools**: Functions agents can call
- **Memory**: Conversation history
- **Chains**: Composable pipelines
- **RAG**: Retrieval-augmented generation

## Agent Types
- `create_react_agent` - ReAct reasoning
- `create_openai_functions_agent` - Function calling
- `create_structured_chat_agent` - Structured output

## Memory Types
- `ConversationBufferMemory` - Full history
- `ConversationSummaryMemory` - Summarized history
- `ConversationBufferWindowMemory` - Recent history
```

## AI Suggestions

1. **Implement memory** - Conversation persistence
2. **Add RAG** - Document retrieval
3. **Configure tools** - Custom tool functions
4. **Use structured output** - Pydantic parsing
5. **Add streaming** - Real-time responses
6. **Implement caching** - Response caching
7. **Add fallbacks** - Error recovery
8. **Configure callbacks** - Logging and monitoring
9. **Use LCEL** - LangChain Expression Language
10. **Add evaluation** - Agent performance testing
