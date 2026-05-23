import { RotateCcw } from 'lucide-react';
import type { AppState } from '@/hooks/useAppState';
import UploadArea from './UploadArea';
import StyleEditor from './StyleEditor';
import AvatarEditor from './AvatarEditor';
import AmountEditor from './AmountEditor';
import SizeSelector from './SizeSelector';

interface EditorPanelProps {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
  setStatus: (msg: string) => void;
}

export default function EditorPanel({ state, updateState, setStatus }: EditorPanelProps) {
  const handleReset = () => {
    updateState({
      qrColor: '#86BBD8',
      bgColor: '#1E2328',
      borderWidth: 8,
      borderRadius: 12,
      avatarImage: null,
      avatarSize: 48,
      avatarPosition: 'bottom',
      showAmount: false,
      amount: 0,
      currency: 'CNY',
      amountPosition: 'bottom',
      outputSize: 800,
    });
    setStatus('> 已重置所有样式');
  };

  return (
    <div
      className="animate-panel-in flex flex-col overflow-hidden"
      style={{
        flex: 1,
        minWidth: 280,
        maxWidth: 420,
        background: 'var(--bg-editor)',
        border: '1px solid var(--border-default)',
        borderRadius: 3,
      }}
    >
      {/* Panel title bar */}
      <div
        className="flex items-center flex-shrink-0 px-3"
        style={{
          height: 32,
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F5F' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F9F871' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#32D196' }} />
        </div>

        {/* Panel title */}
        <span
          className="ml-3"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          editor.config
        </span>

        {/* Reset button */}
        <div className="flex-1" />
        <button
          onClick={handleReset}
          className="flex items-center justify-center p-1 rounded"
          style={{ transition: 'color 150ms ease' }}
          title="重置所有样式"
        >
          <RotateCcw
            size={12}
            color="#5C6770"
            className="hover:!text-[#FF5F5F]"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF5F5F')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5C6770')}
          />
        </button>
      </div>

      {/* Panel content */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ padding: 16 }}
      >
        {/* Upload Section */}
        <UploadArea state={state} updateState={updateState} setStatus={setStatus} />

        {/* Divider */}
        <div className="my-5" style={{ borderTop: '1px solid var(--border-default)' }} />

        {/* Style Section */}
        <StyleEditor state={state} updateState={updateState} />

        {/* Divider */}
        <div className="my-5" style={{ borderTop: '1px solid var(--border-default)' }} />

        {/* Avatar Section */}
        <AvatarEditor state={state} updateState={updateState} />

        {/* Divider */}
        <div className="my-5" style={{ borderTop: '1px solid var(--border-default)' }} />

        {/* Amount Section */}
        <AmountEditor state={state} updateState={updateState} />

        {/* Divider */}
        <div className="my-5" style={{ borderTop: '1px solid var(--border-default)' }} />

        {/* Size Section */}
        <SizeSelector state={state} updateState={updateState} />
      </div>
    </div>
  );
}
