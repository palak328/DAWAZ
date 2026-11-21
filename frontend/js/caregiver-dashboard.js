document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#caregiverDashboard, #caregiverContent, main"
    );

    if (!container) return;

    try {
        const result = await DawazAPI.request("/caregiver/patients");
        const patients = result.patients || [];

        container.innerHTML = "<h2>Linked Patients</h2>";

        if (!patients.length) {
            container.innerHTML +=
                "<p>No patients with active consent found.</p>";
            return;
        }

        for (const patient of patients) {
            const dashboard = await DawazAPI.request(
                `/caregiver/patients/${patient.patient_id}/dashboard`
            );

            const section = document.createElement("section");
            section.className = "caregiver-patient-card";

            const heading = document.createElement("h3");
            heading.textContent = `Patient #${dashboard.patient.id}`;

            const prescriptions = document.createElement("p");
            prescriptions.textContent =
                `Active prescriptions: ${dashboard.prescriptions.length}`;

            const doses = document.createElement("p");
            doses.textContent =
                `Recent dose records: ${dashboard.recent_dose_occurrences.length}`;

            const stock = document.createElement("p");
            stock.textContent =
                `Medicine stock records: ${dashboard.stock.length}`;

            const alerts = document.createElement("p");
            alerts.textContent =
                `Unread alerts: ${dashboard.unread_alerts.length}`;

            section.append(heading, prescriptions, doses, stock, alerts);
            container.appendChild(section);
        }
    } catch (error) {
        container.textContent =
            `Could not load caregiver dashboard: ${error.message}`;
    }
});