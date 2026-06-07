/**
 * Utility functions to transform frontend data to backend API format
 * Converts camelCase to snake_case and ensures correct data types
 */

// Month name mappings (both full and abbreviated) - shared by date parsing functions
const MONTH_MAP: Record<string, string> = {
  'jan': '01', 'january': '01',
  'feb': '02', 'february': '02',
  'mar': '03', 'march': '03',
  'apr': '04', 'april': '04',
  'may': '05',
  'jun': '06', 'june': '06',
  'jul': '07', 'july': '07',
  'aug': '08', 'august': '08',
  'sep': '09', 'sept': '09', 'september': '09',
  'oct': '10', 'october': '10',
  'nov': '11', 'november': '11',
  'dec': '12', 'december': '12',
};

/**
 * Parse date strings like "Nov 2021", "Oct'23", "October 2023." to YYYY-MM-DD format
 * Returns empty string if parsing fails (for form field usage)
 */
export const parseMonthYearToDate = (dateStr: string): string => {
  if (!dateStr) return '';

  // Clean up the string - remove trailing periods, extra spaces
  const cleanStr = dateStr.trim().replace(/\.$/, '').trim();

  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    return cleanStr;
  }

  // Pattern: "Nov 2021", "November 2021", "Nov-2021", "Nov'21"
  const monthYearMatch = cleanStr.match(/^([a-zA-Z]+)['\s-]*(\d{2,4})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase();
    let year = monthYearMatch[2];

    // Convert 2-digit year to 4-digit
    if (year.length === 2) {
      const yearNum = parseInt(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }

    const month = MONTH_MAP[monthName];
    if (month && year.length === 4) {
      return `${year}-${month}-01`;
    }
  }

  // Pattern: "11/2021" or "11-2021"
  const numericMonthYearMatch = cleanStr.match(/^(\d{1,2})[/-](\d{4})$/);
  if (numericMonthYearMatch) {
    const month = numericMonthYearMatch[1].padStart(2, '0');
    const year = numericMonthYearMatch[2];
    if (parseInt(month) >= 1 && parseInt(month) <= 12) {
      return `${year}-${month}-01`;
    }
  }

  // Pattern: "2021-11" (YYYY-MM)
  const yearMonthMatch = cleanStr.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    const year = yearMonthMatch[1];
    const month = yearMonthMatch[2].padStart(2, '0');
    if (parseInt(month) >= 1 && parseInt(month) <= 12) {
      return `${year}-${month}-01`;
    }
  }

  // Pattern: Just a year "2021"
  const yearOnlyMatch = cleanStr.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    return `${yearOnlyMatch[1]}-01-01`;
  }

  // If we can't parse it, return empty string (will need user to fill in)
  console.warn(`Could not parse date: "${dateStr}"`);
  return '';
};

// Helper function to convert camelCase to snake_case
const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Helper function to convert empty strings to null for optional fields
const emptyToNull = (
  value: string | boolean | number
): string | boolean | number | null => {
  if (typeof value === 'string' && value.trim() === '') {
    return null;
  }
  return value;
};

// Helper function to convert empty strings to null for optional fields, or default for required fields
const emptyToNullOrDefault = (
  value: string | boolean | number,
  defaultValue?: string
): string | boolean | number | null => {
  if (typeof value === 'string' && value.trim() === '') {
    return defaultValue || null;
  }
  return value;
};

/**
 * Format date for API submission - returns null if invalid (for API payload)
 * Uses parseMonthYearToDate internally for parsing
 */
const formatDateForAPI = (dateStr: string | undefined | null): string | null => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return null;
  }

  const parsed = parseMonthYearToDate(dateStr);
  return parsed || null;
};

/**
 * Format date for API submission in MM/YYYY format
 * Returns null if invalid (for API payload)
 */
const formatDateForAPIMonthYear = (dateStr: string | undefined | null): string | null => {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return null;
  }

  // If already in MM/YYYY format, return as-is
  if (/^\d{1,2}\/\d{4}$/.test(dateStr)) {
    // Check if it's already in MM format (two digits)
    const [month, year] = dateStr.split('/');
    if (month.length === 2) {
      return dateStr;
    }
    // Add leading zero to single digit months
    return `${month.padStart(2, '0')}/${year}`;
  }

  // If in YYYY-MM format, convert to MM/YYYY
  const yearMonthMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    const year = yearMonthMatch[1];
    const month = yearMonthMatch[2].padStart(2, '0'); // Ensure two digits
    return `${month}/${year}`;
  }

  // If in YYYY-MM-DD format, convert to MM/YYYY
  const fullDateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-\d{1,2}$/);
  if (fullDateMatch) {
    const year = fullDateMatch[1];
    const month = fullDateMatch[2].padStart(2, '0'); // Ensure two digits
    return `${month}/${year}`;
  }

  // Use parseMonthYearToDate to handle other formats, then convert to MM/YYYY
  const parsed = parseMonthYearToDate(dateStr);
  if (parsed) {
    // Convert YYYY-MM-DD to MM/YYYY
    const [year, month] = parsed.split('-');
    return `${month}/${year}`; // Month is already two digits from parseMonthYearToDate
  }

  return null;
};

// Helper function to convert string numbers to integers
const stringToNumber = (value: string): number | null => {
  if (!value || value.trim() === '') return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
};

// Helper function to convert string numbers to floats
const stringToFloat = (value: string): number | null => {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// Helper function to extract year from date string
const extractYear = (dateString: string): number | null => {
  if (!dateString || dateString.trim() === '') return null;
  const year = new Date(dateString).getFullYear();
  return isNaN(year) ? null : year;
};

export interface SkillAPIFormat {
  skill_name: string | null;
  expertise: string | null;
  rating: number | null;
  experience: number | null;
  additional_skill: string | null;
  skill_category?: string | null;
}

export interface EducationAPIFormat {
  id: string;
  education_type: string | null;
  highest_degree: string | null;
  subject: string[] | null;
  college: string | null;
  university: string | null;
  gpa: string | null;
  year_of_passing: number | null;
  is_pursuing: boolean;
}

export interface EmploymentAPIFormat {
  id: string;
  organization_name: string | null;
  job_type: string | null;
  payroll_organization: string | null;
  designation: string | null;
  location: string | null;
  from_date: string | null;
  to_date: string | null;
  is_current_job: boolean;
}

export interface ProjectAPIFormat {
  id: string;
  customer_name: string | null;
  industry: string | null;
  project_type: string | null;
  designation: string | null;
  organization_name: string | null;
  from_date: string | null;
  to_date: string | null;
  current_project: boolean;
}

export interface CertificationAPIFormat {
  id: string;
  certification_name: string | null;
  institution_name: string | null;
  certification_number: string | null;
  certification_date: string | null;
  valid_until_date: string | null;
}

export interface DocumentAPIFormat {
  id: string;
  document_name: string | null;
  document_number: string | null;
  document_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
}

// Transform Skill data for API
export const transformSkillForAPI = (skill: any): SkillAPIFormat => {
  // Extract value from expertise if it's an object (from dropdown)
  const expertiseValue =
    typeof skill.expertise === 'object' && skill.expertise
      ? skill.expertise.value
      : skill.expertise;

  return {
    skill_name: emptyToNullOrEmptyString(skill.skillName, true) as
      | string
      | null,
    expertise: emptyToNullOrEmptyString(expertiseValue, true) as string | null,
    rating: stringToNumber(skill.rating),
    experience: stringToFloat(skill.experience),
    additional_skill: emptyToNullOrEmptyString(
      skill.additionalSkill || '',
      false
    ) as string | null,
  };
};

// Helper function to convert empty strings to null for optional fields, or empty string for required string fields
const emptyToNullOrEmptyString = (
  value: string | boolean | number,
  isRequired: boolean = false
): string | boolean | number | null => {
  if (typeof value === 'string' && value.trim() === '') {
    return isRequired ? '' : null;
  }
  return value;
};

// Transform Education data for API
export const transformEducationForAPI = (
  education: any
): EducationAPIFormat => {
  // Handle subject as array
  const subjectArray = Array.isArray(education.subject)
    ? education.subject.filter((s: string) => s && s.trim() !== '')
    : [];

  return {
    id: education.id,
    education_type: emptyToNullOrEmptyString(education.educationType, true) as
      | string
      | null,
    highest_degree: emptyToNullOrEmptyString(education.highestDegree, true) as
      | string
      | null,
    subject: subjectArray,
    college: emptyToNullOrEmptyString(education.college, true) as string | null,
    university: emptyToNullOrEmptyString(education.university, true) as
      | string
      | null,
    gpa: emptyToNull(education.gpa) as string | null,
    year_of_passing: extractYear(education.yearOfPassing),
    is_pursuing: Boolean(education.isPursuing),
  };
};

// Transform Employment data for API
export const transformEmploymentForAPI = (
  employment: any
): EmploymentAPIFormat => {
  return {
    id: employment.id,
    organization_name: emptyToNull(employment.organizationName) as
      | string
      | null,
    job_type: emptyToNullOrDefault(employment.jobType, 'full-time') as
      | string
      | null,
    payroll_organization: emptyToNull(employment.payrollOrganization) as
      | string
      | null,
    designation: emptyToNull(employment.designation) as string | null,
    location: emptyToNull(employment.location) as string | null,
    from_date: formatDateForAPIMonthYear(employment.fromDate),
    to_date: formatDateForAPIMonthYear(employment.toDate),
    is_current_job: Boolean(employment.isCurrentJob),
  };
};

// Transform Project data for API
export const transformProjectForAPI = (project: any): ProjectAPIFormat => {
  return {
    id: project.id,
    customer_name: emptyToNull(project.customerName) as string | null,
    industry: emptyToNull(project.industry) as string | null,
    project_type: emptyToNull(project.projectType) as string | null,
    designation: emptyToNull(project.designation) as string | null,
    organization_name: emptyToNull(project.organizationName) as string | null,
    from_date: formatDateForAPIMonthYear(project.fromDate),
    to_date: formatDateForAPIMonthYear(project.toDate),
    current_project: Boolean(project.isCurrentProject),
  };
};

// Transform Certification data for API
export const transformCertificationForAPI = (
  certification: any
): CertificationAPIFormat => {
  return {
    id: certification.id,
    certification_name: emptyToNull(certification.certificationName) as
      | string
      | null,
    institution_name: emptyToNull(certification.institutionName) as
      | string
      | null,
    certification_number: emptyToNull(certification.certificationNo) as
      | string
      | null,
    certification_date: formatDateForAPI(certification.certificationDate),
    valid_until_date: formatDateForAPI(certification.validUntil),
  };
};

// Transform Document data for API
export const transformDocumentForAPI = (document: any): DocumentAPIFormat => {
  return {
    id: document.id,
    // Handle both camelCase (from forms) and snake_case (from upload handler) field names
    document_name: emptyToNull(
      document.document_name || document.documentName
    ) as string | null,
    document_number: emptyToNull(
      document.document_number || document.documentNo
    ) as string | null,
    document_date: emptyToNull(document.document_date || document.docDate) as
      | string
      | null,
    expiry_date: emptyToNull(document.expiry_date || document.expiryDate) as
      | string
      | null,
    document_url: emptyToNull(document.document_url || document.documentUrl) as
      | string
      | null,
  };
};

// Generic transformation function that can handle any object
export const transformToSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => transformToSnakeCase(item));
  }

  if (typeof obj === 'object') {
    const transformed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = camelToSnakeCase(key);
      transformed[snakeKey] = transformToSnakeCase(value);
    }
    return transformed;
  }

  return obj;
};
