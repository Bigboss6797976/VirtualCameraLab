#!/usr/bin/env python3
"""QR 码伪造攻击 (Termux兼容版)"""
import qrcode
import io
import base64
from typing import Optional

class QRForgery:
    """支付 QR 码伪造 - 纯 Python"""

    def __init__(self):
        self.is_termux = __import__('os').path.exists("/data/data/com.termux")

    def generate_payment_qr(self, amount: float, address: str, chain: str = "usdt_trc20") -> bytes:
        """生成伪造的支付 QR 码"""

        if chain == "usdt_trc20":
            qr_data = f"tron:{address}?amount={amount}&token=USDT"
        elif chain == "usdt_erc20":
            qr_data = f"ethereum:{address}?amount={amount}&token=USDT"
        elif chain == "alipay":
            qr_data = f"https://qr.alipay.com/fkx{base64.b64encode(f'{amount}:{address}'.encode()).decode()[:16]}"
        else:
            qr_data = address

        qr = qrcode.QRCode(
            version=3,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        # 使用纯 SVG 输出 (不需要 Pillow)
        try:
            from qrcode.image.svg import SvgImage
            img = qr.make_image(image_factory=SvgImage)
            buf = io.BytesIO()
            img.save(buf)
            return buf.getvalue()
        except:
            # 回退到标准 PNG
            img = qr.make_image(fill_color="black", back_color="white")
            buf = io.BytesIO()
            img.save(buf, format='PNG')
            return buf.getvalue()

    def generate_fake_receipt(self, tx_hash: str, amount: float, from_addr: str, to_addr: str) -> str:
        """生成伪造的交易凭证 (文本版)"""
        receipt = f"""
╔══════════════════════════════════════╗
║          💰 交易成功                  ║
╠══════════════════════════════════════╣
║  金额: -{amount:.2f} USDT                ║
║                                      ║
║  付款方: {from_addr[:20]}...          ║
║  收款方: {to_addr[:20]}...            ║
║                                      ║
║  交易哈希: {tx_hash[:25]}...         ║
║  时间: 2024-01-01 12:00:00           ║
║  状态: ✅ 已确认 (12/12)             ║
║  Gas: 0.0001 TRX                     ║
║                                      ║
║     [已确认]                         ║
╚══════════════════════════════════════╝
"""
        return receipt
