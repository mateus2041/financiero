from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
import os
import secrets

from dotenv import load_dotenv

if os.getenv("PYTHON_DOTENV_DISABLED") != "1":
    load_dotenv()


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

logger = logging.getLogger(__name__)
APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
<<<<<<< HEAD
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()

if not SECRET_KEY:
    if APP_ENV != "development":
        raise RuntimeError("SECRET_KEY es obligatoria fuera de desarrollo.")
=======
SECRET_KEY = (
    os.getenv("SECRET_KEY", "").strip()
    or os.getenv("JWT_SECRET_KEY", "").strip()
)

if not SECRET_KEY:
    if APP_ENV != "development":
        raise RuntimeError(
            "JWT_SECRET_KEY o SECRET_KEY es obligatoria fuera de desarrollo."
        )
>>>>>>> 1d230e60767b7ee8dd388f8bc1c2da18b87a7cc2
    SECRET_KEY = secrets.token_urlsafe(48)
    logger.warning(
        "SECRET_KEY no configurada; se usara una clave temporal de desarrollo."
    )
elif len(SECRET_KEY.encode("utf-8")) < 32:
<<<<<<< HEAD
    raise RuntimeError("SECRET_KEY debe contener al menos 32 bytes.")
=======
    raise RuntimeError("JWT_SECRET_KEY/SECRET_KEY debe contener al menos 32 bytes.")
>>>>>>> 1d230e60767b7ee8dd388f8bc1c2da18b87a7cc2

ALGORITHM = "HS256"


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
    payload = {
        "sub": str(identity)
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
