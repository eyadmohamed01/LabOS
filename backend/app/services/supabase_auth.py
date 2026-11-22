"""Calls to Supabase Auth.

LabOS keeps its own REST API. These functions only create, refresh, and
revoke Auth sessions. They do not read or write database rows.
"""

import httpx

from app.core.config import settings
from app.schemas.auth import AuthSession, AuthUser, RegisterResponse


class SupabaseAuthError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


def register_with_password(email: str, password: str) -> RegisterResponse:
    payload = _post("/signup", json={"email": email, "password": password})
    if _has_session(payload):
        session = _session_from(payload)
        return RegisterResponse(
            user=session.user,
            session=session,
            confirmation_required=False,
        )
    return RegisterResponse(
        user=_user_from(payload),
        session=None,
        confirmation_required=True,
    )


def login_with_password(email: str, password: str) -> AuthSession:
    payload = _post(
        "/token",
        params={"grant_type": "password"},
        json={"email": email, "password": password},
    )
    return _session_from(payload)


def refresh_session(refresh_token: str) -> AuthSession:
    # Supabase rotates the refresh token. The caller must store the new one.
    payload = _post(
        "/token",
        params={"grant_type": "refresh_token"},
        json={"refresh_token": refresh_token},
    )
    return _session_from(payload)


def logout(access_token: str) -> None:
    # local revokes the session for this access token only.
    # The access token itself stays valid until its exp claim.
    response = _request(
        "POST",
        "/logout",
        params={"scope": "local"},
        access_token=access_token,
    )
    if response.status_code >= 400:
        raise _error_from(response)


def _post(path: str, *, params: dict[str, str] | None = None, json: dict[str, str]) -> dict:
    response = _request("POST", path, params=params, json=json)
    if response.status_code >= 400:
        raise _error_from(response)
    return _json_object(response)


def _request(
    method: str,
    path: str,
    *,
    params: dict[str, str] | None = None,
    json: dict[str, str] | None = None,
    access_token: str | None = None,
) -> httpx.Response:
    base_url, api_key = _configuration()
    headers = {"apikey": api_key, "Accept": "application/json"}
    if access_token is not None:
        headers["Authorization"] = f"Bearer {access_token}"
    try:
        with httpx.Client(timeout=10.0) as client:
            return client.request(
                method,
                f"{base_url}/auth/v1{path}",
                params=params,
                json=json,
                headers=headers,
            )
    except httpx.HTTPError as exc:
        raise SupabaseAuthError(502, "Supabase auth is unavailable") from exc


def _configuration() -> tuple[str, str]:
    base_url = settings.supabase_url.strip().rstrip("/")
    api_key = settings.supabase_publishable_key.strip()
    if not base_url or not api_key:
        raise SupabaseAuthError(503, "Supabase auth is not configured")
    return base_url, api_key


def _error_from(response: httpx.Response) -> SupabaseAuthError:
    status_code = response.status_code if response.status_code < 500 else 502
    return SupabaseAuthError(status_code, _error_message(response))


def _error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return "Supabase auth request failed"
    if not isinstance(payload, dict):
        return "Supabase auth request failed"
    weak_password = payload.get("weak_password")
    if isinstance(weak_password, dict):
        message = weak_password.get("message") or payload.get("msg")
        if isinstance(message, str) and message.strip():
            return message.strip()
    message = payload.get("error_description") or payload.get("msg")
    if isinstance(message, str) and message.strip():
        return message.strip()
    return "Supabase auth request failed"


def _json_object(response: httpx.Response) -> dict:
    try:
        payload = response.json()
    except ValueError as exc:
        raise SupabaseAuthError(502, "Supabase auth returned an unreadable response") from exc
    if not isinstance(payload, dict):
        raise SupabaseAuthError(502, "Supabase auth returned an unreadable response")
    return payload


def _has_session(payload: dict) -> bool:
    access_token = payload.get("access_token")
    refresh_token = payload.get("refresh_token")
    return isinstance(access_token, str) and bool(access_token) and isinstance(refresh_token, str) and bool(refresh_token)


def _session_from(payload: dict) -> AuthSession:
    if not _has_session(payload):
        raise SupabaseAuthError(502, "Supabase auth returned an incomplete session")
    expires_in = payload.get("expires_in")
    if isinstance(expires_in, bool) or not isinstance(expires_in, int):
        raise SupabaseAuthError(502, "Supabase auth returned an incomplete session")
    expires_at = payload.get("expires_at")
    if isinstance(expires_at, bool) or not isinstance(expires_at, int):
        expires_at = None
    token_type = payload.get("token_type")
    return AuthSession(
        access_token=payload["access_token"],
        refresh_token=payload["refresh_token"],
        token_type=token_type if isinstance(token_type, str) and token_type else "bearer",
        expires_in=expires_in,
        expires_at=expires_at,
        user=_user_from(payload),
    )


def _user_from(payload: dict) -> AuthUser:
    source = payload["user"] if isinstance(payload.get("user"), dict) else payload
    user_id = source.get("id")
    if not isinstance(user_id, str) or not user_id:
        raise SupabaseAuthError(502, "Supabase auth returned an incomplete user")
    email = source.get("email")
    return AuthUser(id=user_id, email=email if isinstance(email, str) and email else None)
