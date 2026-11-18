from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    database_url: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.backend_cors_origins.split(",") if item.strip()]


settings = Settings()
