
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


// 2. VARIABLES

let cameraStream = null;
let selectedImage = null;
let imageObjectURL = null;
let isScanning = false;

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


// 4. STOP CAMERA

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


// 5. RESET RESULT

function resetResult() {

    resultCard.hidden = true;
    resultContent.replaceChildren();

}


// 6. RESET IMAGE

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

    showMessage("Select or capture a medicine image to begin.");

}


// 7. DISPLAY IMAGE PREVIEW

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

    showMessage("Image selected successfully.", "success");

}


// 8. START CAMERA

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


// 9. CAPTURE IMAGE

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


// 10. UPLOAD IMAGE

medicineImage.addEventListener("change", function () {

    const file = medicineImage.files[0];

    if (!file) {
        return;
    }

    displayImage(file);

});


// 11. REMOVE IMAGE

removeImageBtn.addEventListener("click", function () {

    resetImage();

});


// 12. DISPLAY IDENTIFICATION RESULT

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

        statusTitle = "Unable to identify medicine";
        statusDescription =
            "The medicine could not be identified confidently. Please review the image or consult a pharmacist.";

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

}


// 13. SCAN MEDICINE

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


// 14. CLEAN UP CAMERA WHEN LEAVING PAGE

window.addEventListener("beforeunload", function () {

    stopCamera();

    if (imageObjectURL) {
        URL.revokeObjectURL(imageObjectURL);
    }

});
