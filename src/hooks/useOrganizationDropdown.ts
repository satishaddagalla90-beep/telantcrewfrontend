import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../utils/api/useSWR';
import { DropdownOption } from '../types';
import debounce from 'lodash/debounce';

// Hook for organization names from candidate employment history with search support
export const useOrganizationsFromEmploymentDropdown = (candidateId?: string) => {
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (search: string) => {
            if (!candidateId) {
                setOptions([]);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await apiCall<any>(`/candidates/${candidateId}`, {
                    method: 'GET',
                });

                if (response.error) {
                    throw new Error(response.error.message || 'Failed to fetch candidate data');
                }

                const candidateData = response.data;
                const employment = candidateData?.employment || [];
                
                // Extract unique organization names
                const uniqueOrganizations = new Set<string>();
                const organizationOptions: DropdownOption[] = [];

                employment.forEach((emp: any) => {
                    // Normalize organization_name: could be array or string
                    let orgName = emp.organization_name;
                    if (Array.isArray(orgName)) {
                        orgName = orgName[0];
                    }
                    if (typeof orgName === 'string' && orgName.trim()) {
                        const normalizedOrgName = orgName.trim();
                        if (!uniqueOrganizations.has(normalizedOrgName)) {
                            // Filter by search term if provided
                            if (!search || normalizedOrgName.toLowerCase().includes(search.toLowerCase())) {
                                uniqueOrganizations.add(normalizedOrgName);
                                organizationOptions.push({
                                    id: normalizedOrgName,
                                    value: normalizedOrgName,
                                    label: normalizedOrgName
                                });
                            }
                        }
                    }
                });

                setOptions(organizationOptions);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch organizations from employment history');
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 400),
        [candidateId]
    );

    // Search function to be called from components
    const search = useCallback((term: string) => {
        setSearchTerm(term);
        debouncedSearch(term);
    }, [debouncedSearch]);

    // Initial load - fetch all organizations when candidateId changes
    useEffect(() => {
        debouncedSearch('');
    }, [candidateId, debouncedSearch]);

    return {
        options,
        loading,
        error,
        search,
        searchTerm
    };
};