// Hooks exports
export { useURLPagination } from './useURLPagination';
export type {
  PaginationParams,
  URLPaginationConfig,
  URLPaginationReturn,
} from './useURLPagination';

export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedAsyncSearch,
} from './useDebounce';

export { useJobs } from './useJobs';
export { useClients, useClientsDropdown } from './useClients';

// Permission hooks
export { default as usePermissions } from './usePermissions';
export * from './usePermissions';

export {
  useDropdownData,
  useLocationsDropdown,
  useUsersDropdown,
  useUserStatusOptions,
  useCustomersDropdown,
  useEmployersDropdown,
} from './useDropdowns';
