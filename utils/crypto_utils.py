#!/usr/bin/env python3
"""加密工具"""
import hashlib
import base64
import os
from typing import Union

class CryptoUtils:
    """加密工具集"""

    @staticmethod
    def sha256(data: Union[str, bytes]) -> str:
        """SHA256 哈希"""
        if isinstance(data, str):
            data = data.encode()
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def md5(data: Union[str, bytes]) -> str:
        """MD5 哈希"""
        if isinstance(data, str):
            data = data.encode()
        return hashlib.md5(data).hexdigest()

    @staticmethod
    def base64_encode(data: Union[str, bytes]) -> str:
        """Base64 编码"""
        if isinstance(data, str):
            data = data.encode()
        return base64.b64encode(data).decode()

    @staticmethod
    def base64_decode(data: str) -> str:
        """Base64 解码"""
        return base64.b64decode(data).decode()

    @staticmethod
    def generate_nonce(length: int = 16) -> str:
        """生成随机 nonce"""
        return base64.b64encode(os.urandom(length)).decode()[:length]

    @staticmethod
    def hmac_sha256(key: str, message: str) -> str:
        """HMAC-SHA256"""
        import hmac
        return hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest()
