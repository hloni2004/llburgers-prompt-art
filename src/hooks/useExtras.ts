import { useState, useEffect, useCallback } from 'react';
import { fetchAvailableExtras, type ApiExtra } from '@/api/api';
import type { Extra } from '@/data/products';

export function mapApiExtra(e: ApiExtra): Extra {
  return {
    id:    e.id,
    name:  e.name,
    price: Number(e.price),
    stock: e.stockQuantity,
  };
}

interface UseExtrasResult {
  extras: Extra[];
  isLoading: boolean;
}

export function useExtras(): UseExtrasResult {
  const [extras, setExtras]   = useState<Extra[]>([]);
  const [isLoading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAvailableExtras();
      setExtras(data.map(mapApiExtra));
    } catch {
      setExtras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { extras, isLoading };
}
