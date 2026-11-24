"""
Login & role untuk TextScope (Supabase Auth).

Alur:
1. Frontend login ke Supabase dan mendapat access token (JWT).
2. Setiap request ke backend membawa header  Authorization: Bearer <token>.
3. Backend memeriksa tanda tangan token, lalu membaca role & status akun
   dari tabel public.profiles (pakai token pengguna itu sendiri, jadi tetap
   tunduk pada aturan RLS di database).

Variabel lingkungan:
  SUPABASE_URL         https://xxxx.supabase.co           (wajib untuk mengaktifkan login)
  SUPABASE_ANON_KEY    publishable/anon key project        (wajib untuk membaca profil)
  SUPABASE_JWT_SECRET  JWT secret lama (HS256), opsional. Kalau kosong, token
                       diperiksa dengan kunci publik (JWKS) project Supabase.

Kalau SUPABASE_URL kosong, login dimatikan (mode pengembangan lokal) dan
semua request dianggap berasal dari admin lokal. JANGAN deploy tanpa SUPABASE_URL.
"""

import logging
import os
import time
from dataclasses import dataclass
from typing import Dict, Optional, Tuple

import httpx
import jwt
from fastapi import Depends, HTTPException, Request

logger = logging.getLogger("textscope.auth")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
AUTH_ENABLED = bool(SUPABASE_URL)
PROFILE_CACHE_SECONDS = 60

_jwks_client: Optional[jwt.PyJWKClient] = None
_profile_cache: Dict[str, Tuple[float, "User"]] = {}


@dataclass
class User:
    id: str
    email: str
    role: str
    full_name: str = ""

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


LOCAL_ADMIN = User(id="local", email="lokal@textscope", role="admin", full_name="Mode lokal")


def log_status() -> None:
    if AUTH_ENABLED:
        logger.info("Login aktif (Supabase: %s).", SUPABASE_URL)
        if not SUPABASE_ANON_KEY:
            logger.warning("SUPABASE_ANON_KEY kosong: role pengguna tidak bisa dibaca.")
    else:
        logger.warning("SUPABASE_URL kosong: login DIMATIKAN (mode lokal). Jangan dipakai saat deploy.")


def _jwks() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", cache_keys=True)
    return _jwks_client


def _decode(token: str) -> dict:
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
        if alg == "HS256":
            if not SUPABASE_JWT_SECRET:
                raise jwt.InvalidTokenError("JWT secret belum diatur")
            key = SUPABASE_JWT_SECRET
        else:
            key = _jwks().get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            key,
            algorithms=["HS256", "RS256", "ES256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sesi kamu sudah berakhir. Silakan masuk lagi.")
    except (jwt.InvalidTokenError, jwt.PyJWKClientError) as exc:
        logger.info("Token ditolak: %s", exc)
        raise HTTPException(status_code=401, detail="Sesi tidak valid. Silakan masuk lagi.")


def _load_profile(user_id: str, token: str) -> Optional[dict]:
    try:
        res = httpx.get(
            f"{SUPABASE_URL}/rest/v1/profiles",
            params={"id": f"eq.{user_id}", "select": "email,full_name,role,is_active"},
            headers={"apikey": SUPABASE_ANON_KEY, "Authorization": f"Bearer {token}"},
            timeout=8,
        )
        res.raise_for_status()
        rows = res.json()
        return rows[0] if rows else None
    except httpx.HTTPError as exc:
        logger.error("Gagal membaca profil: %s", exc)
        raise HTTPException(status_code=503, detail="Data akun tidak bisa dibaca. Coba lagi sebentar.")


def get_current_user(request: Request) -> User:
    """Dependency: wajib login dan akun masih aktif."""
    if not AUTH_ENABLED:
        return LOCAL_ADMIN

    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Silakan masuk terlebih dahulu.")
    token = header[7:].strip()
    claims = _decode(token)
    user_id = claims["sub"]

    cached = _profile_cache.get(user_id)
    if cached and time.time() - cached[0] < PROFILE_CACHE_SECONDS:
        return cached[1]

    profile = _load_profile(user_id, token)
    if profile is None:
        raise HTTPException(status_code=403, detail="Profil akun tidak ditemukan.")
    if not profile.get("is_active", False):
        raise HTTPException(status_code=403, detail="Akun kamu dinonaktifkan. Hubungi admin TextScope.")

    user = User(
        id=user_id,
        email=profile.get("email") or claims.get("email", ""),
        role=profile.get("role", "pengguna"),
        full_name=profile.get("full_name", ""),
    )
    _profile_cache[user_id] = (time.time(), user)
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Dependency: khusus admin."""
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Halaman ini khusus admin.")
    return user
