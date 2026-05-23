#!/bin/bash
# clean.sh - 清理临时文件

cd /storage/emulated/0/Download/3/

echo "🧹 清理临时文件..."
rm -f all_in_one.sh create_and_push.sh create_file.py fix_railway.sh

echo "📤 推送清理..."
git add .
git commit -m "chore: 清理临时脚本文件"
git push origin main

echo "✅ 清理完成"
