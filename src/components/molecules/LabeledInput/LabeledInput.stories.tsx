import type { Meta, StoryObj } from '@storybook/react';
import LabeledInput from './LabeledInput';

const meta: Meta<typeof LabeledInput> = {
  title: 'molecules/LabeledInput/LabeledInput',
  component: LabeledInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input field with floating/inline labels',
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
