import React from 'react';
import Button from '../../../atoms/Button';
import Text from '../../../atoms/Text';
import SearchBox from '../../../atoms/SearchBox';
import DataTable from '../../../molecules/DataTable';
import Icon from '../../../atoms/Icon';


// Projects Tab
interface ProjectsTabProps {
    projectsData: any[];
    projectsSearch: string;
    setProjectsSearch: (value: string) => void;
    canUpdateCandidates: boolean;
    handleEditProject: () => void; // Changed to handle bulk edit
    filterProjectsData: (data: any[], search: string) => any[];
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
    projectsData,
    projectsSearch,
    setProjectsSearch,
    canUpdateCandidates,
    handleEditProject,
    filterProjectsData,
}) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
                Project Details
            </Text>
            <div className="flex items-center gap-2">
                <SearchBox
                    placeholder="Search projects"
                    onChange={value => setProjectsSearch(value)}
                    className="w-60"
                    value={projectsSearch}
                />
                <Button
                    type="button"
                    variant="primary"
                    onClick={canUpdateCandidates ? handleEditProject : undefined}
                    disabled={!canUpdateCandidates}
                >
                    Manage Projects
                </Button>
            </div>
        </div>
        <DataTable
            columns={[
                { key: 'customerName', label: 'CUSTOMER NAME' },
                { key: 'industry', label: 'INDUSTRY' },
                { key: 'projectType', label: 'PROJECT TYPE' },
                { key: 'designation', label: 'DESIGNATION' },
                { key: 'organizationName', label: 'ORGANIZATION' },
                { key: 'fromTo', label: 'FROM - TO' },
            ]}
            data={filterProjectsData(projectsData, projectsSearch)}
            visibleColumns={{
                customerName: true,
                industry: true,
                projectType: true,
                designation: true,
                organizationName: true,
                fromTo: true,
            }}
            className="mt-4"
        />
    </div>
);

// Certifications Tab
interface CertificationsTabProps {
    certificationsData: any[];
    certificationsSearch: string;
    setCertificationsSearch: (value: string) => void;
    canUpdateCandidates: boolean;
    handleEditCertification: () => void; // Changed to handle bulk edit
    filterCertificationsData: (data: any[], search: string) => any[];
}

export const CertificationsTab: React.FC<CertificationsTabProps> = ({
    certificationsData,
    certificationsSearch,
    setCertificationsSearch,
    canUpdateCandidates,
    handleEditCertification,
    filterCertificationsData,
}) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
                Certification Details
            </Text>
            <div className="flex items-center gap-2">
                <SearchBox
                    placeholder="Search certifications"
                    onChange={value => setCertificationsSearch(value)}
                    className="w-60"
                    value={certificationsSearch}
                />
                <Button
                    type="button"
                    variant="primary"
                    onClick={canUpdateCandidates ? handleEditCertification : undefined}
                    disabled={!canUpdateCandidates}
                >
                    Manage Certifications
                </Button>
            </div>
        </div>
        <DataTable
            columns={[
                { key: 'certificationName', label: 'CERTIFICATION NAME' },
                { key: 'issuingOrganization', label: 'ISSUING ORGANIZATION' },
                { key: 'dateObtained', label: 'DATE OBTAINED' },
                { key: 'expiryDate', label: 'EXPIRY DATE' },
            ]}
            data={filterCertificationsData(certificationsData, certificationsSearch)}
            visibleColumns={{
                certificationName: true,
                issuingOrganization: true,
                dateObtained: true,
                expiryDate: true,
            }}
            className="mt-4"
        />
    </div>
);

// Documents Tab
interface DocumentsTabProps {
    documentsData: any[];
    documentsSearch: string;
    setDocumentsSearch: (value: string) => void;
    canUpdateCandidates: boolean;
    handleEditDocument: () => void; // Changed to handle bulk edit
    handleViewFile: (fileName: string) => void;
    filterDocumentsData: (data: any[], search: string) => any[];
}

// Helper function to normalize document type display
const normalizeDocumentType = (value: string): string => {
    const typeMap: Record<string, string> = {
        'passport': 'Passport',
        'driving_license': 'Driving License',
        'national_id': 'National ID',
        'visa': 'Visa',
        'work_permit': 'Work Permit',
        'resume': 'Resume',
        'certificate': 'Certificate',
        'other': 'Other',
    };

    // Return mapped value or capitalize the value
    return typeMap[value] || value.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
    documentsData,
    documentsSearch,
    setDocumentsSearch,
    canUpdateCandidates,
    handleEditDocument,
    handleViewFile,
    filterDocumentsData,
}) => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Text variant="h4" className="text-gray-900 font-semibold">
                Document Details
            </Text>
            <div className="flex items-center gap-2">
                <SearchBox
                    placeholder="Search documents"
                    onChange={value => setDocumentsSearch(value)}
                    className="w-60"
                    value={documentsSearch}
                />
                <Button
                    type="button"
                    variant="primary"
                    onClick={canUpdateCandidates ? handleEditDocument : undefined}
                    disabled={!canUpdateCandidates}
                >
                    Manage Documents
                </Button>
            </div>
        </div>
        <DataTable
            columns={[
                { key: 'documentType', label: 'DOCUMENT TYPE' },
                { key: 'documentNumber', label: 'DOCUMENT NUMBER' },
                { key: 'documentDate', label: 'DOCUMENT DATE' },
                { key: 'expiryDate', label: 'EXPIRY DATE' },
                { key: 'documentFile', label: 'DOCUMENT FILE' },
            ]}
            data={filterDocumentsData(documentsData, documentsSearch).map(
                (item: any) => ({
                    ...item,
                    documentType: normalizeDocumentType(item.documentType),
                    documentFile: item.documentFile_url ? (
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                            onClick={() => handleViewFile(item.documentFile_url)}
                        >
                            {"View File"}
                        </button>
                    ) : (
                        <span className="text-gray-500">No file</span>
                    ),
                })
            )}
            visibleColumns={{
                documentType: true,
                documentNumber: true,
                documentDate: true,
                expiryDate: true,
                documentFile: true,
            }}
            className="mt-4"
        />
    </div>
);