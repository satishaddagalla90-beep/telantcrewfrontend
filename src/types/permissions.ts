// Permission types for dynamic permission checking

export interface UserPermissions {
  candidate: string;
  client: string;
  job: string;
  supplier: string;
  users: string;
}

export interface UserWithPermissions {
  _id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  designation?: string;
  avatar?: string;
  organization?: string;
  permission: UserPermissions;
}

export interface PermissionCheckResult {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type PermissionModule = 'candidate' | 'client' | 'job' | 'supplier' | 'users';
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';