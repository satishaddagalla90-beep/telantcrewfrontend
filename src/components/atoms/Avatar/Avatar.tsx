import React from 'react';
import Icon from '../Icon';

export interface AvatarProps {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fallback?: string;
    fallbackIcon?: boolean;
    className?: string;
    onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    size = 'md',
    fallback,
    fallbackIcon = true,
    className = '',
    onClick,
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24,
        xl: 32,
    };

    const baseClasses = `${sizeClasses[size]} rounded-full border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 ${onClick ? 'cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb]' : ''
        }`;

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-xl',
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick();
        }
    };

    const [imageError, setImageError] = React.useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    // Reset image error when src changes
    React.useEffect(() => {
        setImageError(false);
    }, [src]);

    const renderFallback = () => {
        // If custom fallback text is provided, use it
        if (fallback) {
            const fallbackText = fallback.slice(0, 2).toUpperCase(); // Take first 2 characters
            if (onClick) {
                return (
                    <button
                        type="button"
                        className={`${baseClasses} ${className} border-none`}
                        onClick={onClick}
                        onKeyDown={handleKeyDown}
                        aria-label={alt}
                    >
                        <span className={`text-gray-600 font-semibold ${textSizes[size]}`}>
                            {fallbackText}
                        </span>
                    </button>
                );
            }
            return (
                <div className={`${baseClasses} ${className}`}>
                    <span className={`text-gray-600 font-semibold ${textSizes[size]}`}>
                        {fallbackText}
                    </span>
                </div>
            );
        }

        // Use icon fallback if enabled
        if (fallbackIcon) {
            if (onClick) {
                return (
                    <button
                        type="button"
                        className={`${baseClasses} ${className} border-none`}
                        onClick={onClick}
                        onKeyDown={handleKeyDown}
                        aria-label={alt}
                    >
                        <Icon
                            name="user-circle"
                            size={iconSizes[size]}
                            color="#9CA3AF"
                            weight="fill"
                        />
                    </button>
                );
            }
            return (
                <div className={`${baseClasses} ${className}`}>
                    <Icon
                        name="user-circle"
                        size={iconSizes[size]}
                        color="#9CA3AF"
                        weight="fill"
                    />
                </div>
            );
        }

        // Default fallback using first character of alt text
        const defaultFallback = alt?.charAt(0)?.toUpperCase() || '?';
        if (onClick) {
            return (
                <button
                    type="button"
                    className={`${baseClasses} ${className} border-none`}
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                    aria-label={alt}
                >
                    <span className={`text-gray-600 font-semibold ${textSizes[size]}`}>
                        {defaultFallback}
                    </span>
                </button>
            );
        }

        return (
            <div className={`${baseClasses} ${className}`}>
                <span className={`text-gray-600 font-semibold ${textSizes[size]}`}>
                    {defaultFallback}
                </span>
            </div>
        );
    };

    // Show image if src is provided and no error occurred
    if (src && !imageError) {
        if (onClick) {
            return (
                <button
                    type="button"
                    className={`${baseClasses} ${className} border-none p-0`}
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                    aria-label={alt}
                >
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                    />
                </button>
            );
        }
        return (
            <img
                src={src}
                alt={alt}
                className={`${baseClasses} object-cover shrink-0 ${className}`}
                onError={handleImageError}
            />
        );
    }

    // Show fallback when no src or image failed to load
    return renderFallback();
};

export default Avatar;
