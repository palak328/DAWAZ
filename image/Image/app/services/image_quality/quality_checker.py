from PIL import Image, ImageStat
import io

def check_image_quality(image_bytes: bytes) -> dict:
    """Basic heuristics only. These are guidance signals, not medical thresholds."""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        gray = image.convert("L")
        stats = ImageStat.Stat(gray)
        brightness = stats.mean[0]
        contrast = stats.stddev[0]

        # Variance of pixel brightness is a very rough blur indicator.
        # It is deliberately not used to confirm medicine identity.
        pixels = list(gray.resize((min(160, gray.width), min(160, gray.height))).getdata())
        if len(pixels) > 1:
            mean = sum(pixels) / len(pixels)
            variance = sum((p - mean) ** 2 for p in pixels) / len(pixels)
        else:
            variance = 0

        rgb = list(image.resize((min(100, image.width), min(100, image.height))).getdata())
        glare_ratio = sum(1 for r, g, b in rgb if r > 247 and g > 247 and b > 247) / max(1, len(rgb))

        problems = []
        if brightness < 55:
            problems.append("Image looks too dark. Move to better lighting.")
        if variance < 180:
            problems.append("Image may be blurry. Hold the camera steady and scan again.")
        if glare_ratio > 0.35:
            problems.append("There may be glare. Change the camera angle and scan again.")
        if contrast < 18:
            problems.append("Text contrast is low. Move closer and improve the lighting.")

        return {
            "is_usable": len(problems) == 0,
            "brightness": round(brightness, 1),
            "contrast": round(contrast, 1),
            "blur_indicator": round(variance, 1),
            "glare_ratio": round(glare_ratio, 2),
            "messages": problems,
        }
    except Exception:
        return {
            "is_usable": False,
            "brightness": None,
            "contrast": None,
            "blur_indicator": None,
            "glare_ratio": None,
            "messages": ["This image could not be opened. Please upload a JPG or PNG image."],
        }
