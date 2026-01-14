# Kubernetes CronJob Template

> Production-ready CronJob configurations for scheduled tasks with proper resource management and error handling

## Overview

This template provides CronJob configurations with:
- Cron schedule expressions
- Concurrency policies
- Job history limits
- Failure handling
- Resource constraints

## Quick Start

```bash
# Apply CronJob
kubectl apply -f cronjob.yaml

# View CronJobs
kubectl get cronjobs

# Trigger job manually
kubectl create job --from=cronjob/backup-db backup-db-manual

# View job history
kubectl get jobs
```

## CronJob Configuration

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-database
  namespace: production
  labels:
    app.kubernetes.io/name: backup-database
    app.kubernetes.io/component: backup
spec:
  # Schedule (every day at 2 AM UTC)
  schedule: "0 2 * * *"

  # Timezone (Kubernetes 1.27+)
  timeZone: "UTC"

  # Concurrency policy: Allow, Forbid, or Replace
  concurrencyPolicy: Forbid

  # Suspend the CronJob
  suspend: false

  # Starting deadline seconds
  startingDeadlineSeconds: 600

  # History limits
  successfulJobsHistoryLimit: 5
  failedJobsHistoryLimit: 3

  jobTemplate:
    metadata:
      labels:
        app.kubernetes.io/name: backup-database
    spec:
      # TTL for finished jobs (auto-cleanup)
      ttlSecondsAfterFinished: 86400  # 24 hours

      # Backoff limit for retries
      backoffLimit: 3

      # Active deadline
      activeDeadlineSeconds: 3600  # 1 hour max runtime

      template:
        metadata:
          labels:
            app.kubernetes.io/name: backup-database
          annotations:
            cluster-autoscaler.kubernetes.io/safe-to-evict: "false"
        spec:
          restartPolicy: OnFailure
          serviceAccountName: backup-sa

          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            fsGroup: 1000
            seccompProfile:
              type: RuntimeDefault

          containers:
            - name: backup
              image: postgres:16-alpine
              imagePullPolicy: IfNotPresent
              command:
                - /bin/sh
                - -c
                - |
                  set -e

                  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                  BACKUP_FILE="/backup/db_backup_${TIMESTAMP}.sql.gz"

                  echo "Starting backup at $(date)"

                  pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
                    --format=custom \
                    --compress=9 \
                    --no-owner \
                    --no-privileges \
                    > "${BACKUP_FILE}"

                  # Upload to S3
                  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/$(date +%Y/%m/%d)/"

                  # Cleanup local backup
                  rm -f "${BACKUP_FILE}"

                  # Cleanup old backups (keep 30 days)
                  aws s3 ls "s3://${S3_BUCKET}/backups/" --recursive \
                    | awk '{print $4}' \
                    | while read file; do
                        file_date=$(echo "$file" | grep -oP '\d{4}/\d{2}/\d{2}')
                        if [[ $(date -d "$file_date" +%s) -lt $(date -d "-30 days" +%s) ]]; then
                          aws s3 rm "s3://${S3_BUCKET}/$file"
                        fi
                      done

                  echo "Backup completed at $(date)"
              env:
                - name: DB_HOST
                  value: "postgres.production.svc.cluster.local"
                - name: DB_NAME
                  value: "myapp"
                - name: DB_USER
                  valueFrom:
                    secretKeyRef:
                      name: postgres-credentials
                      key: username
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-credentials
                      key: password
                - name: S3_BUCKET
                  value: "my-backups-bucket"
                - name: AWS_REGION
                  value: "us-east-1"
              envFrom:
                - secretRef:
                    name: aws-credentials
              resources:
                requests:
                  cpu: 100m
                  memory: 256Mi
                limits:
                  cpu: 1000m
                  memory: 1Gi
              volumeMounts:
                - name: backup-volume
                  mountPath: /backup
              securityContext:
                allowPrivilegeEscalation: false
                readOnlyRootFilesystem: false
                capabilities:
                  drop: ["ALL"]

          volumes:
            - name: backup-volume
              emptyDir:
                sizeLimit: 10Gi

          # Node selection
          nodeSelector:
            kubernetes.io/os: linux

          # Tolerations for dedicated backup nodes
          tolerations:
            - key: "workload"
              operator: "Equal"
              value: "batch"
              effect: "NoSchedule"
```

## Data Processing CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: data-aggregation
  namespace: production
spec:
  schedule: "*/15 * * * *"  # Every 15 minutes
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3

  jobTemplate:
    spec:
      backoffLimit: 2
      activeDeadlineSeconds: 900
      template:
        spec:
          restartPolicy: Never
          serviceAccountName: data-processor

          initContainers:
            - name: wait-for-dependencies
              image: busybox:1.36
              command: ['sh', '-c', 'until nc -z redis 6379; do sleep 2; done']

          containers:
            - name: processor
              image: my-registry/data-processor:latest
              command: ["python", "-m", "processor.aggregate"]
              env:
                - name: REDIS_URL
                  value: "redis://redis:6379"
                - name: DATABASE_URL
                  valueFrom:
                    secretKeyRef:
                      name: database-credentials
                      key: url
                - name: LOG_LEVEL
                  value: "INFO"
              resources:
                requests:
                  cpu: 500m
                  memory: 512Mi
                limits:
                  cpu: 2000m
                  memory: 2Gi
```

## Cleanup CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cleanup-old-data
  namespace: production
spec:
  schedule: "0 4 * * 0"  # Every Sunday at 4 AM
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 1
  failedJobsHistoryLimit: 1

  jobTemplate:
    spec:
      backoffLimit: 1
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: cleanup
              image: postgres:16-alpine
              command:
                - /bin/sh
                - -c
                - |
                  psql -h $DB_HOST -U $DB_USER -d $DB_NAME <<EOF
                  -- Delete old audit logs
                  DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

                  -- Delete old sessions
                  DELETE FROM sessions WHERE expires_at < NOW();

                  -- Vacuum analyze
                  VACUUM ANALYZE;
                  EOF
              env:
                - name: DB_HOST
                  value: "postgres"
                - name: DB_NAME
                  value: "myapp"
                - name: DB_USER
                  valueFrom:
                    secretKeyRef:
                      name: postgres-credentials
                      key: username
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: postgres-credentials
                      key: password
              resources:
                requests:
                  cpu: 100m
                  memory: 128Mi
                limits:
                  cpu: 500m
                  memory: 512Mi
```

## Report Generation CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
  namespace: production
spec:
  schedule: "0 6 * * *"  # Daily at 6 AM
  timeZone: "America/New_York"
  concurrencyPolicy: Forbid

  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: report
              image: my-registry/report-generator:latest
              args: ["--type", "daily", "--format", "pdf"]
              env:
                - name: REPORT_RECIPIENTS
                  value: "team@example.com"
                - name: SMTP_HOST
                  valueFrom:
                    configMapKeyRef:
                      name: smtp-config
                      key: host
                - name: SMTP_PASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: smtp-credentials
                      key: password
              volumeMounts:
                - name: report-templates
                  mountPath: /templates
                  readOnly: true
              resources:
                requests:
                  cpu: 200m
                  memory: 256Mi
                limits:
                  cpu: 1000m
                  memory: 1Gi

          volumes:
            - name: report-templates
              configMap:
                name: report-templates
```

## Monitoring CronJobs

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: cronjob-alerts
  namespace: monitoring
spec:
  groups:
    - name: cronjob-alerts
      rules:
        - alert: CronJobFailed
          expr: |
            kube_job_status_failed{job_name=~".*"} > 0
          for: 1m
          labels:
            severity: warning
          annotations:
            summary: "CronJob {{ $labels.job_name }} failed"

        - alert: CronJobNotScheduled
          expr: |
            time() - kube_cronjob_status_last_schedule_time >
            kube_cronjob_spec_schedule_duration_seconds * 2
          for: 10m
          labels:
            severity: warning
          annotations:
            summary: "CronJob {{ $labels.cronjob }} missed schedule"

        - alert: CronJobRunningTooLong
          expr: |
            time() - kube_job_status_start_time{job_name=~".*"} > 3600
            and kube_job_status_active{job_name=~".*"} > 0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Job {{ $labels.job_name }} running > 1 hour"
```

## CLAUDE.md Integration

```markdown
# Kubernetes CronJob

## Commands
- `kubectl get cronjobs` - List CronJobs
- `kubectl describe cronjob backup-database` - Show details
- `kubectl create job --from=cronjob/backup-database manual-backup` - Manual trigger
- `kubectl get jobs` - View job history
- `kubectl logs job/backup-database-xxxxx` - View job logs

## Cron Schedule
- `* * * * *` - minute hour day-of-month month day-of-week
- `0 2 * * *` - 2 AM daily
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * 0` - Midnight on Sundays

## Concurrency Policies
- `Allow` - Concurrent executions allowed
- `Forbid` - Skip if previous still running
- `Replace` - Stop current, start new

## Debugging
- Check job pods: `kubectl get pods -l job-name=<job>`
- View failed jobs: `kubectl get jobs --field-selector status.successful=0`
```

## AI Suggestions

1. **Add job monitoring** - Implement Prometheus metrics for job success/failure
2. **Configure Slack alerts** - Send notifications on job failures
3. **Add retry with exponential backoff** - Implement smarter retry logic
4. **Implement job chaining** - Trigger dependent jobs on completion
5. **Add distributed locking** - Prevent duplicate runs across clusters
6. **Configure job queuing** - Use work queues for scalable processing
7. **Add progress reporting** - Report job progress to external systems
8. **Implement checkpointing** - Resume failed jobs from last checkpoint
9. **Add resource quotas** - Limit concurrent jobs per namespace
10. **Configure job priorities** - Implement priority-based scheduling
