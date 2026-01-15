# SIGNAL.EXE - Alert & Notification Agent

You are SIGNAL.EXE — the alert and notification orchestrator for managing signals, alerts, and communications across all channels with intelligent prioritization and delivery tracking.

MISSION
Route, manage, and deliver signals and notifications across channels with proper prioritization and tracking. Right message. Right channel. Right time.

---

## CAPABILITIES

### SignalReceiver.MOD
- Multi-source ingestion
- Format normalization
- Priority classification
- Urgency detection
- Source validation

### RoutingEngine.MOD
- Rule-based routing
- Channel selection
- Recipient matching
- Escalation logic
- Fallback handling

### DeliveryOrchestrator.MOD
- Multi-channel dispatch
- Format adaptation
- Retry management
- Rate limiting
- Queue optimization

### AnalyticsTracker.MOD
- Delivery confirmation
- Open/read tracking
- Response measurement
- Failure analysis
- Performance reporting

---

## WORKFLOW

### Phase 1: RECEIVE
1. Capture incoming signals
2. Parse signal content
3. Identify signal type
4. Determine urgency level
5. Validate source authenticity

### Phase 2: PROCESS
1. Apply routing rules
2. Enrich with context
3. Deduplicate signals
4. Calculate priority score
5. Queue for delivery

### Phase 3: DELIVER
1. Select appropriate channels
2. Format for each channel
3. Send notifications
4. Handle rate limits
5. Track delivery status

### Phase 4: TRACK
1. Confirm receipt
2. Log signal lifecycle
3. Handle failures/retries
4. Measure engagement
5. Generate analytics

---

## SIGNAL TYPES

| Type | Priority | Use Case |
|------|----------|----------|
| Alert | Critical | Immediate action required |
| Warning | High | Attention needed soon |
| Notification | Medium | Informational updates |
| Update | Low | Status changes |
| Digest | Batch | Aggregated summaries |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SIGNAL.EXE - Alert & Notification Agent
Multi-channel notification orchestration with intelligent routing and tracking.
"""

import asyncio
import json
import hashlib
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Set, Callable
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import argparse


class SignalPriority(Enum):
    """Signal priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    BATCH = "batch"


class SignalType(Enum):
    """Types of signals."""
    ALERT = "alert"
    WARNING = "warning"
    NOTIFICATION = "notification"
    UPDATE = "update"
    DIGEST = "digest"
    SYSTEM = "system"
    USER = "user"
    AUTOMATION = "automation"


class DeliveryChannel(Enum):
    """Available delivery channels."""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    SLACK = "slack"
    DISCORD = "discord"
    TEAMS = "teams"
    WEBHOOK = "webhook"
    IN_APP = "in_app"
    CONSOLE = "console"


class DeliveryStatus(Enum):
    """Signal delivery status."""
    PENDING = "pending"
    QUEUED = "queued"
    SENDING = "sending"
    DELIVERED = "delivered"
    OPENED = "opened"
    CLICKED = "clicked"
    FAILED = "failed"
    BOUNCED = "bounced"
    RETRYING = "retrying"


class RoutingStrategy(Enum):
    """Signal routing strategies."""
    PRIORITY = "priority"
    ROUND_ROBIN = "round_robin"
    FAILOVER = "failover"
    BROADCAST = "broadcast"
    SMART = "smart"


class EscalationLevel(Enum):
    """Escalation levels for unacknowledged signals."""
    NONE = "none"
    LEVEL_1 = "level_1"
    LEVEL_2 = "level_2"
    LEVEL_3 = "level_3"
    EMERGENCY = "emergency"


@dataclass
class Recipient:
    """Signal recipient."""
    id: str
    name: str
    channels: Dict[DeliveryChannel, str] = field(default_factory=dict)
    preferences: Dict[str, Any] = field(default_factory=dict)
    timezone: str = "UTC"
    do_not_disturb: Optional[Dict[str, str]] = None
    groups: List[str] = field(default_factory=list)
    escalation_order: int = 0


@dataclass
class RoutingRule:
    """Rule for signal routing."""
    id: str
    name: str
    condition: Dict[str, Any]
    channels: List[DeliveryChannel]
    recipients: List[str]
    priority_override: Optional[SignalPriority] = None
    enabled: bool = True
    schedule: Optional[Dict[str, Any]] = None


@dataclass
class Signal:
    """A signal/notification to be delivered."""
    id: str
    type: SignalType
    priority: SignalPriority
    title: str
    message: str
    source: str
    created_at: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    recipients: List[str] = field(default_factory=list)
    channels: List[DeliveryChannel] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    action_url: Optional[str] = None
    action_required: bool = False
    expires_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DeliveryAttempt:
    """Record of a delivery attempt."""
    id: str
    signal_id: str
    recipient_id: str
    channel: DeliveryChannel
    status: DeliveryStatus
    attempted_at: datetime
    delivered_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    error: Optional[str] = None
    retry_count: int = 0
    response: Optional[Dict[str, Any]] = None


@dataclass
class EscalationConfig:
    """Configuration for signal escalation."""
    enabled: bool = True
    initial_delay: int = 300  # seconds
    escalation_delays: List[int] = field(default_factory=lambda: [600, 1800, 3600])
    max_level: EscalationLevel = EscalationLevel.LEVEL_3
    notify_on_escalation: bool = True


@dataclass
class ChannelConfig:
    """Channel-specific configuration."""
    channel: DeliveryChannel
    enabled: bool = True
    rate_limit: int = 100  # per minute
    retry_attempts: int = 3
    retry_delay: int = 60  # seconds
    template: Optional[str] = None
    credentials: Dict[str, str] = field(default_factory=dict)
    options: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SignalMetrics:
    """Metrics for signal delivery."""
    total_sent: int = 0
    total_delivered: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_failed: int = 0
    avg_delivery_time: float = 0.0
    delivery_rate: float = 0.0
    open_rate: float = 0.0
    click_rate: float = 0.0
    by_channel: Dict[str, Dict[str, int]] = field(default_factory=dict)
    by_priority: Dict[str, int] = field(default_factory=dict)


@dataclass
class DigestConfig:
    """Configuration for digest notifications."""
    enabled: bool = True
    frequency: str = "daily"  # hourly, daily, weekly
    send_time: str = "09:00"
    group_by: str = "source"
    max_items: int = 50
    include_summary: bool = True


class SignalReceiver:
    """Multi-source signal ingestion and normalization."""

    PRIORITY_KEYWORDS = {
        SignalPriority.CRITICAL: ["critical", "emergency", "urgent", "outage", "down", "breach"],
        SignalPriority.HIGH: ["high", "important", "alert", "warning", "error"],
        SignalPriority.MEDIUM: ["medium", "notice", "update", "change"],
        SignalPriority.LOW: ["low", "info", "fyi", "reminder"],
    }

    def __init__(self):
        self.sources: Dict[str, Dict[str, Any]] = {}
        self.validators: Dict[str, Callable] = {}
        self.transformers: Dict[str, Callable] = {}
        self.dedup_window = timedelta(minutes=5)
        self.seen_hashes: Dict[str, datetime] = {}

    def register_source(self, source_id: str, config: Dict[str, Any]) -> None:
        """Register a signal source."""
        self.sources[source_id] = {
            "id": source_id,
            "name": config.get("name", source_id),
            "type": config.get("type", "generic"),
            "trusted": config.get("trusted", False),
            "default_priority": config.get("default_priority", SignalPriority.MEDIUM),
            "format": config.get("format", "text"),
            "enabled": config.get("enabled", True),
        }

    async def receive(self, raw_signal: Dict[str, Any], source_id: str) -> Optional[Signal]:
        """Receive and normalize a raw signal."""
        # Validate source
        if source_id not in self.sources:
            return None

        source = self.sources[source_id]
        if not source["enabled"]:
            return None

        # Transform based on source format
        normalized = await self._normalize(raw_signal, source)

        # Check for duplicates
        if self._is_duplicate(normalized):
            return None

        # Detect priority if not specified
        if "priority" not in raw_signal:
            normalized["priority"] = self._detect_priority(normalized)

        # Create signal
        signal = Signal(
            id=self._generate_signal_id(),
            type=SignalType(normalized.get("type", "notification")),
            priority=SignalPriority(normalized.get("priority", "medium")),
            title=normalized.get("title", "Notification"),
            message=normalized.get("message", ""),
            source=source_id,
            created_at=datetime.now(),
            data=normalized.get("data", {}),
            recipients=normalized.get("recipients", []),
            channels=[DeliveryChannel(c) for c in normalized.get("channels", [])],
            tags=normalized.get("tags", []),
            action_url=normalized.get("action_url"),
            action_required=normalized.get("action_required", False),
            expires_at=self._parse_expiry(normalized.get("expires_at")),
            metadata=normalized.get("metadata", {}),
        )

        return signal

    async def _normalize(self, raw: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw signal based on source format."""
        format_type = source.get("format", "generic")

        if format_type == "slack":
            return self._normalize_slack(raw)
        elif format_type == "email":
            return self._normalize_email(raw)
        elif format_type == "webhook":
            return self._normalize_webhook(raw)
        else:
            return raw

    def _normalize_slack(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Slack-format message."""
        return {
            "title": raw.get("text", "")[:100],
            "message": raw.get("text", ""),
            "type": "notification",
            "data": {"blocks": raw.get("blocks", [])},
            "metadata": {"channel": raw.get("channel")},
        }

    def _normalize_email(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize email-format message."""
        return {
            "title": raw.get("subject", ""),
            "message": raw.get("body", raw.get("text", "")),
            "type": "notification",
            "recipients": raw.get("to", []),
            "metadata": {"from": raw.get("from"), "cc": raw.get("cc", [])},
        }

    def _normalize_webhook(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize webhook payload."""
        return {
            "title": raw.get("title", raw.get("subject", "Webhook")),
            "message": raw.get("message", raw.get("body", json.dumps(raw))),
            "type": raw.get("type", "notification"),
            "data": raw.get("data", raw),
            "tags": raw.get("tags", []),
        }

    def _detect_priority(self, signal: Dict[str, Any]) -> SignalPriority:
        """Auto-detect priority from signal content."""
        text = f"{signal.get('title', '')} {signal.get('message', '')}".lower()

        for priority, keywords in self.PRIORITY_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                return priority

        return SignalPriority.MEDIUM

    def _is_duplicate(self, signal: Dict[str, Any]) -> bool:
        """Check if signal is a duplicate within dedup window."""
        content = f"{signal.get('title', '')}{signal.get('message', '')}"
        hash_val = hashlib.md5(content.encode()).hexdigest()

        now = datetime.now()

        # Clean old hashes
        self.seen_hashes = {
            h: t for h, t in self.seen_hashes.items()
            if now - t < self.dedup_window
        }

        if hash_val in self.seen_hashes:
            return True

        self.seen_hashes[hash_val] = now
        return False

    def _generate_signal_id(self) -> str:
        """Generate unique signal ID."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        return f"sig_{timestamp}"

    def _parse_expiry(self, expiry: Any) -> Optional[datetime]:
        """Parse expiry time."""
        if expiry is None:
            return None
        if isinstance(expiry, datetime):
            return expiry
        if isinstance(expiry, str):
            try:
                return datetime.fromisoformat(expiry)
            except ValueError:
                return None
        if isinstance(expiry, int):
            return datetime.now() + timedelta(seconds=expiry)
        return None


class RoutingEngine:
    """Rule-based signal routing."""

    def __init__(self):
        self.rules: Dict[str, RoutingRule] = {}
        self.recipients: Dict[str, Recipient] = {}
        self.default_channels: List[DeliveryChannel] = [DeliveryChannel.EMAIL]
        self.priority_channels: Dict[SignalPriority, List[DeliveryChannel]] = {
            SignalPriority.CRITICAL: [DeliveryChannel.SMS, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
            SignalPriority.HIGH: [DeliveryChannel.PUSH, DeliveryChannel.EMAIL, DeliveryChannel.SLACK],
            SignalPriority.MEDIUM: [DeliveryChannel.EMAIL, DeliveryChannel.IN_APP],
            SignalPriority.LOW: [DeliveryChannel.IN_APP, DeliveryChannel.DIGEST],
            SignalPriority.BATCH: [DeliveryChannel.DIGEST],
        }

    def add_rule(self, rule: RoutingRule) -> None:
        """Add a routing rule."""
        self.rules[rule.id] = rule

    def add_recipient(self, recipient: Recipient) -> None:
        """Add a recipient."""
        self.recipients[recipient.id] = recipient

    async def route(self, signal: Signal) -> List[tuple[str, DeliveryChannel]]:
        """Route signal to recipients and channels."""
        routes: List[tuple[str, DeliveryChannel]] = []

        # Find matching rules
        matching_rules = self._find_matching_rules(signal)

        if matching_rules:
            # Route based on rules
            for rule in matching_rules:
                for recipient_id in rule.recipients:
                    if recipient_id in self.recipients:
                        recipient = self.recipients[recipient_id]
                        for channel in rule.channels:
                            if self._can_deliver(recipient, channel, signal):
                                routes.append((recipient_id, channel))
        else:
            # Use default routing based on priority
            channels = self.priority_channels.get(signal.priority, self.default_channels)

            # Route to specified recipients or all
            recipient_ids = signal.recipients if signal.recipients else list(self.recipients.keys())

            for recipient_id in recipient_ids:
                if recipient_id in self.recipients:
                    recipient = self.recipients[recipient_id]
                    for channel in channels:
                        if self._can_deliver(recipient, channel, signal):
                            routes.append((recipient_id, channel))
                            break  # Use first available channel

        return routes

    def _find_matching_rules(self, signal: Signal) -> List[RoutingRule]:
        """Find rules that match the signal."""
        matching = []

        for rule in self.rules.values():
            if not rule.enabled:
                continue

            if self._matches_condition(signal, rule.condition):
                matching.append(rule)

        # Sort by specificity (more conditions = more specific)
        matching.sort(key=lambda r: len(r.condition), reverse=True)

        return matching

    def _matches_condition(self, signal: Signal, condition: Dict[str, Any]) -> bool:
        """Check if signal matches routing condition."""
        for key, value in condition.items():
            if key == "type" and signal.type.value != value:
                return False
            elif key == "priority" and signal.priority.value != value:
                return False
            elif key == "source" and signal.source != value:
                return False
            elif key == "tags" and not set(value).issubset(set(signal.tags)):
                return False
            elif key == "title_contains" and value.lower() not in signal.title.lower():
                return False

        return True

    def _can_deliver(self, recipient: Recipient, channel: DeliveryChannel, signal: Signal) -> bool:
        """Check if we can deliver to recipient via channel."""
        # Check if recipient has this channel configured
        if channel not in recipient.channels:
            return False

        # Check Do Not Disturb
        if recipient.do_not_disturb:
            if self._is_in_dnd(recipient.do_not_disturb):
                # Only critical signals bypass DND
                if signal.priority != SignalPriority.CRITICAL:
                    return False

        # Check preferences
        prefs = recipient.preferences
        if prefs.get("disabled_channels") and channel.value in prefs["disabled_channels"]:
            return False

        return True

    def _is_in_dnd(self, dnd_config: Dict[str, str]) -> bool:
        """Check if current time is in DND window."""
        now = datetime.now().time()
        try:
            start = datetime.strptime(dnd_config.get("start", "22:00"), "%H:%M").time()
            end = datetime.strptime(dnd_config.get("end", "08:00"), "%H:%M").time()

            if start <= end:
                return start <= now <= end
            else:
                return now >= start or now <= end
        except ValueError:
            return False


class DeliveryOrchestrator:
    """Multi-channel signal delivery with retry management."""

    def __init__(self):
        self.channel_configs: Dict[DeliveryChannel, ChannelConfig] = {}
        self.delivery_handlers: Dict[DeliveryChannel, Callable] = {}
        self.queue: List[tuple[Signal, str, DeliveryChannel]] = []
        self.rate_limiters: Dict[DeliveryChannel, Dict[str, Any]] = {}
        self.attempts: Dict[str, List[DeliveryAttempt]] = {}

    def configure_channel(self, config: ChannelConfig) -> None:
        """Configure a delivery channel."""
        self.channel_configs[config.channel] = config
        self.rate_limiters[config.channel] = {
            "count": 0,
            "window_start": datetime.now(),
            "limit": config.rate_limit,
        }

    def register_handler(self, channel: DeliveryChannel, handler: Callable) -> None:
        """Register a delivery handler for a channel."""
        self.delivery_handlers[channel] = handler

    async def deliver(
        self,
        signal: Signal,
        recipient_id: str,
        channel: DeliveryChannel,
        recipient: Recipient
    ) -> DeliveryAttempt:
        """Deliver signal to recipient via channel."""
        attempt_id = f"att_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        attempt = DeliveryAttempt(
            id=attempt_id,
            signal_id=signal.id,
            recipient_id=recipient_id,
            channel=channel,
            status=DeliveryStatus.PENDING,
            attempted_at=datetime.now(),
        )

        # Check rate limit
        if not self._check_rate_limit(channel):
            attempt.status = DeliveryStatus.QUEUED
            self.queue.append((signal, recipient_id, channel))
            return attempt

        # Get channel config and handler
        config = self.channel_configs.get(channel)
        handler = self.delivery_handlers.get(channel)

        if not handler:
            # Use default handler
            handler = self._default_handler

        attempt.status = DeliveryStatus.SENDING

        try:
            # Format message for channel
            formatted = self._format_for_channel(signal, channel, config)

            # Get recipient address
            address = recipient.channels.get(channel, "")

            # Send
            result = await handler(formatted, address, config)

            if result.get("success"):
                attempt.status = DeliveryStatus.DELIVERED
                attempt.delivered_at = datetime.now()
                attempt.response = result
            else:
                attempt.status = DeliveryStatus.FAILED
                attempt.error = result.get("error", "Unknown error")

        except Exception as e:
            attempt.status = DeliveryStatus.FAILED
            attempt.error = str(e)

        # Track attempt
        if signal.id not in self.attempts:
            self.attempts[signal.id] = []
        self.attempts[signal.id].append(attempt)

        # Retry if failed
        if attempt.status == DeliveryStatus.FAILED and config:
            if attempt.retry_count < config.retry_attempts:
                attempt.status = DeliveryStatus.RETRYING
                attempt.retry_count += 1
                asyncio.create_task(
                    self._schedule_retry(signal, recipient_id, channel, recipient, config.retry_delay)
                )

        return attempt

    def _check_rate_limit(self, channel: DeliveryChannel) -> bool:
        """Check if channel is within rate limits."""
        if channel not in self.rate_limiters:
            return True

        limiter = self.rate_limiters[channel]
        now = datetime.now()

        # Reset window if expired
        if (now - limiter["window_start"]).total_seconds() >= 60:
            limiter["count"] = 0
            limiter["window_start"] = now

        if limiter["count"] >= limiter["limit"]:
            return False

        limiter["count"] += 1
        return True

    def _format_for_channel(
        self,
        signal: Signal,
        channel: DeliveryChannel,
        config: Optional[ChannelConfig]
    ) -> Dict[str, Any]:
        """Format signal for specific channel."""
        base = {
            "title": signal.title,
            "message": signal.message,
            "priority": signal.priority.value,
            "action_url": signal.action_url,
            "data": signal.data,
        }

        if channel == DeliveryChannel.EMAIL:
            return {
                "subject": signal.title,
                "body": signal.message,
                "html": self._to_html(signal),
                "priority": "high" if signal.priority in [SignalPriority.CRITICAL, SignalPriority.HIGH] else "normal",
            }
        elif channel == DeliveryChannel.SMS:
            return {
                "text": f"{signal.title}: {signal.message}"[:160],
            }
        elif channel == DeliveryChannel.PUSH:
            return {
                "title": signal.title,
                "body": signal.message[:200],
                "data": {"signal_id": signal.id, "action_url": signal.action_url},
            }
        elif channel == DeliveryChannel.SLACK:
            return {
                "text": signal.title,
                "blocks": [
                    {"type": "header", "text": {"type": "plain_text", "text": signal.title}},
                    {"type": "section", "text": {"type": "mrkdwn", "text": signal.message}},
                ],
            }
        elif channel == DeliveryChannel.WEBHOOK:
            return {
                "signal_id": signal.id,
                "type": signal.type.value,
                "priority": signal.priority.value,
                **base,
            }

        return base

    def _to_html(self, signal: Signal) -> str:
        """Convert signal to HTML format."""
        priority_colors = {
            SignalPriority.CRITICAL: "#dc3545",
            SignalPriority.HIGH: "#fd7e14",
            SignalPriority.MEDIUM: "#ffc107",
            SignalPriority.LOW: "#28a745",
            SignalPriority.BATCH: "#6c757d",
        }

        color = priority_colors.get(signal.priority, "#6c757d")

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: {color}; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0;">
                <h2 style="margin: 0;">{signal.title}</h2>
            </div>
            <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-radius: 0 0 5px 5px;">
                <p style="white-space: pre-wrap;">{signal.message}</p>
                {f'<a href="{signal.action_url}" style="display: inline-block; padding: 10px 20px; background: {color}; color: white; text-decoration: none; border-radius: 5px;">Take Action</a>' if signal.action_url else ''}
            </div>
        </div>
        """
        return html

    async def _default_handler(
        self,
        payload: Dict[str, Any],
        address: str,
        config: Optional[ChannelConfig]
    ) -> Dict[str, Any]:
        """Default delivery handler (console output)."""
        print(f"[SIGNAL] Delivering to {address}: {payload.get('title', 'No title')}")
        return {"success": True, "message_id": f"msg_{datetime.now().timestamp()}"}

    async def _schedule_retry(
        self,
        signal: Signal,
        recipient_id: str,
        channel: DeliveryChannel,
        recipient: Recipient,
        delay: int
    ) -> None:
        """Schedule a retry attempt."""
        await asyncio.sleep(delay)
        await self.deliver(signal, recipient_id, channel, recipient)


class AnalyticsTracker:
    """Signal analytics and performance tracking."""

    def __init__(self):
        self.metrics: SignalMetrics = SignalMetrics()
        self.signal_history: Dict[str, Dict[str, Any]] = {}
        self.delivery_times: List[float] = []

    def track_sent(self, signal: Signal, channel: DeliveryChannel) -> None:
        """Track signal sent."""
        self.metrics.total_sent += 1

        if signal.id not in self.signal_history:
            self.signal_history[signal.id] = {
                "signal": signal,
                "sent_at": datetime.now(),
                "deliveries": [],
            }

        # Track by channel
        ch_key = channel.value
        if ch_key not in self.metrics.by_channel:
            self.metrics.by_channel[ch_key] = {"sent": 0, "delivered": 0, "opened": 0, "failed": 0}
        self.metrics.by_channel[ch_key]["sent"] += 1

        # Track by priority
        pr_key = signal.priority.value
        self.metrics.by_priority[pr_key] = self.metrics.by_priority.get(pr_key, 0) + 1

    def track_delivered(self, signal_id: str, channel: DeliveryChannel, delivery_time: float) -> None:
        """Track successful delivery."""
        self.metrics.total_delivered += 1
        self.delivery_times.append(delivery_time)

        # Update averages
        self.metrics.avg_delivery_time = sum(self.delivery_times) / len(self.delivery_times)
        self.metrics.delivery_rate = (self.metrics.total_delivered / self.metrics.total_sent * 100
                                       if self.metrics.total_sent > 0 else 0)

        # Track by channel
        ch_key = channel.value
        if ch_key in self.metrics.by_channel:
            self.metrics.by_channel[ch_key]["delivered"] += 1

        # Update history
        if signal_id in self.signal_history:
            self.signal_history[signal_id]["deliveries"].append({
                "channel": channel.value,
                "delivered_at": datetime.now(),
            })

    def track_opened(self, signal_id: str, channel: DeliveryChannel) -> None:
        """Track signal opened/read."""
        self.metrics.total_opened += 1
        self.metrics.open_rate = (self.metrics.total_opened / self.metrics.total_delivered * 100
                                   if self.metrics.total_delivered > 0 else 0)

        ch_key = channel.value
        if ch_key in self.metrics.by_channel:
            self.metrics.by_channel[ch_key]["opened"] += 1

    def track_clicked(self, signal_id: str) -> None:
        """Track action URL clicked."""
        self.metrics.total_clicked += 1
        self.metrics.click_rate = (self.metrics.total_clicked / self.metrics.total_opened * 100
                                    if self.metrics.total_opened > 0 else 0)

    def track_failed(self, signal_id: str, channel: DeliveryChannel, error: str) -> None:
        """Track delivery failure."""
        self.metrics.total_failed += 1

        ch_key = channel.value
        if ch_key in self.metrics.by_channel:
            self.metrics.by_channel[ch_key]["failed"] += 1

        if signal_id in self.signal_history:
            if "failures" not in self.signal_history[signal_id]:
                self.signal_history[signal_id]["failures"] = []
            self.signal_history[signal_id]["failures"].append({
                "channel": channel.value,
                "error": error,
                "at": datetime.now(),
            })

    def get_metrics(self) -> SignalMetrics:
        """Get current metrics."""
        return self.metrics

    def get_signal_status(self, signal_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific signal."""
        return self.signal_history.get(signal_id)

    def get_recent_signals(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent signal history."""
        sorted_history = sorted(
            self.signal_history.items(),
            key=lambda x: x[1]["sent_at"],
            reverse=True
        )
        return [{"id": k, **v} for k, v in sorted_history[:limit]]


class SignalEngine:
    """Main orchestrator for signal management."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path.home() / ".signal"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.receiver = SignalReceiver()
        self.router = RoutingEngine()
        self.orchestrator = DeliveryOrchestrator()
        self.analytics = AnalyticsTracker()

        self.escalation_config = EscalationConfig()
        self.digest_config = DigestConfig()

        self.pending_escalations: Dict[str, Dict[str, Any]] = {}
        self.digest_buffer: List[Signal] = []

        self._setup_default_channels()

    def _setup_default_channels(self) -> None:
        """Configure default delivery channels."""
        for channel in DeliveryChannel:
            config = ChannelConfig(
                channel=channel,
                enabled=True,
                rate_limit=60 if channel == DeliveryChannel.SMS else 100,
                retry_attempts=3,
                retry_delay=60,
            )
            self.orchestrator.configure_channel(config)

    async def send(
        self,
        title: str,
        message: str,
        signal_type: str = "notification",
        priority: str = "medium",
        recipients: Optional[List[str]] = None,
        channels: Optional[List[str]] = None,
        action_url: Optional[str] = None,
        action_required: bool = False,
        tags: Optional[List[str]] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Signal:
        """Send a new signal."""
        signal = Signal(
            id=f"sig_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            type=SignalType(signal_type),
            priority=SignalPriority(priority),
            title=title,
            message=message,
            source="manual",
            created_at=datetime.now(),
            recipients=recipients or [],
            channels=[DeliveryChannel(c) for c in (channels or [])],
            action_url=action_url,
            action_required=action_required,
            tags=tags or [],
            data=data or {},
        )

        await self._process_signal(signal)
        return signal

    async def alert(
        self,
        title: str,
        message: str,
        recipients: Optional[List[str]] = None,
    ) -> Signal:
        """Send a critical alert."""
        return await self.send(
            title=title,
            message=message,
            signal_type="alert",
            priority="critical",
            recipients=recipients,
            channels=["sms", "push", "email"],
            action_required=True,
        )

    async def notify(
        self,
        title: str,
        message: str,
        recipients: Optional[List[str]] = None,
    ) -> Signal:
        """Send a standard notification."""
        return await self.send(
            title=title,
            message=message,
            signal_type="notification",
            priority="medium",
            recipients=recipients,
            channels=["email", "in_app"],
        )

    async def receive_webhook(self, payload: Dict[str, Any], source: str) -> Optional[Signal]:
        """Process incoming webhook signal."""
        signal = await self.receiver.receive(payload, source)

        if signal:
            await self._process_signal(signal)

        return signal

    async def _process_signal(self, signal: Signal) -> None:
        """Process and deliver a signal."""
        # Check if should be batched
        if signal.priority == SignalPriority.BATCH:
            self.digest_buffer.append(signal)
            return

        # Route signal
        routes = await self.router.route(signal)

        # Deliver to each route
        for recipient_id, channel in routes:
            recipient = self.router.recipients.get(recipient_id)
            if recipient:
                self.analytics.track_sent(signal, channel)

                start_time = datetime.now()
                attempt = await self.orchestrator.deliver(signal, recipient_id, channel, recipient)
                delivery_time = (datetime.now() - start_time).total_seconds()

                if attempt.status == DeliveryStatus.DELIVERED:
                    self.analytics.track_delivered(signal.id, channel, delivery_time)
                elif attempt.status == DeliveryStatus.FAILED:
                    self.analytics.track_failed(signal.id, channel, attempt.error or "Unknown")

        # Set up escalation if action required
        if signal.action_required and self.escalation_config.enabled:
            self._schedule_escalation(signal)

        # Save signal
        self._save_signal(signal)

    def _schedule_escalation(self, signal: Signal) -> None:
        """Schedule escalation for unacknowledged signal."""
        self.pending_escalations[signal.id] = {
            "signal": signal,
            "level": EscalationLevel.NONE,
            "scheduled_at": datetime.now() + timedelta(seconds=self.escalation_config.initial_delay),
        }

    def acknowledge(self, signal_id: str) -> bool:
        """Acknowledge a signal to stop escalation."""
        if signal_id in self.pending_escalations:
            del self.pending_escalations[signal_id]
            return True
        return False

    def add_recipient(
        self,
        id: str,
        name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        slack: Optional[str] = None,
        groups: Optional[List[str]] = None,
    ) -> Recipient:
        """Add a recipient."""
        channels = {}
        if email:
            channels[DeliveryChannel.EMAIL] = email
        if phone:
            channels[DeliveryChannel.SMS] = phone
        if slack:
            channels[DeliveryChannel.SLACK] = slack

        recipient = Recipient(
            id=id,
            name=name,
            channels=channels,
            groups=groups or [],
        )

        self.router.add_recipient(recipient)
        return recipient

    def add_routing_rule(
        self,
        id: str,
        name: str,
        condition: Dict[str, Any],
        channels: List[str],
        recipients: List[str],
    ) -> RoutingRule:
        """Add a routing rule."""
        rule = RoutingRule(
            id=id,
            name=name,
            condition=condition,
            channels=[DeliveryChannel(c) for c in channels],
            recipients=recipients,
        )

        self.router.add_rule(rule)
        return rule

    def get_status(self, signal_id: str) -> Optional[Dict[str, Any]]:
        """Get signal delivery status."""
        return self.analytics.get_signal_status(signal_id)

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent signal history."""
        return self.analytics.get_recent_signals(limit)

    def get_metrics(self) -> SignalMetrics:
        """Get delivery metrics."""
        return self.analytics.get_metrics()

    def _save_signal(self, signal: Signal) -> None:
        """Persist signal to storage."""
        signals_file = self.data_dir / "signals.json"

        signals = []
        if signals_file.exists():
            with open(signals_file) as f:
                signals = json.load(f)

        signals.append({
            "id": signal.id,
            "type": signal.type.value,
            "priority": signal.priority.value,
            "title": signal.title,
            "message": signal.message,
            "source": signal.source,
            "created_at": signal.created_at.isoformat(),
            "recipients": signal.recipients,
            "channels": [c.value for c in signal.channels],
            "tags": signal.tags,
        })

        # Keep last 1000 signals
        signals = signals[-1000:]

        with open(signals_file, "w") as f:
            json.dump(signals, f, indent=2)


class SignalReporter:
    """Generate signal reports and visualizations."""

    PRIORITY_ICONS = {
        SignalPriority.CRITICAL: "🔴",
        SignalPriority.HIGH: "🟠",
        SignalPriority.MEDIUM: "🟡",
        SignalPriority.LOW: "🟢",
        SignalPriority.BATCH: "⚪",
    }

    STATUS_ICONS = {
        DeliveryStatus.DELIVERED: "✓",
        DeliveryStatus.OPENED: "👁",
        DeliveryStatus.CLICKED: "🖱",
        DeliveryStatus.FAILED: "✗",
        DeliveryStatus.PENDING: "○",
        DeliveryStatus.QUEUED: "◐",
        DeliveryStatus.SENDING: "→",
        DeliveryStatus.RETRYING: "↺",
    }

    def generate_dispatch_report(self, signal: Signal, attempts: List[DeliveryAttempt]) -> str:
        """Generate signal dispatch report."""
        priority_icon = self.PRIORITY_ICONS.get(signal.priority, "○")

        # Calculate delivery stats
        total = len(attempts)
        delivered = sum(1 for a in attempts if a.status == DeliveryStatus.DELIVERED)
        failed = sum(1 for a in attempts if a.status == DeliveryStatus.FAILED)
        pending = total - delivered - failed
        success_rate = (delivered / total * 100) if total > 0 else 0

        report = f"""
SIGNAL DISPATCHED
═══════════════════════════════════════
Signal ID: {signal.id}
Type: {signal.type.value}
Time: {signal.created_at.strftime("%Y-%m-%d %H:%M:%S")}
═══════════════════════════════════════

SIGNAL OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       SIGNAL STATUS                 │
│                                     │
│  Priority: {priority_icon} {signal.priority.value.upper():<15}│
│  Type: {signal.type.value:<20}│
│                                     │
│  Title: {signal.title[:30]:<28}│
│  Source: {signal.source:<27}│
│                                     │
│  Status: {"●" if delivered > 0 else "○"} {"Dispatched" if delivered > 0 else "Pending":<27}│
└─────────────────────────────────────┘

CONTENT
────────────────────────────────────
┌─────────────────────────────────────┐
│  {signal.message[:100]:<35}│
│                                     │
│  Action Required: {"Yes" if signal.action_required else "No":<18}│
│  Action URL: {(signal.action_url or "None")[:20]:<23}│
└─────────────────────────────────────┘

DELIVERY STATUS
────────────────────────────────────"""

        # Add delivery attempts
        for attempt in attempts:
            icon = self.STATUS_ICONS.get(attempt.status, "○")
            time_str = attempt.attempted_at.strftime("%H:%M:%S")
            report += f"\n│ {attempt.channel.value:<12} │ {icon} {attempt.status.value:<10} │ {time_str} │"

        report += f"""

SUMMARY
────────────────────────────────────
┌─────────────────────────────────────┐
│  Total Recipients: {total:<18}│
│                                     │
│  • Delivered: {delivered:<22}│
│  • Failed: {failed:<25}│
│  • Pending: {pending:<24}│
│                                     │
│  Success Rate: {success_rate:.1f}%{' ':<20}│
└─────────────────────────────────────┘

Signal Status: {"●" if delivered > 0 else "○"} {"Dispatched Successfully" if delivered > 0 else "Pending Delivery"}
"""
        return report

    def generate_metrics_report(self, metrics: SignalMetrics) -> str:
        """Generate metrics summary report."""
        report = f"""
SIGNAL METRICS REPORT
═══════════════════════════════════════
Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
═══════════════════════════════════════

OVERALL PERFORMANCE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Total Sent: {metrics.total_sent:<23}│
│  Total Delivered: {metrics.total_delivered:<18}│
│  Total Opened: {metrics.total_opened:<21}│
│  Total Failed: {metrics.total_failed:<21}│
│                                     │
│  Delivery Rate: {metrics.delivery_rate:.1f}%{' ':<19}│
│  Open Rate: {metrics.open_rate:.1f}%{' ':<23}│
│  Click Rate: {metrics.click_rate:.1f}%{' ':<22}│
│                                     │
│  Avg Delivery Time: {metrics.avg_delivery_time:.2f}s{' ':<14}│
└─────────────────────────────────────┘

BY CHANNEL
────────────────────────────────────"""

        for channel, stats in metrics.by_channel.items():
            ch_delivery_rate = (stats["delivered"] / stats["sent"] * 100) if stats["sent"] > 0 else 0
            report += f"""
│ {channel.upper():<15}│
│   Sent: {stats['sent']:<8} Delivered: {stats['delivered']:<5} │
│   Rate: {ch_delivery_rate:.1f}%{' ':<25}│"""

        report += f"""

BY PRIORITY
────────────────────────────────────"""

        for priority, count in metrics.by_priority.items():
            icon = self.PRIORITY_ICONS.get(SignalPriority(priority), "○")
            report += f"\n│ {icon} {priority.upper():<12}: {count:<5} signals │"

        report += """

Metrics Complete
"""
        return report

    def generate_history_report(self, signals: List[Dict[str, Any]]) -> str:
        """Generate signal history report."""
        report = f"""
SIGNAL HISTORY
═══════════════════════════════════════
Total Signals: {len(signals)}
═══════════════════════════════════════

RECENT SIGNALS
────────────────────────────────────"""

        for sig in signals[:20]:
            signal = sig.get("signal")
            if signal:
                icon = self.PRIORITY_ICONS.get(signal.priority, "○")
                time_str = sig.get("sent_at", datetime.now()).strftime("%Y-%m-%d %H:%M")
                deliveries = len(sig.get("deliveries", []))
                failures = len(sig.get("failures", []))

                report += f"""
│ {icon} {signal.title[:30]:<32}│
│   Time: {time_str}  Deliveries: {deliveries} Failures: {failures} │"""

        report += """

History Complete
"""
        return report


# CLI Interface
async def main():
    """CLI entry point for Signal Engine."""
    parser = argparse.ArgumentParser(description="SIGNAL.EXE - Alert & Notification Agent")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Send command
    send_parser = subparsers.add_parser("send", help="Send a signal")
    send_parser.add_argument("message", help="Signal message")
    send_parser.add_argument("--title", "-t", default="Notification", help="Signal title")
    send_parser.add_argument("--priority", "-p", choices=["critical", "high", "medium", "low"], default="medium")
    send_parser.add_argument("--type", choices=["alert", "warning", "notification", "update"], default="notification")
    send_parser.add_argument("--recipients", "-r", nargs="+", help="Recipient IDs")
    send_parser.add_argument("--channels", "-c", nargs="+", help="Delivery channels")
    send_parser.add_argument("--action-url", help="Action URL")

    # Alert command
    alert_parser = subparsers.add_parser("alert", help="Send critical alert")
    alert_parser.add_argument("message", help="Alert message")
    alert_parser.add_argument("--title", "-t", default="ALERT", help="Alert title")
    alert_parser.add_argument("--recipients", "-r", nargs="+", help="Recipient IDs")

    # Status command
    status_parser = subparsers.add_parser("status", help="Get signal status")
    status_parser.add_argument("signal_id", help="Signal ID")

    # History command
    history_parser = subparsers.add_parser("history", help="View signal history")
    history_parser.add_argument("--limit", "-l", type=int, default=50, help="Max signals to show")

    # Metrics command
    subparsers.add_parser("metrics", help="View delivery metrics")

    # Add recipient command
    recipient_parser = subparsers.add_parser("add-recipient", help="Add a recipient")
    recipient_parser.add_argument("id", help="Recipient ID")
    recipient_parser.add_argument("name", help="Recipient name")
    recipient_parser.add_argument("--email", help="Email address")
    recipient_parser.add_argument("--phone", help="Phone number")
    recipient_parser.add_argument("--slack", help="Slack ID")

    # Add rule command
    rule_parser = subparsers.add_parser("add-rule", help="Add routing rule")
    rule_parser.add_argument("id", help="Rule ID")
    rule_parser.add_argument("name", help="Rule name")
    rule_parser.add_argument("--condition", required=True, help="JSON condition")
    rule_parser.add_argument("--channels", "-c", nargs="+", required=True, help="Delivery channels")
    rule_parser.add_argument("--recipients", "-r", nargs="+", required=True, help="Recipient IDs")

    # Acknowledge command
    ack_parser = subparsers.add_parser("ack", help="Acknowledge signal")
    ack_parser.add_argument("signal_id", help="Signal ID to acknowledge")

    args = parser.parse_args()

    engine = SignalEngine()
    reporter = SignalReporter()

    if args.command == "send":
        signal = await engine.send(
            title=args.title,
            message=args.message,
            signal_type=args.type,
            priority=args.priority,
            recipients=args.recipients,
            channels=args.channels,
            action_url=args.action_url,
        )
        attempts = engine.orchestrator.attempts.get(signal.id, [])
        print(reporter.generate_dispatch_report(signal, attempts))

    elif args.command == "alert":
        signal = await engine.alert(
            title=args.title,
            message=args.message,
            recipients=args.recipients,
        )
        attempts = engine.orchestrator.attempts.get(signal.id, [])
        print(reporter.generate_dispatch_report(signal, attempts))

    elif args.command == "status":
        status = engine.get_status(args.signal_id)
        if status:
            print(f"Signal: {args.signal_id}")
            print(f"Status: {json.dumps(status, indent=2, default=str)}")
        else:
            print(f"Signal {args.signal_id} not found")

    elif args.command == "history":
        history = engine.get_history(args.limit)
        print(reporter.generate_history_report(history))

    elif args.command == "metrics":
        metrics = engine.get_metrics()
        print(reporter.generate_metrics_report(metrics))

    elif args.command == "add-recipient":
        recipient = engine.add_recipient(
            id=args.id,
            name=args.name,
            email=args.email,
            phone=args.phone,
            slack=args.slack,
        )
        print(f"Added recipient: {recipient.name} ({recipient.id})")

    elif args.command == "add-rule":
        condition = json.loads(args.condition)
        rule = engine.add_routing_rule(
            id=args.id,
            name=args.name,
            condition=condition,
            channels=args.channels,
            recipients=args.recipients,
        )
        print(f"Added rule: {rule.name} ({rule.id})")

    elif args.command == "ack":
        if engine.acknowledge(args.signal_id):
            print(f"Acknowledged signal: {args.signal_id}")
        else:
            print(f"Signal {args.signal_id} not found or already acknowledged")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
SIGNAL DISPATCHED
═══════════════════════════════════════
Signal ID: [signal_id]
Type: [alert/warning/notification]
Time: [timestamp]
═══════════════════════════════════════

SIGNAL OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       SIGNAL STATUS                 │
│                                     │
│  Priority: [●/◐/○] [critical/high]  │
│  Type: [alert/notification/update]  │
│                                     │
│  Title: [signal_title]              │
│  Source: [origin_system]            │
│                                     │
│  Status: [●] Dispatched             │
└─────────────────────────────────────┘

CONTENT
────────────────────────────────────
┌─────────────────────────────────────┐
│  [signal_message_content]           │
│                                     │
│  Context: [additional_context]      │
│  Action Required: [yes/no]          │
└─────────────────────────────────────┘

DELIVERY STATUS
────────────────────────────────────
| Channel | Status | Time |
|---------|--------|------|
| [channel_1] | [●/○] | [time] |
| [channel_2] | [●/○] | [time] |
| [channel_3] | [●/○] | [time] |

RECIPIENTS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Total: [count] recipients          │
│                                     │
│  • [recipient_1]: [●] Delivered     │
│  • [recipient_2]: [●] Delivered     │
│  • [recipient_3]: [◐] Pending       │
│                                     │
│  Success Rate: [X]%                 │
└─────────────────────────────────────┘

TRACKING
────────────────────────────────────
| Metric | Value |
|--------|-------|
| Sent | [count] |
| Delivered | [count] |
| Opened | [count] |
| Failed | [count] |

Signal Status: ● Dispatched Successfully
```

## QUICK COMMANDS

- `/launch-signal send [message]` - Send signal
- `/launch-signal alert [message]` - Send urgent alert
- `/launch-signal status [id]` - Check signal status
- `/launch-signal history` - View recent signals
- `/launch-signal metrics` - View delivery metrics
- `/launch-signal add-recipient` - Add a recipient
- `/launch-signal add-rule` - Add routing rule
- `/launch-signal ack [id]` - Acknowledge signal

$ARGUMENTS
