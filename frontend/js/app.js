document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#alertsList, #alertList, .alerts-list"
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

    async function loadAlerts() {
        try {
            const alerts = await DawazAPI.request("/alerts");

            container.innerHTML = "<h2>Alerts</h2>";

            const items = Array.isArray(alerts)
                ? alerts
                : alerts.items || alerts.alerts || [];

            if (!items.length) {
                container.innerHTML += "<p>No alerts available.</p>";
                return;
            }

            items.forEach(alert => {
                const card = document.createElement("article");
                card.className = "alert-card";

                card.innerHTML = `
                    <h3>${escapeHTML(alert.title || alert.type || "Alert")}</h3>
                    <p>${escapeHTML(alert.message || alert.description || "")}</p>
                    <p>${escapeHTML(alert.created_at || "")}</p>
                `;

                if (!alert.acknowledged) {
                    const button = document.createElement("button");
                    button.textContent = "Acknowledge";

                    button.addEventListener("click", async () => {
                        button.disabled = true;

                        try {
                            await DawazAPI.request(
                                `/alerts/${alert.id}/acknowledge`,
                                { method: "POST" }
                            );
                            await loadAlerts();
                        } catch (error) {
                            alert(error.message);
                            button.disabled = false;
                        }
                    });

                    card.appendChild(button);
                }

                container.appendChild(card);
            });
        } catch (error) {
            container.textContent = `Could not load alerts: ${error.message}`;
        }
    }

    await loadAlerts();
});