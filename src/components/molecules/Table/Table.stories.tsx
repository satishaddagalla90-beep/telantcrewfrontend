import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import Table from './Table';
import Icon from '../../atoms/Icon';
import Badge from '../../atoms/Badge';

const meta: Meta<typeof Table> = {
    title: 'Molecules/Table',
    component: Table,
    parameters: {
        layout: 'padded',
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

// Sample data for users
const sampleUsers = [
    {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'Admin',
        department: 'Engineering',
        status: 'active',
        created: '2024-01-15',
        last_login: '2024-08-05',
    },
    {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Manager',
        department: 'Product',
        status: 'active',
        created: '2024-02-20',
        last_login: '2024-08-04',
    },
    {
        id: '3',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        role: 'Developer',
        department: 'Engineering',
        status: 'inactive',
        created: '2024-03-10',
        last_login: '2024-07-30',
    },
];

// Sample data for applicants
const sampleApplicants = [
    {
        id: '1',
        candidate_id: 'TC001',
        name: 'Alice Wilson',
        email: 'alice.wilson@email.com',
        phone: '+1-555-0123',
        current_organization: 'Tech Corp',
        total_experience: '5 years',
        current_location: 'New York',
        skills: ['React', 'TypeScript', 'Node.js'],
        notice_period: '30 days',
        current_ctc: '$80,000',
        expected_ctc: '$95,000',
        flag: 'Green',
        created: '2024-08-01',
    },
    {
        id: '2',
        candidate_id: 'TC002',
        name: 'Bob Chen',
        email: 'bob.chen@email.com',
        phone: '+1-555-0124',
        current_organization: 'StartupXYZ',
        total_experience: '3 years',
        current_location: 'San Francisco',
        skills: ['Python', 'Django', 'PostgreSQL'],
        notice_period: '15 days',
        current_ctc: '$70,000',
        expected_ctc: '$85,000',
        flag: 'Blue',
        created: '2024-08-02',
    },
    {
        id: '3',
        candidate_id: 'TC003',
        name: 'Carol Davis',
        email: 'carol.davis@email.com',
        phone: '+1-555-0125',
        current_organization: 'Enterprise Inc',
        total_experience: '8 years',
        current_location: 'Chicago',
        skills: ['Java', 'Spring Boot', 'AWS'],
        notice_period: '60 days',
        current_ctc: '$120,000',
        expected_ctc: '$140,000',
        flag: 'Red',
        created: '2024-08-03',
    },
];

// User table columns
const userColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    {
        key: 'status',
        label: 'Status',
        render: (value: string) => (
            <Badge
                variant={value === 'active' ? 'success' : 'secondary'}
                size="sm"
            >
                {value}
            </Badge>
        ),
    },
    { key: 'created', label: 'Created', sortable: true },
    { key: 'last_login', label: 'Last Login', sortable: true },
];

// Applicant table columns
const applicantColumns = [
    { key: 'candidate_id', label: 'ID', sortable: true, width: '100px' },
    {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (value: string, row: any) => (
            <div className="flex items-center gap-2">
                <Icon
                    name="user-circle"
                    size={16}
                    className={
                        row.flag === 'Red'
                            ? 'text-red-500'
                            : row.flag === 'Green'
                                ? 'text-green-500'
                                : row.flag === 'Blue'
                                    ? 'text-blue-500'
                                    : 'text-gray-500'
                    }
                />
                {value}
            </div>
        ),
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone' },
    { key: 'current_organization', label: 'Current Company', sortable: true },
    { key: 'total_experience', label: 'Experience' },
    { key: 'current_location', label: 'Location' },
    {
        key: 'skills',
        label: 'Skills',
        render: (value: string[]) => (
            <div className="flex flex-wrap gap-1">
                {value?.slice(0, 2).map((skill, index) => (
                    <Badge key={index} variant="info" size="sm">
                        {skill}
                    </Badge>
                ))}
                {value?.length > 2 && (
                    <Badge variant="secondary" size="sm">
                        +{value.length - 2}
                    </Badge>
                )}
            </div>
        ),
    },
    { key: 'expected_ctc', label: 'Expected CTC' },
    { key: 'created', label: 'Created', sortable: true },
];

// Basic table
export const Default: Story = {
    args: {
        columns: userColumns,
        data: sampleUsers,
    },
};

// Table with selection
export const WithSelection: Story = {
    args: {
        columns: userColumns,
        data: sampleUsers,
        onRowSelect: (selectedIds: string[]) => console.log('Selected:', selectedIds),
    },
};

// Sortable table
export const Sortable: Story = {
    args: {
        columns: userColumns,
        data: sampleUsers,
        onRowClick: (row: any) => console.log('Row clicked:', row),
    },
};

// Applicant table example
export const ApplicantTable: Story = {
    args: {
        columns: applicantColumns,
        data: sampleApplicants,
        onRowSelect: (selectedIds: string[]) => console.log('Selected applicants:', selectedIds),
        onRowClick: (row: any) => console.log('Applicant clicked:', row),
    },
};

// Expandable table
export const Expandable: Story = {
    args: {
        columns: applicantColumns.slice(0, 5), // Show fewer columns for better display
        data: sampleApplicants,
        expandable: true,
        renderExpandedRow: (row: any) => (
            <div className="p-4 bg-gray-50 rounded">
                <h4 className="font-semibold mb-2">Additional Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="font-medium">Notice Period:</span> {row.notice_period}
                    </div>
                    <div>
                        <span className="font-medium">Current CTC:</span> {row.current_ctc}
                    </div>
                    <div>
                        <span className="font-medium">Expected CTC:</span> {row.expected_ctc}
                    </div>
                    <div>
                        <span className="font-medium">Skills:</span>{' '}
                        {row.skills?.join(', ')}
                    </div>
                </div>
            </div>
        ),
    },
};

// Empty state
export const Empty: Story = {
    args: {
        columns: userColumns,
        data: [],
        emptyMessage: 'No users found. Try adjusting your search criteria.',
    },
};

// Loading state
export const Loading: Story = {
    args: {
        columns: userColumns,
        data: [],
        isLoading: true,
    },
};
