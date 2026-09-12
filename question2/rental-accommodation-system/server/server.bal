map<Property> properties = {};                      // key: propertyId
map<User> users = {};                                // key: userId
map<CartItem> bookingCart = {};                      // key: bookingRequestId (pending)
map<ConfirmedBookingRecord> confirmedBookings = {};  // key: bookingId

type CartItem record {|
    string bookingRequestId;
    string guestId;
    string propertyId;
    string checkIn;
    string checkOut;
|};

type ConfirmedBookingRecord record {|
    string bookingId;
    string guestId;
    string propertyId;
    string checkIn;
    string checkOut;
    int nights;
    decimal totalCost;
|};


// Helper functions


// Number of nights between two ISO "YYYY-MM-DD" dates.
// Returns an error if the dates are malformed or checkOut <= checkIn.
function nightsBetween(string checkIn, string checkOut) returns int|error {
    time:Utc inUtc = check time:utcFromString(checkIn + "T00:00:00.000Z");
    time:Utc outUtc = check time:utcFromString(checkOut + "T00:00:00.000Z");
    int diffSeconds = outUtc[0] - inUtc[0];
    int nights = diffSeconds / 86400;
    if nights <= 0 {
        return error("Check-out date must be after check-in date.");
    }
    return nights;
}

// ISO "YYYY-MM-DD" strings sort in chronological order,
// test range overlap.
// Ranges are treated as half-open [checkIn, checkOut) so a guest can
// check in on the same day another guest checks out.
function datesOverlap(string inA, string outA, string inB, string outB) returns boolean {
    return inA < outB && inB < outA;
}

function emptyProperty() returns Property => {
    property_id: "",
    host_id: "",
    name: "",
    location: "",
    property_type: "",
    price_per_night: 0.0,
    status: AVAILABLE
};


// gRPC service

listener grpc:Listener rentalListener = new (9090);

@grpc:Descriptor {value: RENTAL_DESC}   // generated from rental.proto and must match the service name in that file
service "RentalService" on rentalListener {

    
    // add_property
    
    remote function AddProperty(AddPropertyRequest req) returns AddPropertyResponse|error {
        if req.name.trim() == "" || req.host_id.trim() == "" {
            return {success: false, message: "host_id and name are required.", property_id: ""};
        }

        string propertyId = "PROP-" + uuid:createType4AsString().substring(0, 8);
        Property property = {
            property_id: propertyId,
            host_id: req.host_id,
            name: req.name,
            location: req.location,
            property_type: req.property_type,
            price_per_night: req.price_per_night,
            status: req.status
        };

        lock {
            properties[propertyId] = property.clone();
        }

        log:printInfo("Property added", propertyId = propertyId);
        return {success: true, message: "Property registered successfully.", property_id: propertyId};
    }

    
    // create_users (client-side streaming)
    
    remote function CreateUsers(stream<User, grpc:Error?> clientStream) returns CreateUsersResponse|error {
        string[] createdIds = [];

        error? streamErr = clientStream.forEach(function(User u) {
            string userId = "USR-" + uuid:createType4AsString().substring(0, 8);
            User newUser = {user_id: userId, name: u.name, email: u.email, role: u.role};
            lock {
                users[userId] = newUser.clone();
            }
            createdIds.push(userId);
        });

        if streamErr is error {
            return streamErr;
        }

        return {
            success: true,
            message: string `${createdIds.length()} user(s) registered.`,
            total_created: createdIds.length(),
            user_ids: createdIds
        };
    }

    
    // update_property
    
    remote function UpdateProperty(UpdatePropertyRequest req) returns UpdatePropertyResponse|error {
        lock {
            Property? existing = properties[req.property_id];
            if existing is () {
                return {success: false, message: "Property not found.", property: emptyProperty()};
            }
            if existing.host_id != req.host_id {
                return {success: false, message: "Only the owning host may update this property.", property: emptyProperty()};
            }
            existing.price_per_night = req.price_per_night;
            existing.status = req.status;
            properties[req.property_id] = existing;
            return {success: true, message: "Property updated.", property: existing.clone()};
        }
    }

    
    // remove_property
    
    remote function RemoveProperty(RemovePropertyRequest req) returns RemovePropertyResponse|error {
        lock {
            Property? existing = properties[req.property_id];
            if existing is () {
                return {success: false, message: "Property not found.", remaining_properties: []};
            }
            if existing.host_id != req.host_id {
                return {success: false, message: "Only the owning host may remove this property.", remaining_properties: []};
            }

            _ = properties.remove(req.property_id);

            Property[] remaining = [];
            foreach Property p in properties {
                if p.host_id == req.host_id {
                    remaining.push(p.clone());
                }
            }
            return {success: true, message: "Property removed.", remaining_properties: remaining};
        }
    }
