 
document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. MEDICINE SCHEDULE
    // =====================================

    const medicines = [
        {
            id: "medicine-1",
            name: "Medicine 1",
            time: "09:00"
        },
        {
            id: "medicine-2",
            name: "Medicine 2",
            time: "14:00"
        },
        {
            id: "medicine-3",
            name: "Medicine 3",
            time: "20:00"
        }
    ];

    const STORAGE_KEY = "dawazDailyProgress";

    const today = new Date();

    const dateKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");


    // =====================================
    // 2. DISPLAY CURRENT DATE
    // =====================================

    const currentDate = document.getElementById("currentDate");

    if (currentDate) {
        currentDate.textContent = today.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // =====================================
    // 3. LOAD DAILY PROGRESS
    // =====================================

    function loadProgress() {

        try {
            const savedData = JSON.parse(
                localStorage.getItem(STORAGE_KEY)
            ) || {};

            if (savedData.date !== dateKey) {
                return {
                    date: dateKey,
                    doses: {}
                };
            }

            return savedData;

        } catch (error) {

            console.error("Could not load medicine progress:", error);

            return {
                date: dateKey,
                doses: {}
            };
        }
    }

    let dailyProgress = loadProgress();


    function saveProgress() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(dailyProgress)
        );
    }


    // =====================================
    // 4. GET MEDICINE RECORD
    // =====================================

    function getDoseRecord(medicineId) {

        if (!dailyProgress.doses[medicineId]) {

            dailyProgress.doses[medicineId] = {
                reminderSent: false,
                followUpSent: false,
                patientReportedTaken: false,
                confirmedAt: null
            };
        }

        return dailyProgress.doses[medicineId];
    }


    // =====================================
    // 5. NOTIFICATION PERMISSION
    // =====================================

    const notificationButton = document.createElement("button");

    notificationButton.type = "button";
    notificationButton.id = "enableNotificationsBtn";
    notificationButton.textContent = "Enable Notifications";

    notificationButton.style.cssText = `
        padding: 9px 14px;
        margin-bottom: 14px;
        border: none;
        border-radius: 8px;
        background: #d7efec;
        color: #084f4f;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
    `;

    const progressCard = document.querySelector(".medicine-progress");

    if (progressCard && "Notification" in window) {
        progressCard.prepend(notificationButton);
    }

    if (!("Notification" in window)) {

        notificationButton.textContent =
            "Browser notifications are not supported";

        notificationButton.disabled = true;

    } else if (Notification.permission === "granted") {

        notificationButton.textContent = "Notifications Enabled";

    } else if (Notification.permission === "denied") {

        notificationButton.textContent =
            "Notifications Blocked in Browser";

        notificationButton.disabled = true;
    }


    notificationButton.addEventListener("click", async function () {

        if (!("Notification" in window)) {
            return;
        }

        const permission = await Notification.requestPermission();

        if (permission === "granted") {

            notificationButton.textContent = "Notifications Enabled";

            new Notification("DAWAZ Notifications Enabled", {
                body: "You can now receive medicine reminders while the dashboard is open."
            });

        } else {

            notificationButton.textContent =
                "Notification Permission Not Granted";
        }
    });


    // =====================================
    // 6. SEND PATIENT NOTIFICATION
    // =====================================

    function sendNotification(title, message) {

        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {

            new Notification(title, {
                body: message,
                icon: "../assets/dawaz-logo.png"
            });

        } else {

            console.log(title + ": " + message);
        }
    }


    // =====================================
    // 7. CHECK MEDICINE TIME
    // =====================================

    function getScheduledTime(medicine) {

        const [hours, minutes] = medicine.time.split(":").map(Number);

        const scheduledTime = new Date();

        scheduledTime.setHours(hours, minutes, 0, 0);

        return scheduledTime;
    }


    function checkMedicineReminders() {

        const now = new Date();

        medicines.forEach(function (medicine) {

            const checkbox = document.querySelector(
                `.dose-checkbox[data-dose-id="${medicine.id}"]`
            );

            const status = document.getElementById(
                `status-${medicine.id}`
            );

            if (!checkbox || !status) {
                return;
            }

            const record = getDoseRecord(medicine.id);

            const scheduledTime = getScheduledTime(medicine);

            const followUpTime = new Date(
                scheduledTime.getTime() + 7 * 60 * 1000
            );

            // ---------------------------------
            // PATIENT ALREADY CONFIRMED
            // ---------------------------------

            if (record.patientReportedTaken) {

                checkbox.checked = true;
                checkbox.disabled = true;

                status.textContent = "Patient reported taken";
                status.className = "status taken";

                return;
            }


            // ---------------------------------
            // BEFORE SCHEDULED TIME
            // ---------------------------------

            if (now < scheduledTime) {

                checkbox.disabled = true;

                status.textContent = "Upcoming";
                status.className = "status upcoming";

                return;
            }


            // ---------------------------------
            // REMINDER TIME REACHED
            // ---------------------------------

            checkbox.disabled = false;

            if (!record.reminderSent) {

                sendNotification(
                    "DAWAZ Medicine Reminder",
                    "It is time for " + medicine.name +
                    ". Please check your medicine schedule."
                );

                record.reminderSent = true;

                saveProgress();
            }


            // ---------------------------------
            // SEVEN-MINUTE FOLLOW-UP
            // ---------------------------------

            if (now >= followUpTime && !record.followUpSent) {

                sendNotification(
                    "DAWAZ Follow-up Reminder",
                    "You have not confirmed " + medicine.name +
                    ". Please update your medicine status."
                );

                record.followUpSent = true;

                saveProgress();

                status.textContent = "Follow-up sent";
                status.className = "status missed";

            } else {

                status.textContent = "Awaiting confirmation";
                status.className = "status awaiting-confirmation";
            }

        });

        updateProgress();
    }


    // =====================================
    // 8. PATIENT CONFIRMATION CHECKBOX
    // =====================================

    const checkboxes = document.querySelectorAll(".dose-checkbox");

    checkboxes.forEach(function (checkbox) {

        checkbox.addEventListener("change", function () {

            const medicineId = checkbox.dataset.doseId;

            const medicine = medicines.find(function (item) {
                return item.id === medicineId;
            });

            if (!medicine) {
                return;
            }

            const scheduledTime = getScheduledTime(medicine);

            // Do not allow confirmation before scheduled time.
            if (new Date() < scheduledTime) {

                checkbox.checked = false;

                return;
            }

            const record = getDoseRecord(medicineId);

            if (checkbox.checked) {

                record.patientReportedTaken = true;

                record.confirmedAt = new Date().toISOString();

                saveProgress();

                const status = document.getElementById(
                    `status-${medicineId}`
                );

                if (status) {

                    status.textContent = "Patient reported taken";
                    status.className = "status taken";
                }

                sendNotification(
                    "DAWAZ Confirmation Recorded",
                    medicine.name + " has been marked as taken."
                );

            }

            updateProgress();

            checkMedicineReminders();
        });

    });


    // =====================================
    // 9. UPDATE DAILY PROGRESS
    // =====================================

    function updateProgress() {

        const totalDoses = medicines.length;

        const completedDoses = medicines.filter(function (medicine) {

            const record = getDoseRecord(medicine.id);

            return record.patientReportedTaken;

        }).length;

        const percentage = totalDoses === 0
            ? 0
            : Math.round((completedDoses / totalDoses) * 100);


        const progressText = document.getElementById("progressText");

        const progressPercentage = document.getElementById(
            "progressPercentage"
        );

        const progressBar = document.getElementById("progressBar");


        if (progressText) {

            progressText.textContent =
                completedDoses + " of " + totalDoses +
                " doses confirmed";
        }

        if (progressPercentage) {

            progressPercentage.textContent = percentage + "%";
        }

        if (progressBar) {

            progressBar.style.width = percentage + "%";
        }

    }


    // =====================================
    // 10. NEXT REMINDER
    // =====================================

    function updateNextReminder() {

        const now = new Date();

        const upcomingMedicines = medicines.filter(function (medicine) {

            const record = getDoseRecord(medicine.id);

            return (
                !record.patientReportedTaken &&
                getScheduledTime(medicine) > now
            );

        });

        upcomingMedicines.sort(function (a, b) {

            return getScheduledTime(a) - getScheduledTime(b);

        });

        const nextReminderTime = document.getElementById(
            "nextReminderTime"
        );

        const nextReminderMedicine = document.getElementById(
            "nextReminderMedicine"
        );

        if (upcomingMedicines.length > 0) {

            const nextMedicine = upcomingMedicines[0];

            const formattedTime = getScheduledTime(
                nextMedicine
            ).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });

            if (nextReminderTime) {
                nextReminderTime.textContent = formattedTime;
            }

            if (nextReminderMedicine) {
                nextReminderMedicine.textContent = nextMedicine.name;
            }

        } else {

            if (nextReminderTime) {
                nextReminderTime.textContent = "No upcoming reminders";
            }

            if (nextReminderMedicine) {
                nextReminderMedicine.textContent = "Today's schedule";
            }
        }
    }


    // =====================================
    // 11. INITIALIZE DASHBOARD
    // =====================================

    checkMedicineReminders();

    updateProgress();

    updateNextReminder();


    // Check every 10 seconds while dashboard is open.
    setInterval(function () {

        checkMedicineReminders();

        updateNextReminder();

    }, 10000);


    // Recheck when the user returns to the dashboard.
    document.addEventListener("visibilitychange", function () {

        if (!document.hidden) {

            checkMedicineReminders();

            updateNextReminder();
        }
    });

});
