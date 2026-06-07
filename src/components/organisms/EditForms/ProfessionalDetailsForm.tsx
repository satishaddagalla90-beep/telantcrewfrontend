import React, { useState, useEffect } from 'react';
import Input from '../../atoms/Input';
import Label from '../../atoms/Label';
import CreatableAsyncSelect from '../../molecules/CreatableAsyncSelect';
import { dropdownAPI } from '../../../utils/api';

interface ProfessionalDetailsFormProps {
  initialData: {
    total_experience: string;
    relevant_experience: string;
    current_ctc: string;
    expected_ctc: string;
    preferred_location: { label: string; value: string; }[];
    notice_period: string;
    job_open_type: string;
    preferred_job: string;
    job_preference: string;
    shift: string;
  };
  onDataChange: (data: any) => void;
}

const ProfessionalDetailsForm: React.FC<ProfessionalDetailsFormProps> = ({
  initialData,
  onDataChange,
}) => {
  const [formData, setFormData] = useState({
    total_experience: initialData.total_experience || '',
    relevant_experience: initialData.relevant_experience || '',
    current_ctc: initialData.current_ctc || '',
    expected_ctc: initialData.expected_ctc || '',
    preferred_location: initialData.preferred_location || [],
    notice_period: initialData.notice_period || '',
    job_open_type: initialData.job_open_type || '',
    preferred_job: initialData.preferred_job || '',
    job_preference: initialData.job_preference || '',
    shift: initialData.shift || '',
  });

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const experienceOptions = [
    { label: '0-1 years', value: '0-1' },
    { label: '1-2 years', value: '1-2' },
    { label: '2-3 years', value: '2-3' },
    { label: '3-5 years', value: '3-5' },
    { label: '5-8 years', value: '5-8' },
    { label: '8-12 years', value: '8-12' },
    { label: '12+ years', value: '12+' },
  ];

  const noticePeriodOptions = [
    { label: 'Immediate', value: 'immediate' },
    { label: '15 days', value: '15-days' },
    { label: '1 month', value: '1-month' },
    { label: '2 months', value: '2-months' },
    { label: '3 months', value: '3-months' },
    { label: 'Currently serving notice', value: 'serving-notice' },
  ];

  const jobOpenTypeOptions = [
    { label: 'Full Time', value: 'full-time' },
    { label: 'Part Time', value: 'part-time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Freelance', value: 'freelance' },
    { label: 'Internship', value: 'internship' },
  ];

  const jobPreferenceOptions = [
    { label: 'Remote', value: 'remote' },
    { label: 'On-site', value: 'on-site' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  const shiftOptions = [
    { label: 'Day Shift', value: 'day' },
    { label: 'Night Shift', value: 'night' },
    { label: 'Rotational', value: 'rotational' },
    { label: 'Flexible', value: 'flexible' },
  ];

  const preferredJobOptions = [
    { label: 'Software Developer', value: 'software-developer' },
    { label: 'Frontend Developer', value: 'frontend-developer' },
    { label: 'Backend Developer', value: 'backend-developer' },
    { label: 'Full Stack Developer', value: 'full-stack-developer' },
    { label: 'Mobile App Developer', value: 'mobile-app-developer' },
    { label: 'DevOps Engineer', value: 'devops-engineer' },
    { label: 'Data Scientist', value: 'data-scientist' },
    { label: 'Data Analyst', value: 'data-analyst' },
    { label: 'Machine Learning Engineer', value: 'ml-engineer' },
    { label: 'UI/UX Designer', value: 'ui-ux-designer' },
    { label: 'Product Manager', value: 'product-manager' },
    { label: 'Project Manager', value: 'project-manager' },
    { label: 'Business Analyst', value: 'business-analyst' },
    { label: 'Quality Assurance Engineer', value: 'qa-engineer' },
    { label: 'Test Engineer', value: 'test-engineer' },
    { label: 'System Administrator', value: 'system-admin' },
    { label: 'Database Administrator', value: 'database-admin' },
    { label: 'Cybersecurity Specialist', value: 'cybersecurity' },
    { label: 'Cloud Engineer', value: 'cloud-engineer' },
    { label: 'Technical Writer', value: 'technical-writer' },
    { label: 'Sales Executive', value: 'sales-executive' },
    { label: 'Marketing Specialist', value: 'marketing-specialist' },
    { label: 'Human Resources', value: 'human-resources' },
    { label: 'Finance Analyst', value: 'finance-analyst' },
    { label: 'Operations Manager', value: 'operations-manager' },
    { label: 'Customer Support', value: 'customer-support' },
    { label: 'Content Writer', value: 'content-writer' },
    { label: 'Graphic Designer', value: 'graphic-designer' },
    { label: 'Digital Marketing', value: 'digital-marketing' },
    { label: 'Other', value: 'other' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="total_experience" required>
            Total Experience
          </Label>
          <select
            id="total_experience"
            value={formData.total_experience}
            onChange={e => handleChange('total_experience', e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select total experience</option>
            {experienceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="relevant_experience" required>
            Relevant Experience
          </Label>
          <select
            id="relevant_experience"
            value={formData.relevant_experience}
            onChange={e => handleChange('relevant_experience', e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select relevant experience</option>
            {experienceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="current_ctc">Current CTC</Label>
          <Input
            id="current_ctc"
            value={formData.current_ctc}
            onChange={e => handleChange('current_ctc', e.target.value)}
            placeholder="e.g., 12 LPA"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="expected_ctc">Expected CTC</Label>
          <Input
            id="expected_ctc"
            value={formData.expected_ctc}
            onChange={e => handleChange('expected_ctc', e.target.value)}
            placeholder="e.g., 15 LPA"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="preferred_location">Preferred Locations</Label>
        <CreatableAsyncSelect
          isMulti
          value={formData.preferred_location}
          onChange={value => handleChange('preferred_location', value)}
          loadOptions={dropdownAPI.fetchLocations}
          placeholder="Select or type preferred locations..."
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="notice_period" required>
            Notice Period
          </Label>
          <select
            id="notice_period"
            value={formData.notice_period}
            onChange={e => handleChange('notice_period', e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select notice period</option>
            {noticePeriodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="job_open_type">Job Type</Label>
          <select
            id="job_open_type"
            value={formData.job_open_type}
            onChange={e => handleChange('job_open_type', e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select job type</option>
            {jobOpenTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="preferred_job">Preferred Job</Label>
          <select
            id="preferred_job"
            value={formData.preferred_job}
            onChange={e => handleChange('preferred_job', e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select preferred job</option>
            {preferredJobOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="job_preference">Work Preference</Label>
          <select
            id="job_preference"
            value={formData.job_preference}
            onChange={e => handleChange('job_preference', e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select work preference</option>
            {jobPreferenceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="shift">Shift Preference</Label>
        <select
          id="shift"
          value={formData.shift}
          onChange={e => handleChange('shift', e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select shift preference</option>
          {shiftOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ProfessionalDetailsForm;
