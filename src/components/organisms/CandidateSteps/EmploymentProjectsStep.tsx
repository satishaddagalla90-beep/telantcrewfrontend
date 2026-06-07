import { useRef } from 'react';
import { debounce } from 'lodash';
import React, { useState, useEffect, useCallback } from 'react';
import Tabs, { TabItem } from '../../atoms/Tabs/Tabs';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon/Icon';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import AsyncSelect from '../../atoms/AsyncSelect/AsyncSelect';
import DateInput from '../../atoms/DateInput/DateInput';
import FormUtils from '../../utils/FormUtils';
import Modal from '../../atoms/Modal/Modal';
import { showWarningToast, showErrorToast } from '../../../utils/toast';
import {
  useEmployersDropdown,
  useDesignationsDropdown,
  useCustomersDropdown,
  useProjectTypesDropdown,
  useInstitutionsDropdown,
  useJobTypesDropdown,
  useIndustryDropdown,
} from '../../../hooks/useDropdowns';
import { useTabBasedAutoSave } from '../../../hooks/useTabBasedAutoSave';
import {
  transformEmploymentForAPI,
  transformProjectForAPI,
  transformCertificationForAPI,
} from '../../../utils/apiDataTransform';

const PAGE_SIZE = 50;
function useCountriesNowCitiesDropdown() {
  const [allCities, setAllCities] = useState<string[]>([]);
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setLoading(true);
    fetch('https://countriesnowapi-4x2g.onrender.com/api/v0.1/countries')
      .then(res => res.json())
      .then((data: { data: { country: string; cities: string[] }[] }) => {
        if (data && data.data) {
          const cities: string[] = data.data.flatMap(
            country => country.cities || []
          );
          const uniqueCities: string[] = Array.from(new Set(cities)).sort();
          setAllCities(uniqueCities);
        } else {
          setAllCities([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch cities');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    let filtered: string[] = allCities;
    if (searchTerm) {
      filtered = allCities.filter(city =>
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    const paginated = filtered.slice(0, page * PAGE_SIZE);
    setOptions(paginated.map(city => ({ value: city, label: city })));
    setLoading(false);
  }, [searchTerm, page, allCities]);

  const debouncedSearch = useRef(
    debounce((inputValue: string) => {
      setSearchTerm(inputValue);
      setPage(1);
    }, 400)
  ).current;

  const search = (inputValue: string) => {
    debouncedSearch(inputValue);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const filtered = allCities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const hasMore = filtered.length > page * PAGE_SIZE;

  return {
    options,
    loading,
    error,
    search,
    loadMore,
    hasMore,
  };
}
interface Employment {
  id: string;
  organizationName: string;
  jobType: string;
  payrollOrganization: string;
  designation: string;
  location: string;
  fromDate: string;
  toDate: string;
  isCurrentJob: boolean;
}

interface Project {
  id: string;
  customerName: string;
  industry: string;
  projectType: string;
  designation: string;
  organizationName: string;
  fromDate: string;
  toDate: string;
  isCurrentProject: boolean;
}

interface Certification {
  id: string;
  certificationName: string;
  institutionName: string;
  certificationNo: string;
  certificationDate: string;
  validUntil: string;
}

// Helper function to extract value from dropdown objects
const extractValue = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && value.value) return value.value;
  return '';
};

// Helper function to convert ID to label (name) by looking up in dropdown options
const convertIdToLabel = (id: string, options: any[]): string => {
  if (!id || !options || options.length === 0) return id;
  const option = options.find(opt => opt.value === id || opt.id === id);
  return option ? option.label : id;
};

// Props interface for step components used in this step
interface StepComponentProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

const EmploymentProjectsStep: React.FC<StepComponentProps> = ({
  formData,
  onChange,
}) => {
  // Use searchable employer dropdown
  const {
    options: employerOptions,
    loading: employerLoading,
    error: employerError,
    search: searchEmployer,
  } = useEmployersDropdown();

  // Use searchable designation dropdown
  const {
    options: designationOptions,
    loading: designationLoading,
    error: designationError,
    search: searchDesignation,
  } = useDesignationsDropdown();

  // Use paginated, debounced, searchable city dropdown for location
  const {
    options: cityOptions,
    loading: cityLoading,
    error: cityError,
    search: searchCity,
    loadMore: loadMoreCity,
    hasMore: hasMoreCity,
  } = useCountriesNowCitiesDropdown();

  // Use searchable customer dropdown
  const {
    options: customerOptions,
    loading: customerLoading,
    error: customerError,
    search: searchCustomer,
  } = useCustomersDropdown();

  // Use searchable project type dropdown
  const {
    options: projectTypeOptions,
    loading: projectTypeLoading,
    error: projectTypeError,
    search: searchProjectType,
  } = useProjectTypesDropdown();

  // Use searchable institutions dropdown
  const {
    options: institutionOptions,
    loading: institutionLoading,
    error: institutionError,
    search: searchInstitution,
  } = useInstitutionsDropdown();

  // Use searchable job types dropdown
  const {
    options: jobTypeOptions,
    loading: jobTypeLoading,
    error: jobTypeError,
    search: searchJobType,
  } = useJobTypesDropdown();

  // Use searchable industry dropdown
  const {
    options: industryOptions,
    loading: industryLoading,
    error: industryError,
    search: searchIndustry,
  } = useIndustryDropdown();



  // Tab management
  type TabType = 'employment' | 'projects' | 'certifications';
  const [activeTab, setActiveTab] = useState<TabType>('employment');

  // Tab change handler - now with auto-save
  const handleTabChange = (tabId: string) => {
    if (
      tabId === 'employment' ||
      tabId === 'projects' ||
      tabId === 'certifications'
    ) {
      // Auto-save current tab forms before switching
      autoSaveTabForms(activeTab);

      setActiveTab(tabId as TabType);
    }
  };

  // Employment management - multi-form pattern
  const [employmentHistory, setEmploymentHistory] = useState<Employment[]>(
    formData.employmentHistory || []
  );
  const [activeEmploymentForms, setActiveEmploymentForms] = useState<
    Employment[]
  >(() => {
    // Show initial form only if no employment history exists
    if (
      !formData.employmentHistory ||
      formData.employmentHistory.length === 0
    ) {
      return [
        {
          id: `temp-employment-initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          organizationName: '',
          jobType: '',
          payrollOrganization: '',
          designation: '',
          location: '',
          fromDate: '',
          toDate: '',
          isCurrentJob: false,
        },
      ];
    }
    return [];
  });

  // Project management - multi-form pattern
  const [projectsHistory, setProjectsHistory] = useState<Project[]>(
    formData.projectHistory || []
  );
  const [activeProjectForms, setActiveProjectForms] = useState<Project[]>(
    () => {
      // Show initial form only if no project history exists
      if (!formData.projectHistory || formData.projectHistory.length === 0) {
        return [
          {
            id: `temp-project-initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            customerName: '',
            industry: '',
            projectType: '',
            designation: '',
            organizationName: '',
            fromDate: '',
            toDate: '',
            isCurrentProject: false,
          },
        ];
      }
      return [];
    }
  );

  // Filter employer options for projects - only show organizations from employment section
  const getFilteredEmployerOptionsForProjects = useCallback(() => {
    // Collect organizations from both saved history and active employment forms
    const allOrganizationIds = new Set<string>();
    const allOrganizationNames = new Set<string>();

    // Add from saved employment history (contains NAMES after save)
    employmentHistory.forEach(emp => {
      const orgValue = extractValue(emp.organizationName);
      if (orgValue && orgValue.trim() !== '') {
        allOrganizationNames.add(orgValue);
      }
    });

    // Add from active employment forms (contains IDs before save)
    activeEmploymentForms.forEach(form => {
      const orgValue = extractValue(form.organizationName);
      if (orgValue && orgValue.trim() !== '') {
        // Could be ID or name, add to both sets
        allOrganizationIds.add(orgValue);
        allOrganizationNames.add(orgValue);
      }
    });

    // Filter employer options: match by ID OR by name (label)
    return employerOptions.filter(
      option =>
        allOrganizationIds.has(option.value) ||
        allOrganizationNames.has(option.label)
    );
  }, [employerOptions, employmentHistory, activeEmploymentForms]);

  // Given an organization value (ID or name), return date bounds for that
  // employment record (if any). Returns { from?: string; to?: string }
  const getEmploymentDateBoundsForOrg = (orgValue: string) => {
    const val = extractValue(orgValue);

    // Try to find the employer option corresponding to the provided value
    // so we can compare labels (names) as well as IDs.
    const employerOption = employerOptions.find(
      opt => opt.value === val || opt.id === val || opt.label === val
    );
    const orgLabel = employerOption ? employerOption.label : undefined;

    // Search active employment forms first (they may contain IDs before save)
    const activeMatch = activeEmploymentForms.find(emp => {
      const empVal = extractValue(emp.organizationName) || emp.organizationName;
      // empVal could be an ID or a label; match against both val and orgLabel
      return (
        empVal === val ||
        emp.organizationName === val ||
        (orgLabel && (empVal === orgLabel || emp.organizationName === orgLabel))
      );
    });
    if (activeMatch) {
      let from =
        extractValue(activeMatch.fromDate) || activeMatch.fromDate || '';
      let to = activeMatch.isCurrentJob
        ? new Date().toISOString().split('T')[0]
        : extractValue(activeMatch.toDate) || activeMatch.toDate || '';

      // Handle yyyy-mm format for employment dates
      if (from && from.match(/^\d{4}-\d{2}$/)) {
        from = `${from}-01`;
      }
      if (to && to.match(/^\d{4}-\d{2}$/)) {
        to = `${to}-01`;
      }

      return { from, to };
    }

    // Then search saved employment history (these usually contain names)
    const savedMatch = employmentHistory.find(emp => {
      const empVal = extractValue(emp.organizationName) || emp.organizationName;
      return (
        empVal === val ||
        emp.organizationName === val ||
        (orgLabel && (empVal === orgLabel || emp.organizationName === orgLabel))
      );
    });
    if (savedMatch) {
      let from =
        extractValue(savedMatch.fromDate) || savedMatch.fromDate || '';
      let to = savedMatch.isCurrentJob
        ? new Date().toISOString().split('T')[0]
        : extractValue(savedMatch.toDate) || savedMatch.toDate || '';

      // Handle yyyy-mm format for employment dates
      if (from && from.match(/^\d{4}-\d{2}$/)) {
        from = `${from}-01`;
      }
      if (to && to.match(/^\d{4}-\d{2}$/)) {
        to = `${to}-01`;
      }

      return { from, to };
    }

    return { from: '', to: '' };
  };
  // Certification management - multi-form pattern
  const [certificationHistory, setCertificationHistory] = useState<
    Certification[]
  >(formData.certifications || []);
  const [activeCertificationForms, setActiveCertificationForms] = useState<
    Certification[]
  >(() => {
    // Show initial form only if no certification history exists
    if (!formData.certifications || formData.certifications.length === 0) {
      return [
        {
          id: `temp-certification-initial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          certificationName: '',
          institutionName: '',
          certificationNo: '',
          certificationDate: '',
          validUntil: '',
        },
      ];
    }
    return [];
  });

  // Track touched fields for live validation (not actually used since we show errors immediately)
  const [employmentTouched, setEmploymentTouched] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [projectTouched, setProjectTouched] = useState<
    Record<string, Record<string, boolean>>
  >({});

  const [certificationTouched, setCertificationTouched] = useState<
    Record<string, Record<string, boolean>>
  >({});

  // Dummy data for dropdowns

  const certificationOptions = [
    'AWS Certified Solutions Architect',
    'Microsoft Azure Fundamentals',
    'Google Cloud Professional',
    'Certified Kubernetes Administrator',
    'CompTIA Security+',
    'Cisco Certified Network Associate',
    'Project Management Professional (PMP)',
    'Certified ScrumMaster (CSM)',
    'Oracle Certified Professional',
    'Salesforce Certified Administrator',
    'Red Hat Certified Engineer',
    'VMware Certified Professional',
    'Certified Information Systems Security Professional (CISSP)',
    'Six Sigma Green Belt',
    'ITIL Foundation',
    'Certified Ethical Hacker (CEH)',
    'Tableau Desktop Specialist',
    'HubSpot Content Marketing',
    'Google Analytics Certified',
    'Facebook Blueprint Certification',
  ];

  // Helper function to check if an employment entry is complete (has all required fields)
  const isEmploymentComplete = (emp: Employment): boolean => {
    const hasOrg = Boolean(extractValue(emp.organizationName));
    const hasJobType = Boolean(extractValue(emp.jobType));
    const hasDesignation = Boolean(extractValue(emp.designation));
    const hasLocation = Boolean(extractValue(emp.location));
    const hasFromDate = Boolean(extractValue(emp.fromDate));
    const hasToDate = emp.isCurrentJob || Boolean(extractValue(emp.toDate));
    return hasOrg && hasJobType && hasDesignation && hasLocation && hasFromDate && hasToDate;
  };

  // Helper function to get missing required fields for an employment entry
  const getMissingEmploymentFields = (emp: Employment): (keyof Employment)[] => {
    const missing: (keyof Employment)[] = [];
    if (!extractValue(emp.organizationName)) missing.push('organizationName');
    if (!extractValue(emp.jobType)) missing.push('jobType');
    if (!extractValue(emp.designation)) missing.push('designation');
    if (!extractValue(emp.location)) missing.push('location');
    if (!extractValue(emp.fromDate)) missing.push('fromDate');
    if (!emp.isCurrentJob && !extractValue(emp.toDate)) missing.push('toDate');
    return missing;
  };

  // Sync local state with formData changes - split incomplete entries into active forms
  useEffect(() => {
    if (
      formData.employmentHistory &&
      Array.isArray(formData.employmentHistory)
    ) {
      // Separate complete and incomplete entries
      const completeEntries: Employment[] = [];
      const incompleteEntries: Employment[] = [];

      formData.employmentHistory.forEach((emp: Employment) => {
        // Ensure location is always a string, never null
        const sanitizedEmp = {
          ...emp,
          location: emp.location || '',
        };

        if (isEmploymentComplete(sanitizedEmp)) {
          completeEntries.push(sanitizedEmp);
        } else {
          incompleteEntries.push(sanitizedEmp);
        }
      });

      // Set complete entries to history (saved)
      setEmploymentHistory(completeEntries);

      // Set incomplete entries to active forms for editing
      if (incompleteEntries.length > 0) {
        setActiveEmploymentForms(prevForms => {
          // Get IDs of incomplete entries to avoid duplicates
          const incompleteIds = new Set(incompleteEntries.map(e => e.id));
          // Keep existing active forms that are not in incomplete entries
          const existingForms = prevForms.filter(f => !incompleteIds.has(f.id));
          return [...incompleteEntries, ...existingForms];
        });

        // Mark all required fields as touched for incomplete entries to show validation errors
        incompleteEntries.forEach(emp => {
          const missingFields = getMissingEmploymentFields(emp);
          missingFields.forEach(field => {
            setEmploymentTouched(prev => ({
              ...prev,
              [emp.id]: {
                ...prev[emp.id],
                [field]: true,
              },
            }));
          });
        });

        // Show warning toast about incomplete entries
        const locationMissingCount = incompleteEntries.filter(
          emp => !extractValue(emp.location)
        ).length;
        if (locationMissingCount > 0) {
          showWarningToast(
            `${locationMissingCount} employment ${locationMissingCount === 1 ? 'entry needs' : 'entries need'} location to be filled in`
          );
        }
      }
    }
  }, [formData.employmentHistory]);

  useEffect(() => {
    if (formData.projectHistory && Array.isArray(formData.projectHistory)) {
      setProjectsHistory(formData.projectHistory);
    }
  }, [formData.projectHistory]);

  useEffect(() => {
    if (formData.certifications && Array.isArray(formData.certifications)) {
      setCertificationHistory(formData.certifications);
    }
  }, [formData.certifications]);

  // Auto-save on component unmount (when moving to next step)
  useEffect(() => {
    return () => {
      // Auto-save employment forms
      activeEmploymentForms.forEach(form => {
        if (form.organizationName?.trim() && form.designation?.trim()) {
          saveEmployment(form.id);
        }
      });

      // Auto-save project forms
      activeProjectForms.forEach(form => {
        if (form.customerName?.trim() && form.designation?.trim()) {
          saveProject(form.id);
        }
      });

      // Auto-save certification forms
      activeCertificationForms.forEach(form => {
        if (form.certificationName?.trim()) {
          saveCertification(form.id);
        }
      });
    };
  }, []); // No dependencies - only run on mount/unmount

  // Modal state management
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '',
    title: '',
    placeholder: '',
    value: '',
  });

  // Modal handlers
  const openModal = (type: string, title: string, placeholder: string) => {
    setModalState({
      isOpen: true,
      type,
      title,
      placeholder,
      value: '',
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      type: '',
      title: '',
      placeholder: '',
      value: '',
    });
  };

  const handleModalSubmit = () => {
    if (modalState.value.trim()) {
      // For now, we'll just close the modal
      // In a real app, this would save to a backend
      closeModal();
    }
  };

  // Helper function to convert between string values and AsyncSelectOption format
  const getEmployerOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = employerOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for designations
  const getDesignationOptionFromValue = (value: string) => {
    if (!value) return null;

    // First try to find by label (name) since we store names
    const byLabel = designationOptions.find(opt => opt.label === value);
    if (byLabel) return byLabel;

    // Fallback to find by value (ID) for backwards compatibility
    const byValue = designationOptions.find(opt => opt.value === value);
    if (byValue) return byValue;

    // If no match found, create a custom option
    return { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for locations
  // Helper for city dropdown
  const getCityOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = cityOptions.find(
      (opt: { value: string; label: string }) => opt.value === value
    );
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for customers
  const getCustomerOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = customerOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for industry
  const getIndustryOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = industryOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for project types
  const getProjectTypeOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = projectTypeOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for institutions
  const getInstitutionOptionFromValue = (value: string) => {
    if (!value) return null;
    const option = institutionOptions.find(opt => opt.value === value);
    return option
      ? { value: option.value, label: option.label }
      : { value, label: value };
  };

  // Helper function to convert between string values and AsyncSelectOption format for job types
  // Helper function to convert between string values and AsyncSelectOption format for job types
  const getJobTypeOptionFromValue = (value: string) => {
    if (!value) return null;

    // First try to find by label (name) since we're moving to store names
    const byLabel = jobTypeOptions.find(opt => opt.label === value);
    if (byLabel) return byLabel;

    // Fallback: Find all options matching the value (ID)
    const matchingOptions = jobTypeOptions.filter(opt => opt.value === value);

    if (matchingOptions.length === 0) {
      return { value, label: value };
    }

    // If multiple options match (e.g., FTE and Lateral share ID), and we only have the ID,
    // default to FTE as a safe bet, or return the first match.
    const fteOption = matchingOptions.find(opt => opt.label.trim().toLowerCase() === 'fte');
    return fteOption || matchingOptions[0];
  };

  const isPermanentJobType = (jobType: string): boolean => {
    const jobTypeValue = extractValue(jobType);
    const FTE_ID = 'npra8o005a5r591';

    // Direct check against known FTE ID
    if (jobTypeValue === FTE_ID) return true;

    // Fallback: Check label
    // Check if it's the ID - need to find the label from options
    // Use the improved lookup to prioritize FTE label if IDs collide
    const jobTypeOption = getJobTypeOptionFromValue(jobTypeValue);

    // Compare against the label (display name) not the ID
    const labelToCheck = jobTypeOption?.label || jobTypeValue;
    return labelToCheck.toLowerCase() === 'fte';
  };

  // Helper function to check if any saved employment record has isCurrentJob = true
  const hasActiveCurrentJob = (): boolean => {
    return employmentHistory.some(
      employment => employment.isCurrentJob === true
    );
  };

  // Helper function to check if any saved project record has isCurrentProject = true
  const hasActiveCurrentProject = (): boolean => {
    return projectsHistory.some(
      project => project.isCurrentProject === true
    );
  };
  // Helper function to get minimum allowed from date for new employment
  // excludeFormId: When editing, exclude this employment from consideration
  const getMinimumEmploymentFromDate = (excludeFormId?: string): string => {
    // Filter out the employment being edited (if any)
    const relevantHistory = excludeFormId
      ? employmentHistory.filter(emp => emp.id !== excludeFormId)
      : employmentHistory;

    if (relevantHistory.length === 0) {
      return ''; // No minimum for first employment
    }

    // Find the latest employment end date
    const latestEmployment = relevantHistory.reduce(
      (latest, current) => {
        // If current job, use today's date as the "end date"
        if (current.isCurrentJob) {
          return current;
        }

        // Compare toDate values
        if (!latest) return current;

        if (latest.isCurrentJob) return latest; // Current job is always latest

        const latestDate = latest.toDate
          ? new Date(latest.toDate)
          : new Date(0);
        const currentDate = current.toDate
          ? new Date(current.toDate)
          : new Date(0);

        return currentDate > latestDate ? current : latest;
      },
      null as Employment | null
    );

    if (!latestEmployment) return '';

    // If it's a current job, return tomorrow's date
    if (latestEmployment.isCurrentJob) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // Otherwise, return day after the toDate
    if (latestEmployment.toDate) {
      const nextDay = new Date(latestEmployment.toDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay.toISOString().split('T')[0];
    }

    return '';
  };

  const tabs: TabItem[] = [
    {
      id: 'employment',
      label: 'Employment',
      count: employmentHistory.length,
    },
    {
      id: 'projects',
      label: 'Projects',
      count: projectsHistory.length,
    },
    {
      id: 'certifications',
      label: 'Certifications',
      count: certificationHistory.length,
    },
  ];

  // Navigation functions for tab progression
  const handleTabNext = () => {
    if (activeTab === 'employment') {
      setActiveTab('projects');
      return false;
    } else if (activeTab === 'projects') {
      setActiveTab('certifications');
      return false;
    } else if (activeTab === 'certifications') {
      return true; // Proceed to next wizard step
    }
    return true;
  };

  const handleTabPrevious = () => {
    if (activeTab === 'certifications') {
      setActiveTab('projects');
      return false;
    } else if (activeTab === 'projects') {
      setActiveTab('employment');
      return false;
    } else if (activeTab === 'employment') {
      return true; // Go to previous wizard step
    }
    return true;
  };

  // Employment functions
  // Add loading state to prevent double-clicking
  const [isAddingEmployment, setIsAddingEmployment] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isAddingCertification, setIsAddingCertification] = useState(false);

  // Add saving states to prevent double-clicking on save buttons
  const [isSavingEmployment, setIsSavingEmployment] = useState<{
    [key: string]: boolean;
  }>({});
  const [isSavingProject, setIsSavingProject] = useState<{
    [key: string]: boolean;
  }>({});
  const [isSavingCertification, setIsSavingCertification] = useState<{
    [key: string]: boolean;
  }>({});

  const addEmploymentForm = async () => {
    // Prevent double-clicking
    if (isAddingEmployment) {
      return;
    }

    setIsAddingEmployment(true);

    try {
      const newForm: Employment = {
        id: `temp-employment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        organizationName: '',
        jobType: '',
        payrollOrganization: '',
        designation: '',
        location: '',
        fromDate: '',
        toDate: '',
        isCurrentJob: false,
      };

      setActiveEmploymentForms(currentForms => [...currentForms, newForm]);
    } catch (error) {
      console.error('Error in addEmploymentForm:', error);
    } finally {
      setIsAddingEmployment(false);
    }
  };

  // Mark employment field as touched
  const markEmploymentFieldTouched = (
    formId: string,
    field: keyof Employment
  ) => {
    setEmploymentTouched(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: true,
      },
    }));
  };

  // Mark project field as touched
  const markProjectFieldTouched = (formId: string, field: keyof Project) => {
    setProjectTouched(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: true,
      },
    }));
  };

  // Mark certification field as touched
  const markCertificationFieldTouched = (
    formId: string,
    field: keyof Certification
  ) => {
    setCertificationTouched(prev => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: true,
      },
    }));
  };

  // Internal validation (for Save button) - does NOT check touched state
  const validateEmploymentField = (
    form: Employment,
    field: keyof Employment
  ): string => {
    const value = extractValue(form[field]);

    switch (field) {
      case 'organizationName':
        return !value ? 'Organization name is required' : '';
      case 'jobType':
        return !value ? 'Job type is required' : '';
      case 'designation':
        return !value ? 'Designation is required' : '';
      case 'location':
        return !value ? 'Location is required' : '';
      case 'fromDate':
        if (!value) {
          return 'From date is required';
        }
        // Check if fromDate is in the future
        const fromDate = new Date(value);
        const today = new Date();
        if (fromDate > today) {
          return 'From date cannot be in the future';
        }
        // No sequential date validation - allow any order, data will be auto-sorted
        return '';
      case 'toDate':
        if (!form.isCurrentJob && !value) {
          return 'To date is required';
        }
        // Check if toDate is before fromDate
        if (value && form.fromDate) {
          const fromDateObj = new Date(form.fromDate);
          const toDateObj = new Date(value);
          if (toDateObj < fromDateObj) {
            return 'To date cannot be before from date';
          }
        }
        // Check if toDate is in the future
        if (value) {
          const toDateObj = new Date(value);
          const today = new Date();
          if (toDateObj > today) {
            return 'To date cannot be in the future';
          }
        }
        return '';
      default:
        return '';
    }
  };

  // Display validation (for field error props) - checks touched state
  const getEmploymentFieldError = (
    formId: string,
    field: keyof Employment
  ): string => {
    const form = activeEmploymentForms.find(f => f.id === formId);
    if (!form) return '';

    // Only show errors for fields that have been touched
    const isTouched = employmentTouched[formId]?.[field];
    if (!isTouched) return '';

    return validateEmploymentField(form, field);
  };

  // Internal validation (for Save button) - does NOT check touched state
  const validateProjectField = (
    form: Project,
    field: keyof Project
  ): string => {
    const value = extractValue(form[field]);

    switch (field) {
      case 'customerName':
        return !value ? 'Customer name is required' : '';
      case 'industry': {
        // Industry is required only when customer name is "Confidential"
        const customerOption = getCustomerOptionFromValue(form.customerName);
        const isConfidential = customerOption?.label?.toLowerCase().includes('confidential') || false;
        if (isConfidential && !value) {
          return 'Industry is required for confidential customers';
        }
        return '';
      }
      case 'projectType':
        return !value ? 'Project type is required' : '';
      case 'designation':
        return !value ? 'Designation is required' : '';
      case 'organizationName':
        return !value ? 'Organization name is required' : '';
      case 'fromDate':
        return !value ? 'From date is required' : '';
      case 'toDate':
        // If isCurrentProject is true, toDate is not required
        if (form.isCurrentProject) {
          return '';
        }
        return !value ? 'To date is required' : '';
      default:
        return '';
    }
  };

  // Display validation (for field error props) - checks touched state
  const getProjectFieldError = (
    formId: string,
    field: keyof Project
  ): string => {
    const form = activeProjectForms.find(f => f.id === formId);
    if (!form) return '';

    // Only show errors for fields that have been touched
    const isTouched = projectTouched[formId]?.[field];
    if (!isTouched) return '';

    return validateProjectField(form, field);
  };

  const getCertificationFieldError = (
    formId: string,
    field: keyof Certification
  ): string => {
    const form = activeCertificationForms.find(f => f.id === formId);
    if (!form) return '';

    const value = extractValue(form[field]);

    // All certification fields are optional, so no errors
    return '';
  };

  // Check if forms have any errors (for disabling Save button)
  const hasEmploymentFormErrors = (formId: string): boolean => {
    const form = activeEmploymentForms.find(f => f.id === formId);
    if (!form) return true; // If form not found, consider it as having errors

    const requiredFields: (keyof Employment)[] = [
      'organizationName',
      'jobType',
      'designation',
      'location',
      'fromDate',
      'toDate',
    ];

    return requiredFields.some(field => {
      const error = validateEmploymentField(form, field);
      return error !== '';
    });
  };

  const hasProjectFormErrors = (formId: string): boolean => {
    const form = activeProjectForms.find(f => f.id === formId);
    if (!form) return true; // If form not found, consider it as having errors

    // If isCurrentProject is true, toDate is not required
    const requiredFields: (keyof Project)[] = form.isCurrentProject
      ? [
        'customerName',
        'projectType',
        'designation',
        'organizationName',
        'fromDate',
      ]
      : [
        'customerName',
        'projectType',
        'designation',
        'organizationName',
        'fromDate',
        'toDate',
      ];

    return requiredFields.some(field => {
      const error = validateProjectField(form, field);
      return error !== '';
    });
  };

  const hasCertificationFormErrors = (formId: string): boolean => {
    // All certification fields are optional
    return false;
  };

  // Replace the current updateEmploymentForm function with this enhanced version
  const updateEmploymentForm = (
    formId: string,
    field: keyof Employment,
    value: string | boolean
  ) => {
    // Mark field as touched when value changes
    markEmploymentFieldTouched(formId, field);

    setActiveEmploymentForms(forms =>
      forms.map(form => {
        if (form.id === formId) {
          const updatedForm = { ...form, [field]: value };

          // If organization name is changed and job type is permanent,
          // automatically update payroll organization
          if (
            field === 'organizationName' &&
            isPermanentJobType(form.jobType)
          ) {
            updatedForm.payrollOrganization = value as string;
          }

          // If job type is changed to permanent, sync payroll with organization
          if (field === 'jobType' && isPermanentJobType(value as string)) {
            updatedForm.payrollOrganization = form.organizationName;
          }

          return updatedForm;
        }
        return form;
      })
    );
  };

  const saveEmployment = (formId: string) => {
    // Prevent double-clicking
    if (isSavingEmployment[formId]) {
      return;
    }

    // Helper to normalize date ranges for overlap checks
    const getRange = (emp: Employment) => {
      // Handle yyyy-mm format for employment dates
      let fromDateStr = emp.fromDate || '';
      let toDateStr = emp.toDate || '';

      if (fromDateStr && fromDateStr.match(/^\d{4}-\d{2}$/)) {
        fromDateStr = `${fromDateStr}-01`;
      }
      if (toDateStr && toDateStr.match(/^\d{4}-\d{2}$/)) {
        toDateStr = `${toDateStr}-01`;
      }

      const start = fromDateStr ? new Date(fromDateStr).getTime() : NaN;
      const end = emp.isCurrentJob
        ? new Date().getTime()
        : toDateStr
          ? new Date(toDateStr).getTime()
          : NaN;
      return { start, end };
    };
    const overlapsWithExistingEmployment = (candidateEmployment: Employment) => {
      const { start, end } = getRange(candidateEmployment);
      if (Number.isNaN(start) || Number.isNaN(end)) return false;

      // Compare against saved history and other active forms (excluding current)
      const otherEmployments: Employment[] = [
        ...employmentHistory,
        ...activeEmploymentForms.filter(emp => emp.id !== formId).map(emp => ({
          ...emp,
          fromDate: extractValue(emp.fromDate),
          toDate: extractValue(emp.toDate),
        })),
      ];

      return otherEmployments.some(other => {
        const { start: otherStart, end: otherEnd } = getRange({
          ...other,
          fromDate: extractValue(other.fromDate),
          toDate: extractValue(other.toDate),
        });

        if (Number.isNaN(otherStart) || Number.isNaN(otherEnd)) return false;

        // Overlap condition: start < otherEnd and end > otherStart
        return start < otherEnd && end > otherStart;
      });
    };

    // Mark all required fields as touched to show validation errors
    const requiredFields: (keyof Employment)[] = [
      'organizationName',
      'jobType',
      'designation',
      'location',
      'fromDate',
      'toDate',
    ];

    requiredFields.forEach(field => {
      markEmploymentFieldTouched(formId, field);
    });

    setIsSavingEmployment(prev => ({ ...prev, [formId]: true }));

    // Use callback to get the most current state
    setActiveEmploymentForms(currentForms => {
      const form = currentForms.find(f => f.id === formId);

      if (form) {
        // Extract values from dropdown objects (IDs)
        const organizationId = extractValue(form.organizationName);
        const designationId = extractValue(form.designation);
        const jobTypeId = extractValue(form.jobType);
        const payrollOrganizationId = extractValue(form.payrollOrganization);
        const locationId = extractValue(form.location);

        // Convert IDs to names/labels by looking up in dropdown options
        const organizationName = convertIdToLabel(
          organizationId,
          employerOptions
        );
        const designationName = convertIdToLabel(
          designationId,
          designationOptions
        );
        const jobTypeName = convertIdToLabel(jobTypeId, jobTypeOptions);
        const payrollOrganizationName = convertIdToLabel(
          payrollOrganizationId,
          employerOptions
        );
        const locationName = convertIdToLabel(locationId, cityOptions);

        if (organizationName && designationName) {
          // Generate a unique ID only once per save operation
          const uniqueId = `employment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const employment: Employment = {
            ...form,
            id: uniqueId,
            organizationName: organizationName, // Store name instead of ID
            designation: designationName, // Store name instead of ID
            jobType: jobTypeName, // Store name instead of ID
            payrollOrganization: payrollOrganizationName, // Store name instead of ID
            location: locationName, // Store name instead of ID
            fromDate: extractValue(form.fromDate),
            toDate: extractValue(form.toDate),
            isCurrentJob: Boolean(form.isCurrentJob),
          };

          // Prevent overlapping date ranges with existing employments
          if (overlapsWithExistingEmployment(employment)) {
            showErrorToast('Employment date range overlaps with another employment. Please adjust the dates.');
            setIsSavingEmployment(prev => {
              const updated = { ...prev };
              delete updated[formId];
              return updated;
            });
            return currentForms;
          }

          // Transform data for API format
          const apiFormattedEmployment = transformEmploymentForAPI(employment);

          // Update employment history - do this in one operation
          // Auto-sort by fromDate (latest first), with isCurrentJob entries last
          const unsortedHistory = [...employmentHistory, employment];
          const sortedHistory = unsortedHistory.sort((a, b) => {
            // Current job entries go to the end
            if (a.isCurrentJob && !b.isCurrentJob) return 1;
            if (!a.isCurrentJob && b.isCurrentJob) return -1;
            if (a.isCurrentJob && b.isCurrentJob) return 0;

            // Sort by fromDate (latest first)
            // Handle yyyy-mm format for employment dates
            let fromDateStrA = a.fromDate || '';
            let fromDateStrB = b.fromDate || '';

            if (fromDateStrA && fromDateStrA.match(/^\d{4}-\d{2}$/)) {
              fromDateStrA = `${fromDateStrA}-01`;
            }
            if (fromDateStrB && fromDateStrB.match(/^\d{4}-\d{2}$/)) {
              fromDateStrB = `${fromDateStrB}-01`;
            }

            const dateA = fromDateStrA ? new Date(fromDateStrA).getTime() : 0;
            const dateB = fromDateStrB ? new Date(fromDateStrB).getTime() : 0;
            return dateB - dateA;
          });
          const updatedHistory = sortedHistory;
          const apiFormattedHistory = sortedHistory.map(transformEmploymentForAPI);

          // Update both states at once
          setEmploymentHistory(updatedHistory);
          onChange('employmentHistory', updatedHistory);
          onChange('employmentHistoryAPI', apiFormattedHistory);

          // Reset saving state and return updated forms with this form removed
          setIsSavingEmployment(prev => {
            const updated = { ...prev };
            delete updated[formId];
            return updated;
          });

          // Filter out the saved form
          let remainingForms = currentForms.filter(f => f.id !== formId);

          // If the saved employment has isCurrentJob = true, reset isCurrentJob in all other active forms
          if (employment.isCurrentJob) {
            remainingForms = remainingForms.map(f => ({
              ...f,
              isCurrentJob: false,
            }));
          }

          return remainingForms;
        } else {
          showWarningToast(
            'Please fill in required fields: Organization Name and Designation'
          );
          setIsSavingEmployment(prev => {
            const updated = { ...prev };
            delete updated[formId];
            return updated;
          });
          return currentForms; // Don't change forms if validation fails
        }
      }

      setIsSavingEmployment(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
      return currentForms; // Don't change forms if form not found
    });
  };
  const removeEmploymentForm = (formId: string) => {
    setActiveEmploymentForms(forms => forms.filter(form => form.id !== formId));
  };

  const editEmployment = (id: string) => {
    const employmentToEdit = employmentHistory.find(emp => emp.id === id);
    if (!employmentToEdit) return;

    // Remove from history
    const updatedHistory = employmentHistory.filter(emp => emp.id !== id);
    setEmploymentHistory(updatedHistory);
    onChange('employmentHistory', updatedHistory);

    // Add to TOP of active forms for editing (not bottom)
    setActiveEmploymentForms(forms => [employmentToEdit, ...forms]);
  };

  const removeEmployment = (id: string) => {
    const updatedHistory = employmentHistory.filter(emp => emp.id !== id);
    setEmploymentHistory(updatedHistory);
    onChange('employmentHistory', updatedHistory);
  };

  // Project functions
  // Project functions
  const addProjectForm = async () => {
    // Prevent double-clicking
    if (isAddingProject) {
      return;
    }

    setIsAddingProject(true);

    try {
      const newForm: Project = {
        id: `temp-project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customerName: '',
        industry: '',
        projectType: '',
        designation: '',
        organizationName: '',
        fromDate: '',
        toDate: '',
        isCurrentProject: false,
      };

      setActiveProjectForms(currentForms => [...currentForms, newForm]);
    } catch (error) {
      console.error('Error in addProjectForm:', error);
    } finally {
      setIsAddingProject(false);
    }
  };

  const removeProjectForm = (formId: string) => {
    setActiveProjectForms(forms => forms.filter(form => form.id !== formId));
  };

  const saveProject = (formId: string) => {
    // Prevent double-clicking
    if (isSavingProject[formId]) {
      return;
    }

    // Mark all required fields as touched to show validation errors
    const requiredFields: (keyof Project)[] = [
      'customerName',
      'projectType',
      'designation',
      'organizationName',
      'fromDate',
      'toDate',
    ];

    requiredFields.forEach(field => {
      markProjectFieldTouched(formId, field);
    });

    setIsSavingProject(prev => ({ ...prev, [formId]: true }));
    const form = activeProjectForms.find(f => f.id === formId);

    if (form) {
      // Extract values from dropdown objects (IDs)
      const customerId = extractValue(form.customerName);
      const designationId = extractValue(form.designation);
      const projectTypeId = extractValue(form.projectType);
      const organizationId = extractValue(form.organizationName);

      // Convert IDs to names/labels by looking up in dropdown options
      const customerName = convertIdToLabel(customerId, customerOptions);
      const designationName = convertIdToLabel(
        designationId,
        designationOptions
      );
      const projectTypeName = convertIdToLabel(
        projectTypeId,
        projectTypeOptions
      );
      const organizationName = convertIdToLabel(
        organizationId,
        getFilteredEmployerOptionsForProjects()
      );

      if (customerName && designationName) {
        // Generate a unique ID only once per save operation
        const uniqueId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const project: Project = {
          ...form,
          id: uniqueId,
          customerName: customerName, // Store name instead of ID
          designation: designationName, // Store name instead of ID
          projectType: projectTypeName, // Store name instead of ID
          organizationName: organizationName, // Store name instead of ID
          fromDate: extractValue(form.fromDate),
          toDate: extractValue(form.toDate),
        };

        // Transform data for API format before sending to backend
        // Auto-sort by fromDate (latest first)
        const unsortedProjects = [...projectsHistory, project];
        const sortedProjects = unsortedProjects.sort((a, b) => {
          // Handle yyyy-mm format for project dates
          let fromDateStrA = a.fromDate || '';
          let fromDateStrB = b.fromDate || '';

          if (fromDateStrA && fromDateStrA.match(/^\d{4}-\d{2}$/)) {
            fromDateStrA = `${fromDateStrA}-01`;
          }
          if (fromDateStrB && fromDateStrB.match(/^\d{4}-\d{2}$/)) {
            fromDateStrB = `${fromDateStrB}-01`;
          }

          const dateA = fromDateStrA ? new Date(fromDateStrA).getTime() : 0;
          const dateB = fromDateStrB ? new Date(fromDateStrB).getTime() : 0;
          return dateB - dateA;
        });
        const updatedProjects = sortedProjects;
        setProjectsHistory(updatedProjects);

        // Send API-formatted data to parent component
        const apiFormattedHistory = sortedProjects.map(transformProjectForAPI);
        onChange('projectHistory', updatedProjects); // Keep original format for UI
        onChange('projectHistoryAPI', apiFormattedHistory); // Send API format for backend

        // Remove this form from active forms and reset saving state
        setActiveProjectForms(forms => {
          const updatedForms = forms.filter(form => form.id !== formId);

          // If the saved project has isCurrentProject = true, reset isCurrentProject in all other active forms
          if (project.isCurrentProject) {
            return updatedForms.map(f => ({
              ...f,
              isCurrentProject: false,
            }));
          }

          return updatedForms;
        });
        setIsSavingProject(prev => {
          const updated = { ...prev };
          delete updated[formId];
          return updated;
        });
      } else {
        showWarningToast(
          'Please fill in required fields: Customer Name and Designation'
        );
        setIsSavingProject(prev => {
          const updated = { ...prev };
          delete updated[formId];
          return updated;
        });
      }
    } else {
      setIsSavingProject(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    }
  };

  // Helper function to check if the selected organization corresponds to a current job
  const isOrganizationCurrentJob = (orgValue: string): boolean => {
    const val = extractValue(orgValue);

    // Find matching employment options to get label if val is ID
    const employerOption = employerOptions.find(
      opt => opt.value === val || opt.id === val || opt.label === val
    );
    const orgLabel = employerOption ? employerOption.label : undefined;

    // Check active forms first
    const activeMatch = activeEmploymentForms.find(emp => {
      const empVal = extractValue(emp.organizationName) || emp.organizationName;
      return (
        empVal === val ||
        emp.organizationName === val ||
        (orgLabel && (empVal === orgLabel || emp.organizationName === orgLabel))
      );
    });

    if (activeMatch) return activeMatch.isCurrentJob;

    // Check saved history
    const savedMatch = employmentHistory.find(emp => {
      const empVal = extractValue(emp.organizationName) || emp.organizationName;
      return (
        empVal === val ||
        emp.organizationName === val ||
        (orgLabel && (empVal === orgLabel || emp.organizationName === orgLabel))
      );
    });

    if (savedMatch) return savedMatch.isCurrentJob;

    return false;
  };

  // Project management - update form
  const updateProjectForm = (
    formId: string,
    field: keyof Project,
    value: string | boolean
  ) => {
    // Mark field as touched when value changes
    if (typeof field === 'string') {
      markProjectFieldTouched(formId, field);
    }

    setActiveProjectForms(forms =>
      forms.map(form => {
        if (form.id === formId) {
          // Logic for when Organization Name changes
          if (field === 'organizationName') {
            const isCurrent = isOrganizationCurrentJob(value as string);
            // If the new organization is NOT a current job, force isCurrentProject to false
            if (!isCurrent) {
              return { ...form, [field]: value as string, isCurrentProject: false };
            }
          }
          return { ...form, [field]: value };
        }
        return form;
      })
    );
  };

  // ... (existing removeProjectForm, editProject etc.)

  // JSX Changes below (targeting line 2913 approx)
  // ...


  const editProject = (id: string) => {
    const projectToEdit = projectsHistory.find(proj => proj.id === id);
    if (!projectToEdit) return;

    // Remove from history
    const updatedProjects = projectsHistory.filter(proj => proj.id !== id);
    setProjectsHistory(updatedProjects);
    onChange('projectHistory', updatedProjects);

    // Add to TOP of active forms for editing (not bottom)
    setActiveProjectForms(forms => [projectToEdit, ...forms]);
  };

  const removeProject = (id: string) => {
    const updatedProjects = projectsHistory.filter(proj => proj.id !== id);
    setProjectsHistory(updatedProjects);
    onChange('projectHistory', updatedProjects);
  };

  // Certification functions
  const addCertificationForm = async () => {
    // Prevent double-clicking
    if (isAddingCertification) {
      return;
    }

    setIsAddingCertification(true);

    try {
      const newForm: Certification = {
        id: `temp-certification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        certificationName: '',
        institutionName: '',
        certificationNo: '',
        certificationDate: '',
        validUntil: '',
      };

      setActiveCertificationForms(currentForms => [...currentForms, newForm]);
    } catch (error) {
      console.error('Error in addCertificationForm:', error);
    } finally {
      setIsAddingCertification(false);
    }
  };

  const updateCertificationForm = (
    formId: string,
    field: keyof Certification,
    value: string
  ) => {
    // Mark field as touched when value changes
    markCertificationFieldTouched(formId, field);

    setActiveCertificationForms(forms =>
      forms.map(form =>
        form.id === formId ? { ...form, [field]: value } : form
      )
    );
  };

  const saveCertification = (formId: string) => {
    // Prevent double-clicking
    if (isSavingCertification[formId]) {
      return;
    }

    setIsSavingCertification(prev => ({ ...prev, [formId]: true }));
    const form = activeCertificationForms.find(f => f.id === formId);

    if (form) {
      // Extract values from dropdown objects (IDs)
      const certificationNameId = extractValue(form.certificationName);
      const institutionId = extractValue(form.institutionName);

      // Convert IDs to names/labels by looking up in dropdown options
      // Note: certificationName might be free text, so keep original if no match
      const certificationName = certificationNameId;
      const institutionName = convertIdToLabel(
        institutionId,
        institutionOptions
      );

      if (certificationName) {
        // Generate a unique ID only once per save operation
        const uniqueId = `certification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const certification: Certification = {
          ...form,
          id: uniqueId,
          certificationName: certificationName, // Already text or converted
          institutionName: institutionName, // Store name instead of ID
          certificationNo: extractValue(form.certificationNo),
          certificationDate: extractValue(form.certificationDate),
          validUntil: extractValue(form.validUntil),
        };

        // Transform data for API format before sending to backend
        // Auto-sort by certificationDate (latest first)
        const unsortedCerts = [...certificationHistory, certification];
        const sortedCerts = unsortedCerts.sort((a, b) => {
          const dateA = a.certificationDate ? new Date(a.certificationDate).getTime() : 0;
          const dateB = b.certificationDate ? new Date(b.certificationDate).getTime() : 0;
          return dateB - dateA;
        });
        const updatedCerts = sortedCerts;
        setCertificationHistory(updatedCerts);

        // Send API-formatted data to parent component
        const apiFormattedHistory = sortedCerts.map(transformCertificationForAPI);
        onChange('certifications', updatedCerts); // Keep original format for UI
        onChange('certificationsAPI', apiFormattedHistory); // Send API format for backend

        // Remove this form from active forms and reset saving state
        setActiveCertificationForms(forms => {
          const updatedForms = forms.filter(form => form.id !== formId);
          return updatedForms;
        });

        setIsSavingCertification(prev => {
          const updated = { ...prev };
          delete updated[formId];
          return updated;
        });
      } else {
        showWarningToast('Please fill in required field: Certification Name');
        setIsSavingCertification(prev => {
          const updated = { ...prev };
          delete updated[formId];
          return updated;
        });
      }
    } else {
      setIsSavingCertification(prev => {
        const updated = { ...prev };
        delete updated[formId];
        return updated;
      });
    }
  };

  const removeCertificationForm = (formId: string) => {
    setActiveCertificationForms(forms =>
      forms.filter(form => form.id !== formId)
    );
  };

  const removeCertification = (id: string) => {
    const updatedCerts = certificationHistory.filter(cert => cert.id !== id);
    setCertificationHistory(updatedCerts);
    onChange('certifications', updatedCerts);
  };

  // Configure tab-based auto-save system
  const tabConfigs = {
    employment: {
      forms: activeEmploymentForms,
      saveFunction: saveEmployment,
      validateFunction: (form: any): boolean => {
        const hasOrgName = extractValue(form.organizationName);
        const hasDesignation = extractValue(form.designation);
        return Boolean(hasOrgName && hasDesignation);
      },
      tabName: 'Employment',
    },
    projects: {
      forms: activeProjectForms,
      saveFunction: saveProject,
      validateFunction: (form: any): boolean => {
        const hasCustomer = extractValue(form.customerName);
        const hasDesignation = extractValue(form.designation);
        return Boolean(hasCustomer && hasDesignation);
      },
      tabName: 'Projects',
    },
    certifications: {
      forms: activeCertificationForms,
      saveFunction: saveCertification,
      validateFunction: (form: any): boolean => {
        const hasCertName = extractValue(form.certificationName);
        return Boolean(hasCertName);
      },
      tabName: 'Certifications',
    },
  };

  const { autoSaveTabForms, autoSaveAllForms } = useTabBasedAutoSave(
    activeTab,
    tabConfigs
  );

  // Report navigation state to FormWizardLayout
  const handleNavigationNext = useCallback(() => {
    if (activeTab === 'employment') {
      // Check if there are any active employment forms with incomplete data
      const incompleteFormsCount = activeEmploymentForms.filter(form => {
        // Only check forms that have some data entered (not empty forms)
        const hasAnyData = extractValue(form.organizationName) || extractValue(form.designation) || extractValue(form.location);
        if (!hasAnyData) return false; // Skip empty forms
        return !isEmploymentComplete(form);
      }).length;

      if (incompleteFormsCount > 0) {
        // Mark all fields as touched to show validation errors
        activeEmploymentForms.forEach(form => {
          const missingFields = getMissingEmploymentFields(form);
          missingFields.forEach(field => {
            markEmploymentFieldTouched(form.id, field);
          });
        });
        showWarningToast(
          `Please complete all required fields (including location) for ${incompleteFormsCount} employment ${incompleteFormsCount === 1 ? 'entry' : 'entries'} before proceeding`
        );
        return false; // Block navigation
      }

      // Auto-save any filled employment forms before switching to projects tab
      activeEmploymentForms.forEach(form => {
        const hasRequiredData =
          extractValue(form.organizationName) && extractValue(form.designation);
        if (hasRequiredData) {
          saveEmployment(form.id);
        }
      });
      setActiveTab('projects');
      return false; // Don't proceed to next step yet, just switch tabs
    } else if (activeTab === 'projects') {
      // Auto-save any filled project forms before switching to certifications tab
      activeProjectForms.forEach(form => {
        const hasRequiredData =
          extractValue(form.customerName) && extractValue(form.designation);
        if (hasRequiredData) {
          saveProject(form.id);
        }
      });
      setActiveTab('certifications');
      return false; // Don't proceed to next step yet, just switch tabs
    } else if (activeTab === 'certifications') {
      // Auto-save any filled certification forms before proceeding to next step
      activeCertificationForms.forEach(form => {
        const hasRequiredData = extractValue(form.certificationName);
        if (hasRequiredData) {
          saveCertification(form.id);
        }
      });
      return true; // Proceed to next step
    }
    return true;
  }, [
    activeTab,
    activeEmploymentForms,
    activeProjectForms,
    activeCertificationForms,
  ]);

  const handleNavigationPrevious = useCallback(() => {
    if (activeTab === 'certifications') {
      setActiveTab('projects');
      return false; // Don't go to previous step yet
    } else if (activeTab === 'projects') {
      setActiveTab('employment');
      return false; // Don't go to previous step yet
    } else if (activeTab === 'employment') {
      return true; // Go to previous step
    }
    return true;
  }, [activeTab]);

  useEffect(() => {
    if (onChange) {
      const navigationData = {
        activeTab: activeTab,
        handleNext: handleNavigationNext,
        handlePrevious: handleNavigationPrevious,
      };

      onChange('_employmentProjectsTabNavigation', navigationData);
    }
  }, [activeTab, handleNavigationNext, handleNavigationPrevious]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Employment & Projects
        </h2>
        <p className="text-gray-600 mt-1">
          Add your work experience and project details from earliest to latest.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="underline"
        size="md"
      />

      {/* Employment Tab */}
      {activeTab === 'employment' && (
        <div className="space-y-6">
          {/* Employment History Table */}
          {employmentHistory.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payroll Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employmentHistory.map(employment => (
                    <tr key={employment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.organizationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.jobType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.payrollOrganization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.fromDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employment.toDate || 'Present'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editEmployment(employment.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Icon name="edit" className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmployment(employment.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Icon name="trash" className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeEmploymentForms.length === 0 ? (
            <div className="p-6 border border-dashed rounded-md bg-gray-50">
              <Icon
                name="briefcase"
                className="h-10 w-10 text-gray-400 mx-auto mb-2"
              />
              <h3 className="text-lg font-medium text-gray-600 mb-1">
                No Employment History
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add employment details to track the candidate's work experience
              </p>
            </div>
          ) : null}

          {/* Multiple Active Employment Forms */}
          {activeEmploymentForms.map((form, index) => {

            return (
              <div
                key={form.id}
                id={`add-employment-form-${form.id}`}
              className={`border rounded-md p-4 bg-gray-50 `}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-medium">
                      {employmentHistory.length === 0 && index === 0
                        ? 'Add Your First Employment'
                          : 'Add Employment'}
                    </h3>
                  </div>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmploymentForm(form.id)}
                    >
                      <Icon name="close" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Organization Name */}
                  <div className="col-span-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="space-y-1">
                          <SearchDropdown
                            label="Organization Name"
                            value={getEmployerOptionFromValue(form.organizationName)?.value || ''}
                            onChange={(option: any) =>
                              updateEmploymentForm(
                                form.id,
                                'organizationName',
                                option?.value || ''
                              )
                            }
                            onInputChange={searchEmployer}
                            options={employerOptions}
                            loading={employerLoading}
                            placeholder="Search and select organization..."
                            required
                            showAddButton={true}
                            dropdownType="Employer"
                            dropdownLabel="Organization"
                            onOptionAdded={(newOption: any) => {
                              // Refresh employer options
                              searchEmployer('');
                            }}
                            error={getEmploymentFieldError(
                              form.id,
                              'organizationName'
                            )}
                          />
                          {employerError && (
                            <p className="text-sm text-red-600">
                              {employerError}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* <Button
                      variant="outline"
                      size="sm"
                      iconOnly
                      icon="plus"
                      onClick={() =>
                        openModal(
                          'organization',
                          'Add New Organization',
                          'Enter organization name'
                        )
                      }
                      title="Add new organization"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
                    /> */}
                    </div>
                  </div>

                  {/* Job Type */}
                  <div className="col-span-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="space-y-1">
                          <SearchDropdown
                            label="Job Type"
                            value={form.jobType || ''} // Use the stored label directly as the value
                            onChange={(option: any) =>
                              updateEmploymentForm(
                                form.id,
                                'jobType',
                                option?.label || ''
                              )
                            }
                            onInputChange={searchJobType}
                            // Map options to use label as value to avoid ID collision
                            options={jobTypeOptions
                              .filter(option => option.label !== 'Any')
                              .map(opt => ({ ...opt, value: opt.label }))}
                            loading={jobTypeLoading}
                            placeholder="Search and select job type..."
                            required
                            // showAddButton={true}
                            // dropdownType="Job_Type"
                            // dropdownLabel="Job Type"
                            onOptionAdded={(newOption: any) => {
                              // Refresh job type options
                              searchJobType('');
                            }}
                            error={getEmploymentFieldError(form.id, 'jobType')}
                          />
                          {jobTypeError && (
                            <p className="text-sm text-red-600">{jobTypeError}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payroll Organization */}
                  {/* Payroll Organization */}
                  <div className="col-span-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="space-y-1">
                          <SearchDropdown
                            label="Payroll Organization"
                            value={getEmployerOptionFromValue(form.payrollOrganization)?.value || ''}
                            onChange={(option: any) =>
                              updateEmploymentForm(
                                form.id,
                                'payrollOrganization',
                                option?.value || ''
                              )
                            }
                            onInputChange={searchEmployer}
                            options={employerOptions}
                            loading={employerLoading}
                            placeholder="Search payroll organization"
                            disabled={isPermanentJobType(form.jobType)} // Disable for permanent jobs (FTE)
                            showAddButton={true}
                            dropdownType="Employer"
                            dropdownLabel="Payroll Organization"
                            onOptionAdded={(newOption: any) => {
                              // Refresh employer options
                              searchEmployer('');
                            }}
                          />
                          {employerError && (
                            <p className="text-sm text-red-600">
                              {employerError}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* {!isPermanentJobType(form.jobType) && ( // Only show add button for non-permanent jobs
                      <Button
                        variant="outline"
                        size="sm"
                        iconOnly
                        icon="plus"
                        onClick={() =>
                          openModal(
                            'payrollOrganization',
                            'Add New Payroll Organization',
                            'Enter payroll organization name'
                          )
                        }
                        title="Add new payroll organization"
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
                      />
                    )} */}
                    </div>
                    {isPermanentJobType(form.jobType) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Payroll organization is automatically set to match
                        organization name for permanent employees
                      </p>
                    )}
                  </div>

                  {/* Designation */}
                  <div className="col-span-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="space-y-1">
                          <SearchDropdown
                            label="Designation"
                            value={getDesignationOptionFromValue(form.designation)?.value || ''}
                            onChange={(option: any) =>
                              updateEmploymentForm(
                                form.id,
                                'designation',
                                option?.label || ''
                              )
                            }
                            onInputChange={searchDesignation}
                            options={designationOptions}
                            loading={designationLoading}
                            placeholder="Search and select designation..."
                            required
                            showAddButton={true}
                            dropdownType="Designation"
                            dropdownLabel="Designation"
                            onOptionAdded={(newOption: any) => {
                              // Refresh designation options
                              searchDesignation('');
                            }}
                            error={getEmploymentFieldError(
                              form.id,
                              'designation'
                            )}
                          />
                          {designationError && (
                            <p className="text-sm text-red-600">
                              {designationError}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* <Button
                      variant="outline"
                      size="sm"
                      iconOnly
                      icon="plus"
                      onClick={() =>
                        openModal(
                          'designation',
                          'Add New Designation',
                          'Enter designation/job title'
                        )
                      }
                      title="Add new designation"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-300 hover:border-blue-400 shadow-sm mt-6"
                    /> */}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="col-span-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="space-y-1">
                          {/* <label className="block text-sm font-medium text-gray-700">
                            Location <span className="text-red-500">*</span>
                          </label> */}
                          {/* City dropdown using countriesnow.space API */}
                          {/* City dropdown using countriesnow.space API */}
                          <SearchDropdown
                            value={form.location || ''}
                            onChange={(option: any) =>
                              updateEmploymentForm(
                                form.id,
                                'location',
                                option?.value || ''
                              )
                            }
                            onInputChange={searchCity}
                            options={cityOptions}
                            loading={cityLoading}
                            placeholder="Search work location..."
                            isClearable={true}
                            disabled={false}
                            // size="md" - SearchDropdown doesn't support size prop
                            showAddButton={false}
                            dropdownType="Location"
                            dropdownLabel="Location"
                            // error handling for SearchDropdown:
                            error={
                              getEmploymentFieldError(form.id, 'location') ||
                              cityError ||
                              undefined
                            }
                            onMenuScrollToBottom={() => {
                              if (hasMoreCity) loadMoreCity();
                            }}
                            label="Location"
                            required
                          />
                          {/* No locationError, cityError is shown in AsyncSelect */}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* From Date */}
                  <div className="col-span-1">
                    <DateInput
                      label="From Date"
                      mode="month"
                      value={form.fromDate}
                      onChange={(value: string) => {
                        // Cap From Date to either To Date (if set and not current job) or current month
                        const currentMonth = new Date().toISOString().substring(0, 7);
                        const toMonth = !form.isCurrentJob && form.toDate
                          ? (form.toDate.length === 7 ? form.toDate : form.toDate.substring(0, 7))
                          : undefined;
                        const maxMonth = toMonth || currentMonth;
                        let v = value;
                        if (maxMonth && v > maxMonth) v = maxMonth;
                        updateEmploymentForm(form.id, 'fromDate', v);
                        // If To Date exists and becomes < From after change, align To Date to From
                        if (!form.isCurrentJob && form.toDate && v && form.toDate < v) {
                          updateEmploymentForm(form.id, 'toDate', v);
                        }
                      }}
                      // Max should be To Date when set, otherwise current month
                      max={!form.isCurrentJob && form.toDate ? (form.toDate.length === 7 ? form.toDate : form.toDate.substring(0, 7)) : new Date().toISOString().substring(0, 7)}
                      placeholder="Select start date"
                      required
                      error={getEmploymentFieldError(form.id, 'fromDate')}
                    />
                  </div>

                  {/* To Date */}
                  {!form.isCurrentJob && (
                    <div className="col-span-1">
                      <DateInput
                        label="To Date"
                        mode="month"
                        value={form.toDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(value: string) => {
                          const minDate = form.fromDate;
                          let v = value;
                          if (minDate && v < minDate) v = minDate;
                          updateEmploymentForm(form.id, 'toDate', v);
                        }}
                        min={form.fromDate}
                        placeholder="Select end date"
                        required
                        error={getEmploymentFieldError(form.id, 'toDate')}
                      />
                    </div>
                  )}

                  {/* Current Job Checkbox - Only show if no saved employment record has isCurrentJob = true */}
                  {!hasActiveCurrentJob() && (
                    <div className="col-span-1">
                      <div className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          id={`current-job-${form.id}`}
                          checked={form.isCurrentJob}
                          onChange={e => {
                            updateEmploymentForm(
                              form.id,
                              'isCurrentJob',
                              e.target.checked
                            );
                            if (e.target.checked) {
                              updateEmploymentForm(form.id, 'toDate', '');
                            }
                          }}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`current-job-${form.id}`}
                          className="text-sm ml-2"
                        >
                          Current Job
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="primary"
                    onClick={() => saveEmployment(form.id)}
                    disabled={
                      isSavingEmployment[form.id] ||
                      hasEmploymentFormErrors(form.id)
                    }
                  >
                    {isSavingEmployment[form.id] ? (
                      <>
                        <Icon
                          name="loading"
                          className="mr-2 h-4 w-4 animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Icon name="check" className="mr-2 h-4 w-4" />
                        Save Employment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Show Add Employment button only when no active forms */}
          {activeEmploymentForms.length === 0 && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={addEmploymentForm}
                disabled={isAddingEmployment}
              >
                {isAddingEmployment ? (
                  <>
                    <Icon
                      name="loading"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="mr-2 h-4 w-4" />
                    Add Employment
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Projects History Table */}
          {projectsHistory.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Industry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {projectsHistory.map(project => (
                    <tr key={project.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.industry || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.projectType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.organizationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.fromDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {project.toDate || 'Present'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editProject(project.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Icon name="edit" className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProject(project.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Icon name="trash" className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeProjectForms.length === 0 ? (
            <div className=" p-6 border border-dashed rounded-md bg-gray-50">
              <Icon
                name="file-text"
                className="h-10 w-10 text-gray-400 mx-auto mb-2"
              />
              <h3 className="text-lg font-medium text-gray-600 mb-1">
                No Projects History
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add project details to showcase the candidate's experience
              </p>
            </div>
          ) : null}

          {/* Multiple Active Project Forms */}
          {activeProjectForms.map((form, index) => (
            <div
              key={form.id}
              id={`add-project-form-${form.id}`}
              className="border rounded-md p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium">
                  {projectsHistory.length === 0 && index === 0
                    ? 'Add Your First Project'
                    : 'Add Project'}
                </h3>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProjectForm(form.id)}
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Customer Name */}
                <div className="col-span-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="space-y-1">
                        <SearchDropdown
                          label="Customer Name"
                          value={getCustomerOptionFromValue(form.customerName)?.value || ''}
                          onChange={(option: any) =>
                            updateProjectForm(
                              form.id,
                              'customerName',
                              option?.value || ''
                            )
                          }
                          onInputChange={searchCustomer}
                          options={customerOptions}
                          loading={customerLoading}
                          placeholder="Search and select customer..."
                          required
                          showAddButton={true}
                          dropdownType="Customer"
                          dropdownLabel="Customer Name"
                          onOptionAdded={(newOption: any) => {
                            // Refresh customer options
                            searchCustomer('');
                          }}
                          error={getProjectFieldError(form.id, 'customerName')}
                        />
                        {customerError && (
                          <p className="text-sm text-red-600">
                            {customerError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Industry */}
                <div className="col-span-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="space-y-1">
                        {(() => {
                          // Check if customer name is "Confidential" (case-insensitive)
                          const customerOption = getCustomerOptionFromValue(form.customerName);
                          const isConfidential = customerOption?.label?.toLowerCase().includes('confidential') || false;

                          return (
                            <SearchDropdown
                              label="Industry"
                              value={getIndustryOptionFromValue(form.industry)?.value || ''}
                              onChange={(option: any) =>
                                updateProjectForm(
                                  form.id,
                                  'industry',
                                  option?.label || ''
                                )
                              }
                              onInputChange={searchIndustry}
                              options={industryOptions}
                              loading={industryLoading}
                              placeholder="Search and select industry..."
                              required={isConfidential}
                              disabled={!isConfidential}
                              showAddButton={true}
                              dropdownType="Industry"
                              dropdownLabel="Industry"
                              onOptionAdded={(newOption: any) => {
                                // Refresh industry options
                                searchIndustry('');
                              }}
                              error={getProjectFieldError(form.id, 'industry')}
                            />
                          );
                        })()}
                        {industryError && (
                          <p className="text-sm text-red-600">
                            {industryError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Type */}
                <div className="col-span-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="space-y-1">
                        <SearchDropdown
                          label="Project Type"
                          value={getProjectTypeOptionFromValue(form.projectType)?.value || ''}
                          onChange={(option: any) =>
                            updateProjectForm(
                              form.id,
                              'projectType',
                              option?.value || ''
                            )
                          }
                          onInputChange={searchProjectType}
                          options={projectTypeOptions}
                          loading={projectTypeLoading}
                          placeholder="Search and select project type..."
                          required
                          // showAddButton={true}
                          // dropdownType="ProjectType"
                          // dropdownLabel="Project Type"
                          onOptionAdded={(newOption: any) => {
                            // Refresh project type options
                            searchProjectType('');
                          }}
                          error={getProjectFieldError(form.id, 'projectType')}
                        />
                        {projectTypeError && (
                          <p className="text-sm text-red-600">
                            {projectTypeError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Designation */}
                <div className="col-span-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="space-y-1">
                        <SearchDropdown
                          label="Designation"
                          value={getDesignationOptionFromValue(form.designation)?.value || ''}
                          onChange={(option: any) =>
                            updateProjectForm(
                              form.id,
                              'designation',
                              option?.label || ''
                            )
                          }
                          onInputChange={searchDesignation}
                          options={designationOptions}
                          loading={designationLoading}
                          placeholder="Search role in project..."
                          required
                          showAddButton={true}
                          dropdownType="Designation"
                          dropdownLabel="Designation"
                          onOptionAdded={(newOption: any) => {
                            // Refresh designation options
                            searchDesignation('');
                          }}
                          error={getProjectFieldError(form.id, 'designation')}
                        />
                        {designationError && (
                          <p className="text-sm text-red-600">
                            {designationError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization Name */}
                {/* Organization Name - Filtered to only show employment organizations */}
                <div className="col-span-1">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="space-y-1">
                        <SearchDropdown
                          label="Organization Name"
                          value={getEmployerOptionFromValue(form.organizationName)?.value || ''}
                          onChange={(option: any) => {
                            const orgValue = option?.value || '';
                            updateProjectForm(
                              form.id,
                              'organizationName',
                              orgValue
                            );
                          }}
                          onInputChange={searchEmployer}
                          options={getFilteredEmployerOptionsForProjects()} // Use filtered options
                          loading={employerLoading}
                          placeholder="Select from employment organizations"
                          required
                          // showAddButton={
                          //   getFilteredEmployerOptionsForProjects().length > 0
                          // } // Only show if there are employment orgs
                          // dropdownType="Employer"
                          // dropdownLabel="Organization"
                          onOptionAdded={(newOption: any) => {
                            // Refresh employer options
                            searchEmployer('');
                          }}
                          error={getProjectFieldError(
                            form.id,
                            'organizationName'
                          )}
                        />
                        {employerError && (
                          <p className="text-sm text-red-600">
                            {employerError}
                          </p>
                        )}
                        {getFilteredEmployerOptionsForProjects().length ===
                          0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Add organizations in Employment tab first to see
                              them here
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* From Date */}
                <div className="col-span-1">
                  {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Date <span className="text-red-500">*</span>
                  </label> */}
                  {(() => {
                    const bounds = getEmploymentDateBoundsForOrg(
                      form.organizationName
                    );
                    // If employment bounds exist, use them to restrict project dates
                    // Convert bounds to yyyy-mm format for month input
                    let minDate = bounds.from || undefined;
                    let maxDate = bounds.to || new Date().toISOString().split('T')[0];

                    // Convert to yyyy-mm format if in yyyy-mm-dd format
                    if (minDate && minDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      minDate = minDate.substring(0, 7);
                    }
                    if (maxDate && maxDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      maxDate = maxDate.substring(0, 7);
                    }
                    return (
                      <DateInput
                        label="From Date"
                        mode="month"
                        value={form.fromDate}
                        onChange={(value: string) => {
                          let v = value;
                          if (minDate && v < minDate) v = minDate;
                          if (maxDate && v > maxDate) v = maxDate;
                          updateProjectForm(form.id, 'fromDate', v);
                        }}
                        min={minDate}
                        max={maxDate}
                        placeholder="Select start date"
                        required
                        error={getProjectFieldError(form.id, 'fromDate')}
                      />
                    );
                  })()}
                </div>

                {/* To Date */}
                <div className="col-span-1">
                  {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Date <span className="text-red-500">*</span>
                  </label> */}
                  {(() => {
                    // Calculate minDate as the day after fromDate
                    let minDate: string | undefined = undefined;
                    if (form.fromDate) {
                      const fromDateObj = new Date(form.fromDate);
                      fromDateObj.setDate(fromDateObj.getDate() + 1);
                      minDate = fromDateObj.toISOString().split('T')[0];
                    }

                    const bounds = getEmploymentDateBoundsForOrg(
                      form.organizationName
                    );

                    // Use the later of the two dates as minDate
                    if (bounds.from && (!minDate || bounds.from > minDate)) {
                      minDate = bounds.from;
                    }

                    let maxDate = bounds.to || new Date().toISOString().split('T')[0];

                    // Convert to yyyy-mm format if in yyyy-mm-dd format
                    if (minDate && minDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      minDate = minDate.substring(0, 7);
                    }
                    if (maxDate && maxDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                      maxDate = maxDate.substring(0, 7);
                    }
                    return (
                      <DateInput
                        label="To Date"
                        mode="month"
                        value={form.toDate}
                        onChange={(value: string) => {
                          let v = value;
                          if (minDate && v < minDate) v = minDate;
                          if (maxDate && v > maxDate) v = maxDate;
                          updateProjectForm(form.id, 'toDate', v);
                        }}
                        min={minDate}
                        max={maxDate}
                        placeholder="Select end date"
                        required
                        error={getProjectFieldError(form.id, 'toDate')}
                      />
                    );
                  })()}
                </div>
                {/* Current Project Checkbox - Only show if no saved project record has isCurrentProject = true AND selected org is a current job */}
                {!hasActiveCurrentProject() && isOrganizationCurrentJob(form.organizationName) && (
                  <div className="col-span-1">
                    <div className="flex items-center mt-6">
                      <input
                        type="checkbox"
                        id={`current-project-${form.id}`}
                        checked={form.isCurrentProject}
                        onChange={e =>
                          updateProjectForm(
                            form.id,
                            'isCurrentProject',
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`current-project-${form.id}`}
                        className="text-sm ml-2"
                      >
                        Current Project
                      </label>
                    </div>
                  </div>
                )}              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => saveProject(form.id)}
                  disabled={
                    isSavingProject[form.id] || hasProjectFormErrors(form.id)
                  }
                >
                  {isSavingProject[form.id] ? (
                    <>
                      <Icon
                        name="loading"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="mr-2 h-4 w-4" />
                      Save Project
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Show Add Project button only when no active forms */}
          {activeProjectForms.length === 0 && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={addProjectForm}
                disabled={isAddingProject}
              >
                {isAddingProject ? (
                  <>
                    <Icon
                      name="loading"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="mr-2 h-4 w-4" />
                    Add Project
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          {/* Certifications Table */}
          {certificationHistory.length > 0 ? (
            <div className="border rounded-md overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certification Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Institution Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certification No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certification Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valid Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificationHistory.map(certification => (
                    <tr key={certification.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certification.certificationName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certification.institutionName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certification.certificationNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certification.certificationDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {certification.validUntil}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertification(certification.id)}
                        >
                          <Icon name="close" className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeCertificationForms.length === 0 ? (
            <div className="p-6 border border-dashed rounded-md bg-gray-50">
              <Icon
                name="award"
                className="h-10 w-10 text-gray-400 mx-auto mb-2"
              />
              <h3 className="text-lg font-medium text-gray-600 mb-1">
                No Certifications Added
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add certifications to highlight the candidate's qualifications
              </p>
            </div>
          ) : null}

          {/* Multiple Active Certification Forms */}
          {activeCertificationForms.map((form, index) => (
            <div
              key={form.id}
              id={`add-certification-form-${form.id}`}
              className="border rounded-md p-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium">
                  {certificationHistory.length === 0 && index === 0
                    ? 'Add Your First Certification'
                    : 'Add Certification'}
                </h3>
                {index > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCertificationForm(form.id)}
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {/* First Row: Certification Name and Institution Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certification Name */}
                  <EnhancedInputField
                    label="Certification Name"
                    value={form.certificationName}
                    onChange={(value: string) =>
                      updateCertificationForm(
                        form.id,
                        'certificationName',
                        value
                      )
                    }
                    placeholder="Enter certification name"
                    gridCols="col-span-1"
                  />

                  {/* Institution Name with Dropdown */}
                  <div className="col-span-1">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="space-y-1">
                          <SearchDropdown
                            label="Institution Name"
                            value={getInstitutionOptionFromValue(form.institutionName)?.value || ''}
                            onChange={(option: any) =>
                              updateCertificationForm(
                                form.id,
                                'institutionName',
                                option?.value || ''
                              )
                            }
                            onInputChange={searchInstitution}
                            options={institutionOptions}
                            loading={institutionLoading}
                            placeholder="Search and select institution..."
                            showAddButton={true}
                            dropdownType="Institution"
                            dropdownLabel="Institution"
                            onOptionAdded={(newOption: any) => {
                              // Refresh institution options
                              searchInstitution('');
                            }}
                            error={institutionError}
                          />
                          {institutionError && (
                            <p className="text-sm text-red-600">
                              {institutionError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Second Row: Certification No (single field) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certification No */}
                  <EnhancedInputField
                    label="Certification No"
                    value={form.certificationNo}
                    onChange={(value: string) =>
                      updateCertificationForm(form.id, 'certificationNo', value)
                    }
                    placeholder="Certificate ID/Number"
                    gridCols="col-span-1"
                  />
                </div>

                {/* Third Row: Certification Date and Valid Until */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Certification Date */}
                  {FormUtils.createTextField(
                    'Certification Date',
                    form.certificationDate,
                    value =>
                      updateCertificationForm(
                        form.id,
                        'certificationDate',
                        value
                      ),
                    {
                      type: 'date',
                      max: new Date().toISOString().split('T')[0], // Certification date is in the past
                    }
                  )}

                  {/* Valid Until */}
                  {FormUtils.createTextField(
                    'Valid Until',
                    form.validUntil,
                    value =>
                      updateCertificationForm(form.id, 'validUntil', value),
                    {
                      type: 'date',
                      min: form.certificationDate, // ← Use certification date as the minimum
                    }
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => saveCertification(form.id)}
                  disabled={
                    isSavingCertification[form.id] ||
                    hasCertificationFormErrors(form.id)
                  }
                >
                  {isSavingCertification[form.id] ? (
                    <>
                      <Icon
                        name="loading"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Icon name="check" className="mr-2 h-4 w-4" />
                      Save Certification
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Show Add Certification button only when no active forms */}
          {activeCertificationForms.length === 0 && (
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={addCertificationForm}
                disabled={isAddingCertification}
              >
                {isAddingCertification ? (
                  <>
                    <Icon
                      name="loading"
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                    Adding...
                  </>
                ) : (
                  <>
                    <Icon name="plus" className="mr-2 h-4 w-4" />
                    Add Certification
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal for adding new options */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleModalSubmit}>
              Add
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {modalState.title}
            </label>
            <input
              type="text"
              value={modalState.value}
              onChange={e =>
                setModalState(prev => ({ ...prev, value: e.target.value }))
              }
              placeholder={modalState.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmploymentProjectsStep;
