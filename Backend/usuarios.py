from fastapi import APIRouter, Depends
from database import get_db
from security import obtener_usuario_actual

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/perfil")
def obtener_perfil(usuario=Depends(obtener_usuario_actual)):
    return {
        "nombre": usuario.nombre,
        "documento": usuario.documento,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion
    }