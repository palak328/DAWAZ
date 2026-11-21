
document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "dawazReminders";
    const MAX_CUSTOM_TIMES = 5;

    // ---------- LANGUAGE ----------

    function getLanguage() {
        return window.DAWAZ_LANGUAGE?.getLanguage?.() ||
            localStorage.getItem("dawazLanguage") ||
            "en";
    }

    const translations = {
        en: {
            editReminder: "Edit Reminder",
            addReminder: "Add Reminder",
            doseTime: "Dose {number} time",
            addAnotherTime: "+ Add another time",
            maximumTimesReached: "Maximum times reached",
            maxDoseTimes: "You can add up to {count} dose times.",
            enterMedicineFrequencyTime:
                "Please enter the medicine, frequency and dose time.",
            enterRequiredTimes:
                "Please enter {count} dose time(s) for this frequency.",
            deleteConfirmation: "Delete this reminder?",
            noInstructions: "No instructions added",
            patientReportedTaken: "Patient reported taken",
            skipped: "Skipped",
            pending: "Pending",
            taken: "Taken",
            undo: "Undo",
            edit: "Edit",
            delete: "Delete",
            noReminders: "No reminders added yet.",
            noHistory: "No reminder history yet.",
            enableNotifications: "Enable Browser Notifications",
            notificationsEnabled: "Notifications Enabled",
            unsupportedNotifications:
                "This browser does not support notifications.",
            notificationTitle: "DAWAZ Medicine Reminder",
            notificationBody: "Reminder time for {medicine}.",
            onceDaily: "Once daily",
            twiceDaily: "Twice daily",
            threeTimesDaily: "Three times daily",
            custom: "Custom"
        },
        hi: {
            editReminder: "रिमाइंडर संपादित करें",
            addReminder: "रिमाइंडर जोड़ें",
            doseTime: "खुराक {number} का समय",
            addAnotherTime: "+ एक और समय जोड़ें",
            maximumTimesReached: "अधिकतम समय सीमा पूरी हुई",
            maxDoseTimes: "आप अधिकतम {count} खुराक के समय जोड़ सकते हैं।",
            enterMedicineFrequencyTime:
                "कृपया दवा, आवृत्ति और खुराक का समय भरें।",
            enterRequiredTimes:
                "इस आवृत्ति के लिए कृपया {count} खुराक का समय भरें।",
            deleteConfirmation: "क्या आप यह रिमाइंडर हटाना चाहते हैं?",
            noInstructions: "कोई निर्देश नहीं जोड़े गए",
            patientReportedTaken: "मरीज़ ने दवा लेने की पुष्टि की",
            skipped: "छोड़ा गया",
            pending: "बाकी है",
            taken: "ली गई",
            undo: "वापस करें",
            edit: "संपादित करें",
            delete: "हटाएँ",
            noReminders: "अभी तक कोई रिमाइंडर नहीं जोड़ा गया है।",
            noHistory: "अभी तक कोई रिमाइंडर इतिहास नहीं है।",
            enableNotifications: "ब्राउज़र नोटिफिकेशन चालू करें",
            notificationsEnabled: "नोटिफिकेशन चालू हैं",
            unsupportedNotifications:
                "यह ब्राउज़र नोटिफिकेशन का समर्थन नहीं करता।",
            notificationTitle: "DAWAZ दवा रिमाइंडर",
            notificationBody: "{medicine} लेने का निर्धारित समय है।",
            onceDaily: "दिन में एक बार",
            twiceDaily: "दिन में दो बार",
            threeTimesDaily: "दिन में तीन बार",
            custom: "कस्टम"
        }
    };

    function t(key, values = {}) {
        const language = getLanguage();

        // Use the shared language dictionary when the key exists.
        const sharedTranslation =
            window.DAWAZ_LANGUAGE?.translate?.(key);

        let message =
            sharedTranslation && sharedTranslation !== key
                ? sharedTranslation
                : translations[language]?.[key] ||
                  translations.en[key] ||
                  key;

        Object.entries(values).forEach(([name, value]) => {
            message = message.replaceAll(`{${name}}`, value);
        });

        return message;
    }

    function translateFrequency(frequency) {
        const frequencyKeys = {
            "Once daily": "onceDaily",
            "Twice daily": "twiceDaily",
            "Three times daily": "threeTimesDaily",
            "Custom": "custom"
        };

        return t(frequencyKeys[frequency] || "") || frequency;
    }

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

    // ---------- REMINDER SOUND ----------

    let audioContext = null;
    let soundEnabled = false;
    let soundInterval = null;
    let activeReminderKey = null;

    function enableReminderSound() {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            console.error("Audio is not supported by this browser.");
            return;
        }

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        audioContext.resume()
            .then(() => {
                soundEnabled = true;
            })
            .catch(error => {
                console.error("Could not enable reminder sound:", error);
            });
    }

    function playReminderTone() {
        if (!audioContext || !soundEnabled) return;

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.2,
            audioContext.currentTime + 0.05
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.6
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.6);
    }

    function startReminderSound(reminderKey) {
        if (!soundEnabled) return;

        if (activeReminderKey === reminderKey && soundInterval) {
            return;
        }

        stopReminderSound();
        activeReminderKey = reminderKey;

        playReminderTone();

        soundInterval = setInterval(() => {
            playReminderTone();
        }, 1800);
    }

    function stopReminderSound() {
        if (soundInterval) {
            clearInterval(soundInterval);
            soundInterval = null;
        }

        activeReminderKey = null;
    }

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

        return date.toLocaleTimeString(
            getLanguage() === "hi" ? "hi-IN" : "en-IN",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }
        );
    }

    function formatDate(dateString) {
        if (!dateString) return "";

        const date = new Date(`${dateString}T00:00:00`);

        return date.toLocaleDateString(
            getLanguage() === "hi" ? "hi-IN" : "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }

    function getTimes(reminder) {
        if (Array.isArray(reminder.times) && reminder.times.length) {
            return [...new Set(reminder.times)].sort();
        }

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

        if (
            activeReminderKey === `${reminder.id}_${date}_${time}` &&
            status !== "pending"
        ) {
            stopReminderSound();
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
        label.textContent = t("doseTime", { number: index + 1 });

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
            addTimeButton.textContent = t("addAnotherTime");
            addTimeButton.className = "add-time-btn";

            addTimeButton.addEventListener("click", () => {
                const currentCount =
                    timeFieldsContainer.querySelectorAll(
                        ".extra-reminder-time"
                    ).length + 1;

                if (currentCount >= MAX_CUSTOM_TIMES) {
                    alert(t("maxDoseTimes", {
                        count: MAX_CUSTOM_TIMES
                    }));
                    return;
                }

                timeFieldsContainer.insertBefore(
                    createAdditionalTimeField(currentCount),
                    addTimeButton
                );

                if (currentCount + 1 >= MAX_CUSTOM_TIMES) {
                    addTimeButton.disabled = true;
                    addTimeButton.textContent = t("maximumTimesReached");
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
                modalTitle.textContent = t("editReminder");
            }
        } else {
            frequencyInput.value = "Once daily";
            updateTimeFields();

            if (modalTitle) {
                modalTitle.textContent = t("addReminder");
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

    addButton?.addEventListener("click", () => {
        enableReminderSound();
        openModal();
    });

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
            alert(t("enterMedicineFrequencyTime"));
            return;
        }

        const requiredCount = getRequiredTimeCount(frequency);

        if (requiredCount && times.length !== requiredCount) {
            alert(t("enterRequiredTimes", {
                count: requiredCount
            }));
            return;
        }

        if (times.length > MAX_CUSTOM_TIMES) {
            alert(t("maxDoseTimes", {
                count: MAX_CUSTOM_TIMES
            }));
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
            const index = reminders.findIndex(
                item => item.id === editingId
            );

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
        const confirmed = confirm(t("deleteConfirmation"));

        if (!confirmed) return;

        if (activeReminderKey?.startsWith(`${id}_`)) {
            stopReminderSound();
        }

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

    // ---------- CREATE REMINDER CARD ----------

    function createDoseCard(reminder, time, date) {
        const status = getDoseStatus(reminder, date, time);

        const card = document.createElement("div");
        card.className = "reminder-card";

        const medicineName = document.createElement("h3");
        medicineName.className = "reminder-medicine-name";
        medicineName.textContent = reminder.medicine;

        const doseTime = document.createElement("span");
        doseTime.className = "reminder-info";
        doseTime.textContent = formatTime(time);

        const frequency = document.createElement("span");
        frequency.className = "reminder-info";
        frequency.textContent = translateFrequency(
            reminder.frequency || "Once daily"
        );

        const instructions = document.createElement("span");
        instructions.className = "reminder-info reminder-instructions";
        instructions.textContent =
            reminder.instructions || t("noInstructions");

        const statusElement = document.createElement("span");
        statusElement.className = `reminder-status ${status}`;

        statusElement.textContent =
            status === "taken" ? t("patientReportedTaken") :
            status === "skipped" ? t("skipped") :
            t("pending");

        const actions = document.createElement("div");
        actions.className = "reminder-actions";

        if (status === "pending") {
            actions.append(
                createActionButton(t("taken"), "taken-btn", () => {
                    setDoseStatus(reminder, date, time, "taken");
                }),

                createActionButton(t("skipped"), "skipped-btn", () => {
                    setDoseStatus(reminder, date, time, "skipped");
                })
            );
        } else {
            actions.appendChild(
                createActionButton(t("undo"), "undo-btn", () => {
                    setDoseStatus(reminder, date, time, "pending");
                })
            );
        }

        actions.append(
            createActionButton(t("edit"), "edit-btn", () => {
                openModal(reminder);
            }),

            createActionButton(t("delete"), "delete-btn", () => {
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
            empty.textContent = t("noReminders");

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
            empty.textContent = t("noHistory");

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
                `${formatDate(record.date)} • ${formatTime(record.time)} • ` +
                (record.status === "taken"
                    ? t("patientReportedTaken")
                    : t("skipped"));

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

    // Refresh all reminder sections together.
    function renderAll() {
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
        notificationButton.className = "notification-btn";

        document.querySelector(".reminders-heading")
            ?.appendChild(notificationButton);
    }

    function updateNotificationButton() {
        if (!notificationButton) return;

        notificationButton.textContent =
            "Notification" in window &&
            Notification.permission === "granted"
                ? t("notificationsEnabled")
                : t("enableNotifications");
    }

    notificationButton?.addEventListener("click", async () => {
        if (!("Notification" in window)) {
            alert(t("unsupportedNotifications"));
            return;
        }

        try {
            await Notification.requestPermission();
            updateNotificationButton();
        } catch (error) {
            console.error("Notification permission error:", error);
        }
    });

    const notified = new Set();

    function checkNotifications() {
        const now = new Date();
        const today = getToday();

        reminders.forEach(reminder => {
            getTimes(reminder).forEach(time => {
                const [hours, minutes] = time.split(":").map(Number);

                if (
                    !Number.isInteger(hours) ||
                    !Number.isInteger(minutes)
                ) {
                    return;
                }

                const isDue =
                    now.getHours() === hours &&
                    now.getMinutes() === minutes;

                const status = getDoseStatus(reminder, today, time);

                if (!isDue || status !== "pending") return;

                const notificationKey =
                    `${reminder.id}_${today}_${time}`;

                if (notified.has(notificationKey)) return;

                notified.add(notificationKey);

                startReminderSound(notificationKey);

                if (
                    "Notification" in window &&
                    Notification.permission === "granted"
                ) {
                    new Notification(t("notificationTitle"), {
                        body: t("notificationBody", {
                            medicine: reminder.medicine
                        }),
                        tag: notificationKey
                    });
                }
            });
        });
    }

    // Check every 10 seconds while this page is open.
    setInterval(checkNotifications, 10000);

    // ---------- LANGUAGE CHANGE ----------

    window.addEventListener("dawazLanguageChanged", () => {
        renderAll();
        updateNotificationButton();

        if (modal && !modal.hidden) {
            if (modalTitle) {
                modalTitle.textContent = editingId
                    ? t("editReminder")
                    : t("addReminder");
            }

            const currentTimes = collectTimes();
            updateTimeFields(currentTimes);
        }
    });

    // ---------- INITIAL LOAD ----------

    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString(
            getLanguage() === "hi" ? "hi-IN" : "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }

    updateNotificationButton();
    renderAll();
});
