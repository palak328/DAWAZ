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