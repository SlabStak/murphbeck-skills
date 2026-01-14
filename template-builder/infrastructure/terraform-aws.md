# Terraform AWS Template

> Production-ready Terraform configuration for AWS infrastructure with modules, best practices, and security

## Overview

This template provides comprehensive Terraform AWS configurations with:
- Modular architecture
- State management with S3 and DynamoDB
- VPC with public/private subnets
- EKS cluster setup
- RDS database
- Security groups and IAM roles
- Secrets management

## Quick Start

```bash
# Initialize
terraform init

# Plan changes
terraform plan -out=tfplan

# Apply changes
terraform apply tfplan

# Destroy (careful!)
terraform destroy
```

## Project Structure

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   ├── staging/
│   └── prod/
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   ├── s3/
│   └── iam/
├── shared/
│   └── backend/
└── .terraform-version
```

## Backend Configuration (backend.tf)

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "environments/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"

    # Optional: Use assume role for cross-account
    # role_arn = "arn:aws:iam::123456789:role/TerraformRole"
  }
}
```

## Provider Configuration

```hcl
# providers.tf
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "terraform"
      Owner       = var.owner
    }
  }

  # Optional: Assume role
  # assume_role {
  #   role_arn = "arn:aws:iam::123456789:role/TerraformRole"
  # }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
```

## Main Configuration (main.tf)

```hcl
# main.tf
locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = slice(data.aws_availability_zones.available.names, 0, 3)
  public_subnets      = var.public_subnets
  private_subnets     = var.private_subnets
  database_subnets    = var.database_subnets
  enable_nat_gateway  = var.enable_nat_gateway
  single_nat_gateway  = var.single_nat_gateway

  tags = local.common_tags
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  cluster_name    = "${local.name_prefix}-eks"
  cluster_version = var.eks_cluster_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids

  node_groups = var.eks_node_groups

  enable_cluster_autoscaler = true
  enable_metrics_server     = true

  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  identifier     = "${local.name_prefix}-db"
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  database_name = var.db_name
  username      = var.db_username

  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.database_subnet_ids
  security_group_ids  = [module.vpc.database_security_group_id]

  multi_az               = var.environment == "prod"
  deletion_protection    = var.environment == "prod"
  skip_final_snapshot    = var.environment != "prod"
  backup_retention_period = var.environment == "prod" ? 30 : 7

  tags = local.common_tags
}

# S3 Bucket for application assets
module "s3_assets" {
  source = "../../modules/s3"

  bucket_name = "${local.name_prefix}-assets"

  versioning_enabled = true
  encryption_enabled = true

  cors_rules = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = var.cors_allowed_origins
      max_age_seconds = 3600
    }
  ]

  lifecycle_rules = [
    {
      id      = "archive"
      enabled = true
      transition = {
        days          = 90
        storage_class = "STANDARD_IA"
      }
    }
  ]

  tags = local.common_tags
}
```

## Variables (variables.tf)

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "database_subnets" {
  description = "Database subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cost saving for non-prod)"
  type        = bool
  default     = false
}

# EKS Variables
variable "eks_cluster_version" {
  description = "EKS cluster version"
  type        = string
  default     = "1.29"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    min_size       = number
    max_size       = number
    desired_size   = number
    disk_size      = number
    labels         = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    general = {
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      disk_size      = 50
      labels         = {}
      taints         = []
    }
  }
}

# RDS Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Initial storage allocation in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum storage allocation in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "myapp"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

# CORS
variable "cors_allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}
```

## Outputs (outputs.tf)

```hcl
# outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_certificate_authority" {
  description = "EKS cluster CA certificate"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.port
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3_assets.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3_assets.bucket_arn
}
```

## VPC Module (modules/vpc/main.tf)

```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name                                        = "${var.name_prefix}-public-${count.index + 1}"
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${var.name_prefix}" = "shared"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name                                        = "${var.name_prefix}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${var.name_prefix}" = "shared"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnets)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnets[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-database-${count.index + 1}"
  })
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.public_subnets)) : 0
  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.public_subnets)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

resource "aws_route_table" "private" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnets)) : 1
  vpc_id = aws_vpc.main.id

  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}"
  })
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnets)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : count.index].id
}
```

## terraform.tfvars (Production Example)

```hcl
# environments/prod/terraform.tfvars
aws_region   = "us-east-1"
environment  = "prod"
project_name = "myapp"
owner        = "platform-team"

# VPC
vpc_cidr           = "10.0.0.0/16"
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnets    = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
database_subnets   = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
enable_nat_gateway = true
single_nat_gateway = false

# EKS
eks_cluster_version = "1.29"
eks_node_groups = {
  general = {
    instance_types = ["m5.large"]
    capacity_type  = "ON_DEMAND"
    min_size       = 3
    max_size       = 20
    desired_size   = 5
    disk_size      = 100
    labels = {
      "workload" = "general"
    }
    taints = []
  }
  spot = {
    instance_types = ["m5.large", "m5a.large", "m4.large"]
    capacity_type  = "SPOT"
    min_size       = 0
    max_size       = 10
    desired_size   = 2
    disk_size      = 50
    labels = {
      "workload" = "batch"
    }
    taints = [
      {
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }
    ]
  }
}

# RDS
db_instance_class        = "db.r6g.large"
db_allocated_storage     = 100
db_max_allocated_storage = 500
db_name                  = "myapp"
```

## CLAUDE.md Integration

```markdown
# Terraform AWS

## Commands
- `terraform init` - Initialize providers
- `terraform plan -out=tfplan` - Plan changes
- `terraform apply tfplan` - Apply changes
- `terraform destroy` - Destroy resources
- `terraform fmt -recursive` - Format code

## State Management
- S3 bucket for state storage
- DynamoDB for state locking
- Encrypted state files
- Separate state per environment

## Environments
- `environments/dev/` - Development
- `environments/staging/` - Staging
- `environments/prod/` - Production

## Modules
- `vpc` - Network infrastructure
- `eks` - Kubernetes cluster
- `rds` - Database
- `s3` - Object storage
- `iam` - IAM roles and policies
```

## AI Suggestions

1. **Add Terragrunt** - Use Terragrunt for DRY configuration across environments
2. **Implement OIDC** - Use GitHub Actions OIDC for keyless AWS authentication
3. **Add cost estimation** - Integrate Infracost for PR cost comments
4. **Configure drift detection** - Set up scheduled drift detection in CI
5. **Add policy as code** - Use OPA/Sentinel for compliance policies
6. **Implement workspaces** - Use Terraform workspaces or separate state files
7. **Add secrets management** - Integrate AWS Secrets Manager for sensitive values
8. **Configure remote execution** - Use Terraform Cloud for remote runs
9. **Add module versioning** - Version and publish modules to registry
10. **Implement import blocks** - Use import blocks for existing resources
