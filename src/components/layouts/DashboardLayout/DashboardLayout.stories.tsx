import type { Meta, StoryObj } from '@storybook/react';
import DashboardLayout from './DashboardLayout';
import {  MemoryRouter } from 'react-router-dom';

const meta: Meta<typeof DashboardLayout> = {
    title: 'Layouts/DashboardLayout',
    component: DashboardLayout,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Dashboard layout component that provides the navigation structure for the entire application. Contains NavBar with logo and navigation items, and renders child pages via React Router Outlet.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
    render: (args) => (
        <MemoryRouter initialEntries={['/']}>
            <DashboardLayout {...args} />
        </MemoryRouter>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Default dashboard layout with NavBar containing all navigation items: Home, Users, Applicants, Clients, Vendors, and Job Requisition. Uses logo.png from public folder.',
            },
        },
    },
};

export const WithDifferentRoute: Story = {
    args: {},
    render: (args) => (
        <MemoryRouter initialEntries={['/users']}>
            <DashboardLayout {...args} />
        </MemoryRouter>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Dashboard layout showing how it works with different routes (Users page example).',
            },
        },
    },
};
