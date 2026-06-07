import React from 'react';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';

export interface UserAuditInfo {
  lastViewedBy?: string;
  lastViewedOn?: string;
  lastUpdatedBy?: string;
  lastUpdatedOn?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface UserDetailHeaderProps {
  /** Primary identification */
  name: string;
  code: string;
  designation?: string;
  status?: string;

  /** Profile image */
  photo?: string;

  /** Audit trail information */
  auditInfo?: UserAuditInfo;

  /** Action handlers */
  onEdit?: () => void;

  /** Permissions */
  canEdit?: boolean;

  /** Additional CSS classes */
  className?: string;
}

const UserDetailHeader: React.FC<UserDetailHeaderProps> = ({
  name,
  code,
  designation,
  status,
  photo,
  auditInfo = {},
  onEdit,
  canEdit = true,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 relative">
        <div className="flex justify-between">
          {/* Left Column - Name, Designation, Last Viewed By */}
          <div className="space-y-4 max-w-4xl px-6 pt-6 pb-2 flex flex-col justify-between">
            <div className="">
              {/* Name and Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <Text
                  variant="h2"
                  weight="semibold"
                  className="text-gray-900"
                >
                  {code} - {name}
                </Text>
                {status && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      status === 'Active'
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                        : status === 'Inactive'
                          ? 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                          : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                    }`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        status === 'Active'
                          ? 'bg-green-500'
                          : status === 'Inactive'
                            ? 'bg-gray-400'
                            : 'bg-gray-400'
                      }`}
                    />
                    {status}
                  </span>
                )}
              </div>

              {/* Designation */}
              {designation && (
                <Text
                  size="sm"
                  className="text-gray-700 text-start font-semibold"
                >
                  {designation}
                </Text>
              )}
            </div>

            {/* Last Viewed By - Bottom of left column */}
            <div className="mt-auto">
              {(auditInfo.lastViewedBy || auditInfo.lastViewedOn) && (
                <div className="flex flex-wrap items-center gap-x-1">
                  <Text size="xs" className="text-gray-500">
                    {auditInfo.lastViewedBy && (
                      <>Last Viewed By: {auditInfo.lastViewedBy}</>
                    )}
                    {auditInfo.lastViewedBy && auditInfo.lastViewedOn && <> on</>}
                  </Text>
                  {auditInfo.lastViewedOn && (
                    <Text size="xs" className="text-gray-500">
                      {auditInfo.lastViewedOn}
                    </Text>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Avatar, Edit Button, Last Updated By */}
          <div className="flex flex-col items-end pr-2 pt-2">
            <div className="flex flex-col items-start h-full">
              {/* Avatar Container with Edit Button */}
              <div className="flex items-start justify-between w-full">
                <div className="w-8 h-8"></div>
                <div className="relative mt-2 w-28 h-28">
                  {/* Profile Image or Placeholder with white border */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-lg">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg
                          className="text-gray-400 w-16 h-16"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit Button - to the right of Avatar */}
                {canEdit && onEdit && (
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={onEdit}
                    disabled={!canEdit}
                    className="mt-1"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                )}
              </div>

              {/* Last Updated By - Bottom of right column */}
              {(auditInfo.lastUpdatedBy || auditInfo.lastUpdatedOn) && (
                <div className="text-gray-500 pt-4 pb-2 mt-auto">
                  <div className="flex items-center gap-x-2 whitespace-nowrap">
                    {auditInfo.lastUpdatedBy && (
                      <Text size="xs">
                        Last Updated By: {auditInfo.lastUpdatedBy}
                      </Text>
                    )}
                    {auditInfo.lastUpdatedBy && auditInfo.lastUpdatedOn && (
                      <Text size="xs">|</Text>
                    )}
                    {auditInfo.lastUpdatedOn && (
                      <Text size="xs">
                        Last Updated: {auditInfo.lastUpdatedOn}
                      </Text>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailHeader;
