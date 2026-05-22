# AlipayQR v3.0 - 多通道聚合收款码生成器

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)

> 支持支付宝、微信、Stripe、易支付四大通道的智能收款码生成工具

## 功能特性

- **4大支付通道** - 支付宝官方、微信官方、Stripe、易支付
- **智能路由** - 根据金额自动选择最优通道
- **真实API签名** - RSA2/MD5签名，非模拟数据
- **二维码解析** - 解析现有支付二维码提取信息
- **跨平台** - Web PWA、Windows、macOS、Linux、Android、iOS
- **多种使用方式** - CLI命令行、GUI图形界面、Web服务器
- **自定义样式** - 头像、颜色、尺寸自由定制
- **离线签名** - 无需联网即可生成签名
- **盲签名** - 隐私保护签名方案

## 快速开始

### 方式1: 双击运行 (最简单)
```bash
双击 index.html  # 浏览器打开，无需安装
```

### 方式2: 安装向导
```bash
python install.py  # 自动安装依赖+创建桌面快捷方式
```

### 方式3: 命令行
```bash
pip install -r requirements.txt
python main.py --amount 88.88 --provider alipay
```

### 方式4: GUI模式
```bash
python main.py --gui
```

### 方式5: Web服务器
```bash
python main.py --web  # 访问 http://localhost:8080
```

## 打包为独立软件

### Windows EXE
```bash
build_exe.bat  # 生成 dist/AlipayQR.exe
```

### macOS APP
```bash
./build_app.sh  # 生成 dist/AlipayQR.app
```

### Linux
```bash
./build_app.sh  # 生成 dist/AlipayQR
```

### Electron桌面应用
```bash
npm install
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## 项目结构

```
AlipayQR_Generator/
├── main.py              # 主入口 (CLI/GUI/Web)
├── install.py           # 安装向导
├── src/
│   ├── core/
│   │   └── engine.py    # 核心引擎
│   └── ui/
│       └── web/
│           ├── index.html    # Web界面
│           ├── manifest.json # PWA配置
│           └── sw.js         # Service Worker
├── build_exe.bat        # Windows打包
├── build_app.sh         # macOS/Linux打包
├── electron-main.js     # Electron主进程
├── package.json         # Node.js配置
└── requirements.txt     # Python依赖
```

## 配置API密钥

创建 `config.json`:
```json
{
  "alipay": {
    "app_id": "YOUR_APP_ID",
    "private_key": "YOUR_PRIVATE_KEY",
    "sandbox": true
  },
  "wechat": {
    "mch_id": "YOUR_MCH_ID",
    "app_id": "YOUR_APP_ID",
    "api_key": "YOUR_API_KEY"
  },
  "stripe": {
    "api_key": "sk_test_..."
  },
  "easypay": {
    "pid": "YOUR_PID",
    "key": "YOUR_KEY"
  }
}
```

## 使用示例

```bash
# 生成支付宝二维码
python main.py --amount 100 --provider alipay --config config.json

# 智能路由
python main.py --amount 5000 --provider auto

# 解析二维码
python main.py --parse qr_code.png

# 列出可用通道
python main.py --list
```

## 技术栈

- **前端**: Vanilla HTML/CSS/JS (无框架，极速加载)
- **后端**: Python 3.8+ + stdlib
- **加密**: pycryptodome (RSA2/MD5)
- **二维码**: qrcode + Pillow
- **桌面**: Electron + PyInstaller
- **部署**: Docker, GitHub Actions

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 支持

- GitHub Issues: [提交问题](https://github.com/yourname/alipayqr/issues)
- 邮箱: support@alipayqr.dev
