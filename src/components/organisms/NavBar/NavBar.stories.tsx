import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import NavBar from './NavBar';

const meta: Meta<typeof NavBar> = {
    title: 'Organisms/NavBar',
    component: NavBar,
    parameters: {
        layout: 'fullscreen',
        backgrounds: {
            default: 'light',
            values: [
                { name: 'light', value: '#ffffff' },
                { name: 'dark', value: '#1f2937' },
            ],
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <div className="min-h-screen bg-gray-50">
                    <Story />
                    {/* Demo content to show contrast */}
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to TalentCrew</h1>
                        <p className="text-gray-600">Content goes here</p>
                    </div>
                </div>
            </BrowserRouter>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUserDetails = {
    id: '1',
    display_name: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    phone_no: '+1234567890',
    status: 'active' as const,
    created: '2023-01-15T00:00:00Z',
    collectionId: 'users',
    expand: {
        designation: { name: 'Senior Developer' },
        department: { name: 'Engineering' },
        location: { city: 'New York' },
        role: { name: 'Full Stack Developer' },
        reporting_to: { first_name: 'Jane Smith' },
    },
};

export const Default: Story = {
    args: {
        logoSrc: '/logo.png',
        logoAlt: 'TalentCrew Logo',
        userName: 'Sarah Wilson',
        designation: 'Brand Manager',
        userDetails: {
            ...mockUserDetails,
            display_name: 'Sarah Wilson',
        },
        avatarBaseUrl: 'https://example.com',
        navigationItems: [
            { name: "Home", path: "/" },
            { name: "Talent Pool", path: "/talent" },
            { name: "Opportunities", path: "/jobs" },
            { name: "Analytics", path: "/analytics" },
            { name: "Reports", path: "/reports" },
        ],
        showNotificationBadge: true,
    },
};

export const BasicExample: Story = {
    args: {
        logoSrc: '/logo.png',
        logoAlt: 'Company Logo',
        userName: 'John Doe',
        designation: 'Senior Developer',
        userDetails: mockUserDetails,
        avatarBaseUrl: 'https://example.com',
        showNotificationBadge: true,
    },
};

export const WithCustomNavigation: Story = {
    args: {
        logoSrc: '/logo.png',
        logoAlt: 'Company Logo',
        userName: 'Jane Smith',
        designation: 'Product Manager',
        userDetails: mockUserDetails,
        avatarBaseUrl: 'https://example.com',
        navigationItems: [
            { name: "Dashboard", path: "/dashboard" },
            { name: "Projects", path: "/projects" },
            { name: "Team", path: "/team" },
            { name: "Settings", path: "/settings" },
        ],
        showNotificationBadge: false,
    },
};

export const InactiveUser: Story = {
    args: {
        logoSrc: '/logo.png',
        logoAlt: 'Company Logo',
        userName: 'Inactive User',
        designation: 'Former Employee',
        userDetails: {
            ...mockUserDetails,
            status: 'inactive',
            display_name: 'Inactive User',
        },
        avatarBaseUrl: 'https://example.com',
        showNotificationBadge: true,
    },
};

export const WithAvatar: Story = {
    args: {
        logoSrc: '/logo.png',
        logoAlt: 'Company Logo',
        userName: 'Alex Johnson',
        designation: 'UI/UX Designer',
        userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        userDetails: {
            ...mockUserDetails,
            avatar: 'avatar.jpg',
            display_name: 'Alex Johnson',
        },
        avatarBaseUrl: 'https://example.com',
        showNotificationBadge: true,
    },
};

export const LightVariant: Story = {
    args: {
        logoSrc: '/logo_black.png',
        logoAlt: 'TalentCrew Logo',
        userName: 'Michael Chen',
        designation: 'Product Designer',
        userDetails: {
            ...mockUserDetails,
            display_name: 'Michael Chen',
        },
        avatarBaseUrl: 'https://example.com',
        navigationItems: [
            { name: "Home", path: "/" },
            { name: "Talent Pool", path: "/talent" },
            { name: "Opportunities", path: "/jobs" },
            { name: "Analytics", path: "/analytics" },
            { name: "Reports", path: "/reports" },
        ],
        showNotificationBadge: true,
        variant: 'light',
    },
};
