import type { Meta, StoryObj } from '@storybook/react';
import Timeline from './Timeline';

const meta: Meta<typeof Timeline> = {
  title: 'molecules/Timeline/Timeline',
  component: Timeline,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Step-by-step progress indicator for onboarding',
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
