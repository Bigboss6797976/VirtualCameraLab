import { useState, useCallback, useRef } from 'react';
import { Upload, Scan, Copy, Check, ArrowRight, QrCode, Trash2, Users, ImagePlus } from 'lucide-react';
import { useQRDecode } from '../hooks/useQRDecode';
import { regenerateQR, renderOfficialTemplate, downloadCanvas } from '../utils/qrEngine';
import { getPlatformConfig } from '../utils/qrEngine';

export default function DecodeMode() {
  const { decoded, isDecoding, error, decode, clear } = useQRDecode();
  const [previewUrl, setPreviewUrl] = useState('');
  const [regeneratedQr, setRegeneratedQr] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const result = await decode(file);

    if (result) {
      const cleanQr = await regenerateQR(result.url);
      setRegeneratedQr(cleanQr);
    }
  }, [decode]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleCopyUrl = useCallback(async () => {
    if (!decoded) return;
    await navigator.clipboard.writeText(decoded.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [decoded]);

  const handleGenerateOfficial = useCallback(async () => {
    if (!regeneratedQr || !decoded || !canvasRef.current) return;

    setIsGenerating(true);
    try {
      const platform = decoded.platform;
      await renderOfficialTemplate(regeneratedQr, {
        platform,
        amount: amount || undefined,
        remark: remark || undefined,
      }, canvasRef.current);
    } catch (err) {
      console.error('生成失败:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [regeneratedQr, decoded, amount, remark]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;
    const platform = decoded?.platform || 'alipay';
    const platformName = platform === 'alipay' ? '支付宝' : platform === 'wechat' ? '微信' : '云闪付';
    downloadCanvas(canvasRef.current, `${platformName}能量码_${Date.now()}.png`);
  }, [decoded]);

  const handleClear = useCallback(() => {
    clear();
    setPreviewUrl('');
    setRegeneratedQr('');
    setAmount('');
    setRemark('');
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [clear]);

  const platform = decoded ? getPlatformConfig(decoded.platform) : null;

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

      {/* 上传区域 */}
      {!decoded && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative border-2 border-dashed border-gray-300 hover:border-alipay-blue rounded-2xl p-10 text-center transition-all duration-300 bg-gray-50/50 hover:bg-alipay-light/30"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-alipay-blue to-alipay-dark rounded-2xl flex items-center justify-center shadow-lg shadow-alipay-blue/20">
              <ImagePlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {isDecoding ? '正在解码...' : '点击或拖拽上传收款码截图'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                支持 JPG、PNG、GIF、WEBP 格式照片
              </p>
              <p className="text-xs text-alipay-blue mt-2 font-medium">
                上传后会自动提取支付链接并生成新的蚂蚁能量付款码
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 解码结果 */}
      {decoded && platform && (
        <div className="space-y-6">
          {/* 平台识别结果 */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
              style={{ background: platform.gradient }}
            >
              {platform.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{platform.name} 收款码</p>
              <p className="text-xs text-gray-500 truncate">{decoded.url}</p>
            </div>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>

          {/* 重新生成的干净二维码 */}
          {regeneratedQr && (
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    重新生成的干净二维码
                  </p>
                  <img src={regeneratedQr} alt="Clean QR" className="w-48 h-48 mx-auto rounded-lg" />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    使用 qrcode.js 重新生成，去除截图杂质
                  </p>
                </div>

                {/* 自定义参数 */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">自定义收款参数</p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">金额（多人扫码统一显示）</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">所有扫描者将看到此金额</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">备注（商品名称/活动说明）</label>
                    <input
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="例如：聚餐AA / 活动报名费"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-alipay-blue focus:ring-2 focus:ring-alipay-light outline-none transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 官方克隆模板预览 */}
              <div className="flex-1">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Scan className="w-4 h-4" />
                    官方克隆模板预览
                  </p>
                  <canvas
                    ref={canvasRef}
                    className="w-full max-w-[375px] mx-auto rounded-xl shadow-xl"
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleGenerateOfficial}
                      disabled={isGenerating}
                      className="flex-1 bg-gradient-to-r from-alipay-blue to-alipay-dark text-white py-2.5 px-4 rounded-xl font-medium shadow-lg shadow-alipay-blue/25 hover:shadow-xl transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowRight className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                      {isGenerating ? '生成中...' : '生成官方模板'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                    >
                      下载
                    </button>
                  </div>

                  {/* 多人付款提示 */}
                  <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-xs text-green-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      此码支持多人同时扫描付款，各自独立到账
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-center">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              清除重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
