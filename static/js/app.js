// ==================== 全局状态 ====================
let currentMethod = 'alipay';
let currentQRData = null;

const METHOD_CONFIG = {
    alipay: { name: '支付宝', color: '#1677ff', icon: '支', class: '' },
    wechat: { name: '微信支付', color: '#07c160', icon: '微', class: 'wechat' },
    usdt_trc20: { name: 'USDT-TRC20', color: '#26A17B', icon: 'TR', class: 'usdt-trc' },
    usdt_erc20: { name: 'USDT-ERC20', color: '#3C3C3D', icon: 'ER', class: 'usdt-erc' },
    union: { name: '云闪付', color: '#C41E3A', icon: '云', class: 'union' },
    custom: { name: '收款码', color: '#f59e0b', icon: '付', class: '' }
};

// ==================== 标签页切换 ====================
function setTab(tab, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// ==================== 支付方式选择 ====================
function selectMethod(method, el) {
    currentMethod = method;
    document.querySelectorAll('.method-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    const titles = {
        alipay: '推荐使用支付宝',
        wechat: '推荐使用微信支付',
        usdt_trc20: 'USDT-TRC20转账',
        usdt_erc20: 'USDT-ERC20转账',
        union: '推荐使用云闪付',
        custom: '扫码向我付款'
    };
    document.getElementById('qr-title').value = titles[method] || '扫码向我付款';
}

// ==================== 生成单码 - 完全匹配图二样式 ====================
function generateQR() {
    const content = document.getElementById('qr-content').value.trim();
    const amount = document.getElementById('qr-amount').value.trim();
    const title = document.getElementById('qr-title').value;
    const subtitle = document.getElementById('qr-subtitle').value;
    const showEnergy = document.getElementById('energy-toggle').checked;

    if (!content) {
        alert('请填写收款链接或钱包地址');
        return;
    }

    const config = METHOD_CONFIG[currentMethod] || METHOD_CONFIG.alipay;

    // 创建卡片HTML - 完全匹配图二样式
    let html = `
        <div class="qr-card" id="generated-card">
            <div class="qr-card-header ${config.class}">
                <div class="qr-card-icon">${config.icon}</div>
                <div class="qr-card-title">${config.name}</div>
            </div>
            <div class="qr-card-body ${config.class}">
                <div class="qr-main-title">${title}</div>
                <div class="qr-wrapper">
                    <div id="qrcode"></div>
                    ${showEnergy ? `
                        <div class="energy-tag tag-left">
                            <span class="energy-text">绿色</span>
                            <span class="energy-text">能量</span>
                        </div>
                        <div class="energy-tag tag-right">
                            <span class="energy-text">绿色</span>
                            <span class="energy-text">能量</span>
                        </div>
                        <div class="energy-tag tag-bottom">
                            <span class="energy-text">绿色</span>
                            <span class="energy-text">能量</span>
                        </div>
                    ` : ''}
                </div>
                ${amount ? `<div class="qr-amount">¥${amount}</div>` : ''}
                <div class="qr-subtitle">${subtitle}</div>
            </div>
            <div class="qr-footer ${config.class}">
                <div class="qr-footer-text">支付得蚂蚁森林能量</div>
            </div>
        </div>
    `;

    document.getElementById('qr-preview').innerHTML = html;

    // 生成QR码
    setTimeout(() => {
        const qrDiv = document.getElementById('qrcode');
        qrDiv.innerHTML = '';
        new QRCode(qrDiv, {
            text: content,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // 显示下载按钮
        document.getElementById('download-btn').style.display = 'flex';

        // 保存当前数据用于下载
        currentQRData = { content, amount, title, subtitle, showEnergy, method: currentMethod };
    }, 100);
}

// ==================== 下载功能 ====================
function downloadQR() {
    const card = document.getElementById('generated-card');
    if (!card) return;

    // 使用 html2canvas 或 canvas 导出
    // 这里使用简单的 canvas 绘制
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const w = 400, h = 600;
    canvas.width = w;
    canvas.height = h;

    const config = METHOD_CONFIG[currentQRData.method] || METHOD_CONFIG.alipay;

    // 背景色
    ctx.fillStyle = config.color;
    ctx.fillRect(0, 0, w, h);

    // 顶部栏
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, w, 60);

    // 图标背景
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.roundRect(20, 12, 36, 36, 8);
    ctx.fill();

    // 图标文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.icon, 38, 30);

    // 平台名称
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(config.name, 68, 30);

    // 主标题
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px "Noto Sans SC", sans-serif';
    ctx.fillText(currentQRData.title, w/2, 100);

    // QR白色背景
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(80, 130, 240, 240, 12);
    ctx.fill();

    // 获取QR图片
    const qrImg = document.querySelector('#qrcode img');
    if (qrImg) {
        ctx.drawImage(qrImg, 90, 140, 220, 220);
    }

    // 能量标签
    if (currentQRData.showEnergy) {
        drawEnergyTag(ctx, 60, 160);
        drawEnergyTag(ctx, 340, 250);
        drawEnergyTag(ctx, 340, 340);
    }

    // 金额
    if (currentQRData.amount) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('¥' + currentQRData.amount, w/2, 420);
    }

    // 副标题
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '16px sans-serif';
    ctx.fillText(currentQRData.subtitle, w/2, 460);

    // 底部线条
    ctx.strokeStyle = '#84cc16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 500);
    ctx.lineTo(w-40, 500);
    ctx.stroke();

    // 底部文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px "Noto Sans SC", sans-serif';
    ctx.fillText('支付得蚂蚁森林能量', w/2, 540);

    // 下载
    const link = document.createElement('a');
    link.download = `能量码_${currentQRData.method}_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function drawEnergyTag(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#84cc16';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('绿色', x, y - 2);
    ctx.fillText('能量', x, y + 10);
    ctx.restore();
}

// ==================== 聚合码 ====================
function generateMulti() {
    const data = {
        alipay: document.getElementById('multi-alipay').value.trim(),
        wechat: document.getElementById('multi-wechat').value.trim(),
        usdt_trc20: document.getElementById('multi-trc').value.trim(),
        usdt_erc20: document.getElementById('multi-erc').value.trim(),
        union: document.getElementById('multi-union').value.trim()
    };

    const valid = Object.entries(data).filter(([k, v]) => v);
    if (valid.length === 0) {
        alert('请至少填写一个支付方式');
        return;
    }

    const container = document.getElementById('multi-preview');
    container.innerHTML = '';

    valid.forEach(([method, content]) => {
        const config = METHOD_CONFIG[method] || METHOD_CONFIG.custom;
        const div = document.createElement('div');
        div.className = 'multi-item';
        div.innerHTML = `
            <h4 style="color:${config.color}">${config.name}</h4>
            <div id="qr-${method}"></div>
            <button onclick="downloadSingle('${method}')" class="btn btn-success" style="width:100%;margin-top:8px">
                ⬇️ 下载
            </button>
        `;
        container.appendChild(div);

        setTimeout(() => {
            new QRCode(document.getElementById('qr-' + method), {
                text: content,
                width: 150,
                height: 150,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 100);
    });

    document.getElementById('multi-result').style.display = 'block';
}

function downloadMulti() {
    document.querySelectorAll('.multi-item img').forEach((img, idx) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `聚合码_${idx}_${Date.now()}.png`;
            link.href = img.src;
            link.click();
        }, idx * 300);
    });
}

function downloadSingle(method) {
    const img = document.querySelector(`#qr-${method} img`);
    if (img) {
        const link = document.createElement('a');
        link.download = `能量码_${method}_${Date.now()}.png`;
        link.href = img.src;
        link.click();
    }
}

// ==================== 批量生成 ====================
function generateBatch() {
    const data = document.getElementById('batch-data').value.trim();
    const method = document.getElementById('batch-method').value;

    if (!data) {
        alert('请填写收款链接或地址');
        return;
    }

    const container = document.getElementById('batch-grid');
    container.innerHTML = '';
    document.getElementById('batch-result').style.display = 'block';

    const colors = [
        { name: '蓝色', color: '#1677ff' },
        { name: '绿色', color: '#07c160' },
        { name: '紫色', color: '#7c3aed' },
        { name: '红色', color: '#C41E3A' },
        { name: '金色', color: '#f59e0b' },
        { name: '暗黑', color: '#3C3C3D' }
    ];

    colors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'multi-item';
        div.innerHTML = `
            <h4 style="color:${c.color}">${c.name}风格</h4>
            <div id="batch-qr-${c.name}"></div>
            <button onclick="downloadBatchSingle('${c.name}')" class="btn btn-success" style="width:100%;margin-top:8px">
                ⬇️ 下载
            </button>
        `;
        container.appendChild(div);

        setTimeout(() => {
            new QRCode(document.getElementById('batch-qr-' + c.name), {
                text: data,
                width: 150,
                height: 150,
                colorDark: c.color,
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 100);
    });
}

function downloadBatchSingle(name) {
    const img = document.querySelector(`#batch-qr-${name} img`);
    if (img) {
        const link = document.createElement('a');
        link.download = `能量码_${name}_${Date.now()}.png`;
        link.href = img.src;
        link.click();
    }
}

// ==================== 初始化 ====================
document.getElementById('qr-content').addEventListener('input', function() {
    if (this.value.trim()) {
        generateQR();
    }
});
