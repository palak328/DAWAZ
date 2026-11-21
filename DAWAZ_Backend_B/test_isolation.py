
import json
import urllib.request
import urllib.error
import uuid

BASE = "http://127.0.0.1:8000"
suffix = uuid.uuid4().hex[:8]

username = f"isolation_{suffix}"
password = f"TestPass_{suffix}!"
email = f"{username}@example.com"

def request(path, method="GET", data=None, token=None):
    headers = {}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(
        BASE + path, data=body, headers=headers, method=method
    )
    return urllib.request.urlopen(req)

# Register second user
user = {
    "full_name": "Isolation Test Patient",
    "username": username,
    "email": email,
    "password": password
}
response = request("/users/register", "POST", user)
print("Registration:", response.status)

# Login second user
login = request("/users/login", "POST", {
    "username": username,
    "password": password
})
token = json.loads(login.read())["access_token"]
print("Second patient login: PASSED")

# Create patient profile
profile = request(
    "/patients/profile",
    "POST",
    {"preferred_language": "en"},
    token
)
print("Patient profile:", profile.status)

# Attempt to access first patient's scan
try:
    response = request("/scans/1", token=token)
    print("ISOLATION FAILED: scan was accessible")
    print(response.read().decode())
except urllib.error.HTTPError as e:
    print("Scan access HTTP status:", e.code)
    if e.code == 404:
        print("ISOLATION PASSED: second patient cannot access scan 1")
    else:
        print("Unexpected response:", e.read().decode())
