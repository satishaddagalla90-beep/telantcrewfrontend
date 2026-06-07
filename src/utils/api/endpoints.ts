// API Endpoints
export const API_ENDPOINTS = {
  // Users
  USERS: {
    LIST: '/users/',
    GET: (id: string) => `/users/${id}`,
    CREATE: '/users/create',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    ACTIVITY_LOGS: (id: string) => `/users/${id}/activity-logs`,
    ASSIGN_PERMISSIONS: (id: string) => `/users/${id}/assign-permissions`,
    STATUS: (id: string) => `/users/${id}/status`,
    CHECK_DUPLICATES: '/users/check-duplicates',
  },

  // Candidates
  CANDIDATES: {
    LIST: '/candidates/',
    GET: (id: string) => `/candidates/${id}`,
    CREATE: '/candidates/create',
    UPDATE: (id: string) => `/candidates/${id}`,
    DELETE: (id: string) => `/candidates/${id}`,
    SEARCH: '/candidates/search',
    CHECK_DUPLICATES: '/candidates/check-duplicates',
    UPLOAD_DOCUMENTS: '/candidates/upload/documents',
    UPLOAD_AVATAR: '/candidates/upload/avatar',
    UPLOAD_RESUME: '/candidates/upload/resume',
    DROPDOWNS: (type: string) => `/candidates/dropdowns/${type}`,
  },

  // Clients
  CLIENTS: {
    LIST: '/client/',
    GET: (id: string) => `/client/${id}`,
    CREATE: '/client/create',
    UPDATE: (id: string) => `/client/${id}`,
    DELETE: (id: string) => `/client/${id}`,
    CONTACTS: (id: string) => `/client/${id}/contacts`,
    DROPDOWNS: (type: string) => `/client/dropdowns/${type}`,
    CHECK_DUPLICATES: '/client/check-duplicates',
    UPLOAD_LOGO: '/client/upload/logo',
    UPLOAD_DOCUMENTS: '/client/upload/documents',
  },

  // Jobs
  JOBS: {
    LIST: '/job/',
    GET: (id: string) => `/job/${id}`,
    CREATE: '/job/',
    UPDATE: (id: string) => `/job/${id}`,
    DELETE: (id: string) => `/job/${id}`,
    APPLICANTS: (id: string) => `/job/${id}/applicants`,
  },

  // Suppliers
    SUPPLIERS: {
        LIST: '/supplier/',
        GET: (id: string) => `/supplier/${id}`,
        CREATE: '/supplier/create',
        UPDATE: (id: string) => `/supplier/${id}`,
        DELETE: (id: string) => `/supplier/${id}`,
        UPLOAD_LOGO: '/supplier/upload/logo',
        UPLOAD_DOCUMENTS: '/supplier/upload/documents',
    },

  // Requirements (Applicant-Job Mappings)
  REQUIREMENTS: {
    LIST: '/requirement/',
    GET: (id: string) => `/requirement/${id}`,
    CREATE: '/requirement/create',
    UPDATE: (id: string) => `/requirement/${id}`,
    DELETE: (id: string) => `/requirement/${id}`,
    BULK_DELETE: '/requirement/bulk-delete',
    EXPORT: '/requirement/export',
  },

  RECRUITMENT: {
    MAP: '/recruitment/map',
    LIST: '/recruitment/',
    GET: (id: string) => `/recruitment/${id}`,
    UPDATE: (id: string) => `/recruitment/${id}`,
    UPDATE_STAGE: (id: string) => `/recruitment/${id}/stage`,
    JOB_APPLICANTS: (jobId: string) => `/recruitment/job/${jobId}/applicants`,
    CANDIDATE_JOBS: (candidateId: string) => `/recruitment/candidate/${candidateId}/jobs`,
    RECOMMENDED_CANDIDATES: (jobId: string) => `/recruitment/job/${jobId}/recommended-candidates`,
    DROPDOWNS: (type: string) => `/recruitment/dropdowns/${type}`,
    DELETE: (id: string) => `/recruitment/${id}`,
    UNMAP: (id: string) => `/recruitment/recruitment/${id}/unmap`,
  },

  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE_WORKSPACE: '/auth/google-workspace',
    CALLBACK: '/auth/google/callback',
  },

  // Files
  FILES: {
    UPLOAD: '/files/upload',
    VIEW: '/files/view',
    DOWNLOAD: '/files/download',
    DELETE: '/files/delete',
    STREAM_DOWNLOAD: '/files/stream-download',
  },

  // Admin Panel
  ADMIN: {
    DROPDOWN_ITEMS: (type: string) => `/admin/dropdowns/${type}`,
    DROPDOWN_ITEM: (type: string, id: string) => `/admin/dropdowns/${type}/${id}`,
    ADD_DROPDOWN: (type: string) => `/admin/dropdowns/${type}`,
    ROLES: '/admin/roles',
    ROLE: (roleId: string) => `/admin/roles/${roleId}`,
    ROLE_USERS: (roleId: string) => `/admin/roles/${roleId}/users`,
    HIERARCHY: '/admin/organization/hierarchy',
    FIELD_VISIBILITY: '/admin/field-visibility',
    FIELD_VISIBILITY_ROLE: (role: string) => `/admin/field-visibility/${role}`,
    STATS_SUMMARY: '/admin/stats/summary',
    STATS_ACTIVITY: '/admin/stats/activity',
  },
} as const;
