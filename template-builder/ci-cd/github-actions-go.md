# GitHub Actions Go Template

> Production-ready GitHub Actions workflows for Go applications

## Overview

This template provides GitHub Actions configurations for Go with:
- Build and test workflows
- Multi-version testing
- Code coverage and linting
- Binary releases
- Docker publishing

## Quick Start

```bash
# Create workflow directory
mkdir -p .github/workflows

# Create workflow file
touch .github/workflows/ci.yml

# Test locally with act
act -j build
```

## Complete CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

env:
  GO_VERSION: '1.22'
  GOLANGCI_LINT_VERSION: v1.55.2

jobs:
  # ===========================================================================
  # Lint
  # ===========================================================================
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: ${{ env.GOLANGCI_LINT_VERSION }}
          args: --timeout=5m

      - name: Check go mod
        run: |
          go mod tidy
          git diff --exit-code go.mod go.sum

      - name: Check formatting
        run: |
          gofmt -l .
          test -z "$(gofmt -l .)"

  # ===========================================================================
  # Test
  # ===========================================================================
  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
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

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Download dependencies
        run: go mod download

      - name: Run tests
        run: |
          go test -v -race -coverprofile=coverage.out -covermode=atomic ./...
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db?sslmode=disable
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.out
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

      - name: Upload coverage artifact
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage.out

  # ===========================================================================
  # Matrix Test (Multiple Go Versions)
  # ===========================================================================
  test-matrix:
    name: Test Go ${{ matrix.go-version }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        go-version: ['1.21', '1.22']
        os: [ubuntu-latest, macos-latest, windows-latest]
      fail-fast: false

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ matrix.go-version }}
          cache: true

      - name: Run tests
        run: go test -v ./...

  # ===========================================================================
  # Build
  # ===========================================================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Build
        run: |
          CGO_ENABLED=0 go build -ldflags="-s -w -X main.version=${{ github.sha }}" -o bin/myapp ./cmd/myapp

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: binary
          path: bin/myapp

  # ===========================================================================
  # Security Scan
  # ===========================================================================
  security:
    name: Security
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Run Gosec
        uses: securego/gosec@master
        with:
          args: '-no-fail -fmt sarif -out results.sarif ./...'

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif

      - name: Run govulncheck
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...
```

## Release Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  packages: write

env:
  GO_VERSION: '1.22'

jobs:
  # ===========================================================================
  # Build Binaries
  # ===========================================================================
  build:
    name: Build ${{ matrix.os }}-${{ matrix.arch }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - os: linux
            arch: amd64
          - os: linux
            arch: arm64
          - os: darwin
            arch: amd64
          - os: darwin
            arch: arm64
          - os: windows
            arch: amd64
            ext: .exe

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ env.GO_VERSION }}
          cache: true

      - name: Get version
        id: version
        run: echo "version=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Build binary
        env:
          GOOS: ${{ matrix.os }}
          GOARCH: ${{ matrix.arch }}
          CGO_ENABLED: 0
        run: |
          go build \
            -ldflags="-s -w -X main.version=${{ steps.version.outputs.version }} -X main.commit=${{ github.sha }}" \
            -o dist/myapp-${{ matrix.os }}-${{ matrix.arch }}${{ matrix.ext }} \
            ./cmd/myapp

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: binary-${{ matrix.os }}-${{ matrix.arch }}
          path: dist/

  # ===========================================================================
  # Create Release
  # ===========================================================================
  release:
    name: Release
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          path: dist
          pattern: binary-*
          merge-multiple: true

      - name: Create checksums
        run: |
          cd dist
          sha256sum * > checksums.txt

      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            dist/*
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, '-') }}

  # ===========================================================================
  # Docker
  # ===========================================================================
  docker:
    name: Docker
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Get version
        id: version
        run: echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ghcr.io/${{ github.repository }}
            ${{ github.repository }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
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
          build-args: |
            VERSION=${{ steps.version.outputs.version }}
            COMMIT=${{ github.sha }}
```

## GoReleaser Integration

```yaml
# .github/workflows/goreleaser.yml
name: GoReleaser

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  packages: write

jobs:
  goreleaser:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          distribution: goreleaser
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          HOMEBREW_TAP_GITHUB_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

```yaml
# .goreleaser.yml
version: 1

before:
  hooks:
    - go mod tidy
    - go generate ./...

builds:
  - id: myapp
    main: ./cmd/myapp
    binary: myapp
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w
      - -X main.version={{.Version}}
      - -X main.commit={{.Commit}}
      - -X main.date={{.Date}}

archives:
  - id: default
    format: tar.gz
    format_overrides:
      - goos: windows
        format: zip
    name_template: >-
      {{ .ProjectName }}_
      {{- .Version }}_
      {{- .Os }}_
      {{- .Arch }}

checksum:
  name_template: 'checksums.txt'

changelog:
  sort: asc
  filters:
    exclude:
      - '^docs:'
      - '^test:'
      - '^chore:'
  groups:
    - title: Features
      regexp: '^feat'
    - title: Bug Fixes
      regexp: '^fix'
    - title: Performance
      regexp: '^perf'

dockers:
  - image_templates:
      - 'ghcr.io/{{ .Env.GITHUB_REPOSITORY }}:{{ .Tag }}'
      - 'ghcr.io/{{ .Env.GITHUB_REPOSITORY }}:latest'
    dockerfile: Dockerfile
    build_flag_templates:
      - '--platform=linux/amd64'
      - '--label=org.opencontainers.image.source=https://github.com/{{ .Env.GITHUB_REPOSITORY }}'

brews:
  - repository:
      owner: myorg
      name: homebrew-tap
    homepage: https://github.com/myorg/myapp
    description: My application description
    license: MIT
    install: |
      bin.install "myapp"
    test: |
      system "#{bin}/myapp", "--version"

nfpms:
  - id: packages
    package_name: myapp
    vendor: My Organization
    homepage: https://github.com/myorg/myapp
    maintainer: Team <team@example.com>
    description: My application description
    license: MIT
    formats:
      - deb
      - rpm
      - apk
```

## golangci-lint Configuration

```yaml
# .golangci.yml
run:
  timeout: 5m
  issues-exit-code: 1
  tests: true
  skip-dirs:
    - vendor
    - third_party

linters:
  enable:
    - errcheck
    - gosimple
    - govet
    - ineffassign
    - staticcheck
    - typecheck
    - unused
    - gosec
    - gofmt
    - goimports
    - misspell
    - unconvert
    - unparam
    - nakedret
    - prealloc
    - exportloopref
    - gocritic
    - revive

linters-settings:
  errcheck:
    check-type-assertions: true
    check-blank: true
  govet:
    check-shadowing: true
  gofmt:
    simplify: true
  goimports:
    local-prefixes: github.com/myorg/myapp
  misspell:
    locale: US
  nakedret:
    max-func-lines: 30
  prealloc:
    simple: true
    range-loops: true
    for-loops: true
  gocritic:
    enabled-tags:
      - diagnostic
      - performance
      - style
  revive:
    rules:
      - name: blank-imports
      - name: context-as-argument
      - name: context-keys-type
      - name: dot-imports
      - name: error-return
      - name: error-strings
      - name: error-naming
      - name: exported
      - name: increment-decrement
      - name: var-naming
      - name: package-comments
      - name: range
      - name: receiver-naming
      - name: time-naming
      - name: unexported-return
      - name: indent-error-flow
      - name: errorf

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
        - gosec
    - path: mock_
      linters:
        - all
```

## CLAUDE.md Integration

```markdown
# Go CI/CD

## Commands
- `go build ./...` - Build all packages
- `go test ./...` - Run all tests
- `go test -race ./...` - Run with race detector
- `go test -cover ./...` - Run with coverage
- `golangci-lint run` - Run linters

## Build Flags
- `CGO_ENABLED=0` - Static binary
- `-ldflags="-s -w"` - Strip debug info
- `-ldflags="-X main.version=..."` - Embed version

## Testing
- `go test -v` - Verbose output
- `go test -coverprofile=coverage.out` - Coverage file
- `go tool cover -html=coverage.out` - View coverage

## Tools
- `golangci-lint` - Linter aggregator
- `gosec` - Security scanner
- `govulncheck` - Vulnerability checker
- `goreleaser` - Release automation
```

## AI Suggestions

1. **Configure golangci-lint** - Comprehensive linting
2. **Add race detection** - Test with `-race` flag
3. **Implement matrix testing** - Multiple Go versions
4. **Configure GoReleaser** - Automated releases
5. **Add security scanning** - gosec and govulncheck
6. **Implement caching** - Go module cache
7. **Add cross-compilation** - Multi-platform binaries
8. **Configure Docker builds** - Multi-arch images
9. **Add Homebrew tap** - Easy installation
10. **Implement code coverage** - Coverage reporting
