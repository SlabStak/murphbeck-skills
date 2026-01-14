# Pulumi TypeScript Template

> Production-ready Pulumi infrastructure as code with TypeScript for multi-cloud deployments

## Overview

This template provides Pulumi configurations with:
- TypeScript-based infrastructure
- Multi-cloud support (AWS, GCP, Azure)
- Component resources and abstractions
- Stack configuration management
- CI/CD integration

## Quick Start

```bash
# Create new project
pulumi new typescript

# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

## Project Structure

```
pulumi-project/
├── Pulumi.yaml
├── Pulumi.dev.yaml
├── Pulumi.prod.yaml
├── package.json
├── tsconfig.json
├── index.ts
├── src/
│   ├── components/
│   │   ├── vpc.ts
│   │   ├── eks.ts
│   │   └── rds.ts
│   ├── config/
│   │   └── index.ts
│   └── utils/
│       └── naming.ts
└── __tests__/
    └── infrastructure.test.ts
```

## Project Configuration

```yaml
# Pulumi.yaml
name: my-infrastructure
runtime:
  name: nodejs
  options:
    typescript: true
description: Production infrastructure with Pulumi

# Backend configuration
backend:
  url: s3://my-pulumi-state-bucket

# Plugins
plugins:
  providers:
    - name: aws
      version: ">=6.0.0"
    - name: kubernetes
      version: ">=4.0.0"
```

```yaml
# Pulumi.prod.yaml
config:
  aws:region: us-east-1
  my-infrastructure:environment: production
  my-infrastructure:vpcCidr: "10.0.0.0/16"
  my-infrastructure:eksVersion: "1.29"
  my-infrastructure:rdsInstanceClass: db.r6g.large
  my-infrastructure:minNodes: 3
  my-infrastructure:maxNodes: 10
```

```json
// package.json
{
  "name": "my-infrastructure",
  "version": "1.0.0",
  "main": "index.ts",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@pulumi/awsx": "^2.0.0",
    "@pulumi/kubernetes": "^4.0.0",
    "@pulumi/random": "^4.0.0"
  }
}
```

## Main Infrastructure

```typescript
// index.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcComponent } from "./src/components/vpc";
import { EksComponent } from "./src/components/eks";
import { RdsComponent } from "./src/components/rds";
import { getConfig } from "./src/config";

const config = getConfig();
const stack = pulumi.getStack();

// Tags applied to all resources
const commonTags = {
    Environment: config.environment,
    Project: pulumi.getProject(),
    Stack: stack,
    ManagedBy: "pulumi",
};

// Create VPC
const vpc = new VpcComponent("main", {
    cidrBlock: config.vpcCidr,
    availabilityZones: config.availabilityZones,
    enableNatGateway: true,
    singleNatGateway: config.environment !== "production",
    tags: commonTags,
});

// Create EKS Cluster
const eks = new EksComponent("main", {
    vpcId: vpc.vpcId,
    subnetIds: vpc.privateSubnetIds,
    version: config.eksVersion,
    nodeGroups: [
        {
            name: "default",
            instanceType: config.nodeInstanceType,
            desiredCapacity: config.minNodes,
            minSize: config.minNodes,
            maxSize: config.maxNodes,
        },
    ],
    enableClusterAutoscaler: true,
    tags: commonTags,
});

// Create RDS Database
const rds = new RdsComponent("main", {
    vpcId: vpc.vpcId,
    subnetIds: vpc.privateSubnetIds,
    instanceClass: config.rdsInstanceClass,
    engine: "postgres",
    engineVersion: "16.1",
    databaseName: "myapp",
    allocatedStorage: 100,
    multiAz: config.environment === "production",
    tags: commonTags,
});

// Exports
export const vpcId = vpc.vpcId;
export const eksClusterName = eks.clusterName;
export const eksKubeconfig = pulumi.secret(eks.kubeconfig);
export const rdsEndpoint = rds.endpoint;
export const rdsSecretArn = rds.secretArn;
```

## VPC Component

```typescript
// src/components/vpc.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface VpcComponentArgs {
    cidrBlock: string;
    availabilityZones: string[];
    enableNatGateway?: boolean;
    singleNatGateway?: boolean;
    tags?: Record<string, string>;
}

export class VpcComponent extends pulumi.ComponentResource {
    public readonly vpcId: pulumi.Output<string>;
    public readonly publicSubnetIds: pulumi.Output<string>[];
    public readonly privateSubnetIds: pulumi.Output<string>[];
    public readonly natGatewayIds: pulumi.Output<string>[];

    constructor(
        name: string,
        args: VpcComponentArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super("custom:infrastructure:VpcComponent", name, {}, opts);

        const vpc = new awsx.ec2.Vpc(name, {
            cidrBlock: args.cidrBlock,
            numberOfAvailabilityZones: args.availabilityZones.length,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            natGateways: args.enableNatGateway
                ? {
                      strategy: args.singleNatGateway
                          ? awsx.ec2.NatGatewayStrategy.Single
                          : awsx.ec2.NatGatewayStrategy.OnePerAz,
                  }
                : undefined,
            subnetStrategy: awsx.ec2.SubnetAllocationStrategy.Auto,
            subnetSpecs: [
                {
                    type: awsx.ec2.SubnetType.Public,
                    cidrMask: 24,
                    tags: {
                        ...args.tags,
                        "kubernetes.io/role/elb": "1",
                    },
                },
                {
                    type: awsx.ec2.SubnetType.Private,
                    cidrMask: 24,
                    tags: {
                        ...args.tags,
                        "kubernetes.io/role/internal-elb": "1",
                    },
                },
            ],
            tags: args.tags,
        }, { parent: this });

        // VPC Flow Logs
        const flowLogBucket = new aws.s3.Bucket(`${name}-flow-logs`, {
            bucket: `${name}-vpc-flow-logs-${pulumi.getStack()}`,
            forceDestroy: true,
            tags: args.tags,
        }, { parent: this });

        new aws.ec2.FlowLog(`${name}-flow-log`, {
            vpcId: vpc.vpcId,
            logDestination: flowLogBucket.arn,
            logDestinationType: "s3",
            trafficType: "ALL",
            tags: args.tags,
        }, { parent: this });

        this.vpcId = vpc.vpcId;
        this.publicSubnetIds = vpc.publicSubnetIds;
        this.privateSubnetIds = vpc.privateSubnetIds;
        this.natGatewayIds = vpc.natGateways.apply(
            (nats) => nats?.map((n) => n.id) || []
        );

        this.registerOutputs({
            vpcId: this.vpcId,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}
```

## EKS Component

```typescript
// src/components/eks.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as k8s from "@pulumi/kubernetes";

export interface NodeGroupConfig {
    name: string;
    instanceType: string;
    desiredCapacity: number;
    minSize: number;
    maxSize: number;
    labels?: Record<string, string>;
    taints?: aws.types.input.eks.NodeGroupTaint[];
}

export interface EksComponentArgs {
    vpcId: pulumi.Input<string>;
    subnetIds: pulumi.Input<string>[];
    version: string;
    nodeGroups: NodeGroupConfig[];
    enableClusterAutoscaler?: boolean;
    enableMetricsServer?: boolean;
    tags?: Record<string, string>;
}

export class EksComponent extends pulumi.ComponentResource {
    public readonly clusterName: pulumi.Output<string>;
    public readonly kubeconfig: pulumi.Output<string>;
    public readonly oidcProviderArn: pulumi.Output<string>;
    public readonly oidcProviderUrl: pulumi.Output<string>;

    constructor(
        name: string,
        args: EksComponentArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super("custom:infrastructure:EksComponent", name, {}, opts);

        // Create EKS cluster
        const cluster = new eks.Cluster(name, {
            vpcId: args.vpcId,
            subnetIds: args.subnetIds,
            version: args.version,
            instanceType: args.nodeGroups[0].instanceType,
            desiredCapacity: args.nodeGroups[0].desiredCapacity,
            minSize: args.nodeGroups[0].minSize,
            maxSize: args.nodeGroups[0].maxSize,
            nodeAssociatePublicIpAddress: false,
            enabledClusterLogTypes: [
                "api",
                "audit",
                "authenticator",
                "controllerManager",
                "scheduler",
            ],
            tags: args.tags,
            createOidcProvider: true,
        }, { parent: this });

        // Create additional node groups
        for (const ng of args.nodeGroups.slice(1)) {
            new eks.ManagedNodeGroup(`${name}-${ng.name}`, {
                cluster: cluster,
                nodeGroupName: ng.name,
                instanceTypes: [ng.instanceType],
                scalingConfig: {
                    desiredSize: ng.desiredCapacity,
                    minSize: ng.minSize,
                    maxSize: ng.maxSize,
                },
                labels: ng.labels,
                taints: ng.taints,
                tags: args.tags,
            }, { parent: this });
        }

        // Create Kubernetes provider
        const k8sProvider = new k8s.Provider(`${name}-k8s`, {
            kubeconfig: cluster.kubeconfigJson,
        }, { parent: this });

        // Install metrics server
        if (args.enableMetricsServer !== false) {
            new k8s.helm.v3.Release(`${name}-metrics-server`, {
                chart: "metrics-server",
                repositoryOpts: {
                    repo: "https://kubernetes-sigs.github.io/metrics-server/",
                },
                namespace: "kube-system",
                values: {
                    args: ["--kubelet-insecure-tls"],
                },
            }, { provider: k8sProvider, parent: this });
        }

        // Install cluster autoscaler
        if (args.enableClusterAutoscaler) {
            const autoscalerRole = this.createAutoscalerRole(
                name,
                cluster,
                args.tags
            );

            new k8s.helm.v3.Release(`${name}-cluster-autoscaler`, {
                chart: "cluster-autoscaler",
                repositoryOpts: {
                    repo: "https://kubernetes.github.io/autoscaler",
                },
                namespace: "kube-system",
                values: {
                    autoDiscovery: {
                        clusterName: cluster.eksCluster.name,
                    },
                    awsRegion: aws.config.region,
                    rbac: {
                        serviceAccount: {
                            annotations: {
                                "eks.amazonaws.com/role-arn": autoscalerRole.arn,
                            },
                        },
                    },
                },
            }, { provider: k8sProvider, parent: this });
        }

        this.clusterName = cluster.eksCluster.name;
        this.kubeconfig = cluster.kubeconfigJson;
        this.oidcProviderArn = cluster.core.oidcProvider!.arn;
        this.oidcProviderUrl = cluster.core.oidcProvider!.url;

        this.registerOutputs({
            clusterName: this.clusterName,
            kubeconfig: this.kubeconfig,
        });
    }

    private createAutoscalerRole(
        name: string,
        cluster: eks.Cluster,
        tags?: Record<string, string>
    ): aws.iam.Role {
        const oidcProvider = cluster.core.oidcProvider!;

        const assumeRolePolicy = pulumi
            .all([oidcProvider.url, oidcProvider.arn])
            .apply(([url, arn]) =>
                aws.iam.getPolicyDocument({
                    statements: [
                        {
                            actions: ["sts:AssumeRoleWithWebIdentity"],
                            principals: [
                                {
                                    type: "Federated",
                                    identifiers: [arn],
                                },
                            ],
                            conditions: [
                                {
                                    test: "StringEquals",
                                    variable: `${url.replace(
                                        "https://",
                                        ""
                                    )}:sub`,
                                    values: [
                                        "system:serviceaccount:kube-system:cluster-autoscaler",
                                    ],
                                },
                            ],
                        },
                    ],
                })
            );

        const role = new aws.iam.Role(`${name}-autoscaler-role`, {
            assumeRolePolicy: assumeRolePolicy.json,
            tags,
        }, { parent: this });

        new aws.iam.RolePolicy(`${name}-autoscaler-policy`, {
            role: role.id,
            policy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "autoscaling:DescribeAutoScalingGroups",
                            "autoscaling:DescribeAutoScalingInstances",
                            "autoscaling:DescribeLaunchConfigurations",
                            "autoscaling:DescribeTags",
                            "autoscaling:SetDesiredCapacity",
                            "autoscaling:TerminateInstanceInAutoScalingGroup",
                            "ec2:DescribeLaunchTemplateVersions",
                            "ec2:DescribeInstanceTypes",
                        ],
                        Resource: "*",
                    },
                ],
            }),
        }, { parent: this });

        return role;
    }
}
```

## RDS Component

```typescript
// src/components/rds.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

export interface RdsComponentArgs {
    vpcId: pulumi.Input<string>;
    subnetIds: pulumi.Input<string>[];
    instanceClass: string;
    engine: "postgres" | "mysql";
    engineVersion: string;
    databaseName: string;
    allocatedStorage: number;
    multiAz?: boolean;
    tags?: Record<string, string>;
}

export class RdsComponent extends pulumi.ComponentResource {
    public readonly endpoint: pulumi.Output<string>;
    public readonly secretArn: pulumi.Output<string>;
    public readonly securityGroupId: pulumi.Output<string>;

    constructor(
        name: string,
        args: RdsComponentArgs,
        opts?: pulumi.ComponentResourceOptions
    ) {
        super("custom:infrastructure:RdsComponent", name, {}, opts);

        // Generate password
        const password = new random.RandomPassword(`${name}-password`, {
            length: 32,
            special: true,
            overrideSpecial: "!#$%&*()-_=+[]{}<>:?",
        }, { parent: this });

        // Create subnet group
        const subnetGroup = new aws.rds.SubnetGroup(`${name}-subnet-group`, {
            subnetIds: args.subnetIds,
            tags: args.tags,
        }, { parent: this });

        // Create security group
        const securityGroup = new aws.ec2.SecurityGroup(`${name}-sg`, {
            vpcId: args.vpcId,
            description: `Security group for ${name} RDS`,
            tags: args.tags,
        }, { parent: this });

        // Create parameter group
        const parameterGroup = new aws.rds.ParameterGroup(`${name}-params`, {
            family: `${args.engine}${args.engineVersion.split(".")[0]}`,
            parameters:
                args.engine === "postgres"
                    ? [
                          { name: "log_statement", value: "all" },
                          { name: "log_min_duration_statement", value: "1000" },
                      ]
                    : [
                          { name: "slow_query_log", value: "1" },
                          { name: "long_query_time", value: "1" },
                      ],
            tags: args.tags,
        }, { parent: this });

        // Create RDS instance
        const instance = new aws.rds.Instance(`${name}-instance`, {
            identifier: `${name}-${pulumi.getStack()}`,
            instanceClass: args.instanceClass,
            engine: args.engine,
            engineVersion: args.engineVersion,
            dbName: args.databaseName,
            username: "admin",
            password: password.result,
            allocatedStorage: args.allocatedStorage,
            maxAllocatedStorage: args.allocatedStorage * 2,
            storageType: "gp3",
            storageEncrypted: true,
            multiAz: args.multiAz,
            dbSubnetGroupName: subnetGroup.name,
            vpcSecurityGroupIds: [securityGroup.id],
            parameterGroupName: parameterGroup.name,
            backupRetentionPeriod: 7,
            backupWindow: "03:00-04:00",
            maintenanceWindow: "Mon:04:00-Mon:05:00",
            deletionProtection: true,
            skipFinalSnapshot: false,
            finalSnapshotIdentifier: `${name}-final-snapshot`,
            performanceInsightsEnabled: true,
            performanceInsightsRetentionPeriod: 7,
            enabledCloudwatchLogsExports:
                args.engine === "postgres"
                    ? ["postgresql", "upgrade"]
                    : ["error", "slowquery"],
            tags: args.tags,
        }, { parent: this });

        // Store credentials in Secrets Manager
        const secret = new aws.secretsmanager.Secret(`${name}-secret`, {
            name: `${name}-${pulumi.getStack()}-credentials`,
            tags: args.tags,
        }, { parent: this });

        new aws.secretsmanager.SecretVersion(`${name}-secret-version`, {
            secretId: secret.id,
            secretString: pulumi
                .all([instance.endpoint, instance.port, password.result])
                .apply(([endpoint, port, pass]) =>
                    JSON.stringify({
                        host: endpoint,
                        port: port,
                        database: args.databaseName,
                        username: "admin",
                        password: pass,
                        engine: args.engine,
                    })
                ),
        }, { parent: this });

        this.endpoint = instance.endpoint;
        this.secretArn = secret.arn;
        this.securityGroupId = securityGroup.id;

        this.registerOutputs({
            endpoint: this.endpoint,
            secretArn: this.secretArn,
        });
    }
}
```

## Configuration Module

```typescript
// src/config/index.ts
import * as pulumi from "@pulumi/pulumi";

export interface Config {
    environment: string;
    vpcCidr: string;
    availabilityZones: string[];
    eksVersion: string;
    nodeInstanceType: string;
    minNodes: number;
    maxNodes: number;
    rdsInstanceClass: string;
}

export function getConfig(): Config {
    const config = new pulumi.Config();
    const awsConfig = new pulumi.Config("aws");

    return {
        environment: config.require("environment"),
        vpcCidr: config.get("vpcCidr") || "10.0.0.0/16",
        availabilityZones: config.getObject<string[]>("availabilityZones") || [
            `${awsConfig.require("region")}a`,
            `${awsConfig.require("region")}b`,
            `${awsConfig.require("region")}c`,
        ],
        eksVersion: config.get("eksVersion") || "1.29",
        nodeInstanceType: config.get("nodeInstanceType") || "t3.medium",
        minNodes: config.getNumber("minNodes") || 2,
        maxNodes: config.getNumber("maxNodes") || 10,
        rdsInstanceClass: config.get("rdsInstanceClass") || "db.t3.medium",
    };
}
```

## Testing

```typescript
// __tests__/infrastructure.test.ts
import * as pulumi from "@pulumi/pulumi";

// Mock Pulumi runtime
pulumi.runtime.setMocks({
    newResource: function (args: pulumi.runtime.MockResourceArgs) {
        return {
            id: `${args.name}-id`,
            state: args.inputs,
        };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
        return args.inputs;
    },
});

describe("Infrastructure", () => {
    let infra: typeof import("../index");

    beforeAll(async () => {
        infra = await import("../index");
    });

    test("VPC ID is exported", async () => {
        const vpcId = await new Promise((resolve) =>
            infra.vpcId.apply(resolve)
        );
        expect(vpcId).toBeDefined();
    });

    test("EKS cluster name is exported", async () => {
        const clusterName = await new Promise((resolve) =>
            infra.eksClusterName.apply(resolve)
        );
        expect(clusterName).toBeDefined();
    });
});
```

## CLAUDE.md Integration

```markdown
# Pulumi TypeScript Infrastructure

## Commands
- `pulumi preview` - Preview changes
- `pulumi up` - Deploy infrastructure
- `pulumi destroy` - Tear down infrastructure
- `pulumi stack ls` - List stacks
- `pulumi config set key value` - Set config

## Stack Management
- `pulumi stack init dev` - Create new stack
- `pulumi stack select prod` - Switch stacks
- `pulumi stack export > backup.json` - Backup state

## Secrets
- `pulumi config set --secret dbPassword xxx` - Set secret
- Secrets are encrypted in state file

## Component Resources
- `VpcComponent` - VPC with subnets, NAT
- `EksComponent` - EKS cluster with node groups
- `RdsComponent` - RDS with secrets management
```

## AI Suggestions

1. **Add policy packs** - Implement CrossGuard policies
2. **Configure stack references** - Share outputs between stacks
3. **Add drift detection** - Detect manual changes
4. **Implement blue-green deployments** - Zero-downtime updates
5. **Add cost estimation** - Preview cost impact
6. **Configure automation API** - Programmatic deployments
7. **Add custom providers** - Extend Pulumi capabilities
8. **Implement state locking** - Prevent concurrent modifications
9. **Add resource transformations** - Apply global transformations
10. **Configure audit logging** - Track all changes
