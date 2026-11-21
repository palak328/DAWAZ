
document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. STORAGE AND ELEMENTS
    // =====================================

    const MEDICINES_KEY = "dawazMedicines";
    const REMINDERS_KEY = "dawazReminders";
    const ALERTS_KEY = "dawazDashboardAlerts";

    const CHAT_API_URL = "/api/medicines/ask";

    const scheduleCard = document.querySelector(".medicine-schedule-card");

    const progressText = document.getElementById("progressText");
    const progressPercentage = document.getElementById("progressPercentage");
    const progressBar = document.getElementById("progressBar");

    const nextReminderTime = document.getElementById("nextReminderTime");
    const nextReminderMedicine = document.getElementById("nextReminderMedicine");

    // Dashboard chat elements

    const chatForm = document.getElementById("dashboardChatForm");
    const chatInput = document.getElementById("dashboardChatInput");
    const chatMessages = document.getElementById("dashboardChatMessages");

    const chatMicBtn = document.getElementById("dashboardChatMicBtn");
    const chatSendBtn = document.getElementById("dashboardChatSendBtn");

    const chatStatus = document.getElementById("dashboardChatStatus");
    const chatVoiceStatus = document.getElementById("dashboardChatVoiceStatus");

    if (!scheduleCard) {
        console.error("Medicine schedule section was not found.");
        return;
    }


    // =====================================
    // 2. DATE FUNCTIONS
    // =====================================

    function getToday() {

        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function getCurrentDateTime(time) {

        const [hours, minutes] = time.split(":").map(Number);

        const date = new Date();

        date.setHours(hours, minutes, 0, 0);

        return date;
    }

    function formatTime(time) {

        const date = getCurrentDateTime(time);

        return date.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }


    // =====================================
    // 3. LOAD DATA
    // =====================================

    function loadData(key) {

        try {

            const saved = JSON.parse(localStorage.getItem(key));

            return Array.isArray(saved) ? saved : [];

        } catch (error) {

            console.error("Could not load:", key, error);

            return [];
        }
    }

    function loadAlerts() {

        try {

            return JSON.parse(localStorage.getItem(ALERTS_KEY)) || {};

        } catch (error) {

            return {};
        }
    }

    function saveAlerts(alerts) {

        localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    }

    let medicines = loadData(MEDICINES_KEY);
    let reminders = loadData(REMINDERS_KEY);
    let alerts = loadAlerts();


    // =====================================
    // 4. DISPLAY CURRENT DATE
    // =====================================

    const currentDate = document.getElementById("currentDate");

    if (currentDate) {

        currentDate.textContent = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // =====================================
    // 5. GET REMINDER TIMES
    // =====================================

    function getTimes(reminder) {

        if (Array.isArray(reminder.times) && reminder.times.length) {

            return [...new Set(
                reminder.times.map(function (item) {
                    return typeof item === "string" ? item : item.time;
                }).filter(Boolean)
            )].sort();
        }

        return reminder.time ? [reminder.time] : [];
    }


    // =====================================
    // 6. GET DAILY DOSE HISTORY
    // =====================================

    function getDoseKey(date, time) {

        return `${date}_${time}`;
    }

    function getDoseRecord(reminder, date, time) {

        const key = getDoseKey(date, time);

        return reminder.history?.[key] || {
            status: "pending",
            recordedAt: null
        };
    }


    // =====================================
    // 7. FIND MEDICINE DETAILS
    // =====================================

    function findMedicine(reminderName) {

        return medicines.find(function (medicine) {

            return medicine.name?.trim().toLowerCase() ===
                reminderName?.trim().toLowerCase();

        });
    }


    // =====================================
    // 8. GET TODAY'S SCHEDULE
    // =====================================

    function getTodaySchedule() {

        const today = getToday();

        const schedule = [];

        reminders.forEach(function (reminder) {

            getTimes(reminder).forEach(function (time) {

                if (!/^\d{2}:\d{2}$/.test(time)) {
                    return;
                }

                const medicine = findMedicine(reminder.medicine);

                schedule.push({

                    reminderId: reminder.id,
                    reminder: reminder,
                    medicine: medicine,
                    medicineName: reminder.medicine,
                    time: time,
                    date: today,
                    status: getDoseRecord(reminder, today, time).status

                });

            });

        });

        schedule.sort(function (a, b) {

            return a.time.localeCompare(b.time);

        });

        return schedule;
    }


    // =====================================
    // 9. NOTIFICATION PERMISSION
    // =====================================

    function createNotificationButton() {

        let button = document.getElementById("enableNotificationsBtn");

        if (!button) {

            button = document.createElement("button");

            button.id = "enableNotificationsBtn";
            button.type = "button";
            button.className = "notification-btn";

            button.style.cssText = `
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

            if (progressCard) {
                progressCard.prepend(button);
            }
        }

        function updateButton() {

            if (!("Notification" in window)) {

                button.textContent = "Notifications not supported";
                button.disabled = true;

            } else if (Notification.permission === "granted") {

                button.textContent = "Notifications Enabled";
                button.disabled = true;

            } else if (Notification.permission === "denied") {

                button.textContent = "Notifications Blocked";
                button.disabled = true;

            } else {

                button.textContent = "Enable Notifications";
                button.disabled = false;
            }
        }

        updateButton();

        button.onclick = async function () {

            if (!("Notification" in window)) {
                return;
            }

            const permission = await Notification.requestPermission();

            updateButton();

            if (permission === "granted") {

                sendNotification(
                    "DAWAZ Notifications Enabled",
                    "You can now receive medicine reminders while this dashboard is open."
                );
            }
        };
    }


    // =====================================
    // 10. SEND NOTIFICATION
    // =====================================

    function sendNotification(title, message) {

        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {

            new Notification(title, {
                body: message
            });

        } else {

            console.log(title + ": " + message);
        }
    }


    // =====================================
    // 11. SAVE PATIENT CONFIRMATION
    // =====================================

    function confirmDose(reminderId, date, time) {

        const latestReminders = loadData(REMINDERS_KEY);

        const reminder = latestReminders.find(function (item) {
            return item.id === reminderId;
        });

        if (!reminder) {

            alert("This reminder could not be found. Please refresh the page.");

            return false;
        }

        const scheduledTime = getCurrentDateTime(time);

        if (new Date() < scheduledTime) {

            alert("This medicine reminder is not due yet.");

            return false;
        }

        if (!reminder.history) {
            reminder.history = {};
        }

        const key = getDoseKey(date, time);

        const existingRecord = reminder.history[key];

        if (existingRecord?.status === "skipped") {

            alert("This dose is already marked as skipped. Please review it in Reminders.");

            return false;
        }

        reminder.history[key] = {

            status: "taken",

            recordedAt: new Date().toISOString()

        };

        localStorage.setItem(
            REMINDERS_KEY,
            JSON.stringify(latestReminders)
        );

        reminders = latestReminders;

        return true;
    }


    // =====================================
    // 12. CREATE MEDICINE SCHEDULE CARD
    // =====================================

    function createScheduleCard(item) {

        const card = document.createElement("div");

        card.className = "medicine-item";

        card.dataset.doseId =
            `${item.reminderId}_${item.date}_${item.time}`;

        const details = document.createElement("div");

        details.className = "medicine-details";

        const name = document.createElement("h3");

        name.textContent = item.medicineName;

        const time = document.createElement("p");

        time.textContent = formatTime(item.time);

        if (item.medicine?.strength) {

            const strength = document.createElement("p");

            strength.textContent = item.medicine.strength;

            details.append(name, strength, time);

        } else {

            details.append(name, time);
        }

        const checkpoint = document.createElement("div");

        checkpoint.className = "medicine-checkpoint";

        const status = document.createElement("span");

        status.className = "status";

        const label = document.createElement("label");

        label.className = "taken-checkbox";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "dose-checkbox";

        const checkboxText = document.createElement("span");

        checkboxText.textContent = "Mark as taken";

        label.append(checkbox, checkboxText);

        if (item.status === "taken") {

            checkbox.checked = true;
            checkbox.disabled = true;

            status.textContent = "Patient reported taken";
            status.classList.add("taken");

        } else if (item.status === "skipped") {

            checkbox.disabled = true;

            status.textContent = "Skipped";
            status.classList.add("missed");

        } else {

            const scheduledTime = getCurrentDateTime(item.time);

            if (new Date() < scheduledTime) {

                checkbox.disabled = true;

                status.textContent = "Upcoming";
                status.classList.add("upcoming");

            } else {

                status.textContent = "Awaiting confirmation";
                status.classList.add("awaiting-confirmation");
            }
        }

        checkbox.addEventListener("change", function () {

            if (!checkbox.checked) {
                return;
            }

            const success = confirmDose(
                item.reminderId,
                item.date,
                item.time
            );

            if (!success) {

                checkbox.checked = false;

                renderAll();

                return;
            }

            checkbox.disabled = true;

            sendNotification(
                "DAWAZ Confirmation Recorded",
                item.medicineName + " has been marked as taken."
            );

            renderAll();
        });

        checkpoint.append(status, label);

        card.append(details, checkpoint);

        return card;
    }


    // =====================================
    // 13. RENDER MEDICINE SCHEDULE
    // =====================================

    function renderSchedule() {

        scheduleCard.querySelectorAll(".medicine-item").forEach(function (item) {
            item.remove();
        });

        const schedule = getTodaySchedule();

        const oldEmptyMessage =
            scheduleCard.querySelector(".empty-schedule");

        if (oldEmptyMessage) {
            oldEmptyMessage.remove();
        }

        if (schedule.length === 0) {

            const empty = document.createElement("p");

            empty.className = "empty-schedule";

            empty.textContent =
                "No medicine reminders scheduled for today. Add a reminder to get started.";

            scheduleCard.appendChild(empty);

            return;
        }

        schedule.forEach(function (item) {

            scheduleCard.appendChild(createScheduleCard(item));

        });
    }


    // =====================================
    // 14. DAILY PROGRESS
    // =====================================

    function updateProgress() {

        const schedule = getTodaySchedule();

        const total = schedule.length;

        const completed = schedule.filter(function (item) {

            return item.status === "taken";

        }).length;

        const percentage = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        if (progressText) {

            progressText.textContent =
                `${completed} of ${total} doses confirmed`;
        }

        if (progressPercentage) {

            progressPercentage.textContent = `${percentage}%`;
        }

        if (progressBar) {

            progressBar.style.width = `${percentage}%`;
        }
    }


    // =====================================
    // 15. SEVEN-MINUTE FOLLOW-UP
    // =====================================

    function checkFollowUpReminders() {

        const now = new Date();

        const schedule = getTodaySchedule();

        schedule.forEach(function (item) {

            if (item.status !== "pending") {
                return;
            }

            const scheduledTime = getCurrentDateTime(item.time);

            const followUpTime = new Date(
                scheduledTime.getTime() + 7 * 60 * 1000
            );

            if (now < followUpTime) {
                return;
            }

            const alertKey =
                `${item.reminderId}_${item.date}_${item.time}`;

            if (alerts[alertKey]) {
                return;
            }

            sendNotification(
                "DAWAZ Follow-up Reminder",
                "You have not confirmed " +
                item.medicineName +
                ". Please check your medicine schedule."
            );

            alerts[alertKey] = {

                followUpSentAt: new Date().toISOString()

            };

            saveAlerts(alerts);

        });
    }


    // =====================================
    // 16. NEXT REMINDER
    // =====================================

    function updateNextReminder() {

        const now = new Date();

        const schedule = getTodaySchedule();

        const upcoming = schedule.filter(function (item) {

            return (
                item.status === "pending" &&
                getCurrentDateTime(item.time) > now
            );

        });

        if (upcoming.length > 0) {

            const next = upcoming[0];

            if (nextReminderTime) {
                nextReminderTime.textContent = formatTime(next.time);
            }

            if (nextReminderMedicine) {
                nextReminderMedicine.textContent = next.medicineName;
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
    // 17. REFRESH DATA FROM STORAGE
    // =====================================

    function refreshData() {

        medicines = loadData(MEDICINES_KEY);

        reminders = loadData(REMINDERS_KEY);

        alerts = loadAlerts();
    }


    // =====================================
    // 18. RENDER EVERYTHING
    // =====================================

    function renderAll() {

        refreshData();

        renderSchedule();

        updateProgress();

        updateNextReminder();

        checkFollowUpReminders();
    }


    // =====================================
    // 19. DASHBOARD CHAT
    // =====================================

    let chatHistory = [];

    let isSendingMessage = false;

    let speechRecognition = null;


    // -------------------------------------
    // ADD CHAT MESSAGE
    // -------------------------------------

    function addChatMessage(message, sender) {

        if (!chatMessages) {
            return;
        }

        const messageElement = document.createElement("div");

        messageElement.className =
            sender === "user"
                ? "dashboard-chat-message user-message"
                : "dashboard-chat-message assistant-message";

        const paragraph = document.createElement("p");

        paragraph.textContent = message;

        messageElement.appendChild(paragraph);

        chatMessages.appendChild(messageElement);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    // -------------------------------------
    // CHAT LOADING INDICATOR
    // -------------------------------------

    function showChatLoading() {

        if (!chatMessages) {
            return;
        }

        hideChatLoading();

        const loading = document.createElement("div");

        loading.id = "dashboardChatLoading";

        loading.className =
            "dashboard-chat-message assistant-message";

        loading.textContent = "DAWAZ is preparing an answer...";

        chatMessages.appendChild(loading);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    function hideChatLoading() {

        const loading =
            document.getElementById("dashboardChatLoading");

        if (loading) {
            loading.remove();
        }
    }


    // -------------------------------------
    // UPDATE CHAT STATUS
    // -------------------------------------

    function updateChatStatus(message) {

        if (chatStatus) {
            chatStatus.textContent = message;
        }
    }


    // -------------------------------------
    // SEND QUESTION TO BACKEND
    // -------------------------------------

    async function sendQuestionToDAWAZ(question) {

        if (isSendingMessage) {
            return;
        }

        isSendingMessage = true;

        chatSendBtn.disabled = true;
        chatMicBtn.disabled = true;

        updateChatStatus("Connecting to DAWAZ...");

        showChatLoading();

        try {

            refreshData();

            // Send relevant medicine information
            // so the backend can understand the question.

            const medicineContext = medicines.map(function (medicine) {

                return {

                    name: medicine.name || "",
                    strength: medicine.strength || "",
                    instructions: medicine.instructions || ""

                };
            });

            const reminderContext = reminders.map(function (reminder) {

                return {

                    medicine: reminder.medicine || "",
                    times: getTimes(reminder)

                };
            });

            const response = await fetch(CHAT_API_URL, {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    mode: "dashboard_question",

                    question: question,

                    conversation: chatHistory,

                    medicines: medicineContext,

                    reminders: reminderContext

                })

            });

            if (!response.ok) {

                throw new Error(
                    `Server returned status ${response.status}`
                );
            }

            const data = await response.json();

            if (!data.reply || typeof data.reply !== "string") {

                throw new Error(
                    "The backend returned an invalid response."
                );
            }

            hideChatLoading();

            addChatMessage(data.reply, "assistant");

            chatHistory.push({

                role: "assistant",

                content: data.reply

            });

            updateChatStatus("DAWAZ assistant is ready.");

        } catch (error) {

            hideChatLoading();

            console.error("DAWAZ chat error:", error);

            addChatMessage(
                "I couldn't connect to the DAWAZ assistant. Please check your connection and try again.",
                "assistant"
            );

            updateChatStatus(
                "Chat service is currently unavailable."
            );

        } finally {

            isSendingMessage = false;

            chatSendBtn.disabled = false;

            chatMicBtn.disabled = false;

            if (chatInput) {
                chatInput.focus();
            }
        }
    }


    // -------------------------------------
    // PATIENT SENDS A QUESTION
    // -------------------------------------

    if (chatForm && chatInput && chatMessages && chatSendBtn && chatMicBtn) {

        chatForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const question = chatInput.value.trim();

            if (!question) {

                updateChatStatus(
                    "Please type or speak a question first."
                );

                return;
            }

            if (isSendingMessage) {
                return;
            }

            // Display patient's question immediately.

            addChatMessage(question, "user");

            chatHistory.push({

                role: "user",

                content: question

            });

            chatInput.value = "";

            await sendQuestionToDAWAZ(question);
        });

    } else {

        console.error(
            "Dashboard chat elements are missing. Check dashboard.html."
        );
    }


    // =====================================
    // 20. SPEECH TO TEXT
    // =====================================

    function setupSpeechRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            if (chatMicBtn) {

                chatMicBtn.disabled = true;

                chatMicBtn.title =
                    "Speech recognition is not supported by this browser.";
            }

            if (chatVoiceStatus) {

                chatVoiceStatus.textContent =
                    "Voice input is not supported by this browser. Please type your question.";
            }

            return;
        }

        if (!chatMicBtn || !chatInput) {
            return;
        }

        chatMicBtn.addEventListener("click", function () {

            // Stop recording if microphone is already active.

            if (speechRecognition) {

                speechRecognition.stop();

                return;
            }

            speechRecognition = new SpeechRecognition();

            speechRecognition.lang = "en-IN";

            speechRecognition.continuous = false;

            speechRecognition.interimResults = true;

            speechRecognition.onstart = function () {

                chatMicBtn.classList.add("recording");

                chatMicBtn.textContent = "⏹";

                chatMicBtn.title = "Stop recording";

                if (chatVoiceStatus) {

                    chatVoiceStatus.textContent =
                        "Listening... Speak your question.";
                }
            };

            speechRecognition.onresult = function (event) {

                let transcript = "";

                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {

                    transcript += event.results[i][0].transcript;
                }

                chatInput.value = transcript.trim();
            };

            speechRecognition.onerror = function (event) {

                console.error(
                    "Speech recognition error:",
                    event.error
                );

                if (chatVoiceStatus) {

                    chatVoiceStatus.textContent =
                        "Unable to recognise speech. You can type your question instead.";
                }
            };

            speechRecognition.onend = function () {

                chatMicBtn.classList.remove("recording");

                chatMicBtn.textContent = "🎙️";

                chatMicBtn.title = "Speak your question";

                speechRecognition = null;

                if (
                    chatVoiceStatus &&
                    chatInput.value.trim()
                ) {

                    chatVoiceStatus.textContent =
                        "Speech converted to text. Review it and press Send.";
                }
            };

            try {

                speechRecognition.start();

            } catch (error) {

                console.error(
                    "Unable to start speech recognition:",
                    error
                );

                speechRecognition = null;

                chatMicBtn.classList.remove("recording");

                chatMicBtn.textContent = "🎙️";

                if (chatVoiceStatus) {

                    chatVoiceStatus.textContent =
                        "Could not start the microphone. Check browser permissions.";
                }
            }

        });
    }


    // =====================================
    // 21. INITIALISE SPEECH RECOGNITION
    // =====================================

    setupSpeechRecognition();


    // =====================================
    // 22. NOTIFICATION SETUP
    // =====================================

    createNotificationButton();


    // =====================================
    // 23. INITIAL LOAD
    // =====================================

    renderAll();


    // Refresh dashboard every 10 seconds.

    setInterval(function () {

        renderAll();

    }, 10000);


    // Refresh when the patient returns to the tab.

    document.addEventListener("visibilitychange", function () {

        if (!document.hidden) {
            renderAll();
        }
    });


    // Refresh when another DAWAZ page changes localStorage.

    window.addEventListener("storage", function (event) {

        if (
            event.key === REMINDERS_KEY ||
            event.key === MEDICINES_KEY
        ) {

            renderAll();
        }
    });


    // Stop microphone if the page is closed.

    window.addEventListener("beforeunload", function () {

        if (speechRecognition) {

            speechRecognition.stop();

            speechRecognition = null;
        }
    });

});

