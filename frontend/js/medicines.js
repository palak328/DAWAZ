
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#medicineList, #medicineCabinet, .medicine-list"
    );

    if (!container) return;

    async function loadMedicines() {
        container.textContent = "Loading medicine cabinet...";

        try {
            const [prescriptions, stockRecords] = await Promise.all([
                DawazAPI.request("/prescriptions"),
                DawazAPI.request("/stock/")
            ]);

            const activePrescriptions = (
                Array.isArray(prescriptions) ? prescriptions : []
            ).filter(p => p.status === "active");

            const stock = Array.isArray(stockRecords)
                ? stockRecords
                : [];

            container.innerHTML = "<h2>Medicine Cabinet</h2>";

            const items = activePrescriptions.flatMap(p =>
                (p.items || []).map(item => ({
                    ...item,
                    prescription_id: p.id
                }))
            );

            if (!items.length) {
                container.appendChild(
                    document.createTextNode(
                        "No active prescription medicines available."
                    )
                );
                return;
            }

            items.forEach(item => {
                const record = stock.find(
                    s => Number(s.prescription_item_id) === Number(item.id)
                );

                const card = document.createElement("article");
                card.className = "medicine-card";

                const heading = document.createElement("h3");
                heading.textContent = item.medicine_name || "Medicine";

                const details = document.createElement("p");
                details.textContent =
                    `Strength: ${item.strength || "Not recorded"}`;

                const quantity = document.createElement("p");
                quantity.className = "stock-value";

                quantity.textContent = record
                    ? `${record.quantity} ${record.unit}`
                    : "Available stock: 0 (not recorded)";

                const form = document.createElement("form");
                form.className = "restock-form";

                const quantityInput = document.createElement("input");
                quantityInput.type = "number";
                quantityInput.min = "1";
                quantityInput.step = "1";
                quantityInput.required = true;
                quantityInput.placeholder = "Quantity to add";
                quantityInput.setAttribute(
                    "aria-label",
                    "Quantity to add"
                );

                const unitInput = document.createElement("input");
                unitInput.type = "text";
                unitInput.required = true;
                unitInput.maxLength = 30;
                unitInput.value = record
                    ? record.unit
                    : (item.dose_unit || "tablets");
                unitInput.placeholder = "Unit";
                unitInput.setAttribute("aria-label", "Stock unit");

                if (record) {
                    unitInput.readOnly = true;
                }

                const button = document.createElement("button");
                button.type = "submit";
                button.textContent = "Add Stock";

                const message = document.createElement("p");
                message.setAttribute("role", "status");

                form.append(
                    quantityInput,
                    unitInput,
                    button
                );

                form.addEventListener("submit", async event => {
                    event.preventDefault();

                    const amount = Number(quantityInput.value);
                    const unit = unitInput.value.trim();

                    if (
                        !Number.isSafeInteger(amount) ||
                        amount <= 0 ||
                        !unit
                    ) {
                        message.textContent =
                            "Enter a valid positive whole quantity and unit.";
                        return;
                    }

                    button.disabled = true;
                    message.textContent = "Updating stock...";

                    try {
                        await DawazAPI.request("/stock/restock", {
                            method: "POST",
                            body: JSON.stringify({
                                prescription_item_id: item.id,
                                quantity: amount,
                                unit: unit,
                                notes: "Manual restock"
                            })
                        });

                        message.textContent = "Stock updated successfully.";
                        await loadMedicines();
                    } catch (error) {
                        message.textContent =
                            `Could not update stock: ${error.message}`;
                        button.disabled = false;
                    }
                });

                card.append(
                    heading,
                    details,
                    quantity,
                    form,
                    message
                );

                container.appendChild(card);
            });

        } catch (error) {
            container.textContent =
                `Could not load medicine cabinet: ${error.message}`;
        }
    }

    await loadMedicines();
});
