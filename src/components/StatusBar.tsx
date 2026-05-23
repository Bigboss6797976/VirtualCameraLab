import { useEffect, useMemo } from 'react';
import { Terminal } from 'lucide-react';
import { useTypingEffect } from '@/hooks/useTypingEffect';

interface StatusBarProps {
  statusMessage: string;
  hasImage: boolean;
}

export default function StatusBar({ statusMessage, hasImage }: StatusBarProps) {
  const idleMessages = useMemo(() => {
    const base = [
      '> 收款码工坊 v1.0 — 本地处理，数据不上传服务器',
      '> 支持支付宝 / 微信 / 云闪付收款码美化',
      '> 所有处理均在浏览器本地完成',
    ];
    if (hasImage) {
      base.unshift('> 收款码已加载，开始美化吧');
    }
    return base;
  }, [hasImage]);

  const { displayText, forceMessage } = useTypingEffect(idleMessages, 40, 3000, 20);

  // Force status message when it changes externally
  useEffect(() => {
    if (statusMessage && statusMessage !== '> 收款码工坊 v1.0') {
      forceMessage(statusMessage);
    }
  }, [statusMessage, forceMessage]);

  const time = new Date().toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      className="flex-shrink-0 flex items-center px-4"
      style={{
        height: 32,
        background: 'var(--bg-editor)',
        borderTop: '1px solid var(--border-default)',
        zIndex: 100,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Terminal icon */}
      <Terminal size={14} color="#5C6770" className="mr-2 flex-shrink-0" />

      {/* Typing band message */}
      <div className="flex-1 min-w-0">
        <div className="typing-band" data-text={displayText}>
          {displayText}
        </div>
      </div>

      {/* Center: encoding */}
      <div
        className="hidden md:block mx-4 flex-shrink-0"
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        UTF-8
      </div>

      {/* Right: local indicator */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <div
          style={{
            width: 6,
            height: 6,
            background: 'var(--success)',
            borderRadius: '50%',
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          local
        </span>
        <span
          className="ml-3 hidden sm:inline"
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {time}
        </span>
      </div>
    </div>
  );
}
