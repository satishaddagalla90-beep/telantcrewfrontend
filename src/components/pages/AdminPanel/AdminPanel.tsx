import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Tabs from '../../atoms/Tabs';
import Icon from '../../atoms/Icon';
import { usePermissions } from '../../../hooks/usePermissions';
import DropdownManagement from './sections/DropdownManagement';
import RolePermissions from './sections/RolePermissions';
import OrgHierarchy from './sections/OrgHierarchy';
import FieldVisibility from './sections/FieldVisibility';
import StatsDashboard from './sections/StatsDashboard';

const TABS = [
  { id: 'dropdowns', label: 'Dropdown Management' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'hierarchy', label: 'Organization Hierarchy' },
  { id: 'visibility', label: 'Field Visibility' },
  { id: 'stats', label: 'Statistics' },
];

const AdminPanel: React.FC = () => {
  const { isSuperAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('dropdowns');

  // Guard: Only Super Admins can access admin panel
  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'dropdowns':
        return <DropdownManagement />;
      case 'roles':
        return <RolePermissions />;
      case 'hierarchy':
        return <OrgHierarchy />;
      case 'visibility':
        return <FieldVisibility />;
      case 'stats':
        return <StatsDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Icon name="sliders" size={20} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500">
                Manage system configuration, roles, and permissions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            variant="underline"
            size="md"
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
