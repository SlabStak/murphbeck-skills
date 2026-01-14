# Caddy Server Configuration Template

> Production-ready Caddy configurations with automatic HTTPS, reverse proxy, and modern security

## Overview

This template provides Caddy configurations with:
- Automatic HTTPS via Let's Encrypt
- Reverse proxy with load balancing
- File server with compression
- Authentication and rate limiting
- Docker and Kubernetes deployment

## Quick Start

```bash
# Run Caddy with Caddyfile
caddy run --config Caddyfile

# Format Caddyfile
caddy fmt --overwrite Caddyfile

# Validate configuration
caddy validate --config Caddyfile

# Reload configuration
caddy reload --config Caddyfile
```

## Basic Caddyfile

```caddyfile
# Global options
{
    # Email for Let's Encrypt
    email admin@example.com

    # Staging for testing (remove for production)
    # acme_ca https://acme-staging-v02.api.letsencrypt.org/directory

    # Admin API (disable in production)
    admin off

    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
        level INFO
    }

    # Performance
    servers {
        protocols h1 h2 h3
    }
}

# Simple static site
example.com {
    root * /var/www/html
    file_server
    encode gzip zstd

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        -Server
    }

    # Logging
    log {
        output file /var/log/caddy/example.log
        format json
    }
}

# Redirect www to non-www
www.example.com {
    redir https://example.com{uri} permanent
}
```

## Reverse Proxy Configuration

```caddyfile
# Single backend
api.example.com {
    reverse_proxy localhost:8080 {
        # Health check
        health_uri /health
        health_interval 30s
        health_timeout 5s

        # Headers
        header_up Host {upstream_hostport}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Rate limiting
    rate_limit {
        zone api {
            key {remote_host}
            events 100
            window 1m
        }
    }
}

# Load balancing multiple backends
app.example.com {
    reverse_proxy {
        to localhost:8081
        to localhost:8082
        to localhost:8083

        # Load balancing policy
        lb_policy round_robin
        # lb_policy least_conn
        # lb_policy ip_hash
        # lb_policy first
        # lb_policy random

        # Health checks
        health_uri /health
        health_interval 10s
        health_timeout 5s
        health_status 2xx

        # Retry failed requests
        lb_try_duration 5s
        lb_try_interval 250ms

        # Fail duration
        fail_duration 30s
    }

    # Compression
    encode gzip zstd

    # Request/response manipulation
    header_up X-Request-ID {uuid}
}

# Weighted load balancing
weighted.example.com {
    reverse_proxy {
        to localhost:8081
        to localhost:8082

        lb_policy weighted_round_robin

        # Custom weights (via multiple entries)
        # 3:1 ratio
        to localhost:8081
        to localhost:8081
        to localhost:8081
        to localhost:8082
    }
}
```

## Path-Based Routing

```caddyfile
example.com {
    # API routes
    handle /api/* {
        reverse_proxy api-server:8080 {
            header_up X-Forwarded-Prefix /api
        }
    }

    # WebSocket routes
    handle /ws/* {
        reverse_proxy ws-server:8081 {
            transport http {
                versions 1.1 2
            }
        }
    }

    # Static assets
    handle /static/* {
        root * /var/www
        file_server
        header Cache-Control "public, max-age=31536000, immutable"
    }

    # SPA fallback
    handle {
        root * /var/www/html
        try_files {path} /index.html
        file_server
    }
}

# Version-based API routing
api.example.com {
    @v1 path /v1/*
    handle @v1 {
        uri strip_prefix /v1
        reverse_proxy api-v1:8080
    }

    @v2 path /v2/*
    handle @v2 {
        uri strip_prefix /v2
        reverse_proxy api-v2:8080
    }

    # Default to latest version
    handle {
        reverse_proxy api-v2:8080
    }
}
```

## Authentication

```caddyfile
# Basic authentication
admin.example.com {
    basicauth /* {
        # Generate hash: caddy hash-password
        admin $2a$14$Zkx19XLiW6VYouLHR5NmfOFU0z2GTNmpkT/5qqR7hx4IjWJPDhjvG
        user2 $2a$14$...
    }

    reverse_proxy admin-panel:8080
}

# Forward authentication (OAuth proxy)
secure.example.com {
    forward_auth authproxy:4180 {
        uri /oauth2/auth
        copy_headers X-Auth-Request-User X-Auth-Request-Email Authorization
    }

    reverse_proxy backend:8080
}

# JWT validation
api.example.com {
    @authenticated {
        header Authorization Bearer*
    }

    handle @authenticated {
        # JWT validation via forward_auth
        forward_auth jwt-validator:8080 {
            uri /validate
            copy_headers X-User-ID X-User-Role
        }
        reverse_proxy api:8080
    }

    handle {
        respond "Unauthorized" 401
    }
}

# IP-based access control
internal.example.com {
    @blocked not remote_ip 10.0.0.0/8 192.168.0.0/16
    respond @blocked "Forbidden" 403

    reverse_proxy internal-app:8080
}
```

## SSL/TLS Configuration

```caddyfile
{
    # Use DNS challenge for wildcard certs
    acme_dns cloudflare {env.CF_API_TOKEN}
}

# Wildcard certificate
*.example.com {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }

    @app host app.example.com
    handle @app {
        reverse_proxy app:8080
    }

    @api host api.example.com
    handle @api {
        reverse_proxy api:8080
    }

    # Default handler
    handle {
        respond "Not Found" 404
    }
}

# Custom certificate
secure.example.com {
    tls /etc/ssl/certs/cert.pem /etc/ssl/private/key.pem

    reverse_proxy backend:8080
}

# Mutual TLS (client certificates)
mtls.example.com {
    tls {
        client_auth {
            mode require_and_verify
            trusted_ca_cert_file /etc/ssl/ca.pem
        }
    }

    reverse_proxy backend:8080
}

# TLS options
strict.example.com {
    tls {
        protocols tls1.3
        curves x25519
        alpn h2
    }

    reverse_proxy backend:8080
}
```

## Caching and Compression

```caddyfile
example.com {
    # Enable compression
    encode {
        gzip
        zstd
        minimum_length 1024
    }

    # Cache static files
    @static {
        path *.css *.js *.png *.jpg *.jpeg *.gif *.ico *.svg *.woff *.woff2
    }
    header @static Cache-Control "public, max-age=31536000, immutable"

    # Cache HTML with revalidation
    @html {
        path *.html
    }
    header @html Cache-Control "public, max-age=3600, must-revalidate"

    # No cache for API
    @api {
        path /api/*
    }
    header @api Cache-Control "no-store, no-cache, must-revalidate"

    root * /var/www/html
    file_server
}
```

## Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"  # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./site:/var/www/html:ro
      - caddy_data:/data
      - caddy_config:/config
    environment:
      - CF_API_TOKEN=${CF_API_TOKEN}
    networks:
      - web

  app:
    image: my-app:latest
    expose:
      - "8080"
    networks:
      - web

volumes:
  caddy_data:
  caddy_config:

networks:
  web:
    driver: bridge
```

```caddyfile
# Caddyfile for Docker
{
    email admin@example.com
}

example.com {
    reverse_proxy app:8080
    encode gzip zstd

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        -Server
    }
}
```

## Kubernetes Deployment

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: caddy-config
  namespace: production
data:
  Caddyfile: |
    {
        admin off
        auto_https off
    }

    :80 {
        reverse_proxy backend:8080 {
            health_uri /health
            health_interval 10s
        }

        encode gzip zstd

        header {
            X-Frame-Options "SAMEORIGIN"
            X-Content-Type-Options "nosniff"
            -Server
        }
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: caddy
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: caddy
  template:
    metadata:
      labels:
        app: caddy
    spec:
      containers:
        - name: caddy
          image: caddy:2-alpine
          ports:
            - containerPort: 80
              name: http
            - containerPort: 443
              name: https
          volumeMounts:
            - name: config
              mountPath: /etc/caddy/Caddyfile
              subPath: Caddyfile
            - name: data
              mountPath: /data
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 30
      volumes:
        - name: config
          configMap:
            name: caddy-config
        - name: data
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: caddy
  namespace: production
spec:
  selector:
    app: caddy
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 443
  type: LoadBalancer
```

## JSON Configuration

```json
{
  "admin": {
    "disabled": true
  },
  "logging": {
    "logs": {
      "default": {
        "writer": {
          "output": "file",
          "filename": "/var/log/caddy/access.log"
        },
        "encoder": {
          "format": "json"
        },
        "level": "INFO"
      }
    }
  },
  "apps": {
    "http": {
      "servers": {
        "main": {
          "listen": [":443"],
          "routes": [
            {
              "match": [
                {
                  "host": ["example.com"]
                }
              ],
              "handle": [
                {
                  "handler": "subroute",
                  "routes": [
                    {
                      "handle": [
                        {
                          "handler": "reverse_proxy",
                          "upstreams": [
                            {"dial": "backend:8080"}
                          ],
                          "health_checks": {
                            "active": {
                              "uri": "/health",
                              "interval": "30s"
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    "tls": {
      "automation": {
        "policies": [
          {
            "subjects": ["example.com"],
            "issuers": [
              {
                "module": "acme",
                "email": "admin@example.com"
              }
            ]
          }
        ]
      }
    }
  }
}
```

## CLAUDE.md Integration

```markdown
# Caddy Server Configuration

## Commands
- `caddy run` - Start Caddy
- `caddy reload` - Reload config without downtime
- `caddy fmt` - Format Caddyfile
- `caddy validate` - Validate config
- `caddy hash-password` - Generate bcrypt hash

## Key Features
- **Automatic HTTPS**: Certificates via Let's Encrypt
- **HTTP/3**: Built-in QUIC support
- **Reverse Proxy**: With health checks and load balancing
- **File Server**: With compression and caching

## Configuration Methods
- Caddyfile (declarative)
- JSON (API-driven)
- Environment variables

## Common Patterns
- `reverse_proxy` - Backend proxy
- `file_server` - Static files
- `encode gzip` - Compression
- `header` - Response headers
- `basicauth` - Authentication
```

## AI Suggestions

1. **Add rate limiting plugin** - Configure caddy-ratelimit
2. **Implement circuit breaker** - Handle backend failures gracefully
3. **Configure request tracing** - Add OpenTelemetry integration
4. **Add metrics endpoint** - Prometheus metrics at /metrics
5. **Implement A/B testing** - Header-based traffic splitting
6. **Configure WebSocket proxy** - Proper WebSocket handling
7. **Add geographic routing** - Route by client location
8. **Implement caching layer** - Response caching plugin
9. **Configure log shipping** - Send logs to centralized system
10. **Add WAF rules** - Web application firewall integration
