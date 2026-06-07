import type { Meta, StoryObj } from '@storybook/react';
import ErrorModal from './ErrorModal';

const meta: Meta<typeof ErrorModal> = {
  title: 'organisms/ErrorModal/ErrorModal',
  component: ErrorModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal for displaying error messages and failed operations',
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
