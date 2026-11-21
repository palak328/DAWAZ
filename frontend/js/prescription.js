document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("prescriptionFile");
    const submitButton = document.getElementById("submitPrescription");
    const fileName = document.getElementById("fileName");
    const uploadMessage = document.getElementById("uploadMessage");

    if (!fileInput || !submitButton) return;

    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        fileName.textContent = file ? file.name : "";
        submitButton.disabled = !file;

        if (uploadMessage) uploadMessage.textContent = "";
    });

    submitButton.addEventListener("click", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        submitButton.disabled = true;
        submitButton.textContent = "Extracting...";

        try {
            const body = new FormData();
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
                    "Prescription saved as a draft. Review all extracted details.";
            }

            window.location.href = "medicine-review.html";

        } catch (error) {
            if (uploadMessage) {
                uploadMessage.textContent = error.message;
            }
            submitButton.disabled = false;
            submitButton.textContent = "Submit Prescription";
        }
    });
});