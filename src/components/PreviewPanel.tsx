import { useState, useCallback } from 'react';
import { Eye, Download, Loader } from 'lucide-react';
import type { AppState } from '@/hooks/useAppState';
import { renderQRCodeToCanvas, downloadCanvas } from '@/utils/canvasRenderer';
import QRCodeCanvas from './QRCodeCanvas';

interface PreviewPanelProps {
  state: AppState;
  setStatus: (msg: string) => void;
}

export default function PreviewPanel({ state, setStatus }: PreviewPanelProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!state.uploadedImage) return;

    setDownloading(true);
    setStatus('> 正在生成高清图片...');

    try {
      const canvas = await renderQRCodeToCanvas({
        qrImage: state.uploadedImage,
        bgColor: state.bgColor,
        qrColor: state.qrColor,
        borderWidth: state.borderWidth,
        borderRadius: state.borderRadius,
        size: state.outputSize,
        avatarImage: state.avatarImage,
        avatarSize: state.avatarSize,
        showAmount: state.showAmount,
        amount: state.amount,
        currency: state.currency,
        amountPosition: state.amountPosition,
      });

      downloadCanvas(canvas);
      setStatus('> 下载完成 ✓');
    } catch {
      setStatus('> 下载失败');
    } finally {
      setDownloading(false);
    }
  }, [state, setStatus]);

  return (
    <div
      className="animate-panel-in-delay-1 flex flex-col overflow-hidden"
      style={{
        width: 380,
        minWidth: 340,
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
          className="ml-3 flex-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          preview.output
        </span>

        <Eye size={12} color="#5C6770" />
      </div>

      {/* Preview canvas area */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{
          padding: 24,
          background: 'var(--bg-input)',
          position: 'relative',
        }}
      >
        <QRCodeCanvas state={state} />
      </div>

      {/* Bottom action bar */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-4"
        style={{
          height: 56,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        {/* Size display */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'var(--text-muted)',
          }}
        >
          {state.outputSize} × {state.outputSize} px
        </span>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={!state.uploadedImage || downloading}
          className="flex items-center gap-2"
          style={{
            padding: '8px 20px',
            background: state.uploadedImage ? 'var(--accent-primary)' : 'var(--border-default)',
            color: '#0D0F11',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 2,
            border: 'none',
            cursor: state.uploadedImage && !downloading ? 'pointer' : 'not-allowed',
            opacity: state.uploadedImage ? 1 : 0.4,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (state.uploadedImage && !downloading) {
              e.currentTarget.style.background = '#E8E762';
              e.currentTarget.style.transform = 'scale(1.02)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = state.uploadedImage ? 'var(--accent-primary)' : 'var(--border-default)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => {
            if (state.uploadedImage && !downloading) {
              e.currentTarget.style.transform = 'scale(0.98)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
        >
          {downloading ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {downloading ? '生成中...' : '下载 PNG'}
        </button>
      </div>
    </div>
  );
}
