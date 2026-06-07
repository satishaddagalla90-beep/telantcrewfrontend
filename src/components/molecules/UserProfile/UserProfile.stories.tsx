import type { Meta, StoryObj } from '@storybook/react';
import UserProfile from './UserProfile';

const meta: Meta<typeof UserProfile> = {
    title: 'Molecules/UserProfile',
    component: UserProfile,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
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
        userDetails: mockUserDetails,
        avatarBaseUrl: 'https://example.com',
    },
};

export const WithAvatar: Story = {
    args: {
        userDetails: {
            ...mockUserDetails,
            avatar: 'avatar.jpg',
        },
        avatarBaseUrl: 'https://example.com',
    },
};

export const InactiveUser: Story = {
    args: {
        userDetails: {
            ...mockUserDetails,
            status: 'inactive',
            display_name: 'Jane Smith',
            username: 'janesmith',
        },
        avatarBaseUrl: 'https://example.com',
    },
};

export const MinimalInfo: Story = {
    args: {
        userDetails: {
            id: '2',
            username: 'minimal',
            status: 'active',
        },
        avatarBaseUrl: 'https://example.com',
    },
};
