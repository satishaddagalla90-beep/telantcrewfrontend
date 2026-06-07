import type { Meta, StoryObj } from '@storybook/react';
import Home from './Home';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof Home> = {
    title: 'Pages/Home',
    component: Home,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'Home page component that serves as the main navigation layout with NavBar. Contains placeholder content for Home, Users, Applicants, Clients, Vendors, and Job Requisition sections.',
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
        <BrowserRouter>
            <Home {...args} />
        </BrowserRouter>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Default home page layout with NavBar containing all navigation items: Home, Users, Applicants, Clients, Vendors, and Job Requisition. Uses logo.png from public folder and shows placeholder content for each section.',
            },
        },
    },
};

export const HomeSection: Story = {
    args: {},
    render: (args) => (
        <BrowserRouter>
            <Home {...args} />
        </BrowserRouter>
    ),
    parameters: {
        docs: {
            description: {
                story: 'Home page showing the Home section (default active state).',
            },
        },
    },
};
