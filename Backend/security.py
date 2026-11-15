from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
<<<<<<< HEAD
import os

from dotenv import load_dotenv

load_dotenv()
=======
import logging
import os
import secrets
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799


# =========================
# PASSWORD HASH
# =========================

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto"
)


# =========================
# JWT CONFIG
# =========================

<<<<<<< HEAD
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("JWT_SECRET_KEY must be configured with at least 32 characters.")
=======
logger = logging.getLogger(__name__)
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if not SECRET_KEY:
    if APP_ENV != "development":
        raise RuntimeError("SECRET_KEY es obligatoria fuera de desarrollo.")
    SECRET_KEY = secrets.token_urlsafe(48)
    logger.warning(
        "SECRET_KEY no configurada; se usara una clave temporal de desarrollo."
    )
elif len(SECRET_KEY.encode("utf-8")) < 32:
    raise RuntimeError("SECRET_KEY debe contener al menos 32 bytes.")
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


security = HTTPBearer(
    auto_error=False
)


# =========================
# ENCRIPTAR PASSWORD
# =========================

def hash_password(password: str):
    return pwd_context.hash(password)


# =========================
# VERIFICAR PASSWORD
# =========================

def check_password(
    plain: str,
    hashed: str
):
    try:
        if hashed.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(
                plain.encode("utf-8"),
                hashed.encode("utf-8")
            )
        return pwd_context.verify(
            plain,
            hashed
        )
    except Exception:
        return False


# =========================
# GENERAR TOKEN JWT
# =========================

def generate_token(identity: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(identity),
        "exp": expire
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token


# =========================
# VALIDAR TOKEN JWT
# =========================

def token_required(
    credentials: HTTPAuthorizationCredentials | None = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Credenciales de autenticación requeridas"
        )

    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        usuario_id = payload.get("sub")
        if usuario_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token sin usuario"
            )

        return int(usuario_id)

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )
