import type { Line, Lines, ResumeSectionToLines } from './types';
import {
  hasLetterAndIsAllUpperCase,
  hasOnlyLettersSpacesAmpersands,
  isBold,
} from './extract-resume-from-sections/lib/common-features';
import { ResumeKey } from './resume-types';

export const PROFILE_SECTION: ResumeKey = 'profile';

/**
 * Step 3. Group lines into sections
 *
 * Every section (except the profile section) starts with a section title that
 * takes up the entire line. This is a common pattern not just in resumes but
 * also in books and blogs. The resume parser uses this pattern to group lines
 * into the closest section title above these lines.
 */
export const groupLinesIntoSections = (lines: Lines) => {
  let sections: ResumeSectionToLines = {};
  let sectionName: string = PROFILE_SECTION;
  let sectionLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line[0]?.text.trim();
    if (isSectionTitle(line, i)) {
      sections[sectionName] = [...sectionLines];
      sectionName = text;
      sectionLines = [];
    } else {
      sectionLines.push(line);
    }
  }
  if (sectionLines.length > 0) {
    sections[sectionName] = [...sectionLines];
  }
  return sections;
};

const SECTION_TITLE_PRIMARY_KEYWORDS = [
  'experience',
  'education',
  'project',
  'skill',
  'work',
  'employment',
  'professional',
  'career',
  'about',
  'contact',
];
const SECTION_TITLE_SECONDARY_KEYWORDS = [
  'job',
  'course',
  'extracurricular',
  'objective',
  'summary', // LinkedIn generated resume has a summary section
  'award',
  'honor',
  'project',
  'history',
  'qualification',
  'certification',
  'training',
  'achievement',
  'language',
  'interest',
  'hobby',
  'reference',
  'technical',
  'competenc',
  'proficienc',
  'expertise',
  'profile',
];
const SECTION_TITLE_KEYWORDS = [
  ...SECTION_TITLE_PRIMARY_KEYWORDS,
  ...SECTION_TITLE_SECONDARY_KEYWORDS,
];

const isSectionTitle = (line: Line, lineNumber: number) => {
  const hasNoItemInLine = line.length === 0;
  if (hasNoItemInLine) {
    return false;
  }

  const textItem = line[0];
  const text = textItem.text.trim();
  
  // Skip if text is too short or too long for a section title
  if (text.length < 3 || text.length > 50) {
    return false;
  }

  // Skip first line only if it looks like a name (single item, not a keyword)
  const isFirstLine = lineNumber === 0;
  if (isFirstLine && !SECTION_TITLE_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword))) {
    return false;
  }

  // Primary detection: bold AND all uppercase (strongest signal)
  if (isBold(textItem) && hasLetterAndIsAllUpperCase(textItem)) {
    return true;
  }

  // Secondary detection: either bold OR uppercase with keyword match
  const hasKeyword = SECTION_TITLE_KEYWORDS.some(keyword => text.toLowerCase().includes(keyword));
  const textHasAtMost4Words = text.split(' ').filter(s => s !== '&' && s !== '-').length <= 4;
  const startsWithCapitalLetter = /[A-Z]/.test(text.slice(0, 1));

  // All uppercase with keyword match (even without bold)
  if (hasLetterAndIsAllUpperCase(textItem) && hasKeyword && textHasAtMost4Words) {
    return true;
  }

  // Bold with keyword match (even without uppercase)
  if (isBold(textItem) && hasKeyword && textHasAtMost4Words) {
    return true;
  }

  // Fallback: keyword match with proper formatting (single line item, starts with capital)
  if (
    line.length === 1 &&
    textHasAtMost4Words &&
    hasOnlyLettersSpacesAmpersands(textItem) &&
    startsWithCapitalLetter &&
    hasKeyword
  ) {
    return true;
  }

  return false;
};
