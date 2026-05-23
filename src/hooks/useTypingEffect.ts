import { useState, useEffect, useRef, useCallback } from 'react';

export function useTypingEffect(
  messages: string[],
  speed: number = 40,
  pauseBetween: number = 3000,
  deleteSpeed: number = 20
) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef(messages);

  // Keep messages ref up to date
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const schedule = useCallback((fn: () => void, delay: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(fn, delay);
  }, []);

  useEffect(() => {
    const currentMessage = messagesRef.current[currentIndex] || '';

    if (isPaused) {
      schedule(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseBetween);
      return;
    }

    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % messagesRef.current.length);
        return;
      }
      schedule(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, deleteSpeed);
      return;
    }

    if (displayText.length < currentMessage.length) {
      schedule(() => {
        setDisplayText(currentMessage.slice(0, displayText.length + 1));
      }, speed);
    } else {
      setIsPaused(true);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayText, currentIndex, isDeleting, isPaused, speed, pauseBetween, deleteSpeed, schedule]);

  const forceMessage = useCallback((message: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setDisplayText(message);
    setIsDeleting(false);
    setIsPaused(true);
  }, []);

  return { displayText, forceMessage };
}
