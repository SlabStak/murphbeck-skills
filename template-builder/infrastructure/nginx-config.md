# Nginx Configuration Template

> Production-ready Nginx configurations for reverse proxy, load balancing, and SSL termination

## Overview

This template provides comprehensive Nginx configurations with:
- Reverse proxy setup
- SSL/TLS termination with modern cipher suites
- Load balancing algorithms
- Rate limiting and security headers
- Gzip compression
- WebSocket support
- Caching configuration

## Quick Start

```bash
# Test configuration
nginx -t

# Reload configuration
nginx -s reload

# View logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Main Configuration (nginx.conf)

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

# Load dynamic modules
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Buffer Settings
    client_body_buffer_size 16K;
    client_header_buffer_size 1k;
    client_max_body_size 100M;
    large_client_header_buffers 4 8k;

    # Timeout Settings
    client_body_timeout 60;
    client_header_timeout 60;
    send_timeout 60;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"remote_user":"$remote_user",'
        '"request":"$request",'
        '"status":$status,'
        '"body_bytes_sent":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"http_referrer":"$http_referer",'
        '"http_user_agent":"$http_user_agent",'
        '"http_x_forwarded_for":"$http_x_forwarded_for",'
        '"upstream_addr":"$upstream_addr",'
        '"upstream_response_time":"$upstream_response_time"'
    '}';

    access_log /var/log/nginx/access.log json;
    error_log /var/log/nginx/error.log warn;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Brotli Compression (if module installed)
    # brotli on;
    # brotli_comp_level 6;
    # brotli_types text/plain text/css application/json application/javascript;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Rate Limiting Zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # Upstream Servers
    include /etc/nginx/conf.d/upstreams/*.conf;

    # Virtual Hosts
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}

# Stream configuration for TCP/UDP proxying
stream {
    include /etc/nginx/stream.d/*.conf;
}
```

## Reverse Proxy Configuration

```nginx
# /etc/nginx/conf.d/app.conf

# Upstream configuration
upstream api_servers {
    least_conn;
    keepalive 32;

    server api1.internal:3000 weight=5 max_fails=3 fail_timeout=30s;
    server api2.internal:3000 weight=5 max_fails=3 fail_timeout=30s;
    server api3.internal:3000 weight=5 max_fails=3 fail_timeout=30s backup;
}

upstream websocket_servers {
    ip_hash;

    server ws1.internal:8080;
    server ws2.internal:8080;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name example.com www.example.com;

    # SSL Certificates
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_trusted_certificate /etc/nginx/ssl/chain.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Root and index
    root /var/www/html;
    index index.html;

    # Logging
    access_log /var/log/nginx/example.com.access.log json;
    error_log /var/log/nginx/example.com.error.log warn;

    # Static files with caching
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API Proxy
    location /api/ {
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_conn conn 10;

        # Proxy settings
        proxy_pass http://api_servers/;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;

        # Connection settings
        proxy_set_header Connection "";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;

        # Error handling
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 30s;
    }

    # WebSocket Proxy
    location /ws/ {
        proxy_pass http://websocket_servers/;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Metrics endpoint (internal only)
    location /nginx_status {
        stub_status on;
        allow 10.0.0.0/8;
        allow 172.16.0.0/12;
        allow 192.168.0.0/16;
        deny all;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;

        # Cache HTML files for a short time
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate";
        }
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ ^/(README|LICENSE|CHANGELOG) {
        deny all;
    }
}
```

## Load Balancer Configuration

```nginx
# /etc/nginx/conf.d/upstreams/api.conf

# Round-robin (default)
upstream api_round_robin {
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

# Least connections
upstream api_least_conn {
    least_conn;
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

# IP Hash (sticky sessions)
upstream api_ip_hash {
    ip_hash;
    server api1:3000;
    server api2:3000;
    server api3:3000;
}

# Weighted
upstream api_weighted {
    server api1:3000 weight=5;
    server api2:3000 weight=3;
    server api3:3000 weight=2;
}

# With health checks (nginx plus) or passive checks
upstream api_with_health {
    zone api_zone 64k;

    server api1:3000 max_fails=3 fail_timeout=30s;
    server api2:3000 max_fails=3 fail_timeout=30s;
    server api3:3000 backup;

    keepalive 32;
}
```

## Caching Configuration

```nginx
# /etc/nginx/conf.d/cache.conf

# Define cache zones
proxy_cache_path /var/cache/nginx/api
    levels=1:2
    keys_zone=api_cache:10m
    max_size=1g
    inactive=60m
    use_temp_path=off;

proxy_cache_path /var/cache/nginx/static
    levels=1:2
    keys_zone=static_cache:100m
    max_size=10g
    inactive=7d
    use_temp_path=off;

# Cache settings for API
location /api/cached/ {
    proxy_pass http://api_servers/;

    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_valid 404 1m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 5s;

    proxy_cache_key $scheme$request_method$host$request_uri;

    add_header X-Cache-Status $upstream_cache_status;
}

# Cache bypass conditions
map $request_method $skip_cache {
    default 0;
    POST 1;
    PUT 1;
    DELETE 1;
    PATCH 1;
}

map $http_authorization $skip_cache_auth {
    default 1;
    "" 0;
}
```

## Docker Compose Example

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./html:/var/www/html:ro
      - nginx_cache:/var/cache/nginx
      - nginx_logs:/var/log/nginx
    depends_on:
      - api
    networks:
      - frontend
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3

  certbot:
    image: certbot/certbot
    volumes:
      - ./ssl:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  nginx_cache:
  nginx_logs:

networks:
  frontend:
  backend:
```

## CLAUDE.md Integration

```markdown
# Nginx Configuration

## Commands
- `nginx -t` - Test configuration
- `nginx -s reload` - Reload config
- `nginx -s stop` - Stop server
- `nginx -V` - Show version and modules

## Key Files
- `/etc/nginx/nginx.conf` - Main config
- `/etc/nginx/conf.d/` - Virtual hosts
- `/etc/nginx/sites-enabled/` - Enabled sites
- `/var/log/nginx/` - Log files

## Common Tasks
- **Add new site**: Create config in conf.d/
- **Enable SSL**: Add ssl_certificate directives
- **Add upstream**: Configure in upstreams/
- **Clear cache**: `rm -rf /var/cache/nginx/*`
```

## AI Suggestions

1. **Add OpenTelemetry** - Integrate ngx_http_opentelemetry_module for distributed tracing
2. **Implement ModSecurity** - Add WAF capabilities with ModSecurity rules
3. **Configure HTTP/3** - Enable QUIC protocol support
4. **Add GeoIP blocking** - Implement geographic access control
5. **Configure fail2ban** - Integrate with fail2ban for intrusion prevention
6. **Add request mirroring** - Mirror traffic for testing/debugging
7. **Implement canary routing** - Add weighted traffic splitting
8. **Configure dynamic upstreams** - Use Consul/etcd for service discovery
9. **Add request validation** - Implement JSON schema validation
10. **Configure mTLS** - Add mutual TLS for client authentication
