import { parseResumeFromPdf } from './parse-resume-from-pdf';
import type { Resume } from './parse-resume-from-pdf/resume-types';
import { capitalizeIndianCity } from '../constants/cities';

/**
 * Validates and formats an Indian phone number
 * Accepts formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
 * Returns standardized format: +91XXXXXXXXXX or empty string if invalid
 */
function validateAndFormatPhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove + and check the number
  const digits = cleaned.replace(/\+/g, '');

  // Indian mobile numbers are 10 digits, with country code it's 12 digits (91XXXXXXXXXX)
  if (digits.length === 10) {
    // Just the 10 digit number, add +91
    return '+91' + digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    // Already has country code
    return '+' + digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Remove leading 0 and add country code
    return '+91' + digits.substring(1);
  }

  // Invalid format - return empty string
  return '';
}

/**
 * Validates email format
 * Returns the email if valid, empty string otherwise
 */
function validateEmail(email: string): string {
  if (!email) return '';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) ? email.trim().toLowerCase() : '';
}

/**
 * Capitalizes a name properly (e.g., "john" -> "John", "JOHN" -> "John")
 * Handles hyphenated names and multiple words
 */
function capitalizeName(name: string): string {
  if (!name) return '';

  return name
    .trim()
    .split(/[\s-]/) // Split by space or hyphen
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\s-\s/g, '-'); // Re-join hyphenated names
}

export interface ParsedResumeData {
  // Personal Details
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedin_profile: string;
  github_profile: string;
  profile_summary: string;

  // Skills
  skills: Array<{ skill: string; rating: number }>;

  // Education
  education: Array<{
    school: string;
    degree: string;
    gpa: string;
    date: string;
    descriptions: string[];
  }>;

  // Work Experience
  workExperience: Array<{
    company: string;
    jobTitle: string;
    date: string;
    descriptions: string[];
  }>;

  // Projects
  projects: Array<{
    project: string;
    date: string;
    descriptions: string[];
  }>;

  // Full resume text for textCV
  textCV: string;
}

/**
 * Parse a resume file (PDF or DOCX) and extract candidate information
 * @param file - The PDF or DOCX file to parse
 * @returns Parsed resume data ready to populate the candidate form
 */
export async function parseResume(file: File): Promise<ParsedResumeData> {
  // Create a blob URL for the file
  const fileUrl = URL.createObjectURL(file);

  try {
    // Parse the file (PDF or DOCX)
    const resume: Resume = await parseResumeFromPdf(fileUrl, file);

    // Debug: Log parsed resume to see what we got
    console.log('=== PARSED RESUME DATA ===');
    console.log('Profile:', resume.profile);
    console.log('Education count:', resume.educations.length);
    console.log('Work Experience count:', resume.workExperiences.length);
    console.log(
      'Work Experiences:',
      JSON.stringify(resume.workExperiences, null, 2)
    );
    console.log(
      'Featured Skills count:',
      resume.skills.featuredSkills.filter(s => s.skill.trim()).length
    );
    console.log('Featured Skills:', resume.skills.featuredSkills);
    console.log('Skill Descriptions:', resume.skills.descriptions);
    console.log('Projects count:', resume.projects.length);
    console.log('Custom:', resume.custom);

    // Extract name parts from full name and capitalize properly
    const nameParts = resume.profile.name.trim().split(/\s+/);
    const firstName = capitalizeName(nameParts[0] || '');
    const lastName =
      nameParts.length > 1 ? capitalizeName(nameParts[nameParts.length - 1]) : '';
    const middleName =
      nameParts.length > 2 ? capitalizeName(nameParts.slice(1, -1).join(' ')) : '';

    // Extract LinkedIn and GitHub URLs from all URLs found
    const allUrls = resume.profile.urls || [];
    console.log('All URLs from resume:', allUrls);
    
    // Find LinkedIn URL
    let linkedinUrl = allUrls.find(url => 
      url.toLowerCase().includes('linkedin.com/in/')
    ) || '';
    
    // If not found in urls array, check profile.url as fallback
    if (!linkedinUrl && resume.profile.url.toLowerCase().includes('linkedin')) {
      linkedinUrl = resume.profile.url;
    }
    
    // Ensure LinkedIn URL has https:// prefix
    if (linkedinUrl && !linkedinUrl.startsWith('http://') && !linkedinUrl.startsWith('https://')) {
      linkedinUrl = 'https://' + linkedinUrl;
    }
    
    // Find GitHub URL
    let githubUrl = allUrls.find(url => 
      url.toLowerCase().includes('github.com/')
    ) || '';
    
    // If not found in urls array, check profile.url as fallback
    if (!githubUrl && resume.profile.url.toLowerCase().includes('github')) {
      githubUrl = resume.profile.url;
    }
    
    // Ensure GitHub URL has https:// prefix
    if (githubUrl && !githubUrl.startsWith('http://') && !githubUrl.startsWith('https://')) {
      githubUrl = 'https://' + githubUrl;
    }
    
    console.log('LinkedIn URL:', linkedinUrl);
    console.log('GitHub URL:', githubUrl);

    // Use raw text from PDF for textCV (100% clone of PDF content)
    const textCV = resume.rawText || generateTextCV(resume);

    // Clean up profile summary - remove header text that shouldn't be there
    let cleanSummary = resume.profile.summary || '';
    // Remove name, title, contact info from summary if present at the start
    const summaryCleanupPatterns = [
      /^[A-Z\s]+\s+(FULL-STACK|SOFTWARE|SENIOR|JUNIOR|LEAD)\s+ENGINEER/i,
      /^[A-Z][a-z]+\s+[A-Z][a-z]+\s+(FULL-STACK|SOFTWARE)/i, // "Mohammed Taha FULL-STACK"
      new RegExp(`^${firstName}\\s+${lastName}`, 'i'),
      /^[A-Za-z\s]+\|[^|]+\|[^|]+\|[^|]+/, // "Name | email | linkedin | github"
      /SUMMARY/gi,
    ];
    summaryCleanupPatterns.forEach(pattern => {
      cleanSummary = cleanSummary.replace(pattern, '').trim();
    });
    // Remove leading/trailing pipes and clean up
    cleanSummary = cleanSummary.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').trim();

    // Extract and validate location
    let location = resume.profile.location || '';

    // If location exists, validate and capitalize it
    if (location) {
      const capitalizedLocation = capitalizeIndianCity(location);
      location = capitalizedLocation; // Will be empty string if not a valid Indian city
    }

    // If no valid location found, try to extract from summary
    if (!location) {
      // Try to extract location from summary or other text
      const locationMatch = cleanSummary.match(/^([A-Za-z\s-]+?)(?=\s*\||$)/i);
      if (locationMatch) {
        const potentialLocation = locationMatch[1].trim();
        const capitalizedLocation = capitalizeIndianCity(potentialLocation);
        if (capitalizedLocation) {
          location = capitalizedLocation;
          cleanSummary = cleanSummary.replace(new RegExp(`^${potentialLocation}\\s*\\|?\\s*`, 'i'), '').trim();
        }
      }
    }

    return {
      // Personal Details
      firstName,
      middleName,
      lastName,
      email: validateEmail(resume.profile.email || ''),
      phone: validateAndFormatPhone(resume.profile.phone || ''),
      location: location,
      linkedin_profile: linkedinUrl,
      github_profile: githubUrl,
      profile_summary: cleanSummary,

      // Skills - extract, clean, and deduplicate
      skills: (() => {
        console.log('=== SKILLS MAPPING DEBUG ===');
        console.log('Raw featuredSkills:', resume.skills.featuredSkills);
        console.log('Raw skill descriptions:', resume.skills.descriptions);

        const extractedSkills: Array<{ skill: string; rating: number }> = [];
        const seenSkills = new Set<string>(); // Track duplicates (case-insensitive)

        // Helper function to validate if text is a valid skill
        const isValidSkill = (text: string): boolean => {
          const trimmed = text.trim();

          // Reject empty strings
          if (!trimmed) return false;
          
          // Reject incomplete/broken skills (unbalanced parentheses)
          const openParens = (trimmed.match(/\(/g) || []).length;
          const closeParens = (trimmed.match(/\)/g) || []).length;
          if (openParens !== closeParens) return false;
          
          // Reject skills that start with closing paren or comma
          if (/^[),]/.test(trimmed)) return false;
          
          // Reject skills that end with opening paren or comma
          if (/[(,]$/.test(trimmed)) return false;

          // Reject URLs
          if (/https?:\/\/|www\.|github\.com|linkedin\.com|\.com\/|\.org\/|\.net\//i.test(trimmed)) {
            return false;
          }

          // Reject text that's too long (more than 5 words = probably a sentence)
          const wordCount = trimmed.split(/\s+/).length;
          if (wordCount > 5) return false;

          // Reject pure numbers or ratings like "4/5", "4", "123"
          if (/^[\d/\s]+$/.test(trimmed)) return false;

          // Reject very short single numbers
          if (/^\d+$/.test(trimmed) && trimmed.length <= 3) return false;
          
          // Reject text that looks like sentences (has common sentence patterns)
          const lowerText = trimmed.toLowerCase();
          const sentencePatterns = [
            /^(led|built|developed|designed|created|implemented|managed|achieved|worked|collaborated|delivered)/i,
            /\b(using|with|for|and|the|in|of|to|a|an)\b.*\b(using|with|for|and|the|in|of|to|a|an)\b/i,
            /\b(team|project|company|client|user|system|application|platform)\b/i,
            /\b(resulting|achieving|improving|increasing|reducing|delivering)\b/i,
            /\d+%/,
            /\d+\+/,
          ];
          if (sentencePatterns.some(pattern => pattern.test(lowerText))) {
            return false;
          }

          return true;
        };

        // Helper to add skill without duplicates
        const addSkill = (skill: string, rating: number = 4) => {
          const normalized = skill.trim();
          const key = normalized.toLowerCase();
          if (normalized && !seenSkills.has(key) && isValidSkill(normalized)) {
            seenSkills.add(key);
            extractedSkills.push({ skill: normalized, rating });
          }
        };

        // Helper function to parse skills from a text line
        const parseSkillLine = (text: string, rating: number = 4) => {
          // Remove bullet points and trim
          let cleanText = text.replace(/^[•●◦▪▫-]\s*/, '').trim();
          
          // Fix broken parentheses patterns like "AWS (EC2" or "Lambda)"
          // Try to merge with common AWS/CI patterns
          const brokenPatterns: Record<string, string> = {
            'AWS (EC2': 'AWS EC2',
            'S3': 'AWS S3',
            'Lambda)': 'AWS Lambda',
            'CI/CD Pipelines (GitHub': 'CI/CD Pipelines',
            'Actions, Jenkins), Terraform': 'GitHub Actions, Jenkins, Terraform',
            'Agile (Scrum': 'Agile/Scrum',
            'Kanban)': 'Kanban',
            'Google': 'Google Analytics', // Fix "Google" alone
            'Tag Manager': 'Google Tag Manager',
          };
          
          if (brokenPatterns[cleanText]) {
            cleanText = brokenPatterns[cleanText];
          }

          // Check if it's a category line (e.g., "Languages: Python, Java, JavaScript")
          if (cleanText.includes(':')) {
            const colonIndex = cleanText.indexOf(':');
            const skillsList = cleanText.substring(colonIndex + 1).trim();

            // Split skills by comma and extract individual skills
            skillsList
              .split(/[,;]/)
              .map(s => s.trim())
              .filter(s => s.length > 0 && s.length < 50)
              .forEach(skill => addSkill(skill, rating));
          } else if (cleanText.includes(',')) {
            // Multiple skills in one line separated by comma
            cleanText
              .split(/[,;]/)
              .map(s => s.trim())
              .filter(s => s.length > 0 && s.length < 50)
              .forEach(skill => addSkill(skill, rating));
          } else if (cleanText.length > 0 && cleanText.length < 50) {
            addSkill(cleanText, rating);
          }
        };

        // Parse featuredSkills
        resume.skills.featuredSkills.forEach(featuredSkill => {
          if (featuredSkill.skill && featuredSkill.skill.trim()) {
            parseSkillLine(featuredSkill.skill, featuredSkill.rating);
          }
        });

        // Parse skill descriptions
        if (resume.skills.descriptions && resume.skills.descriptions.length > 0) {
          resume.skills.descriptions.forEach(desc => {
            parseSkillLine(desc, 4);
          });
        }

        console.log('Extracted skills (deduplicated):', extractedSkills.length, extractedSkills);
        return extractedSkills;
      })(),

      // Education - clean and extract year properly
      education: resume.educations
        .filter(edu => {
          // Filter out certifications that got mixed into education
          const text = (edu.degree || '') + (edu.school || '');
          const isCertification = /certification|certificate|certified|employee of/i.test(text);
          return !isCertification && (edu.school || edu.degree);
        })
        .map(edu => {
          // Extract year from date field (e.g., "July 2017 - July 2021" -> "2021")
          let date = edu.date || '';
          const yearMatch = date.match(/(\d{4})\s*[-–]\s*(\d{4})|(\d{4})/g);
          if (yearMatch) {
            // Get the latest year (graduation year)
            const years = date.match(/\d{4}/g) || [];
            date = years.length > 0 ? years[years.length - 1] : '';
          }
          
          // Clean degree - remove date prefix if present
          let degree = edu.degree || '';
          degree = degree.replace(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s*[-–]\s*(January|February|March|April|May|June|July|August|September|October|November|December)?\s*\d{4}\s*/i, '').trim();
          
          return {
            school: edu.school || '',
            degree: degree,
            gpa: edu.gpa || '',
            date: date, // Now just the year
            descriptions: edu.descriptions || [],
          };
        }),

      // Work Experience - fix company/jobTitle extraction
      workExperience: resume.workExperiences.map(work => {
        let company = work.company || '';
        let jobTitle = work.jobTitle || '';
        let date = work.date || '';
        
        // If company looks like a date, try to extract from descriptions
        const datePattern = /^(January|February|March|April|May|June|July|August|September|October|November|December|\d{1,2}\/\d{4}|Q[1-4])\s*\d{0,4}\s*[-–]\s*(Present|\d{4}|January|February|March|April|May|June|July|August|September|October|November|December)/i;
        if (datePattern.test(company)) {
          date = company;
          company = ''; // Will try to extract from descriptions
          
          // Look for company name in descriptions (usually last line has job title)
          const descriptions = work.descriptions || [];
          if (descriptions.length > 0) {
            const lastDesc = descriptions[descriptions.length - 1];
            // Check if last description looks like a job title
            if (/^(Senior|Junior|Lead|Staff|Principal)?\s*(Software|Full[\s-]?Stack|Frontend|Backend|DevOps|Data|ML|AI)\s*(Engineer|Developer|Architect|Manager)/i.test(lastDesc)) {
              jobTitle = lastDesc;
              // Remove from descriptions
              descriptions.pop();
            }
          }
        }
        
        // If jobTitle is empty, try common patterns
        if (!jobTitle) {
          const titlePatterns = [
            /Senior Software Engineer/i,
            /Software Engineer/i,
            /Full[\s-]?Stack Engineer/i,
            /Full[\s-]?Stack Developer/i,
            /Frontend Engineer/i,
            /Backend Engineer/i,
            /Co-Founder.*Engineer/i,
          ];
          // Check descriptions for job title
          const descriptions = work.descriptions || [];
          for (let i = descriptions.length - 1; i >= 0; i--) {
            for (const pattern of titlePatterns) {
              if (pattern.test(descriptions[i])) {
                jobTitle = descriptions[i].match(pattern)?.[0] || descriptions[i];
                break;
              }
            }
            if (jobTitle) break;
          }
        }
        
        return {
          company: company,
          jobTitle: jobTitle,
          date: date,
          descriptions: work.descriptions || [],
        };
      }),

      // Projects
      projects: resume.projects.map(proj => ({
        project: proj.project || '',
        date: proj.date || '',
        descriptions: proj.descriptions || [],
      })),

      // Full resume text
      textCV,
    };
  } finally {
    // Clean up the blob URL
    URL.revokeObjectURL(fileUrl);
  }
}

/**
 * Generate raw text content from the entire resume
 * This captures 100% of the raw parsed data as plain text
 */
function generateTextCV(resume: Resume): string {
  const allText: string[] = [];
  console.log(resume, '=== FULL RESUME DATA FOR TEXT CV ===');
  
  // Profile section - raw data
  if (resume.profile.name) allText.push(resume.profile.name);
  
  // Contact info on same line
  const contactLine = [
    resume.profile.location,
    resume.profile.email,
    resume.profile.phone,
    resume.profile.url
  ].filter(Boolean).join(' | ');
  if (contactLine) allText.push(contactLine);
  
  if (resume.profile.summary) {
    allText.push(''); // Empty line before summary
    allText.push('SUMMARY');
    allText.push(resume.profile.summary);
  }

  // Work Experience - all raw text
  if (resume.workExperiences.length > 0) {
    allText.push(''); // Empty line
    allText.push('PROFESSIONAL EXPERIENCE');
    resume.workExperiences.forEach(work => {
      const titleLine = [work.jobTitle, work.company, work.date].filter(Boolean).join(' | ');
      if (titleLine) allText.push(titleLine);
      if (work.descriptions) {
        work.descriptions.forEach(desc => allText.push(`• ${desc}`));
      }
    });
  }

  // Education - all raw text
  if (resume.educations.length > 0) {
    allText.push(''); // Empty line
    allText.push('EDUCATION');
    resume.educations.forEach(edu => {
      const eduLine = [edu.degree, edu.school, edu.date].filter(Boolean).join(' | ');
      if (eduLine) allText.push(eduLine);
      if (edu.gpa) allText.push(`GPA: ${edu.gpa}`);
      if (edu.descriptions) {
        edu.descriptions.forEach(desc => allText.push(`• ${desc}`));
      }
    });
  }

  // Skills - all raw text
  const skillsList = resume.skills.featuredSkills
    .filter(s => s.skill && s.skill.trim())
    .map(s => s.skill);
  if (skillsList.length > 0 || (resume.skills.descriptions && resume.skills.descriptions.length > 0)) {
    allText.push(''); // Empty line
    allText.push('SKILLS');
    if (skillsList.length > 0) {
      allText.push(skillsList.join(', '));
    }
    if (resume.skills.descriptions) {
      resume.skills.descriptions.forEach(desc => allText.push(desc));
    }
  }

  // Projects - all raw text
  if (resume.projects.length > 0) {
    allText.push(''); // Empty line
    allText.push('PROJECTS');
    resume.projects.forEach(proj => {
      const projLine = [proj.project, proj.date].filter(Boolean).join(' | ');
      if (projLine) allText.push(projLine);
      if (proj.descriptions) {
        proj.descriptions.forEach(desc => allText.push(`• ${desc}`));
      }
    });
  }

  // Custom section - all raw text
  if (resume.custom && resume.custom.descriptions && resume.custom.descriptions.length > 0) {
    allText.push(''); // Empty line
    allText.push('OTHER');
    resume.custom.descriptions.forEach(desc => allText.push(desc));
  }

  // Join all text with NEWLINE separator (preserves structure)
  return allText.join('\n');
}

/**
 * Extract only the textCV (raw text content) from a resume file.
 * This is a lightweight function for use when updating an existing applicant's resume,
 * where we only need the text content without parsing all the structured data.
 * 
 * @param file - The PDF or DOCX file to extract text from
 * @returns The raw text content of the resume
 */
export async function extractTextCVFromResume(file: File): Promise<string> {
  const fileUrl = URL.createObjectURL(file);

  try {
    // Parse the file to get raw text
    const resume: Resume = await parseResumeFromPdf(fileUrl, file);
    
    // Return raw text from PDF, or generate it from parsed sections
    return resume.rawText || generateTextCV(resume);
  } finally {
    // Clean up the blob URL
    URL.revokeObjectURL(fileUrl);
  }
}

export type { Resume };
