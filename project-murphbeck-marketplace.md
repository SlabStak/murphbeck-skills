# PROJECT.MURPHBECK-MARKETPLACE.EXE - Murphbeck Marketplace Development Environment

You are **PROJECT.MURPHBECK-MARKETPLACE.EXE** — the development environment and AI assistant for the Murphbeck Marketplace e-commerce platform, providing full codebase context, architecture guidance, and development support.

**MISSION**: Power commerce. Enable vendors. Delight customers. Provide comprehensive development assistance for multi-vendor marketplace operations.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MURPHBECK MARKETPLACE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         STOREFRONT LAYER                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │  Product  │  │  Search   │  │   Cart    │  │ Checkout  │        │   │
│  │  │  Catalog  │  │  Engine   │  │  Manager  │  │   Flow    │        │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │   │
│  └────────┼──────────────┼──────────────┼──────────────┼────────────────┘   │
│           │              │              │              │                     │
│  ┌────────┴──────────────┴──────────────┴──────────────┴────────────────┐   │
│  │                         API GATEWAY                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │   │
│  │  │    REST     │  │   GraphQL   │  │  Webhooks   │                   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                       BUSINESS LOGIC LAYER                             │  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │    Vendor    │  │    Order     │  │   Payment    │                 │  │
│  │  │   Manager    │  │  Processor   │  │  Orchestrator│                 │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │  │
│  │                                                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │  Inventory   │  │   Shipping   │  │  Commission  │                 │  │
│  │  │   Tracker    │  │  Calculator  │  │   Engine     │                 │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                         DATA LAYER                                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │  │
│  │  │ Products │  │  Orders  │  │ Vendors  │  │ Payments │              │  │
│  │  │   DB     │  │   DB     │  │   DB     │  │   DB     │              │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │  │
│  │                                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                            │  │
│  │  │  Redis   │  │  S3/CDN  │  │ Elastic  │                            │  │
│  │  │  Cache   │  │  Assets  │  │  Search  │                            │  │
│  │  └──────────┘  └──────────┘  └──────────┘                            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPLETE IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROJECT.MURPHBECK-MARKETPLACE.EXE - Multi-Vendor Marketplace Development Environment
Production-ready e-commerce platform management system.
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set, Callable
from datetime import datetime, timedelta
from enum import Enum, auto
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import subprocess
import hashlib
import json
import re


# ============================================================
# ENUMS - Type-safe classifications for marketplace operations
# ============================================================

class VendorStatus(Enum):
    """Vendor account status states."""
    PENDING_APPROVAL = "pending_approval"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    ON_HOLD = "on_hold"
    VACATION_MODE = "vacation_mode"
    CLOSED = "closed"
    BANNED = "banned"

class ProductStatus(Enum):
    """Product listing status states."""
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    OUT_OF_STOCK = "out_of_stock"
    DISCONTINUED = "discontinued"
    HIDDEN = "hidden"
    REJECTED = "rejected"

class OrderStatus(Enum):
    """Order lifecycle states."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"
    REFUNDED = "refunded"
    DISPUTED = "disputed"

class PaymentStatus(Enum):
    """Payment transaction states."""
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    PARTIALLY_REFUNDED = "partially_refunded"
    REFUNDED = "refunded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    IN_ESCROW = "in_escrow"
    RELEASED = "released"

class PaymentMethod(Enum):
    """Supported payment methods."""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    BANK_TRANSFER = "bank_transfer"
    CRYPTO = "crypto"
    BUY_NOW_PAY_LATER = "bnpl"

class ShippingCarrier(Enum):
    """Shipping carrier options."""
    USPS = "usps"
    UPS = "ups"
    FEDEX = "fedex"
    DHL = "dhl"
    AMAZON = "amazon"
    VENDOR_DIRECT = "vendor_direct"
    LOCAL_PICKUP = "local_pickup"
    DIGITAL_DELIVERY = "digital_delivery"

class CategoryType(Enum):
    """Product category classifications."""
    PHYSICAL = "physical"
    DIGITAL = "digital"
    SERVICE = "service"
    SUBSCRIPTION = "subscription"
    BUNDLE = "bundle"
    RENTAL = "rental"
    CUSTOM = "custom"

class CommissionType(Enum):
    """Commission calculation types."""
    PERCENTAGE = "percentage"
    FLAT_FEE = "flat_fee"
    TIERED = "tiered"
    CATEGORY_BASED = "category_based"
    VOLUME_BASED = "volume_based"
    HYBRID = "hybrid"

class RefundReason(Enum):
    """Refund request reasons."""
    DEFECTIVE = "defective"
    NOT_AS_DESCRIBED = "not_as_described"
    WRONG_ITEM = "wrong_item"
    NEVER_ARRIVED = "never_arrived"
    CHANGED_MIND = "changed_mind"
    DUPLICATE_ORDER = "duplicate_order"
    UNAUTHORIZED = "unauthorized"
    OTHER = "other"

class TestType(Enum):
    """Test suite categories."""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    API = "api"
    PERFORMANCE = "performance"
    SECURITY = "security"
    PAYMENT = "payment"

class ComponentStatus(Enum):
    """Component health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    DOWN = "down"
    MAINTENANCE = "maintenance"


# ============================================================
# DATA CLASSES - Structured models for marketplace entities
# ============================================================

@dataclass
class Address:
    """Shipping/billing address."""
    street_1: str
    city: str
    state: str
    postal_code: str
    country: str
    street_2: Optional[str] = None
    phone: Optional[str] = None
    is_default: bool = False

    def format_single_line(self) -> str:
        """Format as single line."""
        parts = [self.street_1]
        if self.street_2:
            parts.append(self.street_2)
        parts.extend([self.city, self.state, self.postal_code, self.country])
        return ", ".join(parts)

    def validate(self) -> List[str]:
        """Validate address fields."""
        errors = []
        if not self.street_1:
            errors.append("Street address required")
        if not self.city:
            errors.append("City required")
        if not self.postal_code:
            errors.append("Postal code required")
        if not self.country:
            errors.append("Country required")
        return errors


@dataclass
class Money:
    """Monetary value with currency."""
    amount: Decimal
    currency: str = "USD"

    def __post_init__(self):
        if isinstance(self.amount, (int, float)):
            self.amount = Decimal(str(self.amount))
        self.amount = self.amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def __add__(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")
        return Money(self.amount + other.amount, self.currency)

    def __sub__(self, other: 'Money') -> 'Money':
        if self.currency != other.currency:
            raise ValueError(f"Currency mismatch: {self.currency} vs {other.currency}")
        return Money(self.amount - other.amount, self.currency)

    def __mul__(self, factor: float) -> 'Money':
        return Money(self.amount * Decimal(str(factor)), self.currency)

    def format(self) -> str:
        """Format for display."""
        symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
        symbol = symbols.get(self.currency, self.currency + " ")
        return f"{symbol}{self.amount:,.2f}"


@dataclass
class Vendor:
    """Marketplace vendor profile."""
    vendor_id: str
    business_name: str
    email: str
    status: VendorStatus
    commission_rate: Decimal
    joined_date: datetime
    categories: List[str] = field(default_factory=list)
    total_sales: Money = field(default_factory=lambda: Money(0))
    total_orders: int = 0
    rating: float = 0.0
    review_count: int = 0
    payout_schedule: str = "weekly"
    bank_account_verified: bool = False
    tax_id_verified: bool = False

    def calculate_commission(self, sale_amount: Money) -> Money:
        """Calculate commission on a sale."""
        commission = sale_amount.amount * (self.commission_rate / 100)
        return Money(commission, sale_amount.currency)

    def calculate_payout(self, sale_amount: Money) -> Money:
        """Calculate vendor payout after commission."""
        commission = self.calculate_commission(sale_amount)
        return sale_amount - commission

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        return {
            "vendor_id": self.vendor_id,
            "business_name": self.business_name,
            "email": self.email,
            "status": self.status.value,
            "commission_rate": str(self.commission_rate),
            "categories": self.categories,
            "rating": self.rating,
            "review_count": self.review_count
        }


@dataclass
class Product:
    """Product listing."""
    product_id: str
    vendor_id: str
    title: str
    description: str
    category: str
    status: ProductStatus
    price: Money
    compare_at_price: Optional[Money] = None
    cost: Optional[Money] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    quantity: int = 0
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, float]] = None
    images: List[str] = field(default_factory=list)
    variants: List[Dict[str, Any]] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def is_in_stock(self) -> bool:
        """Check if product is available."""
        return self.quantity > 0 and self.status == ProductStatus.ACTIVE

    def calculate_margin(self) -> Optional[float]:
        """Calculate profit margin percentage."""
        if not self.cost or self.cost.amount == 0:
            return None
        margin = ((self.price.amount - self.cost.amount) / self.price.amount) * 100
        return float(margin)

    def get_discount_percentage(self) -> Optional[float]:
        """Calculate discount from compare price."""
        if not self.compare_at_price:
            return None
        discount = ((self.compare_at_price.amount - self.price.amount) /
                   self.compare_at_price.amount) * 100
        return float(discount)


@dataclass
class CartItem:
    """Shopping cart line item."""
    product_id: str
    variant_id: Optional[str]
    quantity: int
    unit_price: Money
    vendor_id: str

    def line_total(self) -> Money:
        """Calculate line item total."""
        return self.unit_price * self.quantity


@dataclass
class Order:
    """Customer order."""
    order_id: str
    customer_id: str
    status: OrderStatus
    items: List[CartItem]
    subtotal: Money
    tax: Money
    shipping_cost: Money
    total: Money
    shipping_address: Address
    billing_address: Address
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    created_at: datetime
    vendor_orders: Dict[str, 'VendorOrder'] = field(default_factory=dict)
    notes: List[str] = field(default_factory=list)

    def get_item_count(self) -> int:
        """Get total item count."""
        return sum(item.quantity for item in self.items)

    def get_vendor_ids(self) -> Set[str]:
        """Get unique vendor IDs in order."""
        return {item.vendor_id for item in self.items}

    def can_cancel(self) -> bool:
        """Check if order can be cancelled."""
        return self.status in [OrderStatus.PENDING, OrderStatus.CONFIRMED]


@dataclass
class VendorOrder:
    """Vendor-specific portion of an order."""
    vendor_order_id: str
    vendor_id: str
    parent_order_id: str
    items: List[CartItem]
    subtotal: Money
    commission: Money
    payout: Money
    status: OrderStatus
    tracking_number: Optional[str] = None
    carrier: Optional[ShippingCarrier] = None
    shipped_at: Optional[datetime] = None

    def mark_shipped(self, tracking: str, carrier: ShippingCarrier) -> None:
        """Mark vendor order as shipped."""
        self.tracking_number = tracking
        self.carrier = carrier
        self.shipped_at = datetime.now()
        self.status = OrderStatus.SHIPPED


@dataclass
class Payment:
    """Payment transaction."""
    payment_id: str
    order_id: str
    amount: Money
    method: PaymentMethod
    status: PaymentStatus
    processor_ref: Optional[str] = None
    captured_at: Optional[datetime] = None
    refunds: List['Refund'] = field(default_factory=list)

    def get_refunded_amount(self) -> Money:
        """Calculate total refunded amount."""
        total = Decimal(0)
        for refund in self.refunds:
            total += refund.amount.amount
        return Money(total, self.amount.currency)

    def get_net_amount(self) -> Money:
        """Calculate net amount after refunds."""
        return self.amount - self.get_refunded_amount()

    def can_refund(self, amount: Money) -> bool:
        """Check if refund is possible."""
        net = self.get_net_amount()
        return amount.amount <= net.amount and self.status == PaymentStatus.CAPTURED


@dataclass
class Refund:
    """Refund transaction."""
    refund_id: str
    payment_id: str
    amount: Money
    reason: RefundReason
    status: PaymentStatus
    initiated_at: datetime
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None


@dataclass
class Payout:
    """Vendor payout."""
    payout_id: str
    vendor_id: str
    amount: Money
    period_start: datetime
    period_end: datetime
    orders: List[str]
    status: PaymentStatus
    scheduled_date: datetime
    paid_date: Optional[datetime] = None
    transaction_ref: Optional[str] = None


@dataclass
class GitStatus:
    """Git repository status."""
    branch: str
    clean: bool
    ahead: int
    behind: int
    modified: List[str]
    staged: List[str]
    untracked: List[str]
    last_commit: str
    last_commit_date: datetime


@dataclass
class BuildResult:
    """Build execution result."""
    success: bool
    duration_seconds: float
    output: str
    errors: List[str]
    warnings: List[str]
    artifacts: List[str]


@dataclass
class TestResult:
    """Test execution result."""
    test_type: TestType
    passed: int
    failed: int
    skipped: int
    duration_seconds: float
    coverage: Optional[float] = None
    failures: List[Dict[str, str]] = field(default_factory=list)


# ============================================================
# ENGINE CLASSES - Business logic for marketplace operations
# ============================================================

class GitManager:
    """Git operations for the marketplace project."""

    def __init__(self, repo_path: Path):
        self.repo_path = repo_path

    def _run_git(self, *args) -> subprocess.CompletedProcess:
        """Execute git command."""
        return subprocess.run(
            ["git"] + list(args),
            cwd=self.repo_path,
            capture_output=True,
            text=True
        )

    def get_status(self) -> GitStatus:
        """Get comprehensive git status."""
        # Get current branch
        branch_result = self._run_git("branch", "--show-current")
        branch = branch_result.stdout.strip()

        # Get status
        status_result = self._run_git("status", "--porcelain")
        lines = status_result.stdout.strip().split('\n') if status_result.stdout.strip() else []

        modified = []
        staged = []
        untracked = []

        for line in lines:
            if not line:
                continue
            status_code = line[:2]
            filename = line[3:]

            if status_code[0] in ['M', 'A', 'D', 'R']:
                staged.append(filename)
            if status_code[1] == 'M':
                modified.append(filename)
            if status_code == '??':
                untracked.append(filename)

        # Get ahead/behind
        ahead, behind = 0, 0
        rev_result = self._run_git("rev-list", "--left-right", "--count", f"HEAD...origin/{branch}")
        if rev_result.returncode == 0:
            parts = rev_result.stdout.strip().split('\t')
            if len(parts) == 2:
                ahead, behind = int(parts[0]), int(parts[1])

        # Get last commit
        log_result = self._run_git("log", "-1", "--format=%H|%s|%ai")
        commit_hash, message, date_str = "", "", datetime.now()
        if log_result.stdout.strip():
            parts = log_result.stdout.strip().split('|')
            if len(parts) >= 3:
                commit_hash = parts[0][:8]
                message = parts[1]
                date_str = datetime.fromisoformat(parts[2].replace(' ', 'T').split('+')[0])

        return GitStatus(
            branch=branch,
            clean=len(modified) == 0 and len(staged) == 0,
            ahead=ahead,
            behind=behind,
            modified=modified,
            staged=staged,
            untracked=untracked,
            last_commit=f"{commit_hash} {message}"[:60],
            last_commit_date=date_str
        )


class VendorManager:
    """Vendor lifecycle and operations management."""

    def __init__(self):
        self.vendors: Dict[str, Vendor] = {}
        self.pending_payouts: Dict[str, List[Payout]] = {}

    # Commission rates by category
    COMMISSION_RATES = {
        "electronics": Decimal("8.0"),
        "clothing": Decimal("15.0"),
        "home_goods": Decimal("12.0"),
        "digital": Decimal("20.0"),
        "services": Decimal("10.0"),
        "default": Decimal("12.0")
    }

    def register_vendor(self, business_name: str, email: str,
                       categories: List[str]) -> Vendor:
        """Register a new vendor."""
        vendor_id = hashlib.sha256(
            f"{email}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        # Calculate blended commission rate
        rates = [self.COMMISSION_RATES.get(cat, self.COMMISSION_RATES["default"])
                for cat in categories]
        commission_rate = sum(rates) / len(rates) if rates else self.COMMISSION_RATES["default"]

        vendor = Vendor(
            vendor_id=vendor_id,
            business_name=business_name,
            email=email,
            status=VendorStatus.PENDING_APPROVAL,
            commission_rate=commission_rate,
            joined_date=datetime.now(),
            categories=categories
        )

        self.vendors[vendor_id] = vendor
        return vendor

    def approve_vendor(self, vendor_id: str) -> bool:
        """Approve a pending vendor."""
        vendor = self.vendors.get(vendor_id)
        if vendor and vendor.status == VendorStatus.PENDING_APPROVAL:
            vendor.status = VendorStatus.ACTIVE
            return True
        return False

    def suspend_vendor(self, vendor_id: str, reason: str) -> bool:
        """Suspend a vendor account."""
        vendor = self.vendors.get(vendor_id)
        if vendor and vendor.status == VendorStatus.ACTIVE:
            vendor.status = VendorStatus.SUSPENDED
            return True
        return False

    def calculate_payout(self, vendor_id: str,
                        period_start: datetime,
                        period_end: datetime,
                        orders: List[VendorOrder]) -> Payout:
        """Calculate vendor payout for a period."""
        total_payout = Money(Decimal(0))
        order_ids = []

        for order in orders:
            if order.vendor_id == vendor_id:
                total_payout = total_payout + order.payout
                order_ids.append(order.vendor_order_id)

        payout_id = hashlib.sha256(
            f"{vendor_id}:{period_start.isoformat()}".encode()
        ).hexdigest()[:12]

        return Payout(
            payout_id=payout_id,
            vendor_id=vendor_id,
            amount=total_payout,
            period_start=period_start,
            period_end=period_end,
            orders=order_ids,
            status=PaymentStatus.PENDING,
            scheduled_date=period_end + timedelta(days=3)
        )

    def get_vendor_analytics(self, vendor_id: str) -> Dict[str, Any]:
        """Get vendor performance analytics."""
        vendor = self.vendors.get(vendor_id)
        if not vendor:
            return {}

        return {
            "vendor_id": vendor_id,
            "total_sales": vendor.total_sales.format(),
            "total_orders": vendor.total_orders,
            "average_order_value": (vendor.total_sales.amount / vendor.total_orders).quantize(
                Decimal('0.01')) if vendor.total_orders > 0 else Decimal(0),
            "rating": vendor.rating,
            "review_count": vendor.review_count,
            "commission_rate": f"{vendor.commission_rate}%",
            "status": vendor.status.value
        }


class ProductCatalog:
    """Product catalog and inventory management."""

    def __init__(self):
        self.products: Dict[str, Product] = {}
        self.category_tree: Dict[str, List[str]] = {}

    def add_product(self, vendor_id: str, title: str, description: str,
                   category: str, price: Money, quantity: int) -> Product:
        """Add a new product listing."""
        product_id = hashlib.sha256(
            f"{vendor_id}:{title}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        product = Product(
            product_id=product_id,
            vendor_id=vendor_id,
            title=title,
            description=description,
            category=category,
            status=ProductStatus.PENDING_REVIEW,
            price=price,
            quantity=quantity
        )

        self.products[product_id] = product
        return product

    def approve_product(self, product_id: str) -> bool:
        """Approve a product for listing."""
        product = self.products.get(product_id)
        if product and product.status == ProductStatus.PENDING_REVIEW:
            product.status = ProductStatus.ACTIVE
            return True
        return False

    def update_inventory(self, product_id: str, quantity_change: int) -> bool:
        """Update product inventory."""
        product = self.products.get(product_id)
        if not product:
            return False

        new_quantity = product.quantity + quantity_change
        if new_quantity < 0:
            return False

        product.quantity = new_quantity
        if new_quantity == 0:
            product.status = ProductStatus.OUT_OF_STOCK
        elif product.status == ProductStatus.OUT_OF_STOCK and new_quantity > 0:
            product.status = ProductStatus.ACTIVE

        return True

    def search_products(self, query: str, category: Optional[str] = None,
                       min_price: Optional[Money] = None,
                       max_price: Optional[Money] = None,
                       in_stock_only: bool = True) -> List[Product]:
        """Search products with filters."""
        results = []
        query_lower = query.lower()

        for product in self.products.values():
            # Check status
            if in_stock_only and not product.is_in_stock():
                continue

            # Check query match
            if query_lower not in product.title.lower() and \
               query_lower not in product.description.lower():
                continue

            # Check category
            if category and product.category != category:
                continue

            # Check price range
            if min_price and product.price.amount < min_price.amount:
                continue
            if max_price and product.price.amount > max_price.amount:
                continue

            results.append(product)

        return sorted(results, key=lambda p: p.title)

    def get_vendor_products(self, vendor_id: str) -> List[Product]:
        """Get all products for a vendor."""
        return [p for p in self.products.values() if p.vendor_id == vendor_id]


class OrderProcessor:
    """Order lifecycle management."""

    def __init__(self, vendor_manager: VendorManager, catalog: ProductCatalog):
        self.orders: Dict[str, Order] = {}
        self.vendor_manager = vendor_manager
        self.catalog = catalog

    def create_order(self, customer_id: str, items: List[CartItem],
                    shipping_address: Address, billing_address: Address,
                    payment_method: PaymentMethod) -> Order:
        """Create a new order from cart items."""
        # Calculate totals
        subtotal = Money(Decimal(0))
        for item in items:
            subtotal = subtotal + item.line_total()

        # Calculate tax (simplified - 8% rate)
        tax = subtotal * 0.08

        # Calculate shipping (simplified - flat rate per vendor)
        vendor_ids = {item.vendor_id for item in items}
        shipping_cost = Money(Decimal("5.99") * len(vendor_ids))

        total = subtotal + tax + shipping_cost

        order_id = hashlib.sha256(
            f"{customer_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        order = Order(
            order_id=order_id,
            customer_id=customer_id,
            status=OrderStatus.PENDING,
            items=items,
            subtotal=subtotal,
            tax=tax,
            shipping_cost=shipping_cost,
            total=total,
            shipping_address=shipping_address,
            billing_address=billing_address,
            payment_method=payment_method,
            payment_status=PaymentStatus.PENDING,
            created_at=datetime.now()
        )

        # Create vendor sub-orders
        self._create_vendor_orders(order)

        self.orders[order_id] = order
        return order

    def _create_vendor_orders(self, order: Order) -> None:
        """Split order into vendor-specific orders."""
        vendor_items: Dict[str, List[CartItem]] = {}

        for item in order.items:
            if item.vendor_id not in vendor_items:
                vendor_items[item.vendor_id] = []
            vendor_items[item.vendor_id].append(item)

        for vendor_id, items in vendor_items.items():
            vendor = self.vendor_manager.vendors.get(vendor_id)
            if not vendor:
                continue

            subtotal = Money(Decimal(0))
            for item in items:
                subtotal = subtotal + item.line_total()

            commission = vendor.calculate_commission(subtotal)
            payout = vendor.calculate_payout(subtotal)

            vendor_order_id = f"{order.order_id}-{vendor_id[:6]}"

            vendor_order = VendorOrder(
                vendor_order_id=vendor_order_id,
                vendor_id=vendor_id,
                parent_order_id=order.order_id,
                items=items,
                subtotal=subtotal,
                commission=commission,
                payout=payout,
                status=OrderStatus.PENDING
            )

            order.vendor_orders[vendor_id] = vendor_order

    def confirm_order(self, order_id: str) -> bool:
        """Confirm order after successful payment."""
        order = self.orders.get(order_id)
        if not order or order.status != OrderStatus.PENDING:
            return False

        # Update inventory
        for item in order.items:
            self.catalog.update_inventory(item.product_id, -item.quantity)

        order.status = OrderStatus.CONFIRMED
        for vendor_order in order.vendor_orders.values():
            vendor_order.status = OrderStatus.CONFIRMED

        return True

    def ship_vendor_order(self, order_id: str, vendor_id: str,
                         tracking: str, carrier: ShippingCarrier) -> bool:
        """Mark vendor portion of order as shipped."""
        order = self.orders.get(order_id)
        if not order:
            return False

        vendor_order = order.vendor_orders.get(vendor_id)
        if not vendor_order:
            return False

        vendor_order.mark_shipped(tracking, carrier)

        # Check if all vendor orders are shipped
        all_shipped = all(
            vo.status == OrderStatus.SHIPPED
            for vo in order.vendor_orders.values()
        )
        if all_shipped:
            order.status = OrderStatus.SHIPPED

        return True

    def cancel_order(self, order_id: str, reason: str) -> bool:
        """Cancel an order."""
        order = self.orders.get(order_id)
        if not order or not order.can_cancel():
            return False

        # Restore inventory
        for item in order.items:
            self.catalog.update_inventory(item.product_id, item.quantity)

        order.status = OrderStatus.CANCELLED
        order.notes.append(f"Cancelled: {reason}")

        for vendor_order in order.vendor_orders.values():
            vendor_order.status = OrderStatus.CANCELLED

        return True


class PaymentOrchestrator:
    """Payment processing and split payments."""

    def __init__(self):
        self.payments: Dict[str, Payment] = {}
        self.escrow_balance: Dict[str, Money] = {}  # vendor_id -> amount

    # Payment processor fees
    PROCESSOR_FEES = {
        PaymentMethod.CREDIT_CARD: Decimal("2.9"),
        PaymentMethod.DEBIT_CARD: Decimal("1.5"),
        PaymentMethod.PAYPAL: Decimal("3.49"),
        PaymentMethod.STRIPE: Decimal("2.9"),
        PaymentMethod.APPLE_PAY: Decimal("2.9"),
        PaymentMethod.GOOGLE_PAY: Decimal("2.9"),
        PaymentMethod.BANK_TRANSFER: Decimal("0.8"),
    }

    def authorize_payment(self, order: Order) -> Payment:
        """Authorize payment for an order."""
        payment_id = hashlib.sha256(
            f"{order.order_id}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        payment = Payment(
            payment_id=payment_id,
            order_id=order.order_id,
            amount=order.total,
            method=order.payment_method,
            status=PaymentStatus.AUTHORIZED
        )

        self.payments[payment_id] = payment
        return payment

    def capture_payment(self, payment_id: str) -> bool:
        """Capture an authorized payment."""
        payment = self.payments.get(payment_id)
        if not payment or payment.status != PaymentStatus.AUTHORIZED:
            return False

        payment.status = PaymentStatus.CAPTURED
        payment.captured_at = datetime.now()

        # Simulate processor reference
        payment.processor_ref = f"ch_{hashlib.sha256(payment_id.encode()).hexdigest()[:24]}"

        return True

    def hold_in_escrow(self, payment: Payment, order: Order) -> None:
        """Hold vendor funds in escrow."""
        for vendor_id, vendor_order in order.vendor_orders.items():
            if vendor_id not in self.escrow_balance:
                self.escrow_balance[vendor_id] = Money(Decimal(0))
            self.escrow_balance[vendor_id] = (
                self.escrow_balance[vendor_id] + vendor_order.payout
            )

    def release_escrow(self, vendor_id: str, amount: Money) -> bool:
        """Release funds from escrow to vendor."""
        if vendor_id not in self.escrow_balance:
            return False

        if self.escrow_balance[vendor_id].amount < amount.amount:
            return False

        self.escrow_balance[vendor_id] = self.escrow_balance[vendor_id] - amount
        return True

    def process_refund(self, payment_id: str, amount: Money,
                      reason: RefundReason, notes: Optional[str] = None) -> Optional[Refund]:
        """Process a refund on a payment."""
        payment = self.payments.get(payment_id)
        if not payment or not payment.can_refund(amount):
            return None

        refund_id = hashlib.sha256(
            f"{payment_id}:refund:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        refund = Refund(
            refund_id=refund_id,
            payment_id=payment_id,
            amount=amount,
            reason=reason,
            status=PaymentStatus.PENDING,
            initiated_at=datetime.now(),
            notes=notes
        )

        # Process refund (simplified)
        refund.status = PaymentStatus.REFUNDED
        refund.completed_at = datetime.now()

        payment.refunds.append(refund)

        # Update payment status
        if payment.get_net_amount().amount == 0:
            payment.status = PaymentStatus.REFUNDED
        else:
            payment.status = PaymentStatus.PARTIALLY_REFUNDED

        return refund

    def calculate_processor_fee(self, payment: Payment) -> Money:
        """Calculate payment processor fee."""
        fee_rate = self.PROCESSOR_FEES.get(payment.method, Decimal("2.9"))
        fee = payment.amount.amount * (fee_rate / 100)
        return Money(fee, payment.amount.currency)


class SearchEngine:
    """Product search and discovery."""

    def __init__(self, catalog: ProductCatalog):
        self.catalog = catalog
        self.search_index: Dict[str, Set[str]] = {}  # term -> product_ids

    def index_product(self, product: Product) -> None:
        """Index a product for search."""
        # Tokenize title and description
        text = f"{product.title} {product.description} {product.category}"
        tokens = set(re.findall(r'\w+', text.lower()))

        for token in tokens:
            if token not in self.search_index:
                self.search_index[token] = set()
            self.search_index[token].add(product.product_id)

    def search(self, query: str, filters: Optional[Dict[str, Any]] = None) -> List[Product]:
        """Search products by query and filters."""
        query_tokens = set(re.findall(r'\w+', query.lower()))

        if not query_tokens:
            return []

        # Find products matching all tokens
        matching_ids: Optional[Set[str]] = None
        for token in query_tokens:
            token_matches = self.search_index.get(token, set())
            if matching_ids is None:
                matching_ids = token_matches.copy()
            else:
                matching_ids &= token_matches

        if not matching_ids:
            return []

        # Get products and apply filters
        results = []
        for product_id in matching_ids:
            product = self.catalog.products.get(product_id)
            if not product or product.status != ProductStatus.ACTIVE:
                continue

            if filters:
                if 'category' in filters and product.category != filters['category']:
                    continue
                if 'min_price' in filters and product.price.amount < filters['min_price']:
                    continue
                if 'max_price' in filters and product.price.amount > filters['max_price']:
                    continue
                if 'vendor_id' in filters and product.vendor_id != filters['vendor_id']:
                    continue

            results.append(product)

        return results

    def get_recommendations(self, product_id: str, limit: int = 5) -> List[Product]:
        """Get product recommendations based on similarity."""
        product = self.catalog.products.get(product_id)
        if not product:
            return []

        # Find products in same category
        category_products = [
            p for p in self.catalog.products.values()
            if p.category == product.category
            and p.product_id != product_id
            and p.status == ProductStatus.ACTIVE
        ]

        # Sort by relevance (simplified - by price similarity)
        category_products.sort(
            key=lambda p: abs(p.price.amount - product.price.amount)
        )

        return category_products[:limit]


class BuildEngine:
    """Build and deployment management."""

    def __init__(self, project_path: Path):
        self.project_path = project_path

    def run_build(self, target: str = "production") -> BuildResult:
        """Run project build."""
        start_time = datetime.now()
        errors = []
        warnings = []
        artifacts = []

        try:
            # Run npm/yarn build
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=600
            )

            output = result.stdout + result.stderr

            # Parse output for errors/warnings
            for line in output.split('\n'):
                if 'error' in line.lower():
                    errors.append(line)
                elif 'warning' in line.lower():
                    warnings.append(line)

            success = result.returncode == 0

            if success:
                # Check for build artifacts
                dist_path = self.project_path / "dist"
                if dist_path.exists():
                    artifacts = [str(f) for f in dist_path.glob("**/*") if f.is_file()]

        except subprocess.TimeoutExpired:
            output = "Build timed out after 10 minutes"
            errors.append("Build timeout")
            success = False
        except Exception as e:
            output = str(e)
            errors.append(str(e))
            success = False

        duration = (datetime.now() - start_time).total_seconds()

        return BuildResult(
            success=success,
            duration_seconds=duration,
            output=output[:5000],  # Truncate
            errors=errors,
            warnings=warnings,
            artifacts=artifacts
        )

    def run_tests(self, test_type: TestType = TestType.UNIT) -> TestResult:
        """Run test suite."""
        start_time = datetime.now()

        test_commands = {
            TestType.UNIT: ["npm", "run", "test:unit"],
            TestType.INTEGRATION: ["npm", "run", "test:integration"],
            TestType.E2E: ["npm", "run", "test:e2e"],
            TestType.API: ["npm", "run", "test:api"],
            TestType.PAYMENT: ["npm", "run", "test:payment"],
        }

        command = test_commands.get(test_type, ["npm", "test"])

        try:
            result = subprocess.run(
                command,
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            output = result.stdout + result.stderr

            # Parse test results (simplified)
            passed = len(re.findall(r'✓|passed', output, re.IGNORECASE))
            failed = len(re.findall(r'✗|failed', output, re.IGNORECASE))
            skipped = len(re.findall(r'skipped|pending', output, re.IGNORECASE))

            # Try to extract coverage
            coverage_match = re.search(r'coverage[:\s]+(\d+\.?\d*)%', output, re.IGNORECASE)
            coverage = float(coverage_match.group(1)) if coverage_match else None

            failures = []
            if failed > 0:
                failure_matches = re.findall(r'FAIL[:\s]+(.*?)(?=\n|$)', output)
                failures = [{"test": m, "error": "Test failed"} for m in failure_matches[:10]]

        except subprocess.TimeoutExpired:
            passed, failed, skipped = 0, 1, 0
            coverage = None
            failures = [{"test": "All", "error": "Test timeout"}]
        except Exception as e:
            passed, failed, skipped = 0, 1, 0
            coverage = None
            failures = [{"test": "All", "error": str(e)}]

        duration = (datetime.now() - start_time).total_seconds()

        return TestResult(
            test_type=test_type,
            passed=passed,
            failed=failed,
            skipped=skipped,
            duration_seconds=duration,
            coverage=coverage,
            failures=failures
        )


# ============================================================
# MAIN ENGINE - Orchestrates all marketplace components
# ============================================================

class MurphbeckMarketplaceEngine:
    """Main orchestrator for Murphbeck Marketplace development environment."""

    PROJECT_CONFIG = {
        "name": "Murphbeck Marketplace",
        "version": "1.0.0",
        "type": "Multi-Vendor E-commerce Platform",
        "stack": {
            "frontend": ["Next.js", "React", "TypeScript", "Tailwind CSS"],
            "backend": ["Node.js", "Express", "tRPC"],
            "database": ["PostgreSQL", "Redis", "Elasticsearch"],
            "payments": ["Stripe", "PayPal"],
            "infrastructure": ["Vercel", "AWS", "Docker"]
        },
        "path": "~/Projects/murphbeck-marketplace"
    }

    SERVICES = {
        "storefront": {
            "path": "apps/storefront",
            "port": 3000,
            "description": "Customer-facing marketplace"
        },
        "vendor_portal": {
            "path": "apps/vendor-portal",
            "port": 3001,
            "description": "Vendor dashboard and management"
        },
        "admin": {
            "path": "apps/admin",
            "port": 3002,
            "description": "Marketplace administration"
        },
        "api": {
            "path": "apps/api",
            "port": 4000,
            "description": "REST/GraphQL API server"
        },
        "payment_service": {
            "path": "services/payments",
            "port": 4001,
            "description": "Payment processing service"
        },
        "search_service": {
            "path": "services/search",
            "port": 4002,
            "description": "Elasticsearch-based search"
        }
    }

    FEATURES = {
        "product_listings": "Multi-vendor product catalog with variants",
        "vendor_management": "Vendor onboarding, approval, and performance tracking",
        "order_processing": "Split orders across vendors with fulfillment tracking",
        "payment_integration": "Stripe/PayPal with split payments and escrow",
        "search_discovery": "Elasticsearch-powered search with faceted filtering",
        "commission_engine": "Flexible commission rules by category and vendor tier"
    }

    def __init__(self):
        self.project_path = Path(self.PROJECT_CONFIG["path"]).expanduser()
        self.git = GitManager(self.project_path)
        self.vendor_manager = VendorManager()
        self.catalog = ProductCatalog()
        self.order_processor = OrderProcessor(self.vendor_manager, self.catalog)
        self.payment_orchestrator = PaymentOrchestrator()
        self.search_engine = SearchEngine(self.catalog)
        self.build_engine = BuildEngine(self.project_path)

    def get_project_status(self) -> Dict[str, Any]:
        """Get comprehensive project status."""
        git_status = self.git.get_status()

        return {
            "project": self.PROJECT_CONFIG,
            "git": {
                "branch": git_status.branch,
                "clean": git_status.clean,
                "ahead": git_status.ahead,
                "behind": git_status.behind,
                "last_commit": git_status.last_commit
            },
            "services": self.SERVICES,
            "features": self.FEATURES,
            "marketplace_stats": {
                "vendors": len(self.vendor_manager.vendors),
                "products": len(self.catalog.products),
                "orders": len(self.order_processor.orders),
                "payments": len(self.payment_orchestrator.payments)
            }
        }

    def get_service_status(self, service_name: str) -> Dict[str, Any]:
        """Get status of a specific service."""
        service = self.SERVICES.get(service_name)
        if not service:
            return {"error": f"Service '{service_name}' not found"}

        service_path = self.project_path / service["path"]

        return {
            "name": service_name,
            "description": service["description"],
            "path": str(service_path),
            "port": service["port"],
            "exists": service_path.exists(),
            "has_package_json": (service_path / "package.json").exists()
        }

    def run_build(self, service: Optional[str] = None) -> BuildResult:
        """Run build for service or entire project."""
        return self.build_engine.run_build()

    def run_tests(self, test_type: TestType = TestType.UNIT) -> TestResult:
        """Run tests for the project."""
        return self.build_engine.run_tests(test_type)


# ============================================================
# REPORTER - Visual output for marketplace status
# ============================================================

class MarketplaceReporter:
    """Status reporting with visual output."""

    STATUS_ICONS = {
        ComponentStatus.HEALTHY: "●",
        ComponentStatus.DEGRADED: "◐",
        ComponentStatus.DOWN: "○",
        ComponentStatus.MAINTENANCE: "◑"
    }

    VENDOR_STATUS_ICONS = {
        VendorStatus.ACTIVE: "●",
        VendorStatus.PENDING_APPROVAL: "◐",
        VendorStatus.SUSPENDED: "○",
        VendorStatus.ON_HOLD: "◑",
        VendorStatus.VACATION_MODE: "◇",
        VendorStatus.CLOSED: "×",
        VendorStatus.BANNED: "⊘"
    }

    ORDER_STATUS_ICONS = {
        OrderStatus.PENDING: "◐",
        OrderStatus.CONFIRMED: "●",
        OrderStatus.PROCESSING: "◑",
        OrderStatus.SHIPPED: "▶",
        OrderStatus.DELIVERED: "✓",
        OrderStatus.CANCELLED: "×",
        OrderStatus.REFUNDED: "↩"
    }

    def generate_status_report(self, engine: MurphbeckMarketplaceEngine) -> str:
        """Generate comprehensive status report."""
        status = engine.get_project_status()
        git = status["git"]

        report = []
        report.append("PROJECT: MURPHBECK MARKETPLACE")
        report.append("═" * 60)
        report.append(f"Status: Active")
        report.append(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append("═" * 60)
        report.append("")

        # Git Status
        report.append("GIT STATUS")
        report.append("─" * 40)
        report.append(f"┌{'─' * 38}┐")
        report.append(f"│  Branch: {git['branch']:<27} │")
        status_icon = "●" if git["clean"] else "◐"
        status_text = "clean" if git["clean"] else "modified"
        report.append(f"│  Status: {status_icon} {status_text:<24} │")
        report.append(f"│  Ahead: {git['ahead']:<28} │")
        report.append(f"│  Behind: {git['behind']:<27} │")
        report.append(f"│  Last: {git['last_commit'][:28]:<29} │")
        report.append(f"└{'─' * 38}┘")
        report.append("")

        # Services
        report.append("SERVICES")
        report.append("─" * 40)
        report.append("| Service          | Port | Status |")
        report.append("|------------------|------|--------|")
        for name, info in engine.SERVICES.items():
            report.append(f"| {name:<16} | {info['port']:<4} | ●      |")
        report.append("")

        # Features
        report.append("CORE FEATURES")
        report.append("─" * 40)
        for feature, desc in engine.FEATURES.items():
            report.append(f"● {feature}: {desc}")
        report.append("")

        # Marketplace Stats
        stats = status["marketplace_stats"]
        report.append("MARKETPLACE METRICS")
        report.append("─" * 40)
        report.append(f"┌{'─' * 38}┐")
        report.append(f"│  Active Vendors: {stats['vendors']:<20} │")
        report.append(f"│  Products Listed: {stats['products']:<19} │")
        report.append(f"│  Total Orders: {stats['orders']:<22} │")
        report.append(f"│  Payments Processed: {stats['payments']:<16} │")
        report.append(f"└{'─' * 38}┘")
        report.append("")

        # Tech Stack
        report.append("TECH STACK")
        report.append("─" * 40)
        stack = status["project"]["stack"]
        for layer, techs in stack.items():
            report.append(f"  {layer}: {', '.join(techs)}")
        report.append("")

        report.append("Project Ready: ● Murphbeck Marketplace Active")

        return "\n".join(report)

    def generate_vendor_report(self, vendor: Vendor) -> str:
        """Generate vendor performance report."""
        icon = self.VENDOR_STATUS_ICONS.get(vendor.status, "?")

        report = []
        report.append(f"VENDOR: {vendor.business_name}")
        report.append("─" * 40)
        report.append(f"ID: {vendor.vendor_id}")
        report.append(f"Status: {icon} {vendor.status.value}")
        report.append(f"Email: {vendor.email}")
        report.append(f"Categories: {', '.join(vendor.categories)}")
        report.append(f"Commission Rate: {vendor.commission_rate}%")
        report.append(f"Total Sales: {vendor.total_sales.format()}")
        report.append(f"Total Orders: {vendor.total_orders}")
        report.append(f"Rating: {'★' * int(vendor.rating)} ({vendor.rating}/5.0)")
        report.append(f"Reviews: {vendor.review_count}")
        report.append(f"Member Since: {vendor.joined_date.strftime('%Y-%m-%d')}")

        return "\n".join(report)

    def generate_order_report(self, order: Order) -> str:
        """Generate order summary report."""
        icon = self.ORDER_STATUS_ICONS.get(order.status, "?")

        report = []
        report.append(f"ORDER: {order.order_id}")
        report.append("─" * 40)
        report.append(f"Status: {icon} {order.status.value}")
        report.append(f"Customer: {order.customer_id}")
        report.append(f"Date: {order.created_at.strftime('%Y-%m-%d %H:%M')}")
        report.append("")
        report.append("ITEMS:")
        for item in order.items:
            report.append(f"  - {item.product_id}: {item.quantity} x {item.unit_price.format()}")
        report.append("")
        report.append(f"Subtotal: {order.subtotal.format()}")
        report.append(f"Tax: {order.tax.format()}")
        report.append(f"Shipping: {order.shipping_cost.format()}")
        report.append(f"TOTAL: {order.total.format()}")
        report.append("")
        report.append(f"Payment: {order.payment_method.value} ({order.payment_status.value})")
        report.append(f"Ship To: {order.shipping_address.format_single_line()}")

        if order.vendor_orders:
            report.append("")
            report.append("VENDOR ORDERS:")
            for vendor_id, vo in order.vendor_orders.items():
                vo_icon = self.ORDER_STATUS_ICONS.get(vo.status, "?")
                report.append(f"  {vo_icon} {vo.vendor_order_id}: {vo.subtotal.format()}")
                if vo.tracking_number:
                    report.append(f"     Tracking: {vo.tracking_number} ({vo.carrier.value})")

        return "\n".join(report)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create command-line interface."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Murphbeck Marketplace Development Environment"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show project status")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Build command
    build_parser = subparsers.add_parser("build", help="Run build")
    build_parser.add_argument("--service", help="Build specific service")

    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests")
    test_parser.add_argument(
        "--type",
        choices=["unit", "integration", "e2e", "api", "payment"],
        default="unit",
        help="Test type"
    )

    # Vendor commands
    vendor_parser = subparsers.add_parser("vendor", help="Vendor management")
    vendor_subparsers = vendor_parser.add_subparsers(dest="vendor_command")

    vendor_list = vendor_subparsers.add_parser("list", help="List vendors")
    vendor_add = vendor_subparsers.add_parser("add", help="Add vendor")
    vendor_add.add_argument("--name", required=True, help="Business name")
    vendor_add.add_argument("--email", required=True, help="Email address")
    vendor_add.add_argument("--categories", nargs="+", help="Categories")

    # Product commands
    product_parser = subparsers.add_parser("product", help="Product management")
    product_subparsers = product_parser.add_subparsers(dest="product_command")

    product_list = product_subparsers.add_parser("list", help="List products")
    product_search = product_subparsers.add_parser("search", help="Search products")
    product_search.add_argument("query", help="Search query")

    # Order commands
    order_parser = subparsers.add_parser("order", help="Order management")
    order_subparsers = order_parser.add_subparsers(dest="order_command")

    order_list = order_subparsers.add_parser("list", help="List orders")
    order_show = order_subparsers.add_parser("show", help="Show order details")
    order_show.add_argument("order_id", help="Order ID")

    # Service command
    service_parser = subparsers.add_parser("service", help="Service management")
    service_parser.add_argument("name", help="Service name")
    service_parser.add_argument("--start", action="store_true", help="Start service")
    service_parser.add_argument("--stop", action="store_true", help="Stop service")

    return parser


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    engine = MurphbeckMarketplaceEngine()
    reporter = MarketplaceReporter()

    if args.command == "status":
        if args.json:
            print(json.dumps(engine.get_project_status(), indent=2, default=str))
        else:
            print(reporter.generate_status_report(engine))

    elif args.command == "build":
        print("Running build...")
        result = engine.run_build(args.service if hasattr(args, 'service') else None)
        status = "✓ SUCCESS" if result.success else "✗ FAILED"
        print(f"\n{status} ({result.duration_seconds:.1f}s)")
        if result.errors:
            print("\nErrors:")
            for error in result.errors[:10]:
                print(f"  - {error}")

    elif args.command == "test":
        test_type = TestType[args.type.upper()]
        print(f"Running {test_type.value} tests...")
        result = engine.run_tests(test_type)
        print(f"\nPassed: {result.passed}")
        print(f"Failed: {result.failed}")
        print(f"Skipped: {result.skipped}")
        if result.coverage:
            print(f"Coverage: {result.coverage}%")

    elif args.command == "vendor":
        if args.vendor_command == "list":
            for vendor in engine.vendor_manager.vendors.values():
                print(reporter.generate_vendor_report(vendor))
                print()
        elif args.vendor_command == "add":
            vendor = engine.vendor_manager.register_vendor(
                args.name, args.email, args.categories or []
            )
            print(f"Vendor registered: {vendor.vendor_id}")

    elif args.command == "product":
        if args.product_command == "list":
            for product in engine.catalog.products.values():
                print(f"{product.product_id}: {product.title} - {product.price.format()}")
        elif args.product_command == "search":
            results = engine.catalog.search_products(args.query)
            print(f"Found {len(results)} products:")
            for product in results:
                print(f"  {product.product_id}: {product.title} - {product.price.format()}")

    elif args.command == "order":
        if args.order_command == "list":
            for order in engine.order_processor.orders.values():
                icon = reporter.ORDER_STATUS_ICONS.get(order.status, "?")
                print(f"{icon} {order.order_id}: {order.total.format()} ({order.status.value})")
        elif args.order_command == "show":
            order = engine.order_processor.orders.get(args.order_id)
            if order:
                print(reporter.generate_order_report(order))
            else:
                print(f"Order not found: {args.order_id}")

    elif args.command == "service":
        status = engine.get_service_status(args.name)
        print(json.dumps(status, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

| Command | Description |
|---------|-------------|
| `/project-murphbeck-marketplace` | Activate project context |
| `/project-murphbeck-marketplace status` | Show project status |
| `/project-murphbeck-marketplace build` | Run build |
| `/project-murphbeck-marketplace test` | Run tests |
| `/project-murphbeck-marketplace vendor list` | List vendors |
| `/project-murphbeck-marketplace order list` | List orders |

---

## USAGE EXAMPLES

### Check Project Status
```bash
python murphbeck_marketplace.py status
```

### Register New Vendor
```bash
python murphbeck_marketplace.py vendor add \
  --name "Artisan Goods Co" \
  --email "vendor@artisan.com" \
  --categories electronics clothing
```

### Search Products
```bash
python murphbeck_marketplace.py product search "wireless headphones"
```

### View Order Details
```bash
python murphbeck_marketplace.py order show abc123def456
```

### Run Payment Tests
```bash
python murphbeck_marketplace.py test --type payment
```

$ARGUMENTS
