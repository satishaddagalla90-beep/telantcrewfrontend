// Admin Panel Service — Real API integration with fallback to mock data

import {
  DropdownItem,
  DropdownCategory,
  RolePermissionTemplate,
  OrgUser,
  StatsSummary,
  StatsActivity,
} from '../types/admin';
import { FieldVisibilityConfig } from '../types/fieldVisibility';
import { apiCall } from '../utils/api';
import { API_ENDPOINTS } from '../utils/api/endpoints';

// ─── Simulated network delay (for mock functions only) ─────────────────────
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// ─── API Configuration ────────────────────────────────────────────────────

// ─── MOCK DATA (Only non-dropdown data) ──────────────────────────────────────

// NOTE: All dropdown and category related mock data has been removed.
// The admin panel now relies 100% on real API endpoints.


const MOCK_ORG_USERS: OrgUser[] = [
  { _id: 'u1', first_name: 'Rajesh', last_name: 'Kumar', display_name: 'Rajesh Kumar', designation: 'CEO', role: ['Super Admin'], department: ['Management'], reporting_to: [], status: 'active', email: 'rajesh@company.com' },
  { _id: 'u2', first_name: 'Priya', last_name: 'Sharma', display_name: 'Priya Sharma', designation: 'VP Engineering', role: ['Administrator'], department: ['Engineering'], reporting_to: [{ _id: 'u1', display_name: 'Rajesh Kumar' }], status: 'active', email: 'priya@company.com' },
  { _id: 'u3', first_name: 'Amit', last_name: 'Patel', display_name: 'Amit Patel', designation: 'VP HR', role: ['Administrator'], department: ['Human Resources'], reporting_to: [{ _id: 'u1', display_name: 'Rajesh Kumar' }], status: 'active', email: 'amit@company.com' },
  { _id: 'u4', first_name: 'Sneha', last_name: 'Reddy', display_name: 'Sneha Reddy', designation: 'Engineering Manager', role: ['Manager'], department: ['Engineering'], reporting_to: [{ _id: 'u2', display_name: 'Priya Sharma' }], status: 'active', email: 'sneha@company.com' },
  { _id: 'u5', first_name: 'Vikram', last_name: 'Singh', display_name: 'Vikram Singh', designation: 'Senior Recruiter', role: ['Recruiter'], department: ['Human Resources'], reporting_to: [{ _id: 'u3', display_name: 'Amit Patel' }], status: 'active', email: 'vikram@company.com' },
  { _id: 'u6', first_name: 'Ananya', last_name: 'Gupta', display_name: 'Ananya Gupta', designation: 'Tech Lead', role: ['Manager'], department: ['Engineering'], reporting_to: [{ _id: 'u4', display_name: 'Sneha Reddy' }], status: 'active', email: 'ananya@company.com' },
  { _id: 'u7', first_name: 'Rohan', last_name: 'Mehta', display_name: 'Rohan Mehta', designation: 'Software Engineer', role: ['Recruiter'], department: ['Engineering'], reporting_to: [{ _id: 'u6', display_name: 'Ananya Gupta' }], status: 'active', email: 'rohan@company.com' },
  { _id: 'u8', first_name: 'Kavya', last_name: 'Nair', display_name: 'Kavya Nair', designation: 'Recruiter', role: ['Recruiter'], department: ['Human Resources'], reporting_to: [{ _id: 'u5', display_name: 'Vikram Singh' }], status: 'active', email: 'kavya@company.com' },
  { _id: 'u9', first_name: 'Arjun', last_name: 'Rao', display_name: 'Arjun Rao', designation: 'Junior Developer', role: ['Intern'], department: ['Engineering'], reporting_to: [{ _id: 'u6', display_name: 'Ananya Gupta' }], status: 'active', email: 'arjun@company.com' },
  { _id: 'u10', first_name: 'Deepa', last_name: 'Verma', display_name: 'Deepa Verma', designation: 'HR Coordinator', role: ['HR'], department: ['Human Resources'], reporting_to: [{ _id: 'u3', display_name: 'Amit Patel' }], status: 'active', email: 'deepa@company.com' },
  { _id: 'u11', first_name: 'Manish', last_name: 'Joshi', display_name: 'Manish Joshi', designation: 'Intern', role: ['Intern'], department: ['Engineering'], reporting_to: [{ _id: 'u7', display_name: 'Rohan Mehta' }], status: 'active', email: 'manish@company.com' },
  { _id: 'u12', first_name: 'Neha', last_name: 'Kapoor', display_name: 'Neha Kapoor', designation: 'Sales Manager', role: ['Manager'], department: ['Sales'], reporting_to: [{ _id: 'u1', display_name: 'Rajesh Kumar' }], status: 'active', email: 'neha@company.com' },
];

const MOCK_FIELD_VISIBILITY: FieldVisibilityConfig[] = [
  {
    role: 'Intern',
    modules: {
      job: { clientInfo: false, salaryDetails: false, internalNotes: false, billingInfo: false },
      candidate: { personalDetails: false, salaryInfo: false, contactInfo: true, documents: false },
      client: { contactDetails: false, commercials: false, internalNotes: false },
      supplier: { contactDetails: false, commercials: false, performance: false },
      users: { personalInfo: false, permissionDetails: false },
    },
  },
  {
    role: 'Recruiter',
    modules: {
      job: { clientInfo: false, salaryDetails: true, internalNotes: true, billingInfo: false },
      candidate: { personalDetails: true, salaryInfo: true, contactInfo: true, documents: true },
      client: { contactDetails: true, commercials: false, internalNotes: false },
      supplier: { contactDetails: true, commercials: false, performance: false },
      users: { personalInfo: false, permissionDetails: false },
    },
  },
  {
    role: 'Manager',
    modules: {
      job: { clientInfo: true, salaryDetails: true, internalNotes: true, billingInfo: true },
      candidate: { personalDetails: true, salaryInfo: true, contactInfo: true, documents: true },
      client: { contactDetails: true, commercials: true, internalNotes: true },
      supplier: { contactDetails: true, commercials: true, performance: true },
      users: { personalInfo: true, permissionDetails: true },
    },
  },
  {
    role: 'Administrator',
    modules: {
      job: { clientInfo: true, salaryDetails: true, internalNotes: true, billingInfo: true },
      candidate: { personalDetails: true, salaryInfo: true, contactInfo: true, documents: true },
      client: { contactDetails: true, commercials: true, internalNotes: true },
      supplier: { contactDetails: true, commercials: true, performance: true },
      users: { personalInfo: true, permissionDetails: true },
    },
  },
  {
    role: 'HR',
    modules: {
      job: { clientInfo: false, salaryDetails: true, internalNotes: true, billingInfo: false },
      candidate: { personalDetails: true, salaryInfo: true, contactInfo: true, documents: true },
      client: { contactDetails: true, commercials: false, internalNotes: false },
      supplier: { contactDetails: true, commercials: false, performance: false },
      users: { personalInfo: true, permissionDetails: true },
    },
  },
  {
    role: 'Read Only',
    modules: {
      job: { clientInfo: false, salaryDetails: false, internalNotes: false, billingInfo: false },
      candidate: { personalDetails: false, salaryInfo: false, contactInfo: true, documents: false },
      client: { contactDetails: false, commercials: false, internalNotes: false },
      supplier: { contactDetails: false, commercials: false, performance: false },
      users: { personalInfo: false, permissionDetails: false },
    },
  },
];

const MOCK_STATS: StatsSummary = {
  candidates: { total: 1247, active: 983, inactive: 264 },
  clients: { total: 86, active: 72, inactive: 14 },
  jobs: { total: 342, open: 128, closed: 189, onHold: 25 },
  suppliers: { total: 53, active: 41, inactive: 12 },
  recruitment: { total: 2156, mapped: 856, shortlisted: 643, selected: 412, rejected: 245 },
  users: { total: 32, active: 28, inactive: 4 },
};

const MOCK_ACTIVITY: StatsActivity = {
  recentLogins: [
    { user: 'Priya Sharma', email: 'priya@company.com', timestamp: '2026-04-03T09:15:00Z' },
    { user: 'Vikram Singh', email: 'vikram@company.com', timestamp: '2026-04-03T08:45:00Z' },
    { user: 'Sneha Reddy', email: 'sneha@company.com', timestamp: '2026-04-03T08:30:00Z' },
    { user: 'Ananya Gupta', email: 'ananya@company.com', timestamp: '2026-04-02T17:20:00Z' },
    { user: 'Kavya Nair', email: 'kavya@company.com', timestamp: '2026-04-02T16:00:00Z' },
    { user: 'Rohan Mehta', email: 'rohan@company.com', timestamp: '2026-04-02T14:30:00Z' },
    { user: 'Amit Patel', email: 'amit@company.com', timestamp: '2026-04-02T10:00:00Z' },
    { user: 'Neha Kapoor', email: 'neha@company.com', timestamp: '2026-04-01T11:15:00Z' },
  ],
  newRecords: { candidates: 47, clients: 3, jobs: 12, suppliers: 2 },
  period: '30 days',
};

// ─── LOCAL STATE (mutable for CRUD operations) ──────────────────────────────
// Note: Dropdown items are now only managed via API
let localFieldVisibility = JSON.parse(JSON.stringify(MOCK_FIELD_VISIBILITY));

// ─── API FUNCTIONS ──────────────────────────────────────────────────────────

// --- Dropdown Management ---

/**
 * Hardcoded list of all available dropdown types
 * Backend only provides per-type endpoints, not a types list endpoint
 */
const DROPDOWN_TYPES = [
  { key: 'Gender', label: 'Gender', description: 'Gender options' },
  { key: 'Marital', label: 'Marital Status', description: 'Marital status options' },
  { key: 'Locations', label: 'Locations', description: 'Geographic locations' },
  { key: 'NoticePeriod', label: 'Notice Period', description: 'Notice period options' },
  { key: 'preferred_job', label: 'Preferred Job Type', description: 'Preferred job type options' },
  { key: 'JobOpenType', label: 'Job Open Type', description: 'Job opening type options' },
  { key: 'Job_Type', label: 'Job Type', description: 'Job type options' },
  { key: 'Shifts', label: 'Shifts', description: 'Work shift options' },
  { key: 'CareerBreakType', label: 'Career Break Type', description: 'Career break reason types' },
  { key: 'EducationType', label: 'Education Type', description: 'Education type options' },
  { key: 'Degree', label: 'Degree', description: 'Degree options' },
  { key: 'Subject', label: 'Subject', description: 'Subject or field of study' },
  { key: 'College', label: 'College', description: 'College or institution names' },
  { key: 'University', label: 'University', description: 'University names' },
  { key: 'Employer', label: 'Employer', description: 'Organization or company names' },
  { key: 'Designation', label: 'Designation', description: 'Job title or designation' },
  { key: 'Department', label: 'Department', description: 'Department or team names' },
  { key: 'Customer', label: 'Customer', description: 'Customer or client names' },
  { key: 'ProjectType', label: 'Project Type', description: 'Project category types' },
  { key: 'Institution', label: 'Institution', description: 'Institution names' },
  { key: 'SkillSets', label: 'Skill Sets', description: 'Professional skills' },
  { key: 'Industry', label: 'Industry', description: 'Industry or sector options' },
  { key: 'Document_type', label: 'Document Type', description: 'Document classification types' },
  { key: 'Source_Type', label: 'Source Type', description: 'Source category types' },
  { key: 'Source_name', label: 'Source Name', description: 'Specific source names' },
  { key: 'Flags', label: 'Flags', description: 'Flag or tag options' },
  { key: 'Roles', label: 'Roles', description: 'User role options' },
];

/**
 * Fetch all dropdown categories with dynamic counts
 * Calls /admin/dropdowns/{type}?page=1&limit=1 to get item counts from API
 */
export async function fetchDropdownCategories(): Promise<DropdownCategory[]> {
  try {
    // Fetch counts for each hardcoded category type dynamically
    const categoriesWithCounts = await Promise.all(
      DROPDOWN_TYPES.map(async (cat) => {
        try {
          const countResponse = await apiCall<{
            dropdown_type: string;
            pagination: {
              page: number;
              limit: number;
              total: number;
              pages: number;
            };
            data: DropdownItem[];
          }>(
            `${API_ENDPOINTS.ADMIN.DROPDOWN_ITEMS(cat.key)}?page=1&limit=1`,
            { method: 'GET', enableCache: true, cacheTime: 300000 }
          );
          
          const count = countResponse.data?.pagination?.total || 0;
          return { 
            key: cat.key, 
            label: cat.label, 
            description: cat.description,
            count 
          };
        } catch (error) {
          console.error(`Error fetching count for ${cat.key}:`, error);
          return { 
            key: cat.key, 
            label: cat.label, 
            description: cat.description,
            count: 0 
          };
        }
      })
    );
    
    return categoriesWithCounts;
  } catch (error) {
    console.error('Error fetching dropdown categories:', error);
    // Return hardcoded categories with zero count if API fails
    return DROPDOWN_TYPES.map(cat => ({ ...cat, count: 0 }));
  }
}

/**
 * Fetch dropdown items with pagination and search
 * @param type - Dropdown type (e.g., 'Designation', 'Employer')
 * @param search - Optional search query
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 20)
 */
export async function fetchDropdownItems(
  type: string,
  search?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: DropdownItem[]; total: number; page: number; limit: number }> {
  try {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append('search', search);

    const endpoint = `${API_ENDPOINTS.ADMIN.DROPDOWN_ITEMS(type)}?${params.toString()}`;
    const response = await apiCall<{
      dropdown_type: string;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      data: DropdownItem[];
    }>(endpoint, { 
      method: 'GET', 
      enableCache: false // Don't cache search results
    });

    if (response.data) {
      return {
        data: response.data.data || [],
        total: response.data.pagination?.total || 0,
        page: response.data.pagination?.page || page,
        limit: response.data.pagination?.limit || limit,
      };
    }
  } catch (error) {
    console.error(`Error fetching dropdown items for ${type}:`, error);
  }

  return { data: [], total: 0, page, limit };
}

/**
 * Add new dropdown item
 * @param type - Dropdown type
 * @param name - Item name
 */
export async function addDropdownItem(
  type: string,
  name: string
): Promise<DropdownItem> {
  try {
    const response = await apiCall<DropdownItem>(
      API_ENDPOINTS.ADMIN.ADD_DROPDOWN(type),
      {
        method: 'POST',
        body: { name },
      }
    );
    
    if ((response.status === 201 || response.status === 200) && response.data) {
      clearDropdownCache(type);
      // Return the nested data object if present, otherwise return the response data
      return (response.data as any).data || response.data;
    }
  } catch (error) {
    console.error(`Error adding dropdown item to ${type}:`, error);
    throw error;
  }

  throw new Error('Failed to add dropdown item');
}

/**
 * Update dropdown item
 * @param type - Dropdown type
 * @param id - Item ID
 * @param name - New name
 */
export async function updateDropdownItem(
  type: string,
  id: string,
  name: string
): Promise<DropdownItem> {
  try {
    const response = await apiCall<DropdownItem>(
      API_ENDPOINTS.ADMIN.DROPDOWN_ITEM(type, id),
      {
        method: 'PUT',
        body: { name },
      }
    );

    if (response.status === 200 && response.data) {
      clearDropdownCache(type);
      // Return the nested data object if present, otherwise return the response data
      return (response.data as any).data || response.data;
    }
  } catch (error) {
    console.error(`Error updating dropdown item ${id} in ${type}:`, error);
    throw error;
  }

  throw new Error('Failed to update dropdown item');
}

/**
 * Delete dropdown item
 * @param type - Dropdown type
 * @param id - Item ID
 */
export async function deleteDropdownItem(type: string, id: string): Promise<void> {
  try {
    const response = await apiCall<void>(
      API_ENDPOINTS.ADMIN.DROPDOWN_ITEM(type, id),
      { method: 'DELETE' }
    );

    if (response.status === 200 || response.status === 204) {
      clearDropdownCache(type);
      return;
    }
  } catch (error) {
    console.error(`Error deleting dropdown item ${id} from ${type}:`, error);
    throw error;
  }

  throw new Error('Failed to delete dropdown item');
}

function clearDropdownCache(type: string): void {
  // Cache invalidation
}

// --- Role & Permission Templates ---

export async function fetchRoles(): Promise<RolePermissionTemplate[]> {
  try {
    const response = await apiCall<RolePermissionTemplate[]>(
      API_ENDPOINTS.ADMIN.ROLES,
      { method: 'GET' }
    );
    
    if (response.data) {
      return (response.data as any).data || response.data;
    }
  } catch (error) {
    console.error('Error fetching roles:', error);
  }
  return [];
}

export async function createRole(
  role: Omit<RolePermissionTemplate, 'id' | 'userCount'>
): Promise<RolePermissionTemplate> {
  try {
    const response = await apiCall<RolePermissionTemplate>(
      API_ENDPOINTS.ADMIN.ROLES,
      {
        method: 'POST',
        body: role,
        showToaster: false,
      }
    );
    
    if (response.data) {
      return (response.data as any).data || response.data;
    }
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
  throw new Error('Failed to create role');
}

export async function updateRole(
  roleId: string,
  updates: Partial<Pick<RolePermissionTemplate, 'name' | 'permissions'>>
): Promise<RolePermissionTemplate> {
  try {
    const response = await apiCall<RolePermissionTemplate>(
      API_ENDPOINTS.ADMIN.ROLE(roleId),
      {
        method: 'PUT',
        body: updates,
      }
    );
    
    if (response.data) {
      return (response.data as any).data || response.data;
    }
  } catch (error) {
    console.error(`Error updating role ${roleId}:`, error);
    throw error;
  }
  throw new Error('Failed to update role');
}

export async function deleteRole(roleId: string): Promise<void> {
  try {
    const response = await apiCall<void>(
      API_ENDPOINTS.ADMIN.ROLE(roleId),
      { method: 'DELETE' }
    );
    
    if (response.status === 200 || response.status === 204) {
      return;
    }
  } catch (error) {
    console.error(`Error deleting role ${roleId}:`, error);
    throw error;
  }
  throw new Error('Failed to delete role');
}

// --- Org Hierarchy ---

export async function fetchOrgUsers(filters?: {
  search?: string;
  department?: string;
  role?: string;
  include_inactive?: boolean;
}): Promise<OrgUser[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.include_inactive !== undefined) {
      params.append('include_inactive', String(filters.include_inactive));
    }

    const response = await apiCall<OrgUser[]>(
      `${API_ENDPOINTS.ADMIN.HIERARCHY}${params.toString() ? '?' + params.toString() : ''}`,
      { method: 'GET' }
    );
    
    if (response.data) {
      return (response.data as any).data || response.data;
    }
  } catch (error) {
    console.error('Error fetching org hierarchy:', error);
  }
  return [];
}

// --- Field Visibility ---

export async function fetchFieldVisibility(): Promise<FieldVisibilityConfig[]> {
  await delay();
  return localFieldVisibility;
}

export async function fetchFieldVisibilityForRole(
  role: string
): Promise<FieldVisibilityConfig | null> {
  await delay(200);
  return localFieldVisibility.find((c: FieldVisibilityConfig) => c.role === role) || null;
}

export async function updateFieldVisibility(
  role: string,
  modules: FieldVisibilityConfig['modules']
): Promise<FieldVisibilityConfig> {
  await delay(300);
  const idx = localFieldVisibility.findIndex((c: FieldVisibilityConfig) => c.role === role);
  if (idx === -1) {
    const newConfig: FieldVisibilityConfig = { role, modules };
    localFieldVisibility = [...localFieldVisibility, newConfig];
    return newConfig;
  }
  localFieldVisibility[idx] = { ...localFieldVisibility[idx], modules };
  localFieldVisibility = [...localFieldVisibility];
  return localFieldVisibility[idx];
}

// --- Stats ---

export async function fetchStatsSummary(): Promise<StatsSummary> {
  await delay(600);
  return MOCK_STATS;
}

export async function fetchStatsActivity(days = 30): Promise<StatsActivity> {
  await delay(400);
  return { ...MOCK_ACTIVITY, period: `${days} days` };
}
