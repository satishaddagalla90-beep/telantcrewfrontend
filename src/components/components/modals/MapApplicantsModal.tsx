import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import ExpandableDataTable from '../../molecules/DataTable/ExpandableDataTable';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import {
  applicantListAPI,
  CandidateAPIResponse,
} from '../../../utils/api/ApplicantListView';
import { CandidateData } from '../../../types/candidate';
import { useURLPagination } from '../../../hooks';
import { useSWR, API_ENDPOINTS, apiCall } from '../../../utils/api';
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
import { useAuth } from '../../../components/auth/AuthContext';

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
  skills: {
    skill_name: string;
    expertise: string;
    rating: number;
    experience: number;
  }[];
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
}

// Utility functions synchronized with Applicants.tsx
const capitalizeAndSafe = (str: any): string => {
  const stringValue = str == null ? '' : String(str);
  if (!stringValue || stringValue.trim() === '' || stringValue.toLowerCase() === 'n/a') return '';
  return stringValue.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getHighestDegree = (education: any[]): string => {
  if (!education || !Array.isArray(education) || education.length === 0) return 'Not specified';
  const sortedEducation = [...education].sort((a, b) => (b.year_of_passing || 0) - (a.year_of_passing || 0));
  const highestDegree = sortedEducation[0];
  return highestDegree && highestDegree.highest_degree ? capitalizeAndSafe(highestDegree.highest_degree) : 'Not specified';
};

const extractCityFromLocation = (locationString: string): string => {
  if (!locationString || typeof locationString !== 'string') return '';
  const parts = locationString.split('/');
  return parts[parts.length - 1]?.trim() || locationString.trim();
};


interface MapApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  job_id: string;
  jobTitle?: string;
  onMapped: (selectedApplicants: ApplicantData[]) => void;
}

const MapApplicantsModal: React.FC<MapApplicantsModalProps> = ({
  isOpen,
  onClose,
  jobId,
  job_id,
  jobTitle,
  onMapped,
}) => {
  const navigate = useNavigate();
  const { canReadCandidates, canCreateCandidates } = usePermissions();
  const { user } = useAuth();
  const [isMapping, setIsMapping] = useState(false);

  // Initialize state
  // expandedRows is fine being local
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showDuplicateCheckModal, setShowDuplicateCheckModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Fetch static dropdown data
  const { flagsOptions, loading: loadingStaticDropdowns } =
    useStaticDropdowns();

  // Dynamic flags metadata
  const [flagColorMap, setFlagColorMap] = useState<Record<string, string>>({});

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

    if (isOpen) {
      fetchFlagsMeta();
    }
    return () => {
      mounted = false;
    };
  }, [isOpen]);


  // URL-based pagination
  const {
    currentPage,
    debouncedPage,
    limit: itemsPerPage,
    searchTerm,
    debouncedSearchTerm,
    setPage: setCurrentPage,
    setLimit: setItemsPerPage,
    setSearchTerm,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
  });

  // Build API URL with searchTerm and activeTab
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    params.append('page', debouncedPage.toString());
    params.append('limit', itemsPerPage.toString());

    const appendSmartSearchParam = (
      searchParams: URLSearchParams,
      searchVal: string
    ) => {
      const term = searchVal.trim();
      if (!term) return;

      // Detection rules
      const isPanLike = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(term);
      
      const isCandidateId =
        !isPanLike && // Don't treat PAN as ID
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
        // PAN numbers and other strings go here
        searchParams.append('search', term);
      }
    };

    if (debouncedSearchTerm.trim()) {
      appendSmartSearchParam(params, debouncedSearchTerm);
    }


    return `${API_ENDPOINTS.CANDIDATES.LIST}?${params.toString()}`;
  }, [debouncedPage, itemsPerPage, debouncedSearchTerm]);

  // Fetch candidates - pagination happens here per page
  const { data: candidatesResponse, loading } = useSWR<CandidateAPIResponse>(
    isOpen ? apiUrl : null
  );

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'created',
    direction: 'desc',
  });

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    candidate_id: true,
    candidate_name: true,
    phone: true,
    email: true,
    pan_number: true,
  });

  // Transform candidate data to match Applicants.tsx structure
  const transformCandidateData = useCallback((candidate: CandidateData): ApplicantData => {
    const currentJob = candidate.employment?.find(emp => emp.is_current_job === true);
    let latestJob = null;
    if (candidate.employment && candidate.employment.length > 0) {
      latestJob = [...candidate.employment].sort((a, b) => {
        const dateA = a.from_date ? new Date(a.from_date).getTime() : 0;
        const dateB = b.from_date ? new Date(b.from_date).getTime() : 0;
        return dateB - dateA;
      })[0];
    }
    const relevantJob = currentJob || latestJob;

    return {
      id: candidate.id.toString(),
      flag: candidate.source_details?.flags?.[0] || '',
      candidate_id: candidate.candidate_id,
      candidate_name: getDisplayName(candidate),
      phone: candidate.phone?.toString() || '',
      email: candidate.email || '',
      current_organization: relevantJob?.organization_name || candidate.current_organisation || '',
      payroll_organisation: relevantJob?.payroll_organization || '',
      total_experience: candidate.total_experience?.toString() || '0',
      relevant_experience: candidate.relevant_experience?.toString() || '0',
      pan_number: candidate.pan_number || '',
      current_location: extractCityFromLocation(candidate.current_location || ''),
      preffered_location: extractCityFromLocation(candidate.preferred_location || ''),
      degree: getHighestDegree(candidate.education),
      skills: candidate.skills?.map((skill: any) => ({
        skill_name: capitalizeAndSafe(skill.skill_name),
        expertise: capitalizeAndSafe(skill.expertise),
        rating: skill.rating,
        experience: skill.experience,
      })) || [],
      notice_period: candidate.notice_period || '',
      current_ctc: formatCurrency(candidate.current_ctc),
      expected_ctc: formatCurrency(candidate.expected_ctc),
      resume: candidate.resume_url || '',
      linkedin_profile: candidate.linkedin_profile || '',
      created_by: candidate.created_by ? capitalizeAndSafe(candidate.created_by) : '',
      created: candidate.created ? new Date(candidate.created).toLocaleDateString('en-GB') : '',
      last_updated_by_user: candidate.updated_by ? capitalizeAndSafe(candidate.updated_by) : '',
      last_updated_by_candidate: candidate.updated ? new Date(candidate.updated).toLocaleDateString('en-GB') : '',
      status: candidate.is_active ? 'active' : 'inactive',
      is_actively_looking: candidate.source_details?.is_actively_looking || false,
    };
  }, []);

  // Get paginated and transformed data
  const paginatedData = useMemo(() => {
    return (candidatesResponse?.candidates || []).map(transformCandidateData);
  }, [candidatesResponse, transformCandidateData]);

  const totalCount = candidatesResponse?.total_candidates || 0;
  const totalPagesCount = Math.ceil(totalCount / itemsPerPage);

  // Helper function for display name
  const getDisplayName = (candidate: CandidateData): string => {
    if (candidate.display_name && candidate.display_name.trim()) {
      return candidate.display_name.trim();
    }

    const firstName = candidate.first_name?.trim() || '';
    const middleName = (candidate as any).middle_name?.trim() || '';
    const lastName = candidate.last_name?.trim() || '';

    const nameParts = [firstName, middleName, lastName].filter(
      (part) => part !== ''
    );
    return nameParts.length > 0 ? nameParts.join(' ') : 'N/A';
  };


  // Table columns - matching Applicants.tsx exactly
  const tableColumns: TableColumn[] = [
    {
      key: 'candidate_id',
      label: 'Applicants ID',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value, row) => (
        <div 
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            navigate(`/applicants/${row.id}`);
          }}
        >
          {value}
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
            onClick={(e) => {
              e.stopPropagation();
              onClose();
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon name="attachment" size={16} />
                </a>
              )}
              <span>{value}</span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {isActiveLooking && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
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
                  onClick={(e) => e.stopPropagation()}
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
      label: 'Email',
      sortable: true,
      width: '220px',
      minWidth: '200px',
    },
    {
      key: 'pan_number',
      label: 'PAN Number',
      sortable: true,
      width: '120px',
      minWidth: '120px',
    },
  ];

  // Event handlers

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(
      selected ? (paginatedData as ApplicantData[]).map(item => item.id) : []
    );
  };

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectExistingCandidate = (candidate: any) => {
    setShowDuplicateCheckModal(false);
    onClose();
    // Navigate to the candidate profile as per Applicants.tsx behavior
    navigate(`/applicants/${candidate.id}`);
  };

  const handleMapApplicants = async () => {
    if (selectedRows.length === 0) {
      showWarningToast('Please select at least one applicant');
      return;
    }

    const selectedApplicants = paginatedData.filter(app =>
      selectedRows.includes(app.id)
    );

    setIsMapping(true);
    try {
      let successCount = 0;
      let alreadyMappedCount = 0;
      
      for (const app of selectedApplicants) {
        try {
          // Use the readable candidate ID (e.g. A-000123) rather than the internal UUID
          const candidateId = app.candidate_id || app.id;
          
          const response = await apiCall<{ data: any; error?: any }>(
            API_ENDPOINTS.RECRUITMENT.MAP,
            {
              method: 'POST',
              body: JSON.stringify({
                candidate_id: candidateId,
                job_id: job_id, // Use human readable ID (e.g. JOB-5005) from props
                mapped_by: user?.id || user?._id || '',
              }),
              showToaster: false, // Handle toasts manually for better precision
            }
          );
          
          if (response && !(response as any).error) {
            successCount++;
          } else {
            const errorMsg = response?.error?.message || "";
            if (errorMsg.toLowerCase().includes('already mapped')) {
              showWarningToast('Candidate already mapped to this job');
              alreadyMappedCount++;
            } else {
              // Show generic error for other failure reasons
              showErrorToast(errorMsg || `Failed to map ${app.candidate_name}`);
            }
          }
        } catch (err) {
          console.error(`Failed to map candidate ${app.candidate_name}:`, err);
        }
      }

      if (successCount > 0) {
        onMapped(selectedApplicants);
        onClose();
        showSuccessToast(`${successCount} applicant(s) mapped successfully!`);
        // Navigate to recruitment page with refresh
        navigate('/requirements');
      } else if (alreadyMappedCount === 0) {
        // Only show general failure if no "already mapped" warnings were shown
        showErrorToast('Failed to map selected applicants. Please try again.');
      }
    } catch (err) {
      console.error('Error in mapping process:', err);
      showErrorToast('An unexpected error occurred while mapping candidates.');
    } finally {
      setIsMapping(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Map Applicants to Job {job_id}
              </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon name="close" size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Search Bar */}
              <div className="border-b border-gray-200 px-6 py-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search applicants by name, ID, phone, or email..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>


            {/* Table */}
            <div className="flex-1 overflow-hidden flex flex-col">
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
                  emptyMessage="No applicants found"
                  height="100%"
                  maxHeight="100%"
                  className="flex-1 min-h-0 flex flex-col"
                  showExpandColumn={false}
                  stickyColumns={2}
                />
              )}
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPagesCount || 1} | Total: {totalCount} applicants
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPagesCount}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                {selectedRows.length} applicant(s) selected
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={onClose} disabled={isMapping}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMapApplicants}
                  disabled={selectedRows.length === 0 || isMapping}
                >
                  {isMapping ? 'Mapping...' : 'Map Applicants'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MapApplicantsModal;
