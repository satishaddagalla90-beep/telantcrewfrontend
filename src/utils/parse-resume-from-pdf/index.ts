import { readPdf } from "./read-pdf";
import { readDocx, extractRawTextFromDocx } from "./read-docx";
import { groupTextItemsIntoLines } from "./group-text-items-into-lines";
import { groupLinesIntoSections } from "./group-lines-into-sections";
import { extractResumeFromSections } from "./extract-resume-from-sections";
import { extractDocxData } from "./extract-docx-data";
import { detectAndSplitColumns } from "./detect-columns";
import type { TextItems } from "./types";
import type { Resume } from "./resume-types";

/**
 * Resume parser util that parses a resume from a PDF or DOCX file
 *
 * Supports both single-column and multi-column resumes!
 */
export const parseResumeFromPdf = async (fileUrl: string, file?: File) => {
  let textItems: TextItems;
  let rawText: string;

  // Step 1. Determine file type and read accordingly
  const isDocx = file?.name.toLowerCase().endsWith('.docx');

  if (isDocx && file) {
    console.log('=== DOCX PARSING DEBUG ===');
    // Read DOCX file
    textItems = await readDocx(file);
    rawText = await extractRawTextFromDocx(file);
    console.log('Step 1 - Total text items read from DOCX:', textItems.length);
    console.log('First 10 items:', textItems.slice(0, 10).map(i => i.text));
    console.log('Raw text length:', rawText.length);

    // Use specialized DOCX extraction for form-based resumes
    const docxData = extractDocxData(textItems);

    console.log('Step 4 - DOCX Resume extracted');
    console.log('Profile:', docxData.profile);
    console.log('Educations:', docxData.educations.length);
    console.log('Work Experiences:', docxData.workExperiences.length);
    console.log('Skills:', docxData.skills.featuredSkills.length);
    console.log('Projects:', docxData.projects.length);

    // Return early with DOCX-specific extraction
    return {
      ...docxData,
      rawText
    } as Resume & { rawText: string };
  } else {
    console.log('=== PDF PARSING DEBUG ===');
    // Read PDF file
    try {
      textItems = await readPdf(fileUrl);
    } catch (error) {
      console.error('Error reading PDF:', error);
      throw new Error(`Failed to read PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    console.log('Step 1 - Total text items read:', textItems.length);
    
    if (textItems.length === 0) {
      console.warn('WARNING: No text items extracted from PDF. The PDF might be image-based or corrupted.');
      // Return empty resume structure
      return {
        profile: { name: '', email: '', phone: '', location: '', url: '', summary: '' },
        educations: [],
        workExperiences: [],
        projects: [],
        skills: { featuredSkills: [], descriptions: [] },
        custom: { descriptions: [] },
        rawText: ''
      } as Resume & { rawText: string };
    }
    
    console.log('First 10 items:', textItems.slice(0, 10).map(i => i.text));
    console.log('Last 10 items:', textItems.slice(-10).map(i => i.text));

    // Step 1.5. Detect and handle multi-column layouts (PDF only)
    console.log('Step 1.5 - Detecting columns...');
    textItems = detectAndSplitColumns(textItems);
    console.log('After column detection - items reordered');
  }

  // Step 2. Group text items into lines
  const lines = groupTextItemsIntoLines(textItems);
  console.log('Step 2 - Total lines created:', lines.length);
  console.log('First 5 lines:', lines.slice(0, 5).map(line => line.map(i => i.text).join(' ')));
  console.log('Last 5 lines:', lines.slice(-5).map(line => line.map(i => i.text).join(' ')));

  // Generate rawText from lines (preserves proper line breaks)
  // Each line's text items are joined with space, lines are joined with newline
  rawText = lines.map(line => line.map(item => item.text).join(' ')).join('\n');
  console.log('Raw text generated with line breaks, length:', rawText.length);

  // Step 3. Group lines into sections
  const sections = groupLinesIntoSections(lines);
  console.log('Step 3 - Sections detected:', Object.keys(sections));
  Object.entries(sections).forEach(([key, sectionLines]) => {
    console.log(`  ${key}: ${sectionLines.length} lines`);
  });

  // Step 4. Extract resume from sections
  const resume = extractResumeFromSections(sections);
  console.log('Step 4 - Resume extracted');
  console.log('Profile:', resume.profile);
  console.log('Educations:', resume.educations.length);
  console.log('Work Experiences:', resume.workExperiences.length);
  console.log('Skills:', resume.skills.featuredSkills.filter(s => s.skill).length);
  console.log('Projects:', resume.projects.length);

  // Add raw text to resume object
  return {
    ...resume,
    rawText, // 100% raw PDF text, unprocessed
  };
};
