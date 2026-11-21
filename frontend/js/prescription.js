document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#prescriptionForm");
    const fileInput = document.querySelector(
        'input[type="file"]'
    );

    if (!form || !fileInput) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a prescription file.");
            return;
        }

        const button = form.querySelector(
            'button[type="submit"]'
        );

        if (button) {
            button.disabled = true;
            button.textContent = "Extracting...";
        }

        try {
            const token = sessionStorage.getItem("dawazToken");
            const body = new FormData();
            body.append("file", file);

            const response = await fetch(
                "http://127.0.0.1:8000/prescriptions/extract",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Extraction failed.");
            }

            sessionStorage.setItem(
                "dawazPrescriptionDraft",
                JSON.stringify(result)
            );

            alert(
                "Prescription extracted and saved as a draft. " +
                "Review every medicine and instruction before confirmation."
            );

            window.location.href = "medicine-review.html";

        } catch (error) {
            alert(error.message);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Upload Prescription";
            }
        }
    });
});