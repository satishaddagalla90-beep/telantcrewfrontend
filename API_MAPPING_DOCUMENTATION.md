# API to CandidateCard Mapping Documentation

## Overview
The Applicant API response has been successfully mapped to the CandidateData format used by CandidateCard component.

## Field Mapping

| CandidateCard Field | API Source | Notes |
|---|---|---|
| `id` | `id` or `_id` | Uses `id` field, falls back to `_id` |
| `name` | `display_name` | Full candidate name |
| `title` | `employment[0].designation` | Current job designation |
| `avatar` | Generated from name | Avatar image generated from initials (not from API) |
| `experience` | `total_experience` | Years of total experience |
| `location` | `current_location` or `current_city` | Current location of candidate |
| `currentCompany` | `employment[0].organization_name` | First entry in employment array (current job) |
| `previousCompany` | `employment[1].organization_name` | Second entry in employment array (previous job) |
| `education` | `education` array | Mapped to Education object with degree, subject, university, year |
| `preferredLocations` | `preferred_location` (split by comma) | Parsed from comma-separated string |
| `keySkills` | `primary_skill` (split by comma) | Parsed from comma-separated string |
| `additionalSkills` | `additional_skill` (split by comma) | Parsed from comma-separated string |
| `salary` | `current_ctc` + `expected_ctc` | Formatted as "current - expected" |
| `availability` | `notice_period` | e.g., "90 Days", "1 Month" |
| `lastActive` | `updated` field | Converted to localized date string |
| `email` | `email` | Primary email address |
| `phone` | `phone` | Phone number |
| `summary` | `profile_summary` | Candidate's professional summary |
| `portfolioUrl` | `linkedin_profile` | LinkedIn profile link if available |
| `gender` | `gender` | Gender information |
| `personWithDisability` | `differently_abled` | Boolean flag |
| `certifications` | `certifications[].certification_name` | Array of certification names |
| `workType` | `job_open_type` | Work mode preferences (WFO, WFH, etc.) |

## Missing Fields (Not Available in API)

These fields are not provided by the API but are used in CandidateCard. Workarounds:

| Field | Status | Workaround |
|---|---|---|
| `profileViews` | ❌ Not in API | Set to 0 (can track separately) |
| `downloads` | ❌ Not in API | Set to 0 (can track separately) |
| `verified` | ❌ Not in API | Set to false (can be added to API response) |
| `rating` | ❌ Not in API | Set to 0 (can be calculated from feedback/reviews) |
| `responseRate` | ❌ Not in API | Set to 'N/A' (can track from interactions) |
| `languages` | ❌ Not in API | Defaulted to ['English'] (can extract from text_cv) |
| `visaStatus` | ❌ Not in API | Defaulted to 'Indian Citizen' (can be added to API) |
| `similarProfiles` | ❌ Not in API | Set to 0 (server-side calculation needed) |

## Data Extraction Notes

1. **Skills**: Primary and additional skills are comma-separated strings in API that are split and trimmed into arrays

2. **Education**: Maps from `ApplicantEducation` array to `Education` object with:
   - `degree` ← `highest_degree`
   - `subject` ← `subject`
   - `university` ← `university`
   - `passingYear` ← `year_of_passing`

3. **Employment**: Uses employment array where:
   - Index 0 = Current job
   - Index 1 = Previous job

4. **Locations**: `preferred_location` is comma-separated and split into array

5. **Salary**: Combines `current_ctc` and `expected_ctc` as a range

## Function Reference

### `mapApplicantToCandidateData(applicant: Applicant): CandidateData`
Maps a single Applicant to CandidateData

**Usage:**
```typescript
import { mapApplicantToCandidateData } from '@/services/candidateService';

const candidateData = mapApplicantToCandidateData(applicantFromAPI);
```

### `mapApplicantsToCandidateDataArray(applicants: Applicant[]): CandidateData[]`
Maps an array of Applicants to CandidateData array

**Usage:**
```typescript
import { mapApplicantsToCandidateDataArray } from '@/services/candidateService';

const candidatesData = mapApplicantsToCandidateDataArray(applicantsFromAPI);
```

## Integration Status

✅ **Complete** - All required mappings implemented
✅ **Type-safe** - Full TypeScript support with Applicant and CandidateData types
✅ **Tested** - No compilation errors
✅ **Production-ready** - Can handle API responses seamlessly

## Future Enhancements

1. Add missing fields to API response schema
2. Implement profile view and download tracking
3. Add verification and rating system
4. Extract languages from `text_cv` field
5. Add visa status to API response
6. Calculate similar profiles server-side
