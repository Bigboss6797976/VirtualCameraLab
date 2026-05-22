#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AlipayQR v3.0 - Core Engine"""
import sys, os, json, base64, hashlib, time, uuid, re
from datetime import datetime
from dataclasses import dataclass
from typing import Optional, Dict, List
from enum import Enum

try:
    import qrcode
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    os.system(f"{sys.executable} -m pip install qrcode[pil] -q")
    import qrcode
    from PIL import Image, ImageDraw, ImageFont

class ChannelType(Enum):
    ALIPAY = "alipay"
    WECHAT = "wechat"
    STRIPE = "stripe"
    EASYPAY = "easypay"

@dataclass
class PaymentResult:
    qr_code: str
    out_trade_no: str
    provider: str
    fee_rate: str
    settlement: str
    amount: str
    subject: str
    channel: ChannelType

class ConfigManager:
    DEFAULT_CONFIG = {
        'alipay': {'app_id': '', 'private_key': '', 'alipay_public_key': '', 'sandbox': True},
        'easypay': {'pid': '', 'key': '', 'api_url': 'https://pay.easypay.com'},
        'wechat': {'mch_id': '', 'app_id': '', 'api_key': ''},
        'stripe': {'api_key': '', 'webhook_secret': ''},
    }
    def __init__(self, config_path: Optional[str] = None):
        self.config = self.DEFAULT_CONFIG.copy()
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                self.config.update(json.load(f))
    def save(self, path: str):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)

class PaymentProvider:
    def __init__(self, name: str, config: dict):
        self.name = name
        self.config = config
        self.enabled = bool(config.get('app_id') or config.get('pid') or config.get('api_key') or config.get('mch_id'))
    def create_order(self, amount: str, subject: str, out_trade_no: Optional[str] = None) -> PaymentResult:
        raise NotImplementedError
    def _generate_no(self) -> str:
        return f"QR{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6].upper()}"

class AlipayOfficial(PaymentProvider):
    def __init__(self, config: dict):
        super().__init__("支付宝官方", config)
        self.gateway = 'https://openapi.alipaydev.com/gateway.do' if config.get('sandbox', True) else 'https://openapi.alipay.com/gateway.do'
    def create_order(self, amount: str, subject: str, out_trade_no: Optional[str] = None) -> PaymentResult:
        if not out_trade_no: out_trade_no = self._generate_no()
        biz_content = json.dumps({"out_trade_no": out_trade_no, "total_amount": str(amount), "subject": subject, "timeout_express": "90m"}, ensure_ascii=False)
        params = {"app_id": self.config['app_id'], "method": "alipay.trade.precreate", "charset": "utf-8", "sign_type": "RSA2", "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "version": "1.0", "biz_content": biz_content}
        sign = self._rsa_sign(params); params["sign"] = sign
        encoded = base64.urlsafe_b64encode(f"{self.config['app_id']}:{out_trade_no}:{amount}:{int(time.time())}".encode()).decode().rstrip('=')
        return PaymentResult(qr_code=f"https://qr.alipay.com/bax{encoded}", out_trade_no=out_trade_no, provider=self.name, fee_rate='0.6%', settlement='D+1', amount=amount, subject=subject, channel=ChannelType.ALIPAY)
    def _rsa_sign(self, params: dict) -> str:
        sorted_params = sorted(params.items())
        content = '&'.join([f"{k}={v}" for k, v in sorted_params if v and k != 'sign'])
        return base64.b64encode(hashlib.sha256(f"{content}{self.config.get('app_id','')}".encode()).digest()).decode()

class EasyPay(PaymentProvider):
    def __init__(self, config: dict): super().__init__("易支付", config)
    def create_order(self, amount: str, subject: str, out_trade_no: Optional[str] = None) -> PaymentResult:
        if not out_trade_no: out_trade_no = self._generate_no()
        params = {'pid': self.config['pid'], 'type': 'alipay', 'out_trade_no': out_trade_no, 'notify_url': 'https://your-domain.com/notify', 'return_url': 'https://your-domain.com/return', 'name': subject, 'money': str(amount), 'clientip': '127.0.0.1', 'device': 'pc', 'timestamp': str(int(time.time()))}
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted(params.items()) if v and k != 'sign'])
        params['sign'] = hashlib.md5(f"{sign_str}{self.config['key']}".encode()).hexdigest(); params['sign_type'] = 'MD5'
        return PaymentResult(qr_code=f"{self.config['api_url']}/pay/{out_trade_no}?sign={params['sign']}", out_trade_no=out_trade_no, provider=self.name, fee_rate='1.0%', settlement='D+0', amount=amount, subject=subject, channel=ChannelType.EASYPAY)

class WechatPay(PaymentProvider):
    def __init__(self, config: dict): super().__init__("微信官方", config)
    def create_order(self, amount: str, subject: str, out_trade_no: Optional[str] = None) -> PaymentResult:
        if not out_trade_no: out_trade_no = self._generate_no()
        amount_fen = int(float(amount) * 100)
        params = {'appid': self.config['app_id'], 'mch_id': self.config['mch_id'], 'nonce_str': uuid.uuid4().hex[:16], 'body': subject, 'out_trade_no': out_trade_no, 'total_fee': amount_fen, 'spbill_create_ip': '127.0.0.1', 'notify_url': 'https://your-domain.com/wxnotify', 'trade_type': 'NATIVE'}
        sign_str = '&'.join([f"{k}={v}" for k, v in sorted(params.items())])
        params['sign'] = hashlib.md5(f"{sign_str}&key={self.config['api_key']}".encode()).hexdigest().upper()
        return PaymentResult(qr_code=f"weixin://wxpay/bizpayurl?pr={out_trade_no[:16]}", out_trade_no=out_trade_no, provider=self.name, fee_rate='0.6%', settlement='D+1', amount=amount, subject=subject, channel=ChannelType.WECHAT)

class StripePay(PaymentProvider):
    def __init__(self, config: dict): super().__init__("Stripe", config)
    def create_order(self, amount: str, subject: str, out_trade_no: Optional[str] = None) -> PaymentResult:
        if not out_trade_no: out_trade_no = self._generate_no()
        return PaymentResult(qr_code=f"https://stripe.com/pay/{out_trade_no}", out_trade_no=out_trade_no, provider=self.name, fee_rate='2.9% + ¥1.5', settlement='T+7', amount=amount, subject=subject, channel=ChannelType.STRIPE)

class PaymentAggregator:
    def __init__(self, config: Optional[dict] = None):
        self.providers: Dict[str, PaymentProvider] = {}
        self.config = config or ConfigManager().config
        self._init_providers()
    def _init_providers(self):
        if self.config['alipay'].get('app_id'): self.add(AlipayOfficial(self.config['alipay']))
        if self.config['easypay'].get('pid'): self.add(EasyPay(self.config['easypay']))
        if self.config['wechat'].get('mch_id'): self.add(WechatPay(self.config['wechat']))
        if self.config['stripe'].get('api_key'): self.add(StripePay(self.config['stripe']))
    def add(self, provider: PaymentProvider):
        if provider.enabled: self.providers[provider.name] = provider
    def list(self) -> List[str]: return list(self.providers.keys())
    def select(self, amount: str, prefer: str = 'auto') -> PaymentProvider:
        if prefer != 'auto' and prefer in self.providers: return self.providers[prefer]
        amount_f = float(amount)
        if amount_f < 100 and '易支付' in self.providers: return self.providers['易支付']
        if '支付宝官方' in self.providers: return self.providers['支付宝官方']
        if amount_f > 1000 and 'Stripe' in self.providers: return self.providers['Stripe']
        if self.providers: return list(self.providers.values())[0]
        raise ValueError("没有可用通道")
    def pay(self, amount: str, subject: str, prefer: str = 'auto') -> PaymentResult:
        provider = self.select(amount, prefer)
        return provider.create_order(amount, subject)

class QRRenderer:
    COLORS = {'alipay_blue': (22, 119, 255), 'white': (255, 255, 255), 'green': (126, 211, 33), 'dark': (50, 50, 50)}
    @classmethod
    def render(cls, qr_url: str, avatar_path: Optional[str] = None, output_path: str = "alipay_qr.png") -> str:
        BLUE, WHITE, GREEN, DARK = cls.COLORS['alipay_blue'], cls.COLORS['white'], cls.COLORS['green'], cls.COLORS['dark']
        width, height = 854, 1280
        img = Image.new('RGB', (width, height), BLUE); draw = ImageDraw.Draw(img)
        fonts = cls._load_fonts()
        draw.rectangle([0, 0, width, 214], fill=WHITE)
        lx, ly = 248, 55
        draw.rounded_rectangle([lx, ly, lx+80, ly+60], radius=12, fill=BLUE)
        draw.text((lx+16, ly+6), "支", fill=WHITE, font=fonts['logo'])
        draw.text((lx+98, ly+6), "支付宝", fill=DARK, font=fonts['logo'])
        draw.text((width//2-270, 248), "推荐使用支付宝", fill=WHITE, font=fonts['title'])
        cl, cr, ct, cb = 158, 696, 340, 1119
        draw.rectangle([cl, ct, cr, cb], fill=WHITE)
        qr = qrcode.QRCode(version=5, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=2)
        qr.add_data(qr_url); qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
        qr_size = 510; qr_img = qr_img.resize((qr_size, qr_size), Image.LANCZOS)
        qr_img = cls._add_avatar(qr_img, avatar_path)
        qx = (width - qr_size) // 2; qy = ct + 20
        img.paste(qr_img, (qx, qy))
        img = cls._add_balls(img, ct); draw = ImageDraw.Draw(img)
        scan = "打开支付宝[扫一扫]"; bbox = draw.textbbox((0,0), scan, font=fonts['scan']); sw = bbox[2]-bbox[0]
        draw.text(((width-sw)//2, qy+qr_size+45), scan, fill=BLUE, font=fonts['scan'])
        bottom = "支付得蚂蚁森林能量"; bbox = draw.textbbox((0,0), bottom, font=fonts['bottom']); bw = bbox[2]-bbox[0]
        draw.text(((width-bw)//2, cb+55), bottom, fill=WHITE, font=fonts['bottom'])
        img.save(output_path, 'PNG', quality=95); return output_path
    @classmethod
    def _load_fonts(cls) -> dict:
        paths = ["/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc", "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc", "assets/fonts/wqy-zenhei.ttc"]
        for fp in paths:
            if os.path.exists(fp):
                try: return {'logo': ImageFont.truetype(fp, 52), 'title': ImageFont.truetype(fp, 62), 'scan': ImageFont.truetype(fp, 34), 'bottom': ImageFont.truetype(fp, 50), 'energy': ImageFont.truetype(fp, 22)}
                except: pass
        return {k: ImageFont.load_default() for k in ['logo','title','scan','bottom','energy']}
    @classmethod
    def _add_avatar(cls, qr_img: Image.Image, avatar_path: Optional[str]) -> Image.Image:
        size, border = 100, 4; cx = (qr_img.width - size) // 2; cy = (qr_img.height - size) // 2
        overlay = Image.new('RGBA', qr_img.size, (0,0,0,0)); draw = ImageDraw.Draw(overlay)
        draw.rectangle([cx-border, cy-border, cx+size+border, cy+size+border], fill=(255,255,255,255))
        if avatar_path and os.path.exists(avatar_path):
            try: avatar = Image.open(avatar_path).convert('RGB'); avatar = avatar.resize((size, size), Image.LANCZOS); overlay.paste(avatar, (cx, cy))
            except: cls._draw_default_avatar(draw, cx, cy, size)
        else: cls._draw_default_avatar(draw, cx, cy, size)
        return Image.alpha_composite(qr_img.convert('RGBA'), overlay).convert('RGB')
    @classmethod
    def _draw_default_avatar(cls, draw: ImageDraw.Draw, x: int, y: int, size: int):
        draw.rectangle([x, y, x+size, y+size], fill=(200,220,200,255)); fc = x + size//2; fy = y + size//2 + 3
        draw.ellipse([fc-30, fy-35, fc+30, fy+5], fill=(50,35,25,255)); draw.ellipse([fc-20, fy-18, fc+20, fy+18], fill=(255,220,200,255)); draw.ellipse([fc-32, fy+12, fc+32, y+size-3], fill=(250,250,250,255))
    @classmethod
    def _add_balls(cls, img: Image.Image, card_top: int) -> Image.Image:
        GREEN = cls.COLORS['green']; overlay = Image.new('RGBA', img.size, (0,0,0,0)); draw = ImageDraw.Draw(overlay)
        def ball(x: int, y: int, size: int):
            for i in range(5): offset = i * 6; alpha = 60 - i * 10; r = int(GREEN[0] + i * 15); g = int(GREEN[1] + i * 8); b = int(GREEN[2] + i * 5); draw.ellipse([x-offset, y-offset, x+size+offset, y+size+offset], fill=(r,g,b,alpha))
            draw.ellipse([x, y, x+size, y+size], fill=(*GREEN,255)); draw.ellipse([x+size//5, y+size//10, x+size//2, y+size//3], fill=(255,255,255,240)); draw.ellipse([x+size//3, y+size//8, x+size//2+10, y+size//4], fill=(255,255,255,255))
        fonts = cls._load_fonts()
        ball(15, 720, 68); draw.text((19, 792), "绿色\n能量", fill=(255,255,255,255), font=fonts['energy'])
        ball(img.width-88, 318, 60); draw.text((img.width-84, 382), "绿色\n能量", fill=(255,255,255,255), font=fonts['energy'])
        ball(img.width-83, 1002, 64); draw.text((img.width-79, 1072), "绿色\n能量", fill=(255,255,255,255), font=fonts['energy'])
        return Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')

class QRParser:
    @staticmethod
    def parse_image(image_path: str) -> Optional[dict]:
        try:
            from pyzbar.pyzbar import decode; img = Image.open(image_path); decoded = decode(img)
            if decoded: return QRParser.parse_url(decoded[0].data.decode('utf-8'))
        except ImportError: print("安装: pip install pyzbar")
        return None
    @staticmethod
    def parse_url(url: str) -> dict:
        result = {'original_url': url, 'type': 'unknown', 'user_id': None, 'amount': None}
        if 'qr.alipay.com' in url:
            result['type'] = 'alipay'; match = re.search(r'fkx([A-Za-z0-9_-]+)', url)
            if match:
                try: encoded = match.group(1); padding = 4 - len(encoded) % 4; encoded += '=' * padding if padding != 4 else ''; decoded = base64.urlsafe_b64decode(encoded).decode(); params = json.loads(decoded); result.update(params)
                except: pass
        elif 'weixin://' in url: result['type'] = 'wechat'
        elif 'stripe.com' in url: result['type'] = 'stripe'
        return result
