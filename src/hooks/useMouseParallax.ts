import { useEffect, useRef, useCallback } from 'react';

export function useMouseParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const xOffset = (e.clientX - centerX) / window.innerWidth;
      const yOffset = (e.clientY - centerY) / window.innerHeight;

      const xParallax = -xOffset * 25;
      const yParallax = -yOffset * 15;

      container.style.transform = `rotateY(${xParallax}deg) rotateX(${yParallax}deg)`;
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for touch device - skip on mobile
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    container.parentElement?.addEventListener('mousemove', handleMouseMove);
    container.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.parentElement?.removeEventListener('mousemove', handleMouseMove);
      container.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return containerRef;
}
