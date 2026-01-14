# AWS CDK TypeScript Template

> Production-ready AWS CDK infrastructure with TypeScript for AWS-native deployments

## Overview

This template provides AWS CDK configurations with:
- TypeScript constructs and stacks
- L2 and L3 construct patterns
- Multi-environment deployments
- Custom constructs
- CI/CD pipeline integration

## Quick Start

```bash
# Create new CDK project
npx cdk init app --language typescript

# Install dependencies
npm install

# Synthesize CloudFormation
npx cdk synth

# Deploy stack
npx cdk deploy

# Destroy stack
npx cdk destroy
```

## Project Structure

```
cdk-project/
├── bin/
│   └── app.ts
├── lib/
│   ├── stacks/
│   │   ├── network-stack.ts
│   │   ├── compute-stack.ts
│   │   └── database-stack.ts
│   ├── constructs/
│   │   ├── vpc-construct.ts
│   │   ├── eks-construct.ts
│   │   └── rds-construct.ts
│   └── config/
│       └── environments.ts
├── test/
│   └── app.test.ts
├── cdk.json
├── package.json
└── tsconfig.json
```

## CDK Configuration

```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true
  }
}
```

```json
// package.json
{
  "name": "my-cdk-app",
  "version": "1.0.0",
  "bin": {
    "app": "bin/app.ts"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "aws-cdk": "^2.130.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.130.0",
    "constructs": "^10.0.0"
  }
}
```

## App Entry Point

```typescript
// bin/app.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { ComputeStack } from '../lib/stacks/compute-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { PipelineStack } from '../lib/stacks/pipeline-stack';
import { getEnvironmentConfig } from '../lib/config/environments';

const app = new cdk.App();

// Get environment from context
const envName = app.node.tryGetContext('env') || 'dev';
const config = getEnvironmentConfig(envName);

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || config.account,
  region: process.env.CDK_DEFAULT_REGION || config.region,
};

// Common tags
const tags = {
  Environment: envName,
  Project: 'MyApp',
  ManagedBy: 'CDK',
};

// Network Stack
const networkStack = new NetworkStack(app, `${envName}-NetworkStack`, {
  env,
  config,
  tags,
});

// Database Stack
const databaseStack = new DatabaseStack(app, `${envName}-DatabaseStack`, {
  env,
  config,
  vpc: networkStack.vpc,
  tags,
});

// Compute Stack
const computeStack = new ComputeStack(app, `${envName}-ComputeStack`, {
  env,
  config,
  vpc: networkStack.vpc,
  database: databaseStack.database,
  tags,
});

// Pipeline Stack (only for production)
if (envName === 'prod') {
  new PipelineStack(app, 'PipelineStack', {
    env,
  });
}

// Apply tags to all resources
Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

app.synth();
```

## Environment Configuration

```typescript
// lib/config/environments.ts
export interface EnvironmentConfig {
  account: string;
  region: string;
  vpcCidr: string;
  maxAzs: number;
  eksVersion: string;
  nodeInstanceType: string;
  minNodes: number;
  maxNodes: number;
  rdsInstanceType: string;
  multiAz: boolean;
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: '123456789012',
    region: 'us-east-1',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    eksVersion: '1.29',
    nodeInstanceType: 't3.medium',
    minNodes: 1,
    maxNodes: 3,
    rdsInstanceType: 'db.t3.medium',
    multiAz: false,
  },
  staging: {
    account: '123456789012',
    region: 'us-east-1',
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    eksVersion: '1.29',
    nodeInstanceType: 't3.large',
    minNodes: 2,
    maxNodes: 5,
    rdsInstanceType: 'db.r6g.large',
    multiAz: false,
  },
  prod: {
    account: '987654321098',
    region: 'us-east-1',
    vpcCidr: '10.2.0.0/16',
    maxAzs: 3,
    eksVersion: '1.29',
    nodeInstanceType: 'm6i.xlarge',
    minNodes: 3,
    maxNodes: 20,
    rdsInstanceType: 'db.r6g.xlarge',
    multiAz: true,
  },
};

export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const config = environments[env];
  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }
  return config;
}
```

## Network Stack

```typescript
// lib/stacks/network-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environments';

export interface NetworkStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  tags: Record<string, string>;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr(props.config.vpcCidr),
      maxAzs: props.config.maxAzs,
      natGateways: props.config.maxAzs,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
          mapPublicIpOnLaunch: false,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      flowLogs: {
        'FlowLog': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Tag subnets for EKS
    this.vpc.publicSubnets.forEach((subnet) => {
      cdk.Tags.of(subnet).add('kubernetes.io/role/elb', '1');
    });

    this.vpc.privateSubnets.forEach((subnet) => {
      cdk.Tags.of(subnet).add('kubernetes.io/role/internal-elb', '1');
    });

    // VPC Endpoints
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    this.vpc.addInterfaceEndpoint('ECRDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `${this.stackName}-VpcId`,
    });
  }
}
```

## Compute Stack (EKS)

```typescript
// lib/stacks/compute-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environments';
import { KubectlV29Layer } from '@aws-cdk/lambda-layer-kubectl-v29';

export interface ComputeStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.IVpc;
  database: rds.IDatabaseInstance;
  tags: Record<string, string>;
}

export class ComputeStack extends cdk.Stack {
  public readonly cluster: eks.ICluster;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // EKS Cluster
    const cluster = new eks.Cluster(this, 'EKSCluster', {
      version: eks.KubernetesVersion.of(props.config.eksVersion),
      vpc: props.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      defaultCapacity: 0,
      kubectlLayer: new KubectlV29Layer(this, 'KubectlLayer'),
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
      endpointAccess: eks.EndpointAccess.PRIVATE,
    });

    // Managed Node Group
    cluster.addNodegroupCapacity('DefaultNodeGroup', {
      instanceTypes: [new ec2.InstanceType(props.config.nodeInstanceType)],
      minSize: props.config.minNodes,
      maxSize: props.config.maxNodes,
      desiredSize: props.config.minNodes,
      diskSize: 100,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      labels: {
        'node-type': 'default',
      },
    });

    // Fargate Profile for system workloads
    cluster.addFargateProfile('CoreDnsFargate', {
      selectors: [
        { namespace: 'kube-system', labels: { 'k8s-app': 'kube-dns' } },
      ],
    });

    // IRSA for application
    const appServiceAccount = cluster.addServiceAccount('AppServiceAccount', {
      name: 'app-service-account',
      namespace: 'default',
    });

    // Grant database access
    props.database.secret?.grantRead(appServiceAccount);

    // Install AWS Load Balancer Controller
    this.installAwsLoadBalancerController(cluster);

    // Install Cluster Autoscaler
    this.installClusterAutoscaler(cluster, props.config);

    // Install Metrics Server
    cluster.addHelmChart('MetricsServer', {
      chart: 'metrics-server',
      repository: 'https://kubernetes-sigs.github.io/metrics-server/',
      namespace: 'kube-system',
      release: 'metrics-server',
    });

    this.cluster = cluster;

    // Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      exportName: `${this.stackName}-ClusterName`,
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: cluster.clusterArn,
      exportName: `${this.stackName}-ClusterArn`,
    });
  }

  private installAwsLoadBalancerController(cluster: eks.Cluster): void {
    const serviceAccount = cluster.addServiceAccount('AwsLoadBalancerController', {
      name: 'aws-load-balancer-controller',
      namespace: 'kube-system',
    });

    serviceAccount.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy')
    );

    // Add inline policy for LB controller
    serviceAccount.role.attachInlinePolicy(
      new iam.Policy(this, 'AwsLoadBalancerControllerPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:CreateTags',
              'ec2:DeleteTags',
              'ec2:DescribeAccountAttributes',
              'ec2:DescribeAddresses',
              'ec2:DescribeInternetGateways',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeSubnets',
              'ec2:DescribeVpcs',
              'elasticloadbalancing:*',
              'iam:CreateServiceLinkedRole',
              'cognito-idp:DescribeUserPoolClient',
              'acm:ListCertificates',
              'acm:DescribeCertificate',
              'waf-regional:*',
              'wafv2:*',
              'shield:*',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    cluster.addHelmChart('AwsLoadBalancerController', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      namespace: 'kube-system',
      release: 'aws-load-balancer-controller',
      values: {
        clusterName: cluster.clusterName,
        serviceAccount: {
          create: false,
          name: serviceAccount.serviceAccountName,
        },
      },
    });
  }

  private installClusterAutoscaler(
    cluster: eks.Cluster,
    config: EnvironmentConfig
  ): void {
    const serviceAccount = cluster.addServiceAccount('ClusterAutoscaler', {
      name: 'cluster-autoscaler',
      namespace: 'kube-system',
    });

    serviceAccount.role.attachInlinePolicy(
      new iam.Policy(this, 'ClusterAutoscalerPolicy', {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'autoscaling:DescribeAutoScalingGroups',
              'autoscaling:DescribeAutoScalingInstances',
              'autoscaling:DescribeLaunchConfigurations',
              'autoscaling:DescribeTags',
              'autoscaling:SetDesiredCapacity',
              'autoscaling:TerminateInstanceInAutoScalingGroup',
              'ec2:DescribeLaunchTemplateVersions',
              'ec2:DescribeInstanceTypes',
            ],
            resources: ['*'],
          }),
        ],
      })
    );

    cluster.addHelmChart('ClusterAutoscaler', {
      chart: 'cluster-autoscaler',
      repository: 'https://kubernetes.github.io/autoscaler',
      namespace: 'kube-system',
      release: 'cluster-autoscaler',
      values: {
        autoDiscovery: {
          clusterName: cluster.clusterName,
        },
        awsRegion: cdk.Stack.of(this).region,
        rbac: {
          serviceAccount: {
            create: false,
            name: serviceAccount.serviceAccountName,
          },
        },
      },
    });
  }
}
```

## Database Stack

```typescript
// lib/stacks/database-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environments';

export interface DatabaseStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  vpc: ec2.IVpc;
  tags: Record<string, string>;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.IDatabaseInstance;
  public readonly secret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Parameter Group
    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_1,
      }),
      parameters: {
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
        'shared_preload_libraries': 'pg_stat_statements',
      },
    });

    // RDS Instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_1,
      }),
      instanceType: new ec2.InstanceType(props.config.rdsInstanceType),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [securityGroup],
      parameterGroup,
      databaseName: 'myapp',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `${this.stackName}/rds-credentials`,
      }),
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: props.config.multiAz,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'Mon:04:00-Mon:05:00',
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      monitoringInterval: cdk.Duration.seconds(60),
    });

    this.secret = this.database.secret!;

    // Allow access from private subnets
    props.vpc.privateSubnets.forEach((subnet) => {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(5432),
        'Allow PostgreSQL from private subnets'
      );
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.secret.secretArn,
      exportName: `${this.stackName}-DatabaseSecretArn`,
    });
  }
}
```

## CI/CD Pipeline Stack

```typescript
// lib/stacks/pipeline-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Source repository
    const repository = new codecommit.Repository(this, 'Repository', {
      repositoryName: 'my-infrastructure',
      description: 'Infrastructure as Code repository',
    });

    // Build project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm install -g aws-cdk',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
              'cdk synth',
            ],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: ['**/*'],
        },
      }),
    });

    // Pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'InfrastructurePipeline',
      crossAccountKeys: true,
    });

    // Source stage
    const sourceOutput = new codepipeline.Artifact();
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit',
          repository,
          branch: 'main',
          output: sourceOutput,
        }),
      ],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact();
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Deploy to staging
    pipeline.addStage({
      stageName: 'DeployStaging',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'DeployNetwork',
          stackName: 'staging-NetworkStack',
          templatePath: buildOutput.atPath('staging-NetworkStack.template.json'),
          adminPermissions: true,
        }),
      ],
    });

    // Manual approval
    pipeline.addStage({
      stageName: 'Approval',
      actions: [
        new codepipeline_actions.ManualApprovalAction({
          actionName: 'ApproveProduction',
        }),
      ],
    });

    // Deploy to production
    pipeline.addStage({
      stageName: 'DeployProduction',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'DeployNetwork',
          stackName: 'prod-NetworkStack',
          templatePath: buildOutput.atPath('prod-NetworkStack.template.json'),
          adminPermissions: true,
        }),
      ],
    });
  }
}
```

## Testing

```typescript
// test/app.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { NetworkStack } from '../lib/stacks/network-stack';

describe('NetworkStack', () => {
  const app = new cdk.App();
  const stack = new NetworkStack(app, 'TestNetworkStack', {
    config: {
      account: '123456789012',
      region: 'us-east-1',
      vpcCidr: '10.0.0.0/16',
      maxAzs: 2,
      eksVersion: '1.29',
      nodeInstanceType: 't3.medium',
      minNodes: 1,
      maxNodes: 3,
      rdsInstanceType: 'db.t3.medium',
      multiAz: false,
    },
    tags: { Environment: 'test' },
  });

  const template = Template.fromStack(stack);

  test('VPC is created', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('NAT Gateways are created', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('VPC Endpoints are created', () => {
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('.*s3$'),
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# AWS CDK TypeScript

## Commands
- `cdk synth` - Synthesize CloudFormation
- `cdk deploy` - Deploy stack
- `cdk deploy --all` - Deploy all stacks
- `cdk destroy` - Destroy stack
- `cdk diff` - Compare with deployed
- `cdk watch` - Hot deploy on changes

## Environments
- `cdk deploy -c env=dev` - Deploy to dev
- `cdk deploy -c env=prod` - Deploy to prod

## Stack Management
- NetworkStack: VPC, subnets, endpoints
- ComputeStack: EKS cluster, node groups
- DatabaseStack: RDS PostgreSQL

## Best Practices
1. Use L2/L3 constructs when possible
2. Define custom constructs for reuse
3. Use context for environment config
4. Enable deletion protection in prod
```

## AI Suggestions

1. **Add CDK Pipelines** - Self-mutating pipelines
2. **Implement aspects** - Cross-cutting concerns
3. **Add stack dependencies** - Explicit ordering
4. **Configure drift detection** - Detect manual changes
5. **Add cost allocation tags** - Track spending
6. **Implement feature flags** - Conditional resources
7. **Add custom resources** - Lambda-backed resources
8. **Configure stack policies** - Prevent accidental updates
9. **Add security scanning** - cdk-nag for security
10. **Implement blue-green deployments** - Zero-downtime updates
