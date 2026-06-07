import React, { useState } from 'react';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    minWidth?: string;
    render?: (value: any, row: any) => React.ReactNode;
    headerRender?: () => React.ReactNode;
}

export interface ExpandedRowData {
    content: React.ReactNode;
}

export interface ExpandableDataTableProps {
    /** Array of columns */
    columns: TableColumn[];
    /** Array of data rows */
    data: any[];
    /** Visible columns configuration */
    visibleColumns: { [key: string]: boolean; };
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
    /** Expandable rows configuration */
    expandable?: {
        /** Function to determine if row can be expanded */
        canExpand?: (row: any) => boolean;
        /** Function to render expanded content */
        renderExpanded: (row: any) => React.ReactNode;
        /** Expanded rows state */
        expandedRows?: Set<string>;
        /** Toggle expansion handler */
        onToggleExpand?: (rowId: string) => void;
    };
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
    /** Whether to show the default expand column */
    showExpandColumn?: boolean;
    /** Number of columns to freeze from the left (after checkbox/expander columns) */
    stickyColumns?: number;
}

const ExpandableDataTable: React.FC<ExpandableDataTableProps> = ({
    columns,
    data,
    visibleColumns,
    sortConfig,
    onSort,
    selectedRows = [],
    onSelectAll,
    onSelectRow,
    onRowClick,
    expandable,
    loading = false,
    emptyMessage = 'No data available',
    className = '',
    height,
    maxHeight = '500px',
    showExpandColumn = true,
    stickyColumns = 0,
}) => {
    const [internalExpandedRows, setInternalExpandedRows] = useState<Set<string>>(new Set());


    // Use internal state if expandedRows and onToggleExpand are not provided
    const expandedRows = expandable?.expandedRows || internalExpandedRows;
    const toggleExpand = expandable?.onToggleExpand || ((rowId: string) => {
        const newExpanded = new Set(internalExpandedRows);
        if (newExpanded.has(rowId)) {
            newExpanded.delete(rowId);
        } else {
            newExpanded.add(rowId);
        }
        setInternalExpandedRows(newExpanded);
    });

    const visibleColumnsArray = columns.filter(col => visibleColumns[col.key]);
    const allSelected = data.length > 0 && selectedRows.length === data.length;
    const hasExpandableContent = !!(expandable && expandable.renderExpanded);
    const renderExpandColumn = !!(hasExpandableContent && showExpandColumn);
    const totalColumns = visibleColumnsArray.length +
        (onSelectAll || onSelectRow ? 1 : 0) +
        (renderExpandColumn ? 1 : 0);

    // Calculate sticky column positions
    const getStickyStyle = (columnIndex: number, isHeader: boolean = false): React.CSSProperties => {
        if (columnIndex >= stickyColumns) return {};

        let leftPosition = 0;
        const hasCheckbox = !!(onSelectAll || onSelectRow);
        
        // Add width of checkbox column if present
        if (hasCheckbox) leftPosition += 48;
        
        // Add width of expand column if present
        if (renderExpandColumn) leftPosition += 48;

        // Add widths of previous sticky data columns
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

        const isLastSticky = columnIndex === stickyColumns - 1;

        return {
            position: 'sticky',
            left: `${leftPosition}px`,
            zIndex: isHeader ? 45 : 10,
            borderRight: '1px solid #e5e7eb',
            boxShadow: isLastSticky ? '3px 0 6px -3px rgba(0,0,0,0.15)' : undefined,
        };
    };


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectAll?.(e.target.checked);
    };

    const handleSelectRow = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        onSelectRow?.(id, e.target.checked);
    };

    const handleRowClick = (row: any, e: React.MouseEvent) => {
        // Don't trigger row click if clicking on expand button or checkbox
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input[type="checkbox"]')) {
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
                style={{ height: height || maxHeight }}
            >
                <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-primary-600 rounded-full" />
                <span className="ml-3 text-gray-600">Loading...</span>
            </div>
        );
    }

    return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div
                className="overflow-x-auto overflow-y-auto data-table-container"
                style={{
                    height: height || maxHeight || '100%',
                    maxHeight: maxHeight || 'none'
                }}
            >
                <table className="w-full min-w-max border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-40 border-b border-gray-200">
                        <tr>
                            {/* Selection column */}
                            {(onSelectAll || onSelectRow) && (
                                <th className="w-12 px-4 py-3 text-left bg-gray-50 sticky left-0 z-40 border-r border-gray-100 shadow-sm">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                                    />
                                </th>
                            )}

                            {/* Expand column */}
                            {renderExpandColumn && (
                                <th 
                                    className="w-12 px-4 py-3 text-left bg-gray-50 border-b border-gray-200 sticky z-40 border-r border-gray-100 shadow-sm"
                                    style={{ 
                                        left: (onSelectAll || onSelectRow) ? '48px' : '0px'
                                    }}
                                >
                                    {/* Empty header for expand column */}
                                </th>
                            )}


                            {/* Data columns */}
                            {visibleColumnsArray.map((column, index) => (
                                <th
                                    key={column.key}
                                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 ${column.sortable && onSort ? 'cursor-pointer hover:bg-gray-100 select-none' : ''
                                        }`}
                                    style={{
                                        width: column.width,
                                        minWidth: column.minWidth || column.width || '120px',
                                        ...getStickyStyle(index, true)
                                    }}
                                    onClick={column.sortable && onSort ? () => handleSort(column.key) : undefined}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="whitespace-nowrap">
                                            {column.headerRender ? column.headerRender() : column.label}
                                        </span>
                                        {column.sortable && (
                                            <Icon
                                                name={getSortIcon(column.key)}
                                                size={12}
                                                className={`transition-colors ${sortConfig?.key === column.key
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
                                    colSpan={totalColumns}
                                    className="px-4 py-8 text-center text-gray-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <React.Fragment key={row.id || rowIndex}>
                                    {/* Main row */}
                                    <tr
                                        className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''
                                            }`}
                                        onClick={(e) => handleRowClick(row, e)}
                                    >
                                        {/* Selection column */}
                                        {(onSelectAll || onSelectRow) && (
                                            <td className="w-12 px-4 py-3 bg-white sticky left-0 z-10 border-r border-gray-100 shadow-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(row.id)}
                                                    onChange={(e) => handleSelectRow(row.id, e)}
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                                                />
                                            </td>
                                        )}

                                        {/* Expand column */}
                                        {renderExpandColumn && (
                                            <td 
                                                className="w-12 px-4 py-3 bg-white sticky z-10 border-r border-gray-100 shadow-sm"
                                                style={{ 
                                                    left: (onSelectAll || onSelectRow) ? '48px' : '0px'
                                                }}
                                            >
                                                {(!expandable.canExpand || expandable.canExpand(row)) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleExpand(String(row.id));
                                                        }}
                                                        className={`h-8 w-8 p-0 ${expandedRows.has(String(row.id))
                                                                ? "bg-blue-50 text-blue-600"
                                                                : ""
                                                            }`}
                                                    >
                                                        <Icon
                                                            name={expandedRows.has(String(row.id)) ? 'caret-down' : 'caret-right'}
                                                            size={16}
                                                        />
                                                    </Button>
                                                )}
                                            </td>
                                        )}


                                        {/* Data columns */}
                                        {visibleColumnsArray.map((column, colIndex) => (
                                            <td
                                                key={column.key}
                                                className={`px-4 py-2 text-sm text-gray-900 ${colIndex < stickyColumns ? 'bg-white group-hover:bg-primary-50 transition-colors' : ''}`}
                                                style={{
                                                    width: column.width,
                                                    minWidth: column.minWidth || column.width || '120px',
                                                    ...getStickyStyle(colIndex)
                                                }}
                                            >
                                                <div className={`${['skill_sets', 'preffered_location', 'current_organization', 'payroll_organisation'].includes(column.key)
                                                        ? 'max-w-[200px] truncate'
                                                        : 'whitespace-nowrap'
                                                    }`}>
                                                    {column.render
                                                        ? column.render(row[column.key], row)
                                                        : (row[column.key] || '-')
                                                    }
                                                </div>
                                            </td>
                                        ))}

                                    </tr>

                                    {/* Expanded row */}
                                    {hasExpandableContent && expandedRows.has(String(row.id)) && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={totalColumns} className="p-0 border-b border-gray-100" style={{ maxWidth: '100vw' }}>
                                                {/* 
                                                  Use sticky left positioning so the expanded content 
                                                  always anchors to the left of the viewport. 
                                                  Then allow its inner div to overflow.
                                                */}
                                                <div className="sticky left-0 w-full max-w-[100vw] overflow-hidden">
                                                    <div className="pl-16 pr-4 py-3 border-l-4 border-blue-200 ml-8 bg-gray-50 flex-1">
                                                        {expandable.renderExpanded(row)}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpandableDataTable;
