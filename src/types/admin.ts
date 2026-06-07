// Admin Panel Types

export interface DropdownItem {
  id: string;
  name: string;
  created: string;
  updated: string;
}

export interface DropdownCategory {
  key: string;
  label: string;
  description: string;
  count: number;
}

export interface PermissionActions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface RolePermissionTemplate {
  id: string;
  name: string;
  permissions: {
    candidate: PermissionActions;
    client: PermissionActions;
    job: PermissionActions;
    supplier: PermissionActions;
    users: PermissionActions;
  };
  userCount?: number;
  created?: string;
  updated?: string;
}

export interface OrgUser {
  id?: string;
  _id?: string; // Support for legacy/mock data
  name?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  designation?: string;
  role?: string | string[];
  roles?: string[];
  department?: string | string[];
  departments?: string[];
  reporting_to?: any[];
  avatar?: {
    file_url: string;
  } | null;
  user_picture_url?: string; // Support for legacy/mock data
  status?: string;
  email: string;
  reports_count?: number;
  level?: number;
  initials?: string;
  children?: OrgUser[];
}

export interface OrgTreeNode extends OrgUser {
  children: OrgTreeNode[];
  isExpanded?: boolean;
}

export interface FieldVisibilityConfig {
  role: string;
  modules: {
    [module: string]: {
      [sectionKey: string]: boolean;
    };
  };
}

export interface ModuleSectionDefinition {
  key: string;
  label: string;
  description: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  sections: ModuleSectionDefinition[];
}

export interface StatsSummary {
  candidates: { total: number; active: number; inactive: number };
  clients: { total: number; active: number; inactive: number };
  jobs: { total: number; open: number; closed: number; onHold: number };
  suppliers: { total: number; active: number; inactive: number };
  recruitment: {
    total: number;
    mapped: number;
    shortlisted: number;
    selected: number;
    rejected: number;
  };
  users: { total: number; active: number; inactive: number };
}

export interface StatsActivity {
  recentLogins: { user: string; timestamp: string; email: string }[];
  newRecords: {
    candidates: number;
    clients: number;
    jobs: number;
    suppliers: number;
  };
  period: string;
}
