import { useEffect, useRef, useState } from 'react';
import { renderQRCodeToCanvas } from '@/utils/canvasRenderer';
import type { AppState } from '@/hooks/useAppState';

interface QRCodeCanvasProps {
  state: AppState;
}

export default function QRCodeCanvas({ state }: QRCodeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (!state.uploadedImage) {
      setCanvasUrl(null);
      return;
    }

    let cancelled = false;

    const render = async () => {
      setIsRendering(true);
      try {
        const canvas = await renderQRCodeToCanvas({
          qrImage: state.uploadedImage!,
          bgColor: state.bgColor,
          qrColor: state.qrColor,
          borderWidth: state.borderWidth,
          borderRadius: state.borderRadius,
          size: 600,
          avatarImage: state.avatarImage,
          avatarSize: state.avatarSize,
          showAmount: state.showAmount,
          amount: state.amount,
          currency: state.currency,
          amountPosition: state.amountPosition,
        });
        if (!cancelled) {
          setCanvasUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [
    state.uploadedImage,
    state.bgColor,
    state.qrColor,
    state.borderWidth,
    state.borderRadius,
    state.avatarImage,
    state.avatarSize,
    state.showAmount,
    state.amount,
    state.currency,
    state.amountPosition,
  ]);

  if (!state.uploadedImage) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          width: 280,
          height: 280,
        }}
      >
        <svg
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2A3139"
          strokeWidth={1.5}
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span
          className="mt-4"
          style={{ fontSize: 13, color: 'var(--text-muted)' }}
        >
          请先上传收款码
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="qr-scanner-wrapper"
      style={{
        width: 280,
        height: 280,
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        background: state.bgColor,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* QR Code Image */}
      {canvasUrl && !isRendering ? (
        <img
          src={canvasUrl}
          alt="QR Code Preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ width: '100%', height: '100%' }}
        >
          <div
            className="animate-spin"
            style={{
              width: 24,
              height: 24,
              border: '2px solid var(--border-default)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
            }}
          />
        </div>
      )}

      {/* Scanner Sweep Effect */}
      {canvasUrl && (
        <>
          <div className="scan-layer scan-layer-hglow" />
          <div className="scan-layer scan-layer-vglow" />
          <div className="scan-layer scan-layer-beam" />
          <div className="scan-layer scan-layer-sharp" />
          <div className="scan-layer scan-layer-lens" />
          <div className="scan-layer scan-layer-sparkle" />
        </>
      )}

      {/* Corner Markers */}
      <div className="qr-corner qr-corner-tl" />
      <div className="qr-corner qr-corner-tr" />
      <div className="qr-corner qr-corner-bl" />
      <div className="qr-corner qr-corner-br" />
    </div>
  );
}
