import { useLayoutEffect, useState } from 'react';

import { useHasMounted } from './useHasMounted';

export const useWindowWidth = () => {
  const hasMounted = useHasMounted();
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!hasMounted) return;
      setWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [hasMounted]);

  return width;
};
