import { useState, useEffect, useCallback } from 'react';
import { getCurrentSupplierId } from '../services/supplierService';

interface UseSupplierIdReturn {
  supplierId: string;
  loading: boolean;
  error: string | null;
  refreshSupplierId: () => Promise<void>;
}

export const useSupplierId = (): UseSupplierIdReturn => {
  const [supplierId, setSupplierId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplierId = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const id = await getCurrentSupplierId();
      setSupplierId(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supplier ID';
      setError(errorMessage);
      console.error('Error fetching supplier ID:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh the supplier ID
  const refreshSupplierId = useCallback(async () => {
    await fetchSupplierId();
  }, [fetchSupplierId]);

  // Fetch initial supplier ID on mount
  useEffect(() => {
    fetchSupplierId();
  }, [fetchSupplierId]);

  return {
    supplierId,
    loading,
    error,
    refreshSupplierId
  };
};