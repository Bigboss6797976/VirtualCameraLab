#!/usr/bin/env python3
"""通信加密模块"""
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa, padding as asym_padding
from cryptography.hazmat.primitives import hashes, serialization
import base64
import hashlib
import os

class AESEncryptor:
    """AES-256-CBC 加密通信"""

    def __init__(self, key: str):
        self.key = hashlib.sha256(key.encode()).digest()
        self.backend = default_backend()

    def encrypt(self, plaintext: str) -> str:
        iv = os.urandom(16)
        padder = padding.PKCS7(128).padder()
        padded = padder.update(plaintext.encode()) + padder.finalize()

        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=self.backend)
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(padded) + encryptor.finalize()

        return base64.b64encode(iv + ciphertext).decode()

    def decrypt(self, ciphertext: str) -> str:
        data = base64.b64decode(ciphertext)
        iv, encrypted = data[:16], data[16:]

        cipher = Cipher(algorithms.AES(self.key), modes.CBC(iv), backend=self.backend)
        decryptor = cipher.decryptor()
        padded = decryptor.update(encrypted) + decryptor.finalize()

        unpadder = padding.PKCS7(128).unpadder()
        plaintext = unpadder.update(padded) + unpadder.finalize()

        return plaintext.decode()

class RSACrypto:
    """RSA 非对称加密"""

    @staticmethod
    def generate_keypair():
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        return private_key, private_key.public_key()

    @staticmethod
    def encrypt_with_public(public_key, message: str) -> bytes:
        return public_key.encrypt(
            message.encode(),
            asym_padding.OAEP(
                mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

    @staticmethod
    def decrypt_with_private(private_key, ciphertext: bytes) -> str:
        return private_key.decrypt(
            ciphertext,
            asym_padding.OAEP(
                mgf=asym_padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        ).decode()

class HybridCrypto:
    """混合加密 - RSA + AES"""

    def __init__(self):
        self.rsa = RSACrypto()
        self.aes = None
        self.session_key = None

    def establish_session(self, public_key):
        """建立加密会话"""
        self.session_key = os.urandom(32)
        self.aes = AESEncryptor(base64.b64encode(self.session_key).decode())

        encrypted_key = self.rsa.encrypt_with_public(public_key, base64.b64encode(self.session_key).decode())
        return encrypted_key
