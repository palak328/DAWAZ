
document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "dawazReminders";
    const MAX_CUSTOM_TIMES = 5;

    // ---------- HTML ELEMENTS ----------

    const form = document.getElementById("reminderForm");
    const modal = document.getElementById("reminderModal");
    const addButton = document.getElementById("addReminderBtn");

    const medicineInput = document.getElementById("reminderMedicine");
    const timeInput = document.getElementById("reminderTime");
    const frequencyInput = document.getElementById("reminderFrequency");
    const instructionsInput = document.getElementById("reminderInstructions");

    const reminderList = document.getElementById("reminderList");
    const historyList = document.getElementById("reminderHistory");

    const totalElement = document.getElementById("totalReminders");
    const completedElement = document.getElementById("completedReminders");
    const upcomingElement = document.getElementById("upcomingReminders");

    const dateElement = document.getElementById("reminderDate");
    const modalTitle = document.getElementById("modalTitle");

    if (!form || !reminderList || !timeInput || !frequencyInput) {
        console.error("DAWAZ reminder elements could not be found.");
        return;
    }

    let reminders = loadReminders();
    let editingId = null;

    // ---------- STORAGE ----------

    function loadReminders() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not load reminders:", error);
            return [];
        }
    }

    function saveReminders() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    }

    function createId() {
        return window.crypto?.randomUUID?.() ||
            `reminder-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    // ---------- DATE AND TIME ----------

    function getToday() {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatTime(time) {
        if (!time) return "";

        const [hours, minutes] = time.split(":");
        const date = new Date();

        date.setHours(Number(hours), Number(minutes), 0, 0);

        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    function getTimes(reminder) {
        if (Array.isArray(reminder.times) && reminder.times.length) {
            return [...new Set(reminder.times)].sort();
        }

        // Compatibility with older reminders.
        return reminder.time ? [reminder.time] : [];
    }

    function getDoseKey(date, time) {
        return `${date}_${time}`;
    }

    function getDoseStatus(reminder, date, time) {
        const key = getDoseKey(date, time);
        return reminder.history?.[key]?.status || "pending";
    }

    function setDoseStatus(reminder, date, time, status) {
        if (!reminder.history) {
            reminder.history = {};
        }

        const key = getDoseKey(date, time);

        if (status === "pending") {
            delete reminder.history[key];
        } else {
            reminder.history[key] = {
                status,
                recordedAt: new Date().toISOString()
            };
        }

        saveReminders();
        renderAll();
    }

    // ---------- MULTIPLE TIME FIELDS ----------

    const timeFieldsContainer = document.createElement("div");
    timeFieldsContainer.id = "additionalTimeFields";
    timeFieldsContainer.style.marginTop = "12px";

    timeInput.insertAdjacentElement("afterend", timeFieldsContainer);

    function getRequiredTimeCount(frequency) {
        switch (frequency) {
            case "Once daily":
                return 1;

            case "Twice daily":
                return 2;

            case "Three times daily":
                return 3;

            case "Custom":
                return null;

            default:
                return 1;
        }
    }

    function createAdditionalTimeField(index, value = "") {
        const wrapper = document.createElement("div");
        wrapper.className = "additional-time-field";

        const label = document.createElement("label");
        label.textContent = `Dose ${index + 1} time`;

        const input = document.createElement("input");
        input.type = "time";
        input.className = "extra-reminder-time";
        input.value = value;
        input.required = true;

        wrapper.append(label, input);

        return wrapper;
    }

    function updateTimeFields(existingTimes = []) {
        const frequency = frequencyInput.value;
        const requiredCount = getRequiredTimeCount(frequency);

        timeFieldsContainer.innerHTML = "";

        if (!frequency || requiredCount === 1) {
            return;
        }

        const count = requiredCount || Math.max(2, existingTimes.length);

        for (let i = 1; i < count; i++) {
            timeFieldsContainer.appendChild(
                createAdditionalTimeField(i, existingTimes[i] || "")
            );
        }

        if (frequency === "Custom") {
            const addTimeButton = document.createElement("button");

            addTimeButton.type = "button";
            addTimeButton.textContent = "+ Add another time";
            addTimeButton.className = "add-time-btn";

            addTimeButton.addEventListener("click", () => {
                const currentCount =
                    timeFieldsContainer.querySelectorAll(".extra-reminder-time").length + 1;

                if (currentCount >= MAX_CUSTOM_TIMES) {
                    alert(`You can add up to ${MAX_CUSTOM_TIMES} dose times.`);
                    return;
                }

                timeFieldsContainer.insertBefore(
                    createAdditionalTimeField(currentCount),
                    addTimeButton
                );

                if (currentCount + 1 >= MAX_CUSTOM_TIMES) {
                    addTimeButton.disabled = true;
                    addTimeButton.textContent = "Maximum times reached";
                }
            });

            timeFieldsContainer.appendChild(addTimeButton);
        }
    }

    function collectTimes() {
        const times = [
            timeInput.value,
            ...Array.from(
                timeFieldsContainer.querySelectorAll(".extra-reminder-time")
            ).map(input => input.value)
        ].filter(Boolean);

        return [...new Set(times)].sort();
    }

    frequencyInput.addEventListener("change", () => {
        updateTimeFields();
    });

    // ---------- MODAL ----------

    function openModal(reminder = null) {
        form.reset();
        editingId = reminder?.id || null;

        if (reminder) {
            medicineInput.value = reminder.medicine;
            frequencyInput.value = reminder.frequency || "Once daily";

            const times = getTimes(reminder);

            timeInput.value = times[0] || "";
            updateTimeFields(times);

            const extraInputs =
                timeFieldsContainer.querySelectorAll(".extra-reminder-time");

            extraInputs.forEach((input, index) => {
                input.value = times[index + 1] || "";
            });

            instructionsInput.value = reminder.instructions || "";

            if (modalTitle) {
                modalTitle.textContent = "Edit Reminder";
            }
        } else {
            frequencyInput.value = "Once daily";
            updateTimeFields();

            if (modalTitle) {
                modalTitle.textContent = "Add Reminder";
            }
        }

        if (modal) {
            modal.hidden = false;
        }
    }

    function closeModal() {
        if (modal) {
            modal.hidden = true;
        }

        form.reset();
        timeFieldsContainer.innerHTML = "";
        editingId = null;
    }

    addButton?.addEventListener("click", () => openModal());

    document.getElementById("closeModalBtn")
        ?.addEventListener("click", closeModal);

    document.getElementById("cancelReminderBtn")
        ?.addEventListener("click", closeModal);

    modal?.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal && !modal.hidden) {
            closeModal();
        }
    });

    // ---------- ADD AND EDIT ----------

    form.addEventListener("submit", event => {
        event.preventDefault();

        const medicine = medicineInput.value.trim();
        const frequency = frequencyInput.value;
        const times = collectTimes();
        const instructions = instructionsInput.value.trim();

        if (!medicine || !frequency || !times.length) {
            alert("Please enter the medicine, frequency and dose time.");
            return;
        }

        const requiredCount = getRequiredTimeCount(frequency);

        if (requiredCount && times.length !== requiredCount) {
            alert(`Please enter ${requiredCount} dose time(s) for this frequency.`);
            return;
        }

        if (times.length > MAX_CUSTOM_TIMES) {
            alert(`You can add up to ${MAX_CUSTOM_TIMES} dose times.`);
            return;
        }

        const reminderData = {
            medicine,
            frequency,
            times,
            time: times[0],
            instructions
        };

        if (editingId) {
            const index = reminders.findIndex(item => item.id === editingId);

            if (index !== -1) {
                reminders[index] = {
                    ...reminders[index],
                    ...reminderData
                };
            }
        } else {
            reminders.push({
                id: createId(),
                ...reminderData,
                history: {},
                createdAt: new Date().toISOString()
            });
        }

        saveReminders();
        closeModal();
        renderAll();
    });

    // ---------- REMINDER ACTIONS ----------

    function deleteReminder(id) {
        const confirmed = confirm("Delete this reminder?");

        if (!confirmed) return;

        reminders = reminders.filter(item => item.id !== id);

        saveReminders();
        renderAll();
    }

    function createActionButton(label, className, callback) {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = label;
        button.className = className;

        button.addEventListener("click", callback);

        return button;
    }

    // ---------- CREATE HORIZONTAL REMINDER CARD ----------

    function createDoseCard(reminder, time, date) {
        const status = getDoseStatus(reminder, date, time);

        const card = document.createElement("div");
        card.className = "reminder-card";

        // Medicine name
        const medicineName = document.createElement("h3");
        medicineName.className = "reminder-medicine-name";
        medicineName.textContent = reminder.medicine;

        // Reminder time
        const doseTime = document.createElement("span");
        doseTime.className = "reminder-info";
        doseTime.textContent = formatTime(time);

        // Frequency
        const frequency = document.createElement("span");
        frequency.className = "reminder-info";
        frequency.textContent = reminder.frequency || "Once daily";

        // Instructions
        const instructions = document.createElement("span");
        instructions.className = "reminder-info reminder-instructions";
        instructions.textContent =
            reminder.instructions || "No instructions added";

        // Status
        const statusElement = document.createElement("span");
        statusElement.className = `reminder-status ${status}`;

        statusElement.textContent =
            status === "taken" ? "Patient reported taken" :
            status === "skipped" ? "Skipped" :
            "Pending";

        // Action buttons
        const actions = document.createElement("div");
        actions.className = "reminder-actions";

        if (status === "pending") {
            actions.append(
                createActionButton("Taken", "taken-btn", () => {
                    setDoseStatus(reminder, date, time, "taken");
                }),

                createActionButton("Skipped", "skipped-btn", () => {
                    setDoseStatus(reminder, date, time, "skipped");
                })
            );
        } else {
            actions.appendChild(
                createActionButton("Undo", "undo-btn", () => {
                    setDoseStatus(reminder, date, time, "pending");
                })
            );
        }

        actions.append(
            createActionButton("Edit", "edit-btn", () => {
                openModal(reminder);
            }),

            createActionButton("Delete", "delete-btn", () => {
                deleteReminder(reminder.id);
            })
        );

        card.append(
            medicineName,
            doseTime,
            frequency,
            instructions,
            statusElement,
            actions
        );

        return card;
    }

    // ---------- TODAY'S SCHEDULE ----------

    function renderSchedule() {
        reminderList.innerHTML = "";

        const today = getToday();
        const schedule = [];

        reminders.forEach(reminder => {
            getTimes(reminder).forEach(time => {
                schedule.push({ reminder, time });
            });
        });

        schedule.sort((a, b) => a.time.localeCompare(b.time));

        schedule.forEach(({ reminder, time }) => {
            reminderList.appendChild(
                createDoseCard(reminder, time, today)
            );
        });

        if (schedule.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-reminders";
            empty.textContent = "No reminders added yet.";

            reminderList.appendChild(empty);
        }
    }

    // ---------- HISTORY ----------

    function renderHistory() {
        if (!historyList) return;

        historyList.innerHTML = "";

        const records = [];

        reminders.forEach(reminder => {
            Object.entries(reminder.history || {}).forEach(([key, record]) => {
                const separatorIndex = key.lastIndexOf("_");

                const date = key.substring(0, separatorIndex);
                const time = key.substring(separatorIndex + 1);

                records.push({
                    medicine: reminder.medicine,
                    date,
                    time,
                    ...record
                });
            });
        });

        records.sort((a, b) => {
            return (b.recordedAt || "").localeCompare(a.recordedAt || "");
        });

        if (records.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-history";
            empty.textContent = "No reminder history yet.";

            historyList.appendChild(empty);
            return;
        }

        records.forEach(record => {
            const item = document.createElement("div");
            item.className = "history-item";

            const medicine = document.createElement("strong");
            medicine.textContent = record.medicine;

            const details = document.createElement("p");

            details.textContent =
                `${record.date} • ${formatTime(record.time)} • ` +
                (record.status === "taken"
                    ? "Patient reported taken"
                    : "Skipped");

            item.append(medicine, details);
            historyList.appendChild(item);
        });
    }

    // ---------- SUMMARY ----------

    function renderSummary() {
        const today = getToday();

        let total = 0;
        let completed = 0;
        let upcoming = 0;

        reminders.forEach(reminder => {
            getTimes(reminder).forEach(time => {
                total++;

                const status = getDoseStatus(reminder, today, time);

                if (status === "taken") {
                    completed++;
                }

                if (status === "pending") {
                    upcoming++;
                }
            });
        });

        if (totalElement) totalElement.textContent = total;
        if (completedElement) completedElement.textContent = completed;
        if (upcomingElement) upcomingElement.textContent = upcoming;
    }

    // ---------- RENDER ALL ----------

    function renderAll() {
        if (dateElement) {
            dateElement.textContent = new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
        }

        renderSchedule();
        renderHistory();
        renderSummary();
    }

    // ---------- BROWSER NOTIFICATIONS ----------

    let notificationButton =
        document.getElementById("notificationPermissionBtn");

    if (!notificationButton) {
        notificationButton = document.createElement("button");

        notificationButton.id = "notificationPermissionBtn";
        notificationButton.type = "button";
        notificationButton.textContent = "Enable Browser Notifications";
        notificationButton.className = "notification-btn";

        document.querySelector(".reminders-heading")
            ?.appendChild(notificationButton);
    }

    notificationButton?.addEventListener("click", async () => {
        if (!("Notification" in window)) {
            alert("This browser does not support notifications.");
            return;
        }

        const permission = await Notification.requestPermission();

        notificationButton.textContent =
            permission === "granted"
                ? "Notifications Enabled"
                : "Enable Browser Notifications";
    });

    const notified = new Set();

    function checkNotifications() {
        if (
            !("Notification" in window) ||
            Notification.permission !== "granted"
        ) {
            return;
        }

        const now = new Date();
        const today = getToday();

        reminders.forEach(reminder => {
            getTimes(reminder).forEach(time => {
                const [hours, minutes] = time.split(":").map(Number);

                if (
                    now.getHours() === hours &&
                    now.getMinutes() === minutes &&
                    getDoseStatus(reminder, today, time) === "pending"
                ) {
                    const notificationKey =
                        `${reminder.id}_${today}_${time}`;

                    if (notified.has(notificationKey)) return;

                    new Notification("DAWAZ Medicine Reminder", {
                        body: `Reminder time for ${reminder.medicine}.`
                    });

                    notified.add(notificationKey);
                }
            });
        });
    }

    setInterval(checkNotifications, 30000);

    // ---------- INITIAL LOAD ----------

    renderAll();
});
