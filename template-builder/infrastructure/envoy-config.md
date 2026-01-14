# Envoy Proxy Configuration Template

> Production-ready Envoy configurations for service mesh, API gateway, and edge proxy deployments

## Overview

This template provides Envoy configurations with:
- Service mesh sidecar proxy
- API gateway patterns
- Load balancing and circuit breaking
- Rate limiting and authentication
- Observability integration

## Quick Start

```bash
# Run Envoy with config
envoy -c envoy.yaml

# Validate configuration
envoy --mode validate -c envoy.yaml

# Hot restart
envoy -c envoy.yaml --restart-epoch 1

# Check admin interface
curl http://localhost:9901/stats
```

## Basic Configuration

```yaml
# envoy.yaml
admin:
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

static_resources:
  listeners:
    - name: listener_http
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                access_log:
                  - name: envoy.access_loggers.stdout
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.access_loggers.stream.v3.StdoutAccessLog
                      log_format:
                        json_format:
                          time: "%START_TIME%"
                          protocol: "%PROTOCOL%"
                          method: "%REQ(:METHOD)%"
                          path: "%REQ(X-ENVOY-ORIGINAL-PATH?:PATH)%"
                          response_code: "%RESPONSE_CODE%"
                          response_flags: "%RESPONSE_FLAGS%"
                          duration: "%DURATION%"
                          upstream_host: "%UPSTREAM_HOST%"
                          request_id: "%REQ(X-REQUEST-ID)%"
                http_filters:
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: backend
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/api"
                          route:
                            cluster: api_cluster
                        - match:
                            prefix: "/"
                          route:
                            cluster: web_cluster

  clusters:
    - name: api_cluster
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: api_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: api-service
                      port_value: 8080

    - name: web_cluster
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: web_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: web-service
                      port_value: 3000
```

## Advanced Cluster Configuration

```yaml
static_resources:
  clusters:
    - name: api_cluster
      type: STRICT_DNS
      connect_timeout: 5s
      lb_policy: LEAST_REQUEST

      # Circuit breaker
      circuit_breakers:
        thresholds:
          - priority: DEFAULT
            max_connections: 1000
            max_pending_requests: 1000
            max_requests: 1000
            max_retries: 3
          - priority: HIGH
            max_connections: 2000
            max_pending_requests: 2000
            max_requests: 2000
            max_retries: 5

      # Outlier detection
      outlier_detection:
        consecutive_5xx: 5
        interval: 30s
        base_ejection_time: 30s
        max_ejection_percent: 50
        consecutive_gateway_failure: 5

      # Health checks
      health_checks:
        - timeout: 5s
          interval: 10s
          unhealthy_threshold: 3
          healthy_threshold: 2
          http_health_check:
            path: /health
            expected_statuses:
              - start: 200
                end: 299

      # HTTP/2 configuration
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options:
              max_concurrent_streams: 100
              initial_stream_window_size: 65536
              initial_connection_window_size: 1048576

      # TLS configuration
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          common_tls_context:
            tls_certificates:
              - certificate_chain:
                  filename: /etc/envoy/certs/client.crt
                private_key:
                  filename: /etc/envoy/certs/client.key
            validation_context:
              trusted_ca:
                filename: /etc/envoy/certs/ca.crt

      load_assignment:
        cluster_name: api_cluster
        endpoints:
          - locality:
              region: us-east-1
              zone: us-east-1a
            priority: 0
            lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: api-1.example.com
                      port_value: 8080
                  health_check_config:
                    port_value: 8080
                load_balancing_weight: 100
          - locality:
              region: us-east-1
              zone: us-east-1b
            priority: 0
            lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: api-2.example.com
                      port_value: 8080
                load_balancing_weight: 100
```

## Rate Limiting

```yaml
static_resources:
  listeners:
    - name: listener_http
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                http_filters:
                  # Local rate limiting
                  - name: envoy.filters.http.local_ratelimit
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
                      stat_prefix: http_local_rate_limiter
                      token_bucket:
                        max_tokens: 1000
                        tokens_per_fill: 100
                        fill_interval: 1s
                      filter_enabled:
                        runtime_key: local_rate_limit_enabled
                        default_value:
                          numerator: 100
                          denominator: HUNDRED
                      filter_enforced:
                        runtime_key: local_rate_limit_enforced
                        default_value:
                          numerator: 100
                          denominator: HUNDRED
                      response_headers_to_add:
                        - append_action: OVERWRITE_IF_EXISTS_OR_ADD
                          header:
                            key: x-local-rate-limit
                            value: "true"

                  # Global rate limiting (requires ratelimit service)
                  - name: envoy.filters.http.ratelimit
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit
                      domain: api_ratelimit
                      failure_mode_deny: false
                      enable_x_ratelimit_headers: DRAFT_VERSION_03
                      rate_limit_service:
                        grpc_service:
                          envoy_grpc:
                            cluster_name: rate_limit_cluster
                        transport_api_version: V3

                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: api
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/api"
                          route:
                            cluster: api_cluster
                            rate_limits:
                              - actions:
                                  - request_headers:
                                      header_name: x-api-key
                                      descriptor_key: api_key
                              - actions:
                                  - remote_address: {}
```

## JWT Authentication

```yaml
static_resources:
  listeners:
    - name: listener_http
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: ingress_http
                http_filters:
                  - name: envoy.filters.http.jwt_authn
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication
                      providers:
                        auth0:
                          issuer: https://your-tenant.auth0.com/
                          audiences:
                            - your-api-audience
                          remote_jwks:
                            http_uri:
                              uri: https://your-tenant.auth0.com/.well-known/jwks.json
                              cluster: auth0_jwks
                              timeout: 5s
                            cache_duration:
                              seconds: 300
                          forward_payload_header: x-jwt-payload
                          claim_to_headers:
                            - claim_name: sub
                              header_name: x-user-id
                            - claim_name: email
                              header_name: x-user-email
                      rules:
                        - match:
                            prefix: /api/public
                        - match:
                            prefix: /api
                          requires:
                            provider_name: auth0

                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router

                route_config:
                  name: local_route
                  virtual_hosts:
                    - name: api
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                          route:
                            cluster: api_cluster

  clusters:
    - name: auth0_jwks
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: auth0_jwks
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: your-tenant.auth0.com
                      port_value: 443
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
          sni: your-tenant.auth0.com
```

## gRPC Configuration

```yaml
static_resources:
  listeners:
    - name: grpc_listener
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 9000
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
                stat_prefix: grpc_ingress
                codec_type: AUTO
                http2_protocol_options:
                  max_concurrent_streams: 100
                  initial_stream_window_size: 65536
                  initial_connection_window_size: 1048576
                http_filters:
                  - name: envoy.filters.http.grpc_web
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.grpc_web.v3.GrpcWeb
                  - name: envoy.filters.http.router
                    typed_config:
                      "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
                route_config:
                  name: grpc_route
                  virtual_hosts:
                    - name: grpc_service
                      domains: ["*"]
                      routes:
                        - match:
                            prefix: "/"
                            grpc: {}
                          route:
                            cluster: grpc_cluster
                            timeout: 60s
                            retry_policy:
                              retry_on: "unavailable,resource-exhausted"
                              num_retries: 3
                              per_try_timeout: 10s

  clusters:
    - name: grpc_cluster
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      typed_extension_protocol_options:
        envoy.extensions.upstreams.http.v3.HttpProtocolOptions:
          "@type": type.googleapis.com/envoy.extensions.upstreams.http.v3.HttpProtocolOptions
          explicit_http_config:
            http2_protocol_options: {}
      load_assignment:
        cluster_name: grpc_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: grpc-service
                      port_value: 9000
```

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: envoy-gateway
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: envoy-gateway
  template:
    metadata:
      labels:
        app: envoy-gateway
    spec:
      containers:
        - name: envoy
          image: envoyproxy/envoy:v1.28-latest
          ports:
            - name: http
              containerPort: 8080
            - name: admin
              containerPort: 9901
          args:
            - -c
            - /etc/envoy/envoy.yaml
            - --service-cluster
            - envoy-gateway
            - --service-node
            - $(POD_NAME)
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          volumeMounts:
            - name: config
              mountPath: /etc/envoy
              readOnly: true
          livenessProbe:
            httpGet:
              path: /ready
              port: admin
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: admin
            initialDelaySeconds: 5
            periodSeconds: 10
      volumes:
        - name: config
          configMap:
            name: envoy-config
```

## CLAUDE.md Integration

```markdown
# Envoy Proxy Configuration

## Commands
- `envoy -c envoy.yaml` - Run Envoy
- `envoy --mode validate -c envoy.yaml` - Validate config
- `curl localhost:9901/stats` - View stats
- `curl localhost:9901/config_dump` - Dump config

## Key Concepts
- **Listeners**: Entry points for traffic
- **Clusters**: Upstream service groups
- **Routes**: Traffic routing rules
- **Filters**: Request/response processing

## Health Endpoints
- `/ready` - Readiness check
- `/stats` - Prometheus metrics
- `/config_dump` - Current configuration

## Load Balancing
- `ROUND_ROBIN` - Simple round robin
- `LEAST_REQUEST` - Least active requests
- `RING_HASH` - Consistent hashing
- `MAGLEV` - Consistent hashing variant
```

## AI Suggestions

1. **Add WASM filters** - Custom filter logic
2. **Implement ext_authz** - External authorization
3. **Configure fault injection** - Testing resilience
4. **Add request mirroring** - Shadow traffic
5. **Implement header manipulation** - Request/response headers
6. **Configure access logging** - Custom log formats
7. **Add tracing integration** - Jaeger/Zipkin
8. **Implement compression** - gzip/brotli
9. **Configure CORS** - Cross-origin requests
10. **Add WebSocket support** - Upgrade handling
