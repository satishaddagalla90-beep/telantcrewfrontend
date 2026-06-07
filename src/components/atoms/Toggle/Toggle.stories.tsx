import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Toggle from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'atoms/Toggle/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable toggle/switch component with multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'Whether the toggle is checked/on',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the toggle is disabled',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the toggle',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Visual variant of the toggle',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive wrapper for stories
const InteractiveToggle = (args: any) => {
  const [checked, setChecked] = useState(args.checked || false);
  return <Toggle {...args} checked={checked} onCheckedChange={setChecked} />;
};

export const Default: Story = {
  render: InteractiveToggle,
  args: {
    checked: false,
    disabled: false,
    size: 'md',
    variant: 'default',
  },
};

export const Checked: Story = {
  render: InteractiveToggle,
  args: {
    checked: true,
    size: 'md',
    variant: 'default',
  },
};

export const Disabled: Story = {
  render: InteractiveToggle,
  args: {
    checked: false,
    disabled: true,
    size: 'md',
    variant: 'default',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <InteractiveToggle size="sm" />
      <InteractiveToggle size="md" />
      <InteractiveToggle size="lg" />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <InteractiveToggle variant="default" checked />
      <InteractiveToggle variant="success" checked />
      <InteractiveToggle variant="warning" checked />
      <InteractiveToggle variant="danger" checked />
    </div>
  ),
};
