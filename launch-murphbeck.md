# MURPHBECK.EXE - Master Control Agent

You are MURPHBECK.EXE — the master control and orchestration layer for the entire Murphbeck AI system, coordinating agents, managing context, and optimizing performance.

MISSION
Coordinate, orchestrate, and optimize all agents and skills in the Murphbeck ecosystem for maximum effectiveness. Command the system. Orchestrate the agents. Deliver excellence.

---

## CAPABILITIES

### SystemOrchestrator.MOD
- Agent coordination
- Task distribution
- Resource allocation
- Priority management
- Load balancing

### ContextManager.MOD
- State persistence
- Memory management
- Context threading
- Knowledge synthesis
- Session continuity

### PerformanceOptimizer.MOD
- Latency reduction
- Token optimization
- Cache management
- Parallel execution
- Bottleneck detection

### IntelligenceRouter.MOD
- Request classification
- Agent selection
- Capability matching
- Fallback handling
- Quality assurance

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
MURPHBECK.EXE - Master Control & Orchestration Engine
Production-ready multi-agent orchestration system.
"""

import asyncio
import json
import hashlib
import time
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional, Any, Callable, Coroutine
from collections import defaultdict
import heapq
import threading
import uuid


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS
# ════════════════════════════════════════════════════════════════════════════════

class AgentCategory(Enum):
    """Categories of agents in the system."""
    LAUNCH = "launch"
    WAKE = "wake"
    PROJECT = "project"
    UTILITY = "utility"
    INDUSTRY = "industry"
    GOVERNANCE = "governance"
    CREATIVE = "creative"
    TECHNICAL = "technical"


class AgentStatus(Enum):
    """Status of an agent."""
    IDLE = "idle"
    ACTIVE = "active"
    BUSY = "busy"
    WARMING_UP = "warming_up"
    COOLING_DOWN = "cooling_down"
    ERROR = "error"
    OFFLINE = "offline"


class TaskPriority(Enum):
    """Priority levels for tasks."""
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3
    LOW = 4
    BACKGROUND = 5


class TaskStatus(Enum):
    """Status of a task."""
    QUEUED = "queued"
    ASSIGNED = "assigned"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class RoutingStrategy(Enum):
    """Strategies for routing requests to agents."""
    ROUND_ROBIN = "round_robin"
    LEAST_LOADED = "least_loaded"
    CAPABILITY_MATCH = "capability_match"
    AFFINITY = "affinity"
    RANDOM = "random"
    PRIORITY = "priority"


class ResourceType(Enum):
    """Types of resources that can be allocated."""
    TOKEN_BUDGET = "token_budget"
    CONTEXT_SLOTS = "context_slots"
    MEMORY_MB = "memory_mb"
    COMPUTE_UNITS = "compute_units"
    API_CALLS = "api_calls"


class CacheStrategy(Enum):
    """Caching strategies."""
    LRU = "lru"
    LFU = "lfu"
    TTL = "ttl"
    ADAPTIVE = "adaptive"
    NONE = "none"


class HealthStatus(Enum):
    """System health status levels."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    CRITICAL = "critical"


class OptimizationGoal(Enum):
    """Goals for system optimization."""
    LATENCY = "latency"
    THROUGHPUT = "throughput"
    COST = "cost"
    QUALITY = "quality"
    BALANCED = "balanced"


class EventType(Enum):
    """Types of system events."""
    AGENT_REGISTERED = "agent_registered"
    AGENT_UNREGISTERED = "agent_unregistered"
    TASK_SUBMITTED = "task_submitted"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    RESOURCE_ALLOCATED = "resource_allocated"
    RESOURCE_RELEASED = "resource_released"
    HEALTH_CHECK = "health_check"
    OPTIMIZATION_RUN = "optimization_run"
    CONTEXT_SWITCHED = "context_switched"


class ContextScope(Enum):
    """Scope of context management."""
    GLOBAL = "global"
    SESSION = "session"
    AGENT = "agent"
    TASK = "task"


# ════════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class AgentCapability:
    """Capability definition for an agent."""
    name: str
    description: str
    proficiency: float  # 0.0 to 1.0
    tags: list[str] = field(default_factory=list)
    prerequisites: list[str] = field(default_factory=list)

    def matches(self, requirement: str) -> float:
        """Calculate match score for a requirement."""
        if requirement.lower() == self.name.lower():
            return self.proficiency
        if requirement.lower() in [t.lower() for t in self.tags]:
            return self.proficiency * 0.8
        return 0.0


@dataclass
class AgentDefinition:
    """Definition of an agent in the system."""
    id: str
    name: str
    category: AgentCategory
    description: str
    capabilities: list[AgentCapability]
    status: AgentStatus = AgentStatus.IDLE
    max_concurrent_tasks: int = 3
    warmup_time_ms: int = 100
    cooldown_time_ms: int = 50
    token_budget: int = 100000
    priority_weight: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def capability_names(self) -> list[str]:
        return [c.name for c in self.capabilities]

    def get_capability_score(self, requirement: str) -> float:
        """Get aggregate capability score for a requirement."""
        scores = [c.matches(requirement) for c in self.capabilities]
        return max(scores) if scores else 0.0


@dataclass
class TaskDefinition:
    """Definition of a task to be executed."""
    id: str
    name: str
    description: str
    required_capabilities: list[str]
    priority: TaskPriority
    payload: dict[str, Any]
    timeout_seconds: float = 300.0
    max_retries: int = 3
    callback: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class TaskExecution:
    """Execution state of a task."""
    task: TaskDefinition
    assigned_agent: Optional[str] = None
    status: TaskStatus = TaskStatus.QUEUED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    retry_count: int = 0
    tokens_used: int = 0

    @property
    def duration_seconds(self) -> Optional[float]:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


@dataclass
class ResourceAllocation:
    """Resource allocation record."""
    resource_type: ResourceType
    amount: int
    allocated_to: str  # agent_id or task_id
    allocated_at: datetime
    expires_at: Optional[datetime] = None

    @property
    def is_expired(self) -> bool:
        if self.expires_at:
            return datetime.now() > self.expires_at
        return False


@dataclass
class ResourcePool:
    """Pool of available resources."""
    resource_type: ResourceType
    total_capacity: int
    available: int
    allocations: list[ResourceAllocation] = field(default_factory=list)

    def allocate(self, amount: int, to: str, ttl_seconds: Optional[float] = None) -> bool:
        """Allocate resources from the pool."""
        if amount > self.available:
            return False

        expires = None
        if ttl_seconds:
            expires = datetime.now() + timedelta(seconds=ttl_seconds)

        allocation = ResourceAllocation(
            resource_type=self.resource_type,
            amount=amount,
            allocated_to=to,
            allocated_at=datetime.now(),
            expires_at=expires
        )
        self.allocations.append(allocation)
        self.available -= amount
        return True

    def release(self, allocation_id: str) -> int:
        """Release allocated resources."""
        released = 0
        remaining = []
        for alloc in self.allocations:
            if alloc.allocated_to == allocation_id:
                released += alloc.amount
            else:
                remaining.append(alloc)
        self.allocations = remaining
        self.available += released
        return released

    def cleanup_expired(self) -> int:
        """Clean up expired allocations."""
        expired = [a for a in self.allocations if a.is_expired]
        released = sum(a.amount for a in expired)
        self.allocations = [a for a in self.allocations if not a.is_expired]
        self.available += released
        return released


@dataclass
class ContextState:
    """State of execution context."""
    id: str
    scope: ContextScope
    data: dict[str, Any]
    parent_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_accessed: datetime = field(default_factory=datetime.now)
    ttl_seconds: Optional[float] = None

    @property
    def is_expired(self) -> bool:
        if self.ttl_seconds:
            age = (datetime.now() - self.created_at).total_seconds()
            return age > self.ttl_seconds
        return False

    def get(self, key: str, default: Any = None) -> Any:
        self.last_accessed = datetime.now()
        return self.data.get(key, default)

    def set(self, key: str, value: Any):
        self.last_accessed = datetime.now()
        self.data[key] = value


@dataclass
class CacheEntry:
    """Cache entry with metadata."""
    key: str
    value: Any
    created_at: datetime
    last_accessed: datetime
    access_count: int = 0
    ttl_seconds: Optional[float] = None
    size_bytes: int = 0

    @property
    def is_expired(self) -> bool:
        if self.ttl_seconds:
            age = (datetime.now() - self.created_at).total_seconds()
            return age > self.ttl_seconds
        return False

    def touch(self):
        self.last_accessed = datetime.now()
        self.access_count += 1


@dataclass
class PerformanceMetrics:
    """Performance metrics for monitoring."""
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    tokens_used: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    active_agents: int = 0
    queue_depth: int = 0

    @property
    def success_rate(self) -> float:
        total = self.completed_tasks + self.failed_tasks
        return self.completed_tasks / total if total > 0 else 0.0

    @property
    def cache_hit_rate(self) -> float:
        total = self.cache_hits + self.cache_misses
        return self.cache_hits / total if total > 0 else 0.0


@dataclass
class SystemEvent:
    """System event for logging and monitoring."""
    id: str
    event_type: EventType
    timestamp: datetime
    source: str
    data: dict[str, Any]
    severity: str = "info"


@dataclass
class HealthCheck:
    """Health check result."""
    component: str
    status: HealthStatus
    message: str
    checked_at: datetime
    details: dict[str, Any] = field(default_factory=dict)

    @property
    def is_healthy(self) -> bool:
        return self.status in [HealthStatus.HEALTHY, HealthStatus.DEGRADED]


@dataclass
class OptimizationResult:
    """Result of optimization run."""
    goal: OptimizationGoal
    actions_taken: list[str]
    metrics_before: dict[str, float]
    metrics_after: dict[str, float]
    improvement_percent: float
    timestamp: datetime


# ════════════════════════════════════════════════════════════════════════════════
# CORE ENGINE CLASSES
# ════════════════════════════════════════════════════════════════════════════════

class AgentRegistry:
    """Registry for managing agent definitions."""

    def __init__(self):
        self.agents: dict[str, AgentDefinition] = {}
        self.by_category: dict[AgentCategory, list[str]] = defaultdict(list)
        self.by_capability: dict[str, list[str]] = defaultdict(list)
        self._lock = threading.Lock()

    def register(self, agent: AgentDefinition) -> bool:
        """Register an agent."""
        with self._lock:
            if agent.id in self.agents:
                return False

            self.agents[agent.id] = agent
            self.by_category[agent.category].append(agent.id)

            for capability in agent.capabilities:
                self.by_capability[capability.name].append(agent.id)
                for tag in capability.tags:
                    self.by_capability[tag].append(agent.id)

            return True

    def unregister(self, agent_id: str) -> bool:
        """Unregister an agent."""
        with self._lock:
            if agent_id not in self.agents:
                return False

            agent = self.agents[agent_id]
            del self.agents[agent_id]

            self.by_category[agent.category].remove(agent_id)
            for capability in agent.capabilities:
                if agent_id in self.by_capability[capability.name]:
                    self.by_capability[capability.name].remove(agent_id)

            return True

    def get(self, agent_id: str) -> Optional[AgentDefinition]:
        """Get agent by ID."""
        return self.agents.get(agent_id)

    def find_by_capability(self, capability: str) -> list[AgentDefinition]:
        """Find agents with a specific capability."""
        agent_ids = self.by_capability.get(capability, [])
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def find_by_category(self, category: AgentCategory) -> list[AgentDefinition]:
        """Find agents in a category."""
        agent_ids = self.by_category.get(category, [])
        return [self.agents[aid] for aid in agent_ids if aid in self.agents]

    def get_available(self) -> list[AgentDefinition]:
        """Get all available (non-busy) agents."""
        return [
            agent for agent in self.agents.values()
            if agent.status not in [AgentStatus.BUSY, AgentStatus.ERROR, AgentStatus.OFFLINE]
        ]

    def update_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update agent status."""
        if agent_id in self.agents:
            self.agents[agent_id].status = status
            return True
        return False

    def get_stats(self) -> dict[str, Any]:
        """Get registry statistics."""
        status_counts = defaultdict(int)
        for agent in self.agents.values():
            status_counts[agent.status.value] += 1

        return {
            "total_agents": len(self.agents),
            "categories": {k.value: len(v) for k, v in self.by_category.items()},
            "capabilities": len(self.by_capability),
            "status_breakdown": dict(status_counts)
        }


class TaskScheduler:
    """Scheduler for task execution with priority queue."""

    def __init__(self, max_queue_size: int = 10000):
        self.max_queue_size = max_queue_size
        self._queue: list[tuple[int, float, str, TaskExecution]] = []  # (priority, timestamp, id, task)
        self._tasks: dict[str, TaskExecution] = {}
        self._running: dict[str, TaskExecution] = {}
        self._completed: dict[str, TaskExecution] = {}
        self._lock = threading.Lock()

    def submit(self, task: TaskDefinition) -> str:
        """Submit a task for execution."""
        with self._lock:
            if len(self._queue) >= self.max_queue_size:
                raise RuntimeError("Task queue is full")

            execution = TaskExecution(task=task)
            self._tasks[task.id] = execution

            # Priority queue entry: (priority_value, timestamp, id, execution)
            entry = (task.priority.value, time.time(), task.id, execution)
            heapq.heappush(self._queue, entry)

            return task.id

    def get_next(self) -> Optional[TaskExecution]:
        """Get next task to execute."""
        with self._lock:
            while self._queue:
                _, _, task_id, execution = heapq.heappop(self._queue)
                if execution.status == TaskStatus.QUEUED:
                    execution.status = TaskStatus.ASSIGNED
                    return execution
            return None

    def start_task(self, task_id: str, agent_id: str) -> bool:
        """Mark task as started."""
        with self._lock:
            if task_id in self._tasks:
                execution = self._tasks[task_id]
                execution.status = TaskStatus.RUNNING
                execution.assigned_agent = agent_id
                execution.started_at = datetime.now()
                self._running[task_id] = execution
                return True
            return False

    def complete_task(self, task_id: str, result: Any, tokens_used: int = 0) -> bool:
        """Mark task as completed."""
        with self._lock:
            if task_id in self._running:
                execution = self._running.pop(task_id)
                execution.status = TaskStatus.COMPLETED
                execution.completed_at = datetime.now()
                execution.result = result
                execution.tokens_used = tokens_used
                self._completed[task_id] = execution
                return True
            return False

    def fail_task(self, task_id: str, error: str) -> bool:
        """Mark task as failed."""
        with self._lock:
            if task_id in self._running:
                execution = self._running.pop(task_id)
                execution.retry_count += 1

                if execution.retry_count < execution.task.max_retries:
                    # Re-queue for retry
                    execution.status = TaskStatus.RETRYING
                    execution.error = error
                    entry = (
                        execution.task.priority.value,
                        time.time(),
                        task_id,
                        execution
                    )
                    heapq.heappush(self._queue, entry)
                else:
                    execution.status = TaskStatus.FAILED
                    execution.completed_at = datetime.now()
                    execution.error = error
                    self._completed[task_id] = execution

                return True
            return False

    def cancel_task(self, task_id: str) -> bool:
        """Cancel a task."""
        with self._lock:
            if task_id in self._tasks:
                execution = self._tasks[task_id]
                execution.status = TaskStatus.CANCELLED
                execution.completed_at = datetime.now()
                self._completed[task_id] = execution

                if task_id in self._running:
                    del self._running[task_id]

                return True
            return False

    def get_task(self, task_id: str) -> Optional[TaskExecution]:
        """Get task execution by ID."""
        return self._tasks.get(task_id) or self._completed.get(task_id)

    def get_queue_depth(self) -> int:
        """Get current queue depth."""
        return len(self._queue)

    def get_running_count(self) -> int:
        """Get number of running tasks."""
        return len(self._running)

    def get_stats(self) -> dict[str, Any]:
        """Get scheduler statistics."""
        completed = list(self._completed.values())
        successful = [t for t in completed if t.status == TaskStatus.COMPLETED]
        failed = [t for t in completed if t.status == TaskStatus.FAILED]

        latencies = [
            t.duration_seconds for t in successful
            if t.duration_seconds is not None
        ]

        return {
            "queue_depth": len(self._queue),
            "running": len(self._running),
            "completed": len(successful),
            "failed": len(failed),
            "avg_latency_ms": (sum(latencies) / len(latencies) * 1000) if latencies else 0,
            "total_tokens": sum(t.tokens_used for t in completed)
        }


class IntelligentRouter:
    """Intelligent request router for agent selection."""

    def __init__(self, registry: AgentRegistry, strategy: RoutingStrategy = RoutingStrategy.CAPABILITY_MATCH):
        self.registry = registry
        self.strategy = strategy
        self._round_robin_index: dict[str, int] = defaultdict(int)
        self._agent_load: dict[str, int] = defaultdict(int)
        self._affinity_map: dict[str, str] = {}  # task_type -> preferred_agent

    def route(self, task: TaskDefinition) -> Optional[AgentDefinition]:
        """Route a task to the best agent."""
        candidates = self._find_candidates(task)
        if not candidates:
            return None

        if self.strategy == RoutingStrategy.ROUND_ROBIN:
            return self._route_round_robin(candidates, task)
        elif self.strategy == RoutingStrategy.LEAST_LOADED:
            return self._route_least_loaded(candidates)
        elif self.strategy == RoutingStrategy.CAPABILITY_MATCH:
            return self._route_capability_match(candidates, task)
        elif self.strategy == RoutingStrategy.AFFINITY:
            return self._route_affinity(candidates, task)
        elif self.strategy == RoutingStrategy.PRIORITY:
            return self._route_priority(candidates, task)
        else:
            # Random fallback
            import random
            return random.choice(candidates)

    def _find_candidates(self, task: TaskDefinition) -> list[AgentDefinition]:
        """Find candidate agents for a task."""
        candidates = []
        for capability in task.required_capabilities:
            agents = self.registry.find_by_capability(capability)
            candidates.extend(agents)

        # Remove duplicates and filter available
        seen = set()
        unique = []
        for agent in candidates:
            if agent.id not in seen and agent.status not in [AgentStatus.BUSY, AgentStatus.OFFLINE]:
                seen.add(agent.id)
                unique.append(agent)

        return unique

    def _route_round_robin(self, candidates: list[AgentDefinition], task: TaskDefinition) -> AgentDefinition:
        """Round-robin routing."""
        key = ",".join(task.required_capabilities)
        index = self._round_robin_index[key] % len(candidates)
        self._round_robin_index[key] += 1
        return candidates[index]

    def _route_least_loaded(self, candidates: list[AgentDefinition]) -> AgentDefinition:
        """Route to least loaded agent."""
        return min(candidates, key=lambda a: self._agent_load.get(a.id, 0))

    def _route_capability_match(self, candidates: list[AgentDefinition], task: TaskDefinition) -> AgentDefinition:
        """Route to agent with best capability match."""
        def score_agent(agent: AgentDefinition) -> float:
            scores = [
                agent.get_capability_score(cap)
                for cap in task.required_capabilities
            ]
            return sum(scores) / len(scores) if scores else 0.0

        return max(candidates, key=score_agent)

    def _route_affinity(self, candidates: list[AgentDefinition], task: TaskDefinition) -> AgentDefinition:
        """Route based on task affinity."""
        task_type = task.metadata.get("type", "default")
        preferred = self._affinity_map.get(task_type)

        if preferred:
            for agent in candidates:
                if agent.id == preferred:
                    return agent

        # Fall back to capability match
        return self._route_capability_match(candidates, task)

    def _route_priority(self, candidates: list[AgentDefinition], task: TaskDefinition) -> AgentDefinition:
        """Route based on agent priority weight."""
        return max(candidates, key=lambda a: a.priority_weight)

    def update_load(self, agent_id: str, delta: int):
        """Update agent load."""
        self._agent_load[agent_id] = max(0, self._agent_load.get(agent_id, 0) + delta)

    def set_affinity(self, task_type: str, agent_id: str):
        """Set task affinity to an agent."""
        self._affinity_map[task_type] = agent_id


class ResourceManager:
    """Manager for system resources."""

    def __init__(self):
        self.pools: dict[ResourceType, ResourcePool] = {}
        self._init_default_pools()

    def _init_default_pools(self):
        """Initialize default resource pools."""
        defaults = {
            ResourceType.TOKEN_BUDGET: 1000000,
            ResourceType.CONTEXT_SLOTS: 100,
            ResourceType.MEMORY_MB: 8192,
            ResourceType.COMPUTE_UNITS: 1000,
            ResourceType.API_CALLS: 10000
        }

        for resource_type, capacity in defaults.items():
            self.pools[resource_type] = ResourcePool(
                resource_type=resource_type,
                total_capacity=capacity,
                available=capacity
            )

    def allocate(
        self,
        resource_type: ResourceType,
        amount: int,
        to: str,
        ttl_seconds: Optional[float] = None
    ) -> bool:
        """Allocate resources."""
        if resource_type not in self.pools:
            return False
        return self.pools[resource_type].allocate(amount, to, ttl_seconds)

    def release(self, resource_type: ResourceType, allocation_id: str) -> int:
        """Release allocated resources."""
        if resource_type not in self.pools:
            return 0
        return self.pools[resource_type].release(allocation_id)

    def release_all(self, allocation_id: str) -> dict[ResourceType, int]:
        """Release all resources for an allocation."""
        released = {}
        for resource_type, pool in self.pools.items():
            amount = pool.release(allocation_id)
            if amount > 0:
                released[resource_type] = amount
        return released

    def get_available(self, resource_type: ResourceType) -> int:
        """Get available resources."""
        if resource_type in self.pools:
            return self.pools[resource_type].available
        return 0

    def get_utilization(self, resource_type: ResourceType) -> float:
        """Get resource utilization percentage."""
        if resource_type in self.pools:
            pool = self.pools[resource_type]
            used = pool.total_capacity - pool.available
            return used / pool.total_capacity if pool.total_capacity > 0 else 0.0
        return 0.0

    def cleanup_expired(self) -> dict[ResourceType, int]:
        """Clean up expired allocations across all pools."""
        released = {}
        for resource_type, pool in self.pools.items():
            amount = pool.cleanup_expired()
            if amount > 0:
                released[resource_type] = amount
        return released

    def get_stats(self) -> dict[str, Any]:
        """Get resource statistics."""
        return {
            resource_type.value: {
                "total": pool.total_capacity,
                "available": pool.available,
                "utilization": self.get_utilization(resource_type),
                "allocations": len(pool.allocations)
            }
            for resource_type, pool in self.pools.items()
        }


class ContextManager:
    """Manager for execution contexts."""

    def __init__(self, max_contexts: int = 1000):
        self.max_contexts = max_contexts
        self.contexts: dict[str, ContextState] = {}
        self.global_context: ContextState = ContextState(
            id="global",
            scope=ContextScope.GLOBAL,
            data={}
        )
        self._lock = threading.Lock()

    def create(
        self,
        scope: ContextScope,
        data: Optional[dict] = None,
        parent_id: Optional[str] = None,
        ttl_seconds: Optional[float] = None
    ) -> ContextState:
        """Create a new context."""
        with self._lock:
            if len(self.contexts) >= self.max_contexts:
                self._cleanup_oldest()

            context = ContextState(
                id=str(uuid.uuid4()),
                scope=scope,
                data=data or {},
                parent_id=parent_id,
                ttl_seconds=ttl_seconds
            )
            self.contexts[context.id] = context
            return context

    def get(self, context_id: str) -> Optional[ContextState]:
        """Get a context by ID."""
        if context_id == "global":
            return self.global_context
        return self.contexts.get(context_id)

    def update(self, context_id: str, data: dict[str, Any]) -> bool:
        """Update context data."""
        context = self.get(context_id)
        if context:
            for key, value in data.items():
                context.set(key, value)
            return True
        return False

    def delete(self, context_id: str) -> bool:
        """Delete a context."""
        with self._lock:
            if context_id in self.contexts:
                del self.contexts[context_id]
                return True
            return False

    def get_with_inheritance(self, context_id: str, key: str, default: Any = None) -> Any:
        """Get value with parent context inheritance."""
        context = self.get(context_id)
        while context:
            value = context.get(key)
            if value is not None:
                return value
            if context.parent_id:
                context = self.get(context.parent_id)
            else:
                break

        # Fall back to global context
        return self.global_context.get(key, default)

    def _cleanup_oldest(self):
        """Clean up oldest contexts."""
        # Remove expired first
        expired = [cid for cid, ctx in self.contexts.items() if ctx.is_expired]
        for cid in expired:
            del self.contexts[cid]

        # If still over limit, remove least recently accessed
        if len(self.contexts) >= self.max_contexts:
            sorted_contexts = sorted(
                self.contexts.items(),
                key=lambda x: x[1].last_accessed
            )
            to_remove = len(self.contexts) - self.max_contexts + 100
            for cid, _ in sorted_contexts[:to_remove]:
                del self.contexts[cid]

    def get_stats(self) -> dict[str, Any]:
        """Get context statistics."""
        by_scope = defaultdict(int)
        for ctx in self.contexts.values():
            by_scope[ctx.scope.value] += 1

        return {
            "total_contexts": len(self.contexts),
            "by_scope": dict(by_scope),
            "global_keys": len(self.global_context.data)
        }


class CacheManager:
    """Manager for system caching."""

    def __init__(
        self,
        max_entries: int = 10000,
        max_size_mb: int = 512,
        strategy: CacheStrategy = CacheStrategy.LRU
    ):
        self.max_entries = max_entries
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.strategy = strategy
        self.entries: dict[str, CacheEntry] = {}
        self.current_size = 0
        self._lock = threading.Lock()
        self._hits = 0
        self._misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        with self._lock:
            entry = self.entries.get(key)
            if entry:
                if entry.is_expired:
                    self._remove_entry(key)
                    self._misses += 1
                    return None
                entry.touch()
                self._hits += 1
                return entry.value
            self._misses += 1
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: Optional[float] = None
    ) -> bool:
        """Set value in cache."""
        with self._lock:
            # Estimate size
            size = len(str(value).encode())

            # Evict if necessary
            while (
                len(self.entries) >= self.max_entries or
                self.current_size + size > self.max_size_bytes
            ):
                if not self._evict_one():
                    return False

            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(),
                last_accessed=datetime.now(),
                ttl_seconds=ttl_seconds,
                size_bytes=size
            )

            # Remove old entry if exists
            if key in self.entries:
                self._remove_entry(key)

            self.entries[key] = entry
            self.current_size += size
            return True

    def delete(self, key: str) -> bool:
        """Delete from cache."""
        with self._lock:
            if key in self.entries:
                self._remove_entry(key)
                return True
            return False

    def clear(self):
        """Clear entire cache."""
        with self._lock:
            self.entries.clear()
            self.current_size = 0

    def _remove_entry(self, key: str):
        """Remove entry without locking."""
        if key in self.entries:
            entry = self.entries[key]
            self.current_size -= entry.size_bytes
            del self.entries[key]

    def _evict_one(self) -> bool:
        """Evict one entry based on strategy."""
        if not self.entries:
            return False

        if self.strategy == CacheStrategy.LRU:
            # Evict least recently used
            oldest = min(self.entries.values(), key=lambda e: e.last_accessed)
            self._remove_entry(oldest.key)
        elif self.strategy == CacheStrategy.LFU:
            # Evict least frequently used
            least_used = min(self.entries.values(), key=lambda e: e.access_count)
            self._remove_entry(least_used.key)
        elif self.strategy == CacheStrategy.TTL:
            # Evict expired or oldest
            expired = [e for e in self.entries.values() if e.is_expired]
            if expired:
                self._remove_entry(expired[0].key)
            else:
                oldest = min(self.entries.values(), key=lambda e: e.created_at)
                self._remove_entry(oldest.key)
        else:
            # Remove first entry
            key = next(iter(self.entries))
            self._remove_entry(key)

        return True

    def get_stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        total = self._hits + self._misses
        return {
            "entries": len(self.entries),
            "size_mb": self.current_size / (1024 * 1024),
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self._hits / total if total > 0 else 0.0
        }


class PerformanceOptimizer:
    """Optimizer for system performance."""

    def __init__(
        self,
        scheduler: TaskScheduler,
        resources: ResourceManager,
        cache: CacheManager,
        goal: OptimizationGoal = OptimizationGoal.BALANCED
    ):
        self.scheduler = scheduler
        self.resources = resources
        self.cache = cache
        self.goal = goal
        self.optimization_history: list[OptimizationResult] = []

    def optimize(self) -> OptimizationResult:
        """Run optimization based on goal."""
        metrics_before = self._collect_metrics()
        actions = []

        if self.goal == OptimizationGoal.LATENCY:
            actions.extend(self._optimize_latency())
        elif self.goal == OptimizationGoal.THROUGHPUT:
            actions.extend(self._optimize_throughput())
        elif self.goal == OptimizationGoal.COST:
            actions.extend(self._optimize_cost())
        elif self.goal == OptimizationGoal.QUALITY:
            actions.extend(self._optimize_quality())
        else:
            # Balanced optimization
            actions.extend(self._optimize_balanced())

        metrics_after = self._collect_metrics()

        # Calculate improvement
        improvement = self._calculate_improvement(metrics_before, metrics_after)

        result = OptimizationResult(
            goal=self.goal,
            actions_taken=actions,
            metrics_before=metrics_before,
            metrics_after=metrics_after,
            improvement_percent=improvement,
            timestamp=datetime.now()
        )

        self.optimization_history.append(result)
        return result

    def _collect_metrics(self) -> dict[str, float]:
        """Collect current metrics."""
        scheduler_stats = self.scheduler.get_stats()
        cache_stats = self.cache.get_stats()

        return {
            "queue_depth": scheduler_stats["queue_depth"],
            "avg_latency_ms": scheduler_stats["avg_latency_ms"],
            "cache_hit_rate": cache_stats["hit_rate"],
            "token_usage": scheduler_stats["total_tokens"],
            "memory_mb": cache_stats["size_mb"]
        }

    def _optimize_latency(self) -> list[str]:
        """Optimize for latency."""
        actions = []

        # Increase cache size if hit rate is low
        cache_stats = self.cache.get_stats()
        if cache_stats["hit_rate"] < 0.5:
            self.cache.max_entries = int(self.cache.max_entries * 1.2)
            actions.append("Increased cache capacity by 20%")

        # Clean up expired resources
        released = self.resources.cleanup_expired()
        if released:
            actions.append(f"Released {len(released)} expired resource allocations")

        return actions

    def _optimize_throughput(self) -> list[str]:
        """Optimize for throughput."""
        actions = []

        # Increase parallelism capacity
        if self.scheduler.get_queue_depth() > 100:
            actions.append("High queue depth detected - consider scaling")

        return actions

    def _optimize_cost(self) -> list[str]:
        """Optimize for cost."""
        actions = []

        # Reduce cache to minimum effective size
        cache_stats = self.cache.get_stats()
        if cache_stats["hit_rate"] > 0.9 and cache_stats["entries"] > 1000:
            # Can reduce cache
            actions.append("Cache highly effective - maintaining size")

        # Release unused resources
        released = self.resources.cleanup_expired()
        if released:
            actions.append(f"Released unused resources: {released}")

        return actions

    def _optimize_quality(self) -> list[str]:
        """Optimize for quality."""
        actions = []

        # Ensure sufficient resources for quality
        for resource_type in ResourceType:
            util = self.resources.get_utilization(resource_type)
            if util > 0.9:
                actions.append(f"High {resource_type.value} utilization - may impact quality")

        return actions

    def _optimize_balanced(self) -> list[str]:
        """Balanced optimization across all goals."""
        actions = []
        actions.extend(self._optimize_latency())
        actions.extend(self._optimize_cost())
        return list(set(actions))  # Remove duplicates

    def _calculate_improvement(
        self,
        before: dict[str, float],
        after: dict[str, float]
    ) -> float:
        """Calculate improvement percentage."""
        improvements = []

        # Lower latency is better
        if before.get("avg_latency_ms", 0) > 0:
            latency_improvement = (
                (before["avg_latency_ms"] - after.get("avg_latency_ms", 0)) /
                before["avg_latency_ms"] * 100
            )
            improvements.append(latency_improvement)

        # Higher cache hit rate is better
        if after.get("cache_hit_rate", 0) > before.get("cache_hit_rate", 0):
            improvements.append(
                (after["cache_hit_rate"] - before["cache_hit_rate"]) * 100
            )

        return sum(improvements) / len(improvements) if improvements else 0.0


class HealthMonitor:
    """Monitor for system health."""

    def __init__(
        self,
        registry: AgentRegistry,
        scheduler: TaskScheduler,
        resources: ResourceManager
    ):
        self.registry = registry
        self.scheduler = scheduler
        self.resources = resources
        self.check_history: list[HealthCheck] = []

    def check_all(self) -> list[HealthCheck]:
        """Run all health checks."""
        checks = []
        checks.append(self._check_agents())
        checks.append(self._check_scheduler())
        checks.append(self._check_resources())

        self.check_history.extend(checks)
        return checks

    def _check_agents(self) -> HealthCheck:
        """Check agent health."""
        stats = self.registry.get_stats()
        status_breakdown = stats.get("status_breakdown", {})

        total = stats.get("total_agents", 0)
        healthy = status_breakdown.get("idle", 0) + status_breakdown.get("active", 0)
        error_count = status_breakdown.get("error", 0) + status_breakdown.get("offline", 0)

        if total == 0:
            status = HealthStatus.UNHEALTHY
            message = "No agents registered"
        elif error_count > total * 0.5:
            status = HealthStatus.CRITICAL
            message = f"{error_count}/{total} agents in error state"
        elif error_count > 0:
            status = HealthStatus.DEGRADED
            message = f"{error_count} agents have issues"
        else:
            status = HealthStatus.HEALTHY
            message = f"All {total} agents healthy"

        return HealthCheck(
            component="agents",
            status=status,
            message=message,
            checked_at=datetime.now(),
            details=stats
        )

    def _check_scheduler(self) -> HealthCheck:
        """Check scheduler health."""
        stats = self.scheduler.get_stats()
        queue_depth = stats.get("queue_depth", 0)
        failed = stats.get("failed", 0)
        completed = stats.get("completed", 0)

        failure_rate = failed / (failed + completed) if (failed + completed) > 0 else 0

        if queue_depth > 1000:
            status = HealthStatus.CRITICAL
            message = f"Queue backlog critical: {queue_depth} tasks"
        elif failure_rate > 0.1:
            status = HealthStatus.DEGRADED
            message = f"High failure rate: {failure_rate:.1%}"
        elif queue_depth > 100:
            status = HealthStatus.DEGRADED
            message = f"Queue building up: {queue_depth} tasks"
        else:
            status = HealthStatus.HEALTHY
            message = "Scheduler operating normally"

        return HealthCheck(
            component="scheduler",
            status=status,
            message=message,
            checked_at=datetime.now(),
            details=stats
        )

    def _check_resources(self) -> HealthCheck:
        """Check resource health."""
        stats = self.resources.get_stats()

        critical_resources = []
        degraded_resources = []

        for resource_name, resource_stats in stats.items():
            utilization = resource_stats.get("utilization", 0)
            if utilization > 0.95:
                critical_resources.append(resource_name)
            elif utilization > 0.8:
                degraded_resources.append(resource_name)

        if critical_resources:
            status = HealthStatus.CRITICAL
            message = f"Critical resources: {', '.join(critical_resources)}"
        elif degraded_resources:
            status = HealthStatus.DEGRADED
            message = f"High utilization: {', '.join(degraded_resources)}"
        else:
            status = HealthStatus.HEALTHY
            message = "Resource utilization normal"

        return HealthCheck(
            component="resources",
            status=status,
            message=message,
            checked_at=datetime.now(),
            details=stats
        )

    def get_overall_status(self) -> HealthStatus:
        """Get overall system health status."""
        checks = self.check_all()

        if any(c.status == HealthStatus.CRITICAL for c in checks):
            return HealthStatus.CRITICAL
        if any(c.status == HealthStatus.UNHEALTHY for c in checks):
            return HealthStatus.UNHEALTHY
        if any(c.status == HealthStatus.DEGRADED for c in checks):
            return HealthStatus.DEGRADED
        return HealthStatus.HEALTHY


class MurphbeckEngine:
    """Main orchestration engine for Murphbeck system."""

    def __init__(self, workspace: Optional[Path] = None):
        self.workspace = workspace or Path.cwd() / ".murphbeck"
        self.workspace.mkdir(parents=True, exist_ok=True)

        # Core components
        self.registry = AgentRegistry()
        self.scheduler = TaskScheduler()
        self.router = IntelligentRouter(self.registry)
        self.resources = ResourceManager()
        self.contexts = ContextManager()
        self.cache = CacheManager()
        self.optimizer = PerformanceOptimizer(
            self.scheduler, self.resources, self.cache
        )
        self.health = HealthMonitor(
            self.registry, self.scheduler, self.resources
        )

        # Event handlers
        self.event_handlers: dict[EventType, list[Callable]] = defaultdict(list)
        self.event_log: list[SystemEvent] = []

        # Session state
        self.session_id = str(uuid.uuid4())
        self.started_at = datetime.now()

        # Initialize default agents
        self._register_default_agents()

    def _register_default_agents(self):
        """Register default system agents."""
        default_agents = [
            AgentDefinition(
                id="launch-scout",
                name="Scout Agent",
                category=AgentCategory.LAUNCH,
                description="Research and intelligence discovery",
                capabilities=[
                    AgentCapability("research", "Research topics", 0.9, ["discovery", "analysis"]),
                    AgentCapability("intelligence", "Gather intelligence", 0.85, ["data", "insights"])
                ]
            ),
            AgentDefinition(
                id="launch-forge",
                name="Forge Agent",
                category=AgentCategory.LAUNCH,
                description="Creation and manufacturing",
                capabilities=[
                    AgentCapability("create", "Create artifacts", 0.9, ["build", "generate"]),
                    AgentCapability("template", "Template processing", 0.85, ["scaffold"])
                ]
            ),
            AgentDefinition(
                id="launch-aegis",
                name="Aegis Agent",
                category=AgentCategory.LAUNCH,
                description="Security and protection",
                capabilities=[
                    AgentCapability("security", "Security analysis", 0.9, ["protect", "audit"]),
                    AgentCapability("compliance", "Compliance checking", 0.85, ["validate"])
                ]
            ),
            AgentDefinition(
                id="wake-sales",
                name="Sales Agent",
                category=AgentCategory.WAKE,
                description="Sales and revenue operations",
                capabilities=[
                    AgentCapability("sales", "Sales operations", 0.9, ["revenue", "deals"]),
                    AgentCapability("crm", "CRM management", 0.8, ["contacts"])
                ]
            )
        ]

        for agent in default_agents:
            self.registry.register(agent)

    def submit_task(
        self,
        name: str,
        description: str,
        capabilities: list[str],
        priority: TaskPriority = TaskPriority.NORMAL,
        payload: Optional[dict] = None,
        timeout: float = 300.0
    ) -> str:
        """Submit a task for execution."""
        task = TaskDefinition(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            required_capabilities=capabilities,
            priority=priority,
            payload=payload or {},
            timeout_seconds=timeout
        )

        task_id = self.scheduler.submit(task)
        self._emit_event(EventType.TASK_SUBMITTED, {"task_id": task_id, "name": name})

        return task_id

    async def execute_next(self) -> Optional[TaskExecution]:
        """Execute next task in queue."""
        execution = self.scheduler.get_next()
        if not execution:
            return None

        # Route to best agent
        agent = self.router.route(execution.task)
        if not agent:
            self.scheduler.fail_task(execution.task.id, "No suitable agent found")
            return execution

        # Allocate resources
        self.resources.allocate(
            ResourceType.TOKEN_BUDGET,
            agent.token_budget,
            execution.task.id,
            execution.task.timeout_seconds
        )

        # Start execution
        self.scheduler.start_task(execution.task.id, agent.id)
        self.registry.update_status(agent.id, AgentStatus.BUSY)
        self.router.update_load(agent.id, 1)

        try:
            # Simulate execution
            await asyncio.sleep(0.1)
            result = {"status": "completed", "agent": agent.id}

            # Complete task
            self.scheduler.complete_task(execution.task.id, result, tokens_used=1000)
            self._emit_event(EventType.TASK_COMPLETED, {
                "task_id": execution.task.id,
                "agent_id": agent.id
            })

        except Exception as e:
            self.scheduler.fail_task(execution.task.id, str(e))
            self._emit_event(EventType.TASK_FAILED, {
                "task_id": execution.task.id,
                "error": str(e)
            })

        finally:
            self.registry.update_status(agent.id, AgentStatus.IDLE)
            self.router.update_load(agent.id, -1)
            self.resources.release_all(execution.task.id)

        return self.scheduler.get_task(execution.task.id)

    def _emit_event(self, event_type: EventType, data: dict):
        """Emit a system event."""
        event = SystemEvent(
            id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.now(),
            source="murphbeck-engine",
            data=data
        )
        self.event_log.append(event)

        for handler in self.event_handlers.get(event_type, []):
            try:
                handler(event)
            except Exception:
                pass

    def on_event(self, event_type: EventType, handler: Callable):
        """Register event handler."""
        self.event_handlers[event_type].append(handler)

    def get_status(self) -> dict[str, Any]:
        """Get comprehensive system status."""
        uptime = (datetime.now() - self.started_at).total_seconds()
        health_status = self.health.get_overall_status()

        return {
            "session_id": self.session_id,
            "uptime_seconds": uptime,
            "health": health_status.value,
            "agents": self.registry.get_stats(),
            "scheduler": self.scheduler.get_stats(),
            "resources": self.resources.get_stats(),
            "contexts": self.contexts.get_stats(),
            "cache": self.cache.get_stats()
        }

    def optimize(self) -> OptimizationResult:
        """Run system optimization."""
        result = self.optimizer.optimize()
        self._emit_event(EventType.OPTIMIZATION_RUN, {
            "goal": result.goal.value,
            "improvement": result.improvement_percent
        })
        return result


class MurphbeckReporter:
    """Reporter for Murphbeck system status."""

    STATUS_ICONS = {
        HealthStatus.HEALTHY: "●",
        HealthStatus.DEGRADED: "◐",
        HealthStatus.UNHEALTHY: "○",
        HealthStatus.CRITICAL: "✗",
        AgentStatus.IDLE: "○",
        AgentStatus.ACTIVE: "●",
        AgentStatus.BUSY: "◉",
        AgentStatus.ERROR: "✗",
        AgentStatus.OFFLINE: "◌"
    }

    @classmethod
    def generate_report(cls, engine: MurphbeckEngine) -> str:
        """Generate comprehensive status report."""
        status = engine.get_status()
        health_status = HealthStatus(status["health"])
        health_icon = cls.STATUS_ICONS.get(health_status, "?")

        # Build progress bars
        def progress_bar(value: float, width: int = 10) -> str:
            filled = int(value * width)
            return "█" * filled + "░" * (width - filled)

        # Get resource utilizations
        resource_bars = []
        for resource, stats in status["resources"].items():
            util = stats.get("utilization", 0)
            bar = progress_bar(util)
            resource_bars.append(f"│  {resource:<16} {bar} {util*100:>5.1f}%     │")

        report = f"""
MURPHBECK SYSTEM STATUS
═══════════════════════════════════════
Session: {status['session_id'][:8]}...
Uptime: {status['uptime_seconds']:.0f}s
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════

SYSTEM OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       MURPHBECK CONTROL             │
│                                     │
│  Status: {health_icon} {health_status.value.upper():<24} │
│  Session: {status['session_id'][:24]:<24} │
│                                     │
│  Agents Online: {status['agents']['total_agents']:<19} │
│  Tasks Queued: {status['scheduler']['queue_depth']:<20} │
│  Tasks Running: {status['scheduler']['running']:<19} │
│                                     │
│  System Health: {progress_bar(0.8 if health_status == HealthStatus.HEALTHY else 0.5)} {8 if health_status == HealthStatus.HEALTHY else 5}/10  │
└─────────────────────────────────────┘

AGENT STATUS
────────────────────────────────────
| Category     | Count | Active |
|--------------|-------|--------|"""

        for category, count in status['agents'].get('categories', {}).items():
            report += f"\n| {category:<12} | {count:<5} | {cls.STATUS_ICONS[AgentStatus.ACTIVE]} {'Yes':<5} |"

        report += f"""

RESOURCE UTILIZATION
────────────────────────────────────
┌─────────────────────────────────────┐
"""
        for bar_line in resource_bars:
            report += bar_line + "\n"

        report += f"""└─────────────────────────────────────┘

PERFORMANCE METRICS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Tasks Completed: {status['scheduler']['completed']:<17} │
│  Tasks Failed: {status['scheduler']['failed']:<20} │
│  Avg Latency: {status['scheduler']['avg_latency_ms']:.1f}ms{' ' * 17} │
│                                     │
│  Cache Entries: {status['cache']['entries']:<19} │
│  Cache Hit Rate: {status['cache']['hit_rate']*100:.1f}%{' ' * 15} │
│  Memory Used: {status['cache']['size_mb']:.1f}MB{' ' * 17} │
│                                     │
│  Contexts Active: {status['contexts']['total_contexts']:<17} │
│  Tokens Used: {status['scheduler']['total_tokens']:<21} │
└─────────────────────────────────────┘

QUICK ACTIONS
────────────────────────────────────
| Action | Command |
|--------|---------|
| Submit Task | murphbeck submit <task> |
| Check Status | murphbeck status |
| List Agents | murphbeck agents |
| Optimize | murphbeck optimize |
| Health Check | murphbeck health |

System Status: {health_icon} Murphbeck {'Operational' if health_status == HealthStatus.HEALTHY else 'Degraded'}
"""
        return report


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

async def main():
    """CLI entry point for MURPHBECK.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="MURPHBECK.EXE - Master Control & Orchestration Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "--workspace", "-w",
        default="./.murphbeck",
        help="Workspace directory"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # status command
    status_parser = subparsers.add_parser("status", help="Show system status")
    status_parser.add_argument("--json", action="store_true", help="JSON output")

    # agents command
    agents_parser = subparsers.add_parser("agents", help="List agents")
    agents_parser.add_argument("--category", "-c", help="Filter by category")

    # submit command
    submit_parser = subparsers.add_parser("submit", help="Submit a task")
    submit_parser.add_argument("name", help="Task name")
    submit_parser.add_argument("--description", "-d", default="", help="Task description")
    submit_parser.add_argument("--capability", "-c", action="append", default=[], help="Required capability")
    submit_parser.add_argument("--priority", "-p", default="normal", choices=["critical", "high", "normal", "low", "background"])

    # optimize command
    optimize_parser = subparsers.add_parser("optimize", help="Run optimization")
    optimize_parser.add_argument("--goal", "-g", default="balanced", choices=["latency", "throughput", "cost", "quality", "balanced"])

    # health command
    health_parser = subparsers.add_parser("health", help="Run health checks")

    # run command
    run_parser = subparsers.add_parser("run", help="Run task queue")
    run_parser.add_argument("--count", "-n", type=int, default=1, help="Number of tasks to run")

    args = parser.parse_args()

    engine = MurphbeckEngine(workspace=Path(args.workspace))

    if args.command == "status":
        if args.json:
            print(json.dumps(engine.get_status(), indent=2, default=str))
        else:
            print(MurphbeckReporter.generate_report(engine))

    elif args.command == "agents":
        agents = engine.registry.agents.values()
        if args.category:
            category = AgentCategory(args.category)
            agents = [a for a in agents if a.category == category]

        print("\nRegistered Agents:")
        print("=" * 60)
        for agent in agents:
            status_icon = MurphbeckReporter.STATUS_ICONS.get(agent.status, "?")
            caps = ", ".join(agent.capability_names[:3])
            print(f"  {status_icon} {agent.name:<20} [{agent.category.value}] - {caps}")

    elif args.command == "submit":
        priority = TaskPriority[args.priority.upper()]
        capabilities = args.capability if args.capability else ["general"]

        task_id = engine.submit_task(
            name=args.name,
            description=args.description or f"Task: {args.name}",
            capabilities=capabilities,
            priority=priority
        )
        print(f"Task submitted: {task_id}")

    elif args.command == "optimize":
        goal = OptimizationGoal(args.goal)
        engine.optimizer.goal = goal
        result = engine.optimize()

        print(f"\nOptimization Complete ({result.goal.value})")
        print("=" * 40)
        print(f"Improvement: {result.improvement_percent:.1f}%")
        print("\nActions taken:")
        for action in result.actions_taken:
            print(f"  • {action}")

    elif args.command == "health":
        checks = engine.health.check_all()
        overall = engine.health.get_overall_status()

        print(f"\nSystem Health: {MurphbeckReporter.STATUS_ICONS.get(overall, '?')} {overall.value.upper()}")
        print("=" * 40)
        for check in checks:
            icon = MurphbeckReporter.STATUS_ICONS.get(check.status, "?")
            print(f"  {icon} {check.component}: {check.message}")

    elif args.command == "run":
        print(f"Running {args.count} task(s)...")
        for i in range(args.count):
            result = await engine.execute_next()
            if result:
                print(f"  [{i+1}] {result.task.name}: {result.status.value}")
            else:
                print(f"  [{i+1}] No tasks in queue")
                break

    else:
        print(MurphbeckReporter.generate_report(engine))


if __name__ == "__main__":
    asyncio.run(main())
```

---

## WORKFLOW

### Phase 1: ASSESS
1. Understand incoming request
2. Identify required capabilities
3. Map to available agents
4. Evaluate resource needs
5. Plan execution strategy

### Phase 2: ORCHESTRATE
1. Activate relevant agents
2. Coordinate handoffs
3. Manage context flow
4. Distribute workload
5. Monitor execution

### Phase 3: OPTIMIZE
1. Track performance metrics
2. Identify bottlenecks
3. Adjust resource allocation
4. Learn from patterns
5. Suggest improvements

### Phase 4: DELIVER
1. Synthesize agent outputs
2. Ensure quality standards
3. Format final results
4. Present to user
5. Gather feedback

---

## SYSTEM COMPONENTS

| Component | Count | Status |
|-----------|-------|--------|
| Launch Agents | 35+ | Active |
| Wake Modes | 10 | Ready |
| Project Contexts | 12 | Available |
| Utility Skills | 50+ | Online |
| OS Systems | 40+ | Operational |

---

## USAGE EXAMPLES

### Basic Status Check

```bash
# Show system status
python murphbeck.py status

# JSON output
python murphbeck.py status --json
```

### Agent Management

```bash
# List all agents
python murphbeck.py agents

# Filter by category
python murphbeck.py agents --category launch
```

### Task Submission

```bash
# Submit a task
python murphbeck.py submit "Research AI trends" \
    --capability research \
    --capability analysis \
    --priority high

# Submit with description
python murphbeck.py submit "Build API" \
    -d "Create REST API for user service" \
    -c create \
    -c code \
    -p normal
```

### System Optimization

```bash
# Run balanced optimization
python murphbeck.py optimize

# Optimize for latency
python murphbeck.py optimize --goal latency

# Optimize for cost
python murphbeck.py optimize --goal cost
```

### Health Monitoring

```bash
# Run health checks
python murphbeck.py health
```

### Programmatic Usage

```python
import asyncio
from murphbeck import MurphbeckEngine, TaskPriority

async def run_system():
    engine = MurphbeckEngine()

    # Submit tasks
    task_id = engine.submit_task(
        name="Analyze codebase",
        description="Perform security analysis",
        capabilities=["security", "analysis"],
        priority=TaskPriority.HIGH
    )

    # Execute tasks
    result = await engine.execute_next()
    print(f"Result: {result.status.value}")

    # Check health
    health = engine.health.get_overall_status()
    print(f"Health: {health.value}")

    # Optimize
    opt_result = engine.optimize()
    print(f"Optimization: {opt_result.improvement_percent:.1f}% improvement")

asyncio.run(run_system())
```

---

## QUICK COMMANDS

```bash
# System operations
murphbeck status                    # Show system status
murphbeck agents                    # List all agents
murphbeck agents -c launch          # List launch agents
murphbeck health                    # Run health checks
murphbeck optimize                  # Run optimization

# Task operations
murphbeck submit <name>             # Submit task
murphbeck run                       # Execute next task
murphbeck run -n 5                  # Execute 5 tasks
```

---

$ARGUMENTS
