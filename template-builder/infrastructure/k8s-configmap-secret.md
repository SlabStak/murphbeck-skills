# Kubernetes ConfigMap & Secret Template

> Production-ready ConfigMap and Secret configurations for application configuration management

## Overview

This template provides ConfigMap and Secret configurations with:
- Environment-specific configurations
- Volume mounts and environment variables
- External secret management integration
- Sealed Secrets for GitOps
- Dynamic reloading patterns

## Quick Start

```bash
# Create ConfigMap from file
kubectl create configmap my-config --from-file=config.yaml

# Create Secret from literals
kubectl create secret generic my-secret --from-literal=password=secret123

# View ConfigMaps
kubectl get configmaps

# Decode Secret
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d
```

## ConfigMap Configurations

```yaml
# Basic ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
    app.kubernetes.io/component: config
data:
  # Simple key-value pairs
  LOG_LEVEL: "info"
  CACHE_TTL: "3600"
  MAX_CONNECTIONS: "100"

  # Multi-line configuration file
  config.yaml: |
    server:
      host: 0.0.0.0
      port: 8080
      timeout: 30s

    database:
      pool_size: 10
      idle_timeout: 5m

    cache:
      enabled: true
      ttl: 1h

    logging:
      level: info
      format: json
      output: stdout

  # JSON configuration
  settings.json: |
    {
      "features": {
        "darkMode": true,
        "analytics": true,
        "betaFeatures": false
      },
      "limits": {
        "maxUploadSize": 10485760,
        "rateLimitPerMinute": 100
      }
    }

  # Properties file
  application.properties: |
    spring.datasource.url=jdbc:postgresql://postgres:5432/myapp
    spring.datasource.pool-size=10
    spring.cache.type=redis
    spring.redis.host=redis
    spring.redis.port=6379
---
# ConfigMap from multiple sources
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: production
data:
  nginx.conf: |
    worker_processes auto;
    error_log /var/log/nginx/error.log warn;
    pid /var/run/nginx.pid;

    events {
        worker_connections 1024;
        use epoll;
        multi_accept on;
    }

    http {
        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        log_format json escape=json '{'
            '"time":"$time_iso8601",'
            '"remote_addr":"$remote_addr",'
            '"request":"$request",'
            '"status":$status,'
            '"body_bytes_sent":$body_bytes_sent,'
            '"request_time":$request_time,'
            '"upstream_response_time":"$upstream_response_time"'
        '}';

        access_log /var/log/nginx/access.log json;

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;

        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css application/json application/javascript;

        include /etc/nginx/conf.d/*.conf;
    }

  default.conf: |
    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            return 200 'healthy';
            add_header Content-Type text/plain;
        }
    }
```

## Secret Configurations

```yaml
# Opaque Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
  labels:
    app.kubernetes.io/name: my-app
type: Opaque
stringData:  # Plain text (encoded automatically)
  DATABASE_URL: "postgresql://user:password@postgres:5432/myapp"
  REDIS_URL: "redis://:password@redis:6379"
  API_KEY: "sk-1234567890abcdef"
  JWT_SECRET: "your-256-bit-secret-key-here"
---
# Docker registry credentials
apiVersion: v1
kind: Secret
metadata:
  name: registry-credentials
  namespace: production
type: kubernetes.io/dockerconfigjson
data:
  # Generated with: kubectl create secret docker-registry ... --dry-run=client -o yaml
  .dockerconfigjson: eyJhdXRocyI6eyJyZWdpc3RyeS5leGFtcGxlLmNvbSI6eyJ1c2VybmFtZSI6InVzZXIiLCJwYXNzd29yZCI6InBhc3N3b3JkIiwiYXV0aCI6ImRYTmxjanB3WVhOemQyOXlaQT09In19fQ==
---
# TLS Secret
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: production
type: kubernetes.io/tls
data:
  tls.crt: |
    LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0t...
  tls.key: |
    LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...
---
# SSH Key Secret
apiVersion: v1
kind: Secret
metadata:
  name: ssh-key
  namespace: production
type: kubernetes.io/ssh-auth
data:
  ssh-privatekey: |
    LS0tLS1CRUdJTiBPUEVOU1NIIFBSSVZBVEU...
---
# Basic Auth Secret
apiVersion: v1
kind: Secret
metadata:
  name: basic-auth
  namespace: production
type: kubernetes.io/basic-auth
stringData:
  username: admin
  password: supersecret
```

## Using ConfigMaps and Secrets in Pods

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
      annotations:
        # Force rollout on config change
        checksum/config: "{{ include (print $.Template.BasePath \"/configmap.yaml\") . | sha256sum }}"
        checksum/secret: "{{ include (print $.Template.BasePath \"/secret.yaml\") . | sha256sum }}"
    spec:
      containers:
        - name: app
          image: my-app:latest

          # Environment from ConfigMap
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets

          # Individual environment variables
          env:
            # From ConfigMap key
            - name: LOG_LEVEL
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: LOG_LEVEL

            # From Secret key
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: DATABASE_URL

            # From field reference
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name

            # From resource field
            - name: MEMORY_LIMIT
              valueFrom:
                resourceFieldRef:
                  containerName: app
                  resource: limits.memory

          volumeMounts:
            # Mount entire ConfigMap as directory
            - name: config-volume
              mountPath: /etc/app/config
              readOnly: true

            # Mount specific ConfigMap key as file
            - name: nginx-config
              mountPath: /etc/nginx/nginx.conf
              subPath: nginx.conf
              readOnly: true

            # Mount Secret as files
            - name: secrets-volume
              mountPath: /etc/app/secrets
              readOnly: true

            # Mount TLS certificates
            - name: tls-certs
              mountPath: /etc/ssl/certs/app
              readOnly: true

      volumes:
        - name: config-volume
          configMap:
            name: app-config
            # Optional: set file permissions
            defaultMode: 0644
            # Optional: select specific keys
            items:
              - key: config.yaml
                path: config.yaml
              - key: settings.json
                path: settings.json

        - name: nginx-config
          configMap:
            name: nginx-config

        - name: secrets-volume
          secret:
            secretName: app-secrets
            defaultMode: 0400

        - name: tls-certs
          secret:
            secretName: tls-secret

      # Image pull secrets
      imagePullSecrets:
        - name: registry-credentials
```

## External Secrets Operator

```yaml
# SecretStore for AWS Secrets Manager
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
# SecretStore for HashiCorp Vault
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: production
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "my-app"
          serviceAccountRef:
            name: my-app-sa
---
# ExternalSecret - pulls from external store
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
    template:
      type: Opaque
      data:
        DATABASE_URL: "postgresql://{{ .db_user }}:{{ .db_password }}@postgres:5432/myapp"
  data:
    - secretKey: db_user
      remoteRef:
        key: production/database
        property: username
    - secretKey: db_password
      remoteRef:
        key: production/database
        property: password
    - secretKey: api_key
      remoteRef:
        key: production/api-keys
        property: main
---
# ClusterSecretStore for cluster-wide access
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: global-secrets
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
            namespace: external-secrets
```

## Sealed Secrets for GitOps

```yaml
# Install Sealed Secrets controller
# helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system

# Create SealedSecret (encrypted)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: app-secrets
  namespace: production
spec:
  encryptedData:
    # Encrypted with: kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
    DATABASE_URL: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...
    API_KEY: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEq...
  template:
    metadata:
      name: app-secrets
      namespace: production
    type: Opaque
```

## Config Reloader (Stakater)

```yaml
# Deployment with reloader annotation
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  namespace: production
  annotations:
    # Auto-reload on ConfigMap change
    configmap.reloader.stakater.com/reload: "app-config,nginx-config"
    # Auto-reload on Secret change
    secret.reloader.stakater.com/reload: "app-secrets"
spec:
  template:
    spec:
      containers:
        - name: app
          image: my-app:latest
          envFrom:
            - configMapRef:
                name: app-config
```

## Kustomize ConfigMap Generator

```yaml
# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

configMapGenerator:
  - name: app-config
    namespace: production
    files:
      - config.yaml
      - settings.json
    literals:
      - LOG_LEVEL=info
      - CACHE_TTL=3600
    options:
      disableNameSuffixHash: false

secretGenerator:
  - name: app-secrets
    namespace: production
    files:
      - tls.crt
      - tls.key
    literals:
      - DATABASE_URL=postgresql://user:pass@host/db
    type: Opaque
    options:
      disableNameSuffixHash: false

generatorOptions:
  labels:
    app.kubernetes.io/managed-by: kustomize
```

## Immutable ConfigMaps and Secrets

```yaml
# Immutable ConfigMap (Kubernetes 1.21+)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config-v1
  namespace: production
immutable: true
data:
  LOG_LEVEL: "info"
  config.yaml: |
    server:
      port: 8080
---
# Immutable Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets-v1
  namespace: production
immutable: true
type: Opaque
stringData:
  API_KEY: "sk-1234567890"
```

## CLAUDE.md Integration

```markdown
# Kubernetes ConfigMaps & Secrets

## Commands
- `kubectl create configmap name --from-file=file.yaml` - From file
- `kubectl create secret generic name --from-literal=key=value` - From literal
- `kubectl get cm,secrets` - List both
- `kubectl get secret name -o jsonpath='{.data.key}' | base64 -d` - Decode secret

## Best Practices
- Use Secrets for sensitive data (auto base64 encoded)
- Use ConfigMaps for non-sensitive configuration
- Use `stringData` for plain text secrets (auto-encoded)
- Enable immutable for production configs
- Use external secret management in production

## Mounting
- `envFrom` - Load all keys as env vars
- `env.valueFrom` - Load specific key as env var
- `volumeMounts` - Mount as files

## Reloading
- Config changes don't auto-reload pods
- Use Reloader controller for auto-reload
- Or use checksum annotations in Helm
```

## AI Suggestions

1. **Add Mozilla SOPS** - Implement encrypted secrets in Git
2. **Configure Vault Agent** - Auto-inject secrets via sidecar
3. **Implement secret rotation** - Automatic credential rotation
4. **Add ConfigMap validation** - Validate configs before apply
5. **Configure RBAC** - Restrict secret access by namespace
6. **Implement audit logging** - Track secret access
7. **Add backup strategy** - Backup secrets to secure storage
8. **Configure encryption at rest** - Enable etcd encryption
9. **Implement versioning** - Track config versions
10. **Add drift detection** - Alert on manual config changes
