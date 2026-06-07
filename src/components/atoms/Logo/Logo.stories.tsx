import type { Meta, StoryObj } from '@storybook/react';
import Logo from './Logo';

const meta: Meta<typeof Logo> = {
    title: 'Atoms/Logo',
    component: Logo,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg'],
        },
        width: {
            control: { type: 'number' },
        },
        height: {
            control: { type: 'number' },
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        src: 'https://via.placeholder.com/150x40/3B82F6/FFFFFF?text=LOGO',
        alt: 'Company Logo',
        size: 'md',
    },
};

export const Small: Story = {
    args: {
        src: 'https://via.placeholder.com/120x32/3B82F6/FFFFFF?text=LOGO',
        alt: 'Company Logo',
        size: 'sm',
    },
};

export const Large: Story = {
    args: {
        src: 'https://via.placeholder.com/180x48/3B82F6/FFFFFF?text=LOGO',
        alt: 'Company Logo',
        size: 'lg',
    },
};

export const WithCustomSize: Story = {
    args: {
        src: 'https://via.placeholder.com/200x60/3B82F6/FFFFFF?text=CUSTOM',
        alt: 'Custom Logo',
        width: 200,
        height: 60,
    },
};

export const Fallback: Story = {
    args: {
        alt: 'TekisHub',
    },
};

export const Interactive: Story = {
    args: {
        src: 'https://via.placeholder.com/150x40/3B82F6/FFFFFF?text=CLICK+ME',
        alt: 'Interactive Logo',
        size: 'md',
        onClick: () => alert('Logo clicked!'),
    },
};

export const AllSizes: Story = {
    render: () => (
        <div className="flex items-center">
            <div className="flex flex-col items-center gap-2">
                <Logo
                    src="https://via.placeholder.com/120x32/3B82F6/FFFFFF?text=SM"
                    alt="Small Logo"
                    size="sm"
                />
                <span className="text-xs">Small</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Logo
                    src="https://via.placeholder.com/150x40/3B82F6/FFFFFF?text=MD"
                    alt="Medium Logo"
                    size="md"
                />
                <span className="text-xs">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <Logo
                    src="https://via.placeholder.com/180x48/3B82F6/FFFFFF?text=LG"
                    alt="Large Logo"
                    size="lg"
                />
                <span className="text-xs">Large</span>
            </div>
        </div>
    ),
};
