
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const message = document.getElementById("message");

    if (!email || !password) {

        message.textContent = "Please fill all fields.";
        return;
    }

    message.textContent = "Login interface working.";

    // Temporary frontend navigation.
    // Real authentication will be connected to the backend.

    if (role === "patient") {
        window.location.href = "pages/dashboard.html";
    }

    else {
        window.location.href = "pages/dashboard.html";
    }

});
