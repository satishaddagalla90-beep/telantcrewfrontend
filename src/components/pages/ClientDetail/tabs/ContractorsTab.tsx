import React from 'react';
import Text from '../../../atoms/Text';
import DataTable from '../../../molecules/DataTable';

interface Contractor {
  empId: string;
  fullName: string;
  phone: string;
  email: string;
  skillSet: string;
}

interface ContractorsTabProps {
  contractors: Contractor[];
}

export const ContractorsTab: React.FC<ContractorsTabProps> = ({
  contractors,
}) => {
  return (
    <div className="bg-white rounded shadow p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <Text variant="h4" className="text-gray-900">
          Contractors ({contractors.length || 0})
        </Text>
        <a
          href="/template/contractors-download-template.xlsx"
          download
          className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
            />
          </svg>
          Download
        </a>
      </div>

      <DataTable
        columns={[
          { key: 'empId', label: 'CLIENT EMP ID' },
          { key: 'fullName', label: 'FULL NAME' },
          { key: 'phone', label: 'PHONE' },
          { key: 'email', label: 'EMAIL' },
          { key: 'skillSet', label: 'SKILL SET' },
          { key: 'actions', label: 'ACTIONS' },
        ]}
        data={contractors}
        visibleColumns={{
          empId: true,
          fullName: true,
          phone: true,
          email: true,
          skillSet: true,
          actions: true,
        }}
        className="mt-4"
        emptyMessage="No contractors available"
      />
    </div>
  );
};

export default ContractorsTab;
