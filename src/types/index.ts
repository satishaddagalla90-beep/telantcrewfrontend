// Base types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Job API types (for listing API)
export type {
  JobAPI,
  JobRequirementAPI,
  JobClientAPI,
  JobDetailsAPI,
  JobDescriptionAPI,
  JobsAPIResponse,
  JobListItem,
  JobFilters,
  JobSearchParams,
  JobDropdownOptions,
} from './job';

// Requirement/Mapping types
export type {
  RequirementAPI,
  RequirementListItem,
  RequirementsAPIResponse,
  RequirementFilters,
  RequirementSortConfig,
  RequirementTabCounts,
  CreateRequirementInput,
  UpdateRequirementInput,
  ApplicantInfo,
  MappedJobInfo,
  EducationDetail,
  EmploymentDetail,
  ProjectDetail,
  CertificationDetail,
  DocumentDetail,
  RequirementComment,
} from './recruitment';

// Permission types
export type {
  UserPermissions,
  UserWithPermissions,
  PermissionCheckResult,
  PermissionModule,
  PermissionAction,
} from './permissions';

// User types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
}

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

// Project types
export interface Project extends BaseEntity {
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  ownerId: string;
  teamId: string;
  tags: string[];
}

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'cancelled';

// Team types
export interface Team extends BaseEntity {
  name: string;
  description: string;
  members: TeamMember[];
  projects: Project[];
}

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: string;
}

export type TeamRole = 'owner' | 'admin' | 'member';

// Task types
export interface Task extends BaseEntity {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  tags: string[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// API types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
  message: string;
  success: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule[];
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface DropdownOption {
  id?: string;
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Theme types
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
  };
}

// Navigation types
export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
  isActive?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  isVisible: boolean;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Table types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: Pagination;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
}

// Filter types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface Filter {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'dateRange' | 'search';
  options?: FilterOption[];
  value?: any;
}

// Search types
export interface SearchParams {
  query: string;
  filters: Record<string, any>;
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination: {
    page: number;
    limit: number;
  };
}

// Event types
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// Candidate types
export * from './candidate';

// User types
export * from './user';
