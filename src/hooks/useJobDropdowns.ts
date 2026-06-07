import { useState, useEffect } from 'react';
import { dropdownAPI } from '../utils/api/dropdowns';
import { DropdownOption } from '../types';

/**
 * Custom hook for fetching all job-related dropdowns from API
 * Returns dropdown options for job form fields
 */
export const useJobDropdowns = () => {
  const [dropdowns, setDropdowns] = useState({
    jobTypes: [] as DropdownOption[],
    employmentTypes: [] as DropdownOption[],
    jobPriorities: [] as DropdownOption[],
    jobStatuses: [] as DropdownOption[],
    bgcTypes: [] as DropdownOption[],
    preferredJobs: [] as DropdownOption[],
    skillCategories: [] as DropdownOption[],
    billPeriods: [] as DropdownOption[],
    genderPreferences: [] as DropdownOption[],
    jobOpenTypes: [] as DropdownOption[],
    shifts: [] as DropdownOption[],
    industries: [] as DropdownOption[],
  });

  const [loading, setLoading] = useState({
    jobTypes: true,
    employmentTypes: true,
    jobPriorities: true,
    jobStatuses: true,
    bgcTypes: true,
    preferredJobs: true,
    skillCategories: true,
    billPeriods: true,
    genderPreferences: true,
    jobOpenTypes: true,
    shifts: true,
    industries: true,
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchAllDropdowns = async () => {
      try {
        // Fetch all dropdowns in parallel
        const [
          jobTypes,
          employmentTypes,
          jobPriorities,
          jobStatuses,
          bgcTypes,
          preferredJobs,
          skillCategories,
          billPeriods,
          genderPreferences,
          jobOpenTypes,
          shifts,
          industries,
        ] = await Promise.all([
          dropdownAPI.fetchJobType().catch((err) => {
            setErrors((prev) => ({ ...prev, jobTypes: err.message }));
            return [];
          }),
          dropdownAPI.fetchEmploymentType().catch((err) => {
            setErrors((prev) => ({ ...prev, employmentTypes: err.message }));
            return [];
          }),
          dropdownAPI.fetchJobPriority().catch((err) => {
            setErrors((prev) => ({ ...prev, jobPriorities: err.message }));
            return [];
          }),
          dropdownAPI.fetchJobStatus().catch((err) => {
            setErrors((prev) => ({ ...prev, jobStatuses: err.message }));
            return [];
          }),
          dropdownAPI.fetchBGCType().catch((err) => {
            setErrors((prev) => ({ ...prev, bgcTypes: err.message }));
            return [];
          }),
          dropdownAPI.fetchJobPreference().catch((err) => {
            setErrors((prev) => ({ ...prev, preferredJobs: err.message }));
            return [];
          }),
          dropdownAPI.fetchSkillCategory().catch((err) => {
            setErrors((prev) => ({ ...prev, skillCategories: err.message }));
            return [];
          }),
          dropdownAPI.fetchBillPeriod().catch((err) => {
            setErrors((prev) => ({ ...prev, billPeriods: err.message }));
            return [];
          }),
          dropdownAPI.fetchGenderPreference().catch((err) => {
            setErrors((prev) => ({ ...prev, genderPreferences: err.message }));
            return [];
          }),
          dropdownAPI.fetchJobOpenType().catch((err) => {
            setErrors((prev) => ({ ...prev, jobOpenTypes: err.message }));
            return [];
          }),
          dropdownAPI.fetchShifts().catch((err) => {
            setErrors((prev) => ({ ...prev, shifts: err.message }));
            return [];
          }),
          dropdownAPI.fetchIndustry().catch((err) => {
            setErrors((prev) => ({ ...prev, industries: err.message }));
            return [];
          }),
        ]);

        setDropdowns({
          jobTypes,
          employmentTypes,
          jobPriorities,
          jobStatuses,
          bgcTypes,
          preferredJobs,
          skillCategories,
          billPeriods,
          genderPreferences,
          jobOpenTypes,
          shifts,
          industries,
        });

        // Mark all as loaded
        setLoading({
          jobTypes: false,
          employmentTypes: false,
          jobPriorities: false,
          jobStatuses: false,
          bgcTypes: false,
          preferredJobs: false,
          skillCategories: false,
          billPeriods: false,
          genderPreferences: false,
          jobOpenTypes: false,
          shifts: false,
          industries: false,
        });
      } catch (error) {
        console.error('Error fetching job dropdowns:', error);
      }
    };

    fetchAllDropdowns();
  }, []);

  return {
    ...dropdowns,
    loading,
    errors,
  };
};

/**
 * Individual hooks for specific dropdown types (for granular use)
 */

export const useJobTypesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchJobType();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job types');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useEmploymentTypesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchEmploymentType();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch employment types');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useJobPrioritiesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchJobPriority();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job priorities');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useJobStatusesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchJobStatus();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch job statuses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useBGCTypesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchBGCType();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch BGC types');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useBillPeriodsDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchBillPeriod();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch bill periods');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useGenderPreferencesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchGenderPreference();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch gender preferences');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};

export const useIndustriesDropdown = () => {
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await dropdownAPI.fetchIndustry();
        setOptions(results);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch industries');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { options, loading, error };
};
