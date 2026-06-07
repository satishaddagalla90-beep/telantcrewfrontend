import type { Meta, StoryObj } from '@storybook/react';
import FormWizardLayout from './FormWizardLayout';

const meta: Meta<typeof FormWizardLayout> = {
  title: 'templates/FormWizardLayout/FormWizardLayout',
  component: FormWizardLayout,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Layout for multi-step forms with progress tracking',
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
