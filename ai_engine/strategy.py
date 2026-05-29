#!/usr/bin/env python3
"""攻击策略生成器"""
import json
import random
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class AttackChain:
    name: str
    description: str
    steps: List[Dict]
    total_energy: int
    success_probability: float
    estimated_time: int

    def to_visual(self) -> str:
        visual = f"""
🔗 **{self.name}**
{self.description}
━━━━━━━━━━━━━━━━━━━━━
"""
        for i, step in enumerate(self.steps, 1):
            icon = '✅' if step.get('completed') else '⏳' if step.get('active') else '⬜'
            visual += f"{icon} **Step {i}**: {step['name']}
"
            visual += f"   工具: `{', '.join(step['tools'])}`
"
            visual += f"   能量: `{step['energy']}` | 风险: `{step['risk']}`

"

        visual += f"""
📊 **统计**
总能量: `{self.total_energy}`
成功率: `{self.success_probability*100:.1f}%`
预计时间: `{self.estimated_time}s`
"""
        return visual

class StrategyGenerator:
    """攻击策略生成器"""

    def __init__(self):
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict:
        return {
            "wallet_drain": {
                "name": "💰 钱包抽空链",
                "description": "通过剪切板劫持 + QR伪造 + 授权劫持完整抽空目标钱包",
                "base_steps": [
                    {"name": "侦察目标钱包", "tools": ["blockchain_scanner"], "energy": 20, "risk": "LOW"},
                    {"name": "部署剪切板监控", "tools": ["clipboard_monitor"], "energy": 30, "risk": "LOW"},
                    {"name": "等待地址复制", "tools": ["wallet_hijack"], "energy": 40, "risk": "MEDIUM"},
                    {"name": "伪造支付QR", "tools": ["qr_forgery"], "energy": 25, "risk": "MEDIUM"},
                    {"name": "检查授权额度", "tools": ["approval_scanner"], "energy": 35, "risk": "HIGH"},
                    {"name": "执行授权劫持", "tools": ["approval_hijack"], "energy": 100, "risk": "CRITICAL"},
                ]
            },
            "payment_gateway_bypass": {
                "name": "🚪 支付网关绕过",
                "description": "通过回调伪造 + 金额篡改 + 签名攻击绕过支付验证",
                "base_steps": [
                    {"name": "分析支付流程", "tools": ["traffic_analyzer"], "energy": 30, "risk": "LOW"},
                    {"name": "捕获回调请求", "tools": ["packet_capture"], "energy": 40, "risk": "MEDIUM"},
                    {"name": "破解签名密钥", "tools": ["signature_brute"], "energy": 80, "risk": "HIGH"},
                    {"name": "篡改支付金额", "tools": ["amount_tamper"], "energy": 50, "risk": "HIGH"},
                    {"name": "发送伪造回调", "tools": ["callback_spoof"], "energy": 60, "risk": "CRITICAL"},
                    {"name": "验证绕过结果", "tools": ["response_analyzer"], "energy": 20, "risk": "MEDIUM"},
                ]
            },
            "credential_harvest": {
                "name": "🎣 凭证收割",
                "description": "通过键盘记录 + 屏幕监控 + 钓鱼页面收集凭证",
                "base_steps": [
                    {"name": "部署键盘记录", "tools": ["keylogger"], "energy": 25, "risk": "LOW"},
                    {"name": "启动屏幕监控", "tools": ["screen_capture"], "energy": 35, "risk": "LOW"},
                    {"name": "生成钓鱼页面", "tools": ["phishing_generator"], "energy": 40, "risk": "MEDIUM"},
                    {"name": "等待凭证输入", "tools": ["input_monitor"], "energy": 30, "risk": "MEDIUM"},
                    {"name": "提取凭证数据", "tools": ["data_extractor"], "energy": 25, "risk": "HIGH"},
                    {"name": "验证凭证有效", "tools": ["credential_tester"], "energy": 35, "risk": "CRITICAL"},
                ]
            },
            "network_infiltration": {
                "name": "🌐 网络渗透",
                "description": "通过 ARP欺骗 + 流量拦截 + 中间人攻击渗透网络",
                "base_steps": [
                    {"name": "网络扫描", "tools": ["port_scanner"], "energy": 30, "risk": "LOW"},
                    {"name": "ARP欺骗", "tools": ["arp_spoof"], "energy": 80, "risk": "HIGH"},
                    {"name": "流量拦截", "tools": ["packet_sniffer"], "energy": 60, "risk": "HIGH"},
                    {"name": "SSL剥离", "tools": ["ssl_strip"], "energy": 70, "risk": "CRITICAL"},
                    {"name": "凭证提取", "tools": ["credential_extractor"], "energy": 50, "risk": "CRITICAL"},
                ]
            },
            "gas_optimization_attack": {
                "name": "⛽ Gas优化攻击",
                "description": "通过Gas优化 + 盲签 + 离线签名实现零成本攻击",
                "base_steps": [
                    {"name": "分析Gas模式", "tools": ["gas_analyzer"], "energy": 25, "risk": "LOW"},
                    {"name": "生成盲签Payload", "tools": ["blind_sign"], "energy": 45, "risk": "MEDIUM"},
                    {"name": "离线签名交易", "tools": ["offline_signer"], "energy": 35, "risk": "MEDIUM"},
                    {"name": "Gas优化执行", "tools": ["gas_optimizer"], "energy": 30, "risk": "HIGH"},
                    {"name": "验证交易结果", "tools": ["tx_verifier"], "energy": 20, "risk": "LOW"},
                ]
            }
        }

    def generate_chain(self, target_type: str, target_data: Dict) -> Optional[AttackChain]:
        template = self._select_template(target_type)
        if not template:
            return None

        steps = []
        total_energy = 0

        for step in template["base_steps"]:
            adjusted = step.copy()
            adjusted['energy'] = int(step['energy'] * random.uniform(0.8, 1.2))
            adjusted['completed'] = False
            adjusted['active'] = False
            steps.append(adjusted)
            total_energy += adjusted['energy']

        security_level = target_data.get('security_level', 'MEDIUM')
        base_success = {'LOW': 0.9, 'MEDIUM': 0.7, 'HIGH': 0.5, 'CRITICAL': 0.3, 'FORTRESS': 0.1}
        success = base_success.get(security_level, 0.5) * random.uniform(0.9, 1.1)

        return AttackChain(
            name=template["name"],
            description=template["description"],
            steps=steps,
            total_energy=total_energy,
            success_probability=min(0.99, success),
            estimated_time=total_energy * 2
        )

    def _select_template(self, target_type: str) -> Optional[Dict]:
        mapping = {
            '钱包': 'wallet_drain',
            'wallet': 'wallet_drain',
            '支付': 'payment_gateway_bypass',
            'payment': 'payment_gateway_bypass',
            '凭证': 'credential_harvest',
            'credential': 'credential_harvest',
            '网络': 'network_infiltration',
            'network': 'network_infiltration',
            'gas': 'gas_optimization_attack',
            'blind': 'gas_optimization_attack',
        }
        key = mapping.get(target_type, 'wallet_drain')
        return self.templates.get(key)

    def optimize_chain(self, chain: AttackChain, energy_available: int) -> AttackChain:
        if chain.total_energy <= energy_available:
            return chain

        optimized_steps = []
        current_energy = 0

        for step in chain.steps:
            if current_energy + step['energy'] <= energy_available:
                optimized_steps.append(step)
                current_energy += step['energy']
            else:
                alt = self._find_alternative(step)
                if alt and current_energy + alt['energy'] <= energy_available:
                    optimized_steps.append(alt)
                    current_energy += alt['energy']

        return AttackChain(
            name=f"{chain.name} (优化版)",
            description=f"{chain.description}
[能量优化]",
            steps=optimized_steps,
            total_energy=current_energy,
            success_probability=chain.success_probability * 0.8,
            estimated_time=current_energy * 2
        )

    def _find_alternative(self, step: Dict) -> Optional[Dict]:
        alternatives = {
            "signature_brute": {"name": "签名绕过", "tools": ["signature_bypass"], "energy": 30, "risk": "MEDIUM"},
            "arp_spoof": {"name": "DNS投毒", "tools": ["dns_poison"], "energy": 50, "risk": "HIGH"},
            "ssl_strip": {"name": "HTTP降级", "tools": ["http_downgrade"], "energy": 40, "risk": "MEDIUM"},
            "approval_hijack": {"name": "授权扫描", "tools": ["approval_scanner"], "energy": 35, "risk": "HIGH"},
        }
        return alternatives.get(step['name'])
