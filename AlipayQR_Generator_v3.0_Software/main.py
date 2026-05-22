#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""AlipayQR v3.0 - 主入口 (CLI/GUI/Web)"""
import sys, os, argparse, webbrowser
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from core.engine import PaymentAggregator, QRRenderer, QRParser, ConfigManager

def cli_mode(args):
    print("=" * 60)
    print("AlipayQR v3.0 - 多通道聚合收款码生成器")
    print("=" * 60)
    config = ConfigManager(args.config).config
    agg = PaymentAggregator(config)
    if args.parse:
        result = QRParser.parse_image(args.parse)
        if result: print(f"
URL: {result['original_url']}
类型: {result['type']}
用户ID: {result.get('user_id', 'N/A')}")
        else: print("
[!] 无法解析二维码")
        return
    if args.list:
        providers = agg.list(); print(f"
可用通道 ({len(providers)}个):")
        for p in providers: print(f"  - {p}")
        if not providers: print("
[!] 没有可用通道，请配置API密钥")
        return
    if not agg.list():
        print("
[错误] 没有可用通道
请配置API密钥:
  支付宝: https://open.alipay.com
  易支付: 联系服务商
  微信: https://pay.weixin.qq.com
  Stripe: https://dashboard.stripe.com")
        return
    print(f"
[生成] 金额: ¥{args.amount or '动态'} | 通道: {args.provider}")
    result = agg.pay(amount=args.amount or '0.01', subject=args.note or '收款', prefer=args.provider)
    print(f"
  订单: {result.out_trade_no}
  URL: {result.qr_code[:50]}...
  通道: {result.provider}
  手续费: {result.fee_rate}")
    print("
[渲染] 生成图片...")
    output = QRRenderer.render(qr_url=result.qr_code, avatar_path=args.avatar, output_path=args.output)
    print(f"
[完成] {output}")
    with open(args.output.replace('.png', '_url.txt'), 'w') as f: f.write(result.qr_code)

def gui_mode():
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox, filedialog
    except ImportError:
        print("[!] GUI模式需要tkinter"); return
    root = tk.Tk(); root.title("AlipayQR v3.0"); root.geometry("600x700"); root.configure(bg='#0a0a0f')
    style = ttk.Style(); style.theme_use('clam')
    style.configure('TFrame', background='#0a0a0f')
    style.configure('TLabel', background='#0a0a0f', foreground='#e0e0e0', font=('Segoe UI', 11))
    style.configure('TButton', font=('Segoe UI', 11), padding=10)
    style.configure('TEntry', font=('Segoe UI', 12), padding=8)
    header = tk.Frame(root, bg='#1677FF', height=80); header.pack(fill='x')
    tk.Label(header, text="AlipayQR v3.0", font=('Segoe UI', 24, 'bold'), bg='#1677FF', fg='white').pack(pady=20)
    main = ttk.Frame(root, padding=20); main.pack(fill='both', expand=True)
    ttk.Label(main, text="金额 (¥):").pack(anchor='w', pady=(10,0))
    amount_var = tk.StringVar(value="88.88"); ttk.Entry(main, textvariable=amount_var, width=30).pack(fill='x', pady=5)
    ttk.Label(main, text="备注:").pack(anchor='w', pady=(10,0))
    note_var = tk.StringVar(value="收款"); ttk.Entry(main, textvariable=note_var, width=30).pack(fill='x', pady=5)
    ttk.Label(main, text="支付通道:").pack(anchor='w', pady=(10,0))
    channel_var = tk.StringVar(value="auto")
    ttk.Combobox(main, textvariable=channel_var, values=['auto','alipay','wechat','easypay','stripe'], state='readonly').pack(fill='x', pady=5)
    ttk.Label(main, text="头像路径 (可选):").pack(anchor='w', pady=(10,0))
    avatar_frame = ttk.Frame(main); avatar_frame.pack(fill='x', pady=5)
    avatar_var = tk.StringVar(); ttk.Entry(avatar_frame, textvariable=avatar_var, width=35).pack(side='left', fill='x', expand=True)
    def browse_avatar():
        path = filedialog.askopenfilename(filetypes=[('Images', '*.png *.jpg *.jpeg')])
        if path: avatar_var.set(path)
    ttk.Button(avatar_frame, text="浏览", command=browse_avatar).pack(side='right', padx=5)
    ttk.Label(main, text="输出文件:").pack(anchor='w', pady=(10,0))
    output_var = tk.StringVar(value="alipay_qr.png"); ttk.Entry(main, textvariable=output_var, width=30).pack(fill='x', pady=5)
    status_var = tk.StringVar(value="就绪"); status_label = ttk.Label(main, textvariable=status_var, foreground='#888'); status_label.pack(pady=20)
    def generate():
        try:
            status_var.set("正在生成..."); root.update()
            config = ConfigManager().config; agg = PaymentAggregator(config)
            if not agg.list(): messagebox.showwarning("警告", "没有可用通道，请配置API密钥"); status_var.set("就绪"); return
            result = agg.pay(amount=amount_var.get() or '0.01', subject=note_var.get() or '收款', prefer=channel_var.get())
            QRRenderer.render(qr_url=result.qr_code, avatar_path=avatar_var.get() or None, output_path=output_var.get())
            status_var.set(f"已生成: {output_var.get()}"); messagebox.showinfo("成功", f"二维码已生成!
通道: {result.provider}
订单: {result.out_trade_no}")
        except Exception as e: status_var.set(f"错误: {str(e)}"); messagebox.showerror("错误", str(e))
    btn = tk.Button(main, text="生成二维码", command=generate, bg='#1677FF', fg='white', font=('Segoe UI', 14, 'bold'), relief='flat', padx=30, pady=15, cursor='hand2')
    btn.pack(pady=20)
    ttk.Label(main, text="支持: 支付宝 | 微信 | Stripe | 易支付", foreground='#666', font=('Segoe UI', 10)).pack(pady=10)
    root.mainloop()

def web_mode():
    import http.server, socketserver
    PORT = 8080; web_dir = os.path.join(os.path.dirname(__file__), 'src', 'ui', 'web')
    os.chdir(web_dir)
    class Handler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args): pass
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"
Web服务器启动: http://localhost:{PORT}
按 Ctrl+C 停止")
        webbrowser.open(f"http://localhost:{PORT}")
        try: httpd.serve_forever()
        except KeyboardInterrupt: print("
服务器已停止")

def main():
    parser = argparse.ArgumentParser(description='AlipayQR v3.0')
    parser.add_argument('--amount', '-a', default='', help='金额')
    parser.add_argument('--note', '-n', default='', help='备注')
    parser.add_argument('--avatar', default='', help='头像路径')
    parser.add_argument('--provider', '-p', default='auto', choices=['auto','alipay','wxpay','easypay','stripe'])
    parser.add_argument('--output', '-o', default='alipay_qr.png', help='输出文件')
    parser.add_argument('--config', '-c', default='', help='配置文件')
    parser.add_argument('--parse', help='解析现有二维码')
    parser.add_argument('--list', action='store_true', help='列出通道')
    parser.add_argument('--gui', action='store_true', help='GUI模式')
    parser.add_argument('--web', action='store_true', help='Web服务器模式')
    args = parser.parse_args()
    if args.gui: gui_mode()
    elif args.web: web_mode()
    else: cli_mode(args)

if __name__ == '__main__': main()
