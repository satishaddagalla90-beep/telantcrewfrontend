import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../../molecules/Header';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel from '../../molecules/FilterPanel';
import type { FilterField } from '../../molecules/FilterPanel';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import DeleteConfirmationModal from '../../molecules/DeleteConfirmationModal';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import { AsyncSelectOption } from '../../atoms/AsyncSelect';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Avatar from '../../atoms/Avatar/Avatar';
import Modal from '../../atoms/Modal/Modal';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon/Icon';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import SelectField from '../../atoms/SelectField/SelectField';
import AccessDenied from '../../molecules/AccessDenied/AccessDenied';
import Badge from '../../atoms/Badge';
import {
  useSWR,
  apiCall,
  API_ENDPOINTS,
  User,
  UsersResponse,
} from '../../../utils/api';
import { useURLPagination } from '../../../hooks';
import { usersAPI } from '../../../utils/api/UsersAPI';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '../../../utils/toast';
import {
  useDropdownData,
  useDesignationsDropdown,
  useUserStatusOptions,
} from '../../../hooks/useDropdowns';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
import { usePermissions } from '../../../hooks/usePermissions';

const Users: React.FC = () => {
  // Permission hooks to check user access
  const {
    canReadUsers,
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,
    loading: permissionsLoading,
  } = usePermissions();

  // Dropdown hooks for edit modal
  const { options: designationOptions } =
    useDesignationsDropdown();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading: designationLoading } = useDesignationsDropdown();
  const { options: roleDropdownOptions } =
    useDropdownData('roles');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loading: roleLoading } = useDropdownData('roles');
  const userStatusOptions = useUserStatusOptions();

  // Cache for dropdown data to avoid repeated API calls
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [roleCache, setRoleCache] = useState<string[]>([]);
  const [departmentCache, setDepartmentCache] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [locationCache, setLocationCache] = useState<string[]>([]);

  // Employee ID dropdown options and loading state
  const [employeeIdOptions, setEmployeeIdOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingEmployeeIds, setLoadingEmployeeIds] = useState(false);

  // Async search handler for Employee ID/User search with debouncing
  const performEmployeeIdSearch = async (value: string) => {
    if (!value.trim()) {
      setEmployeeIdOptions([]);
      return;
    }

    setLoadingEmployeeIds(true);
    try {
      // Use the proper search API that searches by Display_Name, Username, Email, First_Name, Last_Name
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

      const filteredOptions = users.map(user => {
        // Create a display label with multiple user identifiers
        const displayName =
          user.display_name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const identifier = user.username || user.email || user._id;
        const label = displayName
          ? `${displayName} (${identifier})`
          : identifier;

        return {
          value: user.username || user._id, // Use username as value, fallback to _id
          label: label,
        };
      });
      setEmployeeIdOptions(filteredOptions);
    } catch (error) {
      console.error('Error fetching users:', error);
      setEmployeeIdOptions([]);
    } finally {
      setLoadingEmployeeIds(false);
    }
  };

  const handleEmployeeIdSearch = useDebouncedCallback(
    performEmployeeIdSearch,
    300
  );
  const navigate = useNavigate();
  const location = useLocation();

  // Use the standardized URL pagination hook
  const {
    currentPage,
    debouncedPage,
    limit: itemsPerPage,
    searchTerm,
    activeTab,
    setPage: setCurrentPage,
    setLimit,
    setSearchTerm,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setActiveTab,
    updateParams,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    buildURLParams,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
    defaultTab: 'all',
    defaultSearch: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Filter state for URL parameters
  const [filters, setFilters] = useState<Record<string, string | null>>({
    employeeId: null,
    userRole: null,
    department: null,
    location: null,
  });

  // Local state for filters before application
  const [localFilters, setLocalFilters] = useState<Record<string, string | null>>(filters);

  // Sync local filters when the main filters state changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters = {
      employeeId: urlParams.get('employeeId'),
      userRole: urlParams.get('userRole'),
      department: urlParams.get('department'),
      location: urlParams.get('location'),
    };
    setFilters(initialFilters);
  }, []);

  // Build API URL with pagination and filter parameters
  const apiUrl = useMemo(() => {
    // Build params manually to avoid including 'tab' parameter in API call
    const params = new URLSearchParams();

    // Add pagination parameters
    params.append('page', debouncedPage.toString());
    params.append('limit', itemsPerPage.toString());

    // Add status parameter based on activeTab (but don't include 'tab' itself)
    if (activeTab !== 'all') {
      params.append('status', activeTab === 'active' ? 'Active' : 'Inactive');
    }

    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        // Map filter keys to API parameter names
        switch (key) {
          case 'employeeId':
            params.append('employee_id', value);
            break;
          case 'userRole':
            params.append('role', value);
            break;
          case 'department':
            params.append('department', value);
            break;
          case 'location':
            params.append('location', value);
            break;
        }
      }
    });

    const url = `${API_ENDPOINTS.USERS.LIST}?${params.toString()}`;
    return url;
  }, [debouncedPage, itemsPerPage, activeTab, searchTerm, filters]);

  const {
    data: usersResponse,
    error,
    loading,
    isValidating,
    refetch,
  } = useSWR<UsersResponse>(apiUrl);

  // Refetch data when navigated with refresh state or when returning to this page
  useEffect(() => {
    const state = location.state as {
      refresh?: boolean;
      timestamp?: number;
    } | null;
    
    // Refetch if explicitly requested via location state
    if (state?.refresh) {
      refetch(true);
      // Clear the state to prevent refetching on subsequent renders
      window.history.replaceState({}, document.title);
    }
    // Also refetch when returning to the users page from a detail/edit page
    else if (location.pathname === '/user') {
      console.log('🔄 Refetching users list...');
      refetch(true);
    }
  }, [location.pathname, location.state, refetch]);

  // Fetch all users to resolve reporting_to IDs to names
  const {
    data: allUsersData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error: allUsersError,
    loading: allUsersLoading,
  } = useSWR<{ users: User[] }>(
    API_ENDPOINTS.USERS.LIST + '?limit=1000' // Fetch all users to create ID mapping
  );

  // Create a mapping of user IDs to display names
  const userIdToNameMap = useMemo(() => {
    if (!allUsersData?.users) return {};

    const map: Record<string, string> = {};
    allUsersData.users.forEach(user => {
      // Use display_name first, then first_name + middle_name + last_name, then username as fallback
      const displayName =
        user.display_name ||
        [user.first_name, user.middle_name, user.last_name]
          .filter(name => name && name.trim())
          .join(' ') ||
        user.username ||
        'Unknown User';
      map[user._id] = displayName;
      map[user.id] = displayName; // Also map by regular id in case it's used
    });
    return map;
  }, [allUsersData?.users]);

  // Helper function to resolve reporting_to to display names
  // Enhanced to handle both string arrays and object arrays with id/detail fields
  const resolveReportingToNames = useCallback(
    (reportingToData: any): string => {
      // Return early if no data
      if (
        !reportingToData ||
        (Array.isArray(reportingToData) && reportingToData.length === 0)
      ) {
        return 'No Manager';
      }

      // Convert to array if it's not already an array
      const dataArray = Array.isArray(reportingToData)
        ? reportingToData
        : [reportingToData];

      // Process each item in the array
      const names = dataArray
        .map(item => {
          // Handle string IDs (most common case)
          if (typeof item === 'string') {
            // Look up the name using the userIdToNameMap
            let name = userIdToNameMap[item] || item;
            // Remove role info (anything in parentheses)
            name = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
            return name;
          }

          // Handle object format (in case API returns expanded data)
          if (typeof item === 'object' && item !== null) {
            // Handle the new format with id and detail fields
            if (item.id && item.detail) {
              // If detail indicates "User not found", use the id
              if (item.detail.includes('User not found')) {
                return item.id;
              }
              // Otherwise, look up the name using the userIdToNameMap
              let name = userIdToNameMap[item.id] || item.id;
              // Remove role info (anything in parentheses)
              name = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
              return name;
            }
            
            // If it has display_name, use that
            if (item.display_name) {
              let name = item.display_name;
              // Remove role info (anything in parentheses)
              name = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
              return name;
            }
            // If it has an id field, look it up in the map
            if (item.id) {
              let name = userIdToNameMap[item.id] || item.id;
              // Remove role info (anything in parentheses)
              name = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
              return name;
            }
            // If it has first/last name, construct the name
            if (item.first_name || item.last_name) {
              const name = [item.first_name, item.middle_name, item.last_name]
                .filter(name => name && name.trim())
                .join(' ');
              // Remove role info (anything in parentheses)
              return name.replace(/\s*\([^)]*\)\s*/g, '').trim();
            }
          }

          return null;
        })
        .filter(Boolean);

      return names.length > 0 ? names.join(', ') : 'No Manager';
    },
    [userIdToNameMap]
  );

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

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    display_name: '',
    username: '',
    status: '',
    designation: '',
    role: [] as string[],
    phone_no: '',
    email: '',
    avatar: null as File | null,
    date_of_joining: '',
    date_of_birth: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    employee_id: true,
    user_name: true,
    designation: true,
    role: true,
    phone: true,
    email: true,
    location: true,
    department: true,
    reporting_to: true,
    created_by: true,
    created: true,
    status: false,
    updated: false,
    date_of_joining: true,
    date_of_birth: true,
  });

  // Dropdown options for filters
  const [roleOptions, setRoleOptions] = useState<AsyncSelectOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingDepartment, setLoadingDepartment] = useState(false);
  const [locationOptions, setLocationOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Profile filter options - memoized since they don't change
  const profileOptions = useMemo(
    () => [
      { value: 'all', label: 'All Users' },
      { value: 'active', label: 'Active Users' },
      { value: 'inactive', label: 'Inactive Users' },
    ],
    []
  );

  const tableColumns: TableColumn[] = [
    {
      key: 'employee_id',
      label: 'Employee ID',
      sortable: true,
      width: '200px',
      minWidth: '200px',
      render: (value, row: User) => (
        <div
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={() => navigate(`/users/${row._id}`)}
        >
          {row.username || row.id}
        </div>
      ),
    },
    {
      key: 'user_name',
      label: 'User Name (Status)',
      sortable: true,
      width: '280px',
      minWidth: '250px',
      render: (value, row: User) => {
        // Logic: display_name if exists, otherwise first_name + middle_name + last_name
        const displayName =
          row.display_name ||
          [row.first_name, row.middle_name, row.last_name]
            .filter(name => name && name.trim()) // Remove empty/null values
            .join(' ');

        return (
          <div className="flex items-center space-x-3">
            {/* <Avatar
              src={row.avatar?.file_url || undefined}
              alt={displayName}
              size="sm"
              fallback={`${row.first_name?.[0] || ''}${row.last_name?.[0] || ''}`}
            /> */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 cursor-default">{displayName}</span>
              <Badge
                variant={row.status === 'Active' ? 'success' : 'danger'}
              >
                {row.status}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: 'designation',
      label: 'Designation',
      sortable: true,
      width: '150px',
      minWidth: '130px',
      render: (value, row: User) => row.designation || 'No Designation',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      width: '150px',
      minWidth: '130px',
      render: (value, row: User) => (
        <span>
          {Array.isArray(row.role)
            ? row.role.join(', ')
            : row.role || 'No Role'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      width: '140px',
      minWidth: '140px',
      render: (value, row: User) => row.phone_no,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      minWidth: '100px',
      render: (value, row: User) => (
        <Badge
          variant={row.status === 'Active' ? 'success' : 'danger'}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value: any, row: User) => row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString() : 'N/A',
    },
    {
      key: 'email',
      label: 'Email ID',
      sortable: true,
      width: '220px',
      minWidth: '200px',
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      width: '180px',
      minWidth: '160px',
      render: (value, row: User) => (
        <span className="text-gray-900">{row.location}</span>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      sortable: true,
      width: '150px',
      minWidth: '130px',
      render: (value, row: User) => (
        <span>
          {Array.isArray(row.department)
            ? row.department.join(', ')
            : row.department || 'No Department'}
        </span>
      ),
    },
    {
      key: 'reporting_to',
      label: 'Reporting to',
      sortable: true,
      width: '180px',
      minWidth: '160px',
      render: (value, row: User) => (
        <span>{resolveReportingToNames(row.reporting_to || [])}</span>
      ),
    },
    {
      key: 'date_of_joining',
      label: 'Date of Joining',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: (value: any, row: User) => row.date_of_joining ? new Date(row.date_of_joining).toLocaleDateString() : 'N/A',
    },
    {
      key: 'created_by',
      label: 'Created By',
      sortable: true,
      width: '150px',
      minWidth: '140px',
      render: (value: string) => (
        <span>{value || 'N/A'}</span>
      ),
    },
    {
      key: 'created',
      label: 'Created Date',
      sortable: true,
      width: '120px',
      minWidth: '120px',
      render: value => new Date(value).toLocaleDateString(),
    },
  ];

  const columnOptions = tableColumns.map(col => ({
    key: col.key,
    label: col.label,
  }));

  // Extract users array and pagination info from API response
  const users = useMemo(() => usersResponse?.users || [], [usersResponse]);
  const totalPages = usersResponse?.total_pages || 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalUsers = usersResponse?.total_users || 0;

  // Since API handles pagination, we use users directly for display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const displayData = users;

  // Data processing logic - now simplified since API handles filtering
  // Tab filter logic: 'All' shows all, 'Active' only active, 'Inactive' only inactive
  const filteredData = useMemo(() => {
    if (activeTab === 'all') return users;
    if (activeTab === 'active') return users.filter(u => u.status === 'Active');
    if (activeTab === 'inactive')
      return users.filter(u => u.status === 'Inactive');
    return users;
  }, [users, activeTab]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: any, bValue: any;

      // Handle nested values for sorting
      switch (sortConfig.key) {
        case 'user_name':
          // Use same logic as display: display_name if exists, otherwise first_name + middle_name + last_name
          aValue =
            a.display_name ||
            [a.first_name, a.middle_name, a.last_name]
              .filter(name => name && name.trim())
              .join(' ');
          bValue =
            b.display_name ||
            [b.first_name, b.middle_name, b.last_name]
              .filter(name => name && name.trim())
              .join(' ');
          break;
        case 'role':
          aValue = a.role?.[0] || '';
          bValue = b.role?.[0] || '';
          break;
        case 'designation':
          aValue = a.designation || '';
          bValue = b.designation || '';
          break;
        case 'department':
          aValue = a.department?.[0] || '';
          bValue = b.department?.[0] || '';
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          break;
        case 'reporting_to':
          aValue = resolveReportingToNames(a.reporting_to || []);
          bValue = resolveReportingToNames(b.reporting_to || []);
          break;
        case 'created_by':
          aValue = a.created_by || '';
          bValue = b.created_by || '';
          break;
        case 'phone':
          aValue = a.phone_no;
          bValue = b.phone_no;
          break;
        default:
          aValue = a[sortConfig.key as keyof User];
          bValue = b[sortConfig.key as keyof User];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, resolveReportingToNames]);

  // Since API handles pagination, we use sortedData directly
  const paginatedData = sortedData;

  // Event handlers
  const handleNewUser = () => {
    navigate('/add-user');
  };

  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedRows([]);

      // Update URL with status parameter when tab changes
      const statusParam =
        tab === 'all' ? null : tab === 'active' ? 'Active' : 'Inactive';
      updateParams({
        page: 1, // Reset to first page when changing tabs
        tab: tab, // Pass tab directly to updateParams
        status: statusParam,
      });
    },
    [updateParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
    },
    [setSearchTerm]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Tab statistics - for now showing current page data
  // In production, you might want separate API endpoints for tab counts
  // Tab counts reflect the number of users in each group
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tabCounts = useMemo(() => {
    if (loading || allUsersLoading || !usersResponse) {
      return { all: 0, active: 0, inactive: 0 };
    }
    return {
      all: users.length,
      active: users.filter(u => u.status === 'Active').length,
      inactive: users.filter(u => u.status === 'Inactive').length,
    };
  }, [users, loading, usersResponse, allUsersLoading]);

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? paginatedData.map((item: User) => item.id) : []);
  };

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRowClick = (row: User) => {
    navigate(`/users/${row._id}`);
  };

  // Handle single user deletion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleting(true);
      const result = await usersAPI.deleteUser(userId);

      if (result.success) {
        setDeleteResultMessage(`Successfully deleted user!`);
        // Refresh the data after deletion
        refetch();
      } else {
        setDeleteResultMessage(result.message || 'Failed to delete user.');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setDeleteResultMessage(
        'An error occurred while deleting the user. Please try again.'
      );
    } finally {
      setDeleting(false);
      setShowDeleteResultModal(true);
    }
  };

  const handleDeleteSelected = () => {
    // Check permissions first
    if (!canDeleteUsers) {
      showWarningToast("You don't have permission to delete users.");
      return;
    }

    if (selectedRows.length === 0) {
      setShowNoSelectionModal(true);
      return;
    }

    // Log the users that will be deleted for debugging
    console.log('Users selected for deletion:', selectedRows);

    // Show confirmation modal
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);

    try {
      const result = await usersAPI.deleteUsers(selectedRows);

      if (result.success) {
        setSelectedRows([]);
        showSuccessToast(result.message || 'Users deleted successfully!');
        // Refresh the data after deletion
        refetch();
      } else {
        showErrorToast(result.message || 'Failed to delete users.');
      }

      // Show additional info if some deletions failed
      if (result.failed && result.failed.length > 0) {
        console.warn('Failed to delete users:', result.failed);
        showWarningToast(
          'Some users could not be deleted. Check console for details.'
        );
      }
    } catch (error) {
      console.error('Error deleting users:', error);
      showErrorToast(
        'An error occurred while deleting users. Please try again.'
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
      
      // Get current page data (users displayed on current page)
      const currentPageUsers = paginatedData;

      if (!currentPageUsers || currentPageUsers.length === 0) {
        showWarningToast('No data to export on current page');
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
      const exportData = currentPageUsers.map((user: User) => {
        const rowData: any = {};
        exportColumns.forEach(col => {
          let value = '';

          // Extract clean data values (remove JSX/React components)
          switch (col.key) {
            case 'employee_id':
              value = user.username || user.id || '';
              break;
            case 'user_name':
              // Use same logic as display: display_name if exists, otherwise first_name + middle_name + last_name
              const displayName =
                user.display_name ||
                [user.first_name, user.middle_name, user.last_name]
                  .filter(name => name && name.trim())
                  .join(' ');
              // Append status in parentheses to match UI display
              value = `${displayName} (${user.status})`;
              break;
            case 'role':
              value = Array.isArray(user.role)
                ? user.role.join(', ')
                : user.role || 'No Role';
              break;
            case 'designation':
              value = user.designation || 'No Designation';
              break;
            case 'email':
              value = user.email || '';
              break;
            case 'phone':
              value = user.phone_no ? String(user.phone_no) : '';
              break;
            case 'status':
              // Status is now included in user_name field, skip it here
              value = '';
              break;
            case 'location':
              value = user.location || '';
              break;
            case 'department':
              value = Array.isArray(user.department)
                ? user.department.join(', ')
                : user.department || 'No Department';
              break;
            case 'reporting_to':
              value = resolveReportingToNames(user.reporting_to || []);
              break;
            case 'created_by':
              value = user.created_by || 'N/A';
              break;
            case 'created':
              value = user.created
                ? new Date(user.created).toLocaleDateString()
                : '';
              break;
            case 'updated':
              value = user.updated
                ? new Date(user.updated).toLocaleDateString()
                : '';
              break;
            case 'date_of_joining':
              value = user.date_of_joining
                ? new Date(user.date_of_joining).toLocaleDateString()
                : '';
              break;
            case 'date_of_birth':
              value = user.date_of_birth
                ? new Date(user.date_of_birth).toLocaleDateString()
                : '';
              break;
            default:
              value = user[col.key as keyof User]
                ? String(user[col.key as keyof User])
                : '';
          }

          rowData[col.label] = value;
        });
        return rowData;
      });

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
        `users-page-${currentPage}-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${data.length} users to CSV`);
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

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
        `users-page-${currentPage}-${new Date().toISOString().split('T')[0]}.xlsx`
      );

      console.log(`Exported ${data.length} users to Excel`);
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
        `Users Data (Page ${currentPage})\n\n` +
        data
          .map(row => {
            return headers
              .map(header => `${header}: ${row[header] || 'N/A'}`)
              .join('\n');
          })
          .join('\n\n---\n\n');

      // Create mailto link
      const subject = `Users Export - Page ${currentPage} - ${new Date().toLocaleDateString()}`;
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;

      // Open email client
      window.location.href = mailtoLink;

      console.log(`Prepared email export for ${data.length} users`);
    } catch (error) {
      console.error('Email export error:', error);
      showErrorToast('Email export failed');
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
      
      // Add filter parameters from current filters
      if (activeTab !== 'all') {
        params.append('status', activeTab === 'active' ? 'Active' : 'Inactive');
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      // Add other filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          switch (key) {
            case 'employeeId':
              params.append('employee_id', value);
              break;
            case 'userRole':
              params.append('role', value);
              break;
            case 'department':
              params.append('department', value);
              break;
            case 'location':
              params.append('location', value);
              break;
          }
        }
      });
      
      // Set high limit to fetch all data
      params.append('limit', '10000'); // Adjust as needed based on API limits
      params.append('page', '1');
      
      const url = `${API_ENDPOINTS.USERS.LIST}?${params.toString()}`;
      
      const response = await apiCall<UsersResponse>(url);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const allUsers = response.data?.users || [];
      
      if (allUsers.length === 0) {
        showWarningToast('No data to export');
        return;
      }
      
      // Prepare data for export
      const exportData = allUsers.map((user: User) => {
        const rowData: any = {};
        exportColumns.forEach(col => {
          let value = '';

          // Extract clean data values (remove JSX/React components)
          switch (col.key) {
            case 'employee_id':
              value = user.username || user.id || '';
              break;
            case 'user_name':
              // Use same logic as display: display_name if exists, otherwise first_name + middle_name + last_name
              const displayNameAll =
                user.display_name ||
                [user.first_name, user.middle_name, user.last_name]
                  .filter(name => name && name.trim())
                  .join(' ');
              // Append status in parentheses to match UI display
              value = `${displayNameAll} (${user.status})`;
              break;
            case 'role':
              value = Array.isArray(user.role)
                ? user.role.join(', ')
                : user.role || 'No Role';
              break;
            case 'designation':
              value = user.designation || 'No Designation';
              break;
            case 'email':
              value = user.email || '';
              break;
            case 'phone':
              value = user.phone_no ? String(user.phone_no) : '';
              break;
            case 'status':
              // Status is now included in user_name field, skip it here
              value = '';
              break;
            case 'location':
              value = user.location || '';
              break;
            case 'department':
              value = Array.isArray(user.department)
                ? user.department.join(', ')
                : user.department || 'No Department';
              break;
            case 'reporting_to':
              value = resolveReportingToNames(user.reporting_to || []);
              break;
            case 'created_by':
              value = user.created_by || 'N/A';
              break;
            case 'created':
              value = user.created
                ? new Date(user.created).toLocaleDateString()
                : '';
              break;
            case 'updated':
              value = user.updated
                ? new Date(user.updated).toLocaleDateString()
                : '';
              break;
            case 'date_of_joining':
              value = user.date_of_joining
                ? new Date(user.date_of_joining).toLocaleDateString()
                : '';
              break;
            case 'date_of_birth':
              value = user.date_of_birth
                ? new Date(user.date_of_birth).toLocaleDateString()
                : '';
              break;
            default:
              value = user[col.key as keyof User]
                ? String(user[col.key as keyof User])
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
      
      showSuccessToast(`Exported ${allUsers.length} users to Excel successfully`);
    } catch (error) {
      console.error('Export all data error:', error);
      showErrorToast('Export failed. Please try again.');
    }
  };

  const handleSaveView = () => {
    console.log('Save View clicked');
    showInfoToast('Save View feature coming soon!');
  };

  const handleColumnsReset = () => {
    setVisibleColumns({
      employee_id: true,
      user_name: true,
      role: true,
      designation: true,
      email: true,
      phone: true,
      status: true,
      location: true,
      department: true,
      reporting_to: true,
      created: true,
      updated: false,
    });
  };

  // Edit user functions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditUser = (user: User) => {
    // Check if user has update permission before allowing edit
    if (!canUpdateUsers) {
      // Still show modal but in read-only mode
    }

    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      display_name: user.display_name || '',
      username: user.username || '',
      status: user.status || '',
      designation: user.designation || '',
      role: Array.isArray(user.role) ? user.role : user.role ? [user.role] : [],
      phone_no: user.phone_no ? String(user.phone_no) : '',
      email: user.email || '',
      date_of_joining: user.date_of_joining || '',
      date_of_birth: user.date_of_birth || '',
      avatar: null,
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      display_name: '',
      username: '',
      status: '',
      designation: '',
      role: [],
      phone_no: '',
      email: '',
      date_of_joining: '',
      date_of_birth: '',
      avatar: null,
    });
  };

  const handleEditFormChange = (field: string, value: any) => {
    // Don't allow changes if user doesn't have update permission
    if (!canUpdateUsers) {
      return;
    }

    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !canUpdateUsers) {
      if (!canUpdateUsers) {
        showErrorToast("You don't have permission to update users.");
      }
      return;
    }

    setIsUpdating(true);
    try {
      // Prepare the update data to match API format
      const updateData: any = {
        first_name: editFormData.first_name,
        middle_name: editFormData.middle_name,
        last_name: editFormData.last_name,
        phone_no: editFormData.phone_no || '',
        designation: editFormData.designation,
        role: editFormData.role.length > 0 ? editFormData.role : undefined,
        status: editFormData.status,
        date_of_joining: editFormData.date_of_joining,
        date_of_birth: editFormData.date_of_birth,
      };

      // Only include fields that have values to avoid overwriting with empty values
      Object.keys(updateData).forEach(key => {
        if (
          updateData[key] === '' ||
          updateData[key] === null ||
          updateData[key] === undefined
        ) {
          delete updateData[key];
        }
      });

      console.log('Updating user with data:', updateData);

      // Call update API
      const result = await usersAPI.updateUser(editingUser._id, updateData);

      if (result.success) {
        // Refresh the data
        refetch();
        handleCloseEditModal();
        showSuccessToast('User updated successfully!');
      } else {
        showErrorToast(result.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showErrorToast('Failed to update user. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      employeeId: null,
      userRole: null,
      department: null,
      location: null,
    };
    setFilters(clearedFilters);
    setShowFilters(false);
    setCurrentPage(1);

    // Remove filter parameters from URL but maintain status
    // Include current tab status when clearing filters
    const statusParam =
      activeTab === 'all'
        ? null
        : activeTab === 'active'
          ? 'Active'
          : 'Inactive';

    updateParams({
      page: 1,
      status: statusParam,
      employeeId: null,
      userRole: null,
      department: null,
      location: null,
    });
  };

  // Async search handlers using dropdown API with caching and debouncing
  const performRoleSearch = async (value: string) => {
    if (!value.trim()) {
      setRoleOptions([]);
      return;
    }

    setLoadingRoles(true);
    try {
      // Fetch roles from /usersdropdowns/Roles with search parameter
      const response = await apiCall<{
        dropdown_type: string;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
        data: {
          id: string;
          name: string;
          permissions: {
            candidate: string;
            client: string;
            job: string;
            supplier: string;
            users: string;
          };
        }[];
      }>(`/usersdropdowns/Roles?search=${encodeURIComponent(value)}`);
      
      const rolesData = response.data?.data || [];
      const filteredOptions = rolesData.map(role => ({
        value: role.name,
        label: role.name,
      }));
      setRoleOptions(filteredOptions);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoleOptions([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleSearch = useDebouncedCallback(performRoleSearch, 300);

  const performDepartmentSearch = async (value: string) => {
    if (!value.trim()) {
      setDepartmentOptions([]);
      return;
    }

    setLoadingDepartment(true);
    try {
      // Use cache if available
      let departments = departmentCache;
      if (departments.length === 0) {
        // Fetch departments from /usersdropdowns/Departments
        const response = await apiCall<{
          data: { id: string; name: string }[];
        }>(`/usersdropdowns/Department`);
        const departmentsData = response.data?.data || [];
        // Extract department names for cache
        departments = departmentsData.map(dept => dept.name);
        setDepartmentCache(departments);
      }

      const filteredOptions = departments
        .filter(dept => dept.toLowerCase().includes(value.toLowerCase()))
        .map(dept => ({
          value: dept,
          label: dept,
        }));
      setDepartmentOptions(filteredOptions);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartmentOptions([]);
    } finally {
      setLoadingDepartment(false);
    }
  };

  const handleDepartmentSearch = useDebouncedCallback(
    performDepartmentSearch,
    300
  );

  // Updated: Fetch users filtered by location, extract unique locations for dropdown
  const performLocationSearch = async (value: string) => {
    if (!value.trim()) {
      setLocationOptions([]);
      return;
    }

    setLoadingLocation(true);
    try {
      // Fetch users filtered by location
      const response = await apiCall<{ users: { location?: string }[] }>(
        `/users/?location=${encodeURIComponent(value)}`
      );
      const users = response.data?.users || [];
      // Extract unique locations from users
      const uniqueLocations = Array.from(
        new Set(
          users
            .map(u => u.location)
            .filter((loc): loc is string => typeof loc === 'string' && !!loc)
        )
      );
      // Filter locations that include the search value (case-insensitive)
      const filteredLocations = uniqueLocations.filter(loc =>
        loc.toLowerCase().includes(value.toLowerCase())
      );
      const filteredOptions = filteredLocations.map(loc => ({
        value: loc,
        label: loc,
      }));
      setLocationOptions(filteredOptions);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocationOptions([]);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleLocationSearch = useDebouncedCallback(performLocationSearch, 300); // Filter fields configuration for Users
  // Filter fields configuration for Users
  const filterFields: FilterField[] = [
    {
      key: 'employeeId',
      label: 'Employee ID',
      type: 'async-select',
      placeholder: 'Search by name, username, email...',
      asyncOptions: employeeIdOptions,
      onAsyncSearch: handleEmployeeIdSearch,
      loading: loadingEmployeeIds,
    },
    {
      key: 'userRole',
      label: 'User Role',
      type: 'async-select',
      placeholder: 'Search User Role',
      asyncOptions: roleOptions,
      onAsyncSearch: handleRoleSearch,
      loading: loadingRoles,
    },
    {
      key: 'department',
      label: 'Department',
      type: 'async-select',
      placeholder: 'Search Department',
      asyncOptions: departmentOptions,
      onAsyncSearch: handleDepartmentSearch,
      loading: loadingDepartment,
    },
    {
      key: 'location',
      label: 'Location',
      type: 'async-select',
      placeholder: 'Search Location',
      asyncOptions: locationOptions,
      onAsyncSearch: handleLocationSearch,
      loading: loadingLocation,
    },
  ];

  // Early return if no read permission
  if (!permissionsLoading && !canReadUsers) {
    return (
      <PageLayout header={<Header title="Users" />}>
        <AccessDenied message="You don't have permission to view users. Please contact your administrator for access." />
      </PageLayout>
    );
  }

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <PageLayout header={<Header title="Users" />}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Icon
              name="lock"
              size={32}
              className="text-gray-400 mx-auto mb-4"
            />
            <p className="text-gray-500">Checking permissions...</p>
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
            title="Users"
            showNewRecordButton={canCreateUsers}
            newRecordButtonText="Add User"
            newRecordButtonIcon="plus"
            disableNewRecord={!canCreateUsers}
            onNewRecord={handleNewUser}
            refreshInterval={0}
          />
        }
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search users..."
            searchDescription="Search by User Name or Email"
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
            canViewData={canReadUsers}
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
            // onDeleteSelected={handleDeleteSelected}
            // canDelete={canDeleteUsers}
            customTabs={[
              { id: 'all', label: 'All Users' },
              { id: 'active', label: 'Active Users' },
              { id: 'inactive', label: 'Inactive Users' },
            ]}
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
        <div className="space-y-4 h-full flex flex-col">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading users
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      {error.message ||
                        'Failed to fetch users. Please try again.'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                      onClick={() => refetch()}
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-500">Loading users...</div>
              </div>
            </div>
          ) : (
            <DataTable
              columns={tableColumns}
              data={paginatedData}
              visibleColumns={visibleColumns}
              sortConfig={sortConfig}
              onSort={handleSort}
              selectedRows={selectedRows}
              onSelectAll={handleSelectAll}
              onSelectRow={handleSelectRow}
              emptyMessage={`No ${activeTab} users found`}
              height="100%"
              maxHeight="100%"
              className="flex-1 min-h-0 flex flex-col"
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

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit User Details"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            {canUpdateUsers ? (
              <Button
                variant="primary"
                onClick={handleUpdateUser}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            ) : (
              <Button
                variant="outline"
                disabled
                title="You don't have permission to update users"
              >
                No Update Permission
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Permission Warning */}
          {!canUpdateUsers && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <Icon name="info" className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Read-only mode
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You can view user details but don't have permission to
                      make changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <EnhancedInputField
              label="First Name"
              value={editFormData.first_name}
              onChange={value => handleEditFormChange('first_name', value)}
              type="text"
              placeholder="Enter first name"
              required
              disabled={!canUpdateUsers}
            />
            <EnhancedInputField
              label="Last Name"
              value={editFormData.last_name}
              onChange={value => handleEditFormChange('last_name', value)}
              type="text"
              placeholder="Enter last name"
              required
              disabled={!canUpdateUsers}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EnhancedInputField
              label="Middle Name"
              value={editFormData.middle_name}
              onChange={value => handleEditFormChange('middle_name', value)}
              type="text"
              placeholder="Enter middle name"
              disabled={!canUpdateUsers}
            />
            {/* Display Name Field - Non-editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <div className="w-full px-3 py-2 text-base bg-gray-50 text-gray-500 border border-gray-300 rounded-md cursor-not-allowed">
                {editFormData.display_name || 'Not set'}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Display name cannot be modified
              </p>
            </div>
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4">
            {/* Employee ID Field - Non-editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <div className="w-full px-3 py-2 text-base bg-gray-50 text-gray-500 border border-gray-300 rounded-md cursor-not-allowed">
                {editFormData.username}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Employee ID cannot be modified
              </p>
            </div>
            <SelectField
              label="Status"
              value={editFormData.status}
              onChange={value =>
                canUpdateUsers
                  ? handleEditFormChange('status', value)
                  : undefined
              }
              options={userStatusOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              placeholder="Select status"
              required
            />
          </div>

          {/* Designation and Role */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Designation"
              value={editFormData.designation}
              onChange={value => handleEditFormChange('designation', value)}
              options={designationOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              placeholder="Select designation"
            />
            <SelectField
              label="Role(s)"
              value={
                Array.isArray(editFormData.role)
                  ? editFormData.role.join(', ')
                  : editFormData.role
              }
              onChange={value =>
                handleEditFormChange('role', value.split(', '))
              }
              options={roleDropdownOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              placeholder="Select role(s)"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <EnhancedInputField
              label="Phone No"
              value={editFormData.phone_no}
              onChange={value => handleEditFormChange('phone_no', value)}
              type="tel"
              placeholder="Enter phone number"
            />
            {/* Email Field - Non-editable */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="w-full px-3 py-2 text-base bg-gray-100 text-gray-600 border border-gray-300 rounded-md cursor-not-allowed opacity-75 select-none">
                {editFormData.email}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be modified
              </p>
            </div>
          </div>

          {/* User Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Picture
            </label>
            <div className="flex items-center space-x-4">
              {editingUser?.avatar?.file_url && (
                <Avatar
                  src={editingUser.avatar.file_url}
                  alt={editFormData.display_name || editFormData.first_name}
                  size="lg"
                  fallback={`${editFormData.first_name?.[0] || ''}${editFormData.last_name?.[0] || ''}`}
                />
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    handleEditFormChange('avatar', file);
                  }}
                  className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a new picture (optional)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Users;
