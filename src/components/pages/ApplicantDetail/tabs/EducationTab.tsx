import React from 'react';
import Button from '../../../atoms/Button';
import Text from '../../../atoms/Text';
import SearchBox from '../../../atoms/SearchBox';
import DataTable from '../../../molecules/DataTable';
import Badge from '../../../atoms/Badge';

interface EducationTabProps {
    educationData: any[];
    educationSearch: string;
    setEducationSearch: (value: string) => void;
    canUpdateCandidates: boolean;
    handleEditEducation: () => void; // Changed to handle bulk edit
    filterEducationData: (data: any[], search: string) => any[];
}

export const EducationTab: React.FC<EducationTabProps> = ({
    educationData,
    educationSearch,
    setEducationSearch,
    canUpdateCandidates,
    handleEditEducation,
    filterEducationData,
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Text variant="h4" className="text-gray-900 font-semibold">
                    Education Details
                </Text>
                <div className="flex items-center gap-2">
                    <SearchBox
                        placeholder="Search education"
                        onChange={value => setEducationSearch(value)}
                        className="w-60"
                        value={educationSearch}
                    />
                    <Button
                        type="button"
                        variant="primary"
                        onClick={canUpdateCandidates ? handleEditEducation : undefined}
                        disabled={!canUpdateCandidates}
                    >
                        Manage Education
                    </Button>
                </div>
            </div>
            <DataTable
                columns={[
                    { key: 'educationType', label: 'EDUCATION TYPE' },
                    { key: 'highestDegree', label: 'HIGHEST DEGREE' },
                    { key: 'subject', label: 'SUBJECT' },
                    { key: 'college', label: 'COLLEGE' },
                    { key: 'university', label: 'UNIVERSITY' },
                    { key: 'gpa', label: 'GPA' },
                    { key: 'yearOfPassing', label: 'YEAR OF PASSING' },
                    { key: 'isPursuing', label: 'IS PURSUING?' },
                ]}
                data={filterEducationData(educationData, educationSearch).map(
                    (item: any) => ({
                        ...item,
                        isPursuing: (
                            <Badge
                                variant={item.isPursuing === 'Yes' ? 'success' : 'secondary'}
                                size="sm"
                            >
                                {item.isPursuing}
                            </Badge>
                        ),
                        educationType: item.educationType || item.education_type || 'Not specified',
                        subject: Array.isArray(item.subject) ? item.subject.join(', ') : item.subject,
                    })
                )}
                visibleColumns={{
                    educationType: true,
                    highestDegree: true,
                    subject: true,
                    college: true,
                    university: true,
                    gpa: true,
                    yearOfPassing: true,
                    isPursuing: true,
                }}
                className="mt-4"
            />
        </div>
    );
};