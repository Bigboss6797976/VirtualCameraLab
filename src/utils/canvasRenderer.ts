import { formatAmount } from './validators';

interface RenderOptions {
  qrImage: string;
  bgColor: string;
  qrColor: string;
  borderWidth: number;
  borderRadius: number;
  size: number;
  avatarImage: string | null;
  avatarSize: number;
  showAmount: boolean;
  amount: number;
  currency: 'CNY' | 'USD' | 'EUR';
  amountPosition: 'top' | 'bottom' | 'center';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function renderQRCodeToCanvas(options: RenderOptions): Promise<HTMLCanvasElement> {
  const {
    qrImage,
    bgColor,
    borderWidth,
    borderRadius,
    size,
    avatarImage,
    avatarSize,
    showAmount,
    amount,
    currency,
    amountPosition,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const padding = borderWidth;
  const innerSize = size - padding * 2;

  // 1. Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // 2. Draw rounded rect clip for QR area
  const qrX = padding;
  const qrY = padding;
  const qrW = innerSize;
  const qrH = innerSize;

  ctx.save();
  drawRoundedRect(ctx, qrX, qrY, qrW, qrH, Math.min(borderRadius, innerSize / 4));
  ctx.clip();

  // 3. Draw QR image (centered, fit to 75% of inner area)
  try {
    const img = await loadImage(qrImage);
    const fitSize = innerSize * 0.75;
    const imgX = qrX + (innerSize - fitSize) / 2;
    const imgY = qrY + (innerSize - fitSize) / 2;

    // White background behind QR for readability
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(imgX - 8, imgY - 8, fitSize + 16, fitSize + 16);

    // Draw QR image with aspect ratio preserved
    const scale = Math.min(fitSize / img.width, fitSize / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = qrX + (innerSize - drawW) / 2;
    const drawY = qrY + (innerSize - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } catch {
    // Fallback: draw placeholder
    ctx.fillStyle = '#2A3139';
    ctx.fillRect(qrX, qrY, qrW, qrH);
  }

  ctx.restore();

  // 4. Draw border
  if (borderWidth > 0) {
    ctx.save();
    drawRoundedRect(ctx, qrX, qrY, qrW, qrH, Math.min(borderRadius, innerSize / 4));
    ctx.strokeStyle = qrImage ? 'transparent' : '#3A4552';
    ctx.lineWidth = 0;
    ctx.stroke();
    ctx.restore();
  }

  // 5. Draw avatar (centered on QR)
  if (avatarImage) {
    try {
      const avatarImg = await loadImage(avatarImage);
      const avatarDrawSize = Math.min(avatarSize, innerSize * 0.25);
      const avatarX = qrX + (innerSize - avatarDrawSize) / 2;
      const avatarY = qrY + (innerSize - avatarDrawSize) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarDrawSize / 2,
        avatarY + avatarDrawSize / 2,
        avatarDrawSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();

      // White circle background
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.drawImage(avatarImg, avatarX, avatarY, avatarDrawSize, avatarDrawSize);
      ctx.restore();

      // Avatar border ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        avatarX + avatarDrawSize / 2,
        avatarY + avatarDrawSize / 2,
        avatarDrawSize / 2,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } catch {
      // ignore avatar error
    }
  }

  // 6. Draw amount text
  if (showAmount && amount > 0) {
    const amountText = formatAmount(amount, currency);
    ctx.font = `bold ${Math.max(size * 0.05, 24)}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let textX = size / 2;
    let textY = size / 2;

    if (amountPosition === 'top') {
      textY = padding + innerSize * 0.08;
    } else if (amountPosition === 'bottom') {
      textY = padding + innerSize - innerSize * 0.08;
    }
    // center is default

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#F9F9F9';
    ctx.fillText(amountText, textX, textY);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename?: string) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const name = filename || `\u6536\u6b3e\u7801_${timestamp}.png`;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
