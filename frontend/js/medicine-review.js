
// ==========================================
// DAWAZ - MEDICINE REVIEW
// ==========================================


// 1. CHECK PRESCRIPTION WORKFLOW

const prescriptionWorkflow = JSON.parse(
    sessionStorage.getItem("prescriptionWorkflow") || "null"
);

if (!prescriptionWorkflow) {
    alert("Please upload a prescription first.");
    window.location.href = "prescription.html";
}


// 2. GET HTML ELEMENTS

const medicineList = document.getElementById("medicineList");
const addMedicineBtn = document.getElementById("addMedicineBtn");
const confirmDetails = document.getElementById("confirmDetails");
const confirmBtn = document.getElementById("confirmBtn");
const reviewMessage = document.getElementById("reviewMessage");


// 3. CREATE MEDICINE CARD

function createMedicineCard(number) {

    const card = document.createElement("article");

    card.className = "medicine-form-card";

    card.innerHTML = `
        <div class="medicine-card-heading">
            <h3>Medicine ${number}</h3>

            <button type="button" class="remove-btn">
                Remove
            </button>
        </div>

        <div class="form-grid">

            <div class="form-group">
                <label>Medicine Name</label>
                <input
                    type="text"
                    name="medicineName"
                    placeholder="Enter medicine name"
                    required
                >
            </div>

            <div class="form-group">
                <label>Strength</label>
                <input
                    type="text"
                    name="strength"
                    placeholder="As written on prescription"
                >
            </div>

            <div class="form-group">
                <label>Dosage</label>
                <input
                    type="text"
                    name="dosage"
                    placeholder="As prescribed"
                >
            </div>

            <div class="form-group">
                <label>Frequency</label>
                <input
                    type="text"
                    name="frequency"
                    placeholder="As prescribed"
                >
            </div>

            <div class="form-group full-width">
                <label>Instructions</label>
                <textarea
                    name="instructions"
                    placeholder="Enter instructions from prescription"
                ></textarea>
            </div>

        </div>
    `;

    return card;
}


// 4. ADD MEDICINE

addMedicineBtn.addEventListener("click", function () {

    const number =
        medicineList.querySelectorAll(".medicine-form-card").length + 1;

    const newCard = createMedicineCard(number);

    medicineList.appendChild(newCard);

    updateMedicineNumbers();
    resetConfirmation();

});


// 5. REMOVE MEDICINE

medicineList.addEventListener("click", function (event) {

    if (event.target.classList.contains("remove-btn")) {

        const cards =
            medicineList.querySelectorAll(".medicine-form-card");

        if (cards.length === 1) {

            reviewMessage.textContent =
                "At least one medicine entry is required.";

            reviewMessage.style.color = "#C34E42";

            return;
        }

        event.target.closest(".medicine-form-card").remove();

        updateMedicineNumbers();
        resetConfirmation();

    }

});


// 6. UPDATE MEDICINE NUMBERS

function updateMedicineNumbers() {

    const cards =
        medicineList.querySelectorAll(".medicine-form-card");

    cards.forEach(function (card, index) {

        card.querySelector("h3").textContent =
            `Medicine ${index + 1}`;

    });

}


// 7. RESET CONFIRMATION

function resetConfirmation() {

    confirmDetails.checked = false;
    confirmBtn.disabled = true;

    reviewMessage.textContent = "";

}


// 8. CONFIRMATION CHECKBOX

confirmDetails.addEventListener("change", function () {

    confirmBtn.disabled = !confirmDetails.checked;

    reviewMessage.textContent = "";

});


// 9. RESET WHEN MEDICINE DETAILS CHANGE

medicineList.addEventListener("input", function () {

    resetConfirmation();

});


// 10. VALIDATE MEDICINE DETAILS

function validateMedicines() {

    const cards =
        medicineList.querySelectorAll(".medicine-form-card");

    const medicines = [];

    for (const card of cards) {

        const medicine = {

            name: card.querySelector(
                '[name="medicineName"]'
            ).value.trim(),

            strength: card.querySelector(
                '[name="strength"]'
            ).value.trim(),

            dosage: card.querySelector(
                '[name="dosage"]'
            ).value.trim(),

            frequency: card.querySelector(
                '[name="frequency"]'
            ).value.trim(),

            instructions: card.querySelector(
                '[name="instructions"]'
            ).value.trim()

        };

        if (!medicine.name) {
            return null;
        }

        medicines.push(medicine);

    }

    return medicines;

}


// 11. CONFIRM MEDICINES

confirmBtn.addEventListener("click", async function () {

    const medicines = validateMedicines();

    if (!medicines) {

        reviewMessage.textContent =
            "Please enter a medicine name for every medicine.";

        reviewMessage.style.color = "#C34E42";

        confirmDetails.checked = false;
        confirmBtn.disabled = true;

        return;
    }

    if (!confirmDetails.checked) {

        reviewMessage.textContent =
            "Please confirm that you have reviewed the details.";

        reviewMessage.style.color = "#C34E42";

        return;
    }

    // Backend API integration will be added here.
    // These details are validated but not permanently saved.

    console.log("Prescription workflow:", prescriptionWorkflow);

    console.log("Confirmed medicine details:", medicines);

    reviewMessage.textContent =
        "Details validated successfully. Secure saving will be available after backend integration.";

    reviewMessage.style.color = "#0B6E6E";

});
