import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiResource } from './useApiResource';

const deferred = () => { let resolve; let reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej; }); return { promise, resolve, reject }; };

describe('useApiResource', () => {
  it('loads, then returns data; passes params to the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: 1 });
    const { result } = renderHook(() => useApiResource(fetcher, { page: 1 }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual({ ok: 1 }));
    expect(result.current.loading).toBe(false);
    expect(fetcher).toHaveBeenCalledWith({ page: 1 });
  });

  it('reload keeps the current data on screen while re-fetching (no blank flash), then swaps in the new data', async () => {
    const d = deferred();
    const fetcher = vi.fn().mockResolvedValueOnce('first').mockReturnValueOnce(d.promise);
    const { result } = renderHook(() => useApiResource(fetcher, { id: 1 }));
    await waitFor(() => expect(result.current.data).toBe('first'));
    act(() => result.current.reload());
    expect(result.current.data).toBe('first');
    expect(result.current.loading).toBe(false);
    expect(result.current.refreshing).toBe(true);
    await act(async () => { d.resolve('second'); });
    await waitFor(() => expect(result.current.data).toBe('second'));
    expect(result.current.refreshing).toBe(false);
  });

  it('changing params clears the old data (it belongs to a different query) and shows loading', async () => {
    const d = deferred();
    const fetcher = vi.fn().mockResolvedValueOnce('page one').mockReturnValueOnce(d.promise);
    const { result, rerender } = renderHook(({ page }) => useApiResource(fetcher, { page }), { initialProps: { page: 1 } });
    await waitFor(() => expect(result.current.data).toBe('page one'));
    rerender({ page: 2 });
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    await act(async () => { d.resolve('page two'); });
    await waitFor(() => expect(result.current.data).toBe('page two'));
  });

  it('a slow response for superseded params never overwrites the newer result', async () => {
    const slow = deferred();
    const fetcher = vi.fn().mockReturnValueOnce(slow.promise).mockResolvedValueOnce('new');
    const { result, rerender } = renderHook(({ q }) => useApiResource(fetcher, { q }), { initialProps: { q: 'a' } });
    rerender({ q: 'b' });
    await waitFor(() => expect(result.current.data).toBe('new'));
    await act(async () => { slow.resolve('stale'); });
    expect(result.current.data).toBe('new');
  });

  it('an error is reported, a retry clears it while loading and can recover', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce({ response: { status: 500 } }).mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useApiResource(fetcher, {}));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.data).toBeNull();
    act(() => result.current.reload());
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('ok'));
  });

  it('does not fetch when disabled', () => {
    const fetcher = vi.fn();
    const { result } = renderHook(() => useApiResource(fetcher, {}, { enabled: false }));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
