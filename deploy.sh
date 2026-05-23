#!/data/data/com.termux/files/usr/bin/bash
cd ~/energy-code
npx vite build
cp -r dist /storage/emulated/0/Download/3/
cd /storage/emulated/0/Download/3
git add .
git commit -m "update: $(date '+%m-%d %H:%M')" || true
git push origin main --force || git push origin master --force
echo "✅ 已部署到 Railway"
