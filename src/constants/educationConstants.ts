export const EDUCATION_TYPE_IDS = {
    PG: 'ofe2r6ahf8a8ohy', // Post Graduate
    UG: 'uv93o51kjc55m50', // Graduation
    DIPLOMA: '43zwxdlx79ykyx4',
    SENIOR_SECONDARY: 'b6w93d0tqngnj5u',
    SECONDARY: 'dhsjqj63cu2fmlc',
    PHD: 'b6fjihl7jd1w69u',
};

// Higher number = Higher education level
export const EDUCATION_LEVELS = {
    [EDUCATION_TYPE_IDS.PHD]: 60,
    [EDUCATION_TYPE_IDS.PG]: 50,
    [EDUCATION_TYPE_IDS.UG]: 40,
    [EDUCATION_TYPE_IDS.DIPLOMA]: 30, // Diploma is typically after 10th or 12th, but before/equivalent to part of UG. treating as 30 for now.
    [EDUCATION_TYPE_IDS.SENIOR_SECONDARY]: 20, // 12th
    [EDUCATION_TYPE_IDS.SECONDARY]: 10, // 10th
};
