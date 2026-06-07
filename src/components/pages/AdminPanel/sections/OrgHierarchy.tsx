import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../atoms/Icon';
import { fetchOrgUsers } from '../../../../services/adminService';
import { OrgUser, OrgTreeNode } from '../../../../types/admin';



const UserCard: React.FC<{ user: OrgUser; depth: number }> = ({ user, depth }) => {
  const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels
  const [secureAvatarUrl, setSecureAvatarUrl] = useState<string | null>(null);
  const children = (user.children as OrgUser[]) || [];
  const hasChildren = children.length > 0;

  const displayName = user.name || user.display_name || 'Unknown';
  const initials = user.initials || `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || '??';

  const roleVal = user.role || (user.roles && user.roles[0]) || '';
  const roleStr = Array.isArray(roleVal) ? roleVal[0] : roleVal;
  
  const roleColor =
    roleStr?.includes('Super Admin') || roleStr?.includes('Administrator')
      ? 'bg-purple-100 text-purple-700'
      : roleStr?.includes('Manager')
      ? 'bg-blue-100 text-blue-700'
      : roleStr?.includes('HR')
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-600';

  const deptVal = user.department || (user.departments && user.departments[0]) || '';
  const deptStr = Array.isArray(deptVal) ? deptVal[0] : deptVal;

  const userId = user.id || user._id;

  useEffect(() => {
    const fetchSecureUrl = async () => {
      const originalUrl = user.avatar?.file_url || user.user_picture_url;
      if (originalUrl && originalUrl.startsWith('http')) {
        try {
          const { default: FileUploadService } = await import('../../../../services/fileUploadService');
          const secureUrl = await FileUploadService.getFileViewUrl(originalUrl);
          setSecureAvatarUrl(secureUrl);
        } catch (error) {
          console.error('Failed to fetch secure avatar URL:', error);
          setSecureAvatarUrl(originalUrl); // Fallback to original
        }
      } else {
        setSecureAvatarUrl(originalUrl || null);
      }
    };

    fetchSecureUrl();
  }, [user.avatar?.file_url, user.user_picture_url]);

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors hover:bg-gray-50"
        style={{ marginLeft: depth * 24 }}
      >
        {/* Expand / Collapse */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
            hasChildren ? 'hover:bg-gray-200 cursor-pointer text-gray-500' : 'text-transparent'
          }`}
        >
          {hasChildren && (
            <Icon name={expanded ? 'caret-down' : 'caret-right'} size={14} />
          )}
        </button>

        {/* Tree connector line */}
        {depth > 0 && (
          <div className="w-4 h-px bg-gray-300 flex-shrink-0" />
        )}

        {/* Avatar */}
        {secureAvatarUrl ? (
          <img
            src={secureAvatarUrl}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {displayName}
            </p>
            {user.status?.toLowerCase() === 'inactive' && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                Inactive
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{user.designation || 'No designation'}</p>
        </div>

        {/* Role badge */}
        {roleStr && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>
            {roleStr}
          </span>
        )}

        {/* Department */}
        {deptStr && (
          <span className="text-xs text-gray-400 hidden lg:inline">
            {deptStr}
          </span>
        )}

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
            {children.length} report{children.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="relative">
          {/* Vertical connector line */}
          <div
            className="absolute top-0 bottom-4 border-l-2 border-gray-200"
            style={{ left: depth * 24 + 22 }}
          />
          {children.map(child => (
            <UserCard key={child.id || child._id} user={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const OrgHierarchy: React.FC = () => {
  const [treeData, setTreeData] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const filters = {
        search: search.trim() || undefined,
        include_inactive: includeInactive
      };
      
      const data = await fetchOrgUsers(filters);
      // The API returns the tree in the 'data' field, which fetchOrgUsers already extracts
      setTreeData(data || []);
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHierarchy();
    }, 500); // Debounce search

    return () => clearTimeout(timer);
  }, [search, includeInactive]);

  // Frontend filtering for immediate feedback (optional when server-side is active)
  const filteredTree = useMemo(() => {
    if (!search.trim()) return treeData;
    const q = search.toLowerCase();

    function filterNode(node: OrgUser): OrgUser | null {
      const roleVal = node.role || '';
      const roleStr = Array.isArray(roleVal) ? roleVal.join(', ') : roleVal;
      
      const matches =
        (node.name || '').toLowerCase().includes(q) ||
        (node.display_name || '').toLowerCase().includes(q) ||
        (node.designation || '').toLowerCase().includes(q) ||
        (node.email || '').toLowerCase().includes(q) ||
        roleStr.toLowerCase().includes(q);

      const children = node.children || [];
      const filteredChildren = children
        .map(child => filterNode(child))
        .filter(Boolean) as OrgUser[];

      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }

    return treeData.map(root => filterNode(root)).filter(Boolean) as OrgUser[];
  }, [treeData, search]);

  if (loading && treeData.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="loading" className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading organization hierarchy...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, designation, role, or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
               <Icon name="loading" className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={includeInactive}
                onChange={e => setIncludeInactive(e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
            <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              Include Inactive
            </span>
          </label>

          <div className="flex items-center gap-2 text-sm text-gray-500 border-l pl-4">
            <Icon name="users" size={16} />
            <span>Hierarchy Data</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-100 border border-purple-300" />
          Admin / Super Admin
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
          Manager
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-100 border border-green-300" />
          HR
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" />
          Others
        </span>
      </div>

      {/* Tree */}
      <div className="border rounded-xl bg-white p-4 min-h-[400px]">
        {filteredTree.length === 0 ? (
          <div className="py-12 text-center">
            <Icon name="users" size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">
              {search ? 'No users match your search' : 'No hierarchy data available'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTree.map(root => (
              <UserCard key={root.id} user={root} depth={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgHierarchy;
