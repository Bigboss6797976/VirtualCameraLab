#!/usr/bin/env python3
"""AI 决策大脑"""
import json
import random
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

class AttackPhase(Enum):
    RECON = "reconnaissance"
    WEAPONIZE = "weaponization"
    DELIVER = "delivery"
    EXPLOIT = "exploitation"
    INSTALL = "installation"
    C2 = "command_control"
    ACTIONS = "actions_on_objective"

class RiskLevel(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class AttackDecision:
    phase: AttackPhase
    action: str
    target: str
    confidence: float
    expected_gain: float
    risk: RiskLevel
    energy_cost: int
    tools: List[str]
    payload: Optional[str] = None

class AIBrain:
    """AI 攻击决策大脑"""

    def __init__(self):
        self.attack_history: List[Dict] = []
        self.target_profile: Dict = {}
        self.current_phase = AttackPhase.RECON
        self.energy_pool = 1000
        self.learning_rate = 0.1
        self.success_patterns: Dict[str, int] = {}

        self.strategies = {
            "crypto_wallet": {
                "phases": [AttackPhase.RECON, AttackPhase.WEAPONIZE, AttackPhase.DELIVER],
                "tools": ["qr_forgery", "wallet_hijack", "clipboard_monitor"],
                "success_rate": 0.75,
                "avg_gain": 500,
            },
            "payment_gateway": {
                "phases": [AttackPhase.RECON, AttackPhase.EXPLOIT, AttackPhase.ACTIONS],
                "tools": ["callback_spoof", "amount_tamper", "signature_attack"],
                "success_rate": 0.60,
                "avg_gain": 2000,
            },
            "credential_theft": {
                "phases": [AttackPhase.RECON, AttackPhase.DELIVER, AttackPhase.INSTALL],
                "tools": ["keylogger", "screen_capture", "credential_forge"],
                "success_rate": 0.85,
                "avg_gain": 1000,
            },
            "network_infiltration": {
                "phases": [AttackPhase.RECON, AttackPhase.WEAPONIZE, AttackPhase.EXPLOIT],
                "tools": ["arp_spoof", "packet_sniffer", "ssl_strip"],
                "success_rate": 0.55,
                "avg_gain": 3000,
            }
        }

    def analyze_target(self, target_data: Dict) -> Dict:
        """AI 分析目标"""
        profile = {
            "platform": target_data.get("platform", "unknown"),
            "security_level": self._assess_security(target_data),
            "vulnerabilities": self._find_vulnerabilities(target_data),
            "behavior_patterns": self._analyze_behavior(target_data),
            "estimated_value": self._estimate_value(target_data),
        }
        self.target_profile = profile
        return profile

    def _assess_security(self, data: Dict) -> str:
        score = 0
        checks = [
            data.get("has_2fa", False),
            data.get("has_signature", False),
            data.get("has_rate_limit", False),
            data.get("has_waf", False),
        ]
        score = sum(1 for c in checks if c)
        levels = {0: "CRITICAL", 1: "HIGH", 2: "MEDIUM", 3: "LOW", 4: "FORTRESS"}
        return levels.get(score, "UNKNOWN")

    def _find_vulnerabilities(self, data: Dict) -> List[str]:
        vulns = []
        if not data.get("has_signature"):
            vulns.append("signature_missing")
        if not data.get("has_nonce"):
            vulns.append("replay_vulnerable")
        if data.get("uses_http"):
            vulns.append("plaintext_transport")
        if data.get("clipboard_access"):
            vulns.append("clipboard_injectable")
        if data.get("has_approval_risk"):
            vulns.append("approval_exploitable")
        return vulns

    def _analyze_behavior(self, data: Dict) -> Dict:
        return {
            "active_hours": data.get("active_hours", ["09:00", "18:00"]),
            "transaction_frequency": data.get("tx_freq", "medium"),
            "preferred_chains": data.get("chains", ["tron"]),
            "alert_threshold": data.get("alert_threshold", 1000),
        }

    def _estimate_value(self, data: Dict) -> float:
        base = data.get("balance", 0)
        multiplier = 1.0
        if data.get("is_exchange"):
            multiplier *= 10
        if data.get("is_merchant"):
            multiplier *= 5
        return base * multiplier

    def generate_attack_plan(self) -> List[AttackDecision]:
        if not self.target_profile:
            return []

        vulns = self.target_profile.get("vulnerabilities", [])
        value = self.target_profile.get("estimated_value", 0)
        security = self.target_profile.get("security_level", "HIGH")

        plan = []

        if "clipboard_injectable" in vulns and value > 100:
            plan.append(AttackDecision(
                phase=AttackPhase.WEAPONIZE,
                action="deploy_clipboard_hijacker",
                target="clipboard",
                confidence=0.9,
                expected_gain=value * 0.8,
                risk=RiskLevel.LOW,
                energy_cost=50,
                tools=["clipboard_monitor", "wallet_hijack"]
            ))

        if "signature_missing" in vulns:
            plan.append(AttackDecision(
                phase=AttackPhase.EXPLOIT,
                action="forge_payment_callback",
                target="payment_api",
                confidence=0.7,
                expected_gain=value * 0.5,
                risk=RiskLevel.HIGH,
                energy_cost=150,
                tools=["callback_spoof", "signature_attack"]
            ))

        if "replay_vulnerable" in vulns:
            plan.append(AttackDecision(
                phase=AttackPhase.EXPLOIT,
                action="replay_transaction",
                target="transaction_endpoint",
                confidence=0.6,
                expected_gain=value * 0.3,
                risk=RiskLevel.MEDIUM,
                energy_cost=100,
                tools=["replay_attack"]
            ))

        if "approval_exploitable" in vulns:
            plan.append(AttackDecision(
                phase=AttackPhase.EXPLOIT,
                action="hijack_token_approval",
                target="smart_contract",
                confidence=0.8,
                expected_gain=value * 0.9,
                risk=RiskLevel.CRITICAL,
                energy_cost=200,
                tools=["approval_hijack", "blind_sign"]
            ))

        plan.sort(key=lambda x: x.expected_gain / (x.energy_cost * x.risk.value), reverse=True)
        return plan

    def execute_decision(self, decision: AttackDecision) -> Dict:
        if self.energy_pool < decision.energy_cost:
            return {"status": "failed", "reason": "insufficient_energy"}

        self.energy_pool -= decision.energy_cost
        success = random.random() < decision.confidence

        result = {
            "decision": asdict(decision),
            "success": success,
            "actual_gain": decision.expected_gain * random.uniform(0.5, 1.5) if success else 0,
            "timestamp": time.time(),
            "energy_remaining": self.energy_pool,
        }

        self.attack_history.append(result)

        if success:
            pattern_key = f"{decision.action}_{decision.target}"
            self.success_patterns[pattern_key] = self.success_patterns.get(pattern_key, 0) + 1

        return result

    def learn_from_result(self, result: Dict):
        if result["success"]:
            self.learning_rate = min(0.5, self.learning_rate * 1.1)
        else:
            self.learning_rate = max(0.01, self.learning_rate * 0.9)

    def get_status_report(self) -> str:
        total_gain = sum(r["actual_gain"] for r in self.attack_history)
        success_count = sum(1 for r in self.attack_history if r["success"])
        success_rate = success_count / max(len(self.attack_history), 1)

        top_patterns = sorted(self.success_patterns.items(), key=lambda x: x[1], reverse=True)[:3]

        return f"""
🧠 **AI 大脑状态**
━━━━━━━━━━━━━━━━━━━━━
⚡ 能量池: `{self.energy_pool}/1000`
🎯 当前阶段: `{self.current_phase.value}`
📊 成功率: `{success_rate*100:.1f}%`
💰 总收益: `{total_gain:.2f}`
🧬 学习率: `{self.learning_rate:.3f}`
📈 历史攻击: `{len(self.attack_history)}` 次

🏆 **成功模式**:
{chr(10).join(f"• `{k}`: {v}次" for k, v in top_patterns) or "暂无数据"}

🔍 **目标画像**:
平台: `{self.target_profile.get('platform', 'N/A')}`
安全等级: `{self.target_profile.get('security_level', 'N/A')}`
预估价值: `{self.target_profile.get('estimated_value', 0):.2f}`
漏洞: `{', '.join(self.target_profile.get('vulnerabilities', [])) or 'None'}`
"""

    def recharge_energy(self, amount: int):
        self.energy_pool = min(1000, self.energy_pool + amount)
        return self.energy_pool
