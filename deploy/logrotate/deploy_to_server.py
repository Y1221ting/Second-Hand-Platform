#!/usr/bin/env python3
"""一键部署 logrotate 到阿里云服务器"""
import paramiko
import os
import sys
import time

HOST = "8.162.24.145"
USER = "root"
PASSWORD = "FFilloo23."
PORT = 22

# 项目路径（服务器上的实际路径）
APP_ROOT = "/opt/second-hand"

# 要上传的配置文件
CONFIG_DIR = r"D:\Second-Hand-main\deploy\logrotate"
FILES = [
    "deploy.sh",
    "secondhand-app.conf",
    "secondhand-nginx.conf",
    "secondhand-docker.conf",
    "docker-daemon.json",
]

def ssh_exec(ssh, cmd, desc=""):
    """执行单条命令并打印输出"""
    if desc:
        print(f"\n>>> {desc}")
    print(f"    $ {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out:
        print(out.strip())
    if err:
        print(f"    [STDERR] {err.strip()}")
    return out, err

def main():
    print("=" * 60)
    print(f" 连接 {USER}@{HOST}:{PORT} ...")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=15)
        print("[OK] SSH 连接成功\n")
    except Exception as e:
        print(f"[FAIL] SSH 连接失败: {e}")
        sys.exit(1)

    # 1. 上传配置文件
    print("=" * 60)
    print(" 上传配置文件")
    print("=" * 60)

    sftp = ssh.open_sftp()
    remote_dir = "/tmp/logrotate"

    # 确保远程目录存在
    ssh_exec(ssh, f"mkdir -p {remote_dir}", "创建远程临时目录")

    for fname in FILES:
        local_path = os.path.join(CONFIG_DIR, fname)
        remote_path = f"{remote_dir}/{fname}"
        print(f"   上传: {fname} -> {remote_path}")
        sftp.put(local_path, remote_path)
        # 确保 deploy.sh 可执行
        if fname == "deploy.sh":
            ssh_exec(ssh, f"chmod +x {remote_path}")

    sftp.close()
    print("[OK] 文件上传完成\n")

    # 2. 检查服务器环境
    print("=" * 60)
    print(" 检查服务器环境")
    print("=" * 60)
    ssh_exec(ssh, "uname -a", "操作系统")
    ssh_exec(ssh, "which logrotate && logrotate --version 2>&1 | head -1", "logrotate 版本")
    ssh_exec(ssh, f"ls {APP_ROOT}/Server/logs/ 2>/dev/null || echo '日志目录不存在，请检查项目路径'", "检查日志目录")

    # 3. 执行部署脚本
    print("=" * 60)
    print(" 执行部署")
    print("=" * 60)
    out, err = ssh_exec(ssh, f"cd {remote_dir} && sudo bash deploy.sh {APP_ROOT}", "运行 deploy.sh")

    # 4. Docker daemon 配置
    print("=" * 60)
    print(" Docker 日志上限配置")
    print("=" * 60)
    ssh_exec(ssh, f"sudo cp {remote_dir}/docker-daemon.json /etc/docker/daemon.json", "安装 daemon.json")
    ssh_exec(ssh, "sudo systemctl restart docker 2>&1 || echo 'Docker 未安装或未使用 systemd'", "重启 Docker")

    # 5. 验证部署结果
    print("=" * 60)
    print(" 部署验证")
    print("=" * 60)
    ssh_exec(ssh, "ls -la /etc/logrotate.d/secondhand-*", "已安装的配置")
    ssh_exec(ssh, f"ls -lh {APP_ROOT}/Server/logs/ 2>/dev/null", "应用日志目录")
    ssh_exec(ssh, "cat /etc/cron.daily/logrotate 2>/dev/null | head -3", "cron 定时任务")

    ssh.close()
    print("\n" + "=" * 60)
    print(" ✅ 部署完成")
    print("=" * 60)
    print(f"  日志每天自动轮转，保留 7 天")
    print(f"  强制测试: sudo logrotate -f /etc/logrotate.d/secondhand-app")
    print(f"  查看日志: ls -lh {APP_ROOT}/Server/logs/")

if __name__ == "__main__":
    main()
