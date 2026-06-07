import React, { useState } from 'react';
import { useSWR } from '../../../../utils/api';
import { API_ENDPOINTS } from '../../../../utils/api/endpoints';
import Text from '../../../atoms/Text';
import Badge from '../../../atoms/Badge';
import Card from '../../../molecules/Card';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import Input from '../../../atoms/Input';
import Avatar from '../../../atoms/Avatar';
import SelectField from '../../../molecules/SelectField';
import { useNavigate } from 'react-router-dom';
import { formatUIDate } from '../../../../utils/dateFormat';

interface AppliedJobsTabProps {
  candidateId: string;
  onAddJob?: () => void;
  canUpdate?: boolean;
}

const getStatusBadgeClass = (status?: string) => {
  if (!status) return 'bg-gray-100 text-gray-600';
  const s = status.toLowerCase();
  if (['hired', 'shortlisted', 'selected'].includes(s)) return 'bg-green-100 text-green-700';
  if (['rejected'].includes(s)) return 'bg-red-100 text-red-700';
  if (['interview', 'screening'].includes(s)) return 'bg-blue-100 text-blue-700';
  if (['offer'].includes(s)) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-600'; // Default for Applied, etc.
};

const getStatusDisplayName = (status?: string) => {
  if (!status) return 'Applied';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const AppliedJobsTab: React.FC<AppliedJobsTabProps> = ({ 
  candidateId, 
  onAddJob,
  canUpdate = true
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: jobsResponse, error, loading, mutate } = useSWR<any>(
    candidateId ? API_ENDPOINTS.RECRUITMENT.CANDIDATE_JOBS(candidateId) : null
  );

  const jobsData = Array.isArray(jobsResponse) ? jobsResponse : (jobsResponse?.data || []);

  const filteredJobs = jobsData.filter((job: any) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (job.job_title || '').toLowerCase().includes(searchLower) ||
      (job.client_name || '').toLowerCase().includes(searchLower) ||
      (job.job_id || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <div className="pb-4 flex flex-row items-center justify-between">
        <Text
          variant="h3"
          className="text-lg font-medium flex items-center gap-2"
        >
          <Icon name="briefcase" className="w-5 h-5 text-blue-600" />
          Applied Jobs
        </Text>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {jobsData.length} jobs
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={onAddJob}
            disabled={!canUpdate}
          >
            <Icon name="plus" size={16} />
            Map Job
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Icon
            name="search"
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search jobs by title, client, or ID..."
            className="w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 whitespace-nowrap"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="funnel" size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <Text variant="h4" weight="medium" className="mb-3">
            Filter Jobs
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Text className="text-sm font-medium text-gray-500 mb-1 block">
                Status
              </Text>
              <SelectField
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'applied', label: 'Applied' },
                  { value: 'screening', label: 'Screening' },
                  { value: 'interview', label: 'Interview' },
                  { value: 'offer', label: 'Offer' },
                  { value: 'hired', label: 'Hired' },
                ]}
                placeholder="All Statuses"
                value="all"
                onChange={() => { }}
              />
            </div>
            <div>
              <Text className="text-sm font-medium text-gray-500 mb-1 block">
                Job Type
              </Text>
              <SelectField
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'FullTime', label: 'Full Time' },
                  { value: 'Contract', label: 'Contract' },
                ]}
                placeholder="All Types"
                value="all"
                onChange={() => { }}
              />
            </div>
            <div>
              <Text className="text-sm font-medium text-gray-500 mb-1 block">
                Job Owner
              </Text>
              <SelectField
                options={[
                  { value: 'all', label: 'All Owners' },
                ]}
                placeholder="All Owners"
                value="all"
                onChange={() => { }}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" className="mr-2">
              Reset
            </Button>
            <Button size="sm">Apply Filters</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Text>Loading applied jobs...</Text>
        </div>
      ) : error ? (
        <div className="flex justify-center py-8 text-red-500">
          <Text>Error loading applied jobs. Please try again.</Text>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex justify-center py-8 text-gray-500 text-center">
          <Text>No applied jobs found.</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {filteredJobs.map((job: any) => {
            const skillsList = job.primary_skill_set?.length ? job.primary_skill_set : job.skill_set || [];
            const displaySkills = skillsList.slice(0, 2);
            const extraSkillsCount = skillsList.length - 2;
            const initials = job.client_name ? job.client_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'JB';

            return (
              <Card key={job.id} className="overflow-visible h-full flex flex-col border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 flex flex-col h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <Avatar
                        src=""
                        fallback={initials}
                        size="lg"
                        className="bg-blue-100 text-blue-600"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <Text variant="h4" weight="medium" className="text-lg truncate">
                            {job.job_title}
                          </Text>
                          <Text size="sm" className="text-gray-500 truncate mt-0.5">
                            {job.client_name} {job.client_req_id ? `(${job.client_req_id})` : ''}
                          </Text>
                        </div>
                        <div className="flex-shrink-0 mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${getStatusBadgeClass(job.status)}`}>
                            {getStatusDisplayName(job.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        {/* Skills Container (fixed height 24px) */}
                        {(() => {
                          return (
                            <div 
                              className="flex items-center gap-1 mb-2 h-6" 
                              title={skillsList.join(', ')}
                            >
                              {displaySkills.map((skill: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="rounded-full text-xs shrink-0"
                                >
                                  <span className="truncate inline-block align-bottom max-w-[110px]">
                                    {skill}
                                  </span>
                                </Badge>
                              ))}
                              {extraSkillsCount > 0 && (
                                <Badge variant="secondary" className="rounded-full text-xs shrink-0">
                                  +{extraSkillsCount}
                                </Badge>
                              )}
                              {skillsList.length === 0 && (
                                <span className="text-xs text-gray-400 italic">No skills listed</span>
                              )}
                            </div>
                          );
                        })()}
                        
                        <div className="flex justify-between text-sm mt-1">
                          <Text className="text-gray-500 flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-gray-700 shrink-0">{job.job_type || 'FullTime'}</span>
                            <span className="text-gray-400 shrink-0">|</span>
                            <span className="text-gray-600 truncate max-w-[100px]" title={job.job_owner || 'Unassigned'}>{job.job_owner || 'Unassigned'}</span>
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer anchored to the bottom */}
                  <div className="mt-auto pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)}`}>
                        {formatUIDate(job.mapped_date)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-blue-600 text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        View Job
                      </Button>
                    </div>
                    {/* Progress indicator */}
                    <div className="flex items-center w-full">
                      <div
                        className={`h-1.5 rounded-l-full w-1/4 ${
                          ['interview', 'offer', 'hired'].includes(
                            (job.status || '').toLowerCase()
                          )
                            ? 'bg-blue-600'
                            : (job.status || '').toLowerCase() === 'screening'
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                      <div
                        className={`h-1.5 w-1/4 ${
                          ['offer', 'hired'].includes((job.status || '').toLowerCase())
                            ? 'bg-blue-600'
                            : (job.status || '').toLowerCase() === 'interview'
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                      <div
                        className={`h-1.5 w-1/4 ${
                          ['hired'].includes((job.status || '').toLowerCase())
                            ? 'bg-blue-600'
                            : (job.status || '').toLowerCase() === 'offer'
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                      <div
                        className={`h-1.5 rounded-r-full w-1/4 ${
                          ['hired'].includes((job.status || '').toLowerCase())
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 uppercase font-medium">
                      <span>Screening</span>
                      <span>Interview</span>
                      <span>Offer</span>
                      <span>Hired</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Section */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="text-sm text-gray-500">
          Showing {filteredJobs.length} of {jobsData.length} jobs
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled>
            <Icon name="caret-left" size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-blue-50 text-blue-600 border-blue-200 font-medium"
          >
            1
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            2
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            3
          </Button>
          <Button variant="outline" size="sm">
            <Icon name="caret-right" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

