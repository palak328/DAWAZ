document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("medicineImage");
    const scanButton = document.getElementById("scanMedicineBtn");
    const resultArea = document.getElementById("resultContent");
    const startCameraBtn = document.getElementById("startCameraBtn");
    const captureBtn = document.getElementById("captureBtn");
    const cameraPreview = document.getElementById("cameraPreview");
    const captureCanvas = document.getElementById("captureCanvas");
    const fileName = document.getElementById("fileName");

    if (!fileInput || !scanButton) return;

    let cameraStream = null;
    let selectedFile = null;

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

            captureCanvas.toBlob((blob) => {
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

    scanButton.addEventListener("click", async (event) => {
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
            body.append("file", file);

            const result = await DawazAPI.request("/scans", {
                method: "POST",
                body
            });

            sessionStorage.setItem(
                "dawazLatestScan",
                JSON.stringify(result)
            );

            const scan = result.scan_result?.data || {};

            if (resultArea) {
                resultArea.textContent =
                    `Status: ${scan.identity_status || "UNKNOWN"}\n` +
                    (scan.message || "Scan completed. Review the result carefully.");
            }

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