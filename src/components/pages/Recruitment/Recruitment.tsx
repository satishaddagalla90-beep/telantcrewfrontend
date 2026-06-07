import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import RequirementsAPI from '../../../utils/api/RecruitmentAPI';
import { RequirementListItem } from '../../../types/recruitment';
import { apiCall, API_ENDPOINTS, useSWR, clearNetCache } from '../../../utils/api';
import { mutate as globalMutate } from 'swr';
import { dropdownAPI } from '../../../utils/api/dropdowns';
import debounce from 'lodash/debounce';
import Header from '../../molecules/Header';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel, { FilterField } from '../../molecules/FilterPanel';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import UnmapModal from '../../molecules/UnmapModal';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import { AsyncSelectOption } from '../../atoms/AsyncSelect';
import { useURLPagination } from '../../../hooks';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Avatar from '../../atoms/Avatar/Avatar';
import Badge from '../../atoms/Badge';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Text from '../../atoms/Text';
import { usePermissions } from '../../../hooks/usePermissions';
import { formatUIDate } from '../../../utils/dateFormat';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../../utils/toast';

const Requirements: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Permissions (using job permissions for now, can be customized later)
  const { canReadJobs, canDeleteJobs } =
    usePermissions();

  // Standardized URL pagination hook
  const {
    currentPage,
    debouncedPage,
    limit: itemsPerPage,
    searchTerm,
    activeTab,
    setPage: setCurrentPage,
    setLimit: setItemsPerPage,
    setSearchTerm,
    setActiveTab,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
    defaultTab: 'all',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showNoSelectionModal, setShowNoSelectionModal] = useState(false);
  const [showUnmapConfirmModal, setShowUnmapConfirmModal] = useState(false);
  const [showUnmapResultModal, setShowUnmapResultModal] = useState(false);
  const [unmapResultMessage, setUnmapResultMessage] = useState('');
  const [unmapping, setUnmapping] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [mappingToUnmap, setMappingToUnmap] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // ── Dropdown option states ───────────────────────────────────────────────
  const [statusOptions, setStatusOptions] = useState<AsyncSelectOption[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);

  const [preferredJobOptions, setPreferredJobOptions] = useState<AsyncSelectOption[]>([]);
  const [preferredJobLoading, setPreferredJobLoading] = useState(false);

  const [clientOptions, setClientOptions] = useState<AsyncSelectOption[]>([]);
  const [clientLoading, setClientLoading] = useState(false);

  const [mapperOptions, setMapperOptions] = useState<AsyncSelectOption[]>([]);
  const [mapperLoading, setMapperLoading] = useState(false);

  const [ownerOptions, setOwnerOptions] = useState<AsyncSelectOption[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);

  // ── Generic loader for any recruitment dropdown ──────────────────────────
  const loadDropdown = useCallback(async (
    type: string,
    search: string,
    setOptions: React.Dispatch<React.SetStateAction<AsyncSelectOption[]>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);
    try {
      const options = await dropdownAPI.fetchRecruitmentDropdownSearchable(type, search);
      setOptions(options);
    } catch {
      /* silently ignore — empty options shown */
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Debounced search handlers ────────────────────────────────────────────
  const handleStatusSearch = useMemo(() => 
    debounce((search: string) => {
      loadDropdown('Status', search, setStatusOptions, setStatusLoading);
    }, 400), 
  [loadDropdown]);

  const handlePreferredJobSearch = useMemo(() => 
    debounce((search: string) => {
      loadDropdown('preferred_job', search, setPreferredJobOptions, setPreferredJobLoading);
    }, 400), 
  [loadDropdown]);

  const handleClientSearch = useMemo(() => 
    debounce((search: string) => {
      loadDropdown('Client', search, setClientOptions, setClientLoading);
    }, 400), 
  [loadDropdown]);

  const handleMapperSearch = useMemo(() => 
    debounce((search: string) => {
      loadDropdown('mapped_by', search, setMapperOptions, setMapperLoading);
    }, 400), 
  [loadDropdown]);

  const handleOwnerSearch = useMemo(() => 
    debounce((search: string) => {
      loadDropdown('job_owner', search, setOwnerOptions, setOwnerLoading);
    }, 400), 
  [loadDropdown]);

  // Cleanup debounced functions on unmount
  useEffect(() => {
    return () => {
      (handleStatusSearch as any).cancel();
      (handlePreferredJobSearch as any).cancel();
      (handleClientSearch as any).cancel();
      (handleMapperSearch as any).cancel();
      (handleOwnerSearch as any).cancel();
    }
  }, [handleStatusSearch, handlePreferredJobSearch, handleClientSearch, handleMapperSearch, handleOwnerSearch]);

  // ── Load all dropdowns once on mount ────────────────────────────────────
  useEffect(() => {
    loadDropdown('Status', '', setStatusOptions, setStatusLoading);
    loadDropdown('preferred_job', '', setPreferredJobOptions, setPreferredJobLoading);
    loadDropdown('Client', '', setClientOptions, setClientLoading);
    loadDropdown('mapped_by', '', setMapperOptions, setMapperLoading);
    loadDropdown('job_owner', '', setOwnerOptions, setOwnerLoading);
  }, [loadDropdown]);

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    mapping_id: true,
    applicant_name: true,
    phone: true,
    email: true,
    pan_no: true,
    skill_set: true,
    job_title: true,
    client_name: true,
    client_req_id: true,
    preferred_job: true,
    job_owner: true,
    status: true,
    mapped_by: true,
    mapped_date: true,
    last_viewed: true,
  });

  // Profile options for FilterBar
  const profileOptions = [
    { value: 'all', label: 'All Recruitment' },
    { value: 'active', label: 'Active' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'interviewed', label: 'Interviewed' },
    { value: 'selected', label: 'Selected' },
    { value: 'on_hold', label: 'On Hold' },
  ];

  // Custom tabs for TabNavBar
  const customTabs = [
    { id: 'all', label: 'All Recruitment' },
    { id: 'active', label: 'Active' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'interviewed', label: 'Interviewed' },
    { id: 'selected', label: 'Selected' },
  ];

  // Table columns configuration
  const tableColumns: TableColumn[] = [
    {
      key: 'mapping_id',
      label: 'Mapping ID',
      sortable: true,
      width: '200px',
      minWidth: '200px',
      render: (value, row: RequirementListItem) => (
        <div
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={() => navigate(`/requirements/${encodeURIComponent(row.mapping_id)}`)}
        >
          {row.mapping_id}
        </div>
      ),
    },
    {
      key: 'applicant_name',
      label: 'Applicant Name (ID)',
      sortable: true,
      width: '220px',
      minWidth: '200px',
      render: (value, row: RequirementListItem) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.applicant_name}</span>
          <span className="text-sm text-gray-500">({row.applicant_id})</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      width: '130px',
      minWidth: '130px',
      render: (value) => (
        <span className="text-sm">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email ID',
      sortable: true,
      width: '200px',
      minWidth: '180px',
      render: (value) => (
        <span className="text-sm">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'pan_no',
      label: 'PAN No',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value) => (
        <span className="text-sm font-mono">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'skill_set',
      label: 'Skill Set',
      sortable: false,
      width: '200px',
      minWidth: '180px',
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
                  <Badge key={idx} variant="secondary" size="sm">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <Badge variant="secondary" size="sm">
                    +{skills.length - 3}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-500">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'job_title',
      label: 'Job Title (Job ID)',
      sortable: true,
      width: '220px',
      minWidth: '200px',
      render: (value, row: RequirementListItem) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.job_title}</span>
          <span className="text-sm text-gray-500">({row.job_id})</span>
        </div>
      ),
    },
    {
      key: 'client_name',
      label: 'Client Name',
      sortable: true,
      width: '180px',
      minWidth: '160px',
      render: (value) => (
        <span className="text-sm">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'client_req_id',
      label: 'Client Req ID',
      sortable: true,
      width: '140px',
      minWidth: '140px',
      render: (value) => (
        <span className="text-sm font-mono">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'preferred_job',
      label: 'Prefered Job',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value) => (
        <div className="text-sm font-medium text-gray-700 capitalize">
          {value || 'N/A'}
        </div>
      ),
    },
    {
      key: 'job_owner',
      label: 'Job Owner',
      sortable: true,
      width: '150px',
      minWidth: '140px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm" fallback={value?.charAt(0) || 'O'} />
          <span className="text-sm">{value || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value) => {
        const statusVariants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
          active: 'info',
          submitted: 'warning',
          interviewed: 'secondary',
          selected: 'success',
          rejected: 'danger',
          on_hold: 'secondary',
        };
        return (
          <Badge variant={statusVariants[value?.toLowerCase()] || 'secondary'}>
            {value || 'N/A'}
          </Badge>
        );
      },
    },
    {
      key: 'mapped_by',
      label: 'Mapped By',
      sortable: true,
      width: '150px',
      minWidth: '140px',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm" fallback={value?.charAt(0) || 'U'} />
          <span className="text-sm">{value || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'mapped_date',
      label: 'Mapped Date',
      sortable: true,
      width: '130px',
      minWidth: '130px',
      render: (value) => (
        <span className="text-sm">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    // {
    //   key: 'last_viewed',
    //   label: 'Last Viewed',
    //   sortable: false,
    //   width: '180px',
    //   minWidth: '160px',
    //   render: (value: any[]) => {
    //     if (!value || value.length === 0) return <span className="text-sm text-gray-400">Never</span>;
    //     const lastView = value[value.length - 1];
    //     return (
    //       <div className="flex flex-col">
    //         <span className="text-sm font-medium text-gray-900">
    //           {lastView.last_viewed_by?.display_name || 'Anonymous'}
    //         </span>
    //         <span className="text-xs text-gray-500">
    //           {formatUIDate(lastView.last_viewed_on)}
    //         </span>
    //       </div>
    //     );
    //   },
    // },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '80px',
      minWidth: '80px',
      render: (value, row: RequirementListItem) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMappingToUnmap(row.id);
              setShowUnmapConfirmModal(true);
            }}
            className="p-1.5 text-gray-400 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-colors"
            title="Unmap candidate"
          >
            <Icon name="unmap" size={18} />
          </button>
        </div>
      ),
    },
  ];

  // Debounce the search term to avoid spamming the API
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build API URL for useSWR
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.append('page', debouncedPage.toString());
    params.append('limit', itemsPerPage.toString());

    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      params.append('search', debouncedSearchTerm.trim());
    }

    // Add other filters from the panel
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    // Handle Status priority: Filter Panel > Active Tab
    if (!appliedFilters.status && activeTab !== 'all') {
      params.append('status', activeTab);
    }

    return `${API_ENDPOINTS.RECRUITMENT.LIST}?${params.toString()}`;
  }, [debouncedPage, itemsPerPage, debouncedSearchTerm, activeTab, appliedFilters]);

  // Fetch data using useSWR for automatic revalidation ("the refresh thing")
  const { data: response, error, loading, isValidating, mutate, refetch } = useSWR<any>(
    apiUrl
  );

  // Transform and filter data (maintaining local filtering logic if API doesn't fully support it yet)
  const requirements = useMemo(() => {
    const apiData = Array.isArray(response) ? response : (response?.data || []);
    const items = Array.isArray(apiData) ? apiData : (apiData.Requirements || []);

    return items.map((item: any) => ({
      id: item.mapping_id, 
      mapping_id: item.mapping_id,
      applicant_id: item.applicant_id,
      applicant_name: item.applicant_name,
      phone: item.phone,
      email: item.email,
      pan_no: item.pan_number,
      skill_set: item.skills,
      job_id: item.job_id,
      job_title: item.job_title,
      client_name: item.client_name,
      client_req_id: item.client_requirement_id,
      job_type: item.job_type,
      preferred_job: item.preferred_job || item.candidate?.preferred_job || 'N/A',
      job_owner: item.job_owner,
      status: item.status || 'Submitted',
      mapped_by: item.mapped_by,
      mapped_date: item.mapped_date,
      last_viewed: item.last_viewed,
    }));
  }, [response]);

  const totalPages = useMemo(() => {
    // Broad check for total pages in different response structures
    const apiData = Array.isArray(response) ? null : response?.data;
    
    // 1. Check direct total_pages (most common)
    const tp = apiData?.total_pages || response?.total_pages || 
               apiData?.totalPages || response?.totalPages ||
               apiData?.pages || response?.pages;
               
    if (tp) return Number(tp);
    
    // 2. Fallback to calculating from total count if pages field is missing
    const totalItems = apiData?.total_requirements || response?.total_requirements || 
                       apiData?.total_records || response?.total_records ||
                       apiData?.total_mapping || response?.total_mapping ||
                       apiData?.total_count || response?.total_count ||
                       apiData?.totalResults || response?.totalResults ||
                       apiData?.total || response?.total ||
                       apiData?.count || response?.count ||
                       requirements.length;
                       
    return Math.ceil(Number(totalItems) / itemsPerPage) || 1;
  }, [response, requirements.length, itemsPerPage]);

  // Effects
  useEffect(() => {
    if (location.pathname === '/requirements') {
      mutate();
    }
  }, [location.pathname, mutate]);

  // Handlers
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Selection handlers for DataTable
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(requirements.map((r: RequirementListItem) => r.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows((prev) => {
      if (selected) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((rid) => rid !== id);
    });
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setShowFilters(false);
    setCurrentPage(1);
    mutate();
  };

  const clearFilters = () => {
    setFilters({});
    setAppliedFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleUnmap = async () => {
    if (selectedRows.length === 0 && !mappingToUnmap) {
      setShowNoSelectionModal(true);
      return;
    }
    setShowUnmapConfirmModal(true);
  };

  const confirmUnmap = async (reason: string) => {
    setUnmapping(true);
    try {
      if (mappingToUnmap) {
        // Single unmap
        await RequirementsAPI.unmapCandidate(mappingToUnmap, reason);
        setUnmapResultMessage('Successfully unmapped candidate');
      } else if (selectedRows.length > 0) {
        // Bulk unmap
        const promises = selectedRows.map(id => 
          RequirementsAPI.unmapCandidate(id, reason)
        );
        await Promise.all(promises);
        setUnmapResultMessage(`Successfully unmapped ${selectedRows.length} candidates`);
      }
      
      const unmappedIds = mappingToUnmap ? [mappingToUnmap] : selectedRows;
      
      // Optimistic update: instantly remove from the local list
      if (response) {
        const requirements = response.Requirements || [];
        const updatedRequirements = requirements.filter((item: any) => 
          !unmappedIds.includes(String(item.id)) && !unmappedIds.includes(String(item.mapping_id))
        );
        
        mutate({
          ...response,
          Requirements: updatedRequirements,
          total_requirements: Math.max(0, (response.total_requirements || 0) - (requirements.length - updatedRequirements.length))
        });
      }

      setSelectedRows([]);
      setMappingToUnmap(null);
      
      // Clear global caches and trigger refreshes
      clearNetCache();
      
      // Short delay before refetch to ensure backend has processed the change
      setTimeout(() => {
        refetch(true); // Explicitly refresh local table data
        globalMutate(() => true); // Support background sync for other pages
      }, 500);

      setShowUnmapResultModal(true);
    } catch (err) {
      setUnmapResultMessage('Failed to unmap candidates');
      setShowUnmapResultModal(true);
    } finally {
      setUnmapping(false);
      setShowUnmapConfirmModal(false);
    }
  };

  // Helper functions for export
  const exportToCSV = (data: any[], headers: string[], filename: string) => {
    try {
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.body.appendChild(document.createElement('a'));
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export failed:', err);
      showErrorToast('Failed to export CSV');
    }
  };

  const exportToExcel = (data: any[], headers: string[], filename: string) => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Recruitments');

      // Add basic formatting
      const colWidths = headers.map(() => ({ wch: 18 }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Excel export failed:', err);
      showErrorToast('Failed to export Excel');
    }
  };

  const handleExportAllData = async () => {
    setIsExportingAll(true);
    try {
      // Build API URL override for all data (no pagination limit)
      const params = new URLSearchParams();
      
      // Keep existing filters
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      if (!appliedFilters.status && activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (debouncedSearchTerm?.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      
      // Set high limit to fetch all data
      params.set('page', '1');
      params.set('limit', '10000');

      const response = await apiCall<any>(`${API_ENDPOINTS.RECRUITMENT.LIST}?${params.toString()}`);
      const apiData = Array.isArray(response) ? response : (response?.data || []);
      const items = Array.isArray(apiData) ? apiData : (apiData.Requirements || []);

      if (items.length === 0) {
        showInfoToast('No data found to export');
        return;
      }

      // Map data for export
      const exportData = items.map((item: any) => {
        const rowData: any = {};
        tableColumns.forEach(col => {
          let value = '';
          switch (col.key) {
            case 'mapping_id': value = item.mapping_id; break;
            case 'applicant_name': value = item.applicant_name; break;
            case 'phone': value = item.phone || ''; break;
            case 'email': value = item.email || ''; break;
            case 'pan_no': value = item.pan_number || ''; break;
            case 'skill_set': value = Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || ''); break;
            case 'job_title': value = `${item.job_title || ''} (${item.job_id || ''})`.trim(); break;
            case 'client_name': value = item.client_name; break;
            case 'job_type': value = item.job_type || ''; break;
            case 'job_owner': value = item.job_owner || ''; break;
            case 'status': value = item.status || 'Submitted'; break;
            case 'mapped_by': value = item.mapped_by || ''; break;
            case 'mapped_date': value = item.mapped_date ? new Date(item.mapped_date).toLocaleDateString() : ''; break;
            default: value = item[col.key] || '';
          }
          rowData[col.label] = value;
        });
        return rowData;
      });

      exportToExcel(exportData, tableColumns.map(c => c.label), `recruitment-full-${new Date().toISOString().split('T')[0]}.xlsx`);
      showSuccessToast(`Exported ${items.length} records successfully`);
    } catch (err) {
      console.error('Full export failed:', err);
      showErrorToast('Failed to export all data');
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleExport = (format: string) => {
    if (format === 'exportAll') {
      handleExportAllData();
      return;
    }

    if (requirements.length === 0) {
      showInfoToast('No data to export on current page');
      return;
    }

    // Map visible/current data for export
    const exportData = requirements.map((item: any) => {
      const rowData: any = {};
      tableColumns.forEach(col => {
        // Use labels as keys for Excel/CSV compatibility
        let value = item[col.key] || '';
        if (col.key === 'job_title') {
          value = `${item.job_title || ''} (${item.job_id || ''})`.trim();
        } else if (Array.isArray(value)) {
          value = value.join(', ');
        }
        rowData[col.label] = value;
      });
      return rowData;
    });

    const headers = tableColumns.map(col => col.label);
    const dateStr = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      exportToCSV(exportData, headers, `recruitment-page-${currentPage}-${dateStr}.csv`);
    } else if (format === 'excel') {
      exportToExcel(exportData, headers, `recruitment-page-${currentPage}-${dateStr}.xlsx`);
    }
  };

  // Column visibility changes handled via FilterBar onColumnsChange

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'search-dropdown',
      placeholder: 'Search status...',
      asyncOptions: statusOptions,
      onAsyncSearch: handleStatusSearch,
      loading: statusLoading,
    },
    {
      key: 'preferred_job',
      label: 'Prefered Job',
      type: 'search-dropdown',
      placeholder: 'Search Preferred Job...',
      asyncOptions: preferredJobOptions,
      onAsyncSearch: handlePreferredJobSearch,
      loading: preferredJobLoading,
    },
    {
      key: 'client',
      label: 'Client',
      type: 'search-dropdown',
      placeholder: 'Search client...',
      asyncOptions: clientOptions,
      onAsyncSearch: handleClientSearch,
      loading: clientLoading,
    },
    {
      key: 'mapped_by',
      label: 'Mapped By',
      type: 'search-dropdown',
      placeholder: 'Search user...',
      asyncOptions: mapperOptions,
      onAsyncSearch: handleMapperSearch,
      loading: mapperLoading,
    },
    {
      key: 'job_owner',
      label: 'Job Owner',
      type: 'search-dropdown',
      placeholder: 'Search owner...',
      asyncOptions: ownerOptions,
      onAsyncSearch: handleOwnerSearch,
      loading: ownerLoading,
    },
    {
      key: 'date_from',
      label: 'Date From',
      type: 'date',
    },
    {
      key: 'date_to',
      label: 'Date To',
      type: 'date',
    },
  ];

  // Derived visible columns calculated internally by DataTable using visibleColumns prop

  // Check if user has read access
  if (!canReadJobs) {
    return (
      <PageLayout header={<Header title="Recruitment" />}>
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
              You don't have permission to view recruitment records.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <>
      <PageLayout
        header={<Header title="Recruitment" />}
        isLoading={loading || isValidating}
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearch}
            selectedProfile={activeTab}
            profileOptions={profileOptions}
            onProfileChange={handleTabChange}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            onExport={handleExport}
            visibleColumns={visibleColumns}
            columnOptions={tableColumns.map((col) => ({ key: col.key, label: col.label }))}
            onColumnsChange={(cols) => setVisibleColumns(cols)}
            onColumnsReset={() => setVisibleColumns({
              mapping_id: true,
              applicant_name: true,
              phone: true,
              email: true,
              pan_no: true,
              skill_set: true,
              job_title: true,
              client_name: true,
              client_req_id: true,
              job_type: true,
              job_owner: true,
              status: true,
              mapped_by: true,
              mapped_date: true,
            })}
          />
        }
        filtersPanel={
          showFilters ? (
            <div className="py-4">
              <FilterPanel
                fields={filterFields}
                values={filters}
                onValuesChange={(values) => setFilters(values)}
                onApplyFilters={applyFilters}
                onClearFilters={clearFilters}
              />
            </div>
          ) : undefined
        }
        tabNav={
          <TabNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            customTabs={customTabs}
            hasSelectedItems={selectedRows.length > 0}
            canDelete={false}
            actionLabel="Unmap Selected"
            actionIcon="unmap"
            actionVariant="warning"
            onAction={handleUnmap}
            pagination={{
              currentPage: currentPage,
              totalPages: totalPages,
              onPageChange: setCurrentPage,
              itemsPerPage: itemsPerPage,
              onItemsPerPageChange: setItemsPerPage,
              pageInfoFormat: (current, total) => `${current} of ${total}`,
            }}
          />
        }
      >
        <div className="space-y-4 h-full flex flex-col">
          {/* Data Table */}
        <DataTable
          columns={tableColumns}
          data={requirements}
          visibleColumns={visibleColumns}
          loading={loading}
          selectedRows={selectedRows}
          onSelectAll={handleSelectAll}
          onSelectRow={handleSelectRow}
          onSort={handleSort}
          sortConfig={sortConfig || undefined}
          emptyMessage="No recruitment records found"
          height="100%"
          maxHeight="100%"
          className="flex-1 min-h-0 flex flex-col"
        />

        </div>
      </PageLayout>

      {/* Unmap Modal */}
      <UnmapModal
        showNoSelection={showNoSelectionModal}
        showConfirmUnmap={showUnmapConfirmModal}
        showUnmapResult={showUnmapResultModal}
        unmapResultMessage={unmapResultMessage}
        selectedCount={mappingToUnmap ? 1 : selectedRows.length}
        unmapping={unmapping}
        onCloseNoSelection={() => setShowNoSelectionModal(false)}
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

export default Requirements;