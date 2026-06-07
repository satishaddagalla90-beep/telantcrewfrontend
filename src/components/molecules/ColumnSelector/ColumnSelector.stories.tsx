import type { Meta, StoryObj } from '@storybook/react';
import ColumnSelector from './ColumnSelector';

const meta: Meta<typeof ColumnSelector> = {
  title: 'molecules/ColumnSelector/ColumnSelector',
  component: ColumnSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Multiselect dropdown for show/hide table columns',
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
