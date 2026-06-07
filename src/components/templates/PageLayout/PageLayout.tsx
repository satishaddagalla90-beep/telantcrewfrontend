import React from 'react';

export interface PageLayoutProps {
    /** Page title/header content */
    header: React.ReactNode;
    /** Filter bar content */
    filterBar?: React.ReactNode;
    /** Advanced filters panel */
    filtersPanel?: React.ReactNode;
    /** Tab navigation */
    tabNav?: React.ReactNode;
    /** Main content area */
    children: React.ReactNode;
    /** Footer content */
    footer?: React.ReactNode;
    /** Additional CSS classes */
    className?: string;
    /** Content area height */
    contentHeight?: string;
    /** Show a loading progress bar at the top (e.g. during page transitions) */
    isLoading?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
    header,
    filterBar,
    filtersPanel,
    tabNav,
    children,
    footer,
    className = '',
    contentHeight,
    isLoading = false,
}) => {
    return (
        <div className={`h-full bg-gray-50 flex flex-col overflow-hidden ${className}`}>
            {/* Top progress bar for page transitions */}
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200 overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-r"
                        style={{
                            animation: 'pageLoadingBar 1.5s ease-in-out infinite',
                        }}
                    />
                    <style>{`
                        @keyframes pageLoadingBar {
                            0% { width: 0%; margin-left: 0%; }
                            50% { width: 40%; margin-left: 30%; }
                            100% { width: 0%; margin-left: 100%; }
                        }
                    `}</style>
                </div>
            )}

            {/* Fixed Header - Outside scroll container */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 z-40">
                {header}
            </div>

            {/* Fixed Filter Bar */}
            {filterBar && (
                <div className="flex-shrink-0 bg-white border-b border-gray-200 z-40">
                    {filterBar}
                </div>
            )}

            {/* Collapsible Filters Panel */}
            {filtersPanel && (
                <div className="flex-shrink-0 bg-gray-50 overflow-y-auto" style={{ maxHeight: '62vh' }}>
                    {filtersPanel}
                </div>
            )}

            {/* Fixed Tab Navigation */}
            {tabNav && (
                <div className="flex-shrink-0 bg-white border-b border-gray-200 z-30">
                    {tabNav}
                </div>
            )}

            {/* Scrollable Content Area - Internal Scroll Only */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="w-full h-full overflow-y-auto overflow-x-hidden" style={{
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    {children}
                </div>
            </div>

            {/* Footer */}
            {footer && (
                <div className="flex-shrink-0 bg-white border-t border-gray-200 z-20">
                    {footer}
                </div>
            )}
        </div>
    );
};

export default PageLayout;