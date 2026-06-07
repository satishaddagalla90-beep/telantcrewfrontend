import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import React from 'react';

const meta: Meta<typeof Header> = {
    title: 'Molecules/Header',
    component: Header,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'A dynamic header component that can display static titles or localStorage-based client information. Perfect for page headers with action buttons.',
            },
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <div className="min-h-screen bg-gray-50">
                    <Story />
                    <div className="p-6">
                        <div className="bg-white rounded-lg shadow-sm border p-6">
                            <p className="text-gray-600">Page content goes here...</p>
                        </div>
                    </div>
                </div>
            </BrowserRouter>
        ),
    ],
    argTypes: {
        title: {
            control: 'text',
            description: 'Static title to display (overrides localStorage)',
        },
        showNewRecordButton: {
            control: 'boolean',
            description: 'Show the new record/add button',
        },
        showCancelButton: {
            control: 'boolean',
            description: 'Show the cancel button',
        },
        showBackButton: {
            control: 'boolean',
            description: 'Show the back button',
        },
        newRecordButtonText: {
            control: 'text',
            description: 'Text for the new record button',
        },
        disableNewRecord: {
            control: 'boolean',
            description: 'Disable the new record button',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Applicants page example
export const ApplicantsPage: Story = {
    args: {
        title: 'Applicants',
        showNewRecordButton: true,
        newRecordButtonText: 'New Applicant',
        newRecordButtonIcon: 'plus',
        disableNewRecord: true,
        onNewRecord: action('New Applicant clicked'),
    },
};

// Users page example
export const UsersPage: Story = {
    args: {
        title: 'Users',
        showNewRecordButton: true,
        newRecordButtonText: 'New User',
        newRecordButtonIcon: 'user',
        disableNewRecord: false,
        onNewRecord: action('New User clicked'),
    },
};

// Clients page example
export const ClientsPage: Story = {
    args: {
        title: 'Clients',
        showNewRecordButton: true,
        newRecordButtonText: 'New Client',
        newRecordButtonIcon: 'buildings',
        disableNewRecord: false,
        onNewRecord: action('New Client clicked'),
    },
};

// Form page with cancel and back
export const FormPage: Story = {
    args: {
        title: 'Add New Applicant',
        showCancelButton: true,
        showBackButton: true,
        onCancel: action('Cancel clicked'),
        onBack: action('Back clicked'),
    },
};

// Dynamic localStorage-based header
export const DynamicTitle: Story = {
    args: {
        showNewRecordButton: true,
        showCancelButton: true,
        refreshInterval: 2000,
        onNewRecord: action('New Record clicked'),
        onCancel: action('Cancel clicked'),
    },
    render: (args) => {
        // Simulate localStorage data
        React.useEffect(() => {
            localStorage.setItem('clientName', 'TechCorp Inc.');
            localStorage.setItem('clientCode', 'TC001');

            return () => {
                localStorage.removeItem('clientName');
                localStorage.removeItem('clientCode');
            };
        }, []);

        return <Header {...args} />;
    },
};

// All button combinations
export const AllButtons: Story = {
    args: {
        title: 'Complete Example',
        showNewRecordButton: true,
        showCancelButton: true,
        showBackButton: true,
        newRecordButtonText: 'Add New',
        newRecordButtonIcon: 'plus',
        disableNewRecord: false,
        onNewRecord: action('New Record clicked'),
        onCancel: action('Cancel clicked'),
        onBack: action('Back clicked'),
    },
};

// Minimal header
export const MinimalHeader: Story = {
    args: {
        title: 'Simple Page',
        showNewRecordButton: false,
        showCancelButton: false,
        showBackButton: false,
    },
};

// Job Requisition page
export const JobRequisitionPage: Story = {
    args: {
        title: 'Job Requisitions',
        showNewRecordButton: true,
        newRecordButtonText: 'New Job',
        newRecordButtonIcon: 'briefcase',
        disableNewRecord: false,
        onNewRecord: action('New Job clicked'),
    },
};