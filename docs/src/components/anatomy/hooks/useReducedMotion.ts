import { useEffect, useState } from 'react';

// Reflect `prefers-reduced-motion` into state (Playwright's emulateMedia and
// OS-level changes both fire the `change` event). Gates the smooth-scroll
// animation; the skeleton/dot keyframes are handled purely in CSS by the
// reduced-motion `<style>`.
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return reduceMotion;
}
