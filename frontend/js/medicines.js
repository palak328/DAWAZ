document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#medicineList, #medicineCabinet, .medicine-list"
    );

    if (!container) return;

    const escapeHTML = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    try {
        const dashboard = await DawazAPI.request("/patients/dashboard");
        const stock = dashboard.stock || [];

        container.innerHTML = "<h2>Medicine Cabinet</h2>";

        if (!stock.length) {
            container.innerHTML += "<p>No medicine stock records available.</p>";
            return;
        }

        stock.forEach(item => {
            const card = document.createElement("article");
            card.className = "medicine-card";

            const name = item.medicine_name || item.name || "Medicine";
            const quantity = item.quantity ?? item.current_quantity ?? "Not recorded";
            const unit = item.unit || "units";

            card.innerHTML = `
                <h3>${escapeHTML(name)}</h3>
                <p>Available stock: ${escapeHTML(quantity)} ${escapeHTML(unit)}</p>
            `;

            container.appendChild(card);
        });
    } catch (error) {
        container.textContent =
            `Could not load medicine stock: ${error.message}`;
    }
});