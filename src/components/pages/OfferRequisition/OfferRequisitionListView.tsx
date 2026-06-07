// src/components/pages/OfferRequisition/OfferRequisitionListView.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { showSuccessToast, showErrorToast, showInfoToast } from '../../../utils/toast';
import FilterBar from '../../molecules/FilterBar';
import FilterPanel, { FilterField } from '../../molecules/FilterPanel';
import TabNavBar from '../../molecules/TabNavBar';
import DataTable from '../../molecules/DataTable';
import Header from '../../molecules/Header';
import DeleteConfirmationModal from '../../molecules/DeleteConfirmationModal';
import { ColumnConfig } from '../../molecules/ColumnSelector';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Avatar from '../../atoms/Avatar/Avatar';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';  // already imported
import Icon from '../../atoms/Icon';

// Types
export interface OfferRequisitionListItem {
  id: string;
  req_id: string;
  candidate_name: string;
  client_name: string;
  designation: string;
  placement_type: string;      // 'Organic' | 'Routing'
  net_margin: number;          // Net profit percentage (read from backend)
  status: 'Draft' | 'Pending' | 'Approved' | 'Floated';
  // Hierarchy fields to compute "Pending With"
  recruiter: string;
  teamLead: string;
  deliveryMgr: string;
  accountMgr: string;
  clientManager: string;
  businessHead: string;
  vp: string;
  created_date: string;        // ISO date string
  // Internal use only for Pending With calculation
  current_approver_level?: number; // 0=recruiter,1=teamLead,2=deliveryMgr,3=accountMgr,4=clientManager,5=businessHead,6=vp
}

// Helper: determine "Pending With" based on status and current approver level
const getPendingWith = (req: OfferRequisitionListItem): string => {
  if (req.status !== 'Pending') return '-';
  const hierarchy = [
    req.recruiter,
    req.teamLead,
    req.deliveryMgr,
    req.accountMgr,
    req.clientManager,
    req.businessHead,
    req.vp
  ];
  const level = req.current_approver_level ?? 0;
  return hierarchy[level] || 'Unknown';
};

// Mock data (fixed: removed `null` for current_approver_level)
const mockRequisitions: OfferRequisitionListItem[] = [
  {
    id: '1',
    req_id: 'REQ-001',
    candidate_name: 'John Doe',
    client_name: 'Client A',
    designation: 'Software Engineer',
    placement_type: 'Organic',
    net_margin: 18.75,
    status: 'Pending',
    recruiter: 'Recruiter A',
    teamLead: 'Team Lead X',
    deliveryMgr: 'DM John',
    accountMgr: 'AM Sarah',
    clientManager: 'CM David',
    businessHead: 'BH Robert',
    vp: 'VP Smith',
    current_approver_level: 1, // Pending with Team Lead
    created_date: '2025-05-01T10:00:00Z',
  },
  {
    id: '2',
    req_id: 'REQ-002',
    candidate_name: 'Jane Smith',
    client_name: 'Client B',
    designation: 'Tech Lead',
    placement_type: 'Routing',
    net_margin: 22.5,
    status: 'Approved',
    recruiter: 'Recruiter B',
    teamLead: 'Team Lead Y',
    deliveryMgr: 'DM Jane',
    accountMgr: 'AM Mike',
    clientManager: 'CM Lisa',
    businessHead: 'BH Alice',
    vp: 'VP John',
    // current_approver_level omitted → undefined
    created_date: '2025-05-02T10:00:00Z',
  },
  {
    id: '3',
    req_id: 'REQ-003',
    candidate_name: 'Robert Johnson',
    client_name: 'Client C',
    designation: 'Senior Developer',
    placement_type: 'Organic',
    net_margin: 12.5,
    status: 'Draft',
    recruiter: 'Recruiter C',
    teamLead: 'Team Lead Z',
    deliveryMgr: 'DM Robert',
    accountMgr: 'AM Emma',
    clientManager: 'CM James',
    businessHead: 'BH David',
    vp: 'VP Linda',
    created_date: '2025-05-03T10:00:00Z',
  },
  {
    id: '4',
    req_id: 'REQ-004',
    candidate_name: 'Emily Davis',
    client_name: 'Client A',
    designation: 'Product Manager',
    placement_type: 'Routing',
    net_margin: 30.0,
    status: 'Floated',
    recruiter: 'Recruiter D',
    teamLead: 'Team Lead W',
    deliveryMgr: 'DM Emily',
    accountMgr: 'AM Tom',
    clientManager: 'CM Rachel',
    businessHead: 'BH Steve',
    vp: 'VP Karen',
    created_date: '2025-05-04T10:00:00Z',
  },
];

const OfferRequisitionListView: React.FC = () => {
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState(mockRequisitions);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'created_date',
    direction: 'desc',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showNoSelectionModal, setShowNoSelectionModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteResultModal, setShowDeleteResultModal] = useState(false);
  const [deleteResultMessage, setDeleteResultMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<string, string | string[] | null>>(filters);

  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig>({
    req_id: true,
    candidate_name: true,
    client_name: true,
    designation: true,
    placement_type: true,
    net_margin: true,
    status: true,
    pending_with: true,
    created_date: true,
    actions: true,   // ✅ Added actions column visibility
  });

  // Compute tab counts
  const tabCounts = {
    all: requisitions.length,
    draft: requisitions.filter(r => r.status === 'Draft').length,
    pending: requisitions.filter(r => r.status === 'Pending').length,
    approved: requisitions.filter(r => r.status === 'Approved').length,
    floated: requisitions.filter(r => r.status === 'Floated').length,
  };

  // Filter and search
  const filteredData = useMemo(() => {
    return requisitions.filter(req => {
      const matchesSearch = req.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            req.req_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'draft') matchesTab = req.status === 'Draft';
      else if (activeTab === 'pending') matchesTab = req.status === 'Pending';
      else if (activeTab === 'approved') matchesTab = req.status === 'Approved';
      else if (activeTab === 'floated') matchesTab = req.status === 'Floated';
      
      let matchesFilters = true;
      if (filters.status && filters.status !== req.status) matchesFilters = false;
      if (filters.placement_type && filters.placement_type !== req.placement_type) matchesFilters = false;
      if (filters.client_name && filters.client_name !== req.client_name) matchesFilters = false;
      
      return matchesSearch && matchesTab && matchesFilters;
    });
  }, [requisitions, searchTerm, activeTab, filters]);

  // Sorting and pagination
  const sortedData = useMemo(() => {
    const sorted = [...filteredData];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      let aVal: any = a[key as keyof OfferRequisitionListItem];
      let bVal: any = b[key as keyof OfferRequisitionListItem];
      if (key === 'net_margin') {
        aVal = a.net_margin;
        bVal = b.net_margin;
      } else if (key === 'created_date') {
        aVal = new Date(a.created_date).getTime();
        bVal = new Date(b.created_date).getTime();
      } else if (key === 'pending_with') {
        aVal = getPendingWith(a);
        bVal = getPendingWith(b);
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedRows([]);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const clearFilters = () => setFilters({});

  const handleNewRequisition = () => {
    navigate('/offer-requisitions/new');
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows(checked ? paginatedData.map(req => req.id) : []);
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => (checked ? [...prev, id] : prev.filter(rowId => rowId !== id)));
  };

  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) setShowNoSelectionModal(true);
    else setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setRequisitions(prev => prev.filter(r => !selectedRows.includes(r.id)));
      showSuccessToast(`Successfully deleted ${selectedRows.length} requisition(s)`);
      setSelectedRows([]);
      setShowDeleteConfirmModal(false);
    } catch (err) {
      showErrorToast('Failed to delete requisitions');
      setDeleteResultMessage('Deletion failed. Please try again.');
      setShowDeleteResultModal(true);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = (format: string) => {
    if (!filteredData.length) {
      showInfoToast('No data to export');
      return;
    }
    const visibleKeys = Object.keys(visibleColumns).filter(k => visibleColumns[k]);
    const exportData = filteredData.map(req => {
      const row: any = {};
      visibleKeys.forEach(key => {
        let val = req[key as keyof OfferRequisitionListItem];
        if (key === 'created_date') val = new Date(req.created_date).toLocaleDateString();
        else if (key === 'net_margin') val = `${req.net_margin}%`;
        else if (key === 'pending_with') val = getPendingWith(req);
        else if (key === 'status') val = req.status;
        else if (key === 'client_name') val = req.client_name;
        else if (key === 'placement_type') val = req.placement_type;
        else if (key === 'actions') val = ''; // skip actions column in export
        else val = req[key as keyof OfferRequisitionListItem];
        row[tableColumns.find(c => c.key === key)?.label || key] = val ?? '';
      });
      return row;
    });

    if (format === 'csv') {
      const headers = Object.keys(exportData[0]);
      const csvRows = [headers.join(','), ...exportData.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `offer-requisitions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'OfferRequisitions');
      XLSX.writeFile(wb, `offer-requisitions-${new Date().toISOString().slice(0, 10)}.xlsx`);
      showSuccessToast('Exported to Excel successfully');
    }
  };

  const handleApplyFilters = () => {
    handleFilterChange(localFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    clearFilters();
    setLocalFilters({});
    setShowFilters(false);
  };

  const handleSaveView = () => {
    console.log('Save view clicked');
  };

  const handleColumnsReset = () => {
    setVisibleColumns({
      req_id: true,
      candidate_name: true,
      client_name: true,
      designation: true,
      placement_type: true,
      net_margin: true,
      status: true,
      pending_with: true,
      created_date: true,
      actions: true,
    });
  };

  const profileOptions = [
    { value: 'all', label: `All Requisitions (${tabCounts.all})` },
    { value: 'draft', label: `Drafts (${tabCounts.draft})` },
    { value: 'pending', label: `Pending (${tabCounts.pending})` },
    { value: 'approved', label: `Approved (${tabCounts.approved})` },
    { value: 'floated', label: `Floated (${tabCounts.floated})` },
  ];

  const customTabs = [
    { id: 'all', label: `All Requisitions (${tabCounts.all})` },
    { id: 'draft', label: `Drafts (${tabCounts.draft})` },
    { id: 'pending', label: `Pending (${tabCounts.pending})` },
    { id: 'approved', label: `Approved (${tabCounts.approved})` },
    { id: 'floated', label: `Floated (${tabCounts.floated})` },
  ];

  const tableColumns = [
    {
      key: 'req_id',
      label: 'Requisition ID',
      sortable: true,
      width: '120px',
      render: (value: string, row: OfferRequisitionListItem) => (
        <div
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={() => navigate(`/offer-requisitions/${row.id}`)}
        >
          {value}
        </div>
      ),
    },
    {
      key: 'candidate_name',
      label: 'Candidate Name',
      sortable: true,
      width: '180px',
    },
    {
      key: 'client_name',
      label: 'Client',
      sortable: true,
      width: '150px',
    },
    {
      key: 'designation',
      label: 'Designation',
      sortable: true,
      width: '160px',
    },
    {
      key: 'placement_type',
      label: 'Placement Type',
      sortable: true,
      width: '130px',
      render: (value: string) => (
        <Badge variant={value === 'Organic' ? 'success' : 'secondary'}>{value}</Badge>
      ),
    },
    {
      key: 'net_margin',
      label: 'Net Margin %',
      sortable: true,
      width: '120px',
      render: (value: number) => (
        <span className={`font-semibold ${value >= 20 ? 'text-green-600' : 'text-orange-500'}`}>
          {value.toFixed(2)}%
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (value: string) => {
        let variant: 'success' | 'warning' | 'danger' | 'info' | 'secondary' = 'secondary';
        if (value === 'Pending') variant = 'warning';
        else if (value === 'Approved') variant = 'success';
        else if (value === 'Floated') variant = 'info';
        else if (value === 'Draft') variant = 'secondary';
        return <Badge variant={variant}>{value}</Badge>;
      },
    },
    {
      key: 'pending_with',
      label: 'Pending With',
      sortable: true,
      width: '150px',
      render: (value: any, row: OfferRequisitionListItem) => {
        const pending = getPendingWith(row);
        return <span>{pending}</span>;
      },
    },
    {
      key: 'created_date',
      label: 'Created Date',
      sortable: true,
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    // ✅ New Actions column
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '100px',
      render: (value: any, row: OfferRequisitionListItem) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/offer-requisitions/${row.id}/approval`)}
        >
          Manage
        </Button>
      ),
    },
  ];

  const columnOptions = tableColumns.map(col => ({ key: col.key, label: col.label }));

  const filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'Draft', label: 'Draft' },
        { value: 'Pending', label: 'Pending' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Floated', label: 'Floated' },
      ],
    },
    {
      key: 'placement_type',
      label: 'Placement Type',
      type: 'select',
      options: [
        { value: 'Organic', label: 'Organic' },
        { value: 'Routing', label: 'Routing' },
      ],
    },
    {
      key: 'client_name',
      label: 'Client',
      type: 'select',
      options: [
        { value: 'Client A', label: 'Client A' },
        { value: 'Client B', label: 'Client B' },
        { value: 'Client C', label: 'Client C' },
      ],
    },
  ];

  return (
    <>
      <PageLayout
        isLoading={loading}
        header={
          <Header
            title="Offer Requisitions"
            showNewRecordButton={true}
            newRecordButtonText="New Requisition"
            onNewRecord={handleNewRequisition}
          />
        }
        filterBar={
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by candidate, requisition ID..."
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
          />
        }
        filtersPanel={
          showFilters ? (
            <FilterPanel
              fields={filterFields}
              values={localFilters}
              onValuesChange={setLocalFilters}
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
              title="Filters"
              columns={3}
            />
          ) : undefined
        }
        tabNav={
          <TabNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            hasSelectedItems={selectedRows.length > 0}
            onDeleteSelected={handleDeleteSelected}
            canDelete={true}
            customTabs={customTabs}
            pagination={{
              currentPage,
              totalPages,
              onPageChange: setCurrentPage,
              itemsPerPage,
              onItemsPerPageChange: setItemsPerPage,
              pageInfoFormat: (cur, total) => `${cur} of ${total}`,
            }}
          />
        }
      >
        <div className="h-full flex flex-col">
          <DataTable
            columns={tableColumns}
            data={paginatedData}
            visibleColumns={visibleColumns}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            emptyMessage="No requisitions found"
            height="100%"
            maxHeight="calc(100vh - 280px)"
          />
        </div>
      </PageLayout>

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
    </>
  );
};

export default OfferRequisitionListView;