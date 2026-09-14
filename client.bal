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