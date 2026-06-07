import React, { useState, useEffect } from 'react';
import Icon from '../../../atoms/Icon';
import Button from '../../../atoms/Button';
import Modal from '../../../atoms/Modal';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../../../../services/adminService';
import { RolePermissionTemplate, PermissionActions } from '../../../../types/admin';

const MODULES = ['candidate', 'client', 'job', 'supplier', 'users'] as const;
const ACTIONS = ['Create', 'View', 'Edit', 'Delete'] as const;
const MODULE_LABELS: Record<string, string> = {
  candidate: 'Candidate',
  client: 'Client',
  job: 'Job',
  supplier: 'Supplier',
  users: 'Users',
};

const permissionToActions = (perm: PermissionActions): string[] => {
  if (!perm) return [];
  const actions: string[] = [];
  if (perm.create) actions.push('Create');
  if (perm.read) actions.push('View');
  if (perm.update) actions.push('Edit');
  if (perm.delete) actions.push('Delete');
  return actions;
};

const actionsToPermission = (actions: string[]): PermissionActions => ({
  create: actions.includes('Create'),
  read: actions.includes('View'),
  update: actions.includes('Edit'),
  delete: actions.includes('Delete'),
});

// For visual display only
const actionsToBinary = (actions: string[]): string => {
  return ['Create', 'View', 'Edit', 'Delete'].map(a => (actions.includes(a) ? '1' : '0')).join('');
};

const RolePermissions: React.FC = () => {
  const showToast = (type: 'success' | 'error', message: string) => {
    window.dispatchEvent(
      new CustomEvent('toasterEvents', {
        detail: { type, message },
      })
    );
  };

  const [roles, setRoles] = useState<RolePermissionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editPermissions, setEditPermissions] = useState<Record<string, string[]>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<Record<string, string[]>>({});
  const [addSaving, setAddSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<RolePermissionTemplate | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Pagination for role cards
  const [visibleRows, setVisibleRows] = useState(2);
  const getVisibleCount = () => {
    // Determine items per row based on standard tailwind breakpoints used in our grid
    // grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6
    if (window.innerWidth >= 1024) return 6 * visibleRows; // lg
    if (window.innerWidth >= 768) return 4 * visibleRows;  // md
    if (window.innerWidth >= 640) return 3 * visibleRows;  // sm
    return 2 * visibleRows;                               // default
  };
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  // Update visible count on resize or when visibleRows changes
  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visibleRows]);

  useEffect(() => {
    setVisibleCount(getVisibleCount());
  }, [visibleRows]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
      return data;
    } catch (error) {
      console.error('Failed to load roles:', error);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const selectRole = (role: RolePermissionTemplate) => {
    setSelectedRoleId(role.id);
    setEditName(role.name);
    const perms: Record<string, string[]> = {};
    MODULES.forEach(m => {
      perms[m] = permissionToActions(role.permissions[m]);
    });
    setEditPermissions(perms);
    setIsDirty(false);
  };

  const togglePermission = (module: string, action: string) => {
    setEditPermissions(prev => {
      const current = prev[module] || [];
      const next = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [module]: next };
    });
    setIsDirty(true);
  };

  const toggleNewRolePermission = (module: string, action: string) => {
    setNewRolePermissions(prev => {
      const current = prev[module] || [];
      const next = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [module]: next };
    });
  };

  const handleSaveRole = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    
    try {
      const permissions: Record<string, PermissionActions> = {};
      MODULES.forEach(m => {
        permissions[m] = actionsToPermission(editPermissions[m] || []);
      });

      const updatedRole = await updateRole(selectedRoleId, {
        name: editName,
        permissions: permissions as any,
      });

      // Update the role in our local list immediately for speed
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, ...updatedRole } : r));
      
      // Re-sync edit state from the confirmed server data
      if (updatedRole) {
        setEditName(updatedRole.name);
        const perms: Record<string, string[]> = {};
        MODULES.forEach(m => {
          perms[m] = permissionToActions(updatedRole.permissions[m]);
        });
        setEditPermissions(perms);
      }

      setIsDirty(false);
      showToast('success', 'Permissions updated successfully');
      
      // background refresh to ensure total consistency (optional but good)
      loadRoles(true);
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setAddSaving(true);
    
    const permissions: RolePermissionTemplate['permissions'] = {
      candidate: actionsToPermission(newRolePermissions['candidate'] || []),
      client: actionsToPermission(newRolePermissions['client'] || []),
      job: actionsToPermission(newRolePermissions['job'] || []),
      supplier: actionsToPermission(newRolePermissions['supplier'] || []),
      users: actionsToPermission(newRolePermissions['users'] || []),
    };

    try {
      const newRole = await createRole({ name: newRoleName.trim(), permissions });
      setAddModalOpen(false);
      setNewRoleName('');
      setNewRolePermissions({});
      setAddSaving(false);
      
      const updatedRoles = await loadRoles();
      const roleToSelect = updatedRoles.find(r => r.id === newRole.id || r.name === newRole.name) || newRole;
      selectRole(roleToSelect);
      showToast('success', 'Role created with permissions successfully');
    } catch (error) {
      console.error('Role creation returned an error, checking if it was still created...', error);
      
      // Backend Workaround: Refresh and check if the role was actually created
      const refreshedRoles = await loadRoles(true);
      const createdRole = refreshedRoles.find(
        r => r.name.toLowerCase() === newRoleName.trim().toLowerCase()
      );

      if (createdRole) {
        // It was created despite the 500 error!
        setAddModalOpen(false);
        setNewRoleName('');
        setNewRolePermissions({});
        setAddSaving(false);
        selectRole(createdRole);
        showToast('success', 'Role created with permissions successfully');
      } else {
        // It truly failed
        setAddSaving(false);
      }
    }
  };

  const toggleAllInModule = (module: string, setter: 'edit' | 'new') => {
    const isNew = setter === 'new';
    const currentPermissions = isNew ? newRolePermissions : editPermissions;
    const currentModuleActions = currentPermissions[module] || [];
    
    const allSelected = ACTIONS.every(a => currentModuleActions.includes(a));
    const nextActions = allSelected ? [] : [...ACTIONS];
    
    if (isNew) {
      setNewRolePermissions(prev => ({ ...prev, [module]: nextActions }));
    } else {
      setEditPermissions(prev => ({ ...prev, [module]: nextActions }));
      setIsDirty(true);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm) return;
    setDeleteError('');
    try {
      await deleteRole(deleteConfirm.id);
      setDeleteConfirm(null);
      if (selectedRoleId === deleteConfirm.id) {
        setSelectedRoleId(null);
      }
      await loadRoles();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="loading" className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading roles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role Cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Roles ({roles.length})
        </h3>
        <Button variant="primary" size="sm" onClick={() => setAddModalOpen(true)}>
          <Icon name="plus" className="h-4 w-4 mr-1" />
          Add Role
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {roles.slice(0, visibleCount).map(role => (
          <button
            key={role.id}
            onClick={() => selectRole(role)}
            className={`relative group rounded-xl border-2 p-4 text-left transition-all ${
              selectedRoleId === role.id
                ? 'border-primary-500 bg-primary-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  selectedRoleId === role.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {role.name.charAt(0).toUpperCase()}
              </div>
              {role.userCount !== undefined && role.userCount > 0 && (
                <span className="text-xs text-gray-400">{role.userCount} users</span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800 truncate">{role.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {Object.values(role.permissions).filter(p => Object.values(p).some(Boolean)).length} modules
            </p>
            {/* Delete button on hover */}
            {(role.userCount === undefined || role.userCount === 0) && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  setDeleteConfirm(role);
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 text-red-400 hover:text-red-600"
                title="Delete role"
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </button>
        ))}
      </div>

      {roles.length > visibleCount && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleRows(prev => prev + 2)}
            className="text-primary-600 border-primary-200 hover:bg-primary-50"
          >
            <Icon name="caret-down" className="h-4 w-4 mr-1" />
            Read More
          </Button>
        </div>
      )}

      {visibleRows > 2 && roles.length <= visibleCount && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleRows(2)}
            className="text-gray-500 border-gray-200 hover:bg-gray-50"
          >
            <Icon name="caret-up" className="h-4 w-4 mr-1" />
            Show Less
          </Button>
        </div>
      )}

      {/* Permission Table */}
      {selectedRole && (
        <div className="border rounded-xl bg-white overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-600">Role Name:</label>
              <input
                type="text"
                value={editName}
                onChange={e => {
                  setEditName(e.target.value);
                  setIsDirty(true);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRole}
              disabled={!isDirty || saving}
            >
              {saving ? (
                <>
                  <Icon name="loading" className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="check" className="h-4 w-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">
                    Module
                  </th>
                  {ACTIONS.map(action => (
                    <th
                      key={action}
                      className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {action}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Binary
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    All
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MODULES.map(module => {
                  const moduleActions = editPermissions[module] || [];
                  const binary = actionsToBinary(moduleActions);
                  const allSelected = ACTIONS.every(a => moduleActions.includes(a));
                  return (
                    <tr key={module} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {MODULE_LABELS[module]}
                      </td>
                      {ACTIONS.map(action => (
                        <td key={action} className="px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={moduleActions.includes(action)}
                            onChange={() => togglePermission(module, action)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-600">
                          {binary}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleAllInModule(module, 'edit')}
                          className={`p-1 rounded-md transition-colors ${
                            allSelected 
                              ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                          }`}
                          title={allSelected ? "Deselect All" : "Select All"}
                        >
                          <Icon name={allSelected ? "check" : "minus"} size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Permission Summary */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Permission Summary
            </p>
            <div className="flex flex-wrap gap-2">
              {MODULES.map(module => {
                const actions = editPermissions[module] || [];
                if (actions.length === 0) return null;
                return (
                  <span
                    key={module}
                    className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full"
                  >
                    <span className="font-medium">{MODULE_LABELS[module]}:</span>
                    {actions.join(', ')}
                  </span>
                );
              })}
              {MODULES.every(m => (editPermissions[m] || []).length === 0) && (
                <span className="text-xs text-gray-400 italic">No permissions granted</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!selectedRole && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <Icon name="lock" size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Select a role to view and edit its permissions</p>
          <p className="text-gray-400 text-sm mt-1">
            Click any role card above to get started
          </p>
        </div>
      )}

      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Create New Role"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddRole}
              disabled={!newRoleName.trim() || addSaving}
            >
              {addSaving ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Role Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              placeholder="e.g., Team Lead, Senior Recruiter"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && newRoleName.trim() && !addSaving) handleAddRole();
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Assign Permissions
              </h4>
              <span className="text-xs text-gray-400 italic">
                You can also configure these later
              </span>
            </div>

            <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                        Module
                      </th>
                      {ACTIONS.map(action => (
                        <th
                          key={action}
                          className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        >
                          {action}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Binary
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        All
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {MODULES.map(module => {
                      const moduleActions = newRolePermissions[module] || [];
                      const binary = actionsToBinary(moduleActions);
                      const allSelected = ACTIONS.every(a => moduleActions.includes(a));
                      
                      return (
                        <tr key={module} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {MODULE_LABELS[module]}
                          </td>
                          {ACTIONS.map(action => (
                            <td key={action} className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={moduleActions.includes(action)}
                                onChange={() => toggleNewRolePermission(module, action)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-600">
                              {binary}
                            </code>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleAllInModule(module, 'new')}
                              className={`p-1 rounded-md transition-colors ${
                                allSelected 
                                  ? 'text-primary-600 bg-primary-50 hover:bg-primary-100' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                              title={allSelected ? "Deselect All" : "Select All"}
                            >
                              <Icon name={allSelected ? "check" : "minus"} size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => {
          setDeleteConfirm(null);
          setDeleteError('');
        }}
        title="Delete Role"
        size="sm"
        headerVariant="danger"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteError('');
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteRole}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the role{' '}
            <span className="font-semibold">"{deleteConfirm?.name}"</span>?
          </p>
          {deleteError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default RolePermissions;
