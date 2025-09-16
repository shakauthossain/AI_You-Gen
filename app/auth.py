
import os
import requests
from jose import jwt
from fastapi import Request, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

# Set this to your Clerk JWKS endpoint, e.g. 'https://<your-app>.clerk.accounts.dev/.well-known/jwks.json'
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
if not CLERK_JWKS_URL:
    raise RuntimeError("CLERK_JWKS_URL not set. Example: https://<your-app>.clerk.accounts.dev/.well-known/jwks.json")

_jwks_cache = None

def get_jwks():
    global _jwks_cache
    if _jwks_cache is None:
        resp = requests.get(CLERK_JWKS_URL)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache

def verify_clerk_jwt(token: str):
    jwks = get_jwks()
    headers = jwt.get_unverified_header(token)
    kid = headers["kid"]
    key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
    if not key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: unknown key")
    try:
        payload = jwt.decode(token, key, algorithms=[key["alg"]], options={"verify_aud": False})
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

def get_current_user(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")
    token = auth_header.split(" ", 1)[1]
    payload = verify_clerk_jwt(token)
    return payload
