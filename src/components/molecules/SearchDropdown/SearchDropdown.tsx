import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { DropdownOption } from '../../../types';
import Icon from '../../atoms/Icon/Icon';
import AddDropdownOptionModal from '../AddDropdownOptionModal/AddDropdownOptionModal';
import AddRoleModal from '../AddRoleModal/AddRoleModal';

interface SearchDropdownProps {
  label: string;
  value: string | string[];
  onChange: (value: DropdownOption | DropdownOption[] | null) => void;
  options: DropdownOption[];
  loading?: boolean;
  error?: string | null;
  placeholder?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  onInputChange?: (input: string, action: any) => void;
  required?: boolean;
  disabled?: boolean;
  noOptionsMessage?: string;
  showAddButton?: boolean;
  dropdownType?: string;
  dropdownLabel?: string;
  /** Context for special cases */
  context?: { [key: string]: any };
  onOptionAdded?: (newOption: DropdownOption) => void;
  /** Called when dropdown menu is scrolled to bottom (for infinite scroll) */
  onMenuScrollToBottom?: () => void;
  /** Disable frontend filtering when backend handles filtering */
  disableFilter?: boolean;
  /** Dropdown menu placement */
  menuPlacement?: 'auto' | 'bottom' | 'top';
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  label,
  value,
  onChange,
  options,
  loading = false,
  error = null,
  placeholder,
  isMulti = false,
  isClearable = true,
  isSearchable = true,
  onInputChange,
  required = false,
  disabled = false,
  noOptionsMessage,
  showAddButton = false,
  dropdownType,
  dropdownLabel,
  context,
  onOptionAdded,
  onMenuScrollToBottom,
  disableFilter = false,
  menuPlacement = 'auto',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cache selected options to preserve labels even when they disappear from the 'options' list (e.g. during search)
  const [cachedOptions, setCachedOptions] = useState<DropdownOption[]>([]);

  // Update cache when options change or value changes, to capture any known labels for selected values
  useEffect(() => {
    const valueArray = Array.isArray(value) ? value : [value].filter(Boolean);
    const newKnownOptions: DropdownOption[] = [];

    valueArray.forEach(val => {
      const valStr = typeof val === 'string' ? val : (val as any)?.value || val;

      // 1. Try to find in current props options
      const foundInProps = options.find(opt => opt.value === valStr && !(opt as any).__isTemporary);
      if (foundInProps) {
        newKnownOptions.push(foundInProps);
      }
      // 2. If not in props, but value itself is an object with label, use it!
      else if (typeof val === 'object' && val !== null && (val as any).label) {
        newKnownOptions.push({
          value: valStr,
          label: (val as any).label,
          ...(val as any)
        });
      }
    });

    if (newKnownOptions.length > 0) {
      setCachedOptions(prev => {
        const unique = [...prev];
        newKnownOptions.forEach(newOpt => {
          if (!unique.find(u => u.value === newOpt.value)) {
            unique.push(newOpt);
          }
        });
        return unique;
      });
    }
  }, [value, options]);


  const handleOptionAdded = (newOption: {
    id: string;
    value: string;
    label: string;
  }) => {
    const dropdownOption: DropdownOption = {
      value: newOption.value,
      label: newOption.label,
    };

    // Add to cache immediately
    setCachedOptions(prev => [...prev, dropdownOption]);

    // Auto-select the newly added option
    if (onChange) {
      if (isMulti) {
        // For multi-select, add to current selection
        // Get current selection as DropdownOption objects
        const currentSelection = getSelectValue();
        const currentArray = Array.isArray(currentSelection)
          ? currentSelection
          : [];
        onChange([...currentArray, dropdownOption]);
      } else {
        // For single select, set as the selected value
        onChange(dropdownOption);
      }
    }

    // Notify parent component
    if (onOptionAdded) {
      onOptionAdded(dropdownOption);
    }

    setIsModalOpen(false);
  };
  const handleChange = (selectedOption: any) => {
    // When user selects options, cache them so we remember their labels
    const selectedArray = Array.isArray(selectedOption) ? selectedOption : (selectedOption ? [selectedOption] : []);
    if (selectedArray.length > 0) {
      setCachedOptions(prev => {
        const unique = [...prev];
        selectedArray.forEach((newOpt: DropdownOption) => {
          // Don't cache temporary options if possible, unless that's all we have
          if (!(newOpt as any).__isTemporary && !unique.find(u => u.value === newOpt.value)) {
            unique.push(newOpt);
          }
        });
        return unique;
      });
    }

    if (isMulti) {
      onChange(selectedOption || []);
    } else {
      onChange(selectedOption);
    }
  };

  const getSelectValue = () => {
    if (isMulti) {
      const valueArray = Array.isArray(value) ? value : [value].filter(Boolean);
      // Find existing options - look in PROPS options OR CACHED options
      const existingOptions = valueArray.map(val => {
        const valStr = typeof val === 'string' ? val : (val as any)?.value || val;
        // Priority: Current Options > Cached Options
        return options.find(opt => opt.value === valStr) ||
          cachedOptions.find(opt => opt.value === valStr);
      }).filter(Boolean) as DropdownOption[];

      // Create temporary options for missing values (truly unknown)
      const foundValues = existingOptions.map(opt => opt.value);
      const missingValues = valueArray.filter(val => {
        const valStr = typeof val === 'string' ? val : (val as any)?.value || val;
        return !foundValues.includes(valStr);
      });

      const missingOptions = missingValues.map(val => {
        const valStr =
          typeof val === 'string' ? val : (val as any)?.value || val;
        const extractedLabel =
          typeof valStr === 'string'
            ? valStr.split('/').pop() || valStr
            : valStr;
        return {
          value: valStr,
          label: extractedLabel, // Extract city name from path like "india/uttar pradesh/kanpur" -> "kanpur"
          __isTemporary: true, // Mark as temporary
        };
      });
      return [...existingOptions, ...missingOptions];
    } else {
      const stringValue =
        typeof value === 'string'
          ? value
          : Array.isArray(value)
            ? value[0] || ''
            : value;

      const existingOption = options.find(opt => opt.value === stringValue) ||
        cachedOptions.find(opt => opt.value === stringValue);

      if (existingOption) {
        return existingOption;
      } else if (stringValue) {
        // Create temporary option for missing value
        const extractedLabel =
          typeof stringValue === 'string'
            ? stringValue.split('/').pop() || stringValue
            : stringValue;
        return {
          value: stringValue,
          label: extractedLabel,
          __isTemporary: true, // Mark as temporary
        };
      }
      return null;
    }
  };

  // Combine real options, cached options, and temporary options for display
  const getAllOptions = () => {
    if (!isMulti) return options;

    // Start with passed options
    let allOpts = [...options];

    // Add cached options that are selected but NOT in the current options list
    // (This ensures selected items don't just appear as tags, but also exist in the dropdown if we want, or just let React Select handle "value" prop logic)
    // Actually, React Select mainly needs 'value' prop to be fully resolved objects. 'options' prop defines the LIST.
    // If we want the selected items to appear in the list even if search excludes them (standard UX often keeps them), we could append.
    // But usually search filters the list. If I search "B", "A" (selected) should probably not be in the list, but show as a tag.
    // React Select handles this via the `value` prop.

    // However, we still need to handle the "missing" (temporary) options for the list logic if we want them top-listed
    const selectValues = getSelectValue(); // These are full objects now (Found + Temporary)
    const selectValuesArray = Array.isArray(selectValues)
      ? selectValues
      : (selectValues ? [selectValues] : []);

    // Add cached/missing options to the list so they appear
    const missingInOptions = selectValuesArray.filter((sel: any) => !options.find(opt => opt.value === sel.value));

    return [...missingInOptions, ...options];
  };

  const handleInputChange = (input: string, action: any) => {
    if (
      onInputChange &&
      action.action === 'input-change' &&
      typeof input === 'string'
    ) {
      onInputChange(input, action);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Select
            value={getSelectValue()}
            onChange={handleChange}
            onInputChange={handleInputChange}
            options={getAllOptions()}
            isLoading={loading}
            isDisabled={disabled}
            isClearable={isClearable}
            isSearchable={isSearchable}
            isMulti={isMulti}
            placeholder={placeholder || `Select ${label.toLowerCase()}`}
            classNamePrefix="react-select"
            menuPlacement={menuPlacement}
            menuPortalTarget={document.body}
            maxMenuHeight={180}
            filterOption={disableFilter ? () => true : undefined}
            noOptionsMessage={() => {
              if (noOptionsMessage) return noOptionsMessage;
              if (loading) return 'Loading...';
              return `No ${label.toLowerCase()} found`;
            }}
            styles={{
              menuPortal: base => ({ ...base, zIndex: 9999 }),
              control: base => ({
                ...base,
                minHeight: '42px',
                borderRadius: '0.375rem',
                borderColor: error ? '#ef4444' : '#d1d5db',
                '&:hover': {
                  borderColor: error ? '#ef4444' : '#d1d5db',
                },
              }),
              valueContainer: base => ({
                ...base,
                padding: '0.5rem 0.75rem',
              }),
              input: base => ({
                ...base,
                margin: '0px',
                padding: '0px',
              }),
              option: (base, { data }) => ({
                ...base,
                backgroundColor: (data as any).__isTemporary
                  ? '#f3f4f6'
                  : base.backgroundColor,
                fontStyle: (data as any).__isTemporary ? 'italic' : 'normal',
                '&:hover': {
                  backgroundColor: (data as any).__isTemporary
                    ? '#e5e7eb'
                    : base.backgroundColor,
                },
              }),
              multiValue: (base, { data }) => ({
                ...base,
                backgroundColor: (data as any).__isTemporary
                  ? '#e5e7eb'
                  : base.backgroundColor,
                // padding: '0px 2px',
                // margin: '0px 2px',
                // fontSize: '14px',
                margin: '2px',
              }),
            }}
            onMenuScrollToBottom={onMenuScrollToBottom}
          />
        </div>
        {showAddButton && dropdownType && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            disabled={disabled}
            className="flex items-center justify-center w-8 h-[38px] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded border flex-shrink-0 mt-[2px]"
            title={`Add new ${dropdownLabel || label.toLowerCase()}`}
          >
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {showAddButton && dropdownType && (
        <>
          {dropdownType === 'Roles' ? (
            <AddRoleModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={handleOptionAdded}
            />
          ) : (
            <AddDropdownOptionModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              dropdownType={dropdownType}
              dropdownLabel={dropdownLabel || label}
              context={context}
              onSuccess={handleOptionAdded}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SearchDropdown;
