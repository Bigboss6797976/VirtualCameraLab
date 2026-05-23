import { useState, useCallback, useEffect, useRef } from 'react';

export interface AppState {
  uploadedImage: string | null;
  fileName: string | null;
  qrColor: string;
  bgColor: string;
  borderWidth: number;
  borderRadius: number;
  avatarImage: string | null;
  avatarSize: number;
  avatarPosition: 'top' | 'bottom' | 'left' | 'right';
  showAmount: boolean;
  amount: number;
  currency: 'CNY' | 'USD' | 'EUR';
  amountPosition: 'top' | 'bottom' | 'center';
  outputSize: 800 | 1200 | 2000;
  isDragging: boolean;
  statusMessage: string;
  isLoading: boolean;
}

const defaultState: AppState = {
  uploadedImage: null,
  fileName: null,
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
  isDragging: false,
  statusMessage: '> 收款码工坊 v1.0',
  isLoading: false,
};

const STORAGE_KEY = 'qrstudio_config';

function loadPersistedState(): Partial<AppState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        qrColor: parsed.qrColor,
        bgColor: parsed.bgColor,
        borderWidth: parsed.borderWidth,
        borderRadius: parsed.borderRadius,
        avatarSize: parsed.avatarSize,
        avatarPosition: parsed.avatarPosition,
        showAmount: parsed.showAmount,
        currency: parsed.currency,
        amountPosition: parsed.amountPosition,
        outputSize: parsed.outputSize,
      };
    }
  } catch {
    // ignore
  }
  return {};
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    ...defaultState,
    ...loadPersistedState(),
  });

  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist state changes (without images)
  useEffect(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      const toPersist = {
        qrColor: state.qrColor,
        bgColor: state.bgColor,
        borderWidth: state.borderWidth,
        borderRadius: state.borderRadius,
        avatarSize: state.avatarSize,
        avatarPosition: state.avatarPosition,
        showAmount: state.showAmount,
        currency: state.currency,
        amountPosition: state.amountPosition,
        outputSize: state.outputSize,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    }, 500);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [state.qrColor, state.bgColor, state.borderWidth, state.borderRadius, state.avatarSize, state.avatarPosition, state.showAmount, state.currency, state.amountPosition, state.outputSize]);

  const setStatus = useCallback((message: string) => {
    setState(prev => ({ ...prev, statusMessage: message }));
  }, []);

  const updateState = useCallback((partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  return {
    state,
    setState,
    setStatus,
    updateState,
  };
}
