import React, { useState } from 'react';
import { EducationDetail } from '../../../../types/recruitment';
import DataTable, { TableColumn } from '../../../molecules/DataTable';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import Badge from '../../../atoms/Badge';
import { formatMonthYear } from '../../../../utils/dateFormat';

interface EducationTabProps {
  data: EducationDetail[];
  canEdit: boolean;
  onUpdate: (data: EducationDetail[]) => void;
}

const EducationTab: React.FC<EducationTabProps> = ({ data, canEdit, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setShowManageModal] = useState(false);

  const tableColumns: TableColumn[] = [
    {
      key: 'education_type',
      label: 'EDUCATION TYPE',
      sortable: true,
      width: '150px',
      render: (value) => <span className="font-medium">{value || 'N/A'}</span>,
    },
    {
      key: 'highest_degree',
      label: 'HIGHEST DEGREE',
      sortable: true,
      width: '150px',
      render: (value) => <span className="font-medium">{value || 'N/A'}</span>,
    },
    {
      key: 'subject',
      label: 'SUBJECT',
      sortable: true,
      width: '150px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'college',
      label: 'COLLEGE',
      sortable: true,
      width: '200px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'university',
      label: 'UNIVERSITY',
      sortable: true,
      width: '200px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'gpa',
      label: 'GPA',
      sortable: true,
      width: '100px',
      render: (value) => (
        <Badge variant="info" size="sm">
          {value || 'N/A'}
        </Badge>
      ),
    },
    {
      key: 'year_of_passing',
      label: 'YEAR OF PASSING',
      sortable: true,
      width: '150px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'is_pursuing',
      label: 'IS PURSUING?',
      sortable: true,
      width: '120px',
      render: (value, row: any) => {
        const isPursuing = row.is_pursuing === 'Yes' || row.is_pursuing === true || row.isPursuing === 'Yes' || row.isPursuing === true;
        return (
          <Badge variant={isPursuing ? 'success' : 'secondary'} size="sm">
            {isPursuing ? 'Yes' : 'No'}
          </Badge>
        );
      },
    },
  ];

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.education_type?.toLowerCase().includes(searchLower) ||
      item.highest_degree?.toLowerCase().includes(searchLower) ||
      item.college?.toLowerCase().includes(searchLower) ||
      item.university?.toLowerCase().includes(searchLower)
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
              placeholder="Search education..."
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
            Manage Education
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
          emptyMessage="No education records found"
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Icon name="book" size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No education records found</p>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowManageModal(true)}
            >
              Add Education
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EducationTab;
