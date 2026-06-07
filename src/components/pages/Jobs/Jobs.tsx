import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../../utils/toast';
import { useJobs } from '../../../hooks/useJobs';
import { dropdownAPI } from '../../../utils/api/dropdowns';
import JobsAPI from '../../../utils/api/JobsAPI';
import { apiCall, API_ENDPOINTS, clearNetCache } from '../../../utils/api';
import { mutate as globalMutate } from 'swr';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel, { FilterField } from '../../molecules/FilterPanel';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import ExpandableDataTable from '../../molecules/DataTable/ExpandableDataTable';
import Header from '../../molecules/Header';
import RequirementsAPI from '../../../utils/api/RecruitmentAPI';
import UnmapModal from '../../molecules/UnmapModal';
import { getSimpleFlagColor, createFlagColorMap, getFlagColorFromMap } from '../../../utils/flagColors';
import DeleteConfirmationModal from '../../molecules/DeleteConfirmationModal';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import { AsyncSelectOption } from '../../atoms/AsyncSelect';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Avatar from '../../atoms/Avatar/Avatar';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import { usePermissions } from '../../../hooks/usePermissions';
import { useCountriesNowCitiesDropdown } from '../../../hooks/useCitiesDropdown';
import { JobListItem } from '../../../types/job';

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

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize permissions
  const { canReadJobs, canCreateJobs, canUpdateJobs, canDeleteJobs } =
    usePermissions();

  // Use the jobs hook
  const {
    jobs: jobsData,
    tabCounts,
    totalPages,
    loading,
    isValidating,
    error,
    currentPage,
    itemsPerPage,
    searchTerm,
    setSearchTerm,
    activeTab,
    filters,
    sortConfig,
    setCurrentPage,
    setLimit,
    handleTabChange,
    handleSort,
    handleFilterChange,
    clearFilters,
    refetch,
    deleteJobs,
  } = useJobs();

  // Revalidate when navigating back to this page from details/edit
  useEffect(() => {
    // Only refetch if we're on the jobs page (not on edit/new routes)
    if (location.pathname === '/jobs') {
      console.log('🔄 Refetching jobs list...');
      console.log('isValidating before refetch:', isValidating);
      refetch(true); // Pass true to use isValidating state for background refresh
    }
  }, [location.pathname]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Debug log for isValidating changes
  useEffect(() => {
    console.log('📊 isValidating state changed:', isValidating);
  }, [isValidating]);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showNoSelectionModal, setShowNoSelectionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteResultModal, setShowDeleteResultModal] = useState(false);
  const [deleteResultMessage, setDeleteResultMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [jobApplicants, setJobApplicants] = useState<Record<string, any[]>>({});
  const [jobApplicantsLoading, setJobApplicantsLoading] = useState<Record<string, boolean>>({});
  const [flagColorMap, setFlagColorMap] = useState<Record<string, string>>({});
  
  // Nested selection and unmap states
  const [selectedNestedRows, setSelectedNestedRows] = useState<string[]>([]);
  const [showUnmapConfirmModal, setShowUnmapConfirmModal] = useState(false);
  const [showUnmapResultModal, setShowUnmapResultModal] = useState(false);
  const [unmapResultMessage, setUnmapResultMessage] = useState('');
  const [unmapping, setUnmapping] = useState(false);
  const [mappingToUnmap, setMappingToUnmap] = useState<string | null>(null);

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

  const fetchJobApplicants = async (jobId: string) => {
    if (jobApplicants[jobId] !== undefined) return; // already cached
    setJobApplicantsLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const response = await apiCall<any>(API_ENDPOINTS.RECRUITMENT.JOB_APPLICANTS(jobId));
      const rawData = Array.isArray(response) ? response : (response?.data || []);
      
      // Map API fields to match table column keys provided by backend projection
      const mappedData = rawData.map((item: any) => {
        return {
          ...item,
          id: item.mapping_id, // For checkbox selection
          detail_id: item.id, // For navigation (candidate UUID)
          applicant_id: item.applicant_id,
          applicant_name: item.applicant_name,
          phone: item.phone?.toString() || '-',
          email: item.email || '-',
          pan_number: item.pan_number || '-',
          skill_set: Array.isArray(item.skill_set) ? item.skill_set.map((s: any) => s.skill_name || s) : [],
          primary_skills: item.primary_skill 
            ? (Array.isArray(item.primary_skill) 
                ? item.primary_skill.flat(Infinity).map((s: any) => String(s)).filter(Boolean) 
                : (item.primary_skill as string).split(',').map((s: any) => s.trim()).filter(Boolean))
            : [],
          status: item.status || 'Applied',
          mapped_by: item.mapped_by || '-',
          mapped_date: item.mapped_date || '-'
        };
      });

      setJobApplicants(prev => ({ ...prev, [jobId]: mappedData }));
    } catch (err) {
      console.error('Failed to fetch applicants for job', jobId, err);
      setJobApplicants(prev => ({ ...prev, [jobId]: [] }));
    } finally {
      setJobApplicantsLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // Async filter options state
  const [clientOptions, setClientOptions] = useState<AsyncSelectOption[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [ownerOptions, setOwnerOptions] = useState<AsyncSelectOption[]>([]);
  const [createdByOptions, setCreatedByOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [priorityOptions, setPriorityOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [statusOptions, setStatusOptions] = useState<AsyncSelectOption[]>([]);
  const [preferredJobOptions, setPreferredJobOptions] = useState<AsyncSelectOption[]>([]);
  const [clientRequirementOptions, setClientRequirementOptions] = useState<AsyncSelectOption[]>([]);
  const [skillCategoryOptions, setSkillCategoryOptions] = useState<AsyncSelectOption[]>([]);

  // Loading states
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingAssignees, setLoadingAssignees] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingPreferredJob, setLoadingPreferredJob] = useState(false);
  const [loadingClientRequirements, setLoadingClientRequirements] = useState(false);
  const [loadingSkillCategory, setLoadingSkillCategory] = useState(false);
  const [statusProfileOptions, setStatusProfileOptions] = useState<{ value: string; label: string }[]>([]);

  // Local state for filters before application
  const [localFilters, setLocalFilters] = useState<Record<string, string | string[] | null>>(filters);

  // Sync local filters when the main filters state changes (e.g. on clear)
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch status options for profile dropdown on mount
  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const options = await JobsAPI.getJobStatuses();
        setStatusProfileOptions(options);
      } catch (error) {
        console.error('Error fetching status options for profile dropdown:', error);
      }
    };
    fetchStatusOptions();
  }, []);

  const {
    options: locationOptions,
    loading: loadingLocations,
    search: searchLocations,
  } = useCountriesNowCitiesDropdown();

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    job_id: true,
    job_title: true,
    client_name: true,
    client_requirement_id: true,
    preferred_job: true,
    primary_skills: true,
    skill_category: true,
    job_location: true,
    job_status: true,
    client_bill_rate_period: true,
    bgc_type: true,
    job_owner: true,
    assigned_to: true,
    created_by: true,
    updated_by: true,
    created_date: true,
  });

  // Check if user has read access - simple fallback for now
  if (!canReadJobs) {
    return (
      <PageLayout header={<Header title="Jobs" />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="lock"
              size={48}
              className="text-gray-400 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-500">
              You don't have permission to view jobs.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Profile options for FilterBar
  const profileOptions = [
    { value: 'all', label: 'All Jobs' },
    ...statusProfileOptions,
  ];

  // Custom tabs for TabNavBar
  const customTabs = [
    {
      id: 'all',
      label: 'All Jobs',
    },
    {
      id: 'created',
      label: 'Created Jobs',
    },
    {
      id: 'assigned',
      label: 'Assigned Jobs',
    },
  ];

  // Table columns configuration
  const tableColumns: TableColumn[] = [
    {
      key: 'job_id',
      label: 'Job ID',
      headerRender: () => <div className="pl-10">Job ID</div>,
      sortable: true,
      width: '180px',
      minWidth: '180px',
      render: (value, row: JobListItem) => (
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
                  fetchJobApplicants(row.job_id);
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
            onClick={() => navigate(`/jobs/${row.id}`)}
          >
            {row.job_id}
          </div>
        </div>
      ),
    },
    {
      key: 'job_title',
      label: 'Job Title',
      sortable: true,
      width: '250px',
      minWidth: '220px',
      render: (value, row: JobListItem) => {
        const priority = typeof row.job_priority === 'object' && row.job_priority !== null
          ? (row.job_priority as any).name || (row.job_priority as any).label || JSON.stringify(row.job_priority)
          : row.job_priority;

        return (
          <div className="font-medium flex items-center gap-2">
            <span>{row.job_title}</span>
            {priority && (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(priority as string).toLowerCase() === 'high' || (priority as string).toLowerCase() === 'urgent'
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                  : (priority as string).toLowerCase() === 'medium'
                    ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                    : (priority as string).toLowerCase() === 'low'
                      ? 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                  }`}
              >
                {priority as string}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'skill_category',
      label: 'Skill Category',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value, row: JobListItem) => (
        <span className="text-sm font-medium text-gray-700">{row.skill_category || 'N/A'}</span>
      ),
    },
    {
      key: 'client_name',
      label: 'Client Name (MSP Name)',
      sortable: true,
      width: '200px',
      minWidth: '180px',
      render: (value, row: JobListItem) => {
        return (
          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">
                {typeof row.client_name === 'object' ? JSON.stringify(row.client_name) : row.client_name}
              </span>
              {row.end_client_name && (
                <span className="text-sm text-gray-500">
                  MSP: {row.end_client_name}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'client_requirement_id',
      label: 'Client Req ID',
      sortable: true,
      width: '130px',
      minWidth: '120px',
      render: (value, row: JobListItem) => (
        <span className="text-sm">{row.client_requirement_id || 'N/A'}</span>
      ),
    },
    {
      key: 'preferred_job',
      label: 'Prefered Job',
      sortable: true,
      width: '130px',
      minWidth: '120px',
      render: (value, row: JobListItem) => (
        <span className="text-sm font-medium text-gray-700">{row.preferred_job || 'N/A'}</span>
      ),
    },
    {
      key: 'primary_skills',
      label: 'Primary Skills',
      sortable: false,
      width: '200px',
      minWidth: '150px',
      render: (value, row: JobListItem) => {
        let skills: string[] = [];
        if (Array.isArray(row.primary_skills)) {
          skills = row.primary_skills.flatMap(s => typeof s === 'string' ? s.split(',').map(item => item.trim()) : [String(s)]);
        } else if (typeof row.primary_skills === 'string') {
          skills = (row.primary_skills as string).split(',').map(s => s.trim());
        }
        skills = skills.filter(Boolean);

        return (
          <div className="flex flex-wrap gap-1" title={skills.join(', ')}>
            {skills.length > 0 ? (
              <>
                {skills.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="info" size="sm">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <span className="text-sm text-gray-400">+{skills.length - 3}</span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'job_location',
      label: 'Job Location',
      sortable: true,
      width: '150px',
      minWidth: '150px',
    },
    {
      key: 'job_status',
      label: 'Job Status',
      sortable: true,
      width: '110px',
      minWidth: '110px',
      render: (value, row: JobListItem) => {
        const status = typeof row.job_status === 'object' && row.job_status !== null
          ? (row.job_status as any).name || (row.job_status as any).label || JSON.stringify(row.job_status)
          : row.job_status;

        return (
          <Badge
            variant={
              status === 'Active' || status === 'Open' || status === 'Filled'
                ? 'success'
                : status === 'Draft'
                  ? 'warning'
                  : status === 'On Hold'
                    ? 'secondary'
                    : status === 'Freeze'
                      ? 'danger'
                      : 'danger'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'client_bill_rate_period',
      label: 'Client Bill Rate / Period',
      sortable: true,
      width: '170px',
      minWidth: '160px',
      render: (value, row: JobListItem) => (
        <div className="text-sm flex items-end gap-x-0.5">
          <div className="font-medium">₹{row.client_bill_rate || 0}</div>
          <div className="text-gray-500 ">/{row.client_bill_period || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'bgc_type',
      label: 'BGC Type',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value, row: JobListItem) => {
        const bgcType = typeof row.bgc_type === 'object' && row.bgc_type !== null
          ? (row.bgc_type as any).name || (row.bgc_type as any).label || JSON.stringify(row.bgc_type)
          : row.bgc_type;
        return (
          <span className="text-sm">{bgcType || 'N/A'}</span>
        );
      },
    },
    {
      key: 'job_owner',
      label: 'Job Owner',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value, row: JobListItem) => {
        let ownerName = 'Unknown';
        if (typeof row.job_owner === 'string') {
          ownerName = row.job_owner;
        } else if (row.job_owner && typeof row.job_owner === 'object') {
          ownerName = row.job_owner.name || row.job_owner.id || 'Unknown';
        }

        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm" fallback={ownerName.charAt(0) || 'O'} />
            <span className="text-sm">{ownerName}</span>
          </div>
        );
      },
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      sortable: false,
      width: '150px',
      minWidth: '150px',
      render: (value, row: JobListItem) => {
        if (!row.assigned_to || row.assigned_to.length === 0) {
          return <span className="text-sm text-gray-500">Unassigned</span>;
        }

        // Get first assignee
        const firstAssignee = row.assigned_to[0];
        let firstName = 'Unknown';
        if (typeof firstAssignee === 'string') {
          firstName = firstAssignee;
        } else if (firstAssignee && typeof firstAssignee === 'object') {
          firstName = firstAssignee.name || firstAssignee.id || 'Unknown';
        }

        // Get all assignee names for tooltip
        const allAssigneeNames = row.assigned_to.map((assignee) => {
          if (typeof assignee === 'string') {
            return assignee;
          } else if (assignee && typeof assignee === 'object') {
            return assignee.name || assignee.id || 'Unknown';
          }
          return 'Unknown';
        }).join(', ');

        if (row.assigned_to.length === 1) {
          return (
            <div className="flex items-center gap-2">
              <Avatar size="sm" fallback={firstName.charAt(0) || 'U'} />
              <span className="text-sm">{firstName}</span>
            </div>
          );
        }

        return (
          <div className="group/assignee relative flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Avatar size="sm" fallback={firstName.charAt(0) || 'U'} />
              <span className="text-sm">{firstName}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-default">
                +{row.assigned_to.length - 1}
              </span>
            </div>
            {/* Tooltip on hover of this cell only */}
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover/assignee:block bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 pointer-events-none">
              {allAssigneeNames}
            </div>
          </div>
        );
      },
    },
    {
      key: 'created_by',
      label: 'Created By',
      sortable: true,
      width: '150px',
      minWidth: '150px',
      render: (value, row: JobListItem) => {
        const createdBy =
          row.created_by?.[0]?.name ||
          row.created_by?.[0]?.id ||
          (typeof row.created_by === 'string' ? row.created_by : 'Unknown');
        return (
          <div className="flex items-center gap-2">
            <Avatar size="sm" fallback={createdBy.charAt(0) || 'U'} />
            <span className="text-sm">{createdBy}</span>
          </div>
        );
      },
    },
    // {
    //   key: 'updated_by',
    //   label: 'Updated By',
    //   sortable: true,
    //   width: '150px',
    //   minWidth: '150px',
    //   render: (value, row: JobListItem) => {
    //     const updatedBy = typeof row.updated_by === 'string' ? row.updated_by : 'Unknown';
    //     return (
    //       <div className="flex items-center gap-2">
    //         <Avatar size="sm" fallback={updatedBy.charAt(0) || 'U'} />
    //         <span className="text-sm">{updatedBy}</span>
    //       </div>
    //     );
    //   },
    // },
    {
      key: 'created_date',
      label: 'Created Date',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value, row: JobListItem) =>
        new Date(row.created_date).toLocaleDateString(),
    },
  ];

  const columnOptions = tableColumns.map(col => ({
    key: col.key,
    label: col.label,
  }));

  // Event handlers
  const handleNewJob = () => {
    navigate('/add-job');
  };

  const handleRowClick = (job: JobListItem) => {
    navigate(`/jobs/${job.id}`);
  };

  const handleTabChangeLocal = (tab: string) => {
    handleTabChange(tab);
    setSelectedRows([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortLocal = (key: string) => {
    handleSort(key);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? jobsData.map((job: JobListItem) => job.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev =>
      checked ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      setShowNoSelectionModal(true);
    } else {
      setShowDeleteConfirmModal(true);
    }
  };

  const handleEditJob = (job: JobListItem) => {
    // Navigate to job detail page for now, since there's no dedicated edit page yet
    navigate(`/jobs/${job.id}`);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (selectedRows.length > 0) {
        await deleteJobs(selectedRows);
        showSuccessToast(`Successfully deleted ${selectedRows.length} jobs`);
        setSelectedRows([]);
      }
    } catch (err) {
      showErrorToast('Failed to delete jobs');
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
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
      setJobApplicants(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(jobId => {
          updated[jobId] = updated[jobId].filter(app => !unmappedIds.includes(app.mapping_id || app.id));
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
        `jobs-page-${currentPage}-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${data.length} jobs to CSV`);
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

      // Auto-size columns based on content
      const colWidths = headers.map(header => ({
        wch: Math.max(header.length, 12),
      }));
      worksheet['!cols'] = colWidths;

      // Style header row with background color
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          fill: { fgColor: { rgb: 'E5E7EB' } },
          font: { bold: true },
        };
      }

      // Generate Excel file and trigger download
      XLSX.writeFile(
        workbook,
        `jobs-page-${currentPage}-${new Date().toISOString().split('T')[0]}.xlsx`
      );
      
      showSuccessToast(`Exported ${data.length} jobs to Excel successfully`);
      console.log(`Exported ${data.length} jobs to Excel`);
    } catch (error) {
      console.error('Excel export error:', error);
      showErrorToast('Excel export failed');
    }
  };

  const handleExport = (format: string) => {
    try {
      // Get current page data (jobs displayed on current page)
      const currentPageJobs = jobsData;

      if (!currentPageJobs || currentPageJobs.length === 0) {
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
      const exportData = (currentPageJobs as JobListItem[]).map(job => {
        const rowData: any = {};
        exportColumns.forEach(col => {
          let value = '';

          // Extract clean data values (remove JSX/React components)
          switch (col.key) {
            case 'job_id':
              value = job.job_id || '';
              break;
            case 'job_title':
              value = job.job_title || '';
              break;
            case 'client_name':
              value = typeof job.client_name === 'object' ? JSON.stringify(job.client_name) : job.client_name || '';
              if (job.end_client_name) {
                value += ` (MSP: ${job.end_client_name})`;
              }
              break;
            case 'client_requirement_id':
              value = job.client_requirement_id || '';
              break;
            case 'job_location':
              value = job.job_location || '';
              break;
            case 'job_status':
              value = typeof job.job_status === 'object' && job.job_status !== null
                ? (job.job_status as any).name || (job.job_status as any).label || JSON.stringify(job.job_status)
                : job.job_status || '';
              break;
            case 'client_bill_rate_period':
              value = `₹${job.client_bill_rate || 0}/${job.client_bill_period || ''}`;
              break;
            case 'bgc_type':
              value = typeof job.bgc_type === 'object' && job.bgc_type !== null
                ? (job.bgc_type as any).name || (job.bgc_type as any).label || JSON.stringify(job.bgc_type)
                : job.bgc_type || '';
              break;
            case 'job_owner':
              value = typeof job.job_owner === 'string' 
                ? job.job_owner 
                : (job.job_owner as any)?.name || (job.job_owner as any)?.id || '';
              break;
            case 'assigned_to':
              if (job.assigned_to && job.assigned_to.length > 0) {
                value = job.assigned_to.map((assignee) => {
                  if (typeof assignee === 'string') return assignee;
                  if (assignee && typeof assignee === 'object') return (assignee as any).name || (assignee as any).id || '';
                  return '';
                }).join(', ');
              } else {
                value = 'Unassigned';
              }
              break;
            case 'created_by':
              value = job.created_by?.[0]?.name || job.created_by?.[0]?.id || 
                (typeof job.created_by === 'string' ? job.created_by : '');
              break;
            case 'created_date':
              value = job.created_date ? new Date(job.created_date).toLocaleDateString() : '';
              break;
            default:
              value = job[col.key as keyof JobListItem] ? String(job[col.key as keyof JobListItem]) : '';
          }

          rowData[col.label] = value;
        });
        return rowData;
      });

      // Execute export based on format
      switch (format) {
        case 'csv':
          exportToCSV(exportData, exportColumns.map(col => col.label));
          break;
        case 'excel':
          exportToExcel(exportData, exportColumns.map(col => col.label));
          break;
        default:
          console.log('Unknown export format:', format);
      }
    } catch (error) {
      console.error('Export error:', error);
      showErrorToast('Export failed. Please try again.');
    }
  };

  const handleSaveView = () => {
    console.log('Save view');
    // TODO: Implement save view functionality
  };

  const handleColumnsReset = () => {
    setVisibleColumns({
      job_id: true,
      job_title: true,
      client_name: true,
      client_requirement_id: true,
      job_location: true,
      job_status: true,
      client_bill_rate_period: true,
      bgc_type: true,
      job_owner: true,
      assigned_to: true,
      created_by: true,
      updated_by: true,
      created_date: true,
    });
  };

  const handleApplyFilters = () => {
    console.log('Apply filters:', localFilters);
    handleFilterChange(localFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    clearFilters();
    setShowFilters(false);
  };

  // Async search handlers for filters
  const handleClientSearch = async (value: string) => {
    setLoadingClients(true);
    try {
      const options = await JobsAPI.getJobDropdowns('Client', value);
      setClientOptions(options);
    } catch (error) {
      console.error('Error searching clients:', error);
      setClientOptions([]);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleAssigneeSearch = async (value: string) => {
    setLoadingAssignees(true);
    try {
      const options = await dropdownAPI.fetchJobsDropdownSearchable('Users', value);
      setAssigneeOptions(
        options.map(option => ({
          ...option,
          value: String(option.label),
        }))
      );
    } catch (error) {
      console.error('Error searching assignees:', error);
    } finally {
      setLoadingAssignees(false);
    }
  };

  const handleOwnerSearch = async (value: string) => {
    setLoadingOwners(true);
    try {
      const options = await dropdownAPI.fetchJobsDropdownSearchable('Users', value);
      setOwnerOptions(
        options.map(option => ({
          ...option,
          value: String(option.label),
        }))
      );
    } catch (error) {
      console.error('Error searching owners:', error);
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleCreatedBySearch = async (value: string) => {
    setLoadingCreatedBy(true);
    try {
      const options = await dropdownAPI.fetchJobsDropdownSearchable('Users', value);
      setCreatedByOptions(
        options.map(option => ({
          ...option,
          value: String(option.label),
        }))
      );
    } catch (error) {
      console.error('Error searching created by:', error);
    } finally {
      setLoadingCreatedBy(false);
    }
  };

  const handlePrioritySearch = async (value: string) => {
    setLoadingPriority(true);
    try {
      const options = await JobsAPI.getJobPriorities(value);
      setPriorityOptions(options);
    } catch (error) {
      console.error('Error searching priorities:', error);
    } finally {
      setLoadingPriority(false);
    }
  };

  const handleStatusSearch = async (value: string) => {
    setLoadingStatus(true);
    try {
      const options = await JobsAPI.getJobStatuses(value);
      setStatusOptions(options);
    } catch (error) {
      console.error('Error searching statuses:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePreferredJobSearch = async (value: string) => {
    setLoadingPreferredJob(true);
    try {
      const options = await JobsAPI.getJobPreferences(value);
      setPreferredJobOptions(options);
    } catch (error) {
      console.error('Error searching preferred jobs:', error);
    } finally {
      setLoadingPreferredJob(false);
    }
  };

  const handleClientRequirementSearch = async (value: string) => {
    if (!value || value.length < 1) return;
    setLoadingClientRequirements(true);
    try {
      const response = await JobsAPI.getJobs({
        filters: { client_requirement_id: [value] },
        limit: 50
      });

      const ids = response.Job
        .map(job => job.client?.client_requirement_id)
        .filter(Boolean) as string[];

      const uniqueIds = Array.from(new Set(ids));
      setClientRequirementOptions(uniqueIds.map(id => ({ value: id, label: id })));
    } catch (error) {
      console.error('Error searching client requirements:', error);
    } finally {
      setLoadingClientRequirements(false);
    }
  };

  const handleSkillCategorySearch = async (value: string) => {
    setLoadingSkillCategory(true);
    try {
      const options = await JobsAPI.getSkillCategories(value);
      setSkillCategoryOptions(options);
    } catch (error) {
      console.error('Error searching skill categories:', error);
      setSkillCategoryOptions([]);
    } finally {
      setLoadingSkillCategory(false);
    }
  };

  const handleLocationSearch = (value: string) => {
    searchLocations(value);
  };

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      key: 'job_status',
      label: 'Job Status',
      type: 'async-select',
      placeholder: 'Search Status',
      asyncOptions: statusOptions,
      onAsyncSearch: handleStatusSearch,
      loading: loadingStatus,
    },
    {
      key: 'job_priority',
      label: 'Priority',
      type: 'async-select',
      placeholder: 'Search Priority',
      asyncOptions: priorityOptions,
      onAsyncSearch: handlePrioritySearch,
      loading: loadingPriority,
    },
    {
      key: 'preferred_job',
      label: 'Prefered Job',
      type: 'async-select',
      placeholder: 'Search Preferred Job',
      asyncOptions: preferredJobOptions,
      onAsyncSearch: handlePreferredJobSearch,
      loading: loadingPreferredJob,
    },
    {
      key: 'client_name',
      label: 'Client Name',
      type: 'async-select',
      placeholder: 'Search Client',
      asyncOptions: clientOptions,
      onAsyncSearch: handleClientSearch,
      loading: loadingClients,
    },
    {
      key: 'client_requirement_id',
      label: 'Client Req ID',
      type: 'async-select',
      placeholder: 'Search Req ID',
      asyncOptions: clientRequirementOptions,
      onAsyncSearch: handleClientRequirementSearch,
      loading: loadingClientRequirements,
    },
    {
      key: 'job_location',
      label: 'Job Location',
      type: 'search-dropdown',
      placeholder: 'Search Location',
      asyncOptions: [{ label: 'PAN India', value: 'PAN India' }, ...(locationOptions || [])],
      onAsyncSearch: handleLocationSearch,
      loading: loadingLocations,
      isMulti: true,
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      type: 'async-select',
      placeholder: 'Search Assignee',
      asyncOptions: assigneeOptions,
      onAsyncSearch: handleAssigneeSearch,
      loading: loadingAssignees,
    },
    {
      key: 'job_owner',
      label: 'Job Owner',
      type: 'async-select',
      placeholder: 'Search Owner',
      asyncOptions: ownerOptions,
      onAsyncSearch: handleOwnerSearch,
      loading: loadingOwners,
    },
    {
      key: 'created_by',
      label: 'Created By',
      type: 'async-select',
      placeholder: 'Search Creator',
      asyncOptions: createdByOptions,
      onAsyncSearch: handleCreatedBySearch,
      loading: loadingCreatedBy,
    },
    {
      key: 'skill_category',
      label: 'Skill Category',
      type: 'async-select',
      placeholder: 'Search Skill Category',
      asyncOptions: skillCategoryOptions,
      onAsyncSearch: handleSkillCategorySearch,
      loading: loadingSkillCategory,
    },
  ];

  if (error) {
    return (
      <PageLayout
        header={
          <Header
            title="Jobs"
            showNewRecordButton={canCreateJobs}
            newRecordButtonText="New Job"
            newRecordButtonIcon="plus"
            onNewRecord={handleNewJob}
          />
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="alert"
              size={48}
              className="text-red-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Jobs
            </h3>
            <p className="text-gray-500 mb-4">
              {error.message || 'Unable to load jobs. Please try again.'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              <Icon name="loading" size={16} className="mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        isLoading={loading || isValidating}
        header={
          <Header
            title="Jobs"
            showNewRecordButton={canCreateJobs}
            newRecordButtonText="New Job"
            newRecordButtonIcon="plus"
            disableNewRecord={false}
            onNewRecord={handleNewJob}
            refreshInterval={0}
          />
        }
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search jobs..."
            searchDescription="Search by Job Title or Client Name or Job Owner"

            profileOptions={profileOptions}
            selectedProfile={activeTab}
            onProfileChange={handleTabChangeLocal}
            visibleColumns={visibleColumns}
            columnOptions={columnOptions}
            onColumnsChange={setVisibleColumns}
            onColumnsReset={handleColumnsReset}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            onExport={handleExport}
            onSaveView={handleSaveView}
            canViewData={canReadJobs}
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
            onTabChange={handleTabChangeLocal}
            hasSelectedItems={selectedRows.length > 0}
            // onDeleteSelected={handleDeleteSelected}
            // canDelete={canDeleteJobs}
            customTabs={customTabs}
            pagination={{
              currentPage: currentPage,
              totalPages: totalPages,
              onPageChange: handlePageChange,
              itemsPerPage: itemsPerPage,
              onItemsPerPageChange: setLimit,
              pageInfoFormat: (current, total) => `${current} of ${total}`,
            }}
          />
        }
      >
        <div className="space-y-4  h-full flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-500">Loading jobs...</div>
              </div>
            </div>
          ) : (
            <ExpandableDataTable
              columns={tableColumns}
              data={jobsData}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSortLocal}
              selectedRows={selectedRows}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              emptyMessage={`No ${activeTab} jobs found`}
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
                renderExpanded: (row: JobListItem) => {
                  const applicants = jobApplicants[row.job_id] || [];
                  const isLoadingApplicants = jobApplicantsLoading[row.job_id] || false;
                  const applicantCols: TableColumn[] = [
                    {
                      key: 'applicant_id',
                      label: 'Applicant ID',
                      sortable: false,
                      width: '120px',
                      minWidth: '120px',
                      render: (value, row) => (
                        <div
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors"
                          onClick={(e) => {
                            navigate(`/applicants/${row.detail_id || row.id}`);
                          }}
                        >
                          {row.applicant_id}
                        </div>
                      ),
                    },
                    {
                      key: 'applicant_name',
                      label: 'Applicant Name',
                      sortable: false,
                      width: '200px',
                      minWidth: '180px',
                      render: (value, row) => (
                        <div
                          className="flex items-center cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/applicants/${row.detail_id || row.id}`);
                          }}
                        >
                          {row.applicant_name}
                        </div>
                      ),
                    },
                    {
                      key: 'phone',
                      label: 'Phone',
                      sortable: false,
                      width: '140px',
                      minWidth: '120px',
                    },
                    {
                      key: 'email',
                      label: 'Email ID',
                      sortable: false,
                      width: '200px',
                      minWidth: '180px',
                    },
                    {
                      key: 'pan_number',
                      label: 'PAN Number',
                      sortable: false,
                      width: '130px',
                      minWidth: '120px',
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

                        return (
                          <div className="flex flex-wrap gap-1" title={skills.join(', ')}>
                            {skills.length > 0 ? (
                              <>
                                {skills.slice(0, 3).map((skill, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[10px] whitespace-normal">
                                    {skill}
                                  </Badge>
                                ))}
                                {skills.length > 3 && (
                                  <span className="text-[10px] text-gray-400">+{skills.length - 3}</span>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-400">N/A</span>
                            )}
                          </div>
                        );
                      }
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
                    //         title="Unmap Candidate"
                    //       >
                    //         <Icon name="unmap" size={18} />
                    //       </Button>
                    //     </div>
                    //   )
                    // }
                  ];
                  
                  // Create visible columns object (all true for simplicity in nested view)
                  const subVisibleColumns: Record<string, boolean> = {};
                  applicantCols.forEach(col => {
                    subVisibleColumns[col.key] = true;
                  });
                  
                  return (
                    <NestedTableContent
                      title={`Applicants Related to Job ${row.job_id}`}
                      data={applicants}
                      columns={applicantCols}
                      visibleColumns={subVisibleColumns}
                      emptyMessage="No applicants found for this job."
                      isLoading={isLoadingApplicants}
                      selectedRows={selectedNestedRows}
                      onSelectAll={(selected) => handleSelectAllNested(applicants, selected)}
                      onSelectRow={handleSelectRowNested}
                      onUnmapSelected={handleUnmapNested}
                    />
                  );
                }
              }}
            />
          )}

          {/* Pagination moved to TabNavBar right side */}
        </div>
      </PageLayout>

      {/* Delete Confirmation Modals */}
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

      <UnmapModal
        showNoSelection={false} // Handled by its own showNoSelectionModal if needed, but UnmapModal can do it
        showConfirmUnmap={showUnmapConfirmModal}
        showUnmapResult={showUnmapResultModal}
        unmapResultMessage={unmapResultMessage}
        selectedCount={mappingToUnmap ? 1 : selectedNestedRows.length}
        unmapping={unmapping}
        onCloseNoSelection={() => { }}
        onCloseConfirmUnmap={() => {
          setShowUnmapConfirmModal(false);
          setMappingToUnmap(null);
        }}
        onCloseUnmapResult={() => setShowUnmapResultModal(false)}
        onConfirmUnmap={confirmUnmap}
      />
    </>
  );
};

export default Jobs;
