document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const input = document.querySelector(
        'textarea, input[name="question"]'
    );
    const output = document.querySelector(
        "#chatMessages, #chatContainer, .chat-messages"
    );

    if (!form || !input || !output) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = input.value.trim();
        if (!question) return;

        const userMessage = document.createElement("p");
        userMessage.textContent = `You: ${question}`;
        output.appendChild(userMessage);

        input.value = "";

        try {
            const result = await DawazAPI.request("/questions", {
                method: "POST",
                body: JSON.stringify({
                    question,
                    language: sessionStorage.getItem("dawazLanguage") || "en-IN"
                })
            });

            const answer = document.createElement("p");
            answer.textContent =
                "DAWAZ: " +
                (result.answer || result.response || result.message ||
                 "No answer was returned.");
            output.appendChild(answer);

        } catch (error) {
            const errorMessage = document.createElement("p");
            errorMessage.textContent = `Error: ${error.message}`;
            output.appendChild(errorMessage);
        }

        output.scrollTop = output.scrollHeight;
    });
});