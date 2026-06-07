import type { Meta, StoryObj } from '@storybook/react';
import Users from './Users';

const meta: Meta<typeof Users> = {
    title: 'Pages/Users',
    component: Users,
    parameters: {
        layout: 'padded',
        docs: {
            description: {
                component: 'Users page component for managing team members and user accounts.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};
