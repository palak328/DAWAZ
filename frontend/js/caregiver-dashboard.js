
document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#caregiverDashboard, #caregiverContent, main"
    );

    if (!container) return;

    if (!window.DawazAPI) {
        container.textContent = "Backend API service is not loaded.";
        return;
    }

    container.innerHTML = "<h2>Linked Patients</h2><p>Loading...</p>";

    try {
        const result = await DawazAPI.request("/caregiver/patients");
        const patients = Array.isArray(result.patients)
            ? result.patients
            : [];

        container.innerHTML = "<h2>Linked Patients</h2>";

        if (!patients.length) {
            container.appendChild(
                document.createTextNode(
                    "No patients with active consent found."
                )
            );
            return;
        }

        for (const patient of patients) {
            const section = document.createElement("section");
            section.className = "caregiver-patient-card";

            const heading = document.createElement("h3");
            heading.textContent = `Patient #${patient.patient_id}`;

            section.appendChild(heading);

            try {
                const dashboard = await DawazAPI.request(
                    `/caregiver/patients/${patient.patient_id}/dashboard`
                );

                const prescriptions = Array.isArray(dashboard.prescriptions)
                    ? dashboard.prescriptions
                    : [];

                const doses = Array.isArray(dashboard.recent_dose_occurrences)
                    ? dashboard.recent_dose_occurrences
                    : [];

                const stock = Array.isArray(dashboard.stock)
                    ? dashboard.stock
                    : [];

                const alerts = Array.isArray(dashboard.unread_alerts)
                    ? dashboard.unread_alerts
                    : [];

                const details = [
                    `Active prescriptions: ${prescriptions.length}`,
                    `Recent dose records: ${doses.length}`,
                    `Medicine stock records: ${stock.length}`,
                    `Unread alerts: ${alerts.length}`
                ];

                details.forEach(text => {
                    const paragraph = document.createElement("p");
                    paragraph.textContent = text;
                    section.appendChild(paragraph);
                });

                const language = document.createElement("p");
                language.textContent =
                    `Preferred language: ${
                        dashboard.patient?.preferred_language || "Not specified"
                    }`;

                section.appendChild(language);

            } catch (error) {
                const errorMessage = document.createElement("p");
                errorMessage.textContent =
                    `Could not load this patient's data: ${error.message}`;
                section.appendChild(errorMessage);
            }

            container.appendChild(section);
        }

    } catch (error) {
        container.textContent =
            `Could not load caregiver dashboard: ${error.message}`;
    }
});
