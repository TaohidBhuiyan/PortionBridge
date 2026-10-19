import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocationOnce } from './useGeolocationOnce';

const setGeolocation = (value) => Object.defineProperty(globalThis.navigator, 'geolocation', { value, configurable: true });

afterEach(() => setGeolocation(undefined));

describe('useGeolocationOnce', () => {
  it('never asks for location until request() is called', () => {
    const geo = { getCurrentPosition: vi.fn(), watchPosition: vi.fn() };
    setGeolocation(geo);
    const { result } = renderHook(() => useGeolocationOnce());
    expect(result.current.status).toBe('idle');
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('takes exactly one reading on request and never tracks continuously', () => {
    const geo = {
      getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: 24.9, longitude: 91.8 } })),
      watchPosition: vi.fn(),
    };
    setGeolocation(geo);
    const { result } = renderHook(() => useGeolocationOnce());
    act(() => result.current.request());
    expect(result.current.status).toBe('granted');
    expect(result.current.position).toEqual({ lat: 24.9, lng: 91.8 });
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(geo.watchPosition).not.toHaveBeenCalled();
  });

  it('reports permission denied without a position', () => {
    setGeolocation({ getCurrentPosition: vi.fn((_, fail) => fail({ code: 1 })) });
    const { result } = renderHook(() => useGeolocationOnce());
    act(() => result.current.request());
    expect(result.current.status).toBe('denied');
    expect(result.current.position).toBeNull();
  });

  it('distinguishes unavailable and timeout', () => {
    setGeolocation({ getCurrentPosition: vi.fn((_, fail) => fail({ code: 2 })) });
    const a = renderHook(() => useGeolocationOnce());
    act(() => a.result.current.request());
    expect(a.result.current.status).toBe('unavailable');
    setGeolocation({ getCurrentPosition: vi.fn((_, fail) => fail({ code: 3 })) });
    const b = renderHook(() => useGeolocationOnce());
    act(() => b.result.current.request());
    expect(b.result.current.status).toBe('error');
  });

  it('is "unavailable" when the browser has no geolocation API', () => {
    setGeolocation(undefined);
    const { result } = renderHook(() => useGeolocationOnce());
    act(() => result.current.request());
    expect(result.current.status).toBe('unavailable');
  });

  it('ignores a malformed position', () => {
    setGeolocation({ getCurrentPosition: vi.fn((ok) => ok({ coords: { latitude: 'x', longitude: null } })) });
    const { result } = renderHook(() => useGeolocationOnce());
    act(() => result.current.request());
    expect(result.current.status).toBe('error');
    expect(result.current.position).toBeNull();
  });
});
