#!/bin/bash

set -e

# Load env
export $(grep -v '^#' ~/dao.moscow.nextjs/.env.production | xargs)

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR=~/backups
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup $TIMESTAMP..."

# Dump and compress
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

# Upload to S3
AWS_ACCESS_KEY_ID=$NEXT_AWS_S3_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$NEXT_AWS_S3_SECRET_ACCESS_KEY \
AWS_DEFAULT_REGION=$NEXT_AWS_S3_REGION \
aws s3 cp "$BACKUP_FILE" "s3://$NEXT_AWS_S3_BUCKET_NAME/backups/db_backup_$TIMESTAMP.sql.gz"

# Keep only last 7 backups locally
ls -t "$BACKUP_DIR"/db_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "Backup complete: backups/db_backup_$TIMESTAMP.sql.gz"
