#!/bin/bash
# AlipayQR v3.0 - 打包为APP
set -e
echo "========================================"
echo "   AlipayQR v3.0 - APP打包"
echo "========================================"
echo ""
if ! command -v python3 &> /dev/null; then echo "[!] 未找到Python3"; exit 1; fi
echo "[*] Python: $(python3 --version)"
echo "[*] 安装依赖..."
python3 -m pip install --upgrade pip
python3 -m pip install pyinstaller qrcode[pil] Pillow pycryptodome cryptography requests
PLATFORM=$(uname -s)
echo "[*] 平台: $PLATFORM"
if [ "$PLATFORM" = "Darwin" ]; then
    echo "[*] 打包macOS应用..."
    pyinstaller --noconfirm --onefile --windowed         --name "AlipayQR"         --add-data "src/ui/web/index.html:src/ui/web"         --add-data "src/ui/web/manifest.json:src/ui/web"         --add-data "src/ui/web/sw.js:src/ui/web"         --add-data "src/core:src/core"         --hidden-import qrcode --hidden-import PIL --hidden-import cryptography --hidden-import Crypto         main.py
    mkdir -p "dist/AlipayQR.app/Contents/MacOS"
    mkdir -p "dist/AlipayQR.app/Contents/Resources"
    cp "dist/AlipayQR" "dist/AlipayQR.app/Contents/MacOS/"
    cat > "dist/AlipayQR.app/Contents/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key><string>AlipayQR</string>
    <key>CFBundleIdentifier</key><string>com.alipayqr.app</string>
    <key>CFBundleName</key><string>AlipayQR</string>
    <key>CFBundleVersion</key><string>3.0.0</string>
    <key>CFBundlePackageType</key><string>APPL</string>
    <key>LSMinimumSystemVersion</key><string>10.14</string>
    <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
EOF
    echo "[+] macOS应用: dist/AlipayQR.app"
else
    echo "[*] 打包Linux应用..."
    pyinstaller --noconfirm --onefile         --name "AlipayQR"         --add-data "src/ui/web/index.html:src/ui/web"         --add-data "src/ui/web/manifest.json:src/ui/web"         --add-data "src/ui/web/sw.js:src/ui/web"         --add-data "src/core:src/core"         --hidden-import qrcode --hidden-import PIL --hidden-import cryptography --hidden-import Crypto         main.py
    echo "[+] Linux应用: dist/AlipayQR"
fi
echo ""
echo "========================================"
echo "   打包完成!"
echo "========================================"
