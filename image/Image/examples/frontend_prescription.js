// Prescription upload example. The returned information is a draft only.

async function extractPrescription(file, API_BASE, authHeaders = {}) {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_BASE}/member2/prescriptions/extract`, {
    method: "POST",
    headers: authHeaders,
    body
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Prescription extraction failed.");
  }

  // Display this draft for the patient to review.
  // Member 3 stores it and handles confirmation.
  return result.data;
}
