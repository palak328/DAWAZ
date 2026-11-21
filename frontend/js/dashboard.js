
document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // 1. DASHBOARD ELEMENTS
    // =====================================

    const currentDate = document.getElementById("currentDate");

    const progressCard = document.querySelector(".medicine-progress");

    // Chat elements
    const chatForm = document.getElementById("dashboardChatForm");
    const chatInput = document.getElementById("dashboardChatInput");
    const chatMessages = document.getElementById("dashboardChatMessages");

    const chatMicBtn = document.getElementById("dashboardChatMicBtn");
    const chatSendBtn = document.getElementById("dashboardChatSendBtn");

    const chatStatus = document.getElementById("dashboardChatStatus");
    const chatVoiceStatus = document.getElementById("dashboardChatVoiceStatus");

    let chatHistory = [];
    let isSendingMessage = false;
    let speechRecognition = null;


    // =====================================
    // 2. CURRENT DATE
    // =====================================

    if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }


    // =====================================
    // 3. BROWSER NOTIFICATIONS
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


    function createNotificationButton() {

        if (!progressCard) return;

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

            progressCard.prepend(button);
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

            if (!("Notification" in window)) return;

            try {
                const permission = await Notification.requestPermission();

                updateButton();

                if (permission === "granted") {
                    sendNotification(
                        "DAWAZ Notifications Enabled",
                        "Browser notifications are enabled. Reminder delivery is not guaranteed when the browser is closed or suspended."
                    );
                }

            } catch (error) {
                console.error("Notification permission error:", error);
            }
        };
    }


    // =====================================
    // 4. CHAT MESSAGE DISPLAY
    // =====================================

    function addChatMessage(message, sender) {

        if (!chatMessages) return;

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


    // =====================================
    // 5. CHAT LOADING INDICATOR
    // =====================================

    function showChatLoading() {

        if (!chatMessages) return;

        hideChatLoading();

        const loading = document.createElement("div");

        loading.id = "dashboardChatLoading";
        loading.className = "dashboard-chat-message assistant-message";
        loading.textContent = "DAWAZ is preparing an answer...";

        chatMessages.appendChild(loading);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    function hideChatLoading() {

        const loading = document.getElementById("dashboardChatLoading");

        if (loading) {
            loading.remove();
        }
    }


    // =====================================
    // 6. CHAT STATUS
    // =====================================

    function updateChatStatus(message) {

        if (chatStatus) {
            chatStatus.textContent = message;
        }
    }


    // =====================================
    // 7. SEND QUESTION TO BACKEND B
    // =====================================

    async function sendQuestionToDAWAZ(question) {

        if (isSendingMessage) return;

        if (!window.DawazAPI) {
            updateChatStatus("Backend API service is unavailable.");
            return;
        }

        isSendingMessage = true;

        if (chatSendBtn) chatSendBtn.disabled = true;
        if (chatMicBtn) chatMicBtn.disabled = true;

        updateChatStatus("Connecting to DAWAZ...");
        showChatLoading();

        try {

            const savedLang = localStorage.getItem("dawazLanguage") || sessionStorage.getItem("dawazLanguage") || "en";
            const language = (savedLang === "hi" || savedLang === "hi-IN") ? "hi-IN" : "en-IN";

            const response = await DawazAPI.request("/questions", {
                method: "POST",
                body: JSON.stringify({
                    question: question,
                    language: language
                })
            });

            const answer =
                response.answer ||
                (response.data && response.data.answer) ||
                response.reply ||
                response.response ||
                response.message;

            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error("The backend returned an invalid response.");
            }

            hideChatLoading();

            addChatMessage(answer, "assistant");

            chatHistory.push({
                role: "assistant",
                content: answer
            });

            updateChatStatus("DAWAZ assistant is ready.");

        } catch (error) {

            hideChatLoading();

            console.error("DAWAZ chat error:", error);

            addChatMessage(
                "I couldn't connect to the DAWAZ assistant. Please check your connection and try again.",
                "assistant"
            );

            updateChatStatus("Chat service is currently unavailable.");

        } finally {

            isSendingMessage = false;

            if (chatSendBtn) chatSendBtn.disabled = false;
            if (chatMicBtn) chatMicBtn.disabled = false;

            if (chatInput) chatInput.focus();
        }
    }


    // =====================================
    // 8. CHAT FORM SUBMISSION
    // =====================================

    if (chatForm && chatInput && chatMessages && chatSendBtn) {

        chatForm.addEventListener("submit", async function (event) {

            event.preventDefault();

            const question = chatInput.value.trim();

            if (!question) {
                updateChatStatus("Please type or speak a question first.");
                return;
            }

            if (isSendingMessage) return;

            addChatMessage(question, "user");

            chatHistory.push({
                role: "user",
                content: question
            });

            chatInput.value = "";

            await sendQuestionToDAWAZ(question);
        });

    } else {
        console.warn("Dashboard chat elements are unavailable on this page.");
    }


    // =====================================
    // 9. SPEECH TO TEXT
    // =====================================

    function setupSpeechRecognition() {

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {

            if (chatMicBtn) {
                chatMicBtn.disabled = true;
                chatMicBtn.title = "Speech recognition is not supported.";
            }

            if (chatVoiceStatus) {
                chatVoiceStatus.textContent =
                    "Voice input is not supported. Please type your question.";
            }

            return;
        }

        if (!chatMicBtn || !chatInput) return;

        chatMicBtn.addEventListener("click", function () {

            if (speechRecognition) {
                speechRecognition.stop();
                return;
            }

            speechRecognition = new SpeechRecognition();

            speechRecognition.lang =
                sessionStorage.getItem("dawazLanguage") === "hi"
                    ? "hi-IN"
                    : "en-IN";

            speechRecognition.continuous = false;
            speechRecognition.interimResults = true;

            speechRecognition.onstart = function () {

                chatMicBtn.classList.add("recording");
                chatMicBtn.textContent = "Stop";
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

                console.error("Speech recognition error:", event.error);

                if (chatVoiceStatus) {
                    chatVoiceStatus.textContent =
                        "Unable to recognise speech. Please type your question.";
                }
            };

            speechRecognition.onend = function () {

                chatMicBtn.classList.remove("recording");
                chatMicBtn.textContent = "🎙️";
                chatMicBtn.title = "Speak your question";

                speechRecognition = null;

                if (chatVoiceStatus && chatInput.value.trim()) {
                    chatVoiceStatus.textContent =
                        "Speech converted to text. Review it and press Send.";
                }
            };

            try {
                speechRecognition.start();

            } catch (error) {

                console.error("Unable to start microphone:", error);

                speechRecognition = null;

                chatMicBtn.classList.remove("recording");
                chatMicBtn.textContent = "🎙️";

                if (chatVoiceStatus) {
                    chatVoiceStatus.textContent =
                        "Could not start microphone. Check browser permissions.";
                }
            }
        });
    }


    // =====================================
    // 10. INITIALIZATION
    // =====================================

    createNotificationButton();

    setupSpeechRecognition();


    // =====================================
    // 11. CLEANUP
    // =====================================

    window.addEventListener("beforeunload", function () {

        if (speechRecognition) {
            speechRecognition.stop();
            speechRecognition = null;
        }
    });

});
