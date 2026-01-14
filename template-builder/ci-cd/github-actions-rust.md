# GitHub Actions Rust Template

> Production-ready GitHub Actions workflows for Rust applications

## Overview

This template provides GitHub Actions configurations for Rust with:
- Build and test workflows
- Multi-platform compilation
- Clippy and rustfmt checks
- Binary releases
- Cargo crate publishing

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
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1
  RUSTFLAGS: -D warnings

jobs:
  # ===========================================================================
  # Format Check
  # ===========================================================================
  fmt:
    name: Format
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt

      - name: Check formatting
        run: cargo fmt --all -- --check

  # ===========================================================================
  # Clippy Lint
  # ===========================================================================
  clippy:
    name: Clippy
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          cache-on-failure: true

      - name: Run Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

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

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Run tests
        run: cargo test --all-features --workspace
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/test_db

      - name: Run doc tests
        run: cargo test --doc

  # ===========================================================================
  # Test with Coverage
  # ===========================================================================
  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: llvm-tools-preview

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Install cargo-llvm-cov
        uses: taiki-e/install-action@cargo-llvm-cov

      - name: Generate coverage
        run: cargo llvm-cov --all-features --workspace --lcov --output-path lcov.info

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: lcov.info
          fail_ci_if_error: true
          token: ${{ secrets.CODECOV_TOKEN }}

  # ===========================================================================
  # Matrix Test (Multiple Rust Versions)
  # ===========================================================================
  test-matrix:
    name: Test Rust ${{ matrix.rust }} on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        rust: [stable, beta, nightly]
        os: [ubuntu-latest, macos-latest, windows-latest]
      fail-fast: false

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ matrix.rust }}

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          key: ${{ matrix.os }}-${{ matrix.rust }}

      - name: Run tests
        run: cargo test --all-features

  # ===========================================================================
  # MSRV Check
  # ===========================================================================
  msrv:
    name: MSRV
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@master
        with:
          toolchain: '1.70'  # Minimum supported Rust version

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Check MSRV
        run: cargo check --all-features

  # ===========================================================================
  # Build
  # ===========================================================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [fmt, clippy, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Build release
        run: cargo build --release --all-features

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: binary-linux
          path: target/release/myapp

  # ===========================================================================
  # Security Audit
  # ===========================================================================
  audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Install cargo-audit
        uses: taiki-e/install-action@cargo-audit

      - name: Run audit
        run: cargo audit

      - name: Install cargo-deny
        uses: taiki-e/install-action@cargo-deny

      - name: Run deny
        run: cargo deny check

  # ===========================================================================
  # Documentation
  # ===========================================================================
  docs:
    name: Documentation
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@nightly

      - name: Build docs
        run: cargo doc --all-features --no-deps
        env:
          RUSTDOCFLAGS: --cfg docsrs -D warnings
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
  CARGO_TERM_COLOR: always

jobs:
  # ===========================================================================
  # Build Binaries
  # ===========================================================================
  build:
    name: Build ${{ matrix.target }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        include:
          # Linux
          - target: x86_64-unknown-linux-gnu
            os: ubuntu-latest
          - target: x86_64-unknown-linux-musl
            os: ubuntu-latest
          - target: aarch64-unknown-linux-gnu
            os: ubuntu-latest

          # macOS
          - target: x86_64-apple-darwin
            os: macos-latest
          - target: aarch64-apple-darwin
            os: macos-latest

          # Windows
          - target: x86_64-pc-windows-msvc
            os: windows-latest
            ext: .exe

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install cross
        if: matrix.os == 'ubuntu-latest' && matrix.target != 'x86_64-unknown-linux-gnu'
        uses: taiki-e/install-action@cross

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2
        with:
          key: ${{ matrix.target }}

      - name: Build (native)
        if: matrix.os != 'ubuntu-latest' || matrix.target == 'x86_64-unknown-linux-gnu'
        run: cargo build --release --target ${{ matrix.target }}

      - name: Build (cross)
        if: matrix.os == 'ubuntu-latest' && matrix.target != 'x86_64-unknown-linux-gnu'
        run: cross build --release --target ${{ matrix.target }}

      - name: Package
        shell: bash
        run: |
          cd target/${{ matrix.target }}/release
          if [ "${{ matrix.os }}" = "windows-latest" ]; then
            7z a ../../../myapp-${{ matrix.target }}.zip myapp.exe
          else
            tar czvf ../../../myapp-${{ matrix.target }}.tar.gz myapp
          fi

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: binary-${{ matrix.target }}
          path: myapp-${{ matrix.target }}.*

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

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts
          pattern: binary-*
          merge-multiple: true

      - name: Create checksums
        run: |
          cd artifacts
          sha256sum * > SHA256SUMS.txt

      - name: Create release
        uses: softprops/action-gh-release@v1
        with:
          files: artifacts/*
          generate_release_notes: true
          draft: false
          prerelease: ${{ contains(github.ref, '-') }}

  # ===========================================================================
  # Publish to crates.io
  # ===========================================================================
  publish:
    name: Publish
    runs-on: ubuntu-latest
    needs: release
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Publish to crates.io
        run: cargo publish --token ${{ secrets.CARGO_REGISTRY_TOKEN }}

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

      - name: Download Linux binary
        uses: actions/download-artifact@v4
        with:
          name: binary-x86_64-unknown-linux-musl
          path: .

      - name: Extract binary
        run: |
          tar xzvf myapp-x86_64-unknown-linux-musl.tar.gz
          chmod +x myapp

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile.release
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

## Dockerfiles

```dockerfile
# Dockerfile (multi-stage build)
FROM rust:1.75 AS builder

WORKDIR /app
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/myapp /usr/local/bin/

ENTRYPOINT ["myapp"]
```

```dockerfile
# Dockerfile.release (pre-built binary)
FROM gcr.io/distroless/cc-debian12

COPY myapp /usr/local/bin/myapp

ENTRYPOINT ["myapp"]
```

## Configuration Files

```toml
# deny.toml
[advisories]
db-path = "~/.cargo/advisory-db"
vulnerability = "deny"
unmaintained = "warn"
yanked = "warn"
notice = "warn"

[licenses]
unlicensed = "deny"
allow = [
    "MIT",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "Zlib",
    "MPL-2.0",
]
copyleft = "warn"

[bans]
multiple-versions = "warn"
wildcards = "allow"
deny = []
skip = []

[sources]
unknown-registry = "warn"
unknown-git = "warn"
allow-registry = ["https://github.com/rust-lang/crates.io-index"]
```

```toml
# clippy.toml
avoid-breaking-exported-api = false
cognitive-complexity-threshold = 30
```

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
use_small_heuristics = "Default"
newline_style = "Unix"
use_field_init_shorthand = true
use_try_shorthand = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true
```

## Workspace CI (Monorepo)

```yaml
# .github/workflows/ci.yml (Workspace)
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      crates: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            core:
              - 'crates/core/**'
            cli:
              - 'crates/cli/**'
            server:
              - 'crates/server/**'

  test:
    needs: changes
    if: ${{ needs.changes.outputs.crates != '[]' }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        crate: ${{ fromJSON(needs.changes.outputs.crates) }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo test -p ${{ matrix.crate }}
```

## CLAUDE.md Integration

```markdown
# Rust CI/CD

## Commands
- `cargo build --release` - Build release binary
- `cargo test` - Run tests
- `cargo clippy` - Run linter
- `cargo fmt --check` - Check formatting
- `cargo audit` - Security audit
- `cargo deny check` - License/dependency check

## Build Flags
- `--release` - Optimized build
- `--target <triple>` - Cross-compile
- `--all-features` - Enable all features

## Testing
- `cargo test` - Run all tests
- `cargo test --doc` - Run doc tests
- `cargo llvm-cov` - Coverage report
- `cargo bench` - Run benchmarks

## Tools
- `clippy` - Linter
- `rustfmt` - Formatter
- `cargo-audit` - Vulnerability scanner
- `cargo-deny` - Dependency checker
- `cross` - Cross-compilation
```

## AI Suggestions

1. **Configure clippy lints** - Project-specific rules
2. **Add MSRV checking** - Minimum supported version
3. **Implement cross-compilation** - Multi-platform builds
4. **Configure cargo-deny** - License compliance
5. **Add security auditing** - cargo-audit integration
6. **Implement test coverage** - llvm-cov reporting
7. **Configure caching** - Swatinem/rust-cache
8. **Add nightly features** - Optional nightly builds
9. **Implement workspace CI** - Monorepo support
10. **Configure crates.io publishing** - Automated releases
