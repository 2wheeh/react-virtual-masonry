import { useLayoutEffect, useState } from 'react';

export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);
  // TODO: isomorphic useLayoutEffect
  useLayoutEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
};
