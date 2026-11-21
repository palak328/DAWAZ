
// =====================================
// DAWAZ ROLE-BASED LOGIN
// FRONTEND PROTOTYPE ONLY
// =====================================

const loginForm = document.getElementById("loginForm");

const loginButton = document.getElementById("loginButton");

const message = document.getElementById("message");

loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const username = document.getElementById("username").value.trim();

    const password = document.getElementById("password").value;

    const role = document.getElementById("role").value;


    // Validate input fields
    if (!username || !password) {

        message.textContent = "Please fill all fields.";
        return;

    }


    // Validate role
    if (!["patient", "caregiver"].includes(role)) {

        message.textContent = "Please select a valid role.";
        return;

    }


    // Show loading state
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    message.textContent = "Opening your dashboard...";


    // Store prototype session information
    // This is NOT secure authentication.
    sessionStorage.setItem("dawazUser", JSON.stringify({
        username: username,
        role: role
    }));


    // Redirect based on selected role
    if (role === "patient") {

        window.location.href = "pages/dashboard.html";

    } else if (role === "caregiver") {

        window.location.href = "pages/caregiver-dashboard.html";

    }

});


