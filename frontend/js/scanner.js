
document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS
    const fileInput = document.getElementById("medicineImage");
    const scanButton = document.getElementById("scanMedicineBtn");
    const resultArea = document.getElementById("resultContent");
    const resultCard = document.getElementById("resultCard");

    const startCameraBtn = document.getElementById("startCameraBtn");
    const captureBtn = document.getElementById("captureBtn");
    const cameraPreview = document.getElementById("cameraPreview");
    const captureCanvas = document.getElementById("captureCanvas");
    const cameraPlaceholder = document.getElementById("cameraPlaceholder");

    const fileName = document.getElementById("fileName");
    const imagePreview = document.getElementById("imagePreview");
    const imagePreviewContainer =
        document.getElementById("imagePreviewContainer");
    const removeImageBtn = document.getElementById("removeImageBtn");
    const scanMessage = document.getElementById("scanMessage");

    // RECONCILIATION
    const reconciliationCard =
        document.getElementById("reconciliationCard");
    const prescriptionSelect =
        document.getElementById("prescriptionSelect");
    const reconcileBtn =
        document.getElementById("reconcileBtn");
    const reconciliationMessage =
        document.getElementById("reconciliationMessage");
    const reconciliationResult =
        document.getElementById("reconciliationResult");

    // CHAT
    const medicineChatCard =
        document.getElementById("medicineChatCard");
    const chatForm = document.getElementById("medicineChatForm");
    const chatInput = document.getElementById("medicineChatInput");
    const chatMessages = document.getElementById("chatMessages");
    const chatMicBtn = document.getElementById("chatMicBtn");
    const chatVoiceStatus =
        document.getElementById("chatVoiceStatus");
    const chatStatus = document.getElementById("chatStatus");
    const sendChatBtn = document.getElementById("sendChatBtn");

    const retakeScanBtn =
        document.getElementById("retakeScanBtn");

    if (!fileInput || !scanButton) return;

    // COMMON HELPERS
    function showMessage(element, message) {
        if (element) element.textContent = message;
    }

    if (!window.DawazAPI) {
        showMessage(scanMessage, "Backend API service is not loaded.");
        scanButton.disabled = true;
        return;
    }

    // STATE
    let cameraStream = null;
    let selectedFile = null;
    let previewUrl = null;
    let recognition = null;

    function stopCamera() {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }

        if (cameraPreview) {
            cameraPreview.srcObject = null;
            cameraPreview.hidden = true;
        }

        if (captureBtn) captureBtn.disabled = true;

        if (cameraPlaceholder) {
            cameraPlaceholder.hidden = false;
        }
    }

    function clearImagePreview() {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            previewUrl = null;
        }

        if (imagePreview) imagePreview.removeAttribute("src");

        if (imagePreviewContainer) {
            imagePreviewContainer.hidden = true;
        }
    }

    function setSelectedFile(file) {
        selectedFile = file || null;

        if (fileName) {
            fileName.textContent = selectedFile
                ? selectedFile.name
                : "";
        }

        clearImagePreview();

        if (selectedFile && imagePreview && imagePreviewContainer) {
            previewUrl = URL.createObjectURL(selectedFile);
            imagePreview.src = previewUrl;
            imagePreviewContainer.hidden = false;
        }

        scanButton.disabled = !selectedFile;
    }

    function addDetail(parent, label, value) {
        if (value === undefined || value === null || value === "") {
            return;
        }

        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;

        paragraph.append(
            strong,
            document.createTextNode(String(value))
        );

        parent.appendChild(paragraph);
    }

    function getScanData(result) {
        return result?.scan_result?.data ||
            result?.data ||
            result?.scan_result ||
            {};
    }

    function getScanId(result) {
        return result?.scan_id ??
            result?.id ??
            result?.scan?.id ??
            null;
    }

    // RENDER SCAN RESULT
    function renderScanResult(result) {
        if (!resultArea) return;

        resultArea.replaceChildren();

        const scan = getScanData(result);
        const matched = scan.matched_medicine;

        const candidates = Array.isArray(scan.candidates)
            ? scan.candidates
            : [];

        const heading = document.createElement("h3");
        heading.textContent = "Scan Results";
        resultArea.appendChild(heading);

        addDetail(
            resultArea,
            "Identity Status",
            scan.identity_status || "UNKNOWN"
        );

        if (matched) {
            addDetail(
                resultArea,
                "Matched Medicine",
                matched.medicine_name ||
                matched.name ||
                matched.display_name
            );

            addDetail(resultArea, "Strength", matched.strength);

            addDetail(
                resultArea,
                "Form",
                matched.dosage_form || matched.form
            );
        }

        if (candidates.length) {
            const candidateHeading = document.createElement("h4");
            candidateHeading.textContent = "Possible Candidates";
            resultArea.appendChild(candidateHeading);

            candidates.forEach((candidate, index) => {
                const item = document.createElement("div");
                item.className = "candidate-card";
                item.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px;margin-bottom:6px;background:#f0f7f5;border-radius:6px;";

                const name = typeof candidate === "string"
                    ? candidate
                    : candidate.medicine_name ||
                      candidate.name ||
                      candidate.display_name ||
                      "Candidate details unavailable";

                const label = document.createElement("span");
                label.textContent = `${index + 1}. ${name}`;
                item.appendChild(label);

                const selectBtn = document.createElement("button");
                selectBtn.type = "button";
                selectBtn.textContent = "Select for Comparison";
                selectBtn.style.cssText = "padding:4px 10px;font-size:12px;background:#0B6E6E;color:#fff;border:none;border-radius:4px;cursor:pointer;";
                selectBtn.addEventListener("click", () => {
                    scan.identity_status = "CONFIRMED_FOR_DEMO";
                    scan.matched_medicine = typeof candidate === "object" ? candidate : { name: candidate };
                    if (result.scan_result && result.scan_result.data) {
                        result.scan_result.data.identity_status = "CONFIRMED_FOR_DEMO";
                        result.scan_result.data.matched_medicine = scan.matched_medicine;
                    }
                    if (result.data) {
                        result.data.identity_status = "CONFIRMED_FOR_DEMO";
                        result.data.matched_medicine = scan.matched_medicine;
                    }
                    sessionStorage.setItem("dawazLatestScan", JSON.stringify(result));
                    renderScanResult(result);
                    showMessage(reconciliationMessage, `Selected "${name}" for prescription comparison.`);
                });
                item.appendChild(selectBtn);

                resultArea.appendChild(item);
            });
        }

        addDetail(resultArea, "Message", scan.message);

        const warnings = [
            ...(Array.isArray(result.warnings) ? result.warnings : []),
            ...(Array.isArray(result.scan_result?.warnings)
                ? result.scan_result.warnings
                : [])
        ];

        warnings.forEach(warning => {
            addDetail(resultArea, "Warning", warning);
        });

        if (!matched && !candidates.length) {
            addDetail(
                resultArea,
                "Next Step",
                "Identity is not confirmed. Rescan or consult a pharmacist."
            );
        }

        if (resultCard) resultCard.hidden = false;
        if (reconciliationCard) reconciliationCard.hidden = false;
        if (medicineChatCard) medicineChatCard.hidden = false;
    }

    // IMAGE UPLOAD
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!file.type.startsWith("image/")) {
            showMessage(scanMessage, "Please select a valid image.");
            fileInput.value = "";
            setSelectedFile(null);
            return;
        }

        stopCamera();
        setSelectedFile(file);
        showMessage(scanMessage, "");
    });

    // REMOVE IMAGE
    if (removeImageBtn) {
        removeImageBtn.addEventListener("click", () => {
            fileInput.value = "";
            setSelectedFile(null);
            showMessage(scanMessage, "Image removed.");
        });
    }

    // CAMERA
    if (startCameraBtn && cameraPreview) {
        startCameraBtn.addEventListener("click", async () => {
            try {
                stopCamera();

                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Camera API unavailable");
                }

                cameraStream =
                    await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" }
                    });

                cameraPreview.srcObject = cameraStream;
                cameraPreview.hidden = false;

                if (cameraPlaceholder) {
                    cameraPlaceholder.hidden = true;
                }

                await cameraPreview.play();

                startCameraBtn.textContent = "Camera Started";

                if (captureBtn) captureBtn.disabled = false;

            } catch (error) {
                stopCamera();

                showMessage(
                    scanMessage,
                    "Camera unavailable. Please upload an image instead."
                );
            }
        });
    }

    // CAPTURE IMAGE
    if (captureBtn && cameraPreview && captureCanvas) {
        captureBtn.addEventListener("click", () => {
            if (!cameraPreview.videoWidth) {
                showMessage(scanMessage, "Camera is not ready.");
                return;
            }

            const context = captureCanvas.getContext("2d");

            captureCanvas.width = cameraPreview.videoWidth;
            captureCanvas.height = cameraPreview.videoHeight;

            context.drawImage(
                cameraPreview,
                0,
                0,
                captureCanvas.width,
                captureCanvas.height
            );

            captureBtn.disabled = true;

            captureCanvas.toBlob(blob => {
                if (!blob) {
                    showMessage(scanMessage, "Could not capture image.");
                    captureBtn.disabled = false;
                    return;
                }

                const file = new File(
                    [blob],
                    "medicine-capture.jpg",
                    { type: "image/jpeg" }
                );

                setSelectedFile(file);
                stopCamera();

                showMessage(scanMessage, "Image captured successfully.");
            }, "image/jpeg");
        });
    }

    // SCAN MEDICINE
    scanButton.addEventListener("click", async event => {
        event.preventDefault();

        if (!selectedFile) {
            showMessage(
                scanMessage,
                "Capture or select a medicine image first."
            );
            return;
        }

        scanButton.disabled = true;
        scanButton.textContent = "Scanning...";

        showMessage(scanMessage, "Processing medicine image...");

        if (resultArea) {
            resultArea.textContent = "Processing image...";
        }

        try {
            const body = new FormData();

            // Backend B expects "image".
            body.append("image", selectedFile);

            const result = await DawazAPI.request("/scans", {
                method: "POST",
                body
            });

            sessionStorage.setItem(
                "dawazLatestScan",
                JSON.stringify(result)
            );

            renderScanResult(result);

            showMessage(
                scanMessage,
                "Scan completed. Review the identification result."
            );

        } catch (error) {
            if (resultArea) {
                resultArea.textContent = error.message;
            }

            showMessage(scanMessage, error.message);

        } finally {
            scanButton.disabled = !selectedFile;
            scanButton.textContent = "Identify Medicine";
        }
    });

    // LOAD CONFIRMED PRESCRIPTIONS
    async function loadConfirmedPrescriptions() {
        if (!prescriptionSelect) return;

        try {
            const response =
                await DawazAPI.request("/prescriptions");

            const prescriptions = Array.isArray(response)
                ? response
                : response.prescriptions || response.items || [];

            const eligible = prescriptions.filter(prescription =>
                ["confirmed", "active"].includes(
                    String(prescription.status).toLowerCase()
                )
            );

            prescriptionSelect.replaceChildren();

            const placeholder = document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = eligible.length
                ? "Choose a prescription"
                : "No confirmed prescriptions available";

            prescriptionSelect.appendChild(placeholder);

            eligible.forEach(prescription => {
                const option = document.createElement("option");
                option.value = prescription.id;
                option.textContent =
                    `Prescription #${prescription.id} (${prescription.status})`;

                prescriptionSelect.appendChild(option);
            });

            reconcileBtn.disabled = true;

        } catch (error) {
            prescriptionSelect.replaceChildren();

            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Could not load prescriptions";

            prescriptionSelect.appendChild(option);

            showMessage(reconciliationMessage, error.message);
        }
    }

    // RECONCILIATION
    if (prescriptionSelect && reconcileBtn) {
        loadConfirmedPrescriptions();

        prescriptionSelect.addEventListener("change", () => {
            reconcileBtn.disabled = !prescriptionSelect.value;
        });

        reconcileBtn.addEventListener("click", async () => {
            let savedScan;

            try {
                savedScan = JSON.parse(
                    sessionStorage.getItem("dawazLatestScan") || "null"
                );
            } catch {
                savedScan = null;
            }

            if (!savedScan) {
                showMessage(
                    reconciliationMessage,
                    "Please scan a medicine first."
                );
                return;
            }

            const scanId = getScanId(savedScan);
            const scanData = getScanData(savedScan);

            if (!scanId) {
                showMessage(
                    reconciliationMessage,
                    "Scan ID unavailable. Please scan again."
                );
                return;
            }

            if (scanData.identity_status !== "CONFIRMED_FOR_DEMO" && scanData.identity_status !== "CANDIDATE_FOUND") {
                showMessage(
                    reconciliationMessage,
                    "Medicine identity is not confirmed. Comparison is unavailable."
                );
                return;
            }

            if (!prescriptionSelect.value) {
                showMessage(
                    reconciliationMessage,
                    "Select a confirmed prescription first."
                );
                return;
            }

            reconcileBtn.disabled = true;
            reconcileBtn.textContent = "Comparing...";

            showMessage(reconciliationMessage, "");

            if (reconciliationResult) {
                reconciliationResult.replaceChildren();
            }

            try {
                const result = await DawazAPI.request("/reconcile", {
                    method: "POST",
                    body: JSON.stringify({
                        prescription_id: Number(prescriptionSelect.value),
                        scan_id: Number(scanId)
                    })
                });

                showMessage(
                    reconciliationMessage,
                    "Comparison completed."
                );

                if (reconciliationResult) {
                    const output = document.createElement("pre");

                    const reconciliation =
                        result.reconciliation?.data ||
                        result.reconciliation ||
                        result;

                    output.textContent = JSON.stringify(
                        reconciliation,
                        null,
                        2
                    );

                    reconciliationResult.appendChild(output);
                }

            } catch (error) {
                showMessage(
                    reconciliationMessage,
                    `Comparison failed: ${error.message}`
                );

            } finally {
                reconcileBtn.disabled = !prescriptionSelect.value;
                reconcileBtn.textContent = "Compare Medicine";
            }
        });
    }

    // CHAT LANGUAGE
    function getChatLanguage() {
        const savedLanguage =
            localStorage.getItem("dawazLanguage") ||
            sessionStorage.getItem("dawazLanguage") || "en-IN";

        return savedLanguage === "hi" ||
            savedLanguage === "hi-IN"
            ? "hi-IN"
            : "en-IN";
    }

    // CHAT MESSAGE
    function addChatMessage(label, message) {
        if (!chatMessages) return;

        const paragraph = document.createElement("p");
        paragraph.textContent = `${label}: ${message}`;

        chatMessages.appendChild(paragraph);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // SEND QUESTION
    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener("submit", async event => {
            event.preventDefault();

            const question = chatInput.value.trim();
            if (!question) return;

            addChatMessage("You", question);
            chatInput.value = "";

            if (sendChatBtn) {
                sendChatBtn.disabled = true;
                sendChatBtn.textContent = "Sending...";
            }

            showMessage(chatStatus, "Getting an answer...");

            try {
                const result = await DawazAPI.request("/questions", {
                    method: "POST",
                    body: JSON.stringify({
                        question,
                        language: getChatLanguage()
                    })
                });

                const answer =
                    result.answer ||
                    result.data?.answer ||
                    result.response ||
                    result.message ||
                    "No answer was returned.";

                addChatMessage("DAWAZ", answer);
                showMessage(chatStatus, "Response received.");

            } catch (error) {
                addChatMessage("DAWAZ", error.message);
                showMessage(chatStatus, "Could not get a response.");

            } finally {
                if (sendChatBtn) {
                    sendChatBtn.disabled = false;
                    sendChatBtn.textContent = "Send";
                }
            }
        });
    }

    // BROWSER VOICE RECOGNITION
    if (chatMicBtn) {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            chatMicBtn.disabled = true;

            showMessage(
                chatVoiceStatus,
                "Voice input is not supported in this browser."
            );

        } else {
            recognition = new SpeechRecognition();

            recognition.interimResults = false;
            recognition.continuous = false;

            recognition.onstart = () => {
                showMessage(chatVoiceStatus, "Listening...");
            };

            recognition.onresult = event => {
                const transcript =
                    event.results[0][0].transcript;

                if (chatInput) {
                    chatInput.value = transcript;
                }

                showMessage(
                    chatVoiceStatus,
                    "Voice captured. Press Send to submit."
                );
            };

            recognition.onerror = event => {
                showMessage(
                    chatVoiceStatus,
                    `Voice input error: ${event.error}`
                );
            };

            recognition.onend = () => {
                chatMicBtn.disabled = false;
            };

            chatMicBtn.addEventListener("click", () => {
                try {
                    recognition.lang = getChatLanguage();
                    chatMicBtn.disabled = true;
                    recognition.start();

                } catch (error) {
                    chatMicBtn.disabled = false;

                    showMessage(
                        chatVoiceStatus,
                        "Could not start voice input. Try again."
                    );
                }
            });
        }
    }

    // RETAKE SCAN
    if (retakeScanBtn) {
        retakeScanBtn.addEventListener("click", () => {
            stopCamera();

            fileInput.value = "";
            setSelectedFile(null);

            sessionStorage.removeItem("dawazLatestScan");

            if (resultCard) resultCard.hidden = true;
            if (reconciliationCard) reconciliationCard.hidden = true;
            if (medicineChatCard) medicineChatCard.hidden = true;

            if (resultArea) resultArea.replaceChildren();

            if (reconciliationResult) {
                reconciliationResult.replaceChildren();
            }

            showMessage(scanMessage, "Select or capture a new image.");
            showMessage(reconciliationMessage, "");
        });
    }

});
