import React from 'react';
import Card from '../Card';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';

interface ProfileSummaryProps {
  candidate: {
    profileSummary: string;
  };
  canEdit?: boolean;
  onEdit?: () => void;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({
  candidate,
  canEdit = false,
  onEdit,
}) => {
  return (
    <Card>
      <div className="pb-2 flex justify-between items-center">
        <span className="text-lg font-medium">Profile Summary</span>
        {onEdit && (
          <Button variant="ghost" iconOnly onClick={onEdit} disabled={!canEdit}>
            <Icon name="edit" size={16} />
          </Button>
        )}
      </div>
      <div className="pr-4 py-2">
        <p className="text-gray-700 text-start">
          {candidate.profileSummary}
        </p>
      </div>
    </Card>
  );
};

export default ProfileSummary;
