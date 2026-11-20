
import os
import shutil
from pathlib import Path

import cv2
import numpy as np
import pytesseract
from pytesseract import Output


# --------------------------------------------------
# TESSERACT CONFIGURATION
# --------------------------------------------------

TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

if shutil.which("tesseract") is None:
    if os.path.exists(TESSERACT_PATH):
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH


# --------------------------------------------------
# IMAGE LOADING AND RESIZING
# --------------------------------------------------

def load_image(image_path):
    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError("Unable to read the image.")

    height, width = image.shape[:2]
    largest_side = max(height, width)

    # Avoid excessively large images
    if largest_side > 2400:
        scale = 2400 / largest_side
        image = cv2.resize(
            image,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_AREA
        )

    # Enlarge small images to improve text recognition
    height, width = image.shape[:2]

    if max(height, width) < 1600:
        scale = 1600 / max(height, width)
        image = cv2.resize(
            image,
            (int(width * scale), int(height * scale)),
            interpolation=cv2.INTER_CUBIC
        )

    return image


# --------------------------------------------------
# IMAGE ROTATION
# --------------------------------------------------

def rotate_image(image, angle):
    if angle == 0:
        return image

    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)

    if angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)

    if angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)

    return image


# --------------------------------------------------
# IMAGE PREPROCESSING
# --------------------------------------------------

def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Reduce noise while preserving text edges
    denoised = cv2.bilateralFilter(gray, 9, 75, 75)

    # Improve local contrast
    clahe = cv2.createCLAHE(
        clipLimit=2.0,
        tileGridSize=(8, 8)
    )

    enhanced = clahe.apply(denoised)

    # Adaptive thresholding
    threshold = cv2.adaptiveThreshold(
        enhanced,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31,
        11
    )

    return {
        "grayscale": gray,
        "enhanced": enhanced,
        "threshold": threshold
    }


# --------------------------------------------------
# SINGLE OCR ATTEMPT
# --------------------------------------------------

def run_ocr(image, page_mode):
    config = f"--oem 3 --psm {page_mode}"

    data = pytesseract.image_to_data(
        image,
        lang="eng",
        config=config,
        output_type=Output.DICT
    )

    words = []
    confidence_values = []

    for index, raw_word in enumerate(data["text"]):
        word = raw_word.strip()

        if not word:
            continue

        try:
            confidence = float(data["conf"][index])
        except (ValueError, TypeError):
            confidence = -1

        words.append({
            "text": word,
            "confidence": confidence
        })

        if confidence >= 0:
            confidence_values.append(confidence)

    average_confidence = (
        round(
            sum(confidence_values) / len(confidence_values),
            2
        )
        if confidence_values else None
    )

    # Reconstruct text in the order returned by Tesseract
    raw_text = " ".join(
        word["text"] for word in words
    )

    return {
        "raw_text": raw_text,
        "words": words,
        "average_confidence": average_confidence,
        "word_count": len(words)
    }


# --------------------------------------------------
# OCR RESULT SELECTION
# --------------------------------------------------

def calculate_score(result):
    confidence = result["average_confidence"]

    if confidence is None or result["word_count"] == 0:
        return -1

    # Avoid selecting an attempt with high confidence
    # but almost no recognized words.
    word_factor = min(result["word_count"] / 15, 1.0)

    return confidence * (0.5 + 0.5 * word_factor)


# --------------------------------------------------
# MAIN MEDICINE TEXT EXTRACTION
# --------------------------------------------------

def extract_medicine_text(image_path):

    image_path = Path(image_path)

    if not image_path.exists():
        return {
            "success": False,
            "error": f"Image not found: {image_path}"
        }

    try:
        original_image = load_image(image_path)

        attempts = []

        # Try all four standard orientations
        for angle in (0, 90, 180, 270):

            rotated = rotate_image(original_image, angle)
            processed = preprocess_image(rotated)

            variants = [
                ("grayscale", processed["grayscale"]),
                ("enhanced", processed["enhanced"]),
                ("threshold", processed["threshold"])
            ]

            # Test two reading modes for each variant
            for variant_name, variant_image in variants:
                for page_mode in (6, 11):

                    result = run_ocr(
                        variant_image,
                        page_mode
                    )

                    attempts.append({
                        "rotation": angle,
                        "preprocessing": variant_name,
                        "page_mode": page_mode,
                        **result
                    })

        valid_attempts = [
            item for item in attempts
            if item["average_confidence"] is not None
            and item["word_count"] > 0
        ]

        if not valid_attempts:
            return {
                "success": False,
                "error": "No readable text was detected.",
                "attempts": attempts
            }

        best_result = max(
            valid_attempts,
            key=calculate_score
        )

        # Run full text extraction once using the selected settings
        best_image = rotate_image(
            original_image,
            best_result["rotation"]
        )

        best_processed = preprocess_image(best_image)

        selected_image = best_processed[
            best_result["preprocessing"]
        ]

        selected_config = (
            f"--oem 3 --psm {best_result['page_mode']}"
        )

        final_raw_text = pytesseract.image_to_string(
            selected_image,
            lang="eng",
            config=selected_config
        )

        # Preserve original OCR text; do not auto-correct it.
        return {
            "success": True,
            "raw_text": final_raw_text,
            "words": best_result["words"],
            "average_confidence": best_result[
                "average_confidence"
            ],
            "selected_preprocessing": best_result[
                "preprocessing"
            ],
            "selected_rotation": best_result["rotation"],
            "selected_page_mode": best_result["page_mode"],
            "all_attempts": [
                {
                    "rotation": item["rotation"],
                    "preprocessing": item["preprocessing"],
                    "page_mode": item["page_mode"],
                    "average_confidence": item[
                        "average_confidence"
                    ],
                    "word_count": item["word_count"]
                }
                for item in attempts
            ],
            "language": "eng"
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error)
        }
