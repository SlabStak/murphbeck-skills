# CURSOR.RULES.EXE - Cursor IDE AI Rules Generator

You are **CURSOR.RULES.EXE** - the AI specialist for generating optimized .cursorrules files that supercharge Cursor IDE's AI assistant.

---

## CORE MODULES

### RulesEngine.MOD
- Project analysis
- Framework detection
- Pattern extraction
- Rules generation

### FrameworkTemplates.MOD
- Next.js configurations
- React patterns
- Python/FastAPI rules
- Node.js standards

### StyleEnforcement.MOD
- Code style rules
- Naming conventions
- Architecture patterns
- Best practices

### ContextOptimization.MOD
- File prioritization
- Ignore patterns
- Context windows
- Token optimization

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CURSOR.RULES.EXE - Cursor IDE AI Rules Generator
Production-ready .cursorrules file generator for any project type.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Set
from enum import Enum
from pathlib import Path
import json


# ============================================================
# ENUMS - Framework & Rule Categories
# ============================================================

class Framework(Enum):
    """Supported frameworks and languages."""
    NEXTJS = "nextjs"
    REACT = "react"
    VUE = "vue"
    SVELTE = "svelte"
    ANGULAR = "angular"
    REMIX = "remix"
    ASTRO = "astro"
    PYTHON = "python"
    FASTAPI = "fastapi"
    DJANGO = "django"
    FLASK = "flask"
    NODE = "node"
    EXPRESS = "express"
    NESTJS = "nestjs"
    GO = "go"
    RUST = "rust"
    TYPESCRIPT = "typescript"
    TAILWIND = "tailwind"
    PRISMA = "prisma"
    DRIZZLE = "drizzle"

    @property
    def display_name(self) -> str:
        """Human-readable framework name."""
        names = {
            "nextjs": "Next.js",
            "react": "React",
            "vue": "Vue.js",
            "svelte": "SvelteKit",
            "angular": "Angular",
            "remix": "Remix",
            "astro": "Astro",
            "python": "Python",
            "fastapi": "FastAPI",
            "django": "Django",
            "flask": "Flask",
            "node": "Node.js",
            "express": "Express.js",
            "nestjs": "NestJS",
            "go": "Go",
            "rust": "Rust",
            "typescript": "TypeScript",
            "tailwind": "Tailwind CSS",
            "prisma": "Prisma",
            "drizzle": "Drizzle ORM"
        }
        return names.get(self.value, self.value.title())

    @property
    def file_extensions(self) -> List[str]:
        """Primary file extensions for this framework."""
        extensions = {
            "nextjs": [".tsx", ".ts", ".jsx", ".js"],
            "react": [".tsx", ".ts", ".jsx", ".js"],
            "vue": [".vue", ".ts", ".js"],
            "svelte": [".svelte", ".ts", ".js"],
            "angular": [".ts", ".html", ".scss"],
            "remix": [".tsx", ".ts"],
            "astro": [".astro", ".tsx", ".ts"],
            "python": [".py"],
            "fastapi": [".py"],
            "django": [".py", ".html"],
            "flask": [".py", ".html"],
            "node": [".js", ".ts"],
            "express": [".js", ".ts"],
            "nestjs": [".ts"],
            "go": [".go"],
            "rust": [".rs"],
            "typescript": [".ts", ".tsx"],
            "tailwind": [".css", ".tsx", ".jsx"],
            "prisma": [".prisma"],
            "drizzle": [".ts"]
        }
        return extensions.get(self.value, [])

    @property
    def config_files(self) -> List[str]:
        """Configuration files that indicate this framework."""
        configs = {
            "nextjs": ["next.config.js", "next.config.mjs", "next.config.ts"],
            "react": ["package.json"],
            "vue": ["vue.config.js", "nuxt.config.ts", "vite.config.ts"],
            "svelte": ["svelte.config.js"],
            "angular": ["angular.json"],
            "remix": ["remix.config.js"],
            "astro": ["astro.config.mjs"],
            "python": ["pyproject.toml", "setup.py", "requirements.txt"],
            "fastapi": ["main.py"],
            "django": ["manage.py", "settings.py"],
            "flask": ["app.py"],
            "node": ["package.json"],
            "express": ["package.json"],
            "nestjs": ["nest-cli.json"],
            "go": ["go.mod"],
            "rust": ["Cargo.toml"],
            "typescript": ["tsconfig.json"],
            "tailwind": ["tailwind.config.js", "tailwind.config.ts"],
            "prisma": ["schema.prisma"],
            "drizzle": ["drizzle.config.ts"]
        }
        return configs.get(self.value, [])


class RuleCategory(Enum):
    """Categories of cursor rules."""
    PERSONA = "persona"
    CODE_STYLE = "code_style"
    ARCHITECTURE = "architecture"
    NAMING = "naming"
    TESTING = "testing"
    DOCUMENTATION = "documentation"
    SECURITY = "security"
    PERFORMANCE = "performance"
    ACCESSIBILITY = "accessibility"
    ERROR_HANDLING = "error_handling"
    FILE_STRUCTURE = "file_structure"
    DEPENDENCIES = "dependencies"
    GIT = "git"
    CONTEXT = "context"

    @property
    def priority(self) -> int:
        """Priority order for rules (lower = higher priority)."""
        priorities = {
            "persona": 1,
            "architecture": 2,
            "code_style": 3,
            "naming": 4,
            "file_structure": 5,
            "error_handling": 6,
            "testing": 7,
            "security": 8,
            "performance": 9,
            "accessibility": 10,
            "documentation": 11,
            "dependencies": 12,
            "git": 13,
            "context": 14
        }
        return priorities.get(self.value, 99)

    @property
    def section_header(self) -> str:
        """Markdown section header for this category."""
        headers = {
            "persona": "## AI Persona & Behavior",
            "code_style": "## Code Style",
            "architecture": "## Architecture Patterns",
            "naming": "## Naming Conventions",
            "testing": "## Testing Standards",
            "documentation": "## Documentation",
            "security": "## Security Practices",
            "performance": "## Performance Guidelines",
            "accessibility": "## Accessibility",
            "error_handling": "## Error Handling",
            "file_structure": "## File Structure",
            "dependencies": "## Dependencies",
            "git": "## Git Conventions",
            "context": "## Context & Files"
        }
        return headers.get(self.value, f"## {self.value.title()}")


class CodingStyle(Enum):
    """Coding style preferences."""
    FUNCTIONAL = "functional"
    OOP = "oop"
    MIXED = "mixed"
    DECLARATIVE = "declarative"
    IMPERATIVE = "imperative"

    @property
    def description(self) -> str:
        """Description of this coding style."""
        descriptions = {
            "functional": "Prefer pure functions, immutability, and composition",
            "oop": "Use classes, inheritance, and encapsulation",
            "mixed": "Balance functional and OOP patterns as appropriate",
            "declarative": "Focus on what to do, not how to do it",
            "imperative": "Step-by-step instructions and mutations"
        }
        return descriptions.get(self.value, "")


class Strictness(Enum):
    """How strict the AI should be with rules."""
    RELAXED = "relaxed"
    MODERATE = "moderate"
    STRICT = "strict"
    PEDANTIC = "pedantic"

    @property
    def enforcement_level(self) -> str:
        """Description of enforcement level."""
        levels = {
            "relaxed": "Suggest improvements but allow flexibility",
            "moderate": "Follow conventions with reasonable exceptions",
            "strict": "Always follow rules, explain if deviating",
            "pedantic": "Never deviate from established patterns"
        }
        return levels.get(self.value, "")


# ============================================================
# DATACLASSES - Rule Definitions
# ============================================================

@dataclass
class Rule:
    """A single cursor rule."""
    category: RuleCategory
    content: str
    priority: int = 0
    framework_specific: Optional[Framework] = None

    def __post_init__(self):
        if self.priority == 0:
            self.priority = self.category.priority


@dataclass
class PersonaConfig:
    """AI persona configuration."""
    name: str = "Senior Developer"
    expertise: List[str] = field(default_factory=list)
    communication_style: str = "concise and technical"
    strictness: Strictness = Strictness.MODERATE

    @classmethod
    def senior_fullstack(cls) -> "PersonaConfig":
        """Senior full-stack developer persona."""
        return cls(
            name="Senior Full-Stack Developer",
            expertise=["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
            communication_style="concise, technical, and pragmatic",
            strictness=Strictness.MODERATE
        )

    @classmethod
    def principal_engineer(cls) -> "PersonaConfig":
        """Principal engineer persona."""
        return cls(
            name="Principal Engineer",
            expertise=["System Design", "Architecture", "Performance", "Security"],
            communication_style="thorough, architectural, considers trade-offs",
            strictness=Strictness.STRICT
        )

    @classmethod
    def startup_hacker(cls) -> "PersonaConfig":
        """Fast-moving startup developer persona."""
        return cls(
            name="Startup Engineer",
            expertise=["Rapid Prototyping", "MVP Development", "Full-Stack"],
            communication_style="fast, practical, ship-focused",
            strictness=Strictness.RELAXED
        )

    def to_rules(self) -> str:
        """Generate persona rules."""
        expertise_str = ", ".join(self.expertise) if self.expertise else "general software development"
        return f"""You are a {self.name} with expertise in {expertise_str}.

Communication style: {self.communication_style}

Enforcement: {self.strictness.enforcement_level}"""


@dataclass
class ProjectConfig:
    """Project configuration for rules generation."""
    name: str
    frameworks: List[Framework] = field(default_factory=list)
    coding_style: CodingStyle = CodingStyle.MIXED
    use_typescript: bool = True
    use_eslint: bool = True
    use_prettier: bool = True
    test_framework: Optional[str] = None
    ui_library: Optional[str] = None
    state_management: Optional[str] = None
    api_style: Optional[str] = None  # REST, GraphQL, tRPC
    database: Optional[str] = None
    deployment: Optional[str] = None

    @classmethod
    def nextjs_app(cls, name: str) -> "ProjectConfig":
        """Standard Next.js App Router project."""
        return cls(
            name=name,
            frameworks=[Framework.NEXTJS, Framework.REACT, Framework.TYPESCRIPT, Framework.TAILWIND],
            coding_style=CodingStyle.FUNCTIONAL,
            use_typescript=True,
            test_framework="vitest",
            ui_library="shadcn/ui",
            state_management="zustand",
            api_style="Server Actions + tRPC",
            database="PostgreSQL + Prisma",
            deployment="Vercel"
        )

    @classmethod
    def python_api(cls, name: str) -> "ProjectConfig":
        """FastAPI backend project."""
        return cls(
            name=name,
            frameworks=[Framework.FASTAPI, Framework.PYTHON],
            coding_style=CodingStyle.MIXED,
            use_typescript=False,
            test_framework="pytest",
            api_style="REST + OpenAPI",
            database="PostgreSQL + SQLAlchemy",
            deployment="Docker + AWS"
        )

    @classmethod
    def react_spa(cls, name: str) -> "ProjectConfig":
        """React Single Page Application."""
        return cls(
            name=name,
            frameworks=[Framework.REACT, Framework.TYPESCRIPT, Framework.TAILWIND],
            coding_style=CodingStyle.FUNCTIONAL,
            use_typescript=True,
            test_framework="vitest + testing-library",
            ui_library="Radix UI",
            state_management="React Query + Zustand",
            api_style="REST",
            deployment="Vercel/Netlify"
        )


@dataclass
class ContextConfig:
    """Context window optimization configuration."""
    always_include: List[str] = field(default_factory=list)
    prefer_include: List[str] = field(default_factory=list)
    always_ignore: List[str] = field(default_factory=list)
    max_file_size: int = 10000  # lines

    @classmethod
    def default(cls) -> "ContextConfig":
        """Default context configuration."""
        return cls(
            always_include=[
                "package.json",
                "tsconfig.json",
                ".env.example",
                "README.md"
            ],
            prefer_include=[
                "src/types/**",
                "src/lib/**",
                "src/utils/**",
                "src/hooks/**"
            ],
            always_ignore=[
                "node_modules/**",
                ".git/**",
                "dist/**",
                "build/**",
                ".next/**",
                "coverage/**",
                "*.min.js",
                "*.min.css",
                "package-lock.json",
                "yarn.lock",
                "pnpm-lock.yaml"
            ]
        )

    @classmethod
    def python(cls) -> "ContextConfig":
        """Python project context configuration."""
        return cls(
            always_include=[
                "pyproject.toml",
                "requirements.txt",
                ".env.example"
            ],
            prefer_include=[
                "src/**/*.py",
                "app/**/*.py",
                "tests/**/*.py"
            ],
            always_ignore=[
                "__pycache__/**",
                ".venv/**",
                "venv/**",
                "*.pyc",
                ".pytest_cache/**",
                ".mypy_cache/**",
                "dist/**",
                "build/**",
                "*.egg-info/**"
            ]
        )


# ============================================================
# RULE GENERATORS
# ============================================================

class PersonaRulesGenerator:
    """Generate AI persona rules."""

    @staticmethod
    def generate(persona: PersonaConfig) -> List[Rule]:
        """Generate persona rules."""
        rules = []

        rules.append(Rule(
            category=RuleCategory.PERSONA,
            content=persona.to_rules()
        ))

        rules.append(Rule(
            category=RuleCategory.PERSONA,
            content="""When responding:
- Be direct and avoid unnecessary preamble
- Show code first, explain after if needed
- Anticipate follow-up questions
- Suggest improvements proactively
- Admit uncertainty rather than guessing"""
        ))

        return rules


class CodeStyleRulesGenerator:
    """Generate code style rules."""

    def __init__(self, config: ProjectConfig):
        self.config = config

    def generate(self) -> List[Rule]:
        """Generate code style rules."""
        rules = []

        # TypeScript rules
        if self.config.use_typescript:
            rules.append(Rule(
                category=RuleCategory.CODE_STYLE,
                content="""TypeScript:
- Use strict mode always
- Prefer `type` over `interface` for object types
- Use `unknown` over `any`, narrow types explicitly
- Define return types for functions
- Use const assertions for literals
- Prefer `satisfies` for type checking without widening"""
            ))

        # Functional style rules
        if self.config.coding_style == CodingStyle.FUNCTIONAL:
            rules.append(Rule(
                category=RuleCategory.CODE_STYLE,
                content="""Functional patterns:
- Prefer pure functions without side effects
- Use immutable data structures
- Compose small functions over large classes
- Use map/filter/reduce over for loops
- Avoid mutations, return new objects
- Use early returns to reduce nesting"""
            ))

        # Framework-specific rules
        for framework in self.config.frameworks:
            if framework == Framework.NEXTJS:
                rules.extend(self._nextjs_rules())
            elif framework == Framework.REACT:
                rules.extend(self._react_rules())
            elif framework == Framework.FASTAPI:
                rules.extend(self._fastapi_rules())
            elif framework == Framework.TAILWIND:
                rules.extend(self._tailwind_rules())

        return rules

    def _nextjs_rules(self) -> List[Rule]:
        """Next.js specific rules."""
        return [
            Rule(
                category=RuleCategory.CODE_STYLE,
                framework_specific=Framework.NEXTJS,
                content="""Next.js App Router:
- Use Server Components by default
- Add 'use client' only when needed (hooks, browser APIs, interactivity)
- Prefer Server Actions over API routes for mutations
- Use `loading.tsx` and `error.tsx` for loading/error states
- Implement proper metadata for SEO
- Use `generateStaticParams` for dynamic routes when possible
- Prefer `next/image` for all images
- Use `next/font` for font optimization"""
            ),
            Rule(
                category=RuleCategory.FILE_STRUCTURE,
                framework_specific=Framework.NEXTJS,
                content="""Next.js file structure:
```
app/
├── (auth)/           # Route groups
│   ├── login/
│   └── register/
├── (dashboard)/
│   └── [orgId]/
├── api/              # API routes (when needed)
├── layout.tsx
├── page.tsx
└── globals.css
components/
├── ui/               # shadcn/ui components
├── forms/            # Form components
└── [feature]/        # Feature-specific
lib/
├── actions/          # Server Actions
├── db/               # Database utilities
└── utils/            # Helper functions
```"""
            )
        ]

    def _react_rules(self) -> List[Rule]:
        """React specific rules."""
        return [
            Rule(
                category=RuleCategory.CODE_STYLE,
                framework_specific=Framework.REACT,
                content="""React patterns:
- Use functional components exclusively
- Custom hooks for reusable logic (prefix with `use`)
- Colocate state with components that use it
- Lift state up only when necessary
- Use React.memo() sparingly, profile first
- Prefer controlled components for forms
- Use refs for DOM access, not state bypass
- Implement error boundaries for fault tolerance"""
            ),
            Rule(
                category=RuleCategory.CODE_STYLE,
                framework_specific=Framework.REACT,
                content="""Component structure:
```tsx
// 1. Imports (external, internal, types)
// 2. Types/interfaces
// 3. Constants
// 4. Component
// 5. Subcomponents (if small)
// 6. Exports

export function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks (useState, useEffect, custom)
  // 2. Derived state / computations
  // 3. Handlers
  // 4. Effects
  // 5. Early returns (loading, error)
  // 6. Main render
}
```"""
            )
        ]

    def _fastapi_rules(self) -> List[Rule]:
        """FastAPI specific rules."""
        return [
            Rule(
                category=RuleCategory.CODE_STYLE,
                framework_specific=Framework.FASTAPI,
                content="""FastAPI patterns:
- Use Pydantic models for all request/response schemas
- Implement dependency injection for shared logic
- Use async/await for I/O operations
- Define explicit status codes and responses
- Use path operations decorators consistently
- Implement proper exception handlers
- Use BackgroundTasks for non-blocking operations
- Generate OpenAPI documentation automatically"""
            ),
            Rule(
                category=RuleCategory.FILE_STRUCTURE,
                framework_specific=Framework.FASTAPI,
                content="""FastAPI project structure:
```
app/
├── api/
│   ├── v1/
│   │   ├── endpoints/
│   │   └── router.py
│   └── deps.py
├── core/
│   ├── config.py
│   └── security.py
├── models/
├── schemas/
├── crud/
├── db/
└── main.py
```"""
            )
        ]

    def _tailwind_rules(self) -> List[Rule]:
        """Tailwind CSS specific rules."""
        return [
            Rule(
                category=RuleCategory.CODE_STYLE,
                framework_specific=Framework.TAILWIND,
                content="""Tailwind CSS:
- Use utility classes, avoid custom CSS
- Extract repeated patterns to components, not @apply
- Use consistent spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
- Prefer responsive utilities (sm:, md:, lg:) over media queries
- Use dark: variant for dark mode
- Group related utilities logically
- Use cn() or clsx() for conditional classes
- Prefer Tailwind config for custom values over arbitrary values"""
            )
        ]


class NamingRulesGenerator:
    """Generate naming convention rules."""

    def __init__(self, config: ProjectConfig):
        self.config = config

    def generate(self) -> List[Rule]:
        """Generate naming rules."""
        rules = []

        if self.config.use_typescript or Framework.REACT in self.config.frameworks:
            rules.append(Rule(
                category=RuleCategory.NAMING,
                content="""Naming conventions (TypeScript/React):
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with use prefix (`useAuth.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- Types/Interfaces: PascalCase (`UserData`)
- Files: kebab-case for non-components (`api-client.ts`)
- Folders: kebab-case (`user-profile/`)
- Event handlers: handle prefix (`handleClick`)
- Boolean variables: is/has/should prefix (`isLoading`)"""
            ))

        if Framework.PYTHON in self.config.frameworks or Framework.FASTAPI in self.config.frameworks:
            rules.append(Rule(
                category=RuleCategory.NAMING,
                content="""Naming conventions (Python):
- Functions/variables: snake_case
- Classes: PascalCase
- Constants: SCREAMING_SNAKE_CASE
- Private: single underscore prefix (`_internal`)
- Protected: double underscore prefix (`__private`)
- Modules: short, lowercase, snake_case
- Type aliases: PascalCase"""
            ))

        return rules


class TestingRulesGenerator:
    """Generate testing rules."""

    def __init__(self, config: ProjectConfig):
        self.config = config

    def generate(self) -> List[Rule]:
        """Generate testing rules."""
        rules = []

        if self.config.test_framework:
            rules.append(Rule(
                category=RuleCategory.TESTING,
                content=f"""Testing with {self.config.test_framework}:
- Write tests for business logic and edge cases
- Use descriptive test names that explain the scenario
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Aim for high coverage on critical paths
- Use factories/fixtures for test data
- Test error cases, not just happy paths
- Keep tests independent and idempotent"""
            ))

        if Framework.REACT in self.config.frameworks:
            rules.append(Rule(
                category=RuleCategory.TESTING,
                content="""React component testing:
- Test behavior, not implementation
- Use Testing Library queries (getByRole, getByText)
- Avoid testing internal state directly
- Test accessibility (screen readers, keyboard nav)
- Mock API calls with MSW
- Test loading and error states
- Snapshot tests only for stable UI"""
            ))

        return rules


class SecurityRulesGenerator:
    """Generate security rules."""

    def __init__(self, config: ProjectConfig):
        self.config = config

    def generate(self) -> List[Rule]:
        """Generate security rules."""
        rules = []

        rules.append(Rule(
            category=RuleCategory.SECURITY,
            content="""Security practices:
- Never commit secrets, API keys, or credentials
- Validate and sanitize all user input
- Use parameterized queries (no string concatenation for SQL)
- Implement proper authentication and authorization
- Use HTTPS everywhere
- Set secure HTTP headers (CSP, HSTS, etc.)
- Implement rate limiting for APIs
- Log security events for auditing
- Keep dependencies updated"""
        ))

        if Framework.NEXTJS in self.config.frameworks:
            rules.append(Rule(
                category=RuleCategory.SECURITY,
                framework_specific=Framework.NEXTJS,
                content="""Next.js security:
- Use Server Actions for mutations (CSRF protection built-in)
- Validate server-side, never trust client
- Use `headers()` to check origin on API routes
- Implement proper CORS policies
- Use `next-safe-action` for type-safe server actions
- Sanitize user content before rendering
- Use Content Security Policy headers"""
            ))

        return rules


class ContextRulesGenerator:
    """Generate context optimization rules."""

    def __init__(self, context: ContextConfig):
        self.context = context

    def generate(self) -> List[Rule]:
        """Generate context rules."""
        rules = []

        if self.context.always_include:
            include_list = "\n".join(f"- {f}" for f in self.context.always_include)
            rules.append(Rule(
                category=RuleCategory.CONTEXT,
                content=f"""Always include these files for context:
{include_list}"""
            ))

        if self.context.always_ignore:
            ignore_list = "\n".join(f"- {f}" for f in self.context.always_ignore[:15])
            rules.append(Rule(
                category=RuleCategory.CONTEXT,
                content=f"""Ignore these paths:
{ignore_list}"""
            ))

        return rules


# ============================================================
# MAIN ENGINE
# ============================================================

class CursorRulesEngine:
    """Main engine for generating .cursorrules files."""

    def __init__(
        self,
        project: ProjectConfig,
        persona: Optional[PersonaConfig] = None,
        context: Optional[ContextConfig] = None
    ):
        self.project = project
        self.persona = persona or PersonaConfig.senior_fullstack()
        self.context = context or ContextConfig.default()
        self.rules: List[Rule] = []

    def generate_all_rules(self) -> List[Rule]:
        """Generate all rules for the project."""
        self.rules = []

        # Persona rules
        self.rules.extend(PersonaRulesGenerator.generate(self.persona))

        # Code style rules
        style_gen = CodeStyleRulesGenerator(self.project)
        self.rules.extend(style_gen.generate())

        # Naming rules
        naming_gen = NamingRulesGenerator(self.project)
        self.rules.extend(naming_gen.generate())

        # Testing rules
        testing_gen = TestingRulesGenerator(self.project)
        self.rules.extend(testing_gen.generate())

        # Security rules
        security_gen = SecurityRulesGenerator(self.project)
        self.rules.extend(security_gen.generate())

        # Context rules
        context_gen = ContextRulesGenerator(self.context)
        self.rules.extend(context_gen.generate())

        # Sort by priority
        self.rules.sort(key=lambda r: r.priority)

        return self.rules

    def to_markdown(self) -> str:
        """Convert rules to .cursorrules markdown format."""
        if not self.rules:
            self.generate_all_rules()

        lines = [
            f"# {self.project.name} - Cursor Rules",
            "",
            f"Project: {self.project.name}",
            f"Frameworks: {', '.join(f.display_name for f in self.project.frameworks)}",
            ""
        ]

        # Group rules by category
        current_category = None
        for rule in self.rules:
            if rule.category != current_category:
                current_category = rule.category
                lines.append("")
                lines.append(current_category.section_header)
                lines.append("")

            lines.append(rule.content)
            lines.append("")

        return "\n".join(lines)

    def save(self, path: str = ".cursorrules") -> str:
        """Save rules to file."""
        content = self.to_markdown()
        with open(path, "w") as f:
            f.write(content)
        return path


# ============================================================
# TEMPLATE LIBRARY
# ============================================================

class CursorRulesTemplates:
    """Pre-built cursor rules templates."""

    @staticmethod
    def nextjs_saas() -> str:
        """Next.js SaaS application template."""
        project = ProjectConfig.nextjs_app("SaaS Application")
        persona = PersonaConfig.senior_fullstack()
        engine = CursorRulesEngine(project, persona)
        return engine.to_markdown()

    @staticmethod
    def fastapi_backend() -> str:
        """FastAPI backend template."""
        project = ProjectConfig.python_api("API Backend")
        persona = PersonaConfig.principal_engineer()
        context = ContextConfig.python()
        engine = CursorRulesEngine(project, persona, context)
        return engine.to_markdown()

    @staticmethod
    def react_app() -> str:
        """React application template."""
        project = ProjectConfig.react_spa("React App")
        persona = PersonaConfig.senior_fullstack()
        engine = CursorRulesEngine(project, persona)
        return engine.to_markdown()

    @staticmethod
    def startup_mvp() -> str:
        """Fast-moving startup MVP template."""
        project = ProjectConfig(
            name="Startup MVP",
            frameworks=[Framework.NEXTJS, Framework.REACT, Framework.TAILWIND, Framework.PRISMA],
            coding_style=CodingStyle.FUNCTIONAL,
            use_typescript=True,
            test_framework="vitest",
            ui_library="shadcn/ui",
            state_management="zustand",
            database="PostgreSQL + Prisma"
        )
        persona = PersonaConfig.startup_hacker()
        engine = CursorRulesEngine(project, persona)

        # Add startup-specific rules
        engine.generate_all_rules()
        engine.rules.append(Rule(
            category=RuleCategory.ARCHITECTURE,
            content="""Startup mindset:
- Ship fast, iterate based on feedback
- Don't over-engineer, solve today's problems
- Prefer proven patterns over novel approaches
- Technical debt is OK if documented
- Focus on user value, not code perfection
- Simple beats clever every time"""
        ))

        return engine.to_markdown()


# ============================================================
# REPORTER
# ============================================================

class CursorRulesReporter:
    """Generate reports about cursor rules."""

    @staticmethod
    def rules_dashboard(engine: CursorRulesEngine) -> str:
        """Generate rules overview dashboard."""
        if not engine.rules:
            engine.generate_all_rules()

        # Count by category
        category_counts: Dict[RuleCategory, int] = {}
        for rule in engine.rules:
            category_counts[rule.category] = category_counts.get(rule.category, 0) + 1

        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    CURSOR RULES - OVERVIEW                           ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Project: {engine.project.name:<58} ║",
            f"║  Total Rules: {len(engine.rules):<54} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Category              │ Rules │ Priority                            ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for category in sorted(category_counts.keys(), key=lambda c: c.priority):
            count = category_counts[category]
            lines.append(
                f"║  {category.value:<20} │ {count:>5} │ {category.priority:<35} ║"
            )

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def framework_dashboard(frameworks: List[Framework]) -> str:
        """Generate framework overview dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    DETECTED FRAMEWORKS                               ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Framework           │ Extensions         │ Config Files            ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for fw in frameworks:
            exts = ", ".join(fw.file_extensions[:3])
            configs = ", ".join(fw.config_files[:2])
            lines.append(
                f"║  {fw.display_name:<19} │ {exts:<18} │ {configs:<23} ║"
            )

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


# ============================================================
# CLI
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="CURSOR.RULES.EXE - Generate optimized .cursorrules files",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate for Next.js project
  python cursor-rules.py nextjs --name "My SaaS"

  # Generate for FastAPI backend
  python cursor-rules.py fastapi --name "API Service"

  # Use a template
  python cursor-rules.py template --type startup-mvp

  # Custom configuration
  python cursor-rules.py custom --frameworks nextjs,tailwind,prisma
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Next.js command
    nextjs_parser = subparsers.add_parser("nextjs", help="Generate Next.js rules")
    nextjs_parser.add_argument("--name", default="Next.js App", help="Project name")
    nextjs_parser.add_argument("--output", "-o", default=".cursorrules", help="Output file")

    # FastAPI command
    fastapi_parser = subparsers.add_parser("fastapi", help="Generate FastAPI rules")
    fastapi_parser.add_argument("--name", default="FastAPI Service", help="Project name")
    fastapi_parser.add_argument("--output", "-o", default=".cursorrules", help="Output file")

    # React command
    react_parser = subparsers.add_parser("react", help="Generate React rules")
    react_parser.add_argument("--name", default="React App", help="Project name")
    react_parser.add_argument("--output", "-o", default=".cursorrules", help="Output file")

    # Template command
    template_parser = subparsers.add_parser("template", help="Use a pre-built template")
    template_parser.add_argument("--type", choices=["nextjs-saas", "fastapi-backend", "react-app", "startup-mvp"], required=True)
    template_parser.add_argument("--output", "-o", default=".cursorrules", help="Output file")

    # Custom command
    custom_parser = subparsers.add_parser("custom", help="Custom configuration")
    custom_parser.add_argument("--frameworks", required=True, help="Comma-separated frameworks")
    custom_parser.add_argument("--name", default="Project", help="Project name")
    custom_parser.add_argument("--persona", choices=["senior", "principal", "startup"], default="senior")
    custom_parser.add_argument("--output", "-o", default=".cursorrules", help="Output file")

    # List command
    list_parser = subparsers.add_parser("list", help="List available options")
    list_parser.add_argument("--what", choices=["frameworks", "templates", "personas"], default="frameworks")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "nextjs":
        project = ProjectConfig.nextjs_app(args.name)
        engine = CursorRulesEngine(project)
        content = engine.to_markdown()

        with open(args.output, "w") as f:
            f.write(content)
        print(f"Generated {args.output} for Next.js project: {args.name}")

    elif args.command == "fastapi":
        project = ProjectConfig.python_api(args.name)
        engine = CursorRulesEngine(project, PersonaConfig.principal_engineer(), ContextConfig.python())
        content = engine.to_markdown()

        with open(args.output, "w") as f:
            f.write(content)
        print(f"Generated {args.output} for FastAPI project: {args.name}")

    elif args.command == "react":
        project = ProjectConfig.react_spa(args.name)
        engine = CursorRulesEngine(project)
        content = engine.to_markdown()

        with open(args.output, "w") as f:
            f.write(content)
        print(f"Generated {args.output} for React project: {args.name}")

    elif args.command == "template":
        templates = {
            "nextjs-saas": CursorRulesTemplates.nextjs_saas,
            "fastapi-backend": CursorRulesTemplates.fastapi_backend,
            "react-app": CursorRulesTemplates.react_app,
            "startup-mvp": CursorRulesTemplates.startup_mvp
        }

        content = templates[args.type]()
        with open(args.output, "w") as f:
            f.write(content)
        print(f"Generated {args.output} using template: {args.type}")

    elif args.command == "custom":
        frameworks = [Framework(f.strip()) for f in args.frameworks.split(",")]
        personas = {
            "senior": PersonaConfig.senior_fullstack,
            "principal": PersonaConfig.principal_engineer,
            "startup": PersonaConfig.startup_hacker
        }

        project = ProjectConfig(name=args.name, frameworks=frameworks)
        persona = personas[args.persona]()
        engine = CursorRulesEngine(project, persona)
        content = engine.to_markdown()

        with open(args.output, "w") as f:
            f.write(content)
        print(f"Generated {args.output} with custom configuration")

    elif args.command == "list":
        if args.what == "frameworks":
            print("\nAvailable Frameworks:")
            for fw in Framework:
                print(f"  {fw.value:<20} - {fw.display_name}")
        elif args.what == "templates":
            print("\nAvailable Templates:")
            print("  nextjs-saas      - Next.js SaaS application")
            print("  fastapi-backend  - FastAPI backend service")
            print("  react-app        - React single-page application")
            print("  startup-mvp      - Fast-moving startup MVP")
        elif args.what == "personas":
            print("\nAvailable Personas:")
            print("  senior     - Senior Full-Stack Developer")
            print("  principal  - Principal Engineer")
            print("  startup    - Startup Hacker")

    elif args.command == "demo":
        print("=" * 70)
        print("CURSOR.RULES.EXE - DEMONSTRATION")
        print("=" * 70)

        project = ProjectConfig.nextjs_app("Demo SaaS")
        engine = CursorRulesEngine(project)
        engine.generate_all_rules()

        print("\n" + CursorRulesReporter.rules_dashboard(engine))
        print("\n" + CursorRulesReporter.framework_dashboard(project.frameworks))

        print("\n" + "-" * 70)
        print("SAMPLE .cursorrules OUTPUT (first 50 lines)")
        print("-" * 70)
        content = engine.to_markdown()
        for line in content.split("\n")[:50]:
            print(line)
        print("...")


if __name__ == "__main__":
    main()
```

---

## USAGE

### Quick Start

```bash
# Generate for your project type
python cursor-rules.py nextjs --name "My SaaS"
python cursor-rules.py fastapi --name "API Service"
python cursor-rules.py react --name "Dashboard"

# Use pre-built templates
python cursor-rules.py template --type startup-mvp
python cursor-rules.py template --type nextjs-saas

# Custom configuration
python cursor-rules.py custom --frameworks nextjs,tailwind,prisma --persona startup
```

### Templates Available

| Template | Description | Best For |
|----------|-------------|----------|
| `nextjs-saas` | Full Next.js SaaS setup | Production apps |
| `fastapi-backend` | Python API backend | Microservices |
| `react-app` | React SPA | Frontend apps |
| `startup-mvp` | Fast-moving MVP | Quick prototypes |

---

## QUICK COMMANDS

```
/cursor-rules nextjs     → Generate Next.js rules
/cursor-rules fastapi    → Generate FastAPI rules
/cursor-rules react      → Generate React rules
/cursor-rules startup    → Generate startup MVP rules
/cursor-rules custom     → Custom framework combination
```

$ARGUMENTS
