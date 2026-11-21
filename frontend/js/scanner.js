document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("medicineImage");
    const scanButton = document.getElementById("scanMedicineBtn");
    const resultArea = document.getElementById("resultContent");
    const resultCard = document.getElementById("resultCard");
    const startCameraBtn = document.getElementById("startCameraBtn");
    const captureBtn = document.getElementById("captureBtn");
    const cameraPreview = document.getElementById("cameraPreview");
    const captureCanvas = document.getElementById("captureCanvas");
    const fileName = document.getElementById("fileName");

    if (!fileInput || !scanButton) return;

    let cameraStream = null;
    let selectedFile = null;

    function addDetail(parent, label, value) {
        if (value === undefined || value === null || value === "") return;

        const paragraph = document.createElement("p");
        const strong = document.createElement("strong");

        strong.textContent = `${label}: `;
        paragraph.append(strong, document.createTextNode(String(value)));
        parent.appendChild(paragraph);
    }

    function renderScanResult(result) {
        if (!resultArea) return;

        resultArea.replaceChildren();

        const scan = result.scan_result?.data || {};
        const matched = scan.matched_medicine;
        const candidates = Array.isArray(scan.candidates)
            ? scan.candidates
            : [];

        const heading = document.createElement("h3");
        heading.textContent = "Scan Results";
        resultArea.appendChild(heading);

        addDetail(resultArea, "Identity Status", scan.identity_status || "UNKNOWN");

        if (matched) {
            addDetail(
                resultArea,
                "Matched Medicine",
                matched.medicine_name || matched.name || matched.display_name
            );

            addDetail(resultArea, "Strength", matched.strength);
            addDetail(resultArea, "Form", matched.dosage_form || matched.form);
        }

        if (candidates.length) {
            const candidateHeading = document.createElement("h4");
            candidateHeading.textContent = "Possible Candidates";
            resultArea.appendChild(candidateHeading);

            candidates.forEach((candidate, index) => {
                const item = document.createElement("p");

                const name = typeof candidate === "string"
                    ? candidate
                    : candidate.medicine_name ||
                      candidate.name ||
                      candidate.display_name ||
                      "Candidate details unavailable";

                item.textContent = `${index + 1}. ${name}`;
                resultArea.appendChild(item);
            });
        }

        if (scan.message) {
            addDetail(resultArea, "Message", scan.message);
        }

        const warnings = [
            ...(Array.isArray(result.warnings) ? result.warnings : []),
            ...(Array.isArray(result.scan_result?.warnings)
                ? result.scan_result.warnings
                : [])
        ];

        warnings.forEach(warning => {
            addDetail(resultArea, "Warning", warning);
        });

        if (!matched && candidates.length === 0) {
            addDetail(
                resultArea,
                "Next Step",
                "Identity is not confirmed. Rescan or consult a pharmacist."
            );
        }

        if (resultCard) resultCard.hidden = false;
    }

    fileInput.addEventListener("change", () => {
        selectedFile = fileInput.files[0] || null;

        if (fileName) {
            fileName.textContent = selectedFile
                ? selectedFile.name
                : "";
        }
    });

    if (startCameraBtn && cameraPreview) {
        startCameraBtn.addEventListener("click", async () => {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });

                cameraPreview.srcObject = cameraStream;
                await cameraPreview.play();

                startCameraBtn.textContent = "Camera Started";

                if (captureBtn) captureBtn.disabled = false;

            } catch (error) {
                alert("Camera unavailable. Please upload an image instead.");
            }
        });
    }

    if (captureBtn && cameraPreview && captureCanvas) {
        captureBtn.addEventListener("click", () => {
            if (!cameraPreview.videoWidth) {
                alert("Camera is not ready yet.");
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

            captureCanvas.toBlob(blob => {
                if (!blob) {
                    alert("Could not capture image.");
                    return;
                }

                selectedFile = new File(
                    [blob],
                    "medicine-capture.jpg",
                    { type: "image/jpeg" }
                );

                if (fileName) {
                    fileName.textContent = selectedFile.name;
                }
            }, "image/jpeg");

            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }

            cameraPreview.srcObject = null;
        });
    }

    scanButton.addEventListener("click", async event => {
        event.preventDefault();

        const file = selectedFile || fileInput.files[0];

        if (!file) {
            alert("Capture or select a medicine image first.");
            return;
        }

        scanButton.disabled = true;
        scanButton.textContent = "Scanning...";

        if (resultArea) resultArea.textContent = "Processing image...";

        try {
            const body = new FormData();
            body.append("image", file);

            const result = await DawazAPI.request("/scans", {
                method: "POST",
                body
            });

            sessionStorage.setItem(
                "dawazLatestScan",
                JSON.stringify(result)
            );

            renderScanResult(result);

        } catch (error) {
            if (resultArea) {
                resultArea.textContent = error.message;
            } else {
                alert(error.message);
            }
        } finally {
            scanButton.disabled = false;
            scanButton.textContent = "Scan Medicine";
        }
    });
});
    // PRESCRIPTION RECONCILIATION

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

    async function loadConfirmedPrescriptions() {
        if (!prescriptionSelect) return;

        try {
            const prescriptions =
                await DawazAPI.request("/prescriptions");

            const eligible = prescriptions.filter(p =>
                ["confirmed", "active"].includes(
                    String(p.status).toLowerCase()
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

        } catch (error) {
            prescriptionSelect.replaceChildren();

            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Could not load prescriptions";

            prescriptionSelect.appendChild(option);
            reconciliationMessage.textContent = error.message;
        }
    }

    if (prescriptionSelect && reconcileBtn) {
        loadConfirmedPrescriptions();

        prescriptionSelect.addEventListener("change", () => {
            reconcileBtn.disabled = !prescriptionSelect.value;
        });

        reconcileBtn.addEventListener("click", async () => {
            const savedScan = JSON.parse(
                sessionStorage.getItem("dawazLatestScan") || "null"
            );

            const scanId = savedScan?.scan_id ?? savedScan?.id;

            if (!scanId) {
                reconciliationMessage.textContent =
                    "Scan ID unavailable. Please scan again.";
                return;
            }

            const scanData = savedScan.scan_result?.data || {};

            if (scanData.identity_status !== "CONFIRMED_FOR_DEMO") {
                reconciliationMessage.textContent =
                    "Medicine identity is not confirmed. Reconciliation is unavailable.";
                return;
            }

            reconcileBtn.disabled = true;
            reconcileBtn.textContent = "Comparing...";
            reconciliationMessage.textContent = "";
            reconciliationResult.replaceChildren();

            try {
                const result = await DawazAPI.request("/reconcile", {
                    method: "POST",
                    body: JSON.stringify({
                        prescription_id: Number(prescriptionSelect.value),
                        scan_id: Number(scanId)
                    })
                });

                reconciliationMessage.textContent =
                    "Comparison completed.";

                const output = document.createElement("pre");
                output.textContent = JSON.stringify(result, null, 2);
                reconciliationResult.appendChild(output);

            } catch (error) {
                reconciliationMessage.textContent =
                    `Comparison failed: ${error.message}`;
            } finally {
                reconcileBtn.disabled = !prescriptionSelect.value;
                reconcileBtn.textContent = "Compare Medicine";
            }
        });
    }