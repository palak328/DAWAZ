
const prescriptionFile = document.getElementById("prescriptionFile");
const fileName = document.getElementById("fileName");
const uploadMessage = document.getElementById("uploadMessage");
const submitButton = document.getElementById("submitPrescription");

const extractionMessage = document.getElementById("extractionMessage");
const medicineDetails = document.getElementById("medicineDetails");

const statusUploaded = document.getElementById("statusUploaded");
const statusProcessing = document.getElementById("statusProcessing");
const statusReview = document.getElementById("statusReview");
const statusMessage = document.getElementById("statusMessage");

let selectedFile = null;

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf"
];

const maxFileSize = 10 * 1024 * 1024;

// Reset status panel
function resetReviewPanel() {

    statusUploaded.classList.remove("active");
    statusProcessing.classList.remove("active");
    statusReview.classList.remove("active");

    statusMessage.textContent =
        "Your prescription has not been submitted yet.";

    extractionMessage.hidden = false;
    extractionMessage.textContent =
        "Medicine details will appear here after prescription processing.";

    medicineDetails.hidden = true;
}

// Handle file selection
prescriptionFile.addEventListener("change", function () {

    selectedFile = prescriptionFile.files[0];

    submitButton.disabled = true;
    fileName.textContent = "";
    uploadMessage.textContent = "";

    resetReviewPanel();

    if (!selectedFile) {
        return;
    }

    if (!allowedTypes.includes(selectedFile.type)) {

        uploadMessage.textContent =
            "Please select a JPG, PNG or PDF file.";

        selectedFile = null;
        prescriptionFile.value = "";
        return;
    }

    if (selectedFile.size > maxFileSize) {

        uploadMessage.textContent =
            "File size must be less than 10 MB.";

        selectedFile = null;
        prescriptionFile.value = "";
        return;
    }

    fileName.textContent = selectedFile.name;

    uploadMessage.textContent =
        "File selected successfully.";

    submitButton.disabled = false;
});

// Submit prescription
submitButton.addEventListener("click", function () {

    if (!selectedFile) {
        uploadMessage.textContent =
            "Please select a prescription first.";
        return;
    }

    // Temporary workflow data.
    // Actual prescription upload will use the backend API.

    const prescriptionWorkflow = {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        submittedAt: new Date().toISOString(),
        status: "awaiting_ocr"
    };

    sessionStorage.setItem(
        "prescriptionWorkflow",
        JSON.stringify(prescriptionWorkflow)
    );

    statusUploaded.classList.add("active");

    statusMessage.textContent =
        "Prescription selected. OCR processing requires backend integration.";

    uploadMessage.textContent =
        "Opening medicine review...";

    window.location.href = "medicine-review.html";

});


