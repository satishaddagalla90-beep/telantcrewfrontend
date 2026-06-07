import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel, { FilterField } from '../../molecules/FilterPanel';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import ExpandableDataTable from '../../molecules/DataTable/ExpandableDataTable';
import DeleteConfirmationModal from '../../molecules/DeleteConfirmationModal';
import Badge from '../../atoms/Badge';
import Avatar from '../../atoms/Avatar/Avatar';
import { JobListItem } from '../../../types/job';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import { AsyncSelectOption } from '../../atoms/AsyncSelect';
import PageLayout from '../../templates/PageLayout/PageLayout';
import DuplicateCheckModal from '../../organisms/DuplicateCheckModal';
import CandidateSearchModal, {
  CandidateSearchFilters,
} from '../../organisms/CandidateSearchModal';
import AccessDenied from '../../molecules/AccessDenied/AccessDenied';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  applicantListAPI,
  CandidateAPIResponse,
} from '../../../utils/api/ApplicantListView';
import { CandidateData } from '../../../types/candidate';
import { useDebouncedCallback, useURLPagination } from '../../../hooks';
import { useSWR, apiCall, API_ENDPOINTS, clearNetCache } from '../../../utils/api';
import { mutate as globalMutate } from 'swr';
import { usePermissions } from '../../../hooks/usePermissions';
import { useStaticDropdowns } from '../../../hooks/useDropdowns';
import {
  createFlagColorMap,
  getFlagColorFromMap,
} from '../../../utils/flagColors';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '../../../utils/toast';
import RequirementsAPI from '../../../utils/api/RecruitmentAPI';
import UnmapModal from '../../molecules/UnmapModal';

interface NestedTableProps {
  data: any[];
  columns: TableColumn[];
  visibleColumns: Record<string, boolean>;
  emptyMessage: string;
  title: string;
  isLoading: boolean;
  selectedRows?: string[];
  onSelectAll?: (selected: boolean) => void;
  onSelectRow?: (id: string, selected: boolean) => void;
  onUnmapSelected?: () => void;
}

const NestedTableContent: React.FC<NestedTableProps> = ({
  data,
  columns,
  visibleColumns,
  emptyMessage,
  title,
  isLoading,
  selectedRows = [],
  onSelectAll,
  onSelectRow,
  onUnmapSelected
}) => {
  const [visibleCount, setVisibleCount] = useState(3);
  const hasMore = data.length > visibleCount;

  const handleReadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, data.length));
  };

  const handleShowLess = () => {
    setVisibleCount(3);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden my-2">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <Badge variant="info">{isLoading ? '...' : `${data.length} Total`}</Badge>
        </div>
        {selectedRows.length > 0 && onUnmapSelected && (
          <Button
            variant="warning"
            size="xs"
            icon="unmap"
            onClick={onUnmapSelected}
            disabled={true}
          >
            Unmap Selected ({selectedRows.length})
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-500">Loading details...</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={data.slice(0, visibleCount)}
              visibleColumns={visibleColumns}
              emptyMessage={emptyMessage}
              height="auto"
              maxHeight="400px"
              selectedRows={selectedRows}
              onSelectAll={onSelectAll}
              onSelectRow={onSelectRow}
            />
          </div>
          {data.length > 3 && (
            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-center gap-4">
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReadMore}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium flex items-center gap-2"
                >
                  <Icon name="caret-down" size={16} />
                  Read More ({data.length - visibleCount} more)
                </Button>
              )}
              {visibleCount > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowLess}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-2"
                >
                  <Icon name="caret-up" size={16} />
                  Show Less
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


// Transformed data type for table display
interface ApplicantData {
  id: string;
  candidate_id: string;
  candidate_name: string;
  flag?: string;
  phone: string;
  email: string;
  current_organization: string;
  payroll_organisation: string;
  total_experience: string;
  relevant_experience: string;
  pan_number: string;
  current_location: string;
  preffered_location: string;
  degree: string;
  primary_skills: string[];
  notice_period: string;
  current_ctc: string;
  expected_ctc: string;
  resume: string;
  linkedin_profile: string;
  created_by: string;
  created: string;
  last_updated_by_user: string;
  last_updated_by_candidate: string;
  status: string;
  is_actively_looking: boolean;
  ismapped: boolean;
  skill_category: string;
}

const Applicants: React.FC = () => {
  // Initialize permissions first
  const { canReadCandidates, canCreateCandidates, canDeleteCandidates } =
    usePermissions();

  // Check if user has read access - early return
  if (!canReadCandidates) {
    return <AccessDenied />;
  }

  return (
    <ApplicantsContent
      canCreateCandidates={canCreateCandidates}
      canDeleteCandidates={canDeleteCandidates}
    />
  );
};

interface ApplicantsContentProps {
  canCreateCandidates: boolean;
  canDeleteCandidates: boolean;
}

const ApplicantsContent: React.FC<ApplicantsContentProps> = ({
  canCreateCandidates,
  canDeleteCandidates,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [candidateJobs, setCandidateJobs] = useState<Record<string, any[]>>({});
  const [candidateJobsLoading, setCandidateJobsLoading] = useState<Record<string, boolean>>({});

  const fetchCandidateJobs = async (candidateId: string) => {
    if (candidateJobs[candidateId] !== undefined) return; // already cached
    setCandidateJobsLoading(prev => ({ ...prev, [candidateId]: true }));
    try {
      const response = await apiCall<any>(API_ENDPOINTS.RECRUITMENT.CANDIDATE_JOBS(candidateId));
      const rawData = Array.isArray(response) ? response : (response?.data || []);
      
      // Map API fields (from recruitment response) to internal table keys provided by backend projection
      const mappedData = rawData.map((item: any) => ({
        ...item,
        id: item.mapping_id, // For checkbox selection
        detail_id: item.id, // For navigation (job UUID)
        job_id: item.job_id,
        job_title: item.job_title,
        client_name: item.client_name,
        client_req_id: item.client_req_id || 'N/A',
        preferred_job: item.preferred_job || '-',
        primary_skills: typeof item.primary_skill === 'string'
          ? item.primary_skill.split(',').map((s: any) => s.trim()).filter(Boolean)
          : Array.isArray(item.primary_skill) 
            ? item.primary_skill.flat(Infinity).map((s: any) => String(s)).filter(Boolean)
            : (Array.isArray(item.skill_set) ? item.skill_set : []),
        job_owner: item.job_owner || '-',
        status: item.status || 'Submitted',
        mapped_by: item.mapped_by || '-',
        mapped_date: item.mapped_date || '-'
      }));
      setCandidateJobs(prev => ({ ...prev, [candidateId]: mappedData }));
    } catch (err) {
      console.error('Failed to fetch jobs for candidate', candidateId, err);
      setCandidateJobs(prev => ({ ...prev, [candidateId]: [] }));
    } finally {
      setCandidateJobsLoading(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  // Fetch static dropdown data
  const { flagsOptions, loading: loadingStaticDropdowns } =
    useStaticDropdowns();

  // Dynamic flags metadata (fetched from backend) -> used to determine flag color
  const [flagColorMap, setFlagColorMap] = useState<Record<string, string>>({});

  // Fetch flags metadata from backend and create a color map.
  useEffect(() => {
    let mounted = true;

    const fetchFlagsMeta = async () => {
      try {
        const flagColorMap = await createFlagColorMap();
        if (mounted) {
          setFlagColorMap(flagColorMap);
        }
      } catch (err) {
        console.error('Failed to fetch flags metadata:', err);
        if (mounted) {
          setFlagColorMap({});
        }
      }
    };

    fetchFlagsMeta();
    return () => {
      mounted = false;
    };
  }, []);

  const [filters, setFilters] = useState<Record<string, string | null>>({
    search: null,
    panNumber: null,
    email: null,
    phone: null,
    candidateId: null,
    flagType: null,
    organisation: null,
    experienceMin: null,
    experienceMax: null,
    location: null,
    primary_skills: null,
    primarySkill: null,
    skills: null,
    noticePeriod: null,
    createdDate: null,
    createdBy: null,
    payrollOrg: null, // Add payroll organisation filter
    educationType: null, // Add education type filter
    skillCategory: null, // Add skill category filter
  });
  // URL-based pagination for browser back/forward support
  const {
    currentPage,
    debouncedPage,
    limit: itemsPerPage,
    setPage: setCurrentPage,
    setLimit: setItemsPerPage,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
  });

  // Local state for filters before application
  const [localFilters, setLocalFilters] = useState<Record<string, string | null>>(filters);

  // Sync local filters when the main filters state changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Build API URL with all parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    // Pagination parameters
    params.append('page', debouncedPage.toString());
    params.append('limit', itemsPerPage.toString());

    // Helper to append smart search params
    const appendSmartSearchParam = (
      searchParams: URLSearchParams,
      searchTerm: string
    ) => {
      const term = searchTerm.trim();
      if (!term) return;

      // Check for Candidate ID (alphanumeric with optional hyphens, or specific prefixes)
      // e.g., THCAN-IND-1, APP001, IND-1
      const isCandidateId =
        /^[A-Za-z0-9-]+$/.test(term) &&
        /[A-Za-z]/.test(term) &&
        /\d/.test(term);

      // Check if term looks like a phone number (mostly digits, with common phone symbols)
      const isPhoneLike =
        /^[\d+\-\s()]+$/.test(term) && (term.match(/\d/g) || []).length >= 3;

      if (isCandidateId) {
        searchParams.append('candidate_id', term);
      } else if (isPhoneLike) {
        searchParams.append('phone', term);
      } else {
        searchParams.append('search', term);
      }
    };

    // Search term
    if (searchTerm.trim()) {
      appendSmartSearchParam(params, searchTerm);
    }

    // Add activeTab filter for is_actively_looking
    if (activeTab !== 'all') {
      if (activeTab === 'active') {
        params.append('is_actively_looking', 'true');
      } else if (activeTab === 'inactive') {
        params.append('is_actively_looking', 'false');
      }
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      // Handle both string (legacy/single), number, and array (multi-select) values
      const hasValue = Array.isArray(value)
        ? value.length > 0
        : value !== null && value !== undefined && value !== '';

      if (hasValue) {
        const processValue = (val: any) => {
          if (Array.isArray(val)) return val.join(',');
          return String(val);
        };

        switch (key) {
          case 'search': {
            if (typeof value === 'string')
              appendSmartSearchParam(params, value);
            break;
          }
          case 'panNumber':
            params.append('pan_number', processValue(value));
            break;
          case 'email':
            params.append('email', processValue(value));
            break;
          case 'phone':
            params.append('phone', processValue(value));
            break;
          case 'candidateId':
            params.append('candidate_id', processValue(value));
            break;
          case 'flagType':
            params.append('flags', processValue(value));
            break;
          case 'organisation':
            if (Array.isArray(value)) {
              value.forEach(v => params.append('organization_name', v));
            } else {
              params.append('organization_name', value as string);
            }
            break;
          case 'experienceMin':
            params.append('min_experience', processValue(value));
            break;
          case 'experienceMax':
            params.append('max_experience', processValue(value));
            break;
          case 'location':
            params.append('current_location', processValue(value));
            break;
          case 'primary_skills': // Column filter
          case 'primarySkill':   // Sidebar dropdown
            if (Array.isArray(value)) {
              value.forEach(v => params.append('primary_skill', processValue(v)));
            } else {
              params.append('primary_skill', processValue(value));
            }
            break;
          case 'skills':
            params.append('Skill', processValue(value));
            break;
          case 'noticePeriod':
            params.append('notice_period', processValue(value));
            break;
          case 'createdDate':
            params.append('created', processValue(value));
            break;
          case 'createdBy':
            params.append('created_by', processValue(value));
            break;
          case 'payrollOrg':
            if (Array.isArray(value)) {
              value.forEach(v => params.append('payroll_organization', v));
            } else {
              params.append('payroll_organization', value as string);
            }
            break;
          case 'educationType':
            params.append('education_type', processValue(value));
            break;
          case 'skillCategory':
            if (Array.isArray(value)) {
              value.forEach(v => params.append('skill_category', v));
            } else {
              params.append('skill_category', value as string);
            }
            break;
        }
      }
    });

    const url = `${API_ENDPOINTS.CANDIDATES.LIST}?${params.toString()}`;
    return url;
  }, [debouncedPage, itemsPerPage, searchTerm, filters, activeTab]);

  // Fetch candidates using SWR
  const {
    data: candidatesResponse,
    loading,
    isValidating,
    refetch,
  } = useSWR<CandidateAPIResponse>(apiUrl);

  // Revalidate when navigating back to this page
  useEffect(() => {
    // Only refetch if we're on the applicants page (not on detail/add routes)
    if (location.pathname === '/applicants') {
      console.log('🔄 Refetching applicants list...');
      refetch(true); // Pass true to use isValidating state for background refresh
    }
  }, [location.pathname]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'created',
    direction: 'desc',
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showNoSelectionModal, setShowNoSelectionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteResultModal, setShowDeleteResultModal] = useState(false);
  const [deleteResultMessage, setDeleteResultMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showDuplicateCheckModal, setShowDuplicateCheckModal] = useState(false);
  const [showCandidateSearchModal, setShowCandidateSearchModal] =
    useState(false);
  
  // Nested selection and unmap states
  const [selectedNestedRows, setSelectedNestedRows] = useState<string[]>([]);
  const [showUnmapConfirmModal, setShowUnmapConfirmModal] = useState(false);
  const [showUnmapResultModal, setShowUnmapResultModal] = useState(false);
  const [unmapResultMessage, setUnmapResultMessage] = useState('');
  const [unmapping, setUnmapping] = useState(false);
  const [mappingToUnmap, setMappingToUnmap] = useState<string | null>(null);

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    candidate_id: true,
    candidate_name: true,
    phone: true,
    email: true,
    current_organization: true,
    payroll_organisation: true,
    total_experience: true,
    relevant_experience: true,
    current_location: true,
    preffered_location: true,
    degree: true,
    primary_skills: true,
    notice_period: true,
    current_ctc: true,
    expected_ctc: true,
    pan_number: true,
    skill_category: true,
    created_by: true,
    created: true,
    last_updated_by_user: true,
    last_updated_by_candidate: true,
  });

  // Async select options and loading states
  const [candidateSearchOptions, setCandidateSearchOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingCandidateSearch, setLoadingCandidateSearch] = useState(false);
  const [candidateIdOptions, setCandidateIdOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingCandidateId, setLoadingCandidateId] = useState(false);
  const [panNumberOptions, setPanNumberOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [loadingPanNumber, setLoadingPanNumber] = useState(false);
  const [emailSearchOptions, setEmailSearchOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingEmailSearch, setLoadingEmailSearch] = useState(false);
  const [phoneSearchOptions, setPhoneSearchOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingPhoneSearch, setLoadingPhoneSearch] = useState(false);
  const [flagTypeOptions, setFlagTypeOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [organisationOptions, setOrganisationOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingOrganisation, setLoadingOrganisation] = useState(false);
  const [locationOptions, setLocationOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [skillOptions, setSkillOptions] = useState<AsyncSelectOption[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [noticePeriodOptions, setNoticePeriodOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingNoticePeriod, setLoadingNoticePeriod] = useState(false);
  const [createdByOptions, setCreatedByOptions] = useState<AsyncSelectOption[]>( // Add this state
    []
  );
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);
  const [payrollOrgOptions, setPayrollOrgOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingPayrollOrg, setLoadingPayrollOrg] = useState(false);
  const [educationTypeOptions, setEducationTypeOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingEducationType, setLoadingEducationType] = useState(false);

  // Profile filter options
  const profileOptions = [
    { value: 'all', label: 'All Applicants' },
    { value: 'active', label: 'Active Applicants' },
    { value: 'inactive', label: 'InActive Applicants' },
  ];

  const tableColumns: TableColumn[] = [
    {
      key: 'candidate_id',
      label: 'Applicant ID',
      headerRender: () => <div className="pl-10">Applicant ID</div>,
      sortable: true,
      width: '180px',
      minWidth: '180px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          {row.ismapped ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                const rowId = String(row.id);
                const newExpanded = new Set(expandedRows);
                if (newExpanded.has(rowId)) {
                  newExpanded.delete(rowId);
                } else {
                  newExpanded.add(rowId);
                  fetchCandidateJobs(row.candidate_id);
                }
                setExpandedRows(newExpanded);
              }}
              className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition-all duration-300 ${
                expandedRows.has(String(row.id))
                  ? 'text-blue-600 scale-110'
                  : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              <div
                className={`transition-transform duration-300 ${
                  expandedRows.has(String(row.id)) ? 'rotate-90' : ''
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </Button>
          ) : (
            <div className="w-8 h-8 flex-shrink-0" />
          )}
          <div
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/applicants/${row.id}`);
            }}
          >
            {value}
          </div>
        </div>
      ),
    },

    {
      key: 'candidate_name',
      label: 'Applicant Name',
      sortable: true,
      width: '250px',
      minWidth: '220px',
      render: (value, row) => {
        const flag = (row as any).flag;
        const color = getFlagColorFromMap(flag, flagColorMap);
        const resumeUrl = (row as any).resume;
        const linkedinProfile = (row as any).linkedin_profile;
        const isActiveLooking = (row as any).is_actively_looking;

        return (
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={e => {
              e.stopPropagation();
              navigate(`/applicants/${row.id}`);
            }}
          >
            <div className="flex items-center gap-x-2">
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="View Resume"
                  onClick={e => e.stopPropagation()}
                >
                  <Icon name="attachment" size={16} />
                </a>
              )}
              <span>{value}</span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {isActiveLooking && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isActiveLooking
                      ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                  }`}
                >
                  {'Active'}
                </span>
              )}
              {flag ? (
                <Icon
                  name="flag"
                  size={14}
                  color={color}
                  weight="fill"
                  aria-label={String(flag)}
                  className="mr-2"
                />
              ) : null}
              {linkedinProfile && (
                <a
                  href={linkedinProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="LinkedIn Profile"
                  onClick={e => e.stopPropagation()}
                >
                  <Icon name="linkedin" size={18} color="#0A66C2" />
                </a>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      width: '140px',
      minWidth: '140px',
    },
    {
      key: 'email',
      label: 'Email ID',
      sortable: true,
      width: '220px',
      minWidth: '200px',
    },
    {
      key: 'current_organization',
      label: 'Current Organization',
      sortable: true,
      width: '200px',
      minWidth: '180px',
    },
    {
      key: 'skill_category',
      label: 'Skill Category',
      sortable: true,
      width: '180px',
      minWidth: '150px',
      render: (value: string) => (
        <div className="flex flex-wrap gap-1">
          {value ? (
            value.split(',').map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs font-medium">
                {cat.trim()}
              </Badge>
            ))
          ) : (
            <span className="text-gray-400 font-medium text-[11px]">NA</span>
          )}
        </div>
      ),
    },
    {
      key: 'payroll_organisation',
      label: 'Payroll Organization',
      sortable: true,
      width: '200px',
      minWidth: '180px',
    },
    {
      key: 'total_experience',
      label: 'Total Exp',
      sortable: true,
      width: '100px',
      minWidth: '100px',
    },
    {
      key: 'relevant_experience',
      label: 'Rel Exp',
      sortable: true,
      width: '100px',
      minWidth: '100px',
    },
    {
      key: 'current_location',
      label: 'Current Location',
      sortable: true,
      width: '160px',
      minWidth: '140px',
    },
    {
      key: 'preffered_location',
      label: 'Preferred Location',
      sortable: true,
      width: '160px',
      minWidth: '140px',
    },
    {
      key: 'degree',
      label: 'Highest Education Degree',
      sortable: true,
      width: '180px',
      minWidth: '160px',
    },
    {
      key: 'primary_skills',
      label: 'Primary Skills',
      sortable: true,
      width: '250px',
      minWidth: '200px',
      render: (value: any) => {
        let skills: string[] = [];
        if (Array.isArray(value)) {
          skills = value.flatMap(s => typeof s === 'string' ? s.split(',').map(item => item.trim()) : [String(s)]);
        } else if (typeof value === 'string') {
          skills = value.split(',').map(s => s.trim());
        }
        skills = skills.filter(Boolean);

        return (
          <div className="flex flex-wrap gap-1" title={skills.join(', ')}>
            {skills.length > 0 ? (
              <>
                {skills.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="info" className="text-xs font-medium">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <span className="text-xs text-gray-400">+{skills.length - 3}</span>
                )}
              </>
            ) : (
              <span className="text-gray-400 font-medium text-[11px]">NA</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'notice_period',
      label: 'Notice Period',
      sortable: true,
      width: '120px',
      minWidth: '120px',
    },
    {
      key: 'current_ctc',
      label: 'Current CTC',
      sortable: true,
      width: '120px',
      minWidth: '120px',
    },
    {
      key: 'expected_ctc',
      label: 'Exp CTC',
      sortable: true,
      width: '120px',
      minWidth: '120px',
    },
    {
      key: 'pan_number',
      label: 'PAN',
      sortable: true,
      width: '120px',
      minWidth: '120px',
    },
    {
      key: 'created_by',
      label: 'Created By',
      sortable: true,
      width: '150px',
      minWidth: '130px',
    },
    // {
    //   key: 'last_updated_by_user',
    //   label: 'Updated By',
    //   sortable: true,
    //   width: '150px',
    //   minWidth: '130px',
    // },
    {
      key: 'created',
      label: 'Created Date',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      // render: value => new Date(value).toLocaleDateString(),
    },
  ];

  const columnOptions = tableColumns.map(col => ({
    key: col.key,
    label: col.label,
  }));

  // Helper function to extract city from location string
  const extractCityFromLocation = (locationString: string): string => {
    if (!locationString || typeof locationString !== 'string') return '';

    // Handle format like "India/Bihar/Muzaffarpur" or "Country/State/City"
    const parts = locationString.split('/');
    // Return the last part (city) and trim any whitespace
    return parts[parts.length - 1]?.trim() || locationString.trim();
  };

  // Helper function to construct full name (same as in ApplicantDetail)
  const getDisplayName = (candidate: CandidateData): string => {
    // Priority 1: If display_name exists and is not empty, use it
    if (candidate.display_name && candidate.display_name.trim()) {
      return candidate.display_name.trim();
    }

    // Priority 2: Construct from first_name + middle_name + last_name
    const firstName = candidate.first_name?.trim() || '';
    const middleName = (candidate as any).middle_name?.trim() || ''; // middle_name might not be in API response
    const lastName = candidate.last_name?.trim() || '';

    // Combine available name parts, filtering out empty strings
    const nameParts = [firstName, middleName, lastName].filter(
      part => part !== ''
    );

    // Return joined name or fallback to 'Unknown' if no name parts available
    return nameParts.length > 0 ? nameParts.join(' ') : 'Unknown';
  };

  // Transform API data to table format
  const transformCandidateData = useCallback(
    (candidate: CandidateData): ApplicantData => {
      // Find current job (where is_current_job is true)
      const currentJob = candidate.employment?.find(
        emp => emp.is_current_job === true
      );

      // If no current job found, use the latest employment record
      let latestJob = null;
      if (candidate.employment && candidate.employment.length > 0) {
        // Sort by from_date descending to get the most recent
        const sortedEmployment = [...candidate.employment].sort((a, b) => {
          // Handle yyyy-mm format for employment dates
          let fromDateStrA = a.from_date || '';
          let fromDateStrB = b.from_date || '';

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
        latestJob = sortedEmployment[0];
      }

      // Use current job if available, otherwise use latest job
      const relevantJob = currentJob || latestJob;

      return {
        id: candidate.id.toString(), // Convert number to string
        flag: candidate.source_details?.flags?.[0] || '',
        candidate_id: candidate.candidate_id,
        candidate_name: getDisplayName(candidate),
        phone: candidate.phone?.toString() || '',
        email: candidate.email || '',
        current_organization:
          relevantJob?.organization_name ||
          candidate.current_organisation ||
          '',
        payroll_organisation: relevantJob?.payroll_organization || '',
        total_experience: candidate.total_experience?.toString() || '0',
        relevant_experience: candidate.relevant_experience?.toString() || '0',
        pan_number: (() => {
          const panDoc = candidate.documents?.find(
            (doc: any) => doc.document_name === 'PAN Card'
          );
          return panDoc?.document_number || candidate.pan_number || '';
        })(),
        current_location: extractCityFromLocation(
          candidate.current_location || ''
        ),
        preffered_location: extractCityFromLocation(
          candidate.preferred_location || ''
        ),
        degree: getHighestDegree(candidate.education),
        primary_skills: Array.isArray(candidate.primary_skill)
          ? (candidate.primary_skill as any[]).flat(Infinity).map((s: any) => String(s)).filter(Boolean)
          : typeof (candidate.primary_skill as unknown) === 'string'
            ? (candidate.primary_skill as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        notice_period: candidate.notice_period || '',
        current_ctc: formatCurrency(candidate.current_ctc),
        expected_ctc: formatCurrency(candidate.expected_ctc),
        resume: candidate.resume_url || '',
        linkedin_profile: candidate.linkedin_profile || '',
        created_by: candidate.created_by
          ? capitalizeAndSafe(candidate.created_by)
          : '',
        created: candidate.created
          ? new Date(candidate.created).toLocaleDateString('en-GB')
          : '',
        last_updated_by_user: candidate.updated_by
          ? capitalizeAndSafe(candidate.updated_by)
          : '',
        last_updated_by_candidate: candidate.updated
          ? new Date(candidate.updated).toLocaleDateString('en-GB')
          : '',
        status: candidate.is_active ? 'active' : 'inactive',
        is_actively_looking:
          candidate.source_details?.is_actively_looking || false,
        ismapped: candidate.ismapped || false,
        skill_category: Array.isArray(candidate.skill_category)
          ? candidate.skill_category.map((cat: any) => cat.name || cat).join(', ')
          : typeof candidate.skill_category === 'string'
            ? candidate.skill_category
            : '',
      };
    },
    []
  );

  // Extract data from SWR response
  const candidatesData = useMemo(() => {
    if (!candidatesResponse?.candidates) return [];
    return candidatesResponse.candidates.map(transformCandidateData);
  }, [candidatesResponse, transformCandidateData]);

  const totalCandidates = candidatesResponse?.total_candidates || 0;
  const totalPages = candidatesResponse?.total_pages || 0;

  // Data processing logic - API handles all filtering including is_actively_looking
  const filteredData = useMemo(() => {
    // Since API now handles is_actively_looking filtering, just return the transformed data
    return candidatesData;
  }, [candidatesData]);

  const paginatedData = useMemo(() => {
    // For API pagination, we use the data directly as it's already paginated
    return filteredData;
  }, [filteredData]);

  // Use API totalPages for pagination
  const totalPagesCount = totalPages;

  // ... all existing handlers remain the same ...
  const handleNewApplicant = () => {
    if (!canCreateCandidates) {
      console.warn('User does not have permission to create candidates');
      return;
    }
    setShowDuplicateCheckModal(true);
  };

  const handleCloseDuplicateCheck = () => {
    setShowDuplicateCheckModal(false);
  };

  const handleContinueWithNewApplicant = () => {
    setShowDuplicateCheckModal(false);
    navigate('/add-candidate');
  };

  const handleSelectExistingCandidate = (candidate: any) => {
    setShowDuplicateCheckModal(false);
    // Here you would either navigate to the candidate profile
    // or show options to convert them to an applicant
    navigate(`/applicants/${candidate.id}`);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 when tab changes
    setSelectedRows([]);
    // useSWR will automatically refetch when URL changes
  };

  const handleAdvancedSearch = (searchFilters: CandidateSearchFilters) => {
    console.log('Searching candidates with filters:', searchFilters);

    // Build URL with search parameters
    const params = new URLSearchParams();

    if (searchFilters.booleanQuery) {
      params.append('query', searchFilters.booleanQuery);
      params.append(
        'boolean',
        searchFilters.booleanSearchEnabled ? 'true' : 'false'
      );
      params.append('scope', searchFilters.searchScope || 'all');
    }
    if (searchFilters.clientId) params.append('client', searchFilters.clientId);
    if (searchFilters.minExperience)
      params.append('exp_min', searchFilters.minExperience.toString());
    if (searchFilters.maxExperience)
      params.append('exp_max', searchFilters.maxExperience.toString());
    if (searchFilters.minSalary)
      params.append('sal_min', searchFilters.minSalary.toString());
    if (searchFilters.maxSalary)
      params.append('sal_max', searchFilters.maxSalary.toString());
    if (searchFilters.currentLocation)
      params.append('current_loc', searchFilters.currentLocation);
    if (searchFilters.preferredLocations?.length) {
      params.append('pref_locs', searchFilters.preferredLocations.join(','));
    }
    if (searchFilters.education?.length) {
      params.append('edu', searchFilters.education.join(','));
    }
    if (searchFilters.noticePeriod?.length) {
      params.append('notice', searchFilters.noticePeriod.join(','));
    }
    if (searchFilters.preferredJob)
      params.append('job', searchFilters.preferredJob);
    if (searchFilters.jobType?.length) {
      params.append('job_type', searchFilters.jobType.join(','));
    }
    if (searchFilters.jobOpenType)
      params.append('job_open_type', searchFilters.jobOpenType);
    if (searchFilters.gender) params.append('gender', searchFilters.gender);
    if (searchFilters.personWithDisability) params.append('pwd', 'true');
    if (searchFilters.modifiedIn)
      params.append('modified', searchFilters.modifiedIn);

    setShowCandidateSearchModal(false);
    navigate(`/candidate-search?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page); // Updates URL automatically via useURLPagination
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };
  // Custom tabs for applicants
  const customTabs = [
    {
      id: 'all',
      label: 'All Applicants',
    },
    {
      id: 'active',
      label: 'Active Applicants',
    },
    {
      id: 'inactive',
      label: 'Inactive Applicants',
    },
  ];

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? paginatedData.map(row => String(row.id)) : []);
  };

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  // --- Nested Selection Handlers ---
  const handleSelectAllNested = (data: any[], selected: boolean) => {
    if (selected) {
      const allIds = data.map(item => item.mapping_id || item.id);
      setSelectedNestedRows(prev => {
        const otherIds = prev.filter(id => !allIds.includes(id));
        return [...otherIds, ...allIds];
      });
    } else {
      const allIds = data.map(item => item.mapping_id || item.id);
      setSelectedNestedRows(prev => prev.filter(id => !allIds.includes(id)));
    }
  };

  const handleSelectRowNested = (id: string, selected: boolean) => {
    setSelectedNestedRows(prev => {
      if (selected) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter(rid => rid !== id);
    });
  };

  const handleUnmapNested = () => {
    if (selectedNestedRows.length === 0 && !mappingToUnmap) {
      setShowNoSelectionModal(true);
      return;
    }
    setShowUnmapConfirmModal(true);
  };

  const confirmUnmap = async (reason: string) => {
    setUnmapping(true);
    try {
      if (mappingToUnmap) {
        await RequirementsAPI.unmapCandidate(mappingToUnmap, reason);
        setUnmapResultMessage('Successfully unmapped candidate');
      } else if (selectedNestedRows.length > 0) {
        const promises = selectedNestedRows.map(id => 
          RequirementsAPI.unmapCandidate(id, reason)
        );
        await Promise.all(promises);
        setUnmapResultMessage(`Successfully unmapped ${selectedNestedRows.length} candidates`);
      }
      
      setSelectedNestedRows([]);
      setMappingToUnmap(null);
      // Optimistically update the cache to remove unmapped items without hiding others
      const unmappedIds = mappingToUnmap ? [mappingToUnmap] : selectedNestedRows;
      setCandidateJobs(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(candidateId => {
          updated[candidateId] = updated[candidateId].filter(job => !unmappedIds.includes(job.mapping_id || job.id));
        });
        return updated;
      });
      clearNetCache();
      globalMutate(() => true);
      setShowUnmapResultModal(true);
    } catch (err) {
      setUnmapResultMessage('Failed to unmap candidates');
      setShowUnmapResultModal(true);
    } finally {
      setUnmapping(false);
      setShowUnmapConfirmModal(false);
    }
  };

  const handleDeleteSelected = () => {
    if (!canDeleteCandidates) {
      showWarningToast('You do not have permission to delete candidates.');
      return;
    }

    if (selectedRows.length === 0) {
      setShowNoSelectionModal(true);
      return;
    }

    // Show confirmation modal
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);

    try {
      const result = await applicantListAPI.deleteApplicants(selectedRows);

      if (result.success) {
        setSelectedRows([]);
        showSuccessToast(result.message || 'Candidates deleted successfully!');
        // Refresh the data after deletion
        await refetch();
      } else {
        showErrorToast(result.message || 'Failed to delete records.');
      }

      // Show additional info if some deletions failed
      if (result.failed && result.failed.length > 0) {
        console.warn('Failed to delete candidates:', result.failed);
        showWarningToast(
          'Some candidates could not be deleted. Check console for details.'
        );
      }
    } catch (error) {
      console.error('Error deleting records:', error);
      showErrorToast(
        'An error occurred while deleting records. Please try again.'
      );
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleExport = (format: string) => {
    try {
      // Handle export all data option
      if (format === 'exportAll') {
        handleExportAllData();
        return;
      }

      // Get current page data (applicants displayed on current page)
      const currentPageApplicants = paginatedData;

      if (!currentPageApplicants || currentPageApplicants.length === 0) {
        showInfoToast('No data to export on current page');
        return;
      }

      // Get visible columns for export
      const visibleColumnKeys = Object.keys(visibleColumns).filter(
        key => visibleColumns[key]
      );
      const exportColumns = tableColumns.filter(col =>
        visibleColumnKeys.includes(col.key)
      );

      // Prepare data for export
      const exportData = (currentPageApplicants as ApplicantData[]).map(
        applicant => {
          const rowData: any = {};
          exportColumns.forEach(col => {
            let value = '';

            // Extract clean data values (remove JSX/React components)
            switch (col.key) {
              case 'candidate_id':
                value = (
                  applicant.candidate_id ||
                  applicant.id ||
                  ''
                ).toString();
                break;
              case 'candidate_name':
                value = applicant.candidate_name || '';
                break;
              case 'phone':
                value = applicant.phone ? String(applicant.phone) : '';
                break;
              case 'email':
                value = applicant.email || '';
                break;
              case 'current_organization':
                value = applicant.current_organization || '';
                break;
              case 'skill_category':
                value = applicant.skill_category || '';
                break;
              case 'payroll_organisation':
                value = applicant.payroll_organisation || '';
                break;
              case 'total_experience':
                value = applicant.total_experience
                  ? String(applicant.total_experience)
                  : '0';
                break;
              case 'relevant_experience':
                value = applicant.relevant_experience
                  ? String(applicant.relevant_experience)
                  : '0';
                break;
              case 'pan_number':
                value = applicant.pan_number || '';
                break;
              case 'current_location':
                value = applicant.current_location || '';
                break;
              case 'preffered_location':
                value = applicant.preffered_location || '';
                break;
              case 'degree':
                value = applicant.degree || '';
                break;
              case 'primary_skills':
                // Convert primary_skills array to a readable string format for export
                if (Array.isArray(applicant.primary_skills)) {
                  value = applicant.primary_skills.join(', ');
                } else {
                  value = '';
                }
                break;
              case 'notice_period':
                value = applicant.notice_period || '';
                break;
              case 'current_ctc':
                value = applicant.current_ctc
                  ? String(applicant.current_ctc)
                  : '0';
                break;
              case 'expected_ctc':
                value = applicant.expected_ctc
                  ? String(applicant.expected_ctc)
                  : '0';
                break;
              case 'resume':
                value = applicant.resume || '';
                break;
              case 'created_by':
                value = applicant.created_by || '';
                break;
              case 'created':
                value = applicant.created
                  ? new Date(applicant.created).toLocaleDateString()
                  : '';
                break;
              case 'last_updated_by_user':
                value = applicant.last_updated_by_user || '';
                break;
              case 'last_updated_by_candidate':
                value = applicant.last_updated_by_candidate
                  ? new Date(
                      applicant.last_updated_by_candidate
                    ).toLocaleDateString()
                  : '';
                break;
              case 'status':
                value = applicant.status || '';
                break;
              default:
                value = applicant[col.key as keyof ApplicantData]
                  ? String(applicant[col.key as keyof ApplicantData])
                  : '';
            }

            rowData[col.label] = value;
          });
          return rowData;
        }
      );

      // Execute export based on format
      switch (format) {
        case 'csv':
          exportToCSV(
            exportData,
            exportColumns.map(col => col.label)
          );
          break;
        case 'excel':
          exportToExcel(
            exportData,
            exportColumns.map(col => col.label)
          );
          break;
        case 'email':
          exportToEmail(
            exportData,
            exportColumns.map(col => col.label)
          );
          break;
        default:
          console.log('Unknown export format:', format);
      }
    } catch (error) {
      console.error('Export error:', error);
      showErrorToast('Export failed. Please try again.');
    }
  };

  // New function to handle exporting all data
  const handleExportAllData = async () => {
    try {
      showInfoToast('Fetching all data for export...');

      // Get visible columns for export
      const visibleColumnKeys = Object.keys(visibleColumns).filter(
        key => visibleColumns[key]
      );
      const exportColumns = tableColumns.filter(col =>
        visibleColumnKeys.includes(col.key)
      );

      // Fetch all data with a high limit
      const params = new URLSearchParams();

      // Helper to append smart search params (duplicated here because handleExportAllData is outside useMemo scope)
      // To strictly avoid duplication we could move the helper outside component or to a utils file,
      // but for now let's keep it consistent.
      const appendSmartSearchParamExport = (
        searchParams: URLSearchParams,
        searchTerm: string
      ) => {
        const term = searchTerm.trim();
        if (!term) return;

        const isCandidateId =
          /^[A-Za-z0-9-]+$/.test(term) &&
          /[A-Za-z]/.test(term) &&
          /\d/.test(term);
        const isPhoneLike =
          /^[\d+\-\s()]+$/.test(term) && (term.match(/\d/g) || []).length >= 3;

        if (isCandidateId) {
          searchParams.append('candidate_id', term);
        } else if (isPhoneLike) {
          searchParams.append('phone', term);
        } else {
          searchParams.append('search', term);
        }
      };

      // Add filter parameters from current filters
      if (activeTab !== 'all') {
        params.append(
          'is_actively_looking',
          activeTab === 'active' ? 'true' : 'false'
        );
      }

      if (searchTerm.trim()) {
        appendSmartSearchParamExport(params, searchTerm);
      }

      // Add other filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          switch (key) {
            case 'search': {
              appendSmartSearchParamExport(params, value);
              break;
            }
            case 'panNumber':
              params.append('pan_number', value);
              break;
            case 'email':
              params.append('email', value);
              break;
            case 'phone':
              params.append('phone', value);
              break;
            case 'candidateId':
              params.append('candidate_id', value);
              break;
            case 'flagType':
              params.append('flag_type', value);
              break;
            case 'organisation':
              params.append('organisation', value);
              break;
            case 'experienceMin':
              params.append('experience_min', value);
              break;
            case 'experienceMax':
              params.append('experience_max', value);
              break;
            case 'location':
              params.append('location', value);
              break;
            case 'primary_skills':
              params.append('skills', value);
              break;
            case 'noticePeriod':
              params.append('notice_period', value);
              break;
            case 'createdDate':
              params.append('created_date', value);
              break;
          }
        }
      });

      // Set high limit to fetch all data
      params.append('limit', '10000'); // Adjust as needed based on API limits
      params.append('page', '1');

      const url = `${API_ENDPOINTS.CANDIDATES.LIST}?${params.toString()}`;

      const response = await apiCall<CandidateAPIResponse>(url);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const allApplicants = response.data?.candidates || [];

      if (allApplicants.length === 0) {
        showWarningToast('No data to export');
        return;
      }

      // Prepare data for export
      const exportData = allApplicants.map((applicant: CandidateData) => {
        const rowData: any = {};
        exportColumns.forEach(col => {
          let value = '';

          // Extract clean data values (remove JSX/React components)
          switch (col.key) {
            case 'candidate_id':
              value = (applicant.candidate_id || applicant.id || '').toString();
              break;
            case 'candidate_name':
              value = applicant.candidate_name || '';
              break;
            case 'phone':
              value = applicant.phone ? String(applicant.phone) : '';
              break;
            case 'email':
              value = applicant.email || '';
              break;
            case 'current_organization':
              value = applicant.current_organization || '';
              break;
            case 'skill_category':
              value = applicant.skill_category || '';
              break;
            case 'payroll_organisation':
              value = applicant.payroll_organisation || '';
              break;
            case 'total_experience':
              value = applicant.total_experience
                ? String(applicant.total_experience)
                : '0';
              break;
            case 'relevant_experience':
              value = applicant.relevant_experience
                ? String(applicant.relevant_experience)
                : '0';
              break;
            case 'pan_number':
              value = applicant.pan_number || '';
              break;
            case 'current_location':
              value = applicant.current_location || '';
              break;
            case 'preffered_location':
              value = applicant.preffered_location || '';
              break;
            case 'primary_skills':
              // Convert primary_skills array to a readable string format for export
              if (Array.isArray(applicant.primary_skills)) {
                value = applicant.primary_skills.join(', ');
              } else {
                value = '';
              }
              break;
            case 'notice_period':
              value = applicant.notice_period || '';
              break;
            case 'current_ctc':
              value = applicant.current_ctc
                ? String(applicant.current_ctc)
                : '0';
              break;
            case 'expected_ctc':
              value = applicant.expected_ctc
                ? String(applicant.expected_ctc)
                : '0';
              break;
            case 'resume':
              value = applicant.resume || '';
              break;
            case 'created_by':
              value = applicant.created_by || '';
              break;
            case 'created':
              value = applicant.created
                ? new Date(applicant.created).toLocaleDateString()
                : '';
              break;
            case 'last_updated_by_user':
              value = applicant.last_updated_by_user || '';
              break;
            case 'last_updated_by_candidate':
              value = applicant.last_updated_by_candidate
                ? new Date(
                    applicant.last_updated_by_candidate
                  ).toLocaleDateString()
                : '';
              break;
            case 'status':
              value = applicant.status || '';
              break;
            default:
              value = applicant[col.key as keyof ApplicantData]
                ? String(applicant[col.key as keyof ApplicantData])
                : '';
          }

          rowData[col.label] = value;
        });
        return rowData;
      });

      // Export to Excel
      exportToExcel(
        exportData,
        exportColumns.map(col => col.label)
      );

      showSuccessToast(
        `Exported ${allApplicants.length} applicants to Excel successfully`
      );
    } catch (error) {
      console.error('Export all data error:', error);
      showErrorToast('Export failed. Please try again.');
    }
  };

  // CSV Export Function
  const exportToCSV = (data: any[], headers: string[]) => {
    try {
      // Create CSV content
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
          headers
            .map(header => {
              const value = row[header] || '';
              // Escape commas and quotes in CSV
              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `applicants-page-${currentPage}-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${data.length} applicants to CSV`);
    } catch (error) {
      console.error('CSV export error:', error);
      showErrorToast('CSV export failed');
    }
  };

  // Excel Export Function
  const exportToExcel = (data: any[], headers: string[]) => {
    try {
      // Create a new workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Applicants');

      // Auto-size columns based on content
      const colWidths = headers.map(header => ({
        wch: Math.max(header.length, 12),
      }));
      worksheet['!cols'] = colWidths;

      // Style header row with background color
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_col(col) + '1';
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '366092' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
      }

      // Generate file and download
      XLSX.writeFile(
        workbook,
        `applicants-page-${currentPage}-${new Date().toISOString().split('T')[0]}.xlsx`
      );

      console.log(`Exported ${data.length} applicants to Excel`);
    } catch (error) {
      console.error('Excel export error:', error);
      showErrorToast('Excel export failed');
    }
  };

  // Email Export Function
  const exportToEmail = (data: any[], headers: string[]) => {
    try {
      // Create formatted data for email
      const emailBody =
        `Applicants Data (Page ${currentPage})\n\n` +
        data
          .map(row => {
            return headers
              .map(header => `${header}: ${row[header] || 'N/A'}`)
              .join('\n');
          })
          .join('\n\n---\n\n');

      // Create mailto link
      const subject = `Applicants Export - Page ${currentPage} - ${new Date().toLocaleDateString()}`;
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;

      // Open email client
      window.location.href = mailtoLink;

      console.log(`Prepared email export for ${data.length} applicants`);
    } catch (error) {
      console.error('Email export error:', error);
      showErrorToast('Email export failed');
    }
  };

  const handleSaveView = () => {
    console.log('Save View clicked');
    showInfoToast('Save View feature coming soon!');
  };

  const handleColumnsReset = () => {
    setVisibleColumns({
      candidate_id: true,
      candidate_name: true,
      phone: true,
      email: true,
      current_organization: true,
      payroll_organisation: true,
      total_experience: true,
      relevant_experience: true,
      pan_number: true,
      current_location: true,
      preffered_location: true,
      degree: true,
      primary_skills: true,
      notice_period: true,
      current_ctc: true,
      expected_ctc: true,
      resume: true,
      created_by: true,
      created: true,
      last_updated_by_user: true,
      last_updated_by_candidate: true,
    });
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: null,
      candidateId: null,
      panNumber: null,
      email: null,
      phone: null,
      flagType: null,
      organisation: null,
      experienceMin: null,
      experienceMax: null,
      location: null,
      primary_skills: null,
      primarySkill: null,
      skills: null,
      noticePeriod: null,
      createdDate: null,
      createdBy: null,
      payrollOrg: null,
      educationType: null,
    };
    setFilters(clearedFilters);
    setShowFilters(false);
    setCurrentPage(1);
    // useSWR will automatically refetch when filters change
  };

  // Async search handlers with debouncing
  const performCandidateSearch = async (value: string) => {
    if (!value.trim()) {
      setCandidateSearchOptions([]);
      return;
    }

    setLoadingCandidateSearch(true);
    try {
      // Use the proper search API that searches by Display_Name, Username, Email, First_Name, Last_Name
      const searchFilters = { search: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      const candidateOptions = data.candidates.map(candidate => {
        // Create a display label with multiple candidate identifiers
        const displayName = getDisplayName(candidate);
        const identifier = candidate.id || candidate.email || candidate._id;
        const label = displayName ? displayName : String(identifier); // Ensure label is always string
        // const label = displayName ? `${displayName} (${identifier})` : identifier;

        return {
          value: candidate.display_name, // Use id as value, fallback to display_name
          label: label,
        };
      });
      setCandidateSearchOptions(candidateOptions);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidateSearchOptions([]);
    } finally {
      setLoadingCandidateSearch(false);
    }
  };

  const handleCandidateSearch = useDebouncedCallback(
    performCandidateSearch,
    300
  );

  const performCandidateIdSearch = async (value: string) => {
    if (!value.trim()) {
      setCandidateIdOptions([]);
      return;
    }

    setLoadingCandidateId(true);
    try {
      // Search candidates by candidate_id
      const searchFilters = { candidate_id: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      const candidateIdSearchOptions = data.candidates
        .filter(candidate => candidate.candidate_id)
        .map(candidate => ({
          value: candidate.candidate_id,
          label: `${candidate.candidate_id} (${getDisplayName(candidate)})`,
        }));
      setCandidateIdOptions(candidateIdSearchOptions);
    } catch (error) {
      console.error('Error fetching candidate IDs:', error);
      setCandidateIdOptions([]);
    } finally {
      setLoadingCandidateId(false);
    }
  };

  const handleCandidateIdSearch = useDebouncedCallback(
    performCandidateIdSearch,
    300
  );

  const performPanNumberSearch = async (value: string) => {
    if (!value.trim()) {
      setPanNumberOptions([]);
      return;
    }

    setLoadingPanNumber(true);
    try {
      // Search candidates by PAN number
      const searchFilters = { pan_number: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      const panOptions = data.candidates
        .filter(candidate => candidate.pan_number)
        .map(candidate => ({
          value: candidate.pan_number,
          label: `${candidate.pan_number} (${getDisplayName(candidate)})`,
        }));
      setPanNumberOptions(panOptions);
    } catch (error) {
      console.error('Error fetching PAN numbers:', error);
      setPanNumberOptions([]);
    } finally {
      setLoadingPanNumber(false);
    }
  };

  const handlePanNumberSearch = useDebouncedCallback(
    performPanNumberSearch,
    300
  );

  const performEmailSearch = async (value: string) => {
    if (!value.trim()) {
      setEmailSearchOptions([]);
      return;
    }

    setLoadingEmailSearch(true);
    try {
      // Search candidates by email
      const searchFilters = { email: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      const emailOptions = data.candidates
        .filter(candidate => candidate.email)
        .map(candidate => ({
          value: candidate.email,
          label: `${candidate.email} (${getDisplayName(candidate)})`,
        }));
      setEmailSearchOptions(emailOptions);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setEmailSearchOptions([]);
    } finally {
      setLoadingEmailSearch(false);
    }
  };

  const handleEmailSearch = useDebouncedCallback(performEmailSearch, 300);

  const performPhoneSearch = async (value: string) => {
    if (!value.trim()) {
      setPhoneSearchOptions([]);
      return;
    }

    setLoadingPhoneSearch(true);
    try {
      // Search candidates by phone
      const searchFilters = { phone: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      const phoneOptions = data.candidates
        .filter(candidate => candidate.phone)
        .map(candidate => ({
          value: candidate.phone.toString(),
          label: `${candidate.phone} (${getDisplayName(candidate)})`,
        }));
      setPhoneSearchOptions(phoneOptions);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      setPhoneSearchOptions([]);
    } finally {
      setLoadingPhoneSearch(false);
    }
  };

  const handlePhoneSearch = useDebouncedCallback(performPhoneSearch, 300);

  const performFlagTypeSearch = (value: string) => {
    if (!value.trim()) {
      setFlagTypeOptions([]);
      return;
    }

    // Use static flags data instead of fetching from candidates
    const filteredOptions = flagsOptions
      .filter(flag => flag.label.toLowerCase().includes(value.toLowerCase()))
      .map(flag => ({
        value: flag.value,
        label: flag.label,
      }));

    setFlagTypeOptions(filteredOptions);
  };

  const handleFlagTypeSearch = useDebouncedCallback(performFlagTypeSearch, 300);

  const performOrganisationSearch = async (value: string) => {
    setLoadingOrganisation(true);
    try {
      const url = new URL(
        window.location.origin + '/candidates/dropdowns/Employer'
      );
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '50');
      if (value.trim()) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      const responseData = (response as any).data || response;
      if (responseData && Array.isArray(responseData.data)) {
        const options = responseData.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setOrganisationOptions(options);
      } else if (responseData && Array.isArray(responseData)) {
        // Fallback if data is directly an array
        const options = responseData.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setOrganisationOptions(options);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganisationOptions([]);
    } finally {
      setLoadingOrganisation(false);
    }
  };

  const handleOrganisationSearch = useDebouncedCallback(
    performOrganisationSearch,
    300
  );

  const performLocationSearch = async (value: string) => {
    if (!value.trim()) {
      setLocationOptions([]);
      return;
    }

    setLoadingLocation(true);
    try {
      // Search candidates by current_location to get unique locations
      const searchFilters = { current_location: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      // Extract unique city names from the results
      const uniqueCities = new Set();
      const cityOptions: AsyncSelectOption[] = [];

      data.candidates.forEach(candidate => {
        const location = candidate.current_location;
        if (location) {
          // Extract city (last part after '/')
          const parts = location.split('/');
          const city = parts[parts.length - 1]?.trim();
          if (city && !uniqueCities.has(city)) {
            uniqueCities.add(city);
            cityOptions.push({
              value: city,
              label: city,
            });
          }
        }
      });

      setLocationOptions(cityOptions);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocationOptions([]);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleLocationSearch = useDebouncedCallback(performLocationSearch, 300);

  const performSkillSearch = async (value: string) => {
    if (!value.trim()) {
      setSkillOptions([]);
      return;
    }

    setLoadingSkills(true);
    try {
      // Search candidates by Skill to get unique skills
      const searchFilters = { Skill: value };
      const data = await applicantListAPI.fetchApplicants(1, 10, searchFilters);

      // Extract unique skills from the results
      const uniqueSkills = new Set();
      const skillOptions: AsyncSelectOption[] = [];

      data.candidates.forEach(candidate => {
        if (candidate.skills && Array.isArray(candidate.skills)) {
          candidate.skills.forEach(skill => {
            const skillName = skill.skill_name;
            if (skillName && !uniqueSkills.has(skillName)) {
              uniqueSkills.add(skillName);
              skillOptions.push({
                value: skillName,
                label: skillName,
              });
            }
          });
        }
      });

      setSkillOptions(skillOptions);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setSkillOptions([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSkillSearch = useDebouncedCallback(performSkillSearch, 300);

  const performNoticePeriodSearch = async (value: string) => {
    if (!value.trim()) {
      setNoticePeriodOptions([]);
      return;
    }

    setLoadingNoticePeriod(true);
    try {
      // Fetch candidates filtered by notice_period from /candidates/ API
      // But for partial search, fetch with no filter and filter client-side
      const data = await applicantListAPI.fetchApplicants(1, 50, {}); // fetch more for better matching
      // Extract unique notice periods from the results
      const uniqueNoticePeriods = new Set();
      const noticePeriodOptionsList: AsyncSelectOption[] = [];
      data.candidates.forEach(candidate => {
        const np = candidate.notice_period;
        if (np && !uniqueNoticePeriods.has(np)) {
          uniqueNoticePeriods.add(np);
          noticePeriodOptionsList.push({ value: np, label: np });
        }
      });
      // Filter options by partial match (case-insensitive)
      const filteredOptions = noticePeriodOptionsList.filter(opt =>
        opt.label.toLowerCase().includes(value.toLowerCase())
      );
      setNoticePeriodOptions(filteredOptions);
    } catch (error) {
      console.error('Error fetching notice periods:', error);
      setNoticePeriodOptions([]);
    } finally {
      setLoadingNoticePeriod(false);
    }
  };

  // Add this new function for createdBy search
  const performCreatedBySearch = async (value: string) => {
    if (!value.trim()) {
      setCreatedByOptions([]);
      return;
    }

    setLoadingCreatedBy(true);
    try {
      // Use the dedicated searchUsers function for better search experience
      const response = await apiCall<{
        users: {
          _id: string;
          username: string;
          display_name: string;
          email: string;
          first_name: string;
          last_name: string;
        }[];
      }>(`/users/?page=1&limit=10&search=${encodeURIComponent(value)}`);

      const users = response.data?.users || [];
      const createdByOptionsList: AsyncSelectOption[] = users.map(user => {
        // Create a display label with user's name
        const displayName =
          user.display_name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          user.username ||
          user.email;

        return {
          value: displayName,
          label: displayName,
        };
      });

      setCreatedByOptions(createdByOptionsList);
    } catch (error) {
      console.error('Error fetching created by users:', error);
      setCreatedByOptions([]);
    } finally {
      setLoadingCreatedBy(false);
    }
  };

  const handleNoticePeriodSearch = useDebouncedCallback(
    performNoticePeriodSearch,
    300
  );

  // Fetch payroll organization options
  const performPayrollOrgSearch = async (value: string) => {
    setLoadingPayrollOrg(true);
    try {
      const url = new URL(
        window.location.origin + '/candidates/dropdowns/Employer'
      );
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '50');
      if (value.trim()) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      const responseData = (response as any).data || response;
      if (responseData && Array.isArray(responseData.data)) {
        const options = responseData.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setPayrollOrgOptions(options);
      } else if (responseData && Array.isArray(responseData)) {
        // Fallback if data is directly an array
        const options = responseData.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setPayrollOrgOptions(options);
      }
    } catch (error) {
      console.error('Error fetching payroll organizations:', error);
      setPayrollOrgOptions([]);
    } finally {
      setLoadingPayrollOrg(false);
    }
  };

  const handlePayrollOrgSearch = useDebouncedCallback(
    performPayrollOrgSearch,
    300
  );

  // Fetch education type options
  const performEducationTypeSearch = async (value: string) => {
    setLoadingEducationType(true);
    try {
      const url = new URL(
        window.location.origin + '/candidates/dropdowns/EducationType'
      );
      url.searchParams.append('page', '1');
      url.searchParams.append('limit', '50');
      if (value.trim()) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      const responseData = (response as any).data || response;
      if (responseData && Array.isArray(responseData.data)) {
        const options = responseData.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setEducationTypeOptions(options);
      } else if (responseData && Array.isArray(responseData)) {
        // Fallback if data is directly an array
        const options = responseData.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setEducationTypeOptions(options);
      }
    } catch (error) {
      console.error('Error fetching education types:', error);
      setEducationTypeOptions([]);
    } finally {
      setLoadingEducationType(false);
    }
  };

  const handleEducationTypeSearch = useDebouncedCallback(
    performEducationTypeSearch,
    300
  );

  // Fetch skill category options
  const [skillCategoryOptions, setSkillCategoryOptions] = useState<AsyncSelectOption[]>([]);
  const [loadingSkillCategory, setLoadingSkillCategory] = useState(false);

  const performSkillCategorySearch = async (value: string) => {
    setLoadingSkillCategory(true);
    try {
      const response = await apiCall<any>(
        API_ENDPOINTS.CANDIDATES.DROPDOWNS('Skill Category') + (value ? `?search=${value}` : '')
      );
      const data = response.data?.data || response.data || [];
      const options = data.map((item: any) => ({
        value: item.label || item.name || item.value,
        label: item.label || item.name || item.value,
      }));
      setSkillCategoryOptions(options);
    } catch (error) {
      console.error('Error fetching skill categories:', error);
      setSkillCategoryOptions([]);
    } finally {
      setLoadingSkillCategory(false);
    }
  };

  const handleSkillCategorySearch = useDebouncedCallback(
    performSkillCategorySearch,
    300
  );

  // Initial fetch for empty search (to show default options)
  useEffect(() => {
    performPayrollOrgSearch('');
    performEducationTypeSearch('');
    performSkillCategorySearch('');
  }, []);

  // Add this new debounced callback for createdBy search
  const handleCreatedBySearch = useDebouncedCallback(
    performCreatedBySearch,
    300
  );

  // Filter fields configuration for Applicants
  const filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Applicants Name',
      type: 'async-select',
      placeholder: 'Search by Applicant name',
      asyncOptions: candidateSearchOptions,
      onAsyncSearch: handleCandidateSearch,
      loading: loadingCandidateSearch,
    },
    {
      key: 'candidateId',
      label: 'Applicant ID',
      type: 'async-select',
      placeholder: 'Search by Applicants ID',
      asyncOptions: candidateIdOptions,
      onAsyncSearch: handleCandidateIdSearch,
      loading: loadingCandidateId,
    },
    {
      key: 'panNumber',
      label: 'PAN Number',
      type: 'async-select',
      placeholder: 'Search by PAN number',
      asyncOptions: panNumberOptions,
      onAsyncSearch: handlePanNumberSearch,
      loading: loadingPanNumber,
    },
    {
      key: 'email',
      label: 'Email',
      type: 'async-select',
      placeholder: 'Search by email',
      asyncOptions: emailSearchOptions,
      onAsyncSearch: handleEmailSearch,
      loading: loadingEmailSearch,
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'async-select',
      placeholder: 'Search by phone',
      asyncOptions: phoneSearchOptions,
      onAsyncSearch: handlePhoneSearch,
      loading: loadingPhoneSearch,
    },
    {
      key: 'flagType',
      label: 'Flag Type',
      type: 'async-select',
      placeholder: 'Search Flag Type',
      asyncOptions: flagTypeOptions,
      onAsyncSearch: handleFlagTypeSearch,
      loading: false,
    },
    {
      key: 'organisation',
      label: 'Current Organisation',
      type: 'search-dropdown',
      placeholder: 'Search Organisation',
      asyncOptions: organisationOptions,
      onAsyncSearch: handleOrganisationSearch,
      loading: loadingOrganisation,
      isMulti: true,
    },
    {
      key: 'payrollOrg',
      label: 'Payroll Organisation',
      type: 'search-dropdown',
      placeholder: 'Search Payroll Org',
      asyncOptions: payrollOrgOptions,
      onAsyncSearch: handlePayrollOrgSearch,
      loading: loadingPayrollOrg,
      isMulti: true,
    },
    {
      key: 'educationType',
      label: 'Education Type',
      type: 'async-select',
      placeholder: 'Search Education Type',
      asyncOptions: educationTypeOptions,
      onAsyncSearch: handleEducationTypeSearch,
      loading: loadingEducationType,
    },
    {
      key: 'skillCategory',
      label: 'Skill Category',
      type: 'search-dropdown',
      placeholder: 'Search Skill Category',
      asyncOptions: skillCategoryOptions,
      onAsyncSearch: handleSkillCategorySearch,
      loading: loadingSkillCategory,
      isMulti: true,
    },
    {
      key: 'totalExperience',
      label: 'Total Experience',
      type: 'number-range',
      minKey: 'experienceMin',
      maxKey: 'experienceMax',
      minPlaceholder: 'Min',
      maxPlaceholder: 'Max',
    },
    {
      key: 'location',
      label: 'Current Location',
      type: 'async-select',
      placeholder: 'Search Location',
      asyncOptions: locationOptions,
      onAsyncSearch: handleLocationSearch,
      loading: loadingLocation,
    },
    {
      key: 'primarySkill',
      label: 'Primary Skills',
      type: 'search-dropdown',
      isMulti: true,
      placeholder: 'Search Primary Skills',
      asyncOptions: skillOptions,
      onAsyncSearch: handleSkillSearch,
      loading: loadingSkills,
    },
    {
      key: 'skills',
      label: 'Skills',
      type: 'async-select',
      placeholder: 'Search All Skills',
      asyncOptions: skillOptions,
      onAsyncSearch: handleSkillSearch,
      loading: loadingSkills,
    },
    {
      key: 'noticePeriod',
      label: 'Notice Period',
      type: 'async-select',
      placeholder: 'Search Notice Period',
      asyncOptions: noticePeriodOptions,
      onAsyncSearch: handleNoticePeriodSearch,
      loading: loadingNoticePeriod,
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'date',
    },
    {
      key: 'createdBy', // Add this new filter field
      label: 'Created By',
      type: 'async-select',
      placeholder: 'Search Created By',
      asyncOptions: createdByOptions,
      onAsyncSearch: handleCreatedBySearch,
      loading: loadingCreatedBy,
    },
  ];

  return (
    <>
      <PageLayout
        isLoading={loading || isValidating}
        header={
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <Text
                variant="h2"
                size="xl"
                weight="bold"
                className="text-gray-900"
              >
                Applicants
              </Text>

              <div className="flex items-center gap-3">
                {/* Candidate Search Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  icon="search"
                  iconPosition="left"
                  onClick={() => setShowCandidateSearchModal(true)}
                >
                  Search Candidates
                </Button>

                {/* New Applicant Button */}
                {canCreateCandidates && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="plus"
                    iconPosition="left"
                    onClick={handleNewApplicant}
                    disabled={!canCreateCandidates}
                    title={
                      !canCreateCandidates ? 'Feature not available' : undefined
                    }
                  >
                    New Applicant
                  </Button>
                )}
              </div>
            </div>
          </div>
        }
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search applicants..."
            searchDescription="Search by Applicant Name or ID or Phone or Email..."
            profileOptions={profileOptions}
            selectedProfile={activeTab}
            onProfileChange={handleTabChange}
            visibleColumns={visibleColumns}
            columnOptions={columnOptions}
            onColumnsChange={setVisibleColumns}
            onColumnsReset={handleColumnsReset}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onExport={handleExport}
            onSaveView={handleSaveView}
            canViewData={true}
          />
        }
        filtersPanel={
          showFilters ? (
            <div className="py-4">
              <FilterPanel
                fields={filterFields}
                values={localFilters}
                onValuesChange={setLocalFilters}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
                title="Filters"
                columns={4}
              />
            </div>
          ) : undefined
        }
        tabNav={
          <TabNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            hasSelectedItems={selectedRows.length > 0}
            // onDeleteSelected={
            //   canDeleteCandidates ? handleDeleteSelected : undefined
            // }
            // canDelete={canDeleteCandidates}
            customTabs={customTabs}
            pagination={{
              currentPage: currentPage,
              totalPages: totalPagesCount,
              onPageChange: handlePageChange,
              itemsPerPage: itemsPerPage,
              onItemsPerPageChange: setItemsPerPage,
              pageInfoFormat: (current, total) => `${current} of ${total}`,
            }}
          />
        }
      >
        <div className="space-y-4 h-full flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-500">Loading applicants...</div>
              </div>
            </div>
          ) : (
            <ExpandableDataTable
              columns={tableColumns}
              data={paginatedData}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              selectedRows={selectedRows}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              emptyMessage={`No ${activeTab} applicants found`}
              height="100%"
              maxHeight="100%"
              className="flex-1 min-h-0 flex flex-col"
              stickyColumns={2}
              showExpandColumn={false}
              expandable={{
                expandedRows: expandedRows,
                onToggleExpand: (id) => {
                  const stringId = String(id);
                  const newExpanded = new Set(expandedRows);
                  if (newExpanded.has(stringId)) {
                    newExpanded.delete(stringId);
                  } else {
                    newExpanded.add(stringId);
                  }
                  setExpandedRows(newExpanded);
                },
                renderExpanded: (row: ApplicantData) => {
                  const jobs = candidateJobs[row.candidate_id] || [];
                  const isLoadingJobs = candidateJobsLoading[row.candidate_id] || false;
                  const jobCols: TableColumn[] = [
                    {
                      key: 'job_id',
                      label: 'Job ID',
                      sortable: false,
                      width: '100px',
                      minWidth: '100px',
                      render: (value, row) => (
                        <div
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${row.detail_id || row.id}`);
                          }}
                        >
                          {row.job_id}
                        </div>
                      ),
                    },
                    {
                      key: 'job_title',
                      label: 'Job Title',
                      sortable: false,
                      width: '250px',
                      minWidth: '220px',
                      render: (value, row) => (
                        <div 
                          className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${row.detail_id || row.id}`);
                          }}
                        >
                          {row.job_title}
                        </div>
                      ),
                    },
                    {
                      key: 'client_name',
                      label: 'Client Name',
                      sortable: false,
                      width: '180px',
                      minWidth: '150px',
                    },
                    {
                      key: 'client_req_id',
                      label: 'Client Req ID',
                      sortable: false,
                      width: '130px',
                      minWidth: '120px',
                    },
                    {
                      key: 'preferred_job',
                      label: 'Preferred Job',
                      sortable: false,
                      width: '130px',
                      minWidth: '110px',
                    },
                    {
                      key: 'primary_skills',
                      label: 'Primary Skills',
                      sortable: false,
                      width: '250px',
                      minWidth: '200px',
                      render: (value: any) => {
                        let skills: string[] = [];
                        if (Array.isArray(value)) {
                          skills = value.flatMap(s => typeof s === 'string' ? s.split(',').map(item => item.trim()) : [String(s)]);
                        } else if (typeof value === 'string') {
                          skills = value.split(',').map(s => s.trim());
                        }
                        skills = skills.filter(Boolean);

                        if (skills.length === 0) return <span className="text-gray-400 font-medium text-[11px]">NA</span>;
                        
                        return (
                          <div className="flex flex-wrap gap-1" title={skills.join(', ')}>
                            {skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] whitespace-normal">
                                {skill}
                              </Badge>
                            ))}
                            {skills.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{skills.length - 3}</span>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      key: 'job_owner',
                      label: 'Job Owner',
                      sortable: false,
                      width: '150px',
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      sortable: false,
                      width: '120px',
                      render: (value) => (
                        <Badge variant={
                          value === 'Submitted' || value === 'Applied' ? 'info' :
                          value === 'Shortlisted' ? 'success' :
                          value === 'Rejected' ? 'danger' : 'secondary'
                        }>{value}</Badge>
                      )
                    },
                    {
                      key: 'mapped_by',
                      label: 'Mapped By',
                      sortable: false,
                      width: '150px',
                    },
                    {
                      key: 'mapped_date',
                      label: 'Mapped Date',
                      sortable: false,
                      width: '160px',
                      render: (value) => {
                        if (!value || value === '-') return '-';
                        try {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          });
                        } catch (e) {
                          return value;
                        }
                      }
                    },
                    // {
                    //   key: 'actions',
                    //   label: 'Actions',
                    //   sortable: false,
                    //   width: '80px',
                    //   minWidth: '80px',
                    //   render: (value, row) => (
                    //     <div className="flex justify-center">
                    //       <Button
                    //         variant="ghost"
                    //         size="sm"
                    //         onClick={(e) => {
                    //           e.stopPropagation();
                    //           setMappingToUnmap(row.id); // row.id is now mapping_id
                    //           setShowUnmapConfirmModal(true);
                    //         }}
                    //         className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-8 w-8 p-0"
                    //         title="Unmap Job"
                    //       >
                    //         <Icon name="unmap" size={18} />
                    //       </Button>
                    //     </div>
                    //   )
                    // }
                  ];

                  const subVisibleColumns: Record<string, boolean> = {};
                  jobCols.forEach(col => {
                    subVisibleColumns[col.key] = true;
                  });

                  return (
                    <NestedTableContent
                      title={`Jobs Related to Applicant ${row.candidate_name}`}
                      data={jobs}
                      columns={jobCols}
                      visibleColumns={subVisibleColumns}
                      emptyMessage="No jobs found for this applicant."
                      isLoading={isLoadingJobs}
                      selectedRows={selectedNestedRows}
                      onSelectAll={(selected) => handleSelectAllNested(jobs, selected)}
                      onSelectRow={handleSelectRowNested}
                      onUnmapSelected={handleUnmapNested}
                    />
                  );
                }
              }}
            />
          )}

          {/* Pagination moved to TabNavBar right side */}
          {/* <div className="bg-white rounded-lg shadow-sm border p-4">
                        <Text variant="span" className="text-gray-600 mb-2">
                            Debug Information:
                        </Text>
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>Active Tab: {activeTab}</p>
                            <p>Total Records: {sortedData.length}</p>
                            <p>Current Page: {currentPage} of {totalPages}</p>
                            <p>Selected: {selectedRows.length} items</p>
                            <p>Search: "{searchTerm}"</p>
                            <p>Active Filters: {Object.entries(filters).filter(([_, value]) => value !== null).length}</p>
                            <p>Modal States: NoSelection({showNoSelectionModal.toString()}), Confirm({showDeleteConfirmModal.toString()}), Result({showDeleteResultModal.toString()})</p>
                        </div>
                    </div> */}
        </div>
      </PageLayout>

      {/* Modals remain outside the layout */}
      <DeleteConfirmationModal
        showNoSelection={showNoSelectionModal}
        showConfirmDelete={showDeleteConfirmModal}
        showDeleteResult={showDeleteResultModal}
        deleteResultMessage={deleteResultMessage}
        selectedCount={selectedRows.length}
        deleting={deleting}
        onCloseNoSelection={() => setShowNoSelectionModal(false)}
        onCloseConfirmDelete={() => setShowDeleteConfirmModal(false)}
        onCloseDeleteResult={() => setShowDeleteResultModal(false)}
        onConfirmDelete={handleConfirmDelete}
      />

      {/* Duplicate Check Modal */}
      <DuplicateCheckModal
        isOpen={showDuplicateCheckModal}
        onClose={handleCloseDuplicateCheck}
        onContinue={handleContinueWithNewApplicant}
        onSelectExisting={handleSelectExistingCandidate}
      />

      <UnmapModal
        showNoSelection={false}
        showConfirmUnmap={showUnmapConfirmModal}
        showUnmapResult={showUnmapResultModal}
        unmapResultMessage={unmapResultMessage}
        selectedCount={mappingToUnmap ? 1 : selectedNestedRows.length}
        unmapping={unmapping}
        onCloseNoSelection={() => {}}
        onCloseConfirmUnmap={() => {
          setShowUnmapConfirmModal(false);
          setMappingToUnmap(null);
        }}
        onCloseUnmapResult={() => setShowUnmapResultModal(false)}
        onConfirmUnmap={confirmUnmap}
      />

      {/* Candidate Search Modal */}
      <CandidateSearchModal
        isOpen={showCandidateSearchModal}
        onClose={() => setShowCandidateSearchModal(false)}
        onSearch={handleAdvancedSearch}
      />
    </>
  );
};

export default Applicants;

const getHighestDegree = (education: any[]): string => {
  if (!education || !Array.isArray(education) || education.length === 0) {
    return 'Not specified';
  }

  // Sort by year_of_passing descending to get the most recent/highest degree
  const sortedEducation = [...education].sort((a, b) => {
    const yearA = a.year_of_passing || 0;
    const yearB = b.year_of_passing || 0;
    return yearB - yearA;
  });

  const highestDegree = sortedEducation[0];
  return highestDegree && highestDegree.highest_degree
    ? capitalizeAndSafe(highestDegree.highest_degree)
    : 'Not specified';
};

const capitalizeAndSafe = (
  str: string | null | undefined | number | any
): string => {
  // Convert to string first and handle null/undefined cases
  const stringValue = str == null ? '' : String(str);

  if (
    !stringValue ||
    stringValue.trim() === '' ||
    stringValue.toLowerCase() === 'n/a'
  )
    return '';
  return stringValue
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '0';
  }

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return '0';
  }

  // Format as currency with commas
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
