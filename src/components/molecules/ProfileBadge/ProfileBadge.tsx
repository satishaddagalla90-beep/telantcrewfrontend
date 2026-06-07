import React from 'react';

interface ProfileBadgeProps {
    text: string;
    show: boolean;
}

const ProfileBadge: React.FC<ProfileBadgeProps> = ({ text, show }) => {
    if (!show) return null;

    return (
        <div className="position-absolute bottom-0 start-50 translate-middle-x bg-success text-white px-3 py-1 rounded-pill small fw-bold shadow-sm">
            {text}
        </div>
    );
};

export default ProfileBadge;