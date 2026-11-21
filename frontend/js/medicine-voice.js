
document.addEventListener("DOMContentLoaded", () => {

    const medicineList = document.getElementById("medicineList");

    if (!medicineList) return;

    if (!("speechSynthesis" in window)) {
        console.warn("Text-to-speech is not supported in this browser.");
        return;
    }

    let currentButton = null;

    function stopSpeaking() {

        window.speechSynthesis.cancel();

        if (currentButton) {
            currentButton.textContent = "🔊 Read aloud";
        }

        currentButton = null;
    }

    function getMedicineText(card) {

        const name =
            card.querySelector(".medicine-card-heading")?.textContent.trim() || "";

        const strength =
            card.querySelector(".medicine-strength")?.textContent.trim() || "";

        const stock =
            card.querySelector(".stock-value")?.textContent.trim() || "";

        const instructions =
            card.querySelector(".medicine-information")?.textContent.trim() || "";

        return `
            Medicine name: ${name}.
            Strength: ${strength}.
            Available stock: ${stock}.
            ${instructions}
        `;
    }

    function addSpeakButton(card) {

        if (card.querySelector(".medicine-speak-btn")) return;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "medicine-speak-btn";
        button.textContent = "🔊 Read aloud";

        button.addEventListener("click", () => {

            if (currentButton === button) {
                stopSpeaking();
                return;
            }

            stopSpeaking();

            const text = getMedicineText(card);

            if (!text.trim()) return;

            const utterance = new SpeechSynthesisUtterance(text);

            utterance.lang = "en-IN";
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            currentButton = button;
            button.textContent = "⏹ Stop reading";

            utterance.onend = () => {

                if (currentButton === button) {
                    button.textContent = "🔊 Read aloud";
                    currentButton = null;
                }
            };

            utterance.onerror = () => {

                if (currentButton === button) {
                    button.textContent = "🔊 Read aloud";
                    currentButton = null;
                }
            };

            window.speechSynthesis.speak(utterance);

        });

        // Add the speaker button before the medicine name.
        card.prepend(button);
    }

    function scanMedicineCards() {

        const cards = medicineList.querySelectorAll(".medicine-card");

        cards.forEach(card => {
            addSpeakButton(card);
        });
    }

    // Add buttons to existing cards.
    scanMedicineCards();

    // Detect newly added or updated medicine cards.
    const observer = new MutationObserver(() => {
        scanMedicineCards();
    });

    observer.observe(medicineList, {
        childList: true,
        subtree: true
    });

    // Stop speaking when the user changes browser tabs.
    document.addEventListener("visibilitychange", () => {

        if (document.hidden) {
            stopSpeaking();
        }

    });

});

