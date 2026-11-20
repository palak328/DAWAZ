
document.addEventListener("DOMContentLoaded", () => {

    // ---------- ELEMENTS ----------

    const STORAGE_KEY = "dawazMedicines";

    const medicineList = document.getElementById("medicineList");
    const searchInput = document.getElementById("medicineSearch");

    const modal = document.getElementById("medicineModal");
    const form = document.getElementById("medicineForm");

    const addButton = document.getElementById("addMedicineBtn");
    const emptyAddButton = document.getElementById("emptyAddBtn");
    const closeButton = document.getElementById("closeMedicineModal");
    const cancelButton = document.getElementById("cancelMedicineBtn");

    const nameInput = document.getElementById("medicineName");
    const strengthInput = document.getElementById("medicineStrength");
    const stockInput = document.getElementById("medicineStock");
    const instructionsInput = document.getElementById("medicineInstructions");
    const notesInput = document.getElementById("medicineNotes");

    const totalMedicines = document.getElementById("totalMedicines");
    const lowStockMedicines = document.getElementById("lowStockMedicines");
    const outOfStockMedicines = document.getElementById("outOfStockMedicines");

    const modalTitle = document.getElementById("modalTitle");
    const formMessage = document.getElementById("medicineFormMessage");

    // ---------- DATA ----------

    let medicines = loadMedicines();
    let editingId = null;

    function loadMedicines() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not load medicine records:", error);
            return [];
        }
    }

    function saveMedicines() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
    }

    function createId() {
        return window.crypto?.randomUUID?.() ||
            `medicine-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    // ---------- MODAL ----------

    function openModal(medicine = null) {

        form.reset();
        editingId = medicine ? medicine.id : null;

        formMessage.textContent = "";
        formMessage.className = "form-message";

        if (medicine) {

            modalTitle.textContent = "Edit Medicine";

            nameInput.value = medicine.name || "";
            strengthInput.value = medicine.strength || "";
            stockInput.value = medicine.stock ?? 0;
            instructionsInput.value = medicine.instructions || "";
            notesInput.value = medicine.notes || "";

        } else {

            modalTitle.textContent = "Add Medicine";
        }

        modal.hidden = false;
        nameInput.focus();
    }

    function closeModal() {

        modal.hidden = true;
        form.reset();
        editingId = null;
        formMessage.textContent = "";
    }

    addButton.addEventListener("click", () => openModal());

    emptyAddButton?.addEventListener("click", () => openModal());

    closeButton.addEventListener("click", closeModal);

    cancelButton.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) {
            closeModal();
        }
    });

    // ---------- ADD / EDIT MEDICINE ----------

    form.addEventListener("submit", event => {

        event.preventDefault();

        const name = nameInput.value.trim();
        const strength = strengthInput.value.trim();
        const stock = Number(stockInput.value);
        const instructions = instructionsInput.value.trim();
        const notes = notesInput.value.trim();

        if (!name) {
            showMessage("Please enter the medicine name.", "error");
            return;
        }

        if (
            stockInput.value.trim() === "" ||
            !Number.isInteger(stock) ||
            stock < 0
        ) {
            showMessage("Enter a valid whole-number stock quantity.", "error");
            return;
        }

        const medicineData = {
            name,
            strength,
            stock,
            instructions,
            notes
        };

        if (editingId) {

            const index = medicines.findIndex(
                medicine => medicine.id === editingId
            );

            if (index !== -1) {

                medicines[index] = {
                    ...medicines[index],
                    ...medicineData,
                    updatedAt: new Date().toISOString()
                };
            }

        } else {

            medicines.push({
                id: createId(),
                ...medicineData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        saveMedicines();
        closeModal();
        renderMedicines();
    });

    function showMessage(message, type) {

        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
    }

    // ---------- DELETE MEDICINE ----------

    function deleteMedicine(id) {

        const medicine = medicines.find(item => item.id === id);

        if (!medicine) return;

        const confirmed = confirm(
            `Delete ${medicine.name} from your medicine records?`
        );

        if (!confirmed) return;

        medicines = medicines.filter(item => item.id !== id);

        saveMedicines();
        renderMedicines();
    }

    // ---------- UPDATE STOCK ----------

    function updateStock(id, change) {

        const medicine = medicines.find(item => item.id === id);

        if (!medicine) return;

        const newStock = medicine.stock + change;

        if (newStock < 0) {
            alert("Stock cannot be less than zero.");
            return;
        }

        medicine.stock = newStock;
        medicine.updatedAt = new Date().toISOString();

        saveMedicines();
        renderMedicines();
    }

    // ---------- MEDICINE CARD ----------

    function createMedicineCard(medicine) {

        const card = document.createElement("article");
        card.className = "medicine-card";

        const stockStatus =
            medicine.stock === 0
                ? "Out of Stock"
                : medicine.stock <= 5
                    ? "Low Stock"
                    : "Available";

        const stockClass =
            medicine.stock === 0
                ? "out-of-stock"
                : medicine.stock <= 5
                    ? "low-stock"
                    : "available";

        const heading = document.createElement("div");
        heading.className = "medicine-card-heading";

        const name = document.createElement("h3");
        name.textContent = medicine.name;

        const strength = document.createElement("p");
        strength.className = "medicine-strength";
        strength.textContent = medicine.strength || "Strength not recorded";

        heading.append(name, strength);

        const stockSection = document.createElement("div");
        stockSection.className = "medicine-stock-section";

        const stockLabel = document.createElement("span");
        stockLabel.textContent = "Available stock";

        const stockValue = document.createElement("strong");
        stockValue.textContent = `${medicine.stock} units`;

        const status = document.createElement("span");
        status.className = `stock-status ${stockClass}`;
        status.textContent = stockStatus;

        stockSection.append(stockLabel, stockValue, status);

        const stockControls = document.createElement("div");
        stockControls.className = "stock-controls";

        const decreaseButton = createButton("−", "stock-btn", () => {
            updateStock(medicine.id, -1);
        });

        decreaseButton.setAttribute("aria-label", "Decrease stock");

        const increaseButton = createButton("+", "stock-btn", () => {
            updateStock(medicine.id, 1);
        });

        increaseButton.setAttribute("aria-label", "Increase stock");

        stockControls.append(decreaseButton, increaseButton);

        const information = document.createElement("div");
        information.className = "medicine-information";

        if (medicine.instructions) {

            const instructions = document.createElement("p");
            instructions.textContent =
                `Prescription instructions: ${medicine.instructions}`;

            information.appendChild(instructions);
        }

        if (medicine.notes) {

            const notes = document.createElement("p");
            notes.textContent = `Notes: ${medicine.notes}`;

            information.appendChild(notes);
        }

        const actions = document.createElement("div");
        actions.className = "medicine-actions";

        const editButton = createButton("Edit", "edit-medicine-btn", () => {
            openModal(medicine);
        });

        const deleteButton = createButton(
            "Delete",
            "delete-medicine-btn",
            () => deleteMedicine(medicine.id)
        );

        actions.append(editButton, deleteButton);

        card.append(
            heading,
            stockSection,
            stockControls,
            information,
            actions
        );

        return card;
    }

    function createButton(label, className, callback) {

        const button = document.createElement("button");

        button.type = "button";
        button.textContent = label;
        button.className = className;

        button.addEventListener("click", callback);

        return button;
    }

    // ---------- SEARCH ----------

    function getFilteredMedicines() {

        const query = searchInput.value.trim().toLowerCase();

        return medicines.filter(medicine => {

            return (
                medicine.name.toLowerCase().includes(query) ||
                (medicine.strength || "").toLowerCase().includes(query)
            );
        });
    }

    searchInput.addEventListener("input", renderMedicines);

    // ---------- SUMMARY ----------

    function renderSummary() {

        const lowStock = medicines.filter(
            medicine => medicine.stock > 0 && medicine.stock <= 5
        ).length;

        const outOfStock = medicines.filter(
            medicine => medicine.stock === 0
        ).length;

        totalMedicines.textContent = medicines.length;
        lowStockMedicines.textContent = lowStock;
        outOfStockMedicines.textContent = outOfStock;
    }

    // ---------- RENDER MEDICINES ----------

    function renderMedicines() {

        medicineList.innerHTML = "";

        const filteredMedicines = getFilteredMedicines();

        if (medicines.length === 0) {

            const empty = document.createElement("div");
            empty.className = "empty-state";

            const heading = document.createElement("h3");
            heading.textContent = "No medicines added yet";

            const description = document.createElement("p");
            description.textContent =
                "Add your medicine records to manage your cabinet.";

            const button = createButton(
                "Add Your First Medicine",
                "primary-btn",
                () => openModal()
            );

            empty.append(heading, description, button);
            medicineList.appendChild(empty);

        } else if (filteredMedicines.length === 0) {

            const message = document.createElement("p");
            message.className = "no-results";
            message.textContent = "No medicines match your search.";

            medicineList.appendChild(message);

        } else {

            filteredMedicines.forEach(medicine => {

                medicineList.appendChild(
                    createMedicineCard(medicine)
                );
            });
        }

        renderSummary();
    }

    // ---------- INITIAL LOAD ----------

    renderMedicines();

});

