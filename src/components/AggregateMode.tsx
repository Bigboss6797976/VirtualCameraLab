import { useState, useRef, useCallback } from 'react';
import { Layers, Plus, Trash2, Download, ArrowRight, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { renderAggregateCode, downloadCanvas, getPlatformConfig } from '../utils/qrEngine';
import type { Platform } from '../types';

interface AggregateItem {
  id: string;
  platform: Platform;
  url: string;
  amount: string;
  remark: string;
}

export default function AggregateMode() {
  const [items, setItems] = useState<AggregateItem[]>([
    { id: '1', platform: 'alipay', url: '', amount: '', remark: '' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addItem = useCallback(() => {
    if (items.length >= 3) return;
    const platforms: Platform[] = ['alipay', 'wechat', 'unionpay'];
    const nextPlatform = platforms[items.length % 3];
    setItems(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      platform: nextPlatform,
      url: '',
      amount: '',
      remark: '',
    }]);
  }, [items.length]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, field: keyof AggregateItem, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleGenerate = useCallback(async () => {
    const validItems = items.filter(item => item.url.trim());
    if (validItems.length === 0 || !canvasRef.current) return;

    setIsGenerating(true);
    try {
      const qrDataUrls = await Promise.all(
        validItems.map(async (item) => {
          let url = item.url;
          if (item.amount) {
            url += (url.includes('?') ? '&' : '?') + `amount=${item.amount}`;
          }
          return QRCode.toDataURL(url, {
            width: 300,
            margin: 1,
            errorCorrectionLevel: 'H',
          });
        })
      );

      await renderAggregateCode(
        validItems.map((item, i) => ({
          platform: item.platform,
          qrDataUrl: qrDataUrls[i],
          amount: item.amount,
        })),
        canvasRef.current
      );
    } catch (err) {
      console.error('聚合码生成失败:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [items]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    downloadCanvas(canvasRef.current, `聚合能量码_${Date.now()}.png`);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-alipay-blue to-alipay-dark rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <Layers className="w-6 h-6" />
          <div>
            <p className="font-semibold">聚合能量码</p>
            <p className="text-xs text-white/70">一码多付，用户扫码后任选支付方式</p>
          </div>
        </div>
      </div>

      {/* 平台卡片列表 */}
      <div className="space-y-4">
        {items.map((item, index) => {
          const config = getPlatformConfig(item.platform);
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ background: config.gradient }}
                  >
                    {config.icon}
                  </div>
                  <span className="font-semibold text-gray-800">{config.name}</span>
                  <span className="text-xs text-gray-400">#{index + 1}</span>
                </div>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={item.url}
                onChange={(e) => updateItem(item.id, 'url', e.target.value)}
                placeholder={`${config.name}收款链接`}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">¥</span>
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                    placeholder="金额"
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={item.remark}
                  onChange={(e) => updateItem(item.id, 'remark', e.target.value)}
                  placeholder="备注"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 添加按钮 */}
      {items.length < 3 && (
        <button
          onClick={addItem}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-alipay-blue hover:text-alipay-blue transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          添加支付方式（{items.length}/3）
        </button>
      )}

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || items.filter(i => i.url.trim()).length === 0}
        className="w-full bg-gradient-to-r from-alipay-blue to-alipay-dark text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-alipay-blue/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Layers className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
        {isGenerating ? '生成中...' : '生成聚合能量码'}
      </button>

      {/* 预览 */}
      <canvas
        ref={canvasRef}
        className="w-full max-w-[375px] mx-auto rounded-xl shadow-2xl"
      />

      {canvasRef.current && (
        <button
          onClick={handleDownload}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          下载聚合码
        </button>
      )}
    </div>
  );
}
