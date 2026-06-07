import React, { useState, useEffect } from 'react';
import Stepper from '../../molecules/Stepper/Stepper';
import PersonalDetailsStep from '../CandidateSteps/PersonalDetailsStep';
import ProfessionalDetailsStep from '../CandidateSteps/ProfessionalDetailsStep';
import EducationSkillsStep from '../CandidateSteps/EducationSkillsStep';
import EmploymentProjectsStep from '../CandidateSteps/EmploymentProjectsStep';
import DocumentsOthersStep from '../CandidateSteps/DocumentsOthersStep';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import { useAuth } from '../../auth/AuthContext';

const pb: any = null; // PocketBase integration available when installed

interface FormStepsProps {
    initialData?: any;
    onComplete?: (data: any) => void;
}

// Form step configuration
const steps = [
    {
        label: 'Personal Details',
        icon: '👤',
        description: 'Basic information and contact details'
    },
    {
        label: 'Professional Details',
        icon: '💼',
        description: 'Experience and career information'
    },
    {
        label: 'Education & Skills',
        icon: '📚',
        description: 'Educational background and technical skills'
    },
    {
        label: 'Employment & Projects',
        icon: '🏢',
        description: 'Work experience and key projects'
    },
    {
        label: 'Documents & Others',
        icon: '📋',
        description: 'Document uploads and additional information'
    }
];

const CandidateFormSteps: React.FC<FormStepsProps> = ({
    initialData = {},
    onComplete
}) => {
    const { user } = useAuth(); // Get current authenticated user
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFieldChange = (field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev: Record<string, string>) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Mark field as touched
        setTouched((prev: Record<string, boolean>) => ({
            ...prev,
            [field]: true
        }));
    };

    const validateCurrentStep = () => {
        const currentErrors: Record<string, string> = {};

        switch (currentStep) {
            case 1:
                // Personal Details validation
                const requiredPersonalFields = ['firstName', 'lastName', 'email', 'phone', 'dob'];
                requiredPersonalFields.forEach(field => {
                    if (!formData[field] || formData[field].trim() === '') {
                        currentErrors[field] = `${field} is required`;
                    }
                });
                break;

            case 2:
                // Professional Details validation
                const requiredProfessionalFields = ['currentCTC', 'expectedCTC', 'totalExp'];
                requiredProfessionalFields.forEach(field => {
                    if (!formData[field]) {
                        currentErrors[field] = `${field} is required`;
                    }
                });
                break;

            // Add validation for other steps as needed
        }

        setErrors(currentErrors);
        return Object.keys(currentErrors).length === 0;
    };

    const handleNext = async () => {
        if (!validateCurrentStep()) {
            return;
        }

        if (currentStep < steps.length) {
            setCurrentStep((prev: number) => prev + 1);
        } else {
            // Final submission
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep((prev: number) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (pb) {
                // API integration patterns from temp2.tsx
                await submitCandidateData(formData);
            }

            if (onComplete) {
                await onComplete(formData);
            }
        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // API submission functions from temp2.tsx patterns
    const submitCandidateData = async (data: any) => {
        try {
            // Generate candidate ID
            const candidateId = await generateCandidateId();

            // Create candidate record
            const candidate = await createCandidate({ ...data, candidate_id: candidateId });

            // Submit related data
            await Promise.all([
                submitEducationRecords(candidate.id, data.educationList),
                submitSkillRecords(candidate.id, data.skillsList),
                submitEmploymentRecords(candidate.id, data.employmentList),
                submitProjectRecords(candidate.id, data.projectsList),
                submitCertificationRecords(candidate.id, data.certificationsList)
            ]);

            console.log('Candidate submitted successfully:', candidate);
            return candidate;
        } catch (error) {
            console.error('Failed to submit candidate:', error);
            throw error;
        }
    };

    const generateCandidateId = async () => {
        try {
            const result = await pb?.collection("Candidate").getList(1, 1, {
                sort: "-candidate_id",
            });

            const lastCandidate = result?.items[0];
            const lastId = lastCandidate?.candidate_id ?? "CDI00";
            const lastNumber = parseInt(lastId.replace("CDI", "")) || 0;
            return `CDI${(lastNumber + 1).toString().padStart(2, "0")}`;
        } catch (error) {
            console.error("Error generating Candidate ID:", error);
            return `CDI${Math.floor(10 + Math.random() * 90).toString().padStart(2, "0")}`;
        }
    };

    const createCandidate = async (data: any) => {
        const payload = new FormData();

        // Basic fields
        payload.append("first_name", data.firstName || "");
        payload.append("middle_name", data.middleName || "");
        payload.append("last_name", data.lastName || "");
        payload.append("display_name", data.displayName || "");
        payload.append("phone", data.phone || "");
        payload.append("alt_phone", data.alternatePhone || "");
        payload.append("email", data.email || "");
        payload.append("alt_email", data.alternateEmail);
        payload.append("gender", data.gender || "");
        payload.append("date_of_birth", data.dob || "");
        payload.append("pan_number", data.panNo || "");
        payload.append("current_address", data.currentAddress || "");
        payload.append("permanant_address", data.permanentAddress || "");
        payload.append("candidate_id", data.candidate_id);

        // Add created_by field with current user's display_name
        payload.append("created_by", user?.display_name || "");

        // Professional fields
        payload.append("current_ctc", data.current_ctc || "");
        payload.append("expected_ctc", data.expected_ctc || "");
        payload.append("total_experience", data.total_experience || "");
        payload.append("profile_summary", data.profile_summary || "");

        // Additional professional fields
        payload.append("notice_period", data.notice_period || "");
        payload.append("career_break", data.career_break ? "Yes" : "No");
        if (data.career_break === 'Yes' && data.career_break_type) {
            payload.append("career_break_type", data.career_break_type);
        }
        payload.append("differently_abled", data.differently_abled ? "Yes" : "No");
        if (data.differently_abled === 'Yes' && data.differently_abled_type) {
            payload.append("differently_abled_type", data.differently_abled_type);
        }
        if (data.linkedin_profile) {
            payload.append("linkedin_profile", data.linkedin_profile);
        }
        if (data.preffered_location) {
            payload.append("preferred_location", data.preffered_location);
        }
        if (data.location) {
            payload.append("current_location", data.location);
        }
        if (data.relevantExperience) {
            payload.append("relevant_experience", data.relevantExperience);
        }

        // Files
        if (data.candidatePicture instanceof File) {
            payload.append("candidate_picture", data.candidatePicture);
        }
        if (data.resume instanceof File) {
            payload.append("resume", data.resume);
        }

        return pb?.collection("Candidate").create(payload);
    };

    const submitEducationRecords = async (candidateId: string, educationList: any[] = []) => {
        for (const edu of educationList) {
            await pb?.collection("CandidateEducation").create({
                candidate: [candidateId],
                college_studied: edu.college,
                gpa: edu.gpa,
                year_of_Passing: edu.year,
                education_type: edu.type,
                subject: edu.subject,
                university_studied: edu.university,
                education_degree: edu.degree,
                is_pursuing: edu.isPursuing || false,
            });
        }
    };

    const submitSkillRecords = async (candidateId: string, skillsList: any[] = []) => {
        for (const skill of skillsList) {
            await pb?.collection("CandidateSkillsets").create({
                candidate: [candidateId],
                experience: Number(skill.years || 0),
                skill_name: skill.skillName,
                expertise: skill.expertise,
                rating: Number(skill.rating || 0),
            });
        }
    };

    const submitEmploymentRecords = async (candidateId: string, employmentList: any[] = []) => {
        for (const emp of employmentList) {
            await pb?.collection("CandidateExperience").create({
                employer_name: emp.employer,
                job_type: emp.jobType,
                payroll_organisation: emp.payrollOrg,
                designation: emp.designation,
                location: [emp.location],
                candidate: candidateId,
                till_date: emp.tillDate,
                from: emp.fromDate,
                to: emp.toDate,
            });
        }
    };

    const submitProjectRecords = async (candidateId: string, projectsList: any[] = []) => {
        for (const proj of projectsList) {
            await pb?.collection("CandidateProjects").create({
                candidate: candidateId,
                customer_name: proj.customerName,
                project_type: proj.projectType,
                designation: proj.designation,
                employer_name: proj.employerName,
                till_date: proj.tillDate,
                from: proj.fromDate,
                to: proj.toDate,
            });
        }
    };

    const submitCertificationRecords = async (candidateId: string, certificationsList: any[] = []) => {
        for (const cert of certificationsList) {
            await pb?.collection("CandidateCertification").create({
                candidate: candidateId,
                certification_name: cert.name,
                certification_no: cert.number,
                institution_name: cert.institution,
                certificate_date: cert.certDate,

                valid_until_date: cert.validTill,
            });
        }
    };

    const renderStepContent = () => {
        const stepProps = {
            formData,
            onChange: handleFieldChange,
            errors,
            touched
        };

        switch (currentStep) {
            case 1:
                return <PersonalDetailsStep {...stepProps} />;
            case 2:
                return <ProfessionalDetailsStep {...stepProps} />;
            case 3:
                return <EducationSkillsStep {...stepProps} />;
            case 4:
                return <EmploymentProjectsStep {...stepProps} />;
            case 5:
                return <DocumentsOthersStep {...stepProps} />;
            default:
                return <PersonalDetailsStep {...stepProps} />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Progress Stepper */}
            <Stepper
                steps={steps}
                currentStep={currentStep}
                className="mb-8"
            />

            {/* Step Content */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="px-6 py-8">
                    {renderStepContent()}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
                <Button
                    onClick={handlePrevious}
                    disabled={currentStep === 1}
                    variant="outline"
                >
                    <Icon name="caret-left" className="w-5 h-5 mr-2" />
                    Previous
                </Button>

                <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    variant="primary"
                >
                    {isSubmitting ? (
                        <>
                            <Icon name="loading" className="w-5 h-5 mr-2 animate-spin" />
                            Submitting...
                        </>
                    ) : currentStep === steps.length ? (
                        <>
                            Submit
                            <Icon name="check" className="w-5 h-5 ml-2" />
                        </>
                    ) : (
                        <>
                            Next
                            <Icon name="caret-right" className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>

            {/* Progress Information */}
            <div className="flex justify-center">
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                    Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.label}
                </div>
            </div>
        </div>
    );
};

export default CandidateFormSteps;
