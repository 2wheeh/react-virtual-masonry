import { useCallback } from 'react';

import { useWindowWidth } from './useWindowWidth';

export interface BreakpointValues<T> {
  [key: number]: T;
}

export const useResponsiveValue = <T>() => {
  const windowWidth = useWindowWidth();

  const getResponsiveValue = useCallback(
    (breakPoints: BreakpointValues<T>, defaultValue: T) => {
      const sortedBreakPoints = Object.keys(breakPoints)
        .map(Number)
        .sort((a, b) => a - b);

      let value = sortedBreakPoints.length > 0 ? breakPoints[sortedBreakPoints[0]] : defaultValue;

      sortedBreakPoints.forEach((breakPoint) => {
        if (breakPoint < windowWidth) {
          value = breakPoints[breakPoint];
        }
      });

      return value;
    },
    [windowWidth]
  );

  return {
    getResponsiveValue,
  };
};
