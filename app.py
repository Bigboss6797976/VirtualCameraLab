from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import io
import base64
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# 上传目录
UPLOAD_FOLDER = 'static/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

PAYMENT_METHODS = {
    'alipay': {'name': '支付宝', 'color': '#1677FF', 'icon': '支', 'bg': ['#1677FF', '#0056d6']},
    'wechat': {'name': '微信支付', 'color': '#07C160', 'icon': '微', 'bg': ['#07C160', '#059669']},
    'usdt_trc20': {'name': 'USDT-TRC20', 'color': '#26A17B', 'icon': 'TR', 'bg': ['#26A17B', '#1a7a5c']},
    'usdt_erc20': {'name': 'USDT-ERC20', 'color': '#3C3C3D', 'icon': 'ER', 'bg': ['#3C3C3D', '#2a2a2b']},
    'union': {'name': '云闪付', 'color': '#C41E3A', 'icon': '云', 'bg': ['#C41E3A', '#9f1239']},
}

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def load_font(size):
    """加载字体，兼容多种系统"""
    font_paths = [
        "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
        "/usr/share/fonts/truetype/droid/DroidSansFallback.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/PingFang.ttc",
        "C:/Windows/Fonts/simhei.ttf",
        "C:/Windows/Fonts/msyh.ttc",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                pass
    return ImageFont.load_default()

def create_energy_qr(data, method, amount=None, desc=None, title=None, subtitle=None,
                     qr_color='#000000', bg_style='gradient-blue', show_energy=True,
                     uploaded_image=None, logo_image=None):
    """创建能量风格美化二维码 - 支持上传图片"""

    mi = PAYMENT_METHODS.get(method, PAYMENT_METHODS['alipay'])
    w, h = 400, 600

    # 创建画布
    img = Image.new('RGB', (w, h), '#ffffff')
    draw = ImageDraw.Draw(img)

    # 背景渐变
    bg_colors = {
        'gradient-blue': ['#1677ff', '#0056d6'],
        'gradient-purple': ['#7c3aed', '#db2777'],
        'gradient-dark': ['#1f2937', '#111827'],
        'gradient-gold': ['#fbbf24', '#d97706'],
        'solid': ['#ffffff', '#f3f4f6'],
    }
    bg = bg_colors.get(bg_style, bg_colors['gradient-blue'])

    # 绘制渐变背景
    for y in range(h):
        ratio = y / h
        r = int(int(bg[0][1:3], 16) * (1 - ratio) + int(bg[1][1:3], 16) * ratio)
        g = int(int(bg[0][3:5], 16) * (1 - ratio) + int(bg[1][3:5], 16) * ratio)
        b = int(int(bg[0][5:7], 16) * (1 - ratio) + int(bg[1][5:7], 16) * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    # 顶部标题区域
    is_light = bg_style == 'solid'
    header_color = '#f3f4f6' if is_light else (255, 255, 255, 30)
    if is_light:
        draw.rectangle([0, 0, w, 100], fill='#f3f4f6')
    else:
        for y in range(100):
            alpha = int(30 * (1 - y/100))
            draw.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))

    # 加载字体
    font_big = load_font(28)
    font_title = load_font(32)
    font_sub = load_font(18)
    font_small = load_font(14)
    font_tiny = load_font(9)

    # 平台图标
    icon_bg = mi['color']
    rgb = hex_to_rgb(icon_bg)
    draw.rounded_rectangle([30, 25, 80, 75], radius=12, fill=rgb)
    text_color = 'white'
    bbox = draw.textbbox((0,0), mi['icon'], font=font_big)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((55 - tw//2, 50 - th//2), mi['icon'], fill=text_color, font=font_big)

    # 平台名称
    text_c = '#1f2937' if is_light else 'white'
    draw.text((95, 35), mi['name'], fill=text_c, font=font_big)

    # 主标题
    title_text = title or f"推荐使用{mi['name']}"
    bbox = draw.textbbox((0,0), title_text, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, 140), title_text, fill=text_c, font=font_title)

    # QR码区域
    qr_size = 260
    qr_x = (w - qr_size - 20) // 2
    qr_y = 200

    # 如果有上传的图片，使用上传的图片作为二维码
    if uploaded_image and os.path.exists(uploaded_image):
        try:
            user_img = Image.open(uploaded_image).convert('RGBA')
            # 调整大小并居中
            user_img = user_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
            # 白色背景
            qr_bg = Image.new('RGBA', (qr_size + 20, qr_size + 20), (255, 255, 255, 255))
            qr_bg.paste(user_img, (10, 10))
            img.paste(qr_bg, (qr_x, qr_y))
        except Exception as e:
            print(f"使用上传图片失败: {e}")
            # 失败时生成普通QR码
            _draw_qr_code(draw, img, data, qr_color, qr_x, qr_y, qr_size, font_tiny)
    else:
        # 生成真实QR码
        _draw_qr_code(draw, img, data, qr_color, qr_x, qr_y, qr_size, font_tiny)

    # 中心Logo覆盖
    if logo_image and os.path.exists(logo_image):
        try:
            logo = Image.open(logo_image).convert('RGBA')
            logo_size = 60
            logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)

            # 圆形裁剪
            mask = Image.new('L', (logo_size, logo_size), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse([0, 0, logo_size, logo_size], fill=255)
            logo.putalpha(mask)

            # 白色边框
            border = Image.new('RGBA', (logo_size + 8, logo_size + 8), (255, 255, 255, 255))
            border.paste(logo, (4, 4), logo)

            # 居中粘贴
            lx = qr_x + (qr_size + 20 - logo_size - 8) // 2
            ly = qr_y + (qr_size + 20 - logo_size - 8) // 2
            img.paste(border, (lx, ly), border)
        except Exception as e:
            print(f"Logo处理失败: {e}")

    # 能量标签（绿色能量球）
    if show_energy:
        def draw_energy(x, y):
            draw.ellipse([x-28, y-28, x+28, y+28], fill='#84cc16')
            draw.ellipse([x-22, y-22, x+22, y+22], outline='#a3e635', width=2)
            draw.text((x, y-3), '绿色', fill='white', font=font_tiny, anchor='mm')
            draw.text((x, y+9), '能量', fill='white', font=font_tiny, anchor='mm')

        draw_energy(qr_x - 5, qr_y + 40)
        draw_energy(qr_x + qr_size + 25, qr_y + qr_size - 40)
        draw_energy(qr_x + qr_size + 25, qr_y + 40)

    # 副标题
    sub_text = subtitle or f"打开{mi['name']}[扫一扫]"
    if is_light:
        draw.text((w//2, qr_y + qr_size + 50), sub_text, fill='#6b7280', font=font_sub, anchor='mm')
    else:
        draw.text((w//2, qr_y + qr_size + 50), sub_text, fill=(255, 255, 255, 200), font=font_sub, anchor='mm')

    # 金额
    if amount:
        bbox = draw.textbbox((0,0), f"¥{amount}", font=font_title)
        tw = bbox[2] - bbox[0]
        draw.text((w//2, qr_y + qr_size + 90), f"¥{amount}", fill=text_c, font=font_title, anchor='mm')

    # 底部提示
    draw.text((w//2, h - 50), '支付得蚂蚁森林能量', fill=text_c, font=font_sub, anchor='mm')

    # 装饰线条
    line_c = '#84cc16' if not is_light else '#d1d5db'
    draw.line([(50, h-80), (w-50, h-80)], fill=line_c, width=1)

    return img

def _draw_qr_code(draw, img, data, qr_color, qr_x, qr_y, qr_size, font_tiny):
    """绘制标准QR码"""
    qr = qrcode.QRCode(version=3, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color=qr_color, back_color='white').convert('RGBA')
    qr_img = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    qr_bg = Image.new('RGBA', (qr_size + 20, qr_size + 20), (255, 255, 255, 255))
    qr_bg.paste(qr_img, (10, 10))
    img.paste(qr_bg, (qr_x, qr_y))

# ==================== 路由 ====================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_qr():
    """生成单码 - 支持上传图片"""
    try:
        # 获取表单数据
        data = request.form.get('data', '')
        method = request.form.get('method', 'alipay')
        amount = request.form.get('amount')
        title = request.form.get('title')
        subtitle = request.form.get('subtitle')
        qr_color = request.form.get('qr_color', '#000000')
        bg_style = request.form.get('bg_style', 'gradient-blue')
        show_energy = request.form.get('show_energy', 'true') == 'true'

        # 处理上传的二维码图片
        uploaded_image = None
        if 'qr_image' in request.files:
            file = request.files['qr_image']
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1].lower()
                if ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                    filename = f"qr_{uuid.uuid4().hex}{ext}"
                    uploaded_image = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(uploaded_image)

        # 处理上传的Logo
        logo_image = None
        if 'logo_image' in request.files:
            file = request.files['logo_image']
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1].lower()
                if ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                    filename = f"logo_{uuid.uuid4().hex}{ext}"
                    logo_image = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(logo_image)

        if not data and not uploaded_image:
            return jsonify({'error':'请提供二维码数据或上传图片'}), 400

        # 如果没有data但有上传图片，使用占位数据
        if not data and uploaded_image:
            data = 'https://example.com/payment'

        img = create_energy_qr(
            data, method,
            amount=amount,
            title=title,
            subtitle=subtitle,
            qr_color=qr_color,
            bg_style=bg_style,
            show_energy=show_energy,
            uploaded_image=uploaded_image,
            logo_image=logo_image
        )

        buf = io.BytesIO()
        img.save(buf, format='PNG', quality=95)
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_b64}',
            'method_name': PAYMENT_METHODS.get(method,{}).get('name','未知')
        })
    except Exception as e:
        import traceback
        return jsonify({'error':str(e), 'trace': traceback.format_exc()}), 500

@app.route('/api/generate-all', methods=['POST'])
def generate_all():
    """批量生成 - 支持多平台图片上传"""
    try:
        results = {}

        # 处理每个支付方式
        for method in PAYMENT_METHODS.keys():
            data = request.form.get(f'data_{method}', '')
            qr_image = request.files.get(f'qr_image_{method}')

            if not data and not qr_image:
                continue

            # 保存上传的图片
            uploaded_image = None
            if qr_image and qr_image.filename:
                ext = os.path.splitext(qr_image.filename)[1].lower()
                if ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                    filename = f"qr_{method}_{uuid.uuid4().hex}{ext}"
                    uploaded_image = os.path.join(UPLOAD_FOLDER, filename)
                    qr_image.save(uploaded_image)

            if not data and not uploaded_image:
                continue
            if not data:
                data = 'https://example.com/payment'

            try:
                img = create_energy_qr(
                    data, method,
                    amount=request.form.get('amount'),
                    title=request.form.get('title'),
                    subtitle=request.form.get('subtitle'),
                    qr_color=request.form.get('qr_color', '#000000'),
                    bg_style=request.form.get('bg_style', 'gradient-blue'),
                    show_energy=request.form.get('show_energy', 'true') == 'true',
                    uploaded_image=uploaded_image
                )
                buf = io.BytesIO()
                img.save(buf, format='PNG', quality=95)
                img_b64 = base64.b64encode(buf.getvalue()).decode()
                results[method] = {
                    'success': True,
                    'image': f'data:image/png;base64,{img_b64}',
                    'method_name': PAYMENT_METHODS.get(method,{}).get('name','未知')
                }
            except Exception as e:
                results[method] = {'success': False, 'error': str(e)}

        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-multi', methods=['POST'])
def generate_multi():
    """聚合能量码 - 上传多个平台图片合并"""
    try:
        # 获取所有上传的图片
        images = {}
        for method in PAYMENT_METHODS.keys():
            qr_image = request.files.get(f'qr_image_{method}')
            if qr_image and qr_image.filename:
                ext = os.path.splitext(qr_image.filename)[1].lower()
                if ext in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
                    filename = f"multi_{method}_{uuid.uuid4().hex}{ext}"
                    path = os.path.join(UPLOAD_FOLDER, filename)
                    qr_image.save(path)
                    images[method] = path

        if not images:
            return jsonify({'error': '请至少上传一个收款码图片'}), 400

        # 创建聚合海报
        w, h = 800, 1000
        poster = Image.new('RGB', (w, h), '#0f172a')
        draw = ImageDraw.Draw(poster)

        # 背景渐变
        for y in range(h):
            ratio = y / h
            r = int(15 * (1 - ratio) + 30 * ratio)
            g = int(23 * (1 - ratio) + 58 * ratio)
            b = int(42 * (1 - ratio) + 95 * ratio)
            draw.line([(0, y), (w, y)], fill=(r, g, b))

        font_big = load_font(48)
        font_title = load_font(32)
        font_sub = load_font(20)

        # 标题
        draw.text((w//2, 60), '聚合能量码', fill='white', font=font_big, anchor='mm')
        draw.text((w//2, 110), '支持多种支付方式 · 扫码即付', fill='#84cc16', font=font_sub, anchor='mm')

        # 布局计算
        positions = {
            'alipay': (200, 200),
            'wechat': (600, 200),
            'usdt_trc20': (200, 550),
            'usdt_erc20': (600, 550),
            'union': (400, 400),
        }

        for method, path in images.items():
            if method not in positions:
                continue
            mi = PAYMENT_METHODS[method]
            x, y = positions[method]

            # 卡片背景
            draw.rounded_rectangle([x-130, y-40, x+130, y+260], radius=20, fill='rgba(255,255,255,0.05)')

            # 标签
            rgb = hex_to_rgb(mi['color'])
            draw.rounded_rectangle([x-60, y-55, x+60, y-19], radius=18, fill=rgb)
            draw.text((x, y-37), mi['name'], fill='white', font=font_sub, anchor='mm')

            # 二维码
            try:
                qr_img = Image.open(path).convert('RGBA')
                qr_img = qr_img.resize((200, 200), Image.Resampling.LANCZOS)
                poster.paste(qr_img, (x-100, y), qr_img)
            except:
                draw.rectangle([x-100, y, x+100, y+200], fill='white')
                draw.text((x, y+100), 'QR', fill='black', font=font_title, anchor='mm')

            # 能量标签
            draw.ellipse([x+85, y+15, x+125, y+55], fill='#84cc16')
            draw.text((x+105, y+35), '能量', fill='white', font=font_sub, anchor='mm')

        # 底部提示
        draw.text((w//2, h-80), '打开对应APP扫描上方二维码即可完成支付', fill='rgba(255,255,255,0.6)', font=font_sub, anchor='mm')
        draw.text((w//2, h-50), '多人可同时扫码，各自跳转对应支付页面', fill='rgba(255,255,255,0.4)', font=font_sub, anchor='mm')

        buf = io.BytesIO()
        poster.save(buf, format='PNG', quality=95)
        img_b64 = base64.b64encode(buf.getvalue()).decode()

        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_b64}'
        })
    except Exception as e:
        import traceback
        return jsonify({'error': str(e), 'trace': traceback.format_exc()}), 500

@app.route('/api/methods')
def get_methods():
    return jsonify(PAYMENT_METHODS)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT',5000)))
