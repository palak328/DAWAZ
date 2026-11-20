# Member 1 ↔ Member 2 ↔ Member 3 API contract

All responses use this envelope:

```json
{
  "request_id": "generated-id",
  "data": {},
  "warnings": [],
  "error": null
}
```

## A. Scan medicine packet

`POST /member2/scans`

Content type: `multipart/form-data`

Field:
- `image`: JPG, PNG or WEBP image

Example JavaScript:

```javascript
const body = new FormData();
body.append("image", fileInput.files[0]);

const response = await fetch(`${API_BASE}/member2/scans`, {
  method: "POST",
  headers: authHeaders, // Member 3's real auth header, if required
  body
});
const result = await response.json();
```

Possible `data.identity_status` values:
- `INSUFFICIENT_IMAGE`: ask for a better photo.
- `UNCERTAIN`: OCR/identity is not clear.
- `CANDIDATE_FOUND`: one or more possible products were retrieved; not confirmed.

A future human-reviewed demo workflow may produce `CONFIRMED_FOR_DEMO`, but this starter intentionally does not auto-confirm a medicine.

## B. Extract prescription draft

`POST /member2/prescriptions/extract`

Content type: `multipart/form-data`

Field:
- `file`: JPG, PNG, WEBP or PDF

The response includes `raw_text`, `medicines`, and
`status: DRAFT_REQUIRES_PATIENT_REVIEW`. Member 3 stores the draft and
manages patient confirmation. Do not create reminders from this response.

## C. Compare scan with active confirmed plan

`POST /member2/reconcile`

JSON request:

```json
{
  "scan_result": {
    "identity_status": "CONFIRMED_FOR_DEMO",
    "matched_medicine": {
      "name": "exact reviewed catalog name",
      "strength": "exact strength",
      "form": "exact dosage form"
    }
  },
  "confirmed_plan": [
    {
      "name": "exact reviewed catalog name",
      "strength": "exact strength",
      "form": "exact dosage form"
    }
  ],
  "plan_is_confirmed": true
}
```

Possible relation values:
- `MATCHES_ACTIVE_ITEM`
- `NOT_FOUND_IN_ACTIVE_PLAN`
- `STRENGTH_OR_FORM_CONFLICT`
- `PLAN_NOT_CONFIRMED`
- `PRESCRIPTION_AMBIGUOUS`
- `UNKNOWN_IDENTITY`

**Security/integration note:** Member 3 should call the reconciliation service after loading the logged-in patient's confirmed plan from its own database. Do not let the browser choose another patient's plan or submit an arbitrary plan as trusted data. This route is exposed for the hackathon integration demo; protect it with Member 3's authentication and authorization or keep it internal.

## D. Ask a medicine question

`POST /member2/questions`

JSON request:

```json
{
  "question": "What dose should I take?",
  "confirmed_plan": null
}
```

Member 3 should supply confirmed plan information from its database after authorization. Never trust plan data supplied by an arbitrary browser client.

## Responsibility split

| Work | Owner |
|---|---|
| HTML/CSS/JS screens, upload UI, display results | Member 1 |
| Image quality, OCR, candidate retrieval, prescription draft, comparison logic, limited Q&A | Member 2 |
| Login, database, patient ownership, prescription storage/confirmation, reminders, stock, caregiver access/alerts | Member 3 |
