#!/usr/bin/env python3
"""屏幕监控 (Termux兼容版)"""
import os
import io
import time
import threading
import subprocess
from typing import Optional, Callable

class ScreenMonitor:
    """屏幕监控 - 支持 Termux"""

    def __init__(self):
        self.recording = False
        self.record_thread = None
        self.frames = []
        self.callback: Optional[Callable] = None
        self.is_termux = os.path.exists("/data/data/com.termux")

    def capture(self, quality: int = 85) -> Optional[bytes]:
        """单张截图"""
        try:
            if self.is_termux:
                # Termux: 使用 screencap
                result = subprocess.run(
                    ["screencap", "-p", "/sdcard/screen.png"],
                    capture_output=True, timeout=10
                )
                if result.returncode == 0:
                    with open("/sdcard/screen.png", "rb") as f:
                        return f.read()
                return None
            else:
                # 标准环境: 使用 pyautogui
                import pyautogui
                from PIL import Image

                screenshot = pyautogui.screenshot()
                buf = io.BytesIO()
                screenshot.save(buf, format='JPEG', quality=quality)
                return buf.getvalue()
        except Exception as e:
            print(f"Screen capture error: {e}")
            return None

    def start_live(self, interval: float = 2.0, callback=None):
        """开始实时屏幕监控"""
        if self.recording:
            return "已经在监控中"

        self.recording = True
        self.callback = callback
        self.frames = []

        def capture_loop():
            while self.recording:
                frame = self.capture(quality=60)
                if frame and self.callback:
                    self.callback(frame)
                time.sleep(interval)

        self.record_thread = threading.Thread(target=capture_loop, daemon=True)
        self.record_thread.start()
        return "✅ 屏幕监控已启动"

    def stop_live(self) -> str:
        """停止监控"""
        self.recording = False
        if self.record_thread:
            self.record_thread.join(timeout=2)
        return "🛑 屏幕监控已停止"
