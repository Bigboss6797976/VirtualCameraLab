import type { AppState } from '@/hooks/useAppState';

interface AmountEditorProps {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
}

const currencies = [
  { key: 'CNY' as const, symbol: '\u00a5' },
  { key: 'USD' as const, symbol: '$' },
  { key: 'EUR' as const, symbol: '\u20ac' },
];

const amountPositions = [
  { key: 'top' as const, label: '顶部' },
  { key: 'bottom' as const, label: '底部' },
  { key: 'center' as const, label: '居中' },
];

export default function AmountEditor({ state, updateState }: AmountEditorProps) {
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
        {'// 金额标注'}
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between mb-4">
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          显示金额
        </label>
        <button
          onClick={() => updateState({ showAmount: !state.showAmount })}
          className="relative"
          style={{
            width: 36,
            height: 18,
            borderRadius: 9,
            background: state.showAmount ? 'var(--accent-primary)' : 'var(--border-default)',
            cursor: 'pointer',
            transition: 'background 200ms ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: state.showAmount ? '#0D0F11' : '#5C6770',
              transform: state.showAmount ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform 200ms ease, background 200ms ease',
            }}
          />
        </button>
      </div>

      {state.showAmount && (
        <>
          {/* Amount Input */}
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            >
              金额数值
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={state.amount || ''}
              onChange={(e) => updateState({ amount: Number(e.target.value) })}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 2,
                color: 'var(--text-primary)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 150ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            />
          </div>

          {/* Currency */}
          <div className="mb-4">
            <label
              className="block mb-2"
              style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            >
              币种
            </label>
            <div className="flex gap-2">
              {currencies.map(({ key, symbol }) => (
                <button
                  key={key}
                  onClick={() => updateState({ currency: key })}
                  className="flex items-center justify-center"
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor:
                      state.currency === key
                        ? 'var(--accent-primary)'
                        : 'var(--border-default)',
                    background:
                      state.currency === key
                        ? 'rgba(249, 248, 113, 0.15)'
                        : 'transparent',
                    color:
                      state.currency === key
                        ? 'var(--accent-primary)'
                        : 'var(--text-secondary)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <div>
            <label
              className="block mb-2"
              style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            >
              金额位置
            </label>
            <select
              value={state.amountPosition}
              onChange={(e) =>
                updateState({
                  amountPosition: e.target.value as 'top' | 'bottom' | 'center',
                })
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: 2,
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%235C6770' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: 28,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              {amountPositions.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
