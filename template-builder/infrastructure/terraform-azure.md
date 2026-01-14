# Terraform Azure Template

> Production-ready Terraform configuration for Microsoft Azure infrastructure

## Overview

This template provides comprehensive Terraform Azure configurations with:
- AKS cluster setup
- Azure SQL Database
- Blob Storage
- Virtual Network
- Azure AD integration
- Key Vault

## Quick Start

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "My Subscription"

# Initialize and apply
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

## Project Structure

```
terraform-azure/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── aks/
│   ├── sql/
│   ├── vnet/
│   └── storage/
└── shared/
```

## Backend Configuration

```hcl
# backend.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstatesa"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}
```

## Provider Configuration

```hcl
# providers.tf
provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
  }
}

provider "azuread" {}

data "azurerm_client_config" "current" {}
data "azuread_client_config" "current" {}
```

## Main Configuration

```hcl
# main.tf
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.common_tags
}

# Virtual Network
module "vnet" {
  source = "../../modules/vnet"

  name                = "${local.name_prefix}-vnet"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  address_space       = var.vnet_address_space
  subnets             = var.subnets

  tags = local.common_tags
}

# AKS Cluster
module "aks" {
  source = "../../modules/aks"

  name                = "${local.name_prefix}-aks"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  kubernetes_version  = var.aks_version
  vnet_subnet_id      = module.vnet.subnet_ids["aks"]

  node_pools          = var.node_pools

  tags = local.common_tags
}

# Azure SQL Database
module "sql" {
  source = "../../modules/sql"

  name                = "${local.name_prefix}-sql"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  administrator_login = var.sql_admin_login
  database_name       = var.database_name
  sku_name            = var.sql_sku

  subnet_id           = module.vnet.subnet_ids["database"]

  tags = local.common_tags
}

# Storage Account
module "storage" {
  source = "../../modules/storage"

  name                = replace("${local.name_prefix}sa", "-", "")
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  containers          = var.storage_containers

  tags = local.common_tags
}

# Key Vault
module "keyvault" {
  source = "../../modules/keyvault"

  name                = "${local.name_prefix}-kv"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tenant_id           = data.azurerm_client_config.current.tenant_id

  tags = local.common_tags
}
```

## VNet Module

```hcl
# modules/vnet/main.tf
resource "azurerm_virtual_network" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  address_space       = var.address_space

  tags = var.tags
}

resource "azurerm_subnet" "subnets" {
  for_each = var.subnets

  name                 = each.key
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [each.value.address_prefix]

  dynamic "delegation" {
    for_each = each.value.delegation != null ? [each.value.delegation] : []
    content {
      name = delegation.value.name
      service_delegation {
        name    = delegation.value.service_delegation
        actions = delegation.value.actions
      }
    }
  }

  service_endpoints = each.value.service_endpoints
}

# Network Security Groups
resource "azurerm_network_security_group" "subnets" {
  for_each = var.subnets

  name                = "${each.key}-nsg"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = var.tags
}

resource "azurerm_subnet_network_security_group_association" "subnets" {
  for_each = var.subnets

  subnet_id                 = azurerm_subnet.subnets[each.key].id
  network_security_group_id = azurerm_network_security_group.subnets[each.key].id
}

# Private DNS Zone for Private Endpoints
resource "azurerm_private_dns_zone" "zones" {
  for_each = toset(var.private_dns_zones)

  name                = each.value
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "links" {
  for_each = toset(var.private_dns_zones)

  name                  = "${each.value}-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.zones[each.value].name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false

  tags = var.tags
}

output "vnet_id" {
  value = azurerm_virtual_network.main.id
}

output "subnet_ids" {
  value = { for k, v in azurerm_subnet.subnets : k => v.id }
}
```

## AKS Module

```hcl
# modules/aks/main.tf
resource "azurerm_kubernetes_cluster" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  dns_prefix          = var.name
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "default"
    node_count          = var.default_node_pool.node_count
    vm_size             = var.default_node_pool.vm_size
    vnet_subnet_id      = var.vnet_subnet_id
    os_disk_size_gb     = var.default_node_pool.os_disk_size_gb
    os_disk_type        = "Managed"
    type                = "VirtualMachineScaleSets"
    enable_auto_scaling = var.default_node_pool.enable_auto_scaling
    min_count           = var.default_node_pool.min_count
    max_count           = var.default_node_pool.max_count

    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    load_balancer_sku = "standard"
    outbound_type     = "loadBalancer"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.aks.id
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = var.admin_group_ids
  }

  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  workload_identity_enabled = true
  oidc_issuer_enabled       = true

  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [0, 1, 2, 3, 4]
    }
  }

  auto_scaler_profile {
    balance_similar_node_groups      = true
    expander                         = "random"
    max_graceful_termination_sec     = 600
    max_node_provisioning_time       = "15m"
    max_unready_nodes                = 3
    max_unready_percentage           = 45
    new_pod_scale_up_delay           = "10s"
    scale_down_delay_after_add       = "10m"
    scale_down_delay_after_delete    = "10s"
    scale_down_delay_after_failure   = "3m"
    scan_interval                    = "10s"
    scale_down_unneeded              = "10m"
    scale_down_unready               = "20m"
    scale_down_utilization_threshold = 0.5
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count
    ]
  }
}

# Additional Node Pools
resource "azurerm_kubernetes_cluster_node_pool" "pools" {
  for_each = var.node_pools

  name                  = each.key
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = each.value.vm_size
  node_count            = each.value.node_count
  vnet_subnet_id        = var.vnet_subnet_id
  os_disk_size_gb       = each.value.os_disk_size_gb
  os_type               = each.value.os_type
  enable_auto_scaling   = each.value.enable_auto_scaling
  min_count             = each.value.min_count
  max_count             = each.value.max_count

  node_labels = each.value.node_labels
  node_taints = each.value.node_taints

  tags = var.tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "aks" {
  name                = "${var.name}-logs"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.tags
}
```

## SQL Module

```hcl
# modules/sql/main.tf
resource "random_password" "sql_admin" {
  length  = 32
  special = true
}

resource "azurerm_mssql_server" "main" {
  name                         = var.name
  resource_group_name          = var.resource_group_name
  location                     = var.location
  version                      = "12.0"
  administrator_login          = var.administrator_login
  administrator_login_password = random_password.sql_admin.result
  minimum_tls_version          = "1.2"

  azuread_administrator {
    login_username              = var.azuread_admin_login
    object_id                   = var.azuread_admin_object_id
    azuread_authentication_only = var.azuread_authentication_only
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_mssql_database" "main" {
  name           = var.database_name
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = var.max_size_gb
  sku_name       = var.sku_name
  zone_redundant = var.zone_redundant

  short_term_retention_policy {
    retention_days           = 7
    backup_interval_in_hours = 24
  }

  long_term_retention_policy {
    weekly_retention  = "P4W"
    monthly_retention = "P12M"
    yearly_retention  = "P5Y"
    week_of_year      = 1
  }

  tags = var.tags
}

# Private Endpoint
resource "azurerm_private_endpoint" "sql" {
  name                = "${var.name}-pe"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.name}-psc"
    private_connection_resource_id = azurerm_mssql_server.main.id
    subresource_names              = ["sqlServer"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Store credentials in Key Vault
resource "azurerm_key_vault_secret" "sql_connection_string" {
  name         = "${var.name}-connection-string"
  value        = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Database=${var.database_name};User ID=${var.administrator_login};Password=${random_password.sql_admin.result};Encrypt=true;Connection Timeout=30;"
  key_vault_id = var.key_vault_id
}
```

## Variables

```hcl
# variables.tf
variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus2"
}

variable "vnet_address_space" {
  description = "VNet address space"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnets" {
  description = "Subnet configurations"
  type = map(object({
    address_prefix    = string
    service_endpoints = list(string)
    delegation        = object({
      name               = string
      service_delegation = string
      actions            = list(string)
    })
  }))
}

variable "aks_version" {
  description = "AKS Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "node_pools" {
  description = "Additional AKS node pools"
  type = map(object({
    vm_size             = string
    node_count          = number
    os_disk_size_gb     = number
    os_type             = string
    enable_auto_scaling = bool
    min_count           = number
    max_count           = number
    node_labels         = map(string)
    node_taints         = list(string)
  }))
}

variable "sql_admin_login" {
  description = "SQL admin login"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "sql_sku" {
  description = "SQL SKU"
  type        = string
  default     = "S2"
}

variable "storage_containers" {
  description = "Storage containers to create"
  type        = list(string)
  default     = []
}
```

## CLAUDE.md Integration

```markdown
# Terraform Azure

## Commands
- `az login` - Authenticate
- `terraform init` - Initialize
- `terraform plan` - Plan changes
- `terraform apply` - Apply changes

## Resources
- **AKS**: Kubernetes with Azure AD integration
- **SQL**: Azure SQL with Private Endpoint
- **VNet**: Virtual network with NSGs
- **Storage**: Blob storage for assets
- **Key Vault**: Secrets management

## Workload Identity
```bash
az identity federated-credential create \
  --name aks-federated-credential \
  --identity-name my-identity \
  --resource-group my-rg \
  --issuer $AKS_OIDC_ISSUER \
  --subject system:serviceaccount:namespace:sa-name
```
```

## AI Suggestions

1. **Add Azure Front Door** - Implement global load balancing and WAF
2. **Configure Azure Monitor** - Set up comprehensive monitoring
3. **Add Azure Policy** - Implement governance policies
4. **Implement Azure DevOps** - Add CI/CD pipelines
5. **Add Cosmos DB** - Include NoSQL database option
6. **Configure Azure Firewall** - Add network security
7. **Add Event Hubs** - Include messaging infrastructure
8. **Implement Azure Functions** - Add serverless compute
9. **Configure Azure AD B2C** - Add customer identity
10. **Add Azure Cache for Redis** - Include caching layer
