import React, { useState, useRef, useEffect } from 'react';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';
import Checkbox from '../../atoms/Checkbox';
import SelectField from '../../molecules/SelectField';
import { SearchFilters, skillSuggestions } from './types';
import Icon from '../../atoms/Icon';

interface AdvancedFiltersProps {
    filters: SearchFilters;
    onFiltersChange: (filters: Partial<SearchFilters>) => void;
    onClearAll: () => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onManualSearch: () => void;
    debouncedSearchQuery: string;
    filteredCandidates: any[];
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearAll,
    searchQuery,
    onSearchQueryChange,
    onManualSearch,
    debouncedSearchQuery,
    filteredCandidates
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['skills', 'experience', 'location'])
    );
    const [skillInput, setSkillInput] = useState<string>('');
    const [locationInput, setLocationInput] = useState<string>('');
    const [showSkillSuggestions, setShowSkillSuggestions] = useState<boolean>(false);
    const [filteredSkillSuggestions, setFilteredSkillSuggestions] = useState<string[]>([]);
    const skillInputRef = useRef<HTMLInputElement>(null);

    // Filter skill suggestions based on input
    useEffect(() => {
        if (skillInput.length > 0) {
            const filtered = skillSuggestions
                .filter(skill =>
                    skill.toLowerCase().includes(skillInput.toLowerCase()) &&
                    !filters.skills.includes(skill)
                )
                .slice(0, 8); // Show max 8 suggestions
            setFilteredSkillSuggestions(filtered);
            setShowSkillSuggestions(filtered.length > 0);
        } else {
            setShowSkillSuggestions(false);
            setFilteredSkillSuggestions([]);
        }
    }, [skillInput, filters.skills]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (skillInputRef.current && !skillInputRef.current.contains(event.target as Node)) {
                setShowSkillSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleSection = (section: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(section)) {
            newExpanded.delete(section);
        } else {
            newExpanded.add(section);
        }
        setExpandedSections(newExpanded);
    };

    const addSkill = (skill: string) => {
        if (skill.trim() && !filters.skills.includes(skill.trim())) {
            onFiltersChange({
                skills: [...filters.skills, skill.trim()]
            });
            setSkillInput('');
            setShowSkillSuggestions(false);
        }
    };

    const addSkillFromSuggestion = (skill: string) => {
        addSkill(skill);
        skillInputRef.current?.focus();
    };

    const removeSkill = (skill: string) => {
        onFiltersChange({
            skills: filters.skills.filter(s => s !== skill)
        });
    };

    const addLocation = (location: string) => {
        if (location.trim() && !filters.locations.includes(location.trim())) {
            onFiltersChange({
                locations: [...filters.locations, location.trim()]
            });
            setLocationInput('');
        }
    };

    const removeLocation = (location: string) => {
        onFiltersChange({
            locations: filters.locations.filter(l => l !== location)
        });
    };

    const handleSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredSkillSuggestions.length > 0) {
                addSkill(filteredSkillSuggestions[0]);
            } else {
                addSkill(skillInput);
            }
        } else if (e.key === 'Escape') {
            setShowSkillSuggestions(false);
        }
    };

    const handleLocationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            addLocation(locationInput);
        }
    };

    const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onManualSearch();
        }
    };

    const toggleWorkType = (type: string) => {
        if (filters.workType.includes(type)) {
            onFiltersChange({
                workType: filters.workType.filter(t => t !== type)
            });
        } else {
            onFiltersChange({
                workType: [...filters.workType, type]
            });
        }
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
            <div className="px-4 py-3.5 border-b-2 border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onClearAll}
                        className="text-sm"
                    >
                        Clear All
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                    {/* Search Filter - First Priority */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                        <div className="mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Search Candidates</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Icon name="search" className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => onSearchQueryChange(e.target.value)}
                                    onKeyDown={handleSearchKeyPress}
                                    placeholder="Search by name, skills, company..."
                                    className="pl-9 py-2 text-sm border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Button
                                    onClick={onManualSearch}
                                    size="sm"
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                    Search Now
                                </Button>
                                {(searchQuery || filters.query) && (
                                    <button
                                        onClick={() => onSearchQueryChange('')}
                                        className="text-xs text-red-600 hover:text-red-800"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {(searchQuery || filters.query) && (
                                <div className="text-xs text-gray-600">
                                    {searchQuery !== debouncedSearchQuery ? (
                                        <>Typing: <span className="font-medium">"{searchQuery}"</span></>
                                    ) : (
                                        <>Found: <span className="font-medium text-blue-600">{filteredCandidates.length}</span> candidates</>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Skills Filter */}
                    <div>
                        <button
                            onClick={() => toggleSection('skills')}
                            className="w-full flex justify-between items-center text-left mb-3 hover:text-blue-600"
                        >
                            <span className="font-medium text-gray-900">Skills & Technologies</span>
                            <Icon name={expandedSections.has('skills') ? "caret-up" : "caret-down"} className="w-4 h-4" />
                        </button>

                        {expandedSections.has('skills') && (
                            <div className="space-y-3">
                                {/* Selected Skills */}
                                {filters.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {filters.skills.map(skill => (
                                            <div
                                                key={skill}
                                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:bg-blue-200"
                                                onClick={() => removeSkill(skill)}
                                            >
                                                {skill}
                                                <Icon name="close" className="w-3 h-3" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Skills Input */}
                                <div className="space-y-2 relative">
                                    <Input
                                        ref={skillInputRef}
                                        placeholder="Type skill and press Enter"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={handleSkillKeyPress}
                                        onFocus={() => {
                                            if (filteredSkillSuggestions.length > 0) {
                                                setShowSkillSuggestions(true);
                                            }
                                        }}
                                        className="text-sm"
                                    />

                                    {/* Skill Suggestions Dropdown */}
                                    {showSkillSuggestions && filteredSkillSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {filteredSkillSuggestions.map((skill, index) => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                                                    onClick={() => addSkillFromSuggestion(skill)}
                                                >
                                                    <span className="text-gray-900">{skill}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500">
                                        Start typing to see suggestions or press Enter to add custom skills
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Experience Filter */}
                    <div>
                        <button
                            onClick={() => toggleSection('experience')}
                            className="w-full flex justify-between items-center text-left mb-3 hover:text-blue-600"
                        >
                            <span className="font-medium text-gray-900">Experience</span>
                            <Icon name={expandedSections.has('experience') ? "caret-up" : "caret-down"} className="w-4 h-4" />
                        </button>

                        {expandedSections.has('experience') && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min Years</label>
                                        <Input
                                            type="number"
                                            value={filters.experienceRange[0].toString()}
                                            onChange={(e) => onFiltersChange({
                                                experienceRange: [parseInt(e.target.value) || 0, filters.experienceRange[1]]
                                            })}
                                            className="text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Max Years</label>
                                        <Input
                                            type="number"
                                            value={filters.experienceRange[1].toString()}
                                            onChange={(e) => onFiltersChange({
                                                experienceRange: [filters.experienceRange[0], parseInt(e.target.value) || 20]
                                            })}
                                            className="text-sm"
                                            placeholder="20"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location Filter */}
                    <div>
                        <button
                            onClick={() => toggleSection('location')}
                            className="w-full flex justify-between items-center text-left mb-3 hover:text-blue-600"
                        >
                            <span className="font-medium text-gray-900">Location</span>
                            <Icon name={expandedSections.has('location') ? "caret-up" : "caret-down"} className="w-4 h-4" />
                        </button>

                        {expandedSections.has('location') && (
                            <div className="space-y-3">
                                {/* Selected Locations */}
                                {filters.locations.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {filters.locations.map(location => (
                                            <div
                                                key={location}
                                                className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:bg-green-200"
                                                onClick={() => removeLocation(location)}
                                            >
                                                {location}
                                                <Icon name="close" className="w-3 h-3" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Location Input */}
                                <div>
                                    <Input
                                        placeholder="Type location and press Enter"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        onKeyDown={handleLocationKeyPress}
                                        className="text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        E.g., New York, San Francisco, Remote, etc.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Work Type Filter */}
                    <div>
                        <button
                            onClick={() => toggleSection('workType')}
                            className="w-full flex justify-between items-center text-left mb-3 hover:text-blue-600"
                        >
                            <span className="font-medium text-gray-900">Work Type</span>
                            <Icon name={expandedSections.has('workType') ? "caret-up" : "caret-down"} className="w-4 h-4" />
                        </button>

                        {expandedSections.has('workType') && (
                            <div className="space-y-2">
                                {['Remote', 'On-site', 'Hybrid'].map(type => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={filters.workType.includes(type)}
                                            onChange={(checked) => toggleWorkType(type)}
                                        />
                                        <label className="text-sm text-gray-700">{type}</label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Salary Filter */}
                    <div>
                        <button
                            onClick={() => toggleSection('salary')}
                            className="w-full flex justify-between items-center text-left mb-3 hover:text-blue-600"
                        >
                            <span className="font-medium text-gray-900">Salary Range (K)</span>
                            <Icon name={expandedSections.has('salary') ? "caret-up" : "caret-down"} className="w-4 h-4" />
                        </button>

                        {expandedSections.has('salary') && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Min</label>
                                        <Input
                                            type="number"
                                            value={filters.salaryRange[0].toString()}
                                            onChange={(e) => onFiltersChange({
                                                salaryRange: [parseInt(e.target.value) || 30, filters.salaryRange[1]]
                                            })}
                                            className="text-sm"
                                            placeholder="30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Max</label>
                                        <Input
                                            type="number"
                                            value={filters.salaryRange[1].toString()}
                                            onChange={(e) => onFiltersChange({
                                                salaryRange: [filters.salaryRange[0], parseInt(e.target.value) || 200]
                                            })}
                                            className="text-sm"
                                            placeholder="200"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Advanced Options */}
                    <div>
                        <button
                            onClick={() => toggleSection('advanced')}
                            className="w-full flex justify-between items-center text-left mb-3 hover:text-blue-600"
                        >
                            <span className="font-medium text-gray-900">Advanced Options</span>
                            <Icon name={expandedSections.has('advanced') ? "caret-up" : "caret-down"} className="w-4 h-4" />
                        </button>

                        {expandedSections.has('advanced') && (
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={filters.verified}
                                        onChange={(checked) => onFiltersChange({ verified: checked })}
                                    />
                                    <label className="text-sm text-gray-700">Verified profiles only</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={filters.highResponseRate}
                                        onChange={(checked) => onFiltersChange({ highResponseRate: checked })}
                                    />
                                    <label className="text-sm text-gray-700">High response rate</label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={filters.recentlyActive}
                                        onChange={(checked) => onFiltersChange({ recentlyActive: checked })}
                                    />
                                    <label className="text-sm text-gray-700">Recently active</label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilters;
