import jsQR from 'jsqr';
import QRCode from 'qrcode';
import type { Platform, PlatformConfig, DecodedQR, QRConfig, GeneratedCode } from '../types';
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

// jsQR 解码 - 从图片提取支付链接
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

// 构建支付URL（带金额和备注）
export function buildPayUrl(baseUrl: string, amount?: string, remark?: string): string {
  let url = baseUrl;

  // 支付宝
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
  // 微信
  else if (url.includes('wxp://')) {
    // 微信URL格式处理
    if (amount || remark) {
      const params = new URLSearchParams();
      if (amount) params.append('amount', amount);
      if (remark) params.append('remark', encodeURIComponent(remark));
      url = url.split('?')[0] + '?' + params.toString();
    }
  }

  return url;
}

// 用 qrcode.js 重新生成干净二维码
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

// 渲染官方克隆模板到 Canvas
export async function renderOfficialTemplate(
  qrDataUrl: string,
  config: QRConfig,
  canvas: HTMLCanvasElement
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const platform = getPlatformConfig(config.platform);
  const width = 375;
  const height = 600;

  // 高清渲染
  const scale = 3;
  canvas.width = width * scale;
  canvas.height = height * scale;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(scale, scale);

  // 1. 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  if (config.platform === 'alipay') {
    gradient.addColorStop(0, '#1677ff');
    gradient.addColorStop(1, '#0056d6');
  } else if (config.platform === 'wechat') {
    gradient.addColorStop(0, '#07c160');
    gradient.addColorStop(1, '#06ad56');
  } else {
    gradient.addColorStop(0, '#e60012');
    gradient.addColorStop(1, '#c4000f');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. 顶部白色区域
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, 80, [0, 0, 0, 0]);
  ctx.fill();

  // 3. "支" 图标
  const iconX = 20;
  const iconY = 20;
  ctx.fillStyle = platform.color;
  ctx.beginPath();
  ctx.roundRect(iconX, iconY, 36, 36, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(platform.icon, iconX + 18, iconY + 18);

  // 4. 平台名称
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(platform.name, iconX + 46, iconY + 20);

  // 5. 标题
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('推荐使用' + platform.name, width / 2, 140);

  // 6. 副标题
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '16px sans-serif';
  ctx.fillText('打开' + platform.name + '[扫一扫]', width / 2, 170);

  // 7. 二维码卡片
  const cardWidth = 280;
  const cardHeight = 320;
  const cardX = (width - cardWidth) / 2;
  const cardY = 200;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 16);
  ctx.fill();

  // 卡片阴影
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 8. 加载并绘制二维码
  const qrImg = new Image();
  await new Promise<void>((resolve, reject) => {
    qrImg.onload = () => resolve();
    qrImg.onerror = reject;
    qrImg.src = qrDataUrl;
  });

  const qrSize = 220;
  const qrX = cardX + (cardWidth - qrSize) / 2;
  const qrY = cardY + 20;

  // 二维码白色背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 9. 中心头像/图标
  const centerSize = 50;
  const centerX = qrX + (qrSize - centerSize) / 2;
  const centerY = qrY + (qrSize - centerSize) / 2;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(centerX + centerSize/2, centerY + centerSize/2, centerSize/2 + 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = platform.color;
  ctx.beginPath();
  ctx.arc(centerX + centerSize/2, centerY + centerSize/2, centerSize/2 - 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(platform.icon, centerX + centerSize/2, centerY + centerSize/2);

  // 10. 四角能量标签
  const tagSize = 40;
  const positions = [
    { x: cardX + 10, y: cardY + 10 },
    { x: cardX + cardWidth - tagSize - 10, y: cardY + 10 },
    { x: cardX + 10, y: cardY + cardHeight - tagSize - 50 },
    { x: cardX + cardWidth - tagSize - 10, y: cardY + cardHeight - tagSize - 50 },
  ];

  positions.forEach(pos => {
    ctx.fillStyle = '#52c41a';
    ctx.beginPath();
    ctx.roundRect(pos.x, pos.y, tagSize, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('绿色能量', pos.x + tagSize/2, pos.y + 10);
  });

  // 11. 金额显示
  if (config.amount) {
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¥' + config.amount, width / 2, cardY + cardHeight - 55);
  }

  // 12. 备注
  if (config.remark) {
    ctx.fillStyle = '#999999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.remark, width / 2, cardY + cardHeight - 30);
  }

  // 13. 底部文字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('支付得蚂蚁森林能量', width / 2, height - 40);

  // 14. 底部小字
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '12px sans-serif';
  ctx.fillText('扫码直接支付，无需输入金额', width / 2, height - 20);
}

// 渲染聚合能量码
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
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('聚合能量码', width / 2, 50);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '14px sans-serif';
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
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(platform.name, (width - cardWidth) / 2 + 75, y + 40);

    // 金额
    if (code.amount) {
      ctx.fillStyle = platform.color;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('¥' + code.amount, (width - cardWidth) / 2 + 75, y + 70);
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
  ctx.textBaseline = 'alphabetic';
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
