# N8N.WORKFLOW.EXE - n8n Workflow Builder

You are N8N.WORKFLOW.EXE — the n8n workflow automation architect that designs and builds production-ready workflows for any automation use case with proper triggers, error handling, and modular patterns.

MISSION: Design automation workflows. Build node sequences. Optimize data flows.

---

## CAPABILITIES

### TriggerArchitect.MOD
- Webhook configuration
- Schedule (cron) setup
- App event triggers
- Polling intervals
- Manual execution

### NodeBuilder.MOD
- Data transformation
- HTTP requests
- Database operations
- Conditional logic
- Code node patterns

### FlowDesigner.MOD
- Linear sequences
- Branching logic
- Parallel execution
- Loop patterns
- Sub-workflows

### ErrorHandler.MOD
- Try/catch patterns
- Retry configuration
- Error notifications
- Logging strategies
- Recovery flows

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.WORKFLOW.EXE - n8n Workflow Builder
Production-ready workflow design and generation system
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
import argparse
import json
import uuid


# ============================================================
# ENUMS - Workflow Domain Types
# ============================================================

class WorkflowPattern(Enum):
    """Workflow architecture patterns."""
    LINEAR = "linear"
    BRANCHING = "branching"
    PARALLEL = "parallel"
    LOOP = "loop"
    ERROR_HANDLING = "error_handling"
    SUB_WORKFLOW = "sub_workflow"

    @property
    def description(self) -> str:
        """Pattern description."""
        descriptions = {
            "linear": "Sequential A → B → C processing",
            "branching": "IF/Switch conditional logic",
            "parallel": "Split and merge concurrent tasks",
            "loop": "Batch processing with iteration",
            "error_handling": "Try/catch with recovery",
            "sub_workflow": "Modular workflow composition"
        }
        return descriptions.get(self.value, "")

    @property
    def complexity(self) -> int:
        """Pattern complexity score (1-5)."""
        scores = {
            "linear": 1,
            "branching": 2,
            "parallel": 3,
            "loop": 3,
            "error_handling": 4,
            "sub_workflow": 4
        }
        return scores.get(self.value, 2)

    @property
    def typical_nodes(self) -> List[str]:
        """Typical nodes for this pattern."""
        nodes = {
            "linear": ["Trigger", "Set", "HTTP Request", "Respond"],
            "branching": ["IF", "Switch", "Filter", "Merge"],
            "parallel": ["Split In Batches", "Merge", "Wait"],
            "loop": ["Split Out", "Loop Over Items", "Aggregate"],
            "error_handling": ["Error Trigger", "IF", "Slack", "Stop And Error"],
            "sub_workflow": ["Execute Workflow", "Respond to Webhook"]
        }
        return nodes.get(self.value, [])


class TriggerType(Enum):
    """Workflow trigger types."""
    MANUAL = "manual"
    WEBHOOK = "webhook"
    SCHEDULE = "schedule"
    APP_EVENT = "app_event"
    POLLING = "polling"
    ERROR = "error"
    CHAT = "chat"

    @property
    def n8n_node(self) -> str:
        """Corresponding n8n node name."""
        nodes = {
            "manual": "n8n-nodes-base.manualTrigger",
            "webhook": "n8n-nodes-base.webhook",
            "schedule": "n8n-nodes-base.scheduleTrigger",
            "app_event": "n8n-nodes-base.trigger",
            "polling": "n8n-nodes-base.scheduleTrigger",
            "error": "n8n-nodes-base.errorTrigger",
            "chat": "@n8n/n8n-nodes-langchain.chatTrigger"
        }
        return nodes.get(self.value, "n8n-nodes-base.manualTrigger")

    @property
    def requires_configuration(self) -> List[str]:
        """Required configuration fields."""
        configs = {
            "manual": [],
            "webhook": ["path", "httpMethod", "responseMode"],
            "schedule": ["rule", "cronExpression"],
            "app_event": ["app", "event", "credentials"],
            "polling": ["rule", "interval"],
            "error": ["triggerOnWorkflowFailure"],
            "chat": ["mode", "chatInputKey"]
        }
        return configs.get(self.value, [])

    @property
    def execution_mode(self) -> str:
        """How this trigger executes workflows."""
        modes = {
            "manual": "on_demand",
            "webhook": "on_request",
            "schedule": "recurring",
            "app_event": "event_driven",
            "polling": "interval",
            "error": "on_failure",
            "chat": "conversational"
        }
        return modes.get(self.value, "on_demand")


class NodeCategory(Enum):
    """Node functional categories."""
    TRIGGER = "trigger"
    CORE = "core"
    TRANSFORM = "transform"
    LOGIC = "logic"
    HTTP = "http"
    DATABASE = "database"
    AI = "ai"
    COMMUNICATION = "communication"
    FILE = "file"
    UTILITY = "utility"

    @property
    def common_nodes(self) -> List[str]:
        """Common nodes in this category."""
        nodes = {
            "trigger": ["Manual Trigger", "Webhook", "Schedule Trigger", "Chat Trigger"],
            "core": ["Set", "Code", "Function", "Function Item"],
            "transform": ["Item Lists", "Merge", "Split Out", "Aggregate", "Rename Keys"],
            "logic": ["IF", "Switch", "Filter", "Compare Datasets"],
            "http": ["HTTP Request", "Webhook", "Respond to Webhook"],
            "database": ["Postgres", "MySQL", "MongoDB", "Redis", "Supabase"],
            "ai": ["OpenAI", "Anthropic", "AI Agent", "AI Chain", "Vector Store"],
            "communication": ["Slack", "Discord", "Email", "Telegram", "Twilio"],
            "file": ["Google Drive", "Dropbox", "S3", "Read/Write Files"],
            "utility": ["Wait", "Stop And Error", "Execute Workflow", "Sticky Note"]
        }
        return nodes.get(self.value, [])

    @property
    def color(self) -> str:
        """Category color for visualization."""
        colors = {
            "trigger": "#FF6D5A",
            "core": "#607D8B",
            "transform": "#9C27B0",
            "logic": "#FF9800",
            "http": "#2196F3",
            "database": "#4CAF50",
            "ai": "#673AB7",
            "communication": "#00BCD4",
            "file": "#795548",
            "utility": "#9E9E9E"
        }
        return colors.get(self.value, "#607D8B")


class DataType(Enum):
    """Data types in n8n expressions."""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    ARRAY = "array"
    OBJECT = "object"
    DATETIME = "datetime"
    BINARY = "binary"

    @property
    def expression_example(self) -> str:
        """Example n8n expression for type."""
        examples = {
            "string": '={{ $json.name ?? "default" }}',
            "number": '={{ Number($json.count) || 0 }}',
            "boolean": '={{ $json.active === true }}',
            "array": '={{ $json.items.map(i => i.id) }}',
            "object": '={{ { id: $json.id, name: $json.name } }}',
            "datetime": '={{ DateTime.now().toISO() }}',
            "binary": '={{ $binary.data }}'
        }
        return examples.get(self.value, "")

    @property
    def null_safe_access(self) -> str:
        """Null-safe access pattern."""
        patterns = {
            "string": "$json.field ?? ''",
            "number": "$json.field ?? 0",
            "boolean": "$json.field ?? false",
            "array": "$json.field ?? []",
            "object": "$json.field ?? {}",
            "datetime": "$json.field ?? null",
            "binary": "$binary.field ?? null"
        }
        return patterns.get(self.value, "$json.field")


class ErrorStrategy(Enum):
    """Error handling strategies."""
    STOP = "stop"
    CONTINUE = "continue"
    RETRY = "retry"
    NOTIFY = "notify"
    FALLBACK = "fallback"
    ESCALATE = "escalate"

    @property
    def implementation(self) -> str:
        """How to implement this strategy."""
        implementations = {
            "stop": "Use 'Stop And Error' node to halt workflow",
            "continue": "Set 'Continue On Fail' option on node",
            "retry": "Configure retry settings in node options",
            "notify": "Add error branch with Slack/Email notification",
            "fallback": "Add IF node to check status and use default",
            "escalate": "Route to Error Trigger workflow for handling"
        }
        return implementations.get(self.value, "")

    @property
    def retry_config(self) -> Dict[str, Any]:
        """Default retry configuration."""
        configs = {
            "stop": {"maxTries": 1, "waitBetweenTries": 0},
            "continue": {"maxTries": 1, "waitBetweenTries": 0},
            "retry": {"maxTries": 3, "waitBetweenTries": 1000},
            "notify": {"maxTries": 1, "waitBetweenTries": 0},
            "fallback": {"maxTries": 2, "waitBetweenTries": 500},
            "escalate": {"maxTries": 1, "waitBetweenTries": 0}
        }
        return configs.get(self.value, {"maxTries": 1})


class ExecutionMode(Enum):
    """Workflow execution modes."""
    PRODUCTION = "production"
    TEST = "test"
    DEBUG = "debug"
    DRY_RUN = "dry_run"

    @property
    def settings(self) -> Dict[str, Any]:
        """Mode-specific settings."""
        configs = {
            "production": {"saveDataErrorExecution": "all", "saveDataSuccessExecution": "all"},
            "test": {"saveDataErrorExecution": "all", "saveDataSuccessExecution": "all"},
            "debug": {"saveDataErrorExecution": "all", "saveDataSuccessExecution": "all"},
            "dry_run": {"saveDataErrorExecution": "none", "saveDataSuccessExecution": "none"}
        }
        return configs.get(self.value, {})


# ============================================================
# DATACLASSES - Workflow Data Structures
# ============================================================

@dataclass
class NodePosition:
    """Node position on canvas."""
    x: int = 0
    y: int = 0

    def offset(self, dx: int, dy: int) -> "NodePosition":
        """Create offset position."""
        return NodePosition(self.x + dx, self.y + dy)

    def to_list(self) -> List[int]:
        """Convert to list format."""
        return [self.x, self.y]


@dataclass
class NodeParameter:
    """Node parameter definition."""
    name: str
    value: Any
    is_expression: bool = False
    type_hint: DataType = DataType.STRING

    def to_n8n_value(self) -> Any:
        """Convert to n8n parameter format."""
        if self.is_expression:
            return f"={{{{ {self.value} }}}}"
        return self.value

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "name": self.name,
            "value": self.to_n8n_value(),
            "is_expression": self.is_expression
        }


@dataclass
class WorkflowNode:
    """Workflow node definition."""
    node_id: str
    name: str
    node_type: str
    category: NodeCategory
    position: NodePosition = field(default_factory=NodePosition)
    parameters: Dict[str, Any] = field(default_factory=dict)
    credentials: Optional[str] = None
    continue_on_fail: bool = False
    retry_on_fail: bool = False
    max_retries: int = 3
    wait_between_retries: int = 1000
    notes: str = ""

    @property
    def type_version(self) -> float:
        """Node type version."""
        # Most nodes are version 1 or higher
        return 1.0

    @property
    def is_trigger(self) -> bool:
        """Whether this is a trigger node."""
        return self.category == NodeCategory.TRIGGER

    def to_n8n_json(self) -> Dict[str, Any]:
        """Convert to n8n JSON format."""
        node = {
            "id": self.node_id,
            "name": self.name,
            "type": self.node_type,
            "typeVersion": self.type_version,
            "position": self.position.to_list(),
            "parameters": self.parameters
        }
        if self.credentials:
            node["credentials"] = {self.credentials: {"id": "", "name": self.credentials}}
        if self.continue_on_fail:
            node["continueOnFail"] = True
        if self.retry_on_fail:
            node["retryOnFail"] = True
            node["maxTries"] = self.max_retries
            node["waitBetweenTries"] = self.wait_between_retries
        if self.notes:
            node["notes"] = self.notes
        return node


@dataclass
class NodeConnection:
    """Connection between nodes."""
    source_node: str
    target_node: str
    source_output: int = 0  # Output index
    target_input: int = 0   # Input index

    def to_n8n_format(self) -> Dict[str, Any]:
        """Convert to n8n connection format."""
        return {
            "node": self.target_node,
            "type": "main",
            "index": self.target_input
        }


@dataclass
class WorkflowVariable:
    """Workflow static variable."""
    name: str
    value: Any
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "name": self.name,
            "value": self.value,
            "description": self.description
        }


@dataclass
class CredentialRequirement:
    """Required credential for workflow."""
    credential_type: str
    node_name: str
    setup_url: str = ""
    required_scopes: List[str] = field(default_factory=list)
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "credential_type": self.credential_type,
            "node_name": self.node_name,
            "setup_url": self.setup_url,
            "required_scopes": self.required_scopes,
            "notes": self.notes
        }


@dataclass
class WorkflowSettings:
    """Workflow configuration settings."""
    execution_order: str = "v1"
    timezone: str = "UTC"
    save_data_error: str = "all"
    save_data_success: str = "all"
    execution_timeout: int = -1  # -1 = no timeout
    error_workflow_id: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert to n8n settings format."""
        settings = {
            "executionOrder": self.execution_order,
            "timezone": self.timezone,
            "saveDataErrorExecution": self.save_data_error,
            "saveDataSuccessExecution": self.save_data_success
        }
        if self.execution_timeout > 0:
            settings["executionTimeout"] = self.execution_timeout
        if self.error_workflow_id:
            settings["errorWorkflow"] = self.error_workflow_id
        return settings


@dataclass
class Workflow:
    """Complete n8n workflow definition."""
    workflow_id: str
    name: str
    description: str = ""
    pattern: WorkflowPattern = WorkflowPattern.LINEAR
    trigger_type: TriggerType = TriggerType.MANUAL
    nodes: List[WorkflowNode] = field(default_factory=list)
    connections: List[NodeConnection] = field(default_factory=list)
    settings: WorkflowSettings = field(default_factory=WorkflowSettings)
    variables: List[WorkflowVariable] = field(default_factory=list)
    credentials: List[CredentialRequirement] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    @property
    def node_count(self) -> int:
        """Total number of nodes."""
        return len(self.nodes)

    @property
    def complexity_score(self) -> int:
        """Calculate workflow complexity (1-10)."""
        base = self.pattern.complexity
        node_factor = min(len(self.nodes) // 3, 3)
        connection_factor = 1 if len(self.connections) > len(self.nodes) else 0
        return min(base + node_factor + connection_factor, 10)

    @property
    def trigger_node(self) -> Optional[WorkflowNode]:
        """Get the trigger node."""
        for node in self.nodes:
            if node.is_trigger:
                return node
        return None

    def get_node(self, name: str) -> Optional[WorkflowNode]:
        """Get node by name."""
        for node in self.nodes:
            if node.name == name:
                return node
        return None

    def add_node(self, node: WorkflowNode) -> None:
        """Add node to workflow."""
        self.nodes.append(node)
        self.updated_at = datetime.now()

    def connect(self, source: str, target: str,
                source_output: int = 0, target_input: int = 0) -> None:
        """Connect two nodes."""
        connection = NodeConnection(
            source_node=source,
            target_node=target,
            source_output=source_output,
            target_input=target_input
        )
        self.connections.append(connection)
        self.updated_at = datetime.now()

    def to_n8n_json(self) -> Dict[str, Any]:
        """Export to n8n workflow JSON format."""
        # Build connections dict
        connections_dict = {}
        for conn in self.connections:
            if conn.source_node not in connections_dict:
                connections_dict[conn.source_node] = {"main": [[]]}
            # Ensure output index exists
            while len(connections_dict[conn.source_node]["main"]) <= conn.source_output:
                connections_dict[conn.source_node]["main"].append([])
            connections_dict[conn.source_node]["main"][conn.source_output].append(
                conn.to_n8n_format()
            )

        workflow = {
            "name": self.name,
            "nodes": [node.to_n8n_json() for node in self.nodes],
            "connections": connections_dict,
            "settings": self.settings.to_dict(),
            "staticData": None,
            "pinData": {}
        }

        if self.variables:
            workflow["staticData"] = {
                "global": {v.name: v.value for v in self.variables}
            }

        if self.tags:
            workflow["tags"] = [{"name": tag} for tag in self.tags]

        return workflow

    def export_json(self, indent: int = 2) -> str:
        """Export workflow as formatted JSON string."""
        return json.dumps(self.to_n8n_json(), indent=indent)


# ============================================================
# ENGINE CLASSES - Workflow Building Engines
# ============================================================

class NodeFactory:
    """Factory for creating workflow nodes."""

    NODE_COUNTER = 0

    @classmethod
    def _next_id(cls) -> str:
        """Generate unique node ID."""
        cls.NODE_COUNTER += 1
        return str(uuid.uuid4())[:8]

    @classmethod
    def create_manual_trigger(cls, position: NodePosition = None) -> WorkflowNode:
        """Create manual trigger node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Manual Trigger",
            node_type="n8n-nodes-base.manualTrigger",
            category=NodeCategory.TRIGGER,
            position=position or NodePosition(250, 300)
        )

    @classmethod
    def create_webhook(cls, path: str, method: str = "POST",
                      response_mode: str = "onReceived",
                      position: NodePosition = None) -> WorkflowNode:
        """Create webhook trigger node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Webhook",
            node_type="n8n-nodes-base.webhook",
            category=NodeCategory.TRIGGER,
            position=position or NodePosition(250, 300),
            parameters={
                "path": path,
                "httpMethod": method,
                "responseMode": response_mode
            }
        )

    @classmethod
    def create_schedule(cls, cron: str, timezone: str = "UTC",
                       position: NodePosition = None) -> WorkflowNode:
        """Create schedule trigger node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Schedule Trigger",
            node_type="n8n-nodes-base.scheduleTrigger",
            category=NodeCategory.TRIGGER,
            position=position or NodePosition(250, 300),
            parameters={
                "rule": {"cronExpression": cron, "timezone": timezone}
            }
        )

    @classmethod
    def create_http_request(cls, url: str, method: str = "GET",
                           body: Dict = None, headers: Dict = None,
                           position: NodePosition = None) -> WorkflowNode:
        """Create HTTP request node."""
        params = {
            "url": url,
            "method": method,
            "sendBody": body is not None,
            "sendHeaders": headers is not None
        }
        if body:
            params["bodyParameters"] = {"parameters": [
                {"name": k, "value": v} for k, v in body.items()
            ]}
        if headers:
            params["headerParameters"] = {"parameters": [
                {"name": k, "value": v} for k, v in headers.items()
            ]}

        return WorkflowNode(
            node_id=cls._next_id(),
            name="HTTP Request",
            node_type="n8n-nodes-base.httpRequest",
            category=NodeCategory.HTTP,
            position=position or NodePosition(500, 300),
            parameters=params
        )

    @classmethod
    def create_set(cls, values: Dict[str, Any],
                  position: NodePosition = None) -> WorkflowNode:
        """Create Set node for data assignment."""
        assignments = []
        for name, value in values.items():
            is_expr = isinstance(value, str) and value.startswith("={{")
            assignments.append({
                "id": str(uuid.uuid4())[:8],
                "name": name,
                "value": value,
                "type": "string"
            })

        return WorkflowNode(
            node_id=cls._next_id(),
            name="Set",
            node_type="n8n-nodes-base.set",
            category=NodeCategory.TRANSFORM,
            position=position or NodePosition(500, 300),
            parameters={
                "mode": "manual",
                "duplicateItem": False,
                "assignments": {"assignments": assignments}
            }
        )

    @classmethod
    def create_code(cls, code: str, mode: str = "runOnceForAllItems",
                   position: NodePosition = None) -> WorkflowNode:
        """Create Code node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Code",
            node_type="n8n-nodes-base.code",
            category=NodeCategory.CORE,
            position=position or NodePosition(500, 300),
            parameters={
                "mode": mode,
                "jsCode": code
            }
        )

    @classmethod
    def create_if(cls, condition_value: str, operation: str = "equal",
                 compare_to: Any = True,
                 position: NodePosition = None) -> WorkflowNode:
        """Create IF conditional node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="IF",
            node_type="n8n-nodes-base.if",
            category=NodeCategory.LOGIC,
            position=position or NodePosition(500, 300),
            parameters={
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": ""},
                    "conditions": [{
                        "id": str(uuid.uuid4())[:8],
                        "leftValue": condition_value,
                        "rightValue": compare_to,
                        "operator": {"type": "boolean", "operation": operation}
                    }],
                    "combinator": "and"
                }
            }
        )

    @classmethod
    def create_switch(cls, field: str, rules: List[Tuple[str, Any]],
                     position: NodePosition = None) -> WorkflowNode:
        """Create Switch node for multi-way branching."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Switch",
            node_type="n8n-nodes-base.switch",
            category=NodeCategory.LOGIC,
            position=position or NodePosition(500, 300),
            parameters={
                "dataType": "string",
                "value1": f"={{{{ $json.{field} }}}}",
                "rules": {"rules": [
                    {"value2": val, "output": idx}
                    for idx, (_, val) in enumerate(rules)
                ]}
            }
        )

    @classmethod
    def create_merge(cls, mode: str = "combine",
                    position: NodePosition = None) -> WorkflowNode:
        """Create Merge node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Merge",
            node_type="n8n-nodes-base.merge",
            category=NodeCategory.TRANSFORM,
            position=position or NodePosition(700, 300),
            parameters={"mode": mode}
        )

    @classmethod
    def create_respond_webhook(cls, response_body: str = None,
                              status_code: int = 200,
                              position: NodePosition = None) -> WorkflowNode:
        """Create Respond to Webhook node."""
        params = {
            "respondWith": "json" if response_body else "noData",
            "options": {"responseCode": status_code}
        }
        if response_body:
            params["responseBody"] = response_body

        return WorkflowNode(
            node_id=cls._next_id(),
            name="Respond to Webhook",
            node_type="n8n-nodes-base.respondToWebhook",
            category=NodeCategory.HTTP,
            position=position or NodePosition(900, 300),
            parameters=params
        )

    @classmethod
    def create_slack(cls, channel: str, message: str,
                    position: NodePosition = None) -> WorkflowNode:
        """Create Slack message node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="Slack",
            node_type="n8n-nodes-base.slack",
            category=NodeCategory.COMMUNICATION,
            position=position or NodePosition(700, 300),
            parameters={
                "operation": "post",
                "channel": channel,
                "text": message
            },
            credentials="slackApi"
        )

    @classmethod
    def create_openai(cls, prompt: str, model: str = "gpt-4",
                     position: NodePosition = None) -> WorkflowNode:
        """Create OpenAI node."""
        return WorkflowNode(
            node_id=cls._next_id(),
            name="OpenAI",
            node_type="@n8n/n8n-nodes-langchain.openAi",
            category=NodeCategory.AI,
            position=position or NodePosition(500, 300),
            parameters={
                "operation": "message",
                "model": model,
                "prompt": {"values": {"text": prompt}}
            },
            credentials="openAiApi"
        )


class WorkflowBuilder:
    """Builder for constructing workflows programmatically."""

    def __init__(self, name: str, description: str = ""):
        self.workflow = Workflow(
            workflow_id=str(uuid.uuid4())[:8],
            name=name,
            description=description
        )
        self.current_position = NodePosition(250, 300)
        self.position_offset = 250

    def set_pattern(self, pattern: WorkflowPattern) -> "WorkflowBuilder":
        """Set workflow pattern."""
        self.workflow.pattern = pattern
        return self

    def add_trigger(self, trigger_type: TriggerType,
                   **kwargs) -> "WorkflowBuilder":
        """Add trigger node."""
        self.workflow.trigger_type = trigger_type

        if trigger_type == TriggerType.MANUAL:
            node = NodeFactory.create_manual_trigger(self.current_position)
        elif trigger_type == TriggerType.WEBHOOK:
            node = NodeFactory.create_webhook(
                path=kwargs.get("path", "/webhook"),
                method=kwargs.get("method", "POST"),
                response_mode=kwargs.get("response_mode", "onReceived"),
                position=self.current_position
            )
        elif trigger_type == TriggerType.SCHEDULE:
            node = NodeFactory.create_schedule(
                cron=kwargs.get("cron", "0 9 * * *"),
                timezone=kwargs.get("timezone", "UTC"),
                position=self.current_position
            )
        else:
            node = NodeFactory.create_manual_trigger(self.current_position)

        self.workflow.add_node(node)
        self._advance_position()
        return self

    def add_http_request(self, url: str, method: str = "GET",
                        **kwargs) -> "WorkflowBuilder":
        """Add HTTP request node."""
        node = NodeFactory.create_http_request(
            url=url,
            method=method,
            body=kwargs.get("body"),
            headers=kwargs.get("headers"),
            position=self.current_position
        )
        self._add_and_connect(node)
        return self

    def add_set(self, values: Dict[str, Any]) -> "WorkflowBuilder":
        """Add Set node."""
        node = NodeFactory.create_set(values, self.current_position)
        self._add_and_connect(node)
        return self

    def add_code(self, code: str, mode: str = "runOnceForAllItems") -> "WorkflowBuilder":
        """Add Code node."""
        node = NodeFactory.create_code(code, mode, self.current_position)
        self._add_and_connect(node)
        return self

    def add_if(self, condition: str, operation: str = "equal",
              compare_to: Any = True) -> "WorkflowBuilder":
        """Add IF conditional node."""
        node = NodeFactory.create_if(condition, operation, compare_to, self.current_position)
        self._add_and_connect(node)
        return self

    def add_slack(self, channel: str, message: str) -> "WorkflowBuilder":
        """Add Slack notification."""
        node = NodeFactory.create_slack(channel, message, self.current_position)
        self._add_and_connect(node)
        self.workflow.credentials.append(CredentialRequirement(
            credential_type="slackApi",
            node_name=node.name,
            setup_url="https://api.slack.com/apps"
        ))
        return self

    def add_openai(self, prompt: str, model: str = "gpt-4") -> "WorkflowBuilder":
        """Add OpenAI node."""
        node = NodeFactory.create_openai(prompt, model, self.current_position)
        self._add_and_connect(node)
        self.workflow.credentials.append(CredentialRequirement(
            credential_type="openAiApi",
            node_name=node.name,
            setup_url="https://platform.openai.com/api-keys"
        ))
        return self

    def add_respond_webhook(self, response: str = None,
                           status_code: int = 200) -> "WorkflowBuilder":
        """Add webhook response node."""
        node = NodeFactory.create_respond_webhook(response, status_code, self.current_position)
        self._add_and_connect(node)
        return self

    def add_tag(self, tag: str) -> "WorkflowBuilder":
        """Add workflow tag."""
        self.workflow.tags.append(tag)
        return self

    def add_credential(self, cred_type: str, node_name: str,
                      setup_url: str = "") -> "WorkflowBuilder":
        """Add credential requirement."""
        self.workflow.credentials.append(CredentialRequirement(
            credential_type=cred_type,
            node_name=node_name,
            setup_url=setup_url
        ))
        return self

    def set_error_handling(self, strategy: ErrorStrategy) -> "WorkflowBuilder":
        """Configure error handling for workflow."""
        if strategy == ErrorStrategy.RETRY:
            for node in self.workflow.nodes:
                if not node.is_trigger:
                    node.retry_on_fail = True
                    node.max_retries = 3
        elif strategy == ErrorStrategy.CONTINUE:
            for node in self.workflow.nodes:
                if not node.is_trigger:
                    node.continue_on_fail = True
        return self

    def _add_and_connect(self, node: WorkflowNode) -> None:
        """Add node and connect to previous."""
        self.workflow.add_node(node)
        if len(self.workflow.nodes) > 1:
            prev_node = self.workflow.nodes[-2]
            self.workflow.connect(prev_node.name, node.name)
        self._advance_position()

    def _advance_position(self) -> None:
        """Advance position for next node."""
        self.current_position = self.current_position.offset(self.position_offset, 0)

    def build(self) -> Workflow:
        """Build and return the workflow."""
        return self.workflow


class TemplateLibrary:
    """Library of workflow templates."""

    @staticmethod
    def webhook_api(name: str, path: str) -> Workflow:
        """Create webhook API workflow template."""
        return (WorkflowBuilder(name, "Webhook API endpoint")
                .set_pattern(WorkflowPattern.LINEAR)
                .add_trigger(TriggerType.WEBHOOK, path=path, method="POST")
                .add_set({"received_at": "={{ DateTime.now().toISO() }}"})
                .add_respond_webhook('{"status": "success"}', 200)
                .add_tag("api")
                .build())

    @staticmethod
    def scheduled_sync(name: str, cron: str, api_url: str) -> Workflow:
        """Create scheduled data sync workflow template."""
        return (WorkflowBuilder(name, "Scheduled data synchronization")
                .set_pattern(WorkflowPattern.LINEAR)
                .add_trigger(TriggerType.SCHEDULE, cron=cron)
                .add_http_request(api_url, "GET")
                .add_code("""
const items = $input.all();
return items.map(item => ({
    json: {
        ...item.json,
        synced_at: new Date().toISOString()
    }
}));
""")
                .add_tag("sync")
                .build())

    @staticmethod
    def ai_agent(name: str, system_prompt: str) -> Workflow:
        """Create AI agent workflow template."""
        builder = WorkflowBuilder(name, "AI agent workflow")
        builder.set_pattern(WorkflowPattern.LINEAR)
        builder.add_trigger(TriggerType.MANUAL)
        builder.add_openai(system_prompt, "gpt-4")
        builder.add_tag("ai")
        return builder.build()

    @staticmethod
    def error_handler(name: str, slack_channel: str) -> Workflow:
        """Create error handling workflow template."""
        return (WorkflowBuilder(name, "Error notification handler")
                .set_pattern(WorkflowPattern.ERROR_HANDLING)
                .add_trigger(TriggerType.ERROR)
                .add_slack(slack_channel, "Workflow failed: {{ $json.workflow.name }}")
                .add_tag("error-handling")
                .build())


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class WorkflowReporter:
    """Generate ASCII reports for workflows."""

    @staticmethod
    def generate_progress_bar(percentage: int, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * percentage / 100)
        empty = width - filled
        return f"{'█' * filled}{'░' * empty}"

    @staticmethod
    def generate_workflow_dashboard(workflow: Workflow) -> str:
        """Generate workflow status dashboard."""
        complexity = workflow.complexity_score * 10
        progress_bar = WorkflowReporter.generate_progress_bar(complexity)

        output = f"""
N8N WORKFLOW DESIGN
═══════════════════════════════════════
Workflow: {workflow.name}
Pattern: {workflow.pattern.value}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}
═══════════════════════════════════════

WORKFLOW OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       WORKFLOW CONFIGURATION        │
│                                     │
│  Name: {workflow.name:<26}│
│  Pattern: {workflow.pattern.value:<24}│
│  Trigger: {workflow.trigger_type.value:<24}│
│                                     │
│  Nodes: {workflow.node_count:<27}│
│  Connections: {len(workflow.connections):<21}│
│                                     │
│  Complexity: {progress_bar} {workflow.complexity_score}/10│
│  Status: ● Design Complete          │
└─────────────────────────────────────┘

NODE SEQUENCE
────────────────────────────────────"""

        for idx, node in enumerate(workflow.nodes, 1):
            output += f"\n  {idx}. {node.name:<20} [{node.category.value}]"
            if node.notes:
                output += f"\n     Purpose: {node.notes}"

        if workflow.credentials:
            output += """

CREDENTIALS REQUIRED
────────────────────────────────────
| Credential      | Node            |
|-----------------|-----------------|"""
            for cred in workflow.credentials:
                output += f"\n| {cred.credential_type:<15} | {cred.node_name:<15} |"

        output += """

WORKFLOW SETTINGS
────────────────────────────────────
| Setting              | Value       |
|----------------------|-------------|"""
        output += f"\n| Execution Order      | {workflow.settings.execution_order:<11} |"
        output += f"\n| Timezone             | {workflow.settings.timezone:<11} |"
        output += f"\n| Save Error Data      | {workflow.settings.save_data_error:<11} |"

        if workflow.tags:
            output += f"\n\nTags: {', '.join(workflow.tags)}"

        output += """

IMPLEMENTATION STEPS
────────────────────────────────────
1. Copy workflow JSON
2. Import into n8n
3. Configure credentials
4. Test with sample data
5. Activate workflow

Workflow Status: ● Ready to Deploy
"""
        return output

    @staticmethod
    def generate_flow_diagram(workflow: Workflow) -> str:
        """Generate ASCII flow diagram."""
        if not workflow.nodes:
            return "No nodes in workflow"

        diagram = "\nFLOW DIAGRAM\n"
        diagram += "═" * 40 + "\n\n"

        for idx, node in enumerate(workflow.nodes):
            box = f"[{node.name}]"
            diagram += f"  {box}\n"
            if idx < len(workflow.nodes) - 1:
                diagram += "      ↓\n"

        return diagram


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="N8N.WORKFLOW.EXE - n8n Workflow Builder"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Design command
    design_parser = subparsers.add_parser("design", help="Design new workflow")
    design_parser.add_argument("name", help="Workflow name")
    design_parser.add_argument("--pattern", "-p",
                              choices=[p.value for p in WorkflowPattern],
                              default="linear", help="Workflow pattern")
    design_parser.add_argument("--trigger", "-t",
                              choices=[t.value for t in TriggerType],
                              default="manual", help="Trigger type")

    # Template command
    template_parser = subparsers.add_parser("template", help="Get workflow template")
    template_parser.add_argument("type", choices=["webhook", "sync", "ai", "error"],
                                help="Template type")
    template_parser.add_argument("--name", "-n", help="Workflow name")

    # Code command
    code_parser = subparsers.add_parser("code", help="Generate Code node")
    code_parser.add_argument("task", help="What the code should do")

    # Debug command
    debug_parser = subparsers.add_parser("debug", help="Debug workflow issue")
    debug_parser.add_argument("issue", help="Issue description")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    if args.command == "design":
        pattern = WorkflowPattern(args.pattern)
        trigger = TriggerType(args.trigger)

        builder = WorkflowBuilder(args.name)
        builder.set_pattern(pattern)
        builder.add_trigger(trigger)

        workflow = builder.build()
        print(WorkflowReporter.generate_workflow_dashboard(workflow))
        print("\n\nWorkflow JSON:")
        print(workflow.export_json())

    elif args.command == "template":
        name = args.name or f"Template_{args.type}"

        if args.type == "webhook":
            workflow = TemplateLibrary.webhook_api(name, "/my-webhook")
        elif args.type == "sync":
            workflow = TemplateLibrary.scheduled_sync(name, "0 9 * * *", "https://api.example.com/data")
        elif args.type == "ai":
            workflow = TemplateLibrary.ai_agent(name, "You are a helpful assistant.")
        elif args.type == "error":
            workflow = TemplateLibrary.error_handler(name, "#alerts")

        print(WorkflowReporter.generate_workflow_dashboard(workflow))
        print("\n\nWorkflow JSON:")
        print(workflow.export_json())

    elif args.command == "demo":
        run_demo()

    else:
        parser.print_help()


def run_demo():
    """Run demonstration of workflow builder."""
    print("=" * 60)
    print("N8N.WORKFLOW.EXE - DEMONSTRATION")
    print("=" * 60)

    # Create webhook API workflow
    print("\n[1] Creating Webhook API Workflow...")
    webhook_workflow = (WorkflowBuilder("Order Webhook API", "Handle incoming orders")
        .set_pattern(WorkflowPattern.LINEAR)
        .add_trigger(TriggerType.WEBHOOK, path="/orders", method="POST")
        .add_set({
            "order_id": "={{ $json.body.order_id }}",
            "customer": "={{ $json.body.customer }}",
            "received_at": "={{ DateTime.now().toISO() }}"
        })
        .add_code("""
const items = $input.all();
return items.map(item => ({
    json: {
        ...item.json,
        processed: true,
        total: parseFloat(item.json.amount) * 1.1  // Add tax
    }
}));
""")
        .add_respond_webhook('{"status": "received", "order_id": "{{ $json.order_id }}"}', 200)
        .add_tag("api")
        .add_tag("orders")
        .build())

    print(WorkflowReporter.generate_workflow_dashboard(webhook_workflow))
    print(WorkflowReporter.generate_flow_diagram(webhook_workflow))

    # Create AI workflow
    print("\n[2] Creating AI Agent Workflow...")
    ai_workflow = (WorkflowBuilder("Support AI Agent", "AI-powered customer support")
        .set_pattern(WorkflowPattern.LINEAR)
        .add_trigger(TriggerType.MANUAL)
        .add_openai("You are a helpful customer support agent. Be friendly and professional.", "gpt-4")
        .add_slack("#support-logs", "AI Response: {{ $json.message.content }}")
        .add_tag("ai")
        .add_tag("support")
        .build())

    print(WorkflowReporter.generate_workflow_dashboard(ai_workflow))

    # Create scheduled sync
    print("\n[3] Creating Scheduled Sync Workflow...")
    sync_workflow = TemplateLibrary.scheduled_sync(
        "Daily Data Sync",
        "0 6 * * *",
        "https://api.example.com/export"
    )
    print(WorkflowReporter.generate_workflow_dashboard(sync_workflow))

    # Export sample JSON
    print("\n[4] Exporting Webhook Workflow JSON...")
    print("-" * 40)
    json_output = webhook_workflow.export_json()
    print(f"JSON Length: {len(json_output)} characters")
    print(f"Nodes: {webhook_workflow.node_count}")
    print(f"Connections: {len(webhook_workflow.connections)}")

    print("\n" + "=" * 60)
    print("DEMONSTRATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/n8n-workflow [use case]` - Design workflow
- `/n8n-workflow template [type]` - Get template
- `/n8n-workflow code [task]` - Generate Code node
- `/n8n-workflow debug [issue]` - Debug help
- `/n8n-workflow optimize [workflow]` - Improve performance

$ARGUMENTS
