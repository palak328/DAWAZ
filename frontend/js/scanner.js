
// ============================================
// DAWAZ - SMART MEDICINE SCANNER
// ============================================


// 1. GET HTML ELEMENTS

const cameraArea = document.getElementById("cameraArea");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const cameraPreview = document.getElementById("cameraPreview");
const captureCanvas = document.getElementById("captureCanvas");
const scanFrame = document.getElementById("scanFrame");

const startCameraBtn = document.getElementById("startCameraBtn");
const captureBtn = document.getElementById("captureBtn");

const medicineImage = document.getElementById("medicineImage");
const fileName = document.getElementById("fileName");

const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

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


// 2. VARIABLES

let cameraStream = null;
let selectedImage = null;
let imageObjectURL = null;

let isScanning = false;
let isSubmittingClarification = false;

// Stores the questions received from the backend.
let currentQuestions = [];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

// Backend endpoint.
// Coordinate this URL with your backend teammate.

const API_URL = "/api/medicines/identify";


// 3. DISPLAY MESSAGE

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


// 4. DISPLAY CLARIFICATION MESSAGE

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


// 5. STOP CAMERA

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


// 6. RESET RESULT

function resetResult() {

    resultCard.hidden = true;
    resultContent.replaceChildren();
}


// 7. RESET CLARIFICATION

function resetClarification() {

    clarificationCard.hidden = true;

    clarificationQuestions.replaceChildren();

    additionalMedicineInfo.value = "";

    currentQuestions = [];

    submitClarificationBtn.disabled = false;
    submitClarificationBtn.textContent = "Submit Answers";

    showClarificationMessage("");
}


// 8. RESET IMAGE

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

    showMessage("Select or capture a medicine image to begin.");
}


// 9. DISPLAY IMAGE PREVIEW

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

    fileName.textContent = file.name || "Captured medicine image";

    resetResult();
    resetClarification();

    showMessage("Image selected successfully.", "success");
}


// 10. START CAMERA

startCameraBtn.addEventListener("click", async function () {

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

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
                facingMode: { ideal: "environment" }
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

        showMessage("Camera is ready. Position the medicine clearly.");

    } catch (error) {

        console.error("Camera error:", error);

        showMessage(
            "Unable to access camera. Allow camera permission or upload an image instead.",
            "error"
        );
    }
});


// 11. CAPTURE IMAGE

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

    context.drawImage(cameraPreview, 0, 0, width, height);

    captureCanvas.toBlob(function (blob) {

        if (!blob) {

            showMessage("Unable to capture image.", "error");

            return;
        }

        const capturedFile = new File(
            [blob],
            `medicine-scan-${Date.now()}.jpg`,
            { type: "image/jpeg" }
        );

        displayImage(capturedFile);

        stopCamera();

        cameraPreview.hidden = true;

        cameraPlaceholder.hidden = false;

        scanFrame.hidden = true;

    }, "image/jpeg", 0.9);
});


// 12. UPLOAD IMAGE

medicineImage.addEventListener("change", function () {

    const file = medicineImage.files[0];

    if (!file) {
        return;
    }

    displayImage(file);
});


// 13. REMOVE IMAGE

removeImageBtn.addEventListener("click", function () {

    resetImage();
});


// 14. DISPLAY IDENTIFICATION RESULT

function displayResult(data) {

    resultCard.hidden = false;

    resultContent.replaceChildren();

    const status = data.status;

    const medicine = data.medicine || {};

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

    // Show clarification questions only when the backend
    // returns an uncertain result.

    if (status === "uncertain") {

        const questions = data.questions || data.clarificationQuestions || [];

        if (questions.length > 0) {

            displayClarificationQuestions(questions);

        } else {

            clarificationCard.hidden = true;

            const note = document.createElement("p");

            note.textContent =
                "The system could not generate clarification questions. Please capture a clearer image or consult a pharmacist.";

            resultContent.appendChild(note);
        }

    } else {

        resetClarification();
    }
}


// 15. DISPLAY BACKEND-GENERATED QUESTIONS

function displayClarificationQuestions(questions) {

    clarificationQuestions.replaceChildren();

    currentQuestions = questions;

    questions.forEach(function (item, index) {

        // Backend can return either a string or an object.
        const questionText =
            typeof item === "string"
                ? item
                : item.question;

        if (!questionText || typeof questionText !== "string") {
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


// 16. SUBMIT CLARIFICATION ANSWERS

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

    const answerInputs = clarificationQuestions.querySelectorAll(
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

        // Send the original image again.
        formData.append("image", selectedImage);

        // Send patient answers as JSON.
        formData.append("answers", JSON.stringify(answers));

        // Send optional additional information.
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

        resetResult();

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

        console.error("Clarification submission error:", error);

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


// 17. RETAKE SCAN

retakeScanBtn.addEventListener("click", function () {

    resetImage();

    showMessage("Capture or upload a clearer medicine image.");

    document.getElementById("cameraArea").scrollIntoView({

        behavior: "smooth",

        block: "center"
    });
});


// 18. SCAN MEDICINE

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

    showMessage("Sending image for medicine identification...");

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

        console.error("Medicine scanning error:", error);

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


// 19. CLEAN UP CAMERA WHEN LEAVING PAGE

window.addEventListener("beforeunload", function () {

    stopCamera();

    if (imageObjectURL) {

        URL.revokeObjectURL(imageObjectURL);
    }
});

