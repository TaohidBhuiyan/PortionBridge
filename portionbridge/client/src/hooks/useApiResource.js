import { useCallback, useEffect, useState } from 'react';

/**
 * Loads data from `fetcher(params)` and re-loads whenever `params` change (compared by value).
 *
 * - Responses to superseded requests are discarded, so a slow earlier request can never overwrite
 *   a newer result.
 * - `reload()` re-fetches the SAME query while keeping the data already on screen
 *   (`refreshing` is true meanwhile), so a page does not blank out — and lose form state or a
 *   success message — after the user performs an action. Changing `params` clears the data
 *   (`loading` is true) because the old data belongs to a different query.
 * - `loading` is derived from which request the stored result belongs to, so no state is set
 *   synchronously inside the effect.
 *
 * Pass `enabled: false` to skip fetching (e.g. while a dependent value is missing).
 */
export function useApiResource(fetcher, params, { enabled = true } = {}) {
  const [nonce, setNonce] = useState(0);
  const paramsKey = JSON.stringify(params ?? null);
  const key = JSON.stringify([params ?? null, nonce]);
  const [state, setState] = useState({ key: null, paramsKey: null, data: null, error: null });

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    const [currentParams] = JSON.parse(key);
    (async () => {
      try {
        const data = await fetcher(currentParams ?? undefined);
        if (!cancelled) setState({ key, paramsKey, data, error: null });
      } catch (error) {
        if (!cancelled) setState({ key, paramsKey, data: null, error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetcher, key, paramsKey, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const settled = state.key === key;
  const sameQuery = state.paramsKey === paramsKey;
  const data = settled || sameQuery ? state.data : null;
  const pending = enabled && !settled;

  return {
    data,
    error: settled ? state.error : null,
    loading: pending && data === null,
    refreshing: pending && data !== null,
    reload,
  };
}
