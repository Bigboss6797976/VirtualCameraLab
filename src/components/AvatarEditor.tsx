import { useCallback, useRef } from 'react';
import { User, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import type { AppState } from '@/hooks/useAppState';
import { validateImageFile, readFileAsDataURL } from '@/utils/validators';

interface AvatarEditorProps {
  state: AppState;
  updateState: (partial: Partial<AppState>) => void;
}

const positions = [
  { key: 'top' as const, Icon: ArrowUp, label: '上' },
  { key: 'bottom' as const, Icon: ArrowDown, label: '下' },
  { key: 'left' as const, Icon: ArrowLeft, label: '左' },
  { key: 'right' as const, Icon: ArrowRight, label: '右' },
];

export default function AvatarEditor({ state, updateState }: AvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.valid) return;
      try {
        const dataUrl = await readFileAsDataURL(file);
        updateState({ avatarImage: dataUrl });
      } catch {
        // ignore
      }
    },
    [updateState]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleAvatarUpload(file);
    },
    [handleAvatarUpload]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  const handleRemoveAvatar = () => {
    updateState({ avatarImage: null });
    if (inputRef.current) inputRef.current.value = '';
  };

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
        {'// 头像配置'}
      </div>

      {/* Avatar upload */}
      <div className="flex items-center gap-4 mb-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="relative flex items-center justify-center cursor-pointer flex-shrink-0"
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            border: state.avatarImage
              ? '2px solid var(--accent-cyan)'
              : '2px dashed var(--border-default)',
            overflow: 'hidden',
            transition: 'border-color 200ms ease',
          }}
          onMouseEnter={(e) => {
            if (!state.avatarImage) e.currentTarget.style.borderColor = 'var(--border-active)';
          }}
          onMouseLeave={(e) => {
            if (!state.avatarImage) e.currentTarget.style.borderColor = 'var(--border-default)';
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />
          {state.avatarImage ? (
            <img
              src={state.avatarImage}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={24} color="#5C6770" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {state.avatarImage ? '点击更换头像' : '点击或拖拽上传头像'}
          </span>
          {state.avatarImage && (
            <button
              onClick={handleRemoveAvatar}
              style={{
                fontSize: 11,
                color: 'var(--danger)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
              className="hover:underline"
            >
              移除头像
            </button>
          )}
        </div>
      </div>

      {/* Avatar Size */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            头像大小
          </label>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: 'var(--accent-primary)',
            }}
          >
            {state.avatarSize}px
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={80}
          step={4}
          value={state.avatarSize}
          onChange={(e) => updateState({ avatarSize: Number(e.target.value) })}
        />
      </div>

      {/* Avatar Position */}
      <div>
        <label
          className="block mb-2"
          style={{ fontSize: 12, color: 'var(--text-secondary)' }}
        >
          头像位置
        </label>
        <div className="flex gap-2">
          {positions.map(({ key, Icon }) => (
            <button
              key={key}
              onClick={() => updateState({ avatarPosition: key })}
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: 3,
                border: '1px solid',
                borderColor:
                  state.avatarPosition === key
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                background:
                  state.avatarPosition === key
                    ? 'rgba(249, 248, 113, 0.15)'
                    : 'transparent',
                color:
                  state.avatarPosition === key
                    ? 'var(--accent-primary)'
                    : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
