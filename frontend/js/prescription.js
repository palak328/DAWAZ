
const prescriptionFile = document.getElementById("prescriptionFile");

const fileName = document.getElementById("fileName");
const uploadMessage = document.getElementById("uploadMessage");

const submitButton = document.getElementById("submitPrescription");

const reviewInstructions = document.getElementById("reviewInstructions");
const prescriptionPreview = document.getElementById("prescriptionPreview");

let selectedFile = null;
let previewURL = null;


// =====================================
// FILE SELECTION
// =====================================

prescriptionFile.addEventListener("change", function () {

    const file = prescriptionFile.files[0];

    selectedFile = null;

    submitButton.disabled = true;

    // Clear previous preview
    prescriptionPreview.hidden = true;
    prescriptionPreview.innerHTML = "";

    if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
    }

    reviewInstructions.textContent =
        "Your uploaded prescription will appear here after submission.";

    if (!file) {

        fileName.textContent = "";
        uploadMessage.textContent = "";

        return;
    }


    // Allowed file formats

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


    // Maximum file size: 10 MB

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {

        uploadMessage.textContent =
            "File size must be less than 10 MB.";

        fileName.textContent = "";

        prescriptionFile.value = "";

        return;
    }


    // Store selected file

    selectedFile = file;

    fileName.textContent =
        "Selected file: " + file.name;

    uploadMessage.textContent =
        "Your file is ready to submit.";

    submitButton.disabled = false;

});


// =====================================
// SUBMIT PRESCRIPTION
// =====================================

submitButton.addEventListener("click", function () {

    if (!selectedFile) {

        uploadMessage.textContent =
            "Please select a prescription first.";

        return;
    }


    // Create temporary preview URL

    previewURL = URL.createObjectURL(selectedFile);

    prescriptionPreview.innerHTML = "";


    // =================================
    // IMAGE PREVIEW
    // =================================

    if (selectedFile.type.startsWith("image/")) {

        const image = document.createElement("img");

        image.src = previewURL;

        image.alt = "Uploaded prescription preview";

        prescriptionPreview.appendChild(image);

    }


    // =================================
    // PDF PREVIEW
    // =================================

    else if (selectedFile.type === "application/pdf") {

        const pdf = document.createElement("iframe");

        pdf.src = previewURL;

        pdf.title = "Prescription PDF preview";

        prescriptionPreview.appendChild(pdf);

    }


    // Show preview

    prescriptionPreview.hidden = false;


    // Update review message

    reviewInstructions.textContent =
        "Your prescription has been submitted for review. Please check the uploaded document carefully.";


    // Update upload message

    uploadMessage.textContent =
        "Prescription submitted successfully.";


    // Prevent duplicate submission

    submitButton.disabled = true;

});
