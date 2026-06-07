import React from 'react';
export interface LogoProps {
    src?: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({
    src,
    alt = 'Logo',
    width,
    height,
    size = 'md',
    className = '',
    onClick,
}) => {
    const sizeClasses = {
        sm: 'h-8',
        md: 'h-12',
        lg: 'h-14',
    };

    const baseClasses = `${!width && !height ? sizeClasses[size] : ''} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`;

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick();
        }
    };

    if (src) {
        if (onClick) {
            return (
                <button
                    type="button"
                    className={`inline-flex items-center cursor-pointer border-none bg-transparent p-0 focus:outline-none focus:ring-2 focus:ring-[#2563eb] rounded ${className}`}
                    onClick={onClick}
                    onKeyDown={handleKeyDown}
                    aria-label={alt}
                >
                    <img
                        src={src}
                        alt={alt}
                        width={width}
                        height={height}
                        className={`${baseClasses} w-auto object-contain`}
                    />
                </button>
            );
        }
        return (
            <div className={`inline-flex items-center ${className}`}>
                <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className={`${baseClasses} w-auto object-contain`}
                />
            </div>
        );
    }

    // Fallback when no src is provided
    if (onClick) {
        return (
            <button
                type="button"
                className={`${baseClasses} bg-gradient-to-r from-[#2563eb] to-purple-600 text-white font-bold rounded-lg flex items-center justify-center px-3 border-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${className}`}
                style={{ width: width, height: height }}
                onClick={onClick}
                onKeyDown={handleKeyDown}
                aria-label={alt}
            >
                <span className="text-lg">{alt.charAt(0).toUpperCase()}</span>
            </button>
        );
    }

    return (
        <div
            className={`${baseClasses} bg-gradient-to-r from-[#2563eb] to-purple-600 text-white font-bold rounded-lg flex items-center justify-center px-3 ${className}`}
            style={{ width: width, height: height }}
        >
            <span className="text-lg">{alt.charAt(0).toUpperCase()}</span>
        </div>
    );
};

export default Logo;
