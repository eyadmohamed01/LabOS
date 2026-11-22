"""Local verification of Supabase access tokens.

Signing keys are fetched from the project JWKS document. Verification does
not call the Auth server and does not accept a shared secret.
"""

from dataclasses import dataclass

import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError, PyJWKClientError, PyJWTError

from app.core.config import settings

# Stay inside the JWKS cache window documented by Supabase.
_JWKS_LIFESPAN_SECONDS = 300
_clients: dict[str, PyJWKClient] = {}


class AccessTokenError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


@dataclass(frozen=True)
class AccessTokenClaims:
    user_id: str
    email: str | None
    role: str
    expires_at: int


def verify_access_token(token: str) -> AccessTokenClaims:
    base_url = settings.supabase_url.strip().rstrip("/")
    if not base_url:
        raise AccessTokenError("Supabase auth is not configured", status_code=503)
    issuer = f"{base_url}/auth/v1"
    try:
        signing_key = jwks_client_for(f"{issuer}/.well-known/jwks.json").get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=issuer,
            leeway=10,
            options={"require": ["exp", "sub", "iss", "aud"]},
        )
    except PyJWKClientConnectionError as exc:
        raise AccessTokenError("Could not verify access token", status_code=503) from exc
    except jwt.ExpiredSignatureError as exc:
        raise AccessTokenError("Access token expired") from exc
    except (PyJWTError, PyJWKClientError) as exc:
        raise AccessTokenError("Invalid access token") from exc

    role = claims.get("role")
    subject = claims.get("sub")
    expires_at = claims.get("exp")
    if role != "authenticated" or not isinstance(subject, str) or not isinstance(expires_at, int):
        raise AccessTokenError("Invalid access token")
    email = claims.get("email")
    return AccessTokenClaims(
        user_id=subject,
        email=email if isinstance(email, str) and email else None,
        role=role,
        expires_at=expires_at,
    )


def jwks_client_for(jwks_url: str) -> PyJWKClient:
    client = _clients.get(jwks_url)
    if client is None:
        client = PyJWKClient(
            jwks_url,
            cache_keys=True,
            cache_jwk_set=True,
            lifespan=_JWKS_LIFESPAN_SECONDS,
            timeout=10,
        )
        _clients[jwks_url] = client
    return client
