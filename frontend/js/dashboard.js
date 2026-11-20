
// Get the date element from the dashboard
const dateElement = document.getElementById("currentDate");

// Get the current date
const today = new Date();

// Format the date
const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
});

// Display the date on the dashboard
if (dateElement) {
    dateElement.textContent = formattedDate;
}
