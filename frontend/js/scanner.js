
// ============================================
// DAWAZ - SMART MEDICINE SCANNER
// ENGLISH / HINDI LANGUAGE SUPPORT
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
// 3. TRANSLATIONS
// ============================================

const scannerTranslations = {

    en: {

        selectImage: "Select or capture a medicine image to begin.",
        cameraUnsupported: "Camera access is not supported by this browser.",
        cameraReady: "Camera is ready. Position the medicine clearly.",
        cameraError: "Unable to access camera. Allow camera permission or upload an image instead.",
        startCameraFirst: "Start the camera first.",
        cameraNotReady: "Camera is not ready. Please wait a moment.",
        captureError: "Unable to capture image.",
        unsupportedImage: "Unsupported image. Please select JPG, PNG or WEBP.",
        imageTooLarge: "Image size must be less than 10 MB.",
        capturedImage: "Captured medicine image",
        imageSelected: "Image selected successfully.",
        identify: "Identify Medicine",
        identifying: "Identifying...",
        submitAnswers: "Submit Answers",
        rechecking: "Rechecking...",
        noImage: "The original image is missing. Please scan the medicine again.",
        answerEveryQuestion: "Please answer every question before submitting.",
        sendingAnswers: "Sending your answers and original image for re-evaluation...",
        stillUncertain: "The medicine is still uncertain. Do not rely on a guessed identification.",
        moreInformation: "The system still needs more reliable information. Please check the packaging or consult a pharmacist.",
        recheckSuccess: "Medicine re-evaluation response received.",
        recheckError: "Unable to recheck the medicine. Check the backend connection and try again.",
        matchedTitle: "Medicine matched with prescription",
        matchedDescription: "The identified medicine matches a confirmed prescription record.",
        notFoundTitle: "Medicine not found in prescription",
        notFoundDescription: "This medicine was not found in the confirmed prescription.",
        uncertainTitle: "Unable to identify medicine confidently",
        uncertainDescription: "More information is needed. Please answer the clarification questions below.",
        unavailableTitle: "Result unavailable",
        unknownStatus: "The server returned an unrecognised result.",
        medicine: "Medicine",
        strength: "Strength",
        clarificationUnavailable: "The system could not generate clarification questions. Please capture a clearer image or consult a pharmacist.",
        noQuestions: "No usable clarification questions were received.",
        enterAnswer: "Enter your answer",
        clarificationInstructions: "Please answer the questions using information visible on the medicine packaging.",
        scanAgain: "Capture or upload a clearer medicine image.",
        scanFirst: "Please capture or upload a medicine image first.",
        sendingImage: "Sending image for medicine identification...",
        scanSuccess: "Medicine identification response received.",
        scanError: "Medicine recognition is currently unavailable. Check the backend connection and try again.",
        chatPreparing: "DAWAZ will ask relevant follow-up questions after the scan.",
        chatScanRequired: "Please complete a medicine scan before starting the conversation.",
        thinking: "DAWAZ is thinking...",
        chatReady: "DAWAZ is ready to help.",
        chatError: "I couldn't connect to the medicine assistant. Please try again later.",
        chatUnavailable: "Chat service is currently unavailable.",
        conversationPreparing: "DAWAZ is preparing a question about your scanned medicine.",
        speechUnsupported: "Speech recognition is not supported. Please type your question.",
        voiceUnsupportedTitle: "Speech recognition is not supported by this browser.",
        listening: "Listening... Speak your question.",
        speechConverted: "Speech converted to text. Review it before sending.",
        speechError: "Unable to recognise speech. You can type your question instead.",
        voiceStopped: "Voice input stopped.",
        microphoneError: "Unable to start the microphone. Check browser permissions.",
        microphoneStartError: "Unable to start the microphone. Check browser permissions.",
        browserVoiceUnavailable: "Voice input is not supported. Please type your question.",
        medicineLabel: "Medicine",
        strengthLabel: "Strength"
    },

    hi: {

        selectImage: "शुरू करने के लिए दवा की तस्वीर चुनें या कैमरे से खींचें।",
        cameraUnsupported: "इस ब्राउज़र में कैमरा उपलब्ध नहीं है।",
        cameraReady: "कैमरा तैयार है। दवा को साफ़ तरीके से फ्रेम में रखें।",
        cameraError: "कैमरा चालू नहीं हो सका। कैमरे की अनुमति दें या तस्वीर अपलोड करें।",
        startCameraFirst: "पहले कैमरा चालू करें।",
        cameraNotReady: "कैमरा अभी तैयार नहीं है। कृपया कुछ समय प्रतीक्षा करें।",
        captureError: "तस्वीर नहीं खींची जा सकी।",
        unsupportedImage: "यह तस्वीर समर्थित नहीं है। कृपया JPG, PNG या WEBP चुनें।",
        imageTooLarge: "तस्वीर का आकार 10 MB से कम होना चाहिए।",
        capturedImage: "कैमरे से ली गई दवा की तस्वीर",
        imageSelected: "तस्वीर सफलतापूर्वक चुन ली गई है।",
        identify: "दवा की पहचान करें",
        identifying: "पहचान की जा रही है...",
        submitAnswers: "जवाब सबमिट करें",
        rechecking: "दोबारा जाँच हो रही है...",
        noImage: "मूल तस्वीर उपलब्ध नहीं है। कृपया दवा को दोबारा स्कैन करें।",
        answerEveryQuestion: "सबमिट करने से पहले सभी सवालों के जवाब दें।",
        sendingAnswers: "आपके जवाब और मूल तस्वीर दोबारा जाँच के लिए भेजे जा रहे हैं...",
        stillUncertain: "दवा की पहचान अभी भी स्पष्ट नहीं है। अनुमानित पहचान पर भरोसा न करें।",
        moreInformation: "सिस्टम को अभी और विश्वसनीय जानकारी चाहिए। पैकेजिंग जाँचें या फार्मासिस्ट से सलाह लें।",
        recheckSuccess: "दवा की दोबारा जाँच का जवाब प्राप्त हुआ।",
        recheckError: "दवा की दोबारा जाँच नहीं हो सकी। बैकएंड कनेक्शन जाँचें और फिर प्रयास करें।",
        matchedTitle: "दवा प्रिस्क्रिप्शन से मेल खाती है",
        matchedDescription: "पहचानी गई दवा की पुष्टि किए गए प्रिस्क्रिप्शन रिकॉर्ड से मेल मिला है।",
        notFoundTitle: "दवा प्रिस्क्रिप्शन में नहीं मिली",
        notFoundDescription: "यह दवा पुष्टि किए गए प्रिस्क्रिप्शन में नहीं मिली।",
        uncertainTitle: "दवा की विश्वसनीय पहचान नहीं हो सकी",
        uncertainDescription: "अधिक जानकारी आवश्यक है। कृपया नीचे दिए गए सवालों के जवाब दें।",
        unavailableTitle: "परिणाम उपलब्ध नहीं है",
        unknownStatus: "सर्वर से एक अपरिचित परिणाम प्राप्त हुआ।",
        medicine: "दवा",
        strength: "दवा की मात्रा / शक्ति",
        clarificationUnavailable: "सिस्टम स्पष्टीकरण वाले सवाल नहीं बना सका। कृपया साफ़ तस्वीर लें या फार्मासिस्ट से सलाह लें।",
        noQuestions: "कोई उपयोगी स्पष्टीकरण वाला सवाल प्राप्त नहीं हुआ।",
        enterAnswer: "अपना जवाब लिखें",
        clarificationInstructions: "दवा की पैकेजिंग पर दिखाई देने वाली जानकारी के आधार पर जवाब दें।",
        scanAgain: "दवा की एक साफ़ तस्वीर लें या अपलोड करें।",
        scanFirst: "पहले दवा की तस्वीर लें या अपलोड करें।",
        sendingImage: "दवा की पहचान के लिए तस्वीर भेजी जा रही है...",
        scanSuccess: "दवा की पहचान का जवाब प्राप्त हुआ।",
        scanError: "दवा की पहचान अभी उपलब्ध नहीं है। बैकएंड कनेक्शन जाँचें और फिर प्रयास करें।",
        chatPreparing: "स्कैन के बाद DAWAZ आपसे संबंधित सवाल पूछेगा।",
        chatScanRequired: "बातचीत शुरू करने से पहले दवा स्कैन करें।",
        thinking: "DAWAZ सोच रहा है...",
        chatReady: "DAWAZ आपकी मदद के लिए तैयार है।",
        chatError: "दवा सहायक से कनेक्शन नहीं हो सका। कृपया बाद में प्रयास करें।",
        chatUnavailable: "चैट सेवा अभी उपलब्ध नहीं है।",
        conversationPreparing: "DAWAZ आपकी स्कैन की गई दवा के बारे में सवाल तैयार कर रहा है।",
        speechUnsupported: "इस ब्राउज़र में वॉइस पहचान उपलब्ध नहीं है। कृपया अपना सवाल टाइप करें।",
        voiceUnsupportedTitle: "इस ब्राउज़र में वॉइस पहचान समर्थित नहीं है।",
        listening: "सुन रहा है... अपना सवाल बोलें।",
        speechConverted: "आवाज़ टेक्स्ट में बदल गई है। भेजने से पहले इसे जाँच लें।",
        speechError: "आवाज़ पहचानी नहीं जा सकी। आप अपना सवाल टाइप कर सकते हैं।",
        voiceStopped: "वॉइस इनपुट बंद कर दिया गया है।",
        microphoneError: "माइक्रोफ़ोन शुरू नहीं हो सका। ब्राउज़र की अनुमति जाँचें।",
        microphoneStartError: "माइक्रोफ़ोन शुरू नहीं हो सका। ब्राउज़र की अनुमति जाँचें।",
        browserVoiceUnavailable: "वॉइस इनपुट उपलब्ध नहीं है। कृपया अपना सवाल टाइप करें।",
        medicineLabel: "दवा",
        strengthLabel: "दवा की शक्ति"
    }

};


// ============================================
// 4. LANGUAGE HELPERS
// ============================================

function getCurrentLanguage() {

    if (window.DAWAZ_LANGUAGE) {
        return window.DAWAZ_LANGUAGE.getLanguage();
    }

    return localStorage.getItem("dawazLanguage") || "en";
}


function t(key) {

    const language = getCurrentLanguage();

    return scannerTranslations[language]?.[key]
        || scannerTranslations.en[key]
        || key;
}


function getSpeechLanguage() {

    return getCurrentLanguage() === "hi"
        ? "hi-IN"
        : "en-IN";
}


// ============================================
// 5. DISPLAY SCAN MESSAGE
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
// 6. DISPLAY CLARIFICATION MESSAGE
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
// 7. STOP CAMERA
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
// 8. RESET RESULT
// ============================================

function resetResult() {

    resultCard.hidden = true;

    resultContent.replaceChildren();

    currentScanResult = null;
}


// ============================================
// 9. RESET CLARIFICATION
// ============================================

function resetClarification() {

    clarificationCard.hidden = true;

    clarificationQuestions.replaceChildren();

    additionalMedicineInfo.value = "";

    currentQuestions = [];

    submitClarificationBtn.disabled = false;

    submitClarificationBtn.textContent = t("submitAnswers");

    showClarificationMessage("");
}


// ============================================
// 10. RESET CHAT
// ============================================

function resetMedicineChat() {

    medicineChatCard.hidden = true;

    chatMessages.replaceChildren();

    chatHistory = [];

    isChatStarted = false;

    medicineChatInput.value = "";

    chatStatus.textContent = t("chatPreparing");

    chatVoiceStatus.textContent = "";

    if (speechRecognition) {

        speechRecognition.stop();

        speechRecognition = null;
    }

    chatMicBtn.classList.remove("recording");
}


// ============================================
// 11. RESET IMAGE
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

    showMessage(t("selectImage"));
}


// ============================================
// 12. DISPLAY IMAGE PREVIEW
// ============================================

function displayImage(file) {

    if (!file) {
        return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {

        showMessage(t("unsupportedImage"), "error");

        return;
    }

    if (file.size > MAX_FILE_SIZE) {

        showMessage(t("imageTooLarge"), "error");

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
        file.name || t("capturedImage");

    resetResult();

    resetClarification();

    resetMedicineChat();

    showMessage(t("imageSelected"), "success");
}


// ============================================
// 13. START CAMERA
// ============================================

startCameraBtn.addEventListener("click", async function () {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        showMessage(t("cameraUnsupported"), "error");

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

        showMessage(t("cameraReady"));

    } catch (error) {

        console.error("Camera error:", error);

        showMessage(t("cameraError"), "error");
    }
});


// ============================================
// 14. CAPTURE IMAGE
// ============================================

captureBtn.addEventListener("click", function () {

    if (!cameraStream) {

        showMessage(t("startCameraFirst"), "error");

        return;
    }

    const width = cameraPreview.videoWidth;
    const height = cameraPreview.videoHeight;

    if (!width || !height) {

        showMessage(t("cameraNotReady"), "error");

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

            showMessage(t("captureError"), "error");

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
// 15. UPLOAD IMAGE
// ============================================

medicineImage.addEventListener("change", function () {

    const file = medicineImage.files[0];

    if (!file) {
        return;
    }

    displayImage(file);
});


// ============================================
// 16. REMOVE IMAGE
// ============================================

removeImageBtn.addEventListener("click", function () {

    resetImage();

});


// ============================================
// 17. DISPLAY IDENTIFICATION RESULT
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

        statusTitle = t("matchedTitle");

        statusDescription = t("matchedDescription");

        statusClass = "matched";

    } else if (status === "not_found") {

        statusTitle = t("notFoundTitle");

        statusDescription = t("notFoundDescription");

        statusClass = "not-found";

    } else if (status === "uncertain") {

        statusTitle = t("uncertainTitle");

        statusDescription = t("uncertainDescription");

        statusClass = "uncertain";

    } else {

        statusTitle = t("unavailableTitle");

        statusDescription = t("unknownStatus");

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

        name.textContent = `${t("medicine")}: ${medicine.name}`;

        resultContent.appendChild(name);
    }

    if (medicine.strength) {

        const strength = document.createElement("p");

        strength.textContent = `${t("strength")}: ${medicine.strength}`;

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

            note.textContent = t("clarificationUnavailable");

            resultContent.appendChild(note);
        }

        return;
    }

    resetClarification();

    if (status === "matched" || status === "not_found") {

        startMedicineConversation();

    } else {

        resetMedicineChat();
    }
}


// ============================================
// 18. DISPLAY CLARIFICATION QUESTIONS
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

        // Questions are supplied by the backend.
        // Backend must return them in the selected language.

        label.textContent = questionText;

        const answerInput = document.createElement("input");

        answerInput.type = "text";

        answerInput.id = inputId;

        answerInput.className = "clarification-answer";

        answerInput.placeholder = t("enterAnswer");

        answerInput.autocomplete = "off";

        answerInput.dataset.questionIndex = index;

        questionGroup.append(label, answerInput);

        clarificationQuestions.appendChild(questionGroup);

    });

    if (clarificationQuestions.children.length === 0) {

        showClarificationMessage(t("noQuestions"), "error");

        return;
    }

    clarificationCard.hidden = false;

    showClarificationMessage(t("clarificationInstructions"));

    clarificationCard.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });
}


// ============================================
// 19. SUBMIT CLARIFICATION ANSWERS
// ============================================

submitClarificationBtn.addEventListener("click", async function () {

    if (!selectedImage) {

        showClarificationMessage(t("noImage"), "error");

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

        showClarificationMessage(t("answerEveryQuestion"), "error");

        return;
    }

    isSubmittingClarification = true;

    submitClarificationBtn.disabled = true;

    submitClarificationBtn.textContent = t("rechecking");

    showClarificationMessage(t("sendingAnswers"));

    try {

        const formData = new FormData();

        formData.append("image", selectedImage);

        formData.append("answers", JSON.stringify(answers));

        formData.append(
            "additionalInfo",
            additionalMedicineInfo.value.trim()
        );

        formData.append("language", getCurrentLanguage());

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

            showMessage(t("stillUncertain"), "info");

            showClarificationMessage(t("moreInformation"));

        } else {

            showMessage(t("recheckSuccess"), "success");
        }

    } catch (error) {

        console.error(
            "Clarification submission error:",
            error
        );

        showClarificationMessage(t("recheckError"), "error");

    } finally {

        isSubmittingClarification = false;

        submitClarificationBtn.disabled = false;

        submitClarificationBtn.textContent = t("submitAnswers");
    }
});


// ============================================
// 20. RETAKE SCAN
// ============================================

retakeScanBtn.addEventListener("click", function () {

    resetImage();

    showMessage(t("scanAgain"));

    cameraArea.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });
});


// ============================================
// 21. SCAN MEDICINE
// ============================================

scanMedicineBtn.addEventListener("click", async function () {

    if (!selectedImage) {

        showMessage(t("scanFirst"), "error");

        return;
    }

    if (isScanning) {
        return;
    }

    isScanning = true;

    scanMedicineBtn.disabled = true;

    scanMedicineBtn.textContent = t("identifying");

    resetResult();

    resetClarification();

    resetMedicineChat();

    showMessage(t("sendingImage"));

    try {

        const formData = new FormData();

        formData.append("image", selectedImage);

        formData.append("language", getCurrentLanguage());

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

        showMessage(t("scanSuccess"), "success");

    } catch (error) {

        console.error(
            "Medicine scanning error:",
            error
        );

        showMessage(t("scanError"), "error");

    } finally {

        isScanning = false;

        scanMedicineBtn.disabled = !selectedImage;

        scanMedicineBtn.textContent = t("identify");
    }
});


// ============================================
// 22. ADD CHAT MESSAGE
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
// 23. CHAT LOADING INDICATOR
// ============================================

function showChatLoading() {

    const loading = document.createElement("div");

    loading.id = "chatLoading";

    loading.className = "chat-typing";

    loading.textContent = t("thinking");

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
// 24. SEND MESSAGE TO DAWAZ
// ============================================

async function sendMessageToDAWAZ(message, mode = "message") {

    if (isSendingMessage) {
        return;
    }

    if (!selectedImage || !currentScanResult) {

        chatStatus.textContent = t("chatScanRequired");

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

        formData.append("language", getCurrentLanguage());

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

        chatStatus.textContent = t("chatReady");

    } catch (error) {

        hideChatLoading();

        console.error(
            "DAWAZ chat error:",
            error
        );

        addChatMessage(t("chatError"), "assistant");

        chatStatus.textContent = t("chatUnavailable");

    } finally {

        isSendingMessage = false;

        sendChatBtn.disabled = false;

        chatMicBtn.disabled = false;
    }
}


// ============================================
// 25. START AUTOMATIC DAWAZ CONVERSATION
// ============================================

async function startMedicineConversation() {

    medicineChatCard.hidden = false;

    chatMessages.replaceChildren();

    chatHistory = [];

    isChatStarted = true;

    chatStatus.textContent = t("conversationPreparing");

    medicineChatCard.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });

    await sendMessageToDAWAZ("", "start");
}


// ============================================
// 26. PATIENT TYPES A MESSAGE
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
// 27. SPEECH TO TEXT
// ============================================

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        chatMicBtn.disabled = true;

        chatMicBtn.title = t("voiceUnsupportedTitle");

        chatVoiceStatus.textContent = t("speechUnsupported");

        return;
    }

    chatMicBtn.addEventListener("click", function () {

        if (speechRecognition) {

            speechRecognition.stop();

            speechRecognition = null;

            chatMicBtn.classList.remove("recording");

            chatVoiceStatus.textContent = t("voiceStopped");

            return;
        }

        speechRecognition = new SpeechRecognition();

        // Change speech recognition language based on website language.

        speechRecognition.lang = getSpeechLanguage();

        speechRecognition.continuous = false;

        speechRecognition.interimResults = false;

        speechRecognition.onstart = function () {

            chatMicBtn.classList.add("recording");

            chatVoiceStatus.textContent = t("listening");

        };

        speechRecognition.onresult = function (event) {

            const transcript =
                event.results[0][0].transcript;

            medicineChatInput.value =
                medicineChatInput.value.trim()
                    ? medicineChatInput.value + " " + transcript
                    : transcript;

            chatVoiceStatus.textContent = t("speechConverted");

        };

        speechRecognition.onerror = function (event) {

            console.error(
                "Speech recognition error:",
                event.error
            );

            chatVoiceStatus.textContent = t("speechError");

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

            chatVoiceStatus.textContent = t("microphoneStartError");
        }

    });
}


// ============================================
// 28. UPDATE DYNAMIC TEXT ON LANGUAGE CHANGE
// ============================================

function updateScannerLanguage() {

    // Update buttons

    if (!isScanning) {
        scanMedicineBtn.textContent = t("identify");
    }

    if (!isSubmittingClarification) {
        submitClarificationBtn.textContent = t("submitAnswers");
    }

    // Update voice input language for the next recording.

    if (speechRecognition) {

        speechRecognition.lang = getSpeechLanguage();

    }

    // Update current clarification placeholders.

    const answerInputs =
        clarificationQuestions.querySelectorAll(
            ".clarification-answer"
        );

    answerInputs.forEach(function (input) {

        input.placeholder = t("enterAnswer");

    });

    // Update status text when no operation is running.

    if (!selectedImage) {

        showMessage(t("selectImage"));

    }

    if (!currentScanResult && !isSendingMessage) {

        chatStatus.textContent = t("chatPreparing");

    }

    if (!isChatStarted) {

        chatStatus.textContent = t("chatPreparing");

    }
}


// ============================================
// 29. INITIALISE SPEECH RECOGNITION
// ============================================

setupSpeechRecognition();


// ============================================
// 30. LISTEN FOR LANGUAGE CHANGES
// ============================================

window.addEventListener("dawazLanguageChanged", function () {

    updateScannerLanguage();

});


// ============================================
// 31. CLEAN UP WHEN LEAVING PAGE
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




