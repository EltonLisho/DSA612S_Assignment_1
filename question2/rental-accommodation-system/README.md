# Rental Accommodation System — gRPC (DSA612S, Assignment 1, Question 2)

A Ballerina gRPC server + command-line client for the Ministry of Tourism's
short-term rental platform. Implements all 8 required operations: adding,
updating, removing, searching, and listing properties; streaming user
registration; and a two-step book → confirm booking flow with overlap
checking and price calculation.

This README is written for group members setting up the project for the
first time from the zipped folder. Follow it top to bottom.

```
rental-accommodation-system/
├── proto/
│   └── rental.proto        # service + message contract
├── server/
│   ├── Ballerina.toml
│   └── service.bal         # business logic, in-memory state
└── client/
    ├── Ballerina.toml
    └── client.bal          # interactive CLI demonstrating every RPC
```

---

## 1. Prerequisites

- **Ballerina Swan Lake**, version 2201.8.0 or later (this project was
  built and tested on 2201.13.5). Download from
  [ballerina.io/downloads](https://ballerina.io/downloads/).
- Check your install:
  ```
  bal version
  ```
- You will run the server and client at the same time, so have two
  terminal windows/tabs ready.

---

## 2. Unzip the project

Extract the zip anywhere on your machine. You should end up with the
`rental-accommodation-system` folder shown above. Everything below assumes
your terminal's current directory is that folder unless stated otherwise.

---

## 3. Check the gRPC tool is available

```
bal grpc --help
```

If that prints usage information, skip to step 4. If it says the command
isn't recognized, pull the tool once:

```
bal tool pull grpc
```

---

## 4. Set up and run the server

**4.1 — Generate the stub code**

```
cd server
bal grpc --input ../proto/rental.proto --mode service --output .
```

This creates two new files in `server/`:

- `rental_pb.bal` — message record types (`Property`, `User`,
  `AddPropertyRequest`, ...), the `PropertyStatus` / `UserRole` enums, and
  a descriptor constant (should be named `RENTAL_DESC`).
- A template file, something like `rentalservice_service.bal` — an empty
  skeleton with all 8 remote methods stubbed out.

**4.2 — Delete the generated template**

Delete `rentalservice_service.bal` (or whatever the template file was
named). **Do not keep it alongside `service.bal`** — both declare a
`service "RentalService" on ...`, so having both is a duplicate-service
compile error. You should be left with just `rental_pb.bal` + `service.bal`
in the `server/` folder.

**4.3 — Verify one name**

Open `rental_pb.bal` and confirm there's a constant ending in `_DESC`
(expected: `RENTAL_DESC`). If yours is named differently, open
`service.bal` and change the line:

```ballerina
@grpc:Descriptor {value: RENTAL_DESC}
```

to match.

**4.4 — Build and run**

```
bal build
bal run
```

If `bal build` reports errors, see the **Troubleshooting** section below
before asking for help — a couple of common ones are already documented
there. Once it's running, the server listens on port `9090`. **Leave this
terminal open** for the rest of the session.

---

## 5. Set up and run the client

Open a **second terminal**, back at the `rental-accommodation-system`
folder.

**5.1 — Generate the stub code**

```
cd client
bal grpc --input ../proto/rental.proto --mode client --output .
```

Again this creates `rental_pb.bal` plus a template file, something like
`rentalservice_client.bal`.

**5.2 — Delete the generated template**

Delete that template file. It contains its own `public function main()`,
which would clash with the one already in `client.bal`. Keep only
`rental_pb.bal` + `client.bal`.

**5.3 — Verify the streaming client**

Open `rental_pb.bal` and look for a type called
`CreateUsersStreamingClient` with methods `sendUser`, `complete`, and
`receiveCreateUsersResponse`. If any of those names differ in your
generated file, update the matching calls inside the `createUsersFlow`
function in `client.bal`.

**5.4 — Build and run**

```
bal build
bal run
```

You should see an interactive numbered menu.

---

## 6. Test it end-to-end

With the server still running in the other terminal, work through the
client menu in this order:

| Option | What to do |
|---|---|
| `1` | Add a property — e.g. host `H1`, name `Seaside Cabin`, location `Swakopmund`, type `Cabin`, price `1200` |
| `2` | Register 2 users — one `HOST`, one `GUEST` |
| `5` | List available properties — confirm your cabin shows up |
| `7` | Book it as the guest — use the `property_id` printed in step 5, pick check-in/check-out dates |
| `8` | Confirm the booking — use the `booking_request_id` printed in step 7; you should get back a total cost |
| `6` | Search the property by ID |
| `3` / `4` | Try updating or removing the property as the host |

If every step above returns a sensible response, both the server and
client are working correctly.

---

## 7. Stopping everything

`Ctrl+C` in each terminal stops the client and then the server.

---

## 8. Troubleshooting

**`operator '>' not defined for 'float' and 'decimal'`**
Already fixed in the provided `service.bal` — if you see this, you've got
an older copy. Make sure `ListAvailableProperties` compares
`req.min_price > 0.0` / `req.max_price > 0.0` (plain float literals), not
`0.0d` (a decimal literal).

**Duplicate service / duplicate `main` function errors**
You forgot to delete the auto-generated template file (steps 4.2 / 5.2
above). Both the template and the provided `.bal` file declare the same
thing.

**`address already in use` when starting the server**
Something is already listening on port 9090 — likely a previous `bal run`
still running in another terminal. Stop it first.

**Anything else**
Copy the *exact* compiler output and share it with the group / whoever
wrote this part — the fix is almost always a one-line name mismatch
between what `bal grpc` generated on your machine and what's referenced in
`service.bal` / `client.bal`.

---

## 9. Design notes 

- **Protocol Buffer definition** — `rental.proto` defines all 8 RPCs with
  the correct invocation types: 6 simple RPCs, one client-streaming RPC
  (`CreateUsers`), and one server-streaming RPC
  (`ListAvailableProperties`).
- **State & concurrency** — the server holds four in-memory maps keyed by
  ID: `properties`, `users`, `bookingCart` (pending/unconfirmed requests),
  and `confirmedBookings`. All reads/writes to shared state go through
  `lock { ... }` blocks so concurrent client requests can't race each
  other.
- **Validation** —
  - `book_property` checks the property exists, is `AVAILABLE`, and that
    check-out is after check-in.
  - `confirm_booking` re-checks the property still exists and re-verifies
    there's no date overlap against everything already confirmed, since
    another guest could have confirmed a clashing date range after this
    one called `book_property` but before it called `confirm_booking`.
  - `update_property` / `remove_property` check that the caller's
    `host_id` actually owns the property.
- **Price calculation** — `confirm_booking` computes
  `nights × price_per_night` using `decimal` arithmetic to avoid floating
  point rounding issues, then converts to `float` for the wire response.
- **IDs** — `PROP-`, `USR-`, `REQ-`, and `BKG-` prefixed IDs generated from
  `uuid:createType4AsString()`, truncated for readability.


