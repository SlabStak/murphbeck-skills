# AWS CloudFormation Template

> Production-ready CloudFormation templates with nested stacks, cross-stack references, and best practices

## Overview

This template provides CloudFormation configurations with:
- Nested stack architecture
- Cross-stack references
- Parameter validation
- Conditions and mappings
- Custom resources

## Quick Start

```bash
# Validate template
aws cloudformation validate-template --template-body file://template.yaml

# Create stack
aws cloudformation create-stack \
  --stack-name my-app \
  --template-body file://template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Update stack
aws cloudformation update-stack \
  --stack-name my-app \
  --template-body file://template.yaml

# Delete stack
aws cloudformation delete-stack --stack-name my-app
```

## Project Structure

```
cloudformation/
├── main.yaml                    # Root stack
├── nested/
│   ├── vpc.yaml                # VPC resources
│   ├── security.yaml           # Security groups, IAM
│   ├── compute.yaml            # EC2, ECS, EKS
│   ├── database.yaml           # RDS, DynamoDB
│   └── storage.yaml            # S3, EFS
├── modules/
│   └── custom-resource/        # Lambda-backed resources
├── parameters/
│   ├── dev.json
│   ├── staging.json
│   └── prod.json
└── scripts/
    └── deploy.sh
```

## Main Stack Template

```yaml
# main.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production infrastructure - Main Stack'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - Environment
          - ProjectName
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCidr
          - AvailabilityZones
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBInstanceClass
          - DBAllocatedStorage

Parameters:
  Environment:
    Type: String
    AllowedValues:
      - development
      - staging
      - production
    Default: development
    Description: Environment name

  ProjectName:
    Type: String
    Default: myapp
    Description: Project name for resource naming

  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$
    Description: VPC CIDR block

  AvailabilityZones:
    Type: List<AWS::EC2::AvailabilityZone::Name>
    Description: List of Availability Zones

  DBInstanceClass:
    Type: String
    Default: db.t3.medium
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.r6g.large
      - db.r6g.xlarge
    Description: RDS instance class

  DBAllocatedStorage:
    Type: Number
    Default: 100
    MinValue: 20
    MaxValue: 1000
    Description: RDS allocated storage in GB

  S3BucketName:
    Type: String
    Default: ''
    Description: S3 bucket for nested templates (leave empty for same region)

Mappings:
  EnvironmentMap:
    development:
      InstanceType: t3.small
      MultiAZ: 'false'
      MinCapacity: '1'
      MaxCapacity: '2'
    staging:
      InstanceType: t3.medium
      MultiAZ: 'false'
      MinCapacity: '2'
      MaxCapacity: '4'
    production:
      InstanceType: m6i.large
      MultiAZ: 'true'
      MinCapacity: '3'
      MaxCapacity: '10'

Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  UseS3Bucket: !Not [!Equals [!Ref S3BucketName, '']]

Resources:
  # VPC Stack
  VpcStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !If
        - UseS3Bucket
        - !Sub 'https://${S3BucketName}.s3.${AWS::Region}.amazonaws.com/nested/vpc.yaml'
        - !Sub 'https://s3.${AWS::Region}.amazonaws.com/${AWS::StackName}-templates/nested/vpc.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VpcCidr: !Ref VpcCidr
        AvailabilityZones: !Join [',', !Ref AvailabilityZones]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName

  # Security Stack
  SecurityStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: VpcStack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/${AWS::StackName}-templates/nested/security.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VpcId: !GetAtt VpcStack.Outputs.VpcId
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Database Stack
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - VpcStack
      - SecurityStack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/${AWS::StackName}-templates/nested/database.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VpcId: !GetAtt VpcStack.Outputs.VpcId
        PrivateSubnetIds: !GetAtt VpcStack.Outputs.PrivateSubnetIds
        DatabaseSecurityGroupId: !GetAtt SecurityStack.Outputs.DatabaseSecurityGroupId
        DBInstanceClass: !Ref DBInstanceClass
        DBAllocatedStorage: !Ref DBAllocatedStorage
        MultiAZ: !FindInMap [EnvironmentMap, !Ref Environment, MultiAZ]
      Tags:
        - Key: Environment
          Value: !Ref Environment

  # Compute Stack
  ComputeStack:
    Type: AWS::CloudFormation::Stack
    DependsOn:
      - VpcStack
      - SecurityStack
      - DatabaseStack
    Properties:
      TemplateURL: !Sub 'https://s3.${AWS::Region}.amazonaws.com/${AWS::StackName}-templates/nested/compute.yaml'
      Parameters:
        Environment: !Ref Environment
        ProjectName: !Ref ProjectName
        VpcId: !GetAtt VpcStack.Outputs.VpcId
        PrivateSubnetIds: !GetAtt VpcStack.Outputs.PrivateSubnetIds
        PublicSubnetIds: !GetAtt VpcStack.Outputs.PublicSubnetIds
        AppSecurityGroupId: !GetAtt SecurityStack.Outputs.AppSecurityGroupId
        InstanceType: !FindInMap [EnvironmentMap, !Ref Environment, InstanceType]
        MinCapacity: !FindInMap [EnvironmentMap, !Ref Environment, MinCapacity]
        MaxCapacity: !FindInMap [EnvironmentMap, !Ref Environment, MaxCapacity]
        DatabaseEndpoint: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
        DatabaseSecretArn: !GetAtt DatabaseStack.Outputs.DatabaseSecretArn
      Tags:
        - Key: Environment
          Value: !Ref Environment

Outputs:
  VpcId:
    Description: VPC ID
    Value: !GetAtt VpcStack.Outputs.VpcId
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS
    Value: !GetAtt ComputeStack.Outputs.LoadBalancerDNS
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt DatabaseStack.Outputs.DatabaseEndpoint
    Export:
      Name: !Sub '${AWS::StackName}-DatabaseEndpoint'
```

## VPC Nested Stack

```yaml
# nested/vpc.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC and networking resources'

Parameters:
  Environment:
    Type: String
  ProjectName:
    Type: String
  VpcCidr:
    Type: String
  AvailabilityZones:
    Type: CommaDelimitedList

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-vpc'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-igw'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !Ref AvailabilityZones]
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-1'
        - Key: kubernetes.io/role/elb
          Value: '1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !Ref AvailabilityZones]
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-2'
        - Key: kubernetes.io/role/elb
          Value: '1'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !Ref AvailabilityZones]
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-1'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !Ref AvailabilityZones]
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-2'
        - Key: kubernetes.io/role/internal-elb
          Value: '1'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-nat-1'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-private-rt'

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # VPC Flow Logs
  FlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: FlowLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  FlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${ProjectName}-${Environment}'
      RetentionInDays: 30

  FlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt FlowLogRole.Arn
      LogGroupName: !Ref FlowLogGroup
      ResourceId: !Ref VPC
      ResourceType: VPC
      TrafficType: ALL

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC

  PublicSubnetIds:
    Description: Public subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]

  PrivateSubnetIds:
    Description: Private subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
```

## Database Nested Stack

```yaml
# nested/database.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'RDS database resources'

Parameters:
  Environment:
    Type: String
  ProjectName:
    Type: String
  VpcId:
    Type: String
  PrivateSubnetIds:
    Type: CommaDelimitedList
  DatabaseSecurityGroupId:
    Type: String
  DBInstanceClass:
    Type: String
  DBAllocatedStorage:
    Type: Number
  MultiAZ:
    Type: String

Conditions:
  IsMultiAZ: !Equals [!Ref MultiAZ, 'true']

Resources:
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub '${ProjectName}-${Environment} DB subnet group'
      SubnetIds: !Ref PrivateSubnetIds
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-subnet-group'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Family: postgres16
      Description: !Sub '${ProjectName}-${Environment} parameter group'
      Parameters:
        log_statement: all
        log_min_duration_statement: '1000'
        shared_preload_libraries: pg_stat_statements
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db-params'

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${ProjectName}-${Environment}-db-credentials'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub '${ProjectName}-${Environment}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: postgres
      EngineVersion: '16.1'
      DBName: myapp
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: !Ref DBAllocatedStorage
      MaxAllocatedStorage: !Ref DBAllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: !If [IsMultiAZ, true, false]
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBParameterGroupName: !Ref DBParameterGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroupId
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'Mon:04:00-Mon:05:00'
      DeletionProtection: true
      EnablePerformanceInsights: true
      PerformanceInsightsRetentionPeriod: 7
      EnableCloudwatchLogsExports:
        - postgresql
        - upgrade
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-db'

  # Update secret with connection info
  DBSecretAttachment:
    Type: AWS::SecretsManager::SecretTargetAttachment
    Properties:
      SecretId: !Ref DBSecret
      TargetId: !Ref DBInstance
      TargetType: AWS::RDS::DBInstance

Outputs:
  DatabaseEndpoint:
    Description: RDS endpoint
    Value: !GetAtt DBInstance.Endpoint.Address

  DatabaseSecretArn:
    Description: Database secret ARN
    Value: !Ref DBSecret
```

## Custom Resource (Lambda)

```yaml
# modules/custom-resource/template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: 'Custom resource for DNS validation'

Resources:
  CustomResourceFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: python3.11
      Timeout: 300
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - route53:ChangeResourceRecordSets
                - route53:GetHostedZone
              Resource: '*'
      InlineCode: |
        import boto3
        import cfnresponse
        import json

        def handler(event, context):
            print(json.dumps(event))

            try:
                if event['RequestType'] == 'Delete':
                    cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                    return

                # Custom logic here
                hosted_zone_id = event['ResourceProperties']['HostedZoneId']
                record_name = event['ResourceProperties']['RecordName']
                record_value = event['ResourceProperties']['RecordValue']

                route53 = boto3.client('route53')

                response = route53.change_resource_record_sets(
                    HostedZoneId=hosted_zone_id,
                    ChangeBatch={
                        'Changes': [{
                            'Action': 'UPSERT',
                            'ResourceRecordSet': {
                                'Name': record_name,
                                'Type': 'CNAME',
                                'TTL': 300,
                                'ResourceRecords': [{'Value': record_value}]
                            }
                        }]
                    }
                )

                cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                    'ChangeId': response['ChangeInfo']['Id']
                })

            except Exception as e:
                print(f'Error: {str(e)}')
                cfnresponse.send(event, context, cfnresponse.FAILED, {
                    'Error': str(e)
                })

Outputs:
  FunctionArn:
    Description: Custom resource function ARN
    Value: !GetAtt CustomResourceFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CustomResourceArn'
```

## Deploy Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-development}
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="myapp-${ENVIRONMENT}"
TEMPLATE_BUCKET="${STACK_NAME}-templates"

echo "Deploying to ${ENVIRONMENT} in ${REGION}"

# Create S3 bucket for templates if it doesn't exist
aws s3 mb "s3://${TEMPLATE_BUCKET}" --region "${REGION}" 2>/dev/null || true

# Upload nested templates
aws s3 sync ./nested "s3://${TEMPLATE_BUCKET}/nested" --delete

# Deploy main stack
aws cloudformation deploy \
  --template-file main.yaml \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    Environment="${ENVIRONMENT}" \
    S3BucketName="${TEMPLATE_BUCKET}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --region "${REGION}" \
  --tags \
    Environment="${ENVIRONMENT}" \
    Project=myapp

echo "Deployment complete!"
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query 'Stacks[0].Outputs' \
  --output table
```

## CLAUDE.md Integration

```markdown
# AWS CloudFormation

## Commands
- `aws cloudformation validate-template --template-body file://template.yaml`
- `aws cloudformation create-stack --stack-name name --template-body file://template.yaml`
- `aws cloudformation update-stack --stack-name name --template-body file://template.yaml`
- `aws cloudformation delete-stack --stack-name name`
- `aws cloudformation describe-stacks --stack-name name`

## Capabilities
- `CAPABILITY_IAM` - Create IAM resources
- `CAPABILITY_NAMED_IAM` - Create named IAM resources
- `CAPABILITY_AUTO_EXPAND` - Macros and nested stacks

## Intrinsic Functions
- `!Ref` - Reference parameter or resource
- `!GetAtt` - Get resource attribute
- `!Sub` - String substitution
- `!Join` - Join strings
- `!If` - Conditional value
- `!FindInMap` - Look up mapping value

## Best Practices
1. Use nested stacks for modularity
2. Export values for cross-stack references
3. Use parameters for environment config
4. Enable deletion protection in production
```

## AI Suggestions

1. **Add StackSets** - Multi-account/region deployments
2. **Implement change sets** - Preview changes before deploy
3. **Add drift detection** - Detect manual changes
4. **Configure stack policies** - Prevent accidental updates
5. **Add resource import** - Import existing resources
6. **Implement macros** - Template transformations
7. **Add cfn-lint** - Validate templates in CI
8. **Configure rollback triggers** - Auto-rollback on alarms
9. **Add cost estimation** - Preview cost impact
10. **Implement blue-green deployments** - Zero-downtime updates
