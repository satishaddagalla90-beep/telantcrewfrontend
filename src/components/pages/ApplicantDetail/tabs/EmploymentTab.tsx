import React from 'react';
import Button from '../../../atoms/Button';
import Text from '../../../atoms/Text';
import SearchBox from '../../../atoms/SearchBox';
import DataTable from '../../../molecules/DataTable';

interface EmploymentTabProps {
    employmentData: any[];
    employmentSearch: string;
    setEmploymentSearch: (value: string) => void;
    canUpdateCandidates: boolean;
    handleEditEmployment: () => void; // Changed to handle bulk edit
    filterEmploymentData: (data: any[], search: string) => any[];
}

export const EmploymentTab: React.FC<EmploymentTabProps> = ({
    employmentData,
    employmentSearch,
    setEmploymentSearch,
    canUpdateCandidates,
    handleEditEmployment,
    filterEmploymentData,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Text variant="h4" className="text-gray-900 font-semibold">
                    Employment Details
                </Text>
                <div className="flex items-center gap-2">
                    <SearchBox
                        placeholder="Search employment"
                        onChange={value => setEmploymentSearch(value)}
                        className="w-60"
                        value={employmentSearch}
                    />
                    <Button
                        type="button"
                        variant="primary"
                        onClick={canUpdateCandidates ? handleEditEmployment : undefined}
                        disabled={!canUpdateCandidates}
                    >
                        Manage Employment
                    </Button>
                </div>
            </div>
            <DataTable
                columns={[
                    { key: 'organizationName', label: 'ORGANIZATION NAME' },
                    { key: 'jobType', label: 'JOB TYPE' },
                    { key: 'payrollOrganization', label: 'PAYROLL ORGANIZATION' },
                    { key: 'designation', label: 'DESIGNATION' },
                    { key: 'location', label: 'LOCATION' },
                    { key: 'fromTo', label: 'FROM - TO' },
                ]}
                data={filterEmploymentData(employmentData, employmentSearch)}
                visibleColumns={{
                    organizationName: true,
                    jobType: true,
                    payrollOrganization: true,
                    designation: true,
                    location: true,
                    fromTo: true,
                }}
                className="mt-4"
            />
        </div>
    );
};