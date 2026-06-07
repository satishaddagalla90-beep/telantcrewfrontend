import type { TextItems } from './types';
import type { Resume } from './resume-types';

/**
 * Extract structured data from DOCX-based resumes that use label-value format
 *
 * This handles form-based resumes where data is in "Label: Value" format,
 * which is common in DOCX resumes converted to text.
 */
export const extractDocxData = (textItems: TextItems): Resume => {
  // Combine all text for pattern matching
  const allLines = textItems.map(item => item.text);

  console.log('=== DOCX DATA EXTRACTION ===');
  console.log('Total lines:', allLines.length);
  console.log('First 30 lines:', allLines.slice(0, 30));

  // Helper to find value after a label pattern
  const findValue = (patterns: string[]): string => {
    for (const pattern of patterns) {
      for (const line of allLines) {
        const regex = new RegExp(`${pattern}\\s*:\\s*(.+)`, 'i');
        const match = line.match(regex);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      }
    }
    return '';
  };

  // Helper to find all lines matching a pattern
  const findLines = (patterns: string[]): string[] => {
    const results: string[] = [];
    for (const pattern of patterns) {
      for (const line of allLines) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(line)) {
          results.push(line);
        }
      }
    }
    return results;
  };

  // Extract profile information
  const name = findValue([
    'Full Name as per PAN',
    'Full Name',
    'Candidate Name',
    'Name'
  ]) || '';

  const email = findValue([
    'Email ID',
    'Email',
    'E-mail'
  ]) || '';

  const phone = findValue([
    'Primary Phone',
    'Phone',
    'Mobile',
    'Contact'
  ]) || '';

  const location = findValue([
    'Current Location',
    'Location',
    'City'
  ]) || '';

  // Try to extract summary from Career Objective or Professional Summary
  let summary = findValue([
    'Career Objective',
    'Professional Summary',
    'Summary',
    'Objective'
  ]) || '';

  // If summary is just a line fragment, look for multi-line summary
  if (summary && summary.split(' ').length < 20) {
    const summaryIndex = allLines.findIndex(line =>
      /career objective|professional summary|objective/i.test(line)
    );
    if (summaryIndex >= 0 && summaryIndex + 1 < allLines.length) {
      // Combine next few lines that look like summary text
      const summaryLines: string[] = [];
      for (let i = summaryIndex + 1; i < Math.min(summaryIndex + 10, allLines.length); i++) {
        const line = allLines[i];
        // Stop at next section header (all caps, short, or has colon)
        if (line.match(/^[A-Z\s&]+$/) && line.length < 50) break;
        if (line.includes(':') && line.split(':')[0].length < 30) break;
        if (line.startsWith('•')) break;
        if (line.length > 30) {
          summaryLines.push(line);
        }
      }
      if (summaryLines.length > 0) {
        summary = summaryLines.join(' ');
      }
    }
  }

  // Extract education
  const degree = findValue([
    'Highest Degree',
    'Degree',
    'Education',
    'Qualification'
  ]) || '';

  const college = findValue([
    'College Name',
    'University Name',
    'University',
    'College'
  ]) || '';

  // Find education year - look for standalone year (4 digits) after education section
  let educationYear = '';
  const educationSectionIndex = allLines.findIndex(line =>
    /education\s*&\s*experience/i.test(line)
  );

  if (educationSectionIndex >= 0) {
    // Look for a line that's just a year (4 digits) within next 10 lines
    for (let i = educationSectionIndex; i < Math.min(educationSectionIndex + 10, allLines.length); i++) {
      const line = allLines[i];
      // Match lines like "Tenure (From & To): 2016" or just "2016"
      const yearMatch = line.match(/(?:tenure|year|passing).*?(\d{4})|^(\d{4})$/i);
      if (yearMatch && !line.includes('Oct') && !line.includes('Nov')) {
        educationYear = yearMatch[1] || yearMatch[2];
        break;
      }
    }
  }

  const educations = degree || college ? [{
    school: college,
    degree: degree,
    gpa: '',
    date: educationYear || findValue(['Year of Passing', 'Year', 'Graduation Year']) || '',
    descriptions: []
  }] : [];

  // Extract work experience
  const currentEmployer = findValue([
    'Current Employer',
    'Company',
    'Organization'
  ]) || '';

  const designation = findValue([
    'Designation',
    'Current Designation',
    'Role',
    'Position'
  ]) || '';

  const tenure = findValue([
    'Tenure \\(From & To\\)',
    'Tenure',
    'Experience Period',
    'Duration'
  ]) || '';

  // Look for work experience section
  const workExperiences: any[] = [];

  if (currentEmployer || designation) {
    workExperiences.push({
      company: currentEmployer,
      jobTitle: designation,
      date: tenure,
      descriptions: []
    });
  }

  // Try to find "Worked as..." patterns for additional work history
  const workedAsLines = findLines(['Worked as', 'Roles and Responsibilities']);
  workedAsLines.forEach(line => {
    // Parse "Worked as XXX in YYY from ZZZ"
    const match = line.match(/Worked as\s+(.+?)\s+in\s+(.+?)\s+from\s+(.+)/i);
    if (match) {
      workExperiences.push({
        company: match[2].trim(),
        jobTitle: match[1].trim(),
        date: match[3].trim(),
        descriptions: []
      });
    }
  });

  // Helper to validate skills
  const isValidSkill = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Reject URLs
    if (/https?:\/\/|www\.|github\.com|linkedin\.com|\.com\/|\.org\/|\.net\//i.test(trimmed)) {
      return false;
    }

    // Reject long text (more than 30 words)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 30) return false;

    // Reject pure numbers or ratings like "4/5", "4", "123"
    if (/^[\d\/\s]+$/.test(trimmed)) return false;

    // Reject very short single numbers
    if (/^\d+$/.test(trimmed) && trimmed.length <= 3) return false;

    // Reject form labels and common non-skill phrases
    const invalidPatterns = [
      /^(yes\/no|tenure|details|interviews?|immediate|going|subcon|fte|certification|pan|uan|no\/uan|other|information)$/i,
      /^certification\s+\d+$/i, // Certification 1, Certification 2, etc.
      /^\d{10}$/, // Phone numbers
      /^[A-Z][a-z]+\s+[A-Z][a-z]+$/, // Capitalized two-word names like "Mohammed Ahmed"
    ];

    return !invalidPatterns.some(pattern => pattern.test(trimmed));
  };

  // Extract skills
  // Look for skills section and extract bullet points or categorized skills
  const skillsStartIndex = allLines.findIndex(line =>
    /^(skills|technical skills|core competencies)/i.test(line.trim())
  );

  const featuredSkills: any[] = [];
  if (skillsStartIndex >= 0) {
    console.log('=== SKILLS EXTRACTION DEBUG ===');

    for (
      let i = skillsStartIndex + 1;
      i < Math.min(skillsStartIndex + 30, allLines.length);
      i++
    ) {
      const line = allLines[i];
      console.log(`Line ${i}:`, line);

      // Stop at "Other Information" or next major section
      if (
        line.match(/^(other information|professional summary|education|experience|objective|career|supplier)/i)
      ) {
        console.log('Stopping at section:', line);
        break;
      }

      // Case 1: Lines with colons like "AWS: 4/5" or "Languages: Python, Java"
      if (line.includes(':')) {
        const parts = line.split(':');

        if (parts.length === 2) {
          const category = parts[0].trim();
          const value = parts[1].trim();

          console.log('  Category:', category, '| Value:', value);

          // If value is just a rating (4/5), extract category as skill
          if (value.match(/^[\d\/\s]+$/)) {
            // Check if category contains comma-separated skills
            if (category.includes(',')) {
              const skills = category.split(',').map(s => s.trim()).filter(s => isValidSkill(s));
              console.log('  -> Adding comma-separated skills from category:', skills);
              skills.forEach(skill => {
                featuredSkills.push({ skill, rating: 4 });
              });
            } else if (isValidSkill(category) && category.length < 50) {
              console.log('  -> Adding category as skill:', category);
              featuredSkills.push({ skill: category, rating: 4 });
            }
          }
          // If value contains actual skills (comma-separated)
          else if (!value.match(/^(yes|no|na|fte|subcon)$/i)) {
            const skillList = value
              .split(',')
              .map(s => s.trim())
              .filter(s => isValidSkill(s));

            console.log('  -> Adding skills from value:', skillList);
            skillList.forEach(skill => {
              featuredSkills.push({ skill, rating: 4 });
            });
          }
        }
      }
      // Case 2: Lines without colons - check if they're valid skills
      else if (isValidSkill(line)) {
        console.log('  -> Adding line as skill:', line);
        featuredSkills.push({ skill: line.trim(), rating: 4 });
      }
    }

    console.log('Total skills extracted:', featuredSkills.length);
  }

  console.log('=== EXTRACTED DATA ===');
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Phone:', phone);
  console.log('Location:', location);
  console.log('Degree:', degree);
  console.log('College:', college);
  console.log('Current Employer:', currentEmployer);
  console.log('Designation:', designation);
  console.log('Featured Skills:', featuredSkills.length);

  return {
    profile: {
      name,
      email,
      phone,
      location,
      url: '',
      summary
    },
    educations,
    workExperiences,
    skills: {
      featuredSkills,
      descriptions: []
    },
    projects: [],
    custom: {
      descriptions: []
    }
  };
};
