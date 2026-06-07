# Filter Integration Summary

## API Integration Completed for `/candidates/` endpoint

### Updated Filter Mappings:

1. **search** → `search` (searches Display_Name, Username, Email, First_Name, Last_Name, SkillSets)
2. **candidateId** → `candidate_id` (Filter by candidate_id) - NEW FILTER ADDED
3. **panNumber** → `pan_number` (Filter by PAN Number)
4. **email** → `email` (Filter by Email)
5. **phone** → `phone` (Filter by Phone Number)
6. **flagType** → `flags` (Filter by Flags)
7. **organisation** → `organization_name` (Filter by current_organization)
8. **experienceMin** → `min` (Filter by min_exp)
9. **experienceMax** → `max` (Filter by max_exp)
10. **location** → `current_location` (Filter by current_location)
11. **skills** → `Skill` (Filter by skill_name)
12. **noticePeriod** → `notice_period` (Filter by notice_period)
13. **createdDate** → `created` (Filter by created date)

### Changes Made:

1. **API Parameter Mapping**: Updated the `apiUrl` useMemo hook to use the correct API parameter names as per the `/candidates/` endpoint specification.

2. **Filter State**: 
   - Removed `applicantStatus` (not supported by API)
   - Added `candidateId` filter for candidate ID search

3. **Async Search Handlers**: Updated all async search handlers to:
   - Use the API endpoint instead of dropdown APIs where applicable
   - Extract unique values from API responses
   - Use correct parameter names for API calls

4. **New Handlers Added**:
   - `handleCandidateIdSearch`: Search by candidate_id
   - Updated `performOrganisationSearch`: Uses API to get unique organizations
   - Updated `performLocationSearch`: Uses API to get unique locations  
   - Updated `performSkillSearch`: Uses API to get unique skills
   - Updated `performFlagTypeSearch`: Uses API to get unique flags

5. **Filter Clear Function**: Updated to include the new `candidateId` field

### Benefits:

- All filters now use the actual API parameters
- Real-time search pulls data directly from the database
- Consistent filtering experience across all filter types
- Added candidate ID search capability
- Improved performance by using API search instead of client-side filtering

### API Compatibility:
✅ All filter parameters now match the `/candidates/` API specification
✅ Proper parameter names for search functionality
✅ Support for all documented filter types
✅ Date filtering support for created date
✅ Range filtering for experience (min/max)