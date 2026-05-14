#!/bin/bash

# ============================================
# 服务器缓存清理脚本
# 安全清理无用数据，不会破坏数据库
# ============================================

echo "=========================================="
echo "  服务器缓存清理脚本"
echo "=========================================="
echo ""

# 1. 清理 Docker 无用镜像
echo "[1/4] 清理 Docker 无用镜像..."
docker image prune -f
echo ""

# 2. 清理 Docker 构建缓存
echo "[2/4] 清理 Docker 构建缓存..."
docker builder prune -f
echo ""

# 3. 清理停止的容器
echo "[3/4] 清理已停止的容器..."
docker container prune -f
echo ""

# 4. 清理未使用的卷（跳过正在使用的）
echo "[4/4] 清理未使用的 Docker 卷..."
docker volume prune -f
echo ""

# 5. 清理 npm 缓存（前端）
echo "[5/5] 清理前端 npm 缓存..."
if [ -d "/www/wwwroot/Second-Hand-main/Client/node_modules/.cache" ]; then
    rm -rf /www/wwwroot/Second-Hand-main/Client/node_modules/.cache
    echo "  已清理前端构建缓存"
else
    echo "  前端缓存不存在，跳过"
fi
echo ""

# 显示清理后的磁盘使用情况
echo "=========================================="
echo "  清理完成！当前磁盘使用情况："
echo "=========================================="
df -h
echo ""
echo "Docker 磁盘使用："
docker system df
