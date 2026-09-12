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



// list_available_properties (server-side streaming)
    
    remote function ListAvailableProperties(ListPropertiesRequest req) returns stream<Property, error?>|error {
        Property[] result = [];
        lock {
            foreach Property p in properties {
                if p.status != AVAILABLE {
                    continue;
                }
                if req.location.trim() != "" && p.location != req.location {
                    continue;
                }
                if req.min_price > 0.0 && p.price_per_night < req.min_price {
                    continue;
                }
                if req.max_price > 0.0 && p.price_per_night > req.max_price {
                    continue;
                }
                result.push(p.clone());
            }
        }
        return result.toStream();
    }

    
    // search property
    
    remote function SearchProperty(SearchPropertyRequest req) returns SearchPropertyResponse|error {
        lock {
            Property? p = properties[req.property_id];
            if p is () {
                return {found: false, message: "Not Available", property: emptyProperty()};
            }
            return {found: true, message: "Property found.", property: p.clone()};
        }
    }

    
    // book property — adds a pending request to the booking cart
    
    remote function BookProperty(BookPropertyRequest req) returns BookPropertyResponse|error {
        lock {
            Property? p = properties[req.property_id];
            if p is () {
                return {success: false, message: "Property not found.", booking_request_id: ""};
            }
            if p.status != AVAILABLE {
                return {success: false, message: "Property is not available for booking.", booking_request_id: ""};
            }
        }

        int|error nights = nightsBetween(req.check_in, req.check_out);
        if nights is error {
            return {success: false, message: nights.message(), booking_request_id: ""};
        }

        string requestId = "REQ-" + uuid:createType4AsString().substring(0, 8);
        CartItem item = {
            bookingRequestId: requestId,
            guestId: req.guest_id,
            propertyId: req.property_id,
            checkIn: req.check_in,
            checkOut: req.check_out
        };

        lock {
            bookingCart[requestId] = item.clone();
        }

        return {success: true, message: "Added to booking cart. Call confirm_booking to finalize.", booking_request_id: requestId};
    }

    
    // confirm booking
    
    remote function ConfirmBooking(ConfirmBookingRequest req) returns ConfirmBookingResponse|error {
        CartItem cartItem;
        lock {
            CartItem? item = bookingCart[req.booking_request_id];
            if item is () {
                return {success: false, message: "Booking request not found or already processed.",
                        booking_id: "", nights: 0, total_cost: 0.0, property: emptyProperty()};
            }
            if item.guestId != req.guest_id {
                return {success: false, message: "This booking request does not belong to the given guest.",
                        booking_id: "", nights: 0, total_cost: 0.0, property: emptyProperty()};
            }
            cartItem = item.clone();
        }

        Property property;
        lock {
            Property? p = properties[cartItem.propertyId];
            if p is () {
                return {success: false, message: "Property no longer exists.",
                        booking_id: "", nights: 0, total_cost: 0.0, property: emptyProperty()};
            }
            property = p.clone();
        }

        // Re-verify no date overlap with already-confirmed bookings 
        lock {
            foreach ConfirmedBookingRecord existing in confirmedBookings {
                if existing.propertyId == cartItem.propertyId
                        && datesOverlap(cartItem.checkIn, cartItem.checkOut, existing.checkIn, existing.checkOut) {
                    return {success: false, message: "Property is already booked for overlapping dates.",
                            booking_id: "", nights: 0, total_cost: 0.0, property: property};
                }
            }
        }

        int|error nights = nightsBetween(cartItem.checkIn, cartItem.checkOut);
        if nights is error {
            return {success: false, message: nights.message(),
                    booking_id: "", nights: 0, total_cost: 0.0, property: property};
        }

        decimal totalCost = <decimal>nights * <decimal>property.price_per_night;
        string bookingId = "BKG-" + uuid:createType4AsString().substring(0, 8);

        ConfirmedBookingRecord confirmed = {
            bookingId: bookingId,
            guestId: cartItem.guestId,
            propertyId: cartItem.propertyId,
            checkIn: cartItem.checkIn,
            checkOut: cartItem.checkOut,
            nights: nights,
            totalCost: totalCost
        };

        lock {
            confirmedBookings[bookingId] = confirmed.clone();
            _ = bookingCart.remove(req.booking_request_id);
        }

        return {
            success: true,
            message: "Booking confirmed.",
            booking_id: bookingId,
            nights: nights,
            total_cost: <float>totalCost,
            property: property
        };
    }
}
