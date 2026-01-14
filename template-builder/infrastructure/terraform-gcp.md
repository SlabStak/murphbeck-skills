# Terraform GCP Template

> Production-ready Terraform configuration for Google Cloud Platform infrastructure

## Overview

This template provides comprehensive Terraform GCP configurations with:
- GKE cluster setup
- Cloud SQL
- Cloud Storage
- VPC networking
- IAM and service accounts
- Cloud Functions

## Quick Start

```bash
# Authenticate
gcloud auth application-default login

# Initialize
terraform init

# Plan and apply
terraform plan -out=tfplan
terraform apply tfplan
```

## Project Structure

```
terraform-gcp/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── prod/
├── modules/
│   ├── gke/
│   ├── cloudsql/
│   ├── vpc/
│   └── storage/
└── shared/
```

## Backend Configuration

```hcl
# backend.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "my-terraform-state"
    prefix = "environments/prod"
  }
}
```

## Provider Configuration

```hcl
# providers.tf
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

data "google_project" "project" {}
data "google_client_config" "default" {}
```

## Main Configuration

```hcl
# main.tf
locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
  disable_on_destroy         = false
}

# VPC Network
module "vpc" {
  source = "../../modules/vpc"

  project_id  = var.project_id
  name_prefix = local.name_prefix
  region      = var.region
}

# GKE Cluster
module "gke" {
  source = "../../modules/gke"

  project_id     = var.project_id
  name           = "${local.name_prefix}-gke"
  region         = var.region
  network        = module.vpc.network_name
  subnetwork     = module.vpc.subnet_name

  node_pools     = var.node_pools
  master_cidr    = var.gke_master_cidr

  depends_on = [google_project_service.apis]
}

# Cloud SQL
module "cloudsql" {
  source = "../../modules/cloudsql"

  project_id    = var.project_id
  name          = "${local.name_prefix}-db"
  region        = var.region
  network_id    = module.vpc.network_id

  database_name = var.db_name
  tier          = var.db_tier

  depends_on = [google_project_service.apis]
}

# Cloud Storage
module "storage" {
  source = "../../modules/storage"

  project_id = var.project_id
  name       = "${local.name_prefix}-assets"
  location   = var.region
}
```

## VPC Module

```hcl
# modules/vpc/main.tf
resource "google_compute_network" "vpc" {
  name                    = "${var.name_prefix}-vpc"
  project                 = var.project_id
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${var.name_prefix}-subnet"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.vpc.id
  ip_cidr_range = var.subnet_cidr

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }

  private_ip_google_access = true

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling        = 0.5
    metadata             = "INCLUDE_ALL_METADATA"
  }
}

# Cloud NAT
resource "google_compute_router" "router" {
  name    = "${var.name_prefix}-router"
  project = var.project_id
  region  = var.region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.name_prefix}-nat"
  project                            = var.project_id
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall Rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.name_prefix}-allow-internal"
  project = var.project_id
  network = google_compute_network.vpc.id

  allow {
    protocol = "icmp"
  }

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  source_ranges = [var.subnet_cidr, var.pods_cidr, var.services_cidr]
}

resource "google_compute_firewall" "allow_health_checks" {
  name    = "${var.name_prefix}-allow-health-checks"
  project = var.project_id
  network = google_compute_network.vpc.id

  allow {
    protocol = "tcp"
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
  target_tags   = ["gke-node"]
}
```

## GKE Module

```hcl
# modules/gke/main.tf
resource "google_container_cluster" "primary" {
  name     = var.name
  project  = var.project_id
  location = var.region

  network    = var.network
  subnetwork = var.subnetwork

  # Use separately managed node pools
  remove_default_node_pool = true
  initial_node_count       = 1

  # Networking
  networking_mode = "VPC_NATIVE"
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Private cluster
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = var.master_cidr
  }

  # Master authorized networks
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All"
    }
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Addons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = false
    }
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
  }

  # Maintenance window
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }

  # Release channel
  release_channel {
    channel = "REGULAR"
  }

  # Security
  binary_authorization {
    evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
  }

  # Monitoring
  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
    managed_prometheus {
      enabled = true
    }
  }

  lifecycle {
    ignore_changes = [node_config]
  }
}

# Node Pools
resource "google_container_node_pool" "pools" {
  for_each = var.node_pools

  name       = each.key
  project    = var.project_id
  location   = var.region
  cluster    = google_container_cluster.primary.name

  initial_node_count = each.value.initial_node_count

  autoscaling {
    min_node_count = each.value.min_count
    max_node_count = each.value.max_count
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  node_config {
    preemptible  = each.value.preemptible
    machine_type = each.value.machine_type
    disk_size_gb = each.value.disk_size_gb
    disk_type    = each.value.disk_type

    labels = each.value.labels
    tags   = ["gke-node", "${var.name}-node"]

    service_account = google_service_account.gke_nodes.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
}

# Service Account for GKE nodes
resource "google_service_account" "gke_nodes" {
  account_id   = "${var.name}-nodes"
  project      = var.project_id
  display_name = "GKE Node Service Account"
}

resource "google_project_iam_member" "gke_nodes" {
  for_each = toset([
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
    "roles/stackdriver.resourceMetadata.writer",
    "roles/artifactregistry.reader",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gke_nodes.email}"
}
```

## Cloud SQL Module

```hcl
# modules/cloudsql/main.tf
resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "main" {
  name             = var.name
  project          = var.project_id
  region           = var.region
  database_version = "POSTGRES_16"

  deletion_protection = var.deletion_protection

  settings {
    tier              = var.tier
    availability_type = var.availability_type
    disk_type         = "PD_SSD"
    disk_size         = var.disk_size
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
      location                       = var.region

      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_id
      require_ssl     = true
    }

    maintenance_window {
      day          = 7  # Sunday
      hour         = 3
      update_track = "stable"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }
}

resource "google_sql_database" "database" {
  name     = var.database_name
  project  = var.project_id
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "user" {
  name     = var.database_name
  project  = var.project_id
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.name}-password"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}
```

## Variables

```hcl
# variables.tf
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "node_pools" {
  description = "GKE node pool configurations"
  type = map(object({
    machine_type       = string
    initial_node_count = number
    min_count          = number
    max_count          = number
    disk_size_gb       = number
    disk_type          = string
    preemptible        = bool
    labels             = map(string)
  }))
}

variable "gke_master_cidr" {
  description = "CIDR for GKE master"
  type        = string
  default     = "172.16.0.0/28"
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-custom-2-7680"
}
```

## CLAUDE.md Integration

```markdown
# Terraform GCP

## Commands
- `terraform init` - Initialize
- `terraform plan` - Plan changes
- `terraform apply` - Apply changes
- `gcloud auth application-default login` - Authenticate

## Resources
- **GKE**: Kubernetes cluster with Workload Identity
- **Cloud SQL**: PostgreSQL with private networking
- **VPC**: Custom network with Cloud NAT
- **GCS**: Object storage for assets

## Workload Identity
```bash
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:PROJECT.svc.id.goog[NAMESPACE/KSA]" \
  GSA@PROJECT.iam.gserviceaccount.com
```
```

## AI Suggestions

1. **Add Cloud Armor** - Implement WAF and DDoS protection
2. **Configure Cloud CDN** - Add CDN for static assets
3. **Implement Cloud Build** - Add CI/CD pipelines
4. **Add Cloud Run** - Include serverless containers
5. **Configure VPC Service Controls** - Add data exfiltration protection
6. **Add Cloud Functions** - Include serverless functions
7. **Implement Pub/Sub** - Add messaging infrastructure
8. **Add Memorystore** - Include Redis for caching
9. **Configure Cloud Logging** - Set up log sinks and alerts
10. **Add BigQuery** - Include data warehouse setup
