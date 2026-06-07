import type { Resume } from '../resume-types';
import type { ResumeSectionToLines } from '../types';
import { extractProfile } from './extract-profile';
import { extractEducation } from './extract-education';
import { extractWorkExperience } from './extract-work-experience';
import { extractProject } from './extract-project';
import { extractSkills } from './extract-skills';

/**
 * Step 4. Extract resume from sections.
 *
 * This is the core of the resume parser to resume information from the sections.
 *
 * The gist of the extraction engine is a feature scoring system. Each resume attribute
 * to be extracted has a custom feature sets, where each feature set consists of a
 * feature matching function and a feature matching score if matched (feature matching
 * score can be a positive or negative number). To compute the final feature score of
 * a text item for a particular resume attribute, it would run the text item through
 * all its feature sets and sum up the matching feature scores. This process is carried
 * out for all text items within the section, and the text item with the highest computed
 * feature score is identified as the extracted resume attribute.
 */
export const extractResumeFromSections = (
  sections: ResumeSectionToLines
): Resume => {
  const { profile } = extractProfile(sections);
  const { educations } = extractEducation(sections);
  const { workExperiences } = extractWorkExperience(sections);
  const { projects } = extractProject(sections);
  const { skills } = extractSkills(sections);

  // Extract all other unprocessed sections (certifications, achievements, etc.)
  const processedSections = ['profile', 'education', 'workExperience', 'project', 'skills', 'work', 'experience'];
  const customDescriptions: string[] = [];

  Object.entries(sections).forEach(([sectionName, sectionLines]) => {
    // Check if this section hasn't been processed
    const isUnprocessed = !processedSections.some(processed =>
      sectionName.toLowerCase().includes(processed.toLowerCase())
    );

    if (isUnprocessed && sectionLines && sectionLines.length > 0) {
      // Add section name as a header
      customDescriptions.push(`[${sectionName}]`);

      // Extract all text from this section
      sectionLines.forEach(line => {
        const lineText = line.map(item => item.text).join(' ').trim();
        if (lineText) {
          customDescriptions.push(lineText);
        }
      });
    }
  });

  return {
    profile,
    educations,
    workExperiences,
    projects,
    skills,
    custom: {
      descriptions: customDescriptions,
    },
  };
};
