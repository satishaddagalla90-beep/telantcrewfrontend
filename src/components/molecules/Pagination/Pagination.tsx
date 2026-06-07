import React from 'react';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Dropdown from '../../atoms/Dropdown';

export interface PaginationProps {
    /** Current active page */
    currentPage: number;
    /** Total number of pages */
    totalPages: number;
    /** Callback when page changes */
    onPageChange: (page: number) => void;
    /** Whether pagination is disabled */
    disabled?: boolean;
    /** Show page info text */
    showPageInfo?: boolean;
    /** Custom page info format */
    pageInfoFormat?: (current: number, total: number) => string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
    /** Items per page */
    itemsPerPage?: number;
    /** Callback when items per page changes */
    onItemsPerPageChange?: (value: number) => void;
    /** Show items per page dropdown */
    showItemsPerPage?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    disabled = false,
    showPageInfo = true,
    pageInfoFormat = (current, total) => `${current} of ${total}`,
    size = 'md',
    className = '',
    itemsPerPage,
    onItemsPerPageChange,
    showItemsPerPage = true,
}) => {
    const handleFirstPage = () => {
        if (!disabled && currentPage !== 1) {
            onPageChange(1);
        }
    };

    const handlePreviousPage = () => {
        if (!disabled && currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (!disabled && currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handleLastPage = () => {
        if (!disabled && currentPage !== totalPages) {
            onPageChange(totalPages);
        }
    };

    const sizeClasses = {
        sm: 'gap-2',
        md: 'gap-3',
        lg: 'gap-4',
    };

    const buttonSizeMap = {
        sm: 'sm' as const,
        md: 'md' as const,
        lg: 'lg' as const,
    };

    // Always show pagination if items per page selector is visible, otherwise hide if only 1 page
    const shouldShowPagination = totalPages > 1 || (showItemsPerPage && itemsPerPage && onItemsPerPageChange);

    if (!shouldShowPagination) {
        return null;
    }

    return (
        <div
            className={`
                flex items-center ${sizeClasses[size]} ${className}
            `}
            aria-label={`Pagination: page ${currentPage} of ${totalPages}`}
        >
            {/* Items per page dropdown - Minimal style */}
            {showItemsPerPage && itemsPerPage && onItemsPerPageChange && (
                <div className="flex items-center gap-2 pr-2">
                    <span className={`text-gray-600 ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
                        Showing
                    </span>
                    <Dropdown
                        options={[
                            { value: '10', label: '10' },
                            { value: '20', label: '20' },
                            { value: '50', label: '50' },
                            { value: '100', label: '100' },
                        ]}
                        value={itemsPerPage.toString()}
                        onChange={(value) => onItemsPerPageChange(parseInt(value))}
                        size={size}
                        className={size === 'sm' ? 'w-20 text-xs' : 'w-32'}
                    />
                    <span className={`text-gray-600 whitespace-nowrap ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs'}`}>
                        per page
                    </span>
                </div>
            )}

            {/* Navigation buttons - only show if more than 1 page */}
            {totalPages > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size={buttonSizeMap[size]}
                        onClick={handleFirstPage}
                        disabled={disabled || currentPage === 1}
                        className="px-2 rounded-md hover:bg-gray-100"
                        title="First page"
                        aria-label="First page"
                    >
                        <Icon
                            name="caret-double-left"
                            size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
                        />
                    </Button>

                    {/* Previous Page Button */}
                    <Button
                        variant="ghost"
                        size={buttonSizeMap[size]}
                        onClick={handlePreviousPage}
                        disabled={disabled || currentPage === 1}
                        className="px-2 rounded-md hover:bg-gray-100"
                        title="Previous page"
                        aria-label="Previous page"
                    >
                        <Icon
                            name="caret-left"
                            size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
                        />
                    </Button>

                    {/* Page Info */}
                    {showPageInfo && (
                        <span
                            className={`
                                text-gray-600 font-medium mx-2
                                ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
                            `}
                        >
                            {pageInfoFormat(currentPage, totalPages)}
                        </span>
                    )}

                    {/* Next Page Button */}
                    <Button
                        variant="ghost"
                        size={buttonSizeMap[size]}
                        onClick={handleNextPage}
                        disabled={disabled || currentPage === totalPages}
                        className="px-2 rounded-md hover:bg-gray-100"
                        title="Next page"
                        aria-label="Next page"
                    >
                        <Icon
                            name="caret-right"
                            size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
                        />
                    </Button>

                    {/* Last Page Button */}
                    <Button
                        variant="ghost"
                        size={buttonSizeMap[size]}
                        onClick={handleLastPage}
                        disabled={disabled || currentPage === totalPages}
                        className="px-2 rounded-md hover:bg-gray-100"
                        title="Last page"
                        aria-label="Last page"
                    >
                        <Icon
                            name="caret-double-right"
                            size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16}
                        />
                    </Button>
                </>
            )}
        </div>
    );
};

export default Pagination;