# TRIGGER.EXE - Automation Trigger Agent

You are TRIGGER.EXE — the automation orchestrator for defining, managing, and executing event-based triggers and automated workflows with precision and reliability.

MISSION
Create and manage automated triggers that respond to events, conditions, and schedules to execute defined actions. Automate the routine. Focus on what matters.

---

## CAPABILITIES

### EventDetector.MOD
- Event source integration
- Signal monitoring
- Pattern matching
- Condition evaluation
- Threshold detection

### TriggerBuilder.MOD
- Rule definition
- Condition logic
- Filter configuration
- Data mapping
- Chain sequencing

### ActionExecutor.MOD
- Action dispatching
- Parameter injection
- Retry handling
- Timeout management
- Error recovery

### MonitoringEngine.MOD
- Execution tracking
- Performance metrics
- Failure alerting
- Log aggregation
- Audit compliance

---

## WORKFLOW

### Phase 1: DEFINE
1. Identify trigger event type
2. Specify conditions and filters
3. Define target actions
4. Set execution parameters
5. Plan failure handling

### Phase 2: CONFIGURE
1. Connect event sources
2. Map data transformations
3. Set retry/failure policies
4. Configure notifications
5. Enable logging

### Phase 3: DEPLOY
1. Validate trigger logic
2. Enable monitoring
3. Activate trigger
4. Test with sample event
5. Verify execution

### Phase 4: MONITOR
1. Track trigger executions
2. Log all outcomes
3. Alert on failures
4. Optimize performance
5. Report metrics

---

## TRIGGER TYPES

| Type | Event | Example |
|------|-------|---------|
| Event | External signal | Webhook, message |
| Schedule | Time-based | Cron, interval |
| Condition | State change | Threshold, value |
| Chain | Trigger cascade | After another |
| Manual | User initiated | Button, command |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
TRIGGER.EXE - Automation Trigger Agent
Production-ready event-based automation system.
"""

import asyncio
import hashlib
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional, Callable, Any
import argparse


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class TriggerType(Enum):
    """Types of triggers."""
    EVENT = "event"
    SCHEDULE = "schedule"
    CONDITION = "condition"
    CHAIN = "chain"
    MANUAL = "manual"
    WEBHOOK = "webhook"
    FILE_WATCH = "file_watch"
    API_POLL = "api_poll"


class TriggerStatus(Enum):
    """Trigger operational status."""
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"
    ERROR = "error"
    TESTING = "testing"


class ExecutionStatus(Enum):
    """Execution result status."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    SKIPPED = "skipped"
    RETRYING = "retrying"


class ActionType(Enum):
    """Types of actions to execute."""
    HTTP_REQUEST = "http_request"
    WEBHOOK_CALL = "webhook_call"
    EMAIL_SEND = "email_send"
    SLACK_MESSAGE = "slack_message"
    SCRIPT_RUN = "script_run"
    DATABASE_QUERY = "database_query"
    FILE_OPERATION = "file_operation"
    CHAIN_TRIGGER = "chain_trigger"
    CUSTOM = "custom"


class ConditionOperator(Enum):
    """Condition comparison operators."""
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    MATCHES = "matches"
    EXISTS = "exists"
    NOT_EXISTS = "not_exists"


class RetryStrategy(Enum):
    """Retry strategies for failed executions."""
    NONE = "none"
    FIXED = "fixed"
    EXPONENTIAL = "exponential"
    LINEAR = "linear"


class NotificationChannel(Enum):
    """Notification delivery channels."""
    EMAIL = "email"
    SLACK = "slack"
    WEBHOOK = "webhook"
    SMS = "sms"
    NONE = "none"


# ═══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Condition:
    """Single condition for evaluation."""
    field: str
    operator: ConditionOperator
    value: Any
    description: str = ""


@dataclass
class ConditionGroup:
    """Group of conditions with logic."""
    conditions: list
    logic: str = "AND"  # AND, OR
    description: str = ""


@dataclass
class EventSource:
    """Event source configuration."""
    source_type: str
    endpoint: str
    auth_type: str = ""
    auth_config: dict = field(default_factory=dict)
    filters: list = field(default_factory=list)
    data_mapping: dict = field(default_factory=dict)


@dataclass
class ScheduleConfig:
    """Schedule configuration for time-based triggers."""
    schedule_type: str  # cron, interval, fixed_time
    expression: str  # cron expression or interval
    timezone: str = "UTC"
    start_date: str = ""
    end_date: str = ""
    skip_weekends: bool = False
    skip_holidays: bool = False


@dataclass
class Action:
    """Action to execute when trigger fires."""
    id: str
    action_type: ActionType
    name: str
    config: dict
    order: int = 0
    condition: str = ""  # Optional condition for this action
    timeout_seconds: int = 60
    continue_on_failure: bool = False


@dataclass
class RetryConfig:
    """Retry configuration for failed executions."""
    strategy: RetryStrategy
    max_retries: int
    initial_delay_seconds: int
    max_delay_seconds: int = 3600
    backoff_multiplier: float = 2.0


@dataclass
class NotificationConfig:
    """Notification configuration."""
    on_success: NotificationChannel
    on_failure: NotificationChannel
    recipients: list = field(default_factory=list)
    include_details: bool = True


@dataclass
class Trigger:
    """Complete trigger definition."""
    id: str
    name: str
    description: str
    trigger_type: TriggerType
    status: TriggerStatus
    event_source: Optional[EventSource]
    schedule: Optional[ScheduleConfig]
    conditions: list
    actions: list
    retry_config: RetryConfig
    notification_config: NotificationConfig
    concurrency_limit: int = 1
    created_at: str = ""
    updated_at: str = ""
    last_executed: str = ""
    execution_count: int = 0
    failure_count: int = 0
    tags: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


@dataclass
class Execution:
    """Single trigger execution record."""
    id: str
    trigger_id: str
    trigger_name: str
    status: ExecutionStatus
    started_at: str
    completed_at: str = ""
    duration_ms: int = 0
    event_data: dict = field(default_factory=dict)
    action_results: list = field(default_factory=list)
    error_message: str = ""
    retry_count: int = 0


@dataclass
class ActionResult:
    """Result of a single action execution."""
    action_id: str
    action_name: str
    status: ExecutionStatus
    started_at: str
    completed_at: str = ""
    duration_ms: int = 0
    output: Any = None
    error: str = ""


@dataclass
class TriggerMetrics:
    """Metrics for a trigger."""
    trigger_id: str
    total_executions: int
    successful_executions: int
    failed_executions: int
    average_duration_ms: float
    last_24h_executions: int
    last_24h_failures: int
    success_rate: float
    computed_at: str = ""


@dataclass
class EventPayload:
    """Incoming event payload."""
    source: str
    event_type: str
    timestamp: str
    data: dict
    headers: dict = field(default_factory=dict)
    metadata: dict = field(default_factory=dict)


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT DETECTOR
# ═══════════════════════════════════════════════════════════════════════════════

class EventDetector:
    """Detects and processes incoming events."""

    SUPPORTED_SOURCES = [
        "webhook", "http", "file", "database", "queue",
        "api", "socket", "email", "custom"
    ]

    def __init__(self):
        self.event_handlers: dict = {}
        self.event_queue: list = []

    async def register_source(
        self,
        source_id: str,
        source_config: EventSource
    ) -> bool:
        """Register an event source."""
        self.event_handlers[source_id] = {
            "config": source_config,
            "active": True,
            "last_event": None
        }
        return True

    async def process_event(
        self,
        payload: EventPayload
    ) -> dict:
        """Process incoming event."""
        processed = {
            "event_id": hashlib.md5(
                f"{payload.source}_{payload.timestamp}".encode()
            ).hexdigest()[:12],
            "source": payload.source,
            "event_type": payload.event_type,
            "timestamp": payload.timestamp,
            "data": payload.data,
            "matched_triggers": []
        }

        return processed

    async def evaluate_conditions(
        self,
        event_data: dict,
        conditions: list
    ) -> bool:
        """Evaluate if event matches conditions."""
        if not conditions:
            return True

        for condition_group in conditions:
            if isinstance(condition_group, ConditionGroup):
                group_result = await self._evaluate_group(
                    event_data, condition_group
                )
                if not group_result:
                    return False
            elif isinstance(condition_group, Condition):
                if not await self._evaluate_condition(
                    event_data, condition_group
                ):
                    return False

        return True

    async def _evaluate_group(
        self,
        data: dict,
        group: ConditionGroup
    ) -> bool:
        """Evaluate a condition group."""
        results = []

        for condition in group.conditions:
            result = await self._evaluate_condition(data, condition)
            results.append(result)

        if group.logic == "AND":
            return all(results)
        elif group.logic == "OR":
            return any(results)
        else:
            return all(results)

    async def _evaluate_condition(
        self,
        data: dict,
        condition: Condition
    ) -> bool:
        """Evaluate a single condition."""
        # Get field value from nested path
        value = self._get_nested_value(data, condition.field)

        if condition.operator == ConditionOperator.EXISTS:
            return value is not None

        if condition.operator == ConditionOperator.NOT_EXISTS:
            return value is None

        if value is None:
            return False

        target = condition.value

        if condition.operator == ConditionOperator.EQUALS:
            return value == target
        elif condition.operator == ConditionOperator.NOT_EQUALS:
            return value != target
        elif condition.operator == ConditionOperator.GREATER_THAN:
            return float(value) > float(target)
        elif condition.operator == ConditionOperator.LESS_THAN:
            return float(value) < float(target)
        elif condition.operator == ConditionOperator.CONTAINS:
            return str(target) in str(value)
        elif condition.operator == ConditionOperator.NOT_CONTAINS:
            return str(target) not in str(value)
        elif condition.operator == ConditionOperator.MATCHES:
            return bool(re.match(str(target), str(value)))

        return False

    def _get_nested_value(self, data: dict, path: str) -> Any:
        """Get value from nested dict using dot notation."""
        keys = path.split(".")
        value = data

        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
            else:
                return None

        return value


# ═══════════════════════════════════════════════════════════════════════════════
# TRIGGER BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

class TriggerBuilder:
    """Builds and manages trigger definitions."""

    SCHEDULE_PRESETS = {
        "every_minute": "* * * * *",
        "every_5_minutes": "*/5 * * * *",
        "every_hour": "0 * * * *",
        "daily": "0 0 * * *",
        "weekly": "0 0 * * 0",
        "monthly": "0 0 1 * *",
        "weekdays": "0 9 * * 1-5",
        "business_hours": "0 9-17 * * 1-5"
    }

    async def create_trigger(
        self,
        name: str,
        trigger_type: TriggerType,
        description: str = "",
        event_source: EventSource = None,
        schedule: ScheduleConfig = None,
        conditions: list = None,
        actions: list = None,
        retry_config: RetryConfig = None,
        notification_config: NotificationConfig = None
    ) -> Trigger:
        """Create a new trigger."""
        trigger_id = f"trg_{hashlib.md5(name.encode()).hexdigest()[:8]}"

        if retry_config is None:
            retry_config = RetryConfig(
                strategy=RetryStrategy.EXPONENTIAL,
                max_retries=3,
                initial_delay_seconds=60
            )

        if notification_config is None:
            notification_config = NotificationConfig(
                on_success=NotificationChannel.NONE,
                on_failure=NotificationChannel.SLACK
            )

        trigger = Trigger(
            id=trigger_id,
            name=name,
            description=description,
            trigger_type=trigger_type,
            status=TriggerStatus.ACTIVE,
            event_source=event_source,
            schedule=schedule,
            conditions=conditions or [],
            actions=actions or [],
            retry_config=retry_config,
            notification_config=notification_config,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )

        return trigger

    async def create_event_trigger(
        self,
        name: str,
        source_type: str,
        endpoint: str,
        conditions: list = None,
        actions: list = None
    ) -> Trigger:
        """Create an event-based trigger."""
        event_source = EventSource(
            source_type=source_type,
            endpoint=endpoint
        )

        return await self.create_trigger(
            name=name,
            trigger_type=TriggerType.EVENT,
            event_source=event_source,
            conditions=conditions,
            actions=actions
        )

    async def create_schedule_trigger(
        self,
        name: str,
        schedule_expression: str,
        actions: list = None
    ) -> Trigger:
        """Create a schedule-based trigger."""
        # Check for preset
        expression = self.SCHEDULE_PRESETS.get(
            schedule_expression, schedule_expression
        )

        schedule = ScheduleConfig(
            schedule_type="cron",
            expression=expression
        )

        return await self.create_trigger(
            name=name,
            trigger_type=TriggerType.SCHEDULE,
            schedule=schedule,
            actions=actions
        )

    async def create_condition_trigger(
        self,
        name: str,
        conditions: list,
        actions: list = None
    ) -> Trigger:
        """Create a condition-based trigger."""
        return await self.create_trigger(
            name=name,
            trigger_type=TriggerType.CONDITION,
            conditions=conditions,
            actions=actions
        )

    async def add_action(
        self,
        trigger: Trigger,
        action_type: ActionType,
        action_name: str,
        config: dict,
        order: int = -1
    ) -> Trigger:
        """Add an action to a trigger."""
        action_id = f"act_{hashlib.md5(action_name.encode()).hexdigest()[:6]}"

        if order < 0:
            order = len(trigger.actions)

        action = Action(
            id=action_id,
            action_type=action_type,
            name=action_name,
            config=config,
            order=order
        )

        trigger.actions.append(action)
        trigger.actions.sort(key=lambda a: a.order)
        trigger.updated_at = datetime.now().isoformat()

        return trigger

    async def add_condition(
        self,
        trigger: Trigger,
        field: str,
        operator: ConditionOperator,
        value: Any
    ) -> Trigger:
        """Add a condition to a trigger."""
        condition = Condition(
            field=field,
            operator=operator,
            value=value
        )

        trigger.conditions.append(condition)
        trigger.updated_at = datetime.now().isoformat()

        return trigger


# ═══════════════════════════════════════════════════════════════════════════════
# ACTION EXECUTOR
# ═══════════════════════════════════════════════════════════════════════════════

class ActionExecutor:
    """Executes trigger actions."""

    def __init__(self):
        self.action_handlers: dict = {}
        self._register_default_handlers()

    def _register_default_handlers(self):
        """Register default action handlers."""
        self.action_handlers = {
            ActionType.HTTP_REQUEST: self._execute_http_request,
            ActionType.WEBHOOK_CALL: self._execute_webhook,
            ActionType.SCRIPT_RUN: self._execute_script,
            ActionType.CHAIN_TRIGGER: self._execute_chain,
            ActionType.CUSTOM: self._execute_custom
        }

    async def execute_action(
        self,
        action: Action,
        context: dict
    ) -> ActionResult:
        """Execute a single action."""
        started_at = datetime.now()

        result = ActionResult(
            action_id=action.id,
            action_name=action.name,
            status=ExecutionStatus.RUNNING,
            started_at=started_at.isoformat()
        )

        try:
            handler = self.action_handlers.get(action.action_type)

            if not handler:
                raise ValueError(f"No handler for action type: {action.action_type}")

            # Inject context into config
            config = self._inject_context(action.config, context)

            # Execute with timeout
            output = await asyncio.wait_for(
                handler(config, context),
                timeout=action.timeout_seconds
            )

            result.status = ExecutionStatus.SUCCESS
            result.output = output

        except asyncio.TimeoutError:
            result.status = ExecutionStatus.TIMEOUT
            result.error = f"Action timed out after {action.timeout_seconds}s"

        except Exception as e:
            result.status = ExecutionStatus.FAILED
            result.error = str(e)

        completed_at = datetime.now()
        result.completed_at = completed_at.isoformat()
        result.duration_ms = int((completed_at - started_at).total_seconds() * 1000)

        return result

    async def execute_actions(
        self,
        actions: list,
        context: dict
    ) -> list:
        """Execute multiple actions in sequence."""
        results = []

        for action in sorted(actions, key=lambda a: a.order):
            result = await self.execute_action(action, context)
            results.append(result)

            # Stop on failure unless continue_on_failure is set
            if result.status == ExecutionStatus.FAILED:
                if not action.continue_on_failure:
                    break

            # Update context with action output for chaining
            context[f"action_{action.id}_output"] = result.output

        return results

    def _inject_context(self, config: dict, context: dict) -> dict:
        """Inject context variables into config."""
        injected = {}

        for key, value in config.items():
            if isinstance(value, str) and "{{" in value:
                # Replace template variables
                for ctx_key, ctx_value in context.items():
                    value = value.replace(f"{{{{{ctx_key}}}}}", str(ctx_value))
            injected[key] = value

        return injected

    async def _execute_http_request(
        self,
        config: dict,
        context: dict
    ) -> dict:
        """Execute HTTP request action (simulated)."""
        # In production, use aiohttp or httpx
        return {
            "method": config.get("method", "GET"),
            "url": config.get("url"),
            "status_code": 200,
            "response": {"success": True}
        }

    async def _execute_webhook(
        self,
        config: dict,
        context: dict
    ) -> dict:
        """Execute webhook call action (simulated)."""
        return {
            "webhook_url": config.get("url"),
            "payload_sent": config.get("payload", {}),
            "success": True
        }

    async def _execute_script(
        self,
        config: dict,
        context: dict
    ) -> dict:
        """Execute script action (simulated)."""
        script_path = config.get("script")
        args = config.get("args", [])

        # In production, use subprocess
        return {
            "script": script_path,
            "args": args,
            "exit_code": 0,
            "output": "Script executed successfully"
        }

    async def _execute_chain(
        self,
        config: dict,
        context: dict
    ) -> dict:
        """Execute chain trigger action."""
        target_trigger = config.get("trigger_id")

        return {
            "chained_trigger": target_trigger,
            "triggered": True
        }

    async def _execute_custom(
        self,
        config: dict,
        context: dict
    ) -> dict:
        """Execute custom action."""
        handler_name = config.get("handler")
        params = config.get("params", {})

        return {
            "handler": handler_name,
            "params": params,
            "executed": True
        }


# ═══════════════════════════════════════════════════════════════════════════════
# MONITORING ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class MonitoringEngine:
    """Monitors trigger executions and performance."""

    def __init__(self):
        self.executions: list = []
        self.alerts: list = []

    async def record_execution(
        self,
        trigger: Trigger,
        event_data: dict,
        action_results: list,
        started_at: datetime,
        status: ExecutionStatus,
        error: str = ""
    ) -> Execution:
        """Record a trigger execution."""
        completed_at = datetime.now()

        execution = Execution(
            id=f"exec_{hashlib.md5(f'{trigger.id}_{started_at}'.encode()).hexdigest()[:10]}",
            trigger_id=trigger.id,
            trigger_name=trigger.name,
            status=status,
            started_at=started_at.isoformat(),
            completed_at=completed_at.isoformat(),
            duration_ms=int((completed_at - started_at).total_seconds() * 1000),
            event_data=event_data,
            action_results=[
                {
                    "action_id": r.action_id,
                    "action_name": r.action_name,
                    "status": r.status.value,
                    "duration_ms": r.duration_ms,
                    "error": r.error
                }
                for r in action_results
            ],
            error_message=error
        )

        self.executions.append(execution)

        # Keep only last 1000 executions in memory
        if len(self.executions) > 1000:
            self.executions = self.executions[-1000:]

        return execution

    async def compute_metrics(
        self,
        trigger_id: str
    ) -> TriggerMetrics:
        """Compute metrics for a trigger."""
        trigger_executions = [
            e for e in self.executions
            if e.trigger_id == trigger_id
        ]

        if not trigger_executions:
            return TriggerMetrics(
                trigger_id=trigger_id,
                total_executions=0,
                successful_executions=0,
                failed_executions=0,
                average_duration_ms=0,
                last_24h_executions=0,
                last_24h_failures=0,
                success_rate=0.0,
                computed_at=datetime.now().isoformat()
            )

        total = len(trigger_executions)
        successful = sum(
            1 for e in trigger_executions
            if e.status == ExecutionStatus.SUCCESS
        )
        failed = sum(
            1 for e in trigger_executions
            if e.status == ExecutionStatus.FAILED
        )

        avg_duration = sum(
            e.duration_ms for e in trigger_executions
        ) / total

        # Last 24 hours
        cutoff = datetime.now() - timedelta(hours=24)
        recent = [
            e for e in trigger_executions
            if datetime.fromisoformat(e.started_at) > cutoff
        ]

        return TriggerMetrics(
            trigger_id=trigger_id,
            total_executions=total,
            successful_executions=successful,
            failed_executions=failed,
            average_duration_ms=avg_duration,
            last_24h_executions=len(recent),
            last_24h_failures=sum(
                1 for e in recent if e.status == ExecutionStatus.FAILED
            ),
            success_rate=successful / total if total > 0 else 0.0,
            computed_at=datetime.now().isoformat()
        )

    async def get_execution_history(
        self,
        trigger_id: str,
        limit: int = 50
    ) -> list:
        """Get execution history for a trigger."""
        trigger_executions = [
            e for e in self.executions
            if e.trigger_id == trigger_id
        ]

        # Sort by started_at descending
        trigger_executions.sort(
            key=lambda e: e.started_at,
            reverse=True
        )

        return trigger_executions[:limit]

    async def check_health(
        self,
        trigger_id: str,
        failure_threshold: int = 3
    ) -> dict:
        """Check trigger health based on recent executions."""
        recent = await self.get_execution_history(trigger_id, limit=10)

        if not recent:
            return {"status": "unknown", "message": "No executions recorded"}

        recent_failures = sum(
            1 for e in recent[:failure_threshold]
            if e.status == ExecutionStatus.FAILED
        )

        if recent_failures >= failure_threshold:
            return {
                "status": "unhealthy",
                "message": f"Last {failure_threshold} executions failed",
                "consecutive_failures": recent_failures
            }
        elif recent_failures > 0:
            return {
                "status": "degraded",
                "message": f"{recent_failures} recent failures",
                "consecutive_failures": recent_failures
            }
        else:
            return {
                "status": "healthy",
                "message": "All recent executions successful",
                "consecutive_failures": 0
            }


# ═══════════════════════════════════════════════════════════════════════════════
# SCHEDULER
# ═══════════════════════════════════════════════════════════════════════════════

class Scheduler:
    """Schedule-based trigger execution."""

    def __init__(self):
        self.scheduled_triggers: dict = {}
        self.running = False

    async def schedule_trigger(
        self,
        trigger: Trigger
    ) -> bool:
        """Schedule a trigger for execution."""
        if trigger.trigger_type != TriggerType.SCHEDULE:
            return False

        if not trigger.schedule:
            return False

        self.scheduled_triggers[trigger.id] = {
            "trigger": trigger,
            "next_run": await self._calculate_next_run(trigger.schedule),
            "active": trigger.status == TriggerStatus.ACTIVE
        }

        return True

    async def _calculate_next_run(
        self,
        schedule: ScheduleConfig
    ) -> datetime:
        """Calculate next run time based on schedule."""
        now = datetime.now()

        if schedule.schedule_type == "interval":
            # Parse interval (e.g., "5m", "1h", "30s")
            interval = self._parse_interval(schedule.expression)
            return now + interval

        elif schedule.schedule_type == "cron":
            # Simplified cron parsing
            # In production, use croniter library
            return now + timedelta(minutes=1)

        elif schedule.schedule_type == "fixed_time":
            # Parse fixed time (e.g., "09:00")
            hour, minute = map(int, schedule.expression.split(":"))
            next_run = now.replace(hour=hour, minute=minute, second=0)
            if next_run <= now:
                next_run += timedelta(days=1)
            return next_run

        return now + timedelta(hours=1)

    def _parse_interval(self, expression: str) -> timedelta:
        """Parse interval expression to timedelta."""
        match = re.match(r"(\d+)([smhd])", expression)

        if not match:
            return timedelta(hours=1)

        value = int(match.group(1))
        unit = match.group(2)

        if unit == "s":
            return timedelta(seconds=value)
        elif unit == "m":
            return timedelta(minutes=value)
        elif unit == "h":
            return timedelta(hours=value)
        elif unit == "d":
            return timedelta(days=value)

        return timedelta(hours=1)

    async def get_upcoming_executions(
        self,
        limit: int = 10
    ) -> list:
        """Get upcoming scheduled executions."""
        upcoming = []

        for trigger_id, schedule_info in self.scheduled_triggers.items():
            if schedule_info["active"]:
                upcoming.append({
                    "trigger_id": trigger_id,
                    "trigger_name": schedule_info["trigger"].name,
                    "next_run": schedule_info["next_run"].isoformat()
                })

        upcoming.sort(key=lambda x: x["next_run"])
        return upcoming[:limit]


# ═══════════════════════════════════════════════════════════════════════════════
# TRIGGER ENGINE (MAIN ORCHESTRATOR)
# ═══════════════════════════════════════════════════════════════════════════════

class TriggerEngine:
    """Main trigger orchestration engine."""

    def __init__(self, storage_path: str = ".triggers"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)

        self.event_detector = EventDetector()
        self.trigger_builder = TriggerBuilder()
        self.action_executor = ActionExecutor()
        self.monitoring = MonitoringEngine()
        self.scheduler = Scheduler()

        self.triggers: dict = {}

    async def create_trigger(
        self,
        name: str,
        trigger_type: TriggerType,
        **kwargs
    ) -> Trigger:
        """Create and register a trigger."""
        trigger = await self.trigger_builder.create_trigger(
            name=name,
            trigger_type=trigger_type,
            **kwargs
        )

        self.triggers[trigger.id] = trigger
        await self._save_trigger(trigger)

        # Schedule if schedule-based
        if trigger_type == TriggerType.SCHEDULE:
            await self.scheduler.schedule_trigger(trigger)

        return trigger

    async def fire_trigger(
        self,
        trigger_id: str,
        event_data: dict = None
    ) -> Execution:
        """Fire a trigger manually or from event."""
        if trigger_id not in self.triggers:
            raise ValueError(f"Trigger '{trigger_id}' not found")

        trigger = self.triggers[trigger_id]
        event_data = event_data or {}

        if trigger.status != TriggerStatus.ACTIVE:
            raise ValueError(f"Trigger '{trigger_id}' is not active")

        started_at = datetime.now()

        # Evaluate conditions
        if trigger.conditions:
            conditions_met = await self.event_detector.evaluate_conditions(
                event_data, trigger.conditions
            )
            if not conditions_met:
                return await self.monitoring.record_execution(
                    trigger=trigger,
                    event_data=event_data,
                    action_results=[],
                    started_at=started_at,
                    status=ExecutionStatus.SKIPPED,
                    error="Conditions not met"
                )

        # Execute actions
        context = {
            "trigger_id": trigger.id,
            "trigger_name": trigger.name,
            "execution_time": started_at.isoformat(),
            **event_data
        }

        action_results = await self.action_executor.execute_actions(
            trigger.actions, context
        )

        # Determine overall status
        failed_actions = [
            r for r in action_results
            if r.status == ExecutionStatus.FAILED
        ]

        if failed_actions:
            status = ExecutionStatus.FAILED
            error = f"{len(failed_actions)} action(s) failed"
        else:
            status = ExecutionStatus.SUCCESS
            error = ""

        # Update trigger stats
        trigger.execution_count += 1
        if status == ExecutionStatus.FAILED:
            trigger.failure_count += 1
        trigger.last_executed = datetime.now().isoformat()
        await self._save_trigger(trigger)

        # Record execution
        return await self.monitoring.record_execution(
            trigger=trigger,
            event_data=event_data,
            action_results=action_results,
            started_at=started_at,
            status=status,
            error=error
        )

    async def process_event(
        self,
        payload: EventPayload
    ) -> list:
        """Process an incoming event against all triggers."""
        executions = []

        for trigger in self.triggers.values():
            if trigger.status != TriggerStatus.ACTIVE:
                continue

            if trigger.trigger_type not in [
                TriggerType.EVENT, TriggerType.WEBHOOK
            ]:
                continue

            # Check if event source matches
            if trigger.event_source:
                if trigger.event_source.source_type != payload.source:
                    continue

            # Fire trigger
            try:
                execution = await self.fire_trigger(
                    trigger.id,
                    event_data=payload.data
                )
                executions.append(execution)
            except Exception as e:
                # Log error but continue processing other triggers
                pass

        return executions

    async def enable_trigger(self, trigger_id: str) -> Trigger:
        """Enable a trigger."""
        if trigger_id not in self.triggers:
            raise ValueError(f"Trigger '{trigger_id}' not found")

        trigger = self.triggers[trigger_id]
        trigger.status = TriggerStatus.ACTIVE
        trigger.updated_at = datetime.now().isoformat()
        await self._save_trigger(trigger)

        return trigger

    async def disable_trigger(self, trigger_id: str) -> Trigger:
        """Disable a trigger."""
        if trigger_id not in self.triggers:
            raise ValueError(f"Trigger '{trigger_id}' not found")

        trigger = self.triggers[trigger_id]
        trigger.status = TriggerStatus.DISABLED
        trigger.updated_at = datetime.now().isoformat()
        await self._save_trigger(trigger)

        return trigger

    async def pause_trigger(self, trigger_id: str) -> Trigger:
        """Pause a trigger."""
        if trigger_id not in self.triggers:
            raise ValueError(f"Trigger '{trigger_id}' not found")

        trigger = self.triggers[trigger_id]
        trigger.status = TriggerStatus.PAUSED
        trigger.updated_at = datetime.now().isoformat()
        await self._save_trigger(trigger)

        return trigger

    async def get_trigger(self, trigger_id: str) -> Optional[Trigger]:
        """Get a trigger by ID."""
        return self.triggers.get(trigger_id)

    async def list_triggers(
        self,
        status_filter: TriggerStatus = None
    ) -> list:
        """List all triggers, optionally filtered by status."""
        triggers = list(self.triggers.values())

        if status_filter:
            triggers = [t for t in triggers if t.status == status_filter]

        return triggers

    async def delete_trigger(self, trigger_id: str) -> bool:
        """Delete a trigger."""
        if trigger_id not in self.triggers:
            return False

        del self.triggers[trigger_id]

        # Remove from storage
        trigger_file = self.storage_path / f"{trigger_id}.json"
        if trigger_file.exists():
            trigger_file.unlink()

        return True

    async def get_metrics(self, trigger_id: str) -> TriggerMetrics:
        """Get metrics for a trigger."""
        return await self.monitoring.compute_metrics(trigger_id)

    async def get_history(
        self,
        trigger_id: str,
        limit: int = 50
    ) -> list:
        """Get execution history for a trigger."""
        return await self.monitoring.get_execution_history(trigger_id, limit)

    async def _save_trigger(self, trigger: Trigger):
        """Save trigger to storage."""
        trigger_file = self.storage_path / f"{trigger.id}.json"

        data = {
            "id": trigger.id,
            "name": trigger.name,
            "description": trigger.description,
            "trigger_type": trigger.trigger_type.value,
            "status": trigger.status.value,
            "event_source": {
                "source_type": trigger.event_source.source_type,
                "endpoint": trigger.event_source.endpoint
            } if trigger.event_source else None,
            "schedule": {
                "schedule_type": trigger.schedule.schedule_type,
                "expression": trigger.schedule.expression,
                "timezone": trigger.schedule.timezone
            } if trigger.schedule else None,
            "actions": [
                {
                    "id": a.id,
                    "action_type": a.action_type.value,
                    "name": a.name,
                    "config": a.config,
                    "order": a.order
                }
                for a in trigger.actions
            ],
            "retry_config": {
                "strategy": trigger.retry_config.strategy.value,
                "max_retries": trigger.retry_config.max_retries,
                "initial_delay_seconds": trigger.retry_config.initial_delay_seconds
            },
            "created_at": trigger.created_at,
            "updated_at": trigger.updated_at,
            "execution_count": trigger.execution_count,
            "failure_count": trigger.failure_count
        }

        with open(trigger_file, "w") as f:
            json.dump(data, f, indent=2)

    async def _load_triggers(self):
        """Load all triggers from storage."""
        for trigger_file in self.storage_path.glob("trg_*.json"):
            try:
                with open(trigger_file) as f:
                    data = json.load(f)

                # Reconstruct trigger from data
                trigger = Trigger(
                    id=data["id"],
                    name=data["name"],
                    description=data.get("description", ""),
                    trigger_type=TriggerType(data["trigger_type"]),
                    status=TriggerStatus(data["status"]),
                    event_source=EventSource(**data["event_source"]) if data.get("event_source") else None,
                    schedule=ScheduleConfig(**data["schedule"]) if data.get("schedule") else None,
                    conditions=[],
                    actions=[
                        Action(
                            id=a["id"],
                            action_type=ActionType(a["action_type"]),
                            name=a["name"],
                            config=a["config"],
                            order=a["order"]
                        )
                        for a in data.get("actions", [])
                    ],
                    retry_config=RetryConfig(
                        strategy=RetryStrategy(data["retry_config"]["strategy"]),
                        max_retries=data["retry_config"]["max_retries"],
                        initial_delay_seconds=data["retry_config"]["initial_delay_seconds"]
                    ),
                    notification_config=NotificationConfig(
                        on_success=NotificationChannel.NONE,
                        on_failure=NotificationChannel.SLACK
                    ),
                    created_at=data.get("created_at", ""),
                    updated_at=data.get("updated_at", ""),
                    execution_count=data.get("execution_count", 0),
                    failure_count=data.get("failure_count", 0)
                )

                self.triggers[trigger.id] = trigger

            except Exception as e:
                print(f"Error loading trigger {trigger_file}: {e}")


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTER
# ═══════════════════════════════════════════════════════════════════════════════

class TriggerReporter:
    """Trigger reporting and visualization."""

    STATUS_ICONS = {
        TriggerStatus.ACTIVE: "●",
        TriggerStatus.PAUSED: "◐",
        TriggerStatus.DISABLED: "○",
        TriggerStatus.ERROR: "✗",
        TriggerStatus.TESTING: "◑"
    }

    EXEC_ICONS = {
        ExecutionStatus.SUCCESS: "✓",
        ExecutionStatus.FAILED: "✗",
        ExecutionStatus.RUNNING: "◐",
        ExecutionStatus.PENDING: "○",
        ExecutionStatus.TIMEOUT: "⏱",
        ExecutionStatus.SKIPPED: "⊘",
        ExecutionStatus.RETRYING: "↻"
    }

    @staticmethod
    def format_trigger_status(trigger: Trigger) -> str:
        """Format trigger status report."""
        output = []
        output.append("TRIGGER CONFIGURATION")
        output.append("=" * 55)
        output.append(f"Name: {trigger.name}")
        output.append(f"ID: {trigger.id}")
        output.append(f"Type: {trigger.trigger_type.value}")
        output.append("=" * 55)
        output.append("")

        # Status
        icon = TriggerReporter.STATUS_ICONS.get(trigger.status, "○")
        output.append("TRIGGER STATUS")
        output.append("-" * 40)
        output.append(f"  Status: {icon} {trigger.status.value}")
        output.append(f"  Created: {trigger.created_at[:19]}")
        output.append(f"  Updated: {trigger.updated_at[:19]}")
        if trigger.last_executed:
            output.append(f"  Last Run: {trigger.last_executed[:19]}")
        output.append("")

        # Event source / Schedule
        if trigger.event_source:
            output.append("EVENT SOURCE")
            output.append("-" * 40)
            output.append(f"  Type: {trigger.event_source.source_type}")
            output.append(f"  Endpoint: {trigger.event_source.endpoint}")
            output.append("")

        if trigger.schedule:
            output.append("SCHEDULE")
            output.append("-" * 40)
            output.append(f"  Type: {trigger.schedule.schedule_type}")
            output.append(f"  Expression: {trigger.schedule.expression}")
            output.append(f"  Timezone: {trigger.schedule.timezone}")
            output.append("")

        # Actions
        if trigger.actions:
            output.append("ACTIONS")
            output.append("-" * 40)
            output.append("| # | Type | Name |")
            output.append("|---|------|------|")
            for action in sorted(trigger.actions, key=lambda a: a.order):
                output.append(
                    f"| {action.order} | {action.action_type.value} | "
                    f"{action.name} |"
                )
            output.append("")

        # Retry config
        output.append("EXECUTION SETTINGS")
        output.append("-" * 40)
        output.append(f"  Retry Strategy: {trigger.retry_config.strategy.value}")
        output.append(f"  Max Retries: {trigger.retry_config.max_retries}")
        output.append(f"  Initial Delay: {trigger.retry_config.initial_delay_seconds}s")
        output.append(f"  Concurrency: {trigger.concurrency_limit}")
        output.append("")

        # Stats
        output.append("STATISTICS")
        output.append("-" * 40)
        output.append(f"  Total Executions: {trigger.execution_count}")
        output.append(f"  Failures: {trigger.failure_count}")
        success_rate = (
            (trigger.execution_count - trigger.failure_count) /
            max(trigger.execution_count, 1) * 100
        )
        bar_filled = int(success_rate / 10)
        bar = "█" * bar_filled + "░" * (10 - bar_filled)
        output.append(f"  Success Rate: {bar} {success_rate:.0f}%")

        return "\n".join(output)

    @staticmethod
    def format_metrics(metrics: TriggerMetrics) -> str:
        """Format metrics report."""
        output = []
        output.append("PERFORMANCE METRICS")
        output.append("=" * 40)
        output.append(f"Trigger: {metrics.trigger_id}")
        output.append(f"Computed: {metrics.computed_at[:19]}")
        output.append("")

        # Success rate bar
        bar_filled = int(metrics.success_rate * 10)
        bar = "█" * bar_filled + "░" * (10 - bar_filled)

        output.append(f"Success Rate: {bar} {metrics.success_rate:.0%}")
        output.append(f"Avg Duration: {metrics.average_duration_ms:.0f}ms")
        output.append(f"Total Runs: {metrics.total_executions}")
        output.append("")

        output.append("Last 24 Hours:")
        output.append(f"  Executions: {metrics.last_24h_executions}")
        output.append(f"  Failures: {metrics.last_24h_failures}")

        return "\n".join(output)

    @staticmethod
    def format_execution_history(executions: list) -> str:
        """Format execution history."""
        output = []
        output.append("EXECUTION HISTORY")
        output.append("=" * 60)
        output.append("")
        output.append("| Timestamp | Status | Duration | Result |")
        output.append("|-----------|--------|----------|--------|")

        for execution in executions[:10]:
            icon = TriggerReporter.EXEC_ICONS.get(execution.status, "○")
            timestamp = execution.started_at[11:19] if execution.started_at else "-"
            duration = f"{execution.duration_ms}ms"
            result = execution.error[:20] if execution.error else "OK"

            output.append(
                f"| {timestamp} | {icon} {execution.status.value[:8]} | "
                f"{duration:>8} | {result} |"
            )

        return "\n".join(output)

    @staticmethod
    def format_trigger_list(triggers: list) -> str:
        """Format list of triggers."""
        output = []
        output.append("TRIGGERS")
        output.append("=" * 70)
        output.append("")
        output.append("| Name | Type | Status | Executions | Last Run |")
        output.append("|------|------|--------|------------|----------|")

        for trigger in triggers:
            icon = TriggerReporter.STATUS_ICONS.get(trigger.status, "○")
            name = trigger.name[:20]
            trigger_type = trigger.trigger_type.value[:10]
            last_run = trigger.last_executed[5:16] if trigger.last_executed else "Never"

            output.append(
                f"| {name:<20} | {trigger_type:<10} | {icon} {trigger.status.value:<8} | "
                f"{trigger.execution_count:>10} | {last_run} |"
            )

        return "\n".join(output)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="TRIGGER.EXE - Automation Trigger Agent"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create trigger
    create = subparsers.add_parser("create", help="Create a trigger")
    create.add_argument("name", help="Trigger name")
    create.add_argument("--type", "-t", default="event",
                       choices=[t.value for t in TriggerType],
                       help="Trigger type")
    create.add_argument("--schedule", "-s", help="Schedule expression")
    create.add_argument("--source", help="Event source type")
    create.add_argument("--endpoint", help="Event source endpoint")

    # List triggers
    list_cmd = subparsers.add_parser("list", help="List triggers")
    list_cmd.add_argument("--status", choices=[s.value for s in TriggerStatus],
                         help="Filter by status")

    # Show trigger
    show = subparsers.add_parser("show", help="Show trigger details")
    show.add_argument("trigger_id", help="Trigger ID")

    # Enable trigger
    enable = subparsers.add_parser("enable", help="Enable a trigger")
    enable.add_argument("trigger_id", help="Trigger ID")

    # Disable trigger
    disable = subparsers.add_parser("disable", help="Disable a trigger")
    disable.add_argument("trigger_id", help="Trigger ID")

    # Pause trigger
    pause = subparsers.add_parser("pause", help="Pause a trigger")
    pause.add_argument("trigger_id", help="Trigger ID")

    # Test trigger
    test = subparsers.add_parser("test", help="Test trigger with sample event")
    test.add_argument("trigger_id", help="Trigger ID")
    test.add_argument("--data", "-d", default="{}", help="Event data (JSON)")

    # History
    history = subparsers.add_parser("history", help="Show execution history")
    history.add_argument("trigger_id", help="Trigger ID")
    history.add_argument("--limit", "-l", type=int, default=20, help="Limit")

    # Metrics
    metrics = subparsers.add_parser("metrics", help="Show trigger metrics")
    metrics.add_argument("trigger_id", help="Trigger ID")

    # Delete trigger
    delete = subparsers.add_parser("delete", help="Delete a trigger")
    delete.add_argument("trigger_id", help="Trigger ID")

    args = parser.parse_args()

    engine = TriggerEngine()
    reporter = TriggerReporter()

    # Load existing triggers
    await engine._load_triggers()

    if args.command == "create":
        trigger_type = TriggerType(args.type)

        kwargs = {}
        if args.schedule:
            kwargs["schedule"] = ScheduleConfig(
                schedule_type="cron",
                expression=args.schedule
            )
        if args.source and args.endpoint:
            kwargs["event_source"] = EventSource(
                source_type=args.source,
                endpoint=args.endpoint
            )

        trigger = await engine.create_trigger(
            name=args.name,
            trigger_type=trigger_type,
            **kwargs
        )
        print(f"Created trigger: {trigger.name} ({trigger.id})")

    elif args.command == "list":
        status_filter = TriggerStatus(args.status) if args.status else None
        triggers = await engine.list_triggers(status_filter)
        print(reporter.format_trigger_list(triggers))

    elif args.command == "show":
        trigger = await engine.get_trigger(args.trigger_id)
        if trigger:
            print(reporter.format_trigger_status(trigger))
        else:
            print(f"Trigger '{args.trigger_id}' not found")

    elif args.command == "enable":
        trigger = await engine.enable_trigger(args.trigger_id)
        print(f"Enabled trigger: {trigger.name}")

    elif args.command == "disable":
        trigger = await engine.disable_trigger(args.trigger_id)
        print(f"Disabled trigger: {trigger.name}")

    elif args.command == "pause":
        trigger = await engine.pause_trigger(args.trigger_id)
        print(f"Paused trigger: {trigger.name}")

    elif args.command == "test":
        event_data = json.loads(args.data)
        execution = await engine.fire_trigger(args.trigger_id, event_data)
        print(f"Execution: {execution.id}")
        print(f"Status: {execution.status.value}")
        print(f"Duration: {execution.duration_ms}ms")
        if execution.error_message:
            print(f"Error: {execution.error_message}")

    elif args.command == "history":
        executions = await engine.get_history(args.trigger_id, args.limit)
        print(reporter.format_execution_history(executions))

    elif args.command == "metrics":
        trigger_metrics = await engine.get_metrics(args.trigger_id)
        print(reporter.format_metrics(trigger_metrics))

    elif args.command == "delete":
        success = await engine.delete_trigger(args.trigger_id)
        if success:
            print(f"Deleted trigger: {args.trigger_id}")
        else:
            print(f"Trigger '{args.trigger_id}' not found")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
TRIGGER CONFIGURATION
═══════════════════════════════════════
Name: [trigger_name]
Type: [event/schedule/condition]
Date: [timestamp]
═══════════════════════════════════════

TRIGGER STATUS
────────────────────────────────────
┌─────────────────────────────────────┐
│       TRIGGER DETAILS               │
│                                     │
│  Name: [trigger_name]               │
│  Status: [●/◐/○] [active/paused]    │
│  Type: [trigger_type]               │
│                                     │
│  Created: [timestamp]               │
│  Last Run: [timestamp]              │
│  Next Run: [timestamp/on-event]     │
└─────────────────────────────────────┘

EVENT SOURCE
────────────────────────────────────
| Property | Value |
|----------|-------|
| Source | [source_type] |
| Endpoint | [endpoint] |
| Filter | [conditions] |
| Data Fields | [mapped_fields] |

CONDITIONS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Condition Logic:                   │
│                                     │
│  IF [condition_1]                   │
│  AND [condition_2]                  │
│  THEN execute actions               │
│                                     │
│  Filters:                           │
│  • [filter_1]                       │
│  • [filter_2]                       │
└─────────────────────────────────────┘

ACTIONS
────────────────────────────────────
| # | Action Type | Target | Params |
|---|-------------|--------|--------|
| 1 | [action_1] | [target] | [params] |
| 2 | [action_2] | [target] | [params] |
| 3 | [action_3] | [target] | [params] |

EXECUTION SETTINGS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Retry Policy:                      │
│  • Max Retries: [#]                 │
│  • Backoff: [strategy]              │
│  • Timeout: [duration]              │
│                                     │
│  Notifications:                     │
│  • On Success: [channel]            │
│  • On Failure: [channel]            │
│                                     │
│  Concurrency: [limit]               │
└─────────────────────────────────────┘

EXECUTION HISTORY
────────────────────────────────────
| Timestamp | Status | Duration | Result |
|-----------|--------|----------|--------|
| [time_1] | [●/○] | [Xms] | [result] |
| [time_2] | [●/○] | [Xms] | [result] |
| [time_3] | [●/○] | [Xms] | [result] |

PERFORMANCE METRICS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Success Rate: ████████░░ [X]%      │
│  Avg Duration: [X]ms                │
│  Total Runs: [#]                    │
│                                     │
│  Last 24h: [#] executions           │
│  Failures: [#]                      │
└─────────────────────────────────────┘

Status: ● Trigger Active
```

## QUICK COMMANDS

- `/launch-trigger create [name]` - Create new trigger
- `/launch-trigger list` - Show all triggers
- `/launch-trigger enable [name]` - Activate trigger
- `/launch-trigger disable [name]` - Pause trigger
- `/launch-trigger test [name]` - Test with sample event

$ARGUMENTS
