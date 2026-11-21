document.addEventListener("DOMContentLoaded", () => {
    const draft = JSON.parse(
        sessionStorage.getItem("dawazPrescriptionDraft") || "null"
    );

    const container = document.querySelector(
        "#reviewContainer, #medicineReview, main"
    );

    if (!container) return;

    if (!draft) {
        container.textContent = "No prescription draft found. Upload a prescription first.";
        return;
    }

    const heading = document.createElement("h2");
    heading.textContent = "Prescription draft review";
    container.prepend(heading);

    const notice = document.createElement("p");
    notice.textContent =
        "This is an unconfirmed draft. Check every medicine and instruction with the original prescription and a qualified healthcare professional.";
    container.appendChild(notice);

    const data = draft.extraction_result || draft.extracted_data ||
        draft.data || draft;

    const medicines = data.medicines || data.items || [];

    if (!medicines.length) {
        const message = document.createElement("p");
        message.textContent =
            "No medicine entries were extracted. Review the original prescription manually.";
        container.appendChild(message);
        return;
    }

    medicines.forEach((medicine, index) => {
        const card = document.createElement("section");
        card.className = "review-medicine-card";

        const title = document.createElement("h3");
        title.textContent = medicine.medicine_name ||
            medicine.name || `Medicine ${index + 1}`;

        const details = document.createElement("pre");
        details.textContent = JSON.stringify(medicine, null, 2);

        card.append(title, details);
        container.appendChild(card);
    });

    const status = document.createElement("p");
    status.textContent =
        "Draft only — reminders have not been activated.";
    container.appendChild(status);
});