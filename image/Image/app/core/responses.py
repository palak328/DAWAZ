from uuid import uuid4

def success(data, warnings=None):
    return {
        "request_id": str(uuid4()),
        "data": data,
        "warnings": warnings or [],
        "error": None,
    }

def failure(message, code="BAD_REQUEST"):
    return {
        "request_id": str(uuid4()),
        "data": None,
        "warnings": [],
        "error": {"code": code, "message": message},
    }
