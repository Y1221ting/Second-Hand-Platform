#!/bin/bash
# 数据备份脚本 — 每日凌晨 3 点执行
# crontab -e 添加: 0 3 * * * /bin/bash /path/to/backup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
CONTAINER="second-hand-mongodb"
RETENTION_DAYS=7

# 读取 .env 中的密码
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^\s*#' "$SCRIPT_DIR/.env" | xargs)
fi

PASSWORD="${MONGO_INITDB_ROOT_PASSWORD:-}"

mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
TMP_DIR="/tmp/mongo_backup_$DATE"

echo "[$(date)] 开始备份..."

# 容器内 mongodump
docker exec "$CONTAINER" mongodump \
  --username admin \
  --password "${PASSWORD}" \
  --authenticationDatabase admin \
  --out "$TMP_DIR" 2>&1

# 拷贝到宿主机
docker cp "$CONTAINER:$TMP_DIR" "$BACKUP_DIR/$DATE"
docker exec "$CONTAINER" rm -rf "$TMP_DIR"

# 压缩
tar -czf "$BACKUP_DIR/${DATE}.tar.gz" -C "$BACKUP_DIR" "$DATE" 2>&1
rm -rf "$BACKUP_DIR/$DATE"

# 删除 7 天前的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>&1

echo "[$(date)] 备份完成: ${DATE}.tar.gz ($(du -h "$BACKUP_DIR/${DATE}.tar.gz" | cut -f1))"
