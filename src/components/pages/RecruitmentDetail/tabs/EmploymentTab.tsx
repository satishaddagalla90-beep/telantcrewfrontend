import React, { useState } from 'react';
import { EmploymentDetail } from '../../../../types/recruitment';
import DataTable, { TableColumn } from '../../../molecules/DataTable';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import Badge from '../../../atoms/Badge';
import { formatMonthYear } from '../../../../utils/dateFormat';

interface EmploymentTabProps {
  data: EmploymentDetail[];
  canEdit: boolean;
  onUpdate: (data: EmploymentDetail[]) => void;
}

const EmploymentTab: React.FC<EmploymentTabProps> = ({ data, canEdit, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setShowManageModal] = useState(false);

  const tableColumns: TableColumn[] = [
    {
      key: 'organization_name',
      label: 'Organization Name',
      sortable: true,
      width: '200px',
      render: (value) => <span className="font-medium">{value || 'N/A'}</span>,
    },
    {
      key: 'job_type',
      label: 'Job Type',
      sortable: true,
      width: '130px',
      render: (value) => (
        <Badge variant="info" size="sm">
          {value || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'payroll_organization',
      label: 'Payroll Organization',
      sortable: true,
      width: '200px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'designation',
      label: 'Designation',
      sortable: true,
      width: '180px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      width: '150px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'from_to',
      label: 'From - To',
      sortable: false,
      width: '180px',
      render: (value, row: EmploymentDetail) => {
        const fromDate = row.from_date || (row as any).fromDate;
        const toDate = row.to_date || (row as any).toDate;
        const isCurrent = (row as any).is_current_job || (row as any).isCurrentJob;

        const formattedFromDate = formatMonthYear(fromDate);
        const formattedToDate = isCurrent
          ? 'Present'
          : toDate ? formatMonthYear(toDate) : 'N/A';
          
        return (
          <span className="text-sm">
            {formattedFromDate} - {formattedToDate}
          </span>
        );
      },
    },
  ];

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.organization_name?.toLowerCase().includes(searchLower) ||
      item.designation?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search employment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        {canEdit && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowManageModal(true)}
          >
            <Icon name="plus" size={16} className="mr-1" />
            Manage Employment
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredData.length > 0 ? (
        <DataTable
          columns={tableColumns}
          data={filteredData}
          visibleColumns={Object.fromEntries(tableColumns.map((c) => [c.key, true]))}
          loading={false}
          emptyMessage="No employment records found"
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Icon name="briefcase" size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No employment records found</p>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowManageModal(true)}
            >
              Add Employment
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmploymentTab;
