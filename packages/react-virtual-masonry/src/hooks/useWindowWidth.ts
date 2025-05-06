import { useCallback, useLayoutEffect, useState } from 'react';

import { useHasMounted } from './useHasMounted';

export const useWindowWidth = () => {
  const hasMounted = useHasMounted();
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  const handleResize = useCallback(() => {
    if (!hasMounted) return;
    setWidth(window.innerWidth);
  }, [hasMounted]);

  useLayoutEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return width;
};
