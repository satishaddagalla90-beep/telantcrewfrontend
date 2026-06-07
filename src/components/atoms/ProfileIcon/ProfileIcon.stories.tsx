import type { Meta, StoryObj } from '@storybook/react';
import ProfileIcon from './ProfileIcon';

const meta: Meta<typeof ProfileIcon> = {
  title: 'atoms/ProfileIcon/ProfileIcon',
  component: ProfileIcon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Profile avatar with optional badges',
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
