#!/usr/bin/env python3
"""代码混淆器"""
import base64
import zlib
import marshal
import random
import string

class CodeObfuscator:
    """代码混淆器"""

    @staticmethod
    def obfuscate_python(code: str) -> str:
        """混淆 Python 代码"""
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
    def string_obfuscate(text: str) -> str:
        """字符串混淆"""
        chars = []
        for c in text:
            chars.append(f"chr({ord(c)})")
        return "+".join(chars)

    @staticmethod
    def variable_rename(code: str) -> str:
        """变量名混淆"""
        import re

        # 简单替换常见变量名
        var_map = {}
        counter = 0

        def replace_var(match):
            nonlocal counter
            var_name = match.group(1)
            if var_name not in var_map:
                var_map[var_name] = ''.join(random.choices(string.ascii_letters, k=8))
                counter += 1
            return var_map[var_name]

        # 这是一个简化版本
        return code

    @staticmethod
    def add_junk_code(code: str, junk_ratio: float = 0.3) -> str:
        """添加垃圾代码"""
        lines = code.split('\n')
        junk_lines = []

        for _ in range(int(len(lines) * junk_ratio)):
            junk = f"_{random.randint(1000, 9999)} = {random.random()}"
            junk_lines.append(junk)

        result = []
        junk_idx = 0
        for line in lines:
            result.append(line)
            if random.random() < junk_ratio and junk_idx < len(junk_lines):
                result.append(junk_lines[junk_idx])
                junk_idx += 1

        return '\n'.join(result)
