import React, { useState, useEffect } from 'react';
import TextArea from '../../atoms/TextArea';
import Label from '../../atoms/Label';

interface ProfileSummaryFormProps {
    initialData: {
        profileSummary: string;
    };
    onDataChange: (data: { profileSummary: string; }) => void;
}

const ProfileSummaryForm: React.FC<ProfileSummaryFormProps> = ({
    initialData,
    onDataChange
}) => {
    const [formData, setFormData] = useState({
        profileSummary: initialData.profileSummary || ''
    });

    useEffect(() => {
        onDataChange(formData);
    }, [formData, onDataChange]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="profileSummary" required>
                    Profile Summary
                </Label>
                <TextArea
                    id="profileSummary"
                    value={formData.profileSummary}
                    onChange={(e) => handleChange('profileSummary', e.target.value)}
                    placeholder="Enter profile summary..."
                    rows={6}
                    className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                    {formData.profileSummary.length}/1000 characters
                </p>
            </div>
        </div>
    );
};

export default ProfileSummaryForm;
