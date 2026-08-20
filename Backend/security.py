from passlib.context import CryptContext
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta


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

SECRET_KEY = "clave_super_secreta_cambiala_por_una_mas_larga"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


security = HTTPBearer(
    auto_error=True
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


    expire = datetime.utcnow() + timedelta(
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
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    try:


        token = credentials.credentials


        print("======================")
        print("TOKEN RECIBIDO:")
        print(token)
        print("======================")


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



    except JWTError as e:


        print("ERROR JWT:", e)


        raise HTTPException(

            status_code=401,

            detail="Token inválido o expirado"

        )



    except Exception as e:


        print("ERROR TOKEN:", e)


        raise HTTPException(

            status_code=401,

            detail="Token inválido"

        )