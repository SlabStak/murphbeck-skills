# Terraform Modules Template

> Production-ready reusable Terraform modules with best practices for composition, versioning, and testing

## Overview

This template provides Terraform module patterns with:
- Reusable module structure
- Module composition patterns
- Registry publishing
- Testing with Terratest
- Documentation generation

## Quick Start

```bash
# Initialize module
terraform init

# Validate module
terraform validate

# Format code
terraform fmt -recursive

# Generate docs
terraform-docs markdown . > README.md

# Test module
cd test && go test -v -timeout 30m
```

## Module Directory Structure

```
modules/
├── vpc/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── versions.tf
│   ├── README.md
│   └── examples/
│       ├── simple/
│       │   ├── main.tf
│       │   └── outputs.tf
│       └── complete/
│           ├── main.tf
│           └── outputs.tf
├── eks/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── versions.tf
│   └── modules/
│       ├── node-group/
│       └── addons/
└── rds/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── versions.tf
```

## VPC Module

```hcl
# modules/vpc/versions.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# modules/vpc/variables.tf
variable "name" {
  description = "Name prefix for all resources"
  type        = string

  validation {
    condition     = length(var.name) > 0 && length(var.name) <= 32
    error_message = "Name must be between 1 and 32 characters."
  }
}

variable "cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.cidr, 0))
    error_message = "Must be a valid CIDR block."
  }
}

variable "azs" {
  description = "Availability zones"
  type        = list(string)
  default     = []
}

variable "private_subnets" {
  description = "List of private subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "public_subnets" {
  description = "List of public subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "database_subnets" {
  description = "List of database subnet CIDR blocks"
  type        = list(string)
  default     = []
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use a single NAT Gateway for all AZs"
  type        = bool
  default     = false
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
  default     = false
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_support" {
  description = "Enable DNS support in the VPC"
  type        = bool
  default     = true
}

variable "enable_flow_logs" {
  description = "Enable VPC Flow Logs"
  type        = bool
  default     = true
}

variable "flow_logs_retention_days" {
  description = "Flow logs retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# modules/vpc/main.tf
locals {
  azs = length(var.azs) > 0 ? var.azs : slice(data.aws_availability_zones.available.names, 0, 3)

  nat_gateway_count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0

  common_tags = merge(var.tags, {
    Module    = "vpc"
    ManagedBy = "terraform"
  })
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}

# VPC
resource "aws_vpc" "this" {
  cidr_block           = var.cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(local.common_tags, {
    Name = var.name
  })
}

# Internet Gateway
resource "aws_internet_gateway" "this" {
  count = length(var.public_subnets) > 0 ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnets)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = local.azs[count.index % length(local.azs)]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                        = "${var.name}-public-${local.azs[count.index % length(local.azs)]}"
    Tier                        = "public"
    "kubernetes.io/role/elb"    = "1"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnets)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = local.azs[count.index % length(local.azs)]

  tags = merge(local.common_tags, {
    Name                              = "${var.name}-private-${local.azs[count.index % length(local.azs)]}"
    Tier                              = "private"
    "kubernetes.io/role/internal-elb" = "1"
  })
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnets)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.database_subnets[count.index]
  availability_zone = local.azs[count.index % length(local.azs)]

  tags = merge(local.common_tags, {
    Name = "${var.name}-database-${local.azs[count.index % length(local.azs)]}"
    Tier = "database"
  })
}

# Database Subnet Group
resource "aws_db_subnet_group" "this" {
  count = length(var.database_subnets) > 0 ? 1 : 0

  name        = var.name
  description = "Database subnet group for ${var.name}"
  subnet_ids  = aws_subnet.database[*].id

  tags = merge(local.common_tags, {
    Name = var.name
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = local.nat_gateway_count

  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.name}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.this]
}

# NAT Gateways
resource "aws_nat_gateway" "this" {
  count = local.nat_gateway_count

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${var.name}-nat-${local.azs[count.index]}"
  })

  depends_on = [aws_internet_gateway.this]
}

# Public Route Table
resource "aws_route_table" "public" {
  count = length(var.public_subnets) > 0 ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name}-public"
  })
}

resource "aws_route" "public_internet" {
  count = length(var.public_subnets) > 0 ? 1 : 0

  route_table_id         = aws_route_table.public[0].id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this[0].id
}

resource "aws_route_table_association" "public" {
  count = length(var.public_subnets)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private Route Tables
resource "aws_route_table" "private" {
  count = length(var.private_subnets) > 0 ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = var.single_nat_gateway ? "${var.name}-private" : "${var.name}-private-${local.azs[count.index]}"
  })
}

resource "aws_route" "private_nat" {
  count = var.enable_nat_gateway && length(var.private_subnets) > 0 ? (var.single_nat_gateway ? 1 : length(local.azs)) : 0

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[var.single_nat_gateway ? 0 : count.index].id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnets)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[var.single_nat_gateway ? 0 : count.index % length(aws_route_table.private)].id
}

# Database Route Table
resource "aws_route_table" "database" {
  count = length(var.database_subnets) > 0 ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name}-database"
  })
}

resource "aws_route_table_association" "database" {
  count = length(var.database_subnets)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[0].id
}

# VPC Flow Logs
resource "aws_flow_log" "this" {
  count = var.enable_flow_logs ? 1 : 0

  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name}-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc-flow-logs/${var.name}"
  retention_in_days = var.flow_logs_retention_days

  tags = local.common_tags
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.name}-vpc-flow-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "vpc-flow-logs"
  role = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Effect   = "Allow"
      Resource = "*"
    }]
  })
}

# VPN Gateway
resource "aws_vpn_gateway" "this" {
  count = var.enable_vpn_gateway ? 1 : 0

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    Name = "${var.name}-vpn-gw"
  })
}

# modules/vpc/outputs.tf
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.this.cidr_block
}

output "vpc_arn" {
  description = "The ARN of the VPC"
  value       = aws_vpc.this.arn
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "List of database subnet IDs"
  value       = aws_subnet.database[*].id
}

output "database_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = try(aws_db_subnet_group.this[0].name, null)
}

output "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  value       = aws_nat_gateway.this[*].id
}

output "nat_public_ips" {
  description = "List of NAT Gateway public IPs"
  value       = aws_eip.nat[*].public_ip
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = try(aws_internet_gateway.this[0].id, null)
}

output "availability_zones" {
  description = "List of availability zones used"
  value       = local.azs
}
```

## EKS Module

```hcl
# modules/eks/versions.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.20"
    }
    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }
  }
}

# modules/eks/variables.tf
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.29"
}

variable "vpc_id" {
  description = "VPC ID where the cluster will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for the EKS cluster"
  type        = list(string)
}

variable "node_groups" {
  description = "Map of node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = optional(string, "ON_DEMAND")
    min_size       = number
    max_size       = number
    desired_size   = number
    disk_size      = optional(number, 100)
    labels         = optional(map(string), {})
    taints = optional(list(object({
      key    = string
      value  = string
      effect = string
    })), [])
  }))
  default = {}
}

variable "cluster_endpoint_public_access" {
  description = "Enable public access to cluster endpoint"
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Enable private access to cluster endpoint"
  type        = bool
  default     = true
}

variable "enable_irsa" {
  description = "Enable IAM Roles for Service Accounts"
  type        = bool
  default     = true
}

variable "cluster_addons" {
  description = "Map of cluster addon configurations"
  type = map(object({
    version                  = optional(string)
    resolve_conflicts        = optional(string, "OVERWRITE")
    service_account_role_arn = optional(string)
  }))
  default = {
    coredns = {}
    kube-proxy = {}
    vpc-cni = {}
  }
}

variable "aws_auth_roles" {
  description = "Additional IAM roles to add to aws-auth configmap"
  type = list(object({
    rolearn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

variable "aws_auth_users" {
  description = "Additional IAM users to add to aws-auth configmap"
  type = list(object({
    userarn  = string
    username = string
    groups   = list(string)
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# modules/eks/main.tf
locals {
  common_tags = merge(var.tags, {
    Module    = "eks"
    ManagedBy = "terraform"
  })
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

# Cluster IAM Role
resource "aws_iam_role" "cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cluster_policies" {
  for_each = toset([
    "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSClusterPolicy",
    "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSVPCResourceController"
  ])

  policy_arn = each.value
  role       = aws_iam_role.cluster.name
}

# Cluster Security Group
resource "aws_security_group" "cluster" {
  name        = "${var.cluster_name}-cluster-sg"
  description = "Security group for EKS cluster"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${var.cluster_name}-cluster-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "cluster_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.cluster.id
}

# EKS Cluster
resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.cluster.arn

  vpc_config {
    subnet_ids              = var.subnet_ids
    security_group_ids      = [aws_security_group.cluster.id]
    endpoint_private_access = var.cluster_endpoint_private_access
    endpoint_public_access  = var.cluster_endpoint_public_access
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = local.common_tags

  depends_on = [aws_iam_role_policy_attachment.cluster_policies]
}

# OIDC Provider for IRSA
data "tls_certificate" "cluster" {
  count = var.enable_irsa ? 1 : 0
  url   = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "cluster" {
  count = var.enable_irsa ? 1 : 0

  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.cluster[0].certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer

  tags = local.common_tags
}

# Node Group IAM Role
resource "aws_iam_role" "node_group" {
  name = "${var.cluster_name}-node-group-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "node_group_policies" {
  for_each = toset([
    "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
  ])

  policy_arn = each.value
  role       = aws_iam_role.node_group.name
}

# Node Groups
resource "aws_eks_node_group" "this" {
  for_each = var.node_groups

  cluster_name    = aws_eks_cluster.this.name
  node_group_name = each.key
  node_role_arn   = aws_iam_role.node_group.arn
  subnet_ids      = var.subnet_ids

  instance_types = each.value.instance_types
  capacity_type  = each.value.capacity_type
  disk_size      = each.value.disk_size

  scaling_config {
    min_size     = each.value.min_size
    max_size     = each.value.max_size
    desired_size = each.value.desired_size
  }

  update_config {
    max_unavailable_percentage = 33
  }

  labels = merge(each.value.labels, {
    "node-group" = each.key
  })

  dynamic "taint" {
    for_each = each.value.taints
    content {
      key    = taint.value.key
      value  = taint.value.value
      effect = taint.value.effect
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.cluster_name}-${each.key}"
  })

  depends_on = [aws_iam_role_policy_attachment.node_group_policies]

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

# Cluster Addons
resource "aws_eks_addon" "this" {
  for_each = var.cluster_addons

  cluster_name             = aws_eks_cluster.this.name
  addon_name               = each.key
  addon_version            = each.value.version
  resolve_conflicts_on_update = each.value.resolve_conflicts
  service_account_role_arn = each.value.service_account_role_arn

  tags = local.common_tags

  depends_on = [aws_eks_node_group.this]
}

# modules/eks/outputs.tf
output "cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.this.id
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.this.name
}

output "cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.this.arn
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.this.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data for cluster"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "cluster_oidc_issuer_url" {
  description = "OIDC issuer URL for the cluster"
  value       = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

output "cluster_oidc_provider_arn" {
  description = "ARN of the OIDC Provider"
  value       = try(aws_iam_openid_connect_provider.cluster[0].arn, null)
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = aws_security_group.cluster.id
}

output "node_group_role_arn" {
  description = "ARN of the node group IAM role"
  value       = aws_iam_role.node_group.arn
}
```

## RDS Module

```hcl
# modules/rds/variables.tf
variable "identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "engine" {
  description = "Database engine"
  type        = string
  default     = "postgres"
}

variable "engine_version" {
  description = "Database engine version"
  type        = string
  default     = "16.1"
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling"
  type        = number
  default     = 100
}

variable "database_name" {
  description = "Name of the database"
  type        = string
}

variable "username" {
  description = "Master username"
  type        = string
}

variable "password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for DB subnet group"
  type        = list(string)
}

variable "allowed_security_group_ids" {
  description = "Security group IDs allowed to access the database"
  type        = list(string)
  default     = []
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "Mon:04:00-Mon:05:00"
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = false
}

variable "storage_encrypted" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval"
  type        = number
  default     = 60
}

variable "enabled_cloudwatch_logs_exports" {
  description = "CloudWatch log exports"
  type        = list(string)
  default     = ["postgresql", "upgrade"]
}

variable "parameters" {
  description = "Additional DB parameters"
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string, "immediate")
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# modules/rds/main.tf
locals {
  common_tags = merge(var.tags, {
    Module    = "rds"
    ManagedBy = "terraform"
  })

  port = var.engine == "postgres" ? 5432 : 3306
}

# Subnet Group
resource "aws_db_subnet_group" "this" {
  name        = var.identifier
  description = "Subnet group for ${var.identifier}"
  subnet_ids  = var.subnet_ids

  tags = merge(local.common_tags, {
    Name = var.identifier
  })
}

# Security Group
resource "aws_security_group" "this" {
  name        = "${var.identifier}-sg"
  description = "Security group for ${var.identifier}"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${var.identifier}-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group_rule" "ingress" {
  count = length(var.allowed_security_group_ids)

  type                     = "ingress"
  from_port                = local.port
  to_port                  = local.port
  protocol                 = "tcp"
  source_security_group_id = var.allowed_security_group_ids[count.index]
  security_group_id        = aws_security_group.this.id
}

resource "aws_security_group_rule" "egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.this.id
}

# Parameter Group
resource "aws_db_parameter_group" "this" {
  name        = var.identifier
  family      = "${var.engine}${split(".", var.engine_version)[0]}"
  description = "Parameter group for ${var.identifier}"

  dynamic "parameter" {
    for_each = var.parameters
    content {
      name         = parameter.value.name
      value        = parameter.value.value
      apply_method = parameter.value.apply_method
    }
  }

  tags = local.common_tags

  lifecycle {
    create_before_destroy = true
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  name = "${var.identifier}-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "monitoring" {
  count = var.monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# RDS Instance
resource "aws_db_instance" "this" {
  identifier = var.identifier

  engine         = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = var.storage_encrypted
  kms_key_id            = var.kms_key_id

  db_name  = var.database_name
  username = var.username
  password = var.password
  port     = local.port

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.this.id]
  parameter_group_name   = aws_db_parameter_group.this.name

  multi_az            = var.multi_az
  publicly_accessible = false

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  deletion_protection      = var.deletion_protection
  skip_final_snapshot      = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.identifier}-final"

  performance_insights_enabled = var.performance_insights_enabled
  monitoring_interval          = var.monitoring_interval
  monitoring_role_arn          = var.monitoring_interval > 0 ? aws_iam_role.monitoring[0].arn : null

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  auto_minor_version_upgrade = true

  tags = local.common_tags
}

# modules/rds/outputs.tf
output "instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.this.id
}

output "instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.this.arn
}

output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.this.endpoint
}

output "address" {
  description = "RDS instance address"
  value       = aws_db_instance.this.address
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.this.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.this.db_name
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.this.id
}
```

## Module Usage Example

```hcl
# environments/production/main.tf
terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "production"
      Project     = "myapp"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  name = "myapp-production"
  cidr = "10.0.0.0/16"

  azs              = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
  enable_flow_logs   = true

  tags = {
    Environment = "production"
  }
}

module "eks" {
  source = "../../modules/eks"

  cluster_name    = "myapp-production"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  node_groups = {
    general = {
      instance_types = ["m6i.large", "m6i.xlarge"]
      capacity_type  = "ON_DEMAND"
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      disk_size      = 100
      labels = {
        workload = "general"
      }
    }
    spot = {
      instance_types = ["m6i.large", "m6i.xlarge", "m5.large", "m5.xlarge"]
      capacity_type  = "SPOT"
      min_size       = 0
      max_size       = 20
      desired_size   = 2
      labels = {
        workload = "batch"
      }
      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  tags = {
    Environment = "production"
  }
}

module "rds" {
  source = "../../modules/rds"

  identifier = "myapp-production"

  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500

  database_name = "myapp"
  username      = "admin"
  password      = var.database_password

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnet_ids

  allowed_security_group_ids = [module.eks.cluster_security_group_id]

  multi_az                = true
  backup_retention_period = 30
  deletion_protection     = true

  tags = {
    Environment = "production"
  }
}
```

## Terratest Example

```go
// test/vpc_test.go
package test

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestVpcModule(t *testing.T) {
	t.Parallel()

	awsRegion := "us-east-1"

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../modules/vpc/examples/simple",
		Vars: map[string]interface{}{
			"name": "test-vpc",
			"cidr": "10.99.0.0/16",
		},
		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},
	})

	defer terraform.Destroy(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	vpcId := terraform.Output(t, terraformOptions, "vpc_id")
	publicSubnetIds := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
	privateSubnetIds := terraform.OutputList(t, terraformOptions, "private_subnet_ids")

	// Verify VPC exists
	vpc := aws.GetVpcById(t, vpcId, awsRegion)
	assert.Equal(t, "10.99.0.0/16", *vpc.CidrBlock)

	// Verify subnets
	assert.Equal(t, 3, len(publicSubnetIds))
	assert.Equal(t, 3, len(privateSubnetIds))

	// Verify public subnets have internet access
	for _, subnetId := range publicSubnetIds {
		subnet := aws.GetSubnetById(t, subnetId, awsRegion)
		assert.True(t, *subnet.MapPublicIpOnLaunch)
	}
}

func TestEksModule(t *testing.T) {
	t.Parallel()

	awsRegion := "us-east-1"

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../modules/eks/examples/simple",
		Vars: map[string]interface{}{
			"cluster_name": "test-cluster",
		},
		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},
	})

	defer terraform.Destroy(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	clusterName := terraform.Output(t, terraformOptions, "cluster_name")
	clusterEndpoint := terraform.Output(t, terraformOptions, "cluster_endpoint")

	assert.Equal(t, "test-cluster", clusterName)
	assert.NotEmpty(t, clusterEndpoint)
}
```

## CLAUDE.md Integration

```markdown
# Terraform Modules

## Commands
- `terraform init` - Initialize module
- `terraform validate` - Validate configuration
- `terraform fmt -recursive` - Format code
- `terraform-docs markdown .` - Generate docs

## Module Structure
- `main.tf` - Main resources
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `versions.tf` - Provider requirements

## Best Practices
- Use semantic versioning for modules
- Validate inputs with `validation` blocks
- Output all useful values
- Include examples directory
- Write Terratest tests

## Publishing
- Tag releases: `git tag v1.0.0`
- Use Terraform Registry or private registry
- Include comprehensive README
```

## AI Suggestions

1. **Add module versioning** - Semantic versioning with git tags
2. **Implement module composition** - Combine modules in patterns
3. **Add cost estimation** - Infracost integration
4. **Configure module tests** - Comprehensive Terratest suite
5. **Add pre-commit hooks** - terraform-docs, fmt, validate
6. **Implement module caching** - Speed up CI/CD
7. **Add policy as code** - OPA/Sentinel integration
8. **Configure drift detection** - Automated drift checks
9. **Add module documentation** - Auto-generated docs
10. **Implement module analytics** - Track module usage
