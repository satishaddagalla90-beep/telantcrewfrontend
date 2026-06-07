// Resume data structure types for PDF parsing

export interface ResumeProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  url: string;
  urls?: string[]; // All URLs found (LinkedIn, GitHub, portfolio, etc.)
  summary: string;
}

export interface ResumeEducation {
  school: string;
  degree: string;
  gpa: string;
  date: string;
  descriptions: string[];
}

export interface ResumeWorkExperience {
  company: string;
  jobTitle: string;
  date: string;
  descriptions: string[];
}

export interface ResumeProject {
  project: string;
  date: string;
  descriptions: string[];
}

export interface ResumeFeaturedSkill {
  skill: string;
  rating: number;
}

export interface ResumeSkills {
  featuredSkills: ResumeFeaturedSkill[];
  descriptions: string[];
}

export interface ResumeCustom {
  descriptions: string[];
}

export interface Resume {
  profile: ResumeProfile;
  educations: ResumeEducation[];
  workExperiences: ResumeWorkExperience[];
  projects: ResumeProject[];
  skills: ResumeSkills;
  custom: ResumeCustom;
  rawText?: string; // Raw text extracted from PDF (100% clone)
}

// Resume section keys
export type ResumeKey =
  | 'profile'
  | 'education'
  | 'workExperience'
  | 'project'
  | 'skills'
  | 'custom';
