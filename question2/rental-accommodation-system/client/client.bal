import ballerina/grpc;
import ballerina/io;



public function main() returns error? {
    RentalServiceClient ep = check new ("http://localhost:9090");

    while true {
        io:println("\n=== Rental Accommodation System - Client ===");
        io:println("1. Add property (Host)");
        io:println("2. Register users - streaming (Host/Guest)");
        io:println("3. Update property (Host)");
        io:println("4. Remove property (Host)");
        io:println("5. List available properties (Guest)");
        io:println("6. Search property by ID (Guest)");
        io:println("7. Book property (Guest)");
        io:println("8. Confirm booking (Guest)");
        io:println("0. Exit");
        string choice = io:readln("Choose an option: ");

        error? result = ();
        match choice {
            "1" => { result = addPropertyFlow(ep); }
            "2" => { result = createUsersFlow(ep); }
            "3" => { result = updatePropertyFlow(ep); }
            "4" => { result = removePropertyFlow(ep); }
            "5" => { result = listPropertiesFlow(ep); }
            "6" => { result = searchPropertyFlow(ep); }
            "7" => { result = bookPropertyFlow(ep); }
            "8" => { result = confirmBookingFlow(ep); }
            "0" => { io:println("Goodbye."); return; }
            _ => { io:println("Invalid option."); }
        }
        if result is error {
            io:println("Error: ", result.message());
        }
    }
}


// Helper functions


function parseFloatOrDefault(string s, float default) returns float {
    float|error v = float:fromString(s);
    return v is float ? v : default;
}

function statusFromString(string s) returns PropertyStatus {
    match s.trim().toUpperAscii() {
        "UNAVAILABLE" => { return UNAVAILABLE; }
        "UNDER_MAINTENANCE" => { return UNDER_MAINTENANCE; }
        _ => { return AVAILABLE; }
    }
}


// add property

function addPropertyFlow(RentalServiceClient ep) returns error? {
    string hostId = io:readln("Host ID: ");
    string name = io:readln("Property name: ");
    string location = io:readln("Location: ");
    string propertyType = io:readln("Property type (e.g. Apartment, Cabin): ");
    float price = check float:fromString(io:readln("Price per night: "));

    AddPropertyRequest req = {
        host_id: hostId,
        name: name,
        location: location,
        property_type: propertyType,
        price_per_night: price,
        status: AVAILABLE
    };
    AddPropertyResponse res = check ep->AddProperty(req);
    io:println(res.success ? "OK: " : "FAIL: ", res.message, " Property ID: ", res.property_id);
}


// create users (client-side streaming)

function createUsersFlow(RentalServiceClient ep) returns error? {
    int count = check int:fromString(io:readln("How many users to register? "));
    CreateUsersStreamingClient streamClient = check ep->CreateUsers();

    foreach int i in 1 ... count {
        io:println("--- User ", i, " ---");
        string name = io:readln("Name: ");
        string email = io:readln("Email: ");
        string roleInput = io:readln("Role (HOST/GUEST): ");
        UserRole role = roleInput.trim().toUpperAscii() == "HOST" ? HOST : GUEST;
        User u = {user_id: "", name: name, email: email, role: role};
        check streamClient->sendUser(u);
    }

    check streamClient->complete();
    CreateUsersResponse|grpc:Error? res = streamClient->receiveCreateUsersResponse();
    if res is grpc:Error {
        return error("Failed to receive create-users response: ", res);
    }
    if res is () {
        return error("No response received from server for create-users stream");
    }
    io:println("OK: ", res.message, " IDs: ", res.user_ids.toString());
}


// update property

function updatePropertyFlow(RentalServiceClient ep) returns error? {
    string propertyId = io:readln("Property ID: ");
    string hostId = io:readln("Host ID (must match owner): ");
    float price = check float:fromString(io:readln("New price per night: "));
    string statusInput = io:readln("New status (AVAILABLE/UNAVAILABLE/UNDER_MAINTENANCE): ");

    UpdatePropertyRequest req = {
        property_id: propertyId,
        host_id: hostId,
        price_per_night: price,
        status: statusFromString(statusInput)
    };
    UpdatePropertyResponse res = check ep->UpdateProperty(req);
    io:println(res.success ? "OK: " : "FAIL: ", res.message);
}


// remove_property

function removePropertyFlow(RentalServiceClient ep) returns error? {
    string propertyId = io:readln("Property ID: ");
    string hostId = io:readln("Host ID (must match owner): ");

    RemovePropertyResponse res = check ep->RemoveProperty({property_id: propertyId, host_id: hostId});
    io:println(res.success ? "OK: " : "FAIL: ", res.message);
    io:println("Remaining properties for this host: ", res.remaining_properties.length());
    foreach Property p in res.remaining_properties {
        io:println(" - ", p.property_id, " | ", p.name);
    }
}


// list_available_properties (server-side streaming)

function listPropertiesFlow(RentalServiceClient ep) returns error? {
    string location = io:readln("Filter by location (blank = any): ");
    float minPrice = parseFloatOrDefault(io:readln("Min price (0 = any): "), 0.0);
    float maxPrice = parseFloatOrDefault(io:readln("Max price (0 = any): "), 0.0);

    stream<Property, grpc:Error?> resultStream =
        check ep->ListAvailableProperties({location: location, min_price: minPrice, max_price: maxPrice});

    io:println("--- Available properties ---");
    error? e = resultStream.forEach(function(Property p) {
        io:println(p.property_id, " | ", p.name, " | ", p.location, " | N$", p.price_per_night, "/night");
    });
    if e is error {
        return e;
    }
}


// search property

function searchPropertyFlow(RentalServiceClient ep) returns error? {
    string propertyId = io:readln("Property ID: ");
    SearchPropertyResponse res = check ep->SearchProperty({property_id: propertyId});
    if res.found {
        Property p = res.property;
        io:println("OK: ", p.property_id, " | ", p.name, " | ", p.location, " | ",
                p.status.toString(), " | N$", p.price_per_night);
    } else {
        io:println("FAIL: ", res.message);
    }
}


// book property

function bookPropertyFlow(RentalServiceClient ep) returns error? {
    string guestId = io:readln("Guest ID: ");
    string propertyId = io:readln("Property ID: ");
    string checkIn = io:readln("Check-in (YYYY-MM-DD): ");
    string checkOut = io:readln("Check-out (YYYY-MM-DD): ");

    BookPropertyResponse res = check ep->BookProperty({
        guest_id: guestId, property_id: propertyId, check_in: checkIn, check_out: checkOut
    });
    io:println(res.success ? "OK: " : "FAIL: ", res.message);
    if res.success {
        io:println("Booking request ID (use this to confirm): ", res.booking_request_id);
    }
}


// confirm booking

function confirmBookingFlow(RentalServiceClient ep) returns error? {
    string requestId = io:readln("Booking request ID: ");
    string guestId = io:readln("Guest ID: ");

    ConfirmBookingResponse res = check ep->ConfirmBooking({booking_request_id: requestId, guest_id: guestId});
    if res.success {
        io:println("OK: ", res.message);
        io:println("Booking ID: ", res.booking_id, " | Nights: ", res.nights, " | Total: N$", res.total_cost);
    } else {
        io:println("FAIL: ", res.message);
    }
}
