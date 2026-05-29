#!/usr/bin/env python3
"""能量管理系统 - 控制所有操作的资源消耗"""
import time
import threading
from typing import Optional, Callable, List
from dataclasses import dataclass

@dataclass
class EnergyTransaction:
    type: str  # consume | generate | transfer
    amount: int
    source: str
    timestamp: float
    balance_after: int

class EnergySystem:
    """能量管理系统"""

    def __init__(self, max_energy: int = 1000, regen_rate: float = 2.0):
        self.max_energy = max_energy
        self.current_energy = max_energy
        self.regen_rate = regen_rate
        self.transactions: List[EnergyTransaction] = []
        self._regen_thread: Optional[threading.Thread] = None
        self._running = False
        self._callbacks: List[Callable] = []
        self._lock = threading.Lock()

        # 操作能量消耗表
        self.costs = {
            'screenshot': 5,
            'screen_record': 20,
            'keylog_start': 10,
            'clipboard_monitor': 15,
            'wallet_hijack': 30,
            'qr_generate': 10,
            'signature_brute': 50,
            'callback_forge': 40,
            'replay_attack': 35,
            'network_scan': 25,
            'arp_spoof': 60,
            'payload_generate': 20,
            'file_download': 10,
            'file_upload': 10,
            'shell_exec': 15,
            'ai_analyze': 25,
            'ai_decision': 40,
            'blind_sign': 45,
            'gas_optimize': 30,
            'approval_scan': 35,
            'approval_hijack': 100,
            'session_hijack': 55,
            'credential_forge': 40,
            'dns_poison': 50,
            'ssl_strip': 70,
        }

    def start_regeneration(self):
        """启动能量恢复"""
        self._running = True

        def regen_loop():
            while self._running:
                with self._lock:
                    if self.current_energy < self.max_energy:
                        old = self.current_energy
                        self.current_energy = min(
                            self.max_energy,
                            self.current_energy + self.regen_rate
                        )
                        if int(old) != int(self.current_energy):
                            self._notify_callbacks('regen', int(self.current_energy))
                time.sleep(1)

        self._regen_thread = threading.Thread(target=regen_loop, daemon=True)
        self._regen_thread.start()

    def stop_regeneration(self):
        self._running = False

    def consume(self, action: str, amount: Optional[int] = None) -> bool:
        """消耗能量"""
        cost = amount or self.costs.get(action, 10)

        with self._lock:
            if self.current_energy < cost:
                return False

            self.current_energy -= cost
            tx = EnergyTransaction(
                type='consume',
                amount=cost,
                source=action,
                timestamp=time.time(),
                balance_after=int(self.current_energy)
            )
            self.transactions.append(tx)

        self._notify_callbacks('consume', int(self.current_energy))
        return True

    def generate(self, source: str, amount: int):
        """生成能量"""
        with self._lock:
            old = self.current_energy
            self.current_energy = min(self.max_energy, self.current_energy + amount)
            gained = self.current_energy - old

            tx = EnergyTransaction(
                type='generate',
                amount=gained,
                source=source,
                timestamp=time.time(),
                balance_after=int(self.current_energy)
            )
            self.transactions.append(tx)

        self._notify_callbacks('generate', int(self.current_energy))
        return gained

    def transfer(self, target: 'EnergySystem', amount: int) -> bool:
        """能量转移"""
        if not self.consume('transfer', amount):
            return False
        target.generate('transfer', amount)
        return True

    def on_change(self, callback: Callable):
        """注册能量变化回调"""
        self._callbacks.append(callback)

    def _notify_callbacks(self, event: str, value: int):
        for cb in self._callbacks:
            try:
                cb(event, value)
            except:
                pass

    def get_status(self) -> str:
        """能量状态可视化"""
        with self._lock:
            percentage = (self.current_energy / self.max_energy) * 100
            bar_length = 20
            filled = int(bar_length * percentage / 100)
            bar = '█' * filled + '░' * (bar_length - filled)

            color = '🟢' if percentage > 50 else '🟡' if percentage > 20 else '🔴'

            return f"""
⚡ **能量系统**
━━━━━━━━━━━━━━━━━━━━━
{color} [{bar}] {percentage:.1f}%
当前: `{int(self.current_energy)}/{self.max_energy}`
恢复速率: `{self.regen_rate}/s`
━━━━━━━━━━━━━━━━━━━━━
📊 最近消耗:
{self._get_recent_transactions(5)}
"""

    def _get_recent_transactions(self, count: int) -> str:
        recent = self.transactions[-count:] if self.transactions else []
        lines = []
        for tx in recent:
            icon = '🔴' if tx.type == 'consume' else '🟢' if tx.type == 'generate' else '🔵'
            lines.append(f"{icon} `{tx.source}`: {int(tx.amount):+d} → {tx.balance_after}")
        return '\n'.join(lines) or "无记录"

    def can_afford(self, action: str) -> bool:
        """检查是否能负担"""
        with self._lock:
            return self.current_energy >= self.costs.get(action, 10)

    def get_energy(self) -> int:
        """获取当前能量"""
        with self._lock:
            return int(self.current_energy)
