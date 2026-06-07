import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
    title: 'Atoms/Avatar',
    component: Avatar,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg', 'xl'],
        },
        fallbackIcon: {
            control: { type: 'boolean' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        size: 'md',
        fallbackIcon: true,
    },
};

export const WithImage: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        alt: 'John Doe',
        size: 'md',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        fallbackIcon: true,
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
        fallbackIcon: true,
    },
};

export const ExtraLarge: Story = {
    args: {
        size: 'xl',
        fallbackIcon: true,
    },
};

export const WithInitials: Story = {
    args: {
        alt: 'John Doe',
        size: 'md',
        fallbackIcon: false,
    },
};

export const Interactive: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
        alt: 'John Doe',
        size: 'md',
        onClick: () => alert('Avatar clicked!'),
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
                <Avatar size="sm" fallbackIcon={true} />
                <span className="text-xs">Small</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Avatar size="md" fallbackIcon={true} />
                <span className="text-xs">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Avatar size="lg" fallbackIcon={true} />
                <span className="text-xs">Large</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Avatar size="xl" fallbackIcon={true} />
                <span className="text-xs">Extra Large</span>
            </div>
        </div>
    ),
};
