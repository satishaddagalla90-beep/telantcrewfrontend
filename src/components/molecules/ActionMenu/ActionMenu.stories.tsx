import type { Meta, StoryObj } from '@storybook/react';
import ActionMenu from './ActionMenu';

const meta: Meta<typeof ActionMenu> = {
  title: 'molecules/ActionMenu/ActionMenu',
  component: ActionMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Dropdown menu with action items',
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
