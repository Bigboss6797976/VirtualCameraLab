#!/usr/bin/env python3
"""盲签攻击"""
import hashlib
import random
from typing import Tuple, Optional

class BlindSignatureAttack:
    """盲签攻击实现"""

    def __init__(self):
        self.blinding_factors = {}

    def generate_blind(self, message: str, public_key_n: int) -> Tuple[int, int]:
        """生成盲化消息"""
        import math

        # 将消息转换为整数
        m = int(hashlib.sha256(message.encode()).hexdigest(), 16)

        # 生成随机盲化因子
        r = random.randint(2, public_key_n - 1)
        while math.gcd(r, public_key_n) != 1:
            r = random.randint(2, public_key_n - 1)

        # 盲化: m' = m * r^e mod n
        # 简化实现
        blinded = (m * r) % public_key_n

        self.blinding_factors[blinded] = r
        return blinded, r

    def unblind_signature(self, blinded_signature: int, public_key_n: int, blinded_message: int) -> int:
        """去盲化签名"""
        r = self.blinding_factors.get(blinded_message)
        if not r:
            raise ValueError("Blinding factor not found")

        # s = s' * r^-1 mod n
        import math
        r_inv = pow(r, -1, public_key_n)
        signature = (blinded_signature * r_inv) % public_key_n

        return signature

    def generate_offline_sign_payload(self, transaction_data: Dict, private_key: str) -> Dict:
        """生成离线签名 Payload"""
        # 模拟离线签名
        tx_hash = hashlib.sha256(json.dumps(transaction_data, sort_keys=True).encode()).hexdigest()

        return {
            "transaction": transaction_data,
            "hash": tx_hash,
            "signature": f"0x{tx_hash}",  # 简化
            "offline": True,
            "timestamp": int(time.time())
        }

    def verify_blind_signature(self, message: str, signature: int, public_key_n: int, public_key_e: int) -> bool:
        """验证盲签"""
        m = int(hashlib.sha256(message.encode()).hexdigest(), 16)
        # 验证: s^e mod n == m
        verified = pow(signature, public_key_e, public_key_n)
        return verified == m

import time
import json
