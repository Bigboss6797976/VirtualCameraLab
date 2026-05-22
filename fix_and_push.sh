#!/bin/bash
# fix_and_push.sh - 清理旧文件并推送新文件

cd /storage/emulated/0/Download/3/

echo "=== 当前Git状态 ==="
git status --short

echo ""
echo "=== 删除所有被标记为 deleted 的旧文件缓存 ==="
git rm -r --cached . 2>/dev/null || true

echo ""
echo "=== 重新添加所有现有文件 ==="
git add .

echo ""
echo "=== 检查新文件是否已添加 ==="
git status --short | head -20

echo ""
echo "=== 提交更改 ==="
git commit -m "feat: 能量码生成器 v3.0 - 单文件HTML应用"

echo ""
echo "=== 推送到GitHub ==="
git push origin main

echo ""
echo "=== 完成 ==="
