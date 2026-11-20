from app.services.auth import create_access_token, verify_access_token

token = create_access_token({
    "sub": "1",
    "role": "patient"
})

print("Token generated:", bool(token))

payload = verify_access_token(token)

print("Token verified:", payload is not None)
print("User ID:", payload["sub"] if payload else None)