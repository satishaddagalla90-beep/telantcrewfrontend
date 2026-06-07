import type { Meta, StoryObj } from '@storybook/react';
import Stepper from './Stepper';

const meta: Meta<typeof Stepper> = {
    title: 'Molecules/Stepper',
    component: Stepper,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    argTypes: {
        currentStep: {
            control: { type: 'number', min: 1, max: 5 },
            description: 'Current active step (1-indexed)',
        },
        variant: {
            control: { type: 'select' },
            options: ['default', 'compact'],
            description: 'Visual variant of the stepper',
        },
        allowClickableSteps: {
            control: { type: 'boolean' },
            description: 'Whether steps can be clicked to navigate',
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const defaultSteps = [
    {
        label: 'Personal Details',
        description: 'Basic information'
    },
    {
        label: 'Contact Information',
        description: 'Phone and email'
    },
    {
        label: 'Education',
        description: 'Academic background'
    },
    {
        label: 'Experience',
        description: 'Work history'
    },
    {
        label: 'Documents',
        description: 'Upload files'
    }
];

export const Default: Story = {
    args: {
        steps: defaultSteps,
        currentStep: 1,
    },
};

export const ActiveStep: Story = {
    args: {
        steps: defaultSteps,
        currentStep: 3,
    },
};

export const CompletedSteps: Story = {
    args: {
        steps: defaultSteps,
        currentStep: 5,
    },
};

export const Compact: Story = {
    args: {
        steps: defaultSteps,
        currentStep: 2,
        variant: 'compact',
    },
};

export const Clickable: Story = {
    args: {
        steps: defaultSteps,
        currentStep: 2,
        allowClickableSteps: true,
        onStepClick: (stepIndex: number) => {
            console.log(`Clicked step ${stepIndex + 1}`);
        },
    },
};

export const WithCustomIcons: Story = {
    args: {
        steps: [
            {
                label: 'Personal Details',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                )
            },
            {
                label: 'Contact Info',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                )
            },
            {
                label: 'Education',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.75 2.524z" />
                    </svg>
                )
            },
            {
                label: 'Documents',
                icon: (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                )
            }
        ],
        currentStep: 2,
    },
};

export const ThreeSteps: Story = {
    args: {
        steps: [
            { label: 'Setup', description: 'Initial configuration' },
            { label: 'Review', description: 'Verify details' },
            { label: 'Complete', description: 'Finish process' }
        ],
        currentStep: 2,
    },
};
