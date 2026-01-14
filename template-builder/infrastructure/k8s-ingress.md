# Kubernetes Ingress Template

> Production-ready Ingress configurations for HTTP routing with TLS, path-based routing, and annotations

## Overview

This template provides Kubernetes Ingress configurations with:
- Multiple ingress controller support (nginx, traefik, ALB)
- TLS termination with cert-manager
- Path-based and host-based routing
- Rate limiting and authentication
- Custom annotations

## Quick Start

```bash
# Apply Ingress
kubectl apply -f ingress.yaml

# View Ingress
kubectl get ingress

# Describe Ingress
kubectl describe ingress my-app

# Check TLS certificate
kubectl get certificate
```

## Nginx Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/component: ingress
  annotations:
    # Ingress class
    kubernetes.io/ingress.class: nginx

    # TLS
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-connections: "10"

    # Timeouts
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"

    # Body size
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"

    # CORS
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://example.com"
    nginx.ingress.kubernetes.io/cors-allow-methods: "GET, POST, PUT, DELETE, OPTIONS"
    nginx.ingress.kubernetes.io/cors-allow-headers: "DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization"

    # Security headers
    nginx.ingress.kubernetes.io/configuration-snippet: |
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
        - www.example.com
      secretName: app-tls-secret
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
          - path: /ws
            pathType: Prefix
            backend:
              service:
                name: websocket
                port:
                  number: 80
    - host: www.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

## Path-Based Routing

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-routing
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls-secret
  rules:
    - host: api.example.com
      http:
        paths:
          # /v1/users -> users-service /users
          - path: /v1(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: api-v1
                port:
                  number: 80
          # /v2/users -> api-v2 /users
          - path: /v2(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: api-v2
                port:
                  number: 80
          # /health -> health-service /
          - path: /health
            pathType: Exact
            backend:
              service:
                name: health-service
                port:
                  number: 80
---
# Canary deployment routing
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-canary
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-canary
                port:
                  number: 80
```

## Authentication Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: authenticated-app
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "https://auth.example.com/oauth2/auth"
    nginx.ingress.kubernetes.io/auth-signin: "https://auth.example.com/oauth2/start?rd=$escaped_request_uri"
    nginx.ingress.kubernetes.io/auth-response-headers: "X-Auth-Request-User, X-Auth-Request-Email, Authorization"
    nginx.ingress.kubernetes.io/auth-cache-key: "$cookie_session"
    nginx.ingress.kubernetes.io/auth-cache-duration: "200 10m, 401 5m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - admin.example.com
      secretName: admin-tls-secret
  rules:
    - host: admin.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: admin-dashboard
                port:
                  number: 80
---
# Basic Auth Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: basic-auth-app
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/auth-type: basic
    nginx.ingress.kubernetes.io/auth-secret: basic-auth-secret
    nginx.ingress.kubernetes.io/auth-realm: "Authentication Required"
spec:
  ingressClassName: nginx
  rules:
    - host: internal.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: internal-app
                port:
                  number: 80
---
# Basic auth secret
apiVersion: v1
kind: Secret
metadata:
  name: basic-auth-secret
  namespace: production
type: Opaque
data:
  # Generated with: htpasswd -nb admin password | base64
  auth: YWRtaW46JGFwcjEkSDZ1c2h2TlokLk1KVi5jNnJuOVJxNW1PYWJPNmUu
```

## AWS ALB Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: alb-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: "443"
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:123456789:certificate/xxx

    # Health check
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: "30"
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: "5"
    alb.ingress.kubernetes.io/healthy-threshold-count: "2"
    alb.ingress.kubernetes.io/unhealthy-threshold-count: "3"

    # WAF
    alb.ingress.kubernetes.io/wafv2-acl-arn: arn:aws:wafv2:us-east-1:123456789:regional/webacl/xxx

    # Security groups
    alb.ingress.kubernetes.io/security-groups: sg-xxxx,sg-yyyy

    # Access logs
    alb.ingress.kubernetes.io/load-balancer-attributes: |
      access_logs.s3.enabled=true,
      access_logs.s3.bucket=my-alb-logs,
      access_logs.s3.prefix=app

    # Sticky sessions
    alb.ingress.kubernetes.io/target-group-attributes: |
      stickiness.enabled=true,
      stickiness.lb_cookie.duration_seconds=3600
spec:
  ingressClassName: alb
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

## GKE Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gke-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: gce
    kubernetes.io/ingress.global-static-ip-name: my-app-ip
    networking.gke.io/managed-certificates: my-app-cert
    networking.gke.io/v1beta1.FrontendConfig: my-frontend-config
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /*
            pathType: ImplementationSpecific
            backend:
              service:
                name: my-app
                port:
                  number: 80
---
# Managed Certificate
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: my-app-cert
  namespace: production
spec:
  domains:
    - app.example.com
    - www.example.com
---
# Frontend Config
apiVersion: networking.gke.io/v1beta1
kind: FrontendConfig
metadata:
  name: my-frontend-config
  namespace: production
spec:
  redirectToHttps:
    enabled: true
    responseCodeName: MOVED_PERMANENTLY_DEFAULT
  sslPolicy: modern-ssl-policy
```

## Cert-Manager Integration

```yaml
# ClusterIssuer for Let's Encrypt
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: admin@example.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
---
# Staging issuer for testing
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    email: admin@example.com
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-staging-key
    solvers:
      - http01:
          ingress:
            class: nginx
---
# Certificate resource (auto-created by ingress annotation)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-tls
  namespace: production
spec:
  secretName: app-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: app.example.com
  dnsNames:
    - app.example.com
    - www.example.com
  privateKey:
    algorithm: RSA
    size: 4096
```

## Rate Limiting Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rate-limited-api
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-rpm: "100"
    nginx.ingress.kubernetes.io/limit-connections: "5"
    nginx.ingress.kubernetes.io/limit-whitelist: "10.0.0.0/8,192.168.0.0/16"
    nginx.ingress.kubernetes.io/server-snippet: |
      limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
      limit_req zone=api burst=20 nodelay;
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

## WebSocket Support

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: websocket-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/upstream-hash-by: "$request_uri"
    nginx.ingress.kubernetes.io/configuration-snippet: |
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - ws.example.com
      secretName: ws-tls-secret
  rules:
    - host: ws.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: websocket-service
                port:
                  number: 80
```

## Monitoring Configuration

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ingress-alerts
  namespace: monitoring
spec:
  groups:
    - name: ingress-alerts
      rules:
        - alert: IngressHighErrorRate
          expr: |
            sum(rate(nginx_ingress_controller_requests{status=~"5.."}[5m])) by (ingress)
            /
            sum(rate(nginx_ingress_controller_requests[5m])) by (ingress) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High error rate on ingress {{ $labels.ingress }}"

        - alert: IngressHighLatency
          expr: |
            histogram_quantile(0.95,
              sum(rate(nginx_ingress_controller_request_duration_seconds_bucket[5m])) by (le, ingress)
            ) > 2
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High latency on ingress {{ $labels.ingress }}"

        - alert: IngressCertExpiringSoon
          expr: |
            (cert_manager_certificate_expiration_timestamp_seconds - time()) < 604800
          for: 1h
          labels:
            severity: warning
          annotations:
            summary: "Certificate {{ $labels.name }} expires in less than 7 days"
```

## CLAUDE.md Integration

```markdown
# Kubernetes Ingress

## Commands
- `kubectl get ingress` - List Ingresses
- `kubectl describe ingress my-app` - Show details
- `kubectl get certificate` - View certificates
- `kubectl logs -n ingress-nginx deploy/ingress-nginx-controller` - Controller logs

## Path Types
- `Exact` - Match exact path only
- `Prefix` - Match path prefix
- `ImplementationSpecific` - Controller-specific behavior

## TLS
- Use cert-manager for automatic certificate management
- ClusterIssuer for cluster-wide, Issuer for namespace-scoped
- Check certificate status: `kubectl get certificate`

## Debugging
```bash
# Test ingress routing
curl -H "Host: app.example.com" http://ingress-ip/

# Check nginx config
kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf

# View rewrite rules
kubectl describe ingress my-app | grep -A5 "Annotations"
```
```

## AI Suggestions

1. **Add ModSecurity WAF** - Enable web application firewall rules
2. **Implement traffic mirroring** - Mirror traffic to canary services
3. **Configure gRPC routing** - Add gRPC-specific annotations
4. **Add IP geolocation** - Route based on client location
5. **Implement circuit breaker** - Add upstream circuit breaking
6. **Configure mutual TLS** - Enable client certificate auth
7. **Add request transformation** - Modify headers/body in-flight
8. **Implement blue-green routing** - Header-based traffic splitting
9. **Add custom error pages** - Configure branded error responses
10. **Configure access logging** - Enable detailed request logging
