
import sys
import os

print("DAWAZ IMAGE QUALITY TEST STARTED")

image_path = sys.argv[1] if len(sys.argv) > 1 else "medicine.jpg"

print("Checking image:", image_path)

if not os.path.exists(image_path):
    print("ERROR: Image file not found!")
    sys.exit(1)

print("Image file found.")

from quality_checker import check_image_quality

result = check_image_quality(image_path)

print("\nDAWAZ IMAGE QUALITY RESULT")
print("--------------------------")
print(result)
