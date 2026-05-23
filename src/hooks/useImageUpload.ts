import { useState, useCallback } from 'react';

export interface UploadImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
}

export function useImageUpload() {
  const [images, setImages] = useState<UploadImage[]>([]);

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.url);
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const clearImages = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  }, [images]);

  return { images, addImages, removeImage, clearImages, setImages };
}
