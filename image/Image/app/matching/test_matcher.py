
from medicine_matcher import load_catalog, match_medicine


print("DAWAZ MEDICINE MATCHING TEST")
print("-" * 40)

catalog = load_catalog()

print("Catalog loaded successfully.")
print("Medicine records:", len(catalog))

# Test using the actual catalog's first medicine.
sample = catalog[0]
sample_name = sample["name"]

print("\nTesting medicine:", sample_name)

# Simulated OCR output.
ocr_text = (
    f"Medicine name: {sample_name} "
    f"Strength: {sample.get('strength', '')}"
)

result = match_medicine(ocr_text)

print("\nMATCHING RESULT")
print("-" * 40)
print("Success:", result["success"])
print("Catalog records checked:",
      result.get("catalog_records_checked"))
print("Identity confirmed:",
      result.get("identity_confirmed"))
print("Candidate count:",
      result.get("candidate_count"))

for candidate in result.get("candidates", []):
    print("\nMedicine:", candidate["name"])
    print("Score:", candidate["score"])
    print("Status:", candidate["status"])
    print("Evidence:", candidate["evidence"])
    print("Human confirmation required:",
          candidate["requires_human_confirmation"])

if not result["success"]:
    raise SystemExit("TEST FAILED: " + result["message"])

if not result["candidates"]:
    raise SystemExit("TEST FAILED: No candidate found.")

if result["candidates"][0]["name"] != sample_name:
    raise SystemExit("TEST FAILED: Expected medicine was not ranked first.")

if result["identity_confirmed"] is not False:
    raise SystemExit("TEST FAILED: Identity was automatically confirmed.")

print("\nTEST PASSED")
