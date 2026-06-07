import React from 'react';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import DefaultAvatar from '../../atoms/Avatar/DefaultAvatar';
import { formatUIDate } from '../../../utils/dateFormat';

export interface ContactInfo {
  location?: string;
  phone?: string;
  email?: string;
  dob?: string;
  panNo?: string;
  uanNo?: string;
}

export interface AuditInfo {
  lastViewedBy?: string;
  lastViewedOn?: string;
  lastUpdatedBy?: string;
  lastUpdatedOn?: string;
  createdBy?: string;
  createdOn?: string;
}

export interface DetailHeaderProps {
  /** Primary identification */
  name: string;
  code: string;
  designation?: string;
  status?: string;

  /** Code display format: 'prefix' shows "CODE - Name", 'suffix' shows "Name (Code)" */
  codeFormat?: 'prefix' | 'suffix';

  /** Avatar size: 'sm' for clients (24x24), 'md' for applicants (32x32) */
  avatarSize?: 'sm' | 'md';

  /** NEW: priority badge */
  priority?: string;
  
  subName?: string;

  /** NEW: custom child components for actions/links */
  children?: React.ReactNode;

  /** NEW: footer action components (rendered in the audit row) */
  footerActions?: React.ReactNode;

  /** Contact and personal information */
  contactInfo?: ContactInfo;

  /** Social and external links */
  linkedinProfile?: string;

  /** NEW: website & portal */
  website?: string;
  portalStatus?: string;

  /** Flag information */
  flag?: string;
  flagColor?: string;

  /** Status indicators */
  isFavorite?: boolean;
  isActivelyLooking?: boolean;

  /** Profile image */
  photo?: string;

  /** Audit trail information */
  auditInfo?: AuditInfo;
  resumeUrl?: string;

  /** Event handlers */
  onEdit?: () => void;
  onFavorite?: () => void;
  onViewResume?: () => void;
  onCreateResume?: () => void;
  onAddJob?: () => void;
  onOpenJobs?: () => void;
  openJobsCount?: number;
  onPrevious?: () => void;
  onNext?: () => void;

  /** Permissions */
  canEdit?: boolean;

  /** Feature visibility toggles */
  hideResume?: boolean;
  hideFavorite?: boolean;

  /** Presentation tweaks */
  hideContactInfo?: boolean;
  auditPlacement?: 'left' | 'right';
  msmeCertified?: string;
  zone?: string;

  /** Custom labels for audit info */
  lastUpdatedByLabel?: string;
  lastUpdatedOnLabel?: string;
  
  /** Additional CSS classes */
  className?: string;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({
  name,
  code,
  codeFormat = 'prefix',
  avatarSize = 'md',
  designation,
  status,
  contactInfo = {},
  linkedinProfile,
  website,
  portalStatus,
  isFavorite = false,
  isActivelyLooking = false,
  flag,
  flagColor,
  photo,
  auditInfo = {},
  resumeUrl,
  onEdit,
  onFavorite,
  onViewResume,
  onCreateResume,
  onAddJob,
  onOpenJobs,
  openJobsCount = 0,
  canEdit = true,
  hideResume = false,
  hideFavorite = true,
  onPrevious,
  onNext,
  className = '',
  hideContactInfo = false,
  auditPlacement = 'right',
  priority,
  subName,
  children,
  footerActions,
  msmeCertified,
  zone,
  lastUpdatedByLabel = 'Last Updated By',
  lastUpdatedOnLabel = 'Last Updated',
}) => {
  const formatDate = (dateString?: string) => {
    return formatUIDate(dateString);
  };

  const statusText = status !== undefined && status !== null ? String(status) : '';
  const statusLower = statusText.toLowerCase();
  const priorityText = priority ? String(priority) : '';

  return (
    <div
      className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 relative pb-4">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 px-6 pt-6">
          {/* Left Column: Basic Info & Contacts */}
          <div className="space-y-4 min-w-0">

            {/* Name and Actions */}
            <div className="">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Text
                    variant="h2"
                    weight="semibold"
                    className="text-gray-900"
                  >
                    {codeFormat === 'prefix'
                      ? `${code} - ${name}`
                      : `${name} (${code})`}
                  </Text>
                  {statusText && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ['active', 'submitted', 'open'].includes(statusLower)
                          ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                          : ['inactive', 'closed', 'on hold', 'on-hold'].includes(statusLower)
                            ? 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                            : statusLower === 'new lead'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                              : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                        }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                          ['active', 'submitted', 'open'].includes(statusLower)
                            ? 'bg-green-500'
                            : ['inactive', 'closed', 'on hold', 'on-hold'].includes(statusLower)
                              ? 'bg-gray-400'
                              : statusLower === 'new lead'
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                          }`}
                      />
                      {statusText}
                    </span>
                  )}
                  {/* Priority Badge */}
                  {priorityText && (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        priorityText.toLowerCase() === 'high'
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                          : priorityText.toLowerCase() === 'medium'
                            ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                            : 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                      }`}
                    >
                      {priorityText}
                    </span>
                  )}
                  {/* Icons in the same row */}
                  <div className="flex items-center gap-2">
                    {flag && (
                      <div className="flex items-center">
                        <Icon
                          name="flag"
                          size={20}
                          color={flagColor || '#9CA3AF'}
                          weight="fill"
                          aria-label={String(flag)}
                        />
                      </div>
                    )}
                    {resumeUrl && (
                      <button
                        type="button"
                        onClick={onViewResume}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                        title="View Resume"
                      >
                        <Icon name="attachment" size={16} />
                      </button>
                    )}
                    {linkedinProfile && (
                      <a
                        href={linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn Profile"
                        title="LinkedIn Profile"
                      >
                        <Icon
                          name="linkedin"
                          size={20}
                          color="#0A66C2"
                          className="cursor-pointer"
                        />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub Name / Client Req ID */}
              {subName && (
                <div className="-mt-1 mb-1">
                  <Text size="sm" className="text-gray-500 font-normal">
                    ({subName})
                  </Text>
                </div>
              )}

              {/* Designation */}
              {designation && (
                <Text
                  size="sm"
                  className="text-gray-700 text-start font-semibold text-wrap overflow-hidden"
                >
                  {designation}
                </Text>
              )}
              {/* Location */}
              <div>
                {contactInfo.location && (
                  <div className="flex items-center gap-1 text-gray-600 max-w-md" title={contactInfo.location}>
                    <Icon name="map-pin" size={14} className="text-gray-500" />
                    <Text size="sm" className="truncate">
                      {contactInfo.location}
                    </Text>
                  </div>
                )}
              </div>
              {/* Website & Client Portal - Same line */}
              {(website || (portalStatus && portalStatus !== 'No Portal')) && (
                <div className="flex flex-wrap items-center gap-x-2 text-gray-600">
                  {website && (
                    <Text size="sm">
                      Website:{' '}
                      <a
                        href={
                          website.startsWith('http')
                            ? website
                            : `https://${website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {website
                          .replace(/^https?:\/\//i, '')
                          .replace(/\/$/, '')}
                      </a>
                    </Text>
                  )}
                  {website && portalStatus && portalStatus !== 'No Portal' && (
                    <Text size="sm">|</Text>
                  )}
                  {portalStatus && portalStatus !== 'No Portal' && (
                    <Text size="sm">
                      <a
                        href={
                          portalStatus.startsWith('http')
                            ? portalStatus
                            : `https://${portalStatus}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Client Portal <Icon name="external-link" size={12} />
                      </a>
                    </Text>
                  )}
                </div>
              )}
            </div>
            {/* Contact Information */}
            <div className="space-y-4">
              {contactInfo && (
                <div>
                  {(contactInfo.phone || contactInfo.email) && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-gray-600">
                      {contactInfo.phone && (
                        <a
                          href={`tel:${contactInfo.phone}`}
                          className="hover:text-blue-600 transition-colors flex items-center"
                        >
                          <Icon name="call" size={14} className="mr-1" />
                          <Text size="sm">{contactInfo.phone}</Text>
                        </a>
                      )}
                      {contactInfo.phone && contactInfo.email && (
                        <Text size="sm">|</Text>
                      )}
                      {contactInfo.email && (
                        <a
                          href={`mailto:${contactInfo.email}`}
                          className="hover:text-blue-600 transition-colors flex items-center"
                        >
                          <Icon name="mail" size={14} className="mr-1" />
                          <Text size="sm">{contactInfo.email}</Text>
                        </a>
                      )}
                    </div>
                  )}
                  {(contactInfo.dob || contactInfo.panNo) && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-gray-600">
                      {contactInfo.dob && (
                        <Text size="sm">
                          DOB: {formatDate(contactInfo.dob)}
                        </Text>
                      )}
                      {contactInfo.dob && contactInfo.panNo && (
                        <Text size="sm">|</Text>
                      )}
                      {contactInfo.panNo && (
                        <Text size="sm">PAN: {contactInfo.panNo}</Text>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* UAN */}
              {contactInfo.uanNo && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Text size="sm">UAN: {contactInfo.uanNo}</Text>
                </div>
              )}

              {/* Action Buttons */}
              {(onAddJob || onOpenJobs || onPrevious || onNext) && (
                <div className="flex flex-wrap items-center justify-between gap-4 ">
                  <div className="flex flex-wrap gap-3">
                    {/* Job actions */}
                    {onAddJob && (
                      <button
                        onClick={onAddJob}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        <Icon name="briefcase" size={14} />
                        <Text size="sm">Add Job Requisition</Text>
                      </button>
                    )}
                    {onOpenJobs && (
                      <button
                        onClick={onOpenJobs}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        <Icon name="briefcase" size={14} />
                        <Text size="sm">
                          Open Job
                          {typeof openJobsCount === 'number'
                            ? ` (${openJobsCount})`
                            : ''}
                        </Text>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* MSME Certified and Zone Information - At Bottom of left section */}
              {(msmeCertified || zone) && (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                  {msmeCertified && (
                    <>
                      <span>MSME Certified: </span>
                      <span className="font-medium">{msmeCertified}</span>
                    </>
                  )}
                  {msmeCertified && zone && <span>|</span>}
                  {zone && (
                    <>
                      <span>Zone: </span>
                      <span className="font-medium">{zone}</span>
                    </>
                  )}
                </div>
              )}

              {/* Custom Children Actions */}
              {children && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                  {children}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column: Avatar & Actions */}
          <div className="flex flex-col items-center md:items-end pr-2">
            <div className="flex flex-col items-center md:items-end gap-4 h-full">
              {/* Avatar Container with Edit Button */}
              <div className="flex items-start gap-4">
                <div className={`relative ${avatarSize === 'sm' ? 'w-24 h-24' : 'w-28 h-28'}`}>
                  {/* Profile Image or Placeholder with white border */}
                  <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white shadow-xl">
                    {photo && photo.trim() ? (
                      <img
                        src={photo}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <DefaultAvatar size={avatarSize} />
                      </div>
                    )}
                  </div>

                  {/* Actively Looking Badge */}
                  {isActivelyLooking && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full whitespace-nowrap shadow-lg border-2 border-white">
                      Actively Looking
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                {onEdit && (
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={onEdit}
                    className="flex-shrink-0"
                  >
                    <Icon name="edit" size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Row - Bottom aligned for all modules */}
        <div className="px-6 pt-4 mt-2 border-t border-blue-100/50 flex flex-wrap justify-between items-center gap-y-3 text-gray-500">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {(auditInfo.lastViewedBy || auditInfo.lastViewedOn) && (
              <div className="flex items-center gap-1 whitespace-nowrap">
                <Text size="xs" className="flex items-center gap-1">
                  Last Viewed By: 
                  {auditInfo.lastViewedBy ? (
                    <span 
                      className="truncate max-w-[100px] font-medium text-gray-700" 
                      title={auditInfo.lastViewedBy}
                    >
                      {auditInfo.lastViewedBy}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </Text>
                {auditInfo.lastViewedOn && (
                  <Text size="xs" className="opacity-75">
                    on {auditInfo.lastViewedOn}
                  </Text>
                )}
              </div>
            )}

            {/* Footer Actions (e.g. Recommended Candidates, Add Applicant) */}
            {footerActions && (
              <div className="flex flex-wrap items-center gap-x-3">
                {footerActions}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3">
            {(auditInfo.lastUpdatedBy || auditInfo.lastUpdatedOn) ? (
              <div className="flex items-center gap-1 whitespace-nowrap">
                {auditInfo.lastUpdatedBy && (
                  <Text size="xs" className="flex items-center gap-1">
                    {lastUpdatedByLabel}: 
                    <span 
                      className="truncate max-w-[100px] font-medium text-gray-700" 
                      title={auditInfo.lastUpdatedBy}
                    >
                      {auditInfo.lastUpdatedBy}
                    </span>
                  </Text>
                )}
                {auditInfo.lastUpdatedBy && auditInfo.lastUpdatedOn && (
                  <Text size="xs">|</Text>
                )}
                {auditInfo.lastUpdatedOn && (
                  <Text size="xs">
                    {lastUpdatedOnLabel}: {auditInfo.lastUpdatedOn}
                  </Text>
                )}
              </div>
            ) : (
              auditInfo.createdBy && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                   <Text size="xs" className="flex items-center gap-1">
                    Created By: 
                    <span 
                      className="truncate max-w-[100px] font-medium text-gray-700" 
                      title={auditInfo.createdBy}
                    >
                      {auditInfo.createdBy}
                    </span>
                  </Text>
                  {auditInfo.createdOn && (
                    <Text size="xs">
                      | Created On: {auditInfo.createdOn}
                    </Text>
                  )}
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DetailHeader;
