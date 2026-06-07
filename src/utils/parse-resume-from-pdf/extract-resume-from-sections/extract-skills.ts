import type { ResumeSkills, ResumeFeaturedSkill } from '../resume-types';
import type { ResumeSectionToLines } from '../types';
import { getSectionLinesByKeywords } from './lib/get-section-lines';
import {
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
} from './lib/bullet-points';

// Initial featured skills with default ratings
const initialFeaturedSkills: ResumeFeaturedSkill[] = Array.from(
  { length: 6 },
  () => ({
    skill: '',
    rating: 4,
  })
);

export const extractSkills = (sections: ResumeSectionToLines) => {
  // Broader keyword matching for skills sections
  const skillKeywords = ['skill', 'technical', 'competenc', 'proficienc', 'expertise', 'technology', 'tool'];
  const lines = getSectionLinesByKeywords(sections, skillKeywords);
  const descriptionsLineIdx = getDescriptionsLineIdx(lines) ?? 0;
  const descriptionsLines = lines.slice(descriptionsLineIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  const featuredSkills = JSON.parse(
    JSON.stringify(initialFeaturedSkills)
  ) as ResumeFeaturedSkill[];
  if (descriptionsLineIdx !== 0) {
    const featuredSkillsLines = lines.slice(0, descriptionsLineIdx);
    const featuredSkillsTextItems = featuredSkillsLines
      .flat()
      .filter(item => item.text.trim())
      .slice(0, 6);
    for (let i = 0; i < featuredSkillsTextItems.length; i++) {
      featuredSkills[i].skill = featuredSkillsTextItems[i].text;
    }
  }

  const skills: ResumeSkills = {
    featuredSkills,
    descriptions,
  };

  return { skills };
};
