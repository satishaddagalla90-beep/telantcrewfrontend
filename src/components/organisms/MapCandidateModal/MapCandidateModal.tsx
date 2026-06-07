import React, { useState } from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Avatar from '../../atoms/Avatar';
import Badge from '../../atoms/Badge';
import ErrorMessage from '../../atoms/ErrorMessage';
import { candidatesAPI, CandidateData } from '../../../utils/api/CandidatesAPI';

export interface MapCandidateModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Function to call when the modal should be closed */
    onClose: () => void;
    /** Job ID to map candidates to */
    jobId?: string;
    /** Job title for context */
    jobTitle?: string;
    /** Function to call when candidates are mapped */
    onMapCandidates?: (candidates: CandidateData[]) => void;
}

type SearchType = 'name' | 'phone' | 'email' | 'pan';

const MapCandidateModal: React.FC<MapCandidateModalProps> = ({
    isOpen,
    onClose,
    jobId,
    jobTitle,
    onMapCandidates
}) => {
    // Search state
    const [searchType, setSearchType] = useState<SearchType>('name');
    const [candidateName, setCandidateName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [panNumber, setPanNumber] = useState('');
    
    // Results state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchResults, setSearchResults] = useState<CandidateData[]>([]);
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        setError('');
        setSearchResults([]);

        try {
            let searchParams: any = { limit: 50 };

            // Build search parameters based on search type
            if (searchType === 'name' && candidateName.trim()) {
                searchParams.search = candidateName.trim();
            } else if (searchType === 'phone' && phoneNumber.trim()) {
                const cleanPhone = phoneNumber.replace(/\D/g, '');
                const phoneNum = parseInt(cleanPhone);
                if (!isNaN(phoneNum) && cleanPhone.length >= 10) {
                    searchParams.phone = phoneNum;
                } else {
                    setError('Please enter a valid 10-digit phone number');
                    setLoading(false);
                    return;
                }
            } else if (searchType === 'email' && email.trim()) {
                searchParams.email = email.trim();
            } else if (searchType === 'pan' && panNumber.trim()) {
                searchParams.pan_number = panNumber.trim().toUpperCase();
            } else {
                setError(`Please enter a ${searchType} to search`);
                setLoading(false);
                return;
            }

            // Use searchCandidates API for all search types
            const response = await candidatesAPI.searchCandidates(searchParams);

            if (response.candidates && response.candidates.length > 0) {
                setSearchResults(response.candidates);
            } else {
                setError('No candidates found with the provided details.');
            }

        } catch (err: any) {
            console.error('Error searching candidates:', err);
            setError(err.message || 'Error searching candidates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleCandidateSelection = (candidateId: string) => {
        const newSelection = new Set(selectedCandidates);
        if (newSelection.has(candidateId)) {
            newSelection.delete(candidateId);
        } else {
            newSelection.add(candidateId);
        }
        setSelectedCandidates(newSelection);
    };

    const handleMapSelected = () => {
        const candidatesToMap = searchResults.filter(candidate =>
            selectedCandidates.has(candidate._id)
        );
        
        if (candidatesToMap.length === 0) {
            setError('Please select at least one candidate to map');
            return;
        }

        onMapCandidates?.(candidatesToMap);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setCandidateName('');
        setPhoneNumber('');
        setEmail('');
        setPanNumber('');
        setSearchResults([]);
        setSelectedCandidates(new Set());
        setError('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const getSearchInput = () => {
        switch (searchType) {
            case 'name':
                return (
                    <Input
                        type="text"
                        placeholder="Enter candidate name"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                    />
                );
            case 'phone':
                return (
                    <Input
                        type="tel"
                        placeholder="Enter 10-digit phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        maxLength={10}
                    />
                );
            case 'email':
                return (
                    <Input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                );
            case 'pan':
                return (
                    <Input
                        type="text"
                        placeholder="Enter PAN number (e.g., ABCDE1234F)"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        maxLength={10}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Map Candidate to Job"
            size="lg"
        >
            <div className="space-y-6">
                {/* Search Section */}
                <div className="space-y-4">
                    <div>
                        <Text weight="medium" className="text-gray-900 mb-3">
                            Search for Candidates
                        </Text>
                        
                        {/* Search Type Selector */}
                        <div className="flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setSearchType('name')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    searchType === 'name'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Icon name="user" size={16} className="inline mr-1" />
                                Name
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchType('phone')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    searchType === 'phone'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Icon name="call" size={16} className="inline mr-1" />
                                Phone
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchType('email')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    searchType === 'email'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Icon name="mail" size={16} className="inline mr-1" />
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchType('pan')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    searchType === 'pan'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Icon name="file-text" size={16} className="inline mr-1" />
                                PAN
                            </button>

                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="flex-1">
                                {getSearchInput()}
                            </div>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="search" size={16} />
                                        Search
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <ErrorMessage message={error} />
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Text weight="medium" className="text-gray-900">
                                    Search Results ({searchResults.length})
                                </Text>
                                <Text size="sm" className="text-gray-500">
                                    {selectedCandidates.size} selected
                                </Text>
                            </div>

                            {/* Results List */}
                            <div className="max-h-96 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                                {searchResults.map((candidate) => {
                                    const candidateId = candidate._id;
                                    const isSelected = selectedCandidates.has(candidateId);
                                    return (
                                        <div
                                            key={candidateId}
                                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                            onClick={() => toggleCandidateSelection(candidateId)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Checkbox */}
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleCandidateSelection(candidateId)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-600 mt-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                />

                                                {/* Avatar */}
                                                <Avatar
                                                    src={undefined}
                                                    fallback={`${candidate.first_name?.[0] || ''}${candidate.last_name?.[0] || ''}`}
                                                    size="md"
                                                />

                                                {/* Candidate Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <Text weight="medium" className="text-gray-900">
                                                                {candidate.display_name || `${candidate.first_name} ${candidate.last_name}`}
                                                            </Text>
                                                            <Text size="sm" className="text-gray-600">
                                                                {candidate.candidate_id}
                                                            </Text>
                                                        </div>
                                                        {candidate.total_experience && (
                                                            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                                {candidate.total_experience} exp
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 space-y-1">
                                                        {candidate.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Icon name="call" size={14} className="text-gray-400" />
                                                                {candidate.phone}
                                                            </div>
                                                        )}
                                                        {candidate.email && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Icon name="mail" size={14} className="text-gray-400" />
                                                                {candidate.email}
                                                            </div>
                                                        )}
                                                        {candidate.current_organisation && (
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Icon name="briefcase" size={14} className="text-gray-400" />
                                                                {candidate.current_organisation}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Primary Skills */}
                                                    {(() => {
                                                        if (!candidate.primary_skill) return null;
                                                        
                                                        const normalized = Array.isArray(candidate.primary_skill)
                                                            ? (candidate.primary_skill as any[]).flat(Infinity).filter(Boolean).join(', ')
                                                            : candidate.primary_skill;
                                                        
                                                        if (!normalized || typeof normalized !== 'string' || !normalized.trim()) return null;

                                                        const skillArray = normalized.split(',');
                                                        
                                                        return (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {skillArray.slice(0, 3).map((skill, idx) => (
                                                                    <Badge key={idx} variant="info" className="text-xs">
                                                                        {skill.trim()}
                                                                    </Badge>
                                                                ))}
                                                                {skillArray.length > 3 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        +{skillArray.length - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* No Results State */}
                    {!loading && searchResults.length === 0 && !error && (
                        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                            <Icon name="search" size={48} className="text-gray-300 mx-auto mb-3" />
                            <Text className="text-gray-500">
                                Enter search criteria and click Search to find candidates
                            </Text>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={loading}
                    >
                        Clear
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleMapSelected}
                            disabled={selectedCandidates.size === 0}
                            className="gap-2"
                        >
                            <Icon name="plus" size={16} />
                            Map {selectedCandidates.size > 0 ? `(${selectedCandidates.size})` : ''} Candidate{selectedCandidates.size !== 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MapCandidateModal;
