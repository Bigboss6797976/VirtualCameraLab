import { Zap, Github, ScanLine } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 glass-effect border-b border-gray-200/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-alipay-blue to-alipay-dark rounded-xl flex items-center justify-center shadow-lg shadow-alipay-blue/30">
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">能量码生成器</h1>
              <p className="text-[10px] text-gray-500 -mt-0.5">官方克隆 · 扫码直付 · 聚合能量</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-energy-light text-energy-green text-xs font-bold">
              <Zap className="w-3 h-3" />
              蚂蚁森林
            </span>
            <a
              href="https://github.com/Bigboss6797976/ailipay"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-xs font-medium text-gray-700"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
