
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (!loginForm) return;

    const loginButton = document.getElementById("loginButton");
    const message = document.getElementById("message");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;
        const selectedRole = document.getElementById("role").value;

        if (!username || !password) {
            message.textContent = "Please fill all fields.";
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";
        message.textContent = "";

        try {
            const user = await DawazAPI.login(username, password);

            if (user.role !== selectedRole) {
                sessionStorage.removeItem("dawazToken");
                sessionStorage.removeItem("dawazUser");
                throw new Error(`This account is registered as ${user.role}.`);
            }

            message.textContent = "Login successful. Redirecting...";

            if (user.role === "patient") {
                window.location.href = "pages/dashboard.html";
            } else if (user.role === "caregiver") {
                window.location.href = "pages/caregiver-dashboard.html";
            } else {
                throw new Error("Unsupported account role.");
            }

        } catch (error) {
            message.textContent = error.message;
            loginButton.disabled = false;
            loginButton.textContent = "Login";
        }
    });
});
