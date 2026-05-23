export type Platform = 'alipay' | 'wechat' | 'unionpay';

export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  gradient: string;
  lightColor: string;
  icon: string;
  payUrlPrefix: string;
}

export interface DecodedQR {
  url: string;
  platform: Platform;
  rawData: string;
  amount?: number;
  remark?: string;
}

export interface QRConfig {
  platform: Platform;
  amount?: string;
  remark?: string;
  userName?: string;
  avatar?: string;
}

export interface GeneratedCode {
  id: string;
  dataUrl: string;
  platform: Platform;
  url: string;
  timestamp: number;
}

export type Mode = 'decode' | 'generate' | 'aggregate';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'alipay',
    name: '支付宝',
    color: '#1677ff',
    gradient: 'linear-gradient(135deg, #1677ff 0%, #0056d6 100%)',
    lightColor: '#e6f2ff',
    icon: '支',
    payUrlPrefix: 'https://qr.alipay.com',
  },
  {
    id: 'wechat',
    name: '微信支付',
    color: '#07c160',
    gradient: 'linear-gradient(135deg, #07c160 0%, #06ad56 100%)',
    lightColor: '#e6f7ed',
    icon: '微',
    payUrlPrefix: 'wxp://',
  },
  {
    id: 'unionpay',
    name: '云闪付',
    color: '#e60012',
    gradient: 'linear-gradient(135deg, #e60012 0%, #c4000f 100%)',
    lightColor: '#ffe6e8',
    icon: '云',
    payUrlPrefix: 'https://qr.95516.com',
  },
];
