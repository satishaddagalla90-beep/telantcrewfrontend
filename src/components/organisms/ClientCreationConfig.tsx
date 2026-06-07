import React from 'react';
import { CreationStep } from '../templates/CreationFlowTemplate';

// Basic step component for client info
const ClientBasicInfoStep: React.FC<any> = ({ formData, onFormDataChange, errors, touched, onFieldTouch }) => {
    const handleInputChange = (field: string, value: any) => {
        onFormDataChange(field, value);
        onFieldTouch(field);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name*</label>
                    <input
                        type="text"
                        value={formData.companyName || ''}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.companyName && touched.companyName ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Enter company name"
                    />
                    {errors.companyName && touched.companyName && (
                        <p className="text-xs text-red-500">{errors.companyName}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Industry*</label>
                    <select
                        value={formData.industry || ''}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.industry && touched.industry ? 'border-red-500' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select industry</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="retail">Retail</option>
                    </select>
                    {errors.industry && touched.industry && (
                        <p className="text-xs text-red-500">{errors.industry}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Person*</label>
                    <input
                        type="text"
                        value={formData.contactPerson || ''}
                        onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contactPerson && touched.contactPerson ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Enter contact person name"
                    />
                    {errors.contactPerson && touched.contactPerson && (
                        <p className="text-xs text-red-500">{errors.contactPerson}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Email*</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Enter email address"
                    />
                    {errors.email && touched.email && (
                        <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Phone*</label>
                    <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone && touched.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                        placeholder="Enter phone number"
                    />
                    {errors.phone && touched.phone && (
                        <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Website</label>
                    <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter website URL"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">Address*</label>
                <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] ${errors.address && touched.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                    placeholder="Enter company address"
                />
                {errors.address && touched.address && (
                    <p className="text-xs text-red-500">{errors.address}</p>
                )}
            </div>
        </div>
    );
};

// Icons
const BuildingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
);

// Validation
const validateClientInfo = (formData: any) => {
    const errors: Record<string, string> = {};
    const requiredFields = ['companyName', 'industry', 'contactPerson', 'email', 'phone', 'address'];

    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
        }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
    }

    return Object.keys(errors).length > 0 ? errors : null;
};

// Define client creation steps
export const clientSteps: CreationStep[] = [
    {
        id: 'basic-info',
        title: 'Company Information',
        icon: <BuildingIcon />,
        component: ClientBasicInfoStep,
        validation: validateClientInfo
    },
    {
        id: 'contacts',
        title: 'Contacts & Requirements',
        icon: <UsersIcon />,
        component: ClientBasicInfoStep, // Can be different component
        isOptional: true
    }
];

// Initial form data for client
export const initialClientFormData = {
    clientId: `CLIENT-${Math.floor(10000 + Math.random() * 90000)}`,
    companyName: '',
    industry: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    requirements: '',
    notes: ''
};

// Duplicate check config for clients
export const clientDuplicateCheckConfig = {
    fields: [
        {
            key: 'companyName',
            label: 'Company Name',
            placeholder: 'Enter company name'
        },
        {
            key: 'email',
            label: 'Email Address',
            placeholder: 'Enter email address'
        },
        {
            key: 'phone',
            label: 'Phone Number',
            placeholder: 'Enter phone number'
        }
    ],
    checkFunction: async (data: any) => {
        // Mock API call
        const mockResults = [];

        if (data.companyName === 'TechCorp' || data.email === 'contact@techcorp.com') {
            mockResults.push({
                id: 'CLIENT-12345',
                companyName: 'TechCorp',
                email: 'contact@techcorp.com',
                phone: '+1-555-0123',
                matchType: data.companyName === 'TechCorp' ? 'Company Name' : 'Email'
            });
        }

        return mockResults;
    },
    resultColumns: [
        { key: 'id', label: 'Client ID' },
        { key: 'companyName', label: 'Company Name' },
        { key: 'matchType', label: 'Match Type' }
    ]
};
