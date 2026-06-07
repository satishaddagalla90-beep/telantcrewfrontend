import type { Meta, StoryObj } from '@storybook/react';
import Badge from './Badge';
import Icon from '../Icon';

const meta: Meta<typeof Badge> = {
    title: 'Atoms/Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: { type: 'select' },
            options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
        },
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg'],
        },
        position: {
            control: { type: 'select' },
            options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
        },
        dot: {
            control: { type: 'boolean' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: '3',
        variant: 'primary',
        size: 'md',
    },
    render: (args) => (
        <div className="relative inline-block p-4">
            <Icon name="bell" size={24} />
            <Badge {...args} />
        </div>
    ),
};

export const Dot: Story = {
    args: {
        dot: true,
        variant: 'danger',
        size: 'md',
    },
    render: (args) => (
        <div className="relative inline-block p-4">
            <Icon name="bell" size={24} />
            <Badge {...args} />
        </div>
    ),
};

export const WithNumber: Story = {
    args: {
        children: '99+',
        variant: 'danger',
        size: 'md',
    },
    render: (args) => (
        <div className="relative inline-block p-4">
            <Icon name="bell" size={24} />
            <Badge {...args} />
        </div>
    ),
};

export const AllVariants: Story = {
    render: () => (
        <div className="flex gap-8 flex-wrap">
            {(['primary', 'secondary', 'success', 'warning', 'danger', 'info'] as const).map((variant) => (
                <div key={variant} className="flex flex-col items-center gap-2">
                    <div className="relative inline-block">
                        <Icon name="bell" size={24} />
                        <Badge variant={variant}>3</Badge>
                    </div>
                    <span className="text-xs capitalize">{variant}</span>
                </div>
            ))}
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex gap-8 items-center">
            {(['sm', 'md', 'lg'] as const).map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                    <div className="relative inline-block">
                        <Icon name="bell" size={24} />
                        <Badge size={size} variant="primary">5</Badge>
                    </div>
                    <span className="text-xs capitalize">{size}</span>
                </div>
            ))}
        </div>
    ),
};

export const AllPositions: Story = {
    render: () => (
        <div className="flex gap-8 flex-wrap">
            {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map((position) => (
                <div key={position} className="flex flex-col items-center gap-2">
                    <div className="relative inline-block p-4">
                        <Icon name="bell" size={24} />
                        <Badge position={position} variant="primary">3</Badge>
                    </div>
                    <span className="text-xs">{position}</span>
                </div>
            ))}
        </div>
    ),
};
