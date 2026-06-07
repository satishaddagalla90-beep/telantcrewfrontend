import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../atoms/Button';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import Dropdown from '../../atoms/Dropdown';
import Checkbox from '../../atoms/Checkbox';
import Modal from '../../atoms/Modal';
import TextArea from '../../atoms/TextArea';
import Pagination from '../../molecules/Pagination/Pagination';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import PageLayout from '../../templates/PageLayout/PageLayout';
import { mockCandidatesData, CandidateData, Education } from './types';
import CandidateCard from './CandidateCard';
import CandidateSearchModal, { CandidateSearchFilters } from '../../organisms/CandidateSearchModal/CandidateSearchModal';
import { useDropdownData, useLocationsDropdown, useCustomersDropdown, useEmployersDropdown,  } from '../../../hooks';
import { searchCandidates } from '../../../services/candidateService';
import { useDesignationsDropdown } from '../../../hooks/useDropdowns';

// Helper function to get searchable education text
const getEducationSearchText = (education: string | Education | Education[]): string => {
    if (typeof education === 'string') {
        return education;
    }
    if (Array.isArray(education)) {
        return education
            .map(edu => `${edu.degree} ${edu.subject} ${edu.university} ${edu.passingYear}`)
            .join(' ');
    }
    return `${education.degree} ${education.subject} ${education.university} ${education.passingYear}`;
};

const CandidateSearch: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    // State
    const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [candidateComments, setCandidateComments] = useState<Record<string, string>>({});
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentDraft, setCommentDraft] = useState('');
    const [activeCommentCandidate, setActiveCommentCandidate] = useState<{ id: string; name: string } | null>(null);
    const [activeIn, setActiveIn] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [pageSize, setPageSize] = useState('10');
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        keywords: true,
        company: true,
        contact: true,
        customerName: true,
        location: true,
        experience: true,
        salary: true,
        designation: true,
        gender: true,
    });
    const [locationFilter, setLocationFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');
    const [keywordFilter, setKeywordFilter] = useState('');
    const [excludeKeywordFilter, setExcludeKeywordFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [designationFilter, setDesignationFilter] = useState('');
    const [contactFilter, setContactFilter] = useState('');
    const [customerNameFilter, setCustomerNameFilter] = useState('');
    const [experienceMinFilter, setExperienceMinFilter] = useState('');
    const [experienceMaxFilter, setExperienceMaxFilter] = useState('');
    const [salaryMinFilter, setSalaryMinFilter] = useState('');
    const [salaryMaxFilter, setSalaryMaxFilter] = useState('');
    const [noticePeriodFilter, setNoticePeriodFilter] = useState<string[]>([]);
    const [hideProfiles, setHideProfiles] = useState(false);
    const [premiumInstituteOnly, setPremiumInstituteOnly] = useState(false);
    
    // API state
    const [apiCandidates, setApiCandidates] = useState<any[]>([]);
    const [isLoadingApi, setIsLoadingApi] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [totalResults, setTotalResults] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [useApiData, setUseApiData] = useState(false);
    
    const { options: locationOptions, loading: locationLoading, search: searchLocations } = useLocationsDropdown();
    const { options: genderOptions, loading: genderLoading } = useDropdownData('gender');
    const { options: customerOptions, loading: customersLoading, search: searchCustomers } = useCustomersDropdown();
    const { options: employerOptions, loading: employersLoading, search: searchEmployers } = useEmployersDropdown();
    const { options: designationOptions, loading: designationLoading, error: designationError, search: searchDesignations } = useDesignationsDropdown();
    
    // Extract all filters from URL parameters
    const query = searchParams.get('query') || '';
    const booleanMode = searchParams.get('boolean') === 'true';
    const scope = searchParams.get('scope') || 'all';
    const clientId = searchParams.get('client') || '';
    const keywordsParam = searchParams.get('keywords') || '';
    const excludeKeywordsParam = searchParams.get('exclude_keywords') || '';
    const companyParam = searchParams.get('company') || '';
    const contactParam = searchParams.get('contact') || '';
    const customerNameParam = searchParams.get('customer_name') || '';
    const designationParam = searchParams.get('designation') || '';
    const minExp = searchParams.get('exp_min') ? parseFloat(searchParams.get('exp_min')!) : undefined;
    const maxExp = searchParams.get('exp_max') ? parseFloat(searchParams.get('exp_max')!) : undefined;
    const minSal = searchParams.get('sal_min') ? parseFloat(searchParams.get('sal_min')!) : undefined;
    const maxSal = searchParams.get('sal_max') ? parseFloat(searchParams.get('sal_max')!) : undefined;
    const currentLocation = searchParams.get('current_loc') || '';
    const prefLocsStr = searchParams.get('pref_locs') || '';
    const prefLocations = useMemo(() => prefLocsStr ? prefLocsStr.split(',') : [], [prefLocsStr]);
    const eduStr = searchParams.get('edu') || '';
    const educationFilters = useMemo(() => eduStr ? eduStr.split(',') : [], [eduStr]);
    const noticeStr = searchParams.get('notice') || '';
    const noticePeriodFilters = useMemo(() => noticeStr ? noticeStr.split(',') : [], [noticeStr]);
    const preferredJob = searchParams.get('job') || '';
    const jobTypeStr = searchParams.get('job_type') || '';
    const jobTypeFilters = useMemo(() => jobTypeStr ? jobTypeStr.split(',') : [], [jobTypeStr]);
    const jobOpenType = searchParams.get('job_open_type') || '';
    const genderParam = searchParams.get('gender') || '';
    const isPersonWithDisability = searchParams.get('pwd') === 'true';
    const hideProfilesParam = searchParams.get('hide_profiles') === 'true';
    const premiumInstituteParam = searchParams.get('premium_institute') === 'true';
    const modifiedIn = searchParams.get('modified') || '';
    const createdIn = searchParams.get('created') || '';

    // Initialize sidebar filters from URL params
    useEffect(() => {
        setKeywordFilter(keywordsParam || '');
    }, [keywordsParam]);

    useEffect(() => {
        setExcludeKeywordFilter(excludeKeywordsParam || '');
    }, [excludeKeywordsParam]);

    useEffect(() => {
        setCompanyFilter(companyParam || '');
    }, [companyParam]);

    useEffect(() => {
        setContactFilter(contactParam || '');
    }, [contactParam]);

    useEffect(() => {
        setCustomerNameFilter(customerNameParam || '');
    }, [customerNameParam]);

    useEffect(() => {
        setDesignationFilter(designationParam || '');
    }, [designationParam]);

    useEffect(() => {
        setLocationFilter(currentLocation || '');
    }, [currentLocation]);

    useEffect(() => {
        setGenderFilter(genderParam || '');
    }, [genderParam]);

    useEffect(() => {
        const notices = noticeStr ? noticeStr.split(',') : [];
        setNoticePeriodFilter(notices);
    }, [noticeStr]);

    useEffect(() => {
        setHideProfiles(hideProfilesParam);
    }, [hideProfilesParam]);

    useEffect(() => {
        setPremiumInstituteOnly(premiumInstituteParam);
    }, [premiumInstituteParam]);

    useEffect(() => {
        setExperienceMinFilter(minExp ? minExp.toString() : '');
    }, [minExp]);

    useEffect(() => {
        setExperienceMaxFilter(maxExp ? maxExp.toString() : '');
    }, [maxExp]);

    useEffect(() => {
        setSalaryMinFilter(minSal ? minSal.toString() : '');
    }, [minSal]);

    useEffect(() => {
        setSalaryMaxFilter(maxSal ? maxSal.toString() : '');
    }, [maxSal]);

    const initialModalFilters = useMemo<CandidateSearchFilters>(() => ({
        booleanQuery: query || undefined,
        booleanSearchEnabled: booleanMode,
        searchScope: scope || undefined,
        clientId: clientId || undefined,
        minExperience: minExp,
        maxExperience: maxExp,
        minSalary: minSal,
        maxSalary: maxSal,
        currentLocation: currentLocation || undefined,
        preferredLocations: prefLocations,
        education: educationFilters,
        noticePeriod: noticePeriodFilters,
        preferredJob: preferredJob || undefined,
        jobType: jobTypeFilters,
        jobOpenType: jobOpenType || undefined,
        gender: genderParam || undefined,
        personWithDisability: isPersonWithDisability,
        modifiedIn: modifiedIn || undefined,
        createdIn: createdIn || undefined,
    }), [
        query, booleanMode, scope, clientId, minExp, maxExp, minSal, maxSal,
        currentLocation, prefLocations, educationFilters, noticePeriodFilters,
        preferredJob, jobTypeFilters, jobOpenType, genderParam, isPersonWithDisability, modifiedIn, createdIn
    ]);

    const getDaysSince = (value?: string): number | undefined => {
        if (!value) return undefined;
        const numeric = Number(value);
        if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
            return Math.max(0, Math.floor(numeric));
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return undefined;
        const diffMs = Date.now() - date.getTime();
        return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    };

    // Get query terms for display
    const queryTerms = useMemo(() => {
        const terms = [];
        
        // Only show boolean/simple search title and the actual query
        if (query && query.trim()) {
            const searchType = booleanMode ? 'Boolean Search' : 'Simple Search';
            terms.push(searchType);
            // Add the full query with all operators preserved
            terms.push(query);
        }
        
        return terms;
    }, [query, booleanMode]);

    // Fetch candidates from API when there's a search query
    useEffect(() => {
        const fetchCandidatesFromApi = async () => {
            // Only fetch from API if there's a query
            if (!query || !query.trim()) {
                setUseApiData(false);
                setApiCandidates([]);
                setApiError(null);
                return;
            }

            setIsLoadingApi(true);
            setApiError(null);

            try {
                const response = await searchCandidates({
                    search: query,
                    isBoolean: booleanMode,
                    clientHiringFor: clientId || undefined,
                    employer: companyParam || undefined,
                    keywords: keywordsParam || undefined,
                    excludeKeywords: excludeKeywordsParam || undefined,
                    designation: designationParam || undefined,
                    expMin: minExp,
                    expMax: maxExp,
                    salaryMin: minSal,
                    salaryMax: maxSal,
                    currentLocation: currentLocation || undefined,
                    preferredLocation: prefLocations,
                    noticePeriod: noticePeriodFilters,
                    preferredJobTitle: preferredJob || undefined,
                    jobType: jobTypeFilters.length ? jobTypeFilters.join(',') : undefined,
                    workMode: jobOpenType ? jobOpenType.split(',') : undefined,
                    gender: genderParam || undefined,
                    pwdOnly: isPersonWithDisability,
                    createdWithinDays: getDaysSince(createdIn) ?? undefined,
                    modifiedWithinDays: getDaysSince(modifiedIn) ?? undefined,
                    page: currentPage,
                    limit: itemsPerPage,
                });

                // searchCandidates already returns mapped CandidateData[]
                setApiCandidates(response.candidates);
                setTotalResults(response.totalResults);
                setTotalPages(response.totalPages);
                setUseApiData(true);
            } catch (error) {
                console.error('Error fetching candidates from API:', error);
                setApiError('Failed to fetch candidates. Showing mock data instead.');
                setUseApiData(false);
                setApiCandidates([]);
            } finally {
                setIsLoadingApi(false);
            }
        };

        fetchCandidatesFromApi();
    }, [
        query,
        booleanMode,
        clientId,
        companyParam,
        keywordsParam,
        excludeKeywordsParam,
        designationParam,
        minExp,
        maxExp,
        minSal,
        maxSal,
        currentLocation,
        prefLocations,
        noticePeriodFilters,
        preferredJob,
        jobTypeFilters,
        jobOpenType,
        genderParam,
        isPersonWithDisability,
        createdIn,
        modifiedIn,
        currentPage,
        itemsPerPage,
    ]);

    // Filter candidates based on search (mock filtering)
    const filteredCandidates = useMemo(() => {
        // Return empty array if no query or filters are applied
        const hasAnyFilter = query || keywordsParam || excludeKeywordsParam || companyParam || 
            designationParam || minExp !== undefined || maxExp !== undefined || 
            minSal !== undefined || maxSal !== undefined || currentLocation || 
            prefLocations.length > 0 || educationFilters.length > 0 || 
            noticePeriodFilters.length > 0 || jobTypeFilters.length > 0 || 
            genderParam || isPersonWithDisability;
        
        if (!hasAnyFilter) {
            return [];
        }
        
        let results = [...mockCandidatesData];
        
        // Boolean search filter (searches across multiple fields)
        if (query && query.trim()) {
            // Remove quotes from query for cleaner searching
            const cleanQuery = query.replace(/["']/g, '').toLowerCase();
            results = results.filter(candidate => 
                candidate.name.toLowerCase().includes(cleanQuery) ||
                candidate.title.toLowerCase().includes(cleanQuery) ||
                candidate.keySkills.some(skill => skill.toLowerCase().includes(cleanQuery)) ||
                candidate.additionalSkills.some(skill => skill.toLowerCase().includes(cleanQuery)) ||
                candidate.currentCompany.toLowerCase().includes(cleanQuery) ||
                getEducationSearchText(candidate.education).toLowerCase().includes(cleanQuery)
            );
        }
        
        // Sidebar keyword filter
        if (keywordsParam && keywordsParam.trim()) {
            const keywordLower = keywordsParam.toLowerCase();
            results = results.filter(candidate =>
                candidate.name.toLowerCase().includes(keywordLower) ||
                candidate.title.toLowerCase().includes(keywordLower) ||
                candidate.keySkills.some(skill => skill.toLowerCase().includes(keywordLower)) ||
                candidate.additionalSkills.some(skill => skill.toLowerCase().includes(keywordLower)) ||
                candidate.currentCompany.toLowerCase().includes(keywordLower)
            );
        }
        
        // Exclude keywords filter
        if (excludeKeywordsParam && excludeKeywordsParam.trim()) {
            const excludeLower = excludeKeywordsParam.toLowerCase();
            results = results.filter(candidate =>
                !candidate.name.toLowerCase().includes(excludeLower) &&
                !candidate.title.toLowerCase().includes(excludeLower) &&
                !candidate.keySkills.some(skill => skill.toLowerCase().includes(excludeLower)) &&
                !candidate.additionalSkills.some(skill => skill.toLowerCase().includes(excludeLower)) &&
                !candidate.currentCompany.toLowerCase().includes(excludeLower)
            );
        }
        
        // Experience filter (range)
        if (minExp !== undefined) {
            results = results.filter(candidate => {
                const exp = parseFloat(candidate.experience);
                return exp >= minExp;
            });
        }
        if (maxExp !== undefined) {
            results = results.filter(candidate => {
                const exp = parseFloat(candidate.experience);
                return exp <= maxExp;
            });
        }
        
        // Salary filter (extracts first number from "85k - 95k" format)
        if (minSal !== undefined) {
            results = results.filter(candidate => {
                const salaryMatch = candidate.salary.match(/[\d.]+/);
                const sal = salaryMatch ? parseFloat(salaryMatch[0]) : 0;
                return sal >= minSal;
            });
        }
        if (maxSal !== undefined) {
            results = results.filter(candidate => {
                const salaryMatch = candidate.salary.match(/[\d.]+/);
                const sal = salaryMatch ? parseFloat(salaryMatch[0]) : 0;
                return sal <= maxSal;
            });
        }
        
        // Current location filter (substring match)
        if (currentLocation && currentLocation.trim()) {
            results = results.filter(candidate =>
                candidate.location.toLowerCase().includes(currentLocation.toLowerCase())
            );
        }
        
        // Preferred locations filter (match any preferred location)
        if (prefLocations.length > 0) {
            results = results.filter(candidate =>
                prefLocations.some(loc =>
                    candidate.preferredLocations.some(pref =>
                        pref.toLowerCase().includes(loc.toLowerCase())
                    )
                )
            );
        }
        
        // Education filter (substring match on any selected education type)
        if (educationFilters.length > 0) {
            results = results.filter(candidate =>
                educationFilters.some(edu =>
                    getEducationSearchText(candidate.education).toLowerCase().includes(edu.toLowerCase())
                )
            );
        }
        
        // Gender filter
        if (genderParam && genderParam !== 'any') {
            results = results.filter(candidate =>
                candidate.gender?.toLowerCase() === genderParam.toLowerCase()
            );
        }
        
        // Person with disability filter
        if (isPersonWithDisability) {
            results = results.filter(candidate =>
                candidate.personWithDisability === true
            );
        }
        
        // Notice period filter (substring match)
        if (noticePeriodFilters.length > 0) {
            results = results.filter(candidate =>
                noticePeriodFilters.some(notice =>
                    candidate.availability.toLowerCase().includes(notice.toLowerCase())
                )
            );
        }
        
        // Job type filter (check work type)
        if (jobTypeFilters.length > 0) {
            results = results.filter(candidate =>
                jobTypeFilters.some(jobType =>
                    candidate.workType.some(wt =>
                        wt.toLowerCase().includes(jobType.toLowerCase())
                    )
                )
            );
        }
        
        // Company filter
        if (companyParam && companyParam.trim()) {
            const companyLower = companyParam.toLowerCase();
            results = results.filter(candidate =>
                candidate.currentCompany.toLowerCase().includes(companyLower) ||
                candidate.previousCompany.toLowerCase().includes(companyLower)
            );
        }
        
        // Designation filter
        if (designationParam && designationParam.trim()) {
            const designationLower = designationParam.toLowerCase();
            results = results.filter(candidate =>
                candidate.title.toLowerCase().includes(designationLower)
            );
        }
        
        return results;
    }, [query, keywordsParam, excludeKeywordsParam, companyParam, designationParam, minExp, maxExp, minSal, maxSal, currentLocation, prefLocations, educationFilters, noticePeriodFilters, jobTypeFilters, genderParam, isPersonWithDisability]);

    // Pagination - use API data when available, otherwise use filtered mock data
    const calculatedTotalPages = useApiData ? totalPages : Math.ceil(filteredCandidates.length / itemsPerPage);
    
    const paginatedCandidates = useMemo(() => {
        if (useApiData) {
            // API already returns paginated data
            return apiCandidates;
        }
        // For mock data, paginate on frontend
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredCandidates.slice(startIndex, startIndex + itemsPerPage);
    }, [useApiData, apiCandidates, filteredCandidates, currentPage, itemsPerPage]);

    // Handlers
    const handleSelectCandidate = (id: string) => {
        setSelectedCandidates(prev => 
            prev.includes(id) 
                ? prev.filter(cid => cid !== id)
                : [...prev, id]
        );
    };

    const handleModifySearch = () => {
        setIsSearchModalOpen(true);
    };

    const handleSaveSearch = () => {
        console.log('Saving search:', { query, booleanMode, scope });
    };

    const toggleSection = (key: string) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSearchFromModal = useCallback((filters: CandidateSearchFilters) => {
        const params = new URLSearchParams();

        if (filters.booleanQuery) {
            params.append('query', filters.booleanQuery);
            params.append('boolean', filters.booleanSearchEnabled ? 'true' : 'false');
            params.append('scope', filters.searchScope || 'all');
        }
        if (filters.clientId) params.append('client', filters.clientId);
        if (filters.minExperience) params.append('exp_min', filters.minExperience.toString());
        if (filters.maxExperience) params.append('exp_max', filters.maxExperience.toString());
        if (filters.minSalary) params.append('sal_min', filters.minSalary.toString());
        if (filters.maxSalary) params.append('sal_max', filters.maxSalary.toString());
        if (filters.currentLocation) params.append('current_loc', filters.currentLocation);
        if (filters.preferredLocations?.length) {
            params.append('pref_locs', filters.preferredLocations.join(','));
        }
        if (filters.education?.length) params.append('edu', filters.education.join(','));
        if (filters.noticePeriod?.length) params.append('notice', filters.noticePeriod.join(','));
        if (filters.preferredJob) params.append('job', filters.preferredJob);
        if (filters.jobType?.length) {
            params.append('job_type', filters.jobType.join(','));
        }
        if (filters.jobOpenType) params.append('job_open_type', filters.jobOpenType);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.personWithDisability) params.append('pwd', 'true');
        if (filters.modifiedIn) params.append('modified', filters.modifiedIn);
        if (filters.createdIn) params.append('created', filters.createdIn);

        setIsSearchModalOpen(false);
        setCurrentPage(1); // Reset to first page on new search
        navigate(`/candidate-search?${params.toString()}`);
    }, [navigate]);

    const handleApplySidebarFilters = useCallback(() => {
        // Create new params object, preserving all existing search params
        const existingParams = Object.fromEntries(searchParams);
        const params = new URLSearchParams(existingParams);
        
        // Update or clear keyword filter
        if (keywordFilter) {
            params.set('keywords', keywordFilter);
        } else {
            params.delete('keywords');
        }
        
        // Update or clear exclude keyword filter
        if (excludeKeywordFilter) {
            params.set('exclude_keywords', excludeKeywordFilter);
        } else {
            params.delete('exclude_keywords');
        }
        
        // Update or clear company filter
        if (companyFilter) {
            params.set('company', companyFilter);
        } else {
            params.delete('company');
        }
        
        // Update or clear designation filter
        if (designationFilter) {
            params.set('designation', designationFilter);
        } else {
            params.delete('designation');
        }
        
        // Update or clear contact filter
        if (contactFilter) {
            params.set('contact', contactFilter);
        } else {
            params.delete('contact');
        }
        
        // Update or clear customer name filter
        if (customerNameFilter) {
            params.set('customer_name', customerNameFilter);
        } else {
            params.delete('customer_name');
        }
        
        // Update or clear location filter
        if (locationFilter) {
            params.set('current_loc', locationFilter);
        } else {
            params.delete('current_loc');
        }
        
        // Update or clear gender filter
        if (genderFilter) {
            params.set('gender', genderFilter);
        } else {
            params.delete('gender');
        }
        
        // Update or clear notice period filter
        if (noticePeriodFilter.length > 0) {
            params.set('notice', noticePeriodFilter.join(','));
        } else {
            params.delete('notice');
        }
        
        // Update or clear experience range
        if (experienceMinFilter) {
            params.set('exp_min', experienceMinFilter);
        } else {
            params.delete('exp_min');
        }
        if (experienceMaxFilter) {
            params.set('exp_max', experienceMaxFilter);
        } else {
            params.delete('exp_max');
        }
        
        // Update or clear salary range
        if (salaryMinFilter) {
            params.set('sal_min', salaryMinFilter);
        } else {
            params.delete('sal_min');
        }
        if (salaryMaxFilter) {
            params.set('sal_max', salaryMaxFilter);
        } else {
            params.delete('sal_max');
        }
        
        // Update or clear hide profiles
        if (hideProfiles) {
            params.set('hide_profiles', 'true');
        } else {
            params.delete('hide_profiles');
        }
        
        // Update or clear premium institute only
        if (premiumInstituteOnly) {
            params.set('premium_institute', 'true');
        } else {
            params.delete('premium_institute');
        }
        
        setCurrentPage(1);
        navigate(`/candidate-search?${params.toString()}`);
    }, [navigate, searchParams, keywordFilter, excludeKeywordFilter, companyFilter, contactFilter, customerNameFilter, designationFilter, locationFilter, genderFilter, noticePeriodFilter, experienceMinFilter, experienceMaxFilter, salaryMinFilter, salaryMaxFilter, hideProfiles, premiumInstituteOnly]);

    const updateComment = (candidateId: string, comment: string) => {
        setCandidateComments(prev => ({
            ...prev,
            [candidateId]: comment
        }));
    };

    const handleOpenCommentModal = (candidate: CandidateData) => {
        setActiveCommentCandidate({ id: candidate.id, name: candidate.name });
        setCommentDraft(candidateComments[candidate.id] || '');
        setShowCommentModal(true);
    };

    const handleCloseCommentModal = () => {
        setShowCommentModal(false);
        setCommentDraft('');
        setActiveCommentCandidate(null);
    };

    const handleSaveComment = () => {
        if (!activeCommentCandidate) return;
        updateComment(activeCommentCandidate.id, commentDraft.trim());
        handleCloseCommentModal();
    };

    return (
        <PageLayout
            isLoading={isLoadingApi}
            header={
                <div className="bg-white border-b px-6 py-2 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/applicants')}
                            className="text-gray-600 hover:text-gray-900 transition-colors mt-0.5"
                        >
                            <Icon name="caret-left" className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Text className="text-sm font-semibold text-gray-900">
                                    System Found {useApiData ? totalResults : filteredCandidates.length} Profile{(useApiData ? totalResults : filteredCandidates.length) !== 1 ? 's' : ''}
                                </Text>
                                {queryTerms.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600">
                                        <span>–</span>
                                        <div className="flex gap-1">
                                            {queryTerms.map((term, idx) => (
                                                <Text key={idx} size="sm" className="text-xs">
                                                    {term}
                                                </Text>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={handleModifySearch}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                >
                                    <Icon name="pencil" className="w-4 h-4 mr-1" />
                                    Modify
                                </Button>
                            </div>
                        </div>
                    </div>
                    <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleSaveSearch}
                    >
                        <Icon name="bookmark" className="w-4 h-4 mr-2" />
                        Save Search
                    </Button>
                </div>
            }
        >
            <div className="flex h-[calc(100vh-116px)] bg-gradient-to-b from-gray-50 to-white px-4 py-4 gap-4 overflow-hidden">
                {/* Left Sidebar - Filters */}
                <div className="w-72 max-w-sm bg-white/95 backdrop-blur border border-gray-300 rounded-lg shadow-sm overflow-y-auto h-full">
                    <div className="p-4 space-y-3 pb-10">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <Text className="font-semibold text-sm text-gray-800">Filters</Text>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Checkbox 
                                label="Hide Profiles"
                                checked={hideProfiles}
                                onChange={(checked) => setHideProfiles(checked)}
                            />
                            <Checkbox 
                                label="Premium Institute Candidates"
                                checked={premiumInstituteOnly}
                                onChange={(checked) => setPremiumInstituteOnly(checked)}
                            />
                        </div>

                        {/* Keywords */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('keywords')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Keywords
                                <Icon name={openSections.keywords ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.keywords && (
                                <div className="mt-2 space-y-2">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search keyword"
                                            value={keywordFilter}
                                            onChange={(e) => setKeywordFilter(e.target.value)}
                                            className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <Icon name="search" className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Exclude keywords"
                                            value={excludeKeywordFilter}
                                            onChange={(e) => setExcludeKeywordFilter(e.target.value)}
                                            className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <Icon name="minus" className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current organization */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('company')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Organization
                                <Icon name={openSections.company ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.company && (
                                <div className="mt-2">
                                    <SearchDropdown
                                        label=""
                                        value={companyFilter}
                                        onChange={(selected: any) => {
                                            setCompanyFilter(selected ? selected.label : '');
                                        }}
                                        options={employerOptions}
                                        loading={employersLoading}
                                        onInputChange={(input: string) => searchEmployers(input)}
                                        placeholder="Search organization"
                                        isMulti={false}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Contact (CONTACT DETAILS OF APPLICANT GO DOWN) */}
                        {/* <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('contact')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Contact (Client)
                                <Icon name={openSections.contact ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.contact && (
                                <div className="mt-2">
                                    <SearchDropdown
                                        label=""
                                        value={contactFilter}
                                        onChange={(selected: any) => {
                                            setContactFilter(selected ? selected.value : '');
                                        }}
                                        options={clientOptions}
                                        loading={clientsLoading}
                                        onInputChange={(input: string) => searchClients(input)}
                                        placeholder="Search client"
                                        isMulti={false}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                </div>
                            )}
                        </div> */}

                        {/* Customer Name */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('customerName')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Customer Name
                                <Icon name={openSections.customerName ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.customerName && (
                                <div className="mt-2">
                                    <SearchDropdown
                                        label=""
                                        value={customerNameFilter}
                                        onChange={(selected: any) => {
                                            setCustomerNameFilter(selected ? selected.label : '');
                                        }}
                                        options={customerOptions}
                                        loading={customersLoading}
                                        onInputChange={(input: string) => searchCustomers(input)}
                                        placeholder="Search customer"
                                        isMulti={false}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('location')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Location
                                <Icon name={openSections.location ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.location && (
                                <div className="mt-2">
                                    <SearchDropdown
                                        label=""
                                        value={locationFilter}
                                        onChange={(selected: any) => {
                                            setLocationFilter(selected ? selected.label : '');
                                        }}
                                        options={locationOptions}
                                        loading={locationLoading}
                                        onInputChange={(input: string) => searchLocations(input)}
                                        placeholder="Search location"
                                        isMulti={false}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Experience */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('experience')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Experience (Years)
                                <Icon name={openSections.experience ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.experience && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={experienceMinFilter}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || Number(value) >= 0) {
                                                setExperienceMinFilter(value);
                                            }
                                        }}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        min="0"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={experienceMaxFilter}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || Number(value) >= 0) {
                                                setExperienceMaxFilter(value);
                                            }
                                        }}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        min="0"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Salary */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('salary')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Salary (INR-Lacs)
                                <Icon name={openSections.salary ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.salary && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={salaryMinFilter}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || Number(value) >= 0) {
                                                setSalaryMinFilter(value);
                                            }
                                        }}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        min="0"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={salaryMaxFilter}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || Number(value) >= 0) {
                                                setSalaryMaxFilter(value);
                                            }
                                        }}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        min="0"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Current designation */}
                        <div className="border-t border-gray-100 pt-3">
                            <button onClick={() => toggleSection('designation')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Current designation
                                <Icon name={openSections.designation ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.designation && (
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        value={designationFilter}
                                        onChange={(e) => setDesignationFilter(e.target.value)}
                                        placeholder="Enter designation"
                                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Notice Period */}
                        <div className="border-t border-gray-100 pt-3">
                            <Text className="text-sm font-semibold text-gray-900 mb-2">Notice period</Text>
                            <div className="flex flex-col space-y-1.5 text-sm text-gray-800">
                                <Checkbox 
                                    label="Immediate" 
                                    checked={noticePeriodFilter.includes('Immediate')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, 'Immediate']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== 'Immediate'));
                                        }
                                    }}
                                />
                                <Checkbox 
                                    label="15 days" 
                                    checked={noticePeriodFilter.includes('15 days')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, '15 days']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== '15 days'));
                                        }
                                    }}
                                />
                                <Checkbox 
                                    label="1 month" 
                                    checked={noticePeriodFilter.includes('1 month')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, '1 month']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== '1 month'));
                                        }
                                    }}
                                />
                                <Checkbox 
                                    label="2 months" 
                                    checked={noticePeriodFilter.includes('2 months')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, '2 months']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== '2 months'));
                                        }
                                    }}
                                />
                                <Checkbox 
                                    label="3 months" 
                                    checked={noticePeriodFilter.includes('3 months')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, '3 months']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== '3 months'));
                                        }
                                    }}
                                />
                                <Checkbox 
                                    label="More than 3 months" 
                                    checked={noticePeriodFilter.includes('More than 3 months')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, 'More than 3 months']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== 'More than 3 months'));
                                        }
                                    }}
                                />
                                <Checkbox 
                                    label="Currently serving notice period" 
                                    checked={noticePeriodFilter.includes('Currently serving notice period')}
                                    onChange={(checked) => {
                                        if (checked) {
                                            setNoticePeriodFilter([...noticePeriodFilter, 'Currently serving notice period']);
                                        } else {
                                            setNoticePeriodFilter(noticePeriodFilter.filter(n => n !== 'Currently serving notice period'));
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Gender */}
                        <div className="border-t border-gray-100 py-3">
                            <button onClick={() => toggleSection('gender')} className="w-full flex items-center justify-between text-sm font-semibold text-gray-900">
                                Gender
                                <Icon name={openSections.gender ? 'caret-up' : 'caret-down'} className="w-4 h-4 text-gray-500" />
                            </button>
                            {openSections.gender && (
                                <div className="mt-2">
                                    <SearchDropdown
                                        label=""
                                        value={genderFilter}
                                        onChange={(selected: any) => {
                                            setGenderFilter(selected ? selected.label : '');
                                        }}
                                        options={genderOptions}
                                        loading={genderLoading}
                                        placeholder="Select gender"
                                        isMulti={false}
                                        isSearchable={true}
                                        isClearable={true}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="w-full"
                                onClick={handleApplySidebarFilters}
                            >
                                <Icon name="check" className="w-4 h-4 mr-2" />
                                Apply Filters
                            </Button>
                            <Button 
                                variant="secondary" 
                                size="sm" 
                                className="w-full"
                                onClick={handleModifySearch}
                            >
                                <Icon name="refresh" className="w-4 h-4 mr-2" />
                                Refine Search
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 min-w-0 h-full flex flex-col pr-1 overflow-hidden">
                    {/* Top Bar with Search Info and Controls */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg shadow mb-2">
                        {/* Results Count Badge */}
                        {/* {useApiData && totalResults > 0 && (
                            <div className="px-4 py-2 border-b border-gray-200 bg-blue-50">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Results
                                    </span>
                                    <Text className="text-sm text-gray-700">
                                        Found <span className="font-semibold">{totalResults}</span> candidates
                                    </Text>
                                </div>
                            </div>
                        )} */}
                        
                        {/* Controls Bar */}
                        <div className="px-4 py-1.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap text-xs text-gray-700">
                                <div className="flex items-center gap-1.5">
                                    <Text className="font-medium text-gray-700 text-xs">Active in</Text>
                                    <Dropdown
                                        value={activeIn}
                                        placeholder="Select"
                                        onChange={(val) => setActiveIn(val)}
                                        options={[
                                            { value: '7', label: 'Last 7 days' },
                                            { value: '30', label: 'Last 30 days' },
                                            { value: '90', label: 'Last 90 days' },
                                            { value: '180', label: '6 months' },
                                            { value: 'all', label: 'All time' },
                                        ]}
                                        size="sm"
                                        className="rounded-md border-gray-300"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Text className="font-medium text-gray-700 text-xs">Sort by</Text>
                                    <Dropdown
                                        value={sortBy}
                                        onChange={(val) => setSortBy(val)}
                                        options={[
                                            { value: 'ai-relevance', label: 'AI relevance' },
                                            { value: 'relevance', label: 'Relevance' },
                                            { value: 'recent', label: 'Recently Modified' },
                                            { value: 'experience', label: 'Experience' },
                                            { value: 'views', label: 'Most Viewed' },
                                        ]}
                                        size="sm"
                                        className="rounded-md border-gray-300"
                                    />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Text className="font-medium text-gray-700 text-xs">Show</Text>
                                    <Dropdown
                                        value={pageSize}
                                        onChange={(val) => {
                                            setPageSize(val);
                                            setItemsPerPage(Number(val) || 10);
                                            setCurrentPage(1);
                                        }}
                                        options={[
                                            { value: '10', label: '10' },
                                            { value: '20', label: '20' },
                                            { value: '40', label: '40' },
                                            { value: '80', label: '80' },
                                        ]}
                                        size="sm"
                                        className="rounded-md border-gray-300"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5 flex-wrap text-xs">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={calculatedTotalPages}
                                    onPageChange={setCurrentPage}
                                    size='sm'
                                />
                                <Text className="text-sm text-gray-600">
                                    Page {currentPage} of {Math.max(calculatedTotalPages, 1)}
                                </Text>
                                {selectedCandidates.length > 0 && (
                                    <>
                                        <Dropdown
                                            value=""
                                            onChange={() => {}}
                                            options={[
                                                { value: 'job', label: 'Add to Job' },
                                                { value: 'folder', label: 'Add to Folder' },
                                                { value: 'campaign', label: 'Add to Campaign' },
                                            ]}
                                            size="sm"
                                            placeholder="Add To"
                                            className="rounded-md border-gray-300"
                                        />
                                        <Button variant="ghost" size="sm" className="text-gray-700">
                                            <Icon name="bell" className="w-4 h-4 mr-2" />
                                            Set Reminder
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Candidate Cards */}
                    <div className="flex-1 pt-4 pb-2 overflow-y-auto">
                        {isLoadingApi ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <Text variant="p" className="text-gray-500">
                                    Loading candidates...
                                </Text>
                            </div>
                        ) : apiError || paginatedCandidates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Icon name="search" className="w-12 h-12 text-gray-300 mb-4" />
                                <Text variant="p" className="text-gray-500 mb-2">
                                    No candidates found
                                </Text>
                                <Text variant="caption" className="text-gray-400">
                                    Try adjusting your search criteria
                                </Text>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedCandidates.map((candidate) => (
                                    <CandidateCard
                                        key={candidate.id}
                                        candidate={candidate}
                                        isSelected={selectedCandidates.includes(candidate.id)}
                                        onSelectChange={handleSelectCandidate}
                                        comment={candidateComments[candidate.id] || ''}
                                        onCommentClick={handleOpenCommentModal}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showCommentModal}
                onClose={handleCloseCommentModal}
                title="Add Comment"
                size="sm"
                showCloseButton
                titleRounded
            >
                <div className="space-y-3">
                    <div className="text-sm text-gray-700">
                        {activeCommentCandidate ? (
                            <span className="font-semibold text-gray-900">{activeCommentCandidate.name}</span>
                        ) : (
                            'Selected candidate'
                        )}
                    </div>
                    <TextArea
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        placeholder="Add a note about this candidate"
                        rows={4}
                        resize="none"
                        size="sm"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="secondary" size="sm" onClick={handleCloseCommentModal}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveComment}
                            disabled={!commentDraft.trim()}
                        >
                            Save Comment
                        </Button>
                    </div>
                </div>
            </Modal>

            <CandidateSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onSearch={handleSearchFromModal}
                initialFilters={initialModalFilters}
            />
        </PageLayout>
    );
};

export default CandidateSearch;
