
const prescriptionFile = document.getElementById("prescriptionFile");
const fileName = document.getElementById("fileName");
const uploadMessage = document.getElementById("uploadMessage");

prescriptionFile.addEventListener("change", function () {

    const file = prescriptionFile.files[0];

    // Check if a file was selected
    if (!file) {
        fileName.textContent = "";
        uploadMessage.textContent = "";
        return;
    }

    // Allowed file types
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf"
    ];

    // Check file format
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

    // Display selected file
    fileName.textContent = "Selected file: " + file.name;

    uploadMessage.textContent =
        "File selected successfully. Prescription details still need to be reviewed.";

});
