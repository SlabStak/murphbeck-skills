# PROJECT.FLIGHTBREAKER.EXE - FlightBreaker Development Environment

You are **PROJECT.FLIGHTBREAKER.EXE** — the development environment and AI assistant for the FlightBreaker project, featuring comprehensive flight disruption prediction and traveler compensation automation tools.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FLIGHTBREAKER PROJECT ENGINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Flight Data   │  │   Prediction    │  │   Compensation  │             │
│  │    Ingestion    │  │     Engine      │  │    Processor    │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           └──────────────┬─────┴────────────────────┘                       │
│                          │                                                  │
│                 ┌────────▼────────┐                                         │
│                 │ FlightBreaker   │                                         │
│                 │    Engine       │                                         │
│                 └────────┬────────┘                                         │
│                          │                                                  │
│    ┌─────────────────────┼─────────────────────┐                           │
│    │                     │                     │                            │
│    ▼                     ▼                     ▼                            │
│ ┌──────────┐       ┌──────────┐         ┌──────────┐                       │
│ │  Airline │       │  Weather │         │  Claims  │                       │
│ │   APIs   │       │  Service │         │  System  │                       │
│ └──────────┘       └──────────┘         └──────────┘                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Processing Pipeline                             │   │
│  │  [Ingest] → [Analyze] → [Predict] → [Alert] → [Claim] → [Track]    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPLETE IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROJECT.FLIGHTBREAKER.EXE - FlightBreaker Development Environment
Flight disruption prediction and compensation automation platform
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from datetime import datetime, timedelta
from pathlib import Path
import subprocess
import hashlib
import json
import re


# ════════════════════════════════════════════════════════════════════════════
# ENUMS - Type-safe classifications for FlightBreaker
# ════════════════════════════════════════════════════════════════════════════

class FlightStatus(Enum):
    """Flight status classifications"""
    SCHEDULED = "scheduled"
    DELAYED = "delayed"
    CANCELLED = "cancelled"
    DIVERTED = "diverted"
    DEPARTED = "departed"
    EN_ROUTE = "en_route"
    LANDED = "landed"
    ARRIVED = "arrived"
    UNKNOWN = "unknown"


class DisruptionType(Enum):
    """Types of flight disruptions"""
    DELAY_SHORT = "delay_short"       # < 2 hours
    DELAY_MEDIUM = "delay_medium"     # 2-3 hours
    DELAY_LONG = "delay_long"         # 3-4 hours
    DELAY_VERY_LONG = "delay_very_long"  # > 4 hours
    CANCELLATION = "cancellation"
    DIVERSION = "diversion"
    MISSED_CONNECTION = "missed_connection"
    DOWNGRADE = "downgrade"
    DENIED_BOARDING = "denied_boarding"
    BAGGAGE_DELAY = "baggage_delay"
    BAGGAGE_LOST = "baggage_lost"


class DisruptionCause(Enum):
    """Causes of flight disruptions"""
    WEATHER = "weather"
    TECHNICAL = "technical"
    CREW = "crew"
    AIR_TRAFFIC = "air_traffic"
    SECURITY = "security"
    AIRPORT_OPERATIONS = "airport_operations"
    STRIKE = "strike"
    EXTRAORDINARY = "extraordinary"
    AIRLINE_FAULT = "airline_fault"
    UNKNOWN = "unknown"


class CompensationType(Enum):
    """Types of compensation"""
    EU261 = "eu261"               # EU 261/2004 regulation
    DOT = "dot"                   # US DOT rules
    MONTREAL = "montreal"         # Montreal Convention
    AIRLINE_VOUCHER = "airline_voucher"
    REFUND = "refund"
    REBOOKING = "rebooking"
    HOTEL = "hotel"
    MEALS = "meals"
    TRANSPORT = "transport"


class ClaimStatus(Enum):
    """Compensation claim status"""
    DRAFT = "draft"
    SUBMITTED = "submitted"
    ACKNOWLEDGED = "acknowledged"
    UNDER_REVIEW = "under_review"
    ADDITIONAL_INFO = "additional_info"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPEALED = "appealed"
    PAID = "paid"
    CLOSED = "closed"


class PredictionConfidence(Enum):
    """Prediction confidence levels"""
    VERY_HIGH = "very_high"      # > 90%
    HIGH = "high"                # 75-90%
    MEDIUM = "medium"            # 50-75%
    LOW = "low"                  # 25-50%
    VERY_LOW = "very_low"        # < 25%


class DataSourceType(Enum):
    """Flight data source types"""
    AIRLINE_API = "airline_api"
    FLIGHTAWARE = "flightaware"
    FLIGHTRADAR24 = "flightradar24"
    AEROAPI = "aeroapi"
    CIRIUM = "cirium"
    OAG = "oag"
    WEATHER_API = "weather_api"
    ATC_DATA = "atc_data"


class AirportType(Enum):
    """Airport type classifications"""
    HUB_MAJOR = "hub_major"
    HUB_REGIONAL = "hub_regional"
    INTERNATIONAL = "international"
    DOMESTIC = "domestic"
    REGIONAL = "regional"
    SMALL = "small"


class RegulationRegion(Enum):
    """Regulatory regions"""
    EU = "eu"
    UK = "uk"
    US = "us"
    CANADA = "canada"
    BRAZIL = "brazil"
    OTHER = "other"


class ComponentType(Enum):
    """System component types"""
    FLIGHT_TRACKER = "flight_tracker"
    PREDICTION_ENGINE = "prediction_engine"
    COMPENSATION_CALCULATOR = "compensation_calculator"
    CLAIM_PROCESSOR = "claim_processor"
    NOTIFICATION_SERVICE = "notification_service"
    DATA_AGGREGATOR = "data_aggregator"
    WEATHER_SERVICE = "weather_service"
    AIRLINE_CONNECTOR = "airline_connector"
    USER_PORTAL = "user_portal"
    ADMIN_DASHBOARD = "admin_dashboard"


class BuildTarget(Enum):
    """Build targets"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TEST = "test"


class TestType(Enum):
    """Test type classifications"""
    UNIT = "unit"
    INTEGRATION = "integration"
    E2E = "e2e"
    PERFORMANCE = "performance"
    API_CONTRACT = "api_contract"


# ════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Structured data models
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class Airport:
    """Represents an airport"""
    code: str
    name: str
    city: str
    country: str
    airport_type: AirportType = AirportType.INTERNATIONAL
    timezone: str = "UTC"
    latitude: float = 0.0
    longitude: float = 0.0
    regulation_region: RegulationRegion = RegulationRegion.OTHER

    def get_distance_to(self, other: 'Airport') -> float:
        """Calculate approximate distance to another airport in km"""
        from math import radians, cos, sin, asin, sqrt
        lat1, lon1 = radians(self.latitude), radians(self.longitude)
        lat2, lon2 = radians(other.latitude), radians(other.longitude)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        return 2 * 6371 * asin(sqrt(a))

    def get_regulation(self) -> RegulationRegion:
        """Determine applicable regulation region"""
        eu_countries = {"DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT", "GR", "IE", "PL"}
        if self.country in eu_countries:
            return RegulationRegion.EU
        elif self.country == "GB":
            return RegulationRegion.UK
        elif self.country == "US":
            return RegulationRegion.US
        return self.regulation_region


@dataclass
class Flight:
    """Represents a flight"""
    flight_number: str
    airline_code: str
    departure_airport: str
    arrival_airport: str
    scheduled_departure: datetime
    scheduled_arrival: datetime
    actual_departure: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    status: FlightStatus = FlightStatus.SCHEDULED
    aircraft_type: str = ""
    distance_km: float = 0.0

    @property
    def delay_minutes(self) -> int:
        """Calculate departure delay in minutes"""
        if not self.actual_departure:
            return 0
        delta = self.actual_departure - self.scheduled_departure
        return int(delta.total_seconds() / 60)

    @property
    def arrival_delay_minutes(self) -> int:
        """Calculate arrival delay in minutes"""
        if not self.actual_arrival:
            return 0
        delta = self.actual_arrival - self.scheduled_arrival
        return int(delta.total_seconds() / 60)

    def get_disruption_type(self) -> Optional[DisruptionType]:
        """Determine disruption type based on delay"""
        if self.status == FlightStatus.CANCELLED:
            return DisruptionType.CANCELLATION
        elif self.status == FlightStatus.DIVERTED:
            return DisruptionType.DIVERSION

        delay = self.arrival_delay_minutes
        if delay < 120:
            return DisruptionType.DELAY_SHORT if delay > 0 else None
        elif delay < 180:
            return DisruptionType.DELAY_MEDIUM
        elif delay < 240:
            return DisruptionType.DELAY_LONG
        else:
            return DisruptionType.DELAY_VERY_LONG

    def is_eligible_for_compensation(self) -> bool:
        """Check if flight disruption is eligible for compensation"""
        disruption = self.get_disruption_type()
        if not disruption:
            return False
        return disruption in [
            DisruptionType.DELAY_LONG,
            DisruptionType.DELAY_VERY_LONG,
            DisruptionType.CANCELLATION,
            DisruptionType.DENIED_BOARDING
        ]


@dataclass
class DisruptionPrediction:
    """Prediction of flight disruption"""
    prediction_id: str
    flight_number: str
    predicted_disruption: Optional[DisruptionType]
    probability: float
    confidence: PredictionConfidence
    predicted_delay_minutes: int = 0
    factors: List[str] = field(default_factory=list)
    generated_at: datetime = field(default_factory=datetime.now)

    def get_confidence_from_probability(self) -> PredictionConfidence:
        """Determine confidence level from probability"""
        if self.probability >= 0.9:
            return PredictionConfidence.VERY_HIGH
        elif self.probability >= 0.75:
            return PredictionConfidence.HIGH
        elif self.probability >= 0.5:
            return PredictionConfidence.MEDIUM
        elif self.probability >= 0.25:
            return PredictionConfidence.LOW
        return PredictionConfidence.VERY_LOW

    def should_alert(self, threshold: float = 0.6) -> bool:
        """Determine if prediction warrants an alert"""
        return self.probability >= threshold and self.predicted_disruption is not None


@dataclass
class CompensationAmount:
    """Calculated compensation amount"""
    amount_eur: float
    regulation: CompensationType
    breakdown: Dict[str, float] = field(default_factory=dict)
    currency: str = "EUR"

    def to_currency(self, target_currency: str, exchange_rate: float) -> float:
        """Convert to target currency"""
        return self.amount_eur * exchange_rate

    def get_total_with_expenses(self, expenses: Dict[str, float]) -> float:
        """Get total including claimable expenses"""
        return self.amount_eur + sum(expenses.values())


@dataclass
class Claim:
    """Compensation claim"""
    claim_id: str
    flight: Flight
    passenger_name: str
    passenger_email: str
    disruption_type: DisruptionType
    cause: DisruptionCause
    compensation: CompensationAmount
    status: ClaimStatus = ClaimStatus.DRAFT
    submitted_at: Optional[datetime] = None
    documents: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    airline_reference: str = ""

    def can_submit(self) -> Tuple[bool, List[str]]:
        """Check if claim can be submitted"""
        errors = []
        if not self.passenger_name:
            errors.append("Passenger name required")
        if not self.passenger_email:
            errors.append("Passenger email required")
        if self.cause == DisruptionCause.EXTRAORDINARY:
            errors.append("Extraordinary circumstances may not be compensable")
        if not self.flight.is_eligible_for_compensation():
            errors.append("Flight disruption not eligible for compensation")
        return len(errors) == 0, errors

    def submit(self) -> bool:
        """Submit the claim"""
        can_submit, _ = self.can_submit()
        if can_submit:
            self.status = ClaimStatus.SUBMITTED
            self.submitted_at = datetime.now()
            return True
        return False

    def get_timeline(self) -> List[Dict[str, Any]]:
        """Get claim timeline"""
        events = []
        events.append({"date": self.flight.scheduled_departure, "event": "Flight scheduled"})
        if self.submitted_at:
            events.append({"date": self.submitted_at, "event": "Claim submitted"})
        return sorted(events, key=lambda x: x["date"])


@dataclass
class GitStatus:
    """Git repository status"""
    branch: str
    is_clean: bool
    modified_files: List[str] = field(default_factory=list)
    untracked_files: List[str] = field(default_factory=list)
    staged_files: List[str] = field(default_factory=list)
    commits_ahead: int = 0
    commits_behind: int = 0
    last_commit_hash: str = ""
    last_commit_message: str = ""

    def get_status_indicator(self) -> str:
        """Get visual status indicator"""
        if self.is_clean:
            return "●"
        elif self.staged_files:
            return "◐"
        return "○"


@dataclass
class BuildResult:
    """Build operation result"""
    build_id: str
    target: BuildTarget
    success: bool
    started_at: datetime
    duration_seconds: float = 0.0
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def get_status_icon(self) -> str:
        if self.success:
            return "✓"
        return "✗"


@dataclass
class TestResult:
    """Test execution result"""
    test_id: str
    test_type: TestType
    passed: int = 0
    failed: int = 0
    skipped: int = 0
    duration_seconds: float = 0.0
    coverage_percent: float = 0.0

    @property
    def total(self) -> int:
        return self.passed + self.failed + self.skipped

    @property
    def pass_rate(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.passed / self.total) * 100

    def get_status_icon(self) -> str:
        if self.failed == 0:
            return "✓"
        return "✗"


@dataclass
class ComponentStatus:
    """Status of a system component"""
    component: ComponentType
    healthy: bool
    last_check: datetime
    response_time_ms: float = 0.0
    error_message: str = ""

    def get_status_icon(self) -> str:
        return "●" if self.healthy else "○"


# ════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Core business logic
# ════════════════════════════════════════════════════════════════════════════

class GitManager:
    """Manages git operations"""

    def __init__(self, project_path: Path):
        self.project_path = project_path

    def get_status(self) -> GitStatus:
        """Get comprehensive git status"""
        try:
            branch = self._run_git("rev-parse", "--abbrev-ref", "HEAD").strip()
            status_output = self._run_git("status", "--porcelain")

            modified, untracked, staged = [], [], []
            for line in status_output.strip().split("\n"):
                if not line:
                    continue
                code = line[:2]
                filepath = line[3:]
                if code[0] in "MADRC":
                    staged.append(filepath)
                if code[1] == "M":
                    modified.append(filepath)
                elif code == "??":
                    untracked.append(filepath)

            last_hash = self._run_git("rev-parse", "--short", "HEAD").strip()
            last_msg = self._run_git("log", "-1", "--format=%s").strip()

            return GitStatus(
                branch=branch,
                is_clean=not (modified or untracked or staged),
                modified_files=modified,
                untracked_files=untracked,
                staged_files=staged,
                last_commit_hash=last_hash,
                last_commit_message=last_msg
            )
        except:
            return GitStatus(branch="unknown", is_clean=False)

    def _run_git(self, *args) -> str:
        result = subprocess.run(
            ["git"] + list(args),
            cwd=self.project_path,
            capture_output=True,
            text=True
        )
        return result.stdout


class CompensationCalculator:
    """Calculates compensation amounts based on regulations"""

    # EU 261/2004 compensation amounts (EUR)
    EU261_AMOUNTS = {
        "short": 250,    # < 1500 km
        "medium": 400,   # 1500-3500 km
        "long": 600      # > 3500 km
    }

    def calculate_eu261(self, flight: Flight, distance_km: float) -> CompensationAmount:
        """Calculate EU 261/2004 compensation"""
        if distance_km < 1500:
            amount = self.EU261_AMOUNTS["short"]
            category = "short"
        elif distance_km < 3500:
            amount = self.EU261_AMOUNTS["medium"]
            category = "medium"
        else:
            amount = self.EU261_AMOUNTS["long"]
            category = "long"

        # 50% reduction for delays if offered rebooking
        disruption = flight.get_disruption_type()
        if disruption in [DisruptionType.DELAY_LONG, DisruptionType.DELAY_MEDIUM]:
            amount = amount * 0.5

        return CompensationAmount(
            amount_eur=amount,
            regulation=CompensationType.EU261,
            breakdown={
                "base_amount": amount,
                "distance_category": category,
                "distance_km": distance_km
            }
        )

    def calculate(self, flight: Flight, departure_airport: Airport,
                  arrival_airport: Airport) -> Optional[CompensationAmount]:
        """Calculate compensation based on applicable regulation"""
        distance = departure_airport.get_distance_to(arrival_airport)

        # Determine applicable regulation
        dep_region = departure_airport.get_regulation()
        arr_region = arrival_airport.get_regulation()

        if dep_region in [RegulationRegion.EU, RegulationRegion.UK]:
            return self.calculate_eu261(flight, distance)

        # US DOT doesn't have fixed compensation amounts
        if dep_region == RegulationRegion.US or arr_region == RegulationRegion.US:
            if flight.status == FlightStatus.CANCELLED:
                return CompensationAmount(
                    amount_eur=0,  # Full refund required
                    regulation=CompensationType.DOT,
                    breakdown={"note": "Full refund required for cancellations"}
                )

        return None


class PredictionEngine:
    """Predicts flight disruptions"""

    # Historical delay factors by cause
    DELAY_FACTORS = {
        "weather": 0.35,
        "airline_history": 0.25,
        "airport_congestion": 0.20,
        "time_of_day": 0.10,
        "day_of_week": 0.10
    }

    def predict(self, flight: Flight, weather_score: float = 0.5,
                airline_score: float = 0.5, congestion_score: float = 0.5) -> DisruptionPrediction:
        """Generate disruption prediction"""
        prediction_id = hashlib.sha256(
            f"{flight.flight_number}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        # Calculate weighted probability
        factors = []
        weighted_score = 0.0

        weather_contribution = weather_score * self.DELAY_FACTORS["weather"]
        weighted_score += weather_contribution
        if weather_score > 0.6:
            factors.append(f"Weather risk: {weather_score:.0%}")

        airline_contribution = airline_score * self.DELAY_FACTORS["airline_history"]
        weighted_score += airline_contribution
        if airline_score > 0.5:
            factors.append(f"Airline delay history: {airline_score:.0%}")

        congestion_contribution = congestion_score * self.DELAY_FACTORS["airport_congestion"]
        weighted_score += congestion_contribution
        if congestion_score > 0.5:
            factors.append(f"Airport congestion: {congestion_score:.0%}")

        # Determine predicted disruption type
        predicted_disruption = None
        predicted_delay = 0

        if weighted_score > 0.7:
            predicted_disruption = DisruptionType.DELAY_LONG
            predicted_delay = 200
        elif weighted_score > 0.5:
            predicted_disruption = DisruptionType.DELAY_MEDIUM
            predicted_delay = 150
        elif weighted_score > 0.3:
            predicted_disruption = DisruptionType.DELAY_SHORT
            predicted_delay = 60

        prediction = DisruptionPrediction(
            prediction_id=prediction_id,
            flight_number=flight.flight_number,
            predicted_disruption=predicted_disruption,
            probability=weighted_score,
            confidence=PredictionConfidence.MEDIUM,
            predicted_delay_minutes=predicted_delay,
            factors=factors
        )
        prediction.confidence = prediction.get_confidence_from_probability()

        return prediction


class ClaimProcessor:
    """Processes compensation claims"""

    def __init__(self):
        self.claims: Dict[str, Claim] = {}

    def create_claim(self, flight: Flight, passenger_name: str,
                     passenger_email: str, compensation: CompensationAmount) -> Claim:
        """Create a new compensation claim"""
        claim_id = hashlib.sha256(
            f"claim:{flight.flight_number}:{passenger_email}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        disruption = flight.get_disruption_type() or DisruptionType.DELAY_SHORT

        claim = Claim(
            claim_id=claim_id,
            flight=flight,
            passenger_name=passenger_name,
            passenger_email=passenger_email,
            disruption_type=disruption,
            cause=DisruptionCause.UNKNOWN,
            compensation=compensation
        )

        self.claims[claim_id] = claim
        return claim

    def submit_claim(self, claim_id: str) -> Tuple[bool, str]:
        """Submit a claim"""
        claim = self.claims.get(claim_id)
        if not claim:
            return False, "Claim not found"

        can_submit, errors = claim.can_submit()
        if not can_submit:
            return False, "; ".join(errors)

        claim.submit()
        return True, f"Claim {claim_id} submitted successfully"

    def get_claims_by_status(self, status: ClaimStatus) -> List[Claim]:
        """Get claims by status"""
        return [c for c in self.claims.values() if c.status == status]


class FlightBreakerEngine:
    """Main orchestrator for FlightBreaker project"""

    PROJECT_CONFIG = {
        "name": "FlightBreaker",
        "type": "Flight Disruption Platform",
        "version": "1.0.0",
        "description": "Flight disruption prediction and compensation automation"
    }

    COMPONENTS = [
        ComponentType.FLIGHT_TRACKER,
        ComponentType.PREDICTION_ENGINE,
        ComponentType.COMPENSATION_CALCULATOR,
        ComponentType.CLAIM_PROCESSOR,
        ComponentType.NOTIFICATION_SERVICE,
        ComponentType.DATA_AGGREGATOR,
        ComponentType.WEATHER_SERVICE,
        ComponentType.USER_PORTAL
    ]

    def __init__(self, project_path: Optional[Path] = None):
        self.project_path = project_path or Path.cwd()
        self.git_manager = GitManager(self.project_path)
        self.compensation_calculator = CompensationCalculator()
        self.prediction_engine = PredictionEngine()
        self.claim_processor = ClaimProcessor()
        self.component_status: Dict[ComponentType, ComponentStatus] = {}
        self._init_components()

    def _init_components(self):
        """Initialize component status"""
        for comp in self.COMPONENTS:
            self.component_status[comp] = ComponentStatus(
                component=comp,
                healthy=True,
                last_check=datetime.now()
            )

    def get_project_status(self) -> Dict[str, Any]:
        """Get comprehensive project status"""
        git_status = self.git_manager.get_status()
        healthy_count = sum(1 for c in self.component_status.values() if c.healthy)

        return {
            "project": self.PROJECT_CONFIG,
            "git": {
                "branch": git_status.branch,
                "status": "clean" if git_status.is_clean else "modified",
                "last_commit": git_status.last_commit_hash
            },
            "components": {
                "total": len(self.COMPONENTS),
                "healthy": healthy_count
            },
            "claims": {
                "total": len(self.claim_processor.claims),
                "pending": len(self.claim_processor.get_claims_by_status(ClaimStatus.SUBMITTED))
            }
        }

    def check_flight(self, flight: Flight, dep_airport: Airport,
                     arr_airport: Airport) -> Dict[str, Any]:
        """Check flight status and eligibility"""
        prediction = self.prediction_engine.predict(flight)
        compensation = None

        if flight.is_eligible_for_compensation():
            compensation = self.compensation_calculator.calculate(
                flight, dep_airport, arr_airport
            )

        return {
            "flight": flight.flight_number,
            "status": flight.status.value,
            "delay_minutes": flight.delay_minutes,
            "prediction": {
                "disruption": prediction.predicted_disruption.value if prediction.predicted_disruption else None,
                "probability": prediction.probability,
                "confidence": prediction.confidence.value
            },
            "eligible": flight.is_eligible_for_compensation(),
            "compensation": compensation.amount_eur if compensation else 0
        }


# ════════════════════════════════════════════════════════════════════════════
# REPORTER CLASS - Visual output formatting
# ════════════════════════════════════════════════════════════════════════════

class FlightBreakerReporter:
    """Generates visual reports"""

    STATUS_ICONS = {
        "healthy": "●",
        "degraded": "◐",
        "down": "○",
        "success": "✓",
        "failure": "✗",
        "warning": "⚠"
    }

    DISRUPTION_ICONS = {
        DisruptionType.DELAY_SHORT: "🕐",
        DisruptionType.DELAY_MEDIUM: "🕑",
        DisruptionType.DELAY_LONG: "🕒",
        DisruptionType.DELAY_VERY_LONG: "🕓",
        DisruptionType.CANCELLATION: "❌",
        DisruptionType.DIVERSION: "↪",
        DisruptionType.DENIED_BOARDING: "🚫"
    }

    def __init__(self, engine: FlightBreakerEngine):
        self.engine = engine

    def generate_status_report(self) -> str:
        """Generate comprehensive status report"""
        status = self.engine.get_project_status()
        git_status = self.engine.git_manager.get_status()

        components_str = ""
        for comp, comp_status in self.engine.component_status.items():
            icon = self.STATUS_ICONS["healthy"] if comp_status.healthy else self.STATUS_ICONS["down"]
            name = comp.value.replace("_", " ").title()
            components_str += f"│ {name:<20} │ {icon}      │\n"

        report = f"""
PROJECT: FLIGHTBREAKER
{'═' * 55}
Status: Active
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
{'═' * 55}

PROJECT STATUS
{'─' * 40}
┌─────────────────────────────────────────┐
│       FLIGHTBREAKER                     │
│                                         │
│  Branch: {git_status.branch:<28} │
│  Status: {git_status.get_status_indicator()} {'clean' if git_status.is_clean else 'modified':<26} │
│                                         │
│  Commits Ahead: {git_status.commits_ahead:<21} │
│  Commits Behind: {git_status.commits_behind:<20} │
│                                         │
│  Last Commit: {git_status.last_commit_hash:<23} │
└─────────────────────────────────────────┘

CORE COMPONENTS
{'─' * 40}
| Component              | Status |
|------------------------|--------|
{components_str}
PROJECT STRUCTURE
{'─' * 40}
┌─────────────────────────────────────────┐
│  /flightbreaker                         │
│  ├── /src                               │
│  │   ├── /core          (engine)        │
│  │   ├── /services      (integrations)  │
│  │   ├── /utils         (helpers)       │
│  │   └── /api           (endpoints)     │
│  ├── /tests                             │
│  ├── /config                            │
│  └── /docs                              │
└─────────────────────────────────────────┘

ACTIVE CLAIMS
{'─' * 40}
| Status      | Count |
|-------------|-------|
| Submitted   | {len(self.engine.claim_processor.get_claims_by_status(ClaimStatus.SUBMITTED)):<5} |
| Under Review| {len(self.engine.claim_processor.get_claims_by_status(ClaimStatus.UNDER_REVIEW)):<5} |
| Approved    | {len(self.engine.claim_processor.get_claims_by_status(ClaimStatus.APPROVED)):<5} |

Project Ready: {self.STATUS_ICONS['success']} FlightBreaker Active
"""
        return report

    def generate_progress_bar(self, value: float, max_value: float = 100, width: int = 20) -> str:
        """Generate visual progress bar"""
        filled = int((value / max_value) * width)
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}] {value:.1f}%"


# ════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════

def create_cli():
    """Create CLI argument parser"""
    import argparse

    parser = argparse.ArgumentParser(
        prog="project-flightbreaker",
        description="FlightBreaker Development Environment"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show project status")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Build command
    build_parser = subparsers.add_parser("build", help="Run build")
    build_parser.add_argument("--target", choices=["development", "staging", "production"],
                              default="development")

    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests")
    test_parser.add_argument("--type", choices=["unit", "integration", "e2e"], default="unit")

    # Check command
    check_parser = subparsers.add_parser("check", help="Check flight status")
    check_parser.add_argument("flight_number", help="Flight number to check")

    # Claim command
    claim_parser = subparsers.add_parser("claim", help="Manage claims")
    claim_parser.add_argument("action", choices=["create", "list", "submit", "status"])
    claim_parser.add_argument("--id", help="Claim ID")

    # Predict command
    predict_parser = subparsers.add_parser("predict", help="Predict disruption")
    predict_parser.add_argument("flight_number", help="Flight number")

    return parser


def main():
    """Main CLI entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = FlightBreakerEngine()
    reporter = FlightBreakerReporter(engine)

    if args.command == "status":
        if hasattr(args, 'json') and args.json:
            print(json.dumps(engine.get_project_status(), indent=2, default=str))
        else:
            print(reporter.generate_status_report())

    elif args.command == "claim":
        if args.action == "list":
            for claim in engine.claim_processor.claims.values():
                print(f"  {claim.claim_id}: {claim.status.value}")

    else:
        print(reporter.generate_status_report())


if __name__ == "__main__":
    main()
```

---

## USAGE EXAMPLES

### Basic Operations
```bash
# Show project status
/project-flightbreaker status

# Run build
/project-flightbreaker build --target development

# Run tests
/project-flightbreaker test --type unit

# Check flight
/project-flightbreaker check UA123
```

### Claim Management
```bash
# List claims
/project-flightbreaker claim list

# Submit claim
/project-flightbreaker claim submit --id abc123
```

---

## QUICK COMMANDS

| Command | Description |
|---------|-------------|
| `/project-flightbreaker` | Activate project context |
| `/project-flightbreaker status` | Show project status |
| `/project-flightbreaker build` | Run build |
| `/project-flightbreaker test` | Run tests |
| `/project-flightbreaker check` | Check flight status |
| `/project-flightbreaker claim` | Manage claims |

$ARGUMENTS
