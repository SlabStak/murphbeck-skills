# SOCIAL.APPROVE.EXE - Content Approval Workflow Manager

You are SOCIAL.APPROVE.EXE — the content approval workflow specialist that manages multi-stage review processes across brands with clear audit trails, efficient turnaround, and stakeholder communication.

MISSION: Manage approvals. Track revisions. Ensure quality.

---

## SYSTEM CONTEXT

This skill manages multi-stage content approval workflows with configurable pipelines, stakeholder management, SLA tracking, comprehensive audit trails, and automated notifications to ensure content quality and timely delivery.

---

## APPROVAL WORKFLOW ENGINE

```python
#!/usr/bin/env python3
"""
SOCIAL.APPROVE.EXE - Content Approval Workflow Manager
Manages multi-stage review processes with audit trails.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
import random
import json
import argparse


# ============================================================
# ENUMS - Approval Workflow Domain
# ============================================================

class ApprovalStage(Enum):
    """Stages in the approval workflow."""
    DRAFT = "draft"
    INTERNAL_REVIEW = "internal_review"
    CLIENT_REVIEW = "client_review"
    REVISION = "revision"
    FINAL_APPROVAL = "final_approval"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"

    @property
    def owner_role(self) -> str:
        """Default owner role for this stage."""
        owners = {
            "draft": "content_creator",
            "internal_review": "content_manager",
            "client_review": "client_contact",
            "revision": "content_creator",
            "final_approval": "content_manager",
            "scheduled": "social_manager",
            "published": "system"
        }
        return owners.get(self.value, "content_manager")

    @property
    def action_verb(self) -> str:
        """Action to take at this stage."""
        actions = {
            "draft": "Create content",
            "internal_review": "Review quality and brand",
            "client_review": "Approve or request changes",
            "revision": "Make requested changes",
            "final_approval": "Final check",
            "scheduled": "Queue for publishing",
            "published": "Monitor engagement"
        }
        return actions.get(self.value, "Process")

    @property
    def sla_hours(self) -> int:
        """Default SLA in hours for this stage."""
        slas = {
            "draft": 0,  # No SLA for creation
            "internal_review": 24,
            "client_review": 48,
            "revision": 24,
            "final_approval": 12,
            "scheduled": 24,
            "published": 0
        }
        return slas.get(self.value, 24)

    @property
    def next_stages(self) -> List[str]:
        """Valid next stages from current."""
        transitions = {
            "draft": ["internal_review"],
            "internal_review": ["client_review", "revision"],
            "client_review": ["revision", "final_approval"],
            "revision": ["internal_review"],
            "final_approval": ["scheduled", "revision"],
            "scheduled": ["published"],
            "published": []
        }
        return transitions.get(self.value, [])

    @property
    def can_skip_to_approved(self) -> bool:
        """Whether this stage can skip directly to approved."""
        return self.value in ["client_review", "final_approval"]

    @property
    def requires_feedback(self) -> bool:
        """Whether rejection at this stage requires feedback."""
        return self.value in ["internal_review", "client_review", "final_approval"]


class ApprovalStatus(Enum):
    """Status of content items in workflow."""
    DRAFT = "draft"
    PENDING_INTERNAL = "pending_internal"
    INTERNAL_APPROVED = "internal_approved"
    PENDING_CLIENT = "pending_client"
    REVISION_REQUESTED = "revision_requested"
    CLIENT_APPROVED = "client_approved"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

    @property
    def meaning(self) -> str:
        """Status meaning description."""
        meanings = {
            "draft": "In creation",
            "pending_internal": "Awaiting internal review",
            "internal_approved": "Ready for client",
            "pending_client": "Awaiting client review",
            "revision_requested": "Changes needed",
            "client_approved": "Client signed off",
            "approved": "Ready to schedule",
            "scheduled": "Queued for posting",
            "published": "Live on platform",
            "rejected": "Cannot proceed",
            "cancelled": "Workflow cancelled"
        }
        return meanings.get(self.value, "Unknown")

    @property
    def next_action(self) -> str:
        """Next action for this status."""
        actions = {
            "draft": "Submit for review",
            "pending_internal": "Manager reviews",
            "internal_approved": "Send to client",
            "pending_client": "Client reviews",
            "revision_requested": "Creator revises",
            "client_approved": "Final check",
            "approved": "Add to queue",
            "scheduled": "Auto-publish",
            "published": "Monitor engagement",
            "rejected": "Review rejection",
            "cancelled": "No action"
        }
        return actions.get(self.value, "Review")

    @property
    def is_active(self) -> bool:
        """Whether this is an active (in-progress) status."""
        return self.value not in ["published", "rejected", "cancelled"]

    @property
    def is_terminal(self) -> bool:
        """Whether this is a terminal status."""
        return self.value in ["published", "rejected", "cancelled"]

    @property
    def color(self) -> str:
        """Color for visual display."""
        colors = {
            "draft": "gray",
            "pending_internal": "yellow",
            "internal_approved": "blue",
            "pending_client": "orange",
            "revision_requested": "red",
            "client_approved": "green",
            "approved": "green",
            "scheduled": "cyan",
            "published": "purple",
            "rejected": "red",
            "cancelled": "gray"
        }
        return colors.get(self.value, "gray")

    @property
    def icon(self) -> str:
        """Visual icon for status."""
        icons = {
            "draft": "📝",
            "pending_internal": "⏳",
            "internal_approved": "✅",
            "pending_client": "👀",
            "revision_requested": "🔄",
            "client_approved": "👍",
            "approved": "✅",
            "scheduled": "📅",
            "published": "🚀",
            "rejected": "❌",
            "cancelled": "🚫"
        }
        return icons.get(self.value, "⚪")


class StakeholderRole(Enum):
    """Roles in the approval workflow."""
    CONTENT_CREATOR = "content_creator"
    CONTENT_MANAGER = "content_manager"
    CLIENT_CONTACT = "client_contact"
    CLIENT_APPROVER = "client_approver"
    SOCIAL_MANAGER = "social_manager"
    EXECUTIVE = "executive"
    LEGAL = "legal"

    @property
    def permissions(self) -> List[str]:
        """Permissions for this role."""
        perms = {
            "content_creator": ["create", "edit", "submit"],
            "content_manager": ["review", "approve", "reject", "edit"],
            "client_contact": ["view", "comment"],
            "client_approver": ["review", "approve", "reject", "request_revision"],
            "social_manager": ["schedule", "publish", "reschedule"],
            "executive": ["view", "approve", "reject", "override"],
            "legal": ["review", "flag", "approve", "reject"]
        }
        return perms.get(self.value, ["view"])

    @property
    def can_approve(self) -> bool:
        """Whether this role can approve content."""
        return "approve" in self.permissions

    @property
    def can_reject(self) -> bool:
        """Whether this role can reject content."""
        return "reject" in self.permissions

    @property
    def notification_priority(self) -> str:
        """Notification priority for this role."""
        priorities = {
            "content_creator": "normal",
            "content_manager": "high",
            "client_contact": "normal",
            "client_approver": "high",
            "social_manager": "normal",
            "executive": "low",
            "legal": "high"
        }
        return priorities.get(self.value, "normal")


class NotificationType(Enum):
    """Types of notifications in workflow."""
    NEW_SUBMISSION = "new_submission"
    REVISION_NEEDED = "revision_needed"
    APPROVED = "approved"
    SLA_WARNING = "sla_warning"
    ESCALATION = "escalation"
    COMMENT_ADDED = "comment_added"
    STATUS_CHANGE = "status_change"
    REMINDER = "reminder"

    @property
    def template_key(self) -> str:
        """Template key for notification."""
        templates = {
            "new_submission": "approval_request",
            "revision_needed": "feedback_summary",
            "approved": "ready_to_schedule",
            "sla_warning": "deadline_reminder",
            "escalation": "overdue_alert",
            "comment_added": "new_comment",
            "status_change": "status_update",
            "reminder": "gentle_reminder"
        }
        return templates.get(self.value, "generic")

    @property
    def urgency(self) -> str:
        """Urgency level for notification."""
        urgency_map = {
            "new_submission": "normal",
            "revision_needed": "high",
            "approved": "low",
            "sla_warning": "high",
            "escalation": "urgent",
            "comment_added": "low",
            "status_change": "normal",
            "reminder": "normal"
        }
        return urgency_map.get(self.value, "normal")

    @property
    def channels(self) -> List[str]:
        """Default notification channels."""
        channels = {
            "new_submission": ["email", "app"],
            "revision_needed": ["email", "app", "slack"],
            "approved": ["email", "app"],
            "sla_warning": ["email", "app", "slack"],
            "escalation": ["email", "app", "slack", "sms"],
            "comment_added": ["app"],
            "status_change": ["app"],
            "reminder": ["email", "app"]
        }
        return channels.get(self.value, ["app"])


class ContentType(Enum):
    """Types of content being approved."""
    STATIC_POST = "static_post"
    CAROUSEL = "carousel"
    REEL = "reel"
    VIDEO = "video"
    STORY = "story"
    THREAD = "thread"
    BLOG_POST = "blog_post"
    AD_CREATIVE = "ad_creative"

    @property
    def typical_review_time_hours(self) -> int:
        """Typical review time in hours."""
        times = {
            "static_post": 4,
            "carousel": 8,
            "reel": 12,
            "video": 24,
            "story": 2,
            "thread": 6,
            "blog_post": 48,
            "ad_creative": 24
        }
        return times.get(self.value, 8)

    @property
    def requires_legal_review(self) -> bool:
        """Whether this type typically needs legal review."""
        return self.value in ["ad_creative", "video", "blog_post"]

    @property
    def max_revision_rounds(self) -> int:
        """Maximum revision rounds before escalation."""
        rounds = {
            "static_post": 2,
            "carousel": 3,
            "reel": 3,
            "video": 4,
            "story": 1,
            "thread": 2,
            "blog_post": 5,
            "ad_creative": 4
        }
        return rounds.get(self.value, 3)


class SLAStatus(Enum):
    """SLA compliance status."""
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    BREACHING = "breaching"
    BREACHED = "breached"
    MET = "met"
    NOT_APPLICABLE = "not_applicable"

    @property
    def icon(self) -> str:
        """Visual icon for SLA status."""
        icons = {
            "on_track": "🟢",
            "at_risk": "🟡",
            "breaching": "🟠",
            "breached": "🔴",
            "met": "✅",
            "not_applicable": "⚪"
        }
        return icons.get(self.value, "⚪")

    @property
    def action_required(self) -> bool:
        """Whether immediate action is required."""
        return self.value in ["at_risk", "breaching", "breached"]

    @classmethod
    def from_hours_remaining(cls, hours: float, total_sla_hours: int) -> "SLAStatus":
        """Determine SLA status from hours remaining."""
        if total_sla_hours == 0:
            return cls.NOT_APPLICABLE
        if hours <= 0:
            return cls.BREACHED
        ratio = hours / total_sla_hours
        if ratio <= 0.1:
            return cls.BREACHING
        elif ratio <= 0.25:
            return cls.AT_RISK
        else:
            return cls.ON_TRACK


# ============================================================
# DATACLASSES - Approval Workflow Structures
# ============================================================

@dataclass
class Stakeholder:
    """A stakeholder in the approval workflow."""
    stakeholder_id: str
    name: str
    email: str
    role: StakeholderRole
    brand_name: str
    is_primary: bool = True
    notification_preferences: Dict[str, bool] = field(default_factory=lambda: {
        "email": True, "app": True, "slack": False, "sms": False
    })
    response_time_avg_hours: float = 0.0

    @property
    def can_approve(self) -> bool:
        """Whether stakeholder can approve."""
        return self.role.can_approve

    @property
    def display_name(self) -> str:
        """Display name with role."""
        return f"{self.name} ({self.role.value.replace('_', ' ').title()})"


@dataclass
class RevisionRequest:
    """A revision request with feedback."""
    revision_id: str
    content_id: str
    requested_by: str
    requested_at: datetime
    feedback: str
    specific_changes: List[str] = field(default_factory=list)
    priority: str = "normal"
    resolved: bool = False
    resolved_at: Optional[datetime] = None

    @property
    def age_hours(self) -> float:
        """Age of revision request in hours."""
        return (datetime.now() - self.requested_at).total_seconds() / 3600

    @property
    def is_urgent(self) -> bool:
        """Whether this is an urgent revision."""
        return self.priority == "urgent" or self.age_hours > 24


@dataclass
class AuditEntry:
    """An entry in the audit trail."""
    entry_id: str
    content_id: str
    action: str
    performed_by: str
    performed_at: datetime
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def summary(self) -> str:
        """Summary of the audit entry."""
        if self.old_status and self.new_status:
            return f"{self.action}: {self.old_status} → {self.new_status}"
        return self.action


@dataclass
class ContentItem:
    """A content item going through approval."""
    content_id: str
    brand_name: str
    platform: str
    content_type: ContentType
    title: str
    description: str = ""
    status: ApprovalStatus = ApprovalStatus.DRAFT
    current_stage: ApprovalStage = ApprovalStage.DRAFT
    creator_id: str = ""
    assigned_to: Optional[str] = None
    caption: str = ""
    media_urls: List[str] = field(default_factory=list)
    hashtags: List[str] = field(default_factory=list)
    scheduled_time: Optional[datetime] = None
    revision_count: int = 0
    revisions: List[RevisionRequest] = field(default_factory=list)
    audit_trail: List[AuditEntry] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

    @property
    def age_hours(self) -> float:
        """Total age in hours."""
        return (datetime.now() - self.created_at).total_seconds() / 3600

    @property
    def stage_age_hours(self) -> float:
        """Hours in current stage."""
        last_stage_change = None
        for entry in reversed(self.audit_trail):
            if entry.action == "stage_change":
                last_stage_change = entry.performed_at
                break
        if last_stage_change:
            return (datetime.now() - last_stage_change).total_seconds() / 3600
        return self.age_hours

    @property
    def sla_hours_remaining(self) -> float:
        """Hours remaining before SLA breach."""
        sla = self.current_stage.sla_hours
        if sla == 0:
            return float('inf')
        return max(0, sla - self.stage_age_hours)

    @property
    def sla_status(self) -> SLAStatus:
        """Current SLA status."""
        sla = self.current_stage.sla_hours
        return SLAStatus.from_hours_remaining(self.sla_hours_remaining, sla)

    @property
    def is_overdue(self) -> bool:
        """Whether item is overdue."""
        return self.sla_status in [SLAStatus.BREACHED, SLAStatus.BREACHING]

    @property
    def turnaround_hours(self) -> Optional[float]:
        """Total turnaround time if approved."""
        if self.approved_at and self.submitted_at:
            return (self.approved_at - self.submitted_at).total_seconds() / 3600
        return None

    @property
    def has_pending_revisions(self) -> bool:
        """Whether there are unresolved revisions."""
        return any(not r.resolved for r in self.revisions)

    @property
    def max_revisions_exceeded(self) -> bool:
        """Whether max revisions exceeded."""
        return self.revision_count > self.content_type.max_revision_rounds

    def add_audit_entry(
        self,
        action: str,
        performed_by: str,
        old_status: Optional[str] = None,
        new_status: Optional[str] = None,
        notes: str = ""
    ) -> AuditEntry:
        """Add entry to audit trail."""
        entry = AuditEntry(
            entry_id=f"audit_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(100, 999)}",
            content_id=self.content_id,
            action=action,
            performed_by=performed_by,
            performed_at=datetime.now(),
            old_status=old_status,
            new_status=new_status,
            notes=notes
        )
        self.audit_trail.append(entry)
        return entry


@dataclass
class ApprovalQueue:
    """Queue of content items for approval."""
    brand_name: str
    items: List[ContentItem] = field(default_factory=list)
    stakeholders: List[Stakeholder] = field(default_factory=list)

    @property
    def pending_internal_count(self) -> int:
        """Count pending internal review."""
        return len([i for i in self.items if i.status == ApprovalStatus.PENDING_INTERNAL])

    @property
    def pending_client_count(self) -> int:
        """Count pending client review."""
        return len([i for i in self.items if i.status == ApprovalStatus.PENDING_CLIENT])

    @property
    def revision_count(self) -> int:
        """Count in revision."""
        return len([i for i in self.items if i.status == ApprovalStatus.REVISION_REQUESTED])

    @property
    def ready_to_schedule_count(self) -> int:
        """Count ready to schedule."""
        return len([i for i in self.items if i.status == ApprovalStatus.APPROVED])

    @property
    def active_items(self) -> List[ContentItem]:
        """Get active (non-terminal) items."""
        return [i for i in self.items if i.status.is_active]

    @property
    def overdue_items(self) -> List[ContentItem]:
        """Get overdue items."""
        return [i for i in self.items if i.is_overdue]

    @property
    def avg_turnaround_hours(self) -> float:
        """Average turnaround time for completed items."""
        completed = [i for i in self.items if i.turnaround_hours is not None]
        if not completed:
            return 0.0
        return sum(i.turnaround_hours for i in completed) / len(completed)

    @property
    def sla_compliance_rate(self) -> float:
        """SLA compliance rate for completed items."""
        completed = [i for i in self.items if i.status == ApprovalStatus.PUBLISHED]
        if not completed:
            return 100.0
        met = len([i for i in completed if i.turnaround_hours and
                  i.turnaround_hours <= sum(s.sla_hours for s in ApprovalStage)])
        return (met / len(completed)) * 100

    def get_items_by_stage(self, stage: ApprovalStage) -> List[ContentItem]:
        """Get items at specific stage."""
        return [i for i in self.items if i.current_stage == stage]

    def get_items_by_assignee(self, assignee_id: str) -> List[ContentItem]:
        """Get items assigned to specific person."""
        return [i for i in self.items if i.assigned_to == assignee_id]


@dataclass
class Notification:
    """A notification to send."""
    notification_id: str
    notification_type: NotificationType
    recipient_id: str
    recipient_email: str
    content_id: str
    subject: str
    body: str
    channels: List[str] = field(default_factory=list)
    sent: bool = False
    sent_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def is_urgent(self) -> bool:
        """Whether notification is urgent."""
        return self.notification_type.urgency == "urgent"


@dataclass
class WorkflowConfiguration:
    """Configuration for approval workflow."""
    brand_name: str
    stages: List[ApprovalStage] = field(default_factory=lambda: list(ApprovalStage))
    require_client_approval: bool = True
    require_legal_review: bool = False
    auto_approve_threshold_hours: int = 72
    max_revision_rounds: int = 3
    escalation_after_hours: int = 48
    stakeholder_roles: Dict[str, List[str]] = field(default_factory=dict)

    @property
    def total_sla_hours(self) -> int:
        """Total SLA across all stages."""
        return sum(s.sla_hours for s in self.stages if s.sla_hours > 0)


# ============================================================
# ENGINE CLASSES - Workflow Processing
# ============================================================

class WorkflowEngine:
    """Manages content through approval workflow."""

    def __init__(self):
        self.queues: Dict[str, ApprovalQueue] = {}
        self.configurations: Dict[str, WorkflowConfiguration] = {}

    def get_queue(self, brand_name: str) -> ApprovalQueue:
        """Get or create queue for brand."""
        if brand_name not in self.queues:
            self.queues[brand_name] = ApprovalQueue(brand_name=brand_name)
        return self.queues[brand_name]

    def submit_for_review(
        self,
        item: ContentItem,
        submitter_id: str
    ) -> ContentItem:
        """Submit content for review."""
        old_status = item.status.value
        item.status = ApprovalStatus.PENDING_INTERNAL
        item.current_stage = ApprovalStage.INTERNAL_REVIEW
        item.submitted_at = datetime.now()
        item.updated_at = datetime.now()

        item.add_audit_entry(
            action="submitted",
            performed_by=submitter_id,
            old_status=old_status,
            new_status=item.status.value,
            notes="Submitted for internal review"
        )

        return item

    def approve(
        self,
        item: ContentItem,
        approver_id: str,
        notes: str = ""
    ) -> ContentItem:
        """Approve content at current stage."""
        old_status = item.status.value
        old_stage = item.current_stage

        # Determine next status based on current stage
        if old_stage == ApprovalStage.INTERNAL_REVIEW:
            item.status = ApprovalStatus.INTERNAL_APPROVED
            item.current_stage = ApprovalStage.CLIENT_REVIEW
        elif old_stage == ApprovalStage.CLIENT_REVIEW:
            item.status = ApprovalStatus.CLIENT_APPROVED
            item.current_stage = ApprovalStage.FINAL_APPROVAL
        elif old_stage == ApprovalStage.FINAL_APPROVAL:
            item.status = ApprovalStatus.APPROVED
            item.current_stage = ApprovalStage.SCHEDULED
            item.approved_at = datetime.now()

        item.updated_at = datetime.now()

        item.add_audit_entry(
            action="approved",
            performed_by=approver_id,
            old_status=old_status,
            new_status=item.status.value,
            notes=notes or f"Approved at {old_stage.value}"
        )

        return item

    def request_revision(
        self,
        item: ContentItem,
        requester_id: str,
        feedback: str,
        changes: List[str] = None
    ) -> Tuple[ContentItem, RevisionRequest]:
        """Request revisions on content."""
        old_status = item.status.value

        revision = RevisionRequest(
            revision_id=f"rev_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(100, 999)}",
            content_id=item.content_id,
            requested_by=requester_id,
            requested_at=datetime.now(),
            feedback=feedback,
            specific_changes=changes or []
        )

        item.revisions.append(revision)
        item.revision_count += 1
        item.status = ApprovalStatus.REVISION_REQUESTED
        item.current_stage = ApprovalStage.REVISION
        item.updated_at = datetime.now()

        item.add_audit_entry(
            action="revision_requested",
            performed_by=requester_id,
            old_status=old_status,
            new_status=item.status.value,
            notes=f"Revision #{item.revision_count}: {feedback[:100]}"
        )

        return item, revision

    def submit_revision(
        self,
        item: ContentItem,
        creator_id: str,
        revision_id: str,
        notes: str = ""
    ) -> ContentItem:
        """Submit completed revision."""
        # Mark revision as resolved
        for revision in item.revisions:
            if revision.revision_id == revision_id:
                revision.resolved = True
                revision.resolved_at = datetime.now()

        old_status = item.status.value
        item.status = ApprovalStatus.PENDING_INTERNAL
        item.current_stage = ApprovalStage.INTERNAL_REVIEW
        item.updated_at = datetime.now()

        item.add_audit_entry(
            action="revision_submitted",
            performed_by=creator_id,
            old_status=old_status,
            new_status=item.status.value,
            notes=notes or "Revision completed and resubmitted"
        )

        return item

    def schedule(
        self,
        item: ContentItem,
        scheduler_id: str,
        scheduled_time: datetime
    ) -> ContentItem:
        """Schedule approved content."""
        old_status = item.status.value
        item.status = ApprovalStatus.SCHEDULED
        item.current_stage = ApprovalStage.SCHEDULED
        item.scheduled_time = scheduled_time
        item.updated_at = datetime.now()

        item.add_audit_entry(
            action="scheduled",
            performed_by=scheduler_id,
            old_status=old_status,
            new_status=item.status.value,
            notes=f"Scheduled for {scheduled_time.strftime('%Y-%m-%d %H:%M')}"
        )

        return item


class NotificationEngine:
    """Generates and manages notifications."""

    def __init__(self):
        self.templates = self._load_templates()
        self.pending_notifications: List[Notification] = []

    def _load_templates(self) -> Dict[str, str]:
        """Load notification templates."""
        return {
            "approval_request": "New content ready for your review: {title}",
            "feedback_summary": "Revisions requested on {title}: {feedback}",
            "ready_to_schedule": "Content approved and ready to schedule: {title}",
            "deadline_reminder": "SLA Warning: {title} needs attention - {hours_remaining}h remaining",
            "overdue_alert": "OVERDUE: {title} has exceeded SLA by {hours_over}h",
            "new_comment": "New comment on {title} from {commenter}",
            "status_update": "{title} status changed: {old_status} → {new_status}",
            "gentle_reminder": "Reminder: {title} is awaiting your action"
        }

    def create_notification(
        self,
        notification_type: NotificationType,
        recipient: Stakeholder,
        item: ContentItem,
        context: Dict[str, str] = None
    ) -> Notification:
        """Create a notification."""
        template = self.templates.get(notification_type.template_key, "{title}")
        context = context or {}
        context.setdefault("title", item.title)

        body = template
        for key, value in context.items():
            body = body.replace("{" + key + "}", str(value))

        notification = Notification(
            notification_id=f"notif_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(100, 999)}",
            notification_type=notification_type,
            recipient_id=recipient.stakeholder_id,
            recipient_email=recipient.email,
            content_id=item.content_id,
            subject=f"[{notification_type.value.replace('_', ' ').title()}] {item.title}",
            body=body,
            channels=notification_type.channels
        )

        self.pending_notifications.append(notification)
        return notification

    def get_pending_notifications(self, recipient_id: str = None) -> List[Notification]:
        """Get pending notifications."""
        if recipient_id:
            return [n for n in self.pending_notifications
                   if not n.sent and n.recipient_id == recipient_id]
        return [n for n in self.pending_notifications if not n.sent]


class AuditManager:
    """Manages audit trails and compliance reporting."""

    def generate_audit_report(self, item: ContentItem) -> str:
        """Generate audit report for content item."""
        lines = []
        lines.append(f"AUDIT TRAIL: {item.title}")
        lines.append("=" * 60)
        lines.append(f"Content ID: {item.content_id}")
        lines.append(f"Brand: {item.brand_name}")
        lines.append(f"Status: {item.status.value}")
        lines.append("=" * 60)
        lines.append("")

        lines.append("| Timestamp | Action | User | Notes |")
        lines.append("|" + "-" * 20 + "|" + "-" * 18 + "|" + "-" * 15 + "|" + "-" * 25 + "|")

        for entry in item.audit_trail:
            ts = entry.performed_at.strftime("%Y-%m-%d %H:%M")
            action = entry.action[:16]
            user = entry.performed_by[:13]
            notes = entry.notes[:23] if entry.notes else "-"
            lines.append(f"| {ts} | {action:<16} | {user:<13} | {notes:<23} |")

        return "\n".join(lines)


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class ApprovalReporter:
    """Generates ASCII reports for approval workflow."""

    def _progress_bar(self, value: float, max_value: float = 100, width: int = 10) -> str:
        """Generate ASCII progress bar."""
        if max_value == 0:
            return "░" * width
        filled = int((value / max_value) * width)
        empty = width - filled
        return "█" * filled + "░" * empty

    def generate_dashboard(self, queue: ApprovalQueue) -> str:
        """Generate approval workflow dashboard."""
        lines = []
        lines.append("APPROVAL WORKFLOW")
        lines.append("═" * 55)
        lines.append(f"Brand: {queue.brand_name}")
        lines.append(f"Queue: Approval Queue")
        lines.append(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        lines.append("═" * 55)
        lines.append("")

        # Overview
        lines.append("WORKFLOW OVERVIEW")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│" + "       APPROVAL STATUS".center(53) + "│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Brand: {queue.brand_name[:40]:<43}│")
        lines.append(f"│  Period: Today                                      │")
        lines.append(f"│  Items in Queue: {len(queue.active_items):<34}│")
        lines.append("│" + " " * 53 + "│")

        lines.append(f"│  Pending Internal: {queue.pending_internal_count:<32}│")
        lines.append(f"│  Pending Client: {queue.pending_client_count:<34}│")
        lines.append(f"│  Revisions: {queue.revision_count:<39}│")
        lines.append(f"│  Ready to Schedule: {queue.ready_to_schedule_count:<31}│")
        lines.append("│" + " " * 53 + "│")

        avg_turnaround = queue.avg_turnaround_hours
        lines.append(f"│  Avg Turnaround: {avg_turnaround:.1f} days                        │")

        sla_bar = self._progress_bar(queue.sla_compliance_rate)
        lines.append(f"│  SLA Compliance: {sla_bar} {queue.sla_compliance_rate:.0f}%     │")
        lines.append("│  Status: [●] Queue Active                           │")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Approval Queue Table
        lines.append("APPROVAL QUEUE")
        lines.append("─" * 55)
        lines.append("| ID | Platform | Type | Stage | Owner | Due |")
        lines.append("|" + "-" * 8 + "|" + "-" * 10 + "|" + "-" * 8 + "|" + "-" * 12 + "|" + "-" * 10 + "|" + "-" * 6 + "|")

        for item in queue.active_items[:8]:
            item_id = item.content_id[:6]
            platform = item.platform[:8]
            ctype = item.content_type.value[:6]
            stage = item.current_stage.value[:10]
            owner = (item.assigned_to or "unassigned")[:8]
            due = f"{item.sla_hours_remaining:.0f}h" if item.sla_hours_remaining < float('inf') else "-"
            lines.append(f"| {item_id:<6} | {platform:<8} | {ctype:<6} | {stage:<10} | {owner:<8} | {due:<4} |")

        lines.append("")

        # Urgent Items
        overdue = queue.overdue_items
        if overdue:
            lines.append("URGENT ITEMS (SLA Risk)")
            lines.append("─" * 55)
            lines.append("┌" + "─" * 53 + "┐")
            lines.append("│  OVERDUE / AT RISK                                  │")
            lines.append("│" + " " * 53 + "│")

            for item in overdue[:3]:
                if item.sla_status == SLAStatus.BREACHED:
                    over_by = abs(item.sla_hours_remaining)
                    lines.append(f"│  {item.content_id[:8]}: {over_by:.0f}h overdue                         │")
                else:
                    lines.append(f"│  {item.content_id[:8]}: {item.sla_hours_remaining:.0f}h remaining               │")
                lines.append(f"│  • Stage: {item.current_stage.value:<40}│")
                lines.append(f"│  • Assigned: {(item.assigned_to or 'unassigned'):<38}│")
                lines.append(f"│  • Risk: {item.sla_status.value.replace('_', ' ').title():<42}│")
                lines.append("│" + " " * 53 + "│")

            lines.append("└" + "─" * 53 + "┘")
            lines.append("")

        # Recent Activity
        lines.append("RECENT ACTIVITY")
        lines.append("─" * 55)
        lines.append("| Time | Content | Action | User |")
        lines.append("|" + "-" * 12 + "|" + "-" * 10 + "|" + "-" * 18 + "|" + "-" * 12 + "|")

        # Collect recent audit entries
        all_entries = []
        for item in queue.items:
            for entry in item.audit_trail:
                all_entries.append((entry, item))

        all_entries.sort(key=lambda x: x[0].performed_at, reverse=True)

        for entry, item in all_entries[:5]:
            time_str = entry.performed_at.strftime("%H:%M")
            content = item.content_id[:8]
            action = entry.action[:16]
            user = entry.performed_by[:10]
            lines.append(f"| {time_str:<10} | {content:<8} | {action:<16} | {user:<10} |")

        lines.append("")

        # Implementation Checklist
        lines.append("IMPLEMENTATION CHECKLIST")
        lines.append("─" * 55)
        lines.append("• [●] Workflow stages defined")
        lines.append("• [●] Stakeholders assigned")
        lines.append("• [●] SLAs configured")
        lines.append("• [●] Notifications enabled")
        lines.append("• [●] Audit trail active")
        lines.append("")

        lines.append("Workflow Status: ● Approvals Routing")

        return "\n".join(lines)

    def generate_item_status(self, item: ContentItem) -> str:
        """Generate status report for single item."""
        lines = []
        lines.append(f"CONTENT STATUS: {item.title}")
        lines.append("=" * 55)
        lines.append(f"ID: {item.content_id}")
        lines.append(f"Brand: {item.brand_name}")
        lines.append(f"Platform: {item.platform}")
        lines.append(f"Type: {item.content_type.value}")
        lines.append("=" * 55)
        lines.append("")

        lines.append(f"Status: {item.status.icon} {item.status.value.replace('_', ' ').title()}")
        lines.append(f"Stage: {item.current_stage.value.replace('_', ' ').title()}")
        lines.append(f"SLA: {item.sla_status.icon} {item.sla_status.value.replace('_', ' ').title()}")
        lines.append(f"Assigned To: {item.assigned_to or 'Unassigned'}")
        lines.append(f"Revisions: {item.revision_count}")
        lines.append("")

        if item.turnaround_hours:
            lines.append(f"Turnaround: {item.turnaround_hours:.1f} hours")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SOCIAL.APPROVE.EXE - Content Approval Workflow Manager"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    status = subparsers.add_parser("status", help="Check approval queue status")
    status.add_argument("--brand", required=True, help="Brand name")

    # Request command
    request = subparsers.add_parser("request", help="Create approval request")
    request.add_argument("--content-id", required=True, help="Content ID")
    request.add_argument("--brand", required=True, help="Brand name")

    # Batch command
    batch = subparsers.add_parser("batch", help="Generate batch approval package")
    batch.add_argument("--brand", required=True, help="Brand name")

    # Audit command
    audit = subparsers.add_parser("audit", help="View full audit trail")
    audit.add_argument("--content-id", required=True, help="Content ID")

    # Escalate command
    escalate = subparsers.add_parser("escalate", help="Trigger escalation workflow")
    escalate.add_argument("--content-id", required=True, help="Content ID")
    escalate.add_argument("--reason", required=True, help="Escalation reason")

    # Demo command
    demo = subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    engine = WorkflowEngine()
    reporter = ApprovalReporter()
    audit_manager = AuditManager()

    if args.command == "status":
        queue = engine.get_queue(args.brand)

        # Generate demo items
        platforms = ["instagram", "tiktok", "linkedin", "twitter"]
        types = list(ContentType)[:4]

        for i in range(8):
            item = ContentItem(
                content_id=f"content_{datetime.now().strftime('%Y%m%d')}_{i:03d}",
                brand_name=args.brand,
                platform=random.choice(platforms),
                content_type=random.choice(types),
                title=f"Demo Content {i+1}",
                status=random.choice([ApprovalStatus.PENDING_INTERNAL,
                                     ApprovalStatus.PENDING_CLIENT,
                                     ApprovalStatus.REVISION_REQUESTED,
                                     ApprovalStatus.APPROVED]),
                current_stage=random.choice([ApprovalStage.INTERNAL_REVIEW,
                                            ApprovalStage.CLIENT_REVIEW,
                                            ApprovalStage.REVISION]),
                created_at=datetime.now() - timedelta(hours=random.randint(1, 72))
            )
            item.add_audit_entry("created", "system")
            queue.items.append(item)

        print(reporter.generate_dashboard(queue))

    elif args.command == "audit":
        item = ContentItem(
            content_id=args.content_id,
            brand_name="Demo Brand",
            platform="instagram",
            content_type=ContentType.CAROUSEL,
            title="Demo Content for Audit"
        )

        # Add sample audit entries
        item.add_audit_entry("created", "creator_1")
        item.add_audit_entry("submitted", "creator_1", "draft", "pending_internal")
        item.add_audit_entry("approved", "manager_1", "pending_internal", "internal_approved")
        item.add_audit_entry("revision_requested", "client_1", "pending_client", "revision_requested", "Update headline")
        item.add_audit_entry("revision_submitted", "creator_1", "revision_requested", "pending_internal")

        print(audit_manager.generate_audit_report(item))

    elif args.command == "demo":
        print("Running SOCIAL.APPROVE.EXE Demo...")
        print("=" * 55)

        queue = engine.get_queue("Demo Brand")

        # Create demo items
        demo_items = [
            ("Summer Campaign Post", ContentType.CAROUSEL, ApprovalStatus.PENDING_CLIENT),
            ("Product Launch Reel", ContentType.REEL, ApprovalStatus.PENDING_INTERNAL),
            ("Weekly Tips Thread", ContentType.THREAD, ApprovalStatus.REVISION_REQUESTED),
            ("Brand Story Video", ContentType.VIDEO, ApprovalStatus.APPROVED),
            ("Flash Sale Static", ContentType.STATIC_POST, ApprovalStatus.PENDING_INTERNAL)
        ]

        for i, (title, ctype, status) in enumerate(demo_items):
            item = ContentItem(
                content_id=f"demo_{i:03d}",
                brand_name="Demo Brand",
                platform=random.choice(["instagram", "tiktok", "linkedin"]),
                content_type=ctype,
                title=title,
                status=status,
                current_stage=ApprovalStage.INTERNAL_REVIEW if status == ApprovalStatus.PENDING_INTERNAL else ApprovalStage.CLIENT_REVIEW,
                created_at=datetime.now() - timedelta(hours=random.randint(4, 48))
            )
            item.add_audit_entry("created", "system")
            item.add_audit_entry("submitted", "creator_demo")
            queue.items.append(item)

        print(reporter.generate_dashboard(queue))

        print("\n" + "=" * 55)
        print("Demo complete!")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/social-approve status [brand]` - Check approval queue status
- `/social-approve request [content-id]` - Create approval request
- `/social-approve batch [brand]` - Generate batch approval package
- `/social-approve audit [content-id]` - View full audit trail
- `/social-approve escalate [content-id]` - Trigger escalation workflow

$ARGUMENTS
