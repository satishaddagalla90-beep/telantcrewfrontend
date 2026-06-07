import type { Meta, StoryObj } from '@storybook/react';
import FormSection from './FormSection';

const meta: Meta<typeof FormSection> = {
  title: 'molecules/FormSection/FormSection',
  component: FormSection,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form section with validation and error handling',
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
