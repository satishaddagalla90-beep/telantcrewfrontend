import type { Meta, StoryObj } from '@storybook/react';
import PermissionManager from './PermissionManager';

const meta: Meta<typeof PermissionManager> = {
  title: 'organisms/PermissionManager/PermissionManager',
  component: PermissionManager,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Permission matrix with modules and role-based access',
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
