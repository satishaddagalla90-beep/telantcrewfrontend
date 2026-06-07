import React, { useEffect, useState } from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';
import Checkbox from '../../atoms/Checkbox';
import Icon from '../../atoms/Icon';
import { FormField } from '../../atoms/FormField';
import { useClientsDropdown } from '../../../hooks/useClients';
import { useCountriesNowCitiesDropdown } from '../../../hooks/useCitiesDropdown';
import { BooleanSearchInput } from '../../molecules/BooleanSearchInput';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import { useDropdownData, useDesignationsDropdown } from '../../../hooks/useDropdowns';

export interface CandidateSearchFilters {
  booleanQuery?: string;
  booleanSearchEnabled: boolean;
  searchScope?: string;
  clientId?: string;
  minExperience?: number;
  maxExperience?: number;
  minSalary?: number;
  maxSalary?: number;
  currentLocation?: string;
  preferredLocations: string[];
  education: string[];
  noticePeriod: string[];
  currentDesignation?: string;
  preferredJob?: string;
  jobType: string[];
  jobOpenType?: string;
  gender?: string;
  personWithDisability: boolean;
  modifiedIn?: string;
  createdIn?: string;
}

interface CandidateSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: CandidateSearchFilters) => void;
  initialFilters?: CandidateSearchFilters;
}

// Date pickers for Modified Within and Created Within

const CandidateSearchModal: React.FC<CandidateSearchModalProps> = ({
  isOpen,
  onClose,
  onSearch,
  initialFilters,
}) => {
  const {
    options: clientOptions,
    loading: clientsLoading,
    search: searchClients,
  } = useClientsDropdown();
  const {
    options: locationOptions,
    loading: locationsLoading,
    search: searchLocations,
    loadMore: loadMoreLocations,
    hasMore: hasMoreLocations,
  } = useCountriesNowCitiesDropdown();
  const { 
    options: designationOptions, 
    loading: designationLoading, 
    error: designationError, 
    search: searchDesignations 
  } = useDesignationsDropdown();

  // Form state
  const [booleanQuery, setBooleanQuery] = useState('');
  const [booleanSearchEnabled, setBooleanSearchEnabled] = useState(true);
  const [searchScope, setSearchScope] = useState('entire');
  const [clientId, setClientId] = useState<string>('');
  const [minExperience, setMinExperience] = useState<string>('');
  const [maxExperience, setMaxExperience] = useState<string>('');
  const [minSalary, setMinSalary] = useState<string>('');
  const [maxSalary, setMaxSalary] = useState<string>('');
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);
  const [noticePeriod, setNoticePeriod] = useState<string[]>([]);
  const [currentDesignation, setCurrentDesignation] = useState<string>('');
  const [preferredJob, setPreferredJob] = useState<string>('');
  const [jobType, setJobType] = useState<string>('');
  const [jobOpenType, setJobOpenType] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [personWithDisability, setPersonWithDisability] = useState(false);
  const [modifiedIn, setModifiedIn] = useState<string>('');
  const [createdIn, setCreatedIn] = useState<string>('');

  // Prefill form when opened with provided filters
  useEffect(() => {
    if (!isOpen || !initialFilters) return;
    setBooleanQuery(initialFilters.booleanQuery || '');
    setBooleanSearchEnabled(initialFilters.booleanSearchEnabled ?? true);
    setSearchScope(initialFilters.searchScope || 'entire');
    setClientId(initialFilters.clientId || '');
    setMinExperience(initialFilters.minExperience !== undefined ? String(initialFilters.minExperience) : '');
    setMaxExperience(initialFilters.maxExperience !== undefined ? String(initialFilters.maxExperience) : '');
    setMinSalary(initialFilters.minSalary !== undefined ? String(initialFilters.minSalary) : '');
    setMaxSalary(initialFilters.maxSalary !== undefined ? String(initialFilters.maxSalary) : '');
    setCurrentLocation(initialFilters.currentLocation || '');
    setPreferredLocations(initialFilters.preferredLocations || []);
    setEducation(initialFilters.education || []);
    setNoticePeriod(initialFilters.noticePeriod || []);
    setCurrentDesignation(initialFilters.currentDesignation || '');
    setPreferredJob(initialFilters.preferredJob || '');
    setJobType(initialFilters.jobType?.[0] || '');
    setJobOpenType(initialFilters.jobOpenType || '');
    setGender(initialFilters.gender || '');
    setPersonWithDisability(initialFilters.personWithDisability ?? false);
    setModifiedIn(initialFilters.modifiedIn || '');
    setCreatedIn(initialFilters.createdIn || '');
  }, [isOpen, initialFilters]);

  // Dropdown options
  // Degree options (from dropdown API like Add Job)
  const { options: degreeOptions, loading: degreeLoading } = useDropdownData('degree');

  const noticePeriodOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: '15days', label: '15 Days' },
    { value: '30days', label: '30 Days' },
    { value: '60days', label: '60 Days' },
    { value: '90days', label: '90 Days' },
  ];

  const jobTypeOptions = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
  ];

  const jobOpenTypeOptions = [
    { value: 'remote', label: 'Remote' },
    { value: 'onsite', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'any', label: 'Any' },
  ];

  // Date pickers for modified/created instead of preset windows

  // Handle Boolean search
  const handleBooleanSearch = (query: string, options: { boolean: boolean; scope: string }) => {
    setBooleanQuery(query);
    setBooleanSearchEnabled(options.boolean);
    setSearchScope(options.scope);
  };

  // Skills API for autocomplete
  const fetchSkillSuggestions = async (query: string): Promise<string[]> => {
    // TODO: Replace with actual API call
    const mockSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
      'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL',
      'Next.js', 'Vue.js', 'Angular', 'Express', 'Django', 'Spring Boot'
    ];
    return mockSkills.filter(skill => 
      skill.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handleReset = () => {
    setBooleanQuery('');
    setBooleanSearchEnabled(true);
    setSearchScope('entire');
    setClientId('');
    setMinExperience('');
    setMaxExperience('');
    setMinSalary('');
    setMaxSalary('');
    setCurrentLocation('');
    setPreferredLocations([]);
    setEducation([]);
    setNoticePeriod([]);
    setCurrentDesignation('');
    setPreferredJob('');
    setJobType('');
    setJobOpenType('');
    setGender('');
    setPersonWithDisability(false);
    setModifiedIn('');
    setCreatedIn('');
  };

  const handleSearch = () => {
    const filters: CandidateSearchFilters = {
      booleanQuery: booleanQuery || undefined,
      booleanSearchEnabled,
      searchScope: searchScope || undefined,
      clientId: clientId || undefined,
      minExperience: minExperience ? parseFloat(minExperience) : undefined,
      maxExperience: maxExperience ? parseFloat(maxExperience) : undefined,
      minSalary: minSalary ? parseFloat(minSalary) : undefined,
      maxSalary: maxSalary ? parseFloat(maxSalary) : undefined,
      currentLocation: currentLocation || undefined,
      preferredLocations,
      education,
      noticePeriod,
      currentDesignation: currentDesignation || undefined,
      preferredJob: preferredJob || undefined,
      jobType: jobType ? [jobType] : [],
      jobOpenType: jobOpenType || undefined,
      gender: gender || undefined,
      personWithDisability,
      modifiedIn: modifiedIn || undefined,
      createdIn: createdIn || undefined,
    };
    onSearch(filters);
  };

  return (
    <Modal
      isOpen={isOpen}
      title='Applicant Search'
      onClose={onClose}
      size="xl"
      showCloseButton={true}
      titleRounded
    >
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Boolean Search Section */}
            <BooleanSearchInput
              skillsApi={fetchSkillSuggestions}
              onSearch={handleBooleanSearch}
              onChange={handleBooleanSearch}
              initialQuery={booleanQuery}
              initialBooleanOn={booleanSearchEnabled}
              initialScope={searchScope}
              placeholder='Search with Boolean: (Java OR Python) AND "Machine Learning" NOT Intern'
              showScopeDropdown={false}
              showSearchButton={false}
            />

            {/* Basic Info Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="user" size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
              </div>
              
              <div className="space-y-3">
                <SearchDropdown
                  label="Client Hiring For"
                  value={clientId}
                  onChange={(selected: any) => {
                    setClientId(selected ? selected.value : '');
                  }}
                  options={clientOptions}
                  loading={clientsLoading}
                  onInputChange={(input: string) => searchClients(input)}
                  placeholder="Search and select client"
                  isMulti={false}
                  isSearchable={true}
                  isClearable={true}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Experience Range (Years)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={minExperience}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setMinExperience(value);
                          }
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="Min"
                        min="0"
                      />
                      <Input
                        type="number"
                        value={maxExperience}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setMaxExperience(value);
                          }
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="Max"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Salary Range (LPA)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={minSalary}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setMinSalary(value);
                          }
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="Min"
                        min="0"
                      />
                      <Input
                        type="number"
                        value={maxSalary}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || Number(value) >= 0) {
                            setMaxSalary(value);
                          }
                        }}
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        placeholder="Max"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Preferences */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="map-pin" size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Location & Preferences</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <SearchDropdown
                  label="Current Location"
                  value={currentLocation}
                  onChange={(selected: any) => {
                    setCurrentLocation(selected ? selected.label : '');
                  }}
                  options={locationOptions}
                  loading={locationsLoading}
                  onInputChange={(input: string) => searchLocations(input)}
                  placeholder="Search and select location"
                  isMulti={false}
                  isSearchable={true}
                  isClearable={true}
                  onMenuScrollToBottom={() => {
                    if (hasMoreLocations) loadMoreLocations();
                  }}
                />

                <SearchDropdown
                  label="Preferred Locations"
                  value={preferredLocations}
                  onChange={(selected: any) => {
                    if (Array.isArray(selected)) {
                      const locations = selected.map((item: any) => item.label);
                      setPreferredLocations(locations);
                    } else {
                      setPreferredLocations(selected ? [selected.label] : []);
                    }
                  }}
                  options={locationOptions}
                  loading={locationsLoading}
                  onInputChange={(input: string) => searchLocations(input)}
                  placeholder="Search and select locations"
                  isMulti={true}
                  isSearchable={true}
                  isClearable={true}
                  onMenuScrollToBottom={() => {
                    if (hasMoreLocations) loadMoreLocations();
                  }}
                />

                <SearchDropdown
                  label="Education (Degree)"
                  value={education}
                  onChange={(selected: any) => {
                    if (Array.isArray(selected)) {
                      const degrees = selected.map((item: any) => item.label || item.value);
                      setEducation(degrees);
                    } else {
                      setEducation(selected ? [selected.label || selected.value] : []);
                    }
                  }}
                  options={degreeOptions}
                  loading={degreeLoading}
                  placeholder="Search and select degrees"
                  isMulti={true}
                  isSearchable={true}
                  isClearable={true}
                />

                <SearchDropdown
                  label="Notice Period"
                  value={noticePeriod}
                  onChange={(selected: any) => {
                    if (Array.isArray(selected)) {
                      const periods = selected.map((item: any) => item.label);
                      setNoticePeriod(periods);
                    } else {
                      setNoticePeriod(selected ? [selected.label] : []);
                    }
                  }}
                  options={noticePeriodOptions}
                  placeholder="Select periods"
                  isMulti={true}
                  isSearchable={true}
                  isClearable={true}
                />
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="briefcase" size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Work Details</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <SearchDropdown
                  label="Designation"
                  value={currentDesignation}
                  onChange={(selected: any) => {
                    setCurrentDesignation(selected ? (selected.value || selected.label) : '');
                  }}
                  options={designationOptions}
                  loading={designationLoading}
                  onInputChange={(input: string, action: any) => {
                    if (action.action === 'input-change') {
                      searchDesignations(input);
                    }
                  }}
                  placeholder="Search designation"
                  isMulti={false}
                  isSearchable={true}
                  isClearable={true}
                />

                <FormField
                  label="Preferred Job Title"
                  placeholder="Enter job title"
                  value={preferredJob}
                  onChange={(value: string) => setPreferredJob(value)}
                  className=""
                />

                <SearchDropdown
                  label="Job Type"
                  value={jobType}
                  onChange={(selected: any) => {
                    setJobType(selected ? selected.label : '');
                  }}
                  options={jobTypeOptions}
                  placeholder="Select type"
                  isMulti={false}
                  isSearchable={true}
                  isClearable={true}
                />

                <SearchDropdown
                  label="Work Mode"
                  value={jobOpenType}
                  onChange={(selected: any) => {
                    setJobOpenType(selected ? selected.label : '');
                  }}
                  options={jobOpenTypeOptions}
                  placeholder="Select mode"
                  isMulti={false}
                  isSearchable={true}
                  isClearable={true}
                />
              </div>
            </div>

            {/* Additional Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="filter" size={16} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Additional Filters</h3>
              </div>
              
              <div className="grid grid-cols-4 gap-3 items-end">
                <SearchDropdown
                  label="Gender"
                  value={gender}
                  onChange={(selected: any) => {
                    setGender(selected ? selected.label : '');
                  }}
                  options={genderOptions}
                  placeholder="Any"
                  isMulti={false}
                  isSearchable={true}
                  isClearable={true}
                />

                <FormField
                  label="Modified Within"
                  type="date"
                  value={modifiedIn}
                  onChange={(value: string) => setModifiedIn(value)}
                  placeholder="Select date"
                />

                <FormField
                  label="Created Within"
                  type="date"
                  value={createdIn}
                  onChange={(value: string) => setCreatedIn(value)}
                  placeholder="Select date"
                />

                <div className="flex items-center h-10">
                  <Checkbox
                    label="PWD Candidates Only"
                    checked={personWithDisability}
                    onChange={(checked) => setPersonWithDisability(checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t bg-gray-50">
          <Button 
            variant="secondary" 
            onClick={handleReset}
            className="text-gray-600"
          >
            <Icon name="refresh" size={16} className="mr-1.5" />
            Reset All
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSearch}>
              <Icon name="search" size={16} className="mr-1.5" />
              Search Candidates
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CandidateSearchModal;
