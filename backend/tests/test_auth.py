import json
import time

import httpx
import jwt
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jwt.exceptions import PyJWKClientConnectionError

from app.core.config import settings
from app.core.jwt import AccessTokenError, verify_access_token
from app.main import app

client = TestClient(app)
ISSUER = "https://example.supabase.co/auth/v1"


def test_health_stays_public() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_contains_auth_routes() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/auth/register" in paths
    assert "/api/auth/login" in paths
    assert "/api/auth/refresh" in paths
    assert "/api/auth/logout" in paths
    assert "/api/auth/session" in paths


def test_login_requires_configuration(monkeypatch) -> None:
    monkeypatch.setattr(settings, "supabase_url", "")
    monkeypatch.setattr(settings, "supabase_publishable_key", "")
    response = client.post(
        "/api/auth/login",
        json={"email": "ada@lab.test", "password": "secret12"},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Supabase auth is not configured"


def test_register_rejects_a_short_password() -> None:
    response = client.post(
        "/api/auth/register",
        json={"email": "ada@lab.test", "password": "short"},
    )
    assert response.status_code == 422


def test_login_returns_the_session_without_user_metadata(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/auth/v1/token"
        assert request.url.params["grant_type"] == "password"
        assert request.headers["apikey"] == "sb_publishable_test"
        assert "authorization" not in request.headers
        assert json.loads(request.content) == {"email": "ada@lab.test", "password": "secret12"}
        return httpx.Response(
            200,
            json={
                "access_token": "access-1",
                "refresh_token": "refresh-1",
                "token_type": "bearer",
                "expires_in": 3600,
                "expires_at": 1_700_000_000,
                "user": {
                    "id": "user-1",
                    "email": "ada@lab.test",
                    "app_metadata": {"provider": "email"},
                    "user_metadata": {"name": "Ada"},
                },
            },
        )

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    response = client.post(
        "/api/auth/login",
        json={"email": "ada@lab.test", "password": "secret12"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] == "access-1"
    assert body["refresh_token"] == "refresh-1"
    assert body["expires_in"] == 3600
    assert body["user"] == {"id": "user-1", "email": "ada@lab.test"}
    assert "user_metadata" not in response.text
    assert "app_metadata" not in response.text


def test_login_reports_invalid_credentials(monkeypatch) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            400,
            json={"error": "invalid_grant", "error_description": "Invalid login credentials"},
        )

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    response = client.post(
        "/api/auth/login",
        json={"email": "ada@lab.test", "password": "wrong-password"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid login credentials"


def test_register_without_a_session_requires_confirmation(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/auth/v1/signup"
        return httpx.Response(
            200,
            json={
                "id": "user-2",
                "email": "ada@lab.test",
                "user_metadata": {"name": "Ada"},
            },
        )

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    response = client.post(
        "/api/auth/register",
        json={"email": "ada@lab.test", "password": "secret12"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "user": {"id": "user-2", "email": "ada@lab.test"},
        "session": None,
        "confirmation_required": True,
    }


def test_register_returns_a_session_when_confirmation_is_off(monkeypatch) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_session_payload())

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    response = client.post(
        "/api/auth/register",
        json={"email": "ada@lab.test", "password": "secret12"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["confirmation_required"] is False
    assert body["session"]["access_token"] == "access-1"
    assert body["session"]["user"] == {"id": "user-1", "email": "ada@lab.test"}


def test_refresh_asks_supabase_to_rotate_the_token(monkeypatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["grant_type"] == "refresh_token"
        assert json.loads(request.content) == {"refresh_token": "refresh-1"}
        payload = _session_payload()
        payload["access_token"] = "access-2"
        payload["refresh_token"] = "refresh-2"
        return httpx.Response(200, json=payload)

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    response = client.post("/api/auth/refresh", json={"refresh_token": "refresh-1"})
    assert response.status_code == 200
    assert response.json()["access_token"] == "access-2"
    assert response.json()["refresh_token"] == "refresh-2"


def test_logout_revokes_only_the_current_session(monkeypatch) -> None:
    seen: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["path"] = request.url.path
        seen["scope"] = request.url.params["scope"]
        seen["authorization"] = request.headers["authorization"]
        return httpx.Response(204)

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    _accept_token(monkeypatch, user_id="user-1", email="ada@lab.test")
    response = client.post("/api/auth/logout", headers={"Authorization": "Bearer signed-token"})
    assert response.status_code == 204
    assert response.content == b""
    assert seen == {
        "path": "/auth/v1/logout",
        "scope": "local",
        "authorization": "Bearer signed-token",
    }


def test_logout_and_session_reject_a_missing_token() -> None:
    assert client.post("/api/auth/logout").status_code == 401
    assert client.get("/api/auth/session").status_code == 401
    assert client.get("/api/auth/session").json()["detail"] == "Missing bearer token"


def test_session_returns_verified_claims_only(monkeypatch) -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    _trust(monkeypatch, private_key.public_key())
    token = _sign(private_key, user_metadata={"name": "Ada"})
    response = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    body = response.json()
    assert body == {
        "user_id": "user-1",
        "email": "ada@lab.test",
        "role": "authenticated",
        "expires_at": body["expires_at"],
    }
    assert "user_metadata" not in body
    assert body["expires_at"] > int(time.time())


def test_session_rejects_a_token_signed_by_another_key(monkeypatch) -> None:
    trusted = ec.generate_private_key(ec.SECP256R1())
    attacker = ec.generate_private_key(ec.SECP256R1())
    _trust(monkeypatch, trusted.public_key())
    token = _sign(attacker)
    response = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid access token"


def test_session_reports_an_expired_token(monkeypatch) -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    _trust(monkeypatch, private_key.public_key())
    token = _sign(private_key, exp=int(time.time()) - 60)
    response = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Access token expired"


def test_session_rejects_a_token_for_another_project(monkeypatch) -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    _trust(monkeypatch, private_key.public_key())
    token = _sign(private_key, issuer="https://other.supabase.co/auth/v1")
    response = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_session_rejects_a_non_authenticated_role(monkeypatch) -> None:
    private_key = ec.generate_private_key(ec.SECP256R1())
    _trust(monkeypatch, private_key.public_key())
    token = _sign(private_key, role="anon")
    response = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_verifier_reports_when_the_jwks_cannot_be_fetched(monkeypatch) -> None:
    class OfflineClient:
        def get_signing_key_from_jwt(self, _token: str):
            raise PyJWKClientConnectionError("offline")

    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr("app.core.jwt.jwks_client_for", lambda _url: OfflineClient())
    try:
        verify_access_token("header.payload.signature")
    except AccessTokenError as exc:
        assert exc.status_code == 503
        assert exc.message == "Could not verify access token"
    else:
        raise AssertionError("expected AccessTokenError")


def test_upstream_failure_is_a_bad_gateway(monkeypatch) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"msg": "internal"})

    _configure(monkeypatch)
    _transport(monkeypatch, handler)
    response = client.post(
        "/api/auth/login",
        json={"email": "ada@lab.test", "password": "secret12"},
    )
    assert response.status_code == 502
    assert response.json()["detail"] == "internal"


def _configure(monkeypatch) -> None:
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "supabase_publishable_key", "sb_publishable_test")


def _transport(monkeypatch, handler) -> None:
    transport = httpx.MockTransport(handler)
    original = httpx.Client

    def factory(*args, **kwargs):
        kwargs["transport"] = transport
        return original(*args, **kwargs)

    monkeypatch.setattr("app.services.supabase_auth.httpx.Client", factory)


def _accept_token(monkeypatch, *, user_id: str, email: str) -> None:
    def verify(token: str):
        from app.core.jwt import AccessTokenClaims

        assert token == "signed-token"
        return AccessTokenClaims(user_id=user_id, email=email, role="authenticated", expires_at=1_700_000_000)

    monkeypatch.setattr("app.api.deps.verify_access_token", verify)


def _trust(monkeypatch, public_key) -> None:
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")

    class FakeKey:
        def __init__(self, key):
            self.key = key

    class FakeClient:
        def get_signing_key_from_jwt(self, _token: str):
            return FakeKey(public_key)

    monkeypatch.setattr("app.core.jwt.jwks_client_for", lambda _url: FakeClient())


def _sign(
    private_key,
    *,
    issuer: str = ISSUER,
    role: str = "authenticated",
    exp: int | None = None,
    user_metadata: dict | None = None,
) -> str:
    now = int(time.time())
    payload = {
        "iss": issuer,
        "sub": "user-1",
        "aud": "authenticated",
        "role": role,
        "email": "ada@lab.test",
        "exp": now + 3600 if exp is None else exp,
        "iat": now,
    }
    if user_metadata is not None:
        payload["user_metadata"] = user_metadata
    return jwt.encode(payload, private_key, algorithm="ES256")


def _session_payload() -> dict:
    return {
        "access_token": "access-1",
        "refresh_token": "refresh-1",
        "token_type": "bearer",
        "expires_in": 3600,
        "expires_at": 1_700_000_000,
        "user": {"id": "user-1", "email": "ada@lab.test"},
    }
