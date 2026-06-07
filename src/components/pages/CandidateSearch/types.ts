export interface Education {
    degree: string;
    subject: string;
    university: string;
    passingYear: number;
}

export interface CandidateData {
    id: string;
    candidateId: string;
    name: string;
    title: string;
    avatar?: string;
    experience: string;
    location: string;
    currentCompany: string;
    previousCompany: string;
    education: string | Education | Education[];
    preferredLocations: string[];
    keySkills: string[];
    additionalSkills: string[];
    salary: string;
    availability: string;
    lastActive: string;
    profileViews: number;
    downloads: number;
    similarProfiles: number;
    certifications: string[];
    workType: string[];
    email?: string;
    phone?: string;
    summary?: string;
    portfolioUrl?: string;
    resumeUrl?: string;
    isActivelyLooking?: boolean;
    gender?: string;
    personWithDisability?: boolean;
}

export interface SearchFilters {
    query: string;
    skills: string[];
    experienceRange: [number, number];
    salaryRange: [number, number];
    locations: string[];
    education: string;
    companies: string[];
    availability: string;
    workType: string[];
    verified: boolean;
    highResponseRate: boolean;
    recentlyActive: boolean;
    certifications: string[];
    languages: string[];
}

export const mockCandidatesData: CandidateData[] = [];

export const skillCategories = {
    Frontend: ["React", "Vue.js", "Angular", "JavaScript", "TypeScript", "HTML5", "CSS3", "SCSS", "Tailwind CSS"],
    Backend: ["Node.js", "Python", "Java", "C#", ".NET", "PHP", "Ruby", "Go", "Rust"],
    Database: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Elasticsearch", "DynamoDB"],
    "Cloud & DevOps": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform"],
    Mobile: ["React Native", "Flutter", "iOS", "Android", "Kotlin", "Swift"],
    Design: ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator"],
    Other: ["GraphQL", "REST APIs", "Microservices", "Machine Learning", "Blockchain"],
};

// Comprehensive skill suggestions for autocomplete
export const skillSuggestions = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "Dart",

    // Frontend Technologies
    "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "HTML5", "CSS3", "SCSS", "Tailwind CSS", "Bootstrap", "Material-UI", "Ant Design",

    // Backend Technologies
    "Node.js", "Express.js", "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Laravel", "Ruby on Rails", "Gin", "Echo",

    // Databases
    "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch", "DynamoDB", "Cassandra", "Neo4j", "Oracle", "SQL Server",

    // Cloud & DevOps
    "AWS", "Azure", "Google Cloud Platform", "Docker", "Kubernetes", "Jenkins", "GitLab CI", "GitHub Actions", "Terraform", "Ansible", "Prometheus", "Grafana",

    // Mobile Development
    "React Native", "Flutter", "iOS Development", "Android Development", "Xamarin", "Ionic", "Cordova",

    // Design & UX
    "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "InVision", "Zeplin", "UI Design", "UX Design", "User Research",

    // Data & Analytics
    "Machine Learning", "Data Science", "TensorFlow", "PyTorch", "Pandas", "NumPy", "R", "Tableau", "Power BI", "Apache Spark",

    // Testing
    "Jest", "Cypress", "Selenium", "TestNG", "JUnit", "Mocha", "Chai", "React Testing Library", "Playwright",

    // Other Technologies
    "GraphQL", "REST APIs", "Microservices", "Blockchain", "Ethereum", "Solidity", "WebSockets", "Socket.io", "RabbitMQ", "Apache Kafka",

    // Soft Skills
    "Team Leadership", "Project Management", "Agile", "Scrum", "Kanban", "Problem Solving", "Communication", "Mentoring", "Code Review"
];
