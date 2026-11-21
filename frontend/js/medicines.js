

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "dawazMedicines";

    const medicineList = document.getElementById("medicineList");
    const medicineModal = document.getElementById("medicineModal");
    const medicineForm = document.getElementById("medicineForm");

    const addMedicineBtn = document.getElementById("addMedicineBtn");
    const emptyAddBtn = document.getElementById("emptyAddBtn");

    const closeMedicineModal = document.getElementById("closeMedicineModal");
    const cancelMedicineBtn = document.getElementById("cancelMedicineBtn");

    const medicineSearch = document.getElementById("medicineSearch");

    const medicineName = document.getElementById("medicineName");
    const medicineStrength = document.getElementById("medicineStrength");
    const medicineStock = document.getElementById("medicineStock");
    const medicineInstructions = document.getElementById("medicineInstructions");
    const medicineNotes = document.getElementById("medicineNotes");

    const modalTitle = document.getElementById("modalTitle");
    const medicineFormMessage = document.getElementById("medicineFormMessage");

    const totalMedicines = document.getElementById("totalMedicines");
    const lowStockMedicines = document.getElementById("lowStockMedicines");
    const outOfStockMedicines = document.getElementById("outOfStockMedicines");

    let medicines = loadMedicines();
    let editingMedicineId = null;

    function loadMedicines() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not load medicines:", error);
            return [];
        }
    }

    function saveMedicines() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    }

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function updateSummary() {

        totalMedicines.textContent = medicines.length;

        lowStockMedicines.textContent = medicines.filter(
            medicine => Number(medicine.stock) > 0 &&
                        Number(medicine.stock) <= 5
        ).length;

        outOfStockMedicines.textContent = medicines.filter(
            medicine => Number(medicine.stock) === 0
        ).length;
    }

    function getStockStatus(stock) {

        if (stock === 0) {
            return {
                text: "Out of Stock",
                className: "out-of-stock"
            };
        }

        if (stock <= 5) {
            return {
                text: "Low Stock",
                className: "low-stock"
            };
        }

        return {
            text: "Available",
            className: "available"
        };
    }

    function renderMedicines(searchTerm = "") {

        medicineList.innerHTML = "";

        const filteredMedicines = medicines.filter(medicine => {

            const name = (medicine.name || "").toLowerCase();
            const strength = (medicine.strength || "").toLowerCase();
            const search = searchTerm.toLowerCase();

            return name.includes(search) || strength.includes(search);
        });

        if (filteredMedicines.length === 0) {

            if (medicines.length === 0) {

                const emptyState = createElement("div", "empty-state");

                emptyState.appendChild(
                    createElement("div", "empty-state-icon", "💊")
                );

                emptyState.appendChild(
                    createElement("h3", "", "No medicines added yet")
                );

                emptyState.appendChild(
                    createElement(
                        "p",
                        "",
                        "Add your medicines to maintain a digital medicine cabinet."
                    )
                );

                const button = createElement(
                    "button",
                    "add-medicine-btn",
                    "+ Add Your First Medicine"
                );

                button.type = "button";
                button.addEventListener("click", openAddModal);

                emptyState.appendChild(button);
                medicineList.appendChild(emptyState);

            } else {

                medicineList.appendChild(
                    createElement(
                        "div",
                        "no-results",
                        "No medicines found. Try another search."
                    )
                );

            }

            updateSummary();
            return;
        }

        filteredMedicines.forEach(medicine => {

            const card = createElement("article", "medicine-card");

            // Medicine name
            const heading = createElement(
                "h3",
                "medicine-card-heading",
                medicine.name
            );

            card.appendChild(heading);

            // Strength
            const strength = createElement(
                "p",
                "medicine-strength",
                medicine.strength || "Strength not specified"
            );

            card.appendChild(strength);

            // Available stock
            const stockSection = createElement(
                "div",
                "medicine-stock-section"
            );

            stockSection.appendChild(
                createElement("span", "stock-label", "Available stock")
            );

            stockSection.appendChild(
                createElement(
                    "span",
                    "stock-value",
                    `${medicine.stock} units`
                )
            );

            const stockStatus = getStockStatus(Number(medicine.stock));

            stockSection.appendChild(
                createElement(
                    "span",
                    `stock-status ${stockStatus.className}`,
                    stockStatus.text
                )
            );

            card.appendChild(stockSection);

            // Stock controls
            const stockControls = createElement("div", "stock-controls");

            const decreaseBtn = createElement("button", "stock-btn", "−");
            decreaseBtn.type = "button";
            decreaseBtn.setAttribute("aria-label", "Decrease stock");
            decreaseBtn.disabled = Number(medicine.stock) <= 0;

            decreaseBtn.addEventListener("click", () => {
                changeStock(medicine.id, -1);
            });

            const increaseBtn = createElement("button", "stock-btn", "+");
            increaseBtn.type = "button";
            increaseBtn.setAttribute("aria-label", "Increase stock");

            increaseBtn.addEventListener("click", () => {
                changeStock(medicine.id, 1);
            });

            stockControls.appendChild(decreaseBtn);
            stockControls.appendChild(increaseBtn);

            card.appendChild(stockControls);

            // Instructions and notes
            const information = createElement(
                "div",
                "medicine-information"
            );

            const instructions = createElement("p");
            const instructionsLabel = createElement(
                "strong",
                "",
                "Prescription instructions: "
            );

            instructions.appendChild(instructionsLabel);
            instructions.appendChild(
                document.createTextNode(
                    medicine.instructions || "Not provided"
                )
            );

            const notes = createElement("p");
            const notesLabel = createElement("strong", "", "Notes: ");

            notes.appendChild(notesLabel);
            notes.appendChild(
                document.createTextNode(medicine.notes || "None")
            );

            information.appendChild(instructions);
            information.appendChild(notes);

            card.appendChild(information);

            // Edit and delete actions
            const actions = createElement("div", "medicine-actions");

            const editBtn = createElement(
                "button",
                "edit-medicine-btn",
                "Edit"
            );

            editBtn.type = "button";

            editBtn.addEventListener("click", () => {
                openEditModal(medicine.id);
            });

            const deleteBtn = createElement(
                "button",
                "delete-medicine-btn",
                "Delete"
            );

            deleteBtn.type = "button";

            deleteBtn.addEventListener("click", () => {
                deleteMedicine(medicine.id);
            });

            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            card.appendChild(actions);

            medicineList.appendChild(card);

        });

        updateSummary();
    }

    function openAddModal() {

        editingMedicineId = null;

        medicineForm.reset();

        modalTitle.textContent = "Add Medicine";

        medicineFormMessage.textContent = "";
        medicineFormMessage.className = "form-message";

        medicineModal.hidden = false;

        medicineName.focus();
    }

    function openEditModal(id) {

        const medicine = medicines.find(item => item.id === id);

        if (!medicine) return;

        editingMedicineId = id;

        medicineName.value = medicine.name;
        medicineStrength.value = medicine.strength || "";
        medicineStock.value = medicine.stock;
        medicineInstructions.value = medicine.instructions || "";
        medicineNotes.value = medicine.notes || "";

        modalTitle.textContent = "Edit Medicine";

        medicineFormMessage.textContent = "";
        medicineFormMessage.className = "form-message";

        medicineModal.hidden = false;

        medicineName.focus();
    }

    function closeModal() {

        medicineModal.hidden = true;

        medicineForm.reset();

        editingMedicineId = null;

        medicineFormMessage.textContent = "";
        medicineFormMessage.className = "form-message";
    }

    medicineForm.addEventListener("submit", event => {

        event.preventDefault();

        const name = medicineName.value.trim();
        const strength = medicineStrength.value.trim();
        const stock = Number(medicineStock.value);
        const instructions = medicineInstructions.value.trim();
        const notes = medicineNotes.value.trim();

        if (!name) {
            showFormMessage("Please enter the medicine name.", "error");
            return;
        }

        if (
            medicineStock.value.trim() === "" ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            showFormMessage(
                "Please enter a valid whole-number stock quantity.",
                "error"
            );
            return;
        }

        if (editingMedicineId !== null) {

            const medicine = medicines.find(
                item => item.id === editingMedicineId
            );

            if (!medicine) return;

            medicine.name = name;
            medicine.strength = strength;
            medicine.stock = stock;
            medicine.instructions = instructions;
            medicine.notes = notes;
            medicine.updatedAt = new Date().toISOString();

        } else {

            const newMedicine = {
                id: Date.now().toString(),
                name,
                strength,
                stock,
                instructions,
                notes,
                createdAt: new Date().toISOString()
            };

            medicines.push(newMedicine);
        }

        saveMedicines();
        renderMedicines(medicineSearch.value);

        closeModal();

    });

    function showFormMessage(message, type) {
        medicineFormMessage.textContent = message;
        medicineFormMessage.className = `form-message ${type}`;
    }

    function changeStock(id, amount) {

        const medicine = medicines.find(item => item.id === id);

        if (!medicine) return;

        const newStock = Number(medicine.stock) + amount;

        if (newStock < 0) return;

        medicine.stock = newStock;
        medicine.updatedAt = new Date().toISOString();

        saveMedicines();
        renderMedicines(medicineSearch.value);
    }

    function deleteMedicine(id) {

        const medicine = medicines.find(item => item.id === id);

        if (!medicine) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete ${medicine.name}?`
        );

        if (!confirmed) return;

        medicines = medicines.filter(item => item.id !== id);

        saveMedicines();
        renderMedicines(medicineSearch.value);
    }

    // BUTTON EVENTS

    addMedicineBtn.addEventListener("click", openAddModal);
    emptyAddBtn.addEventListener("click", openAddModal);

    closeMedicineModal.addEventListener("click", closeModal);
    cancelMedicineBtn.addEventListener("click", closeModal);

    medicineModal.addEventListener("click", event => {
        if (event.target === medicineModal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !medicineModal.hidden) {
            closeModal();
        }
    });

    medicineSearch.addEventListener("input", () => {
        renderMedicines(medicineSearch.value);
    });

    // INITIAL RENDER

    renderMedicines();

});
