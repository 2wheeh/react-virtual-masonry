import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
};

const getSnapshot = () => window.innerWidth;
const getServerSnapshot = () => 0;

export const useWindowWidth = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
