import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import Pagination from './Pagination';

const meta: Meta<typeof Pagination> = {
    title: 'Molecules/Pagination',
    component: Pagination,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component: 'A reusable pagination component for navigating through pages of data. Perfect for tables, search results, and data lists.',
            },
        },
    },
    tags: ['autodocs'],
    argTypes: {
        currentPage: {
            control: { type: 'number', min: 1 },
            description: 'Current active page number',
        },
        totalPages: {
            control: { type: 'number', min: 1 },
            description: 'Total number of pages',
        },
        onPageChange: {
            description: 'Callback function when page changes',
        },
        disabled: {
            control: 'boolean',
            description: 'Disable all pagination controls',
        },
        showPageInfo: {
            control: 'boolean',
            description: 'Show page information text',
        },
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg'],
            description: 'Size variant of pagination controls',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for stories
const PaginationWrapper = (args: any) => {
    const [currentPage, setCurrentPage] = useState(args.currentPage || 1);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        action('Page changed')(page);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Data Table</h3>

                {/* Mock table */}
                <div className="border rounded-md mb-4">
                    <div className="bg-gray-50 px-4 py-2 border-b font-sm text-gray-700">
                        Showing results for page {currentPage}
                    </div>
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="px-4 py-3 border-b last:border-b-0">
                            Sample row {i + 1} on page {currentPage}
                        </div>
                    ))}
                </div>

                <Pagination
                    {...args}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

// Default story
export const Default: Story = {
    args: {
        currentPage: 1,
        totalPages: 10,
        disabled: false,
        showPageInfo: true,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// First page
export const FirstPage: Story = {
    args: {
        currentPage: 1,
        totalPages: 15,
        showPageInfo: true,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Middle page
export const MiddlePage: Story = {
    args: {
        currentPage: 5,
        totalPages: 10,
        showPageInfo: true,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Last page
export const LastPage: Story = {
    args: {
        currentPage: 10,
        totalPages: 10,
        showPageInfo: true,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Small size
export const SmallSize: Story = {
    args: {
        currentPage: 3,
        totalPages: 8,
        showPageInfo: true,
        size: 'sm',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Large size
export const LargeSize: Story = {
    args: {
        currentPage: 4,
        totalPages: 12,
        showPageInfo: true,
        size: 'lg',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Without page info
export const WithoutPageInfo: Story = {
    args: {
        currentPage: 2,
        totalPages: 5,
        showPageInfo: false,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Custom page info format
export const CustomPageInfo: Story = {
    args: {
        currentPage: 3,
        totalPages: 7,
        showPageInfo: true,
        pageInfoFormat: (current: number, total: number) => `Page ${current} / ${total}`,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

// Disabled state
export const Disabled: Story = {
    args: {
        currentPage: 3,
        totalPages: 8,
        disabled: true,
        showPageInfo: true,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};

export const SinglePage: Story = {
    render: () => (
        <div className="p-8 bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">Single Page Table</h3>
                <p className="text-gray-600 mb-4">This pagination won't render because there's only 1 page</p>
                <Pagination currentPage={1}
                    totalPages={1}
                    showPageInfo={true}
                    size={'md'} onPageChange={function (page: number): void {
                        throw new Error('Function not implemented.');
                    }} />
                <p className="text-sm text-gray-500 mt-4">
                    The pagination component automatically hides when totalPages ≤ 1
                </p>
            </div>
        </div>
    ),
};

// With large dataset
export const LargeDataset: Story = {
    args: {
        currentPage: 25,
        totalPages: 100,
        showPageInfo: true,
        pageInfoFormat: (current: number, total: number) => `${current} of ${total} pages`,
        size: 'md',
    },
    render: (args) => <PaginationWrapper {...args} />,
};