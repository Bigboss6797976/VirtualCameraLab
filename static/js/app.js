// ==================== 全局状态 ====================
let currentQR = null;
let template = 'alipay';
let qrColor = '#000000';
let bgStyle = 'gradient-blue';
let title = '推荐使用支付宝';
let subtitle = '打开支付宝[扫一扫]';
let showEnergy = true;
let amount = '';
let multiData = {};
let batchResults = [];

// 支付方式配置
const PAYMENT_CONFIG = {
    alipay: { name: '支付宝', color: '#1677FF', icon: '支', bg: ['#1677FF', '#0056d6'] },
    wechat: { name: '微信支付', color: '#07C160', icon: '微', bg: ['#07C160', '#059669'] },
    usdt_trc20: { name: 'USDT-TRC20', color: '#26A17B', icon: 'TR', bg: ['#26A17B', '#1a7a5c'] },
    usdt_erc20: { name: 'USDT-ERC20', color: '#3C3C3D', icon: 'ER', bg: ['#3C3C3D', '#2a2a2b'] },
    union: { name: '云闪付', color: '#C41E3A', icon: '云', bg: ['#C41E3A', '#9f1239'] },
    custom: { name: '收款码', color: '#f59e0b', icon: '付', bg: ['#f59e0b', '#d97706'] }
};

// ==================== 粒子背景 ====================
function createParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 6) + 's';
        particle.innerHTML = `<svg width="${8 + Math.random() * 16}" height="${8 + Math.random() * 16}" viewBox="0 0 24 24" fill="none" stroke="#84cc16" stroke-width="1" opacity="0.3">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>`;
        container.appendChild(particle);
    }
}
createParticles();

// ==================== 模式切换 ====================
function setMode(mode) {
    ['single', 'multi', 'batch'].forEach(m => {
        document.getElementById(`mode-${m}`).classList.add('hidden');
        document.getElementById(`btn-${m}`).classList.remove('tab-active');
        document.getElementById(`btn-${m}`).classList.add('text-gray-400');
    });
    document.getElementById(`mode-${mode}`).classList.remove('hidden');
    document.getElementById(`btn-${mode}`).classList.add('tab-active');
    document.getElementById(`btn-${mode}`).classList.remove('text-gray-400');
}

// ==================== 模板选择 ====================
function selectTemplate(tpl, el) {
    template = tpl;
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    const titles = {
        alipay: '推荐使用支付宝',
        wechat: '推荐使用微信支付',
        usdt_trc20: 'USDT-TRC20转账',
        usdt_erc20: 'USDT-ERC20转账',
        union: '推荐使用云闪付',
        custom: '扫码向我付款'
    };
    document.getElementById('qr-title').value = titles[tpl] || '扫码向我付款';
    title = titles[tpl] || '扫码向我付款';
    renderQR();
}

// ==================== 样式设置 ====================
function setBgStyle(style) {
    bgStyle = style;
    renderQR();
}

function setQRColor(color) {
    qrColor = color;
    document.getElementById('custom-qr-color').value = color;
    renderQR();
}

function updateTitle(val) {
    title = val;
    renderQR();
}

function updateSubtitle(val) {
    subtitle = val;
    renderQR();
}

function toggleEnergy() {
    showEnergy = document.getElementById('energy-toggle').checked;
    renderQR();
}

// ==================== 核心渲染引擎 ====================
function getGradient(ctx, width, height, colors) {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[1]);
    return grad;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r},${g},${b})`;
}

function renderQR() {
    const canvas = document.getElementById('main-canvas');
    const ctx = canvas.getContext('2d');
    const w = 400, h = 600;

    const content = document.getElementById('qr-content').value.trim();
    amount = document.getElementById('qr-amount').value.trim();

    const config = PAYMENT_CONFIG[template] || PAYMENT_CONFIG.custom;

    // 背景
    const bgColors = {
        'gradient-blue': ['#1677ff', '#0056d6'],
        'gradient-purple': ['#7c3aed', '#db2777'],
        'gradient-dark': ['#1f2937', '#111827'],
        'gradient-gold': ['#fbbf24', '#d97706'],
        'solid': ['#ffffff', '#f3f4f6']
    };
    const bg = bgColors[bgStyle] || bgColors['gradient-blue'];

    // 绘制渐变背景
    for (let y = 0; y < h; y++) {
        const ratio = y / h;
        const r = Math.round(parseInt(bg[0].slice(1, 3), 16) * (1 - ratio) + parseInt(bg[1].slice(1, 3), 16) * ratio);
        const g_val = Math.round(parseInt(bg[0].slice(3, 5), 16) * (1 - ratio) + parseInt(bg[1].slice(3, 5), 16) * ratio);
        const b_val = Math.round(parseInt(bg[0].slice(5, 7), 16) * (1 - ratio) + parseInt(bg[1].slice(5, 7), 16) * ratio);
        ctx.fillStyle = `rgb(${r},${g_val},${b_val})`;
        ctx.fillRect(0, y, w, 1);
    }

    const isLight = bgStyle === 'solid';
    const textColor = isLight ? '#1f2937' : '#ffffff';
    const subTextColor = isLight ? '#6b7280' : 'rgba(255,255,255,0.8)';

    // 顶部标题区域
    if (isLight) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, w, 100);
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, w, 100);
    }

    // 平台图标
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.roundRect(30, 25, 50, 50, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, 55, 50);

    // 平台名称
    ctx.fillStyle = textColor;
    ctx.font = 'bold 22px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(config.name, 95, 50);

    // 主标题
    ctx.fillStyle = textColor;
    ctx.font = 'bold 28px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 140);

    // 生成QR码
    if (content) {
        // 使用 qrcode.js 生成
        const qrCanvas = document.createElement('canvas');
        const qr = new QRCode(qrCanvas, {
            text: content,
            width: 260,
            height: 260,
            colorDark: qrColor,
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // 等待QR生成
        setTimeout(() => {
            const qrImg = qrCanvas.querySelector('img') || qrCanvas;

            // QR白色背景
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.roundRect(60, 180, 280, 280, 16);
            ctx.fill();

            // 绘制QR码
            if (qrCanvas.getContext) {
                ctx.drawImage(qrCanvas, 70, 190, 260, 260);
            }

            // 能量标签
            if (showEnergy) {
                drawEnergyLabel(ctx, 50, 220);
                drawEnergyLabel(ctx, 350, 420);
                drawEnergyLabel(ctx, 350, 220);
            }

            // 副标题
            ctx.fillStyle = subTextColor;
            ctx.font = '16px "Noto Sans SC", sans-serif';
            ctx.fillText(subtitle, w / 2, 490);

            // 金额
            if (amount) {
                ctx.fillStyle = textColor;
                ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
                ctx.fillText(`¥${amount}`, w / 2, 460);
            }

            // 底部提示
            ctx.fillStyle = textColor;
            ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
            ctx.fillText('支付得蚂蚁森林能量', w / 2, h - 50);

            // 装饰线条
            ctx.strokeStyle = '#84cc16';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(50, h - 80);
            ctx.lineTo(w - 50, h - 80);
            ctx.stroke();
        }, 100);
    } else {
        // 占位提示
        ctx.fillStyle = isLight ? '#f3f4f6' : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(60, 180, 280, 280, 16);
        ctx.fill();
        ctx.fillStyle = '#9ca3af';
        ctx.font = '16px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('请输入收款信息', w / 2, 320);
    }
}

function drawEnergyLabel(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('绿色', x, y - 2);
    ctx.fillText('能量', x, y + 10);
    ctx.restore();
}

// ==================== 下载功能 ====================
function downloadQR(format) {
    const canvas = document.getElementById('main-canvas');
    const link = document.createElement('a');
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'png' ? undefined : 0.95;
    link.download = `能量码_${template}_${Date.now()}.${format}`;
    link.href = canvas.toDataURL(mime, quality);
    link.click();
}

// ==================== 聚合码功能 ====================
function generateMultiQR() {
    const canvas = document.getElementById('multi-canvas');
    const ctx = canvas.getContext('2d');
    const w = 800, h = 1000;

    // 收集数据
    multiData = {
        alipay: document.getElementById('multi-alipay').value.trim(),
        wechat: document.getElementById('multi-wechat').value.trim(),
        usdt_trc20: document.getElementById('multi-trc').value.trim(),
        usdt_erc20: document.getElementById('multi-erc').value.trim(),
        union: document.getElementById('multi-union').value.trim()
    };

    // 背景
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e3a5f');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('聚合能量码', w / 2, 80);

    ctx.fillStyle = '#84cc16';
    ctx.font = '20px "Noto Sans SC", sans-serif';
    ctx.fillText('支持多种支付方式 · 扫码即付', w / 2, 120);

    // 绘制二维码
    const types = [
        { key: 'alipay', name: '支付宝', color: '#1677ff', x: 200, y: 200 },
        { key: 'wechat', name: '微信支付', color: '#07c160', x: 500, y: 200 },
        { key: 'usdt_trc20', name: 'USDT-TRC20', color: '#26A17B', x: 200, y: 550 },
        { key: 'usdt_erc20', name: 'USDT-ERC20', color: '#3C3C3D', x: 500, y: 550 },
        { key: 'union', name: '云闪付', color: '#C41E3A', x: 350, y: 850 }
    ];

    let validCount = 0;
    types.forEach(t => {
        const data = multiData[t.key];
        if (!data) return;
        validCount++;

        // 卡片背景
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(t.x - 120, t.y - 40, 240, 280, 20);
        ctx.fill();

        // 标签
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.roundRect(t.x - 60, t.y - 55, 120, 36, 18);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
        ctx.fillText(t.name, t.x, t.y - 34);

        // 生成QR
        const qrCanvas = document.createElement('canvas');
        new QRCode(qrCanvas, {
            text: data,
            width: 180,
            height: 180,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.roundRect(t.x - 90, t.y, 180, 180, 12);
            ctx.fill();
            ctx.drawImage(qrCanvas, t.x - 90, t.y, 180, 180);

            // 能量标签
            ctx.fillStyle = '#84cc16';
            ctx.beginPath();
            ctx.arc(t.x + 80, t.y + 15, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 9px "Noto Sans SC", sans-serif';
            ctx.fillText('绿色', t.x + 80, t.y + 11);
            ctx.fillText('能量', t.x + 80, t.y + 22);
        }, 100);
    });

    if (validCount === 0) {
        alert('请至少填写一个支付方式');
        return;
    }

    // 底部提示
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '18px "Noto Sans SC", sans-serif';
    ctx.fillText('打开对应APP扫描上方二维码即可完成支付', w / 2, h - 60);

    document.getElementById('multi-result').classList.remove('hidden');
}

function downloadMultiQR(format) {
    const canvas = document.getElementById('multi-canvas');
    const link = document.createElement('a');
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    link.download = `聚合能量码_${Date.now()}.${format}`;
    link.href = canvas.toDataURL(mime, 0.95);
    link.click();
}

// ==================== 批量生成 ====================
function generateBatch() {
    const data = document.getElementById('batch-data').value.trim();
    const method = document.getElementById('batch-method').value;

    if (!data) {
        alert('请填写收款链接或地址');
        return;
    }

    const container = document.getElementById('batch-results');
    container.innerHTML = '';
    container.classList.remove('hidden');
    batchResults = [];

    const styles = [
        { name: '蓝色渐变', style: 'gradient-blue', colors: ['#1677ff', '#0056d6'] },
        { name: '微信绿', style: 'gradient-green', colors: ['#07c160', '#059669'] },
        { name: '暗黑商务', style: 'gradient-dark', colors: ['#1f2937', '#111827'] },
        { name: '金色奢华', style: 'gradient-gold', colors: ['#fbbf24', '#d97706'] },
        { name: '紫粉渐变', style: 'gradient-purple', colors: ['#7c3aed', '#db2777'] },
        { name: '纯白简约', style: 'solid', colors: ['#ffffff', '#f3f4f6'] }
    ];

    styles.forEach((s, idx) => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // 背景
        for (let y = 0; y < 600; y++) {
            const ratio = y / 600;
            const r = Math.round(parseInt(s.colors[0].slice(1, 3), 16) * (1 - ratio) + parseInt(s.colors[1].slice(1, 3), 16) * ratio);
            const g = Math.round(parseInt(s.colors[0].slice(3, 5), 16) * (1 - ratio) + parseInt(s.colors[1].slice(3, 5), 16) * ratio);
            const b = Math.round(parseInt(s.colors[0].slice(5, 7), 16) * (1 - ratio) + parseInt(s.colors[1].slice(5, 7), 16) * ratio);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(0, y, 400, 1);
        }

        const isLight = s.style === 'solid';
        const textC = isLight ? '#1f2937' : '#fff';

        // 标题
        ctx.fillStyle = textC;
        ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, 200, 50);

        // QR背景
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect(60, 100, 280, 280, 16);
        ctx.fill();

        // 生成QR
        const qrCanvas = document.createElement('canvas');
        new QRCode(qrCanvas, {
            text: data,
            width: 260,
            height: 260,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
            ctx.drawImage(qrCanvas, 70, 110, 260, 260);

            // 能量标签
            ctx.fillStyle = '#84cc16';
            ctx.beginPath();
            ctx.arc(50, 130, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px "Noto Sans SC", sans-serif';
            ctx.fillText('绿色', 50, 127);
            ctx.fillText('能量', 50, 138);

            // 底部文字
            ctx.fillStyle = textC;
            ctx.font = 'bold 20px "Noto Sans SC", sans-serif';
            ctx.fillText('扫码支付', 200, 450);
            ctx.font = '14px "Noto Sans SC", sans-serif';
            ctx.fillStyle = isLight ? '#6b7280' : 'rgba(255,255,255,0.7)';
            ctx.fillText('支付得蚂蚁森林能量', 200, 480);
        }, 100);

        batchResults.push({ canvas, name: s.name });

        // 添加到展示
        setTimeout(() => {
            const wrapper = document.createElement('div');
            wrapper.className = 'glass-panel rounded-xl p-3 text-center';
            wrapper.innerHTML = `
                <h4 class="text-sm font-medium mb-2 text-white">${s.name}</h4>
                <img src="${canvas.toDataURL('image/png')}" class="w-full rounded-lg mb-2">
                <button onclick="downloadBatch(${idx})" class="w-full py-1.5 rounded-lg bg-lime-500/80 hover:bg-lime-500 text-white text-xs transition font-bold">⬇️ 下载</button>
            `;
            container.appendChild(wrapper);
        }, 150);
    });
}

function downloadBatch(idx) {
    const { canvas, name } = batchResults[idx];
    const link = document.createElement('a');
    link.download = `能量码_${name}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// ==================== 帮助弹窗 ====================
function showHelp() {
    document.getElementById('help-modal').classList.remove('hidden');
    document.getElementById('help-modal').classList.add('flex');
}

function closeHelp() {
    document.getElementById('help-modal').classList.add('hidden');
    document.getElementById('help-modal').classList.remove('flex');
}

// ==================== 输入监听 ====================
document.getElementById('qr-content').addEventListener('input', renderQR);
document.getElementById('qr-amount').addEventListener('input', renderQR);

// ==================== 初始化 ====================
renderQR();
