import React, { useState } from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import ErrorMessage from '../../atoms/ErrorMessage';
import FormField from '../../molecules/FormField';
import DataTable from '../../molecules/DataTable';
import { CandidateSearchParams } from '../../../utils/api';
import { candidatesAPI } from '../../../utils/api/CandidatesAPI';
import { DuplicateCandidate } from '../../../utils/api/CandidatesAPI';

export interface DuplicateCheckModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Function to call when the modal should be closed */
    onClose: () => void;
    /** Function to call when user wants to continue with new candidate */
    onContinue?: () => void;
    /** Function to call when user selects an existing candidate */
    onSelectExisting?: (candidate: any) => void;
}

type CandidateData = DuplicateCandidate;

const DuplicateCheckModal: React.FC<DuplicateCheckModalProps> = ({
    isOpen,
    onClose,
    onContinue,
    onSelectExisting
}) => {
    // Form state
    const [pan, setPan] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [candidateData, setCandidateData] = useState<CandidateData[]>([]);

    // Initialize PocketBase (you might want to move this to a service/hook)
    // const pb = new (require('pocketbase'))('https://pb.talentcrew.tekishub.com');

    const handleCheckDuplicates = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        setError('');
        setCandidateData([]);

        // Validate if at least one field is filled
        if (!pan && !phone && !email) {
            setError('Please enter at least one field to check.');
            setLoading(false);
            return;
        }

        try {
            // Prepare search parameters
            const searchParams: CandidateSearchParams = {};

            if (pan.trim()) {
                searchParams.pan_number = pan.trim();
            }
            if (email.trim()) {
                searchParams.email = email.trim();
            }
            if (phone.trim()) {
                // Convert phone to number if it's a valid number
                const cleanPhone = phone.replace(/\D/g, '');
                const phoneNumber = parseInt(cleanPhone);
                if (!isNaN(phoneNumber) && cleanPhone.length >= 10) {
                    searchParams.phone = phoneNumber;
                }
            }

            // Call the API
            const response = await candidatesAPI.checkDuplicates(searchParams);

            console.log('API Response:', response); // Debug log

            if (response.duplicates && response.duplicates.length > 0) {
                console.log('Found duplicates:', response.duplicates); // Debug log
                setCandidateData(response.duplicates);
            } else {
                console.log('No duplicates found in response'); // Debug log
                setError('No matching candidates found with the provided details.');
            }

        } catch (err: any) {
            console.error('Error fetching candidates:', err);
            setError(err.message || 'Error checking for duplicates. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinueWithNew = () => {
        // Reset form
        setPan('');
        setPhone('');
        setEmail('');
        setCandidateData([]);
        setError('');

        onContinue?.();
        onClose();
    };

    const handleSelectCandidate = (candidate: CandidateData) => {
        onSelectExisting?.(candidate);
        onClose();
    };

    const resetAndClose = () => {
        // Reset form
        setPan('');
        setPhone('');
        setEmail('');
        setCandidateData([]);
        setError('');

        onClose();
    };

    // Columns for the candidates table
    const columns = [
        {
            key: 'candidate_id',
            label: 'ID',
            render: (value: string) => value || 'N/A'
        },
        {
            key: 'display_name',
            label: 'Name',
            render: (value: string) => value || 'N/A'
        },
        {
            key: 'pan_number',
            label: 'PAN',
            render: (value: string) => (
                <span className={value === pan ? "bg-green-100 text-green-800 font-medium px-1 rounded" : ""}>
                    {value || 'N/A'}
                </span>
            )
        },
        {
            key: 'phone',
            label: 'Phone',
            render: (value: number) => {
                const phoneStr = value ? value.toString() : '';
                return (
                    <span className={phoneStr === phone ? "bg-green-100 text-green-800 font-medium px-1 rounded" : ""}>
                        {phoneStr || 'N/A'}
                    </span>
                );
            }
        },
        {
            key: 'email',
            label: 'Email',
            render: (value: string) => (
                <span className={value === email ? "bg-green-100 text-green-800 font-medium px-1 rounded" : ""}>
                    {value || 'N/A'}
                </span>
            )
        },
        {
            key: 'current_organisation',
            label: 'Current Company',
            render: (value: string) => value || 'N/A'
        },
        {
            key: 'total_experience',
            label: 'Experience',
            render: (value: number) => value ? `${value} years` : 'N/A'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, row: CandidateData) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectCandidate(row)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                    Select
                </Button>
            )
        }
    ];

    const visibleColumns = {
        candidate_id: true,
        display_name: true,
        pan_number: true,
        phone: true,
        email: true,
        current_organisation: false, // Hide on smaller screens
        total_experience: true,
        actions: true
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={resetAndClose}
            title="Check for Duplicate Candidates"
            size="xl"
            closeOnBackdropClick={true}
            footer={
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between w-full">
                    <Button
                        variant="outline"
                        onClick={resetAndClose}
                        className="order-2 sm:order-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleContinueWithNew}
                        className="order-1 sm:order-2"
                    >
                        Continue with New Candidate
                    </Button>
                </div>
            }
        >
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Form Section */}
                <form onSubmit={handleCheckDuplicates} className="space-y-4 flex-shrink-0">
                    <Text className="text-gray-600 mb-4">
                        Enter candidate information to check for existing records in the system. You need to provide at least one field (PAN, phone, or email) to search.
                    </Text>

                    {/* Search Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* PAN Number Input */}
                        <FormField
                            label="PAN Number"
                            inputProps={{
                                id: 'panNumber',
                                type: 'text',
                                placeholder: 'Enter PAN number',
                                value: pan,
                                onChange: (e) => setPan(e.target.value.toUpperCase()),
                                maxLength: 10
                            }}
                        />

                        {/* Phone Number Input */}
                        <FormField
                            label="Phone Number"
                            inputProps={{
                                id: 'phoneNumber',
                                type: 'tel',
                                placeholder: 'Enter phone number',
                                value: phone,
                                onChange: (e) => setPhone(e.target.value),
                                maxLength: 15
                            }}
                        />

                        {/* Email Input */}
                        <FormField
                            label="Email Address"
                            inputProps={{
                                id: 'emailAddress',
                                type: 'email',
                                placeholder: 'Enter email address',
                                value: email,
                                onChange: (e) => setEmail(e.target.value.toLowerCase())
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    <ErrorMessage message={error} />

                    {/* Search Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full flex items-center justify-center gap-2"
                        disabled={loading || (!pan && !phone && !email)}
                    >
                        <Icon name="search" size={16} />
                        {loading ? 'Searching...' : 'Search for Duplicates'}
                    </Button>
                </form>

                {/* Results Section */}
                {candidateData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <Icon name="info" size={16} className="text-yellow-600 flex-shrink-0" />
                            <Text size="sm" className="text-yellow-800">
                                <span className="font-medium">{candidateData.length}</span> matching candidate{candidateData.length > 1 ? 's' : ''} found.
                                You can select an existing candidate or continue with creating a new one.
                            </Text>
                        </div>
                        
                        {/* Field Match Status */}
                        <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                            {pan && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">PAN:</span>
                                    <span className={candidateData.some(c => c.pan_number === pan) ? "text-green-600" : "text-red-600"}>
                                        {candidateData.some(c => c.pan_number === pan) ? '✓ Match found' : '✗ No match'}
                                    </span>
                                </div>
                            )}
                            {phone && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Phone:</span>
                                    <span className={candidateData.some(c => c.phone?.toString() === phone) ? "text-green-600" : "text-red-600"}>
                                        {candidateData.some(c => c.phone?.toString() === phone) ? '✓ Match found' : '✗ No match'}
                                    </span>
                                </div>
                            )}
                            {email && (
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Email:</span>
                                    <span className={candidateData.some(c => c.email === email) ? "text-green-600" : "text-red-600"}>
                                        {candidateData.some(c => c.email === email) ? '✓ Match found' : '✗ No match'}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="max-h-80 overflow-y-auto">
                                <div className="overflow-x-auto">
                                    <DataTable
                                        columns={columns}
                                        data={candidateData}
                                        visibleColumns={visibleColumns}
                                        emptyMessage="No candidates found"
                                        className="border-0 shadow-none min-w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default DuplicateCheckModal;
