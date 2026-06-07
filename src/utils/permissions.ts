import { 
  UserPermissions, 
  PermissionCheckResult, 
  PermissionModule, 
  PermissionAction 
} from '../types/permissions';

/**
 * Decodes a 4-digit permission string into CRUD permissions
 * @param permissionString - 4-digit string like "1110" or "0000"
 * @returns PermissionCheckResult with boolean flags for each CRUD operation
 */
export const decodePermissions = (permissionString: string): PermissionCheckResult => {
  // Default to no permissions if invalid string
  if (!permissionString || permissionString.length !== 4) {
    return {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
    };
  }

  return {
    canCreate: permissionString[0] === '1',
    canRead: permissionString[1] === '1',
    canUpdate: permissionString[2] === '1',
    canDelete: permissionString[3] === '1',
  };
};

/**
 * Checks if user has specific permission for a module and action
 * @param permissions - User's permissions object
 * @param module - Module name (candidate, client, job, supplier, users)
 * @param action - Action to check (create, read, update, delete)
 * @returns boolean indicating if user has permission
 */
export const hasPermission = (
  permissions: UserPermissions | null,
  module: PermissionModule,
  action: PermissionAction
): boolean => {
  if (!permissions) return false;
  
  const modulePermissions = permissions[module];
  if (!modulePermissions) return false;
  
  const decodedPermissions = decodePermissions(modulePermissions);
  
  switch (action) {
    case 'create':
      return decodedPermissions.canCreate;
    case 'read':
      return decodedPermissions.canRead;
    case 'update':
      return decodedPermissions.canUpdate;
    case 'delete':
      return decodedPermissions.canDelete;
    default:
      return false;
  }
};

/**
 * Gets all permissions for a specific module
 * @param permissions - User's permissions object
 * @param module - Module name
 * @returns PermissionCheckResult with all CRUD permissions
 */
export const getModulePermissions = (
  permissions: UserPermissions | null,
  module: PermissionModule
): PermissionCheckResult => {
  if (!permissions) {
    return {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
    };
  }
  
  const modulePermissions = permissions[module];
  return decodePermissions(modulePermissions);
};

/**
 * Checks if user has any permissions for a module
 * @param permissions - User's permissions object
 * @param module - Module name
 * @returns boolean indicating if user has any permission for the module
 */
export const hasAnyPermission = (
  permissions: UserPermissions | null,
  module: PermissionModule
): boolean => {
  if (!permissions) return false;
  
  const modulePermissions = getModulePermissions(permissions, module);
  return (
    modulePermissions.canCreate ||
    modulePermissions.canRead ||
    modulePermissions.canUpdate ||
    modulePermissions.canDelete
  );
};

/**
 * Validates permission string format
 * @param permissionString - String to validate
 * @returns boolean indicating if format is valid
 */
export const isValidPermissionString = (permissionString: string): boolean => {
  return (
    typeof permissionString === 'string' &&
    permissionString.length === 4 &&
    /^[01]{4}$/.test(permissionString)
  );
};

/**
 * Checks if user has Super Admin role
 * @param roles - Array of role strings from user data
 * @returns boolean indicating if user is a Super Admin
 */
export const isSuperAdmin = (roles: string[] | undefined): boolean => {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some(
    role => role.toLowerCase() === 'super admin' || role.toLowerCase() === 'super_admin'
  );
};