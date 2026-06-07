import type { Meta, StoryObj } from '@storybook/react';
import PermissionLayout from './PermissionLayout';

const meta: Meta<typeof PermissionLayout> = {
  title: 'templates/PermissionLayout/PermissionLayout',
  component: PermissionLayout,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Layout for permission management interfaces',
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
