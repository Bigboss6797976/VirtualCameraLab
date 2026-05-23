import { Heart, TreePine } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-8 py-6 border-t border-gray-200/50 bg-white/50">
      <div className="max-w-5xl mx-auto px-4 text-center space-y-2">
        <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
          <TreePine className="w-4 h-4 text-energy-green" />
          支付得蚂蚁森林能量
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
        </p>
        <p className="text-xs text-gray-400">
          支持支付宝 · 微信支付 · 云闪付 · 聚合能量码
        </p>
      </div>
    </footer>
  );
}
