// ============================================
// DAWAZ - PRESCRIPTION UPLOAD
// ENGLISH / HINDI LANGUAGE SUPPORT
// ============================================


// 1. GET HTML ELEMENTS

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


// 2. VARIABLES

let selectedFile = null;

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf"
];

const maxFileSize = 10 * 1024 * 1024;


// 3. TRANSLATIONS

const prescriptionTranslations = {

    en: {
        selectFile: "Please select a prescription first.",
        invalidFile: "Please select a JPG, PNG or PDF file.",
        fileTooLarge: "File size must be less than 10 MB.",
        fileSelected: "File selected successfully.",
        noFile: "Your prescription has not been submitted yet.",
        medicineDetailsWaiting:
            "Medicine details will appear here after prescription processing.",
        ocrRequired:
            "Prescription selected. OCR processing requires backend integration.",
        openingReview: "Opening medicine review...",
        fileSizeInfo: "Maximum file size: 10 MB."
    },

    hi: {
        selectFile: "कृपया पहले प्रिस्क्रिप्शन चुनें।",
        invalidFile: "कृपया JPG, PNG या PDF फाइल चुनें।",
        fileTooLarge: "फाइल का आकार 10 MB से कम होना चाहिए।",
        fileSelected: "फाइल सफलतापूर्वक चुन ली गई है।",
        noFile: "आपका प्रिस्क्रिप्शन अभी तक सबमिट नहीं किया गया है।",
        medicineDetailsWaiting:
            "प्रिस्क्रिप्शन प्रोसेस होने के बाद दवा की जानकारी यहाँ दिखाई देगी।",
        ocrRequired:
            "प्रिस्क्रिप्शन चुना गया है। OCR प्रोसेसिंग के लिए बैकएंड इंटीग्रेशन आवश्यक है।",
        openingReview: "दवा की समीक्षा खोली जा रही है...",
        fileSizeInfo: "अधिकतम फाइल आकार: 10 MB।"
    }

};


// 4. GET CURRENT LANGUAGE

function getCurrentLanguage() {

    if (window.DAWAZ_LANGUAGE) {
        return window.DAWAZ_LANGUAGE.getLanguage();
    }

    return localStorage.getItem("dawazLanguage") || "en";
}


// 5. GET TRANSLATED TEXT

function translatePrescription(key) {

    const language = getCurrentLanguage();

    return prescriptionTranslations[language]?.[key]
        || prescriptionTranslations.en[key]
        || key;
}


// 6. RESET STATUS PANEL

function resetReviewPanel() {

    statusUploaded.classList.remove("active");
    statusProcessing.classList.remove("active");
    statusReview.classList.remove("active");

    statusMessage.textContent =
        translatePrescription("noFile");

    extractionMessage.hidden = false;

    extractionMessage.textContent =
        translatePrescription("medicineDetailsWaiting");

    medicineDetails.hidden = true;
}


// 7. UPDATE TEXT WHEN LANGUAGE CHANGES

function updatePrescriptionLanguage() {

    if (selectedFile) {

        uploadMessage.textContent =
            translatePrescription("fileSelected");

    }

    if (statusMessage.textContent) {

        if (statusUploaded.classList.contains("active")) {

            statusMessage.textContent =
                translatePrescription("ocrRequired");

        } else {

            statusMessage.textContent =
                translatePrescription("noFile");

        }

    }

    if (!medicineDetails.hidden) {
        return;
    }

    extractionMessage.textContent =
        translatePrescription("medicineDetailsWaiting");
}


// 8. HANDLE FILE SELECTION

prescriptionFile.addEventListener("change", function () {

    selectedFile = prescriptionFile.files[0];

    submitButton.disabled = true;

    fileName.textContent = "";
    uploadMessage.textContent = "";

    resetReviewPanel();

    if (!selectedFile) {
        return;
    }


    // Validate file type

    if (!allowedTypes.includes(selectedFile.type)) {

        uploadMessage.textContent =
            translatePrescription("invalidFile");

        selectedFile = null;
        prescriptionFile.value = "";

        return;
    }


    // Validate file size

    if (selectedFile.size > maxFileSize) {

        uploadMessage.textContent =
            translatePrescription("fileTooLarge");

        selectedFile = null;
        prescriptionFile.value = "";

        return;
    }


    // File selected successfully

    fileName.textContent = selectedFile.name;

    uploadMessage.textContent =
        translatePrescription("fileSelected");

    submitButton.disabled = false;

});


// 9. SUBMIT PRESCRIPTION

submitButton.addEventListener("click", function () {

    if (!selectedFile) {

        uploadMessage.textContent =
            translatePrescription("selectFile");

        return;
    }


    // Temporary workflow data.
    // Actual prescription upload and OCR require backend integration.

    const prescriptionWorkflow = {

        fileName: selectedFile.name,

        fileType: selectedFile.type,

        submittedAt: new Date().toISOString(),

        status: "awaiting_ocr"

    };


    // Store temporary workflow information

    sessionStorage.setItem(
        "prescriptionWorkflow",
        JSON.stringify(prescriptionWorkflow)
    );


    // Update status

    statusUploaded.classList.add("active");

    statusMessage.textContent =
        translatePrescription("ocrRequired");

    uploadMessage.textContent =
        translatePrescription("openingReview");


    // Open medicine review page

    window.location.href = "medicine-review.html";

});


// 10. LISTEN FOR LANGUAGE CHANGES

window.addEventListener("dawazLanguageChanged", function () {

    updatePrescriptionLanguage();

    if (!selectedFile) {
        resetReviewPanel();
    }

});


// 11. INITIALIZE PAGE

document.addEventListener("DOMContentLoaded", function () {

    submitButton.disabled = !selectedFile;

    resetReviewPanel();

});

