
const prescriptionFile = document.getElementById("prescriptionFile");

const fileName = document.getElementById("fileName");
const uploadMessage = document.getElementById("uploadMessage");

const submitButton = document.getElementById("submitPrescription");

const extractionMessage = document.getElementById("extractionMessage");

const statusUploaded = document.getElementById("statusUploaded");
const statusProcessing = document.getElementById("statusProcessing");
const statusReview = document.getElementById("statusReview");

const statusMessage = document.getElementById("statusMessage");

let selectedFile = null;


// =====================================
// FILE SELECTION
// =====================================

prescriptionFile.addEventListener("change", function () {

    const file = prescriptionFile.files[0];

    selectedFile = null;

    submitButton.disabled = true;

    // Reset status and extraction display
    resetReviewPanel();

    if (!file) {
        fileName.textContent = "";
        uploadMessage.textContent = "";
        return;
    }

    // Allowed formats
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    if (!allowedTypes.includes(file.type)) {

        uploadMessage.textContent =
            "Please select a JPG, PNG, or PDF file.";

        fileName.textContent = "";
        prescriptionFile.value = "";

        return;
    }

    // Maximum size: 10 MB
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {

        uploadMessage.textContent =
            "File size must be less than 10 MB.";

        fileName.textContent = "";
        prescriptionFile.value = "";

        return;
    }

    selectedFile = file;

    fileName.textContent = "Selected: " + file.name;

    uploadMessage.textContent =
        "Your file is ready to submit.";

    submitButton.disabled = false;

});


// =====================================
// RESET REVIEW PANEL
// =====================================

function resetReviewPanel() {

    extractionMessage.hidden = false;

    statusUploaded.classList.remove("active");
    statusProcessing.classList.remove("active");
    statusReview.classList.remove("active");

    statusMessage.textContent = "No prescription submitted";

}


// =====================================
// SUBMIT PRESCRIPTION
// =====================================

submitButton.addEventListener("click", function () {

    if (!selectedFile) {

        uploadMessage.textContent =
            "Please select a prescription first.";

        return;
    }

    // Update upload status
    statusUploaded.classList.add("active");

    statusMessage.textContent =
        "Prescription submitted in this browser";

    uploadMessage.textContent =
        "Prescription submitted successfully.";

    // OCR is not connected yet.
    // Do not show invented medicine information.

    extractionMessage.innerHTML = `
        <div class="empty-icon">⌕</div>

        <p>
            Your document has been submitted.
            Medicine details are not available yet.
        </p>

        <span>OCR processing needs to be connected.</span>
    `;

    extractionMessage.hidden = false;

    statusProcessing.classList.remove("active");
    statusReview.classList.remove("active");

    submitButton.disabled = true;

});

