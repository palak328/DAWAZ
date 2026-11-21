document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#caregiverForm");
    const container = document.querySelector(
        "#caregiverInvitations, #invitationList"
    );

    async function loadInvitations() {
        if (!container) return;

        try {
            const [sent, received] = await Promise.all([
                DawazAPI.request("/care-invitations/sent"),
                DawazAPI.request("/care-invitations/received")
            ]);

            container.innerHTML = "<h3>Sent Invitations</h3>";

            const sentItems = Array.isArray(sent) ? sent : sent.items || [];
            const receivedItems = Array.isArray(received)
                ? received
                : received.items || [];

            sentItems.forEach(item => {
                const p = document.createElement("p");
                p.textContent = `Invitation #${item.id}: ${item.status}`;
                container.appendChild(p);
            });

            const heading = document.createElement("h3");
            heading.textContent = "Received Invitations";
            container.appendChild(heading);

            receivedItems.forEach(item => {
                const card = document.createElement("div");
                card.textContent = `Invitation #${item.id}: ${item.status}`;

                if (item.status === "pending") {
                    const button = document.createElement("button");
                    button.textContent = "Accept invitation";

                    button.addEventListener("click", async () => {
                        try {
                            await DawazAPI.request(
                                `/care-invitations/${item.id}/accept`,
                                { method: "POST" }
                            );
                            await loadInvitations();
                        } catch (error) {
                            alert(error.message);
                        }
                    });

                    card.appendChild(button);
                }

                if (item.status === "accepted") {
                    const consent = document.createElement("button");
                    consent.textContent = "Grant consent";

                    consent.addEventListener("click", async () => {
                        const confirmed = confirm(
                            "Grant this caregiver access to your patient dashboard?"
                        );
                        if (!confirmed) return;

                        try {
                            await DawazAPI.request(
                                `/care-invitations/${item.id}/consent`,
                                { method: "POST" }
                            );
                            await loadInvitations();
                        } catch (error) {
                            alert(error.message);
                        }
                    });

                    card.appendChild(consent);
                }

                container.appendChild(card);
            });
        } catch (error) {
            container.textContent =
                `Could not load invitations: ${error.message}`;
        }
    }

    if (form) {
        form.addEventListener("submit", async event => {
            event.preventDefault();

            const input = form.querySelector(
                '[name="username"], #caregiverUsername'
            );

            const username = input?.value.trim();

            if (!username) {
                alert("Enter a caregiver username.");
                return;
            }

            try {
                await DawazAPI.request("/care-invitations", {
                    method: "POST",
                    body: JSON.stringify({
                        caregiver_username: username
                    })
                });

                alert("Invitation created.");
                form.reset();
                await loadInvitations();
            } catch (error) {
                alert(error.message);
            }
        });
    }

    loadInvitations();
});