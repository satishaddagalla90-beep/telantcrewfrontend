import type { Meta, StoryObj } from '@storybook/react';
import TabView from './TabView';

const meta: Meta<typeof TabView> = {
  title: 'molecules/TabView/TabView',
  component: TabView,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Tab navigation component with content panels',
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
