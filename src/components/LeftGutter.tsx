import { useState } from 'react';
import { QrCode, Image, Palette, Settings, ChevronRight } from 'lucide-react';

const icons = [
  { Icon: QrCode, active: true },
  { Icon: Image, active: false },
  { Icon: Palette, active: false },
  { Icon: Settings, active: false },
];

const lineNumbers = ['01', '02', '03'];

export default function LeftGutter() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className="hidden lg:flex flex-col items-center flex-shrink-0"
      style={{
        width: 48,
        background: 'var(--bg-input)',
        borderRight: '1px solid var(--border-default)',
        paddingTop: 16,
        position: 'relative',
      }}
    >
      {/* Collapse button */}
      <div className="mb-4">
        <ChevronRight size={14} color="#5C6770" />
      </div>

      {/* File icons */}
      <div className="flex flex-col items-center gap-5">
        {icons.map(({ Icon, active }, i) => (
          <div
            key={i}
            className="relative flex items-center justify-center"
            style={{ width: 24, height: 24, cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {active && (
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{
                  width: 2,
                  background: 'var(--accent-primary)',
                  left: -12,
                }}
              />
            )}
            <Icon
              size={16}
              color={
                active
                  ? '#F9F871'
                  : hoveredIndex === i
                    ? '#8E8E8E'
                    : '#5C6770'
              }
              style={{ transition: 'color 150ms ease' }}
            />
          </div>
        ))}
      </div>

      {/* Line numbers at bottom */}
      <div
        className="absolute bottom-4 flex flex-col items-center gap-2"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9,
          color: 'var(--text-muted)',
        }}
      >
        {lineNumbers.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  );
}
