
document.addEventListener("DOMContentLoaded", () => {

    const container = document.querySelector(
        "#reviewContainer, #medicineReview, main"
    );

    if (!container) return;

    let draft;

    try {
        draft = JSON.parse(
            sessionStorage.getItem("dawazPrescriptionDraft") || "null"
        );
    } catch {
        draft = null;
    }

    if (!draft) {
        container.textContent =
            "No prescription draft found. Upload a prescription first.";
        return;
    }

    const data =
        draft.extraction_result ||
        draft.extracted_data ||
        draft.data ||
        draft;

    const heading = document.createElement("h2");
    heading.textContent = "Prescription Draft Review";
    container.prepend(heading);

    const notice = document.createElement("p");
    notice.textContent =
        "This is an unconfirmed draft. Verify every extracted detail against the original prescription. Unclear instructions must be checked with a qualified healthcare professional.";
    container.appendChild(notice);

    const medicines = Array.isArray(data.medicines)
        ? data.medicines
        : Array.isArray(data.items)
            ? data.items
            : [];

    function addDetail(parent, label, value) {
        if (
            value === undefined ||
            value === null ||
            value === ""
        ) return;

        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;

        paragraph.append(
            strong,
            document.createTextNode(
                typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)
            )
        );

        parent.appendChild(paragraph);
    }

    if (!medicines.length) {
        const message = document.createElement("p");
        message.textContent =
            "No medicine entries were extracted. Review the original prescription manually.";
        container.appendChild(message);
    } else {
        medicines.forEach((medicine, index) => {
            const card = document.createElement("section");
            card.className = "review-medicine-card";

            const title = document.createElement("h3");
            title.textContent =
                medicine.medicine_name ||
                medicine.name ||
                `Medicine ${index + 1}`;

            card.appendChild(title);

            addDetail(card, "Strength", medicine.strength);
            addDetail(card, "Dosage form", medicine.dosage_form || medicine.form);
            addDetail(card, "Dose", medicine.dose);
            addDetail(card, "Frequency", medicine.frequency);
            addDetail(card, "Timing", medicine.timing);
            addDetail(card, "Route", medicine.route);
            addDetail(card, "Duration", medicine.duration);
            addDetail(card, "Food instructions", medicine.food_instruction);

            addDetail(
                card,
                "Review status",
                "Not reviewed"
            );

            container.appendChild(card);
        });
    }

    const status = document.createElement("p");
    status.textContent =
        "Draft only — reminders have not been activated.";
    container.appendChild(status);

    const warning = document.createElement("p");
    warning.textContent =
        "Displaying extracted information does not confirm medicine identity or authorize a medication schedule.";
    container.appendChild(warning);

});
