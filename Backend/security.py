from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# =========================
# 🔥 HASH (ARGON2 - SIN LÍMITE 72 BYTES)
# =========================
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

# =========================
# 🔐 JWT CONFIG
# =========================
SECRET_KEY = "clave_super_secreta_cambiala_por_una_mas_larga"
ALGORITHM = "HS256"

security = HTTPBearer()

# =========================
# HASH PASSWORD
# =========================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# =========================
# VERIFICAR PASSWORD
# =========================
def check_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False

# =========================
# GENERAR TOKEN JWT
# =========================
def generate_token(identity: int):
    payload = {
        "sub": str(identity)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# =========================
# VALIDAR TOKEN
# =========================
def token_required(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado"
        )