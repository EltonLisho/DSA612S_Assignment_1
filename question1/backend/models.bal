public type AssetStatus
    "AVAILABLE"
    | "LOANED_OUT"
    | "OCCUPIED"
    | "UNDER_MAINTENANCE"
    | "DISPOSED";

public type ScheduleType
    "MAINTENANCE"
    | "SERVICING"
    | "BOOKING";

public type WorkOrderStatus
    "OPEN"
    | "IN_PROGRESS"
    | "CLOSED";

public type Component record {|
    string compId;
    string name;
    string description;
|};

public type Schedule record {|
    string scheduleId;
    ScheduleType scheduleType;
    string dueDate;
    string description;
|};

public type Task record {|
    string taskId;
    string description;
    boolean completed = false;
|};

public type WorkOrder record {|
    string orderId;
    WorkOrderStatus status;
    string description;
    Task[] tasks = [];
|};

public type Asset record {|
    readonly string assetTag;
    string name;
    string description;
    string institution;
    string site;
    AssetStatus status;
    string dateAcquired;
    Component[] components = [];
    Schedule[] schedules = [];
    WorkOrder[] workOrders = [];
    Loan[] loans = [];
    Booking[] bookings = [];
|};


public type LoanRequest record {|
    string borrower;
    string loanDate;
    string dueDate;
|};

public type BookingRequest record {|
    string bookedBy;
    string startDate;
    string endDate;
|};


public type Institution record {|
    readonly string institutionId;
    string name;
    string description;
|};

public type Loan record {|
    string loanId;
    string borrower;
    string loanDate;
    string dueDate;
    string status;
|};

public type Booking record {|
    string bookingId;
    string bookedBy;
    string startDate;
    string endDate;
    string status;
|};

public type ErrorResponse record {|
    string message;
    string code;
|};
