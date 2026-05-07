import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useResponsiveValue } from './useResponsiveValue';

const setWindowWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
};

describe('useResponsiveValue', () => {
  beforeEach(() => {
    setWindowWidth(1024);
  });

  it('returns the default value when no breakpoint applies', () => {
    setWindowWidth(320);
    const { result } = renderHook(() => useResponsiveValue<number>());
    const value = result.current.getResponsiveValue({ 768: 3, 1024: 4 }, 1);
    expect(value).toBe(1);
  });

  it('returns the largest applicable breakpoint value', () => {
    setWindowWidth(1280);
    const { result } = renderHook(() => useResponsiveValue<number>());
    const value = result.current.getResponsiveValue({ 768: 3, 1024: 4 }, 1);
    expect(value).toBe(4);
  });

  it('returns the breakpoint just below window width', () => {
    setWindowWidth(900);
    const { result } = renderHook(() => useResponsiveValue<number>());
    const value = result.current.getResponsiveValue({ 768: 3, 1024: 4 }, 1);
    expect(value).toBe(3);
  });

  it('treats breakpoint equal to window width as not yet applicable', () => {
    setWindowWidth(768);
    const { result } = renderHook(() => useResponsiveValue<number>());
    const value = result.current.getResponsiveValue({ 768: 3 }, 1);
    expect(value).toBe(1);
  });

  it('handles unsorted breakpoints', () => {
    setWindowWidth(2000);
    const { result } = renderHook(() => useResponsiveValue<number>());
    const value = result.current.getResponsiveValue({ 1024: 4, 320: 2, 768: 3 }, 1);
    expect(value).toBe(4);
  });

  it('works with non-numeric value types', () => {
    setWindowWidth(900);
    const { result } = renderHook(() => useResponsiveValue<string>());
    const value = result.current.getResponsiveValue({ 768: 'md', 1024: 'lg' }, 'sm');
    expect(value).toBe('md');
  });
});
