import type {
  ResumeSectionToLines,
  TextItem,
  FeatureSet,
} from "../types";
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import {
  isBold,
  hasNumber,
  hasComma,
  hasLetter,
  hasLetterAndIsAllUpperCase,
} from "./lib/common-features";
import { getTextWithHighestFeatureScore } from "./lib/feature-scoring-system";

// Name - must look like a person's name (2-4 words, each capitalized)
export const matchOnlyLetterSpaceOrPeriod = (item: TextItem) =>
  item.text.match(/^[a-zA-Z\s.]+$/);

// Matches a proper name format: "FirstName LastName" or "First Middle Last"
const matchPersonName = (item: TextItem) => {
  const text = item.text.trim();
  const words = text.split(/\s+/);
  
  // Must be 2-4 words
  if (words.length < 2 || words.length > 4) return false;
  
  // Each word must start with a capital letter and be mostly letters
  const isValidNameWord = (word: string) => {
    if (word.length < 2) return false;
    // First letter must be capital
    if (!/^[A-Z]/.test(word)) return false;
    // Rest should be letters (allow . for initials like "J.")
    if (!/^[A-Za-z.]+$/.test(word)) return false;
    return true;
  };
  
  return words.every(isValidNameWord);
};

// Check if text looks like a job title or section header (not a name)
const looksLikeJobTitle = (item: TextItem) => {
  const text = item.text.toLowerCase();
  const jobTitleWords = [
    'engineer', 'developer', 'manager', 'director', 'analyst', 'designer',
    'architect', 'lead', 'senior', 'junior', 'intern', 'consultant',
    'specialist', 'coordinator', 'administrator', 'executive', 'officer',
    'devops', 'frontend', 'backend', 'fullstack', 'full-stack', 'software',
    'data', 'product', 'project', 'program', 'technical', 'solutions'
  ];
  return jobTitleWords.some(word => text.includes(word));
};

// Check if text looks like a section header
const looksLikeSectionHeader = (item: TextItem) => {
  const text = item.text.toLowerCase().trim();
  const headers = [
    'about', 'contact', 'skills', 'experience', 'education', 'projects',
    'summary', 'objective', 'profile', 'certifications', 'languages',
    'interests', 'references', 'achievements', 'awards', 'technical'
  ];
  return headers.some(h => text === h || text === h + 's');
};



// Email
// Simple email regex: xxx@xxx.xxx (xxx = anything not space)
export const matchEmail = (item: TextItem) => item.text.match(/\S+@\S+\.\S+/);
const hasAt = (item: TextItem) => item.text.includes("@");

// Phone
// Phone regex that matches:
// - US format: (xxx)-xxx-xxxx where () and - are optional
// - International format: +XX XXXXX XXXXX or +XX-XXXXX-XXXXX
// - Plain 10 digits: 1234567890 or with spaces/dashes
export const matchPhone = (item: TextItem) =>
  item.text.match(/(\+\d{1,3}[\s-]?\d{3,5}[\s-]?\d{3,5}[\s-]?\d{0,5})|(\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4})/);

// Match plain 10-digit number (common in India and other countries)
const matchPlain10Digits = (item: TextItem) =>
  item.text.match(/\b\d{10}\b/);

// Match 10 digits with spaces or dashes (e.g., "123 456 7890" or "123-456-7890")
const matchSpaced10Digits = (item: TextItem) =>
  item.text.match(/\b\d{3}[\s-]\d{3}[\s-]\d{4}\b/);

const hasParenthesis = (item: TextItem) => /\([0-9]+\)/.test(item.text);

// Location
// Location regex that matches:
// - US format: "<City>, <ST>" (e.g., "New York, NY")
// - International format: "<City>, <Country>" (e.g., "Hyderabad, India")
// - Single city with pipe: "Hyderabad |" or "| Hyderabad"
export const matchCityAndState = (item: TextItem) =>
  item.text.match(/^[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]*$/);

// Match single city names (common Indian/US cities)
const matchSingleCity = (item: TextItem) => {
  const text = item.text.trim();
  const cities = [
    'Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Chennai', 'Pune', 
    'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore',
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Seattle', 'Austin',
    'Boston', 'Denver', 'Atlanta', 'Dallas', 'Houston', 'Miami', 'Phoenix',
    'London', 'Dubai', 'Singapore', 'Toronto', 'Sydney', 'Berlin', 'Paris'
  ];
  // Match city name possibly followed by |
  const pattern = new RegExp(`^(${cities.join('|')})\\s*(\\||$)`, 'i');
  return text.match(pattern);
};

// Check if text looks like programming languages/tech (not a location)
const looksLikeTech = (item: TextItem) => {
  const text = item.text.toLowerCase();
  const techWords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue',
    'node', 'express', 'django', 'flask', 'ruby', 'rust', 'go', 'kotlin',
    'swift', 'dart', 'flutter', 'css', 'html', 'sql', 'mongodb', 'aws',
    'azure', 'docker', 'kubernetes', 'git', 'api', 'graphql'
  ];
  return techWords.some(tech => text.includes(tech));
};
// Url
// Simple url regex that matches "xxx.xxx/xxx" (xxx = anything not space)
export const matchUrl = (item: TextItem) => item.text.match(/\S+\.[a-z]+\/\S+/);
// Match https://xxx.xxx where s is optional
const matchUrlHttpFallback = (item: TextItem) =>
  item.text.match(/https?:\/\/\S+\.\S+/);
// Match www.xxx.xxx
const matchUrlWwwFallback = (item: TextItem) =>
  item.text.match(/www\.\S+\.\S+/);
const hasSlash = (item: TextItem) => item.text.includes("/");

// Summary
const has4OrMoreWords = (item: TextItem) => item.text.split(" ").length >= 4;

/**
 *              Unique Attribute
 * Name         Bold or Has all uppercase letter
 * Email        Has @
 * Phone        Has ()
 * Location     Has ,    (overlap with summary)
 * Url          Has slash
 * Summary      Has 4 or more words
 */

/**
 * Name -> contains only letters/space/period, e.g. Leonardo W. DiCaprio
 *         (it isn't common to include middle initial in resume)
 *      -> is bolded or has all letters as uppercase
 *      -> looks like a proper name (2-4 capitalized words)
 *      -> is NOT a job title or section header
 */
const NAME_FEATURE_SETS: FeatureSet[] = [
  [matchPersonName, 4], // Strong signal: looks like "First Last" format
  [matchOnlyLetterSpaceOrPeriod, 2, true],
  [isBold, 2],
  [hasLetterAndIsAllUpperCase, 1],
  // Negative signals - NOT a name
  [looksLikeJobTitle, -4], // DevOps, Software Engineer, etc.
  [looksLikeSectionHeader, -4], // About, Skills, etc.
  [hasAt, -4], // Email
  [hasNumber, -4], // Phone
  [hasParenthesis, -4], // Phone
  [hasComma, -4], // Location
  [hasSlash, -4], // Url
  [has4OrMoreWords, -3], // Summary (names are 2-4 words max)
];

// Email -> match email regex xxx@xxx.xxx
const EMAIL_FEATURE_SETS: FeatureSet[] = [
  [matchEmail, 4, true],
  [isBold, -1], // Name
  [hasLetterAndIsAllUpperCase, -1], // Name
  [hasParenthesis, -4], // Phone
  [hasComma, -4], // Location
  [hasSlash, -4], // Url
  [has4OrMoreWords, -4], // Summary
];

// Phone -> match phone regex (xxx)-xxx-xxxx or plain 10 digits
const PHONE_FEATURE_SETS: FeatureSet[] = [
  [matchPhone, 4, true],
  [matchPlain10Digits, 4, true], // Plain 10 digits like 9876543210
  [matchSpaced10Digits, 4, true], // Spaced like 987 654 3210
  [hasLetter, -4], // Name, Email, Location, Url, Summary
];

// Location -> match location regex <City>, <ST> or single city
const LOCATION_FEATURE_SETS: FeatureSet[] = [
  [matchCityAndState, 4, true],
  [matchSingleCity, 3, true], // Single city names like "Hyderabad"
  [looksLikeTech, -4], // Tech words are not locations
  [isBold, -1], // Name
  [hasAt, -4], // Email
  [hasParenthesis, -3], // Phone
  [hasSlash, -4], // Url
];

// URL -> match url regex xxx.xxx/xxx
const URL_FEATURE_SETS: FeatureSet[] = [
  [matchUrl, 4, true],
  [matchUrlHttpFallback, 3, true],
  [matchUrlWwwFallback, 3, true],
  [isBold, -1], // Name
  [hasAt, -4], // Email
  [hasParenthesis, -3], // Phone
  [hasComma, -4], // Location
  [has4OrMoreWords, -4], // Summary
];

// Summary -> has 4 or more words
const SUMMARY_FEATURE_SETS: FeatureSet[] = [
  [has4OrMoreWords, 4],
  [isBold, -1], // Name
  [hasAt, -4], // Email
  [hasParenthesis, -3], // Phone
  [matchCityAndState, -4, false], // Location
];

export const extractProfile = (sections: ResumeSectionToLines) => {
  // Try multiple sources for profile information
  // 1. Dedicated 'profile' section
  // 2. 'about' section (common in sidebar layouts)
  // 3. 'contact' section
  // 4. First few lines from the resume
  
  let lines = sections.profile || [];
  
  // Check for 'about' or 'contact' sections which often contain profile info
  if (lines.length === 0) {
    for (const sectionName of Object.keys(sections)) {
      const lowerName = sectionName.toLowerCase();
      if (lowerName.includes('about') || lowerName.includes('contact')) {
        lines = sections[sectionName] || [];
        if (lines.length > 0) break;
      }
    }
  }
  
  // Fallback: if no profile section, use first few lines from any section
  // Profile info is typically at the top of the resume
  if (lines.length === 0) {
    // Collect first 15 lines from all sections
    const allLines = Object.values(sections).flat();
    lines = allLines.slice(0, Math.min(15, allLines.length));
  }
  
  // Also collect all text items from all sections for fallback extraction
  const allTextItems = Object.values(sections).flat().flat();
  const textItems = lines.flat();

  console.log('=== PROFILE EXTRACTION DEBUG ===');
  console.log('Profile section lines:', lines.length);
  console.log('Profile text items:', textItems.length);
  console.log('All text items:', allTextItems.length);
  console.log('First 15 text items:', textItems.slice(0, 15).map(i => `"${i.text}"`));
  console.log('All first 15 items:', allTextItems.slice(0, 15).map(i => `"${i.text}"`));

  // For name, look in profile section first, then all items
  let [name, nameScores] = getTextWithHighestFeatureScore(
    textItems,
    NAME_FEATURE_SETS
  );
  
  console.log('Initial name from profile section:', name);
  console.log('Name scores (top 10):', nameScores.slice(0, 10).map(s => `${s.text}: ${s.score}`));
  
  // If name looks wrong (too short, is a section title, job title, etc.), try all items
  const nameIsInvalid = !name || 
    name.length < 3 || 
    /^(about|contact|skills|experience|education|devops|software|senior|junior)$/i.test(name) ||
    looksLikeJobTitle({ text: name } as TextItem) ||
    looksLikeSectionHeader({ text: name } as TextItem);
    
  if (nameIsInvalid) {
    console.log('Name from profile section looks wrong, trying all items');
    [name, nameScores] = getTextWithHighestFeatureScore(
      allTextItems,
      NAME_FEATURE_SETS
    );
    console.log('Name from all items:', name);
  }

  console.log('Final name extracted:', name);
  console.log('Top 5 name candidates:', nameScores.slice(0, 5).map(s => `${s.text}: ${s.score}`));
  
  // For email and phone, search all items since they might be in sidebar
  const [email, emailScores] = getTextWithHighestFeatureScore(
    allTextItems,
    EMAIL_FEATURE_SETS
  );
  const [phone, phoneScores] = getTextWithHighestFeatureScore(
    allTextItems,
    PHONE_FEATURE_SETS
  );
  
  // For location and URL, search all items
  const [location, locationScores] = getTextWithHighestFeatureScore(
    allTextItems,
    LOCATION_FEATURE_SETS
  );
  const [url, urlScores] = getTextWithHighestFeatureScore(
    allTextItems,
    URL_FEATURE_SETS
  );
  
  // Extract ALL URLs from text items (for LinkedIn, GitHub, portfolio, etc.)
  const allUrls: string[] = [];
  allTextItems.forEach(item => {
    const text = item.text;
    // Match various URL patterns
    const urlPatterns = [
      /https?:\/\/[^\s]+/gi,  // Full URLs with http/https
      /www\.[^\s]+/gi,         // URLs starting with www
      /linkedin\.com\/in\/[^\s|,]+/gi,  // LinkedIn profile URLs
      /github\.com\/[^\s|,]+/gi,         // GitHub profile URLs
    ];
    
    urlPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up the URL (remove trailing punctuation)
          const cleanUrl = match.replace(/[.,;:!?)]+$/, '');
          if (!allUrls.includes(cleanUrl)) {
            allUrls.push(cleanUrl);
          }
        });
      }
    });
  });
  
  console.log('All URLs found:', allUrls);
  
  // For summary, try dedicated sections first, then profile section
  const summaryLines = getSectionLinesByKeywords(sections, ["summary", "about", "objective", "profile"]);
  let summarySection = summaryLines
    .flat()
    .map((textItem) => textItem.text)
    .join(" ")
    .trim();
  
  // If no dedicated summary section, look for multi-word text in profile
  if (!summarySection || summarySection.split(' ').length < 10) {
    const [summary] = getTextWithHighestFeatureScore(
      textItems,
      SUMMARY_FEATURE_SETS,
      undefined,
      true
    );
    if (summary && summary.split(' ').length > (summarySection?.split(' ').length || 0)) {
      summarySection = summary;
    }
  }

  return {
    profile: {
      name,
      email,
      phone,
      location,
      url,
      urls: allUrls, // All URLs found (LinkedIn, GitHub, portfolio, etc.)
      summary: summarySection || '',
    },
    // For debugging
    profileScores: {
      name: nameScores,
      email: emailScores,
      phone: phoneScores,
      location: locationScores,
      url: urlScores,
    },
  };
};
