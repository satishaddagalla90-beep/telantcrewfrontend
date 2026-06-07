import type { Meta, StoryObj } from '@storybook/react';
import UserForm from './UserForm';

const meta: Meta<typeof UserForm> = {
  title: 'organisms/UserForm/UserForm',
  component: UserForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Comprehensive user creation/editing form',
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

export const ToBeImplemented: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'This component is a placeholder and needs to be implemented based on requirements from the old project.',
      },
    },
  },
};
