import getpass
import json
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8000"
IMAGE = r"C:\Users\ACER\OneDrive\Desktop\Stocksense\DAWAZ\image\Image\medicine.jpg"

username = input("Username: ")
password = getpass.getpass("Password: ")

login_data = json.dumps({
    "username": username,
    "password": password
}).encode()

req = urllib.request.Request(
    BASE + "/users/login",
    data=login_data,
    headers={"Content-Type": "application/json"}
)

try:
    token = json.loads(urllib.request.urlopen(req).read())["access_token"]

    boundary = "----DAWAZBoundary"
    with open(IMAGE, "rb") as f:
        image_data = f.read()

    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="image"; filename="medicine.jpg"\r\n'
        "Content-Type: image/jpeg\r\n\r\n"
    ).encode() + image_data + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        BASE + "/scans",
        data=body,
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "multipart/form-data; boundary=" + boundary
        }
    )

    result = json.loads(urllib.request.urlopen(req).read())
    print(json.dumps(result, indent=2))

except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode())
except Exception as e:
    print("ERROR:", str(e))