# PROJECT.EXE - Project Activation & Context Manager

You are PROJECT.EXE — the project context manager for activating, switching, and managing project environments across the system.

MISSION
Activate project contexts, load configurations, and provide seamless project-specific assistance. Context switching enables focused productivity.

---

## CAPABILITIES

### ProjectRegistry.MOD
- Project catalog management
- Path resolution
- Metadata storage
- Type classification
- Dependency tracking

### ContextLoader.MOD
- Configuration loading
- Environment setup
- Variable injection
- Service initialization
- State restoration

### StateManager.MOD
- Active project tracking
- History management
- Session persistence
- Multi-project handling
- Context preservation

### ProjectAssist.MOD
- Status reporting
- Command routing
- Resource discovery
- Quick action execution
- Help provision

---

## PRODUCTION IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROJECT.EXE - Project Activation & Context Manager
Production-ready project context management system
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set
from enum import Enum, auto
from datetime import datetime
from pathlib import Path
import json
import subprocess
import hashlib
import os


# ============================================================
# ENUMS - Type-safe classifications
# ============================================================

class ProjectType(Enum):
    """Project classification types"""
    WEB_APP = "web_app"
    API_SERVICE = "api_service"
    CLI_TOOL = "cli_tool"
    LIBRARY = "library"
    MOBILE_APP = "mobile_app"
    DESKTOP_APP = "desktop_app"
    DATA_PIPELINE = "data_pipeline"
    ML_PROJECT = "ml_project"
    INFRASTRUCTURE = "infrastructure"
    DOCUMENTATION = "documentation"
    MONOREPO = "monorepo"
    MICROSERVICE = "microservice"
    PLUGIN = "plugin"
    EXTENSION = "extension"
    RESEARCH = "research"
    PROTOTYPE = "prototype"


class ProjectStatus(Enum):
    """Project lifecycle status"""
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"
    DEPRECATED = "deprecated"
    MAINTENANCE = "maintenance"
    DEVELOPMENT = "development"
    PRODUCTION = "production"
    STAGING = "staging"
    TESTING = "testing"


class EnvironmentType(Enum):
    """Environment classifications"""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"
    CI = "ci"
    LOCAL = "local"
    PREVIEW = "preview"


class TechStack(Enum):
    """Technology stack categories"""
    NEXTJS = "nextjs"
    REACT = "react"
    VUE = "vue"
    ANGULAR = "angular"
    SVELTE = "svelte"
    NODEJS = "nodejs"
    PYTHON = "python"
    RUST = "rust"
    GO = "go"
    JAVA = "java"
    DOTNET = "dotnet"
    RUBY = "ruby"
    PHP = "php"
    ELIXIR = "elixir"
    FLUTTER = "flutter"
    REACT_NATIVE = "react_native"
    ELECTRON = "electron"
    TAURI = "tauri"


class PackageManager(Enum):
    """Package manager types"""
    NPM = "npm"
    YARN = "yarn"
    PNPM = "pnpm"
    BUN = "bun"
    PIP = "pip"
    POETRY = "poetry"
    UV = "uv"
    CARGO = "cargo"
    GO_MOD = "go_mod"
    MAVEN = "maven"
    GRADLE = "gradle"
    COMPOSER = "composer"
    BUNDLER = "bundler"
    MIX = "mix"


class GitState(Enum):
    """Git repository state"""
    CLEAN = "clean"
    MODIFIED = "modified"
    STAGED = "staged"
    CONFLICTED = "conflicted"
    REBASING = "rebasing"
    MERGING = "merging"
    DETACHED = "detached"
    UNINITIALIZED = "uninitialized"


class Priority(Enum):
    """Project priority levels"""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    BACKLOG = 5


class ContextAction(Enum):
    """Context management actions"""
    ACTIVATE = "activate"
    DEACTIVATE = "deactivate"
    SWITCH = "switch"
    REFRESH = "refresh"
    RELOAD = "reload"
    SAVE = "save"
    RESTORE = "restore"


class ConfigFormat(Enum):
    """Configuration file formats"""
    JSON = "json"
    YAML = "yaml"
    TOML = "toml"
    ENV = "env"
    INI = "ini"
    XML = "xml"


class ActivityType(Enum):
    """Activity tracking types"""
    FILE_CHANGED = "file_changed"
    COMMIT_MADE = "commit_made"
    BRANCH_SWITCHED = "branch_switched"
    BUILD_RUN = "build_run"
    TEST_RUN = "test_run"
    DEPLOY_TRIGGERED = "deploy_triggered"
    CONFIG_CHANGED = "config_changed"
    DEPENDENCY_UPDATED = "dependency_updated"
    ERROR_OCCURRED = "error_occurred"
    SESSION_STARTED = "session_started"


# ============================================================
# DATACLASSES - Structured data models
# ============================================================

@dataclass
class GitInfo:
    """Git repository information"""
    branch: str = "main"
    state: GitState = GitState.CLEAN
    remote_url: Optional[str] = None
    last_commit_hash: Optional[str] = None
    last_commit_message: Optional[str] = None
    last_commit_author: Optional[str] = None
    last_commit_time: Optional[datetime] = None
    uncommitted_files: int = 0
    staged_files: int = 0
    untracked_files: int = 0
    ahead: int = 0
    behind: int = 0
    stash_count: int = 0

    def is_clean(self) -> bool:
        """Check if repository is clean"""
        return self.state == GitState.CLEAN and self.uncommitted_files == 0

    def get_sync_status(self) -> str:
        """Get sync status with remote"""
        if self.ahead > 0 and self.behind > 0:
            return f"diverged ({self.ahead} ahead, {self.behind} behind)"
        elif self.ahead > 0:
            return f"{self.ahead} commit(s) ahead"
        elif self.behind > 0:
            return f"{self.behind} commit(s) behind"
        return "up to date"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "branch": self.branch,
            "state": self.state.value,
            "remote_url": self.remote_url,
            "last_commit": {
                "hash": self.last_commit_hash,
                "message": self.last_commit_message,
                "author": self.last_commit_author,
                "time": self.last_commit_time.isoformat() if self.last_commit_time else None
            },
            "files": {
                "uncommitted": self.uncommitted_files,
                "staged": self.staged_files,
                "untracked": self.untracked_files
            },
            "sync": {
                "ahead": self.ahead,
                "behind": self.behind
            },
            "stash_count": self.stash_count
        }


@dataclass
class ProjectConfig:
    """Project configuration"""
    config_file: Optional[Path] = None
    format: ConfigFormat = ConfigFormat.JSON
    data: Dict[str, Any] = field(default_factory=dict)
    env_vars: Dict[str, str] = field(default_factory=dict)
    secrets: Set[str] = field(default_factory=set)
    loaded_at: Optional[datetime] = None

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value with dot notation support"""
        keys = key.split(".")
        value = self.data
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value

    def set(self, key: str, value: Any) -> None:
        """Set configuration value"""
        keys = key.split(".")
        data = self.data
        for k in keys[:-1]:
            if k not in data:
                data[k] = {}
            data = data[k]
        data[keys[-1]] = value

    def merge(self, other: Dict[str, Any]) -> None:
        """Merge configuration from another source"""
        def deep_merge(base: Dict, update: Dict) -> Dict:
            for key, value in update.items():
                if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                    deep_merge(base[key], value)
                else:
                    base[key] = value
            return base
        deep_merge(self.data, other)


@dataclass
class Dependency:
    """Project dependency"""
    name: str
    version: str
    dev_only: bool = False
    optional: bool = False
    source: Optional[str] = None
    resolved_version: Optional[str] = None

    def is_outdated(self, latest: str) -> bool:
        """Check if dependency is outdated"""
        # Simplified version comparison
        return self.version != latest


@dataclass
class ProjectStructure:
    """Project file structure analysis"""
    root_path: Path
    total_files: int = 0
    total_directories: int = 0
    source_files: int = 0
    test_files: int = 0
    config_files: int = 0
    doc_files: int = 0
    key_files: Dict[str, Path] = field(default_factory=dict)
    ignored_patterns: List[str] = field(default_factory=list)

    def get_key_file(self, name: str) -> Optional[Path]:
        """Get path to a key file"""
        return self.key_files.get(name)

    def add_key_file(self, name: str, path: Path) -> None:
        """Register a key file"""
        self.key_files[name] = path


@dataclass
class Activity:
    """Project activity record"""
    activity_type: ActivityType
    timestamp: datetime
    description: str
    file_path: Optional[str] = None
    user: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "type": self.activity_type.value,
            "timestamp": self.timestamp.isoformat(),
            "description": self.description,
            "file_path": self.file_path,
            "user": self.user,
            "metadata": self.metadata
        }


@dataclass
class ProjectTask:
    """Project task or todo item"""
    id: str
    title: str
    description: str = ""
    status: str = "pending"
    priority: Priority = Priority.MEDIUM
    assignee: Optional[str] = None
    due_date: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    def is_overdue(self) -> bool:
        """Check if task is overdue"""
        if self.due_date and self.status != "completed":
            return datetime.now() > self.due_date
        return False


@dataclass
class EnvironmentConfig:
    """Environment-specific configuration"""
    name: EnvironmentType
    variables: Dict[str, str] = field(default_factory=dict)
    api_endpoints: Dict[str, str] = field(default_factory=dict)
    feature_flags: Dict[str, bool] = field(default_factory=dict)
    database_url: Optional[str] = None
    cache_url: Optional[str] = None

    def to_env_file(self) -> str:
        """Generate .env file content"""
        lines = [f"# Environment: {self.name.value}"]
        for key, value in sorted(self.variables.items()):
            lines.append(f"{key}={value}")
        return "\n".join(lines)


@dataclass
class ProjectMetadata:
    """Project metadata"""
    name: str
    description: str = ""
    version: str = "0.0.0"
    project_type: ProjectType = ProjectType.WEB_APP
    status: ProjectStatus = ProjectStatus.DEVELOPMENT
    priority: Priority = Priority.MEDIUM
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    owner: Optional[str] = None
    team: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    repository_url: Optional[str] = None
    homepage_url: Optional[str] = None
    documentation_url: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "type": self.project_type.value,
            "status": self.status.value,
            "priority": self.priority.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "owner": self.owner,
            "team": self.team,
            "tags": self.tags,
            "urls": {
                "repository": self.repository_url,
                "homepage": self.homepage_url,
                "documentation": self.documentation_url
            }
        }


@dataclass
class Project:
    """Complete project representation"""
    id: str
    path: Path
    metadata: ProjectMetadata
    git_info: Optional[GitInfo] = None
    config: ProjectConfig = field(default_factory=ProjectConfig)
    structure: Optional[ProjectStructure] = None
    tech_stack: List[TechStack] = field(default_factory=list)
    package_manager: Optional[PackageManager] = None
    dependencies: List[Dependency] = field(default_factory=list)
    dev_dependencies: List[Dependency] = field(default_factory=list)
    activities: List[Activity] = field(default_factory=list)
    tasks: List[ProjectTask] = field(default_factory=list)
    environments: Dict[EnvironmentType, EnvironmentConfig] = field(default_factory=dict)
    last_accessed: Optional[datetime] = None
    session_count: int = 0

    def get_active_tasks(self) -> List[ProjectTask]:
        """Get non-completed tasks"""
        return [t for t in self.tasks if t.status != "completed"]

    def get_recent_activity(self, limit: int = 10) -> List[Activity]:
        """Get recent activities"""
        sorted_activities = sorted(
            self.activities,
            key=lambda a: a.timestamp,
            reverse=True
        )
        return sorted_activities[:limit]

    def add_activity(self, activity_type: ActivityType, description: str, **kwargs) -> None:
        """Record new activity"""
        activity = Activity(
            activity_type=activity_type,
            timestamp=datetime.now(),
            description=description,
            **kwargs
        )
        self.activities.append(activity)


@dataclass
class SessionContext:
    """Current session context"""
    active_project: Optional[Project] = None
    previous_projects: List[str] = field(default_factory=list)
    environment: EnvironmentType = EnvironmentType.DEVELOPMENT
    started_at: datetime = field(default_factory=datetime.now)
    last_action: Optional[ContextAction] = None
    workspace_projects: List[str] = field(default_factory=list)


# ============================================================
# ENGINE CLASSES - Core functionality
# ============================================================

class ProjectDetector:
    """Detect project type and configuration from filesystem"""

    # File patterns that indicate project types
    TYPE_INDICATORS = {
        ProjectType.NEXTJS: ["next.config.js", "next.config.mjs", "next.config.ts"],
        ProjectType.REACT: ["src/App.jsx", "src/App.tsx", "public/index.html"],
        ProjectType.VUE: ["vue.config.js", "src/App.vue", "vite.config.ts"],
        ProjectType.PYTHON: ["setup.py", "pyproject.toml", "requirements.txt"],
        ProjectType.CLI_TOOL: ["bin/", "cli.py", "cli.ts", "src/cli/"],
        ProjectType.LIBRARY: ["lib/", "src/index.ts", "src/lib/"],
        ProjectType.API_SERVICE: ["routes/", "controllers/", "src/routes/"],
        ProjectType.MOBILE_APP: ["ios/", "android/", "app.json"],
        ProjectType.DATA_PIPELINE: ["dags/", "pipelines/", "etl/"],
        ProjectType.ML_PROJECT: ["models/", "notebooks/", "training/"],
        ProjectType.INFRASTRUCTURE: ["terraform/", "pulumi/", "cdk/"],
        ProjectType.MONOREPO: ["packages/", "apps/", "pnpm-workspace.yaml", "turbo.json"],
    }

    PACKAGE_MANAGER_FILES = {
        PackageManager.NPM: "package-lock.json",
        PackageManager.YARN: "yarn.lock",
        PackageManager.PNPM: "pnpm-lock.yaml",
        PackageManager.BUN: "bun.lockb",
        PackageManager.PIP: "requirements.txt",
        PackageManager.POETRY: "poetry.lock",
        PackageManager.UV: "uv.lock",
        PackageManager.CARGO: "Cargo.lock",
        PackageManager.GO_MOD: "go.sum",
        PackageManager.COMPOSER: "composer.lock",
    }

    TECH_STACK_FILES = {
        TechStack.NEXTJS: ["next.config.js", "next.config.mjs"],
        TechStack.REACT: ["package.json"],  # Check for react dependency
        TechStack.VUE: ["vue.config.js"],
        TechStack.PYTHON: ["pyproject.toml", "setup.py"],
        TechStack.RUST: ["Cargo.toml"],
        TechStack.GO: ["go.mod"],
        TechStack.NODEJS: ["package.json"],
        TechStack.FLUTTER: ["pubspec.yaml"],
        TechStack.ELECTRON: ["electron.js", "main.js"],
    }

    def __init__(self, project_path: Path):
        self.path = project_path

    def detect_type(self) -> ProjectType:
        """Detect project type based on file patterns"""
        for project_type, indicators in self.TYPE_INDICATORS.items():
            for indicator in indicators:
                if (self.path / indicator).exists():
                    return project_type
        return ProjectType.WEB_APP  # Default

    def detect_package_manager(self) -> Optional[PackageManager]:
        """Detect package manager from lock files"""
        for pm, lock_file in self.PACKAGE_MANAGER_FILES.items():
            if (self.path / lock_file).exists():
                return pm
        return None

    def detect_tech_stack(self) -> List[TechStack]:
        """Detect technologies used in project"""
        detected = []

        # Check for specific files
        for stack, files in self.TECH_STACK_FILES.items():
            for f in files:
                if (self.path / f).exists():
                    detected.append(stack)
                    break

        # Check package.json for specific dependencies
        pkg_path = self.path / "package.json"
        if pkg_path.exists():
            try:
                with open(pkg_path) as f:
                    pkg = json.load(f)
                deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

                if "next" in deps:
                    if TechStack.NEXTJS not in detected:
                        detected.append(TechStack.NEXTJS)
                if "react" in deps:
                    if TechStack.REACT not in detected:
                        detected.append(TechStack.REACT)
                if "vue" in deps:
                    if TechStack.VUE not in detected:
                        detected.append(TechStack.VUE)
                if "svelte" in deps:
                    if TechStack.SVELTE not in detected:
                        detected.append(TechStack.SVELTE)
                if "electron" in deps:
                    if TechStack.ELECTRON not in detected:
                        detected.append(TechStack.ELECTRON)
            except (json.JSONDecodeError, IOError):
                pass

        return detected

    def analyze_structure(self) -> ProjectStructure:
        """Analyze project file structure"""
        structure = ProjectStructure(root_path=self.path)

        # Key file detection
        key_files = {
            "readme": ["README.md", "README.rst", "README.txt"],
            "license": ["LICENSE", "LICENSE.md", "LICENSE.txt"],
            "package": ["package.json", "pyproject.toml", "Cargo.toml", "go.mod"],
            "config": ["config.json", "config.yaml", ".env.example"],
            "docker": ["Dockerfile", "docker-compose.yml"],
            "ci": [".github/workflows", ".gitlab-ci.yml", "Jenkinsfile"],
        }

        for key, candidates in key_files.items():
            for candidate in candidates:
                path = self.path / candidate
                if path.exists():
                    structure.add_key_file(key, path)
                    break

        # Count files by category
        ignore_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}

        for item in self.path.rglob("*"):
            if any(ignored in item.parts for ignored in ignore_dirs):
                continue

            if item.is_file():
                structure.total_files += 1
                suffix = item.suffix.lower()

                if suffix in [".py", ".js", ".ts", ".jsx", ".tsx", ".rs", ".go"]:
                    structure.source_files += 1
                elif "test" in item.stem.lower() or "spec" in item.stem.lower():
                    structure.test_files += 1
                elif suffix in [".json", ".yaml", ".yml", ".toml", ".ini"]:
                    structure.config_files += 1
                elif suffix in [".md", ".rst", ".txt", ".adoc"]:
                    structure.doc_files += 1
            elif item.is_dir():
                structure.total_directories += 1

        return structure


class GitAnalyzer:
    """Analyze git repository state"""

    def __init__(self, repo_path: Path):
        self.path = repo_path

    def _run_git(self, *args) -> Optional[str]:
        """Run git command and return output"""
        try:
            result = subprocess.run(
                ["git", "-C", str(self.path)] + list(args),
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return None

    def is_git_repo(self) -> bool:
        """Check if path is a git repository"""
        return (self.path / ".git").exists()

    def get_info(self) -> GitInfo:
        """Get comprehensive git information"""
        if not self.is_git_repo():
            return GitInfo(state=GitState.UNINITIALIZED)

        info = GitInfo()

        # Current branch
        branch = self._run_git("rev-parse", "--abbrev-ref", "HEAD")
        if branch:
            info.branch = branch

        # Remote URL
        remote = self._run_git("remote", "get-url", "origin")
        if remote:
            info.remote_url = remote

        # Last commit info
        log_format = "%H|%s|%an|%ai"
        log_output = self._run_git("log", "-1", f"--format={log_format}")
        if log_output:
            parts = log_output.split("|")
            if len(parts) >= 4:
                info.last_commit_hash = parts[0][:8]
                info.last_commit_message = parts[1]
                info.last_commit_author = parts[2]
                try:
                    info.last_commit_time = datetime.fromisoformat(parts[3].replace(" ", "T").split("+")[0])
                except ValueError:
                    pass

        # Status counts
        status = self._run_git("status", "--porcelain")
        if status:
            lines = status.split("\n")
            for line in lines:
                if line.startswith("??"):
                    info.untracked_files += 1
                elif line.startswith(("A ", "M ", "D ", "R ")):
                    info.staged_files += 1
                elif line.startswith((" M", " D")):
                    info.uncommitted_files += 1

            if info.uncommitted_files > 0 or info.staged_files > 0:
                info.state = GitState.MODIFIED
            else:
                info.state = GitState.CLEAN

        # Ahead/behind
        upstream = self._run_git("rev-parse", "--abbrev-ref", "@{upstream}")
        if upstream:
            counts = self._run_git("rev-list", "--left-right", "--count", f"HEAD...{upstream}")
            if counts:
                parts = counts.split("\t")
                if len(parts) == 2:
                    info.ahead = int(parts[0])
                    info.behind = int(parts[1])

        # Stash count
        stash_list = self._run_git("stash", "list")
        if stash_list:
            info.stash_count = len(stash_list.split("\n"))

        return info


class ConfigLoader:
    """Load and manage project configurations"""

    CONFIG_FILES = {
        "package.json": ConfigFormat.JSON,
        "pyproject.toml": ConfigFormat.TOML,
        "config.json": ConfigFormat.JSON,
        "config.yaml": ConfigFormat.YAML,
        "config.yml": ConfigFormat.YAML,
        ".env": ConfigFormat.ENV,
        ".env.local": ConfigFormat.ENV,
    }

    def __init__(self, project_path: Path):
        self.path = project_path

    def load_config(self, filename: str) -> ProjectConfig:
        """Load configuration from file"""
        file_path = self.path / filename
        config = ProjectConfig(config_file=file_path)

        if not file_path.exists():
            return config

        format_type = self.CONFIG_FILES.get(filename, ConfigFormat.JSON)
        config.format = format_type
        config.loaded_at = datetime.now()

        try:
            with open(file_path) as f:
                content = f.read()

            if format_type == ConfigFormat.JSON:
                config.data = json.loads(content)
            elif format_type == ConfigFormat.ENV:
                for line in content.split("\n"):
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, value = line.split("=", 1)
                        config.env_vars[key.strip()] = value.strip()
            # YAML and TOML would need additional imports

        except (json.JSONDecodeError, IOError) as e:
            config.data = {"_load_error": str(e)}

        return config

    def find_configs(self) -> List[Path]:
        """Find all configuration files in project"""
        found = []
        for config_file in self.CONFIG_FILES:
            path = self.path / config_file
            if path.exists():
                found.append(path)
        return found

    def load_all(self) -> ProjectConfig:
        """Load and merge all configurations"""
        merged = ProjectConfig()

        for config_file, format_type in self.CONFIG_FILES.items():
            file_path = self.path / config_file
            if file_path.exists():
                loaded = self.load_config(config_file)
                merged.merge(loaded.data)
                merged.env_vars.update(loaded.env_vars)

        merged.loaded_at = datetime.now()
        return merged


class DependencyScanner:
    """Scan and analyze project dependencies"""

    def __init__(self, project_path: Path):
        self.path = project_path

    def scan_npm(self) -> tuple[List[Dependency], List[Dependency]]:
        """Scan npm dependencies from package.json"""
        deps = []
        dev_deps = []

        pkg_path = self.path / "package.json"
        if not pkg_path.exists():
            return deps, dev_deps

        try:
            with open(pkg_path) as f:
                pkg = json.load(f)

            for name, version in pkg.get("dependencies", {}).items():
                deps.append(Dependency(
                    name=name,
                    version=version.lstrip("^~"),
                    dev_only=False
                ))

            for name, version in pkg.get("devDependencies", {}).items():
                dev_deps.append(Dependency(
                    name=name,
                    version=version.lstrip("^~"),
                    dev_only=True
                ))
        except (json.JSONDecodeError, IOError):
            pass

        return deps, dev_deps

    def scan_python(self) -> tuple[List[Dependency], List[Dependency]]:
        """Scan Python dependencies from requirements or pyproject"""
        deps = []
        dev_deps = []

        # Check requirements.txt
        req_path = self.path / "requirements.txt"
        if req_path.exists():
            try:
                with open(req_path) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            if "==" in line:
                                name, version = line.split("==", 1)
                            elif ">=" in line:
                                name, version = line.split(">=", 1)
                            else:
                                name, version = line, "latest"
                            deps.append(Dependency(name=name.strip(), version=version.strip()))
            except IOError:
                pass

        # Check requirements-dev.txt
        dev_req_path = self.path / "requirements-dev.txt"
        if dev_req_path.exists():
            try:
                with open(dev_req_path) as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            if "==" in line:
                                name, version = line.split("==", 1)
                            else:
                                name, version = line, "latest"
                            dev_deps.append(Dependency(name=name.strip(), version=version.strip(), dev_only=True))
            except IOError:
                pass

        return deps, dev_deps

    def scan_all(self) -> tuple[List[Dependency], List[Dependency]]:
        """Scan all dependencies based on project type"""
        npm_deps, npm_dev = self.scan_npm()
        py_deps, py_dev = self.scan_python()

        return npm_deps + py_deps, npm_dev + py_dev


class ProjectRegistry:
    """Manage project catalog and persistence"""

    def __init__(self, registry_path: Optional[Path] = None):
        self.registry_path = registry_path or Path.home() / ".project-registry.json"
        self.projects: Dict[str, Dict] = {}
        self._load()

    def _load(self) -> None:
        """Load registry from disk"""
        if self.registry_path.exists():
            try:
                with open(self.registry_path) as f:
                    self.projects = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.projects = {}

    def _save(self) -> None:
        """Save registry to disk"""
        try:
            with open(self.registry_path, "w") as f:
                json.dump(self.projects, f, indent=2, default=str)
        except IOError:
            pass

    def register(self, project: Project) -> None:
        """Register a project"""
        self.projects[project.id] = {
            "id": project.id,
            "path": str(project.path),
            "name": project.metadata.name,
            "type": project.metadata.project_type.value,
            "status": project.metadata.status.value,
            "last_accessed": datetime.now().isoformat(),
            "session_count": project.session_count
        }
        self._save()

    def get(self, project_id: str) -> Optional[Dict]:
        """Get project by ID"""
        return self.projects.get(project_id)

    def find_by_name(self, name: str) -> Optional[Dict]:
        """Find project by name"""
        for project in self.projects.values():
            if project["name"].lower() == name.lower():
                return project
        return None

    def find_by_path(self, path: Path) -> Optional[Dict]:
        """Find project by path"""
        path_str = str(path.resolve())
        for project in self.projects.values():
            if project["path"] == path_str:
                return project
        return None

    def list_all(self) -> List[Dict]:
        """List all registered projects"""
        return list(self.projects.values())

    def list_by_status(self, status: ProjectStatus) -> List[Dict]:
        """List projects by status"""
        return [p for p in self.projects.values() if p["status"] == status.value]

    def remove(self, project_id: str) -> bool:
        """Remove project from registry"""
        if project_id in self.projects:
            del self.projects[project_id]
            self._save()
            return True
        return False


class SessionManager:
    """Manage session state and context"""

    def __init__(self, session_path: Optional[Path] = None):
        self.session_path = session_path or Path.home() / ".project-session.json"
        self.context = SessionContext()
        self._load()

    def _load(self) -> None:
        """Load session from disk"""
        if self.session_path.exists():
            try:
                with open(self.session_path) as f:
                    data = json.load(f)
                    self.context.previous_projects = data.get("previous_projects", [])
                    self.context.workspace_projects = data.get("workspace_projects", [])
                    if data.get("environment"):
                        self.context.environment = EnvironmentType(data["environment"])
            except (json.JSONDecodeError, IOError):
                pass

    def _save(self) -> None:
        """Save session to disk"""
        try:
            data = {
                "active_project": self.context.active_project.id if self.context.active_project else None,
                "previous_projects": self.context.previous_projects[-10:],  # Keep last 10
                "workspace_projects": self.context.workspace_projects,
                "environment": self.context.environment.value,
                "last_action": self.context.last_action.value if self.context.last_action else None
            }
            with open(self.session_path, "w") as f:
                json.dump(data, f, indent=2)
        except IOError:
            pass

    def activate(self, project: Project) -> None:
        """Activate a project in the session"""
        if self.context.active_project:
            self.context.previous_projects.append(self.context.active_project.id)

        self.context.active_project = project
        self.context.last_action = ContextAction.ACTIVATE
        project.last_accessed = datetime.now()
        project.session_count += 1
        project.add_activity(
            ActivityType.SESSION_STARTED,
            f"Session started in {self.context.environment.value} environment"
        )
        self._save()

    def deactivate(self) -> Optional[Project]:
        """Deactivate current project"""
        project = self.context.active_project
        self.context.active_project = None
        self.context.last_action = ContextAction.DEACTIVATE
        self._save()
        return project

    def switch(self, new_project: Project) -> Optional[Project]:
        """Switch to a different project"""
        old_project = self.deactivate()
        self.activate(new_project)
        self.context.last_action = ContextAction.SWITCH
        return old_project

    def get_recent_projects(self, limit: int = 5) -> List[str]:
        """Get recently accessed project IDs"""
        return self.context.previous_projects[-limit:][::-1]


# ============================================================
# MAIN ENGINE
# ============================================================

class ProjectEngine:
    """Main project management engine"""

    def __init__(self, registry_path: Optional[Path] = None, session_path: Optional[Path] = None):
        self.registry = ProjectRegistry(registry_path)
        self.session = SessionManager(session_path)

    def load_project(self, path: Path) -> Project:
        """Load a project from path"""
        path = path.resolve()

        # Generate project ID
        project_id = hashlib.md5(str(path).encode()).hexdigest()[:12]

        # Detect project characteristics
        detector = ProjectDetector(path)
        project_type = detector.detect_type()
        tech_stack = detector.detect_tech_stack()
        package_manager = detector.detect_package_manager()
        structure = detector.analyze_structure()

        # Analyze git
        git_analyzer = GitAnalyzer(path)
        git_info = git_analyzer.get_info()

        # Load configuration
        config_loader = ConfigLoader(path)
        config = config_loader.load_all()

        # Scan dependencies
        dep_scanner = DependencyScanner(path)
        deps, dev_deps = dep_scanner.scan_all()

        # Extract metadata
        name = config.get("name", path.name)
        description = config.get("description", "")
        version = config.get("version", "0.0.0")

        metadata = ProjectMetadata(
            name=name,
            description=description,
            version=version,
            project_type=project_type,
            status=ProjectStatus.DEVELOPMENT,
            repository_url=git_info.remote_url
        )

        # Create project
        project = Project(
            id=project_id,
            path=path,
            metadata=metadata,
            git_info=git_info,
            config=config,
            structure=structure,
            tech_stack=tech_stack,
            package_manager=package_manager,
            dependencies=deps,
            dev_dependencies=dev_deps
        )

        # Register and return
        self.registry.register(project)
        return project

    def activate_project(self, path_or_name: str) -> Optional[Project]:
        """Activate a project by path or name"""
        # Try as path first
        try:
            path = Path(path_or_name).resolve()
            if path.exists() and path.is_dir():
                project = self.load_project(path)
                self.session.activate(project)
                return project
        except Exception:
            pass

        # Try as name in registry
        entry = self.registry.find_by_name(path_or_name)
        if entry:
            project = self.load_project(Path(entry["path"]))
            self.session.activate(project)
            return project

        return None

    def get_active_project(self) -> Optional[Project]:
        """Get currently active project"""
        return self.session.context.active_project

    def switch_project(self, path_or_name: str) -> tuple[Optional[Project], Optional[Project]]:
        """Switch to a different project"""
        new_project = self.activate_project(path_or_name)
        if new_project:
            old_project_id = self.session.context.previous_projects[-1] if self.session.context.previous_projects else None
            return new_project, None
        return None, None

    def list_projects(self, status: Optional[ProjectStatus] = None) -> List[Dict]:
        """List all registered projects"""
        if status:
            return self.registry.list_by_status(status)
        return self.registry.list_all()

    def get_recent_projects(self, limit: int = 5) -> List[Dict]:
        """Get recently accessed projects"""
        recent_ids = self.session.get_recent_projects(limit)
        projects = []
        for pid in recent_ids:
            entry = self.registry.get(pid)
            if entry:
                projects.append(entry)
        return projects

    def close_project(self) -> Optional[Project]:
        """Close the current project"""
        return self.session.deactivate()

    def refresh_project(self) -> Optional[Project]:
        """Refresh current project state"""
        project = self.session.context.active_project
        if project:
            return self.load_project(project.path)
        return None


# ============================================================
# REPORTER - Output Generation
# ============================================================

class ProjectReporter:
    """Generate formatted project reports"""

    STATUS_ICONS = {
        ProjectStatus.ACTIVE: "●",
        ProjectStatus.PAUSED: "◐",
        ProjectStatus.ARCHIVED: "○",
        ProjectStatus.DEPRECATED: "✗",
        ProjectStatus.MAINTENANCE: "◑",
        ProjectStatus.DEVELOPMENT: "◉",
        ProjectStatus.PRODUCTION: "★",
        ProjectStatus.STAGING: "◈",
        ProjectStatus.TESTING: "◇",
    }

    GIT_STATE_ICONS = {
        GitState.CLEAN: "✓",
        GitState.MODIFIED: "●",
        GitState.STAGED: "◉",
        GitState.CONFLICTED: "✗",
        GitState.REBASING: "↻",
        GitState.MERGING: "⟷",
        GitState.DETACHED: "⊙",
        GitState.UNINITIALIZED: "○",
    }

    PRIORITY_ICONS = {
        Priority.CRITICAL: "🔴",
        Priority.HIGH: "🟠",
        Priority.MEDIUM: "🟡",
        Priority.LOW: "🟢",
        Priority.BACKLOG: "⚪",
    }

    @classmethod
    def generate_activation_report(cls, project: Project) -> str:
        """Generate project activation report"""
        lines = [
            "PROJECT ACTIVATED",
            "═" * 55,
            f"Name: {project.metadata.name}",
            f"Path: {project.path}",
            f"Type: {project.metadata.project_type.value}",
            "═" * 55,
            "",
            "PROJECT STATUS",
            "─" * 55,
        ]

        # Git info box
        if project.git_info:
            gi = project.git_info
            state_icon = cls.GIT_STATE_ICONS.get(gi.state, "?")
            lines.extend([
                "┌" + "─" * 53 + "┐",
                "│       PROJECT CONTEXT" + " " * 31 + "│",
                "│" + " " * 53 + "│",
                f"│  Project: {project.metadata.name:<41} │",
                f"│  Type: {project.metadata.project_type.value:<44} │",
                f"│  Status: {cls.STATUS_ICONS.get(project.metadata.status, '?')} {project.metadata.status.value:<40} │",
                "│" + " " * 53 + "│",
                "│  Git Status:" + " " * 40 + "│",
                f"│  ├── Branch:     {gi.branch:<34} │",
                f"│  ├── State:      {state_icon} {gi.state.value:<32} │",
                f"│  ├── Uncommitted: {gi.uncommitted_files:<5} files" + " " * 23 + "│",
                f"│  └── Last Commit: {gi.last_commit_hash or 'N/A':<33} │",
                "│" + " " * 53 + "│",
                f"│  Last Activity: {project.last_accessed.strftime('%Y-%m-%d %H:%M') if project.last_accessed else 'Now':<35} │",
                "└" + "─" * 53 + "┘",
            ])

        # Project info table
        lines.extend([
            "",
            "PROJECT INFO",
            "─" * 55,
            "| Property | Value |",
            "|----------|-------|",
            f"| Name | {project.metadata.name} |",
            f"| Path | {project.path} |",
            f"| Type | {project.metadata.project_type.value} |",
            f"| Version | {project.metadata.version} |",
            f"| Stack | {', '.join(s.value for s in project.tech_stack[:3])} |",
        ])

        # Available commands box
        lines.extend([
            "",
            "AVAILABLE COMMANDS",
            "─" * 55,
            "┌" + "─" * 53 + "┐",
            "│  Project Actions:" + " " * 35 + "│",
            "│  • status    - Check project status" + " " * 17 + "│",
            "│  • build     - Run build" + " " * 28 + "│",
            "│  • test      - Run tests" + " " * 28 + "│",
            "│  • deploy    - Deploy project" + " " * 23 + "│",
            "│  • logs      - View logs" + " " * 28 + "│",
            "│" + " " * 53 + "│",
            "│  Navigation:" + " " * 40 + "│",
            "│  • structure - Show file structure" + " " * 18 + "│",
            "│  • recent    - Recent changes" + " " * 23 + "│",
            "│  • tasks     - Open tasks" + " " * 27 + "│",
            "└" + "─" * 53 + "┘",
        ])

        # Recent activity
        if project.activities:
            lines.extend([
                "",
                "RECENT ACTIVITY",
                "─" * 55,
                "| Activity | Time | User |",
                "|----------|------|------|",
            ])
            for activity in project.get_recent_activity(3):
                time_str = activity.timestamp.strftime("%H:%M")
                lines.append(f"| {activity.description[:30]} | {time_str} | {activity.user or 'system'} |")

        lines.extend([
            "",
            "CONTEXT LOADED",
            "─" * 55,
            f"Project '{project.metadata.name}' is now active. Ready for commands.",
        ])

        return "\n".join(lines)

    @classmethod
    def generate_list_report(cls, projects: List[Dict]) -> str:
        """Generate project list report"""
        if not projects:
            return "No projects registered. Use `/project [path]` to add a project."

        lines = [
            "REGISTERED PROJECTS",
            "═" * 55,
            "",
            "| Name | Type | Status | Last Accessed |",
            "|------|------|--------|---------------|",
        ]

        for p in projects:
            status_icon = "●" if p.get("status") == "active" else "○"
            last_accessed = p.get("last_accessed", "Never")[:10]
            lines.append(f"| {p['name'][:20]} | {p['type'][:15]} | {status_icon} {p['status'][:10]} | {last_accessed} |")

        lines.extend([
            "",
            f"Total: {len(projects)} project(s)",
            "",
            "Use `/project [name]` to activate a project.",
        ])

        return "\n".join(lines)

    @classmethod
    def generate_status_report(cls, project: Project) -> str:
        """Generate current status report"""
        gi = project.git_info

        lines = [
            f"PROJECT: {project.metadata.name.upper()}",
            "═" * 55,
            f"Status: {cls.STATUS_ICONS.get(project.metadata.status, '?')} {project.metadata.status.value}",
            f"Type: {project.metadata.project_type.value}",
            f"Path: {project.path}",
            "═" * 55,
        ]

        if gi:
            lines.extend([
                "",
                "GIT STATUS",
                "─" * 55,
                f"Branch: {gi.branch}",
                f"State: {cls.GIT_STATE_ICONS.get(gi.state, '?')} {gi.state.value}",
                f"Sync: {gi.get_sync_status()}",
                "",
                f"  Uncommitted: {gi.uncommitted_files}",
                f"  Staged: {gi.staged_files}",
                f"  Untracked: {gi.untracked_files}",
                f"  Stashes: {gi.stash_count}",
            ])

            if gi.last_commit_hash:
                lines.extend([
                    "",
                    "LAST COMMIT",
                    "─" * 55,
                    f"Hash: {gi.last_commit_hash}",
                    f"Message: {gi.last_commit_message[:50]}",
                    f"Author: {gi.last_commit_author}",
                ])

        # Dependencies summary
        if project.dependencies:
            lines.extend([
                "",
                "DEPENDENCIES",
                "─" * 55,
                f"  Production: {len(project.dependencies)}",
                f"  Development: {len(project.dev_dependencies)}",
            ])

        # Structure summary
        if project.structure:
            lines.extend([
                "",
                "STRUCTURE",
                "─" * 55,
                f"  Files: {project.structure.total_files}",
                f"  Source: {project.structure.source_files}",
                f"  Tests: {project.structure.test_files}",
                f"  Config: {project.structure.config_files}",
            ])

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="PROJECT.EXE - Project Context Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Activate command
    activate_parser = subparsers.add_parser("activate", help="Activate a project")
    activate_parser.add_argument("path_or_name", help="Project path or registered name")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show current project status")

    # List command
    list_parser = subparsers.add_parser("list", help="List all projects")
    list_parser.add_argument("--status", choices=["active", "paused", "archived"], help="Filter by status")

    # Switch command
    switch_parser = subparsers.add_parser("switch", help="Switch to another project")
    switch_parser.add_argument("path_or_name", help="Project to switch to")

    # Close command
    close_parser = subparsers.add_parser("close", help="Close current project")

    # Recent command
    recent_parser = subparsers.add_parser("recent", help="Show recently accessed projects")
    recent_parser.add_argument("-n", type=int, default=5, help="Number to show")

    # Refresh command
    refresh_parser = subparsers.add_parser("refresh", help="Refresh current project state")

    args = parser.parse_args()

    engine = ProjectEngine()
    reporter = ProjectReporter()

    if args.command == "activate":
        project = engine.activate_project(args.path_or_name)
        if project:
            print(reporter.generate_activation_report(project))
        else:
            print(f"Could not find project: {args.path_or_name}")

    elif args.command == "status":
        project = engine.get_active_project()
        if project:
            print(reporter.generate_status_report(project))
        else:
            print("No active project. Use `/project [path]` to activate one.")

    elif args.command == "list":
        status = ProjectStatus(args.status) if args.status else None
        projects = engine.list_projects(status)
        print(reporter.generate_list_report(projects))

    elif args.command == "switch":
        new_project, _ = engine.switch_project(args.path_or_name)
        if new_project:
            print(reporter.generate_activation_report(new_project))
        else:
            print(f"Could not switch to: {args.path_or_name}")

    elif args.command == "close":
        project = engine.close_project()
        if project:
            print(f"Closed project: {project.metadata.name}")
        else:
            print("No active project to close.")

    elif args.command == "recent":
        projects = engine.get_recent_projects(args.n)
        print(reporter.generate_list_report(projects))

    elif args.command == "refresh":
        project = engine.refresh_project()
        if project:
            print(reporter.generate_status_report(project))
        else:
            print("No active project to refresh.")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: SELECT
1. Parse project identifier
2. Locate project path
3. Validate project exists
4. Check accessibility
5. Verify configuration

### Phase 2: LOAD
1. Load project configuration
2. Set environment variables
3. Activate project context
4. Initialize services
5. Restore previous state

### Phase 3: ORIENT
1. Display project info
2. Show current state
3. List recent activity
4. Identify priorities
5. Map dependencies

### Phase 4: READY
1. Confirm activation
2. Show available commands
3. Offer assistance
4. Log activation
5. Enable project features

---

## PROJECT TYPES

| Type | Description | Features |
|------|-------------|----------|
| Development | Code projects | Build, test, deploy |
| Production | Live systems | Monitor, operate |
| Research | Exploration | Notes, findings |
| Business | Non-code projects | Docs, planning |
| Personal | Individual projects | Custom workflows |

## QUICK COMMANDS

- `/project [name]` - Activate project by name
- `/project list` - List all available projects
- `/project status` - Current project status
- `/project switch [name]` - Switch to another project
- `/project close` - Deactivate current project

$ARGUMENTS
