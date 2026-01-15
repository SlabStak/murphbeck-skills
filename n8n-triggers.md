# N8N.TRIGGERS.EXE - n8n Trigger & Scheduling Specialist

You are N8N.TRIGGERS.EXE — the n8n trigger configuration specialist that sets up webhooks, schedules, app triggers, and polling patterns with proper authentication, validation, and error handling.

MISSION
Configure triggers. Schedule automation. Handle events.

---

## CAPABILITIES

### WebhookArchitect.MOD
- Endpoint configuration
- Authentication setup
- Payload validation
- Response handling
- Security hardening

### ScheduleEngine.MOD
- Cron expression building
- Interval configuration
- Timezone handling
- Business hour rules
- Calendar integration

### AppTriggerManager.MOD
- SaaS event triggers
- OAuth configuration
- Event filtering
- Polling optimization
- Real-time webhooks

### ValidationEngine.MOD
- Signature verification
- Schema validation
- Deduplication
- Rate limiting
- Error handling

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.TRIGGERS.EXE - n8n Trigger & Scheduling Specialist
Production-ready trigger configuration engine for n8n workflows.
"""

import json
import hashlib
import hmac
import re
from dataclasses import dataclass, field
from typing import Any, Optional, Callable
from enum import Enum
from datetime import datetime, timedelta
import argparse


# ============================================================================
# ENUMS - Trigger Types and Configurations
# ============================================================================

class TriggerType(Enum):
    """Types of workflow triggers."""
    MANUAL = "manual"
    WEBHOOK = "webhook"
    SCHEDULE = "schedule"
    APP_TRIGGER = "app_trigger"
    POLLING = "polling"
    CHAT = "chat"
    EMAIL = "email"

    @property
    def n8n_node(self) -> str:
        """n8n node type for this trigger."""
        node_map = {
            "manual": "n8n-nodes-base.manualTrigger",
            "webhook": "n8n-nodes-base.webhook",
            "schedule": "n8n-nodes-base.scheduleTrigger",
            "app_trigger": "n8n-nodes-base.trigger",
            "polling": "n8n-nodes-base.poll",
            "chat": "@n8n/n8n-nodes-langchain.chatTrigger",
            "email": "n8n-nodes-base.emailTrigger"
        }
        return node_map.get(self.value, "n8n-nodes-base.manualTrigger")

    @property
    def requires_credentials(self) -> bool:
        """Whether this trigger typically requires credentials."""
        return self.value in ["app_trigger", "polling", "email"]


class AuthMethod(Enum):
    """Webhook authentication methods."""
    NONE = "none"
    BASIC = "basicAuth"
    HEADER = "headerAuth"
    JWT = "jwt"
    HMAC = "hmacSignature"
    OAUTH2 = "oAuth2"

    @property
    def n8n_authentication(self) -> str:
        """n8n authentication parameter value."""
        return self.value


class HttpMethod(Enum):
    """HTTP methods for webhooks."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"
    HEAD = "HEAD"

    @property
    def allows_body(self) -> bool:
        """Whether this method typically has a request body."""
        return self.value in ["POST", "PUT", "PATCH"]


class ResponseMode(Enum):
    """Webhook response modes."""
    IMMEDIATE = "onReceived"
    LAST_NODE = "lastNode"
    RESPONSE_NODE = "responseNode"

    @property
    def description(self) -> str:
        """Human-readable description."""
        descriptions = {
            "onReceived": "Respond immediately when request is received",
            "lastNode": "Respond with output from last node",
            "responseNode": "Use Respond to Webhook node for custom response"
        }
        return descriptions.get(self.value, "")


class ScheduleInterval(Enum):
    """Common schedule intervals."""
    MINUTE = "minutes"
    HOUR = "hours"
    DAY = "days"
    WEEK = "weeks"
    MONTH = "months"
    CRON = "cronExpression"

    @property
    def n8n_rule(self) -> str:
        """n8n schedule rule type."""
        if self.value == "cronExpression":
            return "cronExpression"
        return "interval"


class AppTriggerSource(Enum):
    """Common app trigger sources."""
    GITHUB = "github"
    SLACK = "slack"
    STRIPE = "stripe"
    SHOPIFY = "shopify"
    GMAIL = "gmail"
    NOTION = "notion"
    AIRTABLE = "airtable"
    HUBSPOT = "hubspot"
    SALESFORCE = "salesforce"
    WEBHOOK_GENERIC = "webhook"

    @property
    def n8n_node(self) -> str:
        """n8n trigger node for this app."""
        node_map = {
            "github": "n8n-nodes-base.githubTrigger",
            "slack": "n8n-nodes-base.slackTrigger",
            "stripe": "n8n-nodes-base.stripeTrigger",
            "shopify": "n8n-nodes-base.shopifyTrigger",
            "gmail": "n8n-nodes-base.gmailTrigger",
            "notion": "n8n-nodes-base.notionTrigger",
            "airtable": "n8n-nodes-base.airtableTrigger",
            "hubspot": "n8n-nodes-base.hubspotTrigger",
            "salesforce": "n8n-nodes-base.salesforceTrigger",
            "webhook": "n8n-nodes-base.webhook"
        }
        return node_map.get(self.value, "n8n-nodes-base.webhook")

    @property
    def common_events(self) -> list[str]:
        """Common events for this app trigger."""
        events = {
            "github": ["push", "pull_request", "issues", "release", "star"],
            "slack": ["message", "reaction_added", "channel_created", "file_shared"],
            "stripe": ["payment_intent.succeeded", "customer.created", "invoice.paid"],
            "shopify": ["orders/create", "products/update", "customers/create"],
            "gmail": ["messageReceived"],
            "notion": ["page_added", "page_updated", "database_item_added"],
            "airtable": ["record_created", "record_updated"],
            "hubspot": ["contact.creation", "deal.creation", "ticket.creation"],
            "salesforce": ["Account", "Contact", "Opportunity", "Lead"]
        }
        return events.get(self.value, [])


# ============================================================================
# DATACLASSES - Trigger Configurations
# ============================================================================

@dataclass
class CronExpression:
    """Cron expression configuration."""
    minute: str = "*"
    hour: str = "*"
    day_of_month: str = "*"
    month: str = "*"
    day_of_week: str = "*"

    def __str__(self) -> str:
        """Generate cron string."""
        return f"{self.minute} {self.hour} {self.day_of_month} {self.month} {self.day_of_week}"

    @classmethod
    def every_minute(cls) -> "CronExpression":
        """Every minute."""
        return cls()

    @classmethod
    def every_hour(cls, minute: int = 0) -> "CronExpression":
        """Every hour at specified minute."""
        return cls(minute=str(minute))

    @classmethod
    def daily(cls, hour: int = 9, minute: int = 0) -> "CronExpression":
        """Daily at specified time."""
        return cls(minute=str(minute), hour=str(hour))

    @classmethod
    def weekdays(cls, hour: int = 9, minute: int = 0) -> "CronExpression":
        """Weekdays at specified time."""
        return cls(minute=str(minute), hour=str(hour), day_of_week="1-5")

    @classmethod
    def weekly(cls, day: int = 1, hour: int = 9, minute: int = 0) -> "CronExpression":
        """Weekly on specified day."""
        return cls(minute=str(minute), hour=str(hour), day_of_week=str(day))

    @classmethod
    def monthly(cls, day: int = 1, hour: int = 9, minute: int = 0) -> "CronExpression":
        """Monthly on specified day."""
        return cls(minute=str(minute), hour=str(hour), day_of_month=str(day))

    @classmethod
    def every_n_minutes(cls, n: int) -> "CronExpression":
        """Every N minutes."""
        return cls(minute=f"*/{n}")

    @classmethod
    def every_n_hours(cls, n: int) -> "CronExpression":
        """Every N hours."""
        return cls(minute="0", hour=f"*/{n}")

    @classmethod
    def from_string(cls, cron_str: str) -> "CronExpression":
        """Parse cron string."""
        parts = cron_str.split()
        if len(parts) != 5:
            raise ValueError(f"Invalid cron expression: {cron_str}")
        return cls(
            minute=parts[0],
            hour=parts[1],
            day_of_month=parts[2],
            month=parts[3],
            day_of_week=parts[4]
        )

    def describe(self) -> str:
        """Human-readable description of the schedule."""
        if self.minute == "*" and self.hour == "*":
            return "Every minute"
        if self.minute.startswith("*/"):
            n = self.minute[2:]
            return f"Every {n} minutes"
        if self.hour.startswith("*/"):
            n = self.hour[2:]
            return f"Every {n} hours"
        if self.day_of_week == "1-5":
            return f"Weekdays at {self.hour}:{self.minute.zfill(2)}"
        if self.day_of_month != "*" and self.month == "*":
            return f"Monthly on day {self.day_of_month} at {self.hour}:{self.minute.zfill(2)}"
        if self.day_of_week != "*":
            days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
            day_name = days[int(self.day_of_week)] if self.day_of_week.isdigit() else self.day_of_week
            return f"Weekly on {day_name} at {self.hour}:{self.minute.zfill(2)}"
        if self.hour != "*":
            return f"Daily at {self.hour}:{self.minute.zfill(2)}"
        return f"Cron: {self}"


@dataclass
class WebhookConfig:
    """Webhook trigger configuration."""
    path: str = "webhook"
    http_method: HttpMethod = HttpMethod.POST
    authentication: AuthMethod = AuthMethod.NONE
    response_mode: ResponseMode = ResponseMode.IMMEDIATE
    response_code: int = 200
    response_data: str = ""

    # Security options
    allowed_origins: list[str] = field(default_factory=list)
    rate_limit: Optional[int] = None  # requests per minute
    ip_whitelist: list[str] = field(default_factory=list)

    # Validation
    required_headers: dict = field(default_factory=dict)
    required_query_params: list[str] = field(default_factory=list)

    def to_n8n_config(self) -> dict:
        """Generate n8n webhook node configuration."""
        config = {
            "path": self.path,
            "httpMethod": self.http_method.value,
            "authentication": self.authentication.n8n_authentication,
            "responseMode": self.response_mode.value,
            "options": {}
        }

        if self.response_mode == ResponseMode.IMMEDIATE:
            config["options"]["responseCode"] = self.response_code
            if self.response_data:
                config["options"]["responseData"] = self.response_data

        if self.allowed_origins:
            config["options"]["allowedOrigins"] = ",".join(self.allowed_origins)

        return config

    def generate_test_curl(self, base_url: str = "http://localhost:5678") -> str:
        """Generate curl command for testing."""
        url = f"{base_url}/webhook/{self.path}"

        cmd = f"curl -X {self.http_method.value}"

        if self.http_method.allows_body:
            cmd += " -H 'Content-Type: application/json'"
            cmd += " -d '{\"test\": true}'"

        if self.authentication == AuthMethod.HEADER:
            cmd += " -H 'X-API-Key: YOUR_API_KEY'"
        elif self.authentication == AuthMethod.BASIC:
            cmd += " -u 'username:password'"

        cmd += f" '{url}'"

        return cmd


@dataclass
class ScheduleConfig:
    """Schedule trigger configuration."""
    cron: Optional[CronExpression] = None
    interval_value: int = 1
    interval_unit: ScheduleInterval = ScheduleInterval.HOUR
    timezone: str = "America/New_York"

    # Business hours
    business_hours_only: bool = False
    business_start: int = 9  # 9 AM
    business_end: int = 17   # 5 PM
    business_days: list[int] = field(default_factory=lambda: [1, 2, 3, 4, 5])  # Mon-Fri

    def to_n8n_config(self) -> dict:
        """Generate n8n schedule node configuration."""
        if self.cron:
            return {
                "rule": {
                    "cronExpression": str(self.cron)
                },
                "options": {
                    "timezone": self.timezone
                }
            }
        else:
            return {
                "rule": {
                    "interval": [
                        {
                            "field": self.interval_unit.value,
                            "triggerAtHour": 0 if self.interval_unit in [ScheduleInterval.DAY, ScheduleInterval.WEEK] else None
                        }
                    ]
                },
                "options": {
                    "timezone": self.timezone
                }
            }

    def describe(self) -> str:
        """Human-readable description."""
        if self.cron:
            return self.cron.describe()
        return f"Every {self.interval_value} {self.interval_unit.value}"


@dataclass
class AppTriggerConfig:
    """App trigger configuration."""
    source: AppTriggerSource
    events: list[str] = field(default_factory=list)
    filters: dict = field(default_factory=dict)
    credential_name: str = ""

    # Polling options (for non-webhook triggers)
    polling_interval: int = 60  # seconds
    deduplication_key: str = "id"

    def to_n8n_config(self) -> dict:
        """Generate n8n app trigger configuration."""
        config = {
            "events": self.events,
            "filters": self.filters
        }

        if self.source == AppTriggerSource.GITHUB:
            config["owner"] = "{{ $env.GITHUB_OWNER }}"
            config["repository"] = "{{ $env.GITHUB_REPO }}"
        elif self.source == AppTriggerSource.SLACK:
            config["channel"] = "{{ $env.SLACK_CHANNEL }}"
        elif self.source == AppTriggerSource.STRIPE:
            config["events"] = self.events
        elif self.source == AppTriggerSource.SHOPIFY:
            config["topic"] = self.events[0] if self.events else "orders/create"

        return config


@dataclass
class ValidationRule:
    """Payload validation rule."""
    field: str
    rule_type: str  # required, type, pattern, range, enum
    value: Any = None
    error_message: str = ""

    def to_condition(self) -> dict:
        """Generate n8n IF node condition."""
        if self.rule_type == "required":
            return {
                "conditions": {
                    "string": [{
                        "value1": f"={{{{ $json.{self.field} }}}}",
                        "operation": "isNotEmpty"
                    }]
                }
            }
        elif self.rule_type == "type":
            return {
                "conditions": {
                    "string": [{
                        "value1": f"={{{{ typeof $json.{self.field} }}}}",
                        "operation": "equals",
                        "value2": self.value
                    }]
                }
            }
        elif self.rule_type == "pattern":
            return {
                "conditions": {
                    "string": [{
                        "value1": f"={{{{ $json.{self.field} }}}}",
                        "operation": "regex",
                        "value2": self.value
                    }]
                }
            }
        elif self.rule_type == "enum":
            return {
                "conditions": {
                    "string": [{
                        "value1": f"={{{{ {json.dumps(self.value)}.includes($json.{self.field}) }}}}",
                        "operation": "equals",
                        "value2": "true"
                    }]
                }
            }
        return {}


@dataclass
class SignatureConfig:
    """Webhook signature verification configuration."""
    algorithm: str = "sha256"  # sha256, sha1, md5
    header_name: str = "X-Signature"
    secret_env_var: str = "WEBHOOK_SECRET"
    include_timestamp: bool = False
    timestamp_header: str = "X-Timestamp"
    timestamp_tolerance: int = 300  # seconds

    def generate_verification_code(self) -> str:
        """Generate n8n Code node for signature verification."""
        return f'''// Signature Verification
const crypto = require('crypto');

const signature = $input.first().headers['{self.header_name.lower()}'];
const secret = $env.{self.secret_env_var};
const body = JSON.stringify($input.first().json);

{'// Verify timestamp' if self.include_timestamp else ''}
{f"""const timestamp = $input.first().headers['{self.timestamp_header.lower()}'];
const now = Math.floor(Date.now() / 1000);
if (Math.abs(now - parseInt(timestamp)) > {self.timestamp_tolerance}) {{
  throw new Error('Request timestamp too old');
}}
const payload = timestamp + '.' + body;""" if self.include_timestamp else 'const payload = body;'}

const expectedSignature = crypto
  .createHmac('{self.algorithm}', secret)
  .update(payload)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature || ''),
  Buffer.from(expectedSignature)
);

if (!isValid) {{
  throw new Error('Invalid signature');
}}

return $input.all();'''


@dataclass
class TriggerNode:
    """Complete trigger node configuration."""
    trigger_type: TriggerType
    name: str = "Trigger"
    webhook_config: Optional[WebhookConfig] = None
    schedule_config: Optional[ScheduleConfig] = None
    app_config: Optional[AppTriggerConfig] = None
    validation_rules: list[ValidationRule] = field(default_factory=list)
    signature_config: Optional[SignatureConfig] = None

    def to_n8n_node(self, position: tuple = (0, 0)) -> dict:
        """Generate complete n8n trigger node."""
        node = {
            "id": hashlib.md5(self.name.encode()).hexdigest()[:8],
            "name": self.name,
            "type": self.trigger_type.n8n_node,
            "position": list(position),
            "parameters": {}
        }

        if self.trigger_type == TriggerType.WEBHOOK and self.webhook_config:
            node["parameters"] = self.webhook_config.to_n8n_config()
        elif self.trigger_type == TriggerType.SCHEDULE and self.schedule_config:
            node["parameters"] = self.schedule_config.to_n8n_config()
        elif self.trigger_type == TriggerType.APP_TRIGGER and self.app_config:
            node["type"] = self.app_config.source.n8n_node
            node["parameters"] = self.app_config.to_n8n_config()

        return node


# ============================================================================
# ENGINE CLASSES - Trigger Builders
# ============================================================================

class WebhookArchitect:
    """Webhook configuration engine."""

    COMMON_PATTERNS = {
        "stripe": {
            "path": "stripe-webhook",
            "method": HttpMethod.POST,
            "signature_header": "Stripe-Signature",
            "algorithm": "sha256"
        },
        "github": {
            "path": "github-webhook",
            "method": HttpMethod.POST,
            "signature_header": "X-Hub-Signature-256",
            "algorithm": "sha256"
        },
        "slack": {
            "path": "slack-webhook",
            "method": HttpMethod.POST,
            "signature_header": "X-Slack-Signature",
            "algorithm": "sha256"
        },
        "shopify": {
            "path": "shopify-webhook",
            "method": HttpMethod.POST,
            "signature_header": "X-Shopify-Hmac-SHA256",
            "algorithm": "sha256"
        },
        "twilio": {
            "path": "twilio-webhook",
            "method": HttpMethod.POST,
            "signature_header": "X-Twilio-Signature",
            "algorithm": "sha1"
        }
    }

    def create_webhook(self, path: str,
                       method: HttpMethod = HttpMethod.POST,
                       auth: AuthMethod = AuthMethod.NONE) -> WebhookConfig:
        """Create a basic webhook configuration."""
        return WebhookConfig(
            path=path,
            http_method=method,
            authentication=auth
        )

    def create_secure_webhook(self, path: str,
                              secret_env: str = "WEBHOOK_SECRET",
                              algorithm: str = "sha256") -> tuple[WebhookConfig, SignatureConfig]:
        """Create webhook with signature verification."""
        webhook = WebhookConfig(
            path=path,
            http_method=HttpMethod.POST,
            authentication=AuthMethod.NONE,
            response_mode=ResponseMode.LAST_NODE
        )

        signature = SignatureConfig(
            algorithm=algorithm,
            secret_env_var=secret_env
        )

        return webhook, signature

    def create_from_pattern(self, pattern_name: str) -> tuple[WebhookConfig, SignatureConfig]:
        """Create webhook from common pattern."""
        if pattern_name not in self.COMMON_PATTERNS:
            raise ValueError(f"Unknown pattern: {pattern_name}")

        pattern = self.COMMON_PATTERNS[pattern_name]

        webhook = WebhookConfig(
            path=pattern["path"],
            http_method=pattern["method"],
            response_mode=ResponseMode.IMMEDIATE
        )

        signature = SignatureConfig(
            algorithm=pattern["algorithm"],
            header_name=pattern["signature_header"],
            secret_env_var=f"{pattern_name.upper()}_WEBHOOK_SECRET"
        )

        return webhook, signature

    def generate_endpoint_docs(self, config: WebhookConfig,
                               base_url: str = "https://your-n8n.com") -> str:
        """Generate endpoint documentation."""
        return f"""
## Webhook Endpoint Documentation

### Endpoint
`{config.http_method.value} {base_url}/webhook/{config.path}`

### Authentication
{config.authentication.value}

### Response Mode
{config.response_mode.description}

### Test Command
```bash
{config.generate_test_curl(base_url)}
```

### Expected Response
- Status: {config.response_code}
- Body: {config.response_data or '{"success": true}'}
"""


class ScheduleEngine:
    """Schedule configuration engine."""

    PRESETS = {
        "every_minute": CronExpression.every_minute(),
        "every_5_minutes": CronExpression.every_n_minutes(5),
        "every_15_minutes": CronExpression.every_n_minutes(15),
        "every_30_minutes": CronExpression.every_n_minutes(30),
        "hourly": CronExpression.every_hour(),
        "daily_9am": CronExpression.daily(9, 0),
        "daily_midnight": CronExpression.daily(0, 0),
        "weekdays_9am": CronExpression.weekdays(9, 0),
        "weekly_monday": CronExpression.weekly(1, 9, 0),
        "monthly_first": CronExpression.monthly(1, 9, 0)
    }

    def create_schedule(self, preset: str = None,
                        cron: str = None,
                        interval: int = None,
                        unit: str = None,
                        timezone: str = "America/New_York") -> ScheduleConfig:
        """Create schedule configuration."""
        if preset and preset in self.PRESETS:
            return ScheduleConfig(
                cron=self.PRESETS[preset],
                timezone=timezone
            )
        elif cron:
            return ScheduleConfig(
                cron=CronExpression.from_string(cron),
                timezone=timezone
            )
        elif interval and unit:
            return ScheduleConfig(
                interval_value=interval,
                interval_unit=ScheduleInterval(unit),
                timezone=timezone
            )
        else:
            return ScheduleConfig(timezone=timezone)

    def parse_natural_language(self, description: str) -> ScheduleConfig:
        """Parse natural language schedule description."""
        description = description.lower()

        # Patterns to match
        patterns = {
            r"every (\d+) minute": lambda m: ScheduleConfig(cron=CronExpression.every_n_minutes(int(m.group(1)))),
            r"every (\d+) hour": lambda m: ScheduleConfig(cron=CronExpression.every_n_hours(int(m.group(1)))),
            r"every hour": lambda m: ScheduleConfig(cron=CronExpression.every_hour()),
            r"daily at (\d+):?(\d*)": lambda m: ScheduleConfig(cron=CronExpression.daily(int(m.group(1)), int(m.group(2) or 0))),
            r"weekdays at (\d+):?(\d*)": lambda m: ScheduleConfig(cron=CronExpression.weekdays(int(m.group(1)), int(m.group(2) or 0))),
            r"every monday": lambda m: ScheduleConfig(cron=CronExpression.weekly(1)),
            r"every tuesday": lambda m: ScheduleConfig(cron=CronExpression.weekly(2)),
            r"every wednesday": lambda m: ScheduleConfig(cron=CronExpression.weekly(3)),
            r"every thursday": lambda m: ScheduleConfig(cron=CronExpression.weekly(4)),
            r"every friday": lambda m: ScheduleConfig(cron=CronExpression.weekly(5)),
            r"monthly on (\d+)": lambda m: ScheduleConfig(cron=CronExpression.monthly(int(m.group(1)))),
        }

        for pattern, factory in patterns.items():
            match = re.search(pattern, description)
            if match:
                return factory(match)

        # Default to hourly
        return ScheduleConfig(cron=CronExpression.every_hour())

    def list_presets(self) -> dict:
        """List available schedule presets."""
        return {name: cron.describe() for name, cron in self.PRESETS.items()}


class AppTriggerManager:
    """App trigger configuration engine."""

    def create_trigger(self, source: AppTriggerSource,
                       events: list[str] = None,
                       filters: dict = None) -> AppTriggerConfig:
        """Create app trigger configuration."""
        return AppTriggerConfig(
            source=source,
            events=events or source.common_events[:3],
            filters=filters or {}
        )

    def list_events(self, source: AppTriggerSource) -> list[str]:
        """List available events for an app."""
        return source.common_events

    def create_github_trigger(self, events: list[str] = None,
                              branches: list[str] = None) -> AppTriggerConfig:
        """Create GitHub trigger."""
        config = AppTriggerConfig(
            source=AppTriggerSource.GITHUB,
            events=events or ["push", "pull_request"]
        )
        if branches:
            config.filters["branches"] = branches
        return config

    def create_stripe_trigger(self, events: list[str] = None) -> AppTriggerConfig:
        """Create Stripe trigger."""
        return AppTriggerConfig(
            source=AppTriggerSource.STRIPE,
            events=events or ["payment_intent.succeeded", "customer.created"]
        )

    def create_slack_trigger(self, channel: str = None,
                             events: list[str] = None) -> AppTriggerConfig:
        """Create Slack trigger."""
        config = AppTriggerConfig(
            source=AppTriggerSource.SLACK,
            events=events or ["message"]
        )
        if channel:
            config.filters["channel"] = channel
        return config


class ValidationEngine:
    """Payload validation engine."""

    def create_rule(self, field: str, rule_type: str,
                    value: Any = None, error_message: str = "") -> ValidationRule:
        """Create a validation rule."""
        return ValidationRule(
            field=field,
            rule_type=rule_type,
            value=value,
            error_message=error_message or f"Validation failed for {field}"
        )

    def required(self, field: str) -> ValidationRule:
        """Create required field rule."""
        return self.create_rule(field, "required")

    def type_check(self, field: str, expected_type: str) -> ValidationRule:
        """Create type check rule."""
        return self.create_rule(field, "type", expected_type)

    def pattern(self, field: str, regex: str) -> ValidationRule:
        """Create pattern match rule."""
        return self.create_rule(field, "pattern", regex)

    def enum_check(self, field: str, allowed_values: list) -> ValidationRule:
        """Create enum check rule."""
        return self.create_rule(field, "enum", allowed_values)

    def generate_validation_workflow(self, rules: list[ValidationRule]) -> list[dict]:
        """Generate validation nodes for workflow."""
        nodes = []

        for i, rule in enumerate(rules):
            nodes.append({
                "id": f"validate_{i}",
                "name": f"Validate {rule.field}",
                "type": "n8n-nodes-base.if",
                "parameters": rule.to_condition()
            })

        return nodes

    def generate_validation_code(self, rules: list[ValidationRule]) -> str:
        """Generate Code node for all validations."""
        checks = []

        for rule in rules:
            if rule.rule_type == "required":
                checks.append(f"""
  if (!data.{rule.field}) {{
    errors.push('{rule.error_message or f"{rule.field} is required"}');
  }}""")
            elif rule.rule_type == "type":
                checks.append(f"""
  if (typeof data.{rule.field} !== '{rule.value}') {{
    errors.push('{rule.error_message or f"{rule.field} must be {rule.value}"}');
  }}""")
            elif rule.rule_type == "pattern":
                checks.append(f"""
  if (!/{rule.value}/.test(data.{rule.field})) {{
    errors.push('{rule.error_message or f"{rule.field} format is invalid"}');
  }}""")
            elif rule.rule_type == "enum":
                checks.append(f"""
  if (!{json.dumps(rule.value)}.includes(data.{rule.field})) {{
    errors.push('{rule.error_message or f"{rule.field} must be one of {rule.value}"}');
  }}""")

        return f'''// Payload Validation
const data = $input.first().json;
const errors = [];
{chr(10).join(checks)}

if (errors.length > 0) {{
  throw new Error('Validation failed: ' + errors.join(', '));
}}

return $input.all();'''


class TriggerOrchestrator:
    """Main orchestrator for trigger configuration."""

    def __init__(self):
        self.webhook = WebhookArchitect()
        self.schedule = ScheduleEngine()
        self.app_trigger = AppTriggerManager()
        self.validation = ValidationEngine()

    def create_webhook_trigger(self, path: str,
                               auth: str = "none",
                               secure: bool = False,
                               validation_rules: list[dict] = None) -> TriggerNode:
        """Create complete webhook trigger."""
        auth_method = AuthMethod(auth)

        if secure:
            webhook_config, signature_config = self.webhook.create_secure_webhook(path)
        else:
            webhook_config = self.webhook.create_webhook(path, auth=auth_method)
            signature_config = None

        rules = []
        if validation_rules:
            for rule in validation_rules:
                rules.append(self.validation.create_rule(**rule))

        return TriggerNode(
            trigger_type=TriggerType.WEBHOOK,
            name=f"Webhook: {path}",
            webhook_config=webhook_config,
            signature_config=signature_config,
            validation_rules=rules
        )

    def create_schedule_trigger(self, schedule: str,
                                timezone: str = "America/New_York") -> TriggerNode:
        """Create schedule trigger from natural language or preset."""
        if schedule in self.schedule.PRESETS:
            config = self.schedule.create_schedule(preset=schedule, timezone=timezone)
        else:
            config = self.schedule.parse_natural_language(schedule)
            config.timezone = timezone

        return TriggerNode(
            trigger_type=TriggerType.SCHEDULE,
            name=f"Schedule: {config.describe()}",
            schedule_config=config
        )

    def create_app_trigger(self, app: str,
                           events: list[str] = None) -> TriggerNode:
        """Create app trigger."""
        source = AppTriggerSource(app)
        config = self.app_trigger.create_trigger(source, events)

        return TriggerNode(
            trigger_type=TriggerType.APP_TRIGGER,
            name=f"{app.title()} Trigger",
            app_config=config
        )

    def build_trigger_workflow(self, trigger: TriggerNode) -> dict:
        """Build complete workflow with trigger."""
        nodes = [trigger.to_n8n_node((0, 0))]
        connections = {}

        prev_node = trigger.name

        # Add signature verification if configured
        if trigger.signature_config:
            sig_node = {
                "id": "verify_signature",
                "name": "Verify Signature",
                "type": "n8n-nodes-base.code",
                "position": [250, 0],
                "parameters": {
                    "jsCode": trigger.signature_config.generate_verification_code()
                }
            }
            nodes.append(sig_node)
            connections[prev_node] = {"main": [[{"node": "Verify Signature", "type": "main", "index": 0}]]}
            prev_node = "Verify Signature"

        # Add validation if configured
        if trigger.validation_rules:
            val_node = {
                "id": "validate_payload",
                "name": "Validate Payload",
                "type": "n8n-nodes-base.code",
                "position": [500 if trigger.signature_config else 250, 0],
                "parameters": {
                    "jsCode": self.validation.generate_validation_code(trigger.validation_rules)
                }
            }
            nodes.append(val_node)
            connections[prev_node] = {"main": [[{"node": "Validate Payload", "type": "main", "index": 0}]]}

        return {
            "name": f"Trigger Workflow - {trigger.name}",
            "nodes": nodes,
            "connections": connections,
            "settings": {"executionOrder": "v1"}
        }


# ============================================================================
# REPORTER CLASS - ASCII Dashboard Generation
# ============================================================================

class TriggerReporter:
    """ASCII dashboard reporter for triggers."""

    @staticmethod
    def generate_progress_bar(value: int, max_val: int = 10, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        filled = int((value / max_val) * width)
        return "█" * filled + "░" * (width - filled)

    def report_trigger(self, trigger: TriggerNode) -> str:
        """Generate trigger configuration report."""
        report = f"""
TRIGGER CONFIGURATION
═══════════════════════════════════════════════════════
Trigger: {trigger.name}
Type: {trigger.trigger_type.value}
═══════════════════════════════════════════════════════

TRIGGER OVERVIEW
────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│       TRIGGER STATUS                                │
│                                                     │
│  Type: {trigger.trigger_type.value:<20}              │
│  Node: {trigger.trigger_type.n8n_node.split('.')[-1]:<20}              │"""

        if trigger.webhook_config:
            wh = trigger.webhook_config
            report += f"""
│                                                     │
│  WEBHOOK DETAILS                                    │
│  Path: /{wh.path:<30}         │
│  Method: {wh.http_method.value:<10}                             │
│  Auth: {wh.authentication.value:<15}                        │
│  Response: {wh.response_mode.value:<15}                    │"""

        if trigger.schedule_config:
            sc = trigger.schedule_config
            report += f"""
│                                                     │
│  SCHEDULE DETAILS                                   │
│  Schedule: {sc.describe():<30}     │
│  Timezone: {sc.timezone:<20}               │"""

        if trigger.app_config:
            ac = trigger.app_config
            report += f"""
│                                                     │
│  APP TRIGGER DETAILS                                │
│  Source: {ac.source.value:<20}                  │
│  Events: {', '.join(ac.events[:3]):<25}        │"""

        report += """
│                                                     │
│  Status: [●] Trigger Ready                          │
└─────────────────────────────────────────────────────┘
"""

        if trigger.validation_rules:
            report += """
VALIDATION RULES
────────────────────────────────────────────────────────
| Field | Rule | Value |
|-------|------|-------|"""
            for rule in trigger.validation_rules:
                report += f"\n| {rule.field[:15]:<15} | {rule.rule_type:<10} | {str(rule.value)[:15]:<15} |"

        if trigger.signature_config:
            sig = trigger.signature_config
            report += f"""

SIGNATURE VERIFICATION
────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│  Algorithm: {sig.algorithm:<15}                        │
│  Header: {sig.header_name:<20}                     │
│  Secret: ${sig.secret_env_var:<20}                 │
└─────────────────────────────────────────────────────┘
"""

        return report

    def report_schedule_presets(self) -> str:
        """Report available schedule presets."""
        engine = ScheduleEngine()
        presets = engine.list_presets()

        report = """
SCHEDULE PRESETS
═══════════════════════════════════════════════════════

| Preset | Schedule |
|--------|----------|"""

        for name, description in presets.items():
            report += f"\n| {name:<20} | {description:<30} |"

        return report

    def report_app_triggers(self) -> str:
        """Report available app triggers."""
        report = """
APP TRIGGERS
═══════════════════════════════════════════════════════

| App | Common Events |
|-----|---------------|"""

        for source in AppTriggerSource:
            if source != AppTriggerSource.WEBHOOK_GENERIC:
                events = ", ".join(source.common_events[:3])
                report += f"\n| {source.value:<12} | {events:<40} |"

        return report


# ============================================================================
# CLI INTERFACE
# ============================================================================

def create_parser() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-triggers",
        description="N8N.TRIGGERS.EXE - Trigger & Scheduling Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Webhook command
    webhook_parser = subparsers.add_parser("webhook", help="Configure webhook trigger")
    webhook_parser.add_argument("path", help="Webhook path")
    webhook_parser.add_argument("--method", "-m", choices=["GET", "POST", "PUT", "PATCH", "DELETE"], default="POST")
    webhook_parser.add_argument("--auth", "-a", choices=["none", "basicAuth", "headerAuth"], default="none")
    webhook_parser.add_argument("--secure", "-s", action="store_true", help="Add signature verification")
    webhook_parser.add_argument("--pattern", "-p", help="Use common pattern (stripe, github, etc.)")

    # Schedule command
    schedule_parser = subparsers.add_parser("schedule", help="Configure schedule trigger")
    schedule_parser.add_argument("schedule", help="Schedule (preset name, cron expression, or natural language)")
    schedule_parser.add_argument("--timezone", "-t", default="America/New_York", help="Timezone")
    schedule_parser.add_argument("--list-presets", "-l", action="store_true", help="List available presets")

    # App trigger command
    app_parser = subparsers.add_parser("app", help="Configure app trigger")
    app_parser.add_argument("app", choices=[s.value for s in AppTriggerSource], help="App source")
    app_parser.add_argument("--events", "-e", nargs="+", help="Events to trigger on")
    app_parser.add_argument("--list-events", "-l", action="store_true", help="List available events")

    # Validate command
    validate_parser = subparsers.add_parser("validate", help="Generate validation code")
    validate_parser.add_argument("--required", "-r", nargs="+", help="Required fields")
    validate_parser.add_argument("--types", "-t", nargs="+", help="Type checks (field:type)")
    validate_parser.add_argument("--patterns", "-p", nargs="+", help="Pattern checks (field:regex)")

    # Cron command
    cron_parser = subparsers.add_parser("cron", help="Build cron expression")
    cron_parser.add_argument("description", help="Natural language description")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def run_demo():
    """Run demonstration."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║           N8N.TRIGGERS.EXE - DEMONSTRATION                    ║
╚═══════════════════════════════════════════════════════════════╝
""")

    orchestrator = TriggerOrchestrator()
    reporter = TriggerReporter()

    print("1. WEBHOOK TRIGGER")
    print("─" * 50)

    webhook_trigger = orchestrator.create_webhook_trigger(
        path="api/orders",
        auth="headerAuth",
        secure=True,
        validation_rules=[
            {"field": "order_id", "rule_type": "required"},
            {"field": "amount", "rule_type": "type", "value": "number"}
        ]
    )
    print(reporter.report_trigger(webhook_trigger))

    print("\n2. SCHEDULE TRIGGER")
    print("─" * 50)

    schedule_trigger = orchestrator.create_schedule_trigger("weekdays at 9:30")
    print(reporter.report_trigger(schedule_trigger))

    print("\n3. APP TRIGGER")
    print("─" * 50)

    app_trigger = orchestrator.create_app_trigger("github", ["push", "pull_request"])
    print(reporter.report_trigger(app_trigger))

    print("\n4. CRON EXPRESSIONS")
    print("─" * 50)

    engine = ScheduleEngine()
    for preset, desc in list(engine.list_presets().items())[:5]:
        print(f"  {preset:<20} → {desc}")

    print("\n5. WORKFLOW OUTPUT")
    print("─" * 50)

    workflow = orchestrator.build_trigger_workflow(webhook_trigger)
    print(json.dumps(workflow, indent=2)[:600] + "...")

    print("""
╔═══════════════════════════════════════════════════════════════╗
║                    DEMO COMPLETE                              ║
╚═══════════════════════════════════════════════════════════════╝

Available commands:
  n8n-triggers webhook my-api --auth headerAuth --secure
  n8n-triggers schedule "every 15 minutes"
  n8n-triggers schedule daily_9am --timezone America/Los_Angeles
  n8n-triggers app github --events push pull_request
  n8n-triggers validate --required email name --types amount:number
  n8n-triggers cron "every weekday at 9am"
  n8n-triggers demo
""")


def main():
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    orchestrator = TriggerOrchestrator()
    reporter = TriggerReporter()

    if args.command == "demo":
        run_demo()
    elif args.command == "webhook":
        if args.pattern:
            webhook, sig = orchestrator.webhook.create_from_pattern(args.pattern)
            trigger = TriggerNode(
                trigger_type=TriggerType.WEBHOOK,
                name=f"Webhook: {args.pattern}",
                webhook_config=webhook,
                signature_config=sig
            )
        else:
            trigger = orchestrator.create_webhook_trigger(
                path=args.path,
                auth=args.auth,
                secure=args.secure
            )
        print(reporter.report_trigger(trigger))
        print("\nN8N Node Configuration:")
        print(json.dumps(trigger.to_n8n_node(), indent=2))
    elif args.command == "schedule":
        if args.list_presets:
            print(reporter.report_schedule_presets())
        else:
            trigger = orchestrator.create_schedule_trigger(args.schedule, args.timezone)
            print(reporter.report_trigger(trigger))
            print("\nN8N Node Configuration:")
            print(json.dumps(trigger.to_n8n_node(), indent=2))
    elif args.command == "app":
        source = AppTriggerSource(args.app)
        if args.list_events:
            print(f"\nEvents for {args.app}:")
            for event in source.common_events:
                print(f"  • {event}")
        else:
            trigger = orchestrator.create_app_trigger(args.app, args.events)
            print(reporter.report_trigger(trigger))
    elif args.command == "validate":
        validation = ValidationEngine()
        rules = []
        if args.required:
            for field in args.required:
                rules.append(validation.required(field))
        if args.types:
            for type_spec in args.types:
                field, expected = type_spec.split(":")
                rules.append(validation.type_check(field, expected))
        if args.patterns:
            for pattern_spec in args.patterns:
                field, regex = pattern_spec.split(":", 1)
                rules.append(validation.pattern(field, regex))

        print("Validation Code:")
        print(validation.generate_validation_code(rules))
    elif args.command == "cron":
        engine = ScheduleEngine()
        config = engine.parse_natural_language(args.description)
        print(f"Cron Expression: {config.cron}")
        print(f"Description: {config.cron.describe()}")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK REFERENCE

### Trigger Types

| Trigger | Use Case | Execution |
|---------|----------|-----------|
| Manual | Testing | On click |
| Webhook | External events | On request |
| Schedule | Recurring tasks | Cron/interval |
| App Trigger | SaaS events | On event |
| Polling | Check changes | On interval |

### Cron Expressions

| Expression | Schedule |
|------------|----------|
| `0 9 * * *` | Daily at 9 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `0 0 1 * *` | Monthly on 1st |
| `*/15 * * * *` | Every 15 minutes |
| `0 9,17 * * *` | 9 AM and 5 PM |

### App Triggers

| App | Trigger Events |
|-----|----------------|
| Gmail | New email received |
| Slack | New message |
| GitHub | Push, PR opened |
| Stripe | Payment succeeded |
| Shopify | New order |
| Notion | Page updated |

### Quick Commands

- `n8n-triggers webhook [path]` - Configure webhook trigger
- `n8n-triggers schedule [cron]` - Set up schedule trigger
- `n8n-triggers app [app_name]` - Configure app trigger
- `n8n-triggers validate [schema]` - Add payload validation
- `n8n-triggers cron [description]` - Build cron expression
- `n8n-triggers demo` - Run demonstration

$ARGUMENTS
