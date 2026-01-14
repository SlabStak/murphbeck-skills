# Jenkins Pipeline Template

> Production-ready Jenkins declarative and scripted pipelines with shared libraries and best practices

## Overview

This template provides Jenkins pipeline configurations with:
- Declarative and scripted pipelines
- Shared library patterns
- Multi-branch pipelines
- Kubernetes agents
- Blue Ocean compatible

## Quick Start

```bash
# Create Jenkinsfile
cp Jenkinsfile ./

# Create shared library
mkdir -p vars resources src

# Configure Jenkins
# Manage Jenkins > Configure System > Global Pipeline Libraries
```

## Declarative Pipeline

```groovy
// Jenkinsfile
@Library('shared-library@main') _

pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  containers:
  - name: node
    image: node:20-alpine
    command:
    - cat
    tty: true
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 2000m
        memory: 2Gi
  - name: docker
    image: docker:24-dind
    securityContext:
      privileged: true
    volumeMounts:
    - name: docker-socket
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-socket
    hostPath:
      path: /var/run/docker.sock
'''
            defaultContainer 'node'
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
        ansiColor('xterm')
        timestamps()
    }

    environment {
        DOCKER_REGISTRY = 'ghcr.io'
        IMAGE_NAME = "${DOCKER_REGISTRY}/${env.GIT_ORG}/${env.JOB_BASE_NAME}"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
        SCANNER_HOME = tool 'SonarScanner'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.GIT_COMMIT_MSG = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                }
            }
        }

        stage('Install') {
            steps {
                cache(maxCacheSize: 500, caches: [
                    arbitraryFileCache(
                        path: 'node_modules',
                        includes: '**/*',
                        cacheValidityDecidingFile: 'package-lock.json'
                    )
                ]) {
                    sh 'npm ci'
                }
            }
        }

        stage('Validate') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'npm run typecheck'
                    }
                }
                stage('Audit') {
                    steps {
                        sh 'npm audit --audit-level=high || true'
                    }
                }
            }
        }

        stage('Test') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit 'junit.xml'
                    publishCoverage adapters: [coberturaAdapter('coverage/cobertura-coverage.xml')]
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                }
            }
        }

        stage('SonarQube Analysis') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    changeRequest()
                }
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh """
                        ${SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=${env.JOB_BASE_NAME} \
                            -Dsonar.sources=src \
                            -Dsonar.tests=tests \
                            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                    """
                }
            }
        }

        stage('Quality Gate') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    buildingTag()
                }
            }
            steps {
                container('docker') {
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-registry',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                            echo $DOCKER_PASS | docker login ${DOCKER_REGISTRY} -u $DOCKER_USER --password-stdin
                            docker build -t ${IMAGE_NAME}:${GIT_COMMIT_SHORT} -t ${IMAGE_NAME}:latest .
                            docker push ${IMAGE_NAME}:${GIT_COMMIT_SHORT}
                            docker push ${IMAGE_NAME}:latest
                        '''
                    }
                }
            }
        }

        stage('Security Scan') {
            when {
                anyOf {
                    branch 'main'
                    buildingTag()
                }
            }
            steps {
                container('docker') {
                    sh '''
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                            aquasec/trivy:latest image --exit-code 0 \
                            --severity HIGH,CRITICAL ${IMAGE_NAME}:${GIT_COMMIT_SHORT}
                    '''
                }
            }
        }

        stage('Deploy Staging') {
            when {
                branch 'main'
            }
            steps {
                container('kubectl') {
                    withKubeConfig([credentialsId: 'kubeconfig-staging']) {
                        sh '''
                            kubectl set image deployment/myapp \
                                myapp=${IMAGE_NAME}:${GIT_COMMIT_SHORT} \
                                -n staging
                            kubectl rollout status deployment/myapp -n staging --timeout=300s
                        '''
                    }
                }
            }
            post {
                success {
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "Deployed ${env.JOB_NAME} to staging: ${env.GIT_COMMIT_SHORT}"
                    )
                }
            }
        }

        stage('E2E Tests') {
            when {
                branch 'main'
            }
            steps {
                sh 'npm run test:e2e -- --baseUrl=https://staging.example.com'
            }
            post {
                always {
                    publishHTML([
                        reportDir: 'playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'E2E Test Report'
                    ])
                }
            }
        }

        stage('Deploy Production') {
            when {
                buildingTag()
            }
            input {
                message 'Deploy to production?'
                ok 'Deploy'
                submitter 'admin,deploy-team'
                parameters {
                    choice(name: 'DEPLOY_TYPE', choices: ['canary', 'rolling', 'blue-green'], description: 'Deployment strategy')
                }
            }
            steps {
                container('kubectl') {
                    withKubeConfig([credentialsId: 'kubeconfig-production']) {
                        sh '''
                            kubectl set image deployment/myapp \
                                myapp=${IMAGE_NAME}:${TAG_NAME} \
                                -n production
                            kubectl rollout status deployment/myapp -n production --timeout=300s
                        '''
                    }
                }
            }
            post {
                success {
                    slackSend(
                        channel: '#deployments',
                        color: 'good',
                        message: "Deployed ${env.JOB_NAME} to production: ${env.TAG_NAME}"
                    )
                }
                failure {
                    container('kubectl') {
                        withKubeConfig([credentialsId: 'kubeconfig-production']) {
                            sh 'kubectl rollout undo deployment/myapp -n production'
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            slackSend(
                channel: '#ci-alerts',
                color: 'danger',
                message: "Pipeline failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}"
            )
        }
    }
}
```

## Shared Library

```groovy
// vars/buildNodeApp.groovy
def call(Map config = [:]) {
    def nodeVersion = config.nodeVersion ?: '20'
    def registry = config.registry ?: 'ghcr.io'

    pipeline {
        agent {
            kubernetes {
                yaml libraryResource('podTemplates/node.yaml')
            }
        }

        stages {
            stage('Build') {
                steps {
                    script {
                        nodeBuild(nodeVersion: nodeVersion)
                    }
                }
            }

            stage('Test') {
                steps {
                    script {
                        nodeTest()
                    }
                }
            }

            stage('Docker') {
                when {
                    branch 'main'
                }
                steps {
                    script {
                        dockerBuild(
                            registry: registry,
                            imageName: env.JOB_BASE_NAME
                        )
                    }
                }
            }
        }
    }
}

// vars/nodeBuild.groovy
def call(Map config = [:]) {
    sh 'npm ci'
    sh 'npm run build'
}

// vars/nodeTest.groovy
def call(Map config = [:]) {
    sh 'npm run test:coverage'
    junit 'junit.xml'
    publishCoverage adapters: [coberturaAdapter('coverage/cobertura-coverage.xml')]
}

// vars/dockerBuild.groovy
def call(Map config) {
    def registry = config.registry
    def imageName = config.imageName
    def tag = env.GIT_COMMIT_SHORT ?: 'latest'
    def fullImage = "${registry}/${imageName}:${tag}"

    container('docker') {
        withCredentials([usernamePassword(
            credentialsId: 'docker-registry',
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
        )]) {
            sh """
                echo \$DOCKER_PASS | docker login ${registry} -u \$DOCKER_USER --password-stdin
                docker build -t ${fullImage} .
                docker push ${fullImage}
            """
        }
    }

    return fullImage
}

// vars/deployToKubernetes.groovy
def call(Map config) {
    def environment = config.environment
    def image = config.image
    def namespace = config.namespace ?: environment

    container('kubectl') {
        withKubeConfig([credentialsId: "kubeconfig-${environment}"]) {
            sh """
                kubectl set image deployment/${env.JOB_BASE_NAME} \
                    ${env.JOB_BASE_NAME}=${image} \
                    -n ${namespace}
                kubectl rollout status deployment/${env.JOB_BASE_NAME} \
                    -n ${namespace} --timeout=300s
            """
        }
    }
}

// vars/notifySlack.groovy
def call(Map config) {
    def status = config.status ?: 'success'
    def channel = config.channel ?: '#ci-notifications'
    def color = status == 'success' ? 'good' : 'danger'
    def message = config.message ?: "Build ${env.BUILD_NUMBER}: ${status}"

    slackSend(
        channel: channel,
        color: color,
        message: message
    )
}
```

## Resources

```yaml
# resources/podTemplates/node.yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins: agent
spec:
  containers:
  - name: node
    image: node:20-alpine
    command:
    - cat
    tty: true
    resources:
      requests:
        cpu: 500m
        memory: 512Mi
      limits:
        cpu: 2000m
        memory: 2Gi
    volumeMounts:
    - name: npm-cache
      mountPath: /root/.npm
  - name: docker
    image: docker:24-dind
    securityContext:
      privileged: true
    volumeMounts:
    - name: docker-socket
      mountPath: /var/run/docker.sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-socket
    hostPath:
      path: /var/run/docker.sock
  - name: npm-cache
    emptyDir: {}
```

## Scripted Pipeline

```groovy
// Jenkinsfile (Scripted)
@Library('shared-library@main') _

node('kubernetes') {
    def gitCommit
    def imageName

    try {
        stage('Checkout') {
            checkout scm
            gitCommit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }

        stage('Build') {
            docker.image('node:20-alpine').inside {
                sh 'npm ci'
                sh 'npm run build'
            }
        }

        stage('Test') {
            docker.image('node:20-alpine').inside {
                sh 'npm test'
            }
        }

        if (env.BRANCH_NAME == 'main') {
            stage('Build Docker') {
                imageName = "ghcr.io/myorg/myapp:${gitCommit}"

                docker.withRegistry('https://ghcr.io', 'docker-credentials') {
                    def image = docker.build(imageName)
                    image.push()
                    image.push('latest')
                }
            }

            stage('Deploy') {
                withKubeConfig([credentialsId: 'kubeconfig']) {
                    sh """
                        kubectl set image deployment/myapp myapp=${imageName}
                        kubectl rollout status deployment/myapp --timeout=300s
                    """
                }
            }
        }

        currentBuild.result = 'SUCCESS'

    } catch (Exception e) {
        currentBuild.result = 'FAILURE'
        throw e

    } finally {
        cleanWs()

        if (currentBuild.result == 'FAILURE') {
            slackSend(
                channel: '#ci-alerts',
                color: 'danger',
                message: "Build failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
            )
        }
    }
}
```

## Multibranch Pipeline

```groovy
// Jenkinsfile (Multibranch)
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm ci && npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Deploy Preview') {
            when {
                changeRequest()
            }
            steps {
                echo "Deploying PR #${env.CHANGE_ID} to preview environment"
                // Deploy to preview environment
            }
        }

        stage('Deploy Staging') {
            when {
                branch 'develop'
            }
            steps {
                echo 'Deploying to staging'
                // Deploy to staging
            }
        }

        stage('Deploy Production') {
            when {
                branch 'main'
            }
            input {
                message 'Deploy to production?'
                ok 'Deploy'
            }
            steps {
                echo 'Deploying to production'
                // Deploy to production
            }
        }
    }
}
```

## CLAUDE.md Integration

```markdown
# Jenkins Pipeline

## Commands
- Validate pipeline: `jenkins-pipeline-linter`
- Run locally: `jenkins-runner`
- Replay pipeline: Jenkins UI > Build > Replay

## Key Concepts
- Declarative vs Scripted pipelines
- Shared libraries for reuse
- Kubernetes agents for scaling
- Blue Ocean for visualization

## Environment Variables
- `BUILD_NUMBER` - Build number
- `BRANCH_NAME` - Branch being built
- `GIT_COMMIT` - Full commit hash
- `BUILD_URL` - URL to build

## Credentials
- Use `withCredentials` for secrets
- Use `credentials()` helper
- Store in Jenkins credentials store
```

## AI Suggestions

1. **Add shared libraries** - Reusable pipeline code
2. **Implement Kubernetes agents** - Dynamic scaling
3. **Add parallel stages** - Faster builds
4. **Configure caching** - Pipeline cache step
5. **Implement input stages** - Manual approvals
6. **Add SonarQube integration** - Code quality
7. **Configure multibranch** - Branch-based pipelines
8. **Add Blue Ocean** - Modern UI
9. **Implement matrix builds** - Multi-configuration
10. **Add artifact management** - Nexus/Artifactory integration
