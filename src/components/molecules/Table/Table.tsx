import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { showErrorToast } from '../../../utils/toast';
import { formatUIDate } from '../../../utils/dateFormat';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import Modal from '../../atoms/Modal';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  sticky?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface TableProps {
  columns: TableColumn[];
  data: TableRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: TableRow) => void;
  onRowSelect?: (selectedIds: string[]) => void;
  expandable?: boolean;
  renderExpandedRow?: (row: TableRow) => React.ReactNode;
  className?: string;
  /** Number of columns to freeze from the left (after checkbox/expand columns) */
  stickyColumns?: number;
}

// Notes:
// Candidates, Funnel, Recommended
const Table: React.FC<TableProps> = ({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  onRowSelect,
  expandable = false,
  renderExpandedRow,
  className = '',
  stickyColumns = 0,
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // const navigate = useNavigate();

  // Handle row selection
  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
    onRowSelect?.(Array.from(newSelected));
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.map(row => row.id));
      setSelectedRows(allIds);
      onRowSelect?.(Array.from(allIds));
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  // Handle row expansion
  const handleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Handle sorting
  const handleSort = (key: string) => {
    const direction =
      sortConfig?.key === key && sortConfig.direction === 'asc'
        ? 'desc'
        : 'asc';
    setSortConfig({ key, direction });
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Helper function to safely render values
  const safeValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value instanceof Date) return formatUIDate(value);
    return String(value);
  };

  // Handle navigation
  // const handleNavigate = (id: string, path?: string) => {
  //     if (path) {
  //         navigate(path);
  //     } else if (id && id !== 'N/A') {
  //         navigate(`/detailview/${id}`);
  //     }
  // };

  // // Handle image preview
  // const handleImagePreview = (imageUrl: string) => {
  //     setImagePreview(imageUrl);
  // };

  const isAllSelected = data.length > 0 && selectedRows.size === data.length;
  const isIndeterminate =
    selectedRows.size > 0 && selectedRows.size < data.length;

  // Calculate sticky column positions
  const getStickyStyle = (columnIndex: number, isHeader: boolean = false): React.CSSProperties => {
    if (stickyColumns === 0 || columnIndex >= stickyColumns) return {};

    // Calculate left position based on previous sticky columns
    let leftPosition = 0;

    // Account for checkbox column if present
    if (onRowSelect) {
      leftPosition += 52; // checkbox column width (px-4 = 16px * 2 + checkbox ~20px)
    }

    // Account for expand column if present
    if (expandable) {
      leftPosition += 48; // expand column width
    }

    // Add width of previous sticky columns (estimate ~150px per column, or use actual width)
    for (let i = 0; i < columnIndex; i++) {
      const colWidth = columns[i]?.width;
      if (colWidth) {
        // Parse width if it's a pixel value
        const parsed = parseInt(colWidth);
        leftPosition += isNaN(parsed) ? 150 : parsed;
      } else {
        leftPosition += 150; // default column width estimate
      }
    }

    return {
      position: 'sticky',
      left: `${leftPosition}px`,
      zIndex: isHeader ? 30 : 20,
      backgroundColor: isHeader ? '#f9fafb' : '#ffffff',
    };
  };

  // Get sticky class for cells
  const getStickyClass = (columnIndex: number): string => {
    if (stickyColumns === 0 || columnIndex >= stickyColumns) return '';
    return 'sticky-column';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {/* Selection checkbox */}
            {onRowSelect && (
              <th
                className="px-4 py-3 text-left bg-gray-50"
                style={stickyColumns > 0 ? { position: 'sticky', left: 0, zIndex: 30, backgroundColor: '#f9fafb' } : undefined}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
            )}

            {/* Expand/collapse column */}
            {expandable && (
              <th
                className="px-4 py-3 text-left w-12 bg-gray-50"
                style={stickyColumns > 0 ? { position: 'sticky', left: onRowSelect ? 52 : 0, zIndex: 30, backgroundColor: '#f9fafb' } : undefined}
              ></th>
            )}

            {/* Data columns */}
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                } ${getStickyClass(index)}`}
                style={{
                  ...(column.width ? { width: column.width } : {}),
                  ...getStickyStyle(index, true),
                }}
                onClick={
                  column.sortable ? () => handleSort(column.key) : undefined
                }
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && (
                    <Icon
                      name={
                        sortConfig?.key === column.key
                          ? sortConfig.direction === 'asc'
                            ? 'caret-up'
                            : 'caret-down'
                          : 'caret-up'
                      }
                      size={12}
                      className="text-gray-400"
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={
                  columns.length + (onRowSelect ? 1 : 0) + (expandable ? 1 : 0)
                }
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map(row => (
              <React.Fragment key={row.id}>
                <tr className="hover:bg-gray-50 group">
                  {/* Selection checkbox */}
                  {onRowSelect && (
                    <td
                      className="px-4 py-3 bg-white group-hover:bg-gray-50"
                      style={stickyColumns > 0 ? { position: 'sticky', left: 0, zIndex: 20, backgroundColor: '#ffffff' } : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={e =>
                          handleRowSelect(row.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                  )}

                  {/* Expand/collapse button */}
                  {expandable && (
                    <td
                      className="px-4 py-3 bg-white group-hover:bg-gray-50"
                      style={stickyColumns > 0 ? { position: 'sticky', left: onRowSelect ? 52 : 0, zIndex: 20, backgroundColor: '#ffffff' } : undefined}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRowExpansion(row.id)}
                        className="w-6 h-6 p-0 border-gray-300"
                      >
                        <Icon
                          name={expandedRows.has(row.id) ? 'minus' : 'plus'}
                          size={12}
                        />
                      </Button>
                    </td>
                  )}

                  {/* Data columns */}
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={`px-4 py-2 text-sm text-gray-900 ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${index < stickyColumns ? 'bg-white group-hover:bg-gray-50' : ''}`}
                      style={getStickyStyle(index)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : safeValue(row[column.key])}
                    </td>
                  ))}
                </tr>

                {/* Expanded row content */}
                {expandable &&
                  expandedRows.has(row.id) &&
                  renderExpandedRow && (
                    <tr>
                      <td
                        colSpan={
                          columns.length +
                          (onRowSelect ? 1 : 0) +
                          (expandable ? 1 : 0)
                        }
                        className="px-4 py-3 bg-gray-50"
                      >
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {/* Image Preview Modal */}
      {imagePreview && (
        <Modal
          isOpen={!!imagePreview}
          onClose={() => setImagePreview(null)}
          title="Image Preview"
          size="lg"
        >
          <div className="flex justify-center">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-96 object-contain"
              onError={() => {
                showErrorToast('Failed to load image.');
                setImagePreview(null);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Table;
