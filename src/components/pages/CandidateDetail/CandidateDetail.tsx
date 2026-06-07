import React, { useState } from 'react';
import DetailHeader from '../../organisms/DetailHeader';
import ProfileSummary from '../../molecules/ProfileSummary';
import DetailTemplate from '../../templates/DetailTemplate';
import Text from '../../atoms/Text';
import DataTable from '../../molecules/DataTable';

// Example showing how to use the modular detail system for different entity types
// This is a template that can be copied and adapted for Client details, Vendor details, etc.

interface CandidateDetailProps {
    candidateId: string;
}

const CandidateDetail: React.FC<CandidateDetailProps> = ({ candidateId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [canEdit, setCanEdit] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Mock candidate data - replace with actual API call
    const mockCandidateData = {
        name: 'Sarah Johnson',
        code: 'CAN001',
        designation: 'Full Stack Developer',
        contactInfo: {
            location: 'San Francisco, CA',
            phone: '+1-555-0123',
            email: 'sarah.johnson@email.com',
            dob: '1992-03-20'
        },
        linkedinProfile: 'https://linkedin.com/in/sarah-johnson',
        isFavorite: true,
        isActivelyLooking: false,
        photo: '/candidate-photo.jpg'
    };

    // Summary metrics
    const summaryItems = [
        {
            label: 'Experience',
            value: '5 years',
            icon: 'briefcase' as const,
            highlight: true
        },
        {
            label: 'Current Salary',
            value: 120000,
            icon: 'chart' as const,
            type: 'currency' as const
        },
        {
            label: 'Skills Match',
            value: 85,
            icon: 'star' as const,
            type: 'percentage' as const
        },
        {
            label: 'Last Contact',
            value: '2024-01-15',
            icon: 'calendar' as const,
            type: 'date' as const
        }
    ];

    // Mock project data
    const projectData = [
        {
            id: '1',
            name: 'E-commerce Platform',
            role: 'Lead Developer',
            duration: '6 months',
            technologies: 'React, Node.js, MongoDB'
        },
        {
            id: '2',
            name: 'Mobile Banking App',
            role: 'Frontend Developer',
            duration: '4 months',
            technologies: 'React Native, TypeScript'
        }
    ];

    // Event handlers
    const handleEdit = () => {
        console.log('Edit candidate:', candidateId);
    };

    const handleFavorite = () => {
        console.log('Toggle favorite for candidate:', candidateId);
    };

    const handleViewProfile = () => {
        console.log('View full profile for candidate:', candidateId);
    };

    // Tab definitions
    const tabs = [
        {
            id: 'profile',
            label: 'Profile Details',
            content: (
                <div className="space-y-6">
                    <Text variant="h4" className="text-gray-900">Detailed Profile Information</Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Text size="sm" className="text-gray-600 font-medium">Personal Information</Text>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <Text>Detailed personal information would go here...</Text>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Text size="sm" className="text-gray-600 font-medium">Professional Goals</Text>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <Text>Career objectives and goals would go here...</Text>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'projects',
            label: 'Projects',
            content: (
                <div className="space-y-4">
                    <Text variant="h4" className="text-gray-900">Project Experience</Text>
                    <DataTable
                        columns={[
                            { key: 'name', label: 'Project Name' },
                            { key: 'role', label: 'Role' },
                            { key: 'duration', label: 'Duration' },
                            { key: 'technologies', label: 'Technologies' }
                        ]}
                        data={projectData}
                        visibleColumns={{
                            name: true,
                            role: true,
                            duration: true,
                            technologies: true
                        }}
                        className="mt-4"
                    />
                </div>
            ),
            badge: projectData.length
        },
        {
            id: 'assessments',
            label: 'Assessments',
            content: (
                <div className="text-center py-8">
                    <Text className="text-gray-500">No assessments completed yet</Text>
                </div>
            )
        }
    ];

    return (
        <DetailTemplate
            // Loading and error states
            isLoading={isLoading}
            error={undefined}

            // Header section
            header={
                <DetailHeader
                    name={mockCandidateData.name}
                    code={mockCandidateData.code}
                    designation={mockCandidateData.designation}
                    contactInfo={mockCandidateData.contactInfo}
                    linkedinProfile={mockCandidateData.linkedinProfile}
                    isFavorite={mockCandidateData.isFavorite}
                    isActivelyLooking={mockCandidateData.isActivelyLooking}
                    photo={mockCandidateData.photo}
                    onEdit={handleEdit}
                    onFavorite={handleFavorite}
                    onViewResume={handleViewProfile}
                    canEdit={canEdit}
                />
            }



            // Tabbed content
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}

            // Sidebar content
            sidebar={
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <Text variant="h4" className="mb-4 text-gray-900">Quick Actions</Text>
                        <div className="space-y-3">
                            <button className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                <Text size="sm" className="text-blue-700 font-medium">Schedule Interview</Text>
                            </button>
                            <button className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                                <Text size="sm" className="text-green-700 font-medium">Send Message</Text>
                            </button>
                            <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <Text size="sm" className="text-gray-700 font-medium">View Full History</Text>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <Text variant="h4" className="mb-4 text-gray-900">Recent Activity</Text>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                <div>
                                    <Text size="sm" className="text-gray-900">Profile updated</Text>
                                    <Text size="xs" className="text-gray-500">2 hours ago</Text>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                <div>
                                    <Text size="sm" className="text-gray-900">Assessment completed</Text>
                                    <Text size="xs" className="text-gray-500">1 day ago</Text>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default CandidateDetail;
