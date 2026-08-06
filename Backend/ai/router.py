from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from Backend.dependencias import get_db
from Backend.security import token_required

from .chains import chain
from .tools import (
    obtener_usuario,
    obtener_cuenta,
    obtener_transacciones
)


router = APIRouter(
    prefix="/ia",
    tags=["Inteligencia Artificial"]
)



class Consulta(BaseModel):
    pregunta:str



@router.post("/chat")
def chat(
    data:Consulta,
    current_user:int=Depends(token_required),
    db:Session=Depends(get_db)
):

    try:

        usuario = obtener_usuario(
            db,
            current_user
        )


        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )


        cuenta = obtener_cuenta(
            db,
            current_user
        )


        historial = ""


        if cuenta:

            movimientos = obtener_transacciones(
                db,
                cuenta.id_cuenta
            )


            for movimiento in movimientos:

                historial += (
                    f"Tipo: {movimiento.tipo}\n"
                    f"Monto: {movimiento.monto}\n"
                    f"Descripción: {movimiento.descripcion}\n\n"
                )



        contexto = f"""

Nombre:
{usuario.nombre}

Documento:
{usuario.documento}

Correo:
{usuario.email}


Transacciones:

{historial}

"""


        respuesta = chain.invoke(
            {
                "pregunta":data.pregunta,
                "contexto":contexto
            }
        )


        return {
            "respuesta":respuesta.content
        }



    except HTTPException:
        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )