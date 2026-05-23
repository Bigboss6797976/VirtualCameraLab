import { Check } from 'lucide-react';
import type { AppState } from '@/hooks/useAppState';

interface StyleEditorProps {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
}

const qrColors = [
  { color: '#86BBD8', label: '钢青色' },
  { color: '#F9F871', label: '酸性黄' },
  { color: '#32A198', label: '青色' },
  { color: '#F9F9F9', label: '白色' },
  { color: '#FF5F5F', label: '红色' },
  { color: '#1E2328', label: '深色' },
];

const bgColors = [
  { color: '#1E2328', label: '深色' },
  { color: '#F9F9F9', label: '白色' },
  { color: '#171B1F', label: '更深' },
  { color: '#F9F871', label: '酸性黄' },
  { color: '#86BBD8', label: '钢青色' },
  { color: '#0D0F11', label: '近黑' },
];

export default function StyleEditor({ state, updateState }: StyleEditorProps) {
  return (
    <div>
      {/* Section title */}
      <div
        className="mb-3"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}
      >
        {'// 样式配置'}
      </div>

      {/* QR Color */}
      <div className="mb-4">
        <label
          className="block mb-2"
          style={{ fontSize: 12, color: 'var(--text-secondary)' }}
        >
          二维码颜色
        </label>
        <div className="flex flex-wrap gap-2">
          {qrColors.map(({ color }) => (
            <button
              key={color}
              onClick={() => updateState({ qrColor: color })}
              className="relative flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color,
                border:
                  state.qrColor === color
                    ? '2px solid var(--accent-cyan)'
                    : '2px solid transparent',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
            >
              {state.qrColor === color && (
                <Check size={12} color="#FFFFFF" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="mb-4">
        <label
          className="block mb-2"
          style={{ fontSize: 12, color: 'var(--text-secondary)' }}
        >
          背景颜色
        </label>
        <div className="flex flex-wrap gap-2">
          {bgColors.map(({ color }) => (
            <button
              key={color}
              onClick={() => updateState({ bgColor: color })}
              className="relative flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: color,
                border:
                  state.bgColor === color
                    ? '2px solid var(--accent-cyan)'
                    : '2px solid var(--border-default)',
                cursor: 'pointer',
                transition: 'border-color 150ms ease',
              }}
            >
              {state.bgColor === color && (
                <Check
                  size={12}
                  color={color === '#F9F9F9' ? '#0D0F11' : '#FFFFFF'}
                  strokeWidth={3}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Border Width */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            边框宽度
          </label>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--accent-primary)',
            }}
          >
            {state.borderWidth}px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={24}
          step={2}
          value={state.borderWidth}
          onChange={(e) => updateState({ borderWidth: Number(e.target.value) })}
        />
      </div>

      {/* Border Radius */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            圆角大小
          </label>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--accent-primary)',
            }}
          >
            {state.borderRadius}px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={32}
          step={2}
          value={state.borderRadius}
          onChange={(e) => updateState({ borderRadius: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
