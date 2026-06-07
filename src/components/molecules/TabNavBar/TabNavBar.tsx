import React from 'react';
import Tabs, { TabItem } from '../../atoms/Tabs';
import Button from '../../atoms/Button';
import Text from '../../atoms/Text';
import Pagination from '../../molecules/Pagination/Pagination';
import { IconName } from '../../atoms/Icon/Icon';

export interface TabNavBarProps {
  /** Active tab ID */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tabId: string) => void;
  /** Whether there are selected items */
  hasSelectedItems?: boolean;
  /** Delete selected handler (alias for onAction) */
  onDeleteSelected?: () => void;
  /** Action handler */
  onAction?: () => void;
  /** Label for the action button */
  actionLabel?: string;
  /** Icon for the action button */
  actionIcon?: IconName;
  /** Variant for the action button */
  actionVariant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'warning' | 'danger' | 'success';
  /** Whether user can delete/perform action */
  canDelete?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Custom tab items */
  customTabs?: TabItem[];
  /** Tab counts for different statuses */
  tabCounts?: {
    all: number;
    active: number;
    inactive: number;
    newlead?: number;
  };
  /** Optional table pagination shown on the right */
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageInfoFormat?: (current: number, total: number) => string;
    itemsPerPage?: number;
    onItemsPerPageChange?: (value: number) => void;
  };
}

const TabNavBar: React.FC<TabNavBarProps> = ({
  activeTab,
  onTabChange,
  hasSelectedItems = false,
  onDeleteSelected,
  onAction,
  actionLabel = 'Delete Selected',
  actionIcon = 'trash',
  actionVariant = 'danger',
  canDelete = false,
  className = '',
  customTabs,
  tabCounts,
  pagination,
}) => {
  // Default tabs if no custom tabs provided
  const defaultTabs: TabItem[] = [
    {
      id: 'all',
      label: 'All Clients',
      count: tabCounts?.all,
    },
    {
      id: 'active',
      label: 'Active Clients',
      count: tabCounts?.active,
    },
    {
      id: 'inactive',
      label: 'Inactive Clients',
      count: tabCounts?.inactive,
    },
    {
      id: 'newlead',
      label: 'New Lead',
    },
  ];

  const tabs = customTabs || defaultTabs;

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-1">
        <div className="flex items-center justify-between">
          {/* Tabs Section */}
          <div className="flex-1">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              size="md"
            />
          </div>

          {/* Right Section: Delete + Pagination */}
          <div className="ml-6 flex items-center gap-3">
            {hasSelectedItems && canDelete && (
              <>
                <Text size="sm" className="text-gray-600">
                  Selected items
                </Text>
                <Button
                  variant={actionVariant}
                  size="sm"
                  icon={actionIcon}
                  onClick={onAction || onDeleteSelected}
                  className="whitespace-nowrap"
                >
                  {actionLabel}
                </Button>
              </>
            )}
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.onPageChange}
                itemsPerPage={pagination.itemsPerPage}
                onItemsPerPageChange={pagination.onItemsPerPageChange}
                showItemsPerPage={Boolean(pagination.itemsPerPage && pagination.onItemsPerPageChange)}
                size="sm"
                showPageInfo
                pageInfoFormat={
                  pagination.pageInfoFormat || ((current, total) => `${current} of ${total}`)
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabNavBar;
