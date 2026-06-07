import { useState, useCallback, useEffect } from 'react';
import { apiCall } from '../utils/api/useSWR';
import { DropdownOption } from '../types';
import debounce from 'lodash/debounce';

// Generic function to fetch supplier dropdowns with search capability
const fetchSupplierDropdown = async (
  dropdownType: string,
  searchTerm: string = '',
  page: number = 1,
  limit: number = 50  // Increased limit for better initial loading
): Promise<DropdownOption[]> => {
  try {
    // Construct the URL properly
    const baseUrl = `/supplierdropdowns/${encodeURIComponent(dropdownType)}`;
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Use the supplier dropdown endpoint as specified
    const response = await apiCall<{
      data: Array<{
        id: string;
        name: string;
        requires_expiry?: boolean;
        requires_issue?: boolean;
        requires_number?: boolean;
        requires_file?: boolean;
        requires_document_number_field?: boolean;
      }>;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }>(
      `${baseUrl}?${params.toString()}`
    );

    if (response.error) {
      throw new Error(
        response.error.message || `Failed to fetch ${dropdownType} dropdown`
      );
    }

    const data = response.data?.data;
    if (data && Array.isArray(data)) {
      return data.map(item => ({
        id: item.id,
        value: item.name, // Using name as value to match current implementation
        label: item.name,
        // Include additional fields if they exist
        requires_expiry: item.requires_expiry,
        requires_issue: item.requires_issue,
        requires_number: item.requires_number,
        requires_file: item.requires_file,
        requires_document_number_field: item.requires_document_number_field
      }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching ${dropdownType} dropdown:`, error);
    return [];
  }
};

// Hook for supplier category dropdown
export const useSupplierCategoryDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Supplier Category', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch supplier categories');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Supplier Category', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial supplier categories');
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};

// Hook for empanelment status dropdown
export const useEmpanelmentStatusDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Empanelment Status', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch empanelment statuses');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Empanelment Status', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial empanelment statuses');
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};

// Hook for supplier type dropdown (multi-select)
export const useSupplierTypeDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      if (!search.trim() && initialLoaded) {
        // If search is empty and we already have initial data, don't make unnecessary API calls
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('SupplierType', search);
        setOptions(results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supplier types';
        setError(errorMessage);
        console.error('Supplier Type Dropdown Error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300), // Reduced debounce time for better responsiveness
    [initialLoaded]
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('SupplierType', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch initial supplier types';
        setError(errorMessage);
        console.error('Supplier Type Initial Load Error:', err);
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  // Reset initial loaded state when needed
  const reset = useCallback(() => {
    setInitialLoaded(false);
    setSearchTerm('');
  }, []);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    reset,
    initialLoaded
  };
};

// Hook for skill category dropdown
export const useSkillCategoryDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Skill Category', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch skill categories');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Skill Category', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial skill categories');
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};

// Hook for skill capability dropdown (multi-select)
export const useSkillCapabilityDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      if (!search.trim() && initialLoaded) {
        // If search is empty and we already have initial data, don't make unnecessary API calls
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('SkillSets', search);
        setOptions(results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch skill capabilities';
        setError(errorMessage);
        console.error('Skill Capability Dropdown Error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300), // Reduced debounce time for better responsiveness
    [initialLoaded]
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('SkillSets', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch initial skill capabilities';
        setError(errorMessage);
        console.error('Skill Capability Initial Load Error:', err);
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  // Reset initial loaded state when needed
  const reset = useCallback(() => {
    setInitialLoaded(false);
    setSearchTerm('');
  }, []);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    reset,
    initialLoaded
  };
};

// Hook for industry dropdown (multi-select)
export const useIndustryDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      if (!search.trim() && initialLoaded) {
        // If search is empty and we already have initial data, don't make unnecessary API calls
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Industry', search);
        setOptions(results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch industries';
        setError(errorMessage);
        console.error('Industry Dropdown Error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300), // Reduced debounce time for better responsiveness
    [initialLoaded]
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Industry', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch initial industries';
        setError(errorMessage);
        console.error('Industry Initial Load Error:', err);
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  // Reset initial loaded state when needed
  const reset = useCallback(() => {
    setInitialLoaded(false);
    setSearchTerm('');
  }, []);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    reset,
    initialLoaded
  };
};

// Hook for zone dropdown
export const useZoneDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Zone', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch zones');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Zone', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial zones');
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};

// Hook for branches dropdown - using countries API like ODC
export const useBranchesDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [allCities, setAllCities] = useState<Array<{ value: string; label: string }>>([]);

  // Fetch all cities on mount
  const fetchAllCities = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries');
      const data = await response.json();
      if (data && data.data) {
        // Flatten all cities from all countries
        const options = data.data.flatMap(
          (country: { country: string; cities: string[] }) =>
            country.cities.map(city => ({
              value: city,
              label: city,
            }))
        );
        setAllCities(options);
        setOptions(options.slice(0, 50)); // Default: top 50
        setInitialLoaded(true);
      } else {
        setAllCities([]);
        setOptions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
      setAllCities([]);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      if (!search.trim() && initialLoaded) {
        // If search is empty, show all cities (limited)
        setOptions(allCities.slice(0, 50));
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Filter cities client-side like ODC
        let filtered = allCities;
        if (search && search.trim()) {
          const lower = search.trim().toLowerCase();
          filtered = allCities.filter(opt =>
            opt.label.toLowerCase().includes(lower)
          );
        }
        setOptions(filtered.slice(0, 50)); // Limit to top 50
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to filter branches');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    [allCities, initialLoaded]
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      fetchAllCities();
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};
// Hook for document type dropdown
export const useDocumentTypeDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Document_type', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch document types');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Document_type', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial document types');
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};

// Hook for designation dropdown
export const useDesignationDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Designation', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch designations');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Designation', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch initial designations');
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm
  };
};

// Hook for department dropdown (multi-select)
export const useDepartmentDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      if (!search.trim() && initialLoaded) {
        // If search is empty and we already have initial data, don't make unnecessary API calls
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Department', search);
        setOptions(results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
        setError(errorMessage);
        console.error('Department Dropdown Error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300), // Reduced debounce time for better responsiveness
    [initialLoaded]
  );

  // Search function to be called from components
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  // Initial load
  useEffect(() => {
    if (!initialLoaded) {
      setLoading(true);
      fetchSupplierDropdown('Department', '', 1, 50).then(results => {
        setOptions(results);
        setInitialLoaded(true);
        setLoading(false);
      }).catch(err => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch initial departments';
        setError(errorMessage);
        console.error('Department Initial Load Error:', err);
        setLoading(false);
      });
    }
  }, [initialLoaded]);

  // Reset initial loaded state when needed
  const reset = useCallback(() => {
    setInitialLoaded(false);
    setSearchTerm('');
  }, []);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    reset,
    initialLoaded
  };
};

// ============ LAZY-LOADING VERSIONS - Only fetch when explicitly called ============

/**
 * Lazy-loading version of supplier type dropdown
 * Does NOT fetch on mount - only fetches when load() is called
 */
export const useLazySupplierTypeDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('SupplierType', search);
        setOptions(results);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supplier types';
        setError(errorMessage);
        console.error('Supplier Type Dropdown Error:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchSupplierDropdown('SupplierType', '', 1, 50);
      setOptions(results);
      setLoaded(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch supplier types';
      setError(errorMessage);
      console.error('Supplier Type Lazy Load Error:', err);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    load,
    loaded
  };
};

/**
 * Lazy-loading version of empanelment status dropdown
 * Does NOT fetch on mount - only fetches when load() is called
 */
export const useLazyEmpanelmentStatusDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Empanelment Status', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch empanelment statuses');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchSupplierDropdown('Empanelment Status', '', 1, 50);
      setOptions(results);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch empanelment statuses');
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    load,
    loaded
  };
};

/**
 * Lazy-loading version of zone dropdown
 * Does NOT fetch on mount - only fetches when load() is called
 */
export const useLazyZoneDropdown = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (search: string) => {
      setLoading(true);
      setError(null);
      try {
        const results = await fetchSupplierDropdown('Zone', search);
        setOptions(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch zones');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    []
  );

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const results = await fetchSupplierDropdown('Zone', '', 1, 50);
      setOptions(results);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch zones');
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  return {
    options,
    loading,
    error,
    search,
    searchTerm,
    load,
    loaded
  };
};
