# HashiCorp Vault Configuration Template

> Production-ready Vault configurations for secrets management, encryption, and identity

## Overview

This template provides Vault configurations with:
- High availability deployment
- KV secrets engine
- Dynamic database credentials
- PKI certificate management
- Kubernetes authentication

## Quick Start

```bash
# Initialize Vault
vault operator init

# Unseal Vault
vault operator unseal

# Login
vault login

# Enable secrets engine
vault secrets enable -path=secret kv-v2

# Write secret
vault kv put secret/myapp/config username="admin" password="secret123"

# Read secret
vault kv get secret/myapp/config
```

## Vault Server Configuration

```hcl
# config.hcl
storage "raft" {
  path    = "/vault/data"
  node_id = "vault-1"

  retry_join {
    leader_api_addr = "https://vault-2:8200"
  }
  retry_join {
    leader_api_addr = "https://vault-3:8200"
  }
}

listener "tcp" {
  address         = "0.0.0.0:8200"
  cluster_address = "0.0.0.0:8201"

  tls_cert_file = "/vault/tls/tls.crt"
  tls_key_file  = "/vault/tls/tls.key"

  # TLS configuration
  tls_min_version = "tls12"
  tls_cipher_suites = "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"

  # Telemetry
  telemetry {
    unauthenticated_metrics_access = true
  }
}

api_addr     = "https://vault.example.com:8200"
cluster_addr = "https://vault-1:8201"
cluster_name = "vault-cluster"

ui = true

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}

# Audit logging
audit {
  type = "file"
  options = {
    file_path = "/vault/logs/audit.log"
  }
}

# Seal configuration (AWS KMS)
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/vault-unseal"
}

# Or GCP KMS
# seal "gcpckms" {
#   project    = "my-project"
#   region     = "global"
#   key_ring   = "vault-keyring"
#   crypto_key = "vault-key"
# }
```

## Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  vault:
    image: hashicorp/vault:1.15
    container_name: vault
    restart: unless-stopped
    ports:
      - "8200:8200"
    environment:
      VAULT_ADDR: "http://127.0.0.1:8200"
      VAULT_API_ADDR: "http://127.0.0.1:8200"
    cap_add:
      - IPC_LOCK
    volumes:
      - ./config:/vault/config:ro
      - vault-data:/vault/data
      - vault-logs:/vault/logs
    command: vault server -config=/vault/config/config.hcl
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  vault-data:
  vault-logs:
```

```hcl
# config/config.hcl (development)
storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true
}

ui = true
api_addr = "http://127.0.0.1:8200"
```

## Kubernetes Deployment (Helm)

```yaml
# values.yaml
global:
  enabled: true
  tlsDisable: false

injector:
  enabled: true
  replicas: 2
  resources:
    requests:
      memory: 256Mi
      cpu: 250m
    limits:
      memory: 256Mi
      cpu: 250m

server:
  image:
    repository: hashicorp/vault
    tag: 1.15.0

  resources:
    requests:
      memory: 256Mi
      cpu: 250m
    limits:
      memory: 512Mi
      cpu: 500m

  readinessProbe:
    enabled: true
    path: "/v1/sys/health?standbyok=true&sealedcode=204&uninitcode=204"

  livenessProbe:
    enabled: true
    path: "/v1/sys/health?standbyok=true"

  auditStorage:
    enabled: true
    size: 10Gi
    storageClass: fast-ssd

  dataStorage:
    enabled: true
    size: 10Gi
    storageClass: fast-ssd

  # High Availability
  ha:
    enabled: true
    replicas: 3
    raft:
      enabled: true
      setNodeId: true
      config: |
        ui = true

        listener "tcp" {
          tls_disable = 1
          address = "[::]:8200"
          cluster_address = "[::]:8201"
        }

        storage "raft" {
          path = "/vault/data"
        }

        service_registration "kubernetes" {}

  # TLS from cert-manager
  extraEnvironmentVars:
    VAULT_CACERT: /vault/userconfig/vault-tls/ca.crt

  extraVolumes:
    - type: secret
      name: vault-tls
      path: /vault/userconfig/vault-tls

  # Annotations for monitoring
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8200"
    prometheus.io/path: "/v1/sys/metrics"

ui:
  enabled: true
  serviceType: LoadBalancer
```

## Secrets Engines Configuration

```bash
#!/bin/bash
# setup-secrets-engines.sh

# Enable KV v2 secrets engine
vault secrets enable -path=secret kv-v2

# Enable database secrets engine
vault secrets enable database

# Configure PostgreSQL
vault write database/config/postgres \
    plugin_name=postgresql-database-plugin \
    allowed_roles="app-role" \
    connection_url="postgresql://{{username}}:{{password}}@postgres:5432/myapp?sslmode=disable" \
    username="vault" \
    password="vault-password"

# Create database role for application
vault write database/roles/app-role \
    db_name=postgres \
    creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
    default_ttl="1h" \
    max_ttl="24h"

# Enable PKI secrets engine
vault secrets enable pki

# Configure PKI
vault secrets tune -max-lease-ttl=87600h pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \
    common_name="example.com" \
    issuer_name="root-2024" \
    ttl=87600h > CA_cert.crt

# Configure URLs
vault write pki/config/urls \
    issuing_certificates="https://vault.example.com:8200/v1/pki/ca" \
    crl_distribution_points="https://vault.example.com:8200/v1/pki/crl"

# Enable intermediate PKI
vault secrets enable -path=pki_int pki
vault secrets tune -max-lease-ttl=43800h pki_int

# Create intermediate CA
vault write -format=json pki_int/intermediate/generate/internal \
    common_name="example.com Intermediate Authority" \
    issuer_name="example-intermediate" \
    | jq -r '.data.csr' > pki_intermediate.csr

# Sign intermediate with root
vault write -format=json pki/root/sign-intermediate \
    issuer_ref="root-2024" \
    csr=@pki_intermediate.csr \
    format=pem_bundle \
    ttl="43800h" \
    | jq -r '.data.certificate' > intermediate.cert.pem

# Set intermediate certificate
vault write pki_int/intermediate/set-signed certificate=@intermediate.cert.pem

# Create certificate role
vault write pki_int/roles/example-dot-com \
    allowed_domains="example.com" \
    allow_subdomains=true \
    max_ttl="720h"

# Enable transit secrets engine (encryption)
vault secrets enable transit

# Create encryption key
vault write -f transit/keys/myapp-key
```

## Authentication Methods

```bash
#!/bin/bash
# setup-auth.sh

# Enable Kubernetes auth
vault auth enable kubernetes

# Configure Kubernetes auth
vault write auth/kubernetes/config \
    kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443" \
    kubernetes_ca_cert=@/var/run/secrets/kubernetes.io/serviceaccount/ca.crt \
    token_reviewer_jwt=@/var/run/secrets/kubernetes.io/serviceaccount/token

# Create policy for app
vault policy write myapp-policy - <<EOF
path "secret/data/myapp/*" {
  capabilities = ["read"]
}

path "database/creds/app-role" {
  capabilities = ["read"]
}

path "pki_int/issue/example-dot-com" {
  capabilities = ["create", "update"]
}

path "transit/encrypt/myapp-key" {
  capabilities = ["update"]
}

path "transit/decrypt/myapp-key" {
  capabilities = ["update"]
}
EOF

# Create Kubernetes auth role
vault write auth/kubernetes/role/myapp \
    bound_service_account_names=myapp \
    bound_service_account_namespaces=production \
    policies=myapp-policy \
    ttl=1h

# Enable AppRole auth
vault auth enable approle

# Create AppRole
vault write auth/approle/role/myapp \
    token_policies="myapp-policy" \
    token_ttl=1h \
    token_max_ttl=4h \
    secret_id_ttl=10m \
    secret_id_num_uses=1

# Get role ID and secret ID
vault read auth/approle/role/myapp/role-id
vault write -f auth/approle/role/myapp/secret-id

# Enable OIDC auth (Azure AD, Okta, etc.)
vault auth enable oidc

vault write auth/oidc/config \
    oidc_discovery_url="https://login.microsoftonline.com/TENANT_ID/v2.0" \
    oidc_client_id="CLIENT_ID" \
    oidc_client_secret="CLIENT_SECRET" \
    default_role="default"

vault write auth/oidc/role/default \
    bound_audiences="CLIENT_ID" \
    allowed_redirect_uris="https://vault.example.com:8200/ui/vault/auth/oidc/oidc/callback" \
    user_claim="email" \
    groups_claim="groups" \
    policies="default"
```

## Vault Agent Configuration

```hcl
# vault-agent-config.hcl
pid_file = "/tmp/vault-agent.pid"

vault {
  address = "https://vault.example.com:8200"
}

auto_auth {
  method "kubernetes" {
    mount_path = "auth/kubernetes"
    config = {
      role = "myapp"
    }
  }

  sink "file" {
    config = {
      path = "/vault/token"
    }
  }
}

cache {
  use_auto_auth_token = true
}

listener "tcp" {
  address     = "127.0.0.1:8100"
  tls_disable = true
}

template {
  source      = "/vault/templates/config.ctmpl"
  destination = "/app/config/config.json"
  command     = "pkill -HUP myapp"
}

template {
  source      = "/vault/templates/db-creds.ctmpl"
  destination = "/app/secrets/db-creds"
  perms       = "0600"
}
```

```gotmpl
{{/* config.ctmpl */}}
{
  "database": {
    {{- with secret "database/creds/app-role" }}
    "username": "{{ .Data.username }}",
    "password": "{{ .Data.password }}"
    {{- end }}
  },
  "api_key": "{{ with secret "secret/data/myapp/config" }}{{ .Data.data.api_key }}{{ end }}"
}
```

## Kubernetes Pod with Vault Injection

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
      annotations:
        # Vault Agent Injector annotations
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "myapp"
        vault.hashicorp.com/agent-inject-status: "update"

        # Inject secrets as files
        vault.hashicorp.com/agent-inject-secret-db-creds: "database/creds/app-role"
        vault.hashicorp.com/agent-inject-template-db-creds: |
          {{- with secret "database/creds/app-role" -}}
          DB_USER={{ .Data.username }}
          DB_PASS={{ .Data.password }}
          {{- end -}}

        # Inject KV secrets
        vault.hashicorp.com/agent-inject-secret-config: "secret/data/myapp/config"
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "secret/data/myapp/config" -}}
          API_KEY={{ .Data.data.api_key }}
          {{- end -}}

    spec:
      serviceAccountName: myapp
      containers:
        - name: app
          image: myapp:latest
          command: ["sh", "-c", "source /vault/secrets/db-creds && source /vault/secrets/config && ./app"]
          volumeMounts:
            - name: vault-secrets
              mountPath: /vault/secrets
              readOnly: true
```

## Policy Examples

```hcl
# admin-policy.hcl
# Full admin access
path "*" {
  capabilities = ["create", "read", "update", "delete", "list", "sudo"]
}

# operator-policy.hcl
# Manage secrets engines and auth methods
path "sys/mounts/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/auth/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "sys/policies/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# app-policy.hcl
# Application read-only access to specific paths
path "secret/data/{{identity.entity.aliases.auth_kubernetes_*.metadata.service_account_namespace}}/*" {
  capabilities = ["read"]
}

path "database/creds/{{identity.entity.aliases.auth_kubernetes_*.metadata.service_account_name}}" {
  capabilities = ["read"]
}

# team-policy.hcl (namespaced)
path "secret/data/team-{{identity.groups.names}}/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

path "secret/metadata/team-{{identity.groups.names}}/*" {
  capabilities = ["list", "read", "delete"]
}
```

## CLAUDE.md Integration

```markdown
# HashiCorp Vault

## Commands
- `vault status` - Check Vault status
- `vault operator init` - Initialize Vault
- `vault operator unseal` - Unseal Vault
- `vault login` - Authenticate
- `vault kv put/get secret/path` - Manage KV secrets
- `vault read database/creds/role` - Get dynamic credentials

## Secrets Engines
- **KV**: Static key-value secrets
- **Database**: Dynamic database credentials
- **PKI**: Certificate management
- **Transit**: Encryption as a service

## Auth Methods
- **Kubernetes**: ServiceAccount auth
- **AppRole**: Machine-to-machine auth
- **OIDC**: SSO integration
- **Token**: Direct token auth

## Best Practices
1. Use auto-unseal with cloud KMS
2. Enable audit logging
3. Use dynamic secrets when possible
4. Implement least-privilege policies
5. Rotate root tokens regularly
```

## AI Suggestions

1. **Add Vault Enterprise features** - Namespaces, DR replication
2. **Implement secret rotation** - Automatic credential rotation
3. **Configure audit logging** - Ship logs to SIEM
4. **Add Sentinel policies** - Fine-grained access control
5. **Implement disaster recovery** - Cross-region replication
6. **Configure monitoring** - Prometheus metrics and alerts
7. **Add namespace isolation** - Multi-tenant secrets
8. **Implement key rotation** - Transit key rotation policies
9. **Configure HSM integration** - Hardware security module
10. **Add emergency access** - Break-glass procedures
