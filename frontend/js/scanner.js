document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.querySelector('input[type="file"]');
    const scanButton = document.querySelector(
        "#scanButton, button[type='submit']"
    );
    const resultArea = document.querySelector(
        "#scanResult, #result, .scan-result"
    );

    if (!fileInput || !scanButton) return;

    scanButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            alert("Select a medicine image first.");
            return;
        }

        scanButton.disabled = true;
        scanButton.textContent = "Scanning...";

        try {
            const body = new FormData();
            body.append("file", file);

            const token = sessionStorage.getItem("dawazToken");

            const response = await fetch(
                "http://127.0.0.1:8000/scans",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || "Scan failed.");
            }

            sessionStorage.setItem(
                "dawazLatestScan",
                JSON.stringify(result)
            );

            const scan = result.scan_result?.data || {};
            const message = scan.message ||
                "Scan completed. Review the identity result before relying on it.";

            if (resultArea) {
                resultArea.textContent =
                    `Status: ${scan.identity_status || "UNKNOWN"}\n${message}`;
            } else {
                alert(message);
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