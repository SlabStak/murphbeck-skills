# VULCAN.EXE - Build & Forge Engine Agent

You are VULCAN.EXE — the master builder and infrastructure architect for constructing complete systems, environments, and technology stacks from the ground up.

MISSION
Build, configure, and assemble complete systems from infrastructure to application layer with precision and reliability. Blueprint it. Build it. Harden it.

---

## CAPABILITIES

### ArchitectPlanner.MOD
- System requirements analysis
- Technology stack selection
- Layer architecture design
- Dependency mapping
- Scalability planning

### InfraBuilder.MOD
- Cloud infrastructure setup
- Container orchestration
- Network configuration
- Service deployment
- Environment provisioning

### IntegrationEngine.MOD
- Component integration
- API connection
- Service mesh setup
- Data pipeline creation
- Third-party linking

### HardeningSystem.MOD
- Security implementation
- Performance optimization
- Monitoring deployment
- Backup configuration
- Disaster recovery setup

---

## WORKFLOW

### Phase 1: BLUEPRINT
1. Define system requirements
2. Select technology stack
3. Plan architecture layers
4. Identify all dependencies
5. Design scaling strategy

### Phase 2: FOUNDATION
1. Set up infrastructure base
2. Configure environments
3. Establish networking
4. Deploy core services
5. Initialize databases

### Phase 3: CONSTRUCT
1. Build application layers
2. Integrate all components
3. Configure tooling chain
4. Set up CI/CD pipelines
5. Deploy microservices

### Phase 4: HARDEN
1. Apply security measures
2. Optimize performance
3. Add monitoring/alerting
4. Document architecture
5. Test disaster recovery

---

## BUILD TYPES

| Type | Scope | Components |
|------|-------|------------|
| Infrastructure | Cloud/servers | VPC, EC2, RDS |
| Application | Full-stack | Frontend, API, DB |
| Platform | Complete system | Infra + App + DevOps |
| Environment | Staging/Prod | Config, secrets, endpoints |
| Microservice | Single service | Container, API, DB |

---

## VULCAN ENGINE - PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
VULCAN.EXE - Build & Forge Engine
Production infrastructure and system building engine.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set, Tuple
from enum import Enum, auto
from datetime import datetime
import json
import re
from abc import ABC, abstractmethod


# ============================================================
# ENUMS - Type-Safe Classifications
# ============================================================

class BuildType(Enum):
    """Types of builds VULCAN can execute."""
    INFRASTRUCTURE = "infrastructure"
    APPLICATION = "application"
    PLATFORM = "platform"
    ENVIRONMENT = "environment"
    MICROSERVICE = "microservice"
    API_GATEWAY = "api_gateway"
    DATA_PIPELINE = "data_pipeline"
    ML_PLATFORM = "ml_platform"
    SERVERLESS = "serverless"
    MONOLITH = "monolith"
    HYBRID = "hybrid"


class CloudProvider(Enum):
    """Supported cloud providers."""
    AWS = "aws"
    GCP = "gcp"
    AZURE = "azure"
    DIGITALOCEAN = "digitalocean"
    VERCEL = "vercel"
    CLOUDFLARE = "cloudflare"
    LINODE = "linode"
    VULTR = "vultr"
    HEROKU = "heroku"
    RAILWAY = "railway"
    RENDER = "render"
    FLY_IO = "fly_io"
    ON_PREMISE = "on_premise"


class ComponentType(Enum):
    """Types of system components."""
    FRONTEND = "frontend"
    BACKEND = "backend"
    DATABASE = "database"
    CACHE = "cache"
    QUEUE = "queue"
    STORAGE = "storage"
    CDN = "cdn"
    LOAD_BALANCER = "load_balancer"
    API_GATEWAY = "api_gateway"
    AUTH_SERVICE = "auth_service"
    MONITORING = "monitoring"
    LOGGING = "logging"
    SECRETS = "secrets"
    DNS = "dns"
    FIREWALL = "firewall"
    CONTAINER_REGISTRY = "container_registry"


class FrameworkType(Enum):
    """Application frameworks."""
    # Frontend
    NEXTJS = "nextjs"
    REACT = "react"
    VUE = "vue"
    SVELTE = "svelte"
    ANGULAR = "angular"
    ASTRO = "astro"
    # Backend
    FASTAPI = "fastapi"
    DJANGO = "django"
    FLASK = "flask"
    EXPRESS = "express"
    NESTJS = "nestjs"
    RAILS = "rails"
    SPRING = "spring"
    GOLANG = "golang"
    RUST_ACTIX = "rust_actix"
    # Fullstack
    REMIX = "remix"
    NUXT = "nuxt"
    SVELTEKIT = "sveltekit"


class DatabaseType(Enum):
    """Database systems."""
    POSTGRESQL = "postgresql"
    MYSQL = "mysql"
    MONGODB = "mongodb"
    REDIS = "redis"
    ELASTICSEARCH = "elasticsearch"
    DYNAMODB = "dynamodb"
    FIRESTORE = "firestore"
    SUPABASE = "supabase"
    PLANETSCALE = "planetscale"
    COCKROACHDB = "cockroachdb"
    SQLITE = "sqlite"
    NEO4J = "neo4j"
    CASSANDRA = "cassandra"


class ContainerOrchestrator(Enum):
    """Container orchestration platforms."""
    KUBERNETES = "kubernetes"
    DOCKER_SWARM = "docker_swarm"
    ECS = "ecs"
    CLOUD_RUN = "cloud_run"
    APP_RUNNER = "app_runner"
    DOCKER_COMPOSE = "docker_compose"
    NOMAD = "nomad"
    NONE = "none"


class EnvironmentType(Enum):
    """Deployment environments."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    PREVIEW = "preview"
    QA = "qa"
    SANDBOX = "sandbox"


class SecurityLevel(Enum):
    """Security hardening levels."""
    BASIC = "basic"
    STANDARD = "standard"
    ENHANCED = "enhanced"
    MAXIMUM = "maximum"
    COMPLIANCE = "compliance"  # SOC2, HIPAA, etc.


class ScalingStrategy(Enum):
    """Auto-scaling strategies."""
    NONE = "none"
    HORIZONTAL = "horizontal"
    VERTICAL = "vertical"
    HYBRID = "hybrid"
    SERVERLESS = "serverless"


class BuildPhase(Enum):
    """Build execution phases."""
    BLUEPRINT = "blueprint"
    FOUNDATION = "foundation"
    CONSTRUCT = "construct"
    INTEGRATE = "integrate"
    HARDEN = "harden"
    DEPLOY = "deploy"
    VERIFY = "verify"


class ComponentStatus(Enum):
    """Component build status."""
    PENDING = "pending"
    BUILDING = "building"
    CONFIGURING = "configuring"
    INTEGRATING = "integrating"
    TESTING = "testing"
    DEPLOYED = "deployed"
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


class CICDPlatform(Enum):
    """CI/CD platforms."""
    GITHUB_ACTIONS = "github_actions"
    GITLAB_CI = "gitlab_ci"
    CIRCLECI = "circleci"
    JENKINS = "jenkins"
    ARGOCD = "argocd"
    FLUX = "flux"
    DRONE = "drone"
    BUILDKITE = "buildkite"
    AZURE_DEVOPS = "azure_devops"


# ============================================================
# DATA CLASSES - Structured Data Models
# ============================================================

@dataclass
class ResourceSpec:
    """Infrastructure resource specification."""
    cpu: str = "1 vCPU"
    memory: str = "2 GB"
    storage: str = "20 GB"
    iops: Optional[int] = None
    network: str = "standard"
    gpu: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cpu": self.cpu,
            "memory": self.memory,
            "storage": self.storage,
            "iops": self.iops,
            "network": self.network,
            "gpu": self.gpu
        }

    def estimate_monthly_cost(self, provider: CloudProvider) -> float:
        """Estimate monthly cost based on provider pricing."""
        base_costs = {
            CloudProvider.AWS: {"cpu": 20, "memory": 5, "storage": 0.10},
            CloudProvider.GCP: {"cpu": 18, "memory": 4.5, "storage": 0.08},
            CloudProvider.AZURE: {"cpu": 19, "memory": 5, "storage": 0.09},
            CloudProvider.DIGITALOCEAN: {"cpu": 10, "memory": 2.5, "storage": 0.10},
            CloudProvider.VERCEL: {"cpu": 0, "memory": 0, "storage": 0},
            CloudProvider.RAILWAY: {"cpu": 12, "memory": 3, "storage": 0.05},
        }

        costs = base_costs.get(provider, base_costs[CloudProvider.AWS])

        cpu_count = float(re.search(r'(\d+)', self.cpu).group(1)) if re.search(r'(\d+)', self.cpu) else 1
        mem_gb = float(re.search(r'(\d+)', self.memory).group(1)) if re.search(r'(\d+)', self.memory) else 2
        storage_gb = float(re.search(r'(\d+)', self.storage).group(1)) if re.search(r'(\d+)', self.storage) else 20

        return (cpu_count * costs["cpu"] + mem_gb * costs["memory"] +
                storage_gb * costs["storage"])


@dataclass
class NetworkConfig:
    """Network configuration specification."""
    vpc_cidr: str = "10.0.0.0/16"
    public_subnets: List[str] = field(default_factory=lambda: ["10.0.1.0/24", "10.0.2.0/24"])
    private_subnets: List[str] = field(default_factory=lambda: ["10.0.10.0/24", "10.0.11.0/24"])
    availability_zones: int = 2
    nat_gateway: bool = True
    vpn_enabled: bool = False

    def to_terraform(self) -> str:
        """Generate Terraform network configuration."""
        return f'''
resource "aws_vpc" "main" {{
  cidr_block           = "{self.vpc_cidr}"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {{
    Name = "${{var.project_name}}-vpc"
  }}
}}

resource "aws_subnet" "public" {{
  count             = {len(self.public_subnets)}
  vpc_id            = aws_vpc.main.id
  cidr_block        = element({json.dumps(self.public_subnets)}, count.index)
  availability_zone = element(data.aws_availability_zones.available.names, count.index)

  map_public_ip_on_launch = true

  tags = {{
    Name = "${{var.project_name}}-public-${{count.index}}"
  }}
}}

resource "aws_subnet" "private" {{
  count             = {len(self.private_subnets)}
  vpc_id            = aws_vpc.main.id
  cidr_block        = element({json.dumps(self.private_subnets)}, count.index)
  availability_zone = element(data.aws_availability_zones.available.names, count.index)

  tags = {{
    Name = "${{var.project_name}}-private-${{count.index}}"
  }}
}}
'''


@dataclass
class DatabaseConfig:
    """Database configuration specification."""
    db_type: DatabaseType
    version: str
    instance_size: str = "small"
    storage_gb: int = 20
    replicas: int = 0
    backup_retention_days: int = 7
    multi_az: bool = False
    encryption_enabled: bool = True
    connection_string_template: str = ""

    def __post_init__(self):
        if not self.connection_string_template:
            templates = {
                DatabaseType.POSTGRESQL: "postgresql://{user}:{password}@{host}:{port}/{database}",
                DatabaseType.MYSQL: "mysql://{user}:{password}@{host}:{port}/{database}",
                DatabaseType.MONGODB: "mongodb://{user}:{password}@{host}:{port}/{database}",
                DatabaseType.REDIS: "redis://:{password}@{host}:{port}",
            }
            self.connection_string_template = templates.get(
                self.db_type, "host={host} port={port} dbname={database}"
            )


@dataclass
class ServiceConfig:
    """Microservice configuration."""
    name: str
    component_type: ComponentType
    framework: Optional[FrameworkType] = None
    port: int = 8080
    replicas: int = 1
    resources: ResourceSpec = field(default_factory=ResourceSpec)
    health_check_path: str = "/health"
    environment_vars: Dict[str, str] = field(default_factory=dict)
    secrets: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)

    def to_kubernetes_deployment(self) -> str:
        """Generate Kubernetes deployment YAML."""
        env_section = ""
        if self.environment_vars:
            env_items = "\n        ".join([
                f"- name: {k}\n          value: \"{v}\""
                for k, v in self.environment_vars.items()
            ])
            env_section = f"\n        env:\n        {env_items}"

        secret_section = ""
        if self.secrets:
            secret_items = "\n        ".join([
                f"- name: {s}\n          valueFrom:\n            secretKeyRef:\n              name: app-secrets\n              key: {s}"
                for s in self.secrets
            ])
            secret_section = f"\n        {secret_items}"

        return f'''apiVersion: apps/v1
kind: Deployment
metadata:
  name: {self.name}
  labels:
    app: {self.name}
spec:
  replicas: {self.replicas}
  selector:
    matchLabels:
      app: {self.name}
  template:
    metadata:
      labels:
        app: {self.name}
    spec:
      containers:
      - name: {self.name}
        image: ${{REGISTRY}}/{self.name}:${{VERSION}}
        ports:
        - containerPort: {self.port}
        resources:
          requests:
            cpu: "{self.resources.cpu}"
            memory: "{self.resources.memory}"
          limits:
            cpu: "{self.resources.cpu}"
            memory: "{self.resources.memory}"{env_section}{secret_section}
        livenessProbe:
          httpGet:
            path: {self.health_check_path}
            port: {self.port}
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: {self.health_check_path}
            port: {self.port}
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: {self.name}
spec:
  selector:
    app: {self.name}
  ports:
  - port: {self.port}
    targetPort: {self.port}
  type: ClusterIP
'''


@dataclass
class SecurityConfig:
    """Security hardening configuration."""
    level: SecurityLevel
    ssl_enabled: bool = True
    firewall_rules: List[Dict[str, Any]] = field(default_factory=list)
    secrets_manager: str = "vault"
    iam_roles: List[str] = field(default_factory=list)
    encryption_at_rest: bool = True
    encryption_in_transit: bool = True
    audit_logging: bool = True
    vulnerability_scanning: bool = True
    waf_enabled: bool = False
    ddos_protection: bool = False

    def get_checklist(self) -> List[Dict[str, bool]]:
        """Generate security checklist based on level."""
        base_checks = [
            {"SSL/TLS Configuration": self.ssl_enabled},
            {"Firewall Rules": len(self.firewall_rules) > 0},
            {"Secrets Management": self.secrets_manager != ""},
            {"IAM Roles Configured": len(self.iam_roles) > 0},
            {"Encryption at Rest": self.encryption_at_rest},
            {"Encryption in Transit": self.encryption_in_transit},
        ]

        if self.level in [SecurityLevel.ENHANCED, SecurityLevel.MAXIMUM, SecurityLevel.COMPLIANCE]:
            base_checks.extend([
                {"Audit Logging": self.audit_logging},
                {"Vulnerability Scanning": self.vulnerability_scanning},
            ])

        if self.level in [SecurityLevel.MAXIMUM, SecurityLevel.COMPLIANCE]:
            base_checks.extend([
                {"WAF Enabled": self.waf_enabled},
                {"DDoS Protection": self.ddos_protection},
            ])

        return base_checks


@dataclass
class MonitoringConfig:
    """Monitoring and observability configuration."""
    metrics_enabled: bool = True
    logging_enabled: bool = True
    tracing_enabled: bool = False
    alerting_enabled: bool = True
    metrics_provider: str = "prometheus"
    logging_provider: str = "loki"
    tracing_provider: str = "jaeger"
    alert_channels: List[str] = field(default_factory=lambda: ["slack", "email"])
    dashboards: List[str] = field(default_factory=lambda: ["system", "application", "business"])
    retention_days: int = 30


@dataclass
class CICDConfig:
    """CI/CD pipeline configuration."""
    platform: CICDPlatform
    auto_deploy: bool = True
    environments: List[EnvironmentType] = field(default_factory=lambda: [
        EnvironmentType.DEVELOPMENT, EnvironmentType.STAGING, EnvironmentType.PRODUCTION
    ])
    branch_strategy: str = "gitflow"
    test_stages: List[str] = field(default_factory=lambda: ["lint", "unit", "integration", "e2e"])
    approval_required: Dict[str, bool] = field(default_factory=lambda: {
        "staging": False, "production": True
    })

    def generate_github_workflow(self, service_name: str) -> str:
        """Generate GitHub Actions workflow."""
        return f'''name: {service_name} CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{{{ github.repository }}}}/{service_name}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{{{ env.REGISTRY }}}}
          username: ${{{{ github.actor }}}}
          password: ${{{{ secrets.GITHUB_TOKEN }}}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:${{{{ github.sha }}}}
            ${{{{ env.REGISTRY }}}}/${{{{ env.IMAGE_NAME }}}}:latest

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Deploy to Staging
        run: |
          echo "Deploying to staging..."
          # Add deployment commands here

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to Production
        run: |
          echo "Deploying to production..."
          # Add deployment commands here
'''


@dataclass
class Component:
    """Built component tracking."""
    name: str
    component_type: ComponentType
    status: ComponentStatus = ComponentStatus.PENDING
    health: str = "unknown"
    config: Optional[ServiceConfig] = None
    endpoint: Optional[str] = None
    dependencies_met: bool = False
    build_logs: List[str] = field(default_factory=list)

    def add_log(self, message: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.build_logs.append(f"[{timestamp}] {message}")


@dataclass
class TechStack:
    """Complete technology stack specification."""
    name: str
    frontend: Optional[FrameworkType] = None
    backend: Optional[FrameworkType] = None
    database: Optional[DatabaseType] = None
    cache: Optional[DatabaseType] = None
    queue: Optional[str] = None
    search: Optional[str] = None
    storage: str = "s3"
    cdn: str = "cloudflare"

    def get_components(self) -> List[Tuple[str, ComponentType]]:
        """Get list of required components."""
        components = []
        if self.frontend:
            components.append((self.frontend.value, ComponentType.FRONTEND))
        if self.backend:
            components.append((self.backend.value, ComponentType.BACKEND))
        if self.database:
            components.append((self.database.value, ComponentType.DATABASE))
        if self.cache:
            components.append((self.cache.value, ComponentType.CACHE))
        if self.queue:
            components.append((self.queue, ComponentType.QUEUE))
        if self.search:
            components.append((self.search, ComponentType.STORAGE))
        return components


@dataclass
class Architecture:
    """System architecture definition."""
    name: str
    build_type: BuildType
    cloud_provider: CloudProvider
    tech_stack: TechStack
    services: List[ServiceConfig] = field(default_factory=list)
    network: Optional[NetworkConfig] = None
    databases: List[DatabaseConfig] = field(default_factory=list)
    security: Optional[SecurityConfig] = None
    monitoring: Optional[MonitoringConfig] = None
    cicd: Optional[CICDConfig] = None
    scaling: ScalingStrategy = ScalingStrategy.HORIZONTAL
    orchestrator: ContainerOrchestrator = ContainerOrchestrator.KUBERNETES


@dataclass
class BuildPlan:
    """Complete build execution plan."""
    architecture: Architecture
    phases: List[Dict[str, Any]] = field(default_factory=list)
    components: List[Component] = field(default_factory=list)
    current_phase: BuildPhase = BuildPhase.BLUEPRINT
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    estimated_cost_monthly: float = 0.0

    def get_progress_percentage(self) -> float:
        """Calculate overall build progress."""
        if not self.components:
            return 0.0

        weights = {
            ComponentStatus.PENDING: 0,
            ComponentStatus.BUILDING: 25,
            ComponentStatus.CONFIGURING: 50,
            ComponentStatus.INTEGRATING: 70,
            ComponentStatus.TESTING: 85,
            ComponentStatus.DEPLOYED: 95,
            ComponentStatus.HEALTHY: 100,
            ComponentStatus.DEGRADED: 90,
            ComponentStatus.FAILED: 0,
        }

        total = sum(weights.get(c.status, 0) for c in self.components)
        return total / len(self.components) if self.components else 0.0


# ============================================================
# ENGINE CLASSES - Core Logic
# ============================================================

class ArchitectPlanner:
    """Plans system architecture based on requirements."""

    # Predefined architecture templates
    TEMPLATES = {
        "saas_starter": {
            "frontend": FrameworkType.NEXTJS,
            "backend": FrameworkType.FASTAPI,
            "database": DatabaseType.POSTGRESQL,
            "cache": DatabaseType.REDIS,
            "description": "Modern SaaS starter with Next.js, FastAPI, PostgreSQL"
        },
        "ecommerce": {
            "frontend": FrameworkType.NEXTJS,
            "backend": FrameworkType.NESTJS,
            "database": DatabaseType.POSTGRESQL,
            "cache": DatabaseType.REDIS,
            "queue": "rabbitmq",
            "search": "elasticsearch",
            "description": "Full e-commerce platform with search and queuing"
        },
        "api_only": {
            "backend": FrameworkType.FASTAPI,
            "database": DatabaseType.POSTGRESQL,
            "cache": DatabaseType.REDIS,
            "description": "API-only backend service"
        },
        "jamstack": {
            "frontend": FrameworkType.ASTRO,
            "database": DatabaseType.SUPABASE,
            "cdn": "cloudflare",
            "description": "JAMStack with Astro and Supabase"
        },
        "data_platform": {
            "backend": FrameworkType.FASTAPI,
            "database": DatabaseType.POSTGRESQL,
            "cache": DatabaseType.REDIS,
            "queue": "kafka",
            "search": "elasticsearch",
            "description": "Data platform with streaming and analytics"
        },
        "ml_platform": {
            "backend": FrameworkType.FASTAPI,
            "database": DatabaseType.POSTGRESQL,
            "cache": DatabaseType.REDIS,
            "storage": "s3",
            "description": "ML platform with model serving"
        }
    }

    # Provider compatibility matrix
    PROVIDER_COMPATIBILITY = {
        CloudProvider.AWS: {
            "databases": [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.DYNAMODB, DatabaseType.REDIS],
            "orchestrators": [ContainerOrchestrator.KUBERNETES, ContainerOrchestrator.ECS],
            "strengths": ["enterprise", "compliance", "global-scale"]
        },
        CloudProvider.GCP: {
            "databases": [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.FIRESTORE, DatabaseType.REDIS],
            "orchestrators": [ContainerOrchestrator.KUBERNETES, ContainerOrchestrator.CLOUD_RUN],
            "strengths": ["ml", "data-analytics", "kubernetes"]
        },
        CloudProvider.VERCEL: {
            "databases": [DatabaseType.POSTGRESQL, DatabaseType.SUPABASE, DatabaseType.PLANETSCALE],
            "orchestrators": [ContainerOrchestrator.NONE],
            "strengths": ["frontend", "serverless", "edge"]
        },
        CloudProvider.RAILWAY: {
            "databases": [DatabaseType.POSTGRESQL, DatabaseType.MYSQL, DatabaseType.MONGODB, DatabaseType.REDIS],
            "orchestrators": [ContainerOrchestrator.DOCKER_COMPOSE],
            "strengths": ["simplicity", "developer-experience", "startup"]
        }
    }

    def analyze_requirements(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze requirements and recommend architecture."""
        analysis = {
            "recommended_template": None,
            "recommended_provider": None,
            "estimated_complexity": "medium",
            "estimated_monthly_cost": 0,
            "considerations": []
        }

        # Determine scale
        expected_users = requirements.get("expected_users", 1000)
        if expected_users < 1000:
            analysis["scale"] = "small"
            analysis["estimated_complexity"] = "low"
        elif expected_users < 100000:
            analysis["scale"] = "medium"
            analysis["estimated_complexity"] = "medium"
        else:
            analysis["scale"] = "large"
            analysis["estimated_complexity"] = "high"

        # Recommend template based on use case
        use_case = requirements.get("use_case", "").lower()
        if "ecommerce" in use_case or "shop" in use_case:
            analysis["recommended_template"] = "ecommerce"
        elif "api" in use_case:
            analysis["recommended_template"] = "api_only"
        elif "ml" in use_case or "machine learning" in use_case:
            analysis["recommended_template"] = "ml_platform"
        elif "data" in use_case or "analytics" in use_case:
            analysis["recommended_template"] = "data_platform"
        elif "blog" in use_case or "static" in use_case:
            analysis["recommended_template"] = "jamstack"
        else:
            analysis["recommended_template"] = "saas_starter"

        # Recommend provider
        budget = requirements.get("monthly_budget", 500)
        if budget < 100:
            analysis["recommended_provider"] = CloudProvider.RAILWAY
            analysis["considerations"].append("Low budget: Railway or Vercel recommended")
        elif budget < 500:
            analysis["recommended_provider"] = CloudProvider.DIGITALOCEAN
            analysis["considerations"].append("Moderate budget: DigitalOcean good balance")
        else:
            analysis["recommended_provider"] = CloudProvider.AWS
            analysis["considerations"].append("Higher budget: AWS for enterprise features")

        return analysis

    def create_architecture(
        self,
        name: str,
        template_name: str,
        provider: CloudProvider,
        build_type: BuildType = BuildType.PLATFORM
    ) -> Architecture:
        """Create architecture from template."""
        template = self.TEMPLATES.get(template_name, self.TEMPLATES["saas_starter"])

        tech_stack = TechStack(
            name=f"{name}-stack",
            frontend=template.get("frontend"),
            backend=template.get("backend"),
            database=template.get("database"),
            cache=template.get("cache"),
            queue=template.get("queue"),
            search=template.get("search"),
            storage=template.get("storage", "s3"),
            cdn=template.get("cdn", "cloudflare")
        )

        # Determine orchestrator based on provider
        compat = self.PROVIDER_COMPATIBILITY.get(provider, {})
        orchestrators = compat.get("orchestrators", [ContainerOrchestrator.DOCKER_COMPOSE])
        orchestrator = orchestrators[0] if orchestrators else ContainerOrchestrator.DOCKER_COMPOSE

        return Architecture(
            name=name,
            build_type=build_type,
            cloud_provider=provider,
            tech_stack=tech_stack,
            orchestrator=orchestrator,
            network=NetworkConfig(),
            security=SecurityConfig(level=SecurityLevel.STANDARD),
            monitoring=MonitoringConfig(),
            cicd=CICDConfig(platform=CICDPlatform.GITHUB_ACTIONS)
        )


class InfraBuilder:
    """Builds infrastructure components."""

    def __init__(self):
        self.build_steps = []

    def create_network(self, config: NetworkConfig, provider: CloudProvider) -> str:
        """Generate network infrastructure code."""
        if provider == CloudProvider.AWS:
            return config.to_terraform()
        elif provider == CloudProvider.GCP:
            return self._create_gcp_network(config)
        else:
            return self._create_generic_network(config)

    def _create_gcp_network(self, config: NetworkConfig) -> str:
        return f'''
resource "google_compute_network" "vpc" {{
  name                    = "${{var.project_name}}-vpc"
  auto_create_subnetworks = false
}}

resource "google_compute_subnetwork" "public" {{
  count         = {len(config.public_subnets)}
  name          = "${{var.project_name}}-public-${{count.index}}"
  ip_cidr_range = element({json.dumps(config.public_subnets)}, count.index)
  network       = google_compute_network.vpc.id
  region        = var.region
}}
'''

    def _create_generic_network(self, config: NetworkConfig) -> str:
        return f'''
# Network Configuration
# VPC CIDR: {config.vpc_cidr}
# Public Subnets: {", ".join(config.public_subnets)}
# Private Subnets: {", ".join(config.private_subnets)}
# Availability Zones: {config.availability_zones}
'''

    def create_database(self, config: DatabaseConfig, provider: CloudProvider) -> str:
        """Generate database infrastructure code."""
        if provider == CloudProvider.AWS:
            return self._create_aws_database(config)
        else:
            return self._create_generic_database(config)

    def _create_aws_database(self, config: DatabaseConfig) -> str:
        engine_map = {
            DatabaseType.POSTGRESQL: "postgres",
            DatabaseType.MYSQL: "mysql",
        }
        engine = engine_map.get(config.db_type, "postgres")

        return f'''
resource "aws_db_instance" "main" {{
  identifier           = "${{var.project_name}}-db"
  engine               = "{engine}"
  engine_version       = "{config.version}"
  instance_class       = "db.t3.{config.instance_size}"
  allocated_storage    = {config.storage_gb}
  storage_encrypted    = {str(config.encryption_enabled).lower()}

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  multi_az               = {str(config.multi_az).lower()}
  backup_retention_period = {config.backup_retention_days}

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true

  tags = {{
    Name = "${{var.project_name}}-db"
  }}
}}
'''

    def _create_generic_database(self, config: DatabaseConfig) -> str:
        return f'''
# Database Configuration
# Type: {config.db_type.value}
# Version: {config.version}
# Instance Size: {config.instance_size}
# Storage: {config.storage_gb} GB
# Replicas: {config.replicas}
# Multi-AZ: {config.multi_az}
# Encrypted: {config.encryption_enabled}
'''

    def create_container_orchestration(
        self,
        orchestrator: ContainerOrchestrator,
        services: List[ServiceConfig]
    ) -> str:
        """Generate container orchestration configuration."""
        if orchestrator == ContainerOrchestrator.KUBERNETES:
            return self._create_kubernetes_config(services)
        elif orchestrator == ContainerOrchestrator.DOCKER_COMPOSE:
            return self._create_docker_compose(services)
        else:
            return "# Container orchestration not configured"

    def _create_kubernetes_config(self, services: List[ServiceConfig]) -> str:
        configs = []
        for service in services:
            configs.append(service.to_kubernetes_deployment())
        return "\n---\n".join(configs)

    def _create_docker_compose(self, services: List[ServiceConfig]) -> str:
        compose = {
            "version": "3.8",
            "services": {}
        }

        for service in services:
            compose["services"][service.name] = {
                "build": f"./{service.name}",
                "ports": [f"{service.port}:{service.port}"],
                "environment": service.environment_vars,
                "depends_on": service.dependencies,
                "deploy": {
                    "replicas": service.replicas,
                    "resources": {
                        "limits": {
                            "cpus": service.resources.cpu.replace(" vCPU", ""),
                            "memory": service.resources.memory
                        }
                    }
                }
            }

        return f'''version: '3.8'

services:
{self._format_compose_services(compose["services"])}

networks:
  app-network:
    driver: bridge

volumes:
  db-data:
'''

    def _format_compose_services(self, services: Dict) -> str:
        lines = []
        for name, config in services.items():
            lines.append(f"  {name}:")
            lines.append(f"    build: ./{name}")
            if config.get("ports"):
                lines.append(f"    ports:")
                for port in config["ports"]:
                    lines.append(f"      - \"{port}\"")
            if config.get("environment"):
                lines.append(f"    environment:")
                for key, value in config["environment"].items():
                    lines.append(f"      {key}: {value}")
            if config.get("depends_on"):
                lines.append(f"    depends_on:")
                for dep in config["depends_on"]:
                    lines.append(f"      - {dep}")
            lines.append(f"    networks:")
            lines.append(f"      - app-network")
        return "\n".join(lines)


class IntegrationEngine:
    """Handles component integration."""

    def __init__(self):
        self.integration_map: Dict[str, List[str]] = {}

    def map_dependencies(self, services: List[ServiceConfig]) -> Dict[str, List[str]]:
        """Create dependency map for all services."""
        dep_map = {}
        for service in services:
            dep_map[service.name] = service.dependencies
        return dep_map

    def generate_integration_order(self, services: List[ServiceConfig]) -> List[str]:
        """Determine correct order for service deployment based on dependencies."""
        dep_map = self.map_dependencies(services)
        deployed = set()
        order = []

        while len(order) < len(services):
            for service in services:
                if service.name in deployed:
                    continue

                deps = dep_map.get(service.name, [])
                if all(d in deployed for d in deps):
                    order.append(service.name)
                    deployed.add(service.name)

        return order

    def create_service_mesh_config(self, services: List[ServiceConfig]) -> str:
        """Generate service mesh configuration."""
        return f'''
# Istio Service Mesh Configuration
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: app-routing
spec:
  hosts:
  - "*"
  gateways:
  - app-gateway
  http:
{self._generate_routes(services)}

---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: app-destination
spec:
  host: "*.default.svc.cluster.local"
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
    loadBalancer:
      simple: ROUND_ROBIN
'''

    def _generate_routes(self, services: List[ServiceConfig]) -> str:
        routes = []
        for service in services:
            routes.append(f'''  - match:
    - uri:
        prefix: /api/{service.name}
    route:
    - destination:
        host: {service.name}
        port:
          number: {service.port}''')
        return "\n".join(routes)

    def generate_api_gateway_config(self, services: List[ServiceConfig]) -> str:
        """Generate API Gateway configuration."""
        routes = []
        for service in services:
            routes.append({
                "path": f"/api/{service.name}/*",
                "service": service.name,
                "port": service.port,
                "methods": ["GET", "POST", "PUT", "DELETE"],
                "rate_limit": "1000/min"
            })

        return f'''
# Kong API Gateway Configuration
_format_version: "3.0"

services:
{self._format_kong_services(services)}

routes:
{self._format_kong_routes(services)}

plugins:
  - name: rate-limiting
    config:
      minute: 1000
      policy: local
  - name: cors
    config:
      origins: ["*"]
      methods: ["GET", "POST", "PUT", "DELETE"]
  - name: jwt
    config:
      secret_is_base64: false
'''

    def _format_kong_services(self, services: List[ServiceConfig]) -> str:
        lines = []
        for service in services:
            lines.append(f'''  - name: {service.name}
    url: http://{service.name}:{service.port}
    connect_timeout: 60000
    write_timeout: 60000
    read_timeout: 60000''')
        return "\n".join(lines)

    def _format_kong_routes(self, services: List[ServiceConfig]) -> str:
        lines = []
        for service in services:
            lines.append(f'''  - name: {service.name}-route
    service: {service.name}
    paths:
      - /api/{service.name}
    strip_path: true''')
        return "\n".join(lines)


class HardeningSystem:
    """Implements security hardening."""

    SECURITY_CHECKS = {
        SecurityLevel.BASIC: [
            "ssl_enabled",
            "basic_firewall",
            "password_policy"
        ],
        SecurityLevel.STANDARD: [
            "ssl_enabled",
            "firewall_configured",
            "secrets_management",
            "iam_roles",
            "encryption_at_rest",
            "encryption_in_transit"
        ],
        SecurityLevel.ENHANCED: [
            "ssl_enabled",
            "firewall_configured",
            "secrets_management",
            "iam_roles",
            "encryption_at_rest",
            "encryption_in_transit",
            "audit_logging",
            "vulnerability_scanning",
            "intrusion_detection"
        ],
        SecurityLevel.MAXIMUM: [
            "ssl_enabled",
            "firewall_configured",
            "secrets_management",
            "iam_roles",
            "encryption_at_rest",
            "encryption_in_transit",
            "audit_logging",
            "vulnerability_scanning",
            "intrusion_detection",
            "waf_enabled",
            "ddos_protection",
            "zero_trust_network",
            "penetration_testing"
        ],
        SecurityLevel.COMPLIANCE: [
            "ssl_enabled",
            "firewall_configured",
            "secrets_management",
            "iam_roles",
            "encryption_at_rest",
            "encryption_in_transit",
            "audit_logging",
            "vulnerability_scanning",
            "intrusion_detection",
            "waf_enabled",
            "ddos_protection",
            "compliance_reporting",
            "data_classification",
            "access_reviews"
        ]
    }

    def generate_security_config(self, config: SecurityConfig, provider: CloudProvider) -> str:
        """Generate security configuration for provider."""
        if provider == CloudProvider.AWS:
            return self._generate_aws_security(config)
        else:
            return self._generate_generic_security(config)

    def _generate_aws_security(self, config: SecurityConfig) -> str:
        return f'''
# AWS Security Configuration

# Security Group
resource "aws_security_group" "app" {{
  name        = "${{var.project_name}}-app-sg"
  description = "Application security group"
  vpc_id      = aws_vpc.main.id

  ingress {{
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}

  egress {{
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }}
}}

# KMS Key for Encryption
resource "aws_kms_key" "main" {{
  description             = "${{var.project_name}} encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}}

# Secrets Manager
resource "aws_secretsmanager_secret" "app_secrets" {{
  name        = "${{var.project_name}}/app-secrets"
  kms_key_id  = aws_kms_key.main.arn
}}

# IAM Role for Application
resource "aws_iam_role" "app_role" {{
  name = "${{var.project_name}}-app-role"

  assume_role_policy = jsonencode({{
    Version = "2012-10-17"
    Statement = [
      {{
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {{
          Service = "ecs-tasks.amazonaws.com"
        }}
      }}
    ]
  }})
}}

{self._generate_waf_config() if config.waf_enabled else "# WAF not enabled"}
'''

    def _generate_waf_config(self) -> str:
        return '''
# WAF Configuration
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.project_name}-waf"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WAFWebACL"
    sampled_requests_enabled   = true
  }
}
'''

    def _generate_generic_security(self, config: SecurityConfig) -> str:
        checks = self.SECURITY_CHECKS.get(config.level, [])
        return f'''
# Security Configuration
# Level: {config.level.value}
# Required Checks: {", ".join(checks)}

# SSL/TLS: {'Enabled' if config.ssl_enabled else 'Disabled'}
# Encryption at Rest: {'Enabled' if config.encryption_at_rest else 'Disabled'}
# Encryption in Transit: {'Enabled' if config.encryption_in_transit else 'Disabled'}
# Audit Logging: {'Enabled' if config.audit_logging else 'Disabled'}
# WAF: {'Enabled' if config.waf_enabled else 'Disabled'}
# DDoS Protection: {'Enabled' if config.ddos_protection else 'Disabled'}
'''

    def generate_monitoring_config(self, config: MonitoringConfig) -> str:
        """Generate monitoring and observability configuration."""
        return f'''
# Monitoring Configuration

# Prometheus Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true

---
# Grafana Dashboard
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
data:
  dashboards.yaml: |
    apiVersion: 1
    providers:
      - name: 'default'
        folder: ''
        type: file
        options:
          path: /var/lib/grafana/dashboards

---
# Alert Rules
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: app-alerts
spec:
  groups:
    - name: app.rules
      rules:
        - alert: HighErrorRate
          expr: rate(http_requests_total{{status=~"5.."}}[5m]) > 0.1
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: High error rate detected

        - alert: HighLatency
          expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: High latency detected
'''


class CostEstimator:
    """Estimates infrastructure costs."""

    # Monthly cost estimates per component type
    BASE_COSTS = {
        ComponentType.FRONTEND: {"vercel": 0, "aws": 50, "gcp": 40},
        ComponentType.BACKEND: {"small": 20, "medium": 80, "large": 200},
        ComponentType.DATABASE: {"small": 30, "medium": 100, "large": 400},
        ComponentType.CACHE: {"small": 15, "medium": 50, "large": 150},
        ComponentType.QUEUE: {"small": 10, "medium": 40, "large": 100},
        ComponentType.CDN: {"base": 10, "per_gb": 0.08},
        ComponentType.MONITORING: {"basic": 0, "standard": 50, "enterprise": 200},
    }

    def estimate_monthly_cost(self, architecture: Architecture) -> Dict[str, float]:
        """Estimate monthly infrastructure costs."""
        costs = {
            "compute": 0.0,
            "database": 0.0,
            "cache": 0.0,
            "networking": 0.0,
            "monitoring": 0.0,
            "storage": 0.0,
            "other": 0.0
        }

        # Compute costs (services)
        for service in architecture.services:
            costs["compute"] += service.resources.estimate_monthly_cost(
                architecture.cloud_provider
            ) * service.replicas

        # Database costs
        for db in architecture.databases:
            size_multiplier = {"small": 1, "medium": 3, "large": 10}.get(db.instance_size, 1)
            costs["database"] += self.BASE_COSTS[ComponentType.DATABASE]["small"] * size_multiplier
            if db.multi_az:
                costs["database"] *= 2

        # Cache costs
        if architecture.tech_stack.cache:
            costs["cache"] = self.BASE_COSTS[ComponentType.CACHE]["medium"]

        # Monitoring costs
        if architecture.monitoring:
            costs["monitoring"] = self.BASE_COSTS[ComponentType.MONITORING]["standard"]

        # Networking (estimated based on provider)
        if architecture.network and architecture.network.nat_gateway:
            costs["networking"] = 45  # NAT Gateway base cost

        costs["total"] = sum(costs.values())
        return costs

    def generate_cost_breakdown(self, architecture: Architecture) -> str:
        """Generate detailed cost breakdown report."""
        costs = self.estimate_monthly_cost(architecture)

        lines = ["Cost Breakdown (Monthly Estimate)", "=" * 40]
        for category, amount in costs.items():
            if category != "total":
                bar_length = int(amount / 10)
                bar = "█" * min(bar_length, 30)
                lines.append(f"{category.capitalize():15} ${amount:>8.2f} {bar}")

        lines.append("-" * 40)
        lines.append(f"{'TOTAL':15} ${costs['total']:>8.2f}")
        lines.append(f"{'Annual':15} ${costs['total'] * 12:>8.2f}")

        return "\n".join(lines)


# ============================================================
# MAIN ENGINE - Orchestrator
# ============================================================

class VulcanEngine:
    """Main VULCAN build engine orchestrator."""

    def __init__(self):
        self.architect = ArchitectPlanner()
        self.infra_builder = InfraBuilder()
        self.integration = IntegrationEngine()
        self.hardening = HardeningSystem()
        self.cost_estimator = CostEstimator()
        self.current_plan: Optional[BuildPlan] = None

    def analyze(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze requirements and provide recommendations."""
        return self.architect.analyze_requirements(requirements)

    def plan(
        self,
        name: str,
        template: str = "saas_starter",
        provider: CloudProvider = CloudProvider.AWS,
        build_type: BuildType = BuildType.PLATFORM
    ) -> BuildPlan:
        """Create a build plan from template."""
        architecture = self.architect.create_architecture(
            name, template, provider, build_type
        )

        # Create default services based on tech stack
        services = self._create_default_services(architecture.tech_stack)
        architecture.services = services

        # Create databases
        if architecture.tech_stack.database:
            architecture.databases = [
                DatabaseConfig(
                    db_type=architecture.tech_stack.database,
                    version="15" if architecture.tech_stack.database == DatabaseType.POSTGRESQL else "8.0"
                )
            ]

        # Create components from services
        components = [
            Component(
                name=s.name,
                component_type=s.component_type,
                config=s
            ) for s in services
        ]

        # Define build phases
        phases = [
            {"phase": BuildPhase.BLUEPRINT, "tasks": ["analyze", "plan", "validate"]},
            {"phase": BuildPhase.FOUNDATION, "tasks": ["network", "security", "database"]},
            {"phase": BuildPhase.CONSTRUCT, "tasks": ["services", "integration", "cicd"]},
            {"phase": BuildPhase.HARDEN, "tasks": ["security", "monitoring", "backup"]},
            {"phase": BuildPhase.DEPLOY, "tasks": ["staging", "production", "verify"]},
        ]

        self.current_plan = BuildPlan(
            architecture=architecture,
            phases=phases,
            components=components,
            estimated_cost_monthly=self.cost_estimator.estimate_monthly_cost(architecture)["total"]
        )

        return self.current_plan

    def _create_default_services(self, stack: TechStack) -> List[ServiceConfig]:
        """Create default services from tech stack."""
        services = []

        if stack.backend:
            services.append(ServiceConfig(
                name="api",
                component_type=ComponentType.BACKEND,
                framework=stack.backend,
                port=8000,
                replicas=2,
                resources=ResourceSpec(cpu="1 vCPU", memory="2 GB"),
                health_check_path="/health",
                dependencies=[]
            ))

        if stack.frontend:
            services.append(ServiceConfig(
                name="web",
                component_type=ComponentType.FRONTEND,
                framework=stack.frontend,
                port=3000,
                replicas=2,
                resources=ResourceSpec(cpu="0.5 vCPU", memory="1 GB"),
                health_check_path="/",
                dependencies=["api"] if stack.backend else []
            ))

        return services

    def build(self, plan: Optional[BuildPlan] = None) -> Dict[str, str]:
        """Execute the build plan and generate all artifacts."""
        if plan is None:
            plan = self.current_plan

        if plan is None:
            raise ValueError("No build plan available. Run plan() first.")

        plan.start_time = datetime.now()
        artifacts = {}

        # Generate network configuration
        if plan.architecture.network:
            artifacts["network.tf"] = self.infra_builder.create_network(
                plan.architecture.network,
                plan.architecture.cloud_provider
            )

        # Generate database configuration
        for i, db in enumerate(plan.architecture.databases):
            artifacts[f"database_{i}.tf"] = self.infra_builder.create_database(
                db, plan.architecture.cloud_provider
            )

        # Generate container orchestration
        artifacts["deployment.yaml"] = self.infra_builder.create_container_orchestration(
            plan.architecture.orchestrator,
            plan.architecture.services
        )

        # Generate security configuration
        if plan.architecture.security:
            artifacts["security.tf"] = self.hardening.generate_security_config(
                plan.architecture.security,
                plan.architecture.cloud_provider
            )

        # Generate monitoring configuration
        if plan.architecture.monitoring:
            artifacts["monitoring.yaml"] = self.hardening.generate_monitoring_config(
                plan.architecture.monitoring
            )

        # Generate CI/CD configuration
        if plan.architecture.cicd:
            for service in plan.architecture.services:
                artifacts[f".github/workflows/{service.name}.yml"] = \
                    plan.architecture.cicd.generate_github_workflow(service.name)

        # Generate API Gateway configuration
        if plan.architecture.services:
            artifacts["api-gateway.yaml"] = self.integration.generate_api_gateway_config(
                plan.architecture.services
            )

        # Generate service mesh configuration
        if plan.architecture.orchestrator == ContainerOrchestrator.KUBERNETES:
            artifacts["service-mesh.yaml"] = self.integration.create_service_mesh_config(
                plan.architecture.services
            )

        plan.end_time = datetime.now()

        return artifacts

    def get_integration_order(self) -> List[str]:
        """Get the order to deploy services based on dependencies."""
        if not self.current_plan:
            return []
        return self.integration.generate_integration_order(
            self.current_plan.architecture.services
        )

    def get_cost_breakdown(self) -> str:
        """Get detailed cost breakdown."""
        if not self.current_plan:
            return "No plan available"
        return self.cost_estimator.generate_cost_breakdown(
            self.current_plan.architecture
        )

    def list_templates(self) -> Dict[str, str]:
        """List available architecture templates."""
        return {
            name: template["description"]
            for name, template in self.architect.TEMPLATES.items()
        }


# ============================================================
# REPORTER - Visual Output
# ============================================================

class VulcanReporter:
    """Generates visual VULCAN reports."""

    STATUS_ICONS = {
        ComponentStatus.PENDING: "○",
        ComponentStatus.BUILDING: "◐",
        ComponentStatus.CONFIGURING: "◑",
        ComponentStatus.INTEGRATING: "◕",
        ComponentStatus.TESTING: "◔",
        ComponentStatus.DEPLOYED: "●",
        ComponentStatus.HEALTHY: "✓",
        ComponentStatus.DEGRADED: "⚠",
        ComponentStatus.FAILED: "✗",
    }

    PHASE_ICONS = {
        BuildPhase.BLUEPRINT: "📋",
        BuildPhase.FOUNDATION: "🏗️",
        BuildPhase.CONSTRUCT: "🔨",
        BuildPhase.INTEGRATE: "🔗",
        BuildPhase.HARDEN: "🛡️",
        BuildPhase.DEPLOY: "🚀",
        BuildPhase.VERIFY: "✅",
    }

    def generate_report(self, plan: BuildPlan) -> str:
        """Generate comprehensive build report."""
        arch = plan.architecture
        progress = plan.get_progress_percentage()

        # Progress bar
        filled = int(progress / 10)
        progress_bar = "█" * filled + "░" * (10 - filled)

        report = f'''
VULCAN BUILD REPORT
═══════════════════════════════════════════════════════════════
Project: {arch.name}
Type: {arch.build_type.value}
Provider: {arch.cloud_provider.value.upper()}
Time: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
═══════════════════════════════════════════════════════════════

BUILD OVERVIEW
───────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│       SYSTEM BUILD                                          │
│                                                             │
│  Stack: {arch.tech_stack.name:<45}│
│  Orchestrator: {arch.orchestrator.value:<39}│
│                                                             │
│  Progress: {progress_bar} {progress:.0f}%{' ' * 25}│
│  Status: {self._get_status_icon(plan)} {self._get_status_text(plan):<42}│
└─────────────────────────────────────────────────────────────┘

ARCHITECTURE
───────────────────────────────────────────────────────────────
{self._generate_architecture_diagram(arch)}

COMPONENTS
───────────────────────────────────────────────────────────────
{self._generate_components_table(plan.components)}

TECHNOLOGY STACK
───────────────────────────────────────────────────────────────
{self._generate_stack_box(arch.tech_stack)}

SECURITY
───────────────────────────────────────────────────────────────
{self._generate_security_checklist(arch.security)}

COST ESTIMATE
───────────────────────────────────────────────────────────────
  Monthly: ${plan.estimated_cost_monthly:.2f}
  Annual:  ${plan.estimated_cost_monthly * 12:.2f}

BUILD PHASES
───────────────────────────────────────────────────────────────
{self._generate_phases(plan)}

═══════════════════════════════════════════════════════════════
Build Status: {self._get_status_icon(plan)} {self._get_status_text(plan)}
'''
        return report

    def _get_status_icon(self, plan: BuildPlan) -> str:
        if not plan.components:
            return "○"

        statuses = [c.status for c in plan.components]
        if all(s == ComponentStatus.HEALTHY for s in statuses):
            return "●"
        elif any(s == ComponentStatus.FAILED for s in statuses):
            return "✗"
        elif any(s in [ComponentStatus.BUILDING, ComponentStatus.CONFIGURING] for s in statuses):
            return "◐"
        else:
            return "○"

    def _get_status_text(self, plan: BuildPlan) -> str:
        if not plan.components:
            return "Planning"

        statuses = [c.status for c in plan.components]
        if all(s == ComponentStatus.HEALTHY for s in statuses):
            return "Complete"
        elif any(s == ComponentStatus.FAILED for s in statuses):
            return "Failed"
        elif any(s in [ComponentStatus.BUILDING, ComponentStatus.CONFIGURING] for s in statuses):
            return "Building"
        else:
            return "Pending"

    def _generate_architecture_diagram(self, arch: Architecture) -> str:
        layers = []

        if arch.tech_stack.frontend:
            layers.append(f"  │  [Frontend: {arch.tech_stack.frontend.value}]")
        if arch.tech_stack.backend:
            layers.append(f"  │  [Backend: {arch.tech_stack.backend.value}]")
        if arch.tech_stack.cache:
            layers.append(f"  │  [Cache: {arch.tech_stack.cache.value}]")
        if arch.tech_stack.database:
            layers.append(f"  │  [Database: {arch.tech_stack.database.value}]")
        layers.append(f"  │  [Infrastructure: {arch.cloud_provider.value}]")

        diagram = "  ┌─────────────────────────────────────────────────────────┐\n"
        for i, layer in enumerate(layers):
            diagram += f"{layer:<61}│\n"
            if i < len(layers) - 1:
                diagram += "  │                         ↓                               │\n"
        diagram += "  └─────────────────────────────────────────────────────────┘"

        return diagram

    def _generate_components_table(self, components: List[Component]) -> str:
        if not components:
            return "  No components defined"

        lines = ["  │ Component          │ Type            │ Status      │ Health │"]
        lines.append("  ├────────────────────┼─────────────────┼─────────────┼────────┤")

        for comp in components:
            icon = self.STATUS_ICONS.get(comp.status, "○")
            health_icon = "✓" if comp.status == ComponentStatus.HEALTHY else "-"
            lines.append(
                f"  │ {comp.name:<18} │ {comp.component_type.value:<15} │ {icon} {comp.status.value:<9} │   {health_icon}    │"
            )

        return "\n".join(lines)

    def _generate_stack_box(self, stack: TechStack) -> str:
        lines = ["  ┌─────────────────────────────────────────────────────────┐"]

        if stack.frontend:
            lines.append(f"  │  Frontend:  {stack.frontend.value:<45}│")
        if stack.backend:
            lines.append(f"  │  Backend:   {stack.backend.value:<45}│")
        if stack.database:
            lines.append(f"  │  Database:  {stack.database.value:<45}│")
        if stack.cache:
            lines.append(f"  │  Cache:     {stack.cache.value:<45}│")
        if stack.queue:
            lines.append(f"  │  Queue:     {stack.queue:<45}│")
        if stack.search:
            lines.append(f"  │  Search:    {stack.search:<45}│")
        lines.append(f"  │  Storage:   {stack.storage:<45}│")
        lines.append(f"  │  CDN:       {stack.cdn:<45}│")

        lines.append("  └─────────────────────────────────────────────────────────┘")
        return "\n".join(lines)

    def _generate_security_checklist(self, security: Optional[SecurityConfig]) -> str:
        if not security:
            return "  Security not configured"

        checklist = security.get_checklist()
        lines = ["  ┌─────────────────────────────────────────────────────────┐"]
        lines.append(f"  │  Security Level: {security.level.value:<40}│")
        lines.append("  │                                                         │")

        for item in checklist:
            for check, status in item.items():
                icon = "✓" if status else " "
                lines.append(f"  │  [{icon}] {check:<51}│")

        lines.append("  └─────────────────────────────────────────────────────────┘")
        return "\n".join(lines)

    def _generate_phases(self, plan: BuildPlan) -> str:
        lines = []
        for phase_info in plan.phases:
            phase = phase_info["phase"]
            tasks = phase_info["tasks"]
            icon = self.PHASE_ICONS.get(phase, "○")

            is_current = phase == plan.current_phase
            status = "→ " if is_current else "  "

            lines.append(f"  {status}{icon} {phase.value.upper()}")
            for task in tasks:
                task_icon = "●" if is_current else "○"
                lines.append(f"      {task_icon} {task}")

        return "\n".join(lines)

    def generate_artifacts_summary(self, artifacts: Dict[str, str]) -> str:
        """Generate summary of generated artifacts."""
        lines = [
            "GENERATED ARTIFACTS",
            "═" * 50,
        ]

        for filename, content in artifacts.items():
            line_count = len(content.split('\n'))
            size = len(content)
            lines.append(f"  {filename:<35} ({line_count} lines, {size} bytes)")

        lines.append("=" * 50)
        lines.append(f"Total: {len(artifacts)} files")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="vulcan",
        description="VULCAN.EXE - Build & Forge Engine"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze requirements")
    analyze_parser.add_argument("--use-case", help="Use case description")
    analyze_parser.add_argument("--users", type=int, default=1000, help="Expected users")
    analyze_parser.add_argument("--budget", type=float, default=500, help="Monthly budget")

    # plan command
    plan_parser = subparsers.add_parser("plan", help="Create build plan")
    plan_parser.add_argument("name", help="Project name")
    plan_parser.add_argument("--template", default="saas_starter",
                            choices=["saas_starter", "ecommerce", "api_only",
                                   "jamstack", "data_platform", "ml_platform"],
                            help="Architecture template")
    plan_parser.add_argument("--provider", default="aws",
                            choices=["aws", "gcp", "azure", "vercel", "railway"],
                            help="Cloud provider")
    plan_parser.add_argument("--type", default="platform",
                            choices=["infrastructure", "application", "platform",
                                   "microservice", "serverless"],
                            help="Build type")

    # build command
    build_parser = subparsers.add_parser("build", help="Execute build plan")
    build_parser.add_argument("name", help="Project name")
    build_parser.add_argument("--output", "-o", default="./infrastructure",
                             help="Output directory")
    build_parser.add_argument("--template", default="saas_starter",
                             help="Architecture template")
    build_parser.add_argument("--provider", default="aws", help="Cloud provider")

    # cost command
    cost_parser = subparsers.add_parser("cost", help="Estimate costs")
    cost_parser.add_argument("name", help="Project name")
    cost_parser.add_argument("--template", default="saas_starter", help="Template")
    cost_parser.add_argument("--provider", default="aws", help="Provider")

    # templates command
    subparsers.add_parser("templates", help="List available templates")

    # status command
    status_parser = subparsers.add_parser("status", help="Check build status")
    status_parser.add_argument("name", help="Project name")

    # providers command
    subparsers.add_parser("providers", help="List supported providers")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    engine = VulcanEngine()
    reporter = VulcanReporter()

    if args.command == "analyze":
        requirements = {
            "use_case": args.use_case or "general",
            "expected_users": args.users,
            "monthly_budget": args.budget
        }
        analysis = engine.analyze(requirements)
        print("\nRequirements Analysis")
        print("=" * 50)
        for key, value in analysis.items():
            print(f"  {key}: {value}")

    elif args.command == "plan":
        provider = CloudProvider(args.provider)
        build_type = BuildType(args.type)
        plan = engine.plan(args.name, args.template, provider, build_type)
        report = reporter.generate_report(plan)
        print(report)

    elif args.command == "build":
        provider = CloudProvider(args.provider)
        plan = engine.plan(args.name, args.template, provider)
        artifacts = engine.build(plan)

        report = reporter.generate_report(plan)
        print(report)

        summary = reporter.generate_artifacts_summary(artifacts)
        print("\n" + summary)

    elif args.command == "cost":
        provider = CloudProvider(args.provider)
        plan = engine.plan(args.name, args.template, provider)
        breakdown = engine.get_cost_breakdown()
        print("\n" + breakdown)

    elif args.command == "templates":
        templates = engine.list_templates()
        print("\nAvailable Templates")
        print("=" * 50)
        for name, desc in templates.items():
            print(f"  {name:<20} {desc}")

    elif args.command == "providers":
        print("\nSupported Cloud Providers")
        print("=" * 50)
        for provider in CloudProvider:
            print(f"  {provider.value}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
VULCAN BUILD REPORT
═══════════════════════════════════════
Project: [project_name]
Type: [build_type]
Time: [timestamp]
═══════════════════════════════════════

BUILD OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       SYSTEM BUILD                  │
│                                     │
│  Stack: [technology_stack]          │
│  Environment: [env_name]            │
│                                     │
│  Progress: ████████░░ [X]%          │
│  Status: [●] [Building/Complete]    │
└─────────────────────────────────────┘

ARCHITECTURE
────────────────────────────────────
┌─────────────────────────────────────┐
│  [Application Layer]                │
│         ↓                           │
│  [Service Layer]                    │
│         ↓                           │
│  [Data Layer]                       │
│         ↓                           │
│  [Infrastructure Layer]             │
└─────────────────────────────────────┘

COMPONENTS BUILT
────────────────────────────────────
| Component | Status | Health |
|-----------|--------|--------|
| [component_1] | [●] Complete | [✓] |
| [component_2] | [●] Complete | [✓] |
| [component_3] | [◐] Building | [-] |
| [component_4] | [○] Pending | [-] |

TECHNOLOGY STACK
────────────────────────────────────
┌─────────────────────────────────────┐
│  Frontend: [framework]              │
│  Backend: [framework]               │
│  Database: [database]               │
│  Cache: [cache_system]              │
│  Queue: [queue_system]              │
│                                     │
│  Cloud: [provider]                  │
│  Container: [orchestrator]          │
│  CI/CD: [pipeline]                  │
└─────────────────────────────────────┘

CONFIGURATION
────────────────────────────────────
| Setting | Value | Status |
|---------|-------|--------|
| [config_1] | [value] | [●] Set |
| [config_2] | [value] | [●] Set |
| [config_3] | [value] | [○] Pending |

SECURITY MEASURES
────────────────────────────────────
┌─────────────────────────────────────┐
│  [✓] SSL/TLS configured            │
│  [✓] Firewall rules applied        │
│  [✓] Secrets management setup      │
│  [✓] IAM roles configured          │
│  [ ] Penetration testing           │
└─────────────────────────────────────┘

NEXT STEPS
────────────────────────────────────
| Priority | Action | Owner |
|----------|--------|-------|
| 1 | [action_1] | [team] |
| 2 | [action_2] | [team] |
| 3 | [action_3] | [team] |

Build Status: ● [In Progress/Complete]
```

---

## QUICK COMMANDS

- `/launch-vulcan [system]` - Build complete system
- `/launch-vulcan analyze` - Analyze requirements
- `/launch-vulcan plan [name]` - Create build plan
- `/launch-vulcan build [name]` - Execute build
- `/launch-vulcan templates` - List templates
- `/launch-vulcan cost [name]` - Estimate costs
- `/launch-vulcan status` - Check build progress

$ARGUMENTS
