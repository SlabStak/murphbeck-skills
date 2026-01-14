# Traefik Configuration Template

> Production-ready Traefik ingress controller configuration with automatic SSL, middleware, and observability

## Overview

This template provides comprehensive Traefik configurations with:
- Automatic Let's Encrypt SSL certificates
- Middleware for authentication, rate limiting, headers
- Load balancing and circuit breakers
- Kubernetes Ingress/IngressRoute support
- Metrics and tracing

## Quick Start

```bash
# Install Traefik with Helm
helm repo add traefik https://traefik.github.io/charts
helm install traefik traefik/traefik -f values.yaml

# Apply IngressRoute
kubectl apply -f ingressroute.yaml
```

## Helm Values (values.yaml)

```yaml
# Traefik Helm Chart Values
image:
  name: traefik
  tag: "v3.0"
  pullPolicy: IfNotPresent

deployment:
  enabled: true
  replicas: 3
  annotations: {}
  podAnnotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "9100"

# Pod configuration
podDisruptionBudget:
  enabled: true
  minAvailable: 1

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 1000m
    memory: 512Mi

# Service configuration
service:
  enabled: true
  type: LoadBalancer
  annotations:
    # AWS NLB
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
  spec:
    externalTrafficPolicy: Local

# Ports
ports:
  web:
    port: 8000
    expose: true
    exposedPort: 80
    protocol: TCP
    redirectTo:
      port: websecure
  websecure:
    port: 8443
    expose: true
    exposedPort: 443
    protocol: TCP
    tls:
      enabled: true
  metrics:
    port: 9100
    expose: false

# Entrypoints configuration
additionalArguments:
  - "--entrypoints.web.address=:8000/tcp"
  - "--entrypoints.websecure.address=:8443/tcp"
  - "--entrypoints.websecure.http.tls=true"
  - "--api.dashboard=true"
  - "--api.insecure=false"
  - "--ping=true"
  - "--log.level=INFO"
  - "--accesslog=true"
  - "--accesslog.format=json"

# TLS configuration
tlsOptions:
  default:
    minVersion: VersionTLS12
    cipherSuites:
      - TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
      - TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
      - TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305
    sniStrict: true

# Let's Encrypt
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@example.com
      storage: /data/acme.json
      httpChallenge:
        entryPoint: web
      # For production
      # caServer: https://acme-v02.api.letsencrypt.org/directory
      # For staging
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory

# Persistence for ACME certificates
persistence:
  enabled: true
  name: data
  accessMode: ReadWriteOnce
  size: 128Mi
  storageClass: ""
  path: /data

# RBAC
rbac:
  enabled: true

# Service Account
serviceAccount:
  name: traefik

# Providers
providers:
  kubernetesCRD:
    enabled: true
    allowCrossNamespace: true
    allowExternalNameServices: true
  kubernetesIngress:
    enabled: true
    allowExternalNameServices: true
    publishedService:
      enabled: true

# Logs
logs:
  general:
    level: INFO
  access:
    enabled: true
    format: json
    fields:
      defaultMode: keep
      headers:
        defaultMode: drop
        names:
          User-Agent: keep
          Authorization: drop
          Content-Type: keep

# Metrics
metrics:
  prometheus:
    entryPoint: metrics
    addEntryPointsLabels: true
    addServicesLabels: true
    buckets: "0.1,0.3,1.2,5.0"

# Tracing
tracing:
  otlp:
    enabled: true
    http:
      endpoint: "http://otel-collector:4318/v1/traces"

# Affinity
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: traefik
          topologyKey: kubernetes.io/hostname

# Node selector
nodeSelector:
  kubernetes.io/os: linux
```

## IngressRoute Configuration

```yaml
# Basic IngressRoute
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: my-app
  namespace: production
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`app.example.com`)
      kind: Rule
      services:
        - name: my-app
          port: 80
      middlewares:
        - name: secure-headers
        - name: rate-limit
  tls:
    certResolver: letsencrypt
    domains:
      - main: app.example.com
---
# IngressRoute with path routing
apiVersion: traefik.io/v1alpha1
kind: IngressRoute
metadata:
  name: api-routes
  namespace: production
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`api.example.com`) && PathPrefix(`/v1`)
      kind: Rule
      services:
        - name: api-v1
          port: 80
      middlewares:
        - name: strip-prefix-v1
        - name: api-auth
        - name: rate-limit-api

    - match: Host(`api.example.com`) && PathPrefix(`/v2`)
      kind: Rule
      services:
        - name: api-v2
          port: 80
      middlewares:
        - name: strip-prefix-v2
        - name: api-auth
        - name: rate-limit-api

    - match: Host(`api.example.com`) && PathPrefix(`/health`)
      kind: Rule
      services:
        - name: api-v2
          port: 80
  tls:
    certResolver: letsencrypt
```

## Middleware Configurations

```yaml
# Security Headers
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: secure-headers
  namespace: production
spec:
  headers:
    browserXssFilter: true
    contentTypeNosniff: true
    frameDeny: true
    stsIncludeSubdomains: true
    stsPreload: true
    stsSeconds: 31536000
    customFrameOptionsValue: "SAMEORIGIN"
    customResponseHeaders:
      X-Powered-By: ""
      Server: ""
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    referrerPolicy: "strict-origin-when-cross-origin"
    permissionsPolicy: "geolocation=(), microphone=(), camera=()"
---
# Rate Limiting
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit
  namespace: production
spec:
  rateLimit:
    average: 100
    burst: 200
    period: 1m
    sourceCriterion:
      ipStrategy:
        depth: 1
---
# API Rate Limiting (stricter)
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: rate-limit-api
  namespace: production
spec:
  rateLimit:
    average: 50
    burst: 100
    period: 1m
---
# Strip Path Prefix
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: strip-prefix-v1
  namespace: production
spec:
  stripPrefix:
    prefixes:
      - /v1
---
# Basic Auth
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: basic-auth
  namespace: production
spec:
  basicAuth:
    secret: basic-auth-secret
---
# Forward Auth (for OAuth/OIDC)
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: oauth-auth
  namespace: production
spec:
  forwardAuth:
    address: http://oauth2-proxy.auth.svc.cluster.local/oauth2/auth
    trustForwardHeader: true
    authResponseHeaders:
      - X-Auth-Request-User
      - X-Auth-Request-Email
      - Authorization
---
# Circuit Breaker
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: circuit-breaker
  namespace: production
spec:
  circuitBreaker:
    expression: NetworkErrorRatio() > 0.30 || ResponseCodeRatio(500, 600, 0, 600) > 0.25
---
# Retry
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: retry
  namespace: production
spec:
  retry:
    attempts: 3
    initialInterval: 100ms
---
# Compress
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: compress
  namespace: production
spec:
  compress:
    excludedContentTypes:
      - text/event-stream
---
# IP Whitelist
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: ip-whitelist
  namespace: production
spec:
  ipAllowList:
    sourceRange:
      - 10.0.0.0/8
      - 192.168.0.0/16
---
# Buffering
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: buffering
  namespace: production
spec:
  buffering:
    maxRequestBodyBytes: 10485760  # 10MB
    memRequestBodyBytes: 2097152   # 2MB
    maxResponseBodyBytes: 10485760
    memResponseBodyBytes: 2097152
    retryExpression: "IsNetworkError() && Attempts() < 2"
---
# Chain multiple middlewares
apiVersion: traefik.io/v1alpha1
kind: Middleware
metadata:
  name: api-chain
  namespace: production
spec:
  chain:
    middlewares:
      - name: secure-headers
      - name: rate-limit-api
      - name: circuit-breaker
      - name: compress
```

## TraefikService (Load Balancing)

```yaml
# Weighted Round Robin
apiVersion: traefik.io/v1alpha1
kind: TraefikService
metadata:
  name: api-weighted
  namespace: production
spec:
  weighted:
    services:
      - name: api-v1
        port: 80
        weight: 20
      - name: api-v2
        port: 80
        weight: 80
---
# Mirroring (traffic shadowing)
apiVersion: traefik.io/v1alpha1
kind: TraefikService
metadata:
  name: api-mirror
  namespace: production
spec:
  mirroring:
    name: api-production
    port: 80
    mirrors:
      - name: api-canary
        port: 80
        percent: 10
---
# Failover
apiVersion: traefik.io/v1alpha1
kind: TraefikService
metadata:
  name: api-failover
  namespace: production
spec:
  failover:
    service:
      name: api-primary
      port: 80
    fallback:
      name: api-fallback
      port: 80
    healthCheck:
      path: /health
      interval: 10s
```

## TLS Configuration

```yaml
# TLS Options
apiVersion: traefik.io/v1alpha1
kind: TLSOption
metadata:
  name: modern
  namespace: production
spec:
  minVersion: VersionTLS13
  cipherSuites:
    - TLS_AES_128_GCM_SHA256
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
  curvePreferences:
    - X25519
    - CurveP384
---
# TLS Store (default certificate)
apiVersion: traefik.io/v1alpha1
kind: TLSStore
metadata:
  name: default
  namespace: production
spec:
  defaultCertificate:
    secretName: wildcard-tls-secret
```

## CLAUDE.md Integration

```markdown
# Traefik Configuration

## Commands
- `helm install traefik traefik/traefik -f values.yaml` - Install
- `kubectl get ingressroute` - List IngressRoutes
- `kubectl describe middleware secure-headers` - Show middleware
- `kubectl logs -l app.kubernetes.io/name=traefik` - View logs

## Key Concepts
- **EntryPoints**: Listen addresses (web, websecure)
- **Routers**: Match rules and route to services
- **Middlewares**: Request/response modifications
- **Services**: Backend service definitions

## Dashboard
Access via port-forward:
```bash
kubectl port-forward svc/traefik 9000:9000
```

## Let's Encrypt
- Staging: Test certificate issuance
- Production: Real certificates (rate limited)
- DNS Challenge: For wildcard certs
```

## AI Suggestions

1. **Add Traefik Mesh** - Implement service mesh capabilities
2. **Configure DNS challenge** - Use DNS-01 for wildcard certificates
3. **Add plugin system** - Custom middleware with Traefik plugins
4. **Implement canary deployments** - Gradual traffic shifting
5. **Add access logging to ELK** - Ship logs to Elasticsearch
6. **Configure Jaeger tracing** - Distributed request tracing
7. **Add custom error pages** - User-friendly error responses
8. **Implement API Gateway patterns** - Request transformation, aggregation
9. **Add mTLS** - Client certificate authentication
10. **Configure geographic routing** - Route by client location
