import ballerina/http;
import ballerina/time;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://127.0.0.1:5500", "http://localhost:5500"],
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type"]
    }
}

service / on new http:Listener(9090) {

   
    // ASSET CRUD
    

    resource function get assets() returns Asset[] {
        return assets.toArray();
    }

    resource function get assets/[string assetTag]()
        returns Asset|http:NotFound {

        Asset? asset = assets[assetTag];

        if asset is Asset {
            return asset;
        }

        return http:NOT_FOUND;
    }



 resource function post assets(
    @http:Payload Asset asset
) returns http:Created|http:Conflict {

    if assets.hasKey(asset.assetTag) {
        return http:CONFLICT;
    }

    assets.put(asset);

    return <http:Created>{
        body: asset
    };
}

    resource function put assets/[string assetTag](
        @http:Payload Asset updatedAsset
    ) returns Asset|http:NotFound|http:BadRequest {

        if !assets.hasKey(assetTag) {
            return http:NOT_FOUND;
        }


    if updatedAsset.assetTag != assetTag {
    return http:BAD_REQUEST;
}
   

        assets.put(updatedAsset);

        return updatedAsset;
    }

    resource function delete assets/[string assetTag]()
        returns http:Ok|http:NotFound {

        if !assets.hasKey(assetTag) {
            return http:NOT_FOUND;
        }

        _ = assets.removeIfHasKey(assetTag);

        return <http:Ok>{
            body: "Asset deleted successfully."
        };
    }


    // FILTERING
   

    resource function get assets/institution/[string institution]()
        returns Asset[] {

        Asset[] result = [];

        foreach Asset asset in assets {
            if asset.institution == institution {
                result.push(asset);
            }
        }

        return result;
    }

    resource function get assets/site/[string site]()
        returns Asset[] {

        Asset[] result = [];

        foreach Asset asset in assets {
            if asset.site == site {
                result.push(asset);
            }
        }

        return result;
    }

  

    // OVERDUE MAINTENANCE
   

    resource function get assets/overdue()
        returns Asset[] {

        Asset[] result = [];

        time:Utc now = time:utcNow();
        string currentDate = now.toString().substring(0, 10);

        foreach Asset asset in assets {

            foreach Schedule schedule in asset.schedules {

                if schedule.scheduleType == "MAINTENANCE" &&
                    schedule.dueDate < currentDate {

                    result.push(asset);
                    break;
                }
            }
        }

        return result;
    }




// GET COMPONENTS
// GET /assets/{assetTag}/components


resource function get assets/[string assetTag]/components()
    returns Component[]|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is Asset {
        return asset.components;
    }

    return http:NOT_FOUND;
}


// ADD COMPONENT
// POST /assets/{assetTag}/components


resource function post assets/[string assetTag]/components(
    @http:Payload Component component
) returns Asset|http:NotFound|http:Conflict {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach Component existingComponent in asset.components {

        if existingComponent.compId == component.compId {
            return http:CONFLICT;
        }
    }

    asset.components.push(component);

    assets.put(asset);

    return asset;
}


// DELETE COMPONENT
// DELETE /assets/{assetTag}/components/{compId}


resource function delete assets/[string assetTag]/components/[string compId]()
    returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    Component[] updatedComponents = [];
    boolean found = false;

    foreach Component component in asset.components {

        if component.compId == compId {
            found = true;
        } else {
            updatedComponents.push(component);
        }
    }

    if !found {
        return http:NOT_FOUND;
    }

    asset.components = updatedComponents;

    assets.put(asset);

    return asset;
}

// GET SCHEDULES
// GET /assets/{assetTag}/schedules


resource function get assets/[string assetTag]/schedules()
    returns Schedule[]|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is Asset {
        return asset.schedules;
    }

    return http:NOT_FOUND;
}




// ADD SCHEDULE
// POST /assets/{assetTag}/schedules


resource function post assets/[string assetTag]/schedules(
    @http:Payload Schedule schedule
) returns Asset|http:NotFound|http:Conflict {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach Schedule existingSchedule in asset.schedules {

        if existingSchedule.scheduleId == schedule.scheduleId {
            return http:CONFLICT;
        }
    }

    asset.schedules.push(schedule);

    assets.put(asset);

    return asset;
}




// UPDATE SCHEDULE
// PUT /assets/{assetTag}/schedules/{scheduleId}


resource function put assets/[string assetTag]/schedules/[string scheduleId](
    @http:Payload Schedule updatedSchedule
) returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    boolean found = false;

    foreach int i in 0 ..< asset.schedules.length() {

        if asset.schedules[i].scheduleId == scheduleId {

            asset.schedules[i] = updatedSchedule;

            found = true;

            break;
        }
    }

    if !found {
        return http:NOT_FOUND;
    }

    assets.put(asset);

    return asset;
}




// DELETE SCHEDULE
// DELETE /assets/{assetTag}/schedules/{scheduleId}

resource function delete assets/[string assetTag]/schedules/[string scheduleId]()
    returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    Schedule[] updatedSchedules = [];
    boolean found = false;

    foreach Schedule schedule in asset.schedules {

        if schedule.scheduleId == scheduleId {
            found = true;
        } else {
            updatedSchedules.push(schedule);
        }
    }

    if !found {
        return http:NOT_FOUND;
    }

    asset.schedules = updatedSchedules;

    assets.put(asset);

    return asset;
}




// GET ALL WORK ORDERS
// GET /assets/{assetTag}/workorders

resource function get assets/[string assetTag]/workorders()
    returns WorkOrder[]|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is Asset {
        return asset.workOrders;
    }

    return http:NOT_FOUND;
}



// CREATE WORK ORDER
// POST /assets/{assetTag}/workorders

resource function post assets/[string assetTag]/workorders(
    @http:Payload WorkOrder workOrder
) returns Asset|http:NotFound|http:Conflict {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach WorkOrder existingOrder in asset.workOrders {

        if existingOrder.orderId == workOrder.orderId {
            return http:CONFLICT;
        }
    }

    asset.workOrders.push(workOrder);

    assets.put(asset);

    return asset;
}



// UPDATE WORK ORDER
// PUT /assets/{assetTag}/workorders/{orderId}

resource function put assets/[string assetTag]/workorders/[string orderId](
    @http:Payload WorkOrder updatedOrder
) returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    boolean found = false;

    foreach int i in 0 ..< asset.workOrders.length() {

        if asset.workOrders[i].orderId == orderId {

            asset.workOrders[i] = updatedOrder;

            found = true;

            break;
        }
    }

    if !found {
        return http:NOT_FOUND;
    }

    assets.put(asset);

    return asset;
}



// DELETE WORK ORDER
// DELETE /assets/{assetTag}/workorders/{orderId}

resource function delete assets/[string assetTag]/workorders/[string orderId]()
    returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    WorkOrder[] updatedOrders = [];
    boolean found = false;

    foreach WorkOrder workOrder in asset.workOrders {

        if workOrder.orderId == orderId {
            found = true;
        } else {
            updatedOrders.push(workOrder);
        }
    }

    if !found {
        return http:NOT_FOUND;
    }

    asset.workOrders = updatedOrders;

    assets.put(asset);

    return asset;
}

// GET TASKS
// GET /assets/{assetTag}/workorders/{orderId}/tasks

resource function get assets/[string assetTag]/workorders/[string orderId]/tasks()
    returns Task[]|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach WorkOrder workOrder in asset.workOrders {

        if workOrder.orderId == orderId {
            return workOrder.tasks;
        }
    }

    return http:NOT_FOUND;
}


// ADD TASK
// POST /assets/{assetTag}/workorders/{orderId}/tasks

resource function post assets/[string assetTag]/workorders/[string orderId]/tasks(
    @http:Payload Task task
) returns Asset|http:NotFound|http:Conflict {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach int i in 0 ..< asset.workOrders.length() {

        if asset.workOrders[i].orderId == orderId {

            foreach Task existingTask in asset.workOrders[i].tasks {

                if existingTask.taskId == task.taskId {
                    return http:CONFLICT;
                }
            }

            asset.workOrders[i].tasks.push(task);

            assets.put(asset);

            return asset;
        }
    }

    return http:NOT_FOUND;
}


// UPDATE TASK
// PUT /assets/{assetTag}/workorders/{orderId}/tasks/{taskId}

resource function put assets/[string assetTag]/workorders/[string orderId]/tasks/[string taskId](
    @http:Payload Task updatedTask
) returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach int i in 0 ..< asset.workOrders.length() {

        if asset.workOrders[i].orderId == orderId {

            foreach int j in 0 ..< asset.workOrders[i].tasks.length() {

                if asset.workOrders[i].tasks[j].taskId == taskId {

                    asset.workOrders[i].tasks[j] = updatedTask;

                    assets.put(asset);

                    return asset;
                }
            }

            return http:NOT_FOUND;
        }
    }

    return http:NOT_FOUND;
}



// DELETE TASK
// DELETE /assets/{assetTag}/workorders/{orderId}/tasks/{taskId}

resource function delete assets/[string assetTag]/workorders/[string orderId]/tasks/[string taskId]()
    returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach int i in 0 ..< asset.workOrders.length() {

        if asset.workOrders[i].orderId == orderId {

            Task[] updatedTasks = [];
            boolean found = false;

            foreach Task task in asset.workOrders[i].tasks {

                if task.taskId == taskId {
                    found = true;
                } else {
                    updatedTasks.push(task);
                }
            }

            if !found {
                return http:NOT_FOUND;
            }

            asset.workOrders[i].tasks = updatedTasks;

            assets.put(asset);

            return asset;
        }
    }

    return http:NOT_FOUND;
}



// GET ALL INSTITUTIONS
// GET /institutions

resource function get institutions()
    returns Institution[] {

    return institutions.toArray();
}



// CREATE INSTITUTION
// POST /institutions

resource function post institutions(
    @http:Payload Institution institution
) returns Institution|http:Conflict {

    if institutions.hasKey(institution.institutionId) {
        return http:CONFLICT;
    }

    institutions.put(institution);

    return institution;
}



// DELETE INSTITUTION
// DELETE /institutions/{institutionId}

resource function delete institutions/[string institutionId]()
    returns http:Ok|http:NotFound {

    if !institutions.hasKey(institutionId) {
        return http:NOT_FOUND;
    }

    _ = institutions.removeIfHasKey(institutionId);

    return <http:Ok>{
        body: "Institution deleted successfully."
    };
}




// LOAN ASSET
// POST /assets/{assetTag}/loan

resource function post assets/[string assetTag]/loan(
    @http:Payload Loan loan
) returns Asset|http:NotFound|http:Conflict {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    if asset.status != "AVAILABLE" {
        return http:CONFLICT;
    }

    foreach Loan existingLoan in asset.loans {

        if existingLoan.loanId == loan.loanId {
            return http:CONFLICT;
        }
    }

    asset.loans.push(loan);

    asset.status = "LOANED_OUT";

    assets.put(asset);

    return asset;
}




// GET LOANS
// GET /assets/{assetTag}/loans

resource function get assets/[string assetTag]/loans()
    returns Loan[]|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is Asset {
        return asset.loans;
    }

    return http:NOT_FOUND;
}



// RETURN LOAN
// PUT /assets/{assetTag}/loans/{loanId}/returnLoan

resource function put assets/[string assetTag]/loans/[string loanId]/returnLoan()
    returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    foreach int i in 0 ..< asset.loans.length() {

        if asset.loans[i].loanId == loanId {

            asset.loans[i].status = "RETURNED";

            asset.status = "AVAILABLE";

            assets.put(asset);

            return asset;
        }
    }

    return http:NOT_FOUND;
}


// CREATE BOOKING
// POST /assets/{assetTag}/book

resource function post assets/[string assetTag]/book(
    @http:Payload Booking booking
) returns Asset|http:NotFound|http:Conflict {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    if asset.status == "DISPOSED" ||
        asset.status == "UNDER_MAINTENANCE" ||
        asset.status == "LOANED_OUT" {

        return http:CONFLICT;
    }

    foreach Booking existingBooking in asset.bookings {

        if existingBooking.bookingId == booking.bookingId {
            return http:CONFLICT;
        }

        if existingBooking.status == "ACTIVE" &&
            booking.startDate < existingBooking.endDate &&
            booking.endDate > existingBooking.startDate {

            return http:CONFLICT;
        }
    }

    asset.bookings.push(booking);

    asset.status = "OCCUPIED";

    assets.put(asset);

    return asset;
}



// GET BOOKINGS
// GET /assets/{assetTag}/bookings

resource function get assets/[string assetTag]/bookings()
    returns Booking[]|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is Asset {
        return asset.bookings;
    }

    return http:NOT_FOUND;
}



// DELETE BOOKING
// DELETE /assets/{assetTag}/bookings/{bookingId}

resource function delete assets/[string assetTag]/bookings/[string bookingId]()
    returns Asset|http:NotFound {

    Asset? asset = assets[assetTag];

    if asset is () {
        return http:NOT_FOUND;
    }

    Booking[] updatedBookings = [];
    boolean found = false;

    foreach Booking booking in asset.bookings {

        if booking.bookingId == bookingId {
            found = true;
        } else {
            updatedBookings.push(booking);
        }
    }

    if !found {
        return http:NOT_FOUND;
    }

    asset.bookings = updatedBookings;

    if asset.bookings.length() == 0 {
        asset.status = "AVAILABLE";
    }

    assets.put(asset);

    return asset;
}





}
