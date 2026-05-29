#!/usr/bin/env python3
"""网络工具"""
import socket
import requests
import subprocess
import concurrent.futures
from typing import List, Tuple

class NetworkModule:
    """网络工具"""

    def __init__(self):
        self.common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443]

    def ip_info(self) -> str:
        """获取 IP 信息"""
        try:
            resp = requests.get("https://ipapi.co/json/", timeout=10).json()
            return f"""
🌐 **IP 信息**
━━━━━━━━━━━━━━━━━━━━━
📍 IP: `{resp.get('ip', 'Unknown')}`
🏳️ 国家: `{resp.get('country_name', 'Unknown')}`
🏙️ 城市: `{resp.get('city', 'Unknown')}`
📡 ISP: `{resp.get('org', 'Unknown')}`
🕐 时区: `{resp.get('timezone', 'Unknown')}`
"""
        except Exception as e:
            return f"❌ 查询失败: `{str(e)}`"

    def port_scan(self, target: str, ports: List[int] = None) -> str:
        """端口扫描"""
        ports = ports or self.common_ports
        open_ports = []

        def check_port(port: int) -> Tuple[int, bool]:
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.settimeout(1)
                    result = s.connect_ex((target, port))
                    return port, result == 0
            except:
                return port, False

        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            results = executor.map(check_port, ports)

        for port, is_open in results:
            if is_open:
                service = self._get_service_name(port)
                open_ports.append(f"🔓 `{port}` ({service})")

        if open_ports:
            return f"🔍 **{target} 开放端口**\n━━━━━━━━━━━━━━━━━━━━━\n" + "\n".join(open_ports)
        return f"🔒 **{target}** 未检测到开放端口"

    def _get_service_name(self, port: int) -> str:
        services = {
            21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
            53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP",
            443: "HTTPS", 445: "SMB", 3306: "MySQL",
            3389: "RDP", 5432: "PostgreSQL", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt"
        }
        return services.get(port, "Unknown")

    def ping(self, target: str, count: int = 4) -> str:
        """Ping 测试"""
        try:
            result = subprocess.run(
                ["ping", "-c", str(count), target],
                capture_output=True, text=True, timeout=30
            )
            return f"```\n{result.stdout[:2000]}\n```"
        except Exception as e:
            return f"❌ Ping 失败: `{str(e)}`"

    def download_speed(self) -> str:
        """测速"""
        try:
            import time
            start = time.time()
            resp = requests.get("https://speed.hetzner.de/10MB.bin", timeout=30)
            elapsed = time.time() - start
            speed = (10 / elapsed) * 8
            return f"⚡ **下载速度**: `{speed:.2f} Mbps` ({elapsed:.2f}s)"
        except Exception as e:
            return f"❌ 测速失败: `{str(e)}`"

    def dns_lookup(self, domain: str) -> str:
        """DNS 查询"""
        try:
            result = socket.gethostbyname_ex(domain)
            return f"""
🔍 **DNS 查询: {domain}**
━━━━━━━━━━━━━━━━━━━━━
🖥️ 主机名: `{result[0]}`
📍 别名: `{', '.join(result[1]) or 'None'}`
🌐 IP: `{', '.join(result[2])}`
"""
        except Exception as e:
            return f"❌ 查询失败: `{str(e)}`"
