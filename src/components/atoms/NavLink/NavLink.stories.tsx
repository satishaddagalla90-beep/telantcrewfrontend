import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import NavLink from './NavLink';

const meta: Meta<typeof NavLink> = {
    title: 'Atoms/NavLink',
    component: NavLink,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <Story />
            </BrowserRouter>
        ),
    ],
    argTypes: {
        isActive: {
            control: { type: 'boolean' },
        },
        disabled: {
            control: { type: 'boolean' },
        },
        external: {
            control: { type: 'boolean' },
        },
        variant: {
            control: { type: 'select' },
            options: ['default', 'navbar'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default button style
export const Default: Story = {
    args: {
        children: 'Default Link',
        isActive: false,
    },
};

// Active state
export const Active: Story = {
    args: {
        children: 'Active Link',
        isActive: true,
    },
};

// Navbar variant
export const Navbar: Story = {
    args: {
        children: 'Navbar Link',
        variant: 'navbar',
        isActive: false,
    },
};

// Navbar active
export const NavbarActive: Story = {
    args: {
        children: 'Active Navbar Link',
        variant: 'navbar',
        isActive: true,
    },
};

// External link
export const External: Story = {
    args: {
        children: 'External Link',
        href: 'https://example.com',
        external: true,
    },
};

// Router link
export const RouterLink: Story = {
    args: {
        children: 'Router Link',
        to: '/dashboard',
    },
};

// Internal link with href
export const InternalHref: Story = {
    args: {
        children: 'Internal Link',
        href: '#internal',
    },
};

// Disabled state
export const Disabled: Story = {
    args: {
        children: 'Disabled Link',
        disabled: true,
    },
};

// Custom styling
export const CustomStyling: Story = {
    args: {
        children: 'Custom Link',
        className: 'text-purple-600 font-bold',
        isActive: false,
    },
};

// Navigation example
export const NavigationExample: Story = {
    render: () => (
        <nav className="flex space-x-1 bg-gray-50 p-4 rounded-lg">
            <NavLink isActive>Home</NavLink>
            <NavLink href="#jobs">Jobs</NavLink>
            <NavLink to="/applicants">Applicants</NavLink>
            <NavLink href="#clients">Clients</NavLink>
            <NavLink to="/vendors">Vendors</NavLink>
            <NavLink disabled>Job Requisition</NavLink>
        </nav>
    ),
};

// Navbar example
export const NavbarExample: Story = {
    render: () => (
        <nav className="flex space-x-1 bg-white border-b border-gray-200 p-4">
            <NavLink to="/" variant="navbar" isActive>Home</NavLink>
            <NavLink to="/jobs" variant="navbar">Jobs</NavLink>
            <NavLink to="/applicants" variant="navbar">Applicants</NavLink>
            <NavLink to="/clients" variant="navbar">Clients</NavLink>
            <NavLink to="/vendors" variant="navbar">Vendors</NavLink>
            <NavLink to="/job-requisitions" variant="navbar">Job Requisition</NavLink>
        </nav>
    ),
};
