import React, { useState, useEffect, useCallback } from 'react';
import Icon, { IconName } from '../../../atoms/Icon';
import Button from '../../../atoms/Button';
import {
  fetchRoles,
  fetchFieldVisibilityForRole,
  updateFieldVisibility,
} from '../../../../services/adminService';
import { MODULE_DEFINITIONS } from '../../../../types/fieldVisibility';
import type { FieldVisibilityConfig } from '../../../../types/fieldVisibility';
import type { RolePermissionTemplate } from '../../../../types/admin';

const FieldVisibility: React.FC = () => {
  const [roles, setRoles] = useState<RolePermissionTemplate[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [config, setConfig] = useState<FieldVisibilityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(MODULE_DEFINITIONS.map(m => m.key))
  );

  // Load roles
  useEffect(() => {
    (async () => {
      const data = await fetchRoles();
      setRoles(data);
      if (data.length > 0) setSelectedRole(data[0].name);
      setLoading(false);
    })();
  }, []);

  // Load visibility config when role changes
  useEffect(() => {
    if (!selectedRole) return;
    (async () => {
      setLoading(true);
      const data = await fetchFieldVisibilityForRole(selectedRole);
      setConfig(data);
      setDirty(false);
      setLoading(false);
    })();
  }, [selectedRole]);

  const toggleSection = useCallback(
    (moduleKey: string, sectionKey: string) => {
      if (!config) return;
      const current = config.modules[moduleKey]?.[sectionKey] ?? true;
      setConfig({
        ...config,
        modules: {
          ...config.modules,
          [moduleKey]: {
            ...(config.modules[moduleKey] || {}),
            [sectionKey]: !current,
          },
        },
      });
      setDirty(true);
    },
    [config]
  );

  const toggleModule = useCallback(
    (moduleKey: string, enable: boolean) => {
      if (!config) return;
      const moduleDef = MODULE_DEFINITIONS.find(m => m.key === moduleKey);
      if (!moduleDef) return;
      const updated: { [key: string]: boolean } = {};
      moduleDef.sections.forEach(s => {
        updated[s.key] = enable;
      });
      setConfig({
        ...config,
        modules: {
          ...config.modules,
          [moduleKey]: updated,
        },
      });
      setDirty(true);
    },
    [config]
  );

  const toggleAccordion = (moduleKey: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    await updateFieldVisibility(config.role, config.modules);
    setDirty(false);
    setSaving(false);
  };

  const getModuleStats = (moduleKey: string) => {
    if (!config) return { visible: 0, total: 0 };
    const moduleDef = MODULE_DEFINITIONS.find(m => m.key === moduleKey);
    if (!moduleDef) return { visible: 0, total: 0 };
    const total = moduleDef.sections.length;
    const visible = moduleDef.sections.filter(
      s => config.modules[moduleKey]?.[s.key] !== false
    ).length;
    return { visible, total };
  };

  const isAllModuleEnabled = (moduleKey: string) => {
    const { visible, total } = getModuleStats(moduleKey);
    return visible === total;
  };

  const moduleIcon = (key: string): IconName => {
    switch (key) {
      case 'job': return 'briefcase';
      case 'candidate': return 'users';
      case 'client': return 'buildings';
      case 'supplier': return 'briefcase';
      case 'users': return 'user';
      default: return 'grid';
    }
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="loading" className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Configure for role:</label>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {roles.map(role => (
              <option key={role.name} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? (
              <>
                <Icon name="loading" className="h-4 w-4 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Icon name="info" size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-700">
          Control which sections are visible for users with the <strong>{selectedRole}</strong> role.
          Hidden sections will not appear in the UI for those users.
        </p>
      </div>

      {/* Loading overlay per role switch */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Icon name="loading" className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-500">Loading visibility settings...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {MODULE_DEFINITIONS.map(moduleDef => {
            const expanded = expandedModules.has(moduleDef.key);
            const stats = getModuleStats(moduleDef.key);
            const allEnabled = isAllModuleEnabled(moduleDef.key);

            return (
              <div key={moduleDef.key} className="border rounded-xl bg-white overflow-hidden">
                {/* Module Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleAccordion(moduleDef.key)}
                >
                  <Icon
                    name={expanded ? 'caret-down' : 'caret-right'}
                    size={14}
                    className="text-gray-400"
                  />
                  <Icon
                    name={moduleIcon(moduleDef.key)}
                    size={18}
                    className="text-gray-600"
                  />
                  <span className="text-sm font-semibold text-gray-900 flex-1">
                    {moduleDef.label}
                  </span>

                  {/* Module stats badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      stats.visible === stats.total
                        ? 'bg-green-100 text-green-700'
                        : stats.visible === 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {stats.visible}/{stats.total} visible
                  </span>

                  {/* Toggle all for module */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleModule(moduleDef.key, !allEnabled);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      allEnabled ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                    title={allEnabled ? 'Hide all sections' : 'Show all sections'}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        allEnabled ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sections */}
                {expanded && (
                  <div className="border-t divide-y">
                    {moduleDef.sections.map(section => {
                      const isVisible = config?.modules[moduleDef.key]?.[section.key] !== false;

                      return (
                        <div
                          key={section.key}
                          className="flex items-center gap-4 px-4 py-3 pl-12 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{section.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                          </div>

                          <span
                            className={`text-xs font-medium ${
                              isVisible ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {isVisible ? 'Visible' : 'Hidden'}
                          </span>

                          <button
                            onClick={() => toggleSection(moduleDef.key, section.key)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              isVisible ? 'bg-primary-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                isVisible ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FieldVisibility;
