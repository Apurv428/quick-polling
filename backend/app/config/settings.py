"""
Configuration settings for QuickPoll application.
Follows Single Responsibility Principle - manages application configuration only.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings using Pydantic for validation."""

    app_name: str = "QuickPoll API"
    app_version: str = "3.0.0"
    app_description: str = "Production-ready real-time polling with analytics and social features"
    debug: bool = True

    host: str = "0.0.0.0"
    port: int = 8000

    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    cache_ttl: int = 300

    rate_limit_enabled: bool = True
    rate_limit_polls_create: str = "5/minute"
    rate_limit_votes: str = "30/minute"
    rate_limit_reactions: str = "30/minute"
    rate_limit_profile_update: str = "10/minute"

    trusted_hosts: List[str] = ["localhost", "127.0.0.1"]

    min_poll_options: int = 2
    max_poll_options: int = 10
    min_poll_title_length: int = 5
    max_poll_title_length: int = 200
    max_option_length: int = 200
    max_bio_length: int = 200

    trending_decay_hours: int = 24
    vote_weight: float = 1.0
    like_weight: float = 0.5

    openai_api_key: str = ""
    openai_enabled: bool = False

    webhook_enabled: bool = True
    admin_api_key: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
