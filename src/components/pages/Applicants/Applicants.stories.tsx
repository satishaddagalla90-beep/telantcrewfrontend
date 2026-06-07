import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import Applicants from './Applicants';

const meta: Meta<typeof Applicants> = {
    title: 'Pages/Applicants',
    component: Applicants,
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: 'The Applicants page with header, table, and pagination. Shows how the Header integrates with page content.',
            },
        },
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <Story />
            </BrowserRouter>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default applicants page
export const Default: Story = {};

// Applicants page in context (with navbar simulation)
export const WithNavbarContext: Story = {
    render: () => (
        <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
                {/* Simulate navbar */}
                <div className="bg-primary-600 text-white px-6 py-3 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="text-lg font-semibold">TalentCrew</div>
                            <nav className="flex items-center gap-6">
                                <span className="text-white/75">Home</span>
                                <span className="text-white/75">Users</span>
                                <span className="text-white font-medium border-b-2 border-white pb-1">Applicants</span>
                                <span className="text-white/75">Clients</span>
                                <span className="text-white/75">Vendors</span>
                                <span className="text-white/75">Job Requisition</span>
                            </nav>
                        </div>
                        <div className="text-white/75">John Doe</div>
                    </div>
                </div>

                {/* Applicants page content */}
                <Applicants />
            </div>
        </BrowserRouter>
    ),
};