// ==================== 全局状态 ====================
let currentMethod = 'alipay';
let uploadedImageData = null;
let scannedContent = '';
let currentQRData = null;

const METHOD_CONFIG = {
    alipay: { name: '支付宝', color: '#1677ff', icon: '支', class: '' },
    wechat: { name: '微信支付', color: '#07c160', icon: '微', class: 'wechat' },
    usdt_trc20: { name: 'USDT-TRC20', color: '#26A17B', icon: 'TR', class: 'usdt-trc' },
    usdt_erc20: { name: 'USDT-ERC20', color: '#3C3C3D', icon: 'ER', class: 'usdt-erc' },
    union: { name: '云闪付', color: '#C41E3A', icon: '云', class: 'union' },
    custom: { name: '收款码', color: '#f59e0b', icon: '付', class: 'custom' }
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

    // 更新所有标题输入框
    document.getElementById('upload-title').value = titles[method] || '扫码向我付款';
    document.getElementById('input-title').value = titles[method] || '扫码向我付款';
}

// ==================== 文件上传处理 ====================
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 显示预览
            const preview = document.getElementById('upload-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
            document.getElementById('upload-zone').classList.add('has-file');

            // 识别二维码
            scanQRCode(img);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== QR码识别 ====================
function scanQRCode(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 设置画布大小
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 获取图像数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 使用 jsQR 识别
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
    });

    const resultDiv = document.getElementById('scan-result');
    const labelDiv = document.getElementById('scan-label');
    const contentDiv = document.getElementById('scan-content');

    if (code) {
        scannedContent = code.data;
        resultDiv.className = 'scan-result success';
        labelDiv.className = 'scan-label';
        labelDiv.textContent = '✅ 识别成功';
        contentDiv.textContent = code.data;

        // 自动填充到输入框
        document.getElementById('upload-title').value = '识别成功，点击生成能量码';
    } else {
        resultDiv.className = 'scan-result error';
        labelDiv.className = 'scan-label error';
        labelDiv.textContent = '❌ 未能识别';
        contentDiv.textContent = '请确保上传的是清晰的二维码图片，或手动输入收款链接';
        scannedContent = '';
    }
}

// ==================== 生成单码 - 完全匹配图二样式 ====================
function generateQRCard(content, method, amount, title, subtitle, showEnergy, containerId) {
    if (!content) {
        alert('请提供二维码内容');
        return;
    }

    const config = METHOD_CONFIG[method] || METHOD_CONFIG.custom;

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

    document.getElementById(containerId).innerHTML = html;

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
        const downloadBtn = containerId === 'upload-preview-area' ? 'upload-download-btn' : 'input-download-btn';
        document.getElementById(downloadBtn).style.display = 'flex';

        currentQRData = { content, amount, title, subtitle, showEnergy, method };
    }, 100);
}

// ==================== 上传模式生成 ====================
function generateFromUpload() {
    const content = scannedContent || document.getElementById('scan-content').textContent;
    const amount = document.getElementById('upload-amount').value.trim();
    const title = document.getElementById('upload-title').value;
    const subtitle = document.getElementById('upload-subtitle').value;
    const showEnergy = document.getElementById('upload-energy').checked;

    if (!content || content === '未能识别二维码内容') {
        alert('请先上传二维码图片或手动输入内容');
        return;
    }

    generateQRCard(content, currentMethod, amount, title, subtitle, showEnergy, 'upload-preview-area');
}

// ==================== 输入模式生成 ====================
function generateFromInput() {
    const content = document.getElementById('input-content').value.trim();
    const amount = document.getElementById('input-amount').value.trim();
    const title = document.getElementById('input-title').value;
    const subtitle = document.getElementById('input-subtitle').value;
    const showEnergy = document.getElementById('input-energy').checked;

    if (!content) {
        alert('请填写收款链接或钱包地址');
        return;
    }

    generateQRCard(content, currentMethod, amount, title, subtitle, showEnergy, 'input-preview-area');
}

// ==================== 下载功能 ====================
function downloadUploadQR() {
    downloadQR('upload-preview-area', 'upload');
}

function downloadInputQR() {
    downloadQR('input-preview-area', 'input');
}

function downloadQR(containerId, prefix) {
    const card = document.getElementById('generated-card');
    if (!card) return;

    // 使用 html2canvas 或 canvas 导出
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
        div.className = 'input-section';
        div.style.marginBottom = '16px';
        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
                <div style="width:32px;height:32px;border-radius:8px;background:${config.color};display:flex;align-items:center;justify-content:center;color:white;font-weight:700">${config.icon}</div>
                <span style="font-weight:700;color:${config.color}">${config.name}</span>
            </div>
            <div id="multi-qr-${method}"></div>
            <button onclick="downloadMultiSingle('${method}')" class="btn btn-success" style="width:100%;margin-top:10px">
                ⬇️ 下载 ${config.name} 能量码
            </button>
        `;
        container.appendChild(div);

        setTimeout(() => {
            new QRCode(document.getElementById('multi-qr-' + method), {
                text: content,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }, 100);
    });

    document.getElementById('multi-result').style.display = 'block';
}

function downloadMulti() {
    document.querySelectorAll('[id^="multi-qr-"] img').forEach((img, idx) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `聚合码_${idx}_${Date.now()}.png`;
            link.href = img.src;
            link.click();
        }, idx * 300);
    });
}

function downloadMultiSingle(method) {
    const img = document.querySelector(`#multi-qr-${method} img`);
    if (img) {
        const link = document.createElement('a');
        link.download = `能量码_${method}_${Date.now()}.png`;
        link.href = img.src;
        link.click();
    }
}

// ==================== 拖拽上传 ====================
document.addEventListener('DOMContentLoaded', function() {
    const uploadZone = document.getElementById('upload-zone');

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const input = document.getElementById('file-input');
            const dt = new DataTransfer();
            dt.items.add(file);
            input.files = dt.files;
            handleFileUpload({ target: input });
        }
    });
});
