import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupplierData, SuppliersResponse } from '../../../types/supplier';
import {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from '../../../utils/toast';
import Header from '../../molecules/Header';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel, { FilterField } from '../../molecules/FilterPanel';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import DeleteConfirmationModal from '../../molecules/DeleteConfirmationModal';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import { AsyncSelectOption } from '../../atoms/AsyncSelect';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Icon from '../../atoms/Icon';
import AccessDenied from '../../molecules/AccessDenied/AccessDenied';
import Badge from '../../atoms/Badge';
import {
  useLazySupplierTypeDropdown,
  useLazyEmpanelmentStatusDropdown,
  useLazyZoneDropdown,
} from '../../../hooks/useSupplierDropdowns';
import Avatar from '../../atoms/Avatar/Avatar';
import { suppliersAPI } from '../../../utils/api/SuppliersAPI';
import { useURLPagination } from '../../../hooks';
import { usePermissions } from '../../../hooks/usePermissions';
import { useDebouncedCallback } from '../../../hooks/useDebounce';
const Suppliers: React.FC = () => {
  const navigate = useNavigate();

  // Initialize permissions for suppliers module
  const {
    canReadSuppliers,
    canCreateSuppliers,
    canDeleteSuppliers,
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
    updateParams,
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
    defaultTab: 'all',
    defaultSearch: '',
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | null>>({
    supplier_type: null,
    empanelment_status: null,
    supplier_id: null,
    supplier_name: null,
    website: null,
    MSME: null,
    zone: null,
    created_by: null,
    createdDate: null,
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

  const [suppliersResponse, setSuppliersResponse] =
    useState<SuppliersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<any>(null);

  // Async filter option states for searchable filters
  const [supplierIdOptions, setSupplierIdOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingSupplierId, setLoadingSupplierId] = useState(false);
  const [supplierNameOptions, setSupplierNameOptions] = useState<
    AsyncSelectOption[]
  >([]);
  const [loadingSupplierName, setLoadingSupplierName] = useState(false);
  const [websiteOptions, setWebsiteOptions] = useState<AsyncSelectOption[]>([]);
  const [loadingWebsite, setLoadingWebsite] = useState(false);
  const [createdByOptions, setCreatedByOptions] = useState<AsyncSelectOption[]>(
    []
  );
  const [loadingCreatedBy, setLoadingCreatedBy] = useState(false);

  // Lazy-load hooks for dropdowns - only fetch when filters are opened
  const {
    options: supplierTypeOptionsHook,
    loading: loadingSupplierTypeHook,
    search: searchSupplierType,
    load: loadSupplierTypeOptions,
  } = useLazySupplierTypeDropdown();
  const {
    options: empanelmentStatusOptions,
    loading: loadingEmpanelmentStatus,
    search: searchEmpanelmentStatus,
    load: loadEmpanelmentStatusOptions,
  } = useLazyEmpanelmentStatusDropdown();
  const {
    options: zoneOptions,
    loading: loadingZone,
    search: searchZone,
    load: loadZoneOptions,
  } = useLazyZoneDropdown();

  // Load dropdown data when filters are opened
  useEffect(() => {
    if (showFilters) {
      loadSupplierTypeOptions();
      loadEmpanelmentStatusOptions();
      loadZoneOptions();
    }
  }, [showFilters, loadSupplierTypeOptions, loadEmpanelmentStatusOptions, loadZoneOptions]);

  // Fetch suppliers data using the proper API function
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build filters object for the API call
        const apiFilters: Record<string, string | null> = {};

        // Add search term
        if (searchTerm.trim()) {
          apiFilters.search = searchTerm.trim();
        }

        // Add activeTab filter for empanelment_status
        if (activeTab !== 'all') {
          // Map tab IDs to API status values (Title Case)
          const statusMap: Record<string, string> = {
            active: 'Active',
            newlead: 'NewLead',
            negotiation: 'Negotiation'
          };
          apiFilters.empanelment_status = statusMap[activeTab] || activeTab;
        }

        // Add other filters from the filter panel
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value.trim() !== '') {
            // Special handling for MSME filter (boolean value)
            if (key === 'MSME') {
              apiFilters[key] = value === 'true' ? 'true' : 'false';
            } else {
              apiFilters[key] = value;
            }
          }
        });

        const response = await suppliersAPI.fetchSuppliers(
          debouncedPage,
          itemsPerPage,
          apiFilters
        );

        setSuppliersResponse(response);
      } catch (err) {
        setError(err);
        showErrorToast('Failed to fetch suppliers');
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, [debouncedPage, itemsPerPage, searchTerm, activeTab, filters]);

  // Debounced search helpers for filter dropdowns
  const fetchSupplierFilterOptions = async (field: string, input: string) => {
    const apiFilters: Record<string, string | null> = {};
    if (input && input.trim()) {
      apiFilters.search = input.trim();
    }
    try {
      const res = await suppliersAPI.fetchSuppliers(1, 20, apiFilters);
      return res.suppliers || [];
    } catch (err) {
      return [];
    }
  };

  const debouncedSearchSupplierId = useDebouncedCallback(
    async (input: string) => {
      setLoadingSupplierId(true);
      const rows = await fetchSupplierFilterOptions('supplier_id', input);
      const opts: AsyncSelectOption[] = Array.from(
        new Map(
          rows.map((r: any) => [
            r.supplier_id,
            { value: r.supplier_id || '', label: r.supplier_id || '' },
          ])
        )
      ).map(([, v]) => v);
      setSupplierIdOptions(opts);
      setLoadingSupplierId(false);
    },
    400
  );

  const debouncedSearchSupplierName = useDebouncedCallback(
    async (input: string) => {
      setLoadingSupplierName(true);
      const rows = await fetchSupplierFilterOptions('supplier_name', input);
      const opts: AsyncSelectOption[] = Array.from(
        new Map(
          rows.map((r: any) => [
            r.supplier_name,
            { value: r.supplier_name || '', label: r.supplier_name || '' },
          ])
        )
      ).map(([, v]) => v);
      setSupplierNameOptions(opts);
      setLoadingSupplierName(false);
    },
    400
  );

  const debouncedSearchWebsite = useDebouncedCallback(async (input: string) => {
    setLoadingWebsite(true);
    const rows = await fetchSupplierFilterOptions('website', input);
    const opts: AsyncSelectOption[] = Array.from(
      new Map(
        rows.map((r: any) => [
          r.website,
          { value: r.website || '', label: r.website || '' },
        ])
      )
    ).map(([, v]) => v);
    setWebsiteOptions(opts);
    setLoadingWebsite(false);
  }, 400);

  const debouncedSearchCreatedBy = useDebouncedCallback(
    async (input: string) => {
      setLoadingCreatedBy(true);
      const rows = await fetchSupplierFilterOptions('created_by', input);
      const opts: AsyncSelectOption[] = Array.from(
        new Map(
          rows.map((r: any) => [
            r.created_by,
            { value: r.created_by || '', label: r.created_by || '' },
          ])
        )
      ).map(([, v]) => v);
      setCreatedByOptions(opts);
      setLoadingCreatedBy(false);
    },
    400
  );

  const tableColumns: TableColumn[] = [
    {
      key: 'supplier_id',
      label: 'Supplier ID',
      sortable: true,
      width: '140px',
      minWidth: '120px',
      render: (value, row: SupplierData) => (
        <div
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={() => navigate(`/suppliers/${row.id}`)}
        >
          {value}
        </div>
      ),
    },
    {
      key: 'supplier_name',
      label: 'Supplier Name (Status)',
      sortable: true,
      width: '200px',
      minWidth: '180px',
      render: (value, row: SupplierData) => {
        const displayName = row.supplier_name || '-';
        return (
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate(`/suppliers/${row.id}`)}>
            
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-600 hover:text-blue-800 hover:underline">{displayName}</span>
              <Badge
                variant={row.empanelment_status?.toLowerCase() === 'active' ? 'success' : 'danger'}
              >
                {row.empanelment_status ? row.empanelment_status.charAt(0).toUpperCase() + row.empanelment_status.slice(1) : '-'}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      key: 'supplier_display_name',
      label: 'Display Name',
      sortable: true,
      width: '140px',
      minWidth: '120px',
    },
    {
      key: 'supplier_type',
      label: 'Supplier Type',
      sortable: true,
      width: '160px',
      minWidth: '140px',
    },
    {
      key: 'website',
      label: 'Website',
      sortable: true,
      width: '220px',
      minWidth: '200px',
      render: value => {
        // Format the URL for display
        let displayUrl = value || '-';
        let linkUrl = value;

        // If value is in www.xyz.com format, display as is but link with https://
        if (value && value.startsWith('www.')) {
          linkUrl = `https://${value}`;
        }
        // If value doesn't have protocol and isn't www format, add https://www.
        else if (
          value &&
          !value.startsWith('http') &&
          !value.startsWith('www.')
        ) {
          displayUrl = `www.${value}`;
          linkUrl = `https://www.${value}`;
        }
        // If no value, show dash
        else if (!value) {
          displayUrl = '-';
          linkUrl = '#';
        }

        return (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
            onClick={e => {
              if (linkUrl === '#') e.preventDefault();
              e.stopPropagation();
            }}
          >
            {displayUrl}
          </a>
        );
      },
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '150px',
      minWidth: '130px',
      render: (value) => {
        if (!value) return '-';
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
      },
    },

    {
      key: 'industry',
      label: 'Industry',
      sortable: true,
      width: '200px',
      minWidth: '180px',
    },
    {
      key: 'address',
      label: 'Location',
      sortable: true,
      width: '180px',
      minWidth: '160px',
      render: value => {
        if (!value) return '-';
        return (
          `${value.city || ''}, ${value.state || ''}`.replace(
            /^,\s*|,\s*$/g,
            ''
          ) || '-'
        );
      },
    },
    // Empanelment Status merged into Supplier Name
    // {
    //   key: 'empanelment_status',
    //   label: 'Status',
    //   sortable: true,
    //   width: '120px',
    //   minWidth: '100px',
    //   render: value => (
    //     <span
    //       className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${value?.toLowerCase() === 'active'
    //         ? 'bg-green-100 text-green-800'
    //         : 'bg-red-100 text-red-800'
    //         }`}
    //     >
    //       {value ? value.charAt(0).toUpperCase() + value.slice(1) : '-'}
    //     </span>
    //   ),
    // },
    {
      key: 'created_by',
      label: 'Created By',
      sortable: true,
      width: '160px',
      minWidth: '140px',
    },
    {
      key: 'created',
      label: 'Created Date',
      sortable: true,
      width: '140px',
      minWidth: '120px',
      render: value => {
        if (!value) return '-';
        // Handle both string format and object format for backward compatibility
        const dateString = typeof value === 'string' ? value : value?.$date;
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
      },
    },
  ];

  const columnOptions = tableColumns.map(col => ({
    key: col.key,
    label: col.label,
  }));

  // Transform API data to match table expectations
  const transformedData = useMemo(() => {
    if (!suppliersResponse?.suppliers) return [];
    return suppliersResponse.suppliers.map(supplier => ({
      ...supplier,
      // Flatten some nested properties for easier table access
      location: supplier.address
        ? `${supplier.address.city || ''}, ${supplier.address.state || ''}`.replace(
          /^,\s*|,\s*$/g,
          ''
        )
        : '-',
      status: supplier.empanelment_status,
    }));
  }, [suppliersResponse]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return transformedData;
    return [...transformedData].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];

      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transformedData, sortConfig]);

  const paginatedData = useMemo(() => {
    return sortedData;
  }, [sortedData]);

  const totalPages = suppliersResponse?.total_pages || 0;

  const handleTabChange = useCallback(
    (tab: string) => {
      setSelectedRows([]);

      // Update URL with status parameter when tab changes
      const statusParam =
        tab === 'all'
          ? null
          : tab === 'active'
            ? 'Active'
            : tab === 'newlead'
              ? 'NewLead'
              : tab === 'negotiation'
                ? 'Negotiation'
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

  const supplierTabs = useMemo(
    () => [
      {
        id: 'all',
        label: 'All Suppliers',
      },
      {
        id: 'active',
        label: 'Active',
      },
      {
        id: 'newlead',
        label: 'Newlead',
      },
      {
        id: 'negotiation',
        label: 'Negotiation',
      },
    ],
    []
  );

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? paginatedData.map((item: any) => item.id) : []);
  };

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, id] : prev.filter(r => r !== id)
    );
  };

  const handleRowClick = (row: SupplierData) => {
    navigate(`/suppliers/${row.id}`);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) {
      setShowNoSelectionModal(true);
      return;
    }
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const result = await suppliersAPI.deleteSuppliers(selectedRows);
      if (result.success) {
        showSuccessToast(result.message);
        setSelectedRows([]);
        // Trigger a re-fetch of suppliers data
        setCurrentPage(currentPage); // This will trigger the useEffect
      } else {
        showErrorToast(result.message);
      }
    } catch (error) {
      showErrorToast('An error occurred while deleting records.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirmModal(false);
    }
  };

  const handleExport = (format: string) => {
    showInfoToast(`Export to ${format} - Coming soon!`);
  };

  const handleColumnsReset = () => {
    setVisibleColumns({
      supplier_id: true,
      supplier_name: true,
      supplier_display_name: true,
      supplier_type: true,
      website: true,
      category: true,
      industry: true,
      address: true,
      empanelment_status: true,
      created_by: true,
      created: true,
    });
  };

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    supplier_id: true,
    supplier_name: true,
    supplier_display_name: true,
    supplier_type: true,
    website: true,
    category: true,
    industry: true,
    address: true,
    empanelment_status: true,
    created_by: true,
    created: true,
  });

  const handleApplyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      supplier_type: null,
      empanelment_status: null,
      supplier_id: null,
      supplier_name: null,
      website: null,
      MSME: null,
      zone: null,
      created_by: null,
      createdDate: null,
    };
    setFilters(clearedFilters);
    setShowFilters(false);
    setCurrentPage(1);
  };

  // Profile filter options - memoized since they don't change
  const profileOptions = useMemo(
    () => [
      { value: 'all', label: 'All Suppliers' },
      { value: 'active', label: 'Active' },
      { value: 'newlead', label: 'Newlead' },
      { value: 'negotiation', label: 'Negotiation' },
    ],
    []
  );

  const handleNewSupplier = () => {
    navigate('/add-supplier');
  };

  const handleSaveView = () => {
    console.log('Save View clicked');
    showInfoToast('Save View feature coming soon!');
  };

  // Filter fields configuration for Suppliers - Updated to match backend API requirements
  const filterFields: FilterField[] = [
    {
      key: 'supplier_type',
      label: 'Supplier Type',
      type: 'async-select',
      placeholder: 'Select Supplier Type',
      asyncOptions: supplierTypeOptionsHook,
      onAsyncSearch: searchSupplierType,
      loading: loadingSupplierTypeHook,
    },
    {
      key: 'empanelment_status',
      label: 'Empanelment Status',
      type: 'async-select',
      placeholder: 'Select Empanelment Status',
      asyncOptions: empanelmentStatusOptions,
      onAsyncSearch: searchEmpanelmentStatus,
      loading: loadingEmpanelmentStatus,
    },
    {
      key: 'supplier_id',
      label: 'Supplier ID',
      type: 'async-select',
      placeholder: 'Search Supplier ID',
      asyncOptions: supplierIdOptions,
      onAsyncSearch: debouncedSearchSupplierId,
      loading: loadingSupplierId,
    },
    {
      key: 'supplier_name',
      label: 'Supplier Name',
      type: 'async-select',
      placeholder: 'Search Supplier Name',
      asyncOptions: supplierNameOptions,
      onAsyncSearch: debouncedSearchSupplierName,
      loading: loadingSupplierName,
    },
    {
      key: 'website',
      label: 'Website',
      type: 'async-select',
      placeholder: 'Search Website',
      asyncOptions: websiteOptions,
      onAsyncSearch: debouncedSearchWebsite,
      loading: loadingWebsite,
    },
    {
      key: 'MSME',
      label: 'MSME',
      type: 'select',
      placeholder: 'Select MSME Status',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    {
      key: 'zone',
      label: 'Zone',
      type: 'async-select',
      placeholder: 'Select Zone',
      asyncOptions: zoneOptions,
      onAsyncSearch: searchZone,
      loading: loadingZone,
    },
    {
      key: 'created_by',
      label: 'Created By',
      type: 'async-select',
      placeholder: 'Search Created By',
      asyncOptions: createdByOptions,
      onAsyncSearch: debouncedSearchCreatedBy,
      loading: loadingCreatedBy,
    },
    {
      key: 'createdDate',
      label: 'Created Date',
      type: 'date',
    },
  ];

  // Check if user has read access
  if (!permissionsLoading && !canReadSuppliers) {
    return (
      <AccessDenied message="You don't have permission to view suppliers. Please contact your administrator for access." />
    );
  }

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <PageLayout header={<Header title="Suppliers" />}>
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
        isLoading={loading}
        header={
          <Header
            title="Suppliers"
            showNewRecordButton={canCreateSuppliers}
            newRecordButtonText="New Supplier"
            newRecordButtonIcon="plus"
            disableNewRecord={!canCreateSuppliers}
            onNewRecord={canCreateSuppliers ? handleNewSupplier : undefined}
            refreshInterval={0}
          />
        }
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search suppliers..."
            searchDescription="Search by Supplier Name or Supplier ID"
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
            canViewData={canReadSuppliers}
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
            //   canDeleteSuppliers ? handleDeleteSelected : undefined
            // }
            // canDelete={canDeleteSuppliers}
            customTabs={supplierTabs}
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
                    Error loading suppliers
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      {error.message ||
                        'Failed to fetch suppliers. Please try again.'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                      onClick={() => setCurrentPage(currentPage)}
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
              <div className="text-gray-500">Loading suppliers...</div>
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
                    ? `No suppliers found matching "${searchTerm}"`
                    : `No ${activeTab} suppliers found`
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

export default Suppliers;
