import React, { useState } from 'react';
import { CertificationDetail } from '../../../../types/recruitment';
import DataTable, { TableColumn } from '../../../molecules/DataTable';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import Badge from '../../../atoms/Badge';

interface CertificationTabProps {
  data: CertificationDetail[];
  canEdit: boolean;
  onUpdate: (data: CertificationDetail[]) => void;
}

const CertificationTab: React.FC<CertificationTabProps> = ({ data, canEdit, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setShowManageModal] = useState(false);

  const tableColumns: TableColumn[] = [
    {
      key: 'certification_name',
      label: 'Certification Name',
      sortable: true,
      width: '250px',
      render: (value) => <span className="font-medium">{value || 'N/A'}</span>,
    },
    {
      key: 'issuing_organization',
      label: 'Issuing Organization',
      sortable: true,
      width: '220px',
      render: (value) => <span>{value || 'N/A'}</span>,
    },
    {
      key: 'date_obtained',
      label: 'Date Obtained',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span className="text-sm">
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'expiry_date',
      label: 'Expiry Date',
      sortable: true,
      width: '150px',
      render: (value) => {
        if (!value) return <span className="text-sm text-gray-500">No Expiry</span>;
        
        const expiryDate = new Date(value);
        const today = new Date();
        const isExpired = expiryDate < today;
        const isExpiringSoon = expiryDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {expiryDate.toLocaleDateString()}
            </span>
            {isExpired && (
              <Badge variant="danger" size="sm">
                Expired
              </Badge>
            )}
            {!isExpired && isExpiringSoon && (
              <Badge variant="warning" size="sm">
                Expiring Soon
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.certification_name?.toLowerCase().includes(searchLower) ||
      item.issuing_organization?.toLowerCase().includes(searchLower)
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
              placeholder="Search certifications..."
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
            Manage Certificate
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
          emptyMessage="No certification records found"
        />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Icon name="award" size={48} className="text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No certification records found</p>
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowManageModal(true)}
            >
              Add Certification
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CertificationTab;
