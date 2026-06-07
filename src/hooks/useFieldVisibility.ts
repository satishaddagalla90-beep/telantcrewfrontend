import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { fetchFieldVisibilityForRole } from '../services/adminService';
import { FieldVisibilityConfig } from '../types/fieldVisibility';

/**
 * Hook that provides field visibility checks based on the current user's role.
 * Usage: const { isVisible } = useFieldVisibility();
 *        if (isVisible('job', 'clientInfo')) { ... }
 */
export const useFieldVisibility = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<FieldVisibilityConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.role || user.role.length === 0) {
        setLoading(false);
        return;
      }
      try {
        // Use the first role for visibility lookup
        const primaryRole = user.role[0];
        const result = await fetchFieldVisibilityForRole(primaryRole);
        setConfig(result);
      } catch {
        // Silently fail — default to everything visible
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role]);

  const isVisible = useCallback(
    (module: string, section: string): boolean => {
      if (!config) return true; // Default: show everything if no config
      const moduleSections = config.modules[module];
      if (!moduleSections) return true;
      const value = moduleSections[section];
      return value === undefined ? true : value;
    },
    [config]
  );

  return { isVisible, loading, config };
};
