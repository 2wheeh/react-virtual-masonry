import { useState } from 'react';

import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect';

export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
};
