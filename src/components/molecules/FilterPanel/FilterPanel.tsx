import React from 'react';
import Button from '../../atoms/Button';
import Dropdown from '../../atoms/Dropdown';
import Text from '../../atoms/Text';
import AsyncSelect, { AsyncSelectOption } from '../../atoms/AsyncSelect';
import Input from '../../atoms/Input';
import SearchDropdown from '../SearchDropdown/SearchDropdown';

export interface FilterField {
    key: string;
    label: string;
    type: 'text' | 'select' | 'async-select' | 'date' | 'number' | 'number-range' | 'search-dropdown';
    placeholder?: string;
    options?: { value: string; label: string; }[];
    asyncOptions?: AsyncSelectOption[];
    onAsyncSearch?: (value: string) => void;
    loading?: boolean;
    required?: boolean;
    disabled?: boolean;
    isMulti?: boolean;
    // For number-range type
    minKey?: string;
    maxKey?: string;
    minPlaceholder?: string;
    maxPlaceholder?: string;
}

export interface FilterPanelProps {
    /** Filter fields configuration */
    fields: FilterField[];
    /** Current filter values */
    values: Record<string, string | string[] | any>;
    /** Change handler for filter values */
    onValuesChange: (values: Record<string, string | string[] | any>) => void;
    /** Apply filters handler */
    onApplyFilters: () => void;
    /** Clear all filters handler */
    onClearFilters: () => void;
    /** Title for the filter panel */
    title?: string;
    /** Additional CSS classes */
    className?: string;
    /** Number of columns for the grid layout */
    columns?: 1 | 2 | 3 | 4;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    fields,
    values,
    onValuesChange,
    onApplyFilters,
    onClearFilters,
    title = "Filters",
    className = '',
    columns = 4,
}) => {
    const updateFilter = (key: string, value: any) => {
        onValuesChange({
            ...values,
            [key]: value,
        });
    };

    const handleAsyncSelectChange = (key: string, option: AsyncSelectOption | null) => {
        updateFilter(key, option?.value || null);
    };

    const getAsyncSelectValue = (options: AsyncSelectOption[], filterValue: string | null): AsyncSelectOption | null => {
        if (!filterValue) return null;
        return options.find(opt => opt.value === filterValue) || { value: filterValue, label: filterValue };
    };

    const getSelectValue = (options: { value: string; label: string; }[], filterValue: string | null): string => {
        return filterValue || '';
    };

    const getGridCols = () => {
        switch (columns) {
            case 1: return 'grid-cols-1';
            case 2: return 'grid-cols-1 md:grid-cols-2';
            case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
            case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
            default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
        }
    };

    const renderField = (field: FilterField, index: number) => {
        const currentValue = values[field.key];
        
        // Smart placement: First row opens DOWN (to avoid hitting header), 
        // all other rows open UP (to avoid page scrolling)
        const menuPlacement = index < columns ? 'bottom' : 'top';

        // For number-range validation
        let numberRangeError: string | null = null;
        if (field.type === 'number-range') {
            const minKey = field.minKey || `${field.key}Min`;
            const maxKey = field.maxKey || `${field.key}Max`;
            const minValue = values[minKey];
            const maxValue = values[maxKey];
            if (
                minValue !== null &&
                minValue !== '' &&
                !isNaN(Number(minValue)) &&
                Number(minValue) < 0
            ) {
                numberRangeError = 'Min value cannot be negative';
            } else if (
                maxValue !== null &&
                maxValue !== '' &&
                !isNaN(Number(maxValue)) &&
                Number(maxValue) < 0
            ) {
                numberRangeError = 'Max value cannot be negative';
            } else if (
                minValue !== null &&
                maxValue !== null &&
                minValue !== '' &&
                maxValue !== '' &&
                !isNaN(Number(minValue)) &&
                !isNaN(Number(maxValue))
            ) {
                if (Number(maxValue) < Number(minValue)) {
                    numberRangeError = 'Max value should be equal to or greater than Min value';
                } else if (Number(maxValue) > 50) {
                    numberRangeError = 'Max value cannot be greater than 50';
                }
            } else if (maxValue !== null && maxValue !== '' && !isNaN(Number(maxValue))) {
                if (Number(maxValue) > 50) {
                    numberRangeError = 'Max value cannot be greater than 50';
                }
            }
        }

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        value={currentValue || ''}
                        onChange={(e) => updateFilter(field.key, e.target.value || null)}
                        placeholder={field.placeholder}
                        size="sm"
                        disabled={field.disabled}
                    />
                );

            case 'select':
                return (
                    <Dropdown
                        options={field.options || []}
                        value={getSelectValue(field.options || [], currentValue)}
                        onChange={(value) => updateFilter(field.key, value || null)}
                        size="sm"
                        fullWidth
                        disabled={field.disabled}
                    />
                );

            case 'async-select':
                return (
                    <AsyncSelect
                        value={getAsyncSelectValue(field.asyncOptions || [], currentValue)}
                        onChange={(option) => handleAsyncSelectChange(field.key, option)}
                        onInputChange={field.onAsyncSearch || (() => { })}
                        options={field.asyncOptions || []}
                        isLoading={field.loading}
                        placeholder={field.placeholder}
                        size="sm"
                        disabled={field.disabled}
                        onFocus={() => field.onAsyncSearch?.('')}
                        menuPlacement={menuPlacement}
                    />
                );

            case 'search-dropdown':
                return (
                    <SearchDropdown
                        label={""} // Label is handled by wrapper
                        value={currentValue}
                        onChange={(val: any) => {
                            // Extract values if it's an array of options (for multi) or single option
                            if (Array.isArray(val)) {
                                updateFilter(field.key, val.map(v => v.value));
                            } else {
                                updateFilter(field.key, val?.value || null);
                            }
                        }}
                        onInputChange={(input: any, action: any) => { // Use 'any' type to avoid TS errors
                            if (action.action === 'input-change' && field.onAsyncSearch) {
                                field.onAsyncSearch(input);
                            }
                        }}
                        options={field.asyncOptions || []} // Adapter: AsyncSelectOption is compatible with DropdownOption structure if we consider value/label
                        loading={field.loading}
                        placeholder={field.placeholder}
                        isMulti={field.isMulti}
                        disabled={field.disabled}
                        menuPlacement={menuPlacement}
                    />
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={currentValue || ''}
                        onChange={(e) => updateFilter(field.key, e.target.value || null)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-colors duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={field.disabled}
                    />
                );

            case 'number':
                return (
                    <Input
                        type="number"
                        value={currentValue || ''}
                        onChange={(e) => updateFilter(field.key, e.target.value || null)}
                        placeholder={field.placeholder}
                        size="sm"
                        disabled={field.disabled}
                    />
                );

            case 'number-range': {
                const minKey = field.minKey || `${field.key}Min`;
                const maxKey = field.maxKey || `${field.key}Max`;
                const minValue = values[minKey] || '';
                const maxValue = values[maxKey] || '';

                return (
                    <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={minValue}
                                onChange={(e) => updateFilter(minKey, e.target.value || null)}
                                placeholder={field.minPlaceholder || "Min"}
                                size="sm"
                                disabled={field.disabled}
                                className="flex-1"
                            />
                            <span className="text-gray-500 text-sm font-medium">to</span>
                            <Input
                                type="number"
                                value={maxValue}
                                onChange={(e) => updateFilter(maxKey, e.target.value || null)}
                                placeholder={field.maxPlaceholder || "Max"}
                                size="sm"
                                disabled={field.disabled}
                                className="flex-1"
                            />
                        </div>
                        {numberRangeError && (
                            <span className="text-xs text-red-500 mt-1">{numberRangeError}</span>
                        )}
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
            <Text variant="h6" weight="semibold" className="text-gray-900 mb-4">
                {title}
            </Text>

            <div className={`grid ${getGridCols()} gap-4`}>
                {fields.map((field, index) => (
                    <div key={field.key} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderField(field, index)}
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                >
                    Clear All
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onApplyFilters}
                >
                    Apply Filters
                </Button>
            </div>
        </div>
    );
};

export default FilterPanel;
