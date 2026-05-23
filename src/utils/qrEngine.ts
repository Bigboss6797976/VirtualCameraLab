import jsQR from 'jsqr';
import QRCode from 'qrcode';
import type { Platform, PlatformConfig, DecodedQR, QRConfig } from '../types';
import { PLATFORMS } from '../types';

// 检测平台类型
export function detectPlatform(url: string): Platform {
  if (url.includes('alipay') || url.includes('ALIPAY')) return 'alipay';
  if (url.includes('wxp://') || url.includes('weixin') || url.includes('wx')) return 'wechat';
  if (url.includes('95516') || url.includes('unionpay')) return 'unionpay';
  return 'alipay';
}

// 获取平台配置
export function getPlatformConfig(platform: Platform): PlatformConfig {
  return PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];
}

// jsQR 解码
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

// 构建支付URL
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

// 重新生成干净二维码
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

// ==================== 官方克隆模板 - 精确匹配截图 ====================
export async function renderOfficialTemplate(
  qrDataUrl: string,
  config: QRConfig,
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const platform = getPlatformConfig(config.platform);

  // 画布尺寸 - 采用标准手机屏幕比例 9:16
  const width = 375;
  const height = 667;
  const scale = 3; // 高清渲染

  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(scale, scale);

  // ===== 1. 背景渐变 =====
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  if (config.platform === 'alipay') {
    bgGradient.addColorStop(0, '#1a8cff');
    bgGradient.addColorStop(0.3, '#1677ff');
    bgGradient.addColorStop(1, '#1677ff');
  } else if (config.platform === 'wechat') {
    bgGradient.addColorStop(0, '#07c160');
    bgGradient.addColorStop(1, '#06ad56');
  } else {
    bgGradient.addColorStop(0, '#e60012');
    bgGradient.addColorStop(1, '#c4000f');
  }
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // ===== 2. 顶部白色区域 =====
  const headerHeight = 60;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, headerHeight);

  // 顶部阴影
  ctx.shadowColor = 'rgba(0,0,0,0.05)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillRect(0, headerHeight - 2, width, 2);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ===== 3. 支付宝 Logo =====
  const logoX = 15;
  const logoY = 12;
  const logoSize = 36;

  // 蓝色圆角方块背景
  ctx.fillStyle = '#1677ff';
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, logoSize, logoSize, 8);
  ctx.fill();

  // "支" 字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支', logoX + logoSize/2, logoY + logoSize/2 + 1);

  // ===== 4. "支付宝" 文字 =====
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 18px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('支付宝', logoX + logoSize + 10, logoY + logoSize/2);

  // ===== 5. 标题 "推荐使用支付宝" =====
  const titleY = 140;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('推荐使用支付宝', width / 2, titleY);

  // ===== 6. 副标题 =====
  const subTitleY = 185;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillText('打开支付宝[扫一扫]', width / 2, subTitleY);

  // ===== 7. 二维码白色卡片 =====
  const cardWidth = 280;
  const cardHeight = 310;
  const cardX = (width - cardWidth) / 2;
  const cardY = 220;

  // 卡片阴影
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 12);
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

  const qrSize = 220;
  const qrX = cardX + (cardWidth - qrSize) / 2;
  const qrY = cardY + 25;

  // 二维码白色背景边
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // ===== 9. 中心头像 =====
  const avatarSize = 56;
  const avatarX = qrX + (qrSize - avatarSize) / 2;
  const avatarY = qrY + (qrSize - avatarSize) / 2;

  // 白色圆形边框
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 3, 0, Math.PI * 2);
  ctx.fill();

  // 头像背景
  ctx.fillStyle = '#f5f5f5';
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
  ctx.fill();

  // 如果有头像URL，绘制头像
  if (config.avatar) {
    const avatarImg = new Image();
    await new Promise<void>((resolve) => {
      avatarImg.onload = () => resolve();
      avatarImg.onerror = () => resolve();
      avatarImg.src = config.avatar!;
    });
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 - 1, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatarImg, avatarX + 1, avatarY + 1, avatarSize - 2, avatarSize - 2);
    ctx.restore();
  } else {
    // 默认头像图标
    ctx.fillStyle = '#1677ff';
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('支', avatarX + avatarSize/2, avatarY + avatarSize/2);
  }

  // ===== 10. 绿色能量标签（四角） =====
  const tagWidth = 50;
  const tagHeight = 22;
  const tagRadius = 11;
  const tagOffset = 8;

  const tagPositions = [
    { x: cardX + tagOffset, y: cardY + tagOffset }, // 左上
    { x: cardX + cardWidth - tagWidth - tagOffset, y: cardY + tagOffset }, // 右上
    { x: cardX + tagOffset, y: cardY + cardHeight - tagHeight - 45 }, // 左下
    { x: cardX + cardWidth - tagWidth - tagOffset, y: cardY + cardHeight - tagHeight - 45 }, // 右下
  ];

  tagPositions.forEach(pos => {
    // 绿色渐变背景
    const tagGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x + tagWidth, pos.y + tagHeight);
    tagGrad.addColorStop(0, '#7ed321');
    tagGrad.addColorStop(1, '#52c41a');
    ctx.fillStyle = tagGrad;
    ctx.beginPath();
    ctx.roundRect(pos.x, pos.y, tagWidth, tagHeight, tagRadius);
    ctx.fill();

    // 文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('绿色', pos.x + tagWidth/2, pos.y + tagHeight/2 - 1);
    ctx.fillText('能量', pos.x + tagWidth/2, pos.y + tagHeight/2 + 9);
  });

  // ===== 11. 金额显示 =====
  if (config.amount) {
    const amountY = cardY + cardHeight - 55;
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 26px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¥' + config.amount, width / 2, amountY);
  }

  // ===== 12. 备注 =====
  if (config.remark) {
    const remarkY = cardY + cardHeight - 28;
    ctx.fillStyle = '#999999';
    ctx.font = '14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.remark, width / 2, remarkY);
  }

  // ===== 13. 底部文字 "支付得蚂蚁森林能量" =====
  const footerY = height - 50;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支付得蚂蚁森林能量', width / 2, footerY);

  // ===== 14. 底部小字 =====
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillText('扫码直接支付，无需输入金额', width / 2, footerY + 22);
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

  // 背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#1677ff');
  gradient.addColorStop(0.5, '#0056d6');
  gradient.addColorStop(1, '#1677ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 标题
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

    // 卡片背景
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect((width - cardWidth) / 2, y, cardWidth, cardHeight, 16);
    ctx.fill();

    // 平台图标
    ctx.fillStyle = platform.color;
    ctx.beginPath();
    ctx.roundRect((width - cardWidth) / 2 + 20, y + 20, 40, 40, 10);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(platform.icon, (width - cardWidth) / 2 + 40, y + 40);

    // 平台名称
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(platform.name, (width - cardWidth) / 2 + 75, y + 35);

    // 金额
    if (code.amount) {
      ctx.fillStyle = platform.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥' + code.amount, (width - cardWidth) / 2 + 75, y + 65);
    }

    // 二维码
    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload = () => resolve();
      qrImg.onerror = reject;
      qrImg.src = code.qrDataUrl;
    });

    const qrSize = 100;
    ctx.drawImage(qrImg, (width - cardWidth) / 2 + cardWidth - qrSize - 20, y + 25, qrSize, qrSize);

    // 绿色能量标签
    ctx.fillStyle = '#52c41a';
    ctx.beginPath();
    ctx.roundRect((width - cardWidth) / 2 + 20, y + cardHeight - 35, 70, 22, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('绿色能量', (width - cardWidth) / 2 + 55, y + cardHeight - 24);
  }

  // 底部
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('支付得蚂蚁森林能量 · 环保又便捷', width / 2, height - 30);
}

// 下载Canvas
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
