"use strict";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const API_BASE_URL = "http://localhost:9090";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

let assets = [];

let editingAssetTag = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("AssetHub JavaScript loaded.");

    setupNavigation();

    setupAssetForm();

    setupSearchAndFilters();

    setupScheduleForm();

    setupWorkOrderForms();

    setupBookingForm();

    setupLoanForm();

    setupInstitutionForm();
    



    loadAssets();

    

   

});


function setupInstitutionForm() {

    const form =
        document.getElementById(
            "institutionForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        saveInstitution
    );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(".nav-item");


    console.log(
        "Navigation buttons found:",
        navItems.length
    );


    navItems.forEach(function (item) {

        item.addEventListener("click", function () {

            const sectionName =
                this.dataset.section;


            console.log(
                "Navigation clicked:",
                sectionName
            );


            showSection(sectionName);


            /*
             * Remove active class from every
             * navigation button.
             */

            navItems.forEach(function (nav) {

                nav.classList.remove("active");

            });


            /*
             * Activate clicked button.
             */

            this.classList.add("active");

        });

    });

}


/* =========================================================
   SHOW SECTION
   ========================================================= */

function showSection(sectionName) {

    console.log(
        "Showing section:",
        sectionName
    );


    /*
     * Find every page section.
     */

    const sections =
        document.querySelectorAll(".page-section");


    /*
     * Hide every section.
     */

    sections.forEach(function (section) {

        section.classList.remove("active");

    });


    /*
     * Build the correct section ID.
     *
     * Example:
     *
     * assets
     * becomes
     * assets-section
     */

    const targetId =
        `${sectionName}-section`;


    const target =
        document.getElementById(targetId);


    if (!target) {

        console.error(
            "Section not found:",
            targetId
        );

        return;

    }


    /*
     * Show selected section.
     */

    target.classList.add("active");
    if (sectionName === "maintenance") {

    loadMaintenance();

}


if (sectionName === "loans") {
    loadLoans();
}


    if (sectionName === "bookings") {
    loadBookings();
}


if (sectionName === "institutions") {
    loadInstitutions();
}

 

    /*
     * Update page heading.
     */

    const titles = {

        dashboard: "Dashboard",

        assets: "Assets",

        maintenance: "Maintenance",

        loans: "Loans",

        bookings: "Bookings",

        institutions: "Institutions"

    };


    const subtitles = {

        dashboard:
            "Overview of your asset management system",

        assets:
            "Manage all registered assets",

        maintenance:
            "Monitor asset maintenance and work orders",

        loans:
            "Manage assets that have been loaned out",

        bookings:
            "Manage asset bookings and reservations",

        institutions:
            "Manage participating institutions"

    };


    const pageTitle =
        document.getElementById("page-title");


    const pageSubtitle =
        document.getElementById("page-subtitle");


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] || "Dashboard";

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            subtitles[sectionName] || "";

    }

}


/*
 * Make showSection available to buttons
 * using onclick="showSection(...)"
 */

window.showSection = showSection;


/* =========================================================
   LOAD ASSETS
   ========================================================= */

async function loadAssets() {

    console.log(
        "Loading assets from backend..."
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        assets =
            await response.json();


        console.log(
            "Assets loaded:",
            assets
        );


        renderAssets();

        renderDashboardAssets();

        updateDashboardStats();


    } catch (error) {

        console.error(
            "Failed to load assets:",
            error
        );


        const tableBody =
            document.getElementById(
                "assets-table"
            );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="empty-state">

                        Unable to connect to backend.

                    </td>

                </tr>

            `;

        }


        const dashboardTable =
            document.getElementById(
                "dashboard-assets-table"
            );


        if (dashboardTable) {

            dashboardTable.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-state">

                        Backend unavailable.

                    </td>

                </tr>

            `;

        }


        showNotification(
            "Unable to connect to the Ballerina backend.",
            "error"
        );

    }

}


/* =========================================================
   RENDER ASSETS TABLE
   ========================================================= */

function renderAssets(
    filteredAssets = assets
) {

    const tableBody =
        document.getElementById(
            "assets-table"
        );


    if (!tableBody) {

        console.error(
            "assets-table was not found."
        );

        return;

    }


    tableBody.innerHTML = "";


    if (filteredAssets.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-state">

                    No assets found.

                </td>

            </tr>

        `;

        return;

    }


    filteredAssets.forEach(function (asset) {

        const row =
            document.createElement("tr");


        const componentCount =
            Array.isArray(asset.components)
                ? asset.components.length
                : 0;


        row.innerHTML = `

            <td>
                ${escapeHtml(asset.assetTag)}
            </td>

            <td>
                ${escapeHtml(asset.name)}
            </td>

            <td>
                ${escapeHtml(asset.institution)}
            </td>

            <td>
                ${escapeHtml(asset.site)}
            </td>

            <td>

                <span
                    class="status-badge ${getStatusClass(asset.status)}">

                    ${escapeHtml(asset.status)}

                </span>

            </td>

            <td>
                ${escapeHtml(asset.dateAcquired || "")}
            </td>

            <td>
                ${componentCount}
            </td>

            <td>

                <div class="action-buttons">

                    <button
                        type="button"
                        class="btn btn-small btn-edit"
                        onclick="editAsset('${escapeJs(asset.assetTag)}')">

                        Edit

                    </button>


                    <button
                        type="button"
                        class="btn btn-small btn-danger"
                        onclick="deleteAsset('${escapeJs(asset.assetTag)}')">

                        Delete

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


/* =========================================================
   DASHBOARD ASSETS
   ========================================================= */

function renderDashboardAssets() {

    const tableBody =
        document.getElementById(
            "dashboard-assets-table"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    /*
     * Display the first five assets.
     */

    const recentAssets =
        assets.slice(0, 5);


    if (recentAssets.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-state">

                    No assets registered yet.

                </td>

            </tr>

        `;

        return;

    }


    recentAssets.forEach(function (asset) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(asset.assetTag)}
            </td>

            <td>
                ${escapeHtml(asset.name)}
            </td>

            <td>
                ${escapeHtml(asset.institution)}
            </td>

            <td>
                ${escapeHtml(asset.site)}
            </td>

            <td>

                <span
                    class="status-badge ${getStatusClass(asset.status)}">

                    ${escapeHtml(asset.status)}

                </span>

            </td>

        `;


        tableBody.appendChild(row);

    });

}


/* =========================================================
   DASHBOARD STATISTICS
   ========================================================= */

function updateDashboardStats() {

    const total =
        assets.length;


    const available =
        assets.filter(function (asset) {

            return asset.status === "AVAILABLE";

        }).length;


    const loaned =
        assets.filter(function (asset) {

            return asset.status === "LOANED_OUT";

        }).length;


    const maintenance =
        assets.filter(function (asset) {

            return asset.status ===
                "UNDER_MAINTENANCE";

        }).length;


    setElementText(
        "total-assets",
        total
    );


    setElementText(
        "available-assets",
        available
    );


    setElementText(
        "loaned-assets",
        loaned
    );


    setElementText(
        "maintenance-assets",
        maintenance
    );

}


/* =========================================================
   ASSET FORM
   ========================================================= */

function setupAssetForm() {

    const form =
        document.getElementById(
            "asset-form"
        );


    if (!form) {

        console.error(
            "asset-form was not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        saveAsset
    );

}


/* =========================================================
   SAVE ASSET
   ========================================================= */

async function saveAsset(event) {

    event.preventDefault();


    const assetTag =
        document.getElementById(
            "assetTag"
        ).value.trim();


    const name =
        document.getElementById(
            "assetName"
        ).value.trim();


    const institution =
        document.getElementById(
            "institution"
        ).value.trim();


    const site =
        document.getElementById(
            "site"
        ).value.trim();


    const status =
        document.getElementById(
            "assetStatus"
        ).value;


    const dateAcquired =
        document.getElementById(
            "dateAcquired"
        ).value;


    const description =
        document.getElementById(
            "description"
        ).value.trim();


    if (
        !assetTag ||
        !name ||
        !institution ||
        !site ||
        !status ||
        !dateAcquired ||
        !description
    ) {

        showFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    const asset = {

        assetTag: assetTag,

        name: name,

        description: description,

        institution: institution,

        site: site,

        status: status,

        dateAcquired: dateAcquired

    };


    try {

        let response;


        /*
         * EDIT
         */

        if (editingAssetTag) {

            response =
                await fetch(
                    `${API_BASE_URL}/assets/${encodeURIComponent(editingAssetTag)}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(asset)

                    }
                );

        }


        /*
         * CREATE
         */

        else {

            response =
                await fetch(
                    `${API_BASE_URL}/assets`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(asset)

                    }
                );

        }


        if (!response.ok) {

            if (response.status === 409) {

                throw new Error(
                    "An asset with this asset tag already exists."
                );

            }


            if (response.status === 400) {

                throw new Error(
                    "Invalid asset data."
                );

            }


            throw new Error(
                `Request failed with HTTP ${response.status}`
            );

        }


        showNotification(

            editingAssetTag
                ? "Asset updated successfully."
                : "Asset added successfully.",

            "success"

        );


        closeAssetModal();


        await loadAssets();


    } catch (error) {

        console.error(
            "Save asset failed:",
            error
        );


        showFormMessage(
            error.message ||
            "Failed to save asset.",
            "error"
        );

    }

}


/* =========================================================
   OPEN ASSET MODAL
   ========================================================= */

function openAssetModal(asset = null) {
    const modal = document.getElementById("asset-modal");
    const form = document.getElementById("asset-form");
    const title = document.getElementById("asset-modal-title");

    if (!modal || !form) {
        console.error("Asset modal or form not found.");
        return;
    }

    editingAssetTag = null;

    form.reset();

    if (asset) {
        editingAssetTag = asset.assetTag;

        if (title) {
            title.textContent = "Edit Asset";
        }

        document.getElementById("assetTag").value = asset.assetTag || "";
        document.getElementById("assetName").value = asset.name || "";
        document.getElementById("institution").value = asset.institution || "";
        document.getElementById("site").value = asset.site || "";
        document.getElementById("assetStatus").value = asset.status || "AVAILABLE";
        document.getElementById("dateAcquired").value = asset.dateAcquired || "";
        document.getElementById("description").value = asset.description || "";

        document.getElementById("assetTag").disabled = true;
    } else {
        if (title) {
            title.textContent = "Add New Asset";
        }

        document.getElementById("assetTag").disabled = false;
        document.getElementById("assetStatus").value = "AVAILABLE";
    }

    modal.classList.add("active");
}

function closeAssetModal() {
    const modal = document.getElementById("asset-modal");

    if (modal) {
        modal.classList.remove("active");
    }

    editingAssetTag = null;

    const form = document.getElementById("asset-form");

    if (form) {
        form.reset();
    }

    const assetTag = document.getElementById("assetTag");

    if (assetTag) {
        assetTag.disabled = false;
    }
}


/*
 * Keep the old function name available too.
 */

window.openAssetModal =
    openAssetModal;

window.openAddAssetModal =
    openAssetModal;


/* =========================================================
   EDIT ASSET
   ========================================================= */

function editAsset(assetTag) {

    const asset =
        assets.find(function (item) {

            return item.assetTag === assetTag;

        });


    if (!asset) {

        showNotification(
            "Asset could not be found.",
            "error"
        );

        return;

    }


    const modal =
        document.getElementById(
            "asset-modal"
        );


    if (!modal) {

        return;

    }


    editingAssetTag =
        assetTag;


    document.getElementById(
        "assetTag"
    ).value =
        asset.assetTag || "";


    document.getElementById(
        "assetName"
    ).value =
        asset.name || "";


    document.getElementById(
        "institution"
    ).value =
        asset.institution || "";


    document.getElementById(
        "site"
    ).value =
        asset.site || "";


    document.getElementById(
        "assetStatus"
    ).value =
        asset.status || "AVAILABLE";


    document.getElementById(
        "dateAcquired"
    ).value =
        asset.dateAcquired || "";


    document.getElementById(
        "description"
    ).value =
        asset.description || "";


    /*
     * Prevent changing the asset tag
     * while editing.
     */

    document.getElementById(
        "assetTag"
    ).readOnly = true;


    document.getElementById(
        "asset-modal-title"
    ).textContent =
        "Edit Asset";


    const subtitle = document.getElementById("asset-modal-subtitle");

if (subtitle) {
    subtitle.textContent = "Update asset information";
}

    clearFormMessage();


    modal.classList.add("active");

}


window.editAsset =
    editAsset;


/* =========================================================
   DELETE ASSET
   ========================================================= */

async function deleteAsset(assetTag) {

    const asset =
        assets.find(function (item) {

            return item.assetTag === assetTag;

        });


    const assetName =
        asset
            ? asset.name
            : assetTag;


    const confirmed =
        confirm(
            `Are you sure you want to delete "${assetName}" (${assetTag})?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            if (response.status === 404) {

                throw new Error(
                    "Asset was not found."
                );

            }


            throw new Error(
                `Delete failed with HTTP ${response.status}`
            );

        }


        showNotification(
            "Asset deleted successfully.",
            "success"
        );


        await loadAssets();


    } catch (error) {

        console.error(
            "Delete asset failed:",
            error
        );


        showNotification(
            error.message ||
            "Failed to delete asset.",
            "error"
        );

    }

}


window.deleteAsset =
    deleteAsset;


/* =========================================================
   CLOSE ASSET MODAL
   ========================================================= */

function closeAssetModal() {

    const modal =
        document.getElementById(
            "asset-modal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove("active");


    editingAssetTag = null;


    const form =
        document.getElementById(
            "asset-form"
        );


    if (form) {

        form.reset();

    }


    const assetTag =
        document.getElementById(
            "assetTag"
        );


    if (assetTag) {

        assetTag.readOnly = false;

    }


    clearFormMessage();

}


window.closeAssetModal =
    closeAssetModal;


/* =========================================================
   SEARCH AND FILTER
   ========================================================= */

function setupSearchAndFilters() {

    const searchInput =
        document.getElementById(
            "asset-search"
        );


    const statusFilter =
        document.getElementById(
            "status-filter"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            filterAssets
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            filterAssets
        );

    }

}


/* =========================================================
   FILTER ASSETS
   ========================================================= */

function filterAssets() {

    const searchInput =
        document.getElementById(
            "asset-search"
        );


    const statusFilter =
        document.getElementById(
            "status-filter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "";


    const filteredAssets =
        assets.filter(function (asset) {


            const assetTag =
                (asset.assetTag || "")
                    .toLowerCase();


            const name =
                (asset.name || "")
                    .toLowerCase();


            const institution =
                (asset.institution || "")
                    .toLowerCase();


            const site =
                (asset.site || "")
                    .toLowerCase();


            const matchesSearch =
                !searchTerm ||

                assetTag.includes(searchTerm) ||

                name.includes(searchTerm) ||

                institution.includes(searchTerm) ||

                site.includes(searchTerm);


            const matchesStatus =
                !status ||
                asset.status === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderAssets(filteredAssets);

}


window.filterAssets =
    filterAssets;


/* =========================================================
   STATUS CLASS
   ========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "AVAILABLE":

            return "status-available";


        case "LOANED_OUT":

            return "status-loaned";


        case "OCCUPIED":

            return "status-occupied";


        case "UNDER_MAINTENANCE":

            return "status-maintenance";


        case "DISPOSED":

            return "status-disposed";


        default:

            return "";

    }

}


/* =========================================================
   FORM MESSAGE
   ========================================================= */

function showFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "form-message"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


function clearFormMessage() {

    const element =
        document.getElementById(
            "form-message"
        );


    if (!element) {

        return;

    }


    element.textContent = "";

    element.className =
        "form-message";

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showNotification(
    message,
    type = "success"
) {

    let notification =
        document.getElementById(
            "notification"
        );


    if (!notification) {

        notification =
            document.createElement("div");


        notification.id =
            "notification";


        document.body.appendChild(
            notification
        );

    }


    notification.textContent =
        message;


    notification.className =
        `notification ${type}`;


    notification.classList.add(
        "show"
    );


    setTimeout(function () {

        notification.classList.remove(
            "show"
        );

    }, 3500);

}



/* =========================================================
   SCHEDULE FORM SETUP
   ========================================================= */

function setupScheduleForm() {

    const form =
        document.getElementById("schedule-form");


    if (!form) {

        console.warn(
            "Schedule form not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        saveSchedule
    );

}


/* =========================================================
   UTILITY
   ========================================================= */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   JAVASCRIPT STRING ESCAPING
   ========================================================= */

function escapeJs(value) {

    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        );

}



/* =========================================================
   SCHEDULE MANAGEMENT
   ========================================================= */

let editingSchedule = null;


/* =========================================================
   LOAD MAINTENANCE
   ========================================================= */

async function loadMaintenance() {

    console.log("Loading maintenance information...");

    const schedulesTable =
        document.getElementById("schedules-table");

    const workordersTable =
        document.getElementById("workorders-table");

    if (!schedulesTable || !workordersTable) {
        return;
    }


    let totalMaintenanceAssets = 0;
    let overdueSchedules = 0;
    let openWorkOrders = 0;
    let totalSchedules = 0;


    const scheduleRows = [];
    const workOrderRows = [];


    const today =
        new Date().toISOString().split("T")[0];


    assets.forEach(function (asset) {

        const schedules =
            Array.isArray(asset.schedules)
                ? asset.schedules
                : [];


        const workOrders =
            Array.isArray(asset.workOrders)
                ? asset.workOrders
                : [];


        if (
            asset.status === "UNDER_MAINTENANCE" ||
            schedules.length > 0 ||
            workOrders.length > 0
        ) {

            totalMaintenanceAssets++;

        }


        /* =============================================
           SCHEDULES
           ============================================= */

        schedules.forEach(function (schedule) {

            totalSchedules++;


            const isOverdue =
                schedule.scheduleType === "MAINTENANCE" &&
                schedule.dueDate < today;


            if (isOverdue) {
                overdueSchedules++;
            }


            let scheduleStatus =
                "Upcoming";

            let statusClass =
                "status-available";


            if (schedule.dueDate < today) {

                scheduleStatus =
                    "Overdue";

                statusClass =
                    "status-maintenance";

            }


            scheduleRows.push(`
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(asset.assetTag)}
                        </strong>
                        <br>
                        <small>
                            ${escapeHtml(asset.name)}
                        </small>
                    </td>

                    <td>
                        ${escapeHtml(schedule.scheduleId)}
                    </td>

                    <td>
                        ${escapeHtml(schedule.scheduleType)}
                    </td>

                    <td>
                        ${escapeHtml(schedule.dueDate)}
                    </td>

                    <td>
                        ${escapeHtml(schedule.description)}
                    </td>

                    <td>
                        <span class="${statusClass}">
                            ${scheduleStatus}
                        </span>
                    </td>

                    <td>

                        <button
                            type="button"
                            class="btn btn-secondary btn-sm"
                            onclick="editSchedule(
                                '${escapeJs(asset.assetTag)}',
                                '${escapeJs(schedule.scheduleId)}'
                            )">

                            Edit

                        </button>


                        <button
                            type="button"
                            class="btn btn-danger btn-sm"
                            onclick="deleteSchedule(
                                '${escapeJs(asset.assetTag)}',
                                '${escapeJs(schedule.scheduleId)}'
                            )">

                            Delete

                        </button>

                    </td>

                </tr>
            `);

        });


        /* =============================================
           WORK ORDERS
           ============================================= */

        workOrders.forEach(function (workOrder) {

            if (
                workOrder.status === "OPEN"
            ) {

                openWorkOrders++;

            }


            const tasks =
                Array.isArray(workOrder.tasks)
                    ? workOrder.tasks
                    : [];


            workOrderRows.push(`
                <tr>

                    <td>
                        ${escapeHtml(asset.assetTag)}
                    </td>

                    <td>
                        ${escapeHtml(workOrder.orderId)}
                    </td>

                    <td>
                        ${escapeHtml(workOrder.status)}
                    </td>

                    <td>
                        ${escapeHtml(workOrder.description)}
                    </td>

                    <td>
                        ${tasks.length}
                    </td>

                </tr>
            `);

        });

    });


    /* =============================================
       SUMMARY
       ============================================= */

    setElementText(
        "maintenance-total",
        totalMaintenanceAssets
    );


    setElementText(
        "maintenance-overdue",
        overdueSchedules
    );


    setElementText(
        "open-workorders",
        openWorkOrders
    );


    setElementText(
        "scheduled-maintenance",
        totalSchedules
    );


    /* =============================================
       SCHEDULE TABLE
       ============================================= */

    if (scheduleRows.length === 0) {

        schedulesTable.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table">
                    No maintenance schedules found.
                </td>
            </tr>
        `;

    } else {

        schedulesTable.innerHTML =
            scheduleRows.join("");

    }


    /* =============================================
       WORK ORDER TABLE
       ============================================= */

    if (workOrderRows.length === 0) {

        workordersTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table">
                    No work orders found.
                </td>
            </tr>
        `;

    } else {

        workordersTable.innerHTML =
            workOrderRows.join("");

    }

}


/* =========================================================
   OPEN ADD SCHEDULE MODAL
   ========================================================= */

function openScheduleModal() {

    const modal =
        document.getElementById("schedule-modal");

    const form =
        document.getElementById("schedule-form");

    const title =
        document.getElementById("schedule-modal-title");


    if (!modal || !form) {
        return;
    }


    editingSchedule = null;

    form.reset();


    title.textContent =
        "Add Maintenance Schedule";


    populateScheduleAssets();


    clearScheduleFormMessage();


    modal.classList.add("active");

}


/* =========================================================
   POPULATE ASSET SELECT
   ========================================================= */

function populateScheduleAssets() {

    const select =
        document.getElementById("scheduleAsset");


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select an asset
        </option>
    `;


    assets.forEach(function (asset) {

        const option =
            document.createElement("option");


        option.value =
            asset.assetTag;


        option.textContent =
            `${asset.assetTag} - ${asset.name}`;


        select.appendChild(option);

    });

}


/* =========================================================
   EDIT SCHEDULE
   ========================================================= */

function editSchedule(
    assetTag,
    scheduleId
) {

    const asset =
        assets.find(function (item) {

            return item.assetTag === assetTag;

        });


    if (!asset) {

        showNotification(
            "Asset not found.",
            "error"
        );

        return;

    }


    const schedules =
        Array.isArray(asset.schedules)
            ? asset.schedules
            : [];


    const schedule =
        schedules.find(function (item) {

            return item.scheduleId === scheduleId;

        });


    if (!schedule) {

        showNotification(
            "Schedule not found.",
            "error"
        );

        return;

    }


    const modal =
        document.getElementById("schedule-modal");


    document.getElementById(
        "schedule-modal-title"
    ).textContent =
        "Edit Maintenance Schedule";


    populateScheduleAssets();


    document.getElementById(
        "scheduleAsset"
    ).value =
        assetTag;


    document.getElementById(
        "scheduleId"
    ).value =
        schedule.scheduleId;


    document.getElementById(
        "scheduleType"
    ).value =
        schedule.scheduleType;


    document.getElementById(
        "scheduleDueDate"
    ).value =
        schedule.dueDate;


    document.getElementById(
        "scheduleDescription"
    ).value =
        schedule.description;


    editingSchedule = {
        assetTag: assetTag,
        scheduleId: scheduleId
    };


    clearScheduleFormMessage();


    modal.classList.add("active");

}


/* =========================================================
   SAVE SCHEDULE
   ========================================================= */

async function saveSchedule(event) {

    event.preventDefault();


    const assetTag =
        document.getElementById(
            "scheduleAsset"
        ).value;


    const scheduleId =
        document.getElementById(
            "scheduleId"
        ).value.trim();


    const scheduleType =
        document.getElementById(
            "scheduleType"
        ).value;


    const dueDate =
        document.getElementById(
            "scheduleDueDate"
        ).value;


    const description =
        document.getElementById(
            "scheduleDescription"
        ).value.trim();


    if (
        !assetTag ||
        !scheduleId ||
        !scheduleType ||
        !dueDate ||
        !description
    ) {

        showScheduleFormMessage(
            "Please complete all schedule fields.",
            "error"
        );

        return;

    }


    const schedule = {

        scheduleId: scheduleId,

        scheduleType: scheduleType,

        dueDate: dueDate,

        description: description

    };


    try {

        let response;


        /* =========================================
           EDIT
           ========================================= */

        if (editingSchedule) {

            response =
                await fetch(
                    `${API_BASE_URL}/assets/${encodeURIComponent(
                        editingSchedule.assetTag
                    )}/schedules/${encodeURIComponent(
                        editingSchedule.scheduleId
                    )}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(schedule)
                    }
                );

        }


        /* =========================================
           CREATE
           ========================================= */

        else {

            response =
                await fetch(
                    `${API_BASE_URL}/assets/${encodeURIComponent(
                        assetTag
                    )}/schedules`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(schedule)
                    }
                );

        }



if (!response.ok) {

    let errorMessage =
        `HTTP ${response.status}`;

    try {

        const responseText =
            await response.text();

        console.error(
            "Backend schedule error:",
            responseText
        );

        if (responseText) {
            errorMessage +=
                `: ${responseText}`;
        }

    } catch (error) {

        console.error(
            "Could not read backend error:",
            error
        );

    }


    if (response.status === 404) {

        errorMessage =
            "Asset or schedule was not found.";

    }


    if (response.status === 409) {

        errorMessage =
            "A schedule with this ID already exists.";

    }


    throw new Error(errorMessage);

}


        closeScheduleModal();


        await loadAssets();


        loadMaintenance();


        showNotification(
            editingSchedule
                ? "Schedule updated successfully."
                : "Schedule added successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save schedule error:",
            error
        );


        showScheduleFormMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   DELETE SCHEDULE
   ========================================================= */

async function deleteSchedule(
    assetTag,
    scheduleId
) {

    const confirmed =
        confirm(
            `Delete schedule ${scheduleId} from asset ${assetTag}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(
                    assetTag
                )}/schedules/${encodeURIComponent(
                    scheduleId
                )}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            if (response.status === 404) {

                throw new Error(
                    "Schedule or asset was not found."
                );

            }


            throw new Error(
                `HTTP ${response.status}`
            );

        }


        await loadAssets();


        loadMaintenance();


        showNotification(
            "Schedule deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete schedule error:",
            error
        );


        showNotification(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   CLOSE SCHEDULE MODAL
   ========================================================= */

function closeScheduleModal() {

    const modal =
        document.getElementById("schedule-modal");


    if (modal) {

        modal.classList.remove("active");

    }


    editingSchedule = null;

    clearScheduleFormMessage();

}


/* =========================================================
   SCHEDULE FORM MESSAGE
   ========================================================= */

function showScheduleFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "schedule-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


function clearScheduleFormMessage() {

    const element =
        document.getElementById(
            "schedule-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "form-message";

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.loadAssets =
    loadAssets;

window.showSection =
    showSection;

window.openAssetModal =
    openAssetModal;

window.openAddAssetModal =
    openAssetModal;

    window.openAddAssetModal = () => openAssetModal();

window.editAsset =
    editAsset;

window.deleteAsset =
    deleteAsset;

window.closeAssetModal =
    closeAssetModal;

window.filterAssets =
    filterAssets;


console.log(
    "AssetHub JavaScript initialization complete."
);






/* =========================================================
   VIEW MAINTENANCE ASSET
   ========================================================= */

function viewMaintenanceAsset(assetTag) {

    console.log(
        "Viewing maintenance asset:",
        assetTag
    );


    const asset =
        assets.find(function (item) {

            return item.assetTag === assetTag;

        });


    if (!asset) {

        showNotification(
            "Asset not found.",
            "error"
        );

        return;
    }


    /*
     * Switch to Assets page.
     */
    showSection("assets");


    /*
     * Highlight the selected asset
     * by putting its tag into the search box.
     */
    const search =
        document.getElementById(
            "asset-search"
        );


    if (search) {

        search.value =
            asset.assetTag;

        filterAssets();

    }

}



/* =========================================================
   WORK ORDER MANAGEMENT
   ========================================================= */

let editingWorkOrder = null;

let expandedWorkOrder = null;


/* =========================================================
   OPEN ADD WORK ORDER MODAL
   ========================================================= */

function openWorkOrderModal() {

    const modal =
        document.getElementById("workorder-modal");

    const form =
        document.getElementById("workorder-form");

    const title =
        document.getElementById(
            "workorder-modal-title"
        );


    if (!modal || !form) {
        console.error(
            "Work order modal or form not found."
        );

        return;
    }


    editingWorkOrder = null;

    form.reset();


    title.textContent =
        "Add Work Order";


    populateWorkOrderAssets();


    document.getElementById(
        "workorder-status"
    ).value = "OPEN";


    clearWorkOrderFormMessage();


    modal.classList.add("active");
}


/* =========================================================
   POPULATE ASSET SELECT
   ========================================================= */

function populateWorkOrderAssets() {

    const select =
        document.getElementById(
            "workorder-asset"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Select an asset
        </option>
    `;


    assets.forEach(function (asset) {

        const option =
            document.createElement("option");


        option.value =
            asset.assetTag;


        option.textContent =
            `${asset.assetTag} - ${asset.name}`;


        select.appendChild(option);

    });
}


/* =========================================================
   SAVE WORK ORDER
   ========================================================= */

async function saveWorkOrder(event) {

    event.preventDefault();


    const assetTag =
        document.getElementById(
            "workorder-asset"
        ).value;


    const orderId =
        document.getElementById(
            "workorder-id"
        ).value.trim();


    const status =
        document.getElementById(
            "workorder-status"
        ).value;


    const description =
        document.getElementById(
            "workorder-description"
        ).value.trim();


    if (
        !assetTag ||
        !orderId ||
        !status ||
        !description
    ) {

        showWorkOrderFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;
    }


    const workOrder = {

        orderId: orderId,

        status: status,

        description: description,

        tasks:
            editingWorkOrder &&
            Array.isArray(
                editingWorkOrder.tasks
            )
                ? editingWorkOrder.tasks
                : []

    };


    try {

        let response;


        /* =============================================
           EDIT
           ============================================= */

        if (editingWorkOrder) {

            response =
                await fetch(
                    `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}/workorders/${encodeURIComponent(editingWorkOrder.orderId)}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                workOrder
                            )

                    }
                );

        }


        /* =============================================
           CREATE
           ============================================= */

        else {

            response =
                await fetch(
                    `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}/workorders`,
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                workOrder
                            )

                    }
                );

        }


        if (!response.ok) {

            let errorMessage =
                `HTTP ${response.status}`;


            try {

                const text =
                    await response.text();


                if (text) {

                    errorMessage +=
                        `: ${text}`;

                }

            } catch (_) {}


            throw new Error(
                errorMessage
            );
        }


        showNotification(

            editingWorkOrder

                ? "Work order updated successfully."

                : "Work order created successfully.",

            "success"

        );


        closeWorkOrderModal();


        await loadAssets();


        refreshWorkOrderDisplay();

    }


    catch (error) {

        console.error(
            "Save work order failed:",
            error
        );


        showWorkOrderFormMessage(

            error.message ||
            "Failed to save work order.",

            "error"

        );

    }

}


/* =========================================================
   EDIT WORK ORDER
   ========================================================= */

function editWorkOrder(
    assetTag,
    orderId
) {

    const asset =
        assets.find(function (item) {

            return item.assetTag === assetTag;

        });


    if (!asset) {

        showNotification(
            "Asset not found.",
            "error"
        );

        return;
    }


    const workOrder =
        Array.isArray(asset.workOrders)

            ? asset.workOrders.find(
                function (item) {

                    return (
                        item.orderId ===
                        orderId
                    );

                }
            )

            : null;


    if (!workOrder) {

        showNotification(
            "Work order not found.",
            "error"
        );

        return;
    }


    editingWorkOrder = {

        ...workOrder,

        tasks:
            Array.isArray(workOrder.tasks)

                ? [...workOrder.tasks]

                : []

    };


    const modal =
        document.getElementById(
            "workorder-modal"
        );


    document.getElementById(
        "workorder-modal-title"
    ).textContent =
        "Edit Work Order";


    populateWorkOrderAssets();


    document.getElementById(
        "workorder-asset"
    ).value =
        assetTag;


    document.getElementById(
        "workorder-asset"
    ).disabled = true;


    document.getElementById(
        "workorder-id"
    ).value =
        workOrder.orderId;


    document.getElementById(
        "workorder-id"
    ).readOnly = true;


    document.getElementById(
        "workorder-status"
    ).value =
        workOrder.status;


    document.getElementById(
        "workorder-description"
    ).value =
        workOrder.description || "";


    clearWorkOrderFormMessage();


    modal.classList.add("active");
}


/* =========================================================
   DELETE WORK ORDER
   ========================================================= */

async function deleteWorkOrder(
    assetTag,
    orderId
) {

    const confirmed =
        confirm(
            `Are you sure you want to delete work order "${orderId}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}/workorders/${encodeURIComponent(orderId)}`,
                {

                    method: "DELETE"

                }
            );


        if (!response.ok) {

            let message =
                `HTTP ${response.status}`;


            try {

                const text =
                    await response.text();


                if (text) {
                    message += `: ${text}`;
                }

            } catch (_) {}


            throw new Error(message);
        }


        showNotification(
            "Work order deleted successfully.",
            "success"
        );


        if (
            expandedWorkOrder &&
            expandedWorkOrder.assetTag === assetTag &&
            expandedWorkOrder.orderId === orderId
        ) {

            expandedWorkOrder = null;

        }


        await loadAssets();


        refreshWorkOrderDisplay();

    }


    catch (error) {

        console.error(
            "Delete work order failed:",
            error
        );


        showNotification(

            error.message ||
            "Failed to delete work order.",

            "error"

        );

    }

}


/* =========================================================
   CLOSE WORK ORDER MODAL
   ========================================================= */

function closeWorkOrderModal() {

    const modal =
        document.getElementById(
            "workorder-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    editingWorkOrder = null;


    const form =
        document.getElementById(
            "workorder-form"
        );


    if (form) {

        form.reset();

    }


    const assetSelect =
        document.getElementById(
            "workorder-asset"
        );


    if (assetSelect) {

        assetSelect.disabled = false;

    }


    const orderId =
        document.getElementById(
            "workorder-id"
        );


    if (orderId) {

        orderId.readOnly = false;

    }


    clearWorkOrderFormMessage();
}


/* =========================================================
   REFRESH WORK ORDER DISPLAY
   ========================================================= */

function refreshWorkOrderDisplay() {

    const table =
        document.getElementById(
            "workorders-table"
        );


    if (!table) {
        return;
    }


    const rows = [];


    assets.forEach(function (asset) {

        const workOrders =
            Array.isArray(asset.workOrders)

                ? asset.workOrders

                : [];


        workOrders.forEach(
            function (workOrder) {

                const tasks =
                    Array.isArray(
                        workOrder.tasks
                    )

                        ? workOrder.tasks

                        : [];


                rows.push({

                    assetTag:
                        asset.assetTag,

                    assetName:
                        asset.name,

                    orderId:
                        workOrder.orderId,

                    status:
                        workOrder.status,

                    description:
                        workOrder.description,

                    taskCount:
                        tasks.length

                });

            }
        );

    });


    table.innerHTML = "";


    if (rows.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="empty-state">

                    No work orders found.

                </td>

            </tr>

        `;

        return;
    }


    rows.forEach(function (item) {

        const row =
            document.createElement("tr");


        const isExpanded =
            expandedWorkOrder &&
            expandedWorkOrder.assetTag ===
                item.assetTag &&
            expandedWorkOrder.orderId ===
                item.orderId;


        row.innerHTML = `

            <td>

                <strong>
                    ${escapeHtml(item.orderId)}
                </strong>

            </td>


            <td>

                <strong>
                    ${escapeHtml(item.assetTag)}
                </strong>

                <br>

                <small>
                    ${escapeHtml(item.assetName)}
                </small>

            </td>


            <td>

                ${escapeHtml(
                    item.description
                )}

            </td>


            <td>

                <span
                    class="status-badge">

                    ${escapeHtml(
                        item.status
                    )}

                </span>

            </td>


            <td>

                <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    onclick="toggleWorkOrderTasks(
                        '${escapeJs(item.assetTag)}',
                        '${escapeJs(item.orderId)}'
                    )">

                    ${item.taskCount} Task${item.taskCount === 1 ? "" : "s"}

                </button>

            </td>


            <td>

                <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    onclick="editWorkOrder(
                        '${escapeJs(item.assetTag)}',
                        '${escapeJs(item.orderId)}'
                    )">

                    Edit

                </button>


                <button
                    type="button"
                    class="btn btn-danger btn-sm"
                    onclick="deleteWorkOrder(
                        '${escapeJs(item.assetTag)}',
                        '${escapeJs(item.orderId)}'
                    )">

                    Delete

                </button>

            </td>

        `;


        table.appendChild(row);


        if (isExpanded) {

            const taskRow =
                document.createElement("tr");


            const taskCell =
                document.createElement("td");


            taskCell.colSpan = 6;


            taskCell.innerHTML =
                renderTasksPanel(
                    item.assetTag,
                    item.orderId
                );


            taskRow.appendChild(
                taskCell
            );


            table.appendChild(
                taskRow
            );

        }

    });

}


/* =========================================================
   TOGGLE TASKS
   ========================================================= */

function toggleWorkOrderTasks(
    assetTag,
    orderId
) {

    if (
        expandedWorkOrder &&
        expandedWorkOrder.assetTag ===
            assetTag &&
        expandedWorkOrder.orderId ===
            orderId
    ) {

        expandedWorkOrder = null;

    }

    else {

        expandedWorkOrder = {

            assetTag:
                assetTag,

            orderId:
                orderId

        };

    }


    refreshWorkOrderDisplay();

}


/* =========================================================
   TASK PANEL
   ========================================================= */

function renderTasksPanel(
    assetTag,
    orderId
) {

    const asset =
        assets.find(function (item) {

            return (
                item.assetTag ===
                assetTag
            );

        });


    if (!asset) {

        return `
            <div class="empty-state">
                Asset not found.
            </div>
        `;

    }


    const workOrder =
        asset.workOrders.find(
            function (item) {

                return (
                    item.orderId ===
                    orderId
                );

            }
        );


    if (!workOrder) {

        return `
            <div class="empty-state">
                Work order not found.
            </div>
        `;

    }


    const tasks =
        Array.isArray(workOrder.tasks)

            ? workOrder.tasks

            : [];


    let html = `

        <div class="tasks-panel">

            <div class="section-header">

                <div>

                    <h4>
                        Tasks for ${escapeHtml(orderId)}
                    </h4>

                    <p>
                        ${escapeHtml(
                            workOrder.description
                        )}
                    </p>

                </div>


                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    onclick="openTaskModal(
                        '${escapeJs(assetTag)}',
                        '${escapeJs(orderId)}'
                    )">

                    + Add Task

                </button>

            </div>

    `;


    if (tasks.length === 0) {

        html += `

            <div class="empty-state">

                No tasks have been added
                to this work order.

            </div>

        `;

    }

    else {

        html += `

            <div class="table-container">

                <table>

                    <thead>

                        <tr>

                            <th>Task ID</th>

                            <th>Description</th>

                            <th>Status</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

        `;


        tasks.forEach(function (task) {

            html += `

                <tr>

                    <td>
                        ${escapeHtml(
                            task.taskId
                        )}
                    </td>


                    <td>
                        ${escapeHtml(
                            task.description
                        )}
                    </td>


                    <td>

                        <span class="status-badge">

                            ${
                                task.completed
                                    ? "COMPLETED"
                                    : "PENDING"
                            }

                        </span>

                    </td>


                    <td>

                        <button
                            type="button"
                            class="btn btn-secondary btn-sm"
                            onclick="editTask(
                                '${escapeJs(assetTag)}',
                                '${escapeJs(orderId)}',
                                '${escapeJs(task.taskId)}'
                            )">

                            Edit

                        </button>


                        <button
                            type="button"
                            class="btn btn-danger btn-sm"
                            onclick="deleteTask(
                                '${escapeJs(assetTag)}',
                                '${escapeJs(orderId)}',
                                '${escapeJs(task.taskId)}'
                            )">

                            Delete

                        </button>

                    </td>

                </tr>

            `;

        });


        html += `

                    </tbody>

                </table>

            </div>

        `;

    }


    html += `

        </div>

    `;


    return html;
}


/* =========================================================
   TASK MODAL
   ========================================================= */

let editingTask = null;


function openTaskModal(
    assetTag,
    orderId
) {

    const modal =
        document.getElementById(
            "task-modal"
        );


    const form =
        document.getElementById(
            "task-form"
        );


    if (!modal || !form) {
        return;
    }


    editingTask = null;


    form.reset();


    document.getElementById(
        "task-asset-tag"
    ).value =
        assetTag;


    document.getElementById(
        "task-order-id"
    ).value =
        orderId;


    document.getElementById(
        "task-modal-title"
    ).textContent =
        "Add Task";


    document.getElementById(
        "task-modal-subtitle"
    ).textContent =
        `Add a task to ${orderId}`;


    clearTaskFormMessage();


    modal.classList.add(
        "active"
    );

}


/* =========================================================
   SAVE TASK
   ========================================================= */

async function saveTask(event) {

    event.preventDefault();


    const assetTag =
        document.getElementById(
            "task-asset-tag"
        ).value;


    const orderId =
        document.getElementById(
            "task-order-id"
        ).value;


    const taskId =
        document.getElementById(
            "task-id"
        ).value.trim();


    const description =
        document.getElementById(
            "task-description"
        ).value.trim();


    const completed =
        document.getElementById(
            "task-completed"
        ).checked;


    if (
        !taskId ||
        !description
    ) {

        showTaskFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;
    }


    const task = {

        taskId:
            taskId,

        description:
            description,

        completed:
            completed

    };


    try {

        let response;


        if (editingTask) {

            response =
                await fetch(

                    `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}/workorders/${encodeURIComponent(orderId)}/tasks/${encodeURIComponent(editingTask.taskId)}`,

                    {

                        method: "PUT",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                task
                            )

                    }

                );

        }

        else {

            response =
                await fetch(

                    `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}/workorders/${encodeURIComponent(orderId)}/tasks`,

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                task
                            )

                    }

                );

        }


        if (!response.ok) {

            let message =
                `HTTP ${response.status}`;


            try {

                const text =
                    await response.text();


                if (text) {
                    message += `: ${text}`;
                }

            } catch (_) {}


            throw new Error(
                message
            );

        }


        showNotification(

            editingTask

                ? "Task updated successfully."

                : "Task added successfully.",

            "success"

        );


        closeTaskModal();


        await loadAssets();


        refreshWorkOrderDisplay();

    }


    catch (error) {

        console.error(
            "Save task failed:",
            error
        );


        showTaskFormMessage(

            error.message ||
            "Failed to save task.",

            "error"

        );

    }

}


/* =========================================================
   EDIT TASK
   ========================================================= */

function editTask(
    assetTag,
    orderId,
    taskId
) {

    const asset =
        assets.find(function (item) {

            return (
                item.assetTag ===
                assetTag
            );

        });


    if (!asset) {
        return;
    }


    const workOrder =
        asset.workOrders.find(
            function (item) {

                return (
                    item.orderId ===
                    orderId
                );

            }
        );


    if (!workOrder) {
        return;
    }


    const task =
        workOrder.tasks.find(
            function (item) {

                return (
                    item.taskId ===
                    taskId
                );

            }
        );


    if (!task) {
        return;
    }


    editingTask = {
        ...task
    };


    document.getElementById(
        "task-asset-tag"
    ).value =
        assetTag;


    document.getElementById(
        "task-order-id"
    ).value =
        orderId;


    document.getElementById(
        "task-id"
    ).value =
        task.taskId;


    document.getElementById(
        "task-id"
    ).readOnly = true;


    document.getElementById(
        "task-description"
    ).value =
        task.description || "";


    document.getElementById(
        "task-completed"
    ).checked =
        task.completed === true;


    document.getElementById(
        "task-modal-title"
    ).textContent =
        "Edit Task";


    document.getElementById(
        "task-modal-subtitle"
    ).textContent =
        `Update task ${taskId}`;


    clearTaskFormMessage();


    document.getElementById(
        "task-modal"
    ).classList.add(
        "active"
    );

}


/* =========================================================
   DELETE TASK
   ========================================================= */

async function deleteTask(
    assetTag,
    orderId,
    taskId
) {

    const confirmed =
        confirm(
            `Delete task "${taskId}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(

                `${API_BASE_URL}/assets/${encodeURIComponent(assetTag)}/workorders/${encodeURIComponent(orderId)}/tasks/${encodeURIComponent(taskId)}`,

                {

                    method: "DELETE"

                }

            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        showNotification(
            "Task deleted successfully.",
            "success"
        );


        await loadAssets();


        refreshWorkOrderDisplay();

    }


    catch (error) {

        console.error(
            "Delete task failed:",
            error
        );


        showNotification(

            error.message ||
            "Failed to delete task.",

            "error"

        );

    }

}


/* =========================================================
   CLOSE TASK MODAL
   ========================================================= */

function closeTaskModal() {

    const modal =
        document.getElementById(
            "task-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    editingTask = null;


    const form =
        document.getElementById(
            "task-form"
        );


    if (form) {

        form.reset();

    }


    const taskId =
        document.getElementById(
            "task-id"
        );


    if (taskId) {

        taskId.readOnly = false;

    }


    clearTaskFormMessage();
}


/* =========================================================
   FORM MESSAGES
   ========================================================= */

function showWorkOrderFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "workorder-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


function clearWorkOrderFormMessage() {

    const element =
        document.getElementById(
            "workorder-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "form-message";

}


function showTaskFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "task-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


function clearTaskFormMessage() {

    const element =
        document.getElementById(
            "task-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "form-message";

}


/* =========================================================
   INITIALISE WORK ORDER FORMS
   ========================================================= */

function setupWorkOrderForms() {

    const workOrderForm =
        document.getElementById(
            "workorder-form"
        );


    if (workOrderForm) {

        workOrderForm.addEventListener(
            "submit",
            saveWorkOrder
        );

    }


    const taskForm =
        document.getElementById(
            "task-form"
        );


    if (taskForm) {

        taskForm.addEventListener(
            "submit",
            saveTask
        );

    }

}



/* =========================================================
   BOOKING MANAGEMENT
   ========================================================= */


/* ---------------------------------------------------------
   SETUP BOOKING FORM
   --------------------------------------------------------- */

function setupBookingForm() {

    const form =
        document.getElementById("booking-form");

    if (!form) {
        console.warn(
            "Booking form was not found."
        );

        return;
    }

    form.addEventListener(
        "submit",
        saveBooking
    );

}


/* ---------------------------------------------------------
   LOAD BOOKINGS
   --------------------------------------------------------- */

async function loadBookings() {

    console.log(
        "Loading bookings..."
    );

    const table =
        document.getElementById(
            "bookings-table"
        );

    if (!table) {
        console.error(
            "bookings-table was not found."
        );

        return;
    }


    try {

        const bookingRows = [];


        /*
         * Each asset stores its bookings.
         *
         * We therefore retrieve bookings
         * for every asset.
         */

        for (const asset of assets) {

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/assets/${encodeURIComponent(
                            asset.assetTag
                        )}/bookings`
                    );


                if (!response.ok) {

                    if (response.status === 404) {
                        continue;
                    }

                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }


                const bookings =
                    await response.json();


                if (!Array.isArray(bookings)) {
                    continue;
                }


                bookings.forEach(
                    function (booking) {

                        bookingRows.push({
                            assetTag:
                                asset.assetTag,

                            assetName:
                                asset.name,

                            booking:
                                booking
                        });

                    }
                );

            } catch (error) {

                console.error(
                    `Failed to load bookings for ${asset.assetTag}:`,
                    error
                );

            }

        }


        renderBookings(
            bookingRows
        );

        updateBookingStatistics(
            bookingRows
        );


        console.log(
            "Bookings loaded:",
            bookingRows.length
        );


    } catch (error) {

        console.error(
            "Load bookings error:",
            error
        );


        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state">

                    Failed to load bookings.

                </td>
            </tr>
        `;

    }

}


/* ---------------------------------------------------------
   RENDER BOOKINGS
   --------------------------------------------------------- */

function renderBookings(
    bookingRows
) {

    const table =
        document.getElementById(
            "bookings-table"
        );

    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (
        bookingRows.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="empty-state">

                    No bookings found.

                </td>
            </tr>
        `;

        return;
    }


    bookingRows.forEach(
        function (item) {

            const booking =
                item.booking;


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <strong>
                        ${escapeHtml(
                            booking.bookingId || "-"
                        )}
                    </strong>
                </td>

                <td>

                    <strong>
                        ${escapeHtml(
                            item.assetName ||
                            item.assetTag
                        )}
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(
                            item.assetTag
                        )}
                    </small>

                </td>

                <td>
                    ${escapeHtml(
                        booking.bookedBy || "-"
                    )}
                </td>

                <td>
                    ${formatBookingDate(
                        booking.startDate
                    )}
                </td>

                <td>
                    ${formatBookingDate(
                        booking.endDate
                    )}
                </td>

                <td>
                    <span class="status-badge">
                        ${escapeHtml(
                            booking.status || "-"
                        )}
                    </span>
                </td>

                <td>

                    <button
                        type="button"
                        class="btn btn-danger btn-sm"
                        onclick="deleteBooking(
                            '${escapeJs(item.assetTag)}',
                            '${escapeJs(booking.bookingId)}'
                        )">

                        Cancel

                    </button>

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* ---------------------------------------------------------
   UPDATE BOOKING STATISTICS
   --------------------------------------------------------- */

function updateBookingStatistics(
    bookingRows
) {

    const total =
        bookingRows.length;


    const active =
        bookingRows.filter(
            function (item) {

                return (
                    item.booking.status ===
                    "ACTIVE"
                );

            }
        ).length;


    const today =
        new Date();


    const upcoming =
        bookingRows.filter(
            function (item) {

                if (
                    !item.booking.startDate
                ) {
                    return false;
                }


                const startDate =
                    new Date(
                        item.booking.startDate
                    );


                return (
                    startDate >= today
                );

            }
        ).length;


    const totalElement =
        document.getElementById(
            "total-bookings-count"
        );

    const activeElement =
        document.getElementById(
            "active-bookings-count"
        );

    const upcomingElement =
        document.getElementById(
            "upcoming-bookings-count"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }


    if (activeElement) {
        activeElement.textContent =
            active;
    }


    if (upcomingElement) {
        upcomingElement.textContent =
            upcoming;
    }

}


/* ---------------------------------------------------------
   OPEN BOOKING MODAL
   --------------------------------------------------------- */

function openBookingModal() {

    const modal =
        document.getElementById(
            "booking-modal"
        );

    const form =
        document.getElementById(
            "booking-form"
        );

    const assetSelect =
        document.getElementById(
            "booking-asset"
        );


    if (
        !modal ||
        !form ||
        !assetSelect
    ) {

        console.error(
            "Booking modal elements were not found."
        );

        return;
    }


    form.reset();


    clearBookingFormMessage();


    /*
     * Clear old asset options.
     */

    assetSelect.innerHTML = `
        <option value="">
            Select an asset
        </option>
    `;


    /*
     * Only assets that are currently
     * available can be booked.
     *
     * The backend performs the final
     * validation as well.
     */

    assets.forEach(
        function (asset) {

            if (
                asset.status ===
                "AVAILABLE"
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    asset.assetTag;


                option.textContent =
                    `${asset.assetTag} — ${asset.name}`;


                assetSelect.appendChild(
                    option
                );

            }

        }
    );


    /*
     * Set sensible default dates.
     */

    const startInput =
        document.getElementById(
            "booking-start-date"
        );

    const endInput =
        document.getElementById(
            "booking-end-date"
        );


    const now =
        new Date();


    /*
     * Start one hour from now.
     */

    const start =
        new Date(
            now.getTime() +
            60 * 60 * 1000
        );


    /*
     * End two hours from start.
     */

    const end =
        new Date(
            start.getTime() +
            60 * 60 * 1000
        );


    if (startInput) {

        startInput.value =
            toDateTimeLocalValue(
                start
            );

    }


    if (endInput) {

        endInput.value =
            toDateTimeLocalValue(
                end
            );

    }


    modal.classList.add(
        "active"
    );

}


/* ---------------------------------------------------------
   SAVE BOOKING
   --------------------------------------------------------- */

async function saveBooking(
    event
) {

    event.preventDefault();


    const assetTag =
        document.getElementById(
            "booking-asset"
        ).value;


    const bookedBy =
        document.getElementById(
            "booking-booked-by"
        ).value.trim();


    const startDate =
        document.getElementById(
            "booking-start-date"
        ).value;


    const endDate =
        document.getElementById(
            "booking-end-date"
        ).value;


    /*
     * Basic validation.
     */

    if (
        !assetTag ||
        !bookedBy ||
        !startDate ||
        !endDate
    ) {

        showBookingFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;
    }


    const start =
        new Date(startDate);


    const end =
        new Date(endDate);


    if (
        end <= start
    ) {

        showBookingFormMessage(
            "The end date must be after the start date.",
            "error"
        );

        return;
    }


    /*
     * Generate a unique booking ID.
     *
     * The current Ballerina endpoint
     * expects a complete Booking record.
     */

    const bookingId =
        "BOOK-" +
        Date.now();


    const booking = {

        bookingId:
            bookingId,

        bookedBy:
            bookedBy,

        startDate:
            startDate,

        endDate:
            endDate,

        status:
            "ACTIVE"

    };


    console.log(
        "Creating booking:",
        booking
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(
                    assetTag
                )}/book`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            booking
                        )
                }
            );


        if (!response.ok) {

            if (
                response.status ===
                404
            ) {

                throw new Error(
                    "The selected asset was not found."
                );

            }


            if (
                response.status ===
                409
            ) {

                throw new Error(
                    "The asset cannot be booked. It may already be booked for this period, be unavailable, under maintenance, loaned out, or disposed."
                );

            }


            if (
                response.status ===
                400
            ) {

                throw new Error(
                    "Invalid booking data."
                );

            }


            throw new Error(
                `Booking request failed with HTTP ${response.status}`
            );

        }


        /*
         * Refresh assets because the backend
         * changes the asset status to OCCUPIED.
         */

        await loadAssets();


        closeBookingModal();


        /*
         * Reload bookings using the
         * refreshed asset list.
         */

        await loadBookings();


        showNotification(
            "Booking created successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save booking error:",
            error
        );


        showBookingFormMessage(
            error.message ||
            "Failed to create booking.",
            "error"
        );

    }

}


/* ---------------------------------------------------------
   DELETE / CANCEL BOOKING
   --------------------------------------------------------- */

async function deleteBooking(
    assetTag,
    bookingId
) {

    const confirmed =
        confirm(
            `Cancel booking ${bookingId}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(
                    assetTag
                )}/bookings/${encodeURIComponent(
                    bookingId
                )}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            if (
                response.status ===
                404
            ) {

                throw new Error(
                    "Booking or asset was not found."
                );

            }


            throw new Error(
                `Failed to cancel booking. HTTP ${response.status}`
            );

        }


        /*
         * Refresh assets because the backend
         * may change the asset back to AVAILABLE.
         */

        await loadAssets();


        await loadBookings();


        showNotification(
            "Booking cancelled successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Delete booking error:",
            error
        );


        showNotification(
            error.message ||
            "Failed to cancel booking.",
            "error"
        );

    }

}


/* ---------------------------------------------------------
   CLOSE BOOKING MODAL
   --------------------------------------------------------- */

function closeBookingModal() {

    const modal =
        document.getElementById(
            "booking-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    const form =
        document.getElementById(
            "booking-form"
        );


    if (form) {

        form.reset();

    }


    clearBookingFormMessage();

}


/* ---------------------------------------------------------
   BOOKING FORM MESSAGE
   --------------------------------------------------------- */

function showBookingFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "booking-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


function clearBookingFormMessage() {

    const element =
        document.getElementById(
            "booking-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "form-message";

}


/* ---------------------------------------------------------
   FORMAT BOOKING DATE
   --------------------------------------------------------- */

function formatBookingDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHtml(
            value
        );

    }


    return escapeHtml(
        date.toLocaleString()
    );

}


/* ---------------------------------------------------------
   DATETIME-LOCAL HELPER
   --------------------------------------------------------- */

function toDateTimeLocalValue(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return `${year}-${month}-${day}T${hours}:${minutes}`;

}


/* =========================================================
   LOAN MANAGEMENT
   ========================================================= */


/* ---------------------------------------------------------
   SETUP LOAN FORM
   --------------------------------------------------------- */

function setupLoanForm() {

    const form =
        document.getElementById(
            "loan-form"
        );


    if (!form) {

        console.warn(
            "Loan form was not found."
        );

        return;
    }


    form.addEventListener(
        "submit",
        saveLoan
    );

}


/* ---------------------------------------------------------
   LOAD LOANS
   --------------------------------------------------------- */

async function loadLoans() {

    console.log(
        "Loading loans..."
    );


    const table =
        document.getElementById(
            "loans-table"
        );


    if (!table) {

        console.error(
            "loans-table was not found."
        );

        return;
    }


    try {

        const loanRows = [];


        /*
         * Loans are stored inside each asset.
         *
         * Retrieve the loans for every asset.
         */

        for (
            const asset of assets
        ) {

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/assets/${encodeURIComponent(
                            asset.assetTag
                        )}/loans`
                    );


                if (!response.ok) {

                    if (
                        response.status ===
                        404
                    ) {

                        continue;

                    }


                    throw new Error(
                        `HTTP ${response.status}`
                    );

                }


                const loans =
                    await response.json();


                if (
                    !Array.isArray(
                        loans
                    )
                ) {

                    continue;

                }


                loans.forEach(
                    function (loan) {

                        loanRows.push({

                            assetTag:
                                asset.assetTag,

                            assetName:
                                asset.name,

                            loan:
                                loan

                        });

                    }
                );

            } catch (error) {

                console.error(
                    `Failed to load loans for ${asset.assetTag}:`,
                    error
                );

            }

        }


        renderLoans(
            loanRows
        );


        updateLoanStatistics(
            loanRows
        );


        console.log(
            "Loans loaded:",
            loanRows.length
        );


    } catch (error) {

        console.error(
            "Load loans error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state">

                    Failed to load loans.

                </td>

            </tr>

        `;

    }

}


/* ---------------------------------------------------------
   RENDER LOANS
   --------------------------------------------------------- */

function renderLoans(
    loanRows
) {

    const table =
        document.getElementById(
            "loans-table"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (
        loanRows.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state">

                    No loans found.

                </td>

            </tr>

        `;

        return;

    }


    loanRows.forEach(
        function (item) {

            const loan =
                item.loan;


            const row =
                document.createElement(
                    "tr"
                );


            let actionButton =
                "";


            /*
             * Only active loans can be returned.
             */

            if (
                loan.status ===
                "ACTIVE"
            ) {

                actionButton = `

                    <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        onclick="returnLoan(
                            '${escapeJs(
                                item.assetTag
                            )}',
                            '${escapeJs(
                                loan.loanId
                            )}'
                        )">

                        Return Asset

                    </button>

                `;

            } else {

                actionButton = `

                    <span
                        class="text-muted">

                        Returned

                    </span>

                `;

            }


            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHtml(
                            loan.loanId ||
                            "-"
                        )}
                    </strong>

                </td>


                <td>

                    <strong>
                        ${escapeHtml(
                            item.assetName ||
                            item.assetTag
                        )}
                    </strong>

                    <br>

                    <small>
                        ${escapeHtml(
                            item.assetTag
                        )}
                    </small>

                </td>


                <td>

                    ${escapeHtml(
                        loan.borrower ||
                        "-"
                    )}

                </td>


                <td>

                    ${escapeHtml(
                        loan.loanDate ||
                        "-"
                    )}

                </td>


                <td>

                    ${escapeHtml(
                        loan.dueDate ||
                        "-"
                    )}

                </td>


                <td>

                    <span class="status-badge">

                        ${escapeHtml(
                            loan.status ||
                            "-"
                        )}

                    </span>

                </td>


                <td>

                    ${actionButton}

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* ---------------------------------------------------------
   UPDATE LOAN STATISTICS
   --------------------------------------------------------- */

function updateLoanStatistics(
    loanRows
) {

    const total =
        loanRows.length;


    const active =
        loanRows.filter(
            function (item) {

                return (
                    item.loan.status ===
                    "ACTIVE"
                );

            }
        ).length;


    const returned =
        loanRows.filter(
            function (item) {

                return (
                    item.loan.status ===
                    "RETURNED"
                );

            }
        ).length;


    const totalElement =
        document.getElementById(
            "total-loans-count"
        );


    const activeElement =
        document.getElementById(
            "active-loans-count"
        );


    const returnedElement =
        document.getElementById(
            "returned-loans-count"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (activeElement) {

        activeElement.textContent =
            active;

    }


    if (returnedElement) {

        returnedElement.textContent =
            returned;

    }

}


/* ---------------------------------------------------------
   OPEN LOAN MODAL
   --------------------------------------------------------- */

function openLoanModal() {

    const modal =
        document.getElementById(
            "loan-modal"
        );


    const form =
        document.getElementById(
            "loan-form"
        );


    const assetSelect =
        document.getElementById(
            "loan-asset"
        );


    if (
        !modal ||
        !form ||
        !assetSelect
    ) {

        console.error(
            "Loan modal elements were not found."
        );

        return;

    }


    form.reset();


    clearLoanFormMessage();


    /*
     * Clear existing asset options.
     */

    assetSelect.innerHTML = `

        <option value="">

            Select an asset

        </option>

    `;


    /*
     * Only AVAILABLE assets can be loaned.
     */

    assets.forEach(
        function (asset) {

            if (
                asset.status ===
                "AVAILABLE"
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    asset.assetTag;


                option.textContent =
                    `${asset.assetTag} — ${asset.name}`;


                assetSelect.appendChild(
                    option
                );

            }

        }
    );


    /*
     * Default loan date = today.
     */

    const loanDate =
        document.getElementById(
            "loan-date"
        );


    if (loanDate) {

        loanDate.value =
            getTodayDate();

    }


    /*
     * Default due date = 7 days from today.
     */

    const dueDate =
        document.getElementById(
            "loan-due-date"
        );


    if (dueDate) {

        const futureDate =
            new Date();


        futureDate.setDate(
            futureDate.getDate() +
            7
        );


        dueDate.value =
            formatDateForInput(
                futureDate
            );

    }


    modal.classList.add(
        "active"
    );

}


/* ---------------------------------------------------------
   SAVE LOAN
   --------------------------------------------------------- */

async function saveLoan(
    event
) {

    event.preventDefault();


    const assetTag =
        document.getElementById(
            "loan-asset"
        ).value;


    const borrower =
        document.getElementById(
            "loan-borrower"
        ).value.trim();


    const loanDate =
        document.getElementById(
            "loan-date"
        ).value;


    const dueDate =
        document.getElementById(
            "loan-due-date"
        ).value;


    /*
     * Validate fields.
     */

    if (
        !assetTag ||
        !borrower ||
        !loanDate ||
        !dueDate
    ) {

        showLoanFormMessage(
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    /*
     * Validate date order.
     */

    if (
        dueDate <= loanDate
    ) {

        showLoanFormMessage(
            "The due date must be after the loan date.",
            "error"
        );

        return;

    }


    /*
     * Generate a unique loan ID.
     */

    const loanId =
        "LOAN-" +
        Date.now();


    /*
     * Your Ballerina endpoint expects
     * a complete Loan record.
     */

    const loan = {

        loanId:
            loanId,

        borrower:
            borrower,

        loanDate:
            loanDate,

        dueDate:
            dueDate,

        status:
            "ACTIVE"

    };


    console.log(
        "Creating loan:",
        loan
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(
                    assetTag
                )}/loan`,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            loan
                        )

                }
            );


        if (!response.ok) {

            if (
                response.status ===
                404
            ) {

                throw new Error(
                    "The selected asset was not found."
                );

            }


            if (
                response.status ===
                409
            ) {

                throw new Error(
                    "This asset cannot be loaned because it is not currently available."
                );

            }


            if (
                response.status ===
                400
            ) {

                throw new Error(
                    "Invalid loan data."
                );

            }


            throw new Error(
                `Loan request failed with HTTP ${response.status}`
            );

        }


        /*
         * Refresh assets because the backend
         * changes the asset to LOANED_OUT.
         */

        await loadAssets();


        /*
         * Close modal.
         */

        closeLoanModal();


        /*
         * Reload loan table.
         */

        await loadLoans();


        showNotification(
            "Loan created successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save loan error:",
            error
        );


        showLoanFormMessage(
            error.message ||
            "Failed to create loan.",
            "error"
        );

    }

}


/* ---------------------------------------------------------
   RETURN LOAN
   --------------------------------------------------------- */

async function returnLoan(
    assetTag,
    loanId
) {

    const confirmed =
        confirm(
            `Return loan ${loanId} and make the asset available again?`
        );


    if (!confirmed) {
        return;
    }


    console.log(
        "Returning loan:",
        loanId,
        "Asset:",
        assetTag
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/assets/${encodeURIComponent(
                    assetTag
                )}/loans/${encodeURIComponent(
                    loanId
                )}/returnLoan`,
                {

                    method:
                        "PUT"

                }
            );


        if (!response.ok) {

            if (
                response.status ===
                404
            ) {

                throw new Error(
                    "The loan or asset was not found."
                );

            }


            throw new Error(
                `Return request failed with HTTP ${response.status}`
            );

        }


        /*
         * Backend changes:
         *
         * loan.status = RETURNED
         * asset.status = AVAILABLE
         */

        await loadAssets();


        await loadLoans();


        showNotification(
            "Asset returned successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Return loan error:",
            error
        );


        showNotification(
            error.message ||
            "Failed to return asset.",
            "error"
        );

    }

}


/* ---------------------------------------------------------
   CLOSE LOAN MODAL
   --------------------------------------------------------- */

function closeLoanModal() {

    const modal =
        document.getElementById(
            "loan-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    const form =
        document.getElementById(
            "loan-form"
        );


    if (form) {

        form.reset();

    }


    clearLoanFormMessage();

}


/* ---------------------------------------------------------
   LOAN FORM MESSAGE
   --------------------------------------------------------- */

function showLoanFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "loan-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


function clearLoanFormMessage() {

    const element =
        document.getElementById(
            "loan-form-message"
        );


    if (!element) {
        return;
    }


    element.textContent =
        "";


    element.className =
        "form-message";

}


/* ---------------------------------------------------------
   DATE HELPERS
   --------------------------------------------------------- */

function getTodayDate() {

    const today =
        new Date();


    return formatDateForInput(
        today
    );

}


function formatDateForInput(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   INSTITUTIONS
   ========================================================= */

let institutions = [];
let filteredInstitutions = [];


/* ---------------------------------------------------------
   Load Institutions
   --------------------------------------------------------- */

async function loadInstitutions() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/institutions`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load institutions (${response.status})`
            );
        }

        institutions = await response.json();

        filteredInstitutions = [...institutions];

        renderInstitutions();
        updateInstitutionStatistics();

    } catch (error) {

        console.error(
            "Error loading institutions:",
            error
        );

        const tableBody =
            document.getElementById(
                "institutionsTableBody"
            );

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="empty-table">
                        Unable to load institutions.
                    </td>
                </tr>
            `;
        }

        showNotification(
            "Unable to load institutions.",
            "error"
        );
    }
}


/* ---------------------------------------------------------
   Render Institutions
   --------------------------------------------------------- */

function renderInstitutions() {

    const tableBody =
        document.getElementById(
            "institutionsTableBody"
        );

    if (!tableBody) {
        return;
    }

    if (filteredInstitutions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-table">
                    No institutions found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        filteredInstitutions
            .map(institution => {

                const assetCount =
                    getInstitutionAssetCount(
                        institution.name
                    );

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    institution.institutionId
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                institution.name
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                institution.description || "-"
                            )}
                        </td>

                        <td>
                            <span class="status-badge">
                                ${assetCount}
                            </span>
                        </td>

                        <td>

                            <button
                                class="btn btn-danger btn-sm"
                                onclick="deleteInstitution(
                                    '${escapeJs(
                                        institution.institutionId
                                    )}'
                                )">
                                Delete
                            </button>

                        </td>

                    </tr>
                `;

            })
            .join("");
}


/* ---------------------------------------------------------
   Count Assets Belonging to Institution
   --------------------------------------------------------- */

function getInstitutionAssetCount(institutionName) {

    if (!Array.isArray(assets)) {
        return 0;
    }

    return assets.filter(asset =>
        asset.institution === institutionName
    ).length;
}


/* ---------------------------------------------------------
   Update Statistics
   --------------------------------------------------------- */

function updateInstitutionStatistics() {

    const totalElement =
        document.getElementById(
            "totalInstitutions"
        );

    if (totalElement) {

        totalElement.textContent =
            institutions.length;
    }
}


/* ---------------------------------------------------------
   Search / Filter Institutions
   --------------------------------------------------------- */

function filterInstitutions() {

    const searchInput =
        document.getElementById(
            "institutionSearch"
        );

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    if (!searchTerm) {

        filteredInstitutions =
            [...institutions];

    } else {

        filteredInstitutions =
            institutions.filter(institution => {

                return (
                    institution.institutionId
                        .toLowerCase()
                        .includes(searchTerm) ||

                    institution.name
                        .toLowerCase()
                        .includes(searchTerm) ||

                    (
                        institution.description || ""
                    )
                        .toLowerCase()
                        .includes(searchTerm)
                );

            });
    }

    renderInstitutions();
}


/* ---------------------------------------------------------
   Open Institution Modal
   --------------------------------------------------------- */

function openInstitutionModal() {

    const modal =
        document.getElementById(
            "institutionModal"
        );

    if (!modal) {
        return;
    }

    const form =
        document.getElementById(
            "institutionForm"
        );

    if (form) {
        form.reset();
    }

    clearInstitutionFormMessage();

    modal.classList.add("active");
}


/* ---------------------------------------------------------
   Close Institution Modal
   --------------------------------------------------------- */

function closeInstitutionModal() {

    const modal =
        document.getElementById(
            "institutionModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }

    clearInstitutionFormMessage();
}


/* ---------------------------------------------------------
   Institution Form Message
   --------------------------------------------------------- */

function clearInstitutionFormMessage() {

    const message =
        document.getElementById(
            "institutionFormMessage"
        );

    if (message) {

        message.textContent = "";
        message.className =
            "form-message";
    }
}


/* ---------------------------------------------------------
   Save Institution
   --------------------------------------------------------- */

async function saveInstitution(event) {

    event.preventDefault();

    clearInstitutionFormMessage();

    const institutionId =
        document.getElementById(
            "institutionId"
        ).value.trim();

    const name =
        document.getElementById(
            "institutionName"
        ).value.trim();

    const description =
        document.getElementById(
            "institutionDescription"
        ).value.trim();


    /* Validation */

    if (!institutionId) {

        showFormMessage(
            "institutionFormMessage",
            "Please enter an institution ID.",
            "error"
        );

        return;
    }

    if (!name) {

        showFormMessage(
            "institutionFormMessage",
            "Please enter an institution name.",
            "error"
        );

        return;
    }

    if (!description) {

        showFormMessage(
            "institutionFormMessage",
            "Please enter an institution description.",
            "error"
        );

        return;
    }


    const institution = {

        institutionId: institutionId,

        name: name,

        description: description
    };


    try {

        const response = await fetch(
            `${API_BASE_URL}/institutions`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(institution)
            }
        );


        if (response.status === 409) {

            showFormMessage(
                "institutionFormMessage",
                "An institution with this ID already exists.",
                "error"
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Failed to add institution (${response.status})`
            );
        }


        const createdInstitution =
            await response.json();


        institutions.push(
            createdInstitution
        );

        filteredInstitutions =
            [...institutions];


        renderInstitutions();
        updateInstitutionStatistics();

        closeInstitutionModal();


        showNotification(
            "Institution added successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Error adding institution:",
            error
        );

        showFormMessage(
            "institutionFormMessage",
            "Unable to add institution. Please try again.",
            "error"
        );
    }
}


/* ---------------------------------------------------------
   Delete Institution
   --------------------------------------------------------- */

async function deleteInstitution(
    institutionId
) {

    const institution =
        institutions.find(
            item =>
                item.institutionId ===
                institutionId
        );


    if (!institution) {
        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${institution.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/institutions/${encodeURIComponent(
                institutionId
            )}`,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {

            throw new Error(
                `Failed to delete institution (${response.status})`
            );
        }


        institutions =
            institutions.filter(
                item =>
                    item.institutionId !==
                    institutionId
            );

        filteredInstitutions =
            filteredInstitutions.filter(
                item =>
                    item.institutionId !==
                    institutionId
            );


        renderInstitutions();
        updateInstitutionStatistics();


        showNotification(
            "Institution deleted successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Error deleting institution:",
            error
        );

        showNotification(
            "Unable to delete institution.",
            "error"
        );
    }
}





/* ---------------------------------------------------------
   GLOBAL LOAN FUNCTIONS
   --------------------------------------------------------- */

window.loadLoans =
    loadLoans;

window.openLoanModal =
    openLoanModal;

window.closeLoanModal =
    closeLoanModal;

window.saveLoan =
    saveLoan;

window.returnLoan =
    returnLoan;

/* ---------------------------------------------------------
   GLOBAL BOOKING FUNCTIONS
   --------------------------------------------------------- */

window.loadBookings =
    loadBookings;

window.openBookingModal =
    openBookingModal;

window.closeBookingModal =
    closeBookingModal;

window.deleteBooking =
    deleteBooking;

window.saveBooking =
    saveBooking;


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openWorkOrderModal =
    openWorkOrderModal;

window.editWorkOrder =
    editWorkOrder;

window.deleteWorkOrder =
    deleteWorkOrder;

window.closeWorkOrderModal =
    closeWorkOrderModal;

window.toggleWorkOrderTasks =
    toggleWorkOrderTasks;

window.openTaskModal =
    openTaskModal;

window.editTask =
    editTask;

window.deleteTask =
    deleteTask;

window.closeTaskModal =
    closeTaskModal;


window.loadMaintenance =
    loadMaintenance;

window.viewMaintenanceAsset =
    viewMaintenanceAsset;


 
window.openScheduleModal =
    openScheduleModal;

window.editSchedule =
    editSchedule;

window.deleteSchedule =
    deleteSchedule;

window.closeScheduleModal =
    closeScheduleModal;
