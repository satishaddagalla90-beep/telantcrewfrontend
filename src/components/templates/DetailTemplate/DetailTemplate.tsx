import React, { ReactNode, useMemo } from 'react';
import Text from '../../atoms/Text';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Tabs from '../../atoms/Tabs';

export interface DetailTemplateProps {
  /** Legacy props for backward compatibility */
  breadcrumb?: React.ReactNode;
  header?: React.ReactNode;
  mainContent?: React.ReactNode;
  sidebar?: React.ReactNode;

  /** Enhanced props */
  breadcrumbItems?: Array<{ label: string; href?: string }>;

  /** Summary section */
  profileSummary?: ReactNode;

  /** Tabs */
  tabs?: Array<{
    id: string;
    label: string;
    content: ReactNode;
    badge?: number;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  /** Additional sections */
  bottomContent?: ReactNode;

  /** States */
  isLoading?: boolean;
  loadingSkeleton?: ReactNode;
  error?: string;
  className?: string;
}

const DetailTemplate: React.FC<DetailTemplateProps> = ({
  breadcrumb,
  header,
  profileSummary,
  sidebar,
  tabs = [],
  activeTab,
  onTabChange,
  bottomContent,
  isLoading = false,
  loadingSkeleton,
  error,
  className = '',
}) => {
  const activeTabId = activeTab ?? tabs[0]?.id;
  const activeTabContent = useMemo(
    () => tabs.find(tab => tab.id === activeTabId)?.content,
    [tabs, activeTabId]
  );
  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {loadingSkeleton ? (
            loadingSkeleton
          ) : (
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <Icon name="info" size={24} className="mx-auto mb-4 text-red-500" />
            <Text size="lg" className="text-red-700 mb-4">
              {error}
            </Text>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasSidebar = !!sidebar;

  return (
    <div className={`h-full bg-gray-50 overflow-y-auto ${className}`}>
      <div>
        {/* Breadcrumb Navigation */}
        {breadcrumb && (
          <div className="bg-white border-b border-gray-200">{breadcrumb}</div>
        )}

        {/* Main Content Area */}
        <div
          className={`container mx-auto p-6 max-w-screen-2xl grid grid-cols-1${hasSidebar ? ' lg:grid-cols-3' : ''} gap-6`}
        >
          {/* Main Content */}
          <div
            className={`${hasSidebar ? 'lg:col-span-2' : 'col-span-1'} space-y-6`}
          >
            {/* Profile Header Section */}
            {header}
            {profileSummary && profileSummary}
            {/* Tabs Content */}
            {tabs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <Tabs
                  tabs={tabs}
                  activeTab={activeTabId}
                  onTabChange={onTabChange || (() => {})}
                  className="border-b"
                />
                <div className="p-6">
                  {activeTabContent}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          {hasSidebar && (
            <div className="lg:col-span-1">
              <div className="sticky top-6">{sidebar}</div>
            </div>
          )}
        </div>

        {/* Bottom Content */}
        {bottomContent && <div className="space-y-6">{bottomContent}</div>}
      </div>
    </div>
  );
};

export default DetailTemplate;
