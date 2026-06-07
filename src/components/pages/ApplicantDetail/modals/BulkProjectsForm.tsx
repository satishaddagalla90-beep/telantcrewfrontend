import React, {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import SearchDropdown from '../../../molecules/SearchDropdown';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import DateInput from '../../../atoms/DateInput/DateInput';
import { useOrganizationsFromEmploymentDropdown } from '../../../../hooks/useOrganizationDropdown';
import { useCustomersDropdown, useDesignationsDropdown, useProjectTypesDropdown, useStaticDropdowns, useIndustryDropdown } from '../../../../hooks/useDropdowns';

interface ProjectFormData {
  id?: string;
  customerName: string;
  projectType: string;
  designation: string;
  organizationName: string;
  industry: string;
  fromDate: string;
  toDate: string;
  isCurrentProject: boolean;
}

interface EmploymentData {
  fromTo?: string;
  organizationName?: string;
}

interface BulkProjectsFormProps {
  initialData: { projects: ProjectFormData[] };
  onDataChange: (data: any) => void;
  canUpdateCandidates: boolean;
  canDeleteCandidates: boolean;
  candidateId?: string;
  employmentData?: EmploymentData[];
}

export const BulkProjectsForm = forwardRef<any, BulkProjectsFormProps>(
  (
    {
      initialData,
      onDataChange,
      canUpdateCandidates,
      canDeleteCandidates,
      candidateId,
      employmentData = [],
    },
    ref
  ) => {
    // All hooks and state declarations at the top
    const [data, setData] = useState(initialData);
    const [lastSentData, setLastSentData] = useState(initialData);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [errors, setErrors] = useState<{
      [projectIdx: number]: { [field: string]: string };
    }>({});

    // Hook for organization names from candidate employment history
    const { options: organizationOptions, loading: organizationLoading, search: organizationSearch } =
      useOrganizationsFromEmploymentDropdown(candidateId);

    // Use searchable dropdown hooks
    const {
      options: customerOptions,
      loading: customerLoading,
      search: searchCustomers,
    } = useCustomersDropdown();

    const {
      options: designationOptions,
      loading: designationLoading,
      search: searchDesignations,
    } = useDesignationsDropdown();

    const {
      options: projectTypeOptions,
      loading: projectTypeLoading,
      search: searchProjectTypes,
    } = useProjectTypesDropdown();

    const {
      options: industryOptions,
      loading: industryLoading,
      search: searchIndustries,
    } = useIndustryDropdown();

    useImperativeHandle(
      ref,
      () => ({
        validateAllFields: () => {
          const allErrors = validateAll(data.projects);
          setErrors(allErrors);
          // Return true if no errors
          return Object.keys(allErrors).length === 0;
        },
      }),
      [data.projects]
    );

    // Helper function to sort projects by date (latest first)
    const sortProjectsByDate = useCallback((projectList: ProjectFormData[]) => {
      return [...projectList].sort((a, b) => {
        // isCurrentProject entries go to the end
        if (a.isCurrentProject && !b.isCurrentProject) return 1;
        if (!a.isCurrentProject && b.isCurrentProject) return -1;
        if (a.isCurrentProject && b.isCurrentProject) return 0;
        
        // Sort by fromDate (latest first)
        // Handle yyyy-mm format for project dates
        let fromDateStrA = a.fromDate || '';
        let fromDateStrB = b.fromDate || '';
        
        if (fromDateStrA && fromDateStrA.match(/^\d{4}-\d{2}$/)) {
          fromDateStrA = `${fromDateStrA}-01`;
        }
        if (fromDateStrB && fromDateStrB.match(/^\d{4}-\d{2}$/)) {
          fromDateStrB = `${fromDateStrB}-01`;
        }
        
        const dateA = fromDateStrA ? new Date(fromDateStrA).getTime() : 0;
        const dateB = fromDateStrB ? new Date(fromDateStrB).getTime() : 0;
        return dateB - dateA;
      });
    }, []);

    // Send updates when focus changes or when data changes significantly
    useEffect(() => {
      if (
        !focusedField &&
        JSON.stringify(data) !== JSON.stringify(lastSentData)
      ) {
        // Auto-sort projects by date before sending to parent
        const sortedData = {
          ...data,
          projects: sortProjectsByDate(data.projects),
        };
        onDataChange(sortedData);
        setLastSentData(data);
      }
    }, [data, lastSentData, focusedField, onDataChange, sortProjectsByDate]);

    // List of required fields
    const requiredFields: (keyof ProjectFormData)[] = [
      'customerName',
      'projectType',
      'designation',
      'organizationName',
      'fromDate',
      'toDate',
    ];

    // Helper function to find matching employment period
    const findEmploymentPeriod = (organizationName: string) => {
      if (!organizationName || typeof organizationName !== 'string') return null;
      
      const employment = employmentData.find(
        emp => {
          let empOrgName = emp.organizationName;
          // Normalize: could be array or string
          if (Array.isArray(empOrgName)) {
            empOrgName = empOrgName[0];
          }
          if (typeof empOrgName === 'string' && empOrgName.trim()) {
            return empOrgName.toLowerCase() === organizationName.toLowerCase();
          }
          return false;
        }
      );
      if (!employment || !employment.fromTo) return null;

      const [fromDate, toDate] = employment.fromTo.split(' - ');
      return {
        fromDate: fromDate || '',
        toDate:
          toDate === 'Present'
            ? new Date().toISOString().split('T')[0]
            : toDate || '',
      };
    };

    // Helper to check if organization corresponds to a current job
    const isOrganizationCurrentJob = (organizationName: string) => {
      if (!organizationName || typeof organizationName !== 'string') return false;
      
      const employment = employmentData.find(
        emp => {
          let empOrgName = emp.organizationName;
          // Normalize: could be array or string
          if (Array.isArray(empOrgName)) {
            empOrgName = empOrgName[0];
          }
          if (typeof empOrgName === 'string' && empOrgName.trim()) {
            return empOrgName.toLowerCase() === organizationName.toLowerCase();
          }
          return false;
        }
      );
      if (!employment || !employment.fromTo) return false;
      // Check if fromTo contains 'Present' (case insensitive)
      return employment.fromTo.toLowerCase().includes('present');
    };

    // Validate a single project
    const validateProject = (project: ProjectFormData) => {
      const projectErrors: { [field: string]: string } = {};
      
      // Validate required fields except industry which is conditionally required
      requiredFields.forEach(field => {
        // Skip industry validation here as it's conditionally required
        if (field === 'industry') return;
        
        const value = project[field];
        if (
          value === undefined ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          projectErrors[field] = 'This field is required.';
        }
      });
      
      // Conditionally validate industry field
      // Industry is required only when customerName is 'Confidential'
      if (project.customerName === 'Confidential') {
        if (!project.industry || project.industry.trim() === '') {
          projectErrors['industry'] = 'This field is required when customer is Confidential.';
        }
      }

      // If isCurrentProject is true, toDate is not required
      if (project.isCurrentProject) {
        delete projectErrors['toDate'];
      }

      // Validate project dates against employment dates for the specific organization
      if (project.organizationName && project.organizationName.trim()) {
        const employmentPeriod = findEmploymentPeriod(project.organizationName);

        // Only validate if we found a matching employment record
        if (employmentPeriod && project.fromDate) {
          // Handle different date formats for comparison
          let projectFrom, employmentFrom, employmentTo;
          
          try {
            // For project dates in yyyy-mm format, create a date at the beginning of the month
            if (project.fromDate.match(/^\d{4}-\d{2}$/)) {
              projectFrom = new Date(`${project.fromDate}-01`);
            } else {
              projectFrom = new Date(project.fromDate);
            }
            
            // For employment dates in yyyy-mm format, create a date at the beginning of the month
            if (employmentPeriod.fromDate.match(/^\d{4}-\d{2}$/)) {
              employmentFrom = new Date(`${employmentPeriod.fromDate}-01`);
            } else {
              employmentFrom = new Date(employmentPeriod.fromDate);
            }
            
            if (employmentPeriod.toDate.match(/^\d{4}-\d{2}$/)) {
              employmentTo = new Date(`${employmentPeriod.toDate}-01`);
            } else {
              employmentTo = new Date(employmentPeriod.toDate);
            }

            // Validate project start date is within employment period
            if (projectFrom < employmentFrom) {
              projectErrors['fromDate'] =
                `Project start date must be on or after ${employmentPeriod.fromDate} (employment start with this organization)`;
            }
            if (projectFrom > employmentTo) {
              projectErrors['fromDate'] =
                `Project start date must be on or before ${employmentPeriod.toDate} (employment end with this organization)`;
            }

            // Validate project end date is within employment period
            if (project.toDate && !project.isCurrentProject) {
              let projectTo;
              if (project.toDate.match(/^\d{4}-\d{2}$/)) {
                projectTo = new Date(`${project.toDate}-01`);
              } else {
                projectTo = new Date(project.toDate);
              }
              
              if (projectTo < employmentFrom) {
                projectErrors['toDate'] =
                  `Project end date must be on or after ${employmentPeriod.fromDate} (employment start with this organization)`;
              }
              if (projectTo > employmentTo) {
                projectErrors['toDate'] =
                  `Project end date must be on or before ${employmentPeriod.toDate} (employment end with this organization)`;
              }
            }
          } catch (e) {
            console.warn('Error validating project dates:', e);
          }
        } else if (!employmentPeriod && project.organizationName.trim()) {
          // Warn if organization is selected but not found in employment history
          projectErrors['organizationName'] =
            `No employment record found for "${project.organizationName}". Please add employment first or select a different organization.`;
        }
      }
      return projectErrors;
    };

    // Validate all projects
    const validateAll = (projects: ProjectFormData[]) => {
      const allErrors: { [projectIdx: number]: { [field: string]: string } } =
        {};
      projects.forEach((project, idx) => {
        const errs = validateProject(project);
        if (Object.keys(errs).length > 0) {
          allErrors[idx] = errs;
        }
      });
      return allErrors;
    };

    const handleProjectChange = useCallback(
      (index: number, field: keyof ProjectFormData, value: any) => {
        setData(prev => {
          const updatedProjects = [...prev.projects];
          
          // If isCurrentProject is being changed, reset toDate
          if (field === 'isCurrentProject') {
            updatedProjects[index] = {
              ...updatedProjects[index],
              [field]: value,
              toDate: '', // Reset toDate when checkbox state changes
            };
          } else {
            const updates: any = { [field]: value };

            // If organization changes to one that isn't a current job, reset isCurrentProject
            if (field === 'organizationName' && !isOrganizationCurrentJob(value)) {
              updates.isCurrentProject = false;
            }

            updatedProjects[index] = {
              ...updatedProjects[index],
              ...updates,
            };
          }
          
          return { ...prev, projects: updatedProjects };
        });
        setErrors(prevErrors => {
          const updatedProjects = [...data.projects];
          
          // If isCurrentProject is being changed, reset toDate
          if (field === 'isCurrentProject') {
            updatedProjects[index] = {
              ...updatedProjects[index],
              [field]: value,
              toDate: '', // Reset toDate when checkbox state changes
            };
          } else {
            const updates: any = { [field]: value };

            // If organization changes to one that isn't a current job, reset isCurrentProject
            if (field === 'organizationName' && !isOrganizationCurrentJob(value)) {
              updates.isCurrentProject = false;
            }

            updatedProjects[index] = {
              ...updatedProjects[index],
              ...updates,
            };
          }
          
          const projectErrors = validateProject(updatedProjects[index]);
          return { ...prevErrors, [index]: projectErrors };
        });
      },
      [data.projects]
    );

    const handleFocus = useCallback((field: string) => {
      setFocusedField(field);
    }, []);

    const handleBlur = useCallback(() => {
      setFocusedField(null);
      setErrors(validateAll(data.projects));
    }, [data.projects]);

    const handleAddProject = () => {
      if (!canUpdateCandidates) {
        console.warn('User does not have permission to update candidate data');
        return;
      }
      const newData = {
        ...data,
        projects: [
          ...data.projects,
          {
            customerName: '',
            projectType: '',
            designation: '',
            organizationName: '',
            industry: '',
            fromDate: '',
            toDate: '',
            isCurrentProject: false,
          },
        ],
      };
      setData(newData);
      setErrors(prev => ({
        ...prev,
        [newData.projects.length - 1]: validateProject(
          newData.projects[newData.projects.length - 1]
        ),
      }));
      onDataChange(newData);
      setLastSentData(newData);
    };

    const handleRemoveProject = (index: number) => {
      if (!canDeleteCandidates) {
        console.warn('User does not have permission to delete candidate data');
        return;
      }
      const newData = {
        ...data,
        projects: data.projects.filter((_, i) => i !== index),
      };
      setData(newData);
      // Remove errors for the deleted project
      setErrors(prev => {
        const newErrors: { [projectIdx: number]: { [field: string]: string } } =
          {};
        Object.keys(prev).forEach(idxStr => {
          const idx = Number(idxStr);
          if (idx < index) {
            newErrors[idx] = prev[idx];
          } else if (idx > index) {
            newErrors[idx - 1] = prev[idx];
          }
          // If idx === index, skip (removes the error for the deleted project)
        });
        return newErrors;
      });
      onDataChange(newData);
      setLastSentData(newData);
    };

    return (
      <div
        className="p-6 space-y-6"
        onFocus={e =>
          handleFocus(e.target.getAttribute('data-field') || 'present')
        }
        onBlur={handleBlur}
      >
        <div className="space-y-4">
          {data.projects.map((project, index) => (
            <div
              key={project.id || index}
              className="p-4 border rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-900 font-semibold">Project {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={
                    canDeleteCandidates
                      ? () => handleRemoveProject(index)
                      : undefined
                  }
                  disabled={!canDeleteCandidates}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon name="trash" size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SearchDropdown
                    label="Customer Name"
                    options={customerOptions}
                    value={project.customerName}
                    onChange={(option: any) => {
                      // Reset industry when customer name changes
                      handleProjectChange(index, 'customerName', option?.label || '');
                      handleProjectChange(index, 'industry', '');
                      setFocusedField(null);
                    }}
                    required
                    loading={customerLoading}
                    placeholder="Search for customer..."
                    showAddButton={true}
                    dropdownType="Customer"
                    dropdownLabel="Customer"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchCustomers(input);
                      }
                    }}
                    onOptionAdded={newOption => {
                      // Refresh customer options
                      searchCustomers('');
                    }}
                  />
                  {errors[index]?.customerName && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].customerName}
                    </div>
                  )}
                </div>
                <div>
                  <SearchDropdown
                    label="Project Type"
                    options={projectTypeOptions}
                    value={project.projectType}
                    onChange={(option: any) => {
                      handleProjectChange(index, 'projectType', option?.label || '');
                      setFocusedField(null);
                    }}
                    required
                    loading={projectTypeLoading}
                    placeholder="Search for project type..."
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchProjectTypes(input);
                      }
                    }}
                  />
                  {errors[index]?.projectType && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].projectType}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SearchDropdown
                    label="Designation"
                    options={designationOptions}
                    value={project.designation}
                    onChange={(option: any) => {
                      handleProjectChange(index, 'designation', option?.label || '');
                      setFocusedField(null);
                    }}
                    required
                    loading={designationLoading}
                    placeholder="Search for designation..."
                    showAddButton={true}
                    dropdownType="Designation"
                    dropdownLabel="Designation"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchDesignations(input);
                      }
                    }}
                    onOptionAdded={newOption => {
                      // Refresh designation options
                      searchDesignations('');
                    }}
                  />
                  {errors[index]?.designation && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].designation}
                    </div>
                  )}
                </div>
                <div>
                  <SearchDropdown
                    label="Industry"
                    options={industryOptions}
                    value={project.industry}
                    onChange={(option: any) => {
                      handleProjectChange(index, 'industry', option?.label || '');
                      setFocusedField(null);
                    }}
                    required
                    loading={industryLoading}
                    placeholder="Search for industry..."
                    showAddButton={true}
                    dropdownType="Industry"
                    dropdownLabel="Industry"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        searchIndustries(input);
                      }
                    }}
                    onOptionAdded={newOption => {
                      // Refresh industry options
                      searchIndustries('');
                    }}
                    disabled={project.customerName !== 'Confidential'}
                  />
                  {errors[index]?.industry && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].industry}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <SearchDropdown
                    label="Organization"
                    options={organizationOptions}
                    value={project.organizationName}
                    onChange={(option: any) => {
                      handleProjectChange(index, 'organizationName', option?.label || '');
                      setFocusedField(null);
                    }}
                    required
                    loading={organizationLoading}
                    placeholder="Search for organization..."
                    // showAddButton={true}
                    // dropdownType="Employer"
                    // dropdownLabel="Organization"
                    onInputChange={(input: string, action: any) => {
                      // Search when user types
                      if (action.action === 'input-change') {
                        organizationSearch(input);
                      }
                    }}
                    onOptionAdded={newOption => {
                      // Refresh organization options
                      organizationSearch('');
                    }}
                  />
                  {errors[index]?.organizationName && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].organizationName}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <DateInput
                    label="From Date"
                    mode="month"
                    value={project.fromDate}
                    onChange={value =>
                      handleProjectChange(index, 'fromDate', value)
                    }
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors[index]?.fromDate && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].fromDate}
                    </div>
                  )}
                </div>
                <div>
                  <DateInput
                    label="To Date"
                    mode="month"
                    value={project.toDate}
                    onChange={value =>
                      handleProjectChange(index, 'toDate', value)
                    }
                    required
                    min={project.fromDate}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={project.isCurrentProject}
                  />
                  {errors[index]?.toDate && (
                    <div className="text-red-500 text-xs mt-1">
                      {errors[index].toDate}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {!data.projects.some((proj, i) => i !== index && proj.isCurrentProject) &&
                  isOrganizationCurrentJob(project.organizationName) && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={project.isCurrentProject}
                        onChange={e =>
                          handleProjectChange(
                            index,
                            'isCurrentProject',
                            e.target.checked
                          )
                        }
                      />
                      <span className="text-sm">This is my current project</span>
                    </label>
                  )}
              </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={canUpdateCandidates ? handleAddProject : undefined}
          disabled={!canUpdateCandidates}
          className="w-full"
        >
          <Icon name="plus" size={16} className="mr-2" />
          Add Project
        </Button>
      </div>
    );
  }
);
