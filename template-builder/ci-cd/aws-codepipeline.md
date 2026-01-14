# AWS CodePipeline Configuration Template

> Production-ready AWS CodePipeline configurations for CI/CD

## Overview

This template provides AWS CodePipeline configurations with:
- Multi-stage pipelines
- CodeBuild integration
- CodeDeploy strategies
- Cross-account deployments
- CDK/CloudFormation definitions

## Quick Start

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install

# Create pipeline
aws codepipeline create-pipeline --cli-input-json file://pipeline.json

# Start pipeline execution
aws codepipeline start-pipeline-execution --name my-pipeline

# Get pipeline state
aws codepipeline get-pipeline-state --name my-pipeline
```

## CodeBuild Configuration

```yaml
# buildspec.yml
version: 0.2

env:
  variables:
    NODE_ENV: production
  parameter-store:
    NPM_TOKEN: /myapp/npm-token
  secrets-manager:
    DATABASE_URL: myapp/database:url

phases:
  install:
    runtime-versions:
      nodejs: 20
    commands:
      - echo "Installing dependencies..."
      - npm ci

  pre_build:
    commands:
      - echo "Running pre-build steps..."
      - npm run lint
      - npm run typecheck

  build:
    commands:
      - echo "Building application..."
      - npm run build
      - npm test -- --coverage

  post_build:
    commands:
      - echo "Running post-build steps..."
      - |
        if [ "$CODEBUILD_BUILD_SUCCEEDING" = "1" ]; then
          echo "Build succeeded!"
        else
          echo "Build failed!"
          exit 1
        fi

reports:
  jest-reports:
    files:
      - 'test-results/junit.xml'
    file-format: JUNITXML

  coverage-reports:
    files:
      - 'coverage/clover.xml'
    file-format: CLOVERXML

artifacts:
  files:
    - dist/**/*
    - package.json
    - package-lock.json
    - appspec.yml
    - scripts/**/*
  name: build-$(AWS_REGION)-$(CODEBUILD_BUILD_NUMBER)
  discard-paths: no

cache:
  paths:
    - 'node_modules/**/*'
    - '.npm/**/*'
```

## Docker Build Spec

```yaml
# buildspec-docker.yml
version: 0.2

env:
  variables:
    IMAGE_REPO_NAME: myapp
    AWS_DEFAULT_REGION: us-east-1
  parameter-store:
    DOCKER_HUB_USERNAME: /docker/username
    DOCKER_HUB_PASSWORD: /docker/password

phases:
  pre_build:
    commands:
      - echo "Logging in to Amazon ECR..."
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME

  build:
    commands:
      - echo "Building Docker image..."
      - docker build -t $REPOSITORY_URI:latest .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG

  post_build:
    commands:
      - echo "Pushing Docker image..."
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo "Writing image definitions file..."
      - printf '[{"name":"myapp","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
      - cat imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
    - taskdef.json
    - appspec.yaml
```

## CDK Pipeline Definition

```typescript
// lib/pipeline-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECR Repository
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: 'myapp',
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          rulePriority: 1,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    // Source artifact
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // Source action
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'myorg',
      repo: 'myapp',
      branch: 'main',
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput,
      trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
    });

    // Build project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: 'myapp-build',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true, // Required for Docker
        computeType: codebuild.ComputeType.MEDIUM,
      },
      environmentVariables: {
        AWS_ACCOUNT_ID: {
          value: this.account,
        },
        AWS_DEFAULT_REGION: {
          value: this.region,
        },
        IMAGE_REPO_NAME: {
          value: repository.repositoryName,
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec-docker.yml'),
      cache: codebuild.Cache.local(
        codebuild.LocalCacheMode.DOCKER_LAYER,
        codebuild.LocalCacheMode.CUSTOM
      ),
    });

    // Grant ECR permissions
    repository.grantPullPush(buildProject);

    // Build action
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Build',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // Test project
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      projectName: 'myapp-test',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': { nodejs: 20 },
            commands: ['npm ci'],
          },
          build: {
            commands: [
              'npm run lint',
              'npm run typecheck',
              'npm test -- --coverage',
            ],
          },
        },
        reports: {
          'test-reports': {
            files: ['test-results/junit.xml'],
            'file-format': 'JUNITXML',
          },
        },
      }),
    });

    // Deploy to staging
    const deployToStagingAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy_Staging',
      service: ecs.FargateService.fromFargateServiceAttributes(
        this,
        'StagingService',
        {
          cluster: ecs.Cluster.fromClusterArn(
            this,
            'StagingCluster',
            `arn:aws:ecs:${this.region}:${this.account}:cluster/staging`
          ),
          serviceName: 'myapp',
        }
      ) as ecs.FargateService,
      input: buildOutput,
    });

    // Manual approval
    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve_Production',
      notifyEmails: ['team@example.com'],
      additionalInformation: 'Please review staging deployment before approving production.',
    });

    // Deploy to production
    const deployToProductionAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'Deploy_Production',
      service: ecs.FargateService.fromFargateServiceAttributes(
        this,
        'ProductionService',
        {
          cluster: ecs.Cluster.fromClusterArn(
            this,
            'ProductionCluster',
            `arn:aws:ecs:${this.region}:${this.account}:cluster/production`
          ),
          serviceName: 'myapp',
        }
      ) as ecs.FargateService,
      input: buildOutput,
    });

    // Create pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'myapp-pipeline',
      crossAccountKeys: true,
      restartExecutionOnUpdate: true,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Test',
              project: testProject,
              input: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Deploy_Staging',
          actions: [deployToStagingAction],
        },
        {
          stageName: 'Approval',
          actions: [manualApprovalAction],
        },
        {
          stageName: 'Deploy_Production',
          actions: [deployToProductionAction],
        },
      ],
    });

    // Pipeline notifications
    pipeline.notifyOn('PipelineNotification',
      new cdk.aws_codestarnotifications.NotificationRule(this, 'Notification', {
        source: pipeline,
        events: [
          'codepipeline-pipeline-pipeline-execution-failed',
          'codepipeline-pipeline-pipeline-execution-succeeded',
        ],
        targets: [
          new cdk.aws_sns.Topic(this, 'NotificationTopic'),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: repository.repositoryUri,
    });
  }
}
```

## CloudFormation Pipeline

```yaml
# pipeline.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CI/CD Pipeline

Parameters:
  GitHubOwner:
    Type: String
  GitHubRepo:
    Type: String
  GitHubBranch:
    Type: String
    Default: main
  GitHubToken:
    Type: String
    NoEcho: true

Resources:
  # S3 Bucket for artifacts
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: CleanupOldArtifacts
            Status: Enabled
            ExpirationInDays: 30

  # CodeBuild Role
  CodeBuildRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codebuild.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
      Policies:
        - PolicyName: CodeBuildPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub ${ArtifactBucket.Arn}/*
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: '*'

  # CodeBuild Project
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: myapp-build
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:5.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec.yml
      Cache:
        Type: LOCAL
        Modes:
          - LOCAL_DOCKER_LAYER_CACHE
          - LOCAL_SOURCE_CACHE

  # Test Project
  TestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: myapp-test
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:5.0
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                nodejs: 20
              commands:
                - npm ci
            build:
              commands:
                - npm run lint
                - npm run typecheck
                - npm test -- --coverage
          reports:
            test-reports:
              files:
                - 'test-results/junit.xml'
              file-format: JUNITXML

  # CodePipeline Role
  PipelineRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: codepipeline.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: PipelinePolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub ${ArtifactBucket.Arn}/*
              - Effect: Allow
                Action:
                  - codebuild:BatchGetBuilds
                  - codebuild:StartBuild
                Resource:
                  - !GetAtt BuildProject.Arn
                  - !GetAtt TestProject.Arn
              - Effect: Allow
                Action:
                  - ecs:*
                  - ecr:*
                Resource: '*'

  # Pipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: myapp-pipeline
      RoleArn: !GetAtt PipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        - Name: Source
          Actions:
            - Name: Source
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: '1'
              Configuration:
                Owner: !Ref GitHubOwner
                Repo: !Ref GitHubRepo
                Branch: !Ref GitHubBranch
                OAuthToken: !Ref GitHubToken
                PollForSourceChanges: false
              OutputArtifacts:
                - Name: SourceOutput
              RunOrder: 1

        - Name: Test
          Actions:
            - Name: Test
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref TestProject
              InputArtifacts:
                - Name: SourceOutput
              RunOrder: 1

        - Name: Build
          Actions:
            - Name: Build
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: '1'
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

        - Name: DeployStaging
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              Configuration:
                ClusterName: staging
                ServiceName: myapp
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

        - Name: Approval
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: '1'
              Configuration:
                NotificationArn: !Ref ApprovalTopic
                CustomData: 'Please review staging and approve for production'
              RunOrder: 1

        - Name: DeployProduction
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: '1'
              Configuration:
                ClusterName: production
                ServiceName: myapp
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildOutput
              RunOrder: 1

  # GitHub Webhook
  Webhook:
    Type: AWS::CodePipeline::Webhook
    Properties:
      Authentication: GITHUB_HMAC
      AuthenticationConfiguration:
        SecretToken: !Ref GitHubToken
      Filters:
        - JsonPath: $.ref
          MatchEquals: refs/heads/{Branch}
      TargetPipeline: !Ref Pipeline
      TargetAction: Source
      TargetPipelineVersion: !GetAtt Pipeline.Version
      RegisterWithThirdParty: true

  # Approval Topic
  ApprovalTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: pipeline-approval
      Subscription:
        - Endpoint: team@example.com
          Protocol: email

Outputs:
  PipelineUrl:
    Value: !Sub https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${Pipeline}/view
  ArtifactBucket:
    Value: !Ref ArtifactBucket
```

## CodeDeploy AppSpec

```yaml
# appspec.yml (EC2/On-Premises)
version: 0.0
os: linux

files:
  - source: /
    destination: /var/www/myapp
    overwrite: yes

permissions:
  - object: /var/www/myapp
    pattern: '**'
    owner: www-data
    group: www-data
    mode: 755

hooks:
  BeforeInstall:
    - location: scripts/before_install.sh
      timeout: 300
      runas: root

  AfterInstall:
    - location: scripts/after_install.sh
      timeout: 300
      runas: root

  ApplicationStart:
    - location: scripts/application_start.sh
      timeout: 300
      runas: root

  ValidateService:
    - location: scripts/validate_service.sh
      timeout: 300
      runas: root
```

```yaml
# appspec.yaml (ECS Blue/Green)
version: 0.0

Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: <TASK_DEFINITION>
        LoadBalancerInfo:
          ContainerName: myapp
          ContainerPort: 3000
        PlatformVersion: LATEST

Hooks:
  - BeforeInstall: BeforeInstallHook
  - AfterInstall: AfterInstallHook
  - AfterAllowTestTraffic: TestTrafficHook
  - BeforeAllowTraffic: BeforeAllowTrafficHook
  - AfterAllowTraffic: AfterAllowTrafficHook
```

## CLAUDE.md Integration

```markdown
# AWS CodePipeline

## Commands
- `aws codepipeline start-pipeline-execution --name <name>` - Start pipeline
- `aws codepipeline get-pipeline-state --name <name>` - Get state
- `aws codepipeline retry-stage-execution` - Retry failed stage
- `aws codebuild start-build --project-name <name>` - Start build

## Key Components
- **CodePipeline**: Orchestration service
- **CodeBuild**: Build service (buildspec.yml)
- **CodeDeploy**: Deployment service (appspec.yml)
- **ECR**: Container registry

## Artifacts
- Source artifacts from GitHub/CodeCommit
- Build artifacts stored in S3
- Image definitions for ECS

## Deployment Strategies
- In-place (EC2)
- Blue/Green (ECS, Lambda)
- Canary (Lambda)
```

## AI Suggestions

1. **Configure caching** - Use S3 and local caching
2. **Add build reports** - JUnit, coverage reports
3. **Implement cross-account** - Deploy to multiple accounts
4. **Configure webhooks** - GitHub/CodeCommit triggers
5. **Add manual approval** - Production gates
6. **Implement blue/green** - ECS blue/green deploys
7. **Configure notifications** - SNS/Slack alerts
8. **Add security scanning** - CodeGuru, ECR scanning
9. **Implement rollback** - Automatic rollback on failure
10. **Configure environments** - Separate staging/production
