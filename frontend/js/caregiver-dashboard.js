
// =====================================
// DAWAZ CAREGIVER DASHBOARD
// FRONTEND PROTOTYPE
// =====================================

const MEDICINES_KEY = "dawazMedicines";
const REMINDERS_KEY = "dawazReminders";

// Dashboard elements
const currentDate = document.getElementById("currentDate");
const scheduleDate = document.getElementById("scheduleDate");

const totalDoses = document.getElementById("totalDoses");
const takenDoses = document.getElementById("takenDoses");
const pendingDoses = document.getElementById("pendingDoses");
const skippedDoses = document.getElementById("skippedDoses");

const medicineList = document.getElementById("caregiverMedicineList");

const progressPercentage = document.getElementById("progressPercentage");
const progressBar = document.getElementById("progressBar");
const progressMessage = document.getElementById("progressMessage");

const notificationList = document.getElementById("caregiverNotifications");

const patientName = document.getElementById("patientName");
const patientConnectionStatus = document.getElementById(
    "patientConnectionStatus"
);


// =====================================
// GET DATA FROM LOCAL STORAGE
// =====================================

function getStoredData(key) {

    try {

        const data = JSON.parse(localStorage.getItem(key));

        return Array.isArray(data) ? data : [];

    } catch (error) {

        console.error(`Error reading ${key}:`, error);
        return [];

    }

}


// =====================================
// DATE HELPERS
// =====================================

function getTodayKey() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function displayDate() {

    const today = new Date();

    const formattedDate = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    if (currentDate) {
        currentDate.textContent = formattedDate;
    }

    if (scheduleDate) {
        scheduleDate.textContent = formattedDate;
    }

}


// =====================================
// GET MEDICINE INFORMATION
// =====================================

function findMedicine(medicineName, medicines) {

    return medicines.find(function(medicine) {

        return (
            medicine.name || ""
        ).trim().toLowerCase() ===
        (medicineName || "").trim().toLowerCase();

    });

}


// =====================================
// GET REMINDER TIMES
// =====================================

function getReminderTimes(reminder) {

    if (Array.isArray(reminder.times) && reminder.times.length > 0) {

        return reminder.times.map(function(item) {

            return typeof item === "string"
                ? item
                : item.time;

        }).filter(Boolean);

    }

    if (reminder.time) {
        return [reminder.time];
    }

    return [];

}


// =====================================
// BUILD TODAY'S DOSE SCHEDULE
// =====================================

function buildTodaySchedule(medicines, reminders) {

    const today = getTodayKey();

    const schedule = [];

    reminders.forEach(function(reminder) {

        const medicineName =
            reminder.medicine ||
            reminder.medicineName ||
            reminder.name ||
            "";

        const medicine = findMedicine(medicineName, medicines);

        const times = getReminderTimes(reminder);

        times.forEach(function(time) {

            const historyKey = `${today}_${time}`;

            const historyEntry =
                reminder.history?.[historyKey];

            const savedStatus = historyEntry?.status || "pending";

            const validStatuses = ["taken", "skipped", "pending"];

            const status = validStatuses.includes(savedStatus)
                ? savedStatus
                : "pending";

            schedule.push({

                name: medicineName || "Medicine unavailable",

                strength: medicine?.strength || "Strength unavailable",

                time: time,

                status: status

            });

        });

    });

    schedule.sort(function(a, b) {

        return a.time.localeCompare(b.time);

    });

    return schedule;

}


// =====================================
// DISPLAY PATIENT INFORMATION
// =====================================

function displayPatientInformation() {

    if (patientName) {
        patientName.textContent = "Patient";
    }

    if (patientConnectionStatus) {
        patientConnectionStatus.textContent =
            "Displaying medicine data saved in this browser.";
    }

}


// =====================================
// DISPLAY MEDICINE SCHEDULE
// =====================================

function displayMedicineSchedule(medicines) {

    medicineList.innerHTML = "";

    if (medicines.length === 0) {

        medicineList.innerHTML = `
            <div class="empty-state">
                <p>No scheduled medicines.</p>
                <span>
                    Add a medicine reminder from the patient dashboard.
                </span>
            </div>
        `;

        return;

    }

    medicines.forEach(function(medicine) {

        const medicineItem = document.createElement("div");

        medicineItem.className = "caregiver-medicine-item";

        const medicineInfo = document.createElement("div");

        medicineInfo.className = "caregiver-medicine-info";

        const name = document.createElement("h3");

        name.textContent = medicine.name;

        const details = document.createElement("p");

        details.textContent =
            `${medicine.time} | ${medicine.strength}`;

        const status = document.createElement("span");

        status.className = `dose-status ${medicine.status}`;

        const labels = {

            taken: "Reported Taken",

            pending: "Pending",

            skipped: "Reported Skipped"

        };

        status.textContent = labels[medicine.status];

        medicineInfo.appendChild(name);
        medicineInfo.appendChild(details);

        medicineItem.appendChild(medicineInfo);
        medicineItem.appendChild(status);

        medicineList.appendChild(medicineItem);

    });

}


// =====================================
// UPDATE MEDICINE PROGRESS
// =====================================

function updateProgress(medicines) {

    const total = medicines.length;

    const taken = medicines.filter(function(medicine) {

        return medicine.status === "taken";

    }).length;

    const skipped = medicines.filter(function(medicine) {

        return medicine.status === "skipped";

    }).length;

    const pending = medicines.filter(function(medicine) {

        return medicine.status === "pending";

    }).length;

    totalDoses.textContent = total;

    takenDoses.textContent = taken;

    pendingDoses.textContent = pending;

    skippedDoses.textContent = skipped;

    const percentage = total === 0
        ? 0
        : Math.round((taken / total) * 100);

    progressPercentage.textContent = `${percentage}%`;

    progressBar.style.width = `${percentage}%`;

    progressMessage.textContent = total === 0
        ? "No scheduled doses available."
        : `${taken} of ${total} doses reported taken.`;

}


// =====================================
// GENERATE CAREGIVER NOTIFICATIONS
// =====================================

function generateNotifications(medicines) {

    const notifications = [];

    const now = new Date();

    medicines.forEach(function(medicine) {

        const [hours, minutes] = medicine.time.split(":").map(Number);

        if (
            !Number.isInteger(hours) ||
            !Number.isInteger(minutes) ||
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {
            return;
        }

        const scheduledTime = new Date();

        scheduledTime.setHours(hours, minutes, 0, 0);

        if (medicine.status === "taken") {

            notifications.push({

                title: "Dose status updated",

                message: `${medicine.name} at ${medicine.time}: patient reported taking the medicine.`

            });

        } else if (medicine.status === "skipped") {

            notifications.push({

                title: "Dose marked skipped",

                message: `${medicine.name} at ${medicine.time}: patient reported skipping this dose.`

            });

        } else if (scheduledTime <= now) {

            notifications.push({

                title: "Medicine dose pending",

                message: `${medicine.name} was scheduled for ${medicine.time}. No status has been recorded.`

            });

        }

    });

    return notifications;

}


// =====================================
// DISPLAY NOTIFICATIONS
// =====================================

function displayNotifications(notifications) {

    notificationList.innerHTML = "";

    if (notifications.length === 0) {

        notificationList.innerHTML = `
            <div class="empty-state">
                <p>No new notifications.</p>
                <span>
                    Patient medicine updates will appear here.
                </span>
            </div>
        `;

        return;

    }

    notifications.forEach(function(notification) {

        const item = document.createElement("div");

        item.className = "notification-item";

        const heading = document.createElement("h3");

        heading.textContent = notification.title;

        const description = document.createElement("p");

        description.textContent = notification.message;

        item.appendChild(heading);

        item.appendChild(description);

        notificationList.appendChild(item);

    });

}


// =====================================
// LOAD CAREGIVER DASHBOARD
// =====================================

function loadCaregiverDashboard() {

    displayDate();

    displayPatientInformation();

    // Read patient data from browser storage
    const medicines = getStoredData(MEDICINES_KEY);

    const reminders = getStoredData(REMINDERS_KEY);

    // Build today's medicine schedule
    const todaySchedule = buildTodaySchedule(
        medicines,
        reminders
    );

    // Display schedule
    displayMedicineSchedule(todaySchedule);

    // Calculate progress
    updateProgress(todaySchedule);

    // Generate and display notifications
    const notifications = generateNotifications(todaySchedule);

    displayNotifications(notifications);

}


// =====================================
// INITIALIZE DASHBOARD
// =====================================

loadCaregiverDashboard();


// Refresh data every 10 seconds
setInterval(loadCaregiverDashboard, 10000);


// Update when local storage changes in another tab
window.addEventListener("storage", function(event) {

    if (
        event.key === MEDICINES_KEY ||
        event.key === REMINDERS_KEY
    ) {

        loadCaregiverDashboard();

    }

});


// Refresh when returning to the dashboard
document.addEventListener("visibilitychange", function() {

    if (!document.hidden) {

        loadCaregiverDashboard();

    }

});

