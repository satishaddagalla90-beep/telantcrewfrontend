import React from 'react';

export interface ProfileHeaderProps {
  /** Display name */
  name: string;
  /** ID or code */
  code: string;
  /** LinkedIn URL */
  linkedinUrl?: string;
  /** Contact information */
  contact: {
    location?: string;
    phone?: string;
    email?: string;
  };
  /** Personal details */
  details: {
    dateOfBirth?: string;
    panNumber?: string;
  };
  /** Meta information */
  meta: {
    lastViewedBy?: string;
    lastViewedDate?: string;
    lastUpdatedBy?: string;
    lastUpdatedDate?: string;
    createdBy?: string;
    created?: string;
  };
  /** Profile photo */
  profilePhoto?: {
    url?: string;
    alt?: string;
  };
  /** Resume information */
  resume?: {
    url?: string;
    available?: boolean;
  };
  /** Status indicators */
  status?: {
    activelyLooking?: boolean;
    favorite?: boolean;
  };
  /** Action handlers */
  onEdit?: () => void;
  onToggleFavorite?: () => void;
  /** Permission flags */
  canEdit?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  code,
  linkedinUrl,
  contact,
  details,
  meta,
  profilePhoto,
  resume,
  status,
  onEdit,
  onToggleFavorite,
  canEdit = true,
  className = '',
}) => {
  return (
    <div className={`${className}`}>
      {/* Top Section: Name, LinkedIn, Actions */}
      <div className="d-flex justify-content-between align-items-center">
        {/* Left Section: Name & Icons */}
        <div className="d-flex align-items-center gap-2">
          <span className="fw-bold fs-5">
            {name} ({code})
            {linkedinUrl ? (
              <a
                href={
                  linkedinUrl.startsWith('http')
                    ? linkedinUrl
                    : `https://${linkedinUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="ms-2 text-decoration-none"
                style={{ fontSize: '0.9rem', color: '#0a66c2' }}
              >
                <i className="bi bi-linkedin me-1"></i>
              </a>
            ) : (
              <span className="ms-2 text-muted" style={{ fontSize: '0.9rem' }}>
                N/A
              </span>
            )}
            {/* Favorite Icon */}
            <i
              className={`bi ${status?.favorite ? 'bi-star-fill' : 'bi-star'}`}
              title={
                status?.favorite ? 'Remove from Favorites' : 'Add to Favorites'
              }
              style={{
                color: status?.favorite ? '#ffc107' : '#dc3545',
                cursor: 'pointer',
                fontSize: '1.1rem',
                marginLeft: '0.5rem',
              }}
              onClick={onToggleFavorite}
            ></i>
          </span>
        </div>
      </div>

      {/* Middle Section: Details & Profile Photo */}
      <div className="d-flex justify-content-between align-items-start mt-2">
        {/* Left: Contact & Personal Details */}
        <div className="text-muted">
          {/* Contact Information */}
          <div className="d-flex align-items-center gap-3 flex-wrap text-muted small mb-1">
            {contact.location && (
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-geo-alt"></i>
                <span>{contact.location}</span>
              </div>
            )}
            {contact.phone && (
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-telephone"></i>
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-envelope"></i>
                <span>{contact.email}</span>
              </div>
            )}
          </div>

          {/* Personal Details */}
          <div className="d-flex align-items-center gap-4 flex-wrap text-muted small mb-1">
            {details.dateOfBirth && (
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-calendar"></i>
                <span>
                  DOB:{' '}
                  {new Date(details.dateOfBirth).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
            {details.panNumber && (
              <div className="d-flex align-items-center gap-1">
                <i className="bi bi-file-earmark-text"></i>
                <span>PAN: {details.panNumber}</span>
              </div>
            )}
          </div>

          {/* Meta Information */}
          <div className="d-flex flex-column gap-1">
            {meta.createdBy && (
              <div className="text-muted small">
                <i className="bi bi-person-plus"></i> Created By: {meta.createdBy}
                {meta.created && ` on ${meta.created}`}
              </div>
            )}
            {meta.lastViewedBy && (
              <div className="text-muted small">
                <i className="bi bi-eye"></i> Last Viewed By:{' '}
                {meta.lastViewedBy}
                {meta.lastViewedDate && ` on ${meta.lastViewedDate}`}
              </div>
            )}
            {meta.lastUpdatedBy && (
              <div className="text-muted small">
                <i className="bi bi-pencil"></i> Last Updated By:{' '}
                {meta.lastUpdatedBy}
                {meta.lastUpdatedDate && ` on ${meta.lastUpdatedDate}`}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-3 d-flex flex-wrap gap-2">
            {resume?.available ? (
              <a
                className="btn btn-outline-primary btn-sm"
                href={resume.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Resume
              </a>
            ) : (
              <button className="btn btn-outline-secondary btn-sm" disabled>
                Resume Not Available
              </button>
            )}

            <button className="btn btn-outline-primary btn-sm">
              Create Resume Builder
            </button>
          </div>
        </div>

        {/* Right: Profile Photo Section */}
        <div>
          <div className="d-flex justify-content-end headericon">
            <button
              type="button"
              className="btn text-primary btn-sm me-n1"
              style={{
                cursor: canEdit ? 'pointer' : 'not-allowed',
                opacity: canEdit ? 1 : 0.5,
              }}
              onClick={canEdit ? onEdit : undefined}
              tabIndex={canEdit ? 0 : -1}
              aria-disabled={!canEdit}
              title={
                canEdit ? 'Edit Profile' : "You don't have permission to edit"
              }
            >
              <i className="bi bi-pencil-square"></i>
            </button>
          </div>

          <div>
            <svg width="130" height="130" viewBox="0 0 130 130">
              <defs>
                <clipPath id="circleClip">
                  <circle cx="65" cy="65" r="60" />
                </clipPath>
              </defs>

              {/* Profile Image */}
              <image
                href={profilePhoto?.url}
                width="130"
                height="130"
                clipPath="url(#circleClip)"
                preserveAspectRatio="xMidYMid slice"
              />

              {/* Status Indicator */}
              {status?.activelyLooking && (
                <>
                  <defs>
                    <filter
                      id="blur-corner"
                      x="-30%"
                      y="-25%"
                      width="180%"
                      height="160%"
                    >
                      <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                    </filter>
                  </defs>

                  {/* Arc background */}
                  <path
                    d="M25,95 A50,50 0 0,0 105,98"
                    fill="none"
                    stroke="green"
                    strokeWidth="18"
                    filter="url(#blur-corner)"
                  />

                  {/* Curved text */}
                  <path
                    id="textCurve"
                    d="M25,95 A50,50 0 0,0 105,100"
                    fill="none"
                  />
                  <text fontSize="10" fill="white" fontWeight="bold">
                    <textPath
                      href="#textCurve"
                      startOffset="50%"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      Actively Looking
                    </textPath>
                  </text>
                </>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
