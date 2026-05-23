export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG / PNG / WEBP 格式' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 5MB' };
  }

  return { valid: true };
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatAmount(amount: number, currency: 'CNY' | 'USD' | 'EUR'): string {
  const symbols: Record<string, string> = {
    CNY: '\u00a5',
    USD: '$',
    EUR: '\u20ac',
  };
  const symbol = symbols[currency] || '\u00a5';

  if (amount <= 0) return `${symbol}0`;

  if (Number.isInteger(amount)) {
    return `${symbol}${amount}`;
  }
  return `${symbol}${amount.toFixed(2)}`;
}
