#!/bin/bash
set -e
echo "=== VirtualCamera Lab Build ==="
cd app
gradle assembleDebug
echo "=== Done ==="
echo "APK: app/build/outputs/apk/debug/app-debug.apk"
