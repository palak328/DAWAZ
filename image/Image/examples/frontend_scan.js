// Example for Member 1's plain HTML/CSS/JavaScript frontend.
// Replace API_BASE and authHeaders with Member 3's actual integration values.

async function scanMedicine(file, API_BASE, authHeaders = {}) {
  const body = new FormData();
  body.append("image", file);

  const response = await fetch(`${API_BASE}/member2/scans`, {
    method: "POST",
    headers: authHeaders,
    body
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Scan request failed.");
  }

  return result.data;
}

// Example UI usage:
// const result = await scanMedicine(fileInput.files[0], API_BASE, authHeaders);
// statusElement.textContent = result.message || result.identity_status;
// rawTextElement.textContent = result.raw_ocr_text || "";
