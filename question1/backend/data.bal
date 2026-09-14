

public table<Institution> key(institutionId) institutions = table [
    {
        institutionId: "NUST",
        name: "Namibia University of Science and Technology",
        description: "University and higher education institution."
    },
    {
        institutionId: "UNAM",
        name: "University of Namibia",
        description: "Public university in Namibia."
    }
];





public table<Asset> key(assetTag) assets = table [
    {
        assetTag: "NUST-LIB-3DP-001",
        name: "Pro-Series 3D Printer",
        description: "High-precision laboratory printer for simulation and prototype development.",
        institution: "Namibia University of Science and Technology",
        site: "Main Campus - Innovation Lab",
        status: "AVAILABLE",
        dateAcquired: "2024-03-10",

        components: [
            {
                compId: "C101",
                name: "High-Torque Stepper Motor",
                description: "Main motor for X-axis movement."
            }
        ],

    schedules: [
    {
        scheduleId: "SCH-882",
        scheduleType: "MAINTENANCE",
        dueDate: "2026-09-01",
        description: "Quarterly calibration and nozzle cleaning."
    }
],

        workOrders: [
            {
                orderId: "WO-554",
                status: "OPEN",
                description: "Nozzle heat-bed failure",
                tasks: [
                    {
                        taskId: "T1",
                        description: "Check thermal sensor connectivity."
                    }
                ]
            }
        ]
    },

    {
        assetTag: "UNAM-LIB-LAP-001",
        name: "Dell Latitude 5440",
        description: "Library loan laptop.",
        institution: "University of Namibia",
        site: "Main Campus Library",
        status: "AVAILABLE",
        dateAcquired: "2026-01-15"
    },

    {
        assetTag: "NUST-LAB-ROOM-001",
        name: "Innovation Lab Meeting Room",
        description: "Meeting room available for academic and research activities.",
        institution: "Namibia University of Science and Technology",
        site: "Main Campus - Innovation Lab",
        status: "AVAILABLE",
        dateAcquired: "2025-02-01"
    }
];
