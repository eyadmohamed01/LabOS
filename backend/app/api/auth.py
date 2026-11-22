from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import AuthenticatedUser, get_current_user
from app.schemas.auth import (
    AuthSession,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    SessionResponse,
)
from app.services.supabase_auth import (
    SupabaseAuthError,
    login_with_password,
    logout,
    refresh_session,
    register_with_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse)
def register(body: RegisterRequest) -> RegisterResponse:
    return _call(register_with_password, body.email, body.password)


@router.post("/login", response_model=AuthSession)
def login(body: LoginRequest) -> AuthSession:
    return _call(login_with_password, body.email, body.password)


@router.post("/refresh", response_model=AuthSession)
def refresh(body: RefreshRequest) -> AuthSession:
    return _call(refresh_session, body.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def sign_out(user: AuthenticatedUser = Depends(get_current_user)) -> None:
    _call(logout, user.access_token)


@router.get("/session", response_model=SessionResponse)
def session(user: AuthenticatedUser = Depends(get_current_user)) -> SessionResponse:
    return SessionResponse(
        user_id=user.id,
        email=user.email,
        role=user.role,
        expires_at=user.expires_at,
    )


def _call(func, *args):
    try:
        return func(*args)
    except SupabaseAuthError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None
