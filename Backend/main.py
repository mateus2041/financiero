from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

# 🔹 IMPORTS
from Backend.models import Usuario, Transaccion, Cuenta
from Backend.security import (
    hash_password,
    check_password,
    generate_token,
    token_required,
)
from Backend.dependencias import get_db

# 🔹 APP
financiero = FastAPI()

# 🔹 CORS
financiero.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 CREAR TABLAS
@financiero.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# =======================
# ROOT
# =======================
@financiero.get("/inicio")
async def root():
    return {"message": "API funcionando correctamente"}


# =======================
# AUTH
# =======================
@financiero.post("/register")
def register(data: dict, db: Session = Depends(get_db)):
    try:
        required_fields = ["nombre", "email", "password", "documento"]

        if not all(field in data for field in required_fields):
            raise HTTPException(status_code=400, detail="Faltan campos")

        if len(data["password"]) < 6:
            raise HTTPException(status_code=400, detail="Contraseña muy corta")

        if len(data["password"]) > 72:
            raise HTTPException(status_code=400, detail="Contraseña demasiado larga")

        existe = db.query(Usuario).filter(
            Usuario.documento == data["documento"]
        ).first()

        if existe:
            raise HTTPException(status_code=409, detail="Usuario ya existe")

        hashed = hash_password(data["password"])

        nuevo_usuario = Usuario(
            nombre=data["nombre"],
            email=data["email"],
            password=hashed,
            documento=data["documento"],
            telefono=data.get("telefono"),
            direccion=data.get("direccion"),
        )

        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)

        token = generate_token(identity=nuevo_usuario.id_usuario)

        return {
            "message": "Usuario creado correctamente",
            "token": token,
            "usuario": {
                "id": nuevo_usuario.id_usuario,
                "nombre": nuevo_usuario.nombre,
                "documento": nuevo_usuario.documento,
                "email": nuevo_usuario.email,
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =======================
# LOGIN
# =======================
@financiero.post("/login")
def login(data: dict, db: Session = Depends(get_db)):

    print("Datos recibidos:", data)

    usuario = db.query(Usuario).filter(
        Usuario.documento == data["documento"]
    ).first()

    print("Usuario encontrado:", usuario)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    if not check_password(data["password"], usuario.password):
        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas"
        )

    token = generate_token(identity=usuario.id_usuario)

    return {
        "message": "Login exitoso",
        "token": token,
        "id": usuario.id_usuario
    }


# =======================
# USUARIO
# =======================
@financiero.get("/usuario/{id}")
def get_user(id: int, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == id
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": usuario.id_usuario,
        "nombre": usuario.nombre,
        "documento": usuario.documento,
        "email": usuario.email,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
    }


# =======================
# TRANSACCIONES (FIX IMPORTANTE)
# =======================
@financiero.get("/transacciones")
def get_transacciones(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db),
):
    try:
        transacciones = (
            db.query(Transaccion)
            .filter(Transaccion.id_cuenta == current_user)  # 🔥 FIX
            .order_by(Transaccion.id_transaccion.desc())    # 🔥 FIX
            .all()
        )

        return transacciones

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@financiero.post("/transacciones")
def add_transaccion(
    data: dict,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db),
):

    if "tipo" not in data or "monto" not in data:
        raise HTTPException(status_code=400, detail="Faltan campos")

    if data["tipo"] not in ["Ingreso", "Gasto", "Transferencia"]:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    if float(data["monto"]) <= 0:
        raise HTTPException(status_code=400, detail="Monto inválido")

    try:
        nueva = Transaccion(
            id_cuenta=current_user,   # 🔥 FIX
            tipo=data["tipo"],
            monto=float(data["monto"]),
            descripcion=data.get("descripcion", ""),
        )

        db.add(nueva)
        db.commit()
        db.refresh(nueva)

        return {
            "message": "Transacción creada correctamente",
            "transaccion": {
                "id": nueva.id_transaccion,
                "tipo": nueva.tipo,
                "monto": float(nueva.monto),
            },
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# =======================
# TEST DB
# =======================
@financiero.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"message": "Conexión exitosa"}

    except Exception as e:
        return {"error": str(e)}