
// ============================================
// DAWAZ - SMART MEDICINE SCANNER
// ============================================


// ============================================
// 1. GET HTML ELEMENTS
// ============================================

// Camera elements

const cameraArea = document.getElementById("cameraArea");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const cameraPreview = document.getElementById("cameraPreview");
const captureCanvas = document.getElementById("captureCanvas");
const scanFrame = document.getElementById("scanFrame");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");

// Image elements

const medicineImage = document.getElementById("medicineImage");
const fileName = document.getElementById("fileName");

const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

// Scan elements

const scanMedicineBtn = document.getElementById("scanMedicineBtn");
const scanMessage = document.getElementById("scanMessage");

const resultCard = document.getElementById("resultCard");
const resultContent = document.getElementById("resultContent");

// Clarification elements

const clarificationCard = document.getElementById("clarificationCard");
const clarificationQuestions = document.getElementById("clarificationQuestions");

const additionalMedicineInfo = document.getElementById("additionalMedicineInfo");

const submitClarificationBtn = document.getElementById("submitClarificationBtn");
const clarificationMessage = document.getElementById("clarificationMessage");

const retakeScanBtn = document.getElementById("retakeScanBtn");

// Chat elements

const medicineChatCard = document.getElementById("medicineChatCard");
const chatStatus = document.getElementById("chatStatus");
const chatMessages = document.getElementById("chatMessages");

const medicineChatForm = document.getElementById("medicineChatForm");
const medicineChatInput = document.getElementById("medicineChatInput");

const chatMicBtn = document.getElementById("chatMicBtn");
const sendChatBtn = document.getElementById("sendChatBtn");

const chatVoiceStatus = document.getElementById("chatVoiceStatus");


// ============================================
// 2. CONFIGURATION AND VARIABLES
// ============================================

const API_URL = "/api/medicines/identify";
const CHAT_API_URL = "/api/medicines/ask";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

let cameraStream = null;

let selectedImage = null;
let imageObjectURL = null;

let isScanning = false;
let isSubmittingClarification = false;
let isSendingMessage = false;

let currentQuestions = [];
let currentScanResult = null;

let chatHistory = [];

let speechRecognition = null;

let isChatStarted = false;


// ============================================
// 3. DISPLAY SCAN MESSAGE
// ============================================

function showMessage(message, type = "info") {

    scanMessage.textContent = message;

    if (type === "error") {

        scanMessage.style.color = "#C34E42";

    } else if (type === "success") {

        scanMessage.style.color = "#0B6E6E";

    } else {

        scanMessage.style.color = "#687873";
    }
}


// ============================================
// 4. DISPLAY CLARIFICATION MESSAGE
// ============================================

function showClarificationMessage(message, type = "info") {

    clarificationMessage.textContent = message;

    if (type === "error") {

        clarificationMessage.style.color = "#C34E42";

    } else if (type === "success") {

        clarificationMessage.style.color = "#0B6E6E";

    } else {

        clarificationMessage.style.color = "#687873";
    }
}


// ============================================
// 5. STOP CAMERA
// ============================================

function stopCamera() {

    if (cameraStream) {

        cameraStream.getTracks().forEach(function (track) {

            track.stop();

        });

        cameraStream = null;
    }

    cameraPreview.srcObject = null;

    captureBtn.disabled = true;

    startCameraBtn.disabled = false;
}


// ============================================
// 6. RESET RESULT
// ============================================

function resetResult() {

    resultCard.hidden = true;

    resultContent.replaceChildren();

    currentScanResult = null;
}


// ============================================
// 7. RESET CLARIFICATION
// ============================================

function resetClarification() {

    clarificationCard.hidden = true;

    clarificationQuestions.replaceChildren();

    additionalMedicineInfo.value = "";

    currentQuestions = [];

    submitClarificationBtn.disabled = false;

    submitClarificationBtn.textContent = "Submit Answers";

    showClarificationMessage("");
}


// ============================================
// 8. RESET CHAT
// ============================================

function resetMedicineChat() {

    medicineChatCard.hidden = true;

    chatMessages.replaceChildren();

    chatHistory = [];

    isChatStarted = false;

    medicineChatInput.value = "";

    chatStatus.textContent =
        "DAWAZ will ask relevant follow-up questions after the scan.";

    chatVoiceStatus.textContent = "";

    if (speechRecognition) {

        speechRecognition.stop();

        speechRecognition = null;
    }

    chatMicBtn.classList.remove("recording");
}


// ============================================
// 9. RESET IMAGE
// ============================================

function resetImage() {

    selectedImage = null;

    if (imageObjectURL) {

        URL.revokeObjectURL(imageObjectURL);

        imageObjectURL = null;
    }

    imagePreview.removeAttribute("src");

    imagePreviewContainer.hidden = true;

    scanMedicineBtn.disabled = true;

    medicineImage.value = "";

    fileName.textContent = "";

    resetResult();

    resetClarification();

    resetMedicineChat();

    showMessage("Select or capture a medicine image to begin.");
}


// ============================================
// 10. DISPLAY IMAGE PREVIEW
// ============================================

function displayImage(file) {

    if (!file) {
        return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {

        showMessage(
            "Unsupported image. Please select JPG, PNG or WEBP.",
            "error"
        );

        return;
    }

    if (file.size > MAX_FILE_SIZE) {

        showMessage(
            "Image size must be less than 10 MB.",
            "error"
        );

        return;
    }

    if (imageObjectURL) {

        URL.revokeObjectURL(imageObjectURL);
    }

    selectedImage = file;

    imageObjectURL = URL.createObjectURL(file);

    imagePreview.src = imageObjectURL;

    imagePreviewContainer.hidden = false;

    scanMedicineBtn.disabled = false;

    fileName.textContent =
        file.name || "Captured medicine image";

    resetResult();

    resetClarification();

    resetMedicineChat();

    showMessage("Image selected successfully.", "success");
}


// ============================================
// 11. START CAMERA
// ============================================

startCameraBtn.addEventListener("click", async function () {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        showMessage(
            "Camera access is not supported by this browser.",
            "error"
        );

        return;
    }

    try {

        stopCamera();

        cameraStream = await navigator.mediaDevices.getUserMedia({

            video: {
                facingMode: {
                    ideal: "environment"
                }
            },

            audio: false

        });

        cameraPreview.srcObject = cameraStream;

        await cameraPreview.play();

        cameraPreview.hidden = false;

        cameraPlaceholder.hidden = true;

        scanFrame.hidden = false;

        captureBtn.disabled = false;

        startCameraBtn.disabled = true;

        showMessage(
            "Camera is ready. Position the medicine clearly."
        );

    } catch (error) {

        console.error("Camera error:", error);

        showMessage(
            "Unable to access camera. Allow camera permission or upload an image instead.",
            "error"
        );
    }
});


// ============================================
// 12. CAPTURE IMAGE
// ============================================

captureBtn.addEventListener("click", function () {

    if (!cameraStream) {

        showMessage("Start the camera first.", "error");

        return;
    }

    const width = cameraPreview.videoWidth;
    const height = cameraPreview.videoHeight;

    if (!width || !height) {

        showMessage(
            "Camera is not ready. Please wait a moment.",
            "error"
        );

        return;
    }

    captureCanvas.width = width;

    captureCanvas.height = height;

    const context = captureCanvas.getContext("2d");

    context.drawImage(
        cameraPreview,
        0,
        0,
        width,
        height
    );

    captureCanvas.toBlob(function (blob) {

        if (!blob) {

            showMessage(
                "Unable to capture image.",
                "error"
            );

            return;
        }

        const capturedFile = new File(

            [blob],

            `medicine-scan-${Date.now()}.jpg`,

            {
                type: "image/jpeg"
            }

        );

        displayImage(capturedFile);

        stopCamera();

        cameraPreview.hidden = true;

        cameraPlaceholder.hidden = false;

        scanFrame.hidden = true;

    }, "image/jpeg", 0.9);
});


// ============================================
// 13. UPLOAD IMAGE
// ============================================

medicineImage.addEventListener("change", function () {

    const file = medicineImage.files[0];

    if (!file) {
        return;
    }

    displayImage(file);
});


// ============================================
// 14. REMOVE IMAGE
// ============================================

removeImageBtn.addEventListener("click", function () {

    resetImage();

});


// ============================================
// 15. DISPLAY IDENTIFICATION RESULT
// ============================================

function displayResult(data) {

    resultCard.hidden = false;

    resultContent.replaceChildren();

    const status = data.status;

    const medicine = data.medicine || {};

    currentScanResult = data;

    let statusTitle = "";
    let statusDescription = "";
    let statusClass = "";

    if (status === "matched") {

        statusTitle = "Medicine matched with prescription";

        statusDescription =
            "The identified medicine matches a confirmed prescription record.";

        statusClass = "matched";

    } else if (status === "not_found") {

        statusTitle = "Medicine not found in prescription";

        statusDescription =
            "This medicine was not found in the confirmed prescription.";

        statusClass = "not-found";

    } else if (status === "uncertain") {

        statusTitle = "Unable to identify medicine confidently";

        statusDescription =
            "More information is needed. Please answer the clarification questions below.";

        statusClass = "uncertain";

    } else {

        statusTitle = "Result unavailable";

        statusDescription =
            "The server returned an unrecognised result.";

        statusClass = "uncertain";
    }

    const statusBox = document.createElement("div");

    statusBox.className = `result-status ${statusClass}`;

    const heading = document.createElement("h3");

    heading.textContent = statusTitle;

    const description = document.createElement("p");

    description.textContent = statusDescription;

    statusBox.append(heading, description);

    resultContent.appendChild(statusBox);

    if (medicine.name) {

        const name = document.createElement("p");

        name.textContent = `Medicine: ${medicine.name}`;

        resultContent.appendChild(name);
    }

    if (medicine.strength) {

        const strength = document.createElement("p");

        strength.textContent = `Strength: ${medicine.strength}`;

        resultContent.appendChild(strength);
    }

    // Uncertain result: show clarification only.

    if (status === "uncertain") {

        resetMedicineChat();

        const questions =
            data.questions ||
            data.clarificationQuestions ||
            [];

        if (questions.length > 0) {

            displayClarificationQuestions(questions);

        } else {

            clarificationCard.hidden = true;

            const note = document.createElement("p");

            note.textContent =
                "The system could not generate clarification questions. Please capture a clearer image or consult a pharmacist.";

            resultContent.appendChild(note);
        }

        return;
    }

    resetClarification();

    // Start chat only for an identification result
    // that the backend has classified.

    if (status === "matched" || status === "not_found") {

        startMedicineConversation();

    } else {

        resetMedicineChat();
    }
}


// ============================================
// 16. DISPLAY CLARIFICATION QUESTIONS
// ============================================

function displayClarificationQuestions(questions) {

    clarificationQuestions.replaceChildren();

    currentQuestions = questions;

    questions.forEach(function (item, index) {

        const questionText =
            typeof item === "string"
                ? item
                : item.question;

        if (!questionText ||
            typeof questionText !== "string") {

            return;
        }

        const questionGroup = document.createElement("div");

        questionGroup.className = "clarification-question";

        const label = document.createElement("label");

        const inputId = `clarificationAnswer${index}`;

        label.htmlFor = inputId;

        label.textContent = questionText;

        const answerInput = document.createElement("input");

        answerInput.type = "text";

        answerInput.id = inputId;

        answerInput.className = "clarification-answer";

        answerInput.placeholder = "Enter your answer";

        answerInput.autocomplete = "off";

        answerInput.dataset.questionIndex = index;

        questionGroup.append(label, answerInput);

        clarificationQuestions.appendChild(questionGroup);

    });

    if (clarificationQuestions.children.length === 0) {

        showClarificationMessage(
            "No usable clarification questions were received.",
            "error"
        );

        return;
    }

    clarificationCard.hidden = false;

    showClarificationMessage(
        "Please answer the questions using information visible on the medicine packaging."
    );

    clarificationCard.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });
}


// ============================================
// 17. SUBMIT CLARIFICATION ANSWERS
// ============================================

submitClarificationBtn.addEventListener("click", async function () {

    if (!selectedImage) {

        showClarificationMessage(
            "The original image is missing. Please scan the medicine again.",
            "error"
        );

        return;
    }

    if (isSubmittingClarification) {
        return;
    }

    const answerInputs =
        clarificationQuestions.querySelectorAll(
            ".clarification-answer"
        );

    const answers = [];

    answerInputs.forEach(function (input) {

        const index = Number(input.dataset.questionIndex);

        const question = currentQuestions[index];

        const questionText =
            typeof question === "string"
                ? question
                : question.question;

        answers.push({

            question: questionText,

            answer: input.value.trim()

        });

    });

    const hasMissingAnswer = answers.some(function (item) {

        return !item.answer;

    });

    if (hasMissingAnswer) {

        showClarificationMessage(
            "Please answer every question before submitting.",
            "error"
        );

        return;
    }

    isSubmittingClarification = true;

    submitClarificationBtn.disabled = true;

    submitClarificationBtn.textContent = "Rechecking...";

    showClarificationMessage(
        "Sending your answers and original image for re-evaluation..."
    );

    try {

        const formData = new FormData();

        formData.append("image", selectedImage);

        formData.append(
            "answers",
            JSON.stringify(answers)
        );

        formData.append(
            "additionalInfo",
            additionalMedicineInfo.value.trim()
        );

        const response = await fetch(API_URL, {

            method: "POST",

            body: formData

        });

        if (!response.ok) {

            throw new Error(
                `Server returned status ${response.status}`
            );
        }

        const result = await response.json();

        displayResult(result);

        if (result.status === "uncertain") {

            showMessage(
                "The medicine is still uncertain. Do not rely on a guessed identification.",
                "info"
            );

            showClarificationMessage(
                "The system still needs more reliable information. Please check the packaging or consult a pharmacist."
            );

        } else {

            showMessage(
                "Medicine re-evaluation response received.",
                "success"
            );
        }

    } catch (error) {

        console.error(
            "Clarification submission error:",
            error
        );

        showClarificationMessage(
            "Unable to recheck the medicine. Check the backend connection and try again.",
            "error"
        );

    } finally {

        isSubmittingClarification = false;

        submitClarificationBtn.disabled = false;

        submitClarificationBtn.textContent = "Submit Answers";
    }
});


// ============================================
// 18. RETAKE SCAN
// ============================================

retakeScanBtn.addEventListener("click", function () {

    resetImage();

    showMessage(
        "Capture or upload a clearer medicine image."
    );

    cameraArea.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });
});


// ============================================
// 19. SCAN MEDICINE
// ============================================

scanMedicineBtn.addEventListener("click", async function () {

    if (!selectedImage) {

        showMessage(
            "Please capture or upload a medicine image first.",
            "error"
        );

        return;
    }

    if (isScanning) {
        return;
    }

    isScanning = true;

    scanMedicineBtn.disabled = true;

    scanMedicineBtn.textContent = "Identifying...";

    resetResult();

    resetClarification();

    resetMedicineChat();

    showMessage(
        "Sending image for medicine identification..."
    );

    try {

        const formData = new FormData();

        formData.append("image", selectedImage);

        const response = await fetch(API_URL, {

            method: "POST",

            body: formData

        });

        if (!response.ok) {

            throw new Error(
                `Server returned status ${response.status}`
            );
        }

        const result = await response.json();

        displayResult(result);

        showMessage(
            "Medicine identification response received.",
            "success"
        );

    } catch (error) {

        console.error(
            "Medicine scanning error:",
            error
        );

        showMessage(
            "Medicine recognition is currently unavailable. Check the backend connection and try again.",
            "error"
        );

    } finally {

        isScanning = false;

        scanMedicineBtn.disabled = !selectedImage;

        scanMedicineBtn.textContent = "Identify Medicine";
    }
});


// ============================================
// 20. ADD CHAT MESSAGE
// ============================================

function addChatMessage(message, sender) {

    const messageElement = document.createElement("div");

    messageElement.className =
        sender === "user"
            ? "chat-message user-message"
            : "chat-message assistant-message";

    const paragraph = document.createElement("p");

    paragraph.textContent = message;

    messageElement.appendChild(paragraph);

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// ============================================
// 21. CHAT LOADING INDICATOR
// ============================================

function showChatLoading() {

    const loading = document.createElement("div");

    loading.id = "chatLoading";

    loading.className = "chat-typing";

    loading.textContent = "DAWAZ is thinking...";

    chatMessages.appendChild(loading);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function hideChatLoading() {

    const loading = document.getElementById("chatLoading");

    if (loading) {

        loading.remove();
    }
}


// ============================================
// 22. SEND MESSAGE TO DAWAZ
// ============================================

async function sendMessageToDAWAZ(message, mode = "message") {

    if (isSendingMessage) {
        return;
    }

    if (!selectedImage || !currentScanResult) {

        chatStatus.textContent =
            "Please complete a medicine scan before starting the conversation.";

        return;
    }

    isSendingMessage = true;

    sendChatBtn.disabled = true;

    chatMicBtn.disabled = true;

    showChatLoading();

    try {

        const formData = new FormData();

        formData.append("image", selectedImage);

        formData.append("mode", mode);

        formData.append("question", message);

        formData.append(
            "scanResult",
            JSON.stringify(currentScanResult)
        );

        formData.append(
            "conversation",
            JSON.stringify(chatHistory)
        );

        const response = await fetch(CHAT_API_URL, {

            method: "POST",

            body: formData

        });

        if (!response.ok) {

            throw new Error(
                `Chat server returned status ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.reply || typeof data.reply !== "string") {

            throw new Error(
                "The backend returned an invalid chat response."
            );
        }

        hideChatLoading();

        addChatMessage(data.reply, "assistant");

        chatHistory.push({

            role: "assistant",

            content: data.reply

        });

        chatStatus.textContent =
            "DAWAZ is ready to help.";

    } catch (error) {

        hideChatLoading();

        console.error(
            "DAWAZ chat error:",
            error
        );

        addChatMessage(
            "I couldn't connect to the medicine assistant. Please try again later.",
            "assistant"
        );

        chatStatus.textContent =
            "Chat service is currently unavailable.";

    } finally {

        isSendingMessage = false;

        sendChatBtn.disabled = false;

        chatMicBtn.disabled = false;
    }
}


// ============================================
// 23. START AUTOMATIC DAWAZ CONVERSATION
// ============================================

async function startMedicineConversation() {

    medicineChatCard.hidden = false;

    chatMessages.replaceChildren();

    chatHistory = [];

    isChatStarted = true;

    chatStatus.textContent =
        "DAWAZ is preparing a question about your scanned medicine.";

    medicineChatCard.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

    await sendMessageToDAWAZ("", "start");
}


// ============================================
// 24. PATIENT TYPES A MESSAGE
// ============================================

medicineChatForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const message = medicineChatInput.value.trim();

    if (!message || isSendingMessage) {
        return;
    }

    addChatMessage(message, "user");

    chatHistory.push({

        role: "user",

        content: message

    });

    medicineChatInput.value = "";

    await sendMessageToDAWAZ(message, "message");
});


// ============================================
// 25. SPEECH TO TEXT
// ============================================

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        chatMicBtn.disabled = true;

        chatMicBtn.title =
            "Speech recognition is not supported by this browser.";

        chatVoiceStatus.textContent =
            "Voice input is not supported. Please type your question.";

        return;
    }

    chatMicBtn.addEventListener("click", function () {

        if (speechRecognition) {

            speechRecognition.stop();

            speechRecognition = null;

            chatMicBtn.classList.remove("recording");

            chatVoiceStatus.textContent =
                "Voice input stopped.";

            return;
        }

        speechRecognition = new SpeechRecognition();

        speechRecognition.lang = "en-IN";

        speechRecognition.continuous = false;

        speechRecognition.interimResults = false;

        speechRecognition.onstart = function () {

            chatMicBtn.classList.add("recording");

            chatVoiceStatus.textContent =
                "Listening... Speak your question.";

        };

        speechRecognition.onresult = function (event) {

            const transcript =
                event.results[0][0].transcript;

            medicineChatInput.value =
                medicineChatInput.value.trim()
                    ? medicineChatInput.value + " " + transcript
                    : transcript;

            chatVoiceStatus.textContent =
                "Speech converted to text. Review it before sending.";

        };

        speechRecognition.onerror = function (event) {

            console.error(
                "Speech recognition error:",
                event.error
            );

            chatVoiceStatus.textContent =
                "Unable to recognise speech. You can type your question instead.";

        };

        speechRecognition.onend = function () {

            chatMicBtn.classList.remove("recording");

            speechRecognition = null;

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

            chatVoiceStatus.textContent =
                "Unable to start the microphone. Check browser permissions.";
        }

    });
}


// ============================================
// 26. INITIALISE SPEECH RECOGNITION
// ============================================

setupSpeechRecognition();


// ============================================
// 27. CLEAN UP WHEN LEAVING PAGE
// ============================================

window.addEventListener("beforeunload", function () {

    stopCamera();

    if (imageObjectURL) {

        URL.revokeObjectURL(imageObjectURL);
    }

    if (speechRecognition) {

        speechRecognition.stop();

        speechRecognition = null;
    }
});



