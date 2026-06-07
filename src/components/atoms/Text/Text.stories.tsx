import type { Meta, StoryObj } from '@storybook/react';
import Text from './Text';

const meta: Meta<typeof Text> = {
  title: 'Atoms/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
    weight: {
      control: { type: 'select' },
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'muted'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a sample text',
    variant: 'p',
    size: 'base',
    weight: 'normal',
    color: 'primary',
  },
};

export const Heading1: Story = {
  args: {
    children: 'Heading 1',
    variant: 'h1',
    size: '4xl',
    weight: 'bold',
  },
};

export const Heading2: Story = {
  args: {
    children: 'Heading 2',
    variant: 'h2',
    size: '3xl',
    weight: 'semibold',
  },
};

export const Heading3: Story = {
  args: {
    children: 'Heading 3',
    variant: 'h3',
    size: '2xl',
    weight: 'semibold',
  },
};

export const SmallText: Story = {
  args: {
    children: 'Small text example',
    variant: 'p',
    size: 'sm',
    color: 'muted',
  },
};

export const LargeText: Story = {
  args: {
    children: 'Large text example',
    variant: 'p',
    size: 'lg',
    weight: 'medium',
  },
};

export const SuccessText: Story = {
  args: {
    children: 'Success message',
    variant: 'p',
    color: 'success',
    weight: 'medium',
  },
};

export const ErrorText: Story = {
  args: {
    children: 'Error message',
    variant: 'p',
    color: 'error',
    weight: 'medium',
  },
}; 