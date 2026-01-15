# PROJECT.SHOPIFYAPPBUILDER.EXE - Shopify App Builder Development Environment

You are PROJECT.SHOPIFYAPPBUILDER.EXE — the dedicated development environment for Shopify application development, providing full context awareness and specialized assistance for building, testing, and deploying Shopify apps.

MISSION
Provide comprehensive project context, Shopify API guidance, and development assistance for building successful Shopify applications. Apps that merchants love, built with expertise.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SHOPIFY APP BUILDER ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          SHOPIFY API LAYER                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │   GraphQL    │  │     REST     │  │   Webhook    │  │    OAuth    │  │   │
│  │  │    Client    │  │    Client    │  │   Manager    │  │   Handler   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          MERCHANT MANAGEMENT LAYER                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │    Shop      │  │   Session    │  │   Billing    │  │   Usage     │  │   │
│  │  │   Manager    │  │   Manager    │  │   Manager    │  │   Tracker   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          APP FEATURES LAYER                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │   Products   │  │    Orders    │  │  Customers   │  │  Metafields │  │   │
│  │  │   Service    │  │   Service    │  │   Service    │  │   Service   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          BUILD & DEPLOY LAYER                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │    Build     │  │     Git      │  │   Deploy     │  │    App      │  │   │
│  │  │   Pipeline   │  │   Manager    │  │   Manager    │  │   Review    │  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROJECT.SHOPIFYAPPBUILDER.EXE - Shopify App Builder Development Environment
Production-ready Shopify app development platform with OAuth, webhooks, and billing
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import subprocess
import hashlib
import json
import hmac
import re
import os

# ============================================================
# ENUMS - Type-safe classifications
# ============================================================

class AppStatus(Enum):
    """App lifecycle status"""
    DRAFT = "draft"
    DEVELOPMENT = "development"
    REVIEW = "review"
    LISTED = "listed"
    UNLISTED = "unlisted"
    REJECTED = "rejected"
    SUSPENDED = "suspended"

class ShopStatus(Enum):
    """Shop/merchant status"""
    ACTIVE = "active"
    INSTALLED = "installed"
    UNINSTALLED = "uninstalled"
    FROZEN = "frozen"
    CANCELLED = "cancelled"
    PAUSED = "paused"
    TRIAL = "trial"

class SubscriptionStatus(Enum):
    """App subscription status"""
    PENDING = "pending"
    ACTIVE = "active"
    FROZEN = "frozen"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    DECLINED = "declined"

class PricingPlan(Enum):
    """App pricing plans"""
    FREE = "free"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ADVANCED = "advanced"
    ENTERPRISE = "enterprise"
    USAGE_BASED = "usage_based"

class WebhookTopic(Enum):
    """Shopify webhook topics"""
    APP_UNINSTALLED = "app/uninstalled"
    APP_SUBSCRIPTIONS_UPDATE = "app_subscriptions/update"
    ORDERS_CREATE = "orders/create"
    ORDERS_UPDATED = "orders/updated"
    ORDERS_PAID = "orders/paid"
    ORDERS_FULFILLED = "orders/fulfilled"
    ORDERS_CANCELLED = "orders/cancelled"
    PRODUCTS_CREATE = "products/create"
    PRODUCTS_UPDATE = "products/update"
    PRODUCTS_DELETE = "products/delete"
    CUSTOMERS_CREATE = "customers/create"
    CUSTOMERS_UPDATE = "customers/update"
    CUSTOMERS_DELETE = "customers/delete"
    INVENTORY_LEVELS_UPDATE = "inventory_levels/update"
    SHOP_UPDATE = "shop/update"
    CHECKOUTS_CREATE = "checkouts/create"
    CARTS_CREATE = "carts/create"
    CARTS_UPDATE = "carts/update"

class ApiVersion(Enum):
    """Shopify API versions"""
    V2024_01 = "2024-01"
    V2024_04 = "2024-04"
    V2024_07 = "2024-07"
    V2024_10 = "2024-10"
    V2025_01 = "2025-01"
    UNSTABLE = "unstable"

class Scope(Enum):
    """OAuth access scopes"""
    READ_PRODUCTS = "read_products"
    WRITE_PRODUCTS = "write_products"
    READ_ORDERS = "read_orders"
    WRITE_ORDERS = "write_orders"
    READ_CUSTOMERS = "read_customers"
    WRITE_CUSTOMERS = "write_customers"
    READ_INVENTORY = "read_inventory"
    WRITE_INVENTORY = "write_inventory"
    READ_SHIPPING = "read_shipping"
    WRITE_SHIPPING = "write_shipping"
    READ_FULFILLMENTS = "read_fulfillments"
    WRITE_FULFILLMENTS = "write_fulfillments"
    READ_CONTENT = "read_content"
    WRITE_CONTENT = "write_content"
    READ_THEMES = "read_themes"
    WRITE_THEMES = "write_themes"
    READ_SCRIPT_TAGS = "read_script_tags"
    WRITE_SCRIPT_TAGS = "write_script_tags"

class ResourceType(Enum):
    """Shopify resource types"""
    PRODUCT = "product"
    VARIANT = "variant"
    ORDER = "order"
    CUSTOMER = "customer"
    COLLECTION = "collection"
    INVENTORY_ITEM = "inventory_item"
    FULFILLMENT = "fulfillment"
    DRAFT_ORDER = "draft_order"
    METAFIELD = "metafield"

class RateLimitBucket(Enum):
    """Rate limit bucket types"""
    GRAPHQL = "graphql"
    REST = "rest"
    BULK = "bulk"

class BuildStage(Enum):
    """Build pipeline stages"""
    LINT = "lint"
    TYPECHECK = "typecheck"
    TEST = "test"
    BUILD = "build"
    DEPLOY = "deploy"
    VERIFY = "verify"

class TestStatus(Enum):
    """Test execution status"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"

# ============================================================
# DATA CLASSES - Structured data models
# ============================================================

@dataclass
class ShopifyCredentials:
    """Shopify app credentials"""
    api_key: str
    api_secret: str
    scopes: List[Scope]
    host: str = ""
    api_version: ApiVersion = ApiVersion.V2024_10

    @property
    def scope_string(self) -> str:
        """Get scopes as comma-separated string"""
        return ",".join(s.value for s in self.scopes)

    def verify_hmac(self, query_params: Dict[str, str], hmac_value: str) -> bool:
        """Verify HMAC signature from Shopify"""
        # Remove hmac from params for verification
        params = {k: v for k, v in query_params.items() if k != "hmac"}
        sorted_params = "&".join(f"{k}={v}" for k, v in sorted(params.items()))

        digest = hmac.new(
            self.api_secret.encode('utf-8'),
            sorted_params.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(digest, hmac_value)

@dataclass
class Shop:
    """Shopify shop/merchant"""
    shop_id: str
    domain: str  # mystore.myshopify.com
    name: str
    email: str
    status: ShopStatus = ShopStatus.ACTIVE
    access_token: str = ""
    scopes: List[str] = field(default_factory=list)
    installed_at: datetime = field(default_factory=datetime.now)
    uninstalled_at: Optional[datetime] = None
    plan_name: str = ""
    country_code: str = ""
    currency: str = "USD"
    timezone: str = "UTC"
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def is_active(self) -> bool:
        """Check if shop is active"""
        return self.status in [ShopStatus.ACTIVE, ShopStatus.INSTALLED, ShopStatus.TRIAL]

    @property
    def admin_url(self) -> str:
        """Get admin URL"""
        return f"https://{self.domain}/admin"

    @property
    def api_url(self) -> str:
        """Get API URL"""
        return f"https://{self.domain}/admin/api"

@dataclass
class Session:
    """Shopify session"""
    session_id: str
    shop_domain: str
    access_token: str
    state: str = ""
    is_online: bool = False
    expires_at: Optional[datetime] = None
    associated_user: Optional[Dict[str, Any]] = None
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def is_valid(self) -> bool:
        """Check if session is valid"""
        if not self.access_token:
            return False
        if self.expires_at and datetime.now() > self.expires_at:
            return False
        return True

@dataclass
class Webhook:
    """Webhook registration"""
    webhook_id: str
    topic: WebhookTopic
    address: str  # Callback URL
    format: str = "json"
    api_version: str = "2024-10"
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    fields: List[str] = field(default_factory=list)
    metafield_namespaces: List[str] = field(default_factory=list)

    def to_graphql_input(self) -> Dict[str, Any]:
        """Convert to GraphQL input format"""
        return {
            "topic": self.topic.value.upper().replace("/", "_"),
            "webhookSubscription": {
                "callbackUrl": self.address,
                "format": self.format.upper()
            }
        }

@dataclass
class WebhookDelivery:
    """Webhook delivery record"""
    delivery_id: str
    webhook_id: str
    topic: WebhookTopic
    shop_domain: str
    payload: Dict[str, Any]
    received_at: datetime = field(default_factory=datetime.now)
    processed: bool = False
    processing_error: Optional[str] = None
    hmac_valid: bool = True

@dataclass
class AppSubscription:
    """App subscription/billing"""
    subscription_id: str
    shop_id: str
    plan: PricingPlan
    status: SubscriptionStatus = SubscriptionStatus.PENDING
    price: Decimal = Decimal("0")
    currency: str = "USD"
    billing_interval: str = "EVERY_30_DAYS"  # EVERY_30_DAYS, ANNUAL
    trial_days: int = 0
    trial_ends_at: Optional[datetime] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    cancelled_at: Optional[datetime] = None
    confirmation_url: str = ""

    @property
    def is_trial(self) -> bool:
        """Check if in trial period"""
        if self.trial_ends_at:
            return datetime.now() < self.trial_ends_at
        return False

    @property
    def is_active(self) -> bool:
        """Check if subscription is active"""
        return self.status == SubscriptionStatus.ACTIVE or self.is_trial

@dataclass
class UsageRecord:
    """Usage-based billing record"""
    record_id: str
    subscription_id: str
    description: str
    price: Decimal
    quantity: int = 1
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class RateLimitState:
    """Rate limit tracking"""
    bucket: RateLimitBucket
    available: int
    maximum: int
    restore_rate: float  # Points per second
    last_updated: datetime = field(default_factory=datetime.now)

    @property
    def usage_percent(self) -> float:
        """Calculate usage percentage"""
        if self.maximum == 0:
            return 0.0
        return ((self.maximum - self.available) / self.maximum) * 100

    def can_make_request(self, cost: int = 1) -> bool:
        """Check if request can be made"""
        return self.available >= cost

@dataclass
class GraphQLResponse:
    """GraphQL API response"""
    data: Optional[Dict[str, Any]] = None
    errors: List[Dict[str, Any]] = field(default_factory=list)
    extensions: Dict[str, Any] = field(default_factory=dict)

    @property
    def has_errors(self) -> bool:
        """Check if response has errors"""
        return len(self.errors) > 0

    @property
    def cost(self) -> Dict[str, Any]:
        """Get query cost info"""
        return self.extensions.get("cost", {})

@dataclass
class Product:
    """Shopify product"""
    product_id: str
    title: str
    handle: str
    status: str = "active"
    vendor: str = ""
    product_type: str = ""
    tags: List[str] = field(default_factory=list)
    variants_count: int = 0
    images_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

@dataclass
class Order:
    """Shopify order"""
    order_id: str
    order_number: int
    shop_domain: str
    email: str
    financial_status: str = "pending"
    fulfillment_status: Optional[str] = None
    total_price: Decimal = Decimal("0")
    subtotal_price: Decimal = Decimal("0")
    total_tax: Decimal = Decimal("0")
    currency: str = "USD"
    line_items_count: int = 0
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

@dataclass
class Metafield:
    """Shopify metafield"""
    metafield_id: str
    namespace: str
    key: str
    value: str
    type: str  # single_line_text_field, number_integer, json, etc.
    owner_type: ResourceType
    owner_id: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

@dataclass
class GitStatus:
    """Git repository status"""
    branch: str
    is_clean: bool
    modified_files: List[str] = field(default_factory=list)
    untracked_files: List[str] = field(default_factory=list)
    commits_ahead: int = 0
    commits_behind: int = 0
    last_commit_hash: str = ""
    last_commit_message: str = ""

@dataclass
class BuildResult:
    """Build stage result"""
    stage: BuildStage
    status: TestStatus
    duration_ms: int = 0
    output: str = ""
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

# ============================================================
# ENGINE CLASSES - Core business logic
# ============================================================

class GitManager:
    """Git operations manager"""

    def __init__(self, repo_path: str):
        self.repo_path = repo_path

    def _run_git(self, *args) -> tuple[int, str, str]:
        """Run a git command"""
        try:
            result = subprocess.run(
                ["git"] + list(args),
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode, result.stdout.strip(), result.stderr.strip()
        except subprocess.TimeoutExpired:
            return -1, "", "Command timed out"
        except FileNotFoundError:
            return -1, "", "Git not found"

    def get_status(self) -> GitStatus:
        """Get current git status"""
        code, branch, _ = self._run_git("branch", "--show-current")
        if code != 0:
            branch = "unknown"

        code, status_output, _ = self._run_git("status", "--porcelain")
        modified = []
        untracked = []
        for line in status_output.split("\n"):
            if line:
                if line.startswith("??"):
                    untracked.append(line[3:])
                else:
                    modified.append(line[3:])

        code, ahead_behind, _ = self._run_git(
            "rev-list", "--left-right", "--count", f"origin/{branch}...HEAD"
        )
        commits_behind, commits_ahead = 0, 0
        if code == 0 and ahead_behind:
            parts = ahead_behind.split()
            if len(parts) == 2:
                commits_behind, commits_ahead = int(parts[0]), int(parts[1])

        code, log_output, _ = self._run_git("log", "-1", "--format=%H|%s")
        last_hash, last_msg = "", ""
        if code == 0 and log_output:
            parts = log_output.split("|", 1)
            if len(parts) == 2:
                last_hash = parts[0][:8]
                last_msg = parts[1]

        return GitStatus(
            branch=branch,
            is_clean=len(modified) == 0 and len(untracked) == 0,
            modified_files=modified,
            untracked_files=untracked,
            commits_ahead=commits_ahead,
            commits_behind=commits_behind,
            last_commit_hash=last_hash,
            last_commit_message=last_msg
        )


class OAuthManager:
    """Shopify OAuth authentication manager"""

    def __init__(self, credentials: ShopifyCredentials):
        self.credentials = credentials
        self.sessions: Dict[str, Session] = {}

    def generate_auth_url(self, shop_domain: str, redirect_uri: str, state: str) -> str:
        """Generate OAuth authorization URL"""
        params = {
            "client_id": self.credentials.api_key,
            "scope": self.credentials.scope_string,
            "redirect_uri": redirect_uri,
            "state": state
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"https://{shop_domain}/admin/oauth/authorize?{query}"

    def validate_callback(self, query_params: Dict[str, str]) -> bool:
        """Validate OAuth callback"""
        required = ["shop", "code", "state", "hmac"]
        if not all(k in query_params for k in required):
            return False

        return self.credentials.verify_hmac(query_params, query_params["hmac"])

    def exchange_token(self, shop_domain: str, code: str) -> Optional[str]:
        """Exchange authorization code for access token (mock implementation)"""
        # In production, this would make HTTP request to Shopify
        # POST https://{shop_domain}/admin/oauth/access_token
        # Returns access_token

        # Mock token generation for development
        token = hashlib.sha256(f"{shop_domain}:{code}".encode()).hexdigest()[:32]
        return token

    def create_session(
        self,
        shop_domain: str,
        access_token: str,
        is_online: bool = False,
        expires_in: Optional[int] = None
    ) -> Session:
        """Create a new session"""
        session_id = hashlib.sha256(
            f"{shop_domain}:{access_token}:{datetime.now()}".encode()
        ).hexdigest()[:24]

        expires_at = None
        if expires_in:
            expires_at = datetime.now() + timedelta(seconds=expires_in)

        session = Session(
            session_id=session_id,
            shop_domain=shop_domain,
            access_token=access_token,
            is_online=is_online,
            expires_at=expires_at
        )

        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Get session by ID"""
        session = self.sessions.get(session_id)
        if session and session.is_valid:
            return session
        return None

    def revoke_session(self, session_id: str) -> bool:
        """Revoke a session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False


class ShopManager:
    """Shop/merchant management"""

    def __init__(self):
        self.shops: Dict[str, Shop] = {}

    def register_shop(
        self,
        domain: str,
        access_token: str,
        scopes: List[str],
        shop_data: Optional[Dict[str, Any]] = None
    ) -> Shop:
        """Register a new shop installation"""
        shop_id = hashlib.sha256(domain.encode()).hexdigest()[:12]

        shop = Shop(
            shop_id=shop_id,
            domain=domain,
            name=shop_data.get("name", domain.split(".")[0]) if shop_data else domain.split(".")[0],
            email=shop_data.get("email", "") if shop_data else "",
            status=ShopStatus.INSTALLED,
            access_token=access_token,
            scopes=scopes,
            plan_name=shop_data.get("plan_name", "") if shop_data else "",
            country_code=shop_data.get("country_code", "") if shop_data else "",
            currency=shop_data.get("currency", "USD") if shop_data else "USD",
            timezone=shop_data.get("timezone", "UTC") if shop_data else "UTC"
        )

        self.shops[shop_id] = shop
        return shop

    def get_shop(self, shop_id: str) -> Optional[Shop]:
        """Get shop by ID"""
        return self.shops.get(shop_id)

    def get_shop_by_domain(self, domain: str) -> Optional[Shop]:
        """Get shop by domain"""
        for shop in self.shops.values():
            if shop.domain == domain:
                return shop
        return None

    def uninstall_shop(self, shop_id: str) -> bool:
        """Handle shop uninstallation"""
        shop = self.shops.get(shop_id)
        if shop:
            shop.status = ShopStatus.UNINSTALLED
            shop.uninstalled_at = datetime.now()
            shop.access_token = ""  # Clear token
            return True
        return False

    def get_active_shops(self) -> List[Shop]:
        """Get all active shops"""
        return [s for s in self.shops.values() if s.is_active]

    def get_stats(self) -> Dict[str, int]:
        """Get shop statistics"""
        stats = {status.value: 0 for status in ShopStatus}
        for shop in self.shops.values():
            stats[shop.status.value] += 1
        return stats


class WebhookManager:
    """Webhook management"""

    # Webhook topic configurations
    TOPIC_CONFIGS = {
        WebhookTopic.APP_UNINSTALLED: {
            "critical": True,
            "description": "App uninstalled from shop",
            "handler": "handle_app_uninstalled"
        },
        WebhookTopic.ORDERS_CREATE: {
            "critical": False,
            "description": "New order created",
            "handler": "handle_order_created"
        },
        WebhookTopic.ORDERS_PAID: {
            "critical": False,
            "description": "Order payment completed",
            "handler": "handle_order_paid"
        },
        WebhookTopic.PRODUCTS_UPDATE: {
            "critical": False,
            "description": "Product updated",
            "handler": "handle_product_updated"
        },
        WebhookTopic.CUSTOMERS_CREATE: {
            "critical": False,
            "description": "New customer created",
            "handler": "handle_customer_created"
        },
        WebhookTopic.INVENTORY_LEVELS_UPDATE: {
            "critical": False,
            "description": "Inventory level changed",
            "handler": "handle_inventory_updated"
        }
    }

    def __init__(self, credentials: ShopifyCredentials, base_url: str):
        self.credentials = credentials
        self.base_url = base_url
        self.webhooks: Dict[str, Webhook] = {}
        self.deliveries: List[WebhookDelivery] = []

    def register_webhook(
        self,
        topic: WebhookTopic,
        path: str = "/webhooks"
    ) -> Webhook:
        """Register a webhook"""
        webhook_id = hashlib.sha256(
            f"{topic.value}:{datetime.now()}".encode()
        ).hexdigest()[:12]

        webhook = Webhook(
            webhook_id=webhook_id,
            topic=topic,
            address=f"{self.base_url}{path}/{topic.value.replace('/', '-')}",
            api_version=self.credentials.api_version.value
        )

        self.webhooks[webhook_id] = webhook
        return webhook

    def verify_webhook(self, body: bytes, hmac_header: str) -> bool:
        """Verify webhook HMAC signature"""
        computed = hmac.new(
            self.credentials.api_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).digest()

        import base64
        expected = base64.b64encode(computed).decode()

        return hmac.compare_digest(expected, hmac_header)

    def process_webhook(
        self,
        topic: str,
        shop_domain: str,
        payload: Dict[str, Any],
        hmac_valid: bool = True
    ) -> WebhookDelivery:
        """Process incoming webhook"""
        try:
            webhook_topic = WebhookTopic(topic)
        except ValueError:
            webhook_topic = WebhookTopic.SHOP_UPDATE  # Fallback

        delivery = WebhookDelivery(
            delivery_id=hashlib.sha256(
                f"{topic}:{shop_domain}:{datetime.now()}".encode()
            ).hexdigest()[:16],
            webhook_id="",  # Would be looked up
            topic=webhook_topic,
            shop_domain=shop_domain,
            payload=payload,
            hmac_valid=hmac_valid
        )

        self.deliveries.append(delivery)
        return delivery

    def get_required_topics(self) -> List[WebhookTopic]:
        """Get required webhook topics for app functionality"""
        return [
            WebhookTopic.APP_UNINSTALLED,
            WebhookTopic.APP_SUBSCRIPTIONS_UPDATE,
            WebhookTopic.SHOP_UPDATE
        ]

    def get_registered_topics(self) -> List[WebhookTopic]:
        """Get registered webhook topics"""
        return [w.topic for w in self.webhooks.values()]


class BillingManager:
    """App subscription and billing management"""

    # Pricing plan configurations
    PLAN_CONFIGS = {
        PricingPlan.FREE: {
            "name": "Free",
            "price": Decimal("0"),
            "trial_days": 0,
            "features": ["basic_features"],
            "limits": {"orders_per_month": 50}
        },
        PricingPlan.BASIC: {
            "name": "Basic",
            "price": Decimal("9.99"),
            "trial_days": 7,
            "features": ["basic_features", "email_support"],
            "limits": {"orders_per_month": 500}
        },
        PricingPlan.PROFESSIONAL: {
            "name": "Professional",
            "price": Decimal("29.99"),
            "trial_days": 14,
            "features": ["all_features", "priority_support"],
            "limits": {"orders_per_month": 5000}
        },
        PricingPlan.ADVANCED: {
            "name": "Advanced",
            "price": Decimal("99.99"),
            "trial_days": 14,
            "features": ["all_features", "priority_support", "api_access"],
            "limits": {"orders_per_month": -1}  # Unlimited
        }
    }

    def __init__(self):
        self.subscriptions: Dict[str, AppSubscription] = {}
        self.usage_records: List[UsageRecord] = []

    def create_subscription(
        self,
        shop_id: str,
        plan: PricingPlan,
        return_url: str
    ) -> AppSubscription:
        """Create a new subscription"""
        config = self.PLAN_CONFIGS.get(plan, self.PLAN_CONFIGS[PricingPlan.FREE])

        subscription_id = hashlib.sha256(
            f"{shop_id}:{plan.value}:{datetime.now()}".encode()
        ).hexdigest()[:12]

        trial_ends_at = None
        if config["trial_days"] > 0:
            trial_ends_at = datetime.now() + timedelta(days=config["trial_days"])

        subscription = AppSubscription(
            subscription_id=subscription_id,
            shop_id=shop_id,
            plan=plan,
            price=config["price"],
            trial_days=config["trial_days"],
            trial_ends_at=trial_ends_at,
            confirmation_url=f"https://admin.shopify.com/charges/{subscription_id}/confirm"
        )

        self.subscriptions[subscription_id] = subscription
        return subscription

    def activate_subscription(self, subscription_id: str) -> bool:
        """Activate a subscription after merchant approval"""
        subscription = self.subscriptions.get(subscription_id)
        if not subscription:
            return False

        subscription.status = SubscriptionStatus.ACTIVE
        subscription.current_period_start = datetime.now()
        subscription.current_period_end = datetime.now() + timedelta(days=30)

        return True

    def cancel_subscription(self, subscription_id: str) -> bool:
        """Cancel a subscription"""
        subscription = self.subscriptions.get(subscription_id)
        if not subscription:
            return False

        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancelled_at = datetime.now()

        return True

    def record_usage(
        self,
        subscription_id: str,
        description: str,
        price: Decimal,
        quantity: int = 1
    ) -> Optional[UsageRecord]:
        """Record usage for usage-based billing"""
        subscription = self.subscriptions.get(subscription_id)
        if not subscription or subscription.plan != PricingPlan.USAGE_BASED:
            return None

        record = UsageRecord(
            record_id=hashlib.sha256(
                f"{subscription_id}:{datetime.now()}".encode()
            ).hexdigest()[:12],
            subscription_id=subscription_id,
            description=description,
            price=price,
            quantity=quantity
        )

        self.usage_records.append(record)
        return record

    def get_subscription_by_shop(self, shop_id: str) -> Optional[AppSubscription]:
        """Get active subscription for a shop"""
        for sub in self.subscriptions.values():
            if sub.shop_id == shop_id and sub.is_active:
                return sub
        return None

    def get_revenue_stats(self) -> Dict[str, Any]:
        """Get revenue statistics"""
        active_subs = [s for s in self.subscriptions.values() if s.is_active]

        total_mrr = sum(s.price for s in active_subs if not s.is_trial)
        trial_count = sum(1 for s in active_subs if s.is_trial)

        by_plan = {}
        for sub in active_subs:
            plan_name = sub.plan.value
            if plan_name not in by_plan:
                by_plan[plan_name] = 0
            by_plan[plan_name] += 1

        return {
            "total_mrr": total_mrr,
            "active_subscriptions": len(active_subs),
            "trial_subscriptions": trial_count,
            "by_plan": by_plan
        }


class GraphQLClient:
    """Shopify GraphQL API client"""

    # Common GraphQL queries
    QUERIES = {
        "shop": """
            query {
                shop {
                    id
                    name
                    email
                    primaryDomain { host }
                    plan { displayName }
                    currencyCode
                    timezoneAbbreviation
                }
            }
        """,
        "products": """
            query($first: Int!, $after: String) {
                products(first: $first, after: $after) {
                    edges {
                        node {
                            id
                            title
                            handle
                            status
                            vendor
                            productType
                            totalInventory
                            createdAt
                        }
                        cursor
                    }
                    pageInfo { hasNextPage }
                }
            }
        """,
        "orders": """
            query($first: Int!, $after: String) {
                orders(first: $first, after: $after) {
                    edges {
                        node {
                            id
                            name
                            email
                            displayFinancialStatus
                            displayFulfillmentStatus
                            totalPriceSet { shopMoney { amount currencyCode } }
                            createdAt
                        }
                        cursor
                    }
                    pageInfo { hasNextPage }
                }
            }
        """
    }

    # Common GraphQL mutations
    MUTATIONS = {
        "create_webhook": """
            mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
                webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
                    webhookSubscription { id }
                    userErrors { field message }
                }
            }
        """,
        "create_product": """
            mutation productCreate($input: ProductInput!) {
                productCreate(input: $input) {
                    product { id title handle }
                    userErrors { field message }
                }
            }
        """,
        "update_metafield": """
            mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
                metafieldsSet(metafields: $metafields) {
                    metafields { id namespace key value }
                    userErrors { field message }
                }
            }
        """
    }

    def __init__(self, shop: Shop, api_version: ApiVersion):
        self.shop = shop
        self.api_version = api_version
        self.rate_limit = RateLimitState(
            bucket=RateLimitBucket.GRAPHQL,
            available=1000,
            maximum=1000,
            restore_rate=50.0
        )

    @property
    def endpoint(self) -> str:
        """Get GraphQL endpoint URL"""
        return f"https://{self.shop.domain}/admin/api/{self.api_version.value}/graphql.json"

    def execute(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None
    ) -> GraphQLResponse:
        """Execute a GraphQL query (mock implementation)"""
        # In production, this would make actual HTTP request

        # Mock response
        return GraphQLResponse(
            data={"mock": True},
            extensions={
                "cost": {
                    "requestedQueryCost": 10,
                    "actualQueryCost": 10,
                    "throttleStatus": {
                        "maximumAvailable": 1000,
                        "currentlyAvailable": self.rate_limit.available,
                        "restoreRate": self.rate_limit.restore_rate
                    }
                }
            }
        )

    def query_shop(self) -> GraphQLResponse:
        """Query shop information"""
        return self.execute(self.QUERIES["shop"])

    def query_products(self, first: int = 50, after: Optional[str] = None) -> GraphQLResponse:
        """Query products with pagination"""
        return self.execute(
            self.QUERIES["products"],
            {"first": first, "after": after}
        )

    def query_orders(self, first: int = 50, after: Optional[str] = None) -> GraphQLResponse:
        """Query orders with pagination"""
        return self.execute(
            self.QUERIES["orders"],
            {"first": first, "after": after}
        )


class BuildEngine:
    """Build and deployment pipeline"""

    def __init__(self, project_path: str):
        self.project_path = project_path
        self.results: List[BuildResult] = []

    def run_stage(self, stage: BuildStage) -> BuildResult:
        """Run a build stage"""
        start_time = datetime.now()

        if stage == BuildStage.LINT:
            return self._run_lint()
        elif stage == BuildStage.TYPECHECK:
            return self._run_typecheck()
        elif stage == BuildStage.TEST:
            return self._run_test()
        elif stage == BuildStage.BUILD:
            return self._run_build()

        return BuildResult(
            stage=stage,
            status=TestStatus.SKIPPED
        )

    def _run_lint(self) -> BuildResult:
        """Run ESLint"""
        try:
            result = subprocess.run(
                ["npm", "run", "lint"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=120
            )

            status = TestStatus.PASSED if result.returncode == 0 else TestStatus.FAILED

            return BuildResult(
                stage=BuildStage.LINT,
                status=status,
                output=result.stdout,
                errors=result.stderr.split("\n") if result.returncode != 0 else []
            )
        except Exception as e:
            return BuildResult(
                stage=BuildStage.LINT,
                status=TestStatus.ERROR,
                errors=[str(e)]
            )

    def _run_typecheck(self) -> BuildResult:
        """Run TypeScript type checking"""
        try:
            result = subprocess.run(
                ["npx", "tsc", "--noEmit"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=180
            )

            status = TestStatus.PASSED if result.returncode == 0 else TestStatus.FAILED

            return BuildResult(
                stage=BuildStage.TYPECHECK,
                status=status,
                output=result.stdout,
                errors=result.stderr.split("\n") if result.returncode != 0 else []
            )
        except Exception as e:
            return BuildResult(
                stage=BuildStage.TYPECHECK,
                status=TestStatus.ERROR,
                errors=[str(e)]
            )

    def _run_test(self) -> BuildResult:
        """Run tests"""
        try:
            result = subprocess.run(
                ["npm", "test"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            status = TestStatus.PASSED if result.returncode == 0 else TestStatus.FAILED

            return BuildResult(
                stage=BuildStage.TEST,
                status=status,
                output=result.stdout + result.stderr
            )
        except Exception as e:
            return BuildResult(
                stage=BuildStage.TEST,
                status=TestStatus.ERROR,
                errors=[str(e)]
            )

    def _run_build(self) -> BuildResult:
        """Run production build"""
        try:
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            status = TestStatus.PASSED if result.returncode == 0 else TestStatus.FAILED

            return BuildResult(
                stage=BuildStage.BUILD,
                status=status,
                output=result.stdout
            )
        except Exception as e:
            return BuildResult(
                stage=BuildStage.BUILD,
                status=TestStatus.ERROR,
                errors=[str(e)]
            )

    def run_pipeline(
        self,
        stages: Optional[List[BuildStage]] = None
    ) -> List[BuildResult]:
        """Run full build pipeline"""
        if stages is None:
            stages = [
                BuildStage.LINT,
                BuildStage.TYPECHECK,
                BuildStage.TEST,
                BuildStage.BUILD
            ]

        results = []
        for stage in stages:
            result = self.run_stage(stage)
            results.append(result)
            self.results.append(result)

            if result.status in [TestStatus.FAILED, TestStatus.ERROR]:
                break

        return results


# ============================================================
# MAIN ENGINE - Project orchestrator
# ============================================================

class ShopifyAppBuilderEngine:
    """Main Shopify App Builder project engine"""

    PROJECT_CONFIG = {
        "name": "ShopifyAppBuilder",
        "version": "1.0.0",
        "type": "Shopify App Platform",
        "stack": {
            "framework": ["Remix", "React"],
            "language": ["TypeScript"],
            "database": ["PostgreSQL", "Redis"],
            "api": ["Shopify GraphQL", "Shopify REST"],
            "infrastructure": ["Vercel", "Railway"]
        },
        "path": "~/Projects/shopify-app"
    }

    # Default OAuth scopes
    DEFAULT_SCOPES = [
        Scope.READ_PRODUCTS,
        Scope.WRITE_PRODUCTS,
        Scope.READ_ORDERS,
        Scope.READ_CUSTOMERS,
        Scope.READ_INVENTORY
    ]

    # Required webhooks
    REQUIRED_WEBHOOKS = [
        WebhookTopic.APP_UNINSTALLED,
        WebhookTopic.APP_SUBSCRIPTIONS_UPDATE,
        WebhookTopic.ORDERS_CREATE,
        WebhookTopic.PRODUCTS_UPDATE
    ]

    def __init__(
        self,
        project_path: Optional[str] = None,
        credentials: Optional[ShopifyCredentials] = None
    ):
        self.project_path = project_path or os.path.expanduser(self.PROJECT_CONFIG["path"])

        self.credentials = credentials or ShopifyCredentials(
            api_key=os.environ.get("SHOPIFY_API_KEY", ""),
            api_secret=os.environ.get("SHOPIFY_API_SECRET", ""),
            scopes=self.DEFAULT_SCOPES,
            api_version=ApiVersion.V2024_10
        )

        self.git_manager = GitManager(self.project_path)
        self.oauth_manager = OAuthManager(self.credentials)
        self.shop_manager = ShopManager()
        self.webhook_manager = WebhookManager(
            self.credentials,
            os.environ.get("APP_URL", "https://localhost:3000")
        )
        self.billing_manager = BillingManager()
        self.build_engine = BuildEngine(self.project_path)

    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive project status"""
        git_status = self.git_manager.get_status()
        shop_stats = self.shop_manager.get_stats()
        revenue_stats = self.billing_manager.get_revenue_stats()

        webhooks_registered = len(self.webhook_manager.webhooks)
        webhooks_required = len(self.REQUIRED_WEBHOOKS)

        return {
            "project": self.PROJECT_CONFIG,
            "git": {
                "branch": git_status.branch,
                "is_clean": git_status.is_clean,
                "modified_files": len(git_status.modified_files),
                "commits_ahead": git_status.commits_ahead,
                "commits_behind": git_status.commits_behind,
                "last_commit": git_status.last_commit_message
            },
            "shopify": {
                "api_version": self.credentials.api_version.value,
                "scopes_count": len(self.credentials.scopes),
                "credentials_configured": bool(self.credentials.api_key)
            },
            "shops": {
                "total": sum(shop_stats.values()),
                "active": shop_stats.get(ShopStatus.ACTIVE.value, 0) + shop_stats.get(ShopStatus.INSTALLED.value, 0),
                "by_status": shop_stats
            },
            "webhooks": {
                "registered": webhooks_registered,
                "required": webhooks_required,
                "coverage": webhooks_registered / webhooks_required if webhooks_required > 0 else 0
            },
            "billing": revenue_stats
        }

    def install_app(
        self,
        shop_domain: str,
        code: str,
        shop_data: Optional[Dict[str, Any]] = None
    ) -> Shop:
        """Handle app installation"""
        # Exchange code for token
        access_token = self.oauth_manager.exchange_token(shop_domain, code)

        # Register shop
        shop = self.shop_manager.register_shop(
            domain=shop_domain,
            access_token=access_token,
            scopes=[s.value for s in self.credentials.scopes],
            shop_data=shop_data
        )

        # Register required webhooks
        for topic in self.REQUIRED_WEBHOOKS:
            self.webhook_manager.register_webhook(topic)

        # Create session
        self.oauth_manager.create_session(shop_domain, access_token)

        return shop

    def uninstall_app(self, shop_domain: str) -> bool:
        """Handle app uninstallation"""
        shop = self.shop_manager.get_shop_by_domain(shop_domain)
        if not shop:
            return False

        # Cancel any active subscription
        subscription = self.billing_manager.get_subscription_by_shop(shop.shop_id)
        if subscription:
            self.billing_manager.cancel_subscription(subscription.subscription_id)

        # Uninstall shop
        return self.shop_manager.uninstall_shop(shop.shop_id)

    def run_build(self, stages: Optional[List[str]] = None) -> List[BuildResult]:
        """Run build pipeline"""
        if stages:
            build_stages = [BuildStage(s) for s in stages]
        else:
            build_stages = None

        return self.build_engine.run_pipeline(build_stages)


# ============================================================
# REPORTER - Visual output
# ============================================================

class ShopifyAppReporter:
    """Report generator for Shopify App Builder"""

    STATUS_ICONS = {
        ShopStatus.ACTIVE: "●",
        ShopStatus.INSTALLED: "●",
        ShopStatus.UNINSTALLED: "○",
        ShopStatus.FROZEN: "◐",
        ShopStatus.TRIAL: "◑",
        ShopStatus.CANCELLED: "○",
        ShopStatus.PAUSED: "◐"
    }

    SUBSCRIPTION_ICONS = {
        SubscriptionStatus.ACTIVE: "●",
        SubscriptionStatus.PENDING: "○",
        SubscriptionStatus.FROZEN: "◐",
        SubscriptionStatus.CANCELLED: "○",
        SubscriptionStatus.EXPIRED: "○"
    }

    BUILD_ICONS = {
        TestStatus.PASSED: "✓",
        TestStatus.FAILED: "✗",
        TestStatus.ERROR: "⚠",
        TestStatus.RUNNING: "◐",
        TestStatus.PENDING: "○",
        TestStatus.SKIPPED: "○"
    }

    def generate_status_report(self, engine: ShopifyAppBuilderEngine) -> str:
        """Generate comprehensive status report"""
        status = engine.get_status()
        git = status["git"]
        shopify = status["shopify"]
        shops = status["shops"]
        webhooks = status["webhooks"]
        billing = status["billing"]

        report = []
        report.append("PROJECT: SHOPIFY APP BUILDER")
        report.append("═" * 55)
        report.append(f"Version: {status['project']['version']}")
        report.append(f"Framework: {', '.join(status['project']['stack']['framework'])}")
        report.append("═" * 55)
        report.append("")

        # Git Status
        report.append("GIT STATUS")
        report.append("─" * 40)
        clean_icon = "●" if git["is_clean"] else "○"
        clean_text = "clean" if git["is_clean"] else f"{git['modified_files']} modified"
        report.append(f"  Branch: {git['branch']}")
        report.append(f"  Status: {clean_icon} {clean_text}")
        report.append(f"  Commits: ↑{git['commits_ahead']} ↓{git['commits_behind']}")
        if git["last_commit"]:
            report.append(f"  Last: {git['last_commit'][:40]}...")
        report.append("")

        # Shopify Config
        report.append("SHOPIFY CONFIG")
        report.append("─" * 40)
        creds_icon = "●" if shopify["credentials_configured"] else "○"
        report.append(f"  API Version: {shopify['api_version']}")
        report.append(f"  Scopes: {shopify['scopes_count']} configured")
        report.append(f"  Credentials: {creds_icon} {'configured' if shopify['credentials_configured'] else 'not set'}")
        report.append("")

        # Shop Stats
        report.append("MERCHANTS")
        report.append("─" * 40)
        report.append(f"  Total Installed: {shops['total']}")
        report.append(f"  Active: {shops['active']}")
        for status_name, count in shops.get("by_status", {}).items():
            if count > 0:
                report.append(f"    {status_name}: {count}")
        report.append("")

        # Webhooks
        report.append("WEBHOOKS")
        report.append("─" * 40)
        webhook_pct = webhooks["coverage"] * 100
        report.append(f"  Registered: {webhooks['registered']}/{webhooks['required']}")
        report.append(f"  Coverage: {webhook_pct:.0f}%")
        report.append("")

        # Revenue
        report.append("REVENUE")
        report.append("─" * 40)
        report.append(f"  MRR: ${billing['total_mrr']:.2f}")
        report.append(f"  Active Subscriptions: {billing['active_subscriptions']}")
        report.append(f"  In Trial: {billing['trial_subscriptions']}")
        for plan, count in billing.get("by_plan", {}).items():
            if count > 0:
                report.append(f"    {plan.title()}: {count}")
        report.append("")

        report.append("─" * 55)
        report.append("Ready for Shopify development.")

        return "\n".join(report)

    def generate_shop_report(self, shop: Shop) -> str:
        """Generate shop detail report"""
        report = []
        report.append(f"SHOP: {shop.name}")
        report.append("═" * 55)

        icon = self.STATUS_ICONS.get(shop.status, "○")
        report.append(f"  Status: {icon} {shop.status.value}")
        report.append(f"  Domain: {shop.domain}")
        report.append(f"  Email: {shop.email}")
        report.append(f"  Plan: {shop.plan_name or 'Unknown'}")
        report.append(f"  Country: {shop.country_code}")
        report.append(f"  Currency: {shop.currency}")
        report.append(f"  Timezone: {shop.timezone}")
        report.append("")
        report.append(f"  Installed: {shop.installed_at.strftime('%Y-%m-%d')}")
        if shop.uninstalled_at:
            report.append(f"  Uninstalled: {shop.uninstalled_at.strftime('%Y-%m-%d')}")
        report.append("")
        report.append(f"  Scopes: {len(shop.scopes)}")

        return "\n".join(report)

    def generate_build_report(self, results: List[BuildResult]) -> str:
        """Generate build pipeline report"""
        report = []
        report.append("BUILD PIPELINE")
        report.append("═" * 55)

        all_passed = all(r.status == TestStatus.PASSED for r in results)
        overall_icon = "●" if all_passed else "○"
        report.append(f"Overall: {overall_icon} {'SUCCESS' if all_passed else 'FAILED'}")
        report.append("")

        report.append("STAGES")
        report.append("─" * 40)
        for result in results:
            icon = self.BUILD_ICONS.get(result.status, "○")
            report.append(f"  {icon} {result.stage.value.upper()}")
            if result.errors:
                for error in result.errors[:3]:
                    report.append(f"      ✗ {error[:50]}")

        return "\n".join(report)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI argument parser"""
    import argparse

    parser = argparse.ArgumentParser(
        prog="shopify-app",
        description="Shopify App Builder - Development Environment"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show project status")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Shop commands
    shop_parser = subparsers.add_parser("shop", help="Shop management")
    shop_sub = shop_parser.add_subparsers(dest="shop_command")

    shop_list = shop_sub.add_parser("list", help="List shops")
    shop_list.add_argument("--status", help="Filter by status")

    shop_info = shop_sub.add_parser("info", help="Show shop info")
    shop_info.add_argument("domain", help="Shop domain")

    # Webhook commands
    webhook_parser = subparsers.add_parser("webhook", help="Webhook management")
    webhook_sub = webhook_parser.add_subparsers(dest="webhook_command")

    webhook_list = webhook_sub.add_parser("list", help="List webhooks")
    webhook_register = webhook_sub.add_parser("register", help="Register webhook")
    webhook_register.add_argument("topic", help="Webhook topic")

    # Billing commands
    billing_parser = subparsers.add_parser("billing", help="Billing management")
    billing_sub = billing_parser.add_subparsers(dest="billing_command")

    billing_stats = billing_sub.add_parser("stats", help="Revenue statistics")
    billing_create = billing_sub.add_parser("create", help="Create subscription")
    billing_create.add_argument("shop_id", help="Shop ID")
    billing_create.add_argument("--plan", default="basic", help="Pricing plan")

    # Build command
    build_parser = subparsers.add_parser("build", help="Run build pipeline")
    build_parser.add_argument("--stages", nargs="+", help="Specific stages to run")

    # Deploy command
    deploy_parser = subparsers.add_parser("deploy", help="Deploy app")
    deploy_parser.add_argument("--env", default="production", help="Environment")

    return parser


def main():
    """Main CLI entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = ShopifyAppBuilderEngine()
    reporter = ShopifyAppReporter()

    if args.command == "status":
        if args.json:
            print(json.dumps(engine.get_status(), indent=2, default=str))
        else:
            print(reporter.generate_status_report(engine))

    elif args.command == "shop":
        if args.shop_command == "list":
            shops = engine.shop_manager.get_active_shops()
            if args.status:
                shops = [s for s in shops if s.status.value == args.status]
            for shop in shops:
                icon = reporter.STATUS_ICONS.get(shop.status, "○")
                print(f"{icon} {shop.domain} ({shop.status.value})")

        elif args.shop_command == "info":
            shop = engine.shop_manager.get_shop_by_domain(args.domain)
            if shop:
                print(reporter.generate_shop_report(shop))
            else:
                print(f"Shop not found: {args.domain}")

    elif args.command == "webhook":
        if args.webhook_command == "list":
            for webhook in engine.webhook_manager.webhooks.values():
                print(f"● {webhook.topic.value}: {webhook.address}")

        elif args.webhook_command == "register":
            try:
                topic = WebhookTopic(args.topic)
                webhook = engine.webhook_manager.register_webhook(topic)
                print(f"Registered: {webhook.webhook_id} - {webhook.topic.value}")
            except ValueError:
                print(f"Invalid topic: {args.topic}")

    elif args.command == "billing":
        if args.billing_command == "stats":
            stats = engine.billing_manager.get_revenue_stats()
            print(f"MRR: ${stats['total_mrr']:.2f}")
            print(f"Active: {stats['active_subscriptions']}")
            print(f"Trial: {stats['trial_subscriptions']}")

        elif args.billing_command == "create":
            try:
                plan = PricingPlan(args.plan)
                sub = engine.billing_manager.create_subscription(
                    args.shop_id,
                    plan,
                    "https://app.example.com/billing/return"
                )
                print(f"Created subscription: {sub.subscription_id}")
                print(f"Confirmation URL: {sub.confirmation_url}")
            except ValueError:
                print(f"Invalid plan: {args.plan}")

    elif args.command == "build":
        results = engine.run_build(args.stages)
        print(reporter.generate_build_report(results))

    else:
        print(reporter.generate_status_report(engine))


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

| Command | Description |
|---------|-------------|
| `/project-shopifyappbuilder` | Activate project context |
| `/project-shopifyappbuilder status` | Show detailed status |
| `/project-shopifyappbuilder shop list` | List all merchants |
| `/project-shopifyappbuilder shop info DOMAIN` | Show merchant details |
| `/project-shopifyappbuilder webhook list` | List registered webhooks |
| `/project-shopifyappbuilder webhook register TOPIC` | Register webhook |
| `/project-shopifyappbuilder billing stats` | Show revenue statistics |
| `/project-shopifyappbuilder build` | Run build pipeline |
| `/project-shopifyappbuilder deploy --env production` | Deploy to production |

$ARGUMENTS
