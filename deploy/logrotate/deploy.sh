#!/bin/bash
# ============================================================
# 校园二手平台 — logrotate 一键部署脚本
# 用法: sudo bash deploy.sh [项目根目录]
# 示例: sudo bash deploy.sh /opt/second-hand
# ============================================================
set -e

APP_ROOT="${1:-/opt/second-hand}"
LOGROTATE_DIR="/etc/logrotate.d"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo " 校园二手平台 - logrotate 部署"
echo " 项目根目录: $APP_ROOT"
echo "========================================="
echo ""

# ---- 1. 检查 logrotate 是否可用 ----
if ! command -v logrotate &>/dev/null; then
    echo "[ERROR] logrotate 未安装，Ubuntu 应自带。请运行: sudo apt install logrotate"
    exit 1
fi
echo "[OK] logrotate 版本: $(logrotate --version 2>&1 | head -1)"

# ---- 2. 安装应用日志配置（自动替换路径） ----
echo ""
echo ">>> 安装 secondhand-app 配置..."
sed "s|/opt/second-hand|$APP_ROOT|g" "$SCRIPT_DIR/secondhand-app.conf" > "$LOGROTATE_DIR/secondhand-app"
chmod 644 "$LOGROTATE_DIR/secondhand-app"
echo "[OK] $LOGROTATE_DIR/secondhand-app"

# ---- 3. 安装 Nginx 配置 ----
echo ">>> 安装 secondhand-nginx 配置..."
cp "$SCRIPT_DIR/secondhand-nginx.conf" "$LOGROTATE_DIR/secondhand-nginx"
chmod 644 "$LOGROTATE_DIR/secondhand-nginx"
echo "[OK] $LOGROTATE_DIR/secondhand-nginx"

# ---- 4. 安装 Docker 配置 ----
echo ">>> 安装 secondhand-docker 配置..."
cp "$SCRIPT_DIR/secondhand-docker.conf" "$LOGROTATE_DIR/secondhand-docker"
chmod 644 "$LOGROTATE_DIR/secondhand-docker"
echo "[OK] $LOGROTATE_DIR/secondhand-docker"

# ---- 5. 语法验证 ----
echo ""
echo "========================================="
echo " 语法验证 (dry-run)"
echo "========================================="
for conf in secondhand-app secondhand-nginx secondhand-docker; do
    echo ""
    echo "--- $conf ---"
    logrotate -d "$LOGROTATE_DIR/$conf" 2>&1 | head -8
done

# ---- 6. 强制执行一次测试 ----
echo ""
echo "========================================="
echo " 强制执行一次测试"
echo "========================================="
for conf in secondhand-app secondhand-nginx secondhand-docker; do
    echo ">>> 执行: $conf"
    logrotate -f "$LOGROTATE_DIR/$conf" 2>&1 && echo "[OK] $conf" || echo "[WARN] $conf (可能日志文件不存在，忽略即可)"
done

# ---- 7. 验证结果 ----
echo ""
echo "========================================="
echo " 部署完成！验证："
echo "========================================="
echo "  应用日志: ls -lh $APP_ROOT/Server/logs/"
echo "  Nginx日志: ls -lh /var/log/nginx/"
echo "  Docker日志: ls -lh /var/lib/docker/containers/*/"
echo ""
echo "  定时执行: cat /etc/cron.daily/logrotate"
echo "  手动执行: sudo logrotate -f /etc/logrotate.d/secondhand-app"
