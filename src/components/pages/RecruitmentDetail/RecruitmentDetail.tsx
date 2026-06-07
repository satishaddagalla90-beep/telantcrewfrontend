import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RequirementAPI } from '../../../types/recruitment';
import { apiCall, API_ENDPOINTS, clearNetCache } from '../../../utils/api';
import DetailTemplate from '../../templates/DetailTemplate';
import Breadcrumb from '../../organisms/BreadCrumb';
import DetailHeader from '../../organisms/DetailHeader';
import Card from '../../molecules/Card';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';
import Avatar from '../../atoms/Avatar';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../auth/AuthContext';
import { formatUIDate, formatUIDateTime } from '../../../utils/dateFormat';

// Tab components
import { EducationTab, EmploymentTab, ProjectTab, CertificationTab, DocumentTab } from './tabs';
import { FileUploadService } from '../../../services/fileUploadService';

const parseStageLevel = (stage?: string) => {
  const cleaned = (stage || '').trim();
  const match = cleaned.match(/^(.*?)(?:\s*[-–—]\s*)?(L\d+|HR|Customer)\s*$/i);
  if (!match) {
    return { baseStage: cleaned, level: null as number | null, levelStr: null as string | null };
  }
  const suffix = match[2].trim();
  const isNumeric = /^L\d+$/i.test(suffix);
  return {
    baseStage: match[1].trim(),
    level: isNumeric ? Number(suffix.replace(/^L/i, '')) : null,
    levelStr: suffix,
  };
};

const getNextInterviewLevel = (selectedStageName: string, currentStatus?: string | null) => {
  const { baseStage, level } = parseStageLevel(currentStatus || '');
  if (level && baseStage.toLowerCase() === selectedStageName.toLowerCase()) {
    return level + 1;
  }
  return 1;
};

// Normalize status value from backend (could be string or object)
const normalizeStatus = (s?: any) => {
  if (s === undefined || s === null) return 'Submitted';
  if (typeof s === 'string') return s;
  if (typeof s === 'object') return s.name || s.label || String(s);
  return String(s);
};

const getBaseStageName = (statusName: string) => statusName.replace(/\s*-\s*(?:L\d+|HR|Customer)$/i, '').trim();

const toDatetimeLocalValue = (isoString?: string) => {
  if (!isoString) return '';
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return '';
  const offset = parsed.getTimezoneOffset();
  const adjusted = new Date(parsed.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
};

const getStageLabels = (history: any[] = []): string[] => {
  return history.map((entry: any) => (
    entry?.to_stage || entry?.stage || entry?.to_stage_code || entry?.stage_code || 'Unknown Stage'
  ));
};

const findMatchingStatusOption = (statuses: any[], currentStatus: any) => {
  if (!Array.isArray(statuses) || statuses.length === 0) return null;
  const currentCode = currentStatus?.code;
  const currentName = normalizeStatus(currentStatus?.name || currentStatus);
  const baseName = getBaseStageName(currentName);

  if (currentCode) {
    const byCode = statuses.find((status: any) => status.code === currentCode);
    if (byCode) return byCode;
  }

  return statuses.find((status: any) => {
    const name = normalizeStatus(status.name);
    return name.toLowerCase() === currentName.toLowerCase() || name.toLowerCase() === baseName.toLowerCase();
  }) || null;
};

const getCurrentStageHistoryEntry = (requirementData: RequirementAPI | null) => {
  if (!requirementData) return null;
  const statusObj = requirementData.status_obj;
  const currentName = normalizeStatus(requirementData.status);
  const currentCode = statusObj?.code;
  const baseName = getBaseStageName(currentName).toLowerCase();

  return [...(requirementData.stage_history || [])].reverse().find((entry: any) => {
    if (currentCode && entry.to_stage_code === currentCode) return true;
    const entryName = normalizeStatus(entry.to_stage || entry.stage);
    return entryName.toLowerCase() === currentName.toLowerCase() || entryName.toLowerCase() === baseName;
  }) || null;
};

const getInterviewStatusRank = (statusName: string) => {
  const name = statusName.toLowerCase();
  if (name.includes('request')) return 1;
  if (name.includes('no show')) return 2;
  if (name.includes('reschedule')) return 3;
  if (name.includes('completed')) return 4;
  if (name.includes('feedback pending')) return 5;
  if (name.includes('shortlist')) return 6;
  if (name.includes('reject')) return 7;
  return 0;
};

const RecruitmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdateJobs } = usePermissions();
  const { user: currentUser } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('education');
  const [requirementData, setRequirementData] = useState<RequirementAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [applicantPictureUrl, setApplicantPictureUrl] = useState<string | null>(null);

  // Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedStatusObj, setSelectedStatusObj] = useState<null | any>(null);
  const [currentCandidateStatusObj, setCurrentCandidateStatusObj] = useState<null | any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  const [statusSearch, setStatusSearch] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [statusDateTime, setStatusDateTime] = useState('');
  const [selectedInterviewLevel, setSelectedInterviewLevel] = useState(1);
  const [currentInterviewLevel, setCurrentInterviewLevel] = useState<number | null>(null);
  const [dynamicInterviewLevelChecked, setDynamicInterviewLevelChecked] = useState(false);
  const [selectedLevelType, setSelectedLevelType] = useState<'numeric' | 'HR' | 'Customer' | null>(null);
  const [nonDynamicScheduleChecked, setNonDynamicScheduleChecked] = useState(false);
  const [dynamicStatuses, setDynamicStatuses] = useState<any[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  useEffect(() => {
    // Intentionally left blank: dropdowns are fetched on-demand when opening modal.
  }, []);

  const fetchStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const res = await apiCall<any>(`${API_ENDPOINTS.RECRUITMENT.DROPDOWNS('Recruitment_Stages')}?limit=100`);
      const data = res?.data?.data || res?.data || res;
      if (Array.isArray(data)) {
        setDynamicStatuses(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
      return dynamicStatuses || [];
    } finally {
      setLoadingStatuses(false);
    }
  };

  // Ensure we have statuses for the timeline on initial load
  useEffect(() => {
    if (!dynamicStatuses || dynamicStatuses.length === 0) {
      fetchStatuses().catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAcrossCycleStatus = (s: any) => {
    if (!s) return false;
    const grp = (s.group || '').toLowerCase();
    return grp === 'across interview cycle' || grp === 'stage 10' || s.sequence === 10;
  };

  const mainStatuses = dynamicStatuses.filter(s =>
    !isAcrossCycleStatus(s) &&
    s.code !== 'FEEDBACK_PENDING' &&
    s.code !== 'NO_UPDATE'
  );

  const acrossCycleStatuses = dynamicStatuses.filter(s =>
    isAcrossCycleStatus(s)
  );

  // Determine candidate's current sequence (stage)
  const currentStatusName = normalizeStatus(requirementData?.status);
  const currentStatusObj = requirementData?.status_obj || null;
  const matchedCandidateStatus = findMatchingStatusOption(dynamicStatuses, currentStatusObj || currentStatusName);

  const activeCandidateStatus = currentCandidateStatusObj || matchedCandidateStatus;
  const isAlreadyRejected =
    activeCandidateStatus?.code === 'SCREEN_REJECT' ||
    activeCandidateStatus?.code === 'CLIENT_SCREEN_REJECT' ||
    activeCandidateStatus?.code === 'INTERVIEW_REJECT' ||
    activeCandidateStatus?.code === 'APPLICANT_BACKOUT' ||
    activeCandidateStatus?.code === 'CLIENT_BACKOUT' ||
    (activeCandidateStatus?.name && (
      normalizeStatus(activeCandidateStatus.name).toLowerCase() === 'screen reject' ||
      normalizeStatus(activeCandidateStatus.name).toLowerCase() === 'client screen reject' ||
      normalizeStatus(activeCandidateStatus.name).toLowerCase() === 'interview reject' ||
      normalizeStatus(activeCandidateStatus.name).toLowerCase().startsWith('interview reject') ||
      normalizeStatus(activeCandidateStatus.name).toLowerCase() === 'applicant backout' ||
      normalizeStatus(activeCandidateStatus.name).toLowerCase() === 'client backout'
    ));

  let currentSeq = activeCandidateStatus?.sequence || 1;

  // If the candidate's current stage is an Across Interview Cycle stage, lookup stage_history to find their last standard sequence.
  if (isAcrossCycleStatus(activeCandidateStatus)) {
    const lastMainEntry = [...(requirementData?.stage_history || [])].reverse().find((h: any) => {
      const matchedStage = dynamicStatuses.find(s => {
        const name = normalizeStatus(s.name);
        const hName = normalizeStatus(h.to_stage || h.stage);
        return (s.code && s.code === h.to_stage_code) || name.toLowerCase() === hName.toLowerCase();
      });
      return matchedStage && !isAcrossCycleStatus(matchedStage);
    });

    if (lastMainEntry) {
      const matchedStage = dynamicStatuses.find(s => {
        const name = normalizeStatus(s.name);
        const hName = normalizeStatus(lastMainEntry.to_stage || lastMainEntry.stage);
        return (s.code && s.code === lastMainEntry.to_stage_code) || name.toLowerCase() === hName.toLowerCase();
      });
      if (matchedStage) {
        currentSeq = matchedStage.sequence || 1;
      }
    }
  }

  // Find all unique main sequences and sort them
  const sortedSequences = Array.from(new Set(mainStatuses.map(s => s.sequence || 0)))
    .sort((a, b) => a - b);

  const currentSeqIdx = sortedSequences.indexOf(currentSeq);
  const nextSeq = currentSeqIdx !== -1
    ? (currentSeqIdx + 1 < sortedSequences.length ? sortedSequences[currentSeqIdx + 1] : null)
    : (sortedSequences.find(seq => seq > currentSeq) || null);

  const isPositiveOutcome = (s: any) => {
    if (!s) return false;
    const name = (s.name || '').toLowerCase();
    const code = (s.code || '').toLowerCase();
    return (
      code.includes('select') ||
      code.includes('shortlist') ||
      code.includes('submitted_to_client') ||
      code.includes('offered') ||
      name.includes('select') ||
      name.includes('shortlist') ||
      name.includes('submitted to client') ||
      name.includes('offered')
    );
  };

  const isNegativeOutcome = (s: any) => {
    if (!s) return false;
    const name = (s.name || '').toLowerCase();
    const code = (s.code || '').toLowerCase();
    return (
      code.includes('reject') ||
      code.includes('backout') ||
      code.includes('drop') ||
      code.includes('no_show') ||
      code.includes('no response') ||
      code.includes('fitment') ||
      name.includes('reject') ||
      name.includes('backout') ||
      name.includes('drop') ||
      name.includes('no show') ||
      name.includes('no response') ||
      name.includes('fitment')
    );
  };

  const getHidingRulesForSeq = (seq: number) => {
    const currentInSeq = currentCandidateStatusObj?.sequence === seq ? currentCandidateStatusObj : null;
    const selectedInSeq = selectedStatusObj?.sequence === seq ? selectedStatusObj : null;

    let hasPositive = false;
    let hasNegative = false;

    if (currentInSeq) {
      if (isPositiveOutcome(currentInSeq)) hasPositive = true;
      if (isNegativeOutcome(currentInSeq)) hasNegative = true;
    }
    if (selectedInSeq) {
      if (isPositiveOutcome(selectedInSeq)) hasPositive = true;
      if (isNegativeOutcome(selectedInSeq)) hasNegative = true;
    }

    return { hideSelect: hasNegative, hideReject: hasPositive };
  };

  const isInterviewUnlocked = currentSeq >= 4;

  const isCandNoShow = (s: any) => {
    if (!s) return false;
    const name = normalizeStatus(s.name || s).toLowerCase();
    const code = (s.code || '').toLowerCase();
    return name.includes('candidate no show') || code.includes('candidate_no_show');
  };

  const isPanNoShow = (s: any) => {
    if (!s) return false;
    const name = normalizeStatus(s.name || s).toLowerCase();
    const code = (s.code || '').toLowerCase();
    return name.includes('panel no show') || code.includes('panel_no_show');
  };

  const currentStatusIsCandNoShow = isCandNoShow(requirementData?.status);
  const currentStatusIsPanNoShow = isPanNoShow(requirementData?.status);

  const selectedIsCandNoShow = isCandNoShow(selectedStatusObj);
  const selectedIsPanNoShow = isPanNoShow(selectedStatusObj);

  const hideCandidateNoShow = selectedIsPanNoShow || currentStatusIsPanNoShow;
  const hidePanelNoShow = selectedIsCandNoShow || currentStatusIsCandNoShow;

  const { baseStage: currentBase, level: currentLvl } = parseStageLevel(currentStatusName);

  // Filter list to only contain currentSeq and nextSeq options, and apply select vs reject hiding rules
  const allowedMainStatuses = mainStatuses.filter(s => {
    const seq = s.sequence || 0;
    if (seq !== currentSeq && seq !== nextSeq) {
      return false;
    }

    const rules = getHidingRulesForSeq(seq);
    if (isNegativeOutcome(s) && rules.hideReject) return false;
    if (isPositiveOutcome(s) && rules.hideSelect) return false;

    if (isCandNoShow(s) && hideCandidateNoShow) return false;
    if (isPanNoShow(s) && hidePanelNoShow) return false;

    // Apply progression rank hiding for interview statuses in the active level
    const isDynamic = s.is_dynamic_level === true || s.is_dynamic_level === 'true' || s.is_dynamic_level === 1 || s.is_dynamic_level === '1';
    const { levelStr: currentLevelStr } = parseStageLevel(currentStatusName);
    const isShortlisted = currentStatusName.toLowerCase().includes('shortlist');
    const isActiveLevel = selectedLevelType === 'HR'
      ? (currentLevelStr?.toUpperCase() === 'HR')
      : selectedLevelType === 'Customer'
        ? (currentLevelStr?.toUpperCase() === 'CUSTOMER')
        : selectedLevelType === 'numeric'
          ? (selectedInterviewLevel === currentLvl && currentLevelStr !== null && /^L\d+$/i.test(currentLevelStr))
          : (
            (currentLevelStr?.toUpperCase() === 'HR' && !isShortlisted) ||
            (currentLevelStr?.toUpperCase() === 'CUSTOMER' && !isShortlisted) ||
            (selectedInterviewLevel === currentLvl && currentLevelStr !== null && /^L\d+$/i.test(currentLevelStr))
          );

    if (isDynamic && isActiveLevel) {
      const currentRank = getInterviewStatusRank(currentBase);
      const optionRank = getInterviewStatusRank(s.name);

      if (currentRank > 0 && optionRank > 0) {
        if (currentRank === 3) {
          if (optionRank < 3) return false;
        } else {
          if (optionRank <= currentRank) return false;
        }
      }
    }

    return true;
  });

  const filteredStatuses = allowedMainStatuses.filter(s =>
    s.name.toLowerCase().includes(statusSearch.toLowerCase())
  );

  const recruitmentStages = dynamicStatuses.map(s => s.name);

  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const stageLabels = requirementData?.stage_history?.length ? getStageLabels(requirementData.stage_history) : recruitmentStages;

  const handleNextStage = () => {
    if (currentStageIndex < stageLabels.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    }
  };

  const handlePreviousStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
    }
  };

  useEffect(() => {
    const stageHistoryLabels = getStageLabels(requirementData?.stage_history || []);
    const statusName = normalizeStatus(requirementData?.status);

    if (requirementData && stageHistoryLabels.length > 0) {
      const stageIndex = stageHistoryLabels.findIndex(
        (stage: string) => stage.toLowerCase() === statusName.toLowerCase()
      );
      setCurrentStageIndex(stageIndex !== -1 ? stageIndex : stageHistoryLabels.length - 1);
    } else if (requirementData && recruitmentStages.length > 0) {
      const status = normalizeStatus(requirementData.status);
      const stageIndex = recruitmentStages.findIndex(
        stage => stage.toLowerCase() === status.toLowerCase()
      );
      if (stageIndex !== -1) {
        setCurrentStageIndex(stageIndex);
      }
    }
  }, [requirementData, dynamicStatuses]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (timelineContainerRef.current) {
        const container = timelineContainerRef.current;
        const itemWidth = 140;
        const index = currentStageIndex;
        const itemLeft = 16 + index * itemWidth; // accounting for px-4 padding
        const clientWidth = container.clientWidth;

        const targetScrollLeft = itemLeft - (clientWidth / 2) + (itemWidth / 2);
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }, 150); // Small timeout to ensure DOM layout is complete

    return () => clearTimeout(timer);
  }, [currentStageIndex, requirementData]);

  const requiresSchedule = !!selectedStatusObj && (selectedStatusObj.requires_schedule === true || selectedStatusObj.requires_schedule === 'true' || selectedStatusObj.requires_schedule === 1 || selectedStatusObj.requires_schedule === '1');
  const requiresComment = !!selectedStatusObj && (selectedStatusObj.requires_comment === true || selectedStatusObj.requires_comment === 'true' || selectedStatusObj.requires_comment === 1 || selectedStatusObj.requires_comment === '1');
  const isDynamicLevel = !!selectedStatusObj && (selectedStatusObj.is_dynamic_level === true || selectedStatusObj.is_dynamic_level === 'true' || selectedStatusObj.is_dynamic_level === 1 || selectedStatusObj.is_dynamic_level === '1');

  const getScheduledTimeForLevelStr = (levelStr: string, statusObjToCheck?: any) => {
    if (!requirementData) return '';
    const targetStatus = statusObjToCheck || selectedStatusObj;
    if (!targetStatus) return '';
    const baseName = getBaseStageName(normalizeStatus(targetStatus.name)).toLowerCase();
    const entry = [...(requirementData.stage_history || [])].reverse().find((h: any) => {
      const toStage = normalizeStatus(h.to_stage || h.stage || '').toLowerCase();
      const hLevel = h.extra_details?.interview_level;
      return toStage.startsWith(baseName) && (
        (hLevel && String(hLevel).toUpperCase() === levelStr.toUpperCase()) ||
        toStage.endsWith(`- ${levelStr.toLowerCase()}`)
      );
    });
    return toDatetimeLocalValue(entry?.extra_details?.scheduled_at || '');
  };

  const getScheduledTimeForLevel = (level: number, statusObjToCheck?: any) => {
    return getScheduledTimeForLevelStr(`L${level}`, statusObjToCheck);
  };

  const getScheduledTimeForNonDynamic = () => {
    if (!requirementData || !selectedStatusObj) return '';
    const statusName = normalizeStatus(selectedStatusObj.name).toLowerCase();
    const entry = [...(requirementData.stage_history || [])].reverse().find((h: any) => {
      const toStage = normalizeStatus(h.to_stage || h.stage || '').toLowerCase();
      return toStage === statusName;
    });
    return toDatetimeLocalValue(entry?.extra_details?.scheduled_at || '');
  };

  const getLatestScheduledTime = () => {
    if (!requirementData || !requirementData.stage_history) return null;
    let latestDate: Date | null = null;
    for (const h of requirementData.stage_history) {
      const scheduledAt = h.extra_details?.scheduled_at;
      if (scheduledAt) {
        const d = new Date(scheduledAt);
        if (!Number.isNaN(d.getTime())) {
          if (!latestDate || d > latestDate) {
            latestDate = d;
          }
        }
      }
    }
    return latestDate;
  };

  const getMinDateForNextLevel = () => {
    const now = new Date();
    const latestScheduled = getLatestScheduledTime();
    let minDate = now;
    if (latestScheduled) {
      const nextDayLocal = new Date(latestScheduled);
      nextDayLocal.setDate(nextDayLocal.getDate() + 1);
      nextDayLocal.setHours(0, 0, 0, 0); // Start of next calendar day
      minDate = nextDayLocal > now ? nextDayLocal : now;
    }
    return toDatetimeLocalValue(minDate.toISOString());
  };

  useEffect(() => {
    if (selectedStatusObj) {
      const baseStageName = getBaseStageName(normalizeStatus(selectedStatusObj.name));
      const currentStatusName = normalizeStatus(requirementData?.status);

      if (isDynamicLevel) {
        const { level: currentLevel, levelStr: currentLevelStr } = parseStageLevel(currentStatusName);

        let computedCurrentLevel: number | null = null;
        if (requirementData?.status_obj?.current_interview_level) {
          const lvl = String(requirementData.status_obj.current_interview_level).trim();
          if (/^L\d+$/i.test(lvl)) {
            computedCurrentLevel = Number(lvl.replace(/^L/i, ''));
          }
        } else {
          computedCurrentLevel = currentLevel;
        }

        const isCurrentRoundShortlisted = currentStatusName.toLowerCase().includes('shortlist');
        setCurrentInterviewLevel(computedCurrentLevel);

        let nextLevel = 1;
        if (computedCurrentLevel !== null) {
          nextLevel = isCurrentRoundShortlisted ? (computedCurrentLevel + 1) : computedCurrentLevel;
        }
        setSelectedInterviewLevel(nextLevel);

        const { baseStage: currentBase } = parseStageLevel(currentStatusName);
        const selectedBase = getBaseStageName(normalizeStatus(selectedStatusObj.name));

        const isSameStatusNumeric = selectedStatusObj &&
          currentBase.toLowerCase() === selectedBase.toLowerCase() &&
          currentLevelStr !== null && /^L\d+$/i.test(currentLevelStr) &&
          currentLevel === nextLevel;

        const isSameStatusHR = selectedStatusObj &&
          currentBase.toLowerCase() === selectedBase.toLowerCase() &&
          currentLevelStr?.toUpperCase() === 'HR';

        const isSameStatusCustomer = selectedStatusObj &&
          currentBase.toLowerCase() === selectedBase.toLowerCase() &&
          currentLevelStr?.toUpperCase() === 'CUSTOMER';

        if (isSameStatusNumeric) {
          setSelectedLevelType('numeric');
          setDynamicInterviewLevelChecked(true);
          const hasScheduledTime = !!getScheduledTimeForLevelStr(`L${nextLevel}`);
          if (hasScheduledTime && requiresSchedule) {
            setStatusDateTime(getScheduledTimeForLevelStr(`L${nextLevel}`));
          } else {
            setStatusDateTime('');
          }
        } else if (isSameStatusHR) {
          setSelectedLevelType('HR');
          setDynamicInterviewLevelChecked(true);
          const hasScheduledTime = !!getScheduledTimeForLevelStr('HR');
          if (hasScheduledTime && requiresSchedule) {
            setStatusDateTime(getScheduledTimeForLevelStr('HR'));
          } else {
            setStatusDateTime('');
          }
        } else if (isSameStatusCustomer) {
          setSelectedLevelType('Customer');
          setDynamicInterviewLevelChecked(true);
          const hasScheduledTime = !!getScheduledTimeForLevelStr('Customer');
          if (hasScheduledTime && requiresSchedule) {
            setStatusDateTime(getScheduledTimeForLevelStr('Customer'));
          } else {
            setStatusDateTime('');
          }
        } else {
          // Do not reset the user's level selection if they are just clicking 
          // a new status pill in the unlocked interview column.
          // setSelectedLevelType(null);
          // setDynamicInterviewLevelChecked(false);
          // setStatusDateTime('');
        }
        setNonDynamicScheduleChecked(false);
      } else {
        setCurrentInterviewLevel(null);
        setSelectedInterviewLevel(1);
        setDynamicInterviewLevelChecked(false);
        setSelectedLevelType(null);

        // Find existing schedule in history for this specific non-dynamic status
        const statusName = normalizeStatus(selectedStatusObj.name).toLowerCase();
        const existingEntry = [...(requirementData?.stage_history || [])].reverse().find((h: any) => {
          const toStage = normalizeStatus(h.to_stage || h.stage || '').toLowerCase();
          return toStage === statusName;
        });

        const scheduledAt = existingEntry?.extra_details?.scheduled_at || '';
        setStatusDateTime(toDatetimeLocalValue(scheduledAt));
        setNonDynamicScheduleChecked(!!scheduledAt);
      }
    } else {
      setCurrentInterviewLevel(null);
      setSelectedInterviewLevel(1);
      setDynamicInterviewLevelChecked(false);
      setSelectedLevelType(null);
      setStatusDateTime('');
      setNonDynamicScheduleChecked(false);
    }
  }, [selectedStatusObj, requirementData, isDynamicLevel, requiresSchedule]);

  // Fetch requirement data from API
  useEffect(() => {
    if (id) {
      fetchRequirement();
    }
  }, [id, currentUser?.id]);

  // Fetch requirement logic extracted for reuse (initial load and post-update refresh)
  async function fetchRequirement() {
    setLoading(true);
    try {
      // Construct URL with fallback user_id for robust tracking
      const baseUrl = API_ENDPOINTS.RECRUITMENT.GET(id || '');
      const currentUserId = currentUser?.id || currentUser?._id;
      const url = currentUserId ? `${baseUrl}?user_id=${currentUserId}` : baseUrl;

      const response = await apiCall<any>(url);
      const data = response?.data || response;
      if (data) {
        const candidate = data.candidate || {};
        const jobData = data.job || {};

        const lastViewedArray = data.last_viewed || candidate.last_viewed || [];
        const lastViewed = lastViewedArray.length > 0
          ? lastViewedArray[lastViewedArray.length - 1]
          : null;

        const mappedData: RequirementAPI = {
          ...data,
          applicant: {
            applicant_id: candidate.candidate_id || '',
            applicant_name: candidate.display_name || 'Unknown Applicant',
            phone: candidate.phone?.toString() || 'N/A',
            email: candidate.email || 'N/A',
            pan_no: candidate.pan_number || 'N/A',
            designation: candidate.employment?.[0]?.designation || 'Candidate',
            flag: candidate.source_details?.flags?.[0] || '',
            applicant_picture: candidate.applicant_picture || null,
            linkedin_profile: candidate.linkedin_profile || null,
            attachments: (candidate.documents || []).map((doc: any) => doc.document_url)
          },
          job: {
            job_id: jobData.job_id || '',
            job_code: jobData.job_id || 'N/A',
            job_title: jobData.job_title || 'Unknown Job',
            job_type: jobData.job_type || 'N/A',
            client_name: jobData.client_name || 'N/A',
            client_req_id: jobData.client_requirement_id || 'N/A',
            job_location: jobData.job_location || 'N/A',
            end_client_name: jobData.end_client_name || '',
            required_skills: (candidate.skills || []).map((s: any) => s.skill_name || s),
            primary_skills: jobData['primary_skill_set:'] || jobData.primary_skill_set || [],
            secondary_skills: jobData.secondary_skill_set || []
          },
          id: data.mapping_id || id || '',
          mapping_id: data.mapping_id || 'N/A',
          status: normalizeStatus(data.status?.name || data.status),
          status_obj: data.status || null,
          status_code: data.status?.code || '',
          status_display_name: normalizeStatus(data.status?.name || data.status),
          stage_history: data.stage_history || [],
          education_details: candidate.education || [],
          employment_details: candidate.employment || [],
          project_details: candidate.projects || [],
          certification_details: candidate.certifications || [],
          document_details: data.document_details || (candidate.documents || []).map((doc: any) => ({
            id: doc.document_number || doc.id,
            document_type: doc.document_name || doc.document_type || 'Document',
            document_no: doc.document_number || doc.document_no || 'N/A',
            document_file: doc.document_file || doc.file_url || doc.document_url || ''
          })),
          last_viewed_by: lastViewed ? (lastViewed.last_viewed_by?.display_name || 'Anonymous') : 'None',
          last_viewed_date: lastViewed?.last_viewed_on || '',
          last_updated_by: data.mapped_by || 'N/A',
          last_updated_date: candidate.updated || '',
          created_by: candidate.created_by || 'N/A',
          created: candidate.created || '',
          profile_summary: candidate.profile_summary || '',
          comments: candidate.source_details?.comments ? [{
            comment: candidate.source_details.comments,
            addedBy: candidate.created_by || 'N/A',
            addedTime: candidate.created || ''
          }] : []
        };

        setRequirementData(mappedData);

        if (mappedData.applicant.applicant_picture) {
          FileUploadService.getFileViewUrl(mappedData.applicant.applicant_picture)
            .then(url => setApplicantPictureUrl(url))
            .catch(err => console.error("Error fetching secure picture:", err));
        }

        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Fetch recruitment error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading requirement details...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !requirementData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon name="alert" size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Requirement Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The requirement you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/requirements')}>
            Back to Recruitment
          </Button>
        </div>
      </div>
    );
  }

  const submissionStatuses = filteredStatuses.filter(s => s.sequence <= 4);
  const interviewStatuses = filteredStatuses.filter(s => 
    s.sequence >= 5 && 
    s.sequence <= 9 && 
    s.code !== 'INTERVIEW_HR' && 
    s.code !== 'INTERVIEW_CUSTOMER'
  );

  const handleStatusSelect = (s: any) => {
    setSelectedStatus(s.name);
    setSelectedStatusObj(s);
    setStatusComment('');
    const requiresScheduleForStatus = s.requires_schedule === true || s.requires_schedule === 'true' || s.requires_schedule === 1 || s.requires_schedule === '1';
    if (!requiresScheduleForStatus) {
      setStatusDateTime('');
    }
  };

  const renderStatusPill = (s: any) => {
    const isSelected = selectedStatus === s.name;
    const isNeg = isNegativeOutcome(s);
    const isPos = isPositiveOutcome(s);

    let pillClass = "w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer select-none ";
    if (isSelected) {
      if (isNeg) {
        pillClass += "bg-rose-50 border-rose-500 text-rose-700 shadow-sm shadow-rose-100 scale-[1.02] ring-2 ring-rose-200";
      } else if (isPos) {
        pillClass += "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100 scale-[1.02] ring-2 ring-emerald-200";
      } else {
        pillClass += "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm shadow-indigo-100 scale-[1.02] ring-2 ring-indigo-200";
      }
      if (isAlreadyRejected) {
        pillClass += " opacity-80 cursor-not-allowed";
      }
    } else {
      pillClass += "bg-white border-slate-200 text-slate-700 ";
      if (isAlreadyRejected) {
        pillClass += "opacity-50 cursor-not-allowed";
      } else {
        pillClass += "hover:border-slate-350 hover:bg-slate-50/50 hover:scale-[1.01]";
      }
    }

    return (
      <div
        key={s.id}
        className={pillClass}
        onClick={isAlreadyRejected ? undefined : () => handleStatusSelect(s)}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isNeg ? 'bg-rose-500' : isPos ? 'bg-emerald-500' : 'bg-blue-500'
            }`} />
          <span>{s.name}</span>
        </div>
        {isSelected && (
          <Icon name="check" size={14} className={isNeg ? 'text-rose-600' : isPos ? 'text-emerald-600' : 'text-indigo-600'} />
        )}
      </div>
    );
  };

  const renderSubmissionColumn = () => {
    if (currentSeq > 4) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Icon name="check" size={16} className="text-emerald-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Submission Grouping</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Completed (Stage 4 passed)</span>
        </div>
      );
    }

    if (submissionStatuses.length === 0) {
      return (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
          <span className="text-xs text-slate-400">No options available</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {submissionStatuses.map((s) => renderStatusPill(s))}
      </div>
    );
  };

  const renderInterviewColumn = () => {
    if (isDynamicLevel && !dynamicInterviewLevelChecked) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl opacity-60">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <Icon name="lock" size={14} />
          </div>
          <span className="text-xs font-semibold text-slate-700">Interview Stage</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Select an Interview Level above to unlock</span>
        </div>
      );
    }

    if (!isInterviewUnlocked) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl opacity-60">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <Icon name="lock" size={14} />
          </div>
          <span className="text-xs font-semibold text-slate-700">Interview Stage</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Locked (Select Client Screen Select first)</span>
        </div>
      );
    }

    const isSelectedAcrossCycle = selectedStatusObj && isAcrossCycleStatus(selectedStatusObj);
    if (currentSeq > 9 || isSelectedAcrossCycle || isAcrossCycleStatus(activeCandidateStatus)) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <Icon name="check" size={16} className="text-emerald-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Interview Stage</span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Completed (Stage 9 passed)</span>
        </div>
      );
    }

    if (interviewStatuses.length === 0) {
      return (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
          <span className="text-xs text-slate-400">No options available</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {interviewStatuses.map((s) => renderStatusPill(s))}
      </div>
    );
  };

  const renderGeneralColumn = () => {
    const currentStatusName = normalizeStatus(requirementData?.status);
    const { levelStr: currentLevelStr } = parseStageLevel(currentStatusName);

    const activeStatusObjName = normalizeStatus(activeCandidateStatus?.name || '').toLowerCase();
    const activeStatusCode = (activeCandidateStatus?.code || '').toLowerCase();
    const isCurrentFinalSelectOrBeyond =
      activeStatusObjName.includes('final select') ||
      activeStatusCode.includes('final_select') ||
      currentSeq >= 10 ||
      isAcrossCycleStatus(activeCandidateStatus);

    const filteredAcross = acrossCycleStatuses.filter(s => {
      const name = s.name.toLowerCase();
      const code = (s.code || '').toLowerCase();

      if (!name.includes(statusSearch.toLowerCase())) return false;

      const isFinalSelectOption = name.includes('final select') || code.includes('final_select');
      const isAppBackoutOption = name.includes('applicant backout') || code.includes('applicant_backout');
      const isCliBackoutOption = name.includes('client backout') || code.includes('client_backout');

      // 1. If candidate is at Final Select (or beyond/terminal Stage 10), ONLY show Applicant Backout & Client Backout
      if (isCurrentFinalSelectOrBeyond) {
        if (!isAppBackoutOption && !isCliBackoutOption) {
          return false;
        }

        // Mutual selection exclusion for backouts
        const isAppBackoutActive = selectedStatus.toLowerCase().includes('applicant backout') || (selectedStatusObj?.code || '').toLowerCase().includes('applicant_backout');
        if (isAppBackoutActive && isCliBackoutOption) return false;

        const isCliBackoutActive = selectedStatus.toLowerCase().includes('client backout') || (selectedStatusObj?.code || '').toLowerCase().includes('client_backout');
        if (isCliBackoutActive && isAppBackoutOption) return false;

        return true;
      }

      // 2. For all other stages (sequence 1 to 9):
      // Final Select is only shown if Customer or HR Shortlist is completed
      const isCustomerOrHRShortlisted = (currentLevelStr?.toUpperCase() === 'CUSTOMER' || currentLevelStr?.toUpperCase() === 'HR') && currentStatusName.toLowerCase().includes('shortlist');
      if (isFinalSelectOption) {
        return isCustomerOrHRShortlisted;
      }

      // Hide backout options (since they are only for Stage 10)
      if (isAppBackoutOption || isCliBackoutOption) {
        return false;
      }

      // Allow all other standard Across Cycle options (On Hold, Cancelled, Drop)
      return true;
    });

    if (filteredAcross.length === 0) {
      return (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
          <span className="text-xs text-slate-400">No options available</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredAcross.map((s) => {
          const isSelected = selectedStatus === s.name;
          const isNeg = isNegativeOutcome(s);
          const isPos = isPositiveOutcome(s);

          let pillClass = "w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs font-semibold transition-all duration-200 cursor-pointer select-none ";
          if (isSelected) {
            if (isNeg) {
              pillClass += "bg-rose-50 border-rose-500 text-rose-700 shadow-sm shadow-rose-100 scale-[1.02] ring-2 ring-rose-200";
            } else if (isPos) {
              pillClass += "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-100 scale-[1.02] ring-2 ring-emerald-200";
            } else {
              pillClass += "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm shadow-indigo-100 scale-[1.02] ring-2 ring-indigo-200";
            }
            if (isAlreadyRejected) {
              pillClass += " opacity-80 cursor-not-allowed";
            }
          } else {
            pillClass += "bg-white border-slate-200 text-slate-700 ";
            if (isAlreadyRejected) {
              pillClass += "opacity-50 cursor-not-allowed";
            } else {
              pillClass += "hover:border-slate-350 hover:bg-slate-50/50 hover:scale-[1.01]";
            }
          }

          return (
            <div
              key={s.id}
              className={pillClass}
              onClick={isAlreadyRejected ? undefined : () => {
                if (isSelected) {
                  setSelectedStatus('');
                  setSelectedStatusObj(null);
                  setStatusComment('');
                  setStatusDateTime('');
                } else {
                  handleStatusSelect(s);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isNeg ? 'bg-rose-500' : isPos ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                <span>{s.name}</span>
              </div>
              {isSelected && (
                <Icon name="check" size={14} className={isNeg ? 'text-rose-600' : isPos ? 'text-emerald-600' : 'text-indigo-600'} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const { applicant, job } = requirementData;

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Recruitment', path: '/requirements' },
    {
      label: (requirementData.mapping_id || id || 'Mapping Detail') as string,
      path: `/requirements/${encodeURIComponent(id || '')}`
    },
  ];


  return (
    <>
      <DetailTemplate
        breadcrumb={
          <Breadcrumb
            items={breadcrumbItems.map(item => ({
              label: item.label,
              href: item.path
            }))}
          />
        }
        header={
          <DetailHeader
            name={applicant.applicant_name}
            code={requirementData.mapping_id || id || ''}
            codeFormat="suffix"
            designation={applicant.designation}
            status={requirementData.status}
            contactInfo={{
              phone: applicant.phone,
              email: applicant.email,
            }}
            linkedinProfile={applicant.linkedin_profile || undefined}
            flag={applicant.flag || ''}
            photo={applicantPictureUrl || undefined}
            auditInfo={{
              lastViewedBy: requirementData.last_viewed_by,
              lastViewedOn: formatUIDate(requirementData.last_viewed_date),
              lastUpdatedBy: requirementData.last_updated_by,
              lastUpdatedOn: formatUIDate(requirementData.last_updated_date),
              createdBy: requirementData.created_by,
              createdOn: formatUIDate(requirementData.created),
            }}

            canEdit={canUpdateJobs}
            // onEdit={() => console.log('Edit recruitment')}
            lastUpdatedByLabel="Mapped By"
            lastUpdatedOnLabel="Mapped On"
            hideResume={true}
            hideFavorite={true}
          />
        }


        sidebar={
          <div className="space-y-6">
            {/* Job Information */}
            <Card title="Job Information">
              <div className="space-y-3">
                <div>
                  <Text size="sm" className="text-gray-500">
                    Job Code
                  </Text>
                  <Text weight="medium">{job.job_code || 'N/A'}</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Job Title
                  </Text>
                  <Text weight="medium">{job.job_title}</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Client Name
                  </Text>
                  <Text weight="medium">{job.client_name}</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Client Req ID
                  </Text>
                  <Text weight="medium">{job.client_req_id || 'N/A'}</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Job Location
                  </Text>
                  <Text weight="medium">{job.job_location}</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    End Client Name
                  </Text>
                  <Text weight="medium">{job.end_client_name || 'N/A'}</Text>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Required Skills
                  </Text>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.required_skills && job.required_skills.length > 0 ? (
                      job.required_skills.map((skill, idx) => (
                        <Badge key={idx} variant="info" size="sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" className="text-gray-400">
                        N/A
                      </Text>
                    )}
                  </div>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Primary Skills
                  </Text>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.primary_skills && job.primary_skills.length > 0 ? (
                      job.primary_skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" size="sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" className="text-gray-400">
                        N/A
                      </Text>
                    )}
                  </div>
                </div>
                <div>
                  <Text size="sm" className="text-gray-500">
                    Secondary Skills
                  </Text>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.secondary_skills && job.secondary_skills.length > 0 ? (
                      job.secondary_skills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" size="sm">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" className="text-gray-400">
                        N/A
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Comments */}
            <Card title="Comments">
              <div className="space-y-6">
                {requirementData.comments && requirementData.comments.length > 0 ? (
                  requirementData.comments.map((comment, idx) => (
                    <div key={idx} className="flex items-start gap-3 border-b last:border-b-0 pb-4 last:pb-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
                        <Text size="sm" weight="semibold" className="text-gray-500">
                          {(comment.addedBy || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Text weight="semibold" size="sm" className="text-gray-900">
                            {comment.addedBy || 'Unknown User'}
                          </Text>
                          <Text size="xs" className="text-gray-400">
                            {formatUIDate(comment.addedTime)}
                          </Text>
                        </div>
                        <Text size="sm" className="text-gray-700 leading-relaxed break-words overflow-hidden">
                          {comment.comment}
                        </Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Icon name="chat" size={24} className="text-gray-300 mx-auto mb-2" />
                    <Text size="sm" className="text-gray-400">
                      No comments yet
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </div>
        }
        profileSummary={
          <>
            {/* Recruitment Status Timeline */}
            <Card title="Recruitment Status" className="mb-6 overflow-hidden border border-slate-150 rounded-2xl shadow-sm bg-white">
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shadowGlow {
                  0% {
                    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.5);
                    transform: scale(1);
                  }
                  50% {
                    box-shadow: 0 0 16px 6px rgba(79, 70, 229, 0.35);
                    transform: scale(1.06);
                  }
                  100% {
                    box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
                    transform: scale(1);
                  }
                }
                .active-stage-glow {
                  animation: shadowGlow 2s infinite ease-in-out;
                }
              `}} />
              <div className="space-y-6">
                {/* Timeline */}
                <div ref={timelineContainerRef} className="relative px-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
                  <div className="flex items-start justify-start min-w-max gap-0 py-2">
                    {stageLabels.map((stage: string, index: number) => {
                      const isCompleted = index < currentStageIndex;
                      const isActive = index === currentStageIndex;
                      const isFuture = index > currentStageIndex;

                      return (
                        <div key={index} className="relative flex w-[140px] shrink-0 flex-col items-center group">
                          {/* Connector Line */}
                          {index < stageLabels.length - 1 && (
                            <div
                              className={`absolute top-5 h-0.5 rounded-full transition-all duration-300 ${isCompleted
                                ? 'bg-emerald-500 shadow-sm shadow-emerald-100'
                                : isActive
                                  ? 'bg-gradient-to-r from-emerald-500 via-indigo-500 to-slate-200'
                                  : 'bg-slate-200'
                                }`}
                              style={{
                                zIndex: 0,
                                left: 'calc(50% + 20px)',
                                width: 'calc(100% - 40px)'
                              }}
                            />
                          )}

                          {/* Stage Circle */}
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform ${isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100 group-hover:scale-105'
                              : isActive
                                ? 'bg-indigo-600 border-indigo-600 text-white active-stage-glow'
                                : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:scale-105'
                              }`}
                          >
                            {isCompleted ? (
                              <Icon name="check" size={18} />
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>

                          {/* Stage Label & Status Pills */}
                          <div className="mt-3 text-center w-full flex flex-col items-center">
                            <div
                              className={`text-[10px] leading-tight px-1 font-semibold transition-colors duration-200 ${isActive ? 'text-indigo-600 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-500'
                                }`}
                              style={{ minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {stage}
                            </div>

                            {isActive ? (
                              <span className="mt-1.5 px-2.5 py-0.5 text-[8px] font-extrabold tracking-wider uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full shadow-sm">
                                Current
                              </span>
                            ) : isCompleted ? (
                              <span className="mt-1.5 px-2.5 py-0.5 text-[8px] font-extrabold tracking-wider uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
                                Done
                              </span>
                            ) : (
                              <span className="mt-1.5 px-2.5 py-0.5 text-[8px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50 border border-slate-100 rounded-full shadow-sm">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 bg-slate-50/30 -mx-6 -mb-6 px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHistorySidebarOpen(true)}
                    className="flex items-center gap-1.5 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 shadow-sm"
                  >
                    <Icon name="history" size={14} />
                    <span>Stages History</span>
                  </Button>

                  <div className="text-center">
                    <span className="block text-xs font-bold text-slate-800 leading-none">
                      {stageLabels[currentStageIndex] || requirementData.status}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 font-semibold block">
                      Stage {currentStageIndex + 1} of {stageLabels.length}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isAlreadyRejected}
                    onClick={async () => {
                      const currentStageName = stageLabels[currentStageIndex] || normalizeStatus(requirementData.status);
                      const statusEntry = getCurrentStageHistoryEntry(requirementData);
                      const currentStatusObj = requirementData.status_obj || null;
                      const statuses = await fetchStatuses();
                      const matched = findMatchingStatusOption(statuses || dynamicStatuses, currentStatusObj || currentStageName);

                      const baseStageName = matched ? getBaseStageName(normalizeStatus(matched.name)) : getBaseStageName(normalizeStatus(currentStageName));
                      
                      const matchedIsDynamic = !!matched && (matched.is_dynamic_level === true || matched.is_dynamic_level === 'true' || matched.is_dynamic_level === 1 || matched.is_dynamic_level === '1');
                      
                      if (matchedIsDynamic) {
                        setSelectedStatus('');
                      } else {
                        setSelectedStatus(baseStageName);
                      }
                      
                      setStatusSearch('');
                      setStatusComment(statusEntry?.comment || '');

                      if (matchedIsDynamic) {
                        const currentLevel = requirementData?.status_obj?.current_interview_level
                          ? Number(String(requirementData.status_obj.current_interview_level).replace(/^L/i, ''))
                          : parseStageLevel(currentStageName).level || 1;
                        const isCurrentRoundShortlisted = currentStageName.toLowerCase().includes('shortlist');
                        const nextLevel = isCurrentRoundShortlisted ? (currentLevel + 1) : currentLevel;

                        setCurrentInterviewLevel(currentLevel);
                        setSelectedInterviewLevel(nextLevel);
                        const matchedRequiresSchedule = matched.requires_schedule === true || matched.requires_schedule === 'true' || matched.requires_schedule === 1 || matched.requires_schedule === '1';
                        const hasScheduledTime = !!getScheduledTimeForLevel(nextLevel, matched);
                        const { baseStage: currentBase, level: currentLvl } = parseStageLevel(normalizeStatus(requirementData.status));
                        const matchedBase = getBaseStageName(normalizeStatus(matched.name));
                        const isSameStatus = matched &&
                          currentBase.toLowerCase() === matchedBase.toLowerCase() &&
                          currentLvl === nextLevel;

                        const shouldBeChecked = isSameStatus;
                        setDynamicInterviewLevelChecked(shouldBeChecked);
                        if (shouldBeChecked && hasScheduledTime && matchedRequiresSchedule) {
                          setStatusDateTime(getScheduledTimeForLevel(nextLevel, matched));
                        } else {
                          setStatusDateTime('');
                        }
                        setNonDynamicScheduleChecked(false);
                      } else {
                        setCurrentInterviewLevel(null);
                        setSelectedInterviewLevel(1);
                        setDynamicInterviewLevelChecked(false);
                        const scheduledAt = statusEntry?.extra_details?.scheduled_at || '';
                        setStatusDateTime(toDatetimeLocalValue(scheduledAt));
                        setNonDynamicScheduleChecked(!!scheduledAt);
                      }

                      setSelectedStatusObj(matched);
                      setCurrentCandidateStatusObj(matched);
                      setShowStatusModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all duration-200 shadow-sm shadow-indigo-100"
                  >
                    <span>Update Stage</span>
                    <Icon name="caret-right" size={14} />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Profile Summary */}
            <Card title="Profile Summary">
              <Text className="text-gray-700 whitespace-pre-wrap break-words">
                {requirementData.profile_summary || 'No profile summary available'}
              </Text>
            </Card>
          </>
        }
        tabs={[
          {
            id: 'education',
            label: 'Education Details',
            content: (
              <EducationTab
                data={requirementData.education_details || []}
                canEdit={canUpdateJobs}
                onUpdate={(data) => console.log('Update education:', data)}
              />
            ),
          },
          {
            id: 'employment',
            label: 'Employment Details',
            content: (
              <EmploymentTab
                data={requirementData.employment_details || []}
                canEdit={canUpdateJobs}
                onUpdate={(data) => console.log('Update employment:', data)}
              />
            ),
          },
          {
            id: 'projects',
            label: 'Project Details',
            content: (
              <ProjectTab
                data={requirementData.project_details || []}
                canEdit={canUpdateJobs}
                onUpdate={(data) => console.log('Update projects:', data)}
              />
            ),
          },
          {
            id: 'certifications',
            label: 'Certification Details',
            content: (
              <CertificationTab
                data={requirementData.certification_details || []}
                canEdit={canUpdateJobs}
                onUpdate={(data) => console.log('Update certifications:', data)}
              />
            ),
          },
          {
            id: 'documents',
            label: 'Document Details',
            content: (
              <DocumentTab
                data={requirementData.document_details || []}
                canEdit={canUpdateJobs}
                onUpdate={(data) => console.log('Update documents:', data)}
              />
            ),
          },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />      

      {/* Stages History Sidebar Overlay */}
      {isHistorySidebarOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slideInRight {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .animate-slideInRight {
              animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setIsHistorySidebarOpen(false)}
          />
          
          {/* Drawer */}
          <div className="relative w-full max-w-sm h-full bg-white shadow-[0_0_40px_rgba(37,99,235,0.15)] flex flex-col animate-slideInRight border-l border-blue-100">
            {/* Header */}
            <div className="px-6 py-5 border-b border-blue-100/60 flex justify-between items-center bg-blue-50/50">
              <div>
                <Text variant="h3" className="text-blue-900 font-semibold text-lg tracking-tight">Stages History</Text>
                <Text size="xs" className="text-blue-600 mt-1">Activity log for this recruitment</Text>
              </div>
              <button 
                onClick={() => setIsHistorySidebarOpen(false)}
                className="text-blue-400 hover:text-blue-700 p-2 rounded-xl hover:bg-blue-100/50 transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            
            {/* Content List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-blue-200">
              <div className="space-y-0">
                {requirementData?.stage_history && requirementData.stage_history.length > 0 ? (
                  [...requirementData.stage_history].reverse().map((item, idx, arr) => {
                    const isLast = idx === arr.length - 1;
                    const movedByName = item.moved_by?.name || 'System';
                    
                    const formatDateTime = (dateStr: string) => {
                      if (!dateStr) return '';
                      try {
                        return new Intl.DateTimeFormat('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric', 
                          hour: 'numeric', minute: 'numeric' 
                        }).format(new Date(dateStr));
                      } catch(e) {
                        return dateStr;
                      }
                    };
                    
                    const movedAt = formatDateTime(item.moved_at);
                    const scheduledAt = item.extra_details?.scheduled_at ? formatDateTime(item.extra_details.scheduled_at) : null;
                    
                    let stageText = item.to_stage || 'Unknown Stage';
                    
                    // Dynamic icons based on stage text
                    let icon = 'check';
                    let type = 'neutral';
                    const lowerStage = stageText.toLowerCase();
                    if (lowerStage.includes('reject') || lowerStage.includes('no show') || lowerStage.includes('backout') || lowerStage.includes('drop')) {
                      icon = 'close';
                      type = 'negative';
                    } else if (lowerStage.includes('select') || lowerStage.includes('offer')) {
                      icon = 'star';
                      type = 'positive';
                    } else if (lowerStage.includes('interview')) {
                      icon = 'users';
                    } else if (lowerStage.includes('submit')) {
                      icon = 'upload';
                    } else if (lowerStage.includes('feedback')) {
                      icon = 'chat';
                    } else if (lowerStage.includes('applied')) {
                      icon = 'user';
                    }
                    
                    return (
                      <div key={idx} className="flex gap-4">
                        {/* Timeline Line & Icon */}
                        <div className="relative flex flex-col items-center">
                          <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                            type === 'positive' ? 'bg-emerald-50 border-emerald-500/30 text-emerald-600' : 
                            type === 'negative' ? 'bg-rose-50 border-rose-500/30 text-rose-600' :
                            'bg-blue-50 border-blue-200 text-blue-600'
                          }`}>
                            <Icon name={icon as any} size={16} />
                          </div>
                          {!isLast && (
                            <div className="absolute top-9 bottom-0 w-[2px] bg-blue-100 -mb-6" style={{ minHeight: '40px' }} />
                          )}
                        </div>
                        
                        {/* Event Content */}
                        <div className={`flex-1 pt-1 ${!isLast ? 'pb-8' : ''}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-800">{movedByName}</span>
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">{movedAt}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {item.from_stage && (
                              <>
                                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{item.from_stage}</span>
                                <Icon name="caret-right" size={10} className="text-slate-400" />
                              </>
                            )}
                            <span className="text-[13px] font-bold text-blue-700">{stageText}</span>
                          </div>
                          
                          {item.comment && item.comment.trim() !== '' && (
                            <p className="text-xs text-slate-600 leading-relaxed italic border-l-[3px] border-blue-200 pl-2.5 py-0.5 my-2 bg-blue-50/30 rounded-r-sm">
                              "{item.comment}"
                            </p>
                          )}
                          
                          {scheduledAt && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 bg-amber-50 p-2 rounded-lg border border-amber-100 w-fit">
                              <Icon name="calendar" size={14} className="text-amber-500" />
                              <span className="font-semibold text-amber-700">Scheduled:</span> {scheduledAt}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                      <Icon name="history" size={20} className="text-slate-300" />
                    </div>
                    <Text className="text-sm font-medium text-slate-500">No history available</Text>
                    <Text size="xs" className="text-slate-400 mt-1">Stage updates will appear here</Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-150 animate-scaleUp overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon name="sliders" size={20} />
                </div>
                <div>
                  <Text variant="h3" className="text-lg font-bold text-slate-800">Update Recruitment Stage</Text>
                  <p className="text-xs text-slate-450 mt-0.5 font-medium">Select and schedule the candidate's next operational stage</p>
                </div>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all duration-200">
                <Icon name="close" size={20} />
              </button>
            </div>

            {/* Visual Stepper */}
            {/* <div className="bg-slate-50/50 border-b border-slate-100 px-6 py-5 overflow-x-auto">
              <div className="flex items-center justify-between min-w-[700px] gap-2">
                {[
                  { seq: 1, label: 'Applied' },
                  { seq: 2, label: 'Submitted' },
                  { seq: 3, label: 'Feedback' },
                  { seq: 4, label: 'Client Screen' },
                  { seq: 5, label: 'Interview L1' },
                  { seq: 6, label: 'Interview L2' },
                  { seq: 7, label: 'Interview L3' },
                  { seq: 8, label: 'Interview L4' },
                  { seq: 9, label: 'Interview L5' },
                  { seq: 10, label: 'Selected/Offered' }
                ].map((stage, idx, arr) => {
                  const isCompleted = stage.seq < currentSeq;
                  const isCurrent = stage.seq === currentSeq;
                  const isNext = stage.seq === nextSeq;

                  return (
                    <React.Fragment key={stage.seq}>
                      <div className="flex flex-col items-center flex-1 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-305 ${isCompleted
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-100'
                          : isCurrent
                            ? 'bg-indigo-600 text-white active-stage-glow'
                            : isNext
                              ? 'bg-white border-2 border-indigo-400 border-dashed text-indigo-600'
                              : 'bg-white border border-slate-200 text-slate-400'
                          }`}>
                          {isCompleted ? (
                            <Icon name="check" size={14} />
                          ) : (
                            stage.seq
                          )}
                        </div>
                        <span className={`mt-2 text-[10px] font-semibold text-center whitespace-nowrap ${isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                          }`}>
                          {stage.label}
                        </span>
                      </div>

                      {idx < arr.length - 1 && (
                        <div className={`h-[2px] flex-1 -mt-4 transition-all duration-300 ${stage.seq < currentSeq
                          ? 'bg-emerald-400'
                          : stage.seq === currentSeq && nextSeq === stage.seq + 1
                            ? 'bg-gradient-to-r from-indigo-50 to-slate-200'
                            : 'bg-slate-200'
                          }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div> */}

            {/* Modal Body Container */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">

              {/* Search bar */}
              <div className="relative">
                <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate status workflow options..."
                  value={statusSearch}
                  disabled={isAlreadyRejected}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 shadow-inner disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                />
              </div>

              {/* Dynamic Inputs Panel */}
              {(requiresComment || (requiresSchedule && !isDynamicLevel) || isDynamicLevel) && (
                <div className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4 animate-slideDown">

                  {/* Comment input */}
                  {requiresComment && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Comments / Reason <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        placeholder="Provide details or reasoning for this status transition..."
                        value={statusComment}
                        disabled={isAlreadyRejected}
                        onChange={(e) => setStatusComment(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white min-h-[90px] resize-none transition-all duration-200 shadow-sm disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                  )}

                  {/* Non-dynamic schedule date input */}
                  {requiresSchedule && !isDynamicLevel && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          id="non-dynamic-schedule-checkbox"
                          type="checkbox"
                          checked={nonDynamicScheduleChecked}
                          disabled={isAlreadyRejected || !!(selectedStatusObj && normalizeStatus(requirementData?.status).toLowerCase() === normalizeStatus(selectedStatusObj.name).toLowerCase() && getScheduledTimeForNonDynamic())}
                          onChange={(e) => {
                            setNonDynamicScheduleChecked(e.target.checked);
                            if (!e.target.checked) setStatusDateTime('');
                          }}
                          className="h-4.5 w-4.5 text-indigo-600 border-slate-300 rounded cursor-pointer focus:ring-indigo-500/20 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label htmlFor="non-dynamic-schedule-checkbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                          Schedule this stage
                        </label>
                      </div>

                      {nonDynamicScheduleChecked && (
                        <div className="pl-7.5 space-y-1.5 animate-fadeIn">
                          <label className="block text-xs font-semibold text-slate-650">
                            Schedule Date & Time <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            min={getMinDateForNextLevel()}
                            value={statusDateTime}
                            disabled={isAlreadyRejected || !!(selectedStatusObj && normalizeStatus(requirementData?.status).toLowerCase() === normalizeStatus(selectedStatusObj.name).toLowerCase() && getScheduledTimeForNonDynamic())}
                            onChange={(e) => setStatusDateTime(e.target.value)}
                            className="w-full max-w-md px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-gray-500 transition-all duration-200 shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dynamic interview levels section */}
                  {isDynamicLevel && (() => {
                    const { baseStage: currentBaseStage, level: currentLvl, levelStr: currentLevelStr } = parseStageLevel(currentStatusName);
                    const selectedBaseStage = getBaseStageName(normalizeStatus(selectedStatusObj.name));
                    const isRescheduleSelected = selectedStatusObj && selectedStatusObj.name.toLowerCase().includes('reschedule');
                    const isHRCurrent = currentLevelStr?.toUpperCase() === 'HR';
                    const isCustomerCurrent = currentLevelStr?.toUpperCase() === 'CUSTOMER';
                    const isShortlisted = currentStatusName.toLowerCase().includes('shortlist');

                    const isSameStatus = selectedStatusObj &&
                      currentBaseStage.toLowerCase() === selectedBaseStage.toLowerCase() &&
                      currentLvl === selectedInterviewLevel;
                    const isNewLevel = currentInterviewLevel === null || selectedInterviewLevel > currentInterviewLevel;
                    const canCheckCheckbox = isNewLevel || isRescheduleSelected || (!isSameStatus && requiresSchedule);

                    return (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">
                          Interview Levels & Scheduling {requiresSchedule && <span className="text-rose-500">*</span>}
                        </label>
                        <div className="space-y-3">
                          {selectedLevelType !== 'HR' && selectedLevelType !== 'Customer' && !isHRCurrent && !isCustomerCurrent && Array.from({ length: selectedInterviewLevel }, (_, i) => i + 1).map((level) => {
                            const isPast = level < selectedInterviewLevel;
                            const isNext = level === selectedInterviewLevel;

                            if (isPast) {
                              const pastTime = getScheduledTimeForLevel(level);
                              return (
                                <div key={level} className="p-3.5 bg-slate-100/70 border border-slate-200/50 rounded-xl opacity-75 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                      <Icon name="check" size={10} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600">
                                      {getBaseStageName(normalizeStatus(selectedStatusObj.name))} - {level} (Completed)
                                    </span>
                                  </div>
                                  {pastTime && (
                                    <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                      {formatUIDateTime(new Date(pastTime).toISOString())}
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            if (isNext) {
                              const isNumericVisible = (selectedLevelType === null || selectedLevelType === 'numeric') && !isHRCurrent && !isCustomerCurrent;
                              if (!isNumericVisible) return null;

                              return (
                                <div key={level} className={`p-4 bg-indigo-50/30 border border-indigo-100/80 rounded-xl hover:border-indigo-200 transition-all duration-200 shadow-sm ${!canCheckCheckbox ? 'opacity-60 bg-slate-50/70 border-slate-200' : ''}`}>
                                  <div className="flex items-center gap-3">
                                    <input
                                      id={`level-checkbox-${level}`}
                                      type="checkbox"
                                      checked={dynamicInterviewLevelChecked && selectedLevelType === 'numeric'}
                                      disabled={isAlreadyRejected || !canCheckCheckbox}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setDynamicInterviewLevelChecked(true);
                                          setSelectedLevelType('numeric');
                                          setStatusDateTime('');
                                        } else {
                                          setDynamicInterviewLevelChecked(false);
                                          setSelectedLevelType(null);
                                          setStatusDateTime('');
                                        }
                                      }}
                                      className="h-4.5 w-4.5 text-indigo-600 border-slate-350 rounded cursor-pointer focus:ring-indigo-500/20 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <label htmlFor={`level-checkbox-${level}`} className={`text-sm font-bold text-slate-800 cursor-pointer select-none ${!canCheckCheckbox ? 'text-slate-500 cursor-not-allowed' : ''}`}>
                                      {getBaseStageName(normalizeStatus(selectedStatusObj.name))} - {level}
                                    </label>
                                  </div>

                                  {dynamicInterviewLevelChecked && selectedLevelType === 'numeric' && requiresSchedule && (
                                    <div className="mt-3 pl-7.5 space-y-1.5 animate-fadeIn">
                                      <label className="block text-xs font-semibold text-slate-605">
                                        Schedule Date & Time <span className="text-rose-500">*</span>
                                      </label>
                                      <input
                                        type="datetime-local"
                                        min={getMinDateForNextLevel()}
                                        value={statusDateTime}
                                        disabled={isAlreadyRejected || !canCheckCheckbox}
                                        onChange={(e) => setStatusDateTime(e.target.value)}
                                        className="w-full max-w-md px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-200 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-gray-500"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            return null;
                          })}

                          {/* HR level checkbox */}
                          {(() => {
                            const hasCompletedL1 = (currentLvl !== null && currentLvl > 1) || (currentLvl === 1 && isShortlisted) || isHRCurrent || isCustomerCurrent;
                            const isHRVisible = (selectedLevelType === null || selectedLevelType === 'HR') &&
                              hasCompletedL1 &&
                              !isCustomerCurrent &&
                              (!isHRCurrent || !isShortlisted);
                            if (!isHRVisible) return null;

                            const pastTimeStr = getScheduledTimeForLevelStr('HR');
                            const isPastHR = currentLevelStr?.toUpperCase() === 'HR' && !isRescheduleSelected;

                            if (isPastHR) {
                              return (
                                <div className="p-3.5 bg-slate-100/70 border border-slate-200/50 rounded-xl opacity-75 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                      <Icon name="check" size={10} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600">
                                      {getBaseStageName(normalizeStatus(selectedStatusObj.name))} - HR (Completed)
                                    </span>
                                  </div>
                                  {pastTimeStr && (
                                    <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                      {formatUIDateTime(new Date(pastTimeStr).toISOString())}
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div className={`p-4 bg-indigo-50/30 border border-indigo-100/80 rounded-xl hover:border-indigo-200 transition-all duration-200 shadow-sm ${!canCheckCheckbox ? 'opacity-60 bg-slate-50/70 border-slate-200' : ''}`}>
                                <div className="flex items-center gap-3">
                                  <input
                                    id="level-checkbox-hr"
                                    type="checkbox"
                                    checked={dynamicInterviewLevelChecked && selectedLevelType === 'HR'}
                                    disabled={isAlreadyRejected || !canCheckCheckbox}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setDynamicInterviewLevelChecked(true);
                                        setSelectedLevelType('HR');
                                        setStatusDateTime('');
                                      } else {
                                        setDynamicInterviewLevelChecked(false);
                                        setSelectedLevelType(null);
                                        setStatusDateTime('');
                                      }
                                    }}
                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-350 rounded cursor-pointer focus:ring-indigo-500/20 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                  <label htmlFor="level-checkbox-hr" className={`text-sm font-bold text-slate-800 cursor-pointer select-none ${!canCheckCheckbox ? 'text-slate-500 cursor-not-allowed' : ''}`}>
                                    {getBaseStageName(normalizeStatus(selectedStatusObj.name))} - HR
                                  </label>
                                </div>

                                {dynamicInterviewLevelChecked && selectedLevelType === 'HR' && requiresSchedule && (
                                  <div className="mt-3 pl-7.5 space-y-1.5 animate-fadeIn">
                                    <label className="block text-xs font-semibold text-slate-605">
                                      Schedule Date & Time <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                      type="datetime-local"
                                      min={getMinDateForNextLevel()}
                                      value={statusDateTime}
                                      disabled={isAlreadyRejected || !canCheckCheckbox}
                                      onChange={(e) => setStatusDateTime(e.target.value)}
                                      className="w-full max-w-md px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-200 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-gray-500"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Customer level checkbox */}
                          {(() => {
                            const hasCompletedL1 = (currentLvl !== null && currentLvl > 1) || (currentLvl === 1 && isShortlisted) || isHRCurrent || isCustomerCurrent;
                            const isCustomerVisible = (selectedLevelType === null || selectedLevelType === 'Customer') &&
                              hasCompletedL1 &&
                              (!isCustomerCurrent || !isShortlisted);
                            if (!isCustomerVisible) return null;

                            const pastTimeStr = getScheduledTimeForLevelStr('Customer');
                            const isPastCustomer = currentLevelStr?.toUpperCase() === 'CUSTOMER' && !isRescheduleSelected;

                            if (isPastCustomer) {
                              return (
                                <div className="p-3.5 bg-slate-100/70 border border-slate-200/50 rounded-xl opacity-75 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                      <Icon name="check" size={10} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-600">
                                      {getBaseStageName(normalizeStatus(selectedStatusObj.name))} - Customer (Completed)
                                    </span>
                                  </div>
                                  {pastTimeStr && (
                                    <span className="text-xs text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                                      {formatUIDateTime(new Date(pastTimeStr).toISOString())}
                                    </span>
                                  )}
                                </div>
                              );
                            }

                            return (
                              <div className={`p-4 bg-indigo-50/30 border border-indigo-100/80 rounded-xl hover:border-indigo-200 transition-all duration-200 shadow-sm ${!canCheckCheckbox ? 'opacity-60 bg-slate-50/70 border-slate-200' : ''}`}>
                                <div className="flex items-center gap-3">
                                  <input
                                    id="level-checkbox-customer"
                                    type="checkbox"
                                    checked={dynamicInterviewLevelChecked && selectedLevelType === 'Customer'}
                                    disabled={isAlreadyRejected || !canCheckCheckbox}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setDynamicInterviewLevelChecked(true);
                                        setSelectedLevelType('Customer');
                                        setStatusDateTime('');
                                      } else {
                                        setDynamicInterviewLevelChecked(false);
                                        setSelectedLevelType(null);
                                        setStatusDateTime('');
                                      }
                                    }}
                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-350 rounded cursor-pointer focus:ring-indigo-500/20 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                  <label htmlFor="level-checkbox-customer" className={`text-sm font-bold text-slate-800 cursor-pointer select-none ${!canCheckCheckbox ? 'text-slate-500 cursor-not-allowed' : ''}`}>
                                    {getBaseStageName(normalizeStatus(selectedStatusObj.name))} - Customer
                                  </label>
                                </div>

                                {dynamicInterviewLevelChecked && selectedLevelType === 'Customer' && requiresSchedule && (
                                  <div className="mt-3 pl-7.5 space-y-1.5 animate-fadeIn">
                                    <label className="block text-xs font-semibold text-slate-605">
                                      Schedule Date & Time <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                      type="datetime-local"
                                      min={getMinDateForNextLevel()}
                                      value={statusDateTime}
                                      disabled={isAlreadyRejected || !canCheckCheckbox}
                                      onChange={(e) => setStatusDateTime(e.target.value)}
                                      className="w-full max-w-md px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-200 shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed disabled:text-gray-500"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2 pl-1 font-medium">
                          {!requiresSchedule
                            ? `Scheduling is disabled for this status because it does not require an interview date/time.`
                            : !canCheckCheckbox
                              ? `Scheduling is locked for this status. Select 'Interview Reschedule' to change the schedule.`
                              : selectedLevelType === 'HR'
                                ? `Confirm selection to schedule HR Interview.`
                                : selectedLevelType === 'Customer'
                                  ? `Confirm selection to schedule Customer Interview.`
                                  : currentInterviewLevel !== null
                                    ? `Candidate is currently at Interview Level L${currentInterviewLevel}. Checking the checkbox moves them to L${selectedInterviewLevel}.`
                                    : isHRCurrent && !isShortlisted
                                      ? `HR scheduling is required for this stage.`
                                      : (isHRCurrent && isShortlisted) || isCustomerCurrent
                                        ? `Customer scheduling is required for this stage.`
                                        : `L${selectedInterviewLevel} scheduling is required for this stage.`}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Status Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Column 1: Submission */}
                <div className="border border-slate-150 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-start">
                  <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                      <Icon name="briefcase" size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Submission</h4>
                      <p className="text-[10px] text-slate-450 font-medium">Stages 1 - 4</p>
                    </div>
                  </div>
                  {loadingStatuses ? (
                    <div className="py-6 text-center text-xs text-slate-455 animate-pulse">Loading options...</div>
                  ) : (
                    renderSubmissionColumn()
                  )}
                </div>

                {/* Column 2: Interview */}
                <div className="border border-slate-150 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-start">
                  <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 mb-4">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                      <Icon name="users" size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Interviews ({selectedLevelType === 'Customer' ? 'Customer' : selectedLevelType === 'HR' ? 'HR' : selectedLevelType === 'numeric' ? `L${selectedInterviewLevel}` : (() => {
                          const currentStatusName = normalizeStatus(requirementData?.status);
                          const { levelStr } = parseStageLevel(currentStatusName);
                          const isShortlisted = currentStatusName.toLowerCase().includes('shortlist');
                          if (levelStr?.toUpperCase() === 'HR') return isShortlisted ? 'Customer' : 'HR';
                          if (levelStr?.toUpperCase() === 'CUSTOMER') return 'Customer';
                          return `L${selectedInterviewLevel}`;
                        })()})
                      </h4>
                      <p className="text-[10px] text-slate-455 font-medium">Stages 5 - 9</p>
                    </div>
                  </div>
                  {loadingStatuses ? (
                    <div className="py-6 text-center text-xs text-slate-455 animate-pulse">Loading options...</div>
                  ) : (
                    renderInterviewColumn()
                  )}
                </div>

                {/* Column 3: Across Cycle */}
                <div className="border border-slate-150 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-start">
                  <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 mb-4">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                      <Icon name="globe" size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">General / Across Cycle</h4>
                      <p className="text-[10px] text-slate-455 font-medium">Stage 10 (Global)</p>
                    </div>
                  </div>
                  {loadingStatuses ? (
                    <div className="py-6 text-center text-xs text-slate-455 animate-pulse">Loading options...</div>
                  ) : (
                    renderGeneralColumn()
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end items-center gap-3 bg-slate-50/50">
              <Button variant="outline" onClick={() => setShowStatusModal(false)} className="rounded-xl px-5">Cancel</Button>
              <Button
                variant="primary"
                className="rounded-xl px-6"
                disabled={
                  !selectedStatus ||
                  updatingStatus ||
                  (requiresComment && !statusComment.trim()) ||
                  (isDynamicLevel
                    ? (!dynamicInterviewLevelChecked || (requiresSchedule && !statusDateTime))
                    : (requiresSchedule
                      ? (!nonDynamicScheduleChecked || !statusDateTime)
                      : false
                    )
                  )
                }
                onClick={async () => {
                  if (!requirementData) return;

                  setUpdatingStatus(true);
                  try {
                    const payload: any = {
                      to_stage: selectedStatusObj?.code || selectedStatusObj?.id || selectedStatus,
                      extra_details: {}
                    };

                    // Validate required fields based on selected status flags
                    if (requiresComment) {
                      if (!statusComment.trim()) {
                        window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: 'Comment is required for this status.' } }));
                        setUpdatingStatus(false);
                        return;
                      }
                      payload.comment = statusComment.trim();
                    } else if (statusComment.trim()) {
                      payload.comment = statusComment.trim();
                    }

                    if (isDynamicLevel) {
                      if (!dynamicInterviewLevelChecked) {
                        const levelMsg = selectedLevelType === 'HR'
                          ? 'HR'
                          : selectedLevelType === 'Customer'
                            ? 'Customer'
                            : `L${selectedInterviewLevel}`;
                        window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: `Interview Level ${levelMsg} confirmation is required.` } }));
                        setUpdatingStatus(false);
                        return;
                      }
                      if (requiresSchedule) {
                        if (!statusDateTime) {
                          window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: 'Scheduled date & time is required for this status.' } }));
                          setUpdatingStatus(false);
                          return;
                        }

                        const selectedDate = new Date(statusDateTime);
                        const minDateStr = getMinDateForNextLevel();
                        const minDate = new Date(minDateStr);
                        if (selectedDate <= minDate) {
                          const latestScheduled = getLatestScheduledTime();
                          const formattedMin = formatUIDateTime(minDate.toISOString());
                          const errMsg = latestScheduled && latestScheduled > new Date()
                            ? `Scheduled date & time must be after the previously scheduled date & time: ${formattedMin}.`
                            : 'Scheduled date & time must be in the future.';
                          window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: errMsg } }));
                          setUpdatingStatus(false);
                          return;
                        }

                        payload.extra_details = payload.extra_details || {};
                        payload.extra_details.scheduled_at = selectedDate.toISOString();
                      }

                      payload.extra_details = payload.extra_details || {};
                      
                      payload.extra_details.track = selectedLevelType === 'HR'
                        ? 'HR'
                        : selectedLevelType === 'Customer'
                          ? 'CUSTOMER'
                          : 'LEVEL';
                    } else if (requiresSchedule) {
                      if (!nonDynamicScheduleChecked) {
                        window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: 'Scheduling is required for this status.' } }));
                        setUpdatingStatus(false);
                        return;
                      }
                      if (!statusDateTime) {
                        window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: 'Scheduled date & time is required for this status.' } }));
                        setUpdatingStatus(false);
                        return;
                      }

                      const selectedDate = new Date(statusDateTime);
                      const isPrepopulated = !!(selectedStatusObj && normalizeStatus(requirementData?.status).toLowerCase() === normalizeStatus(selectedStatusObj.name).toLowerCase() && getScheduledTimeForNonDynamic());

                      const minDateStr = getMinDateForNextLevel();
                      const minDate = new Date(minDateStr);
                      if (!isPrepopulated && selectedDate <= minDate) {
                        const latestScheduled = getLatestScheduledTime();
                        const formattedMin = formatUIDateTime(minDate.toISOString());
                        const errMsg = latestScheduled && latestScheduled > new Date()
                          ? `Scheduled date & time must be after the previously scheduled date & time: ${formattedMin}.`
                          : 'Scheduled date & time must be in the future.';
                        window.dispatchEvent(new CustomEvent('toasterEvents', { detail: { type: 'error', message: errMsg } }));
                        setUpdatingStatus(false);
                        return;
                      }

                      payload.extra_details = payload.extra_details || {};
                      payload.extra_details.scheduled_at = selectedDate.toISOString();
                    } else if (statusDateTime) {
                      payload.extra_details = payload.extra_details || {};
                      try {
                        payload.extra_details.scheduled_at = new Date(statusDateTime).toISOString();
                      } catch (err) {/* ignore */ }
                    }

                    const mappingId = requirementData.mapping_id || id || '';

                    const response = await apiCall(API_ENDPOINTS.RECRUITMENT.UPDATE_STAGE(mappingId), {
                      method: 'PUT',
                      body: payload
                    });

                    if (response && !response.error) {
                      // Show success toaster
                      window.dispatchEvent(
                        new CustomEvent("toasterEvents", {
                          detail: {
                            type: "success",
                            message: `Status has been moved to ${selectedStatus}`,
                          },
                        })
                      );

                      // Update local UI immediately without a full refresh
                      const newIndex = recruitmentStages.indexOf(selectedStatus);
                      if (newIndex !== -1) {
                        setCurrentStageIndex(newIndex);
                      }

                      setRequirementData(prev => prev ? {
                        ...prev,
                        status: selectedStatus,
                        status_obj: selectedStatusObj,
                      } : null);

                      // Clear GET cache and refresh full requirement data to reflect authoritative changes
                      try {
                        clearNetCache();
                        await fetchRequirement();
                      } catch (err) {
                        console.warn('Failed to refetch requirement after update', err);
                      }

                      setShowStatusModal(false);
                      setStatusComment(''); // Reset comment
                      setStatusDateTime(''); // Reset scheduled datetime
                      setDynamicInterviewLevelChecked(false); // Reset interview level checkbox
                      setSelectedLevelType(null); // Reset level type
                      setCurrentCandidateStatusObj(null); // Reset candidate status object to trigger re-evaluation
                    }
                  } catch (error) {
                    console.error('Failed to update stage:', error);
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
              >
                {updatingStatus ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecruitmentDetail;
