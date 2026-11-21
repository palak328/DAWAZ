
document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // ELEMENTS
    // ==============================

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    const suggestedQuestions = document.getElementById("suggestedQuestions");

    // Backend endpoint
    const API_URL = "/api/assistant/ask";

    let isWaitingForResponse = false;


    // ==============================
    // CREATE MESSAGE
    // ==============================

    function createMessage(message, sender) {

        const messageWrapper = document.createElement("div");

        messageWrapper.className =
            sender === "user"
                ? "message user-message"
                : "message assistant-message";

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";

        avatar.textContent =
            sender === "user" ? "P" : "💊";

        const content = document.createElement("div");
        content.className = "message-content";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        const paragraph = document.createElement("p");

        // Use textContent to prevent HTML injection.
        paragraph.textContent = message;

        bubble.appendChild(paragraph);

        const time = document.createElement("span");
        time.className = "message-time";

        time.textContent =
            sender === "user" ? "You" : "DAWAZ Assistant";

        content.appendChild(bubble);
        content.appendChild(time);

        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);

        chatMessages.appendChild(messageWrapper);

        scrollToBottom();
    }


    // ==============================
    // SCROLL TO LATEST MESSAGE
    // ==============================

    function scrollToBottom() {

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }


    // ==============================
    // TYPING INDICATOR
    // ==============================

    function showTypingIndicator() {

        const typingWrapper = document.createElement("div");

        typingWrapper.className =
            "message assistant-message";

        typingWrapper.id = "typingIndicator";

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "💊";

        const indicator = document.createElement("div");

        indicator.className = "typing-indicator";

        for (let i = 0; i < 3; i++) {

            const dot = document.createElement("span");

            indicator.appendChild(dot);
        }

        typingWrapper.appendChild(avatar);
        typingWrapper.appendChild(indicator);

        chatMessages.appendChild(typingWrapper);

        scrollToBottom();
    }


    // ==============================
    // REMOVE TYPING INDICATOR
    // ==============================

    function removeTypingIndicator() {

        const indicator =
            document.getElementById("typingIndicator");

        if (indicator) {
            indicator.remove();
        }
    }


    // ==============================
    // SEND QUESTION TO BACKEND
    // ==============================

    async function sendQuestion(question) {

        if (isWaitingForResponse) return;

        const cleanQuestion = question.trim();

        if (!cleanQuestion) return;

        if (cleanQuestion.length > 1000) {

            createMessage(
                "Your question is too long. Please keep it within 1000 characters.",
                "assistant"
            );

            return;
        }

        // Display patient's message.
        createMessage(cleanQuestion, "user");

        chatInput.value = "";

        chatInput.style.height = "auto";

        isWaitingForResponse = true;

        sendMessageBtn.disabled = true;

        showTypingIndicator();

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: cleanQuestion
                })

            });


            // Check whether the backend returned a successful response.
            if (!response.ok) {

                throw new Error(
                    `Server error: ${response.status}`
                );
            }

            const data = await response.json();

            removeTypingIndicator();

            if (
                !data ||
                typeof data.answer !== "string" ||
                !data.answer.trim()
            ) {

                throw new Error("Invalid response from server.");
            }

            createMessage(data.answer, "assistant");


        } catch (error) {

            removeTypingIndicator();

            console.error("DAWAZ Assistant Error:", error);

            createMessage(
                "I'm unable to connect to the DAWAZ assistant right now. Please try again later. For medicine instructions or dosage questions, contact your doctor or pharmacist.",
                "assistant"
            );

        } finally {

            isWaitingForResponse = false;

            sendMessageBtn.disabled = false;

            chatInput.focus();
        }
    }


    // ==============================
    // FORM SUBMISSION
    // ==============================

    chatForm.addEventListener("submit", (event) => {

        event.preventDefault();

        if (isWaitingForResponse) return;

        const question = chatInput.value.trim();

        sendQuestion(question);
    });


    // ==============================
    // ENTER TO SEND
    // SHIFT + ENTER FOR NEW LINE
    // ==============================

    chatInput.addEventListener("keydown", (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.isComposing
        ) {

            event.preventDefault();

            chatForm.requestSubmit();
        }

    });


    // ==============================
    // AUTO-RESIZE TEXTAREA
    // ==============================

    chatInput.addEventListener("input", () => {

        chatInput.style.height = "auto";

        chatInput.style.height =
            Math.min(chatInput.scrollHeight, 130) + "px";

    });


    // ==============================
    // SUGGESTED QUESTIONS
    // ==============================

    suggestedQuestions.addEventListener("click", (event) => {

        const button = event.target.closest(".suggestion-btn");

        if (!button || isWaitingForResponse) return;

        const question = button.dataset.question;

        if (!question) return;

        sendQuestion(question);
    });


    // ==============================
    // INITIAL STATE
    // ==============================

    chatInput.focus();

});
