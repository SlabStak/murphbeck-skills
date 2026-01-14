# HAProxy Configuration Template

> Production-ready HAProxy configurations for high-performance load balancing, SSL termination, and traffic management

## Overview

This template provides HAProxy configurations with:
- Layer 4 and Layer 7 load balancing
- SSL/TLS termination and passthrough
- Health checks and circuit breaking
- Rate limiting and connection management
- High availability setup

## Quick Start

```bash
# Validate configuration
haproxy -c -f /etc/haproxy/haproxy.cfg

# Start HAProxy
haproxy -f /etc/haproxy/haproxy.cfg

# Reload configuration (graceful)
haproxy -f /etc/haproxy/haproxy.cfg -p /var/run/haproxy.pid -sf $(cat /var/run/haproxy.pid)

# Check stats
curl http://localhost:8404/stats
```

## Basic Configuration

```haproxy
# /etc/haproxy/haproxy.cfg
global
    log /dev/log local0
    log /dev/log local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin expose-fd listeners
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

    # Performance tuning
    maxconn 100000
    nbthread 4
    cpu-map auto:1/1-4 0-3

    # SSL settings
    ssl-default-bind-ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    ssl-default-bind-ciphersuites TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

    # Enable runtime API
    tune.ssl.default-dh-param 2048

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    option  http-server-close
    option  forwardfor except 127.0.0.0/8
    option  redispatch
    retries 3

    timeout connect 5s
    timeout client  30s
    timeout server  30s
    timeout http-request 10s
    timeout http-keep-alive 10s
    timeout queue 60s
    timeout tunnel 3600s

    # Error files
    errorfile 400 /etc/haproxy/errors/400.http
    errorfile 403 /etc/haproxy/errors/403.http
    errorfile 408 /etc/haproxy/errors/408.http
    errorfile 500 /etc/haproxy/errors/500.http
    errorfile 502 /etc/haproxy/errors/502.http
    errorfile 503 /etc/haproxy/errors/503.http
    errorfile 504 /etc/haproxy/errors/504.http

#---------------------------------------------------------------------
# Stats and Admin
#---------------------------------------------------------------------
frontend stats
    bind *:8404
    mode http
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if LOCALHOST
    stats auth admin:secure_password
    http-request use-service prometheus-exporter if { path /metrics }

#---------------------------------------------------------------------
# HTTP Frontend
#---------------------------------------------------------------------
frontend http_front
    bind *:80
    mode http

    # Redirect HTTP to HTTPS
    http-request redirect scheme https code 301 unless { ssl_fc }

    # ACLs for routing
    acl is_api path_beg /api
    acl is_static path_beg /static /assets /images

    # Use backends based on ACLs
    use_backend api_backend if is_api
    use_backend static_backend if is_static
    default_backend web_backend

#---------------------------------------------------------------------
# HTTPS Frontend
#---------------------------------------------------------------------
frontend https_front
    bind *:443 ssl crt /etc/haproxy/certs/ alpn h2,http/1.1
    mode http

    # HTTP/2 support
    http-request set-header X-Forwarded-Proto https
    http-request set-header X-Forwarded-Port 443
    http-request set-header X-Real-IP %[src]

    # Security headers
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    http-response set-header X-Content-Type-Options nosniff
    http-response set-header X-Frame-Options DENY
    http-response set-header X-XSS-Protection "1; mode=block"

    # Compression
    compression algo gzip
    compression type text/html text/plain text/css application/javascript application/json

    # ACLs
    acl is_api path_beg /api
    acl is_websocket hdr(Upgrade) -i websocket
    acl is_grpc hdr(Content-Type) -m beg application/grpc

    # Host-based routing
    acl is_app1 hdr(host) -i app1.example.com
    acl is_app2 hdr(host) -i app2.example.com

    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 100 }

    # Use backends
    use_backend websocket_backend if is_websocket
    use_backend grpc_backend if is_grpc
    use_backend api_backend if is_api
    use_backend app1_backend if is_app1
    use_backend app2_backend if is_app2
    default_backend web_backend

#---------------------------------------------------------------------
# Web Backend
#---------------------------------------------------------------------
backend web_backend
    mode http
    balance roundrobin
    option httpchk GET /health HTTP/1.1\r\nHost:\ localhost

    # Cookie-based session persistence
    cookie SERVERID insert indirect nocache

    # Health check settings
    default-server inter 3s fall 3 rise 2

    # Servers
    server web1 10.0.1.10:3000 check cookie web1 weight 100
    server web2 10.0.1.11:3000 check cookie web2 weight 100
    server web3 10.0.1.12:3000 check cookie web3 weight 100

#---------------------------------------------------------------------
# API Backend
#---------------------------------------------------------------------
backend api_backend
    mode http
    balance leastconn
    option httpchk GET /api/health HTTP/1.1\r\nHost:\ localhost

    # Timeouts for API
    timeout server 60s
    timeout connect 10s

    # Retry on connection failure
    option redispatch
    retries 3

    # Circuit breaker pattern
    default-server inter 2s fall 3 rise 2 slowstart 60s

    # Servers with different weights
    server api1 10.0.2.10:8080 check weight 100 maxconn 1000
    server api2 10.0.2.11:8080 check weight 100 maxconn 1000
    server api3 10.0.2.12:8080 check weight 50 maxconn 500 backup

#---------------------------------------------------------------------
# WebSocket Backend
#---------------------------------------------------------------------
backend websocket_backend
    mode http
    balance source
    option http-server-close
    option forwardfor

    timeout tunnel 3600s
    timeout server 3600s

    server ws1 10.0.3.10:8080 check
    server ws2 10.0.3.11:8080 check

#---------------------------------------------------------------------
# gRPC Backend
#---------------------------------------------------------------------
backend grpc_backend
    mode http
    balance roundrobin

    # gRPC requires HTTP/2
    option httpchk
    http-check connect proto h2
    http-check send meth POST uri /grpc.health.v1.Health/Check
    http-check expect status 200

    timeout server 120s

    server grpc1 10.0.4.10:9000 check proto h2
    server grpc2 10.0.4.11:9000 check proto h2

#---------------------------------------------------------------------
# Static Content Backend
#---------------------------------------------------------------------
backend static_backend
    mode http
    balance roundrobin
    option httpchk HEAD /health HTTP/1.1\r\nHost:\ localhost

    # Cache control
    http-response set-header Cache-Control "public, max-age=31536000"

    server static1 10.0.5.10:80 check
    server static2 10.0.5.11:80 check
```

## Layer 4 (TCP) Load Balancing

```haproxy
#---------------------------------------------------------------------
# TCP Frontend for Database
#---------------------------------------------------------------------
frontend tcp_postgres
    bind *:5432
    mode tcp
    option tcplog

    # TCP health check
    option tcp-check

    default_backend postgres_backend

backend postgres_backend
    mode tcp
    balance roundrobin
    option tcp-check

    # PostgreSQL protocol check
    tcp-check connect
    tcp-check send-binary 00000028 # Startup message length
    tcp-check send-binary 00030000 # Protocol version 3.0
    tcp-check send-binary 7573657200 # "user\0"
    tcp-check send-binary 68617075736572 # "haproxy"
    tcp-check send-binary 00 # null terminator
    tcp-check send-binary 00 # end of startup
    tcp-check expect binary 52 # 'R' for AuthenticationRequest

    server postgres-primary 10.0.6.10:5432 check inter 3s fall 3 rise 2
    server postgres-standby1 10.0.6.11:5432 check inter 3s fall 3 rise 2 backup
    server postgres-standby2 10.0.6.12:5432 check inter 3s fall 3 rise 2 backup

#---------------------------------------------------------------------
# TCP Frontend for Redis
#---------------------------------------------------------------------
frontend tcp_redis
    bind *:6379
    mode tcp
    option tcplog

    default_backend redis_backend

backend redis_backend
    mode tcp
    balance first
    option tcp-check

    # Redis PING check
    tcp-check connect
    tcp-check send PING\r\n
    tcp-check expect string +PONG

    server redis-master 10.0.7.10:6379 check inter 1s fall 2 rise 1
    server redis-replica1 10.0.7.11:6379 check inter 1s fall 2 rise 1 backup
    server redis-replica2 10.0.7.12:6379 check inter 1s fall 2 rise 1 backup

#---------------------------------------------------------------------
# MySQL Frontend with Read/Write Split
#---------------------------------------------------------------------
frontend tcp_mysql_write
    bind *:3306
    mode tcp
    default_backend mysql_write_backend

frontend tcp_mysql_read
    bind *:3307
    mode tcp
    default_backend mysql_read_backend

backend mysql_write_backend
    mode tcp
    option mysql-check user haproxy
    server mysql-master 10.0.8.10:3306 check inter 3s fall 3 rise 2

backend mysql_read_backend
    mode tcp
    balance roundrobin
    option mysql-check user haproxy
    server mysql-replica1 10.0.8.11:3306 check inter 3s fall 3 rise 2
    server mysql-replica2 10.0.8.12:3306 check inter 3s fall 3 rise 2
    server mysql-master 10.0.8.10:3306 check inter 3s fall 3 rise 2 backup
```

## SSL/TLS Configuration

```haproxy
#---------------------------------------------------------------------
# SSL Termination
#---------------------------------------------------------------------
frontend https_terminate
    bind *:443 ssl crt /etc/haproxy/certs/combined.pem alpn h2,http/1.1

    # OCSP stapling
    bind *:443 ssl crt /etc/haproxy/certs/combined.pem crt-list /etc/haproxy/crt-list.txt

    # Client certificate authentication
    # bind *:443 ssl crt /etc/haproxy/certs/server.pem ca-file /etc/haproxy/certs/ca.pem verify required

    http-request set-header X-SSL-Client-CN %{+Q}[ssl_c_s_dn(cn)]
    http-request set-header X-SSL-Client-Verify %[ssl_c_verify]

    default_backend web_backend

#---------------------------------------------------------------------
# SSL Passthrough
#---------------------------------------------------------------------
frontend tcp_ssl_passthrough
    bind *:8443
    mode tcp
    option tcplog

    # SNI-based routing
    tcp-request inspect-delay 5s
    tcp-request content accept if { req_ssl_hello_type 1 }

    acl is_api req_ssl_sni -i api.example.com
    acl is_web req_ssl_sni -i www.example.com

    use_backend api_ssl_backend if is_api
    use_backend web_ssl_backend if is_web
    default_backend web_ssl_backend

backend api_ssl_backend
    mode tcp
    server api1 10.0.2.10:443 check

backend web_ssl_backend
    mode tcp
    server web1 10.0.1.10:443 check

#---------------------------------------------------------------------
# Certificate List File
#---------------------------------------------------------------------
# /etc/haproxy/crt-list.txt
# /etc/haproxy/certs/example.com.pem [alpn h2,http/1.1] example.com www.example.com
# /etc/haproxy/certs/api.example.com.pem [alpn h2,http/1.1] api.example.com
```

## Rate Limiting and Security

```haproxy
#---------------------------------------------------------------------
# Rate Limiting Configuration
#---------------------------------------------------------------------
frontend rate_limited_frontend
    bind *:80
    mode http

    # Stick tables for rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s),conn_cur,bytes_in_rate(60s)
    stick-table type string len 64 size 100k expire 1m store http_req_rate(1m) peers mycluster

    # Track by source IP
    http-request track-sc0 src

    # Track by API key
    http-request track-sc1 hdr(X-API-Key) table api_keys if { hdr(X-API-Key) -m found }

    # Rate limit by IP: 100 requests/10s
    acl rate_limit_exceeded sc_http_req_rate(0) gt 100
    http-request deny deny_status 429 if rate_limit_exceeded

    # Rate limit by API key: 1000 requests/minute
    stick-table name api_keys type string len 64 size 100k expire 1m store http_req_rate(1m)
    acl api_rate_limit_exceeded sc_http_req_rate(1) gt 1000
    http-request deny deny_status 429 if api_rate_limit_exceeded

    # Connection rate limit
    acl too_many_connections sc_conn_cur(0) gt 20
    http-request deny deny_status 503 if too_many_connections

    # Bandwidth limit: 10MB/minute per IP
    acl bandwidth_exceeded sc_bytes_in_rate(0) gt 10485760
    http-request deny deny_status 509 if bandwidth_exceeded

    default_backend web_backend

#---------------------------------------------------------------------
# DDoS Protection
#---------------------------------------------------------------------
frontend ddos_protected
    bind *:80
    mode http

    # Track concurrent connections
    stick-table type ip size 1m expire 10s store conn_cur,http_req_rate(10s),http_err_rate(10s)
    http-request track-sc0 src

    # Block IPs with too many concurrent connections
    http-request deny deny_status 429 if { sc_conn_cur(0) gt 100 }

    # Block IPs with too many requests
    http-request deny deny_status 429 if { sc_http_req_rate(0) gt 1000 }

    # Block IPs with high error rates
    http-request deny deny_status 403 if { sc_http_err_rate(0) gt 100 }

    # Tarpit suspicious requests
    http-request tarpit if { sc_http_req_rate(0) gt 500 }

    # Block known bad user agents
    acl bad_bot hdr_sub(User-Agent) -i bot crawler spider
    http-request deny if bad_bot

    # Block requests without user agent
    acl no_user_agent hdr_cnt(User-Agent) eq 0
    http-request deny if no_user_agent

    default_backend web_backend

#---------------------------------------------------------------------
# WAF-like Rules
#---------------------------------------------------------------------
frontend waf_frontend
    bind *:443 ssl crt /etc/haproxy/certs/
    mode http

    # SQL injection patterns
    acl sql_injection url_dec,url_sub -i select insert update delete union drop
    acl sql_injection path_sub -i %27 %22 -- ;
    http-request deny if sql_injection

    # XSS patterns
    acl xss_attack url_dec,url_sub -i <script javascript: onerror onload
    http-request deny if xss_attack

    # Path traversal
    acl path_traversal path_sub -i ../ %2e%2e%2f
    http-request deny if path_traversal

    # Block sensitive files
    acl sensitive_files path_end -i .env .git .htaccess .htpasswd
    http-request deny if sensitive_files

    # Block HTTP methods
    acl valid_method method GET HEAD POST PUT DELETE OPTIONS
    http-request deny if !valid_method

    default_backend web_backend
```

## High Availability Configuration

```haproxy
#---------------------------------------------------------------------
# Peers Configuration for HA
#---------------------------------------------------------------------
peers mycluster
    peer haproxy1 10.0.0.10:1024
    peer haproxy2 10.0.0.11:1024
    peer haproxy3 10.0.0.12:1024

#---------------------------------------------------------------------
# Shared Stick Tables
#---------------------------------------------------------------------
backend stick_tables
    stick-table type ip size 100k expire 30s store http_req_rate(10s) peers mycluster

#---------------------------------------------------------------------
# Keepalived Configuration
#---------------------------------------------------------------------
# /etc/keepalived/keepalived.conf
# vrrp_script chk_haproxy {
#     script "/usr/bin/killall -0 haproxy"
#     interval 2
#     weight 2
# }
#
# vrrp_instance VI_1 {
#     state MASTER
#     interface eth0
#     virtual_router_id 51
#     priority 101
#     advert_int 1
#     authentication {
#         auth_type PASS
#         auth_pass secret
#     }
#     virtual_ipaddress {
#         10.0.0.100/24
#     }
#     track_script {
#         chk_haproxy
#     }
# }
```

## Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  haproxy:
    image: haproxy:2.9-alpine
    container_name: haproxy
    ports:
      - "80:80"
      - "443:443"
      - "8404:8404"
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
      - ./certs:/etc/haproxy/certs:ro
      - ./errors:/etc/haproxy/errors:ro
    networks:
      - frontend
      - backend
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "haproxy", "-c", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

## Kubernetes Deployment

```yaml
# haproxy-kubernetes.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: haproxy-config
  namespace: production
data:
  haproxy.cfg: |
    global
        log stdout format raw local0
        maxconn 50000
        nbthread 4

    defaults
        log global
        mode http
        option httplog
        option dontlognull
        timeout connect 5s
        timeout client 30s
        timeout server 30s

    frontend http
        bind *:80
        default_backend web

    backend web
        balance roundrobin
        option httpchk GET /health
        server-template web 10 web-service.production.svc.cluster.local:8080 check resolvers dns init-addr none

    resolvers dns
        nameserver coredns 10.96.0.10:53
        resolve_retries 3
        timeout resolve 1s
        timeout retry 1s
        hold valid 10s
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: haproxy
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: haproxy
  template:
    metadata:
      labels:
        app: haproxy
    spec:
      containers:
        - name: haproxy
          image: haproxy:2.9-alpine
          ports:
            - containerPort: 80
            - containerPort: 443
            - containerPort: 8404
          volumeMounts:
            - name: config
              mountPath: /usr/local/etc/haproxy/haproxy.cfg
              subPath: haproxy.cfg
            - name: certs
              mountPath: /etc/haproxy/certs
              readOnly: true
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /stats
              port: 8404
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /stats
              port: 8404
            initialDelaySeconds: 5
            periodSeconds: 10
      volumes:
        - name: config
          configMap:
            name: haproxy-config
        - name: certs
          secret:
            secretName: haproxy-tls
---
apiVersion: v1
kind: Service
metadata:
  name: haproxy
  namespace: production
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer
  selector:
    app: haproxy
  ports:
    - name: http
      port: 80
      targetPort: 80
    - name: https
      port: 443
      targetPort: 443
```

## CLAUDE.md Integration

```markdown
# HAProxy Configuration

## Commands
- `haproxy -c -f /etc/haproxy/haproxy.cfg` - Validate config
- `haproxy -f haproxy.cfg -sf $(cat /var/run/haproxy.pid)` - Reload
- `echo "show stat" | socat stdio /run/haproxy/admin.sock` - Show stats
- `echo "disable server backend/server1" | socat stdio /run/haproxy/admin.sock` - Disable server

## Key Sections
- `global` - Process-wide settings
- `defaults` - Default values for all sections
- `frontend` - Client-facing listeners
- `backend` - Server pools
- `listen` - Combined frontend/backend

## Load Balancing Algorithms
- `roundrobin` - Round robin (default)
- `leastconn` - Least connections
- `source` - Source IP hash
- `first` - First available server
- `uri` - URI hash

## Health Checks
- `option httpchk` - HTTP health check
- `option tcp-check` - TCP health check
- `option mysql-check` - MySQL protocol check
```

## AI Suggestions

1. **Add Data Plane API** - Dynamic configuration updates
2. **Implement connection pooling** - Optimize upstream connections
3. **Configure PROXY protocol** - Preserve client IP through LB
4. **Add request mirroring** - Shadow traffic for testing
5. **Implement blue-green routing** - Traffic switching patterns
6. **Configure Lua scripting** - Custom request processing
7. **Add metrics export** - Prometheus/Datadog integration
8. **Implement caching** - Response caching layer
9. **Configure compression** - Reduce bandwidth usage
10. **Add mutual TLS** - Client certificate authentication
