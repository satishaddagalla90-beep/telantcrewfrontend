import React from 'react';
import Icon from '../../atoms/Icon';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  render?: (value: any, row: any) => React.ReactNode;
  headerRender?: () => React.ReactNode;
}

export interface DataTableProps {
  /** Array of columns */
  columns: TableColumn[];
  /** Array of data rows */
  data: any[];
  /** Visible columns configuration */
  visibleColumns: { [key: string]: boolean };
  /** Sort configuration */
  sortConfig?: {
    key: string;
    direction: 'asc' | 'desc';
  };
  /** Sort handler */
  onSort?: (key: string) => void;
  /** Selection */
  selectedRows?: string[];
  onSelectAll?: (selected: boolean) => void;
  onSelectRow?: (id: string, selected: boolean) => void;
  /** Row click handler */
  onRowClick?: (row: any) => void;
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Table height for internal scrolling */
  height?: string;
  /** Max height for internal scrolling */
  maxHeight?: string;
  /** Number of columns to freeze from the left (after checkbox column) */
  stickyColumns?: number;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  visibleColumns,
  sortConfig,
  onSort,
  selectedRows = [],
  onSelectAll,
  onSelectRow,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  height,
  maxHeight,
  stickyColumns = 2,
}) => {
  const visibleColumnsArray = columns.filter(col => visibleColumns[col.key]);
  const allSelected = data.length > 0 && data.every(row => selectedRows.includes(row.id));
  const hasCheckbox = !!(onSelectAll || onSelectRow);
  const effectiveHeight = height || maxHeight || 'auto';
  const effectiveMaxHeight = maxHeight || (height ? 'none' : 'auto');

  // Calculate sticky column positions
  const getStickyStyle = (columnIndex: number, isHeader: boolean = false): React.CSSProperties => {
    // First non-sticky column needs left border to separate from sticky columns
    if (columnIndex === stickyColumns) {
      return {
        borderLeft: '1px solid #e5e7eb',
      };
    }
    
    if (columnIndex > stickyColumns) {
      // Other non-sticky columns - no special positioning needed
      return {};
    }
    
    let leftPosition = 0;
    
    // Account for checkbox column if present
    if (hasCheckbox) {
      leftPosition += 48; // checkbox column width
    }
    
    // Add width of previous sticky columns
    for (let i = 0; i < columnIndex; i++) {
      const col = visibleColumnsArray[i];
      if (col) {
        const colWidth = col.width || col.minWidth;
        if (colWidth) {
          const parsed = parseInt(colWidth);
          leftPosition += isNaN(parsed) ? 150 : parsed;
        } else {
          leftPosition += 150;
        }
      }
    }
    
    // For sticky columns - use border-left on each sticky column (won't be hidden by previous column)
    const isLastSticky = columnIndex === stickyColumns - 1;
    return {
      position: 'sticky',
      left: `${leftPosition}px`,
      zIndex: isHeader ? 3 : 1,
      // Use border-left (visible since it's the leading edge)
      borderRight: '1px solid #e5e7eb',
      // Last sticky column gets a shadow to separate from scrollable area
      boxShadow: isLastSticky ? '3px 0 6px -3px rgba(0,0,0,0.15)' : undefined,
    };
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectAll?.(e.target.checked);
  };

  const handleSelectRow = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    onSelectRow?.(id, e.target.checked);
  };

  const handleRowClick = (row: any, e: React.MouseEvent) => {
    // Don't trigger row click if clicking on checkbox or other interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || target.closest('button')) {
      return;
    }

    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return 'caret-up';
    }
    return sortConfig.direction === 'asc' ? 'caret-up' : 'caret-down';
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center p-8 bg-white border border-gray-200 rounded-lg"
        style={{
          height: effectiveHeight === 'auto' ? '300px' : effectiveHeight,
          minHeight: '300px',
        }}
      >
        <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary-600 rounded-full" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden ${className}`}
    >
      <div
        className="overflow-x-auto overflow-y-auto data-table-container"
        style={{
          height: effectiveHeight,
          maxHeight: effectiveMaxHeight,
          minHeight: effectiveHeight === 'auto' ? 'auto' : '300px',
        }}
      >
        <table className="w-full min-w-max border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-40 border-b border-gray-200">
            <tr>
              {hasCheckbox && (
                <th
                  className="w-12 px-4 py-2 text-left bg-gray-50 sticky left-0 z-[2]"
                  style={{ boxShadow: 'inset -1px 0 0 0 #e5e7eb' }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                  />
                </th>
              )}

              {visibleColumnsArray.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 border-r ${
                    column.sortable && onSort
                      ? 'cursor-pointer hover:bg-gray-100 select-none'
                      : ''
                  }`}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth || column.width || '120px',
                    ...getStickyStyle(index, true),
                  }}
                  onClick={
                    column.sortable && onSort
                      ? () => handleSort(column.key)
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="whitespace-nowrap">
                      {column.headerRender ? column.headerRender() : column.label}
                    </span>
                    {column.sortable && (
                      <Icon
                        name={getSortIcon(column.key)}
                        size={12}
                        className={`transition-colors ${
                          sortConfig?.key === column.key
                            ? 'text-primary-600'
                            : 'text-gray-400'
                        }`}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleColumnsArray.length +
                    (onSelectAll || onSelectRow ? 1 : 0)
                  }
                  className="px-4 text-center text-gray-500 h-80"
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      No data available
                    </p>
                    <p className="text-sm text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`hover:bg-primary-50 transition-colors group`}
                  onClick={e => handleRowClick(row, e)}
                >
                  {hasCheckbox && (
                    <td
                      className="w-12 px-4 py-3 bg-white group-hover:bg-primary-50 sticky left-0 z-[1]"
                      style={{ boxShadow: 'inset -1px 0 0 0 #e5e7eb' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={e => handleSelectRow(row.id, e)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                      />
                    </td>
                  )}

                  {visibleColumnsArray.map((column, colIndex) => (
                    <td
                      key={column.key}
                      className={`px-4 py-2 text-sm text-gray-900 border-r border-gray-200 ${
                        colIndex < stickyColumns
                          ? 'bg-white group-hover:bg-primary-50'
                          : ''
                      }`}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth || column.width || '120px',
                        ...getStickyStyle(colIndex),
                      }}
                    >
                      <div
                        className={`${
                          [
                            'skill_sets',
                            'preffered_location',
                            'current_organization',
                            'payroll_organisation',
                          ].includes(column.key)
                            ? 'max-w-[200px] truncate'
                            : 'whitespace-nowrap'
                        }`}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] || '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
