import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../../hooks/useJobs';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import DataTable, { TableColumn } from '../../molecules/DataTable';
import FilterBar from '../../molecules/FilterBar';
import TabNavBar from '../../molecules/TabNavBar';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Badge from '../../atoms/Badge';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../../utils/toast';
import { useAuth } from '../../../components/auth/AuthContext';
import { JobListItem } from '../../../types/job';
import { createDisplayName } from '../../../utils';

interface MapJobsToCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  candidateHumanId: string;
  candidateName: string;
  onMapped?: () => void;
}

const MapJobsToCandidateModal: React.FC<MapJobsToCandidateModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  candidateHumanId,
  candidateName,
  onMapped,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMapping, setIsMapping] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Use the jobs hook for data fetching
  const {
    jobs,
    loading,
    currentPage,
    itemsPerPage,
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    totalPages,
    totalJobs,
  } = useJobs({ defaultLimit: 10 });

  const visibleColumns = useMemo(() => ({
    job_id: true,
    job_title: true,
    client_name: true,
    job_owner: true,
  }), []);

  const handleSelectRow = (id: string, selected: boolean) => {
    setSelectedRows(prev =>
      selected ? [...prev, id] : prev.filter(rowId => rowId !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedRows(selected ? jobs.map(j => j.id) : []);
  };

  const handleBulkMap = async () => {
    if (selectedRows.length === 0) return;

    const currentUserId = user?.id || user?._id || '';

    setIsMapping(true);
    try {
      let successCount = 0;
      let alreadyMappedCount = 0;
      
      for (const jobIdInternal of selectedRows) {
        const job = jobs.find(j => j.id === jobIdInternal);
        if (!job) continue;

        try {
          const response: any = await apiCall(API_ENDPOINTS.RECRUITMENT.MAP, {
            method: 'POST',
            body: JSON.stringify({
              candidate_id: candidateHumanId,
              job_id: job.job_id,
              mapped_by: currentUserId,
            }),
            showToaster: false, // Handle toasts manually for better precision
          });

          if (response && !response.error) {
            successCount++;
          } else {
            const errorMsg = response?.error?.message || "";
            if (errorMsg.toLowerCase().includes('already mapped')) {
              showWarningToast('Job already mapped to this candidate');
              alreadyMappedCount++;
            } else {
              // Show generic error for other failure reasons
              showErrorToast(errorMsg || `Failed to map job ${job.job_id}`);
            }
          }
        } catch (err) {
          console.error(`Failed to map job ${job.job_id}:`, err);
        }
      }

      if (successCount > 0) {
        showSuccessToast(`Successfully mapped ${candidateName} to ${successCount} job(s)`);
        setSelectedRows([]);
        if (onMapped) onMapped();
        onClose();
        // Navigate to requirements page with refresh as requested
        window.location.href = '/requirements';
      } else if (alreadyMappedCount === 0) {
        // Only show general failure if no "already mapped" warnings were shown
        showErrorToast('Failed to map candidate to selected jobs');
      }
    } catch (error: any) {
      console.error('Mapping error:', error);
      showErrorToast(error.message || 'Failed to map candidate to selected jobs');
    } finally {
      setIsMapping(false);
    }
  };

  const tableColumns: TableColumn[] = [
    {
      key: 'job_id',
      label: 'JOB ID',
      sortable: true,
      width: '120px',
      render: (value, row: JobListItem) => (
        <div 
          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
          onClick={() => navigate(`/jobs/${row.id}`)}
        >
          {row.job_id}
        </div>
      ),
    },
    {
      key: 'job_title',
      label: 'JOB TITLE',
      sortable: true,
      render: (value, row: JobListItem) => (
        <div className="font-medium text-gray-900">{row.job_title}</div>
      ),
    },
    {
      key: 'client_name',
      label: 'CLIENT NAME',
      sortable: true,
      width: '180px',
    },
    {
      key: 'job_owner',
      label: 'JOB OWNER',
      sortable: true,
      width: '150px',
      render: (value) => {
        if (!value) return '-';
        if (typeof value === 'object' && value.name) return value.name;
        return String(value);
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl">
              <Icon name="external-link" className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Map {candidateName} to Jobs
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Content Tabs & Search Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Custom Search & Filter Row - Matching Image 1 */}
          <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100">
             <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs by name, ID, title, or client..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 placeholder-gray-400 text-sm"
                />
              </div>
            </div>
          </div>


          {/* Table Area */}
          <div className="flex-1 overflow-auto p-0 px-2">
            <DataTable
              columns={tableColumns}
              data={jobs}
              visibleColumns={visibleColumns}
              loading={loading}
              selectedRows={selectedRows}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              emptyMessage="No jobs found matching your criteria"
              height="auto"
              className="border-none"
            />
          </div>

          {/* Custom Pagination Bar - Matching Image 1 */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-white text-sm text-gray-500">
            <div>
              Page {currentPage} of {totalPages} | Total: {totalJobs} jobs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-6 py-1.5 bg-gray-200 text-gray-700 rounded-md font-medium disabled:opacity-50 hover:bg-gray-300 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-6 py-1.5 bg-gray-800 text-white rounded-md font-medium disabled:opacity-50 hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-500 italic">
            {selectedRows.length} job(s) selected
          </div>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              onClick={onClose} 
              disabled={isMapping}
              className="bg-gray-800 text-white hover:bg-gray-700 min-w-[100px] border-none"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleBulkMap}
              loading={isMapping}
              disabled={selectedRows.length === 0}
              className="bg-blue-400 hover:bg-blue-500 min-w-[120px] border-none shadow-sm text-white"
            >
              Map Job
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapJobsToCandidateModal;
