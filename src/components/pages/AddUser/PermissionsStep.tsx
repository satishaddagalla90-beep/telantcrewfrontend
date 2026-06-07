import React, { useEffect, useState } from 'react';
import Checkbox from '../../atoms/Checkbox/Checkbox';
import Text from '../../atoms/Text/Text';
import Badge from '../../atoms/Badge/Badge';
import { UserFormData } from '../../../types/user';
import { useRolesWithPermissions } from '../../../hooks/useDropdowns';

interface PermissionsStepProps {
    formData: UserFormData;
    onChange: (field: string, value: any) => void;
    errors?: Record<string, string>;
    touched?: Record<string, boolean>;
}

const PermissionsStep: React.FC<PermissionsStepProps> = ({
    formData,
    onChange,
    errors = {},
    touched = {},
}) => {
    // Fetch roles with permissions from API
    const { roles, loading: rolesLoading, error: rolesError, refresh: refreshRoles } = useRolesWithPermissions();
    
    useEffect(() => {
        const handleRoleAdded = () => {
            refreshRoles();
        };

        // Listen for the custom event
        window.addEventListener('roleAdded', handleRoleAdded);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('roleAdded', handleRoleAdded);
        };
    }, [refreshRoles]);

    // Refresh roles data when component mounts to ensure we have the latest data
    useEffect(() => {
        // Give a small delay to ensure the component is fully mounted
        const timer = setTimeout(() => {
            refreshRoles();
        }, 100);
        
        return () => clearTimeout(timer);
    }, []);

    const modules = ["candidate", "job", "client", "supplier", "users"];
    const actions = ["Create", "View", "Edit", "Delete"];
    
    // Module display names mapping
    const moduleDisplayNames: { [key: string]: string } = {
        "candidate": "Candidate",
        "job": "Job",
        "client": "Client",
        "supplier": "Supplier",
        "users": "Users"
    };

    // Convert binary string to permission array
    const binaryToPermissions = (binaryString: string): string[] => {
        const permissions: string[] = [];
        if (binaryString.length >= 4) {
            if (binaryString[0] === '1') permissions.push('Create');
            if (binaryString[1] === '1') permissions.push('View');
            if (binaryString[2] === '1') permissions.push('Edit');
            if (binaryString[3] === '1') permissions.push('Delete');
        }
        return permissions;
    };

    // Convert permission array to binary string
    const permissionsToBinary = (permissions: string[]): string => {
        const create = permissions.includes('Create') ? '1' : '0';
        const view = permissions.includes('View') ? '1' : '0';
        const edit = permissions.includes('Edit') ? '1' : '0';
        const del = permissions.includes('Delete') ? '1' : '0';
        return create + view + edit + del;
    };

    // Get role permissions from API data for multiple roles
    const getMergedRolePermissions = (roleNames: string[]): { [module: string]: string[] } => {
        if (!roleNames || roleNames.length === 0) return {};
        
        const mergedPermissions: { [module: string]: Set<string> } = {};
        
        // Initialize all modules with empty sets
        modules.forEach(module => {
            mergedPermissions[moduleDisplayNames[module]] = new Set<string>();
        });
        
        // Merge permissions from all selected roles
        roleNames.forEach(roleName => {
            const role = roles.find(r => r.name === roleName);
            if (role) {
                modules.forEach(module => {
                    const binaryString = role.permissions[module as keyof typeof role.permissions] || "0000";
                    const rolePermissions = binaryToPermissions(binaryString);
                    
                    // Add each permission to the set (Set automatically handles duplicates)
                    rolePermissions.forEach(permission => {
                        mergedPermissions[moduleDisplayNames[module]].add(permission);
                    });
                });
            }
        });
        
        // Convert sets back to arrays
        const result: { [module: string]: string[] } = {};
        Object.entries(mergedPermissions).forEach(([module, permissionSet]) => {
            result[module] = Array.from(permissionSet);
        });
        
        return result;
    };

    // Get selected role labels from formData.role array
    const getSelectedRoles = (): string[] => {
        if (!formData.role) return [];
        return Array.isArray(formData.role) ? formData.role : [formData.role];
    };

    const selectedRoles = getSelectedRoles();
    const selectedRoleDisplay = selectedRoles.length > 0 ? selectedRoles.join(', ') : '';

    // Update permissions when roles change
    useEffect(() => {
        if (selectedRoles.length > 0 && roles.length > 0) {
            const mergedPermissions = getMergedRolePermissions(selectedRoles);
            onChange('permissions', mergedPermissions);
        }
    }, [JSON.stringify(selectedRoles), roles.length]);

    // Also update permissions when we receive the roleAdded event
    useEffect(() => {
        const handleRoleAdded = () => {
            // Give a small delay to ensure the roles data has been updated
            setTimeout(() => {
                if (selectedRoles.length > 0 && roles.length > 0) {
                    const mergedPermissions = getMergedRolePermissions(selectedRoles);
                    onChange('permissions', mergedPermissions);
                }
            }, 100);
        };

        window.addEventListener('roleAdded', handleRoleAdded);
        return () => {
            window.removeEventListener('roleAdded', handleRoleAdded);
        };
    }, [selectedRoles, roles]);

    const handlePermissionChange = (module: string, action: string, checked: boolean) => {
        const currentPermissions = { ...formData.permissions };

        if (!currentPermissions[module]) {
            currentPermissions[module] = [];
        }

        if (checked) {
            if (!currentPermissions[module].includes(action)) {
                currentPermissions[module] = [...currentPermissions[module], action];
            }
        } else {
            currentPermissions[module] = currentPermissions[module].filter(a => a !== action);
        }

        onChange('permissions', currentPermissions);
    };

    // Show loading state
    if (rolesLoading) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <Text variant="p" size="lg" color="secondary">
                        Loading role permissions...
                    </Text>
                </div>
            </div>
        );
    }

    // Show error state
    if (rolesError) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <Text variant="p" size="lg" color="secondary">
                        Error loading permissions: {rolesError}
                    </Text>
                </div>
            </div>
        );
    }

    // Show permissions only if roles are selected
    if (selectedRoles.length === 0 || !formData.role) {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <Text variant="p" size="lg" color="secondary">
                        Please select a role in Step 1 to configure permissions
                    </Text>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Permission Setup Header */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                    <Text variant="h3" size="lg" weight="bold">
                        Permission Setup
                    </Text>
                    <div className="flex flex-wrap gap-2">
                        {selectedRoles.length > 0 ? (
                            selectedRoles.map((role, index) => (
                                <Badge key={index} variant="primary" size="md">
                                    {role}
                                </Badge>
                            ))
                        ) : (
                            <Badge variant="primary" size="md">
                                Multiple Roles
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    <Text variant="p" size="sm" color="muted" className="mb-6">
                        The permissions below are based on the selected role. You can modify these permissions as needed.
                    </Text>

                    {/* Permissions Table */}
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-left">
                                        <Text variant="span" size="sm" weight="semibold" color="secondary" className="uppercase tracking-wider">
                                            Modules
                                        </Text>
                                    </th>
                                    {actions.map((action) => (
                                        <th key={action} className="px-6 py-3 text-center">
                                            <Text variant="span" size="sm" weight="semibold" color="secondary" className="uppercase tracking-wider">
                                                {action}
                                            </Text>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {modules.map((module, idx) => {
                                    const displayName = moduleDisplayNames[module];
                                    return (
                                        <tr key={module} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-6 py-4">
                                                <Text variant="span" weight="semibold">
                                                    {displayName}
                                                </Text>
                                            </td>
                                            {actions.map((action) => (
                                                <td key={action} className="px-6 py-4 text-center">
                                                    <Checkbox
                                                        checked={formData.permissions[displayName]?.includes(action) || false}
                                                        onChange={(checked) => handlePermissionChange(displayName, action, checked)}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Permission Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <Text variant="h4" weight="semibold" className="mb-4">
                    Permission Summary for {selectedRoleDisplay || 'Selected Roles'}
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modules.map((module) => {
                        const displayName = moduleDisplayNames[module];
                        const modulePermissions = formData.permissions[displayName] || [];
                        return (
                            <div key={module} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                <Text variant="span" weight="medium">
                                    {displayName}:
                                </Text>
                                <div className="flex gap-2">
                                    {modulePermissions.length > 0 ? (
                                        modulePermissions.map((permission) => (
                                            <Badge key={permission} variant="secondary" size="sm">
                                                {permission}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge variant="secondary" size="sm" className="text-gray-500">
                                            No Access
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            
        </div>
    );
};

export default PermissionsStep;