// src/molecules/ActionButtons.tsx
import Button from '../../atoms/Button';
import React from 'react';
import Icon from '../../atoms/Icon';

interface ActionButtonsProps {
    resumeUrl?: string;
    onCreateResume?: () => void;
    onEdit?: () => void;
    canEdit?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    resumeUrl,
    onCreateResume,
    onEdit,
    canEdit = true,
}) => {
    return (
        <div className="flex flex-wrap gap-2 items-center">
            {resumeUrl ? (
                <a href={resumeUrl} target="_blank">
                    <Icon name="file-text" size={16} className="mr-1" />
                    View Resume
                </a>
            ) : (
                <Button variant="outline" size="sm" disabled>
                    Resume Not Available
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={onCreateResume}>
                <Icon name="edit" size={16} className="mr-1" />
                Create Resume Builder
            </Button>
            {onEdit && (
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onEdit}
                    disabled={!canEdit}
                    className={canEdit ? '' : 'opacity-50 cursor-not-allowed'}
                >
                    <Icon name="edit" size={16} className="mr-1" />
                    Edit Candidate
                </Button>
            )}
        </div>
    );
};


export default ActionButtons;