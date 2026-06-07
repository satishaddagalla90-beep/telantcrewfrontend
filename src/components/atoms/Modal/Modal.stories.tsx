import type { Meta, StoryObj } from '@storybook/react';
import Modal from './Modal';
import Button from '../Button';
import { useState } from 'react';

const meta: Meta<typeof Modal> = {
    title: 'Atoms/Modal',
    component: Modal,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        size: {
            control: { type: 'select' },
            options: ['sm', 'md', 'lg', 'xl'],
        },
        headerVariant: {
            control: { type: 'select' },
            options: ['default', 'primary', 'danger', 'success', 'warning'],
        },
    },
};

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWithTrigger = (args: any) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                <div className="p-6">
                    <p className="mb-4">This is the modal content. You can put any React components here.</p>
                    <div className="flex gap-2">
                        <Button variant="primary" onClick={() => setIsOpen(false)}>
                            Save
                        </Button>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export const Default: Story = {
    render: (args) => <ModalWithTrigger {...args} />,
    args: {
        title: 'Modal Title',
        size: 'md',
        headerVariant: 'default',
    },
};

export const Large: Story = {
    render: (args) => <ModalWithTrigger {...args} />,
    args: {
        title: 'Large Modal',
        size: 'lg',
        headerVariant: 'primary',
    },
};

export const Danger: Story = {
    render: (args) => <ModalWithTrigger {...args} />,
    args: {
        title: 'Delete Confirmation',
        size: 'sm',
        headerVariant: 'danger',
    },
};
