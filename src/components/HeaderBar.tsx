import { Sparkles, Shield } from 'lucide-react';
import { useMouseParallax } from '@/hooks/useMouseParallax';

export default function HeaderBar() {
  const parallaxRef = useMouseParallax();

  return (
    <header className="header-container">
      {/* Spotlight light sweep */}
      <div className="header-light" />

      {/* Top-left version badge */}
      <div
        className="absolute top-3 left-4 flex items-center gap-1.5"
        style={{ zIndex: 30 }}
      >
        <Sparkles size={14} color="#F9F871" />
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          v1.0
        </span>
      </div>

      {/* Top-right security badge */}
      <div
        className="absolute top-3 right-4 flex items-center gap-1"
        style={{
          zIndex: 30,
          background: 'rgba(50, 161, 152, 0.1)',
          padding: '2px 8px',
          borderRadius: 2,
        }}
      >
        <Shield size={12} color="#32A198" />
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          本地处理 · 数据不上传
        </span>
      </div>

      {/* 3D Parallax Title */}
      <div
        className="header-parallax-container"
        ref={parallaxRef}
        style={{ transition: 'transform 0.1s ease-out' }}
      >
        <div style={{ position: 'relative', width: '100%', height: '60px' }}>
          <div className="header-layer header-layer-4">
            收款码工坊
          </div>
          <div className="header-layer header-layer-3">
            收款码工坊
          </div>
          <div className="header-layer header-layer-2">
            收款码工坊
          </div>
          <div className="header-layer header-layer-1">
            收款码工坊
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div className="header-subtitle">
        上传 · 美化 · 收款
      </div>
    </header>
  );
}
