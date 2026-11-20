
import cv2
import numpy as np


# 1. Check whether the image is blurry
def check_blur(gray):
    sharpness = cv2.Laplacian(
        gray, cv2.CV_64F
    ).var()

    if sharpness < 50:
        return "WARNING", round(sharpness, 2)

    return "GOOD", round(sharpness, 2)


# 2. Check image brightness
def check_brightness(gray):
    brightness = float(np.mean(gray))

    if brightness < 55:
        status = "TOO_DARK"
    elif brightness > 220:
        status = "TOO_BRIGHT"
    else:
        status = "GOOD"

    return status, round(brightness, 2)


# 3. Check excessive light reflection (glare)
def check_glare(image):
    hsv = cv2.cvtColor(
        image, cv2.COLOR_BGR2HSV
    )

    glare_pixels = (
        (hsv[:, :, 2] > 245) &
        (hsv[:, :, 1] < 35)
    )

    glare_percentage = (
        np.count_nonzero(glare_pixels) /
        glare_pixels.size
    ) * 100

    if glare_percentage > 15:
        status = "WARNING"
    else:
        status = "GOOD"

    return status, round(glare_percentage, 2)


# 4. Estimate whether the image is tilted
def check_tilt(gray):
    edges = cv2.Canny(gray, 50, 150)

    lines = cv2.HoughLinesP(
        edges,
        1,
        np.pi / 180,
        threshold=80,
        minLineLength=80,
        maxLineGap=10
    )

    if lines is None:
        return "NOT_DETECTED", None

    angles = []

    
    for line in lines:
        coordinates = np.asarray(line).reshape(-1)

        if coordinates.size < 4:
            continue

        x1, y1, x2, y2 = coordinates[:4]

        angle = np.degrees(
            np.arctan2(y2 - y1, x2 - x1)
        )

        if abs(angle) <= 20:
            angles.append(angle)


        if len(angles) < 3:
            return "NOT_DETECTED", None

        estimated_angle = float(np.median(angles))

        if abs(estimated_angle) > 7:
            status = "WARNING"
        else:
            status = "GOOD"

        return status, round(estimated_angle, 2)


# 5. Main image quality checking function
def check_image_quality(image_path):

    image = cv2.imread(image_path)

    if image is None:
        return {
            "success": False,
            "error": "Image could not be opened."
        }

    gray = cv2.cvtColor(
        image, cv2.COLOR_BGR2GRAY
    )

    blur_status, sharpness = check_blur(gray)

    brightness_status, brightness = (
        check_brightness(gray)
    )

    glare_status, glare_percentage = (
        check_glare(image)
    )

    tilt_status, tilt_angle = check_tilt(gray)

    problems = []
    suggestions = []

    if blur_status == "WARNING":
        problems.append("Image may be blurry.")
        suggestions.append(
            "Hold the camera steady and retake the photo."
        )

    if brightness_status == "TOO_DARK":
        problems.append("Image is too dark.")
        suggestions.append(
            "Move to a brighter place and retake the photo."
        )

    if brightness_status == "TOO_BRIGHT":
        problems.append("Image is too bright.")
        suggestions.append(
            "Reduce excessive lighting and retake the photo."
        )

    if glare_status == "WARNING":
        problems.append("Excessive glare detected.")
        suggestions.append(
            "Change the camera angle to avoid reflections."
        )

    if tilt_status == "WARNING":
        problems.append("Image may be tilted.")
        suggestions.append(
            "Keep the medicine package straight."
        )

    # Decide the overall image quality
    if sharpness < 20 or brightness < 25:
        quality_status = "UNUSABLE"

    elif problems:
        quality_status = "WARNING"

    else:
        quality_status = "GOOD"

    return {
        "success": True,

        "quality_status": quality_status,

        "checks": {
            "blur": {
                "status": blur_status,
                "sharpness_value": sharpness
            },

            "brightness": {
                "status": brightness_status,
                "brightness_value": brightness
            },

            "glare": {
                "status": glare_status,
                "glare_percentage": glare_percentage
            },

            "tilt": {
                "status": tilt_status,
                "estimated_angle_degrees": tilt_angle
            }
        },

        "problems": problems,

        "suggestions": suggestions,

        "can_proceed_to_ocr": (
            quality_status != "UNUSABLE"
        )
    }
