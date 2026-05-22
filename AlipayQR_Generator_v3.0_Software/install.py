#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AlipayQR v3.0 - 安装向导"""
import os, sys, platform, shutil, subprocess
from pathlib import Path

def print_banner():
    print("""
╔══════════════════════════════════════════╗
║     AlipayQR v3.0 - 安装向导             ║
║     多通道聚合收款码生成器               ║
╚══════════════════════════════════════════╝
""")

def check_python():
    print("[*] 检查Python环境...")
    v = sys.version_info
    if v.major < 3 or (v.major == 3 and v.minor < 8):
        print("[!] 需要Python 3.8+")
        return False
    print(f"[+] Python {v.major}.{v.minor}.{v.micro} OK")
    return True

def install_deps():
    print("[*] 安装依赖...")
    deps = ["qrcode[pil]", "Pillow", "pycryptodome", "cryptography", "requests"]
    for dep in deps:
        print(f"    安装 {dep}...")
        subprocess.run([sys.executable, "-m", "pip", "install", dep, "-q"], check=True)
    print("[+] 依赖安装完成")

def create_shortcut():
    system = platform.system()
    desktop = Path.home() / "Desktop"

    if system == "Windows":
        # Windows快捷方式
        try:
            import winshell
            from win32com.client import Dispatch
            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(str(desktop / "AlipayQR.lnk"))
            shortcut.Targetpath = sys.executable
            shortcut.Arguments = f'"{os.path.abspath("main.py")" --gui'
            shortcut.WorkingDirectory = os.path.abspath(".")
            shortcut.IconLocation = os.path.abspath("assets/icons/icon.ico")
            shortcut.save()
            print(f"[+] 桌面快捷方式已创建: {desktop / 'AlipayQR.lnk'}")
        except:
            print("[!] 无法创建Windows快捷方式")
    elif system == "Darwin":
        # macOS
        app_dir = Path.home() / "Applications" / "AlipayQR.app"
        app_dir.mkdir(parents=True, exist_ok=True)
        (app_dir / "Contents" / "MacOS").mkdir(parents=True, exist_ok=True)
        script = app_dir / "Contents" / "MacOS" / "AlipayQR"
        with open(script, 'w') as f:
            f.write(f'#!/bin/bash
cd "{os.path.abspath(".")}"
{sys.executable} main.py --gui
')
        os.chmod(script, 0o755)
        print(f"[+] macOS应用已创建: {app_dir}")
    else:
        # Linux
        apps_dir = Path.home() / ".local" / "share" / "applications"
        apps_dir.mkdir(parents=True, exist_ok=True)
        desktop_file = apps_dir / "alipayqr.desktop"
        with open(desktop_file, 'w') as f:
            f.write(f"""[Desktop Entry]
Name=AlipayQR
Exec={sys.executable} {os.path.abspath("main.py")} --gui
Icon={os.path.abspath("assets/icons/icon.png")}
Type=Application
Categories=Office;Finance;
Terminal=false
""")
        print(f"[+] Linux桌面入口已创建: {desktop_file}")

def main():
    print_banner()
    if not check_python():
        input("按Enter退出...")
        return
    try:
        install_deps()
        create_shortcut()
        print("
" + "="*40)
        print("[+] 安装完成!")
        print("="*40)
        print("
使用方式:")
        print("  1. 双击桌面快捷方式启动GUI")
        print("  2. 命令行: python main.py --help")
        print("  3. Web模式: python main.py --web")
    except Exception as e:
        print(f"
[!] 安装失败: {e}")
    input("
按Enter退出...")

if __name__ == '__main__':
    main()
