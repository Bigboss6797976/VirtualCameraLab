#!/bin/bash
# NettyRat AI v4.0 安装脚本

echo "🐀 NettyRat AI v4.0 安装器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检测 Termux
if [ -d "/data/data/com.termux" ]; then
    echo "📱 检测到 Termux 环境"
    pkg update -y
    pkg install -y python python-pip rust binutils libffi openssl
    pip install --upgrade pip
else
    echo "🖥️ 标准 Linux 环境"
    pip install --upgrade pip
fi

# 安装依赖
echo "📦 安装依赖..."
pip install -r requirements.txt

# 创建必要目录
mkdir -p data
mkdir -p /tmp/nettyrat

# 设置权限
chmod +x bot.py

echo ""
echo "✅ 安装完成!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 使用方法:"
echo ""
echo "1. 设置环境变量:"
echo "   export BOT_TOKEN='你的BotToken'"
echo "   export ADMIN_IDS='你的TelegramID'"
echo "   export REPLACE_WALLET='替换钱包地址'"
echo ""
echo "2. 运行程序:"
echo "   python3 bot.py"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 快捷命令:"
echo "   /start    - 主菜单"
echo "   /ai       - AI 交互模式"
echo "   /status   - 系统状态"
echo "   /energy   - 能量状态"
echo "   /recharge - 能量充值"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
