import { useCallback, useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import type { AppState } from '@/hooks/useAppState';
import { validateImageFile, readFileAsDataURL } from '@/utils/validators';

interface UploadAreaProps {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
  setStatus: (msg: string) => void;
}

export default function UploadArea({ state, updateState, setStatus }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || '文件验证失败');
        return;
      }

      try {
        const dataUrl = await readFileAsDataURL(file);
        updateState({ uploadedImage: dataUrl, fileName: file.name });
        setStatus('> 收款码已加载');
      } catch {
        setError('文件读取失败');
      }
    },
    [updateState, setStatus]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateState({ isDragging: false });

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, updateState]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateState({ isDragging: true });
    },
    [updateState]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateState({ isDragging: false });
    },
    [updateState]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    updateState({ uploadedImage: null, fileName: null });
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    setStatus('> 收款码已移除');
  };

  const { isDragging, uploadedImage, fileName } = state;

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
        {'// 上传收款码'}
      </div>

      {/* Upload zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative flex flex-col items-center justify-center cursor-pointer"
        style={{
          width: '100%',
          height: 120,
          border: error
            ? '2px dashed var(--danger)'
            : isDragging
              ? '2px dashed var(--accent-primary)'
              : '2px dashed var(--border-default)',
          borderRadius: 3,
          background: isDragging
            ? 'rgba(249, 248, 113, 0.06)'
            : error
              ? 'rgba(255, 95, 95, 0.04)'
              : 'rgba(20, 24, 28, 0.6)',
          transition: 'all 200ms ease',
        }}
        onMouseEnter={(e) => {
          if (!uploadedImage && !error && !isDragging) {
            e.currentTarget.style.borderColor = 'var(--border-active)';
            e.currentTarget.style.background = 'rgba(249, 248, 113, 0.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!uploadedImage && !error && !isDragging) {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.background = 'rgba(20, 24, 28, 0.6)';
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />

        {uploadedImage ? (
          <div className="flex items-center gap-3">
            <img
              src={uploadedImage}
              alt="QR"
              className="object-cover"
              style={{
                width: 60,
                height: 60,
                borderRadius: 3,
              }}
            />
            <div className="flex flex-col">
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fileName}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="p-1 rounded hover:bg-[rgba(255,95,95,0.1)]"
              style={{ transition: 'background 150ms ease' }}
            >
              <X size={14} color="#FF5F5F" />
            </button>
          </div>
        ) : (
          <>
            {error ? (
              <AlertCircle size={28} color="#FF5F5F" />
            ) : (
              <Upload
                size={28}
                color={isDragging ? '#F9F871' : '#5C6770'}
                style={{ transition: 'color 200ms ease' }}
              />
            )}
            <span
              className="mt-2"
              style={{
                fontSize: 13,
                color: error ? 'var(--danger)' : 'var(--text-secondary)',
              }}
            >
              {error || '拖拽收款码到此处 或 点击上传'}
            </span>
            {!error && (
              <span
                className="mt-1"
                style={{ fontSize: 11, color: 'var(--text-muted)' }}
              >
                支持 JPG / PNG / WEBP
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
