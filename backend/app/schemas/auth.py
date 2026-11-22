from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


class AuthUser(BaseModel):
    id: str
    email: str | None = None


class AuthSession(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    expires_at: int | None = None
    user: AuthUser


class RegisterResponse(BaseModel):
    user: AuthUser
    session: AuthSession | None = None
    confirmation_required: bool


class SessionResponse(BaseModel):
    user_id: str
    email: str | None = None
    role: str
    expires_at: int
