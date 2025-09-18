import os
import requests
from jose import jwt
from fastapi import Request, HTTPException, status
from dotenv import load_dotenv

load_dotenv()

CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API")
if not CLERK_FRONTEND_API:
    raise RuntimeError("CLERK_FRONTEND_API environment variable not set.")

CLERK_ISSUER = f"https://{CLERK_FRONTEND_API}"
CLERK_JWKS_URL = f"{CLERK_ISSUER}/.well-known/jwks.json"
jwks = requests.get(CLERK_JWKS_URL).json()

def get_current_user(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")

    token = auth_header.split("Bearer ")[-1].strip()

    try:
        unverified_header = jwt.get_unverified_header(token)
        key = next(
            (k for k in jwks["keys"] if k["kid"] == unverified_header["kid"]),
            None,
        )
        if not key:
            raise HTTPException(status_code=401, detail="Invalid token header")

        payload = jwt.decode(
            token,
            key,
            algorithms=[unverified_header["alg"]],
            audience=os.getenv("CLERK_AUDIENCE"),  # Comma-separated list is fine
            issuer=CLERK_ISSUER,
        )
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")