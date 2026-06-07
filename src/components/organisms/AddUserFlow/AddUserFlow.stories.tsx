import type { Meta, StoryObj } from '@storybook/react';
import AddUserFlow from './AddUserFlow';

const meta: Meta<typeof AddUserFlow> = {
  title: 'organisms/AddUserFlow/AddUserFlow',
  component: AddUserFlow,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Multi-step user creation wizard with timeline UI',
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
