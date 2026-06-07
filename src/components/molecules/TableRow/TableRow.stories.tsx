import type { Meta, StoryObj } from '@storybook/react';
import TableRow from './TableRow';

const meta: Meta<typeof TableRow> = {
  title: 'molecules/TableRow/TableRow',
  component: TableRow,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced table row with hierarchy/expand functionality',
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
