// Main API exports
export { useSWR, apiCall } from './useSWR';
export { useAPI } from './useAPI';
export { NetWrapper } from './netWrapper';
export { Net, clearNetCache } from './net';
export { API_ENDPOINTS } from './endpoints';
export { dropdownAPI } from './dropdowns';
export { usersAPI } from './UsersAPI';
export { clientsAPI } from './ClientsAPI';
export { candidateUpdateAPI, userUpdateAPI } from './updateAPI';
export { JobsAPI } from './JobsAPI';
export type {
  User,
  UserPermissionObject,
  UsersResponse,
  PaginatedResponse,
  IRequest,
  IError,
  ApiResponse,
  FetchState,
  IResponse,
  DropdownOption,
  UserPermission,
  ActivityLog,
  ActivityLogsResponse,
  AssignedUser,
  AssignedUsersResponse,
  UserManagement,
  UserManagementResponse,
  Client,
  ClientsResponse,
  ClientContact,
  ClientContract,
  ClientDocument,
} from './types';
export type {
  LocationsResponse,
  DesignationsResponse,
  DepartmentsResponse,
  UsersResponse as DropdownUsersResponse,
} from './dropdowns';
export type {
  CandidateSearchParams,
  CandidateData,
  CandidatesResponse,
} from './CandidatesAPI';
export type {
  JobAPI,
  JobsAPIResponse,
  JobListItem,
  JobSearchParams,
  JobFilters,
} from '../../types/job';
export type {
    SupplierData,
    SuppliersResponse
} from './SuppliersAPI';