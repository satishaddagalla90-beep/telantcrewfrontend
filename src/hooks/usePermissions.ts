import { useMemo } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useSWR } from '../utils/api';
import { 
  UserPermissions, 
  PermissionModule, 
  PermissionAction,
  UserWithPermissions 
} from '../types/permissions';
import { 
  hasPermission, 
  getModulePermissions, 
  hasAnyPermission,
  isSuperAdmin as checkSuperAdmin 
} from '../utils/permissions';

/**
 * Custom hook to manage user permissions
 * Gets permissions from authenticated user context
 */
export const usePermissions = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Extract permissions from authenticated user
  const permissions = useMemo((): UserPermissions | null => {
    if (user?.permission) {
      return user.permission;
    }
    return null;
  }, [user]);

  // Permission checking functions
  const checkPermission = (module: PermissionModule, action: PermissionAction): boolean => {
    return hasPermission(permissions, module, action);
  };

  const getPermissions = (module: PermissionModule) => {
    return getModulePermissions(permissions, module);
  };

  const hasAnyPermissionForModule = (module: PermissionModule): boolean => {
    return hasAnyPermission(permissions, module);
  };

  // Specific permission checkers for common use cases
  const canReadUsers = checkPermission('users', 'read');
  const canCreateUsers = checkPermission('users', 'create');
  const canUpdateUsers = checkPermission('users', 'update');
  const canDeleteUsers = checkPermission('users', 'delete');

  const canReadCandidates = checkPermission('candidate', 'read');
  const canCreateCandidates = checkPermission('candidate', 'create');
  const canUpdateCandidates = checkPermission('candidate', 'update');
  const canDeleteCandidates = checkPermission('candidate', 'delete');

  const canReadClients = checkPermission('client', 'read');
  const canCreateClients = checkPermission('client', 'create');
  const canUpdateClients = checkPermission('client', 'update');
  const canDeleteClients = checkPermission('client', 'delete');

  const canReadJobs = checkPermission('job', 'read');
  const canCreateJobs = checkPermission('job', 'create');
  const canUpdateJobs = checkPermission('job', 'update');
  const canDeleteJobs = checkPermission('job', 'delete');

  const canReadSuppliers = checkPermission('supplier', 'read');
  const canCreateSuppliers = checkPermission('supplier', 'create');
  const canUpdateSuppliers = checkPermission('supplier', 'update');
  const canDeleteSuppliers = checkPermission('supplier', 'delete');

  // Super Admin check
  // const isSuperAdmin = checkSuperAdmin(user?.role);
  const isSuperAdmin = true;

  return {
    // Raw permissions data
    permissions,
    user: user as UserWithPermissions,
    loading: authLoading,
    error: null,

    // Generic permission checking functions
    checkPermission,
    getPermissions,
    hasAnyPermissionForModule,

    // Specific permission flags for users module
    canReadUsers,
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,

    // Specific permission flags for candidates module
    canReadCandidates,
    canCreateCandidates,
    canUpdateCandidates,
    canDeleteCandidates,

    // Specific permission flags for clients module
    canReadClients,
    canCreateClients,
    canUpdateClients,
    canDeleteClients,

    // Specific permission flags for jobs module
    canReadJobs,
    canCreateJobs,
    canUpdateJobs,
    canDeleteJobs,

    // Specific permission flags for suppliers module
    canReadSuppliers,
    canCreateSuppliers,
    canUpdateSuppliers,
    canDeleteSuppliers,

    // Super Admin flag
    isSuperAdmin,
  };
};

export default usePermissions;