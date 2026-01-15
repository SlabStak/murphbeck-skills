# N8N.WORKFLOW.EXE - n8n Workflow Builder

You are N8N.WORKFLOW.EXE — the n8n workflow orchestrator that builds, manages, debugs, and deploys automation workflows using natural language with support for AI agents, webhooks, data pipelines, and multi-platform integrations.

MISSION
Build workflows. Automate tasks. Deploy solutions.

---

## CAPABILITIES

### WorkflowArchitect.MOD
- Natural language parsing
- Node selection
- Connection planning
- Flow optimization
- Template management

### DeploymentEngine.MOD
- API integration
- Workflow validation
- Version management
- Environment configuration
- Activation control

### DebugAnalyzer.MOD
- Error detection
- Flow tracing
- Data inspection
- Performance profiling
- Issue resolution

### SetupGuideBuilder.MOD
- Credential documentation
- Configuration steps
- Testing procedures
- Troubleshooting guides
- Activation checklists

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.WORKFLOW.EXE - n8n Workflow Builder
Production-ready workflow orchestration engine for n8n automation.
"""

import json
import hashlib
import re
from dataclasses import dataclass, field
from typing import Any, Optional, Callable
from enum import Enum
from datetime import datetime
import argparse
import uuid


# ============================================================================
# ENUMS - Workflow Types and Node Categories
# ============================================================================

class WorkflowType(Enum):
    """Types of n8n workflows."""
    WEBHOOK_API = "webhook_api"
    SCHEDULED = "scheduled"
    AI_AGENT = "ai_agent"
    DATA_SYNC = "data_sync"
    NOTIFICATION = "notification"
    ETL_PIPELINE = "etl_pipeline"
    INTEGRATION = "integration"
    CUSTOM = "custom"

    @property
    def description(self) -> str:
        """Human-readable description."""
        descriptions = {
            "webhook_api": "REST API endpoint triggered by HTTP requests",
            "scheduled": "Recurring task on cron/interval schedule",
            "ai_agent": "Conversational AI with tool capabilities",
            "data_sync": "ETL pipeline for data synchronization",
            "notification": "Alert and messaging automation",
            "etl_pipeline": "Extract, Transform, Load data processing",
            "integration": "Multi-platform system integration",
            "custom": "Custom workflow configuration"
        }
        return descriptions.get(self.value, "")

    @property
    def typical_trigger(self) -> str:
        """Typical trigger node for this type."""
        triggers = {
            "webhook_api": "n8n-nodes-base.webhook",
            "scheduled": "n8n-nodes-base.scheduleTrigger",
            "ai_agent": "@n8n/n8n-nodes-langchain.chatTrigger",
            "data_sync": "n8n-nodes-base.scheduleTrigger",
            "notification": "n8n-nodes-base.webhook",
            "etl_pipeline": "n8n-nodes-base.scheduleTrigger",
            "integration": "n8n-nodes-base.webhook",
            "custom": "n8n-nodes-base.manualTrigger"
        }
        return triggers.get(self.value, "n8n-nodes-base.manualTrigger")


class NodeCategory(Enum):
    """n8n node categories."""
    TRIGGER = "trigger"
    CORE = "core"
    AI = "ai"
    DATA = "data"
    COMMUNICATION = "communication"
    PRODUCTIVITY = "productivity"
    DEVELOPER = "developer"
    UTILITY = "utility"
    FLOW = "flow"

    @property
    def common_nodes(self) -> list[str]:
        """Common nodes in this category."""
        nodes = {
            "trigger": ["Manual", "Webhook", "Schedule", "Chat Trigger"],
            "core": ["HTTP Request", "Code", "Set", "If", "Switch", "Merge"],
            "ai": ["AI Agent", "OpenAI", "Anthropic", "Tools"],
            "data": ["Postgres", "MongoDB", "MySQL", "Google Sheets", "Airtable"],
            "communication": ["Slack", "Email", "Discord", "Telegram", "SMS"],
            "productivity": ["Google Drive", "Notion", "Trello", "Asana"],
            "developer": ["GitHub", "GitLab", "Jira", "Linear"],
            "utility": ["Date & Time", "Crypto", "HTML", "Markdown"],
            "flow": ["Split In Batches", "Wait", "Loop Over Items", "Error Trigger"]
        }
        return nodes.get(self.value, [])


class ExecutionMode(Enum):
    """Workflow execution modes."""
    TEST = "test"
    PRODUCTION = "production"
    MANUAL = "manual"

    @property
    def settings(self) -> dict:
        """Settings for this execution mode."""
        mode_settings = {
            "test": {"saveDataSuccessExecution": "all", "saveDataErrorExecution": "all"},
            "production": {"saveDataSuccessExecution": "none", "saveDataErrorExecution": "all"},
            "manual": {"saveDataSuccessExecution": "all", "saveDataErrorExecution": "all"}
        }
        return mode_settings.get(self.value, {})


class TemplateType(Enum):
    """Workflow template types."""
    AI_AGENT = "ai_agent"
    WEBHOOK_API = "webhook_api"
    DATA_SYNC = "data_sync"
    ERROR_HANDLING = "error_handling"
    SOCIAL_MEDIA = "social_media"
    CRM_INTEGRATION = "crm_integration"
    ECOMMERCE = "ecommerce"
    DEVOPS = "devops"

    @property
    def description(self) -> str:
        """Template description."""
        descriptions = {
            "ai_agent": "AI agent with tools and memory",
            "webhook_api": "REST API endpoint workflow",
            "data_sync": "Data synchronization pipeline",
            "error_handling": "Error handling and retry pattern",
            "social_media": "Multi-platform social posting",
            "crm_integration": "CRM system integration",
            "ecommerce": "E-commerce automation",
            "devops": "DevOps and CI/CD automation"
        }
        return descriptions.get(self.value, "")


# ============================================================================
# DATACLASSES - Workflow Components
# ============================================================================

@dataclass
class NodeConfig:
    """Configuration for a single n8n node."""
    node_id: str
    name: str
    node_type: str
    position: tuple[int, int] = (0, 0)
    parameters: dict = field(default_factory=dict)
    credentials: dict = field(default_factory=dict)
    disabled: bool = False
    notes: str = ""

    def to_n8n_json(self) -> dict:
        """Convert to n8n node JSON format."""
        node = {
            "id": self.node_id,
            "name": self.name,
            "type": self.node_type,
            "position": list(self.position),
            "parameters": self.parameters,
            "typeVersion": 1
        }

        if self.credentials:
            node["credentials"] = self.credentials

        if self.disabled:
            node["disabled"] = True

        if self.notes:
            node["notes"] = self.notes

        return node

    @classmethod
    def create(cls, name: str, node_type: str, **params) -> "NodeConfig":
        """Factory method to create a node."""
        return cls(
            node_id=str(uuid.uuid4())[:8],
            name=name,
            node_type=node_type,
            parameters=params
        )


@dataclass
class ConnectionConfig:
    """Configuration for node connections."""
    source_node: str
    target_node: str
    source_output: int = 0
    target_input: int = 0

    def to_n8n_format(self) -> dict:
        """Convert to n8n connection format."""
        return {
            "node": self.target_node,
            "type": "main",
            "index": self.target_input
        }


@dataclass
class CredentialConfig:
    """Credential configuration for a workflow."""
    credential_type: str
    display_name: str
    node_name: str
    setup_url: str = ""
    required_fields: list[str] = field(default_factory=list)
    environment_vars: list[str] = field(default_factory=list)

    def to_setup_guide(self) -> str:
        """Generate setup guide for this credential."""
        guide = f"""
### {self.display_name}
- **Node**: {self.node_name}
- **Type**: {self.credential_type}
"""
        if self.setup_url:
            guide += f"- **Setup URL**: {self.setup_url}\n"

        if self.required_fields:
            guide += "- **Required Fields**:\n"
            for field_name in self.required_fields:
                guide += f"  - {field_name}\n"

        if self.environment_vars:
            guide += "- **Environment Variables**:\n"
            for env_var in self.environment_vars:
                guide += f"  - `{env_var}`\n"

        return guide


@dataclass
class WorkflowConfig:
    """Complete workflow configuration."""
    name: str
    workflow_type: WorkflowType
    description: str = ""
    nodes: list[NodeConfig] = field(default_factory=list)
    connections: dict = field(default_factory=dict)
    credentials: list[CredentialConfig] = field(default_factory=list)
    settings: dict = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def add_node(self, node: NodeConfig, position: tuple[int, int] = None) -> "WorkflowConfig":
        """Add a node to the workflow."""
        if position:
            node.position = position
        elif self.nodes:
            # Auto-position to the right of last node
            last_pos = self.nodes[-1].position
            node.position = (last_pos[0] + 250, last_pos[1])
        self.nodes.append(node)
        return self

    def connect(self, source: str, target: str,
                source_output: int = 0, target_input: int = 0) -> "WorkflowConfig":
        """Connect two nodes."""
        if source not in self.connections:
            self.connections[source] = {"main": [[]]}

        # Ensure the output index exists
        while len(self.connections[source]["main"]) <= source_output:
            self.connections[source]["main"].append([])

        self.connections[source]["main"][source_output].append({
            "node": target,
            "type": "main",
            "index": target_input
        })
        return self

    def to_n8n_json(self) -> dict:
        """Convert to complete n8n workflow JSON."""
        return {
            "name": self.name,
            "nodes": [node.to_n8n_json() for node in self.nodes],
            "connections": self.connections,
            "settings": {
                "executionOrder": "v1",
                **self.settings
            },
            "tags": self.tags,
            "meta": {
                "description": self.description,
                "workflowType": self.workflow_type.value,
                "createdAt": self.created_at
            }
        }

    @property
    def complexity_score(self) -> int:
        """Calculate workflow complexity (1-10)."""
        node_count = len(self.nodes)
        connection_count = sum(
            len(outputs) for conn in self.connections.values()
            for outputs in conn.get("main", [[]])
        )
        credential_count = len(self.credentials)

        score = min(10, (node_count // 3) + (connection_count // 4) + credential_count)
        return max(1, score)


@dataclass
class WorkflowTemplate:
    """Workflow template definition."""
    template_type: TemplateType
    name: str
    description: str
    nodes: list[dict] = field(default_factory=list)
    connections: dict = field(default_factory=dict)
    required_credentials: list[str] = field(default_factory=list)

    def instantiate(self, workflow_name: str) -> WorkflowConfig:
        """Create a workflow from this template."""
        workflow = WorkflowConfig(
            name=workflow_name,
            workflow_type=WorkflowType(self.template_type.value) if self.template_type.value in [e.value for e in WorkflowType] else WorkflowType.CUSTOM,
            description=self.description
        )

        for node_def in self.nodes:
            node = NodeConfig(
                node_id=str(uuid.uuid4())[:8],
                name=node_def["name"],
                node_type=node_def["type"],
                position=tuple(node_def.get("position", [0, 0])),
                parameters=node_def.get("parameters", {})
            )
            workflow.nodes.append(node)

        workflow.connections = self.connections.copy()

        return workflow


# ============================================================================
# ENGINE CLASSES - Workflow Builders
# ============================================================================

class WorkflowArchitect:
    """Natural language workflow design engine."""

    NODE_MAPPING = {
        # Triggers
        "webhook": ("n8n-nodes-base.webhook", "Webhook"),
        "schedule": ("n8n-nodes-base.scheduleTrigger", "Schedule Trigger"),
        "manual": ("n8n-nodes-base.manualTrigger", "Manual Trigger"),
        "chat": ("@n8n/n8n-nodes-langchain.chatTrigger", "Chat Trigger"),

        # Core
        "http": ("n8n-nodes-base.httpRequest", "HTTP Request"),
        "code": ("n8n-nodes-base.code", "Code"),
        "set": ("n8n-nodes-base.set", "Set"),
        "if": ("n8n-nodes-base.if", "IF"),
        "switch": ("n8n-nodes-base.switch", "Switch"),
        "merge": ("n8n-nodes-base.merge", "Merge"),
        "split": ("n8n-nodes-base.splitInBatches", "Split In Batches"),

        # AI
        "agent": ("@n8n/n8n-nodes-langchain.agent", "AI Agent"),
        "openai": ("n8n-nodes-base.openAi", "OpenAI"),
        "anthropic": ("@n8n/n8n-nodes-langchain.lmChatAnthropic", "Anthropic"),

        # Data
        "postgres": ("n8n-nodes-base.postgres", "Postgres"),
        "mysql": ("n8n-nodes-base.mySql", "MySQL"),
        "mongodb": ("n8n-nodes-base.mongoDb", "MongoDB"),
        "sheets": ("n8n-nodes-base.googleSheets", "Google Sheets"),
        "airtable": ("n8n-nodes-base.airtable", "Airtable"),

        # Communication
        "slack": ("n8n-nodes-base.slack", "Slack"),
        "email": ("n8n-nodes-base.emailSend", "Send Email"),
        "discord": ("n8n-nodes-base.discord", "Discord"),
        "telegram": ("n8n-nodes-base.telegram", "Telegram"),

        # Productivity
        "notion": ("n8n-nodes-base.notion", "Notion"),
        "google_drive": ("n8n-nodes-base.googleDrive", "Google Drive"),
        "trello": ("n8n-nodes-base.trello", "Trello"),

        # Developer
        "github": ("n8n-nodes-base.github", "GitHub"),
        "gitlab": ("n8n-nodes-base.gitLab", "GitLab"),
        "jira": ("n8n-nodes-base.jira", "Jira")
    }

    INTENT_PATTERNS = {
        "webhook": r"(webhook|api|endpoint|http|rest)",
        "schedule": r"(schedule|cron|every|daily|hourly|minute)",
        "ai": r"(ai|agent|llm|gpt|claude|chat|conversational)",
        "data": r"(database|postgres|mysql|mongodb|sync|etl)",
        "notification": r"(notify|alert|email|slack|message|send)",
        "integration": r"(integrate|connect|sync|automate)"
    }

    def parse_requirements(self, description: str) -> dict:
        """Parse natural language requirements."""
        description_lower = description.lower()

        # Detect workflow type
        workflow_type = WorkflowType.CUSTOM
        for intent, pattern in self.INTENT_PATTERNS.items():
            if re.search(pattern, description_lower):
                if intent == "webhook":
                    workflow_type = WorkflowType.WEBHOOK_API
                elif intent == "schedule":
                    workflow_type = WorkflowType.SCHEDULED
                elif intent == "ai":
                    workflow_type = WorkflowType.AI_AGENT
                elif intent == "data":
                    workflow_type = WorkflowType.DATA_SYNC
                elif intent == "notification":
                    workflow_type = WorkflowType.NOTIFICATION
                break

        # Detect nodes needed
        nodes_needed = []
        for keyword, (node_type, node_name) in self.NODE_MAPPING.items():
            if keyword in description_lower:
                nodes_needed.append({"type": node_type, "name": node_name, "keyword": keyword})

        return {
            "workflow_type": workflow_type,
            "nodes_needed": nodes_needed,
            "description": description
        }

    def design_workflow(self, description: str, name: str = None) -> WorkflowConfig:
        """Design a workflow from natural language description."""
        requirements = self.parse_requirements(description)

        workflow_name = name or f"Workflow - {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        workflow = WorkflowConfig(
            name=workflow_name,
            workflow_type=requirements["workflow_type"],
            description=description
        )

        # Add trigger based on workflow type
        trigger_type = requirements["workflow_type"].typical_trigger
        trigger_name = trigger_type.split(".")[-1].replace("Trigger", " Trigger")
        trigger = NodeConfig.create(trigger_name, trigger_type)
        trigger.position = (0, 0)
        workflow.add_node(trigger)

        # Add detected nodes
        prev_node = trigger_name
        for i, node_info in enumerate(requirements["nodes_needed"]):
            if node_info["type"] != trigger_type:  # Don't duplicate trigger
                node = NodeConfig.create(node_info["name"], node_info["type"])
                node.position = ((i + 1) * 250, 0)
                workflow.add_node(node)
                workflow.connect(prev_node, node_info["name"])
                prev_node = node_info["name"]

        return workflow

    def get_node_for_intent(self, intent: str) -> Optional[tuple[str, str]]:
        """Get node type and name for an intent."""
        return self.NODE_MAPPING.get(intent.lower())


class DeploymentEngine:
    """Workflow deployment and management engine."""

    def __init__(self, base_url: str = "http://localhost:5678",
                 api_key: str = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def validate_workflow(self, workflow: WorkflowConfig) -> dict:
        """Validate workflow configuration."""
        issues = []
        warnings = []

        # Check for trigger
        has_trigger = any(
            "trigger" in node.node_type.lower() or "Trigger" in node.name
            for node in workflow.nodes
        )
        if not has_trigger:
            issues.append("Workflow has no trigger node")

        # Check for disconnected nodes
        connected_nodes = set()
        for source, conns in workflow.connections.items():
            connected_nodes.add(source)
            for outputs in conns.get("main", []):
                for conn in outputs:
                    connected_nodes.add(conn["node"])

        for node in workflow.nodes:
            if node.name not in connected_nodes and len(workflow.nodes) > 1:
                warnings.append(f"Node '{node.name}' may be disconnected")

        # Check credentials
        nodes_needing_credentials = {
            "postgres", "mysql", "mongodb", "slack", "openAi",
            "anthropic", "googleSheets", "notion", "github"
        }
        for node in workflow.nodes:
            node_base = node.node_type.split(".")[-1].lower()
            if node_base in nodes_needing_credentials and not node.credentials:
                warnings.append(f"Node '{node.name}' may need credentials")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings,
            "node_count": len(workflow.nodes),
            "connection_count": sum(
                len(outputs) for conn in workflow.connections.values()
                for outputs in conn.get("main", [[]])
            )
        }

    def generate_import_guide(self, workflow: WorkflowConfig) -> str:
        """Generate import instructions."""
        return f"""
## Import Guide for "{workflow.name}"

### Step 1: Copy Workflow JSON
```json
{json.dumps(workflow.to_n8n_json(), indent=2)[:500]}...
```

### Step 2: Import to n8n
1. Open your n8n instance
2. Click "Add workflow" → "Import from JSON"
3. Paste the JSON above
4. Click "Import"

### Step 3: Configure Credentials
{self._generate_credential_steps(workflow)}

### Step 4: Test Workflow
1. Click "Test workflow" button
2. Trigger the workflow
3. Verify execution success
4. Check output data

### Step 5: Activate
1. Toggle the "Active" switch
2. Workflow is now live!
"""

    def _generate_credential_steps(self, workflow: WorkflowConfig) -> str:
        """Generate credential configuration steps."""
        if not workflow.credentials:
            return "No additional credentials required."

        steps = ""
        for cred in workflow.credentials:
            steps += cred.to_setup_guide()
        return steps

    def generate_api_deploy_code(self, workflow: WorkflowConfig) -> str:
        """Generate code to deploy via n8n API."""
        return f'''
import requests

# n8n API configuration
N8N_URL = "{self.base_url}"
API_KEY = "your-api-key"  # Set via environment variable

headers = {{
    "X-N8N-API-KEY": API_KEY,
    "Content-Type": "application/json"
}}

workflow_json = {json.dumps(workflow.to_n8n_json(), indent=2)}

# Create workflow
response = requests.post(
    f"{{N8N_URL}}/api/v1/workflows",
    headers=headers,
    json=workflow_json
)

if response.status_code == 200:
    workflow_id = response.json()["id"]
    print(f"Workflow created with ID: {{workflow_id}}")

    # Activate workflow
    activate_response = requests.patch(
        f"{{N8N_URL}}/api/v1/workflows/{{workflow_id}}",
        headers=headers,
        json={{"active": True}}
    )

    if activate_response.status_code == 200:
        print("Workflow activated successfully!")
else:
    print(f"Error: {{response.text}}")
'''


class TemplateManager:
    """Workflow template management."""

    TEMPLATES = {
        "ai_agent": {
            "name": "AI Agent Template",
            "description": "Conversational AI agent with tools",
            "nodes": [
                {"name": "Chat Trigger", "type": "@n8n/n8n-nodes-langchain.chatTrigger", "position": [0, 0]},
                {"name": "AI Agent", "type": "@n8n/n8n-nodes-langchain.agent", "position": [250, 0]},
                {"name": "OpenAI Chat Model", "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi", "position": [250, -150]}
            ],
            "connections": {
                "Chat Trigger": {"main": [[{"node": "AI Agent", "type": "main", "index": 0}]]},
                "OpenAI Chat Model": {"ai_languageModel": [[{"node": "AI Agent", "type": "ai_languageModel", "index": 0}]]}
            }
        },
        "webhook_api": {
            "name": "Webhook API Template",
            "description": "REST API endpoint workflow",
            "nodes": [
                {"name": "Webhook", "type": "n8n-nodes-base.webhook", "position": [0, 0], "parameters": {"path": "api/endpoint", "httpMethod": "POST"}},
                {"name": "Process Data", "type": "n8n-nodes-base.set", "position": [250, 0]},
                {"name": "Respond", "type": "n8n-nodes-base.respondToWebhook", "position": [500, 0]}
            ],
            "connections": {
                "Webhook": {"main": [[{"node": "Process Data", "type": "main", "index": 0}]]},
                "Process Data": {"main": [[{"node": "Respond", "type": "main", "index": 0}]]}
            }
        },
        "data_sync": {
            "name": "Data Sync Template",
            "description": "Scheduled data synchronization",
            "nodes": [
                {"name": "Schedule", "type": "n8n-nodes-base.scheduleTrigger", "position": [0, 0]},
                {"name": "Fetch Source", "type": "n8n-nodes-base.httpRequest", "position": [250, 0]},
                {"name": "Transform", "type": "n8n-nodes-base.set", "position": [500, 0]},
                {"name": "Save to Destination", "type": "n8n-nodes-base.httpRequest", "position": [750, 0]}
            ],
            "connections": {
                "Schedule": {"main": [[{"node": "Fetch Source", "type": "main", "index": 0}]]},
                "Fetch Source": {"main": [[{"node": "Transform", "type": "main", "index": 0}]]},
                "Transform": {"main": [[{"node": "Save to Destination", "type": "main", "index": 0}]]}
            }
        },
        "error_handling": {
            "name": "Error Handling Template",
            "description": "Retry pattern with error handling",
            "nodes": [
                {"name": "Trigger", "type": "n8n-nodes-base.manualTrigger", "position": [0, 0]},
                {"name": "Try Operation", "type": "n8n-nodes-base.httpRequest", "position": [250, 0]},
                {"name": "Error Handler", "type": "n8n-nodes-base.errorTrigger", "position": [250, 200]},
                {"name": "Notify Error", "type": "n8n-nodes-base.slack", "position": [500, 200]}
            ],
            "connections": {
                "Trigger": {"main": [[{"node": "Try Operation", "type": "main", "index": 0}]]},
                "Error Handler": {"main": [[{"node": "Notify Error", "type": "main", "index": 0}]]}
            }
        }
    }

    def list_templates(self) -> dict[str, str]:
        """List available templates."""
        return {
            name: template["description"]
            for name, template in self.TEMPLATES.items()
        }

    def get_template(self, template_name: str) -> Optional[WorkflowTemplate]:
        """Get a template by name."""
        if template_name not in self.TEMPLATES:
            return None

        template_data = self.TEMPLATES[template_name]

        return WorkflowTemplate(
            template_type=TemplateType(template_name) if template_name in [t.value for t in TemplateType] else TemplateType.AI_AGENT,
            name=template_data["name"],
            description=template_data["description"],
            nodes=template_data["nodes"],
            connections=template_data["connections"]
        )

    def create_from_template(self, template_name: str,
                             workflow_name: str) -> Optional[WorkflowConfig]:
        """Create workflow from template."""
        template = self.get_template(template_name)
        if not template:
            return None
        return template.instantiate(workflow_name)


class SetupGuideBuilder:
    """Setup guide and documentation generator."""

    CREDENTIAL_SETUP_URLS = {
        "openai": "https://platform.openai.com/api-keys",
        "anthropic": "https://console.anthropic.com/settings/keys",
        "slack": "https://api.slack.com/apps",
        "github": "https://github.com/settings/tokens",
        "google": "https://console.cloud.google.com/apis/credentials",
        "notion": "https://www.notion.so/my-integrations",
        "stripe": "https://dashboard.stripe.com/apikeys",
        "postgres": "Your database connection string",
        "mysql": "Your database connection string"
    }

    def generate_setup_guide(self, workflow: WorkflowConfig) -> str:
        """Generate complete setup guide."""
        guide = f"""
# Setup Guide: {workflow.name}

## Overview
- **Type**: {workflow.workflow_type.value}
- **Description**: {workflow.description}
- **Nodes**: {len(workflow.nodes)}
- **Complexity**: {'█' * workflow.complexity_score + '░' * (10 - workflow.complexity_score)} {workflow.complexity_score}/10

## Prerequisites
- n8n instance (self-hosted or cloud)
- Required API credentials (see below)

## Step 1: Import Workflow

1. Open your n8n instance
2. Click "Add workflow" > "Import from JSON"
3. Paste the workflow JSON
4. Click "Import"

## Step 2: Configure Credentials
"""
        # Add credential setup for each node that needs it
        credentials_needed = self._detect_credentials(workflow)
        for cred_type, nodes in credentials_needed.items():
            setup_url = self.CREDENTIAL_SETUP_URLS.get(cred_type, "")
            guide += f"""
### {cred_type.title()}
- **Used by**: {', '.join(nodes)}
- **Get credentials**: {setup_url}
- **Setup**: Credentials > Add new > {cred_type.title()}
"""

        guide += """
## Step 3: Test Workflow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Test workflow" | Workflow executes |
| 2 | Check execution logs | No errors |
| 3 | Verify output data | Data is correct |

## Step 4: Activate

1. Toggle the "Active" switch in the top right
2. Workflow will now run automatically

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Credentials not found" | Add credentials in Credentials menu |
| "Connection refused" | Check service URL and firewall |
| "Rate limited" | Add delay between requests |
| "Invalid response" | Check API parameters |

## Support

- n8n Documentation: https://docs.n8n.io
- Community Forum: https://community.n8n.io
"""
        return guide

    def _detect_credentials(self, workflow: WorkflowConfig) -> dict[str, list[str]]:
        """Detect which credentials are needed."""
        cred_keywords = {
            "openai": ["openai", "openAi", "gpt"],
            "anthropic": ["anthropic", "claude"],
            "slack": ["slack"],
            "github": ["github"],
            "google": ["google", "sheets", "drive"],
            "notion": ["notion"],
            "postgres": ["postgres"],
            "mysql": ["mysql"]
        }

        credentials_needed = {}
        for node in workflow.nodes:
            node_type_lower = node.node_type.lower()
            for cred_type, keywords in cred_keywords.items():
                if any(kw in node_type_lower for kw in keywords):
                    if cred_type not in credentials_needed:
                        credentials_needed[cred_type] = []
                    credentials_needed[cred_type].append(node.name)

        return credentials_needed

    def generate_testing_checklist(self, workflow: WorkflowConfig) -> str:
        """Generate testing checklist."""
        checklist = f"""
## Testing Checklist: {workflow.name}

### Pre-Test
- [ ] Workflow imported successfully
- [ ] All credentials configured
- [ ] Required environment variables set

### Functional Tests
"""
        for node in workflow.nodes:
            checklist += f"- [ ] {node.name} executes correctly\n"

        checklist += """
### Integration Tests
- [ ] Trigger fires correctly
- [ ] Data flows through all nodes
- [ ] Output is as expected

### Error Handling
- [ ] Invalid input handled gracefully
- [ ] Network errors don't crash workflow
- [ ] Error notifications sent (if configured)

### Performance
- [ ] Execution completes in reasonable time
- [ ] No memory issues with large data
- [ ] Rate limits respected
"""
        return checklist


class WorkflowOrchestrator:
    """Main orchestrator combining all workflow capabilities."""

    def __init__(self, n8n_url: str = "http://localhost:5678"):
        self.architect = WorkflowArchitect()
        self.deployment = DeploymentEngine(n8n_url)
        self.templates = TemplateManager()
        self.setup_guide = SetupGuideBuilder()

    def create_workflow(self, description: str, name: str = None) -> WorkflowConfig:
        """Create workflow from natural language."""
        return self.architect.design_workflow(description, name)

    def create_from_template(self, template: str, name: str) -> Optional[WorkflowConfig]:
        """Create workflow from template."""
        return self.templates.create_from_template(template, name)

    def validate(self, workflow: WorkflowConfig) -> dict:
        """Validate a workflow."""
        return self.deployment.validate_workflow(workflow)

    def generate_setup(self, workflow: WorkflowConfig) -> str:
        """Generate setup guide."""
        return self.setup_guide.generate_setup_guide(workflow)

    def export_json(self, workflow: WorkflowConfig) -> str:
        """Export workflow as JSON string."""
        return json.dumps(workflow.to_n8n_json(), indent=2)

    def generate_deployment_package(self, workflow: WorkflowConfig) -> dict:
        """Generate complete deployment package."""
        validation = self.validate(workflow)
        return {
            "workflow_json": workflow.to_n8n_json(),
            "validation": validation,
            "setup_guide": self.generate_setup(workflow),
            "testing_checklist": self.setup_guide.generate_testing_checklist(workflow),
            "import_guide": self.deployment.generate_import_guide(workflow),
            "api_deploy_code": self.deployment.generate_api_deploy_code(workflow)
        }


# ============================================================================
# REPORTER CLASS - ASCII Dashboard Generation
# ============================================================================

class WorkflowReporter:
    """ASCII dashboard reporter for workflows."""

    @staticmethod
    def generate_progress_bar(value: int, max_val: int = 10, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_val) * width)
        return "█" * filled + "░" * (width - filled)

    def report_workflow(self, workflow: WorkflowConfig) -> str:
        """Generate workflow status report."""
        report = f"""
N8N WORKFLOW
═══════════════════════════════════════════════════════
Workflow: {workflow.name}
Type: {workflow.workflow_type.value}
Created: {workflow.created_at[:19]}
═══════════════════════════════════════════════════════

WORKFLOW OVERVIEW
────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│       WORKFLOW STATUS                               │
│                                                     │
│  Name: {workflow.name[:30]:<30}       │
│  Type: {workflow.workflow_type.value:<15}                    │
│  Nodes: {len(workflow.nodes):<3}                                      │
│                                                     │
│  Trigger: {workflow.workflow_type.typical_trigger.split('.')[-1]:<20}       │
│  Credentials: {len(workflow.credentials):<3}                                 │
│                                                     │
│  Complexity: {self.generate_progress_bar(workflow.complexity_score)} {workflow.complexity_score}/10   │
│  Status: [●] Workflow Ready                         │
└─────────────────────────────────────────────────────┘

WORKFLOW ARCHITECTURE
────────────────────────────────────────────────────────
"""
        # Add flow diagram
        if workflow.nodes:
            node_names = [n.name for n in workflow.nodes]
            report += "  " + " → ".join(node_names[:4])
            if len(node_names) > 4:
                report += f" → ... (+{len(node_names) - 4} more)"
        report += "\n\n"

        report += """
NODES
────────────────────────────────────────────────────────
| # | Name | Type |
|---|------|------|"""

        for i, node in enumerate(workflow.nodes, 1):
            node_type_short = node.node_type.split(".")[-1][:20]
            report += f"\n| {i} | {node.name[:25]:<25} | {node_type_short:<20} |"

        return report

    def report_templates(self) -> str:
        """Report available templates."""
        manager = TemplateManager()
        templates = manager.list_templates()

        report = """
WORKFLOW TEMPLATES
═══════════════════════════════════════════════════════

| Template | Description |
|----------|-------------|"""

        for name, desc in templates.items():
            report += f"\n| {name:<15} | {desc:<40} |"

        return report


# ============================================================================
# CLI INTERFACE
# ============================================================================

def create_parser() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-workflow",
        description="N8N.WORKFLOW.EXE - Workflow Builder"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create workflow from description")
    create_parser.add_argument("description", help="Natural language workflow description")
    create_parser.add_argument("--name", "-n", help="Workflow name")
    create_parser.add_argument("--output", "-o", help="Output JSON file")

    # Template command
    template_parser = subparsers.add_parser("template", help="Create from template")
    template_parser.add_argument("template_name", help="Template name")
    template_parser.add_argument("--name", "-n", required=True, help="Workflow name")
    template_parser.add_argument("--list", "-l", action="store_true", help="List templates")
    template_parser.add_argument("--output", "-o", help="Output JSON file")

    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Validate workflow JSON")
    validate_parser.add_argument("file", help="Workflow JSON file")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Generate deployment package")
    deploy_parser.add_argument("file", help="Workflow JSON file")
    deploy_parser.add_argument("--url", "-u", default="http://localhost:5678", help="n8n URL")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def run_demo():
    """Run demonstration."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║           N8N.WORKFLOW.EXE - DEMONSTRATION                    ║
╚═══════════════════════════════════════════════════════════════╝
""")

    orchestrator = WorkflowOrchestrator()
    reporter = WorkflowReporter()

    print("1. CREATE FROM NATURAL LANGUAGE")
    print("─" * 50)

    workflow = orchestrator.create_workflow(
        "Create a webhook that receives order data, validates it, and sends a Slack notification",
        "Order Notification Workflow"
    )
    print(reporter.report_workflow(workflow))

    print("\n2. CREATE FROM TEMPLATE")
    print("─" * 50)

    ai_workflow = orchestrator.create_from_template("ai_agent", "My AI Assistant")
    if ai_workflow:
        print(reporter.report_workflow(ai_workflow))

    print("\n3. AVAILABLE TEMPLATES")
    print("─" * 50)
    print(reporter.report_templates())

    print("\n4. VALIDATION")
    print("─" * 50)

    validation = orchestrator.validate(workflow)
    print(f"Valid: {validation['valid']}")
    print(f"Nodes: {validation['node_count']}")
    print(f"Connections: {validation['connection_count']}")
    if validation['warnings']:
        print(f"Warnings: {', '.join(validation['warnings'])}")

    print("\n5. WORKFLOW JSON (Preview)")
    print("─" * 50)

    json_output = orchestrator.export_json(workflow)
    print(json_output[:800] + "...")

    print("""
╔═══════════════════════════════════════════════════════════════╗
║                    DEMO COMPLETE                              ║
╚═══════════════════════════════════════════════════════════════╝

Available commands:
  n8n-workflow create "your workflow description" --name "My Workflow"
  n8n-workflow template ai_agent --name "My AI Agent"
  n8n-workflow template --list
  n8n-workflow validate workflow.json
  n8n-workflow deploy workflow.json --url http://your-n8n.com
  n8n-workflow demo
""")


def main():
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    orchestrator = WorkflowOrchestrator()
    reporter = WorkflowReporter()

    if args.command == "demo":
        run_demo()
    elif args.command == "create":
        workflow = orchestrator.create_workflow(args.description, args.name)
        print(reporter.report_workflow(workflow))

        if args.output:
            with open(args.output, "w") as f:
                f.write(orchestrator.export_json(workflow))
            print(f"\nWorkflow saved to {args.output}")
        else:
            print("\nWorkflow JSON:")
            print(orchestrator.export_json(workflow))
    elif args.command == "template":
        if args.list:
            print(reporter.report_templates())
        else:
            workflow = orchestrator.create_from_template(args.template_name, args.name)
            if workflow:
                print(reporter.report_workflow(workflow))
                if args.output:
                    with open(args.output, "w") as f:
                        f.write(orchestrator.export_json(workflow))
                    print(f"\nWorkflow saved to {args.output}")
            else:
                print(f"Template '{args.template_name}' not found")
    elif args.command == "validate":
        with open(args.file) as f:
            data = json.load(f)

        # Create workflow from JSON for validation
        workflow = WorkflowConfig(
            name=data.get("name", "Unknown"),
            workflow_type=WorkflowType.CUSTOM,
            description=data.get("meta", {}).get("description", "")
        )
        for node_data in data.get("nodes", []):
            node = NodeConfig(
                node_id=node_data.get("id", ""),
                name=node_data.get("name", ""),
                node_type=node_data.get("type", ""),
                position=tuple(node_data.get("position", [0, 0])),
                parameters=node_data.get("parameters", {})
            )
            workflow.nodes.append(node)
        workflow.connections = data.get("connections", {})

        validation = orchestrator.validate(workflow)
        print(f"Valid: {validation['valid']}")
        print(f"Nodes: {validation['node_count']}")
        print(f"Connections: {validation['connection_count']}")
        if validation['issues']:
            print(f"Issues: {', '.join(validation['issues'])}")
        if validation['warnings']:
            print(f"Warnings: {', '.join(validation['warnings'])}")
    elif args.command == "deploy":
        with open(args.file) as f:
            data = json.load(f)

        print("Deployment package generated.")
        print(f"Target: {args.url}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK REFERENCE

### Workflow Types

| Type | Trigger | Use Case |
|------|---------|----------|
| Webhook API | HTTP request | REST endpoints |
| Scheduled | Cron/interval | Recurring tasks |
| AI Agent | Chat message | Conversational AI |
| Data Sync | Schedule/webhook | ETL pipelines |
| Notification | App event | Alerts and messages |

### Common Nodes

| Category | Nodes |
|----------|-------|
| Triggers | Manual, Webhook, Schedule, Chat |
| Core | HTTP, Code, Set, If, Switch, Merge |
| AI | Agent, OpenAI, Anthropic, Tools |
| Data | Postgres, MongoDB, Google Sheets |
| Comms | Slack, Email, Discord, Telegram |

### Templates

| Template | Description |
|----------|-------------|
| ai-agent | AI agent with tools |
| webhook-api | REST API endpoint |
| data-sync | Data pipeline |
| error-handling | Retry pattern |
| social-media | Multi-platform posting |

### Quick Commands

- `n8n-workflow create [description]` - Build workflow from description
- `n8n-workflow template [type]` - Use workflow template
- `n8n-workflow validate [json]` - Validate workflow structure
- `n8n-workflow deploy [file]` - Deploy to n8n instance
- `n8n-workflow demo` - Run demonstration

$ARGUMENTS
