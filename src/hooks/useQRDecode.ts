import { useState, useCallback } from 'react';
import { decodeQRFromImage } from '../utils/qrEngine';
import type { DecodedQR } from '../types';

export function useQRDecode() {
  const [decoded, setDecoded] = useState<DecodedQR | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decode = useCallback(async (file: File) => {
    setIsDecoding(true);
    setError(null);

    try {
      const result = await decodeQRFromImage(file);
      if (result) {
        setDecoded(result);
        return result;
      } else {
        setError('无法识别二维码，请确保图片清晰完整');
        return null;
      }
    } catch (err) {
      setError('解码失败: ' + (err as Error).message);
      return null;
    } finally {
      setIsDecoding(false);
    }
  }, []);

  const clear = useCallback(() => {
    setDecoded(null);
    setError(null);
  }, []);

  return { decoded, isDecoding, error, decode, clear };
}
