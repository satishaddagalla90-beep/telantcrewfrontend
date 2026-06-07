import type { Meta, StoryObj } from '@storybook/react';
import Icon from './Icon';

const meta: Meta<typeof Icon> = {
    title: 'Atoms/Icon',
    component: Icon,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        name: {
            control: { type: 'select' },
            options: [
                'bell',
                'video',
                'history',
                'plus',
                'search',
                'grid',
                'user-circle',
                'user',
                'lock',
                'key',
                'archive',
                'book',
                'sign-out',
                'close',
                'caret-down',
                'home',
                'briefcase',
                'users',
                'buildings',
                'file-text',
            ],
        },
        size: {
            control: { type: 'number', min: 12, max: 48, step: 2 },
        },
        color: {
            control: { type: 'color' },
        },
        weight: {
            control: { type: 'select' },
            options: ['thin', 'light', 'regular', 'bold', 'fill', 'duotone'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        name: 'bell',
        size: 24,
        weight: 'regular',
    },
};

export const Small: Story = {
    args: {
        name: 'user-circle',
        size: 16,
        weight: 'regular',
    },
};

export const Large: Story = {
    args: {
        name: 'home',
        size: 32,
        weight: 'bold',
    },
};

export const Colored: Story = {
    args: {
        name: 'bell',
        size: 24,
        color: '#3B82F6',
        weight: 'fill',
    },
};

export const Interactive: Story = {
    args: {
        name: 'search',
        size: 20,
        weight: 'regular',
        onClick: () => alert('Icon clicked!'),
    },
};

export const AllIcons: Story = {
    render: () => (
        <div className="grid grid-cols-6 gap-4 p-4">
            {[
                'bell',
                'video',
                'history',
                'plus',
                'search',
                'grid',
                'user-circle',
                'user',
                'lock',
                'key',
                'archive',
                'book',
                'sign-out',
                'close',
                'caret-down',
                'home',
                'briefcase',
                'users',
                'buildings',
                'file-text',
            ].map((iconName) => (
                <div key={iconName} className="flex flex-col items-center p-2 border rounded">
                    <Icon name={iconName as any} size={24} />
                    <span className="text-xs mt-1">{iconName}</span>
                </div>
            ))}
        </div>
    ),
};
