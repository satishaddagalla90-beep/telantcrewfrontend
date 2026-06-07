export interface UserData {
    id: string;
    employee_id: string;
    username: string;
    display_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_no: number;
    avatar: string;
    role: string[];
    designation: string;
    department: string[];
    location: string;
    reporting_to: string[];
    status: 'Active' | 'Inactive';
    created: string;
    updated: string;
    verified: boolean;
    permission?: {
        candidate: string;
        client: string;
        job: string;
        supplier: string;
        users: string;
    } | null;
    expand?: {
        role: Array<{
            id: string;
            name: string;
        }>;
        designation: {
            id: string;
            name: string;
        };
        department: Array<{
            id: string;
            name: string;
        }>;
        location: {
            id: string;
            name: string;
            city: string;
            state: string;
            country: string;
        };
        reporting_to: Array<{
            id: string;
            display_name: string;
            email: string;
        }>;
    };
}

export const mockUsersData: UserData[] = [
    {
        id: "k0n4rmqj6njuv21",
        employee_id: "TC123",
        username: "TC123",
        display_name: "Asif sir",
        first_name: "Asif",
        last_name: "sir",
        email: "omersir123@gmail.com",
        phone_no: 9000677086,
        avatar: "wipro_tgDioMVqZk.png",
        role: ["ahg1n757eprfk77"],
        designation: "br1l6hpamxpv4us",
        department: ["mvde3m4tdnmd23x"],
        location: "n7hrxalntdzvkhf",
        reporting_to: ["gr5sdhghzvny7ea"],
        status: "Active",
        created: "2025-08-02 06:35:48.341Z",
        updated: "2025-08-02 06:41:06.939Z",
        verified: false,
        permission: null,
        expand: {
            role: [{
                id: "ahg1n757eprfk77",
                name: "Delivery Manager"
            }],
            designation: {
                id: "br1l6hpamxpv4us",
                name: "Software Developer"
            },
            department: [{
                id: "mvde3m4tdnmd23x",
                name: "Human Resource"
            }],
            location: {
                id: "n7hrxalntdzvkhf",
                name: "India/Madhya Pradesh/Jabalpur",
                city: "Jabalpur",
                state: "Madhya Pradesh",
                country: "IN"
            },
            reporting_to: [{
                id: "gr5sdhghzvny7ea",
                display_name: "Shreyansh Bajpai",
                email: "shreyanshbajpaiofficial@gmail.com"
            }]
        }
    },
    {
        id: "thdqgw8jt5hwprb",
        employee_id: "Abdull123",
        username: "Abdull123",
        display_name: "Abdullah Harrish",
        first_name: "Abdullah",
        last_name: "Harrish",
        email: "abdul@gmail.com",
        phone_no: 8423344345,
        avatar: "wipro_Ab0w3CcUI2.png",
        role: ["09wrktlfjmdgj3v"],
        designation: "hkwn9xm11zddm93",
        department: ["mvde3m4tdnmd23x"],
        location: "q8yqamtroz2lazh",
        reporting_to: ["gr5sdhghzvny7ea"],
        status: "Active",
        created: "2025-08-01 08:09:09.256Z",
        updated: "2025-08-09 08:38:24.364Z",
        verified: false,
        permission: {
            candidate: "1100",
            client: "1100",
            job: "1100",
            supplier: "1100",
            users: "0000"
        },
        expand: {
            role: [{
                id: "09wrktlfjmdgj3v",
                name: "Intern"
            }],
            designation: {
                id: "hkwn9xm11zddm93",
                name: "Software Developer"
            },
            department: [{
                id: "mvde3m4tdnmd23x",
                name: "Human Resource"
            }],
            location: {
                id: "q8yqamtroz2lazh",
                name: "India/Telangana/Hyderabad",
                city: "Hyderabad",
                state: "Telangana",
                country: "IN"
            },
            reporting_to: [{
                id: "gr5sdhghzvny7ea",
                display_name: "Shreyansh Bajpai",
                email: "shreyanshbajpaiofficial@gmail.com"
            }]
        }
    },
    {
        id: "j3zmqv0p4e5218o",
        employee_id: "TEKISUB",
        username: "TEKISUB",
        display_name: "Sanya Tekishub",
        first_name: "Sanya",
        last_name: "Tekishub",
        email: "sanya@gmail.com",
        phone_no: 7995880020,
        avatar: "wipro_UOqEvLOczN.png",
        role: ["09wrktlfjmdgj3v"],
        designation: "267o3w9jfwqj8cv",
        department: ["65yy1jtg005e9jv"],
        location: "q8yqamtroz2lazh",
        reporting_to: ["gr5sdhghzvny7ea"],
        status: "Active",
        created: "2025-07-21 16:47:21.379Z",
        updated: "2025-07-21 16:56:56.243Z",
        verified: false,
        permission: {
            candidate: "0100",
            client: "0000",
            job: "0000",
            supplier: "0000",
            users: "0000"
        },
        expand: {
            role: [{
                id: "09wrktlfjmdgj3v",
                name: "Intern"
            }],
            designation: {
                id: "267o3w9jfwqj8cv",
                name: "App dev"
            },
            department: [{
                id: "65yy1jtg005e9jv",
                name: "Finance"
            }],
            location: {
                id: "q8yqamtroz2lazh",
                name: "India/Telangana/Hyderabad",
                city: "Hyderabad",
                state: "Telangana",
                country: "IN"
            },
            reporting_to: [{
                id: "gr5sdhghzvny7ea",
                display_name: "Shreyansh Bajpai",
                email: "shreyanshbajpaiofficial@gmail.com"
            }]
        }
    },
    {
        id: "gr5sdhghzvny7ea",
        employee_id: "shreyansh",
        username: "shreyansh",
        display_name: "Shreyansh Bajpai",
        first_name: "Shreyansh",
        last_name: "Bajpai",
        email: "shreyanshbajpaiofficial@gmail.com",
        phone_no: 8423344345,
        avatar: "photo_me_yj35W9doNr.jpg",
        role: ["r9hy3ikx1qb9wsh"],
        designation: "br1l6hpamxpv4us",
        department: ["mvde3m4tdnmd23x"],
        location: "um96be51nmq0v78",
        reporting_to: ["3kqmggc034a0w4t"],
        status: "Active",
        created: "2025-01-13 16:31:08.015Z",
        updated: "2025-07-30 08:45:21.521Z",
        verified: true,
        permission: {
            candidate: "1111",
            client: "1111",
            job: "1111",
            supplier: "1111",
            users: "1111"
        },
        expand: {
            role: [{
                id: "r9hy3ikx1qb9wsh",
                name: "Admin"
            }],
            designation: {
                id: "br1l6hpamxpv4us",
                name: "Software Developer"
            },
            department: [{
                id: "mvde3m4tdnmd23x",
                name: "Human Resource"
            }],
            location: {
                id: "um96be51nmq0v78",
                name: "India/Maharashtra/Mumbai",
                city: "Mumbai",
                state: "Maharashtra",
                country: "IN"
            },
            reporting_to: [{
                id: "3kqmggc034a0w4t",
                display_name: "CEO Admin",
                email: "ceo@talentcrew.com"
            }]
        }
    },
    {
        id: "test_inactive_user",
        employee_id: "EMP999",
        username: "inactive_user",
        display_name: "John Inactive",
        first_name: "John",
        last_name: "Inactive",
        email: "john.inactive@gmail.com",
        phone_no: 9876543210,
        avatar: "default_avatar.png",
        role: ["09wrktlfjmdgj3v"],
        designation: "267o3w9jfwqj8cv",
        department: ["65yy1jtg005e9jv"],
        location: "q8yqamtroz2lazh",
        reporting_to: ["gr5sdhghzvny7ea"],
        status: "Inactive",
        created: "2025-01-15 10:30:00.000Z",
        updated: "2025-07-01 15:45:00.000Z",
        verified: false,
        permission: {
            candidate: "0000",
            client: "0000",
            job: "0000",
            supplier: "0000",
            users: "0000"
        },
        expand: {
            role: [{
                id: "09wrktlfjmdgj3v",
                name: "Intern"
            }],
            designation: {
                id: "267o3w9jfwqj8cv",
                name: "App dev"
            },
            department: [{
                id: "65yy1jtg005e9jv",
                name: "Finance"
            }],
            location: {
                id: "q8yqamtroz2lazh",
                name: "India/Telangana/Hyderabad",
                city: "Hyderabad",
                state: "Telangana",
                country: "IN"
            },
            reporting_to: [{
                id: "gr5sdhghzvny7ea",
                display_name: "Shreyansh Bajpai",
                email: "shreyanshbajpaiofficial@gmail.com"
            }]
        }
    }
];
