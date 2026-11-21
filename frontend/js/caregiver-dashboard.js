document.addEventListener("DOMContentLoaded", async () => {
    const container = document.querySelector(
        "#caregiverDashboard, #caregiverContent, main"
    );

    if (!container) return;

    try {
        const data = await DawazAPI.request("/caregiver/dashboard");

        container.innerHTML = "<h2>Caregiver Dashboard</h2>";

        const patients = data.patients || data.linked_patients || [];

        if (!patients.length) {
            container.innerHTML +=
                "<p>No patients have granted caregiver access yet.</p>";
            return;
        }

        patients.forEach(patient => {
            const card = document.createElement("section");
            card.className = "caregiver-patient-card";

            const heading = document.createElement("h3");
            heading.textContent = patient.name || "Patient";

            const status = document.createElement("p");
            status.textContent =
                `Access: ${patient.status || "Active"}`;

            card.append(heading, status);
            container.appendChild(card);
        });

    } catch (error) {
        container.textContent =
            `Caregiver data unavailable: ${error.message}`;
    }
});