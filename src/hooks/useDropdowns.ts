import { useState, useCallback, useEffect, useMemo } from 'react';
import { dropdownAPI, DropdownDataItem, RoleWithPermissions, StaticDropdownsResponse } from '../utils/api/dropdowns';
import { DropdownOption, SelectOption } from '../types';
import { AsyncSelectOption } from '../components/atoms/AsyncSelect/AsyncSelect';
import { apiCall } from '../utils/api/useSWR';
import debounce from 'lodash/debounce';

// Hook for static dropdown data (non-searchable)
export const useDropdownData = (type: 'designations' | 'departments' | 'roles' | 'reportingTo' | 'gender' | 'maritalStatus' | 'noticePeriod' | 'jobPreference' | 'jobOpenType' | 'shifts' | 'jobType' | 'careerBreakType' | 'educationType' | 'degree' | 'subject' | 'college' | 'university') => {
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                let results: DropdownOption[] = [];
                switch (type) {
                    case 'designations':
                        results = await dropdownAPI.fetchDesignations();
                        break;
                    case 'departments':
                        results = await dropdownAPI.fetchDepartments();
                        break;
                    case 'roles':
                        results = await dropdownAPI.fetchRoles();
                        break;
                    case 'reportingTo':
                        results = await dropdownAPI.fetchReportingToUsers();
                        break;
                    case 'gender':
                        results = await dropdownAPI.fetchGender();
                        break;
                    case 'maritalStatus':
                        results = await dropdownAPI.fetchMaritalStatus();
                        break;
                    case 'noticePeriod':
                        results = await dropdownAPI.fetchNoticePeriod();
                        break;
                    case 'jobPreference':
                        results = await dropdownAPI.fetchJobPreference();
                        break;
                    case 'jobOpenType':
                        results = await dropdownAPI.fetchJobOpenType();
                        break;
                    case 'shifts':
                        results = await dropdownAPI.fetchShifts();
                        break;
                    case 'jobType':
                        results = await dropdownAPI.fetchJobType();
                        break;
                    case 'careerBreakType':
                        results = await dropdownAPI.fetchCareerBreakType();
                        break;
                    case 'educationType':
                        results = await dropdownAPI.fetchEducationType();
                        break;
                    case 'degree':
                        results = await dropdownAPI.fetchDegree();
                        break;
                    case 'subject':
                        results = await dropdownAPI.fetchSubject();
                        break;
                    case 'college':
                        results = await dropdownAPI.fetchCollege();
                        break;
                    case 'university':
                        results = await dropdownAPI.fetchUniversity();
                        break;
                }
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : `Failed to fetch ${type}`);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [type]);

    return {
        options,
        loading,
        error
    };
};

// Hook for searchable locations dropdown
export const useLocationsDropdown = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    // Helper function to extract city name from full location path
    const extractCityName = (fullLocation: string): string => {
        const parts = fullLocation.split('/');
        return parts[parts.length - 1] || fullLocation; // Return the last part (city name) or original if no slash
    };

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (search: string) => {
            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Locations', search);
                // Transform the results to show only city names but keep full path as value
                const transformedResults = results.map(item => ({
                    value: item.value, // Keep full path as value for backend
                    label: extractCityName(item.label), // Show only city name as label
                }));

                // Remove duplicates based on value (not label) to prevent duplicate keys
                const uniqueResults = transformedResults.filter((item, index, self) =>
                    index === self.findIndex(other => other.value === item.value)
                );

                setOptions(uniqueResults);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch locations');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Locations', '', 1, 50).then(results => {
                const transformedResults = results.map(item => ({
                    value: item.value,
                    label: extractCityName(item.label),
                }));

                // Remove duplicates based on value to prevent duplicate keys
                const uniqueResults = transformedResults.filter((item, index, self) =>
                    index === self.findIndex(other => other.value === item.value)
                );

                setOptions(uniqueResults);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial locations');
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

// Hook for searchable universities dropdown
export const useUniversitiesDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('University', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch universities');
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
            dropdownAPI.fetchCandidateDropdownSearchable('University', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial universities');
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

// Hook for searchable colleges dropdown
export const useCollegesDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('College', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch colleges');
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
            dropdownAPI.fetchCandidateDropdownSearchable('College', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial colleges');
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

// Hook for searchable degrees dropdown
export const useDegreesDropdown = (educationTypeId?: string) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    // Reset options when education type changes
    useEffect(() => {
        setOptions([]);
        setInitialLoaded(false);
        setSearchTerm('');
    }, [educationTypeId]);
    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (search: string) => {
            if (!educationTypeId) {
                setOptions([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Degree', search, 1, 50, { education_type: educationTypeId });
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch degrees');
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 400),
        [educationTypeId]
    );

    // Search function to be called from components
    const search = useCallback((term: string) => {
        setSearchTerm(term);
        debouncedSearch(term);
    }, [debouncedSearch]);

    // Initial load
    useEffect(() => {
        if (!initialLoaded && educationTypeId) {
            setLoading(true);
            dropdownAPI.fetchCandidateDropdownSearchable('Degree', '', 1, 50, { education_type: educationTypeId }).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial degrees');
                setLoading(false);
            });
        }
    }, [initialLoaded, educationTypeId]);

    return {
        options,
        loading,
        error,
        search,
        searchTerm
    };
};

// Hook for searchable subjects dropdown
export const useSubjectsDropdown = (degreeId?: string) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    // Reset options when degree changes
    useEffect(() => {
        setOptions([]);
        setInitialLoaded(false);
        setSearchTerm('');
    }, [degreeId]);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce(async (search: string) => {
            if (!degreeId) {
                setOptions([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Subject', search, 1, 50, { degree: degreeId });
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 400),
        [degreeId]
    );

    // Search function to be called from components
    const search = useCallback((term: string) => {
        setSearchTerm(term);
        debouncedSearch(term);
    }, [debouncedSearch]);

    // Initial load
    useEffect(() => {
        if (!initialLoaded && degreeId) {
            setLoading(true);
            dropdownAPI.fetchCandidateDropdownSearchable('Subject', '', 1, 50, { degree: degreeId }).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial subjects');
                setLoading(false);
            });
        }
    }, [initialLoaded, degreeId]);

    return {
        options,
        loading,
        error,
        search,
        searchTerm
    };
};

// Hook for searchable skills dropdown
export const useSkillsDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('SkillSets', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch skills');
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
            dropdownAPI.fetchCandidateDropdownSearchable('SkillSets', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial skills');
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

// Hook for searchable education types dropdown
export const useEducationTypesDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('EducationType', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch education types');
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
            dropdownAPI.fetchCandidateDropdownSearchable('EducationType', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial education types');
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

// Hook for searchable employers dropdown
export const useEmployersDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Employer', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch employers');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Employer', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial employers');
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

// Hook for organization names from candidate employment history
export const useOrganizationsFromEmploymentDropdown = (candidateId?: string) => {
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!candidateId) {
            setOptions([]);
            return;
        }

        const fetchOrganizations = async () => {
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
                    const orgName = emp.organization_name;
                    if (orgName && !uniqueOrganizations.has(orgName)) {
                        uniqueOrganizations.add(orgName);
                        organizationOptions.push({
                            id: orgName,
                            value: orgName,
                            label: orgName
                        });
                    }
                });

                setOptions(organizationOptions);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch organizations from employment history');
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizations();
    }, [candidateId]);

    return {
        options,
        loading,
        error
    };
};

// Hook for searchable designation dropdown
export const useDesignationsDropdown = () => {
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
                // Changed from fetchCandidateDropdownSearchable to fetchUserDropdownSearchable
                const results = await dropdownAPI.fetchUserDropdownSearchable('Designation', search);
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
            // Changed from fetchCandidateDropdownSearchable to fetchUserDropdownSearchable
            dropdownAPI.fetchUserDropdownSearchable('Designation', '', 1, 50).then(results => {
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

// Hook for searchable customers dropdown
export const useCustomersDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Customer', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch customers');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Customer', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial customers');
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

// Hook for searchable industry dropdown
export const useIndustryDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Industry', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch industries');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Industry', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial industries');
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

//Reporting to dropdown
export const useUsersDropdown = () => {
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
                const results = await dropdownAPI.fetchReportingToUsers(search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to search users');
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

    // Initial load with empty search to get some default results
    useEffect(() => {
        if (!initialLoaded) {
            setLoading(true);
            dropdownAPI.fetchReportingToUsers('').then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial users');
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

// Hook for user status options (static)
export const useUserStatusOptions = (): DropdownOption[] => {
    return [
        { value: 'Active', label: 'Active' },
        { value: 'Inactive', label: 'Inactive' },
    ];
};

// Hook for searchable project types dropdown
export const useProjectTypesDropdown = () => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string) => {
            if (!term.trim() && initialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('ProjectType', term, 1, 50);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch project types');
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
            dropdownAPI.fetchCandidateDropdownSearchable('ProjectType', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial project types');
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

// Hook for searchable document types dropdown
export const useDocumentTypesDropdown = () => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string) => {
            if (!term.trim() && initialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Document_type', term, 1, 50);
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
            dropdownAPI.fetchCandidateDropdownSearchable('Document_type', '', 1, 50).then(results => {
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

// Hook for searchable source types dropdown
export const useSourceTypesDropdown = () => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string) => {
            if (!term.trim() && initialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Source_Type', term, 1, 50);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch source types');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Source_Type', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial source types');
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

// Hook for searchable source names dropdown
export const useSourceNamesDropdown = () => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string) => {
            if (!term.trim() && initialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Source_name', term, 1, 50);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch source names');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Source_name', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial source names');
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

// Hook for searchable source names dropdown with filtering by source type
export const useFilteredSourceNamesDropdown = (selectedSourceType: string) => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string, sourceType: string, isInitialLoaded: boolean) => {
            if (!term.trim() && isInitialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                // Add source_type filter if selected
                const additionalParams: Record<string, string> = sourceType ? { source_type: sourceType } : {};
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Source_name', term, 1, 50, additionalParams);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch source names');
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
        debouncedSearch(term, selectedSourceType, initialLoaded);
    }, [debouncedSearch, selectedSourceType, initialLoaded]);

    // Load data when selectedSourceType changes
    useEffect(() => {
        // Always reset and reload when source type changes
        setInitialLoaded(false);
        setSearchTerm('');

        // If no source type is selected, clear options
        if (!selectedSourceType) {
            setOptions([]);
            setInitialLoaded(true);
            return;
        }

        // Trigger initial load with the selected source type
        setLoading(true);
        const additionalParams: Record<string, string> = selectedSourceType ? { source_type: selectedSourceType } : {};
        dropdownAPI.fetchCandidateDropdownSearchable('Source_name', '', 1, 50, additionalParams).then(results => {
            setOptions(results);
            setInitialLoaded(true);
            setLoading(false);
        }).catch(err => {
            setError(err instanceof Error ? err.message : 'Failed to fetch initial source names');
            setLoading(false);
        });
    }, [selectedSourceType]);

    return {
        options,
        loading,
        error,
        search,
        searchTerm
    };
};

// Hook for searchable flags dropdown
export const useFlagsDropdown = () => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string) => {
            if (!term.trim() && initialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Flags', term, 1, 50);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch flags');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Flags', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial flags');
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

// Hook for searchable institutions dropdown
export const useInstitutionsDropdown = () => {
    const [options, setOptions] = useState<AsyncSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [initialLoaded, setInitialLoaded] = useState(false);

    const debouncedSearch = useMemo(() =>
        debounce(async (term: string) => {
            if (!term.trim() && initialLoaded) {
                return; // Don't search empty terms after initial load
            }

            setLoading(true);
            setError(null);
            try {
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Institution', term, 1, 50);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch institutions');
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
            dropdownAPI.fetchCandidateDropdownSearchable('Institution', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial institutions');
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

// Hook for searchable job types dropdown
export const useJobTypesDropdown = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('preferred_job', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch job types');
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
            dropdownAPI.fetchCandidateDropdownSearchable('preferred_job', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial job types');
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

// Hook for static dropdown data from /candidates/dropdown/static
export const useStaticDropdowns = () => {
    const [data, setData] = useState<Record<string, { id: string; name: string; }[]> | null>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaticData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await dropdownAPI.fetchStaticDropdowns();
                if (result?.static_dropdowns) {
                    setData(result.static_dropdowns);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch static dropdowns');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStaticData();
    }, []);

    // Helper function to get specific dropdown options
    const getDropdownOptions = (key: string): DropdownOption[] => {
        if (!data || !data[key]) return [];
        return data[key].map((item: DropdownDataItem) => ({
            id: item.id,
            value: item.name,
            label: item.name,
        }));
    };

    return {
        data,
        loading,
        error,
        getDropdownOptions,
        // Specific getters for commonly used dropdowns
        noticePeriodOptions: getDropdownOptions('NoticePeriod'),
        preferredJobOptions: getDropdownOptions('preferred_job'),
        jobOpenTypeOptions: getDropdownOptions('JobOpenType'),
        jobTypeOptions: getDropdownOptions('Job_Type'), // Job_Type means Job preference
        shiftsOptions: getDropdownOptions('Shifts'),
        genderOptions: getDropdownOptions('Gender'),
        maritalOptions: getDropdownOptions('Marital'),
        careerBreakTypeOptions: getDropdownOptions('CareerBreakType'),
        educationTypeOptions: getDropdownOptions('EducationType'),
        projectTypeOptions: getDropdownOptions('ProjectType'),
        sourceTypeOptions: getDropdownOptions('Source_Type'),
        flagsOptions: getDropdownOptions('Flags'),
    };
};

// Export helper function for extracting city names from location paths
export const extractCityName = (fullLocation: string): string => {
    const parts = fullLocation.split('/');
    return parts[parts.length - 1] || fullLocation; // Return the last part (city name) or original if no slash
};

// Hook for roles with permissions
export const useRolesWithPermissions = () => {
    const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await dropdownAPI.fetchRolesWithPermissions();
            setRoles(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch roles with permissions');
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // Convert roles to dropdown options format
    const options = useMemo(() => {
        return roles.map(role => ({
            id: role.name,
            value: role.name,
            label: role.name
        }));
    }, [roles]);

    return {
        roles,
        options,
        loading,
        error,
        refresh: fetchRoles
    };
};

// Hook for roles as dropdown options (names only)
export const useRolesDropdown = () => {
    const [options, setOptions] = useState<DropdownOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoles = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use the existing fetchRoles function which now handles both formats
                const results = await dropdownAPI.fetchRoles();
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch roles');
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, []);

    return {
        options,
        loading,
        error
    };
};

// Hook for dynamic user search using /users/ API
export const useUserSearch = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchUsers = useCallback(
        debounce(async (searchTerm: string) => {
            if (!searchTerm.trim()) {
                setUsers([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams();
                params.append('search', searchTerm.trim());
                params.append('limit', '20'); // Limit results for better performance

                const response = await apiCall<{ users: any[]; }>(`/users/?${params.toString()}`);
                if (response.error) {
                    throw new Error(response.error.message || "Failed to search users");
                }

                const foundUsers = response.data?.users || [];
                // Format users for display
                const formattedUsers = foundUsers.map(user => ({
                    id: user.id,
                    name: [user.first_name, user.middle_name, user.last_name]
                        .filter(Boolean)
                        .join(' ') || user.display_name || user.username,
                    email: user.email,
                    username: user.username,
                    display_name: user.display_name
                }));

                setUsers(formattedUsers);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to search users');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        }, 300),
        []
    );

    const clearSearch = useCallback(() => {
        setUsers([]);
        setError(null);
    }, []);

    return {
        users,
        loading,
        error,
        searchUsers,
        clearSearch
    };
};
// Hook for searchable department dropdown
export const useDepartmentsDropdown = () => {
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
                const results = await dropdownAPI.fetchUserDropdownSearchable('Department', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch departments');
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
            dropdownAPI.fetchUserDropdownSearchable('Department', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial departments');
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

// Hook for searchable roles dropdown
export const useRolesDropdownSearchable = () => {
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
                const results = await dropdownAPI.fetchUserDropdownSearchable('Roles', search);
                setOptions(results);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch roles');
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
            dropdownAPI.fetchUserDropdownSearchable('Roles', '', 1, 50).then(results => {
                setOptions(results);
                setInitialLoaded(true);
                setLoading(false);
            }).catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to fetch initial roles');
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
// Hook for searchable skill categories dropdown
export const useSkillCategoriesDropdownSearchable = () => {
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
                const results = await dropdownAPI.fetchCandidateDropdownSearchable('Skill Category', search);
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
            dropdownAPI.fetchCandidateDropdownSearchable('Skill Category', '', 1, 50).then(results => {
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
