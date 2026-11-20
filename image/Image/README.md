# DAWAZ — Member 2: Medicine Reading & Understanding

This folder contains Member 2's work as a small FastAPI module. It is written in simple Python and is designed to be connected to Member 3's existing FastAPI application and Member 1's plain HTML/CSS/JavaScript frontend.

## What is included

1. Medicine packet image quality checks (blur, darkness, glare).
2. OCR text extraction while preserving the original OCR text.
3. A small, editable supported-medicine catalog.
4. Conservative medicine candidate matching (name + strength + dosage form).
5. Prescription image/PDF text extraction into an **unconfirmed draft**.
6. Comparison against a confirmed prescription supplied by Member 3.
7. Basic, safety-limited medicine Q&A.
8. Simple tests, API examples, and integration instructions.

## Important scope

- Member 2 does not own login, authentication, patient database, prescription storage, reminders, medicine stock, Taken/Skipped records, or caregiver access. Member 3 owns those.
- Uploading a prescription never activates reminders. Member 3 must store the draft, obtain patient review/confirmation, and only then create reminders.
- A medicine packet does not tell us the patient's dose.
- The module never guesses a missing strength, form, dose, timing, route, or duration.
- Fuzzy name matching is used only to find possible candidates. It is not enough to confirm a medicine.
- The included catalog starts empty on purpose. Add only reviewed, source-backed products. Do not fill it with guessed medicine facts.
- OCR quality and matching are not clinically validated. This is a hackathon prototype, not a medical device.

## Folder layout

```text
DAWAZ_Member2/
├── app/
│   ├── api/                 # FastAPI routes
│   ├── core/                # settings and response helpers
│   ├── data/                # supported medicine catalog
│   ├── schemas/             # request/response models
│   └── services/            # one folder per task
├── examples/                # frontend requests and API contracts
├── tests/                   # simple automated tests
├── requirements.txt
├── .env.example
└── run_standalone.py
```

## 1. Install

Use Python 3.10 or newer.

```bash
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

Mac/Linux:
```bash
source venv/bin/activate
```

Install Python packages:
```bash
pip install -r requirements.txt
```

### OCR setup

This starter uses Tesseract through `pytesseract` because it is straightforward to run locally. The Tesseract application itself must also be installed on the computer.

- Windows: install the Tesseract OCR application, then set `TESSERACT_CMD` in `.env` if it is not automatically detected.
- Ubuntu/Debian: `sudo apt install tesseract-ocr`
- macOS: `brew install tesseract`

English OCR is the default. Hindi/Devanagari OCR requires the Hindi language data (`hin`) to be installed and configured. Test with actual medicine-strip images before claiming Hindi support.

If the team has already selected PaddleOCR or another OCR provider, replace only `app/services/ocr/ocr_service.py`. Keep the same `extract_text_from_image()` function so the rest of the module does not change.

## 2. Run this module by itself

```bash
uvicorn run_standalone:app --reload
```

Open:
- API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

All Member 2 routes start with `/member2`.

## 3. Connect to Member 3's FastAPI application

**Do not run a second backend in the final integrated app.** Member 3 should keep their existing FastAPI `app` and import this router.

Copy the `app/` folder into Member 3's backend repository (or merge the folders if an `app/` folder already exists). Then in Member 3's main FastAPI file:

```python
from app.api.member2_router import router as member2_router

app.include_router(member2_router)
```

If Member 3 uses a different Python package name or folder layout, adjust the import path only. Do not overwrite Member 3's `main.py`, authentication, database, or existing routes.

Member 3 must protect patient-specific routes with their authentication and authorization dependencies. The `/reconcile` route is deliberately designed for Member 3 to call only after it has fetched the current patient's confirmed plan. Do not trust a patient ID or plan supplied by an unauthenticated browser.

## 4. Connect Member 1's HTML/CSS/JavaScript frontend

Member 1 can upload a packet image with `fetch()` and `FormData`:

```javascript
const formData = new FormData();
formData.append("image", selectedFile);

const response = await fetch("http://127.0.0.1:8000/member2/scans", {
  method: "POST",
  headers: {
    // Add Member 3's real Authorization header here if required.
    // Do not set Content-Type manually when using FormData.
  },
  body: formData
});

const result = await response.json();
console.log(result.data);
```

The exact backend base URL and authentication header must match Member 3's project. When integrated, the browser should call the same backend URL used by the rest of the app.

For prescription extraction, use `/member2/prescriptions/extract` and send the file in the `file` field. The result is a draft only. Show it to the patient for correction and confirmation.

For questions, send JSON to `/member2/questions`.

## 5. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check that the standalone app is running |
| POST | `/member2/scans` | Quality check + OCR + candidate lookup |
| POST | `/member2/prescriptions/extract` | Extract a draft from image/PDF |
| POST | `/member2/reconcile` | Compare scan with a confirmed plan supplied by Member 3 |
| POST | `/member2/questions` | Answer limited questions from provided confirmed-plan/catalog facts |

See `examples/API_CONTRACT.md` for request and response examples.

## 6. Add supported medicines

Edit `app/data/medicine_catalog.json`.

Each entry must have:
- `id`
- `name`
- `aliases`
- `strength`
- `form`
- `ingredients`
- `release_type`
- `source_name`
- `source_url`
- `reviewed`

Only set `"reviewed": true` after a team member has checked the exact product details against a trusted source. Do not use a similar brand or product as a substitute. The starter catalog is empty.

## 7. Run tests

```bash
pytest -q
```

Tests use fake OCR text and do not require the Tesseract application. They test basic quality checks, strict matching, prescription draft behavior, and safety boundaries.

## 8. What still needs team integration

- Member 3 must add this router to their existing FastAPI app.
- Member 3 must add their authentication/authorization dependencies to the patient-specific routes.
- Member 3 must load the logged-in patient's confirmed prescription and pass it to the reconciliation service on the server side.
- Member 3 must save prescription extraction drafts and handle the human confirmation flow.
- Member 1 must connect its screens to the final agreed base URL and field names.
- The team must add reviewed medicine catalog entries and test OCR on actual local packaging.
- The team must agree how to handle Hindi OCR and PDF page limits.

## 9. Prototype limitations

- Basic image quality checks are heuristics; they are not medical-grade.
- Tesseract may not read curved, tiny, reflective, damaged, or handwritten text correctly.
- Prescription extraction is intentionally simple and does not interpret handwriting or ambiguous instructions.
- The Q&A feature does not diagnose, recommend dose changes, or provide interaction/allergy clearance.
- Do not describe the prototype as clinically validated.
