
/* ============================================
   DAWAZ - VOICE SERVICE
   Text-to-Speech (TTS)
============================================ */

(function () {
    "use strict";

    const LANGUAGE_KEY = "dawazLanguage";

    let currentAudio = null;
    let currentBlobUrl = null;

    function getLanguage() {
        return localStorage.getItem(LANGUAGE_KEY) || "en";
    }

    function getLocale() {
        return getLanguage() === "hi" ? "hi-IN" : "en-IN";
    }

    function stop() {
        // Stop browser speech
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        // Stop backend audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }

        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = null;
        }
    }

    function speakWithBrowser(text) {
        return new Promise((resolve, reject) => {
            if (!("speechSynthesis" in window)) {
                reject(new Error("Browser speech is not supported."));
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = getLocale();

            const voices = window.speechSynthesis.getVoices();

            const languagePrefix = getLanguage() === "hi" ? "hi" : "en";

            const matchingVoice = voices.find(voice =>
                voice.lang.toLowerCase().startsWith(languagePrefix)
            );

            if (matchingVoice) {
                utterance.voice = matchingVoice;
            }

            utterance.onend = resolve;
            utterance.onerror = event => reject(event.error);

            window.speechSynthesis.speak(utterance);
        });
    }

    async function speakWithBackend(text) {
        const response = await fetch("/api/voice/speak", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                text: text,
                language: getLanguage()
            })
        });

        if (!response.ok) {
            throw new Error("Voice server error: " + response.status);
        }

        const audioBlob = await response.blob();

        if (!audioBlob.type.startsWith("audio/")) {
            throw new Error("The server did not return an audio file.");
        }

        currentBlobUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(currentBlobUrl);

        return new Promise((resolve, reject) => {
            currentAudio.onended = resolve;
            currentAudio.onerror = () => {
                reject(new Error("Unable to play voice audio."));
            };

            currentAudio.play().catch(reject);
        });
    }

    async function speak(text) {
        if (!text || !text.trim()) return;

        stop();

        const language = getLanguage();

        // Hindi requires a backend voice service if the
        // browser does not have a Hindi voice installed.
        if (language === "hi") {
            return speakWithBackend(text);
        }

        return speakWithBrowser(text);
    }

    window.DAWAZ_VOICE = {
        speak: speak,
        stop: stop,
        getLanguage: getLanguage,
        getLocale: getLocale
    };

})();
