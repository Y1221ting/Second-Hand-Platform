#!/bin/bash

# ============================================
# MongoDB 数据库自动备份脚本
# 自动备份 + 保留最近7天备份 + 重复判断
# ============================================

# 配置
BACKUP_DIR="/www/wwwroot/Second-Hand-main/backups"
DB_NAME="second-hand"
DB_USER="admin"
DB_PASS="@Yt1221wz"
DB_HOST="localhost"
DB_PORT="27017"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$DATE.gz"

# 创建备份目录（如果不存在）
mkdir -p "$BACKUP_DIR"

# 检查今天是否已经备份过
TODAY=$(date +%Y%m%d)
TODAY_BACKUPS=$(ls -1 "$BACKUP_DIR"/mongodb_backup_${TODAY}_*.gz 2>/dev/null | wc -l)

if [ "$TODAY_BACKUPS" -gt 0 ]; then
    echo "警告：今天已经备份过 $TODAY_BACKUPS 次"
    echo "最新备份：$(ls -lt "$BACKUP_DIR"/mongodb_backup_${TODAY}_*.gz | head -1)"
    echo ""
    read -p "是否继续备份？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "已取消备份"
        exit 0
    fi
fi

echo "=========================================="
echo "  MongoDB 数据库备份开始"
echo "=========================================="
echo "备份文件：$BACKUP_FILE"
echo ""

# 执行备份
mongodump \
    --host "$DB_HOST" \
    --port "$DB_PORT" \
    --username "$DB_USER" \
    --password "$DB_PASS" \
    --authenticationDatabase admin \
    --db "$DB_NAME" \
    --archive="$BACKUP_FILE" \
    --gzip

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo ""
    echo "备份成功！"
    echo "文件大小：$(du -h "$BACKUP_FILE" | cut -f1)"
    echo ""
else
    echo ""
    echo "备份失败！"
    exit 1
fi

# 清理7天前的旧备份
echo "=========================================="
echo "  清理 $RETENTION_DAYS 天前的旧备份..."
echo "=========================================="
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "mongodb_backup_*.gz" -mtime +$RETENTION_DAYS)

if [ -n "$OLD_BACKUPS" ]; then
    echo "删除以下旧备份："
    echo "$OLD_BACKUPS"
    find "$BACKUP_DIR" -name "mongodb_backup_*.gz" -mtime +$RETENTION_DAYS -delete
    echo ""
    echo "已清理旧备份"
else
    echo "没有需要清理的旧备份"
fi

echo ""
echo "=========================================="
echo "  当前备份列表（最近5个）："
echo "=========================================="
ls -lht "$BACKUP_DIR"/mongodb_backup_*.gz 2>/dev/null | head -5

echo ""
echo "备份完成！"
