#!/usr/bin/env python3
"""文件管理器"""
import os
import shutil
import zipfile
from pathlib import Path
from typing import Union, List

class FileManager:
    """文件管理"""

    def __init__(self):
        self.current_dir = os.getcwd()
        self.root_dir = os.path.expanduser("~")

    def navigate(self, path: str = None) -> str:
        """切换目录"""
        if path:
            try:
                os.chdir(path)
                self.current_dir = os.getcwd()
            except Exception as e:
                return f"❌ 无法进入目录: `{str(e)}`"

        return self.list_dir()

    def list_dir(self, path: str = None) -> str:
        """列出目录内容"""
        target = path or self.current_dir

        try:
            items = os.listdir(target)
            dirs = []
            files = []

            for item in sorted(items):
                full_path = os.path.join(target, item)
                try:
                    stat = os.stat(full_path)
                    size = self._format_size(stat.st_size)
                    if os.path.isdir(full_path):
                        dirs.append(f"📁 `{item}/`")
                    else:
                        files.append(f"📄 `{item}` ({size})")
                except:
                    continue

            header = f"📂 **{target}**\n━━━━━━━━━━━━━━━━━━━━━\n"
            content = "\n".join(dirs + files) or "(空目录)"
            return header + content

        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def _format_size(self, size: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f}{unit}"
            size /= 1024
        return f"{size:.1f}TB"

    def read_file(self, path: str, lines: int = 50) -> str:
        """读取文件"""
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.readlines()[:lines]
            return f"📄 `{path}`\n```\n{''.join(content)}\n```"
        except Exception as e:
            return f"❌ 无法读取: `{str(e)}`"

    def download(self, path: str) -> Union[bytes, str]:
        """下载文件"""
        try:
            with open(path, 'rb') as f:
                return f.read()
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def upload(self, file_data: bytes, filename: str, dest: str = None) -> str:
        """上传文件"""
        try:
            dest = dest or self.current_dir
            filepath = os.path.join(dest, filename)
            with open(filepath, 'wb') as f:
                f.write(file_data)
            return f"✅ 已保存: `{filepath}`"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def delete(self, path: str) -> str:
        """删除文件/目录"""
        try:
            if os.path.isdir(path):
                shutil.rmtree(path)
                return f"🗑️ 已删除目录: `{path}`"
            else:
                os.remove(path)
                return f"🗑️ 已删除文件: `{path}`"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def zip_dir(self, path: str, output: str = None) -> str:
        """压缩目录"""
        try:
            output = output or f"{path}.zip"
            with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, os.path.dirname(path))
                        zf.write(file_path, arcname)
            return f"📦 已压缩: `{output}`"
        except Exception as e:
            return f"❌ 错误: `{str(e)}`"

    def search(self, pattern: str, path: str = None) -> str:
        """搜索文件"""
        path = path or self.root_dir
        results = []

        for root, dirs, files in os.walk(path):
            for name in files + dirs:
                if pattern.lower() in name.lower():
                    full = os.path.join(root, name)
                    results.append(f"• `{full}`")
                    if len(results) >= 20:
                        break
            if len(results) >= 20:
                break

        return f"🔍 搜索结果 (前20个):\n" + "\n".join(results) if results else "未找到匹配项"
