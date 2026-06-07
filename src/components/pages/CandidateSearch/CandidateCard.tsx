import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../atoms/Button';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import { CandidateData } from './types';
import MapJobsToCandidateModal from '../../components/modals/MapJobsToCandidateModal';

interface CandidateCardProps {
  candidate: CandidateData;
  isSelected: boolean;
  onSelectChange: (id: string) => void;
  comment: string;
  onCommentClick: (candidate: CandidateData) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  onSelectChange,
  comment,
  onCommentClick,
}) => {
  const navigate = useNavigate();
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const resumeUrl = candidate.resumeUrl?.trim();
  const hasResume = Boolean(resumeUrl);
  return (
    <div className="bg-white rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all">
      {/* Map Jobs Modal */}
      <MapJobsToCandidateModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        candidateId={candidate.id}
        candidateHumanId={candidate.candidateId}
        candidateName={candidate.name}
      />

      {/* Card Body - Synchronized Grid Layout */}
      <div className="p-3 grid grid-cols-[1fr_0.54fr] gap-3">
        {/* Row 1-2: Name & Stats (2 rows height) Left | Avatar Right */}
        <div className="row-span-2 pb-1 border-b border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => navigate(`/applicants/${candidate.id}`)}
                className="text-xl font-bold text-gray-900 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-left"
              >
                {candidate.name}
              </button>
              {candidate.isActivelyLooking && (
                <>
                  <span className="text-xs text-blue-600 font-medium">·</span>
                  <span className="text-xs text-blue-600 font-medium">
                    Actively looking
                  </span>
                </>
              )}
              <span className="text-xs text-purple-600 font-medium">·</span>
              <span className="text-xs text-purple-600 font-medium">
                Trending
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {candidate.title} at {candidate.currentCompany}
            </p>
          </div>
       
        </div>

        <div className="flex justify-center row-span-3">
          {candidate.avatar ? (
            <img 
              src={candidate.avatar} 
              alt={candidate.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-base font-semibold">
              {candidate.name
                .split(' ')
                .map(n => n[0])
                .join('')}
            </div>
          )}
        </div>

        {/* Row 2: Empty to maintain grid alignment */}
        <div></div>

        {/* Row 3: Education & Preferences & Skills Left | Contact & PAN/DOB Right */}
        <div className="space-y-1.5 pb-1 border-b border-gray-200 text-xs">
             <div className="flex items-center gap-2 text-xs">
            <div>
              <span className="text-gray-500">Total Experience:</span>
              <span className="font-medium text-gray-900 ml-1">
                {candidate.experience}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-gray-500">Current CTC:</span>
              <span className="font-medium text-gray-900 ml-1">
                {candidate.salary}
              </span>
            </div>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-gray-500">Current Location:</span>
              <span className="font-medium text-gray-900 ml-1">
                {candidate.location}
              </span>
            </div>
          </div>
          <div className='flex'>
            <span className="text-gray-500">Education:</span>
            <span className="text-gray-900 ml-1">
              {typeof candidate.education === 'string' ? (
                candidate.education
              ) : Array.isArray(candidate.education) ? (
                <div className="ml-1 space-y-1">
                  {candidate.education.map((edu, idx) => (
                    <div key={idx}>
                      {edu.degree} ({edu.subject}) from {edu.university} passed out {edu.passingYear}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ml-1">
                  {candidate.education.degree} ({candidate.education.subject}) from {candidate.education.university} passed out {candidate.education.passingYear}
                </div>
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Pref Location:</span>
            <span className="text-gray-900 ml-1">
              {candidate.preferredLocations.slice(0, 2).join(', ')}
            </span>
          </div>
          <div className='flex items-start space-x-2'>
            <span className="text-gray-500 font-medium block mb-1.5">
              Skills:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {candidate.keySkills.slice(0, 6).map((skill, idx) => (
                <span
                  key={idx}
                  // className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-default"
                >
                  {skill}
                  {idx < candidate.keySkills.slice(0, 6).length - 1 && ' |'}
                </span>
              ))}
            </div>
          </div>
          {/* <div className="text-gray-400 text-xs flex items-center gap-1">
                        <Icon name="check" className="w-3 h-3 text-green-500" />
                        <span>Verified</span>
                    </div> */}
        </div>

        <div className="space-y-2 text-xs pb-1 border-b border-gray-200">
          {/* Contact Info - Phone & Email */}
          <div className="grid grid-cols-2 gap-1.5 text-center">
            <div>
              <div className="text-gray-500">Phone</div>
              <div className="text-gray-900 font-medium">
                {candidate.phone || '+91 9876543210'}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Email</div>
              <div className="text-gray-900 font-medium break-all">
                {candidate.email || 'email@example.com'}
              </div>
            </div>
          </div>
          {/* PAN & DOB */}
          <div className="grid grid-cols-2 gap-1.5 text-center">
            <div>
              <div className="text-gray-500">PAN</div>
              <div className="text-gray-900 font-medium">ABCDE1234F</div>
            </div>
            <div>
              <div className="text-gray-500">DOB</div>
              <div className="text-gray-900 font-medium">15 Jan 1995</div>
            </div>
          </div>
        </div>

        {/* Row 4: Similar Profiles Left | Comment Right */}
        <div className="pb-1 border-gray-200 flex items-end">
          <a
            // variant="ghost"
            // size="sm"
            href='/'
            className="pl-0.5 h-auto font-semibold text-xs -ml-1 justify-start hover:underline"
          >
           <span className='text-blue-600 '> ({candidate.similarProfiles})</span> Similar Profiles
          </a>
          {/* <div className="text-xs">
                        <span className="text-gray-500">May also know:</span>
                        <span className="text-gray-700 ml-1">
                            {candidate.additionalSkills?.slice(0, 3).join(', ')}
                        </span>
                    </div> */}
        </div>

        <div className="pb-1 border-gray-200 flex space-x-4">
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="w-full text-gray-600 hover:text-gray-900 border border-gray-300 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded font-medium text-xs justify-center items-center gap-1.5"
            onClick={() => onCommentClick(candidate)}
          >
            <Icon name="chat" className="w-4 h-4" />
            {comment ? 'Edit Comment' : 'Add Comment'}
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => setIsMapModalOpen(true)}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Card Footer - Metrics */}
      <div className="bg-gray-50 px-3 py-1 rounded-b-lg border-t border-gray-200 flex items-center justify-between text-xs">
        {/* Left Section: Eye, Download, Resume */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Icon name="eye" className="w-4 h-4 text-gray-400" />
            <Text className="text-gray-500 text-xs">Views</Text>

            <Text className="font-semibold text-gray-700 text-xs">
              {candidate.profileViews}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="download" className="w-4 h-4 text-gray-400" />
            <Text className="text-gray-500 text-xs">Downloads</Text>

            <Text className="font-semibold text-gray-700 text-xs">
              {candidate.downloads}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Text className="text-gray-500 text-xs">Resume</Text>
            <Button
              variant="ghost"
              size="sm"
              className={`p-0 h-auto text-blue-600 ${!hasResume ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (resumeUrl) {
                  window.open(resumeUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              disabled={!hasResume}
              aria-label={hasResume ? 'View resume' : 'Resume not available'}
            >
              <Icon name="attachment" className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Center Space */}
        <div className="flex-1"></div>

        {/* Right Section: Modified & Viewed On */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Text className="text-gray-500 text-xs">Modified On</Text>
            <Text className="text-gray-700 text-xs font-medium">
              {candidate.lastActive}
            </Text>
          </div>
          <div className="flex items-center gap-1.5">
            <Text className="text-gray-500 text-xs">Viewed On</Text>
            <Text className="text-gray-700 text-xs font-medium">
              {" "}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;
