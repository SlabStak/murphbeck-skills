# Pre-commit Hooks Template

> Production-ready pre-commit configurations for code quality, security, and consistency enforcement

## Overview

This template provides pre-commit configurations with:
- Code formatting and linting
- Security scanning
- Secret detection
- Conventional commits
- Multi-language support

## Quick Start

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install
pre-commit install --hook-type commit-msg

# Run all hooks
pre-commit run --all-files

# Update hooks
pre-commit autoupdate
```

## Complete Configuration

```yaml
# .pre-commit-config.yaml
default_stages: [commit]
default_language_version:
  python: python3.12
  node: 20.10.0

repos:
  # ==========================================================================
  # General Hooks
  # ==========================================================================
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
        args: [--markdown-linebreak-ext=md]
      - id: end-of-file-fixer
      - id: check-yaml
        args: [--unsafe]
      - id: check-json
      - id: check-toml
      - id: check-xml
      - id: check-added-large-files
        args: [--maxkb=1000]
      - id: check-merge-conflict
      - id: check-case-conflict
      - id: check-symlinks
      - id: detect-private-key
      - id: mixed-line-ending
        args: [--fix=lf]
      - id: no-commit-to-branch
        args: [--branch, main, --branch, master]
      - id: check-executables-have-shebangs
      - id: check-shebang-scripts-are-executable

  # ==========================================================================
  # Secret Detection
  # ==========================================================================
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: [--baseline, .secrets.baseline]
        exclude: package-lock\.json|pnpm-lock\.yaml

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.1
    hooks:
      - id: gitleaks

  # ==========================================================================
  # Commit Message
  # ==========================================================================
  - repo: https://github.com/commitizen-tools/commitizen
    rev: v3.13.0
    hooks:
      - id: commitizen
        stages: [commit-msg]
      - id: commitizen-branch
        stages: [push]

  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.0.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
        args: [feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert]

  # ==========================================================================
  # JavaScript/TypeScript
  # ==========================================================================
  - repo: local
    hooks:
      - id: eslint
        name: ESLint
        entry: npx eslint --fix
        language: system
        types: [javascript, jsx, ts, tsx]
        pass_filenames: true

      - id: prettier
        name: Prettier
        entry: npx prettier --write --ignore-unknown
        language: system
        types_or: [javascript, jsx, ts, tsx, json, yaml, markdown, css, scss]
        pass_filenames: true

      - id: typecheck
        name: TypeScript Check
        entry: npx tsc --noEmit
        language: system
        types: [ts, tsx]
        pass_filenames: false

  # ==========================================================================
  # Python
  # ==========================================================================
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.9
    hooks:
      - id: ruff
        args: [--fix, --exit-non-zero-on-fix]
      - id: ruff-format

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies:
          - types-requests
          - types-PyYAML
        args: [--ignore-missing-imports]

  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args: [-c, pyproject.toml]
        additional_dependencies: [toml]

  # ==========================================================================
  # Go
  # ==========================================================================
  - repo: https://github.com/dnephin/pre-commit-golang
    rev: v0.5.1
    hooks:
      - id: go-fmt
      - id: go-vet
      - id: go-imports
      - id: go-cyclo
        args: [-over=15]
      - id: golangci-lint
      - id: go-build
      - id: go-mod-tidy

  # ==========================================================================
  # Rust
  # ==========================================================================
  - repo: https://github.com/doublify/pre-commit-rust
    rev: v1.0
    hooks:
      - id: fmt
      - id: cargo-check

  # ==========================================================================
  # Shell Scripts
  # ==========================================================================
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: v0.9.0.6
    hooks:
      - id: shellcheck
        args: [-x]

  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.7.0-4
    hooks:
      - id: shfmt
        args: [-i, '2', -ci]

  # ==========================================================================
  # Docker
  # ==========================================================================
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint-docker
        args: [--ignore, DL3008, --ignore, DL3018]

  # ==========================================================================
  # Kubernetes/Helm
  # ==========================================================================
  - repo: https://github.com/gruntwork-io/pre-commit
    rev: v0.1.23
    hooks:
      - id: helmlint

  - repo: https://github.com/stackrox/kube-linter
    rev: v0.6.7
    hooks:
      - id: kube-linter
        args: [--config, .kube-linter.yaml]

  # ==========================================================================
  # Terraform
  # ==========================================================================
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_tflint
        args:
          - --args=--config=__GIT_WORKING_DIR__/.tflint.hcl
      - id: terraform_docs
        args:
          - --args=--config=.terraform-docs.yml
      - id: terraform_checkov
        args:
          - --args=--config-file __GIT_WORKING_DIR__/.checkov.yml

  # ==========================================================================
  # SQL
  # ==========================================================================
  - repo: https://github.com/sqlfluff/sqlfluff
    rev: 2.3.5
    hooks:
      - id: sqlfluff-lint
        args: [--dialect, postgres]
      - id: sqlfluff-fix
        args: [--dialect, postgres]

  # ==========================================================================
  # Markdown
  # ==========================================================================
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.38.0
    hooks:
      - id: markdownlint
        args: [--fix, --config, .markdownlint.json]

  # ==========================================================================
  # YAML
  # ==========================================================================
  - repo: https://github.com/adrienverge/yamllint
    rev: v1.33.0
    hooks:
      - id: yamllint
        args: [-c, .yamllint.yaml]

  # ==========================================================================
  # Security Scanning
  # ==========================================================================
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.6
    hooks:
      - id: bandit
        args: [-c, pyproject.toml, -r]
        additional_dependencies: [toml]

  - repo: https://github.com/zricethezav/gitleaks
    rev: v8.18.1
    hooks:
      - id: gitleaks

  # ==========================================================================
  # Spelling
  # ==========================================================================
  - repo: https://github.com/codespell-project/codespell
    rev: v2.2.6
    hooks:
      - id: codespell
        args: [--ignore-words-list, "crate,te,fo"]
        exclude: >
          (?x)^(
            .*\.lock|
            package-lock\.json|
            yarn\.lock
          )$

  # ==========================================================================
  # Dependency Checks
  # ==========================================================================
  - repo: local
    hooks:
      - id: npm-audit
        name: npm audit
        entry: npm audit --audit-level=high
        language: system
        files: package\.json$
        pass_filenames: false

      - id: pip-audit
        name: pip audit
        entry: pip-audit -r requirements.txt
        language: system
        files: requirements.*\.txt$
        pass_filenames: false

# CI-specific configuration
ci:
  autofix_commit_msg: |
    [pre-commit.ci] auto fixes from pre-commit hooks

    for more information, see https://pre-commit.ci
  autofix_prs: true
  autoupdate_branch: ''
  autoupdate_commit_msg: '[pre-commit.ci] pre-commit autoupdate'
  autoupdate_schedule: weekly
  skip: [eslint, prettier, typecheck, go-build]
  submodules: false
```

## Configuration Files

```yaml
# .yamllint.yaml
extends: default
rules:
  line-length:
    max: 120
    level: warning
  truthy:
    check-keys: false
  comments:
    min-spaces-from-content: 1
  document-start: disable
  indentation:
    spaces: 2
    indent-sequences: consistent
```

```json
// .markdownlint.json
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD041": false,
  "MD024": {
    "siblings_only": true
  }
}
```

```yaml
# .kube-linter.yaml
checks:
  include:
    - "dangling-service"
    - "default-service-account"
    - "deprecated-service-account-field"
    - "docker-sock"
    - "drop-net-raw-capability"
    - "env-var-secret"
    - "exposed-services"
    - "host-ipc"
    - "host-network"
    - "host-pid"
    - "mismatching-selector"
    - "no-anti-affinity"
    - "no-extensions-v1beta"
    - "no-read-only-root-fs"
    - "non-existent-service-account"
    - "privilege-escalation-container"
    - "privileged-container"
    - "run-as-non-root"
    - "sensitive-host-mounts"
    - "ssh-port"
    - "unsafe-proc-mount"
    - "unsafe-sysctls"
    - "unset-cpu-requirements"
    - "unset-memory-requirements"
```

## Husky Integration (Node.js)

```json
// package.json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "commit-msg": "commitlint --edit"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,yaml,yml,md}": ["prettier --write"],
    "*.py": ["ruff check --fix", "ruff format"]
  }
}
```

```bash
#!/bin/sh
# .husky/pre-commit
. "$(dirname "$0")/_/husky.sh"
npx lint-staged
```

```bash
#!/bin/sh
# .husky/commit-msg
. "$(dirname "$0")/_/husky.sh"
npx --no -- commitlint --edit "$1"
```

## Makefile Integration

```makefile
# Makefile
.PHONY: install-hooks
install-hooks:
	pip install pre-commit
	pre-commit install
	pre-commit install --hook-type commit-msg
	pre-commit install --hook-type pre-push

.PHONY: run-hooks
run-hooks:
	pre-commit run --all-files

.PHONY: update-hooks
update-hooks:
	pre-commit autoupdate

.PHONY: clean-hooks
clean-hooks:
	pre-commit clean
	pre-commit gc
```

## CLAUDE.md Integration

```markdown
# Pre-commit Hooks

## Commands
- `pre-commit install` - Install hooks
- `pre-commit run --all-files` - Run all hooks
- `pre-commit autoupdate` - Update hook versions
- `pre-commit run <hook-id>` - Run specific hook

## Common Hooks
- `trailing-whitespace` - Remove trailing spaces
- `end-of-file-fixer` - Ensure newline at EOF
- `check-yaml/json/toml` - Validate syntax
- `detect-secrets` - Find leaked secrets

## Skip Hooks
- `SKIP=hook-id git commit` - Skip specific hook
- `git commit --no-verify` - Skip all hooks

## Stages
- `commit` - Run on commit (default)
- `commit-msg` - Validate commit message
- `push` - Run before push
```

## AI Suggestions

1. **Add secret detection** - Prevent credential leaks
2. **Configure commit linting** - Enforce conventional commits
3. **Add language-specific hooks** - ESLint, Ruff, golangci-lint
4. **Implement security scanning** - Bandit, Trivy, Checkov
5. **Configure CI integration** - pre-commit.ci
6. **Add spelling checks** - codespell
7. **Configure file size limits** - Prevent large files
8. **Add dependency auditing** - npm audit, pip-audit
9. **Implement staged file filtering** - lint-staged
10. **Configure hook stages** - commit, push, CI
