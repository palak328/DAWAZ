document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#caregiverForm");
    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const usernameInput = form.querySelector(
            '[name="username"], #caregiverUsername'
        );

        const username = usernameInput?.value.trim();

        if (!username) {
            alert("Enter the caregiver username.");
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        if (button) {
            button.disabled = true;
            button.textContent = "Sending...";
        }

        try {
            const result = await DawazAPI.request("/care-invitations", {
                method: "POST",
                body: JSON.stringify({ caregiver_username: username })
            });

            alert(result.message || "Invitation request submitted.");
            form.reset();

        } catch (error) {
            alert(error.message || "Could not send invitation.");
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Send Invitation";
            }
        }
    });
});