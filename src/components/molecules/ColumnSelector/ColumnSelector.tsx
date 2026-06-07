import React, { useState, useRef, useEffect } from 'react';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';

export interface ColumnConfig {
  [key: string]: boolean;
}

export interface ColumnOption {
  key: string;
  label: string;
}

export interface ColumnSelectorProps {
  /** Column visibility configuration */
  visibleColumns: ColumnConfig;
  /** Available columns */
  columns: ColumnOption[];
  /** Change handler */
  onChange: (columns: ColumnConfig) => void;
  /** Reset to default handler */
  onReset: () => void;
  /** Button text */
  buttonText?: string;
  /** Additional CSS classes */
  className?: string;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  visibleColumns,
  columns,
  onChange,
  onReset,
  buttonText = 'Columns',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key: string) => {
    onChange({
      ...visibleColumns,
      [key]: !visibleColumns[key],
    });
  };

  const toggleSelectAll = () => {
    const allVisible = Object.values(visibleColumns).every(Boolean);
    const newConfig: ColumnConfig = {};

    columns.forEach(column => {
      newConfig[column.key] = !allVisible;
    });

    onChange(newConfig);
  };

  const handleReset = () => {
    onReset();
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const allSelected = Object.values(visibleColumns).every(Boolean);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        icon="sliders"
        iconPosition="left"
        onClick={() => setIsOpen(!isOpen)}
        className="border border-gray-300"
      >
        {buttonText}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Show / Hide Columns</h3>
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon="close"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              />
            </div>

            <div className="space-y-3">
              {/* Select All */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                />
                <span className="font-medium text-gray-900">Select All</span>
              </label>

              <hr className="border-gray-200" />

              {/* Individual Columns */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center space-x-3 cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.key] || false}
                      onChange={() => toggleColumn(column.key)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                    />
                    <span className="text-gray-700">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-gray-200 my-4" />

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;