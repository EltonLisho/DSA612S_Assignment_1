# DSA621S-Q1 Asset Management System

## Overview

This project is a web-based **Asset Management System** developed for the DSA621S Distributed Systems and Applications assignment.

The system allows institutions to manage assets and keep track of maintenance, work orders, loans, bookings, components, schedules, and participating institutions.

The project consists of:
- A **Ballerina REST API backend**
- A **HTML/CSS/JavaScript frontend**
- An in-memory data store for the current implementation

## Technologies Used

### Backend
- Ballerina Swan Lake
- Ballerina version: **2201.13.5 (Swan Lake Update 13)**
- REST API
- HTTP listener on port **9090**

### Frontend
- HTML5
- CSS3
- JavaScript
- Fetch API
- Live Server

## Project Structure

```text
DSA621S-Q1/
├── README.md
├── backend/
│   ├── .devcontainer.json
│   ├── .gitignore
│   ├── Ballerina.toml
│   ├── Dependencies.toml
│   ├── data.bal
│   ├── data.json
│   ├── main.bal
│   ├── models.bal
│   └── service.bal
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Main Features

### Asset Management
- View, add, edit, and delete assets
- Search and filter assets
- Filter by institution and site
- Track asset status and acquisition dates

Asset statuses:
- `AVAILABLE`
- `LOANED_OUT`
- `OCCUPIED`
- `UNDER_MAINTENANCE`
- `DISPOSED`

### Components
- View components
- Add components
- Delete components

### Maintenance and Schedules
- View, add, update, and delete schedules
- Support maintenance, servicing, and booking schedule types
- Identify maintenance that is due

### Work Orders
- View, create, update, and delete work orders
- Track work order status

Work order statuses:
- `OPEN`
- `IN_PROGRESS`
- `CLOSED`

### Tasks
- View, add, update, and delete tasks
- Mark tasks as completed

### Loans
- Create and view loans
- Return loans
- Track loan status
- Automatically update asset status when an asset is loaned or returned

### Bookings
- Create and view bookings
- Cancel bookings
- Track booking status
- Validate booking conflicts through the backend
- Set an asset to `OCCUPIED` when booked

### Institutions
- View institutions
- Add institutions
- Delete institutions
- Search institutions
- Display the number of assets associated with an institution

Each institution contains:
- Institution ID
- Name
- Description

## Backend API

The Ballerina backend runs on:

```text
http://localhost:9090
```

Main endpoints include:

```text
http://localhost:9090/assets
http://localhost:9090/institutions
```

The backend provides REST endpoints for:
- Assets
- Components
- Schedules
- Work orders
- Tasks
- Institutions
- Loans
- Bookings

## Running the Backend

### Requirements

Install:
- Ballerina Swan Lake **2201.13.5**
- VS Code
- Ballerina VS Code extension

Check the Ballerina version:

```powershell
bal version
```

Build the project:

```powershell
cd C:\Users\<username>\DSA621S-Q1\backend
bal build
```

Run the backend:

```powershell
bal run
```

The API will be available at:

```text
http://localhost:9090
```

## Running the Frontend

The frontend can be run using the **Live Server** extension in VS Code.

1. Open the `frontend` folder in VS Code.
2. Open `index.html`.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

The dashboard will normally open at:

```text
http://127.0.0.1:5500
```

## Backend and Frontend Communication

The frontend uses the JavaScript Fetch API to communicate with the Ballerina REST API.

Example:

```javascript
fetch("http://localhost:9090/assets")
```

CORS is configured to allow the frontend to communicate from:

```text
http://127.0.0.1:5500
http://localhost:5500
```

## Recommended Startup Order

### 1. Start the backend

```powershell
cd backend
bal run
```

### 2. Start the frontend

Open `frontend/index.html` using Live Server.

### 3. Open the dashboard

```text
http://127.0.0.1:5500
```

## Testing

Recommended dashboard tests include:
- Add, view, edit, and delete assets
- Add and remove components
- Create, update, and delete schedules
- Create, update, and delete work orders
- Create, complete, and delete tasks
- Create and return loans
- Create and cancel bookings
- Add and delete institutions
- Search and filter assets and institutions

## Important Note

### In-Memory Data

The current backend uses in-memory data structures rather than a permanent database.

Therefore, data created while the backend is running may be lost when the Ballerina backend is stopped or restarted.

## Project Status

The system provides a functional web dashboard connected to a Ballerina REST backend.

Main modules:

```text
Asset Management
      │
      ├── Components
      ├── Maintenance / Schedules
      ├── Work Orders
      │     └── Tasks
      ├── Loans
      ├── Bookings
      └── Institutions
```

