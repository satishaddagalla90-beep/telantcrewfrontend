import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../atoms/Avatar';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import UserProfile, { UserDetails } from '../UserProfile';
import { usePermissions } from '../../../hooks/usePermissions';

export interface UserDropdownProps {
  userName?: string;
  designation?: string;
  userAvatar?: string;
  userDetails?: UserDetails;
  avatarBaseUrl?: string;
  onLogout?: () => void;
  onViewProfile?: () => void;
  onUserProfileSetup?: () => void;
  onChangePassword?: () => void;
  onGenerateOTP?: () => void;
  onArchive?: () => void;
  onUserGuide?: () => void;
  variant?: 'primary' | 'light';
  className?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({
  userName = 'User Name',
  designation = 'No Designation',
  userAvatar,
  userDetails,
  avatarBaseUrl = '',
  onLogout,
  onViewProfile,
  onUserProfileSetup,
  onChangePassword,
  onGenerateOTP,
  onArchive,
  onUserGuide,
  variant = 'primary',
  className = '',
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();

  // Helper function to get user initials for avatar fallback
  const getUserInitials = (name: string): string => {
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return 'U';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const togglePopup = () => {
    setShowPopup(prev => !prev);
  };

  const handleViewProfile = () => {
    setShowProfileModal(true);
    setShowPopup(false);
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const menuItems = [
    {
      icon: 'user' as const,
      label: 'View Profile',
      onClick: handleViewProfile,
    },
    {
      icon: 'user' as const,
      label: 'User Profile Setup',
      onClick: () => {
        setShowPopup(false);
        if (onUserProfileSetup) onUserProfileSetup();
      },
    },
    {
      icon: 'lock' as const,
      label: 'Change Password',
      onClick: () => {
        setShowPopup(false);
        if (onChangePassword) onChangePassword();
      },
    },
    {
      icon: 'key' as const,
      label: 'Generate OTP',
      onClick: () => {
        setShowPopup(false);
        if (onGenerateOTP) onGenerateOTP();
      },
    },
    {
      icon: 'archive' as const,
      label: 'Archive',
      onClick: () => {
        setShowPopup(false);
        if (onArchive) onArchive();
      },
    },
    {
      icon: 'book' as const,
      label: 'User Guide',
      onClick: () => {
        setShowPopup(false);
        if (onUserGuide) onUserGuide();
      },
    },
    ...(isSuperAdmin
      ? [
          {
            icon: 'sliders' as const,
            label: 'Admin Panel',
            onClick: () => {
              setShowPopup(false);
              navigate('/admin');
            },
            className: 'text-primary-600 hover:bg-primary-50',
          },
        ]
      : []),
    {
      icon: 'sign-out' as const,
      label: 'Sign Out',
      onClick: () => {
        setShowPopup(false);
        if (onLogout) onLogout();
      },
      className: 'text-red-600 hover:bg-red-50',
    },
  ];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePopup();
    }
  };

  // Conditional styling based on variant
  const triggerClasses =
    variant === 'light'
      ? 'flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition-colors border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-primary-600'
      : 'flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-lg p-2 transition-colors border-none bg-transparent focus:outline-none focus:ring-2 focus:ring-white/50';

  const textClasses =
    variant === 'light'
      ? 'text-sm font-medium text-gray-700'
      : 'text-sm font-medium text-white';
  const iconClasses = variant === 'light' ? 'text-gray-700' : 'text-white';

  return (
    <div className={`relative ${className}`}>
      {/* User Trigger */}
      <button
        type="button"
        className={triggerClasses}
        onClick={togglePopup}
        onKeyDown={handleKeyDown}
        aria-label={`User menu for ${userName}`}
        aria-expanded={showPopup}
        aria-haspopup="menu"
      >
        <Avatar
          src={userAvatar}
          alt={`${userName} Avatar`}
          size="sm"
          fallback={getUserInitials(userName)}
          fallbackIcon={false}
        />
        <Text variant="span" className={textClasses}>
          {userName}
        </Text>
        <Icon name="caret-down" size={12} className={iconClasses} />
      </button>

      {/* Dropdown Popup */}
      {showPopup && (
        <div
          ref={popupRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
            <Avatar
              src={userAvatar}
              alt={`${userName} Avatar`}
              size="md"
              fallback={getUserInitials(userName)}
              fallbackIcon={false}
            />
            <div className="flex-1">
              <Text variant="h6" className="font-semibold mb-0">
                {userName}
              </Text>
              <Text variant="p" className="text-gray-600 text-sm">
                {designation}
              </Text>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close dropdown"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                  item.className || ''
                }`}
              >
                <Icon name={item.icon} size={16} />
                <Text variant="span" className="text-sm">
                  {item.label}
                </Text>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && userDetails && (
        <Modal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          title="User Profile"
          size="lg"
          headerVariant="primary"
          footer={
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </Button>
            </div>
          }
        >
          <UserProfile
            userDetails={userDetails}
            avatarBaseUrl={avatarBaseUrl}
          />
        </Modal>
      )}
    </div>
  );
};

export default UserDropdown;
