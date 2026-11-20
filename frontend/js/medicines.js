
// Get the search input
const searchInput = document.getElementById("medicineSearch");

// Get all medicine cards
const medicineCards = document.querySelectorAll(".medicine-card");

// Listen for changes in the search input
searchInput.addEventListener("input", function() {

    // Get the search text
    const searchText = searchInput.value.toLowerCase().trim();

    // Track matching medicines
    let visibleCount = 0;

    // Check every medicine card
    medicineCards.forEach(function(card) {

        // Get the medicine name
        const medicineName = card.querySelector("h3").textContent.toLowerCase();

        // Check whether the name matches the search
        if (medicineName.includes(searchText)) {

            card.style.display = "grid";
            visibleCount++;

        } else {

            card.style.display = "none";

        }

    });

    // Show a message if no medicine matches
    let noResults = document.getElementById("noResults");

    if (!noResults) {

        noResults = document.createElement("p");
        noResults.id = "noResults";
        noResults.textContent = "No medicines found.";
        noResults.style.textAlign = "center";
        noResults.style.color = "#82908b";
        noResults.style.padding = "20px";

        document.querySelector(".medicine-records").appendChild(noResults);

    }

    noResults.style.display = visibleCount === 0 ? "block" : "none";

});
