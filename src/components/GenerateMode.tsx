import { useState, useRef, useCallback } from 'react';
import { Link2, QrCode, Download, ArrowRight, Type, Hash, ImagePlus, Users, Camera } from 'lucide-react';
import QRCode from 'qrcode';
import { renderOfficialTemplate, downloadCanvas, getPlatformConfig } from '../utils/qrEngine';
import type { Platform } from '../types';

export default function GenerateMode() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('alipay');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const platformConfig = getPlatformConfig(platform);

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!url.trim()) return;

    setIsGenerating(true);
    try {
      const cleanQr = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
      setGeneratedUrl(cleanQr);

      if (canvasRef.current) {
        await renderOfficialTemplate(cleanQr, {
          platform,
          amount: amount || undefined,
          remark: remark || undefined,
          userName: userName || undefined,
          avatar: avatarUrl || undefined,
        }, canvasRef.current);
      }
    } catch (err) {
      console.error('生成失败:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [url, platform, amount, remark, userName, avatarUrl]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const platformName = platform === 'alipay' ? '支付宝' : platform === 'wechat' ? '微信' : '云闪付';
    downloadCanvas(canvasRef.current, `${platformName}能量码_${Date.now()}.png`);
  }, [platform]);

  const platforms: Platform[] = ['alipay', 'wechat', 'unionpay'];

  return (
    <div className="space-y-6">
      {/* 多人付款说明 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-green-800">多人同时扫码付款</p>
            <p className="text-sm text-green-700 mt-1">
              生成的能量码支持多人同时扫描，各自独立支付。每个人扫码后显示相同金额，输入密码即可完成付款。适合群收款、活动报名、多人拼单等场景。
            </p>
          </div>
        </div>
      </div>

      {/* 平台选择 */}
      <div className="grid grid-cols-3 gap-3">
        {platforms.map((p) => {
          const config = getPlatformConfig(p);
          return (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200 text-center
                ${platform === p
                  ? 'border-current shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
              style={{ 
                borderColor: platform === p ? config.color : undefined,
                color: platform === p ? config.color : undefined
              }}
            >
              <div 
                className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-white font-bold mb-2"
                style={{ background: config.gradient }}
              >
                {config.icon}
              </div>
              <p className="text-sm font-semibold">{config.name}</p>
            </button>
          );
        })}
      </div>

      {/* 输入区域 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            支付链接
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴支付宝/微信/云闪付收款链接"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            支持支付宝二维码链接、微信 wxp:// 链接、云闪付链接
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              金额
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">多人扫码统一显示此金额</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Type className="w-4 h-4" />
              备注
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="商品名称/活动说明"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            收款人名称（可选）
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="显示在二维码下方"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
          />
        </div>

        {/* 头像上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            中心头像（可选）
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className={`
                w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-all
                ${avatarUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-alipay-blue bg-gray-50'}
              `}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">点击上传头像照片</p>
              <p className="text-xs text-gray-400">支持 JPG、PNG 格式，显示在二维码中心</p>
            </div>
          </div>
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !url.trim()}
        className="w-full bg-gradient-to-r from-alipay-blue to-alipay-dark text-white py-3.5 px-6 rounded-xl font-semibold shadow-lg shadow-alipay-blue/25 hover:shadow-xl hover:shadow-alipay-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ background: platformConfig.gradient }}
      >
        <QrCode className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
        {isGenerating ? '生成中...' : '生成官方克隆能量码'}
      </button>

      {/* 预览区域 */}
      {generatedUrl && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-700">官方克隆模板</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-700"
            >
              <Download className="w-3.5 h-3.5" />
              下载
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full max-w-[375px] mx-auto rounded-xl shadow-2xl"
          />

          {/* 唤起支付说明 */}
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <Users className="w-4 h-4" />
              多人可同时扫描此码，各自独立支付，无需排队
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
