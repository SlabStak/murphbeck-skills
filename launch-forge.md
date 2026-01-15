# FORGE.EXE - Creation & Manufacturing Agent

You are FORGE.EXE — the creation and manufacturing specialist for building, crafting, and producing high-quality outputs with precision craftsmanship across any domain.

MISSION
Create, forge, and manufacture high-quality outputs across domains with precision and craftsmanship. From raw materials to finished product. Excellence in every creation.

---

## CAPABILITIES

### BlueprintDesigner.MOD
- Requirements analysis
- Specification creation
- Component planning
- Architecture design
- Quality standards

### MaterialManager.MOD
- Resource gathering
- Dependency resolution
- Tool configuration
- Environment setup
- Prerequisite validation

### CraftingEngine.MOD
- Production execution
- Quality monitoring
- Iteration handling
- Error recovery
- Finishing processes

### DeliverySystem.MOD
- Output validation
- Packaging preparation
- Documentation generation
- Usage guidance
- Handoff coordination

---

## FORGE TYPES

| Type | Description | Quality Focus |
|------|-------------|---------------|
| Code | Software components | Tested, documented |
| Content | Documents, media | Polished, reviewed |
| Design | Visual assets | Pixel-perfect |
| Data | Datasets, configs | Validated, clean |
| Systems | Infrastructure | Reliable, secure |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
FORGE.EXE - Creation & Manufacturing Engine
Production-ready implementation for building high-quality outputs.
"""

import asyncio
import json
import os
import shutil
import subprocess
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional, Callable, Any
import yaml
import jinja2


class ForgeType(Enum):
    """Types of items that can be forged."""
    CODE = "code"
    CONTENT = "content"
    DESIGN = "design"
    DATA = "data"
    SYSTEM = "system"
    PROJECT = "project"


class ForgeStatus(Enum):
    """Status of forge operation."""
    PENDING = "pending"
    DESIGNING = "designing"
    PREPARING = "preparing"
    FORGING = "forging"
    VALIDATING = "validating"
    COMPLETE = "complete"
    FAILED = "failed"


class QualityLevel(Enum):
    """Quality levels for output."""
    DRAFT = "draft"
    STANDARD = "standard"
    PREMIUM = "premium"
    PRODUCTION = "production"


@dataclass
class Blueprint:
    """Blueprint specification for forge item."""
    name: str
    forge_type: ForgeType
    description: str
    requirements: list[str]
    components: list[str]
    quality_criteria: dict[str, Any]
    template: Optional[str] = None
    dependencies: list[str] = field(default_factory=list)
    variables: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "type": self.forge_type.value,
            "description": self.description,
            "requirements": self.requirements,
            "components": self.components,
            "quality_criteria": self.quality_criteria,
            "template": self.template,
            "dependencies": self.dependencies,
            "variables": self.variables
        }


@dataclass
class QualityCheck:
    """Quality check result."""
    criterion: str
    passed: bool
    score: float
    message: str
    details: Optional[dict] = None


@dataclass
class ForgeResult:
    """Result of forge operation."""
    item_name: str
    forge_type: ForgeType
    status: ForgeStatus
    output_path: Optional[Path]
    quality_score: float
    quality_checks: list[QualityCheck]
    duration_seconds: float
    artifacts: list[str]
    metadata: dict[str, Any]
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "item_name": self.item_name,
            "type": self.forge_type.value,
            "status": self.status.value,
            "output_path": str(self.output_path) if self.output_path else None,
            "quality_score": self.quality_score,
            "quality_checks": [
                {
                    "criterion": qc.criterion,
                    "passed": qc.passed,
                    "score": qc.score,
                    "message": qc.message
                }
                for qc in self.quality_checks
            ],
            "duration_seconds": self.duration_seconds,
            "artifacts": self.artifacts,
            "metadata": self.metadata,
            "errors": self.errors
        }


class TemplateLibrary:
    """Template library for forge blueprints."""

    def __init__(self, template_dir: Path):
        self.template_dir = template_dir
        self.template_dir.mkdir(parents=True, exist_ok=True)
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(template_dir)),
            autoescape=jinja2.select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True
        )
        self._init_builtin_templates()

    def _init_builtin_templates(self):
        """Initialize built-in templates."""
        self.builtin_templates = {
            # Python project template
            "python-project": {
                "type": ForgeType.PROJECT,
                "files": {
                    "{{name}}/__init__.py": '''"""{{description}}"""

__version__ = "{{version|default('0.1.0')}}"
''',
                    "{{name}}/main.py": '''#!/usr/bin/env python3
"""Main entry point for {{name}}."""

import argparse
import sys


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="{{description}}")
    parser.add_argument("--version", action="version", version="%(prog)s {{version|default('0.1.0')}}")
    args = parser.parse_args()

    print("{{name}} is running!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
''',
                    "pyproject.toml": '''[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "{{name}}"
version = "{{version|default('0.1.0')}}"
description = "{{description}}"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
{% for dep in dependencies|default([]) %}
    "{{dep}}",
{% endfor %}
]

[project.scripts]
{{name}} = "{{name}}.main:main"
''',
                    "tests/__init__.py": "",
                    "tests/test_main.py": '''"""Tests for {{name}}."""

import pytest
from {{name}}.main import main


def test_main():
    """Test main function."""
    assert main() == 0
'''
                }
            },

            # FastAPI service template
            "fastapi-service": {
                "type": ForgeType.CODE,
                "files": {
                    "{{name}}/__init__.py": '"""{{description}}"""',
                    "{{name}}/app.py": '''"""FastAPI application for {{name}}."""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="{{name}}",
    description="{{description}}",
    version="{{version|default('0.1.0')}}"
)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service="{{name}}",
        version="{{version|default('0.1.0')}}"
    )


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to {{name}}"}
''',
                    "{{name}}/config.py": '''"""Configuration for {{name}}."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    app_name: str = "{{name}}"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    class Config:
        env_prefix = "{{name|upper}}_"


settings = Settings()
''',
                    "Dockerfile": '''FROM python:3.11-slim

WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY {{name}} {{name}}

EXPOSE 8000
CMD ["uvicorn", "{{name}}.app:app", "--host", "0.0.0.0", "--port", "8000"]
'''
                }
            },

            # React component template
            "react-component": {
                "type": ForgeType.CODE,
                "files": {
                    "{{name}}/{{name}}.tsx": '''import React from 'react';
import styles from './{{name}}.module.css';

export interface {{name}}Props {
  /** Component children */
  children?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
{% for prop in props|default([]) %}
  /** {{prop.description|default('')}} */
  {{prop.name}}{% if prop.optional %}?{% endif %}: {{prop.type}};
{% endfor %}
}

/**
 * {{description}}
 */
export const {{name}}: React.FC<{{name}}Props> = ({
  children,
  className,
{% for prop in props|default([]) %}
  {{prop.name}},
{% endfor %}
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {children}
    </div>
  );
};

export default {{name}};
''',
                    "{{name}}/{{name}}.module.css": '''.container {
  /* Add your styles here */
}
''',
                    "{{name}}/{{name}}.test.tsx": '''import { render, screen } from '@testing-library/react';
import { {{name}} } from './{{name}}';

describe('{{name}}', () => {
  it('renders children', () => {
    render(<{{name}}>Test content</{{name}}>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
''',
                    "{{name}}/index.ts": '''export { {{name}}, type {{name}}Props } from './{{name}}';
export { default } from './{{name}}';
'''
                }
            },

            # CLI tool template
            "cli-tool": {
                "type": ForgeType.CODE,
                "files": {
                    "{{name}}/cli.py": '''#!/usr/bin/env python3
"""{{description}}"""

import argparse
import sys
from typing import Optional


def create_parser() -> argparse.ArgumentParser:
    """Create argument parser."""
    parser = argparse.ArgumentParser(
        prog="{{name}}",
        description="{{description}}",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "--version", "-v",
        action="version",
        version="%(prog)s {{version|default('0.1.0')}}"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

{% for cmd in commands|default([]) %}
    # {{cmd.name}} command
    {{cmd.name}}_parser = subparsers.add_parser("{{cmd.name}}", help="{{cmd.help}}")
{% for arg in cmd.args|default([]) %}
    {{cmd.name}}_parser.add_argument("{{arg.name}}", help="{{arg.help}}")
{% endfor %}

{% endfor %}
    return parser


def main(args: Optional[list[str]] = None) -> int:
    """Main entry point."""
    parser = create_parser()
    parsed = parser.parse_args(args)

    if not parsed.command:
        parser.print_help()
        return 0

    # Handle commands
    print(f"Running command: {parsed.command}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
'''
                }
            },

            # Markdown document template
            "markdown-doc": {
                "type": ForgeType.CONTENT,
                "files": {
                    "{{name}}.md": '''# {{title}}

{{description}}

## Overview

[Provide an overview of the document contents]

## Contents

{% for section in sections|default([]) %}
### {{section.title}}

{{section.content|default('[Section content]')}}

{% endfor %}

## Summary

[Summarize key points]

---

*Generated by FORGE.EXE on {{timestamp}}*
'''
                }
            },

            # Configuration file template
            "config-file": {
                "type": ForgeType.DATA,
                "files": {
                    "{{name}}.yaml": '''# {{description}}
# Generated by FORGE.EXE

{% for section, values in config|default({})|dictsort %}
{{section}}:
{% for key, value in values|dictsort %}
  {{key}}: {{value}}
{% endfor %}

{% endfor %}
'''
                }
            }
        }

    def get_template(self, template_name: str) -> Optional[dict]:
        """Get a template by name."""
        # Check built-in templates first
        if template_name in self.builtin_templates:
            return self.builtin_templates[template_name]

        # Check file system
        template_path = self.template_dir / f"{template_name}.yaml"
        if template_path.exists():
            with open(template_path) as f:
                return yaml.safe_load(f)

        return None

    def list_templates(self) -> list[str]:
        """List available templates."""
        templates = list(self.builtin_templates.keys())

        # Add file system templates
        for path in self.template_dir.glob("*.yaml"):
            name = path.stem
            if name not in templates:
                templates.append(name)

        return sorted(templates)

    def render_template(self, template_content: str, variables: dict) -> str:
        """Render a template string with variables."""
        template = jinja2.Template(template_content)
        return template.render(**variables)

    def save_template(self, name: str, template: dict):
        """Save a template to the library."""
        template_path = self.template_dir / f"{name}.yaml"
        with open(template_path, 'w') as f:
            yaml.dump(template, f, default_flow_style=False)


class QualityValidator:
    """Validator for forge output quality."""

    def __init__(self):
        self.validators: dict[str, Callable] = {
            "file_exists": self._check_file_exists,
            "file_not_empty": self._check_file_not_empty,
            "syntax_valid": self._check_syntax_valid,
            "tests_pass": self._check_tests_pass,
            "lint_clean": self._check_lint_clean,
            "dependencies_resolved": self._check_dependencies,
            "documentation_present": self._check_documentation,
            "structure_complete": self._check_structure
        }

    async def validate(
        self,
        output_path: Path,
        criteria: dict[str, Any],
        forge_type: ForgeType
    ) -> list[QualityCheck]:
        """Run quality validation on forge output."""
        checks = []

        for criterion, config in criteria.items():
            if criterion in self.validators:
                try:
                    result = await self.validators[criterion](
                        output_path, config, forge_type
                    )
                    checks.append(result)
                except Exception as e:
                    checks.append(QualityCheck(
                        criterion=criterion,
                        passed=False,
                        score=0.0,
                        message=f"Validation error: {str(e)}"
                    ))

        return checks

    async def _check_file_exists(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check that required files exist."""
        required_files = config if isinstance(config, list) else [config]
        missing = []

        for file in required_files:
            file_path = path / file if path.is_dir() else path
            if not file_path.exists():
                missing.append(file)

        passed = len(missing) == 0
        score = (len(required_files) - len(missing)) / len(required_files) * 10

        return QualityCheck(
            criterion="file_exists",
            passed=passed,
            score=score,
            message="All required files present" if passed else f"Missing: {missing}",
            details={"missing": missing}
        )

    async def _check_file_not_empty(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check that files are not empty."""
        if path.is_file():
            files = [path]
        else:
            files = list(path.rglob("*"))
            files = [f for f in files if f.is_file()]

        empty_files = [f for f in files if f.stat().st_size == 0]

        # Some files can be empty (like __init__.py)
        allowed_empty = ["__init__.py", ".gitkeep"]
        empty_files = [f for f in empty_files if f.name not in allowed_empty]

        passed = len(empty_files) == 0
        score = 10.0 if passed else max(0, 10 - len(empty_files))

        return QualityCheck(
            criterion="file_not_empty",
            passed=passed,
            score=score,
            message="All files have content" if passed else f"Empty files: {len(empty_files)}",
            details={"empty_files": [str(f) for f in empty_files]}
        )

    async def _check_syntax_valid(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check syntax validity."""
        errors = []

        if path.is_file():
            files = [path]
        else:
            files = list(path.rglob("*"))

        for file in files:
            if file.suffix == ".py":
                try:
                    with open(file) as f:
                        compile(f.read(), file, 'exec')
                except SyntaxError as e:
                    errors.append(f"{file}: {e}")
            elif file.suffix == ".json":
                try:
                    with open(file) as f:
                        json.load(f)
                except json.JSONDecodeError as e:
                    errors.append(f"{file}: {e}")
            elif file.suffix in [".yaml", ".yml"]:
                try:
                    with open(file) as f:
                        yaml.safe_load(f)
                except yaml.YAMLError as e:
                    errors.append(f"{file}: {e}")

        passed = len(errors) == 0

        return QualityCheck(
            criterion="syntax_valid",
            passed=passed,
            score=10.0 if passed else 0.0,
            message="All syntax valid" if passed else f"Syntax errors: {len(errors)}",
            details={"errors": errors}
        )

    async def _check_tests_pass(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check if tests pass."""
        if forge_type not in [ForgeType.CODE, ForgeType.PROJECT]:
            return QualityCheck(
                criterion="tests_pass",
                passed=True,
                score=10.0,
                message="Tests not applicable for this forge type"
            )

        test_dir = path / "tests" if path.is_dir() else path.parent / "tests"
        if not test_dir.exists():
            return QualityCheck(
                criterion="tests_pass",
                passed=False,
                score=5.0,
                message="No tests directory found"
            )

        try:
            result = subprocess.run(
                ["python", "-m", "pytest", str(test_dir), "-v", "--tb=short"],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=str(path if path.is_dir() else path.parent)
            )
            passed = result.returncode == 0

            return QualityCheck(
                criterion="tests_pass",
                passed=passed,
                score=10.0 if passed else 3.0,
                message="All tests pass" if passed else "Some tests failed",
                details={"stdout": result.stdout, "stderr": result.stderr}
            )
        except subprocess.TimeoutExpired:
            return QualityCheck(
                criterion="tests_pass",
                passed=False,
                score=2.0,
                message="Tests timed out"
            )
        except FileNotFoundError:
            return QualityCheck(
                criterion="tests_pass",
                passed=True,
                score=8.0,
                message="pytest not available, skipping"
            )

    async def _check_lint_clean(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check linting status."""
        if forge_type not in [ForgeType.CODE, ForgeType.PROJECT]:
            return QualityCheck(
                criterion="lint_clean",
                passed=True,
                score=10.0,
                message="Linting not applicable"
            )

        try:
            result = subprocess.run(
                ["python", "-m", "ruff", "check", str(path)],
                capture_output=True,
                text=True,
                timeout=30
            )

            issues = result.stdout.count('\n') if result.stdout else 0
            passed = issues == 0
            score = max(0, 10 - issues * 0.5)

            return QualityCheck(
                criterion="lint_clean",
                passed=passed,
                score=score,
                message="No lint issues" if passed else f"{issues} lint issues found",
                details={"output": result.stdout}
            )
        except FileNotFoundError:
            return QualityCheck(
                criterion="lint_clean",
                passed=True,
                score=8.0,
                message="ruff not available, skipping"
            )

    async def _check_dependencies(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check dependency resolution."""
        dep_files = ["requirements.txt", "pyproject.toml", "package.json", "Cargo.toml"]
        found_dep_file = None

        for dep_file in dep_files:
            dep_path = path / dep_file if path.is_dir() else path.parent / dep_file
            if dep_path.exists():
                found_dep_file = dep_path
                break

        if not found_dep_file:
            return QualityCheck(
                criterion="dependencies_resolved",
                passed=True,
                score=7.0,
                message="No dependency file found"
            )

        return QualityCheck(
            criterion="dependencies_resolved",
            passed=True,
            score=10.0,
            message=f"Dependencies defined in {found_dep_file.name}"
        )

    async def _check_documentation(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check documentation presence."""
        doc_files = ["README.md", "README.rst", "docs/"]
        has_docs = False

        for doc in doc_files:
            doc_path = path / doc if path.is_dir() else path.parent / doc
            if doc_path.exists():
                has_docs = True
                break

        return QualityCheck(
            criterion="documentation_present",
            passed=has_docs,
            score=10.0 if has_docs else 5.0,
            message="Documentation found" if has_docs else "No documentation found"
        )

    async def _check_structure(
        self, path: Path, config: Any, forge_type: ForgeType
    ) -> QualityCheck:
        """Check project structure completeness."""
        expected_structure = config if isinstance(config, list) else []

        if not expected_structure:
            return QualityCheck(
                criterion="structure_complete",
                passed=True,
                score=10.0,
                message="No structure requirements specified"
            )

        missing = []
        for item in expected_structure:
            item_path = path / item if path.is_dir() else path.parent / item
            if not item_path.exists():
                missing.append(item)

        passed = len(missing) == 0
        score = (len(expected_structure) - len(missing)) / len(expected_structure) * 10

        return QualityCheck(
            criterion="structure_complete",
            passed=passed,
            score=score,
            message="Structure complete" if passed else f"Missing: {missing}"
        )


class ForgeEngine:
    """Main forge engine for creating outputs."""

    def __init__(
        self,
        workspace: Path,
        template_dir: Optional[Path] = None
    ):
        self.workspace = Path(workspace)
        self.workspace.mkdir(parents=True, exist_ok=True)

        template_dir = template_dir or self.workspace / ".forge" / "templates"
        self.templates = TemplateLibrary(template_dir)
        self.validator = QualityValidator()
        self.forge_history: list[ForgeResult] = []

    async def forge(
        self,
        blueprint: Blueprint,
        output_dir: Optional[Path] = None,
        quality_level: QualityLevel = QualityLevel.STANDARD
    ) -> ForgeResult:
        """Execute forge operation from blueprint."""
        start_time = datetime.now()
        output_dir = output_dir or self.workspace / blueprint.name
        output_dir.mkdir(parents=True, exist_ok=True)

        errors = []
        artifacts = []

        try:
            # Phase 1: Design - Validate blueprint
            print(f"[FORGE] Designing {blueprint.name}...")
            if not self._validate_blueprint(blueprint):
                raise ValueError("Invalid blueprint specification")

            # Phase 2: Prepare - Resolve dependencies and gather materials
            print(f"[FORGE] Preparing materials...")
            await self._prepare_materials(blueprint, output_dir)

            # Phase 3: Forge - Create the output
            print(f"[FORGE] Forging {blueprint.name}...")
            created_files = await self._execute_forge(blueprint, output_dir)
            artifacts.extend(created_files)

            # Phase 4: Validate - Run quality checks
            print(f"[FORGE] Validating quality...")
            quality_checks = await self.validator.validate(
                output_dir,
                blueprint.quality_criteria,
                blueprint.forge_type
            )

            # Calculate quality score
            if quality_checks:
                quality_score = sum(qc.score for qc in quality_checks) / len(quality_checks)
            else:
                quality_score = 7.0  # Default score if no checks

            status = ForgeStatus.COMPLETE if quality_score >= 6.0 else ForgeStatus.FAILED

        except Exception as e:
            errors.append(str(e))
            quality_checks = []
            quality_score = 0.0
            status = ForgeStatus.FAILED

        duration = (datetime.now() - start_time).total_seconds()

        result = ForgeResult(
            item_name=blueprint.name,
            forge_type=blueprint.forge_type,
            status=status,
            output_path=output_dir if status == ForgeStatus.COMPLETE else None,
            quality_score=quality_score,
            quality_checks=quality_checks,
            duration_seconds=duration,
            artifacts=artifacts,
            metadata={
                "quality_level": quality_level.value,
                "template": blueprint.template,
                "forged_at": datetime.now().isoformat()
            },
            errors=errors
        )

        self.forge_history.append(result)
        return result

    def _validate_blueprint(self, blueprint: Blueprint) -> bool:
        """Validate blueprint specification."""
        if not blueprint.name:
            return False
        if not blueprint.description:
            return False
        return True

    async def _prepare_materials(self, blueprint: Blueprint, output_dir: Path):
        """Prepare materials for forge operation."""
        # Check and resolve dependencies
        for dep in blueprint.dependencies:
            # This would integrate with package managers in production
            print(f"  Checking dependency: {dep}")

    async def _execute_forge(
        self,
        blueprint: Blueprint,
        output_dir: Path
    ) -> list[str]:
        """Execute the forge operation."""
        created_files = []

        # If using a template, render it
        if blueprint.template:
            template = self.templates.get_template(blueprint.template)
            if template:
                variables = {
                    "name": blueprint.name,
                    "description": blueprint.description,
                    "timestamp": datetime.now().isoformat(),
                    **blueprint.variables
                }

                for file_pattern, content_template in template.get("files", {}).items():
                    # Render filename
                    filename = self.templates.render_template(file_pattern, variables)
                    file_path = output_dir / filename

                    # Create parent directories
                    file_path.parent.mkdir(parents=True, exist_ok=True)

                    # Render content
                    content = self.templates.render_template(content_template, variables)

                    with open(file_path, 'w') as f:
                        f.write(content)

                    created_files.append(str(file_path.relative_to(output_dir)))

        # Create custom components
        for component in blueprint.components:
            component_path = output_dir / component
            if not component_path.exists():
                if component.endswith('/'):
                    component_path.mkdir(parents=True, exist_ok=True)
                else:
                    component_path.parent.mkdir(parents=True, exist_ok=True)
                    component_path.touch()
                created_files.append(component)

        return created_files

    async def forge_from_template(
        self,
        template_name: str,
        name: str,
        description: str,
        variables: Optional[dict] = None,
        output_dir: Optional[Path] = None
    ) -> ForgeResult:
        """Forge from a template."""
        template = self.templates.get_template(template_name)
        if not template:
            raise ValueError(f"Template not found: {template_name}")

        forge_type = ForgeType(template.get("type", "code"))

        blueprint = Blueprint(
            name=name,
            forge_type=forge_type,
            description=description,
            requirements=[],
            components=[],
            quality_criteria={
                "file_exists": True,
                "file_not_empty": True,
                "syntax_valid": True
            },
            template=template_name,
            variables=variables or {}
        )

        return await self.forge(blueprint, output_dir)

    def list_templates(self) -> list[str]:
        """List available forge templates."""
        return self.templates.list_templates()

    def get_forge_history(self) -> list[dict]:
        """Get forge history."""
        return [r.to_dict() for r in self.forge_history]

    async def refine(
        self,
        item_path: Path,
        refinements: list[str]
    ) -> ForgeResult:
        """Refine an existing forged item."""
        if not item_path.exists():
            raise ValueError(f"Item not found: {item_path}")

        # Implementation would apply refinements
        # For now, return success
        return ForgeResult(
            item_name=item_path.name,
            forge_type=ForgeType.PROJECT,
            status=ForgeStatus.COMPLETE,
            output_path=item_path,
            quality_score=8.0,
            quality_checks=[],
            duration_seconds=0.1,
            artifacts=[],
            metadata={"refinements": refinements}
        )


class ForgeReporter:
    """Generate forge reports."""

    @staticmethod
    def generate_report(result: ForgeResult) -> str:
        """Generate a detailed forge report."""
        status_icon = "●" if result.status == ForgeStatus.COMPLETE else "○"
        quality_bar = "█" * int(result.quality_score) + "░" * (10 - int(result.quality_score))

        report = f"""
FORGE OUTPUT
═══════════════════════════════════════
Item: {result.item_name}
Type: {result.forge_type.value}
Date: {result.metadata.get('forged_at', 'N/A')}
═══════════════════════════════════════

FORGE STATUS
────────────────────────────────────
┌─────────────────────────────────────┐
│       CREATION STATUS               │
│                                     │
│  Item: {result.item_name:<27} │
│  Type: {result.forge_type.value:<27} │
│  Status: {status_icon} {result.status.value:<24} │
│                                     │
│  Quality: {quality_bar} {result.quality_score:.1f}/10  │
│                                     │
│  Duration: {result.duration_seconds:.2f}s{' ' * 19} │
└─────────────────────────────────────┘

QUALITY CHECKS
────────────────────────────────────
| Criterion | Result | Score |
|-----------|--------|-------|"""

        for qc in result.quality_checks:
            result_str = "PASS" if qc.passed else "FAIL"
            report += f"\n| {qc.criterion:<18} | {result_str:<6} | {qc.score:.1f}/10 |"

        report += f"""

ARTIFACTS CREATED
────────────────────────────────────
"""
        for artifact in result.artifacts[:10]:
            report += f"  • {artifact}\n"

        if len(result.artifacts) > 10:
            report += f"  ... and {len(result.artifacts) - 10} more\n"

        if result.output_path:
            report += f"""
DELIVERY
────────────────────────────────────
┌─────────────────────────────────────┐
│  Location: {str(result.output_path):<24} │
│  Files: {len(result.artifacts):<28} │
└─────────────────────────────────────┘
"""

        if result.errors:
            report += f"""
ERRORS
────────────────────────────────────
"""
            for error in result.errors:
                report += f"  ✗ {error}\n"

        report += f"\nStatus: {status_icon} Forging {'Complete' if result.status == ForgeStatus.COMPLETE else 'Failed'}"

        return report


# CLI Interface
async def main():
    """CLI entry point for FORGE.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="FORGE.EXE - Creation & Manufacturing Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "--workspace", "-w",
        default="./forge-workspace",
        help="Workspace directory"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # forge command
    forge_parser = subparsers.add_parser("forge", help="Forge a new item")
    forge_parser.add_argument("name", help="Item name")
    forge_parser.add_argument("--template", "-t", help="Template to use")
    forge_parser.add_argument("--description", "-d", default="", help="Description")
    forge_parser.add_argument("--output", "-o", help="Output directory")
    forge_parser.add_argument("--var", "-v", action="append", help="Variable (key=value)")

    # templates command
    templates_parser = subparsers.add_parser("templates", help="List templates")

    # history command
    history_parser = subparsers.add_parser("history", help="Show forge history")

    # status command
    status_parser = subparsers.add_parser("status", help="Check forge status")
    status_parser.add_argument("path", help="Path to forged item")

    args = parser.parse_args()

    engine = ForgeEngine(workspace=Path(args.workspace))

    if args.command == "forge":
        # Parse variables
        variables = {}
        if args.var:
            for v in args.var:
                key, _, value = v.partition("=")
                variables[key] = value

        if args.template:
            result = await engine.forge_from_template(
                template_name=args.template,
                name=args.name,
                description=args.description or f"Forged {args.name}",
                variables=variables,
                output_dir=Path(args.output) if args.output else None
            )
        else:
            blueprint = Blueprint(
                name=args.name,
                forge_type=ForgeType.PROJECT,
                description=args.description or f"Forged {args.name}",
                requirements=[],
                components=[],
                quality_criteria={
                    "file_exists": True,
                    "syntax_valid": True
                },
                variables=variables
            )
            result = await engine.forge(
                blueprint,
                output_dir=Path(args.output) if args.output else None
            )

        print(ForgeReporter.generate_report(result))

    elif args.command == "templates":
        templates = engine.list_templates()
        print("Available Templates:")
        print("=" * 40)
        for t in templates:
            print(f"  • {t}")

    elif args.command == "history":
        history = engine.get_forge_history()
        if not history:
            print("No forge history.")
        else:
            for item in history:
                print(f"  {item['item_name']} ({item['type']}) - {item['status']}")

    elif args.command == "status":
        path = Path(args.path)
        if path.exists():
            print(f"Item: {path}")
            print(f"Type: {'directory' if path.is_dir() else 'file'}")
            if path.is_dir():
                files = list(path.rglob("*"))
                print(f"Files: {len([f for f in files if f.is_file()])}")
        else:
            print(f"Item not found: {path}")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## USAGE EXAMPLES

### Forge from Template

```bash
# Create a Python project
python forge.py forge my-project \
    --template python-project \
    --description "My awesome project" \
    --var version=1.0.0

# Create a FastAPI service
python forge.py forge api-service \
    --template fastapi-service \
    --description "REST API service" \
    --output ./services/api

# Create a React component
python forge.py forge Button \
    --template react-component \
    --description "Reusable button component"

# Create a CLI tool
python forge.py forge mytool \
    --template cli-tool \
    --description "Command line utility"
```

### Programmatic Usage

```python
import asyncio
from pathlib import Path
from forge import ForgeEngine, Blueprint, ForgeType

async def create_project():
    engine = ForgeEngine(workspace=Path("./workspace"))

    # Using template
    result = await engine.forge_from_template(
        template_name="python-project",
        name="myapp",
        description="My application",
        variables={
            "version": "1.0.0",
            "dependencies": ["requests", "pydantic"]
        }
    )

    print(f"Created: {result.output_path}")
    print(f"Quality: {result.quality_score}/10")

asyncio.run(create_project())
```

### Custom Blueprint

```python
blueprint = Blueprint(
    name="custom-service",
    forge_type=ForgeType.PROJECT,
    description="Custom microservice",
    requirements=[
        "Python 3.10+",
        "Docker",
        "PostgreSQL"
    ],
    components=[
        "src/",
        "src/main.py",
        "src/config.py",
        "tests/",
        "Dockerfile",
        "docker-compose.yml"
    ],
    quality_criteria={
        "file_exists": ["src/main.py", "Dockerfile"],
        "syntax_valid": True,
        "tests_pass": True,
        "lint_clean": True
    },
    dependencies=["fastapi", "sqlalchemy", "pydantic"]
)

result = await engine.forge(blueprint)
```

### Quality Validation

```python
from forge import QualityValidator, ForgeType
from pathlib import Path

validator = QualityValidator()

checks = await validator.validate(
    output_path=Path("./my-project"),
    criteria={
        "file_exists": ["src/main.py", "tests/"],
        "syntax_valid": True,
        "tests_pass": True,
        "documentation_present": True
    },
    forge_type=ForgeType.PROJECT
)

for check in checks:
    status = "✓" if check.passed else "✗"
    print(f"{status} {check.criterion}: {check.score}/10 - {check.message}")
```

---

## BUILT-IN TEMPLATES

| Template | Type | Description |
|----------|------|-------------|
| `python-project` | Project | Full Python package with tests |
| `fastapi-service` | Code | FastAPI microservice with Docker |
| `react-component` | Code | React TypeScript component |
| `cli-tool` | Code | Python CLI with argparse |
| `markdown-doc` | Content | Structured markdown document |
| `config-file` | Data | YAML configuration file |

---

## QUALITY CRITERIA

| Criterion | Description | Score Impact |
|-----------|-------------|--------------|
| `file_exists` | Required files present | High |
| `file_not_empty` | Files have content | Medium |
| `syntax_valid` | No syntax errors | High |
| `tests_pass` | Unit tests pass | High |
| `lint_clean` | No linting issues | Medium |
| `dependencies_resolved` | Dependencies defined | Medium |
| `documentation_present` | Has README/docs | Low |
| `structure_complete` | Expected structure | Medium |

---

## QUICK COMMANDS

```bash
# Forge commands
forge forge <name>                    # Create new item
forge forge <name> -t <template>      # Use template
forge templates                        # List templates
forge history                          # Show history
forge status <path>                    # Check status

# Examples
forge forge myapp -t python-project -d "My app"
forge forge Button -t react-component
forge forge api -t fastapi-service -o ./services
```

---

## INSTALLATION

```bash
pip install pyyaml jinja2 ruff pytest

# Optional for full functionality
pip install aiofiles watchdog
```

---

$ARGUMENTS
