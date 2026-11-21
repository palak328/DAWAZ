

/* ============================================
   DAWAZ - ASK ASSISTANT
   Chat + Voice Input + Voice Output
============================================ */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    // =========================================
    // 1. CONFIGURATION
    // =========================================

    // Replace this with your actual backend URL.
    // Do not use the Live Server URL (port 5500).
    const API_BASE = "http://127.0.0.1:8000";

    const ASK_ENDPOINT = "/api/assistant/ask";
    const TRANSCRIBE_ENDPOINT = "/api/assistant/transcribe";


    // =========================================
    // 2. HTML ELEMENTS
    // =========================================

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");

    const chatStatus = document.getElementById("chatStatus");
    const statusText = document.getElementById("statusText");

    const suggestedQuestions =
        document.getElementById("suggestedQuestions");

    const chatMicBtn = document.getElementById("chatMicBtn");
    const sendMessageBtn =
        document.getElementById("sendMessageBtn");

    const voiceStatus = document.getElementById("voiceStatus");
    const stopVoiceBtn = document.getElementById("stopVoiceBtn");


    // =========================================
    // 3. CHECK REQUIRED ELEMENTS
    // =========================================

    if (!chatForm || !chatInput || !chatMessages) {
        console.error("DAWAZ: Required chat elements are missing.");
        return;
    }


    // =========================================
    // 4. LANGUAGE
    // =========================================

    function getLanguage() {

        if (window.DAWAZ_LANGUAGE &&
            typeof window.DAWAZ_LANGUAGE.getLanguage === "function") {

            return window.DAWAZ_LANGUAGE.getLanguage();
        }

        return localStorage.getItem("dawazLanguage") || "en";
    }


    function getVoice() {
        return window.DAWAZ_VOICE || null;
    }


    function translate(key, fallback) {

        if (window.DAWAZ_LANGUAGE &&
            typeof window.DAWAZ_LANGUAGE.translate === "function") {

            return window.DAWAZ_LANGUAGE.translate(key) || fallback;
        }

        return fallback;
    }


    // =========================================
    // 5. CHAT STATUS
    // =========================================

    function setStatus(message) {

        if (statusText) {
            statusText.textContent = message;
        }

        if (chatStatus) {
            chatStatus.classList.add("active");
        }
    }


    function setVoiceStatus(message) {

        if (voiceStatus) {
            voiceStatus.textContent = message;
        }
    }


    // =========================================
    // 6. ADD CHAT MESSAGE
    // =========================================

    function addMessage(text, sender) {

        const message = document.createElement("div");

        message.className =
            sender === "user"
                ? "message user-message"
                : "message assistant-message";

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";

        avatar.textContent =
            sender === "user" ? "U" : "D";

        const content = document.createElement("div");
        content.className = "message-content";

        const paragraph = document.createElement("p");
        paragraph.textContent = text;

        content.appendChild(paragraph);

        message.appendChild(avatar);
        message.appendChild(content);

        if (sender === "assistant") {

            const actions = document.createElement("div");
            actions.className = "message-actions";

            const playButton = document.createElement("button");
            playButton.type = "button";
            playButton.textContent = "🔊";
            playButton.title = "Read response aloud";

            playButton.addEventListener("click", () => {
                speakResponse(text);
            });

            const stopButton = document.createElement("button");
            stopButton.type = "button";
            stopButton.textContent = "⏹";
            stopButton.title = "Stop voice";

            stopButton.addEventListener("click", stopVoice);

            actions.appendChild(playButton);
            actions.appendChild(stopButton);

            content.appendChild(actions);
        }

        chatMessages.appendChild(message);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    // =========================================
    // 7. TYPING INDICATOR
    // =========================================

    function showTyping() {

        const typing = document.createElement("div");

        typing.className = "message assistant-message";
        typing.id = "dawazTyping";

        typing.textContent =
            getLanguage() === "hi"
                ? "DAWAZ जवाब तैयार कर रहा है..."
                : "DAWAZ is typing...";

        chatMessages.appendChild(typing);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    function removeTyping() {

        const typing = document.getElementById("dawazTyping");

        if (typing) {
            typing.remove();
        }
    }


    // =========================================
    // 8. VOICE OUTPUT
    // =========================================

    async function speakResponse(text) {

        const voice = getVoice();

        if (!voice || typeof voice.speak !== "function") {
            setVoiceStatus("Voice service is unavailable.");
            return;
        }

        try {

            stopVoice();

            setVoiceStatus(
                getLanguage() === "hi"
                    ? "आवाज़ में जवाब दिया जा रहा है..."
                    : "Speaking response..."
            );

            await voice.speak(text);

            setVoiceStatus("");

        } catch (error) {

            console.error("DAWAZ voice error:", error);

            setVoiceStatus(
                getLanguage() === "hi"
                    ? "आवाज़ उपलब्ध नहीं है।"
                    : "Voice playback failed."
            );
        }
    }


    function stopVoice() {

        const voice = getVoice();

        if (voice && typeof voice.stop === "function") {
            voice.stop();
        }

        setVoiceStatus("");
    }


    if (stopVoiceBtn) {
        stopVoiceBtn.addEventListener("click", stopVoice);
    }


    // =========================================
    // 9. SEND QUESTION TO BACKEND
    // =========================================

    async function sendQuestion(question) {

        question = question.trim();

        if (!question) return;

        addMessage(question, "user");

        chatInput.value = "";
        chatInput.style.height = "auto";

        sendMessageBtn.disabled = true;

        showTyping();

        setStatus(
            getLanguage() === "hi"
                ? "DAWAZ जवाब तैयार कर रहा है..."
                : "DAWAZ is thinking..."
        );

        try {

            const response = await fetch(
                API_BASE + ASK_ENDPOINT,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        question: question,
                        language: getLanguage()
                    })
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Server error: " + response.status
                );
            }

            const data = await response.json();

            const answer =
                data.answer ||
                data.response ||
                data.message;

            if (!answer || typeof answer !== "string") {
                throw new Error(
                    "The backend did not return a valid answer."
                );
            }

            removeTyping();

            addMessage(answer, "assistant");

            setStatus(
                getLanguage() === "hi"
                    ? "DAWAZ तैयार है"
                    : "DAWAZ is ready"
            );

            // Automatically read the response aloud.
            await speakResponse(answer);

        } catch (error) {

            console.error("DAWAZ chat error:", error);

            removeTyping();

            addMessage(
                getLanguage() === "hi"
                    ? "माफ़ कीजिए, अभी जवाब प्राप्त नहीं हो सका। कृपया सर्वर कनेक्शन जाँचें।"
                    : "Sorry, I could not get a response. Please check the backend connection.",
                "assistant"
            );

            setStatus("Connection problem.");

        } finally {

            sendMessageBtn.disabled = false;
            chatInput.focus();
        }
    }


    // =========================================
    // 10. CHAT FORM
    // =========================================

    chatForm.addEventListener("submit", event => {

        event.preventDefault();

        sendQuestion(chatInput.value);
    });


    // Enter to send, Shift + Enter for new line.
    chatInput.addEventListener("keydown", event => {

        if (event.key === "Enter" && !event.shiftKey) {

            event.preventDefault();

            chatForm.requestSubmit();
        }
    });


    // Automatically resize textarea.
    chatInput.addEventListener("input", () => {

        chatInput.style.height = "auto";

        chatInput.style.height =
            chatInput.scrollHeight + "px";
    });


    // =========================================
    // 11. SUGGESTED QUESTIONS
    // =========================================

    if (suggestedQuestions) {

        suggestedQuestions.addEventListener("click", event => {

            const button = event.target.closest("[data-question]");

            if (!button) return;

            const question = button.dataset.question;

            if (question) {
                sendQuestion(question);
            }
        });
    }


    // =========================================
    // 12. MICROPHONE RECORDING
    // =========================================

    let mediaRecorder = null;
    let audioChunks = [];
    let microphoneStream = null;


    async function startRecording() {

        try {

            if (!navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia) {

                throw new Error(
                    "Microphone is not supported by this browser."
                );
            }

            microphoneStream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            audioChunks = [];

            const options = {};

            if (MediaRecorder.isTypeSupported("audio/webm")) {
                options.mimeType = "audio/webm";
            }

            mediaRecorder = new MediaRecorder(
                microphoneStream,
                options
            );

            mediaRecorder.ondataavailable = event => {

                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {

                const audioBlob = new Blob(audioChunks, {
                    type: mediaRecorder.mimeType || "audio/webm"
                });

                microphoneStream
                    .getTracks()
                    .forEach(track => track.stop());

                microphoneStream = null;

                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();

            chatMicBtn.textContent = "⏹";
            chatMicBtn.classList.add("recording");

            setVoiceStatus(
                getLanguage() === "hi"
                    ? "रिकॉर्डिंग शुरू..."
                    : "Recording..."
            );

        } catch (error) {

            console.error("Microphone error:", error);

            setVoiceStatus(
                "Microphone access failed. Check browser permissions."
            );
        }
    }


    function stopRecording() {

        if (mediaRecorder &&
            mediaRecorder.state === "recording") {

            mediaRecorder.stop();
        }

        chatMicBtn.textContent = "🎤";
        chatMicBtn.classList.remove("recording");
    }


    // =========================================
    // 13. AUDIO TRANSCRIPTION
    // =========================================

    async function transcribeAudio(audioBlob) {

        setVoiceStatus(
            getLanguage() === "hi"
                ? "आवाज़ को टेक्स्ट में बदला जा रहा है..."
                : "Transcribing audio..."
        );

        try {

            const formData = new FormData();

            formData.append(
                "file",
                audioBlob,
                "recording.webm"
            );

            formData.append("language", getLanguage());

            const response = await fetch(
                API_BASE + TRANSCRIBE_ENDPOINT,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Transcription error: " + response.status
                );
            }

            const data = await response.json();

            const transcript =
                data.transcription ||
                data.text ||
                data.transcript;

            if (!transcript) {
                throw new Error(
                    "No transcription received."
                );
            }

            // Insert transcription for the user to review.
            chatInput.value = transcript;
            chatInput.focus();

            setVoiceStatus(
                getLanguage() === "hi"
                    ? "टेक्स्ट तैयार है। भेजने से पहले जाँच लें।"
                    : "Transcription ready. Review before sending."
            );

        } catch (error) {

            console.error("DAWAZ transcription error:", error);

            setVoiceStatus(
                getLanguage() === "hi"
                    ? "आवाज़ को टेक्स्ट में नहीं बदला जा सका।"
                    : "Could not transcribe audio."
            );

        } finally {

            chatMicBtn.textContent = "🎤";
            chatMicBtn.classList.remove("recording");
        }
    }


    // =========================================
    // 14. MICROPHONE BUTTON
    // =========================================

    if (chatMicBtn) {

        chatMicBtn.addEventListener("click", () => {

            if (mediaRecorder &&
                mediaRecorder.state === "recording") {

                stopRecording();

            } else {

                startRecording();
            }
        });
    }


    // =========================================
    // 15. LANGUAGE CHANGE
    // =========================================

    window.addEventListener(
        "dawazLanguageChanged",
        () => {

            stopVoice();

            setStatus(
                getLanguage() === "hi"
                    ? "DAWAZ तैयार है"
                    : "DAWAZ is ready"
            );
        }
    );


    // =========================================
    // 16. INITIALIZE
    // =========================================

    setStatus(
        getLanguage() === "hi"
            ? "DAWAZ तैयार है"
            : "DAWAZ is ready"
    );

    console.log("DAWAZ Ask Assistant initialized.");

});



