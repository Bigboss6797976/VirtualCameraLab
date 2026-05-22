const express = require('express');
const multer = require('multer');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 配置 Multer 处理图片上传（最大 10MB）
const upload = multer({
    limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 核心渲染逻辑：绘制支付宝风格能量海报
async function drawEnergyPoster(qrImageBuffer, logoImageBuffer, textData, isMulti = false) {
    const size = 1200; // 默认高清 1200px 输出
    const canvas = createCanvas(size, size * 1.5);
    const ctx = canvas.getContext('2d');

    // 1. 蓝色背景
    ctx.fillStyle = "#1677ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. 顶部白条
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, size * 0.25);

    // 3. 顶部文字
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.06}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(isMulti ? "推荐使用多合一支付" : "推荐使用支付宝", canvas.width / 2, size * 0.45);

    // 4. 中心白底方块
    const qrBoxSize = size * 0.65;
    const qrBoxX = (canvas.width - qrBoxSize) / 2;
    const qrBoxY = size * 0.55;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
    ctx.fill();

    // 5. 绘制收款码
    if (qrImageBuffer) {
        const qrImg = await loadImage(qrImageBuffer);
        ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);
    }

    // 6. 绘制中心自定义Logo（对应你上传的头像）
    if (logoImageBuffer) {
        const logoImg = await loadImage(logoImageBuffer);
        const logoSize = size * 0.12;
        const logoX = (canvas.width - logoSize) / 2;
        const logoY = qrBoxY + (qrBoxSize - logoSize) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(logoX - 6, logoY - 6, logoSize + 12, logoSize + 12, 12);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, 10);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
    }

    // 7. 底部文字
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${size * 0.045}px sans-serif`;
    ctx.fillText("支付得蚂蚁森林能量", canvas.width / 2, canvas.height - (size * 0.15));

    // 8. 绘制绿色能量气泡（完美复刻图2）
    drawBubble(ctx, qrBoxX, qrBoxY, size * 0.04);
    drawBubble(ctx, qrBoxX + qrBoxSize, qrBoxY + size * 0.1, size * 0.05);
    drawBubble(ctx, qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - size * 0.05, size * 0.045);

    return canvas.toBuffer('image/png');
}

function drawBubble(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "#72d53f";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `${r * 0.6}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("能量", x, y + r * 0.2);
}

// ====== API 1: 单码生成 ======
app.post('/api/generate', upload.fields([{ name: 'qr_image' }, { name: 'logo_image' }]), async (req, res) => {
    try {
        const qrBuffer = req.files['qr_image'] ? req.files['qr_image'][0].buffer : null;
        const logoBuffer = req.files['logo_image'] ? req.files['logo_image'][0].buffer : null;
        const data = req.body.data || '';

        const buffer = await drawEnergyPoster(qrBuffer, logoBuffer, data, false);
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====== API 2: 聚合能量码生成 ======
app.post('/api/generate-multi', upload.any(), async (req, res) => {
    try {
        const qrBuffer = req.files && req.files[0] ? req.files[0].buffer : null;
        const buffer = await drawEnergyPoster(qrBuffer, null, '聚合码', true);
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====== API 3: 批量生成 ======
app.post('/api/generate-all', upload.any(), async (req, res) => {
    try {
        const qrBuffer = req.files && req.files[0] ? req.files[0].buffer : null;
        const buffer = await drawEnergyPoster(qrBuffer, null, '批量生成', false);
        res.set('Content-Type', 'image/png');
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
