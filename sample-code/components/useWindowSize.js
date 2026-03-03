/**
 * Hook: current window width/height and a simple mobile breakpoint.
 * Used for responsive layout (e.g. sidebar collapse, compact tables).
 */
import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    function onResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    ...size,
    isMobile: size.width <= MOBILE_BREAKPOINT,
  };
}
