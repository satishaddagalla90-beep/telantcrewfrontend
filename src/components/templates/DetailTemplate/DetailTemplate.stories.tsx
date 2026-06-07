import type { Meta, StoryObj } from '@storybook/react';
import DetailTemplate from './DetailTemplate';
import Text from '../../atoms/Text';
import Button from '../../atoms/Button';

// Mock Breadcrumb Component
const MockBreadcrumb = () => (
    <div className="flex items-center space-x-2">
        <span className="text-primary-600 hover:text-primary-700">Dashboard</span>
        <span className="text-gray-400">/</span>
        <span className="text-primary-600 hover:text-primary-700">Applicants</span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">John Doe</span>
    </div>
);

// Mock Header Component
const MockHeader = () => (
    <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
            <div>
                <Text variant="h1" weight="semibold" className="text-gray-900">
                    John Doe (CDI23)
                </Text>
                <Text className="text-gray-600 mt-1">
                    Senior Software Engineer
                </Text>
            </div>
            <div className="flex space-x-3">
                <Button variant="outline" size="sm">Edit</Button>
                <Button variant="primary" size="sm">Contact</Button>
            </div>
        </div>
    </div>
);

// Mock Main Content
const MockMainContent = () => (
    <div className="mt-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
            <Text variant="h2" weight="semibold" className="text-gray-900 mb-4">
                Main Content Area
            </Text>
            <Text className="text-gray-600">
                This is where the main content would go - typically tabs with different sections
                like Education, Employment, Documents, etc.
            </Text>
        </div>
    </div>
);

// Mock Sidebar Content
const MockSidebar = () => (
    <>
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <Text variant="h3" weight="semibold" className="text-gray-900 mb-3">
                Professional Details
            </Text>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="text-gray-900">8 years</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">San Francisco</span>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
            <Text variant="h3" weight="semibold" className="text-gray-900 mb-3">
                Skills
            </Text>
            <div className="space-y-2">
                <div className="text-sm">
                    <div className="flex justify-between mb-1">
                        <span className="text-gray-900">React</span>
                        <span className="text-gray-600">Expert</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-4/5"></div>
                    </div>
                </div>
            </div>
        </div>
    </>
);

const meta: Meta<typeof DetailTemplate> = {
    title: 'Templates/DetailTemplate',
    component: DetailTemplate,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        breadcrumb: <MockBreadcrumb />,
        header: <MockHeader />,
        mainContent: <MockMainContent />,
        sidebar: <MockSidebar />,
    },
};

export const WithoutSidebar: Story = {
    args: {
        breadcrumb: <MockBreadcrumb />,
        header: <MockHeader />,
        mainContent: <MockMainContent />,
    },
};

export const WithoutHeader: Story = {
    args: {
        breadcrumb: <MockBreadcrumb />,
        mainContent: <MockMainContent />,
        sidebar: <MockSidebar />,
    },
};

export const MinimalLayout: Story = {
    args: {
        breadcrumb: <MockBreadcrumb />,
        mainContent: <MockMainContent />,
    },
};
