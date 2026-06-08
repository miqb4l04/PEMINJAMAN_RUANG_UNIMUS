import { useEffect, useRef } from 'react';

/**
 * Hook untuk mendeteksi klik di luar elemen tertentu.
 * Sangat berguna untuk menutup Modal, Dropdown, atau Drawer.
 */
export const useClickOutside = (handler: () => void) => {
  const domNode = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const maybeHandler = (event: MouseEvent | TouchEvent) => {
      if (domNode.current && !domNode.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', maybeHandler);
    document.addEventListener('touchstart', maybeHandler);

    return () => {
      document.removeEventListener('mousedown', maybeHandler);
      document.removeEventListener('touchstart', maybeHandler);
    };
  });

  return domNode;
};