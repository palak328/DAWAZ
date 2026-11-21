
document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // 1. HTML ELEMENTS
    // =========================================

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const suggestedQuestions = document.getElementById("suggestedQuestions");

    const chatMicBtn = document.getElementById("chatMicBtn");
    const chatStatus = document.getElementById("chatStatus");
    const voiceStatus = document.getElementById("voiceStatus");

    // Supports either of these selector IDs.
    const languageSelector =
        document.getElementById("languageSelect") ||
        document.querySelector("[data-language-selector]");

    // =========================================
    // 2. API ENDPOINTS
    // =========================================

    const API_URL = "/api/assistant/ask";
    const TRANSCRIPTION_API_URL = "/api/assistant/transcribe";

    // =========================================
    // 3. LANGUAGE SETTINGS
    // =========================================

    const LANGUAGE_KEY = "dawazLanguage";

    let currentLanguage =
        localStorage.getItem(LANGUAGE_KEY) || "en";

    const languageText = {
        en: {
            thinking: "DAWAZ is thinking...",
            preparing: "DAWAZ is preparing a response...",
            online: "Online",
            connectionError:
                "I couldn't connect to DAWAZ right now. Please try again later.",
            invalidResponse:
                "DAWAZ did not return a valid response. Please try again.",
            unsupported:
                "Audio recording is not supported in this browser.",
            recording:
                "Recording... Click the microphone again to stop.",
            processing: "Processing your recording...",
            noAudio: "No audio was recorded. Please try again.",
            permission:
                "Microphone permission denied. Allow microphone access in browser settings.",
            microphoneError:
                "Could not access the microphone. Check your device settings.",
            transcriptionComplete:
                "Transcription complete. Review your message and press Send.",
            transcriptionError:
                "Could not transcribe audio. Check the backend connection.",
            speakingUnavailable:
                "Speech is not supported in this browser.",
            languageEnglish: "English",
            languageHindi: "Hindi"
        },

        hi: {
            thinking: "DAWAZ सोच रहा है...",
            preparing: "DAWAZ जवाब तैयार कर रहा है...",
            online: "ऑनलाइन",
            connectionError:
                "अभी DAWAZ से कनेक्ट नहीं हो पाया। कृपया बाद में प्रयास करें।",
            invalidResponse:
                "DAWAZ से सही जवाब नहीं मिला। कृपया दोबारा प्रयास करें।",
            unsupported:
                "इस ब्राउज़र में ऑडियो रिकॉर्डिंग उपलब्ध नहीं है।",
            recording:
                "रिकॉर्डिंग हो रही है... रोकने के लिए माइक्रोफ़ोन फिर दबाएँ।",
            processing: "आपकी रिकॉर्डिंग प्रोसेस हो रही है...",
            noAudio:
                "कोई ऑडियो रिकॉर्ड नहीं हुआ। कृपया दोबारा प्रयास करें।",
            permission:
                "माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में अनुमति दें।",
            microphoneError:
                "माइक्रोफ़ोन इस्तेमाल नहीं हो पाया। अपनी डिवाइस सेटिंग जाँचें।",
            transcriptionComplete:
                "ट्रांसक्रिप्शन पूरा हुआ। अपना संदेश जाँचें और Send दबाएँ।",
            transcriptionError:
                "आवाज़ को टेक्स्ट में नहीं बदला जा सका। बैकएंड कनेक्शन जाँचें।",
            speakingUnavailable:
                "इस ब्राउज़र में टेक्स्ट पढ़कर सुनाने की सुविधा उपलब्ध नहीं है।",
            languageEnglish: "अंग्रेज़ी",
            languageHindi: "हिंदी"
        }
    };

    function getText(key) {
        return languageText[currentLanguage]?.[key] ||
            languageText.en[key] ||
            key;
    }

    function updateLanguage(language) {

        currentLanguage = language === "hi" ? "hi" : "en";

        localStorage.setItem(LANGUAGE_KEY, currentLanguage);

        if (languageSelector) {
            languageSelector.value = currentLanguage;
        }

        if (chatStatus) {
            chatStatus.textContent = getText("online");
        }
    }

    updateLanguage(currentLanguage);

    if (languageSelector) {
        languageSelector.addEventListener("change", () => {
            updateLanguage(languageSelector.value);
        });
    }

    // =========================================
    // 4. VARIABLES
    // =========================================

    let isSending = false;
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let microphoneStream = null;

    let speechEnabled = true;
    let currentUtterance = null;

    // =========================================
    // 5. TEXT-TO-SPEECH
    // =========================================

    function getSpeechLanguage() {
        return currentLanguage === "hi" ? "hi-IN" : "en-IN";
    }

    function speakMessage(message) {

        if (!speechEnabled || !("speechSynthesis" in window)) {
            return;
        }

        window.speechSynthesis.cancel();

        currentUtterance = new SpeechSynthesisUtterance(message);
        currentUtterance.lang = getSpeechLanguage();
        currentUtterance.rate = 0.9;
        currentUtterance.pitch = 1;
        currentUtterance.volume = 1;

        const voices = window.speechSynthesis.getVoices();

        const preferredVoice = voices.find(voice =>
            voice.lang.toLowerCase() === getSpeechLanguage().toLowerCase()
        );

        if (preferredVoice) {
            currentUtterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(currentUtterance);
    }

    function stopSpeaking() {

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        currentUtterance = null;
    }

    // Browser voices may load after the page.
    if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }

    // =========================================
    // 6. DISPLAY CHAT MESSAGE
    // =========================================

    function createMessage(message, sender) {

        const messageElement = document.createElement("div");

        messageElement.classList.add(
            "message",
            sender === "user" ? "user-message" : "assistant-message"
        );

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = message;

        content.appendChild(bubble);

        // Add replay control only to DAWAZ replies.
        if (sender !== "user") {

            const controls = document.createElement("div");
            controls.className = "message-audio-controls";

            const replayButton = document.createElement("button");
            replayButton.type = "button";
            replayButton.className = "message-speak-btn";
            replayButton.textContent = "🔊";
            replayButton.title = "Read this reply aloud";
            replayButton.setAttribute("aria-label", "Read this reply aloud");

            replayButton.addEventListener("click", () => {
                speakMessage(message);
            });

            controls.appendChild(replayButton);
            content.appendChild(controls);

            // Automatically read the assistant's reply.
            speakMessage(message);
        }

        messageElement.appendChild(content);
        chatMessages.appendChild(messageElement);

        scrollToBottom();
    }

    // =========================================
    // 7. STOP SPEECH CONTROL
    // =========================================

    function createSpeechControls() {

        if (document.getElementById("stopSpeechBtn")) {
            return;
        }

        const stopButton = document.createElement("button");

        stopButton.id = "stopSpeechBtn";
        stopButton.type = "button";
        stopButton.className = "stop-speech-btn";
        stopButton.textContent = "⏹ Stop speaking";

        stopButton.addEventListener("click", stopSpeaking);

        if (chatForm && chatForm.parentElement) {
            chatForm.parentElement.insertBefore(
                stopButton,
                chatForm
            );
        }
    }

    createSpeechControls();

    // =========================================
    // 8. SCROLL CHAT
    // =========================================

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // =========================================
    // 9. TYPING INDICATOR
    // =========================================

    function showTypingIndicator() {

        removeTypingIndicator();

        const typing = document.createElement("div");

        typing.id = "typingIndicator";
        typing.className = "message assistant-message";

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble typing-indicator";
        bubble.textContent = getText("thinking");

        content.appendChild(bubble);
        typing.appendChild(content);

        chatMessages.appendChild(typing);

        scrollToBottom();
    }

    function removeTypingIndicator() {

        const indicator = document.getElementById("typingIndicator");

        if (indicator) {
            indicator.remove();
        }
    }

    // =========================================
    // 10. SEND QUESTION TO FASTAPI
    // =========================================

    async function sendQuestion(question) {

        const trimmedQuestion = question.trim();

        if (!trimmedQuestion || isSending) {
            return;
        }

        isSending = true;

        stopSpeaking();

        createMessage(trimmedQuestion, "user");

        chatInput.value = "";
        chatInput.style.height = "auto";

        sendMessageBtn.disabled = true;

        if (chatMicBtn) {
            chatMicBtn.disabled = true;
        }

        if (chatStatus) {
            chatStatus.textContent = getText("preparing");
        }

        showTypingIndicator();

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: trimmedQuestion,
                    language: currentLanguage
                })

            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            removeTypingIndicator();

            if (
                typeof data.answer === "string" &&
                data.answer.trim()
            ) {

                createMessage(data.answer.trim(), "assistant");

            } else {

                throw new Error("Invalid response from assistant.");
            }

        } catch (error) {

            console.error("Assistant error:", error);

            removeTypingIndicator();

            createMessage(
                getText("connectionError"),
                "assistant"
            );

        } finally {

            isSending = false;

            sendMessageBtn.disabled = false;

            if (chatMicBtn) {
                chatMicBtn.disabled = false;
            }

            if (chatStatus) {
                chatStatus.textContent = getText("online");
            }

            chatInput.focus();
        }
    }

    // =========================================
    // 11. CHAT FORM
    // =========================================

    chatForm.addEventListener("submit", (event) => {

        event.preventDefault();

        if (isRecording) {
            return;
        }

        sendQuestion(chatInput.value);
    });

    // =========================================
    // 12. ENTER TO SEND
    // =========================================

    chatInput.addEventListener("keydown", (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            if (!isSending && !isRecording) {
                chatForm.requestSubmit();
            }
        }
    });

    // =========================================
    // 13. TEXTAREA AUTO RESIZE
    // =========================================

    chatInput.addEventListener("input", () => {

        chatInput.style.height = "auto";

        chatInput.style.height =
            Math.min(chatInput.scrollHeight, 120) + "px";
    });

    // =========================================
    // 14. SUGGESTED QUESTIONS
    // =========================================

    if (suggestedQuestions) {

        suggestedQuestions.addEventListener("click", (event) => {

            const button = event.target.closest("[data-question]");

            if (!button || isSending || isRecording) {
                return;
            }

            const question = button.dataset.question;

            if (question) {
                sendQuestion(question);
            }
        });
    }

    // =========================================
    // 15. AUDIO FORMAT
    // =========================================

    function getSupportedAudioType() {

        if (!window.MediaRecorder) {
            return "";
        }

        const formats = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4"
        ];

        return formats.find(type =>
            MediaRecorder.isTypeSupported(type)
        ) || "";
    }

    // =========================================
    // 16. START AUDIO RECORDING
    // =========================================

    async function startRecording() {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia ||
            !window.MediaRecorder
        ) {

            if (voiceStatus) {
                voiceStatus.textContent = getText("unsupported");
            }

            return;
        }

        try {

            microphoneStream =
                await navigator.mediaDevices.getUserMedia({
                    audio: true
                });

            audioChunks = [];

            const audioType = getSupportedAudioType();

            mediaRecorder = audioType
                ? new MediaRecorder(microphoneStream, {
                    mimeType: audioType
                })
                : new MediaRecorder(microphoneStream);

            mediaRecorder.ondataavailable = (event) => {

                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {

                const audioBlob = new Blob(audioChunks, {
                    type: mediaRecorder.mimeType || "audio/webm"
                });

                stopMicrophoneStream();

                if (audioBlob.size === 0) {

                    if (voiceStatus) {
                        voiceStatus.textContent = getText("noAudio");
                    }

                    if (chatMicBtn) {
                        chatMicBtn.disabled = false;
                    }

                    return;
                }

                await transcribeAudio(audioBlob);
            };

            mediaRecorder.start();

            isRecording = true;

            if (chatMicBtn) {
                chatMicBtn.textContent = "⏹";
                chatMicBtn.classList.add("recording");
                chatMicBtn.title = "Stop recording";
            }

            if (voiceStatus) {
                voiceStatus.textContent = getText("recording");
            }

        } catch (error) {

            console.error("Microphone error:", error);

            stopMicrophoneStream();

            if (voiceStatus) {

                voiceStatus.textContent =
                    error.name === "NotAllowedError"
                        ? getText("permission")
                        : getText("microphoneError");
            }
        }
    }

    // =========================================
    // 17. STOP AUDIO RECORDING
    // =========================================

    function stopRecording() {

        if (!mediaRecorder || mediaRecorder.state !== "recording") {
            return;
        }

        isRecording = false;

        if (chatMicBtn) {
            chatMicBtn.disabled = true;
        }

        if (voiceStatus) {
            voiceStatus.textContent = getText("processing");
        }

        mediaRecorder.stop();

        if (chatMicBtn) {
            chatMicBtn.textContent = "🎙";
            chatMicBtn.classList.remove("recording");
            chatMicBtn.title = "Record voice";
        }
    }

    // =========================================
    // 18. RELEASE MICROPHONE
    // =========================================

    function stopMicrophoneStream() {

        if (microphoneStream) {

            microphoneStream.getTracks().forEach(track => {
                track.stop();
            });

            microphoneStream = null;
        }
    }

    // =========================================
    // 19. SEND AUDIO TO FASTAPI
    // =========================================

    async function transcribeAudio(audioBlob) {

        const formData = new FormData();

        const extension = audioBlob.type.includes("mp4")
            ? "mp4"
            : "webm";

        const audioFile = new File(
            [audioBlob],
            `dawaz-recording.${extension}`,
            { type: audioBlob.type }
        );

        formData.append("file", audioFile);

        // Tell the backend which language to transcribe.
        formData.append("language", currentLanguage);

        try {

            const response = await fetch(
                TRANSCRIPTION_API_URL,
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Transcription server error: ${response.status}`
                );
            }

            const data = await response.json();

            if (
                !data.text ||
                typeof data.text !== "string"
            ) {
                throw new Error("Transcription text was not received.");
            }

            chatInput.value = data.text.trim();

            chatInput.style.height = "auto";

            chatInput.style.height =
                Math.min(chatInput.scrollHeight, 120) + "px";

            if (voiceStatus) {
                voiceStatus.textContent =
                    getText("transcriptionComplete");
            }

            chatInput.focus();

        } catch (error) {

            console.error("Transcription error:", error);

            if (voiceStatus) {
                voiceStatus.textContent =
                    getText("transcriptionError");
            }

        } finally {

            stopMicrophoneStream();

            if (chatMicBtn) {
                chatMicBtn.disabled = false;
            }

            if (sendMessageBtn) {
                sendMessageBtn.disabled = false;
            }
        }
    }

    // =========================================
    // 20. MICROPHONE BUTTON
    // =========================================

    if (chatMicBtn) {

        chatMicBtn.addEventListener("click", () => {

            if (isSending) {
                return;
            }

            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }

    // =========================================
    // 21. PAGE CLEANUP
    // =========================================

    window.addEventListener("beforeunload", () => {

        stopSpeaking();

        if (
            mediaRecorder &&
            mediaRecorder.state === "recording"
        ) {
            mediaRecorder.stop();
        }

        stopMicrophoneStream();
    });

});

