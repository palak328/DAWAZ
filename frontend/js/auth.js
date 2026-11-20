
// Get the login form
const loginForm = document.getElementById("loginForm");

// Listen for form submission
loginForm.addEventListener("submit", function(event) {

    // Prevent page reload
    event.preventDefault();

    // Get input values
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    // Get feedback message element
    const message = document.getElementById("message");

    // Validate input fields
    if (!username || !password) {

        message.textContent = "Please fill all fields.";
        return;
    }

    // Display login status
    message.textContent = "Login interface working.";

    // Temporary frontend navigation
    // Real authentication will be connected to the backend.

    if (role === "patient") {

        window.location.href = "pages/dashboard.html";

    } else {

        window.location.href = "pages/dashboard.html";

    }

});
