import { useState } from 'react';
import { ScanLine, QrCode, Layers, Sparkles } from 'lucide-react';
import Header from './components/Header';
import DecodeMode from './components/DecodeMode';
import GenerateMode from './components/GenerateMode';
import AggregateMode from './components/AggregateMode';
import Footer from './components/Footer';
import type { Mode } from './types';

const modes: { id: Mode; label: string; icon: typeof ScanLine; desc: string; color: string }[] = [
  { 
    id: 'decode', 
    label: '解码克隆', 
    icon: ScanLine, 
    desc: '截图提取链接重新生成',
    color: '#1677ff'
  },
  { 
    id: 'generate', 
    label: '直接生成', 
    icon: QrCode, 
    desc: '输入链接生成官方模板',
    color: '#07c160'
  },
  { 
    id: 'aggregate', 
    label: '聚合能量码', 
    icon: Layers, 
    desc: '多平台合一码',
    color: '#e60012'
  },
];

export default function App() {
  const [activeMode, setActiveMode] = useState<Mode>('decode');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-100">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* 模式选择器 */}
        <div className="grid grid-cols-3 gap-2.5 mb-6">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`
                  relative p-3.5 rounded-xl border-2 transition-all duration-300 text-center
                  ${isActive
                    ? 'border-current bg-white shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-white/70 hover:border-gray-300 hover:bg-white hover:shadow-md'
                  }
                `}
                style={{ borderColor: isActive ? mode.color : undefined }}
              >
                <div 
                  className={`
                    w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-all
                    ${isActive ? 'text-white shadow-md' : 'text-gray-400 bg-gray-100'}
                  `}
                  style={{ background: isActive ? mode.color : undefined }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-gray-900">{mode.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{mode.desc}</p>

                {isActive && (
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full"
                    style={{ background: mode.color }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* 功能说明 */}
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 border border-gray-100">
          <Sparkles className="w-4 h-4 text-alipay-blue" />
          <p className="text-xs text-gray-600">
            {activeMode === 'decode' && '上传收款码截图 → jsQR解码提取链接 → qrcode.js重新生成 → 官方模板克隆'}
            {activeMode === 'generate' && '粘贴支付链接 → 自定义金额/备注 → 生成官方克隆模板 → 扫码直付'}
            {activeMode === 'aggregate' && '添加多平台收款码 → 生成聚合能量码 → 一码多付'}
          </p>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5 sm:p-6">
          {activeMode === 'decode' && <DecodeMode />}
          {activeMode === 'generate' && <GenerateMode />}
          {activeMode === 'aggregate' && <AggregateMode />}
        </div>
      </main>

      <Footer />
    </div>
  );
}
