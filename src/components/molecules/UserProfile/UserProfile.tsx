import React, { useState, useEffect } from 'react';
import Avatar from '../../atoms/Avatar';
import Text from '../../atoms/Text';
import Badge from '../../atoms/Badge';
import InfoItem from '../InfoItem';
import { capitalizeAndSafe } from '../../../utils/textUtils';
import { FileUploadService } from '../../../services/fileUploadService';

export interface UserDetails {
  id: string;
  display_name?: string;
  username: string;
  email?: string;
  phone_no?: string;
  status?: 'active' | 'inactive';
  avatar?: string;
  created?: string;
  updated?: string;
  last_login?: string;
  collectionId?: string;
  expand?: {
    designation?: { name: string };
    department?: { name: string } | { name: string }[];
    location?: { city: string };
    role?: { name: string } | { name: string }[];
    reporting_to?: { first_name: string };
  };
}

export interface UserProfileProps {
  userDetails: UserDetails;
  avatarBaseUrl?: string;
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  userDetails,
  avatarBaseUrl = '',
  className = '',
}) => {
  const [displayAvatarUrl, setDisplayAvatarUrl] = useState<string>('');

  // Effect to fetch presigned URL if avatar is not already presigned
  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (userDetails.avatar) {
        // Check if avatar is already a presigned URL (contains signed parameters)
        if (userDetails.avatar.includes('X-Amz-Signature') || userDetails.avatar.includes('sign')) {
          setDisplayAvatarUrl(userDetails.avatar);
        } else if (
          userDetails.avatar.startsWith('http://') ||
          userDetails.avatar.startsWith('https://')
        ) {
          // Try to get presigned URL
          try {
            const url = await FileUploadService.getFileViewUrl(userDetails.avatar);
            setDisplayAvatarUrl(url);
          } catch (error) {
            console.error('Error fetching presigned avatar URL:', error);
            // Fallback to original URL
            setDisplayAvatarUrl(userDetails.avatar);
          }
        } else {
          setDisplayAvatarUrl(userDetails.avatar);
        }
      } else {
        setDisplayAvatarUrl('');
      }
    };

    fetchPresignedUrl();
  }, [userDetails.avatar]);

  const getAvatarUrl = () => {
    // Return the presigned URL or the original avatar
    return displayAvatarUrl || userDetails.avatar || undefined;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '/');
  };

  const renderArrayOrString = (data: any) => {
    if (Array.isArray(data)) {
      return data.map(item => capitalizeAndSafe(item.name)).join(', ');
    }
    return capitalizeAndSafe(data?.name) || 'N/A';
  };

  // Determine if user is active based on multiple factors
  const determineUserActivityStatus = () => {
    // If status is explicitly set, use it
    if (userDetails.status) {
      return userDetails.status.toLowerCase() === 'active';
    }

    // If last_login is available, consider user active if logged in within last 30 days
    if (userDetails.last_login) {
      const lastLoginDate = new Date(userDetails.last_login);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastLoginDate > thirtyDaysAgo;
    }

    // If updated recently (within 7 days), consider active
    if (userDetails.updated) {
      const updatedDate = new Date(userDetails.updated);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return updatedDate > sevenDaysAgo;
    }

    // Default to active if no clear indicators
    return true;
  };

  const isUserActive = determineUserActivityStatus();
  const activityStatus = isUserActive ? 'Active' : 'Inactive';

  return (
    <div className={className}>
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {/* Name and Status */}
          <div className="flex items-center gap-3 mb-2">
            <Text variant="h4" className="text-xl font-semibold text-gray-900">
              {capitalizeAndSafe(userDetails.display_name) || 'User Name'}
            </Text>
            <Badge variant={isUserActive ? 'success' : 'secondary'} size="sm">
              {activityStatus}
            </Badge>
          </div>

          {/* Designation */}
          <Text variant="p" className="text-gray-700 font-medium">
            {capitalizeAndSafe(userDetails.expand?.designation?.name) || 'N/A'}
          </Text>
        </div>

        {/* Avatar */}
        <div className="ml-6">
          <Avatar
            src={getAvatarUrl()}
            alt="User Avatar"
            size="xl"
            fallbackIcon={true}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {userDetails.phone_no && (
          <InfoItem label="Phone" value={userDetails.phone_no} />
        )}
        {userDetails.email && (
          <InfoItem label="Email" value={userDetails.email} />
        )}
      </div>

      {/* User Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {userDetails.expand?.department && (
          <InfoItem
            label="Department"
            value={renderArrayOrString(userDetails.expand.department)}
          />
        )}
        {userDetails.expand?.location?.city && (
          <InfoItem
            label="Location"
            value={capitalizeAndSafe(userDetails.expand.location.city)}
          />
        )}
        {userDetails.created && (
          <InfoItem
            label="Date Of Joining"
            value={formatDate(userDetails.created)}
          />
        )}
        {userDetails.expand?.role && (
          <InfoItem
            label="Role"
            value={renderArrayOrString(userDetails.expand.role)}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfile;
