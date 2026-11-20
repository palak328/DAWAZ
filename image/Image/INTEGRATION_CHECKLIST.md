# Team integration checklist

## Member 2
- [ ] Install Python dependencies.
- [ ] Install the Tesseract application on the backend machine.
- [ ] Test OCR on the team's real medicine-strip photos.
- [ ] Add reviewed catalog rows with source details.
- [ ] Run `pytest -q`.
- [ ] Share the API contract with Members 1 and 3.

## Member 3
- [ ] Copy/merge the `app/` folder without replacing existing backend files.
- [ ] Include `member2_router` in the existing FastAPI app.
- [ ] Add authentication and patient-level authorization to routes.
- [ ] Fetch confirmed prescription data from the database on the server.
- [ ] Call the reconciliation service with only the authenticated patient's plan.
- [ ] Save prescription extraction output as unconfirmed draft.
- [ ] Confirm with the patient before creating reminders.

## Member 1
- [ ] Add medicine packet upload and show quality guidance.
- [ ] Show OCR text and possible candidates without calling them confirmed.
- [ ] Add prescription upload and editable review form.
- [ ] Display unresolved fields clearly.
- [ ] Connect scan, prescription extraction and question screens to agreed API.
- [ ] Do not create reminder schedules from an unconfirmed draft.

## Whole team
- [ ] Confirm base URL and auth header.
- [ ] Confirm whether Hindi OCR is installed and tested.
- [ ] Test blurry, dark, reflective and unreadable images.
- [ ] Test similar medicine names and strength/form conflicts.
- [ ] Test missing prescription fields.
- [ ] Make sure no dose is invented.
- [ ] Label prototype limitations honestly.
