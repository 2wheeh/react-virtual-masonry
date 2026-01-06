import { useWindowWidth } from './useWindowWidth';

export interface BreakpointValues<T> {
  [key: number]: T;
}

export const useResponsiveValue = <T>() => {
  const windowWidth = useWindowWidth();

  const getResponsiveValue = (breakpointValues: BreakpointValues<T>, defaultValue: T) => {
    const sortedBreakPoints = Object.keys(breakpointValues)
      .map(Number)
      .sort((a, b) => a - b);

    const value = sortedBreakPoints.reduce((acc, breakPoint) => {
      return breakPoint < windowWidth ? breakpointValues[breakPoint] : acc;
    }, defaultValue);

    return value;
  };

  return {
    getResponsiveValue,
  };
};
