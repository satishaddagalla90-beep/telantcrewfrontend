import type { Meta, StoryObj } from '@storybook/react';
import UserDropdown from './UserDropdown';

const meta: Meta<typeof UserDropdown> = {
    title: 'Molecules/UserDropdown',
    component: UserDropdown,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        userName: {
            control: { type: 'text' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        userName: 'John Doe',
        designation: 'Software Engineer',
    },
};

export const WithAvatar: Story = {
    args: {
        userName: 'Sarah Johnson',
        designation: 'Product Manager',
        avatarSrc: 'https://images.unsplash.com/photo-1494790108755-2616b612b1e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    },
};

export const Open: Story = {
    args: {
        userName: 'Mike Wilson',
        designation: 'UI/UX Designer',
        avatarSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        isOpen: true,
    },
};

export const Interactive: Story = {
    args: {
        userName: 'Alex Thompson',
        designation: 'Senior Developer',
        onViewProfile: () => alert('View Profile clicked!'),
        onChangePassword: () => alert('Change Password clicked!'),
        onGenerateOTP: () => alert('Generate OTP clicked!'),
        onArchive: () => alert('Archive clicked!'),
        onUserGuide: () => alert('User Guide clicked!'),
        onSignOut: () => alert('Sign Out clicked!'),
    },
};

export const LongDesignation: Story = {
    args: {
        userName: 'Dr. Elizabeth Montgomery',
        designation: 'Senior Principal Software Engineering Manager',
        avatarSrc: 'https://images.unsplash.com/photo-1494790108755-2616b612b1e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    },
};
