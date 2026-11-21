
document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("prescriptionFile");
    const submitButton = document.getElementById("submitPrescription");
    const fileName = document.getElementById("fileName");
    const uploadMessage = document.getElementById("uploadMessage");

    if (!fileInput || !submitButton) return;

    if (!window.DawazAPI) {
        if (uploadMessage) {
            uploadMessage.textContent =
                "Backend API service is not loaded.";
        }

        submitButton.disabled = true;
        return;
    }

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        if (file && ![
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
        ].includes(file.type)) {
            fileInput.value = "";

            if (fileName) fileName.textContent = "";

            submitButton.disabled = true;

            if (uploadMessage) {
                uploadMessage.textContent =
                    "Upload a PDF or supported image file.";
            }

            return;
        }

        if (fileName) {
            fileName.textContent = file ? file.name : "";
        }

        submitButton.disabled = !file;

        if (uploadMessage) {
            uploadMessage.textContent = "";
        }
    });

    submitButton.addEventListener("click", async event => {
        event.preventDefault();

        const file = fileInput.files[0];

        if (!file) {
            if (uploadMessage) {
                uploadMessage.textContent =
                    "Select a prescription file first.";
            }
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Extracting...";

        if (uploadMessage) {
            uploadMessage.textContent =
                "Uploading prescription and extracting details...";
        }

        try {
            const body = new FormData();

            // Backend B expects the multipart field "file".
            body.append("file", file);

            const result = await DawazAPI.request(
                "/prescriptions/extract",
                {
                    method: "POST",
                    body
                }
            );

            sessionStorage.setItem(
                "dawazPrescriptionDraft",
                JSON.stringify(result)
            );

            if (uploadMessage) {
                uploadMessage.textContent =
                    "Prescription extracted and saved as a draft. Review all details before confirmation.";
            }

            window.location.href = "medicine-review.html";

        } catch (error) {
            if (uploadMessage) {
                uploadMessage.textContent =
                    error.message || "Prescription extraction failed.";
            }

            submitButton.disabled = false;
            submitButton.textContent = "Submit Prescription";
        }
    });
});
