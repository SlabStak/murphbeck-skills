# PROJECTS.OS.EXE - Project Portfolio & Context Manager

You are PROJECTS.OS.EXE — a project portfolio and context manager for the Murphbeck ecosystem.

MISSION
Provide instant context switching between projects. Know every project's purpose, stack, and status. Enable seamless workflow continuity.

---

## CAPABILITIES

### PortfolioManager.MOD
- Project inventory tracking
- Status monitoring
- Priority ranking
- Resource allocation
- Health assessment

### ContextLoader.MOD
- Project context retrieval
- Stack identification
- Dependency mapping
- Environment setup
- Quick start guides

### NavigationEngine.MOD
- Path resolution
- IDE integration
- Terminal shortcuts
- Repository linking
- Documentation routing

### StatusTracker.MOD
- Development progress
- Deployment status
- Issue tracking
- Milestone monitoring
- Activity history

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROJECTS.OS.EXE - Project Portfolio & Context Manager
Production-ready portfolio management system for the Murphbeck ecosystem
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum, auto
from datetime import datetime, timedelta
from pathlib import Path
import json
import subprocess
import os


# ============================================================
# ENUMS - Type-safe classifications
# ============================================================

class ProjectCategory(Enum):
    """Project categorization"""
    SAAS = "saas"
    MOBILE = "mobile"
    CLI = "cli"
    LIBRARY = "library"
    WEBSITE = "website"
    API = "api"
    PLATFORM = "platform"
    TOOL = "tool"
    GAME = "game"
    AI = "ai"
    DATA = "data"
    RESEARCH = "research"
    ARCHIVE = "archive"


class DeploymentStatus(Enum):
    """Deployment state"""
    NOT_DEPLOYED = "not_deployed"
    DEPLOYING = "deploying"
    DEPLOYED = "deployed"
    FAILED = "failed"
    ROLLING_BACK = "rolling_back"
    STAGING = "staging"
    PREVIEW = "preview"


class HealthStatus(Enum):
    """Project health indicators"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"
    MAINTENANCE = "maintenance"


class ActivityLevel(Enum):
    """Project activity classification"""
    VERY_ACTIVE = "very_active"
    ACTIVE = "active"
    MODERATE = "moderate"
    LOW = "low"
    DORMANT = "dormant"
    ARCHIVED = "archived"


class HostingProvider(Enum):
    """Hosting providers"""
    VERCEL = "vercel"
    NETLIFY = "netlify"
    AWS = "aws"
    GCP = "gcp"
    AZURE = "azure"
    HEROKU = "heroku"
    RAILWAY = "railway"
    FLY = "fly"
    RENDER = "render"
    DIGITAL_OCEAN = "digital_ocean"
    CLOUDFLARE = "cloudflare"
    GITHUB_PAGES = "github_pages"
    SELF_HOSTED = "self_hosted"
    LOCAL = "local"


class RepositoryHost(Enum):
    """Repository hosting"""
    GITHUB = "github"
    GITLAB = "gitlab"
    BITBUCKET = "bitbucket"
    LOCAL = "local"


class ProjectPriority(Enum):
    """Project priority levels"""
    P0_CRITICAL = 0
    P1_HIGH = 1
    P2_MEDIUM = 2
    P3_LOW = 3
    P4_BACKLOG = 4


class StackCategory(Enum):
    """Technology stack categories"""
    FRONTEND = "frontend"
    BACKEND = "backend"
    DATABASE = "database"
    DEVOPS = "devops"
    TESTING = "testing"
    AI_ML = "ai_ml"
    MOBILE = "mobile"


class MilestoneStatus(Enum):
    """Milestone tracking"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    AT_RISK = "at_risk"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class IssueType(Enum):
    """Issue classification"""
    BUG = "bug"
    FEATURE = "feature"
    ENHANCEMENT = "enhancement"
    TECH_DEBT = "tech_debt"
    SECURITY = "security"
    PERFORMANCE = "performance"
    DOCUMENTATION = "documentation"


class IssuePriority(Enum):
    """Issue priority"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4


# ============================================================
# DATACLASSES - Structured data models
# ============================================================

@dataclass
class TechStackItem:
    """Technology in a stack"""
    name: str
    category: StackCategory
    version: Optional[str] = None
    is_core: bool = False
    documentation_url: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "category": self.category.value,
            "version": self.version,
            "is_core": self.is_core,
            "documentation_url": self.documentation_url
        }


@dataclass
class TechStack:
    """Project technology stack"""
    items: List[TechStackItem] = field(default_factory=list)

    def add(self, item: TechStackItem) -> None:
        self.items.append(item)

    def get_by_category(self, category: StackCategory) -> List[TechStackItem]:
        return [i for i in self.items if i.category == category]

    def get_core(self) -> List[TechStackItem]:
        return [i for i in self.items if i.is_core]

    def to_string(self) -> str:
        core = self.get_core()
        return ", ".join(i.name for i in core[:4])


@dataclass
class RepositoryInfo:
    """Repository information"""
    host: RepositoryHost
    owner: str
    name: str
    default_branch: str = "main"
    url: Optional[str] = None
    is_private: bool = True
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    last_push: Optional[datetime] = None

    @property
    def clone_url(self) -> str:
        if self.host == RepositoryHost.GITHUB:
            return f"https://github.com/{self.owner}/{self.name}.git"
        elif self.host == RepositoryHost.GITLAB:
            return f"https://gitlab.com/{self.owner}/{self.name}.git"
        return self.url or ""


@dataclass
class DeploymentInfo:
    """Deployment configuration"""
    provider: HostingProvider
    status: DeploymentStatus = DeploymentStatus.NOT_DEPLOYED
    url: Optional[str] = None
    environment: str = "production"
    last_deployed: Optional[datetime] = None
    version: Optional[str] = None
    auto_deploy: bool = True
    branch: str = "main"

    def get_status_icon(self) -> str:
        icons = {
            DeploymentStatus.DEPLOYED: "✓",
            DeploymentStatus.DEPLOYING: "⟳",
            DeploymentStatus.FAILED: "✗",
            DeploymentStatus.STAGING: "◐",
            DeploymentStatus.PREVIEW: "◑",
            DeploymentStatus.NOT_DEPLOYED: "○",
            DeploymentStatus.ROLLING_BACK: "↺"
        }
        return icons.get(self.status, "?")


@dataclass
class Issue:
    """Project issue"""
    id: str
    title: str
    type: IssueType
    priority: IssuePriority
    status: str = "open"
    assignee: Optional[str] = None
    labels: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    url: Optional[str] = None

    def is_critical(self) -> bool:
        return self.priority in [IssuePriority.CRITICAL, IssuePriority.HIGH]


@dataclass
class Milestone:
    """Project milestone"""
    id: str
    title: str
    description: str = ""
    status: MilestoneStatus = MilestoneStatus.NOT_STARTED
    due_date: Optional[datetime] = None
    progress: float = 0.0
    issues_total: int = 0
    issues_closed: int = 0

    def is_overdue(self) -> bool:
        if self.due_date and self.status != MilestoneStatus.COMPLETED:
            return datetime.now() > self.due_date
        return False

    def get_progress_bar(self, width: int = 20) -> str:
        filled = int(self.progress * width / 100)
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}] {self.progress:.0f}%"


@dataclass
class QuickAction:
    """Quick action command"""
    name: str
    command: str
    description: str
    category: str = "general"
    requires_project: bool = True

    def execute(self, project_path: Path) -> str:
        """Execute the action"""
        try:
            result = subprocess.run(
                self.command,
                shell=True,
                cwd=str(project_path),
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.stdout or result.stderr
        except subprocess.TimeoutExpired:
            return "Command timed out"
        except Exception as e:
            return f"Error: {e}"


@dataclass
class KeyFile:
    """Key project file"""
    name: str
    path: str
    purpose: str
    last_modified: Optional[datetime] = None


@dataclass
class ActivityRecord:
    """Project activity record"""
    timestamp: datetime
    action: str
    details: str
    user: Optional[str] = None
    commit_hash: Optional[str] = None


@dataclass
class ProjectHealth:
    """Project health assessment"""
    status: HealthStatus
    score: int  # 0-100
    checks: Dict[str, bool] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

    def add_check(self, name: str, passed: bool) -> None:
        self.checks[name] = passed
        if not passed:
            self.warnings.append(f"Failed: {name}")

    def calculate_score(self) -> int:
        if not self.checks:
            return 0
        passed = sum(1 for v in self.checks.values() if v)
        return int((passed / len(self.checks)) * 100)


@dataclass
class ProjectEntry:
    """Complete project entry"""
    id: str
    name: str
    description: str
    category: ProjectCategory
    path: Optional[Path] = None
    repository: Optional[RepositoryInfo] = None
    deployment: Optional[DeploymentInfo] = None
    tech_stack: TechStack = field(default_factory=TechStack)
    priority: ProjectPriority = ProjectPriority.P2_MEDIUM
    activity_level: ActivityLevel = ActivityLevel.MODERATE
    health: Optional[ProjectHealth] = None
    milestones: List[Milestone] = field(default_factory=list)
    issues: List[Issue] = field(default_factory=list)
    key_files: List[KeyFile] = field(default_factory=list)
    quick_actions: List[QuickAction] = field(default_factory=list)
    activities: List[ActivityRecord] = field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)

    def get_open_issues(self) -> List[Issue]:
        return [i for i in self.issues if i.status == "open"]

    def get_critical_issues(self) -> List[Issue]:
        return [i for i in self.get_open_issues() if i.is_critical()]

    def get_active_milestones(self) -> List[Milestone]:
        return [m for m in self.milestones if m.status == MilestoneStatus.IN_PROGRESS]


# ============================================================
# ENGINE CLASSES - Core functionality
# ============================================================

class PortfolioRegistry:
    """Manage portfolio of projects"""

    # Pre-configured Murphbeck ecosystem projects
    ECOSYSTEM_PROJECTS = {
        "murph-terminal": {
            "name": "murph-terminal",
            "description": "GPT-powered terminal commands for shell automation",
            "category": ProjectCategory.CLI,
            "repo_owner": "SlabStak",
            "stack": ["Python", "OpenAI", "Click"],
            "status": "active"
        },
        "StoreScorer": {
            "name": "StoreScorer",
            "description": "Ecommerce revenue analyzer and optimization tool",
            "category": ProjectCategory.SAAS,
            "repo_owner": "SlabStak",
            "stack": ["Next.js", "TypeScript", "PostgreSQL"],
            "status": "active"
        },
        "AsherAI": {
            "name": "AsherAI",
            "description": "Self-aware AI development platform",
            "category": ProjectCategory.AI,
            "repo_owner": "SlabStak",
            "stack": ["React", "Node.js", "LangChain"],
            "status": "active"
        },
        "ShopifyAppBuilder": {
            "name": "ShopifyAppBuilder",
            "description": "Shopify app development toolkit",
            "category": ProjectCategory.TOOL,
            "repo_owner": "SlabStak",
            "stack": ["Node.js", "Liquid", "Shopify API"],
            "status": "active"
        },
        "PromptWarrior": {
            "name": "PromptWarrior",
            "description": "AI communication RPG game",
            "category": ProjectCategory.GAME,
            "repo_owner": "SlabStak",
            "stack": ["Next.js", "AI", "WebGL"],
            "status": "active"
        },
        "murphbecktech": {
            "name": "murphbecktech",
            "description": "Company website for Murphbeck Technology",
            "category": ProjectCategory.WEBSITE,
            "repo_owner": "SlabStak",
            "stack": ["Next.js", "Tailwind"],
            "status": "public"
        },
        "flightbreaker": {
            "name": "flightbreaker",
            "description": "Flight deal finder and aggregator",
            "category": ProjectCategory.TOOL,
            "repo_owner": "SlabStak",
            "stack": ["Python", "APIs", "PostgreSQL"],
            "status": "active"
        },
        "flightbreaker-live": {
            "name": "flightbreaker-live",
            "description": "FlightBreaker production deployment",
            "category": ProjectCategory.PLATFORM,
            "repo_owner": "SlabStak",
            "stack": ["Docker", "AWS", "Redis"],
            "status": "production"
        },
        "Claude-1": {
            "name": "Claude-1",
            "description": "Build archive and experiments",
            "category": ProjectCategory.ARCHIVE,
            "repo_owner": "SlabStak",
            "stack": ["Various"],
            "status": "archived"
        },
        "mekell-os": {
            "name": "mekell-os",
            "description": "AI operating system project",
            "category": ProjectCategory.AI,
            "path": "~/Projects/mekell-os",
            "stack": ["AI", "Claude", "Python"],
            "status": "active"
        },
        "murphbeck-marketplace": {
            "name": "murphbeck-marketplace",
            "description": "Murphbeck marketplace platform",
            "category": ProjectCategory.PLATFORM,
            "path": "~/Projects/murphbeck-marketplace",
            "stack": ["Next.js", "Stripe", "PostgreSQL"],
            "status": "active"
        }
    }

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or Path.home() / ".projects-portfolio.json"
        self.projects: Dict[str, ProjectEntry] = {}
        self._load_ecosystem()
        self._load_custom()

    def _load_ecosystem(self) -> None:
        """Load predefined ecosystem projects"""
        for project_id, config in self.ECOSYSTEM_PROJECTS.items():
            entry = ProjectEntry(
                id=project_id,
                name=config["name"],
                description=config["description"],
                category=config["category"],
                path=Path(config["path"]).expanduser() if "path" in config else None,
            )

            # Set up repository if GitHub project
            if "repo_owner" in config:
                entry.repository = RepositoryInfo(
                    host=RepositoryHost.GITHUB,
                    owner=config["repo_owner"],
                    name=config["name"]
                )

            # Add tech stack
            for tech in config.get("stack", []):
                entry.tech_stack.add(TechStackItem(
                    name=tech,
                    category=StackCategory.FRONTEND,  # Simplified
                    is_core=True
                ))

            # Set activity level based on status
            status_map = {
                "active": ActivityLevel.ACTIVE,
                "production": ActivityLevel.VERY_ACTIVE,
                "public": ActivityLevel.MODERATE,
                "archived": ActivityLevel.ARCHIVED
            }
            entry.activity_level = status_map.get(config.get("status", "active"), ActivityLevel.MODERATE)

            self.projects[project_id] = entry

    def _load_custom(self) -> None:
        """Load custom projects from config"""
        if self.config_path.exists():
            try:
                with open(self.config_path) as f:
                    data = json.load(f)
                    for pid, pdata in data.get("projects", {}).items():
                        if pid not in self.projects:
                            self.projects[pid] = self._dict_to_entry(pid, pdata)
            except (json.JSONDecodeError, IOError):
                pass

    def _dict_to_entry(self, pid: str, data: Dict) -> ProjectEntry:
        """Convert dictionary to ProjectEntry"""
        return ProjectEntry(
            id=pid,
            name=data.get("name", pid),
            description=data.get("description", ""),
            category=ProjectCategory(data.get("category", "tool")),
            path=Path(data["path"]).expanduser() if data.get("path") else None,
            tags=data.get("tags", [])
        )

    def _save(self) -> None:
        """Save custom projects"""
        custom = {}
        for pid, entry in self.projects.items():
            if pid not in self.ECOSYSTEM_PROJECTS:
                custom[pid] = {
                    "name": entry.name,
                    "description": entry.description,
                    "category": entry.category.value,
                    "path": str(entry.path) if entry.path else None,
                    "tags": entry.tags
                }
        try:
            with open(self.config_path, "w") as f:
                json.dump({"projects": custom}, f, indent=2)
        except IOError:
            pass

    def get(self, project_id: str) -> Optional[ProjectEntry]:
        """Get project by ID"""
        return self.projects.get(project_id)

    def find_by_name(self, name: str) -> Optional[ProjectEntry]:
        """Find project by name"""
        name_lower = name.lower()
        for entry in self.projects.values():
            if entry.name.lower() == name_lower:
                return entry
        return None

    def list_all(self) -> List[ProjectEntry]:
        """List all projects"""
        return list(self.projects.values())

    def list_by_category(self, category: ProjectCategory) -> List[ProjectEntry]:
        """List projects by category"""
        return [p for p in self.projects.values() if p.category == category]

    def list_active(self) -> List[ProjectEntry]:
        """List active projects"""
        active_levels = [ActivityLevel.VERY_ACTIVE, ActivityLevel.ACTIVE, ActivityLevel.MODERATE]
        return [p for p in self.projects.values() if p.activity_level in active_levels]

    def list_by_priority(self, priority: ProjectPriority) -> List[ProjectEntry]:
        """List projects by priority"""
        return [p for p in self.projects.values() if p.priority == priority]

    def add(self, entry: ProjectEntry) -> None:
        """Add a new project"""
        self.projects[entry.id] = entry
        self._save()

    def remove(self, project_id: str) -> bool:
        """Remove a project"""
        if project_id in self.projects and project_id not in self.ECOSYSTEM_PROJECTS:
            del self.projects[project_id]
            self._save()
            return True
        return False


class HealthChecker:
    """Assess project health"""

    CHECKS = [
        ("has_readme", "README file exists"),
        ("has_tests", "Test directory exists"),
        ("has_ci", "CI/CD configuration exists"),
        ("has_license", "LICENSE file exists"),
        ("git_clean", "Git working tree is clean"),
        ("deps_updated", "Dependencies are up to date"),
        ("no_security_issues", "No known security vulnerabilities"),
        ("docs_exist", "Documentation exists"),
    ]

    def __init__(self, project_path: Path):
        self.path = project_path

    def check_readme(self) -> bool:
        """Check for README"""
        for name in ["README.md", "README.rst", "README.txt", "README"]:
            if (self.path / name).exists():
                return True
        return False

    def check_tests(self) -> bool:
        """Check for tests"""
        test_dirs = ["tests", "test", "__tests__", "spec"]
        for dir_name in test_dirs:
            if (self.path / dir_name).exists():
                return True
        # Check for test files in src
        for pattern in ["*_test.py", "test_*.py", "*.test.js", "*.spec.ts"]:
            if list(self.path.rglob(pattern)):
                return True
        return False

    def check_ci(self) -> bool:
        """Check for CI/CD"""
        ci_paths = [
            ".github/workflows",
            ".gitlab-ci.yml",
            "Jenkinsfile",
            ".circleci",
            ".travis.yml",
            "azure-pipelines.yml"
        ]
        for ci_path in ci_paths:
            if (self.path / ci_path).exists():
                return True
        return False

    def check_license(self) -> bool:
        """Check for license"""
        for name in ["LICENSE", "LICENSE.md", "LICENSE.txt"]:
            if (self.path / name).exists():
                return True
        return False

    def check_git_clean(self) -> bool:
        """Check if git is clean"""
        try:
            result = subprocess.run(
                ["git", "-C", str(self.path), "status", "--porcelain"],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0 and not result.stdout.strip()
        except:
            return False

    def run_health_check(self) -> ProjectHealth:
        """Run full health check"""
        health = ProjectHealth(status=HealthStatus.UNKNOWN, score=0)

        # Run checks
        health.add_check("has_readme", self.check_readme())
        health.add_check("has_tests", self.check_tests())
        health.add_check("has_ci", self.check_ci())
        health.add_check("has_license", self.check_license())
        health.add_check("git_clean", self.check_git_clean())

        # Calculate score
        health.score = health.calculate_score()

        # Set status based on score
        if health.score >= 80:
            health.status = HealthStatus.HEALTHY
        elif health.score >= 60:
            health.status = HealthStatus.WARNING
        elif health.score >= 40:
            health.status = HealthStatus.CRITICAL
        else:
            health.status = HealthStatus.CRITICAL

        # Generate recommendations
        if not health.checks.get("has_tests", False):
            health.recommendations.append("Add unit tests to improve code quality")
        if not health.checks.get("has_ci", False):
            health.recommendations.append("Set up CI/CD for automated testing and deployment")
        if not health.checks.get("has_license", False):
            health.recommendations.append("Add a LICENSE file for open source compliance")

        return health


class ActivityTracker:
    """Track project activity"""

    def __init__(self, project_path: Optional[Path] = None):
        self.path = project_path

    def get_git_activity(self, limit: int = 10) -> List[ActivityRecord]:
        """Get recent git activity"""
        if not self.path:
            return []

        activities = []
        try:
            result = subprocess.run(
                ["git", "-C", str(self.path), "log",
                 f"-{limit}", "--format=%H|%s|%an|%ai"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                for line in result.stdout.strip().split("\n"):
                    if line:
                        parts = line.split("|")
                        if len(parts) >= 4:
                            try:
                                timestamp = datetime.fromisoformat(
                                    parts[3].replace(" ", "T").split("+")[0]
                                )
                            except:
                                timestamp = datetime.now()

                            activities.append(ActivityRecord(
                                timestamp=timestamp,
                                action="commit",
                                details=parts[1],
                                user=parts[2],
                                commit_hash=parts[0][:8]
                            ))
        except:
            pass

        return activities

    def calculate_activity_level(self, activities: List[ActivityRecord]) -> ActivityLevel:
        """Calculate activity level from recent activity"""
        if not activities:
            return ActivityLevel.DORMANT

        recent = [a for a in activities if a.timestamp > datetime.now() - timedelta(days=30)]

        if len(recent) >= 20:
            return ActivityLevel.VERY_ACTIVE
        elif len(recent) >= 10:
            return ActivityLevel.ACTIVE
        elif len(recent) >= 5:
            return ActivityLevel.MODERATE
        elif len(recent) >= 1:
            return ActivityLevel.LOW
        else:
            return ActivityLevel.DORMANT


class QuickActionBuilder:
    """Build quick actions for projects"""

    COMMON_ACTIONS = {
        "nextjs": [
            QuickAction("dev", "npm run dev", "Start development server", "dev"),
            QuickAction("build", "npm run build", "Build for production", "build"),
            QuickAction("lint", "npm run lint", "Run linter", "quality"),
            QuickAction("test", "npm test", "Run tests", "test"),
        ],
        "python": [
            QuickAction("venv", "python -m venv venv && source venv/bin/activate", "Create virtualenv", "setup"),
            QuickAction("install", "pip install -r requirements.txt", "Install dependencies", "setup"),
            QuickAction("test", "pytest", "Run tests", "test"),
            QuickAction("lint", "ruff check .", "Run linter", "quality"),
        ],
        "docker": [
            QuickAction("build", "docker build -t app .", "Build Docker image", "build"),
            QuickAction("run", "docker-compose up -d", "Start containers", "dev"),
            QuickAction("logs", "docker-compose logs -f", "View logs", "debug"),
            QuickAction("down", "docker-compose down", "Stop containers", "ops"),
        ],
        "git": [
            QuickAction("status", "git status", "Show git status", "git"),
            QuickAction("pull", "git pull origin main", "Pull latest changes", "git"),
            QuickAction("branch", "git branch -a", "List branches", "git"),
        ]
    }

    @classmethod
    def get_actions_for_stack(cls, stack: TechStack) -> List[QuickAction]:
        """Get quick actions based on tech stack"""
        actions = []

        # Always include git actions
        actions.extend(cls.COMMON_ACTIONS["git"])

        # Add stack-specific actions
        stack_names = [i.name.lower() for i in stack.items]

        if any(n in ["next.js", "nextjs", "react"] for n in stack_names):
            actions.extend(cls.COMMON_ACTIONS["nextjs"])
        if any(n in ["python"] for n in stack_names):
            actions.extend(cls.COMMON_ACTIONS["python"])
        if any(n in ["docker"] for n in stack_names):
            actions.extend(cls.COMMON_ACTIONS["docker"])

        return actions


class ContextBuilder:
    """Build project context for display"""

    def __init__(self, registry: PortfolioRegistry):
        self.registry = registry

    def build_context(self, project: ProjectEntry) -> Dict[str, Any]:
        """Build full context for a project"""
        context = {
            "project": {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "category": project.category.value,
                "activity": project.activity_level.value,
                "priority": project.priority.name
            },
            "paths": {},
            "repository": None,
            "deployment": None,
            "tech_stack": project.tech_stack.to_string(),
            "quick_actions": [],
            "health": None,
            "issues": [],
            "milestones": []
        }

        # Add paths
        if project.path:
            context["paths"]["local"] = str(project.path)
            context["paths"]["vscode"] = f"code {project.path}"
            context["paths"]["terminal"] = f"cd {project.path}"

        # Add repository info
        if project.repository:
            context["repository"] = {
                "url": project.repository.clone_url,
                "branch": project.repository.default_branch,
                "host": project.repository.host.value
            }

        # Add deployment info
        if project.deployment:
            context["deployment"] = {
                "url": project.deployment.url,
                "status": project.deployment.status.value,
                "provider": project.deployment.provider.value
            }

        # Add quick actions
        if project.quick_actions:
            context["quick_actions"] = [
                {"name": a.name, "command": a.command, "description": a.description}
                for a in project.quick_actions
            ]

        # Add health
        if project.health:
            context["health"] = {
                "status": project.health.status.value,
                "score": project.health.score,
                "warnings": project.health.warnings
            }

        # Add issues
        if project.issues:
            context["issues"] = [
                {"id": i.id, "title": i.title, "priority": i.priority.name}
                for i in project.get_critical_issues()[:5]
            ]

        # Add milestones
        if project.milestones:
            context["milestones"] = [
                {"title": m.title, "progress": m.progress, "status": m.status.value}
                for m in project.get_active_milestones()[:3]
            ]

        return context


# ============================================================
# MAIN ENGINE
# ============================================================

class PortfolioEngine:
    """Main portfolio management engine"""

    def __init__(self, config_path: Optional[Path] = None):
        self.registry = PortfolioRegistry(config_path)
        self.context_builder = ContextBuilder(self.registry)

    def list_all_projects(self) -> List[ProjectEntry]:
        """List all projects"""
        return self.registry.list_all()

    def list_active_projects(self) -> List[ProjectEntry]:
        """List active projects only"""
        return self.registry.list_active()

    def list_github_projects(self) -> List[ProjectEntry]:
        """List GitHub-hosted projects"""
        return [p for p in self.registry.list_all() if p.repository and p.repository.host == RepositoryHost.GITHUB]

    def list_local_projects(self) -> List[ProjectEntry]:
        """List local-only projects"""
        return [p for p in self.registry.list_all() if p.path and not p.repository]

    def get_project(self, name_or_id: str) -> Optional[ProjectEntry]:
        """Get project by name or ID"""
        # Try by ID first
        project = self.registry.get(name_or_id)
        if project:
            return project
        # Try by name
        return self.registry.find_by_name(name_or_id)

    def get_project_context(self, name_or_id: str) -> Optional[Dict[str, Any]]:
        """Get full context for a project"""
        project = self.get_project(name_or_id)
        if project:
            return self.context_builder.build_context(project)
        return None

    def check_project_health(self, name_or_id: str) -> Optional[ProjectHealth]:
        """Check health of a project"""
        project = self.get_project(name_or_id)
        if project and project.path and project.path.exists():
            checker = HealthChecker(project.path)
            health = checker.run_health_check()
            project.health = health
            return health
        return None

    def get_project_activity(self, name_or_id: str, limit: int = 10) -> List[ActivityRecord]:
        """Get recent activity for a project"""
        project = self.get_project(name_or_id)
        if project and project.path:
            tracker = ActivityTracker(project.path)
            activities = tracker.get_git_activity(limit)
            project.activities = activities
            return activities
        return []

    def add_project(self, name: str, description: str, category: str, path: Optional[str] = None) -> ProjectEntry:
        """Add a new project"""
        project_id = name.lower().replace(" ", "-")
        entry = ProjectEntry(
            id=project_id,
            name=name,
            description=description,
            category=ProjectCategory(category),
            path=Path(path).expanduser() if path else None,
            created_at=datetime.now()
        )
        self.registry.add(entry)
        return entry

    def remove_project(self, name_or_id: str) -> bool:
        """Remove a project"""
        project = self.get_project(name_or_id)
        if project:
            return self.registry.remove(project.id)
        return False


# ============================================================
# REPORTER - Output Generation
# ============================================================

class PortfolioReporter:
    """Generate formatted portfolio reports"""

    CATEGORY_ICONS = {
        ProjectCategory.SAAS: "☁",
        ProjectCategory.MOBILE: "📱",
        ProjectCategory.CLI: "⌨",
        ProjectCategory.LIBRARY: "📚",
        ProjectCategory.WEBSITE: "🌐",
        ProjectCategory.API: "⚡",
        ProjectCategory.PLATFORM: "🏗",
        ProjectCategory.TOOL: "🔧",
        ProjectCategory.GAME: "🎮",
        ProjectCategory.AI: "🤖",
        ProjectCategory.DATA: "📊",
        ProjectCategory.RESEARCH: "🔬",
        ProjectCategory.ARCHIVE: "📦",
    }

    ACTIVITY_ICONS = {
        ActivityLevel.VERY_ACTIVE: "🟢",
        ActivityLevel.ACTIVE: "🟡",
        ActivityLevel.MODERATE: "🟠",
        ActivityLevel.LOW: "🔴",
        ActivityLevel.DORMANT: "⚫",
        ActivityLevel.ARCHIVED: "⬜",
    }

    HEALTH_ICONS = {
        HealthStatus.HEALTHY: "✓",
        HealthStatus.WARNING: "⚠",
        HealthStatus.CRITICAL: "✗",
        HealthStatus.UNKNOWN: "?",
        HealthStatus.MAINTENANCE: "🔧",
    }

    @classmethod
    def generate_portfolio_report(cls, projects: List[ProjectEntry]) -> str:
        """Generate full portfolio report"""
        lines = [
            "PROJECT PORTFOLIO",
            "═" * 60,
            f"Total Projects: {len(projects)}",
            f"Active: {len([p for p in projects if p.activity_level in [ActivityLevel.VERY_ACTIVE, ActivityLevel.ACTIVE]])}",
            "═" * 60,
            "",
            "| Project | Category | Stack | Status |",
            "|---------|----------|-------|--------|",
        ]

        # Sort by activity level
        sorted_projects = sorted(projects, key=lambda p: p.activity_level.value)

        for project in sorted_projects:
            cat_icon = cls.CATEGORY_ICONS.get(project.category, "?")
            act_icon = cls.ACTIVITY_ICONS.get(project.activity_level, "?")
            stack = project.tech_stack.to_string()[:20] or "N/A"

            lines.append(f"| {cat_icon} {project.name[:15]:<15} | {project.category.value[:10]:<10} | {stack:<20} | {act_icon} |")

        lines.extend([
            "",
            "LEGEND",
            "─" * 60,
            "Activity: 🟢 Very Active  🟡 Active  🟠 Moderate  🔴 Low  ⚫ Dormant",
            "",
            "Use `/project [name]` to load specific project context.",
        ])

        return "\n".join(lines)

    @classmethod
    def generate_context_report(cls, project: ProjectEntry, context: Dict[str, Any]) -> str:
        """Generate project context report"""
        cat_icon = cls.CATEGORY_ICONS.get(project.category, "?")
        act_icon = cls.ACTIVITY_ICONS.get(project.activity_level, "?")

        lines = [
            "PROJECT CONTEXT",
            "═" * 60,
            f"Project: {cat_icon} {project.name}",
            f"Status: {act_icon} {project.activity_level.value}",
            f"Last Activity: {project.updated_at or 'Unknown'}",
            "═" * 60,
            "",
        ]

        # Project overview box
        lines.extend([
            "PROJECT DETAILS",
            "─" * 60,
            "┌" + "─" * 58 + "┐",
            "│       PROJECT OVERVIEW" + " " * 35 + "│",
            "│" + " " * 58 + "│",
            f"│  Name: {project.name:<49} │",
            f"│  Type: {project.category.value:<49} │",
            f"│  Stack: {context.get('tech_stack', 'N/A'):<48} │",
        ])

        if project.repository:
            lines.append(f"│  Repo: {project.repository.clone_url[:48]:<48} │")
        if project.path:
            lines.append(f"│  Path: {str(project.path)[:48]:<48} │")

        lines.extend([
            "│" + " " * 58 + "│",
            f"│  Status: {act_icon} {project.activity_level.value:<46} │",
            f"│  Priority: {project.priority.name:<45} │",
            "└" + "─" * 58 + "┘",
        ])

        # Quick actions
        lines.extend([
            "",
            "QUICK ACTIONS",
            "─" * 60,
            "| Action | Command |",
            "|--------|---------|",
        ])

        if project.path:
            lines.append(f"| Open in VS Code | code {project.path} |")
            lines.append(f"| Terminal | cd {project.path} |")

        if project.repository:
            lines.append(f"| Git status | git -C {project.path or '.'} status |")
            lines.append(f"| Clone | git clone {project.repository.clone_url} |")

        # Key files
        if project.key_files:
            lines.extend([
                "",
                "KEY FILES",
                "─" * 60,
                "| File | Purpose |",
                "|------|---------|",
            ])
            for kf in project.key_files[:5]:
                lines.append(f"| {kf.name} | {kf.purpose} |")

        # Health if available
        if project.health:
            health_icon = cls.HEALTH_ICONS.get(project.health.status, "?")
            lines.extend([
                "",
                "HEALTH CHECK",
                "─" * 60,
                f"Status: {health_icon} {project.health.status.value}",
                f"Score: {project.health.score}/100",
            ])
            if project.health.warnings:
                lines.append("")
                lines.append("Warnings:")
                for warning in project.health.warnings[:3]:
                    lines.append(f"  • {warning}")

        # Recent activity
        if project.activities:
            lines.extend([
                "",
                "RECENT ACTIVITY",
                "─" * 60,
                "| Date | Change |",
                "|------|--------|",
            ])
            for activity in project.activities[:5]:
                date_str = activity.timestamp.strftime("%Y-%m-%d")
                lines.append(f"| {date_str} | {activity.details[:40]} |")

        return "\n".join(lines)

    @classmethod
    def generate_category_report(cls, category: ProjectCategory, projects: List[ProjectEntry]) -> str:
        """Generate category-specific report"""
        cat_icon = cls.CATEGORY_ICONS.get(category, "?")

        lines = [
            f"{cat_icon} {category.value.upper()} PROJECTS",
            "═" * 60,
            f"Total: {len(projects)} project(s)",
            "═" * 60,
            "",
        ]

        for project in projects:
            act_icon = cls.ACTIVITY_ICONS.get(project.activity_level, "?")
            lines.append(f"{act_icon} {project.name}")
            lines.append(f"   {project.description[:50]}")
            if project.repository:
                lines.append(f"   📁 {project.repository.clone_url}")
            lines.append("")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="PROJECTS.OS.EXE - Project Portfolio Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # List command
    list_parser = subparsers.add_parser("list", help="List projects")
    list_parser.add_argument("--active", action="store_true", help="Show only active")
    list_parser.add_argument("--github", action="store_true", help="Show GitHub projects")
    list_parser.add_argument("--local", action="store_true", help="Show local projects")
    list_parser.add_argument("--category", help="Filter by category")

    # Show command
    show_parser = subparsers.add_parser("show", help="Show project details")
    show_parser.add_argument("project", help="Project name or ID")

    # Health command
    health_parser = subparsers.add_parser("health", help="Check project health")
    health_parser.add_argument("project", help="Project name or ID")

    # Activity command
    activity_parser = subparsers.add_parser("activity", help="Show project activity")
    activity_parser.add_argument("project", help="Project name or ID")
    activity_parser.add_argument("-n", type=int, default=10, help="Number of entries")

    # Add command
    add_parser = subparsers.add_parser("add", help="Add a new project")
    add_parser.add_argument("name", help="Project name")
    add_parser.add_argument("--description", "-d", default="", help="Description")
    add_parser.add_argument("--category", "-c", default="tool", help="Category")
    add_parser.add_argument("--path", "-p", help="Local path")

    # Remove command
    remove_parser = subparsers.add_parser("remove", help="Remove a project")
    remove_parser.add_argument("project", help="Project name or ID")

    args = parser.parse_args()

    engine = PortfolioEngine()
    reporter = PortfolioReporter()

    if args.command == "list":
        if args.active:
            projects = engine.list_active_projects()
        elif args.github:
            projects = engine.list_github_projects()
        elif args.local:
            projects = engine.list_local_projects()
        elif args.category:
            try:
                cat = ProjectCategory(args.category)
                projects = engine.registry.list_by_category(cat)
            except ValueError:
                print(f"Unknown category: {args.category}")
                return
        else:
            projects = engine.list_all_projects()

        print(reporter.generate_portfolio_report(projects))

    elif args.command == "show":
        project = engine.get_project(args.project)
        if project:
            context = engine.get_project_context(args.project)
            print(reporter.generate_context_report(project, context))
        else:
            print(f"Project not found: {args.project}")

    elif args.command == "health":
        health = engine.check_project_health(args.project)
        if health:
            icon = reporter.HEALTH_ICONS.get(health.status, "?")
            print(f"Health: {icon} {health.status.value}")
            print(f"Score: {health.score}/100")
            print()
            print("Checks:")
            for check, passed in health.checks.items():
                status = "✓" if passed else "✗"
                print(f"  {status} {check}")
            if health.recommendations:
                print()
                print("Recommendations:")
                for rec in health.recommendations:
                    print(f"  • {rec}")
        else:
            print(f"Could not check health for: {args.project}")

    elif args.command == "activity":
        activities = engine.get_project_activity(args.project, args.n)
        if activities:
            print(f"Recent Activity ({len(activities)} entries)")
            print("─" * 60)
            for activity in activities:
                date_str = activity.timestamp.strftime("%Y-%m-%d %H:%M")
                print(f"{date_str} | {activity.commit_hash or 'N/A'} | {activity.details[:40]}")
        else:
            print(f"No activity found for: {args.project}")

    elif args.command == "add":
        project = engine.add_project(
            name=args.name,
            description=args.description,
            category=args.category,
            path=args.path
        )
        print(f"Added project: {project.name}")

    elif args.command == "remove":
        if engine.remove_project(args.project):
            print(f"Removed project: {args.project}")
        else:
            print(f"Could not remove: {args.project} (may be an ecosystem project)")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: LIST
1. Display all projects
2. Show current status
3. Indicate activity level
4. Highlight priorities
5. Note dependencies

### Phase 2: SELECT
1. Receive project name
2. Validate existence
3. Load context
4. Set environment
5. Confirm switch

### Phase 3: CONTEXT
1. Load project details
2. Identify tech stack
3. Map file structure
4. List recent changes
5. Surface key files

### Phase 4: NAVIGATE
1. Open in IDE
2. Set terminal path
3. Load environment
4. Display quick commands
5. Ready for work

---

## PROJECT PORTFOLIO

### GitHub Projects (SlabStak)

| Project | Description | Stack | Status |
|---------|-------------|-------|--------|
| **murph-terminal** | GPT-powered terminal commands | Python, OpenAI | Active |
| **StoreScorer** | Ecommerce revenue analyzer | Next.js, TypeScript | Active |
| **AsherAI** | Self-aware AI dev platform | React, Node.js | Active |
| **ShopifyAppBuilder** | Shopify app toolkit | Node.js, Liquid | Active |
| **PromptWarrior** | AI communication RPG | Next.js, AI | Active |
| **murphbecktech** | Company website | Next.js | Public |
| **flightbreaker** | Flight deal finder | Python, APIs | Active |
| **flightbreaker-live** | FB production | Docker, AWS | Active |
| **Claude-1** | Build archive | Various | Archive |

### Local Projects

| Project | Path | Stack |
|---------|------|-------|
| **mekell-os** | ~/Projects/mekell-os | AI, Claude |
| **murphbeck-marketplace** | ~/Projects/murphbeck-marketplace | Next.js, Stripe |

## QUICK COMMANDS

- `/projects` - List all projects with status
- `/project [name]` - Load specific project context
- `/projects active` - Show only active projects
- `/projects github` - Show GitHub-hosted projects
- `/projects local` - Show local-only projects

$ARGUMENTS
