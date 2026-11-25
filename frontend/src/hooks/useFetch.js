import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an API call, ignores stale responses, and supports "retry".
export default function useFetch(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: '' }));

    fetcherRef.current()
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: '' });
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick(t => t + 1), []);
  return { ...state, reload };
}
