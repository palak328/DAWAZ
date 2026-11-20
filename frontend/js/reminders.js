
// ============================================
// DAWAZ - MEDICINE REMINDERS
// ============================================


// 1. GET HTML ELEMENTS

const reminderForm = document.getElementById("reminderForm");
const reminderModal = document.getElementById("reminderModal");

const addReminderBtn = document.getElementById("addReminderBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelReminderBtn = document.getElementById("cancelReminderBtn");

const reminderMedicine = document.getElementById("reminderMedicine");
const reminderTime = document.getElementById("reminderTime");
const reminderFrequency = document.getElementById("reminderFrequency");
const reminderInstructions = document.getElementById("reminderInstructions");

const reminderList = document.getElementById("reminderList");
const reminderHistory = document.getElementById("reminderHistory");

const totalReminders = document.getElementById("totalReminders");
const completedReminders = document.getElementById("completedReminders");
const upcomingReminders = document.getElementById("upcomingReminders");

const reminderDate = document.getElementById("reminderDate");
const modalTitle = document.getElementById("modalTitle");


// 2. STORAGE AND VARIABLES

const STORAGE_KEY = "dawazReminders";

let reminders = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

let editingReminderId = null;


// 3. GET TODAY'S DATE

function getToday() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 4. SAVE REMINDERS

function saveReminders() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reminders)
    );

}


// 5. FORMAT DATE

function displayDate() {

    const today = new Date();

    reminderDate.textContent = today.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


// 6. GET TODAY'S STATUS

function getTodayStatus(reminder) {

    const today = getToday();

    const record = reminder.history?.find(
        item => item.date === today
    );

    return record ? record.status : "upcoming";

}


// 7. FORMAT TIME

function formatTime(time) {

    if (!time) return "";

    const [hours, minutes] = time.split(":");

    const date = new Date();

    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

}


// 8. OPEN REMINDER MODAL

function openModal() {

    reminderModal.hidden = false;

    reminderForm.reset();

    editingReminderId = null;

    modalTitle.textContent = "Add Medicine Reminder";

}


// 9. CLOSE REMINDER MODAL

function closeModal() {

    reminderModal.hidden = true;

    reminderForm.reset();

    editingReminderId = null;

}


// 10. ADD OR UPDATE REMINDER

reminderForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name = reminderMedicine.value.trim();
    const time = reminderTime.value;
    const frequency = reminderFrequency.value;
    const instructions = reminderInstructions.value.trim();

    if (!name || !time || !frequency) {

        alert("Please complete all required fields.");

        return;

    }

    if (editingReminderId) {

        const reminder = reminders.find(
            item => item.id === editingReminderId
        );

        if (!reminder) return;

        reminder.name = name;
        reminder.time = time;
        reminder.frequency = frequency;
        reminder.instructions = instructions;

    } else {

        const newReminder = {

            id: crypto.randomUUID(),

            name: name,
            time: time,
            frequency: frequency,
            instructions: instructions,

            createdAt: new Date().toISOString(),

            history: []

        };

        reminders.push(newReminder);

    }

    saveReminders();

    renderReminders();

    closeModal();

});


// 11. EDIT REMINDER

function editReminder(id) {

    const reminder = reminders.find(
        item => item.id === id
    );

    if (!reminder) return;

    editingReminderId = id;

    reminderMedicine.value = reminder.name;
    reminderTime.value = reminder.time;
    reminderFrequency.value = reminder.frequency;
    reminderInstructions.value = reminder.instructions || "";

    modalTitle.textContent = "Edit Medicine Reminder";

    reminderModal.hidden = false;

}


// 12. DELETE REMINDER

function deleteReminder(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this reminder?"
    );

    if (!confirmed) return;

    reminders = reminders.filter(
        item => item.id !== id
    );

    saveReminders();

    renderReminders();

}


// 13. UPDATE REMINDER STATUS

function updateStatus(id, status) {

    const reminder = reminders.find(
        item => item.id === id
    );

    if (!reminder) return;

    const today = getToday();

    if (!reminder.history) {
        reminder.history = [];
    }

    // Keep only one status record per reminder per day.

    reminder.history = reminder.history.filter(
        item => item.date !== today
    );

    reminder.history.push({

        date: today,

        status: status,

        recordedAt: new Date().toISOString()

    });

    saveReminders();

    renderReminders();

}


// 14. CREATE REMINDER CARD

function createReminderCard(reminder) {

    const card = document.createElement("div");

    card.className = "reminder-item";

    const status = getTodayStatus(reminder);

    const medicineInfo = document.createElement("div");

    medicineInfo.className = "reminder-info";

    const name = document.createElement("h3");

    name.textContent = reminder.name;

    const time = document.createElement("p");

    time.textContent = formatTime(reminder.time);

    const frequency = document.createElement("span");

    frequency.textContent = reminder.frequency;

    medicineInfo.append(name, time, frequency);

    if (reminder.instructions) {

        const instructions = document.createElement("p");

        instructions.className = "reminder-instructions";

        instructions.textContent = reminder.instructions;

        medicineInfo.appendChild(instructions);

    }

    const actions = document.createElement("div");

    actions.className = "reminder-actions";

    const statusLabel = document.createElement("span");

    statusLabel.className = `status-badge ${status}`;

    if (status === "taken") {

        statusLabel.textContent = "Taken (reported)";

    } else if (status === "skipped") {

        statusLabel.textContent = "Skipped";

    } else {

        statusLabel.textContent = "Upcoming";

    }

    actions.appendChild(statusLabel);


    if (status === "upcoming") {

        const takenBtn = document.createElement("button");

        takenBtn.type = "button";

        takenBtn.textContent = "Mark Taken";

        takenBtn.className = "taken-btn";

        takenBtn.addEventListener("click", function () {

            updateStatus(reminder.id, "taken");

        });


        const skippedBtn = document.createElement("button");

        skippedBtn.type = "button";

        skippedBtn.textContent = "Skip";

        skippedBtn.className = "skip-btn";

        skippedBtn.addEventListener("click", function () {

            updateStatus(reminder.id, "skipped");

        });

        actions.append(takenBtn, skippedBtn);

    } else {

        const undoBtn = document.createElement("button");

        undoBtn.type = "button";

        undoBtn.textContent = "Undo";

        undoBtn.className = "undo-btn";

        undoBtn.addEventListener("click", function () {

            undoStatus(reminder.id);

        });

        actions.appendChild(undoBtn);

    }


    const editBtn = document.createElement("button");

    editBtn.type = "button";

    editBtn.textContent = "Edit";

    editBtn.className = "edit-btn";

    editBtn.addEventListener("click", function () {

        editReminder(reminder.id);

    });


    const deleteBtn = document.createElement("button");

    deleteBtn.type = "button";

    deleteBtn.textContent = "Delete";

    deleteBtn.className = "delete-btn";

    deleteBtn.addEventListener("click", function () {

        deleteReminder(reminder.id);

    });

    actions.append(editBtn, deleteBtn);

    card.append(medicineInfo, actions);

    return card;

}


// 15. UNDO STATUS

function undoStatus(id) {

    const reminder = reminders.find(
        item => item.id === id
    );

    if (!reminder) return;

    const today = getToday();

    reminder.history = reminder.history.filter(
        item => item.date !== today
    );

    saveReminders();

    renderReminders();

}


// 16. UPDATE SUMMARY CARDS

function updateSummary() {

    const total = reminders.length;

    const taken = reminders.filter(
        item => getTodayStatus(item) === "taken"
    ).length;

    const remaining = reminders.filter(
        item => getTodayStatus(item) === "upcoming"
    ).length;

    totalReminders.textContent = total;

    completedReminders.textContent = taken;

    upcomingReminders.textContent = remaining;

}


// 17. RENDER REMINDER LIST

function renderReminders() {

    reminderList.replaceChildren();

    if (reminders.length === 0) {

        const empty = document.createElement("div");

        empty.className = "empty-state";

        const heading = document.createElement("h3");

        heading.textContent = "No reminders added yet";

        const description = document.createElement("p");

        description.textContent =
            "Add a medicine reminder to build your schedule.";

        empty.append(heading, description);

        reminderList.appendChild(empty);

    } else {

        const sortedReminders = [...reminders].sort(
            (a, b) => a.time.localeCompare(b.time)
        );

        sortedReminders.forEach(function (reminder) {

            reminderList.appendChild(
                createReminderCard(reminder)
            );

        });

    }

    updateSummary();

    renderHistory();

}


// 18. RENDER REMINDER HISTORY

function renderHistory() {

    reminderHistory.replaceChildren();

    const historyRecords = [];

    reminders.forEach(function (reminder) {

        (reminder.history || []).forEach(function (record) {

            historyRecords.push({

                medicine: reminder.name,

                date: record.date,

                status: record.status,

                recordedAt: record.recordedAt

            });

        });

    });

    historyRecords.sort(
        (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)
    );

    if (historyRecords.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-history";

        empty.textContent =
            "Your reminder history will appear here.";

        reminderHistory.appendChild(empty);

        return;

    }

    historyRecords.forEach(function (record) {

        const item = document.createElement("div");

        item.className = "history-item";

        const info = document.createElement("div");

        const name = document.createElement("h3");

        name.textContent = record.medicine;

        const date = document.createElement("p");

        date.textContent = new Date(
            record.date + "T00:00:00"
        ).toLocaleDateString("en-IN");

        info.append(name, date);

        const status = document.createElement("span");

        status.className = `status-badge ${record.status}`;

        status.textContent =
            record.status === "taken"
                ? "Taken (reported)"
                : "Skipped";

        item.append(info, status);

        reminderHistory.appendChild(item);

    });

}


// 19. BROWSER NOTIFICATION PERMISSION

function createNotificationButton() {

    const heading = document.querySelector(".reminders-heading");

    if (!heading) return;

    const button = document.createElement("button");

    button.type = "button";

    button.id = "enableNotificationsBtn";

    button.className = "notification-btn";

    button.textContent = "Enable Notifications";

    button.addEventListener("click", async function () {

        if (!("Notification" in window)) {

            alert("Your browser does not support notifications.");

            return;

        }

        const permission = await Notification.requestPermission();

        if (permission === "granted") {

            button.textContent = "Notifications Enabled";

            button.disabled = true;

            new Notification("DAWAZ Notifications Enabled", {

                body: "You can now receive medicine reminders while this page is open."

            });

        } else {

            alert(
                "Notification permission was not granted. You can enable it in browser settings."
            );

        }

    });

    heading.appendChild(button);

}


// 20. CHECK MEDICINE REMINDERS

function checkReminders() {

    if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
    ) {
        return;
    }

    const now = new Date();

    const currentTime =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

    const today = getToday();

    reminders.forEach(function (reminder) {

        const notificationKey =
            `dawaz-notified-${reminder.id}-${today}`;

        const alreadyNotified =
            localStorage.getItem(notificationKey);

        if (
            reminder.time === currentTime &&
            getTodayStatus(reminder) === "upcoming" &&
            !alreadyNotified
        ) {

            new Notification("DAWAZ Medicine Reminder", {

                body: `It's time for your scheduled reminder: ${reminder.name}. Follow your confirmed prescription.`

            });

            localStorage.setItem(notificationKey, "true");

        }

    });

}


// 21. EVENT LISTENERS

addReminderBtn.addEventListener("click", openModal);

closeModalBtn.addEventListener("click", closeModal);

cancelReminderBtn.addEventListener("click", closeModal);

reminderModal.addEventListener("click", function (event) {

    if (event.target === reminderModal) {

        closeModal();

    }

});


// 22. INITIALIZE PAGE

displayDate();

createNotificationButton();

renderReminders();


// Check reminders every 30 seconds while page is open.

checkReminders();

setInterval(checkReminders, 30000);
