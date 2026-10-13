import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAcupoints } from '../data/repository';

/**
 * 加载穴位数据。
 * 把「取数」从组件里抽出来，UI 因此天然具备 loading / error / retry 三个状态，
 * 也让将来切换到 FastAPI 时组件不需要任何改动。
 *
 * @returns {{data: Array, status: 'loading'|'ready'|'error', error: Error|null, reload: () => void}}
 */
export function useAcupoints() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [nonce, setNonce] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);

    fetchAcupoints()
      .then((list) => {
        if (cancelled) return;
        setData(list);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, status, error, reload };
}
