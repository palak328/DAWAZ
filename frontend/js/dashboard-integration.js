
document.addEventListener("DOMContentLoaded", async () => {
    const statusMessage = (message) => {
        let el = document.getElementById("backendStatus");

        if (!el) {
            el = document.createElement("p");
            el.id = "backendStatus";

            const target =
                document.querySelector(".medicine-schedule-card")?.parentElement ||
                document.querySelector("main");

            target?.prepend(el);
        }

        if (el) el.textContent = message;
    };

    if (!window.DawazAPI) {
        statusMessage("Backend API service is not loaded.");
        return;
    }

    const escapeHTML = (value) =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);

    const formatTime = (dose) => {
        const value = dose.scheduled_time || dose.scheduled_for;

        if (!value) return "Time not specified";

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
    };

    async function reportDose(id, status, button) {
        button.disabled = true;
        button.textContent = "Saving...";

        try {
            await DawazAPI.request(`/dose-occurrences/${id}/report`, {
                method: "POST",
                body: JSON.stringify({
                    status,
                    notes: null
                })
            });

            await loadDashboard();

        } catch (error) {
            alert(error.message || "Could not update dose status.");

            button.disabled = false;
            button.textContent = status === "taken" ? "Taken" : "Skipped";
        }
    }

    function renderDoses(doses = []) {
        const container = document.getElementById("backendDoseList");

        if (!container) return;

        if (!doses.length) {
            container.innerHTML = "<p>No doses scheduled for today.</p>";
            return;
        }

        container.innerHTML = doses.map(dose => {
            const status = dose.status || "pending";
            const name = escapeHTML(dose.medicine_name || "Medicine");
            const time = escapeHTML(formatTime(dose));
            const id = Number(dose.id);

            return `
                <article class="medicine-item" data-dose-id="${id}">
                    <div class="medicine-details">
                        <h3>${name}</h3>
                        <p>${time}</p>
                    </div>

                    <div class="medicine-checkpoint">
                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                        ${status === "pending" ? `
                            <div class="dose-actions">
                                <button type="button"
                                    data-dose="${id}"
                                    data-status="taken">
                                    Taken
                                </button>

                                <button type="button"
                                    data-dose="${id}"
                                    data-status="skipped">
                                    Skipped
                                </button>
                            </div>
                        ` : ""}
                    </div>
                </article>
            `;
        }).join("");

        container.querySelectorAll("button[data-dose]").forEach(button => {
            button.addEventListener("click", () => {
                reportDose(
                    button.dataset.dose,
                    button.dataset.status,
                    button
                );
            });
        });
    }

    async function loadDashboard() {
        try {
            statusMessage("Loading your dashboard...");

            const data = await DawazAPI.request("/patients/dashboard");
            const todayDoses = data.today_doses || [];

            // Today's medicine count
            const medicineCount =
                document.getElementById("todayMedicineCount");

            if (medicineCount) {
                medicineCount.textContent = todayDoses.length;
            }

            // Medicine stock count
            const stockCount =
                document.getElementById("medicineStockCount");

            try {
                const stockItems = await DawazAPI.request("/stock/");

                if (stockCount) {
                    stockCount.textContent = stockItems.length;
                }
            } catch (error) {
                console.error("Could not load medicine stock:", error);

                if (stockCount) {
                    stockCount.textContent = "—";
                }
            }

            // Dose progress
            const completed =
                todayDoses.filter(d => d.status === "taken").length;

            const total = todayDoses.length;
            const percentage = total
                ? Math.round((completed / total) * 100)
                : 0;

            const progressText =
                document.getElementById("progressText");

            const progressPercentage =
                document.getElementById("progressPercentage");

            const progressBar =
                document.getElementById("progressBar");

            if (progressText) {
                progressText.textContent = `${completed}/${total} doses taken`;
            }

            if (progressPercentage) {
                progressPercentage.textContent = `${percentage}%`;
            }

            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }

            // Current date
            const dateElement =
                document.getElementById("currentDate");

            if (dateElement) {
                dateElement.textContent = new Date().toLocaleDateString(
                    undefined,
                    {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                );
            }

            // Next pending reminder
            const nextDose = todayDoses.find(
                dose => dose.status === "pending"
            );

            const nextTime =
                document.getElementById("nextReminderTime");

            const nextMedicine =
                document.getElementById("nextReminderMedicine");

            if (nextDose) {
                if (nextTime) {
                    nextTime.textContent = formatTime(nextDose);
                }

                if (nextMedicine) {
                    nextMedicine.textContent =
                        nextDose.medicine_name || "Medicine";
                }
            } else {
                if (nextTime) {
                    nextTime.textContent = "No pending doses";
                }

                if (nextMedicine) {
                    nextMedicine.textContent = "";
                }
            }

            renderDoses(todayDoses);

            statusMessage("Dashboard connected to the backend.");

        } catch (error) {
            console.error("Dashboard loading failed:", error);

            statusMessage(
                error.message || "Could not load dashboard data."
            );
        }
    }

    await loadDashboard();
});
