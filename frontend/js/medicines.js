
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#medicineList, #medicineCabinet, .medicine-list"
    );

    if (!container) return;

    async function loadMedicines() {
        container.textContent = "Loading medicine cabinet...";

        try {
            const [prescriptions, stockRecords, schedules] = await Promise.all([
                DawazAPI.request("/prescriptions"),
                DawazAPI.request("/stock/"),
                DawazAPI.request("/medication-schedules")
            ]);

            const activePrescriptions = (
                Array.isArray(prescriptions) ? prescriptions : []
            ).filter(p => p.status === "active");

            const stock = Array.isArray(stockRecords)
                ? stockRecords
                : [];
            const scheduleRecords = Array.isArray(schedules)
                ? schedules
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

                const scheduleSection = document.createElement("section");
                scheduleSection.className = "schedule-section";

                const scheduleHeading = document.createElement("h4");
                scheduleHeading.textContent = "Medication Reminders";

                const existingSchedules = scheduleRecords.filter(
                    s => Number(s.prescription_item_id) === Number(item.id)
                );

                const scheduleList = document.createElement("div");

                existingSchedules.forEach(schedule => {
                    const entry = document.createElement("p");

                    entry.textContent =
                        `${String(schedule.scheduled_time).slice(0, 5)} | ` +
                        `${schedule.start_date} to ${schedule.end_date}`;

                    scheduleList.appendChild(entry);
                });

                if (!existingSchedules.length) {
                    const empty = document.createElement("p");
                    empty.textContent = "No reminder schedule created.";
                    scheduleList.appendChild(empty);
                }

                const scheduleForm = document.createElement("form");
                scheduleForm.className = "schedule-form";

                const timeInput = document.createElement("input");
                timeInput.type = "time";
                timeInput.required = true;
                timeInput.setAttribute("aria-label", "Prescribed reminder time");

                const startInput = document.createElement("input");
                startInput.type = "date";
                startInput.required = true;
                startInput.value = item.start_date
                    ? String(item.start_date).slice(0, 10)
                    : "";
                startInput.setAttribute("aria-label", "Schedule start date");

                const endInput = document.createElement("input");
                endInput.type = "date";
                endInput.required = true;
                endInput.value = item.end_date
                    ? String(item.end_date).slice(0, 10)
                    : "";
                endInput.setAttribute("aria-label", "Schedule end date");

                const scheduleButton = document.createElement("button");
                scheduleButton.type = "submit";
                scheduleButton.textContent = "Create Reminder";

                const scheduleMessage = document.createElement("p");
                scheduleMessage.setAttribute("role", "status");

                scheduleForm.append(
                    timeInput,
                    startInput,
                    endInput,
                    scheduleButton
                );

                scheduleForm.addEventListener("submit", async event => {
                    event.preventDefault();

                    if (endInput.value < startInput.value) {
                        scheduleMessage.textContent =
                            "End date cannot be before start date.";
                        return;
                    }

                    scheduleButton.disabled = true;
                    scheduleMessage.textContent = "Creating reminder schedule...";

                    try {
                        await DawazAPI.request("/medication-schedules", {
                            method: "POST",
                            body: JSON.stringify({
                                prescription_item_id: item.id,
                                scheduled_time: timeInput.value,
                                start_date: startInput.value,
                                end_date: endInput.value,
                                timezone: "Asia/Kolkata"
                            })
                        });

                        scheduleMessage.textContent =
                            "Schedule created successfully.";

                        await loadMedicines();

                    } catch (error) {
                        scheduleMessage.textContent =
                            `Could not create schedule: ${error.message}`;

                        scheduleButton.disabled = false;
                    }
                });

                scheduleSection.append(
                    scheduleHeading,
                    scheduleList,
                    scheduleForm,
                    scheduleMessage
                );

card.append(
    heading,
    details,
    quantity,
    form,
    message,
    scheduleSection
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
