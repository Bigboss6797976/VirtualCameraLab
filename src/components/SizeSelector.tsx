import type { AppState } from '@/hooks/useAppState';

interface SizeSelectorProps {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
}

const sizes = [
  { value: 800 as const, label: '标准 (800px)' },
  { value: 1200 as const, label: '高清 (1200px)' },
  { value: 2000 as const, label: '超清 (2000px)' },
];

export default function SizeSelector({ state, updateState }: SizeSelectorProps) {
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
        {'// 输出尺寸'}
      </div>

      <div className="flex gap-2">
        {sizes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => updateState({ outputSize: value })}
            className="flex-1"
            style={{
              padding: '8px 0',
              borderRadius: 2,
              border: '1px solid',
              borderColor:
                state.outputSize === value
                  ? 'var(--accent-primary)'
                  : 'var(--border-default)',
              background:
                state.outputSize === value
                  ? 'rgba(249, 248, 113, 0.1)'
                  : 'transparent',
              color:
                state.outputSize === value
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
