#!/data/data/com.termux/files/usr/bin/bash

cd /storage/emulated/0/Download/3/本地

# 初始化 git（如果没有）
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/Bigboss6797976/ailipay.git
fi

# 添加所有文件
git add .

# 提交
git commit -m "update: 能量码生成器 v2.0 官方克隆 $(date '+%Y-%m-%d %H:%M:%S')" || true

# 推送到 GitHub
git push -u origin main --force || git push -u origin master --force

echo "✅ 已推送到 GitHub，Railway 将自动部署"
