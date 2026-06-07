/**
 * TAT (Turnaround Time) Status Override Utility
 * Automatically determines job status based on TAT time
 * - If current time has passed TAT: status becomes "Freeze"
 * - If current time is before TAT: use original status
 */

/**
 * Check if a job's TAT time has passed
 * @param tatDateTime - ISO datetime string or null
 * @returns true if TAT time has passed, false otherwise
 */
export const isTATExpired = (tatDateTime: string | null): boolean => {
  if (!tatDateTime) return false;
  
  try {
    const tatDate = new Date(tatDateTime);
    const now = new Date();
    
    // Check if the parsed date is valid
    if (isNaN(tatDate.getTime())) {
      return false;
    }
    
    return now > tatDate;
  } catch (error) {
    console.error('Error checking TAT expiration:', error);
    return false;
  }
};

/**
 * Get the effective job status with TAT override applied
 * If TAT has passed and status is "Open", the status is overridden to "Freeze"
 * @param originalStatus - The original job status from the job record
 * @param tat - TAT datetime string or null
 * @returns The effective status (either original or "Freeze" if TAT expired and status is Open)
 */
export const getEffectiveJobStatus = (
  originalStatus: string,
  tat: string | null
): string => {
  // Only override to "Freeze" if job is "Open" and TAT has passed
  if (originalStatus === 'Open' && isTATExpired(tat)) {
    return 'Freeze';
  }
  
  // Otherwise return the original status
  return originalStatus;
};

/**
 * Format TAT datetime for display
 * @param tatDateTime - ISO datetime string or null
 * @returns Formatted date string or '-' if not available
 */
export const formatTAT = (tatDateTime: string | null): string => {
  if (!tatDateTime) return '-';
  
  try {
    const date = new Date(tatDateTime);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting TAT:', error);
    return '-';
  }
};

/**
 * Get time remaining until TAT
 * @param tatDateTime - ISO datetime string or null
 * @returns Human readable time remaining or empty string if expired/invalid
 */
export const getTimeUntilTAT = (tatDateTime: string | null): string => {
  if (!tatDateTime) return '';
  
  try {
    const tatDate = new Date(tatDateTime);
    const now = new Date();
    
    if (isNaN(tatDate.getTime())) {
      return '';
    }
    
    // If TAT has passed
    if (now > tatDate) {
      const diffMs = now.getTime() - tatDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h overdue`;
      } else {
        return `${diffHours}h overdue`;
      }
    }
    
    // If TAT is in the future
    const diffMs = tatDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else {
      return `${diffHours}h remaining`;
    }
  } catch (error) {
    console.error('Error calculating time until TAT:', error);
    return '';
  }
};
