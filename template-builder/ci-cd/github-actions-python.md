# GitHub Actions Python Template

> Production-ready GitHub Actions workflows for Python applications with testing, linting, and deployment

## Overview

This template provides GitHub Actions workflows with:
- Multi-version Python testing
- Poetry/pip dependency management
- Type checking and linting
- Docker builds and PyPI publishing
- Automated releases

## Quick Start

```bash
# Create workflows directory
mkdir -p .github/workflows

# Copy workflow files
cp ci.yml .github/workflows/
cp release.yml .github/workflows/

# Push to trigger workflow
git push origin main
```

## CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  PYTHON_VERSION: '3.12'
  POETRY_VERSION: '1.7.1'

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}
          virtualenvs-create: true
          virtualenvs-in-project: true

      - name: Load cached venv
        id: cached-poetry-dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: venv-${{ runner.os }}-${{ env.PYTHON_VERSION }}-${{ hashFiles('**/poetry.lock') }}

      - name: Install dependencies
        if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
        run: poetry install --no-interaction --no-root

      - name: Install project
        run: poetry install --no-interaction

      - name: Run Ruff linter
        run: poetry run ruff check .

      - name: Run Ruff formatter
        run: poetry run ruff format --check .

      - name: Run mypy
        run: poetry run mypy src/

  test:
    name: Test
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        python-version: ['3.10', '3.11', '3.12']
        os: [ubuntu-latest]
        include:
          - python-version: '3.12'
            os: windows-latest
          - python-version: '3.12'
            os: macos-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}
          virtualenvs-create: true
          virtualenvs-in-project: true

      - name: Load cached venv
        id: cached-poetry-dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: venv-${{ runner.os }}-${{ matrix.python-version }}-${{ hashFiles('**/poetry.lock') }}

      - name: Install dependencies
        if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
        run: poetry install --no-interaction --no-root

      - name: Install project
        run: poetry install --no-interaction

      - name: Run tests
        run: poetry run pytest --cov=src --cov-report=xml --cov-report=html -v

      - name: Upload coverage
        if: matrix.python-version == '3.12' && matrix.os == 'ubuntu-latest'
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Upload coverage report
        if: matrix.python-version == '3.12' && matrix.os == 'ubuntu-latest'
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: htmlcov/

  security:
    name: Security
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}

      - name: Install dependencies
        run: poetry install --no-interaction

      - name: Run Bandit security linter
        run: poetry run bandit -r src/ -c pyproject.toml

      - name: Run Safety check
        run: poetry run safety check

      - name: Run pip-audit
        run: |
          pip install pip-audit
          poetry export -f requirements.txt | pip-audit -r /dev/stdin

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}

      - name: Build package
        run: poetry build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  docs:
    name: Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}

      - name: Install dependencies
        run: poetry install --no-interaction --with docs

      - name: Build docs
        run: poetry run mkdocs build

      - name: Upload docs
        uses: actions/upload-artifact@v4
        with:
          name: docs
          path: site/
```

## Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

permissions:
  contents: write
  packages: write
  id-token: write

env:
  PYTHON_VERSION: '3.12'
  POETRY_VERSION: '1.7.1'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    outputs:
      new_release_published: ${{ steps.semantic.outputs.new_release_published }}
      new_release_version: ${{ steps.semantic.outputs.new_release_version }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}

      - name: Semantic Release
        id: semantic
        uses: python-semantic-release/python-semantic-release@v8.7.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}

  publish-pypi:
    name: Publish to PyPI
    runs-on: ubuntu-latest
    needs: [release]
    if: needs.release.outputs.new_release_published == 'true'
    environment:
      name: pypi
      url: https://pypi.org/p/${{ github.event.repository.name }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: v${{ needs.release.outputs.new_release_version }}

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}

      - name: Build package
        run: poetry build

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: ${{ secrets.PYPI_API_TOKEN }}
          # For trusted publishing (OIDC):
          # No password needed, configure in PyPI

  publish-docker:
    name: Publish Docker Image
    runs-on: ubuntu-latest
    needs: [release]
    if: needs.release.outputs.new_release_published == 'true'
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: v${{ needs.release.outputs.new_release_version }}

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}},value=${{ needs.release.outputs.new_release_version }}
            type=semver,pattern={{major}}.{{minor}},value=${{ needs.release.outputs.new_release_version }}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-docs:
    name: Deploy Documentation
    runs-on: ubuntu-latest
    needs: [release]
    if: needs.release.outputs.new_release_published == 'true'
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: v${{ needs.release.outputs.new_release_version }}
          fetch-depth: 0

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          version: ${{ env.POETRY_VERSION }}

      - name: Install dependencies
        run: poetry install --no-interaction --with docs

      - name: Configure Git
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com

      - name: Deploy docs
        run: poetry run mkdocs gh-deploy --force
```

## Django/FastAPI Application Workflow

```yaml
# .github/workflows/app.yml
name: Application CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  PYTHON_VERSION: '3.12'

jobs:
  test:
    name: Test Application
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1
        with:
          virtualenvs-create: true
          virtualenvs-in-project: true

      - name: Load cached venv
        id: cached-poetry-dependencies
        uses: actions/cache@v4
        with:
          path: .venv
          key: venv-${{ runner.os }}-${{ env.PYTHON_VERSION }}-${{ hashFiles('**/poetry.lock') }}

      - name: Install dependencies
        if: steps.cached-poetry-dependencies.outputs.cache-hit != 'true'
        run: poetry install --no-interaction --no-root

      - name: Install project
        run: poetry install --no-interaction

      - name: Run migrations
        run: poetry run alembic upgrade head
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run tests
        run: poetry run pytest --cov=app --cov-report=xml -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          SECRET_KEY: test-secret-key
          ENVIRONMENT: testing

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          token: ${{ secrets.CODECOV_TOKEN }}

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [test]
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install Poetry
        uses: snok/install-poetry@v1

      - name: Install dependencies
        run: poetry install --no-interaction

      - name: Start application
        run: |
          poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
          sleep 5
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

      - name: Run E2E tests
        run: poetry run pytest tests/e2e/ -v
        env:
          API_URL: http://localhost:8000
```

## Data Science/ML Workflow

```yaml
# .github/workflows/ml.yml
name: ML Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'models/**'
      - 'data/**'
      - 'notebooks/**'
  workflow_dispatch:

env:
  PYTHON_VERSION: '3.11'

jobs:
  validate:
    name: Validate Data
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install poetry
          poetry install --no-interaction

      - name: Validate data schema
        run: poetry run python scripts/validate_data.py

      - name: Run data quality checks
        run: poetry run great_expectations checkpoint run data_quality

  train:
    name: Train Model
    runs-on: ubuntu-latest
    needs: [validate]
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          lfs: true

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install poetry
          poetry install --no-interaction

      - name: Train model
        run: poetry run python scripts/train.py
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Upload model artifacts
        uses: actions/upload-artifact@v4
        with:
          name: model
          path: models/

  evaluate:
    name: Evaluate Model
    runs-on: ubuntu-latest
    needs: [train]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download model
        uses: actions/download-artifact@v4
        with:
          name: model
          path: models/

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        run: |
          pip install poetry
          poetry install --no-interaction

      - name: Evaluate model
        run: poetry run python scripts/evaluate.py

      - name: Upload metrics
        uses: actions/upload-artifact@v4
        with:
          name: metrics
          path: reports/
```

## CLAUDE.md Integration

```markdown
# GitHub Actions - Python

## Commands
- Run locally: `act -j test`
- Check syntax: `actionlint`
- Poetry install: `poetry install`
- Run tests: `poetry run pytest`

## Key Workflows
- `ci.yml` - Lint, test, build on every PR
- `release.yml` - Semantic release with PyPI publish
- `app.yml` - Application-specific testing
- `ml.yml` - ML pipeline workflows

## Caching
- Poetry virtualenv cached by lockfile hash
- Docker layers cached with `type=gha`
- pip cache for faster installs

## Secrets Required
- `PYPI_API_TOKEN` - PyPI publishing
- `CODECOV_TOKEN` - Coverage uploads
- `GITHUB_TOKEN` - Auto-provided
```

## AI Suggestions

1. **Add matrix testing** - Test across Python versions
2. **Implement Poetry caching** - Cache virtual environments
3. **Add security scanning** - Bandit, Safety, pip-audit
4. **Configure trusted publishing** - PyPI OIDC
5. **Implement semantic release** - Python semantic release
6. **Add type checking** - mypy in CI
7. **Configure pre-commit** - Local and CI hooks
8. **Add documentation builds** - MkDocs/Sphinx
9. **Implement ML pipelines** - MLflow, DVC integration
10. **Add container scanning** - Trivy for Docker images
