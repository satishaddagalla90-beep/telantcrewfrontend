import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiCall, API_ENDPOINTS, Client, ClientsResponse } from '../utils/api';
import { DropdownOption } from '../types';
import debounce from 'lodash/debounce';

// Hook for searchable clients dropdown with pagination
export const useClientsDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [clientsMap, setClientsMap] = useState<Map<string, Client>>(new Map());

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('limit', '50'); // Limit results for better performance
        if (search) {
          params.append('search', search);
        }

        const response = await apiCall<ClientsResponse>(
          `${API_ENDPOINTS.CLIENTS.LIST}?${params.toString()}`
        );

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch clients');
        }

        const clients = response.data?.Client || [];
        // Show all clients regardless of status - let users select any client
        const transformedResults = clients.map(client => ({
          value: client.client_name,
          label: client.client_name,
        }));

        // Create a map for quick client lookup by name
        const newClientsMap = new Map(
          clients.map(client => [client.client_name, client])
        );

        setOptions(transformedResults);
        setClientsMap(newClientsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients');
        setOptions([]);
        setClientsMap(new Map());
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback(
    (term: string) => {
      setSearchTerm(term);
      debouncedSearch(term);
    },
    [debouncedSearch]
  );

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50');

      apiCall<ClientsResponse>(`${API_ENDPOINTS.CLIENTS.LIST}?${params.toString()}`)
        .then(response => {
          if (response.error) {
            throw new Error(response.error.message || 'Failed to fetch initial clients');
          }

          const clients = response.data?.Client || [];
          // Show all clients regardless of status - let users select any client
          const transformedResults = clients.map(client => ({
            value: client.client_name,
            label: client.client_name,
          }));

          const newClientsMap = new Map(
            clients.map(client => [client.client_name, client])
          );

          setOptions(transformedResults);
          setClientsMap(newClientsMap);
          setInitialLoaded(true);
          setLoading(false);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to fetch initial clients');
          setLoading(false);
        });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    clientsMap,
  };
};

// Legacy hook for backward compatibility - now uses the searchable dropdown hook
export const useClients = () => {
  const { options, loading, error, clientsMap } = useClientsDropdown();

  return {
    clients: Array.from(clientsMap.values()),
    clientOptions: options,
    clientsMap,
    loading,
    error,
    refetch: () => {}, // No-op for backward compatibility
  };
};
