
import sys
from ocr_service import extract_medicine_text


def main():

    if len(sys.argv) < 2:
        print(
            "Usage: python ocr/test_ocr.py "
            "image/Image/medicine.jpg"
        )
        return

    image_path = sys.argv[1]

    print("DAWAZ OCR TEST STARTED")
    print("Checking image:", image_path)

    result = extract_medicine_text(image_path)

    print("\nDAWAZ OCR RESULT")
    print("--------------------------")

    if not result["success"]:
        print("OCR Status: FAILED")
        print("Error:", result.get("error"))
        return

    print("OCR Status: SUCCESS")
    print("Selected rotation:", result["selected_rotation"])
    print("Selected preprocessing:", result["selected_preprocessing"])
    print("Selected PSM:", result["selected_page_mode"])
    print("Average OCR confidence:", result["average_confidence"])

    print("\nPREPROCESSING COMPARISON")
    print("--------------------------")

    for attempt in result["all_attempts"]:
        print(
            f"Rotation: {attempt['rotation']}°"
            f" | Method: {attempt['preprocessing']}"
            f" | PSM: {attempt['page_mode']}"
            f" | Confidence: {attempt['average_confidence']}"
            f" | Words: {attempt['word_count']}"
        )

    print("\nEXTRACTED RAW TEXT")
    print("--------------------------")
    print(result["raw_text"])

    print("\nOCR TEST FINISHED")


if __name__ == "__main__":
    main()
