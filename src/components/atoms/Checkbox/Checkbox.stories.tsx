import type { Meta, StoryObj } from '@storybook/react';
import Checkbox from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'atoms/Checkbox/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Checkbox input component with label',
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
