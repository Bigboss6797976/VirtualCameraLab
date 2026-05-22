# [Showoff Saturday] AlipayQR v3.0 - Multi-Channel Payment QR Code Generator

## What is it?

AlipayQR is a **self-hosted, open-source payment QR code generator** that supports multiple real payment providers. Unlike other QR generators that only create static URLs, this one integrates with actual payment APIs to generate scannable codes that process real transactions.

## Supported Payment Channels (All Real APIs)

| Channel | API | Settlement | Fee |
|---------|-----|------------|-----|
| **Alipay** | `alipay.trade.precreate` | D+1 | 0.6% |
| **WeChat Pay** | `unifiedorder` (Native) | D+1 | 0.6% |
| **Stripe** | PaymentIntent | T+7 | 2.9%+$0.30 |
| **EasyPay** | submit.php/mapi.php | D+0 | 1.0% |

## Key Features

- **Smart Routing** - Auto-selects optimal channel based on amount
- **Real API Signing** - RSA2/MD5 signatures, not mock data
- **QR Parser** - Extract URLs from existing payment QR codes
- **Cross-Platform** - Web PWA, iOS, Android, Windows, macOS, Linux
- **CLI Tool** - Full command-line interface with batch generation
- **Custom Styling** - Avatars, colors, sizes
- **Offline Signing** - Generate signatures without internet
- **Blind Signatures** - Privacy-preserving signature scheme

## Quick Start

```bash
# Clone
git clone https://github.com/yourname/alipayqr.git
cd alipayqr

# Install
pip install -r requirements.txt

# Generate real Alipay QR (requires API keys)
python main.py --provider alipay --amount 100 \
  --app-id YOUR_APPID --private-key ./private.pem

# Smart routing
python main.py --provider auto --amount 5000

# Parse existing QR
python main.py --parse qr_code.png
```

## Web Interface

Just open `index.html` in any browser - no build step needed. Works offline as a PWA.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no frameworks, loads instantly)
- **Backend**: Python stdlib + qrcode + Pillow + pycryptodome
- **Mobile**: Capacitor wrappers for native iOS/Android apps
- **Desktop**: Electron + PyInstaller for standalone executables
- **Deploy**: Docker, GitHub Actions CI/CD

## GitHub

**[github.com/yourname/alipayqr](https://github.com/yourname/alipayqr)**

MIT License. Contributions welcome!

---

*Edit: Thanks for all the interest! Common questions:*

- *Yes, all 4 payment channels use real APIs with proper authentication*
- *No, I don't store any API keys - everything is local/AES-256 encrypted*
- *The smart routing picks EasyPay for <$100, Alipay for $100-$5000, Stripe for >$5000*
- *For testing, all providers have sandbox environments*
