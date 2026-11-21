
document.addEventListener("DOMContentLoaded", () => {
    const reminderList = document.getElementById("reminderList");
    const historyList = document.getElementById("reminderHistory");

    const modal = document.getElementById("reminderModal");
    const form = document.getElementById("reminderForm");

    const medicineSelect = document.getElementById("reminderMedicine");
    const timeInput = document.getElementById("reminderTime");
    const startInput = document.getElementById("reminderStartDate");
    const endInput = document.getElementById("reminderEndDate");

    const message = document.getElementById("reminderFormMessage");

    let activeMedicines = [];
    let todayDoses = [];

    const escapeHTML = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    const formatTime = value => {
        if (!value) return "Time unavailable";

        const match = String(value).match(/(\d{2}):(\d{2})/);

        if (!match) return String(value);

        const hours = Number(match[1]);
        const minutes = match[2];

        const period = hours >= 12 ? "PM" : "AM";
        const displayHour = hours % 12 || 12;

        return `${displayHour}:${minutes} ${period}`;
    };

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.style.color = isError ? "#c0392b" : "#228b50";
    }

    function openModal() {
        modal.hidden = false;
        message.textContent = "";
    }

    function closeModal() {
        modal.hidden = true;
        form.reset();
        message.textContent = "";
    }

    function renderHistory(doses) {
        historyList.innerHTML = "";

        const history = doses.filter(
            dose => dose.status !== "pending"
        );

        if (!history.length) {
            historyList.innerHTML =
                '<p class="empty-history">No completed or skipped reminders today.</p>';
            return;
        }

        history.forEach(dose => {
            const entry = document.createElement("article");
            entry.className = "history-entry";

            entry.innerHTML = `
                <strong>${escapeHTML(dose.medicine_name || "Medicine")}</strong>
                <span>${escapeHTML(formatTime(dose.scheduled_for))}</span>
                <span>${escapeHTML(dose.status)}</span>
            `;

            historyList.appendChild(entry);
        });
    }

    function renderReminders(doses) {
        reminderList.innerHTML = "";

        const total = doses.length;

        const completed = doses.filter(
            dose => dose.status === "taken"
        ).length;

        const upcoming = doses.filter(
            dose => dose.status === "pending"
        ).length;

        document.getElementById("totalReminders").textContent = total;
        document.getElementById("completedReminders").textContent = completed;
        document.getElementById("upcomingReminders").textContent = upcoming;

        if (!total) {
            reminderList.innerHTML = `
                <div class="empty-state">
                    <h3>No reminders scheduled today</h3>
                    <p>Your active medication schedules will appear here.</p>
                </div>
            `;

            renderHistory(doses);
            return;
        }

        doses.forEach(dose => {
            const card = document.createElement("article");
            card.className = "reminder-card";

            const status = dose.status || "pending";

            card.innerHTML = `
                <h3>${escapeHTML(dose.medicine_name || "Medicine")}</h3>
                <p>${escapeHTML(formatTime(dose.scheduled_for))}</p>
                <p class="reminder-status">
                    Status: ${escapeHTML(status)}
                </p>
            `;

            if (status === "pending") {
                ["taken", "skipped"].forEach(action => {
                    const button = document.createElement("button");

                    button.type = "button";
                    button.textContent =
                        action === "taken" ? "Taken" : "Skipped";

                    button.addEventListener("click", async () => {
                        button.disabled = true;

                        try {
                            await DawazAPI.request(
                                `/dose-occurrences/${dose.id}/report`,
                                {
                                    method: "POST",
                                    body: JSON.stringify({
                                        status: action,
                                        notes: null
                                    })
                                }
                            );

                            await loadReminders();

                        } catch (error) {
                            alert(error.message);
                            button.disabled = false;
                        }
                    });

                    card.appendChild(button);
                });
            }

            reminderList.appendChild(card);
        });

        renderHistory(doses);
    }

    async function loadMedicines() {
        const prescriptions = await DawazAPI.request("/prescriptions");

        activeMedicines = [];

        prescriptions
            .filter(p => p.status === "active")
            .forEach(prescription => {
                (prescription.items || []).forEach(item => {
                    activeMedicines.push({
                        ...item,
                        prescriptionId: prescription.id
                    });
                });
            });

        medicineSelect.innerHTML =
            '<option value="">Select an active medicine</option>';

        activeMedicines.forEach(item => {
            const option = document.createElement("option");

            option.value = item.id;
            option.textContent =
                `${item.medicine_name || item.name || "Medicine"} ` +
                `${item.strength || ""}`;

            medicineSelect.appendChild(option);
        });

        if (!activeMedicines.length) {
            medicineSelect.innerHTML =
                '<option value="">No active prescription medicines</option>';
        }
    }

    async function loadReminders() {
        try {
            const data = await DawazAPI.request("/patients/dashboard");

            todayDoses = data.today_doses || [];

            document.getElementById("reminderDate").textContent =
                new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });

            renderReminders(todayDoses);

        } catch (error) {
            reminderList.textContent =
                `Could not load reminders: ${error.message}`;
        }
    }

    document.getElementById("addReminderBtn")
        .addEventListener("click", openModal);

    document.getElementById("closeModalBtn")
        .addEventListener("click", closeModal);

    document.getElementById("cancelReminderBtn")
        .addEventListener("click", closeModal);

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const itemId = Number(medicineSelect.value);

        if (!itemId) {
            showMessage("Select an active prescription medicine.", true);
            return;
        }

        if (endInput.value < startInput.value) {
            showMessage("End date cannot be before start date.", true);
            return;
        }

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;

        try {
            await DawazAPI.request("/medication-schedules", {
                method: "POST",
                body: JSON.stringify({
                    prescription_item_id: itemId,
                    scheduled_time: timeInput.value,
                    start_date: startInput.value,
                    end_date: endInput.value,
                    timezone: "Asia/Kolkata"
                })
            });

            showMessage("Reminder schedule created.");

            await loadReminders();

            setTimeout(closeModal, 700);

        } catch (error) {
            showMessage(error.message, true);
        } finally {
            submitButton.disabled = false;
        }
    });

    async function initialize() {
        try {
            await Promise.all([
                loadMedicines(),
                loadReminders()
            ]);
        } catch (error) {
            reminderList.textContent =
                `Could not initialize reminders: ${error.message}`;
        }
    }

    initialize();
});
