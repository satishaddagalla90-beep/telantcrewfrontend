import type { Meta, StoryObj } from '@storybook/react';
import EditableCard from './EditableCard';

const meta: Meta<typeof EditableCard> = {
  title: 'molecules/EditableCard/EditableCard',
  component: EditableCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component with edit mode toggle',
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
