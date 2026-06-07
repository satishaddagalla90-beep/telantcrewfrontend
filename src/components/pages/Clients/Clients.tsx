import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Header from '../../molecules/Header';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel, { FilterField } from '../../molecules/FilterPanel';
import { dropdownAPI } from '../../../utils/api/dropdowns';
import { useURLPagination } from '../../../hooks';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import DeleteConfirmationModal from '../../molecules/DeleteConfirmationModal';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import { AsyncSelectOption } from '../../atoms/AsyncSelect';
import Pagination from '../../molecules/Pagination/Pagination';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Icon from '../../atoms/Icon';
import AccessDenied from '../../molecules/AccessDenied/AccessDenied';
import Badge from '../../atoms/Badge';
import {
  useSWR,
  apiCall,
  API_ENDPOINTS,
  Client,
  ClientsResponse,
} from '../../../utils/api';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '../../../utils/toast';
const Clients: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize permissions for clients module
  const {
    canReadClients,
    canCreateClients,
    canUpdateClients,
    canDeleteClients,
    loading: permissionsLoading,
  } = usePermissions();

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
    setActiveTab,
    updateParams,
    buildURLParams,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
    defaultTab: 'all',
    defaultSearch: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | null>>({
    clientStatus: null,
    contractType: null,
    msp: null,
    location: null,
    createdDate: null,
    createdBy: null,
  });

  // Local state for filters before application
  const [localFilters, setLocalFilters] = useState<Record<string, string | null>>(filters);

  // Sync local filters when the main filters state changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

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
  const [deleting, setDeleting] = useState(false);

  const [locationOptions, setLocationOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<AsyncSelectOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [contractTypeOptions, setContractTypeOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingContractType, setLoadingContractType] = useState(false);
  const [mspOptions, setMspOptions] = useState<AsyncSelectOption[]>([]);
  const [loadingMsp, setLoadingMsp] = useState(false);
  const [mspAssociateWithOptions, setMspAssociateWithOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingMspAssociateWith, setLoadingMspAssociateWith] = useState(false);
  const [createdByOptions, setCreatedByOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);
  const [clientStatusOptions, setClientStatusOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingClientStatus, setLoadingClientStatus] = useState(false);

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      clientStatus: null,
      contractType: null,
      msp: null,
      mspAssociateWith: null,
      location: null,
      createdDate: null,
      createdBy: null,
    };
    setFilters(clearedFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters = {
      clientStatus: urlParams.get('clientStatus'),
      contractType: urlParams.get('contractType'),
      msp: urlParams.get('msp'),
      mspAssociateWith: urlParams.get('mspAssociateWith'),
      location: urlParams.get('location'),
      createdDate: urlParams.get('createdDate'),
      createdBy: urlParams.get('createdBy'),
    };
    setFilters(initialFilters);
  }, []);

  // Build API URL with pagination and filter parameters
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    // Add pagination parameters
    params.append('page', debouncedPage.toString());
    params.append('limit', itemsPerPage.toString());

    // Add client_status parameter based on activeTab (unless filter overrides it)
    if (activeTab !== 'all' && !filters.clientStatus) {
      if (activeTab === 'active') {
        params.append('client_status', 'Active');
      } else if (activeTab === 'inactive') {
        params.append('client_status', 'Inactive');
      } else if (activeTab === 'newlead') {
        params.append('client_status', 'New Lead');
      }
    }

    // Add search parameter for server-side search
    if (searchTerm && searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }

    // Add filter parameters - mapped to match API documentation
    Object.entries(filters).forEach(([key, value]) => {
      // Special handling for date fields - don't call trim() on them
      if (key === 'createdDate' && value) {
        // Date value is already a string, just append it
        params.append('created', value);
        return;
      }

      // For string filters, check if value exists and trim
      if (value && typeof value === 'string' && value.trim()) {
        switch (key) {
          case 'clientStatus':
            params.append('client_status', value);
            break;
          case 'contractType':
            params.append('ClientContract', value); // Fixed: API expects 'ClientContract'
            break;
          case 'msp':
            params.append('msp_type', value); // Correct field for MSP filter
            break;
          case 'mspAssociateWith':
            params.append('associate_msp', value);
            break;
          case 'location':
            params.append('client_city', value); // Changed: API expects 'client_city' for filtering
            break;
          case 'createdBy':
            params.append('created_by', value);
            break;
        }
      }
    });

    return `${API_ENDPOINTS.CLIENTS.LIST}?${params.toString()}`;
  }, [activeTab, filters, debouncedPage, itemsPerPage, searchTerm]);

  const {
    data: clientsResponse,
    error,
    loading,
    isValidating,
    refetch,
  } = useSWR<ClientsResponse>(apiUrl);

  // Revalidate when navigating back to this page
  useEffect(() => {
    if (location.pathname === '/clients') {
      refetch(true); // Pass true to use isValidating state for background refresh
    }
  }, [location.pathname]); // eslint-disable-next-line react-hooks/exhaustive-deps

  // Extract clients array and pagination info from API response
  const clients = clientsResponse?.Client || [];
  const totalPages = clientsResponse?.total_pages || 0;
  const totalClients = clientsResponse?.total_clients || 0;

  const profileOptions = [
    { value: 'all', label: 'All Clients' },
    { value: 'active', label: 'Active Clients' },
    { value: 'inactive', label: 'Inactive Clients' },
    { value: 'newlead', label: 'New Lead' },
  ];

  const tableColumns: TableColumn[] = [
    {
      key: 'client_id',
      label: 'Client ID',
      sortable: true,
      width: '120px',
      minWidth: '100px',
      render: (value, row: Client) => (
        <div
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={() => navigate(`/clients/${row.id}`)}
        >
          {value}
        </div>
      ),
    },

    {
      key: 'client_name',
      label: 'Client Name',
      sortable: true,
      width: '250px',
      minWidth: '220px',
      render: (value, row: Client) => (
          <div className="font-medium flex items-center gap-2">
            <span>{value}</span>
            {row.client_status && (
              <Badge
                variant={
                  row.client_status === 'Active' ? 'success' :
                  row.client_status === 'Inactive' ? 'secondary' :
                  row.client_status === 'New Lead' ? 'info' : 'secondary'
                }
              >
                {row.client_status}
              </Badge>
            )}
          </div>
      ),
    },

    {
      key: 'client_code',
      label: 'Client Code',
      sortable: true,
      width: '120px',
      minWidth: '100px',
      render: (value, row: Client) => row.client_code || 'N/A',
    },

    {
      key: 'msp_type',
      label: 'Client Type',
      sortable: false,
      width: '120px',
      minWidth: '100px',
      render: (value, row: Client) => (row as any).msp_type || 'N/A',
    },

    {
      key: 'associate_msp',
      label: 'MSP Associate With',
      sortable: false,
      width: '180px',
      minWidth: '160px',
      render: (value, row: Client) => (row as any).associate_msp || 'N/A',
    },

    {
      key: 'client_website',
      label: 'Website',
      sortable: false,
      width: '160px',
      minWidth: '140px',
      render: (value, row: Client) =>
        row.client_website ? (
          <a
            href={
              row.client_website.startsWith('http')
                ? row.client_website
                : `https://${row.client_website}`
            }
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline truncate"
          >
            {row.client_website.replace(/^https?:\/\//, '').split('/')[0]}
          </a>
        ) : (
          'N/A'
        ),
    },

    {
      key: 'client_city',
      label: 'Location',
      sortable: true,
      width: '140px',
      minWidth: '120px',
      render: (value, row: Client) =>
        `${row.client_city || ''}, ${row.client_state || ''}`.replace(
          /^,\s*|,\s*$/g,
          ''
        ) || 'N/A',
    },

    {
      key: 'contracts',
      label: 'Contract Type',
      sortable: false,
      width: '140px',
      minWidth: '120px',
      render: (value, row: Client) => {
        const contractTypes = row.contracts
          ?.map(c => c.contract_type)
          .join(', ');
        return contractTypes || 'N/A';
      },
    },

    {
      key: 'created_by',
      label: 'Created By',
      sortable: true,
      width: '140px',
      minWidth: '120px',
      render: (value, row: Client) => row.created_by || 'N/A',
    },
    // {
    //   key: 'updated_by',
    //   label: 'Updated By',
    //   sortable: true,
    //   width: '140px',
    //   minWidth: '120px',
    //   render: (value, row: Client) => row.updated_by || 'N/A',
    // },

    {
      key: 'created',
      label: 'Created Date',
      sortable: true,
      width: '140px',
      minWidth: '120px',
      render: (value, row: Client) =>
        new Date(row.created).toLocaleDateString(),
    },

  ];

  const columnOptions = tableColumns.map(col => ({
    key: col.key,
    label: col.label,
  }));

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    client_id: true,
    client_name: true,
    client_code: true,
    msp_type: true,
    associate_msp: true,
    client_website: true,
    client_city: true,
    contracts: true,
    created_by: true,
    updated_by: true,
    
    created: true,
  });

  const handleColumnsReset = () => {
    setVisibleColumns({
      client_id: true,
      client_name: true,
      client_code: true,
      msp_type: true,
      associate_msp: true,
      client_website: true,
      client_city: true,
      contracts: true,
      created_by: true,
      updated_by: true,
      created: true,
    });
  };

  // Use data directly from API (server handles filtering, sorting, and pagination)
  const paginatedData = clients;

  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedRows([]);

      // Update URL with status parameter when tab changes
      const statusParam =
        tab === 'all'
          ? null
          : tab === 'active'
            ? 'Active'
            : tab === 'inactive'
              ? 'Inactive'
              : tab === 'newlead'
                ? 'New Lead'
                : null;
      
      // Update params and tab together - setActiveTab is handled by useURLPagination
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
      // Reset to first page when searching
      setCurrentPage(1);
    },
    [setSearchTerm, setCurrentPage]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const tabCounts = useMemo(() => {
    if (loading || !clientsResponse) {
      return { all: 0, active: 0, inactive: 0, newlead: 0 };
    }

    // Use total_clients from API for the active tab
    // For inactive tabs, show undefined (will not display count)
    const counts = {
      all: activeTab === 'all' ? totalClients : undefined,
      active: activeTab === 'active' ? totalClients : undefined,
      inactive: activeTab === 'inactive' ? totalClients : undefined,
      newlead: activeTab === 'newlead' ? totalClients : undefined,
    };

    return counts as any;
  }, [activeTab, totalClients, loading, clientsResponse]);

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(
      selected ? paginatedData.map((item: Client) => item.id) : []
    );
  };

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, id] : prev.filter(r => r !== id)
    );
  };

  const handleRowClick = (row: Client) => {
    navigate(`/clients/${row.id}`);
  };

  const handleNewClient = () => {
    if (!canCreateClients) {
      console.warn('User does not have permission to create clients');
      return;
    }
    navigate('/add-client');
  };

  const handleDeleteSelected = () => {
    if (!canDeleteClients) {
      console.warn('User does not have permission to delete clients');
      return;
    }

    if (selectedRows.length === 0) {
      setShowNoSelectionModal(true);
      return;
    }

    // Log the clients that will be deleted for debugging
    console.log('Clients selected for deletion:', selectedRows);

    // Show confirmation modal
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);

    try {
      // Delete each selected client
      const deletePromises = selectedRows.map(clientId =>
        apiCall(API_ENDPOINTS.CLIENTS.DELETE(clientId), {
          method: 'DELETE',
        })
      );

      const results = await Promise.allSettled(deletePromises);

      // Count successful deletions
      const successCount = results.filter(
        result => result.status === 'fulfilled'
      ).length;
      const failCount = results.filter(
        result => result.status === 'rejected'
      ).length;

      if (failCount === 0) {
        showSuccessToast(`Successfully deleted ${successCount} client(s)!`);
      } else if (successCount === 0) {
        showErrorToast(
          `Failed to delete ${failCount} client(s). Please try again.`
        );
      } else {
        showWarningToast(
          `Deleted ${successCount} client(s), but ${failCount} failed.`
        );
      }

      setSelectedRows([]);

      // Refresh the data after deletion
      refetch();
    } catch (error) {
      console.error('Error deleting clients:', error);
      showErrorToast(
        'An error occurred while deleting clients. Please try again.'
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
      
      // Get current page data (clients displayed on current page)
      const currentPageClients = paginatedData;

      if (!currentPageClients || currentPageClients.length === 0) {
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
      const exportData = currentPageClients.map((client: Client) => {
        const rowData: any = {};
        exportColumns.forEach(col => {
          let value = '';

          // Extract clean data values (remove JSX/React components)
          switch (col.key) {
            case 'client_id':
              value = client.client_id || '';
              break;
            case 'client_name':
              value = client.client_name || '';
              break;
            case 'client_code':
              value = client.client_code || '';
              break;
            case 'vms_client_name':
              value = client.vms_client_name || '';
              break;
            case 'msp_type':
              value = (client as any).msp_type || '';
              break;
            case 'associate_msp':
              value = (client as any).associate_msp || '';
              break;
            case 'client_website':
              value = client.client_website || '';
              break;
            case 'industry':
              value = client.industry || '';
              break;
            case 'client_city':
              value =
                `${client.client_city || ''}, ${client.client_state || ''}`
                  .replace(/^,\s*|,\s*$/g, '')
                  .trim() || '';
              break;
            case 'ownership':
              value = client.ownership || '';
              break;
            case 'client_status':
              value = client.client_status || '';
              break;
            case 'contracts':
              value =
                client.contracts?.map(c => c.contract_type).join(', ') || '';
              break;
            case 'contacts':
              if (client.contacts && client.contacts.length > 0) {
                const contact = client.contacts[0];
                const name =
                  contact.display_name ||
                  `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                value = `${name} (${contact.designation || ''})`;
              }
              break;
            case 'created_by':
              value = client.created_by || '';
              break;
            case 'created':
              value = client.created
                ? new Date(client.created).toLocaleDateString()
                : '';
              break;
            default:
              value = client[col.key as keyof Client]
                ? String(client[col.key as keyof Client])
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
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `clients-page-${currentPage}-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Exported ${data.length} clients to CSV`);
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

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
        `clients-page-${currentPage}-${new Date().toISOString().split('T')[0]}.xlsx`
      );

      console.log(`Exported ${data.length} clients to Excel`);
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
        `Clients Data (Page ${currentPage})\n\n` +
        data
          .map(row => {
            return headers
              .map(header => `${header}: ${row[header] || 'N/A'}`)
              .join('\n');
          })
          .join('\n\n---\n\n');

      // Create mailto link
      const subject = `Clients Export - Page ${currentPage} - ${new Date().toLocaleDateString()}`;
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;

      // Open email client
      window.location.href = mailtoLink;

      console.log(`Prepared email export for ${data.length} clients`);
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
      if (activeTab !== 'all' && !filters.clientStatus) {
        if (activeTab === 'active') {
          params.append('client_status', 'Active');
        } else if (activeTab === 'inactive') {
          params.append('client_status', 'Inactive');
        } else if (activeTab === 'newlead') {
          params.append('client_status', 'New Lead');
        }
      }
      
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      // Add other filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        // Special handling for date fields
        if (key === 'createdDate' && value) {
          params.append('created', value);
          return;
        }

        // For string filters, check if value exists and trim
        if (value && typeof value === 'string' && value.trim()) {
          switch (key) {
            case 'clientStatus':
              params.append('client_status', value);
              break;
            case 'contractType':
              params.append('ClientContract', value);
              break;
            case 'msp':
              params.append('msp_type', value);
              break;
            case 'mspAssociateWith':
              params.append('associate_msp', value);
              break;
            case 'location':
              params.append('client_city', value);
              break;
            case 'createdBy':
              params.append('created_by', value);
              break;
          }
        }
      });
      
      // Set high limit to fetch all data
      params.append('limit', '10000'); // Adjust as needed based on API limits
      params.append('page', '1');
      
      const url = `${API_ENDPOINTS.CLIENTS.LIST}?${params.toString()}`;
      
      const response = await apiCall<ClientsResponse>(url);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const allClients = response.data?.Client || [];
      
      if (allClients.length === 0) {
        showWarningToast('No data to export');
        return;
      }
      
      // Prepare data for export
      const exportData = allClients.map(client => {
        const rowData: any = {};
        exportColumns.forEach(col => {
          let value = '';

          // Extract clean data values (remove JSX/React components)
          switch (col.key) {
            case 'client_name':
              value = client.client_name || '';
              break;
            case 'msp_type':
              value = client.msp_type || '';
              break;
            case 'associate_msp':
              value = (client as any).associate_msp || '';
              break;
            case 'client_website':
              value = client.client_website || '';
              break;
            case 'industry':
              value = client.industry || '';
              break;
            case 'client_city':
              value =
                `${client.client_city || ''}, ${client.client_state || ''}`
                  .replace(/^,\s*|,\s*$/g, '')
                  .trim() || '';
              break;
            case 'ownership':
              value = client.ownership || '';
              break;
            case 'client_status':
              value = client.client_status || '';
              break;
            case 'contracts':
              value =
                client.contracts?.map(c => c.contract_type).join(', ') || '';
              break;
            case 'contacts':
              if (client.contacts && client.contacts.length > 0) {
                const contact = client.contacts[0];
                const name =
                  contact.display_name ||
                  `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                value = `${name} (${contact.designation || ''})`;
              }
              break;
            case 'created_by':
              value = client.created_by || '';
              break;
            case 'created':
              value = client.created
                ? new Date(client.created).toLocaleDateString()
                : '';
              break;
            default:
              value = client[col.key as keyof Client]
                ? String(client[col.key as keyof Client])
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
      
      showSuccessToast(`Exported ${allClients.length} clients to Excel successfully`);
    } catch (error) {
      console.error('Export all data error:', error);
      showErrorToast('Export failed. Please try again.');
    }
  };

  const handleLocationSearch = async (value: string) => {
    setLoadingLocation(true);
    try {
      // Fetch clients and extract unique client_city values
      const response = await apiCall<ClientsResponse>(
        `${API_ENDPOINTS.CLIENTS.LIST}?limit=1000`
      );

      if (response.data && response.data.Client) {
        // Extract unique client_city values from clients
        const uniqueCities = Array.from(
          new Set(
            response.data.Client.map((client: Client) => client.client_city).filter(
              (city): city is string => typeof city === 'string' && !!city
            )
          )
        );

        // Filter cities based on search value
        const filteredCities = value
          ? uniqueCities.filter(city =>
              city.toLowerCase().includes(value.toLowerCase())
            )
          : uniqueCities;

        // Map to options format
        const options = filteredCities.map(city => ({
          value: city,
          label: city,
        }));

        setLocationOptions(options);
      } else {
        setLocationOptions([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocationOptions([]);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleContractTypeSearch = async (value: string) => {
    setLoadingContractType(true);
    try {
      // Use dropdown endpoint for contract types
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Contracts')
      );
      if (value) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setContractTypeOptions(options);
      } else {
        setContractTypeOptions([]);
      }
    } catch (error) {
      console.error('Error fetching contract types:', error);
      setContractTypeOptions([]);
    } finally {
      setLoadingContractType(false);
    }
  };

  const handleMspSearch = async (value: string) => {
    setLoadingMsp(true);
    try {
      // Use dropdown endpoint for MSP types
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('MSP')
      );
      if (value) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setMspOptions(options);
      } else {
        setMspOptions([]);
      }
    } catch (error) {
      console.error('Error fetching MSP options:', error);
      setMspOptions([]);
    } finally {
      setLoadingMsp(false);
    }
  };

  const handleCreatedBySearch = async (value: string) => {
    setLoadingCreatedBy(true);
    try {
      // Use dropdown endpoint for created by users
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Users')
      );
      if (value) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setCreatedByOptions(options);
      } else {
        setCreatedByOptions([]);
      }
    } catch (error) {
      console.error('Error fetching created by users:', error);
      setCreatedByOptions([]);
    } finally {
      setLoadingCreatedBy(false);
    }
  };

  const handleClientStatusSearch = async (value: string) => {
    setLoadingClientStatus(true);
    try {
      // Use dropdown endpoint for client statuses
      const url = new URL(
        window.location.origin + API_ENDPOINTS.CLIENTS.DROPDOWNS('Client_Status')
      );
      if (value) {
        url.searchParams.append('search', value);
      }

      const response = await apiCall<{
        data: Array<{ id: string; name: string }>;
      }>(url.pathname + url.search);

      if (response.data && response.data.data) {
        const options = response.data.data.map(
          (item: { id: string; name: string }) => ({
            value: item.name,
            label: item.name,
          })
        );
        setClientStatusOptions(options);
      } else {
        setClientStatusOptions([]);
      }
    } catch (error) {
      console.error('Error fetching client statuses:', error);
      setClientStatusOptions([]);
    } finally {
      setLoadingClientStatus(false);
    }
  };

  const handleMspAssociateWithSearch = async (value: string) => {
    setLoadingMspAssociateWith(true);
    try {
      // Fetch from main client API to get unique associate_msp values
      const response = await apiCall<ClientsResponse>(
        `${API_ENDPOINTS.CLIENTS.LIST}?limit=20`
      );

      if (response.data && response.data.Client) {
        // Extract unique associate_msp values from clients
        const uniqueMspAssociateWith = Array.from(
          new Set(
            response.data.Client.map(
              client => (client as any).associate_msp
            ).filter(msp => msp && msp.trim() !== '')
          )
        );

        // Filter based on search value
        const filteredOptions = uniqueMspAssociateWith
          .filter(msp => msp.toLowerCase().includes(value.toLowerCase()))
          .map(msp => ({
            value: msp,
            label: msp,
          }));

        setMspAssociateWithOptions(filteredOptions);
      } else {
        setMspAssociateWithOptions([]);
      }
    } catch (error) {
      console.error('Error fetching MSP Associate With options:', error);
      setMspAssociateWithOptions([]);
    } finally {
      setLoadingMspAssociateWith(false);
    }
  };

  // Filter fields configuration for Clients
  const filterFields: FilterField[] = [
    {
      key: 'clientStatus',
      label: 'Client Status',
      type: 'async-select',
      placeholder: 'Search Status',
      asyncOptions: clientStatusOptions,
      onAsyncSearch: handleClientStatusSearch,
      loading: loadingClientStatus,
    },
    // {
    //   key: 'vmsName',
    //   label: 'VMS Name',
    //   type: 'async-select',
    //   placeholder: 'Search Vms Type',
    //   asyncOptions: vmsNameOptions,
    //   onAsyncSearch: handleVmsNameSearch,
    //   loading: loadingVmsName,
    // },
    {
      key: 'contractType',
      label: 'Contract Type',
      type: 'async-select',
      placeholder: 'Search Contract',
      asyncOptions: contractTypeOptions,
      onAsyncSearch: handleContractTypeSearch,
      loading: loadingContractType,
    },
    {
      key: 'msp',
      label: 'Client Type',
      type: 'async-select',
      placeholder: 'Select MSP',
      asyncOptions: mspOptions,
      onAsyncSearch: handleMspSearch,
      loading: loadingMsp,
    },
    {
      key: 'mspAssociateWith',
      label: 'MSP Associate With',
      type: 'async-select',
      placeholder: 'Select MSP Associate With',
      asyncOptions: mspAssociateWithOptions,
      onAsyncSearch: handleMspAssociateWithSearch,
      loading: loadingMspAssociateWith,
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
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'date',
    },
    {
      key: 'createdBy',
      label: 'Created By',
      type: 'async-select',
      placeholder: 'Search Creator',
      asyncOptions: createdByOptions,
      onAsyncSearch: handleCreatedBySearch,
      loading: loadingCreatedBy,
    },
  ];

  const handleSaveView = () => {
    console.log('Save View clicked');
    showInfoToast('Save View feature coming soon!');
  };
  // Check if user has read access
  if (!permissionsLoading && !canReadClients) {
    return (
      <AccessDenied message="You don't have permission to view clients. Please contact your administrator for access." />
    );
  }

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <PageLayout header={<Header title="Clients" />}>
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
            title="Clients"
            showNewRecordButton={canCreateClients}
            newRecordButtonText="New Client"
            newRecordButtonIcon="plus"
            disableNewRecord={!canCreateClients}
            onNewRecord={canCreateClients ? handleNewClient : undefined}
            refreshInterval={0}
          />
        }
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search clients..."
            searchDescription="Search by Client Name or Client Code"
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
            canViewData={canReadClients}
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
                columns={3}
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
            //   canDeleteClients ? handleDeleteSelected : undefined
            // }
            // canDelete={canDeleteClients}
            customTabs={[
              { id: 'all', label: 'All Clients' },
              { id: 'active', label: 'Active Clients' },
              { id: 'inactive', label: 'Inactive Clients' },
              { id: 'newlead', label: 'New Lead' },
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
                    Error loading clients
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      {error.message ||
                        'Failed to fetch clients. Please try again.'}
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
              <div className="text-gray-500">Loading clients...</div>
            </div>
          ) : (
            <>
              <DataTable
                columns={tableColumns}
                data={paginatedData}
                visibleColumns={visibleColumns}
                sortConfig={sortConfig}
                onSort={handleSort}
                selectedRows={selectedRows}
                onSelectAll={handleSelectAll}
                onSelectRow={handleSelectRow}
                emptyMessage={
                  searchTerm.trim()
                    ? `No clients found matching "${searchTerm}"`
                    : `No ${activeTab} clients found`
                }
                height="100%"
                maxHeight="100%"
                className="flex-1 min-h-0 flex flex-col"
              />
              {/* Pagination moved to TabNavBar right side */}
            </>
          )}
        </div>
      </PageLayout>

      <DeleteConfirmationModal
        showNoSelection={showNoSelectionModal}
        showConfirmDelete={showDeleteConfirmModal}
        showDeleteResult={false}
        selectedCount={selectedRows.length}
        deleting={deleting}
        onCloseNoSelection={() => setShowNoSelectionModal(false)}
        onCloseConfirmDelete={() => setShowDeleteConfirmModal(false)}
        onCloseDeleteResult={() => { }}
        onConfirmDelete={handleConfirmDelete}
      />
    </>
  );
};

export default Clients;
