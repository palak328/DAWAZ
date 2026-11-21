document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#remindersList, #reminderList, main"
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

    const formatTime = value => {
        if (!value) return "Time not specified";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
    };

    async function loadReminders() {
        try {
            const data = await DawazAPI.request("/patients/dashboard");
            const doses = data.today_doses || [];

            container.innerHTML = "<h2>Today's Reminders</h2>";

            if (!doses.length) {
                container.innerHTML += "<p>No doses scheduled today.</p>";
                return;
            }

            doses.forEach(dose => {
                const card = document.createElement("article");
                card.className = "reminder-card";

                const status = dose.status || "pending";
                const time = formatTime(
                    dose.scheduled_time || dose.scheduled_for
                );

                card.innerHTML = `
                    <h3>${escapeHTML(dose.medicine_name || "Medicine")}</h3>
                    <p>${escapeHTML(time)}</p>
                    <p>Status: ${escapeHTML(status)}</p>
                `;

                if (status === "pending") {
                    ["taken", "skipped"].forEach(action => {
                        const button = document.createElement("button");
                        button.textContent =
                            action === "taken" ? "Taken" : "Skipped";

                        button.addEventListener("click", async () => {
                            button.disabled = true;

                            try {
                                await DawazAPI.request(
                                    `/dose-occurrences/${dose.id}/report`,
                                    {
                                        method: "POST",
                                        body: JSON.stringify({
                                            status: action,
                                            notes: null
                                        })
                                    }
                                );

                                await loadReminders();
                            } catch (error) {
                                alert(error.message);
                                button.disabled = false;
                            }
                        });

                        card.appendChild(button);
                    });
                }

                container.appendChild(card);
            });
        } catch (error) {
            container.textContent =
                `Could not load reminders: ${error.message}`;
        }
    }

    await loadReminders();
});