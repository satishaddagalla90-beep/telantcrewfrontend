// src/organisms/ProfessionalDetails.tsx
import React from 'react';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import InfoItem from '../../molecules/InfoItem';
import Text from '../../atoms/Text';

interface ProfessionalDetailsProps {
  data: {
    total_experience: string;
    relevant_experience: string;
    current_ctc: string;
    expected_ctc: string;
    current_city?: string;
    preferred_location: { label: string }[];
    notice_period: string;
    job_open_type: string;
    preferred_job: string;
    job_preference: string;
    shift: string;
    source_name?: string;
    career_break_type?: string;
    duration?: Array<{ from_date: string | null; to_date: string | null }>;
  };
  onEdit?: () => void;
  canEdit?: boolean;
}

const ProfessionalDetails: React.FC<ProfessionalDetailsProps> = ({
  data,
  onEdit,
  canEdit = true,
}) => {
  // Helper to format duration
  const formatDuration = (duration: any) => {
    if (Array.isArray(duration) && duration.length > 0) {
      const { from_date, to_date } = duration[0];
      if (from_date && to_date) {
        return `${from_date} to ${to_date}`;
      }
      if (from_date) return `From ${from_date}`;
      return '';
    }
    return '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="info" size={20} className="text-primary-600" />
          <Text weight="semibold" className="text-lg font-medium text-gray-900">
            Professional Details
          </Text>
        </div>
        {onEdit && (
          <Button
            variant="ghost"
            iconOnly
            onClick={onEdit}
            disabled={!canEdit}
            className="absolute right-0 top-0"
          >
            <Icon name="edit" size={16} />
          </Button>
        )}
      </div>
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Total Experience" value={data.total_experience} />
          <InfoItem
            label="Relevant Experience"
            value={data.relevant_experience}
          />
        </div>
        <div className="border-t my-2" />
        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            label="Current CTC"
            value={
              data.current_ctc
                ? Number(data.current_ctc).toLocaleString('en-IN')
                : ''
            }
          />
          <InfoItem
            label="Expected CTC"
            value={
              data.expected_ctc
                ? Number(data.expected_ctc).toLocaleString('en-IN')
                : ''
            }
          />
        </div>
        <div className="border-t my-2" />
        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            label="Current Location"
            value={data.current_city || ''}
          />
          <InfoItem
            label="Preferred Locations"
            value={data.preferred_location.map(loc => loc.label).join(', ')}
          />
        </div>
        <div className="border-t my-2" />
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Job Open Type" value={data.job_open_type} />
          <InfoItem label="Preferred Job" value={data.preferred_job} />
        </div>
        <div className="border-t my-2" />
        <div className="grid grid-cols-2 gap-4">
          <InfoItem
            label="Job Preference"
            value={
              typeof data.job_preference === 'object' && data.job_preference
                ? (data.job_preference as any).label ||
                (data.job_preference as any).value ||
                JSON.stringify(data.job_preference)
                : data.job_preference
            }
          />
          <InfoItem label="Shift" value={data.shift} />
        </div>
        <div className="border-t my-2" />
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="Notice Period" value={data.notice_period} />
          <InfoItem label="Source Name" value={data.source_name || ''} />
        </div>
        {(data.career_break_type ||
          (data.duration && data.duration.length > 0)) && (
            <>
              <div className="border-t my-2" />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="Career Break Type"
                  value={data.career_break_type || '-'}
                />
                <InfoItem
                  label="Duration"
                  value={formatDuration(data.duration)}
                />
              </div>
            </>
          )}
      </div>
    </div>
  );
};

export default ProfessionalDetails;
