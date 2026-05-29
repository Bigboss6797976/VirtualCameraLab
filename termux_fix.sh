#!/bin/bash
# NettyRat AI v4.0 - Termux 修复脚本

echo "🔧 Termux 环境修复中..."

# 1. 安装 Termux 必要依赖
echo "📦 安装编译工具..."
pkg update -y
pkg install -y python python-pip binutils libffi openssl

# 2. 安装 Pillow 的依赖
echo "🖼️ 安装 Pillow 编译依赖..."
pkg install -y libjpeg-turbo libpng freetype

# 3. 设置临时目录
echo "📁 设置工作目录..."
mkdir -p ~/nettyrat_tmp
mkdir -p ~/nettyrat_data

# 4. 尝试安装 Pillow (可能失败，不影响主程序)
echo "🧪 尝试安装 Pillow..."
pip install Pillow || echo "⚠️ Pillow 安装失败，QR功能将受限"

# 5. 安装纯 Python 依赖
echo "📦 安装核心依赖..."
pip install python-telegram-bot==20.7
pip install requests==2.31.0
pip install cryptography==41.0.7
pip install PyJWT==2.8.0
pip install qrcode==7.4.2
pip install imageio==2.33.0

# 6. 尝试安装 psutil
echo "📊 尝试安装 psutil..."
pip install psutil || echo "⚠️ psutil 安装失败，系统信息功能受限"

# 7. 修复权限
echo "🔐 修复权限..."
chmod +x bot.py
chmod +x install.sh

echo ""
echo "✅ Termux 修复完成!"
echo ""
echo "⚠️ 注意:"
echo "  - 屏幕截图/键盘记录/剪切板监控在 Termux 上不可用"
echo "  - QR 伪造功能需要 Pillow (如果安装失败则不可用)"
echo "  - 核心功能 (AI/攻击/网络) 完全可用"
echo ""
echo "🚀 运行: python3 bot.py"
