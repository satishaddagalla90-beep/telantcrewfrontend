import React from 'react';

interface DefaultAvatarProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Default avatar placeholder SVG used throughout the application
 * when no profile image is available
 */
const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <svg
      className={`text-gray-400 ${sizeClass} ${className}`}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-label="Default avatar"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
};

export default DefaultAvatar;
