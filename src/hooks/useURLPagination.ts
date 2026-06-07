import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    tab?: string;
    [key: string]: any; // Allow additional custom parameters
}

export interface URLPaginationConfig {
    defaultPage?: number;
    defaultLimit?: number;
    defaultTab?: string;
    defaultSearch?: string;
    paramNames?: {
        page?: string;
        limit?: string;
        search?: string;
        tab?: string;
    };
}

export interface URLPaginationReturn {
    // Current state values
    currentPage: number;
    debouncedPage: number;
    limit: number;
    searchTerm: string;
    debouncedSearchTerm: string;
    activeTab: string;

    // Setters that update both state and URL
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    setSearchTerm: (search: string) => void;
    setActiveTab: (tab: string) => void;

    // Bulk update function
    updateParams: (params: PaginationParams) => void;

    // URL building helper
    buildURLParams: () => URLSearchParams;

    // Reset to defaults
    resetPagination: () => void;
}

export const useURLPagination = (config: URLPaginationConfig = {}): URLPaginationReturn => {
    const [searchParams, setSearchParams] = useSearchParams();

    const {
        defaultPage = 1,
        defaultLimit = 10,
        defaultTab = 'all',
        defaultSearch = '',
        paramNames = {}
    } = config;

    // Parameter names (allow customization)
    const pageParam = paramNames.page || 'page';
    const limitParam = paramNames.limit || 'limit';
    const searchParam = paramNames.search || 'search';
    const tabParam = paramNames.tab || 'tab';

    // Initialize state from URL parameters
    const [currentPage, setCurrentPageState] = useState(() => {
        const urlPage = searchParams.get(pageParam);
        return urlPage ? parseInt(urlPage, 10) : defaultPage;
    });

    // Debounced page for API calls - prevents rapid pagination from firing multiple requests
    const [debouncedPage, setDebouncedPage] = useState(currentPage);
    const pageDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (pageDebounceRef.current) {
            clearTimeout(pageDebounceRef.current);
        }
        pageDebounceRef.current = setTimeout(() => {
            setDebouncedPage(currentPage);
        }, 300);
        return () => {
            if (pageDebounceRef.current) {
                clearTimeout(pageDebounceRef.current);
            }
        };
    }, [currentPage]);

    const [limit, setLimitState] = useState(() => {
        const urlLimit = searchParams.get(limitParam);
        return urlLimit ? parseInt(urlLimit, 10) : defaultLimit;
    });

    const [searchTerm, setSearchTermState] = useState(() => {
        return searchParams.get(searchParam) || defaultSearch;
    });

    const [activeTab, setActiveTabState] = useState(() => {
        return searchParams.get(tabParam) || defaultTab;
    });

    // Debounced search term for API calls
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => {
            if (searchDebounceRef.current) {
                clearTimeout(searchDebounceRef.current);
            }
        };
    }, [searchTerm]);

    // Function to update URL parameters
    const updateURLParams = useCallback((updates: PaginationParams) => {
        const newParams = new URLSearchParams(searchParams);

        // Handle page parameter
        if (updates.page !== undefined) {
            if (updates.page === defaultPage) {
                newParams.delete(pageParam); // Remove default page from URL for cleaner URLs
            } else {
                newParams.set(pageParam, updates.page.toString());
            }
        }

        // Handle limit parameter
        if (updates.limit !== undefined) {
            if (updates.limit === defaultLimit) {
                newParams.delete(limitParam); // Remove default limit from URL
            } else {
                newParams.set(limitParam, updates.limit.toString());
            }
        }

        // Handle tab parameter
        if (updates.tab !== undefined) {
            if (updates.tab === defaultTab) {
                newParams.delete(tabParam); // Remove default tab from URL
            } else {
                newParams.set(tabParam, updates.tab);
            }
        }

        // Handle search parameter
        if (updates.search !== undefined) {
            if (updates.search.trim() === '' || updates.search === defaultSearch) {
                newParams.delete(searchParam);
            } else {
                newParams.set(searchParam, updates.search.trim());
            }
        }

        // Handle any additional custom parameters
        Object.keys(updates).forEach(key => {
            if (!['page', 'limit', 'tab', 'search'].includes(key)) {
                const value = updates[key];
                if (value === null || value === undefined || value === '') {
                    newParams.delete(key);
                } else {
                    newParams.set(key, String(value));
                }
            }
        });

        setSearchParams(newParams);
    }, [searchParams, setSearchParams, defaultPage, defaultLimit, defaultTab, defaultSearch, pageParam, limitParam, tabParam, searchParam]);

    // Individual setters that update both state and URL
    const setPage = useCallback((page: number) => {
        setCurrentPageState(page);
        updateURLParams({ page });
    }, [updateURLParams]);

    const setLimit = useCallback((newLimit: number) => {
        setLimitState(newLimit);
        setCurrentPageState(1); // Reset to first page when changing limit
        updateURLParams({ limit: newLimit, page: 1 });
    }, [updateURLParams]);

    const setSearchTerm = useCallback((search: string) => {
        setSearchTermState(search);
        setCurrentPageState(1); // Reset to first page when searching
        updateURLParams({ search, page: 1 });
    }, [updateURLParams]);

    const setActiveTab = useCallback((tab: string) => {
        setActiveTabState(tab);
        setCurrentPageState(1); // Reset to first page when changing tabs
        updateURLParams({ tab, page: 1 });
    }, [updateURLParams]);

    // Bulk update function
    const updateParams = useCallback((params: PaginationParams) => {
        // Update all relevant state
        if (params.page !== undefined) setCurrentPageState(params.page);
        if (params.limit !== undefined) setLimitState(params.limit);
        if (params.search !== undefined) setSearchTermState(params.search);
        if (params.tab !== undefined) setActiveTabState(params.tab);

        // Update URL
        updateURLParams(params);
    }, [updateURLParams]);

    // URL building helper
    const buildURLParams = useCallback((): URLSearchParams => {
        const params = new URLSearchParams();

        if (currentPage !== defaultPage) {
            params.set(pageParam, currentPage.toString());
        }
        if (limit !== defaultLimit) {
            params.set(limitParam, limit.toString());
        }
        if (activeTab !== defaultTab) {
            params.set(tabParam, activeTab);
        }
        if (searchTerm.trim() !== '' && searchTerm !== defaultSearch) {
            params.set(searchParam, searchTerm.trim());
        }

        return params;
    }, [currentPage, limit, activeTab, searchTerm, defaultPage, defaultLimit, defaultTab, defaultSearch, pageParam, limitParam, tabParam, searchParam]);

    // Reset to defaults
    const resetPagination = useCallback(() => {
        setCurrentPageState(defaultPage);
        setLimitState(defaultLimit);
        setSearchTermState(defaultSearch);
        setActiveTabState(defaultTab);
        updateURLParams({
            page: defaultPage,
            limit: defaultLimit,
            search: defaultSearch,
            tab: defaultTab
        });
    }, [defaultPage, defaultLimit, defaultSearch, defaultTab, updateURLParams]);

    // Sync state when URL parameters change (e.g., back/forward navigation)
    useEffect(() => {
        const urlPage = parseInt(searchParams.get(pageParam) || defaultPage.toString(), 10);
        const urlLimit = parseInt(searchParams.get(limitParam) || defaultLimit.toString(), 10);
        const urlTab = searchParams.get(tabParam) || defaultTab;
        const urlSearch = searchParams.get(searchParam) || defaultSearch;

        // Only update state if values are different to prevent unnecessary re-renders
        if (urlPage !== currentPage) {
            setCurrentPageState(urlPage);
        }
        if (urlLimit !== limit) {
            setLimitState(urlLimit);
        }
        if (urlTab !== activeTab) {
            setActiveTabState(urlTab);
        }
        if (urlSearch !== searchTerm) {
            setSearchTermState(urlSearch);
        }
    }, [searchParams.toString(), defaultPage, defaultLimit, defaultTab, defaultSearch, pageParam, limitParam, tabParam, searchParam]);

    return {
        currentPage,
        debouncedPage,
        limit,
        searchTerm,
        debouncedSearchTerm,
        activeTab,
        setPage,
        setLimit,
        setSearchTerm,
        setActiveTab,
        updateParams,
        buildURLParams,
        resetPagination
    };
};
