import React, { useState, useEffect } from 'react';
import Input from '../../atoms/Input';
import Label from '../../atoms/Label';

interface HeaderFormProps {
    initialData: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        designation?: string;
        date_of_birth?: string;
        pan_number?: string;
        uan_number?: string;
        current_city?: string;
        linkedin_profile?: string;
    };
    onDataChange: (data: any) => void;
}

const HeaderForm: React.FC<HeaderFormProps> = ({
    initialData,
    onDataChange
}) => {
    const [formData, setFormData] = useState({
        first_name: initialData.first_name || '',
        last_name: initialData.last_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        designation: initialData.designation || '',
        date_of_birth: initialData.date_of_birth || '',
        pan_number: initialData.pan_number || '',
        uan_number: initialData.uan_number || '',
        current_city: initialData.current_city || '',
        linkedin_profile: initialData.linkedin_profile || ''
    });

    useEffect(() => {
        onDataChange(formData);
    }, [formData, onDataChange]);

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="first_name" required>
                        First Name
                    </Label>
                    <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        placeholder="Enter first name"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="last_name" required>
                        Last Name
                    </Label>
                    <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        placeholder="Enter last name"
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="email" required>
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="Enter email address"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="phone" required>
                        Phone
                    </Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="Enter phone number"
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="designation">
                        Designation
                    </Label>
                    <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) => handleChange('designation', e.target.value)}
                        placeholder="Enter designation"
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="current_city">
                        Current City
                    </Label>
                    <Input
                        id="current_city"
                        value={formData.current_city}
                        onChange={(e) => handleChange('current_city', e.target.value)}
                        placeholder="Enter current city"
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date_of_birth">
                        Date of Birth
                    </Label>
                    <input
                        id="date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <Label htmlFor="linkedin_profile">
                        LinkedIn Profile
                    </Label>
                    <Input
                        id="linkedin_profile"
                        value={formData.linkedin_profile}
                        onChange={(e) => handleChange('linkedin_profile', e.target.value)}
                        placeholder="Enter LinkedIn profile URL"
                        className="mt-1"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="pan_number">
                        PAN Number
                    </Label>
                    <Input
                        id="pan_number"
                        value={formData.pan_number}
                        onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                        placeholder="Enter PAN number"
                        className="mt-1"
                        maxLength={10}
                    />
                </div>
                <div>
                    <Label htmlFor="uan_number">
                        UAN Number
                    </Label>
                    <Input
                        id="uan_number"
                        value={formData.uan_number}
                        onChange={(e) => handleChange('uan_number', e.target.value)}
                        placeholder="Enter UAN number"
                        className="mt-1"
                        maxLength={12}
                    />
                </div>
            </div>
        </div>
    );
};

export default HeaderForm;
