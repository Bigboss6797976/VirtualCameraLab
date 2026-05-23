import jsQR from 'jsqr';
import QRCode from 'qrcode';
import type { Platform, PlatformConfig, DecodedQR, QRConfig } from '../types';
import { PLATFORMS } from '../types';

export function detectPlatform(url: string): Platform {
  if (url.includes('alipay') || url.includes('ALIPAY')) return 'alipay';
  if (url.includes('wxp://') || url.includes('weixin') || url.includes('wx')) return 'wechat';
  if (url.includes('95516') || url.includes('unionpay')) return 'unionpay';
  return 'alipay';
}

export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];
}

export async function decodeQRFromImage(file: File): Promise<DecodedQR | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas not supported'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      URL.revokeObjectURL(url);

      if (code) {
        const platform = detectPlatform(code.data);
        resolve({
          url: code.data,
          platform,
          rawData: code.data,
        });
      } else {
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function buildPayUrl(baseUrl: string, amount?: string, remark?: string): string {
  let url = baseUrl;
  if (url.includes('alipay')) {
    if (amount) {
      url = url.replace(/&?amount=[^&]*/g, '');
      url += (url.includes('?') ? '&' : '?') + `amount=${amount}`;
    }
    if (remark) {
      url = url.replace(/&?remark=[^&]*/g, '');
      url += (url.includes('?') ? '&' : '?') + `remark=${encodeURIComponent(remark)}`;
    }
  }
  return url;
}

export async function regenerateQR(url: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
    ...options,
  });
}

// ==================== 官方克隆模板 v5 - 精确调整 ====================
export async function renderOfficialTemplate(
  qrDataUrl: string,
  config: QRConfig,
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const platform = getPlatformConfig(config.platform);

  // 画布尺寸 - 更接近真实比例
  const width = 375;
  const height = 640;
  const scale = 3;

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(scale, scale);

  // ===== 1. 蓝色背景（扩大蓝色区域） =====
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#1a8cff');
  bgGradient.addColorStop(0.4, '#1677ff');
  bgGradient.addColorStop(1, '#0d6efd');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // ===== 2. 顶部白色区域（缩小高度） =====
  const headerHeight = 48; // 从60缩小到48
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, headerHeight);

  // 底部细线
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, headerHeight - 1, width, 1);

  // ===== 3. 支付宝 Logo（居中） =====
  const logoSize = 32; // 稍微缩小
  const logoX = 16;
  const logoY = (headerHeight - logoSize) / 2; // 垂直居中

  // 蓝色圆角方块
  ctx.fillStyle = '#1677ff';
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, logoSize, logoSize, 7);
  ctx.fill();

  // "支" 字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支', logoX + logoSize/2, logoY + logoSize/2 + 1);

  // ===== 4. "支付宝" 文字（垂直居中） =====
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 17px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('支付宝', logoX + logoSize + 8, headerHeight / 2);

  // ===== 5. 标题 "推荐使用支付宝" =====
  const titleY = 115;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('推荐使用支付宝', width / 2, titleY);

  // ===== 6. 副标题 =====
  const subTitleY = 155;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '15px -apple-system, sans-serif';
  ctx.fillText('打开支付宝[扫一扫]', width / 2, subTitleY);

  // ===== 7. 二维码白色卡片（调整尺寸） =====
  const cardWidth = 270; // 稍微缩小
  const cardHeight = 300;
  const cardX = (width - cardWidth) / 2;
  const cardY = 185;

  // 卡片阴影 - 更真实的阴影
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 14);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ===== 8. 加载并绘制二维码 =====
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  const qrSize = 210;
  const qrX = cardX + (cardWidth - qrSize) / 2;
  const qrY = cardY + 22;

  // 二维码白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // ===== 9. 中心头像 =====
  const avatarSize = 52;
  const avatarX = qrX + (qrSize - avatarSize) / 2;
  const avatarY = qrY + (qrSize - avatarSize) / 2;

  // 白色圆形边框（更粗）
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 4, 0, Math.PI * 2);
  ctx.fill();

  // 头像背景
  ctx.fillStyle = '#1677ff';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支', avatarX + avatarSize/2, avatarY + avatarSize/2);

  // ===== 10. 绿色能量球（更大 + 立体感） =====
  const tagSize = 58; // 从50增大到58
  const tagRadius = 16;
  const tagOffset = 6;

  const tagPositions = [
    { x: cardX + tagOffset, y: cardY + tagOffset },
    { x: cardX + cardWidth - tagSize - tagOffset, y: cardY + tagOffset },
    { x: cardX + tagOffset, y: cardY + cardHeight - tagSize - 38 },
    { x: cardX + cardWidth - tagSize - tagOffset, y: cardY + cardHeight - tagSize - 38 },
  ];

  tagPositions.forEach(pos => {
    // 立体感阴影
    ctx.shadowColor = 'rgba(82, 196, 26, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // 绿色渐变球
    const ballGrad = ctx.createRadialGradient(
      pos.x + tagSize/2 - 5, pos.y + tagSize/2 - 5, 2,
      pos.x + tagSize/2, pos.y + tagSize/2, tagSize/2
    );
    ballGrad.addColorStop(0, '#7ed321');
    ballGrad.addColorStop(0.6, '#52c41a');
    ballGrad.addColorStop(1, '#389e0d');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.roundRect(pos.x, pos.y, tagSize, tagSize, tagRadius);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 高光效果
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(pos.x + tagSize/2, pos.y + tagSize/3, tagSize/3, tagSize/5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('绿色', pos.x + tagSize/2, pos.y + tagSize/2 - 6);
    ctx.fillText('能量', pos.x + tagSize/2, pos.y + tagSize/2 + 8);
  });

  // ===== 11. 金额显示 =====
  if (config.amount) {
    const amountY = cardY + cardHeight - 52;
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥' + config.amount, width / 2, amountY);
  }

  // ===== 12. 备注 =====
  if (config.remark) {
    const remarkY = cardY + cardHeight - 26;
    ctx.fillStyle = '#999999';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.remark, width / 2, remarkY);
  }

  // ===== 13. 底部文字（蓝色区域往上移） =====
  const footerY = height - 45;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支付得蚂蚁森林能量', width / 2, footerY);

  // ===== 14. 底部小字 =====
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.fillText('扫码直接支付，无需输入金额', width / 2, footerY + 20);
}

// ==================== 聚合能量码 ====================
export async function renderAggregateCode(
  codes: { platform: Platform; qrDataUrl: string; amount?: string }[],
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const width = 375;
  const height = 700;
  const scale = 3;

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(scale, scale);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1677ff');
  gradient.addColorStop(0.5, '#0056d6');
  gradient.addColorStop(1, '#1677ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('聚合能量码', width / 2, 50);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillText('一码多付 · 扫码任选', width / 2, 75);

  const cardWidth = 320;
  const cardHeight = 160;
  const startY = 110;
  const gap = 20;

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const platform = getPlatformConfig(code.platform);
    const y = startY + i * (cardHeight + gap);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect((width - cardWidth) / 2, y, cardWidth, cardHeight, 16);
    ctx.fill();

    ctx.fillStyle = platform.color;
    ctx.beginPath();
    ctx.roundRect((width - cardWidth) / 2 + 20, y + 20, 40, 40, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(platform.icon, (width - cardWidth) / 2 + 40, y + 40);

    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(platform.name, (width - cardWidth) / 2 + 75, y + 35);

    if (code.amount) {
      ctx.fillStyle = platform.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥' + code.amount, (width - cardWidth) / 2 + 75, y + 65);
    }

    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = code.qrDataUrl;
    });

    const qrSize = 100;
    ctx.drawImage(qrImg, (width - cardWidth) / 2 + cardWidth - qrSize - 20, y + 25, qrSize, qrSize);

    // 绿色能量球 - 立体感
    const ballX = (width - cardWidth) / 2 + 20;
    const ballY = y + cardHeight - 40;
    const ballSize = 50;

    ctx.shadowColor = 'rgba(82, 196, 26, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    const ballGrad = ctx.createRadialGradient(
      ballX + ballSize/2 - 5, ballY + ballSize/2 - 5, 2,
      ballX + ballSize/2, ballY + ballSize/2, ballSize/2
    );
    ballGrad.addColorStop(0, '#7ed321');
    ballGrad.addColorStop(0.6, '#52c41a');
    ballGrad.addColorStop(1, '#389e0d');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.roundRect(ballX, ballY, ballSize, ballSize, 14);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(ballX + ballSize/2, ballY + ballSize/3, ballSize/3, ballSize/5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('绿色', ballX + ballSize/2, ballY + ballSize/2 - 6);
    ctx.fillText('能量', ballX + ballSize/2, ballY + ballSize/2 + 8);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支付得蚂蚁森林能量 · 环保又便捷', width / 2, height - 30);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
