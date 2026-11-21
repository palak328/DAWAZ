document.addEventListener("DOMContentLoaded", () => {
    const medicineList = document.getElementById("medicineList");
    const addMedicineBtn = document.getElementById("addMedicineBtn");
    const confirmDetails = document.getElementById("confirmDetails");
    const confirmBtn = document.getElementById("confirmBtn");
    const reviewMessage = document.getElementById("reviewMessage");

    let draft = null;
    try {
        draft = JSON.parse(
            sessionStorage.getItem("dawazPrescriptionDraft") || "null"
        );
    } catch {
        draft = null;
    }

    const prescriptionId = draft ? (draft.prescription_id || draft.id) : null;

    // Safely extract medicines from various possible response shapes
    let medicines = [];
    if (draft) {
        if (draft.extraction && draft.extraction.data && Array.isArray(draft.extraction.data.medicines)) {
            medicines = draft.extraction.data.medicines;
        } else if (draft.extraction && Array.isArray(draft.extraction.medicines)) {
            medicines = draft.extraction.medicines;
        } else if (draft.data && Array.isArray(draft.data.medicines)) {
            medicines = draft.data.medicines;
        } else if (Array.isArray(draft.medicines)) {
            medicines = draft.medicines;
        } else if (Array.isArray(draft.items)) {
            medicines = draft.items;
        }
    }

    function createMedicineCard(data = {}, index = 1) {
        const article = document.createElement("article");
        article.className = "medicine-form-card";

        const rawStrengths = Array.isArray(data.strengths_found)
            ? data.strengths_found.join(", ")
            : "";
        const strengthVal = data.strength || rawStrengths || "";
        const doseVal = data.dosage || data.dose || data.dosage_form || data.form || "";
        const freqVal = data.frequency || "";
        const nameVal = data.medicine_name || data.name || "";

        let instructionsVal = data.instructions || data.additional_instructions || data.raw_instruction_text || "";
        if (!instructionsVal) {
            const parts = [
                data.timing ? `Timing: ${data.timing}` : "",
                data.duration ? `Duration: ${data.duration}` : ""
            ].filter(Boolean);
            instructionsVal = parts.join("; ");
        }

        const unresolved = Array.isArray(data.unresolved_fields) && data.unresolved_fields.length > 0
            ? `<div class="unresolved-warning" style="margin-bottom:12px;padding:8px 12px;background:#FFF3CD;border:1px solid #FFEEBA;border-radius:6px;font-size:13px;color:#856404;">
                 <strong>Review needed:</strong> Please verify ${data.unresolved_fields.join(", ")}.
               </div>`
            : "";

        article.innerHTML = `
            <div class="medicine-card-heading">
                <h3>Medicine ${index}</h3>
                <button type="button" class="remove-btn">Remove</button>
            </div>
            ${unresolved}
            <div class="form-grid">
                <div class="form-group">
                    <label>Medicine Name</label>
                    <input type="text" name="medicineName" placeholder="Enter medicine name" value="${escapeHtml(nameVal)}" required>
                </div>
                <div class="form-group">
                    <label>Strength</label>
                    <input type="text" name="strength" placeholder="As written on prescription" value="${escapeHtml(strengthVal)}">
                </div>
                <div class="form-group">
                    <label>Dosage</label>
                    <input type="text" name="dosage" placeholder="As prescribed" value="${escapeHtml(doseVal)}">
                </div>
                <div class="form-group">
                    <label>Frequency</label>
                    <input type="text" name="frequency" placeholder="As prescribed" value="${escapeHtml(freqVal)}">
                </div>
                <div class="form-group full-width">
                    <label>Instructions</label>
                    <textarea name="instructions" placeholder="Enter instructions from prescription">${escapeHtml(instructionsVal)}</textarea>
                </div>
            </div>
        `;

        article.querySelector(".remove-btn").addEventListener("click", () => {
            const cards = medicineList.querySelectorAll(".medicine-form-card");
            if (cards.length <= 1) {
                if (reviewMessage) {
                    reviewMessage.textContent = "A prescription must have at least one medicine.";
                    reviewMessage.style.color = "#c0392b";
                }
                return;
            }
            article.remove();
            renumberCards();
        });

        return article;
    }

    function escapeHtml(text) {
        if (!text) return "";
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function renumberCards() {
        if (!medicineList) return;
        const cards = medicineList.querySelectorAll(".medicine-form-card");
        cards.forEach((card, idx) => {
            const heading = card.querySelector(".medicine-card-heading h3");
            if (heading) heading.textContent = `Medicine ${idx + 1}`;
        });
    }

    // Populate initial cards
    if (medicineList) {
        medicineList.innerHTML = "";
        if (medicines.length > 0) {
            medicines.forEach((med, idx) => {
                medicineList.appendChild(createMedicineCard(med, idx + 1));
            });
        } else {
            medicineList.appendChild(createMedicineCard({}, 1));
            if (reviewMessage) {
                reviewMessage.textContent = "No medicines could be automatically recognized. Please enter details manually.";
                reviewMessage.style.color = "#856404";
            }
        }
    }

    // Add medicine button
    if (addMedicineBtn && medicineList) {
        addMedicineBtn.addEventListener("click", () => {
            const currentCount = medicineList.querySelectorAll(".medicine-form-card").length;
            medicineList.appendChild(createMedicineCard({}, currentCount + 1));
        });
    }

    // Confirmation checkbox
    if (confirmDetails && confirmBtn) {
        confirmDetails.addEventListener("change", () => {
            confirmBtn.disabled = !confirmDetails.checked;
        });
    }

    // Confirm button submission
    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            if (!confirmDetails || !confirmDetails.checked) {
                if (reviewMessage) {
                    reviewMessage.textContent = "Please check the confirmation box before continuing.";
                    reviewMessage.style.color = "#c0392b";
                }
                return;
            }

            const cards = medicineList ? medicineList.querySelectorAll(".medicine-form-card") : [];
            const items = [];

            for (const card of cards) {
                const nameInput = card.querySelector('input[name="medicineName"]');
                const strengthInput = card.querySelector('input[name="strength"]');
                const dosageInput = card.querySelector('input[name="dosage"]');
                const frequencyInput = card.querySelector('input[name="frequency"]');
                const instructionsInput = card.querySelector('textarea[name="instructions"]');

                const name = nameInput ? nameInput.value.trim() : "";
                if (!name) {
                    if (reviewMessage) {
                        reviewMessage.textContent = "Please fill in the medicine name for all entries.";
                        reviewMessage.style.color = "#c0392b";
                    }
                    if (nameInput) nameInput.focus();
                    return;
                }

                items.push({
                    medicine_name: name,
                    strength: strengthInput ? strengthInput.value.trim() || "As prescribed" : "As prescribed",
                    dosage_form: "tablet",
                    dose: dosageInput ? dosageInput.value.trim() || "1 tablet" : "1 tablet",
                    dose_quantity: 1.0,
                    dose_unit: "tablet",
                    route: "oral",
                    frequency: frequencyInput ? frequencyInput.value.trim() || "once daily" : "once daily",
                    duration_days: 7,
                    additional_instructions: instructionsInput ? instructionsInput.value.trim() : null
                });
            }

            if (items.length === 0) {
                if (reviewMessage) {
                    reviewMessage.textContent = "Please add at least one medicine.";
                    reviewMessage.style.color = "#c0392b";
                }
                return;
            }

            confirmBtn.disabled = true;
            confirmBtn.textContent = "Confirming...";
            if (reviewMessage) {
                reviewMessage.textContent = "Saving and confirming prescription...";
                reviewMessage.style.color = "#0B6E6E";
            }

            try {
                if (!window.DawazAPI) {
                    throw new Error("Backend API service is not loaded.");
                }

                let response;
                if (prescriptionId) {
                    // Update and confirm via review endpoint
                    response = await DawazAPI.request(`/prescriptions/${prescriptionId}/review`, {
                        method: "POST",
                        body: JSON.stringify({ items })
                    });
                } else {
                    // Create new prescription
                    response = await DawazAPI.request("/prescriptions", {
                        method: "POST",
                        body: JSON.stringify({ items })
                    });
                }

                if (reviewMessage) {
                    reviewMessage.textContent = "Prescription confirmed successfully! Redirecting to My Medicines...";
                    reviewMessage.style.color = "#228b50";
                }

                sessionStorage.removeItem("dawazPrescriptionDraft");

                setTimeout(() => {
                    window.location.href = "medicines.html";
                }, 1500);

            } catch (error) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = "Confirm Medicines";
                if (reviewMessage) {
                    reviewMessage.textContent = error.message || "Failed to confirm prescription.";
                    reviewMessage.style.color = "#c0392b";
                }
            }
        });
    }
});
