import React, { useState } from 'react';
import Button from '../../atoms/Button';
import SearchBox from '../../atoms/SearchBox';
import Dropdown from '../../atoms/Dropdown';
import ColumnSelector, { ColumnConfig, ColumnOption } from '../ColumnSelector';

export interface FilterBarProps {
    /** Search functionality */
    searchValue: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    searchDescription?: string;

    /** Profile/Status filter */
    profileOptions?: Array<{ value: string; label: string; }>;
    selectedProfile?: string;
    onProfileChange?: (value: string) => void;

    /** Column visibility */
    visibleColumns?: ColumnConfig;
    columnOptions?: ColumnOption[];
    onColumnsChange?: (columns: ColumnConfig) => void;
    onColumnsReset?: () => void;

    /** Filter toggle */
    showFilters?: boolean;
    onToggleFilters?: () => void;

    /** Export functionality */
    onExport?: (format: string) => void;

    /** Save view functionality */
    onSaveView?: () => void;

    /** Permission check */
    canViewData?: boolean;

    /** Additional CSS classes */
    className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search...',
    searchDescription,
    profileOptions = [],
    selectedProfile = '',
    onProfileChange,
    visibleColumns = {},
    columnOptions = [],
    onColumnsChange,
    onColumnsReset,
    showFilters = false,
    onToggleFilters,
    onExport,
    onSaveView,
    canViewData = true,
    className = '',
}) => {
    const [exportValue, setExportValue] = useState('');

    const handleExportChange = (value: string) => {
        if (value && onExport) {
            onExport(value);
            setExportValue(''); // Reset dropdown
        }
    };

    const exportOptions = [
        { value: 'csv', label: 'Export to CSV' },
        { value: 'excel', label: 'Export to Excel' },
        { value: 'email', label: 'Email To' },
        { value: 'exportAll', label: 'Export All Data' },
    ];

    if (!canViewData) {
        return null;
    }

    return (
        <div className={`bg-white border-b border-gray-200 px-6 h-full ${className}`}>
            <div className="flex items-center justify-between gap-x-4 py-4">
                {/* Left Side - Filters and Actions */}
                <div className="flex items-center gap-3">
                    {/* Profile Filter */}
                    {profileOptions.length > 0 && onProfileChange && (
                        <Dropdown
                            options={profileOptions}
                            value={selectedProfile}
                            onChange={onProfileChange}
                            size="sm"
                            className="min-w-40"
                        />
                    )}

                    {/* Column Selector */}
                    {columnOptions.length > 0 && onColumnsChange && onColumnsReset && (
                        <ColumnSelector
                            visibleColumns={visibleColumns}
                            columns={columnOptions}
                            onChange={onColumnsChange}
                            onReset={onColumnsReset}
                        />
                    )}

                    {/* Filter Toggle */}
                    {onToggleFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon="funnel"
                            iconPosition="left"
                            onClick={onToggleFilters}
                            className="border border-gray-300"
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>
                    )}

                    {/* Save View */}
                    {/* {onSaveView && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon="save"
                            iconPosition="left"
                            onClick={onSaveView}
                            className="border border-gray-300"
                        >
                            Save View
                        </Button>
                    )} */}
                </div>

                {/* Right Side - Search and Export */}
                <div className="flex items-center gap-3">
                    {/* Search Box */}
                        <SearchBox
                            value={searchValue}
                            onChange={onSearchChange}
                            placeholder={searchDescription || searchPlaceholder}
                            size="sm"
                            className="w-96"
                        />

                    {/* Export Dropdown */}
                    {onExport && (
                        <Dropdown
                            options={[
                                ...exportOptions
                            ]}
                            value={exportValue}
                            onChange={handleExportChange}
                            size="sm"
                            className="min-w-32"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilterBar;