import { useState, useMemo, useEffect } from 'react';
import { useURLPagination } from './useURLPagination';
import { useSWR, JobsAPI } from '../utils/api';
import { useAuth } from '../components/auth/AuthContext';
import {
  JobsAPIResponse,
} from '../types/job';

interface UseJobsConfig {
  defaultTab?: string;
  defaultLimit?: number;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export const useJobs = (config: UseJobsConfig = {}) => {
  const {
    defaultTab = 'all',
    defaultLimit = 10,
    enableAutoRefresh = false,
    refreshInterval = 30000,
  } = config;

  // Get current user for filtering
  const { user } = useAuth();

  // URL pagination
  const {
    currentPage,
    debouncedPage,
    limit: itemsPerPage,
    searchTerm,
    debouncedSearchTerm,
    activeTab,
    setPage: setCurrentPage,
    setLimit,
    setSearchTerm,
    setActiveTab,
    buildURLParams,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit,
    defaultTab,
    defaultSearch: '',
  });

  // Filters state
  const [filters, setFilters] = useState<Record<string, string | string[] | null>>({
    job_status: null,
    job_priority: null,
    preferred_job: null,
    employment_type: null,
    client_name: null,
    job_location: null,
    assigned_to: null,
    job_owner: null,
    created_by: null,
    client_requirement_id: null,
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'created_date',
    direction: 'desc',
  });

  // Build API URL
  const apiUrl = useMemo(() => {
    const userId = user?.id || user?._id;

    if ((activeTab === 'created' || activeTab === 'assigned') && !userId) {
      return null;
    }

    const params = new URLSearchParams();

    // Pagination
    params.append('page', debouncedPage.toString());
    params.append('limit', itemsPerPage.toString());

    // Search Logic - Cleaned up to avoid 'AND' traps on backend
    const term = debouncedSearchTerm.trim();
    if (term) {
      // Precise regex for Job IDs (matches JOB-187 or M-A-001640-JOB-187)
      const isJobId = /^JOB-\d+$/i.test(term) || /^M-A-.*-JOB-\d+$/i.test(term);
      
      if (isJobId) {
        // If it looks like a Job ID, use the dedicated job_id filter
        params.append('job_id', term);
      } else {
        // Otherwise, use the generic 'search' param which the backend 
        // documentation says covers client_name, job_title, and job_owner
        params.append('search', term);
      }
    }

    // Filters - convert tab to parameters
    const activeFilters = { ...filters };
    if (activeTab !== 'all') {
      const userDisplayName = user?.display_name;

      if (activeTab === 'assigned') {
        // Filter by current user name for assigned jobs
        if (userDisplayName) {
          params.append('assigned_to', userDisplayName);
        }
      } else if (activeTab === 'created') {
        // Filter by current user name for created jobs
        if (userDisplayName) {
          params.append('created_by', userDisplayName);
        }
      } else {
        // Any other tab value is a job status filter (from the status dropdown)
        params.append('job_status', activeTab);
      }
    }

    // Add filter parameters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array filters
          if (value.length > 0) {
            if (key === 'job_location') {
              // Backend expects comma-separated string for job_location
              params.append(key, value.join(', '));
            } else {
              value.forEach(item => {
                params.append(key, item.toString());
              });
            }
          }
        } else if (typeof value === 'string' && value.trim()) {
          // Handle string filters
          params.append(key, value.trim());
        } else if (typeof value !== 'string') {
          // Handle other non-string types (number, etc)
          params.append(key, String(value));
        }
      }
    });

    // Sorting
    params.append('sort_by', sortConfig.key);
    params.append('sort_order', sortConfig.direction);

    return `/job/?${params.toString()}`;
  }, [debouncedPage, itemsPerPage, debouncedSearchTerm, activeTab, filters, sortConfig, user]);

  // Fetch jobs
  const {
    data: jobsResponse,
    error,
    loading,
    isValidating,
    refetch,
  } = useSWR<JobsAPIResponse>(apiUrl);

  // Auto-refresh when activeTab changes
  useEffect(() => {
    if (activeTab) {
      console.log(`🔄 Tab changed to ${activeTab}, refetching data...`);
      refetch();
    }
  }, [activeTab, refetch]);

  // Transform data
  const jobsData = useMemo(() => {
    if (!apiUrl) return [];
    if (!jobsResponse?.Job) return [];

    const jobs = JobsAPI.transformResponse(jobsResponse);

    if (jobs.length > 0) {
      console.log('🔍 First job data:', jobs[0]);
      console.log('🔍 assigned_to:', jobs[0].assigned_to);
      console.log('🔍 job_owner:', jobs[0].job_owner);
      console.log('🔍 created_by:', jobs[0].created_by);
    }

    return jobs;
  }, [apiUrl, jobsResponse]);

  // Tab counts - use API total for current tab, estimate for others
  const tabCounts = useMemo(() => {
    if (!apiUrl || !jobsResponse) return {};

    // For the active tab, use the API's total_jobs count
    // For other tabs, we'd need separate API calls or show no count
    const counts: any = {
      all: undefined,
      created: undefined,
      assigned: undefined,
    };

    // Set the count for the current active tab
    if (activeTab && jobsResponse.total_jobs !== undefined) {
      counts[activeTab] = jobsResponse.total_jobs;
    }

    return counts;
  }, [apiUrl, jobsResponse, activeTab]);

  // Pagination info
  const totalPages = apiUrl ? jobsResponse?.total_pages || 0 : 0;
  const totalJobs = apiUrl ? jobsResponse?.total_jobs || 0 : 0;

  // Action handlers
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (newFilters: Record<string, string | string[] | null>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      job_status: null,
      job_priority: null,
      preferred_job: null,
      employment_type: null,
      client_name: null,
      job_location: null,
      assigned_to: null,
      job_owner: null,
      created_by: null,
      client_requirement_id: null,
    });
    setCurrentPage(1);
  };

  // Update job
  const updateJob = async (id: string, jobData: any) => {
    try {
      const updatedJob = await JobsAPI.updateJob(id, jobData);
      // Trigger refetch to update the list
      refetch();
      return updatedJob;
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  };

  // Delete job
  const deleteJob = async (id: string) => {
    try {
      await JobsAPI.deleteJob(id);
      // Trigger refetch to update the list
      refetch();
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  };

  // Delete multiple jobs
  const deleteJobs = async (ids: string[]) => {
    try {
      const result = await JobsAPI.deleteJobs(ids);
      // Trigger refetch to update the list
      refetch();
      return result;
    } catch (error) {
      console.error('Error deleting jobs:', error);
      throw error;
    }
  };

  return {
    // Data
    jobs: jobsData,
    jobsResponse,
    tabCounts,
    totalPages,
    totalJobs,

    // Loading states
    loading,
    isValidating,
    error,

    // Pagination
    currentPage,
    itemsPerPage,

    // Search and filters
    searchTerm,
    setSearchTerm,
    activeTab,
    filters,
    sortConfig,

    // Actions
    setCurrentPage,
    setLimit,
    handleTabChange,
    handleSort,
    handleFilterChange,
    clearFilters,
    refetch,

    // CRUD operations
    updateJob,
    deleteJob,
    deleteJobs,
  };
};
