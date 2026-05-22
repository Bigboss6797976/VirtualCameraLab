#!/bin/bash
echo "🔨 构建APK..."
pkg install nodejs openjdk-17 gradle -y
npm install -g cordova
cd "$(dirname "$0")"
npm install
cordova platform add android
cordova build android
cp platforms/android/app/build/outputs/apk/debug/app-debug.apk /storage/emulated/0/Download/AntEnergyQR_v4.apk
echo "✅ APK已保存到下载目录"
