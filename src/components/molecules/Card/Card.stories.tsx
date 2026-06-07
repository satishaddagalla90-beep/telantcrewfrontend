import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';
import Text from '../../atoms/Text';
import Button from '../../atoms/Button';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Card Title',
    subtitle: 'Card subtitle with additional information',
    children: (
      <div className="space-y-4">
        <Text variant="p" size="base">
          This is the main content of the card. It can contain any React components
          and will be rendered inside the card body.
        </Text>
        <div className="flex space-x-2">
          <Button variant="primary" size="sm">
            Action
          </Button>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    ),
  },
};

export const Elevated: Story = {
  args: {
    title: 'Elevated Card',
    subtitle: 'This card has elevation and shadow',
    variant: 'elevated',
    children: (
      <div className="space-y-4">
        <Text variant="p" size="base">
          Elevated cards have a shadow effect that makes them appear to float above
          the surface. This is useful for highlighting important content.
        </Text>
        <Text variant="p" size="sm" color="muted">
          Perfect for modals, tooltips, and other overlay content.
        </Text>
      </div>
    ),
  },
};

export const Outlined: Story = {
  args: {
    title: 'Outlined Card',
    subtitle: 'This card has a prominent border',
    variant: 'outlined',
    children: (
      <div className="space-y-4">
        <Text variant="p" size="base">
          Outlined cards have a more prominent border that clearly defines the
          card boundaries. This is useful for content that needs clear separation.
        </Text>
        <div className="bg-gray-50 p-3 rounded">
          <Text variant="p" size="sm" color="muted">
            This is a nested content area within the card.
          </Text>
        </div>
      </div>
    ),
  },
};

export const WithoutTitle: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <Text variant="h3" size="lg" weight="semibold">
          Content Only
        </Text>
        <Text variant="p" size="base">
          This card doesn&apos;t have a title or subtitle, just content. This is useful
          for simple content containers.
        </Text>
        <div className="flex justify-end">
          <Button variant="primary" size="sm">
            Continue
          </Button>
        </div>
      </div>
    ),
  },
};

export const WithComplexContent: Story = {
  args: {
    title: 'Complex Content Card',
    subtitle: 'Demonstrating various content types',
    children: (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#2563eb] rounded-full flex items-center justify-center">
            <Text variant="span" size="sm" color="primary" className="text-white font-bold">
              TC
            </Text>
          </div>
          <div>
            <Text variant="p" weight="semibold">
              TalentCrew Team
            </Text>
            <Text variant="p" size="sm" color="muted">
              Active now
            </Text>
          </div>
        </div>

        <Text variant="p" size="base">
          This card demonstrates how to include complex content like user avatars,
          status indicators, and interactive elements.
        </Text>

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              View Profile
            </Button>
            <Button variant="outline" size="sm">
              Message
            </Button>
          </div>
          <Text variant="span" size="sm" color="success">
            Online
          </Text>
        </div>
      </div>
    ),
  },
}; 