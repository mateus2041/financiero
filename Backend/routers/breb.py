from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
import uuid

from Backend.database.database import get_db
from Backend.models import (
    Usuario,
    Cuenta,
    Transaccion,
    LlaveBreb,
    TransferenciaBreb,
    ControlTopeBreb
)
from Backend.security import token_required


# =========================================================
# 🔹 ROUTER
# =========================================================

router = APIRouter(
    prefix="/bre-b",
    tags=["Bre-B"]
)


# =========================================================
# 🔹 MODELO PARA REGISTRAR LLAVE
# =========================================================

class RegistrarLlave(BaseModel):

    llave: str

    tipo_llave: str

    id_cuenta: int


# =========================================================
# 🔹 MODELO PARA TRANSFERENCIA
# =========================================================

class TransferenciaBreB(BaseModel):

    origen: str

    llave_destino: str

    monto: Decimal

    descripcion: str = ""


# =========================================================
# 🔹 REGISTRAR LLAVE BRE-B
# =========================================================

@router.post("/registrar-llave")
def registrar_llave_breb(

    data: RegistrarLlave,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    # =====================================================
    # VALIDAR LLAVE
    # =====================================================

    llave = data.llave.strip()

    if not llave:

        raise HTTPException(
            status_code=400,
            detail="Debe ingresar una llave Bre-B."
        )


    # =====================================================
    # VALIDAR TIPO
    # =====================================================

    tipos_validos = [
        "documento",
        "celular",
        "correo",
        "alfanumerica"
    ]

    if data.tipo_llave not in tipos_validos:

        raise HTTPException(
            status_code=400,
            detail="Tipo de llave no válido."
        )


    # =====================================================
    # BUSCAR CUENTA
    # =====================================================

    cuenta = db.query(Cuenta).filter(

        Cuenta.id_cuenta == data.id_cuenta,

        Cuenta.id_usuario == current_user,

        Cuenta.estado == "activa"

    ).first()


    if not cuenta:

        raise HTTPException(
            status_code=404,
            detail="La cuenta no existe o no pertenece al usuario."
        )


    # =====================================================
    # VERIFICAR SI LA LLAVE YA EXISTE
    # =====================================================

    llave_existente = db.query(LlaveBreb).filter(

        LlaveBreb.llave == llave

    ).first()


    if llave_existente:

        raise HTTPException(
            status_code=409,
            detail="Esta llave Bre-B ya está registrada."
        )


    # =====================================================
    # CREAR LLAVE
    # =====================================================

    nueva_llave = LlaveBreb(

        id_usuario=current_user,

        id_cuenta=cuenta.id_cuenta,

        tipo_llave=data.tipo_llave,

        llave=llave,

        estado="activa"

    )


    db.add(nueva_llave)

    db.commit()

    db.refresh(nueva_llave)


    return {

        "mensaje":
        "Llave Bre-B registrada correctamente.",

        "id_llave":
        nueva_llave.id_llave,

        "llave":
        nueva_llave.llave,

        "tipo_llave":
        nueva_llave.tipo_llave,

        "id_cuenta":
        nueva_llave.id_cuenta

    }


# =========================================================
# 🔹 CONSULTAR LLAVE BRE-B
# =========================================================

@router.get("/consultar/{llave}")
def consultar_llave_breb(

    llave: str,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    llave_buscar = llave.strip()


    # =====================================================
    # BUSCAR LLAVE
    # =====================================================

    llave_breb = db.query(LlaveBreb).filter(

        LlaveBreb.llave == llave_buscar,

        LlaveBreb.estado == "activa"

    ).first()


    if not llave_breb:

        raise HTTPException(
            status_code=404,
            detail="No se encontró un usuario asociado a esta llave Bre-B."
        )


    # =====================================================
    # EVITAR PROPIA LLAVE
    # =====================================================

    if llave_breb.id_usuario == current_user:

        raise HTTPException(
            status_code=400,
            detail="Esta llave pertenece a su propio usuario."
        )


    # =====================================================
    # BUSCAR USUARIO
    # =====================================================

    usuario = db.query(Usuario).filter(

        Usuario.id_usuario == llave_breb.id_usuario

    ).first()


    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuario asociado a la llave no encontrado."
        )


    # =====================================================
    # BUSCAR CUENTA
    # =====================================================

    cuenta = db.query(Cuenta).filter(

        Cuenta.id_cuenta == llave_breb.id_cuenta,

        Cuenta.estado == "activa"

    ).first()


    if not cuenta:

        raise HTTPException(
            status_code=404,
            detail="La cuenta asociada a la llave no está disponible."
        )


    return {

        "nombre":
        usuario.nombre,

        "documento":
        usuario.documento,

        "llave":
        llave_breb.llave,

        "tipo_llave":
        llave_breb.tipo_llave,

        "id_cuenta":
        cuenta.id_cuenta,

        "tipo_cuenta":
        cuenta.tipo_cuenta

    }


# =========================================================
# 🔹 TRANSFERENCIA BRE-B
# =========================================================

@router.post("/transferir")
def transferir_breb(

    data: TransferenciaBreB,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    try:

        # =================================================
        # VALIDAR MONTO
        # =================================================

        if data.monto <= Decimal("0"):

            raise HTTPException(
                status_code=400,
                detail="El monto debe ser mayor que cero."
            )


        monto = Decimal(
            str(data.monto)
        )


        # =================================================
        # VALIDAR ORIGEN
        # =================================================

        if data.origen not in [

            "corriente",

            "ahorro",

            "ahorros"

        ]:

            raise HTTPException(
                status_code=400,
                detail="Cuenta de origen no válida."
            )


        if data.origen in [

            "ahorro",

            "ahorros"

        ]:

            tipo_origen = "ahorros"

        else:

            tipo_origen = "corriente"


        # =================================================
        # BUSCAR CUENTA ORIGEN
        # =================================================

        cuenta_origen = db.query(Cuenta).filter(

            Cuenta.id_usuario == current_user,

            Cuenta.tipo_cuenta == tipo_origen,

            Cuenta.estado == "activa"

        ).with_for_update().first()


        if not cuenta_origen:

            raise HTTPException(
                status_code=404,
                detail="La cuenta de origen no existe."
            )


        # =================================================
        # BUSCAR LLAVE DESTINO
        # =================================================

        llave_destino = data.llave_destino.strip()


        llave_breb = db.query(LlaveBreb).filter(

            LlaveBreb.llave == llave_destino,

            LlaveBreb.estado == "activa"

        ).with_for_update().first()


        if not llave_breb:

            raise HTTPException(
                status_code=404,
                detail="No se encontró la llave Bre-B."
            )


        # =================================================
        # EVITAR AUTO TRANSFERENCIA
        # =================================================

        if llave_breb.id_usuario == current_user:

            raise HTTPException(
                status_code=400,
                detail="No puede transferir dinero a su propia llave."
            )


        # =================================================
        # BUSCAR DESTINATARIO
        # =================================================

        destinatario = db.query(Usuario).filter(

            Usuario.id_usuario ==
            llave_breb.id_usuario

        ).first()


        if not destinatario:

            raise HTTPException(
                status_code=404,
                detail="Destinatario no encontrado."
            )


        # =================================================
        # BUSCAR CUENTA DESTINO
        # =================================================

        cuenta_destino = db.query(Cuenta).filter(

            Cuenta.id_cuenta ==
            llave_breb.id_cuenta,

            Cuenta.id_usuario ==
            llave_breb.id_usuario,

            Cuenta.estado == "activa"

        ).with_for_update().first()


        if not cuenta_destino:

            raise HTTPException(
                status_code=404,
                detail="La cuenta destino no está disponible."
            )


        # =================================================
        # VALIDAR SALDO
        # =================================================

        saldo_origen = Decimal(
            str(
                cuenta_origen.saldo or 0
            )
        )


        if saldo_origen < monto:

            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente."
            )


        # =================================================
        # VALIDAR TOPE DE AHORROS
        # =================================================

        if cuenta_destino.tipo_cuenta == "ahorros":

            usuario_destino = db.query(Usuario).filter(

                Usuario.id_usuario ==
                cuenta_destino.id_usuario

            ).first()


            if usuario_destino:

                tope_ahorros = Decimal(
                    str(
                        usuario_destino.tope_ahorros or 0
                    )
                )


                saldo_destino = Decimal(
                    str(
                        cuenta_destino.saldo or 0
                    )
                )


                nuevo_saldo = (
                    saldo_destino +
                    monto
                )


                if (

                    tope_ahorros > 0

                    and

                    nuevo_saldo > tope_ahorros

                ):

                    raise HTTPException(
                        status_code=400,
                        detail="La transferencia supera el tope de la Cuenta de Ahorros."
                    )


        # =================================================
        # CALCULAR NUEVOS SALDOS
        # =================================================

        saldo_destino = Decimal(
            str(
                cuenta_destino.saldo or 0
            )
        )


        nuevo_saldo_origen = (
            saldo_origen -
            monto
        )


        nuevo_saldo_destino = (
            saldo_destino +
            monto
        )


        # =================================================
        # ACTUALIZAR SALDOS
        # =================================================

        cuenta_origen.saldo = (
            nuevo_saldo_origen
        )


        cuenta_destino.saldo = (
            nuevo_saldo_destino
        )


        # =================================================
        # REFERENCIA
        # =================================================

        referencia = (
            "BREB-" +
            uuid.uuid4().hex[:12].upper()
        )


        # =================================================
        # TRANSACCIÓN ORIGEN
        # =================================================

        transaccion_salida = Transaccion(

            id_cuenta =
            cuenta_origen.id_cuenta,

            monto =
            monto,

            tipo =
            "Transferencia",

            descripcion =
            data.descripcion.strip()
            if data.descripcion.strip()
            else
            "Transferencia Bre-B enviada"

        )


        db.add(
            transaccion_salida
        )

        db.flush()


        # =================================================
        # TRANSACCIÓN DESTINO
        # =================================================

        transaccion_entrada = Transaccion(

            id_cuenta =
            cuenta_destino.id_cuenta,

            monto =
            monto,

            tipo =
            "Ingreso",

            descripcion =
            data.descripcion.strip()
            if data.descripcion.strip()
            else
            "Transferencia Bre-B recibida"

        )


        db.add(
            transaccion_entrada
        )


        # =================================================
        # REGISTRAR TRANSFERENCIA BRE-B
        # =================================================

        transferencia = TransferenciaBreb(

            id_transaccion =
            transaccion_salida.id_transaccion,

            id_cuenta_origen =
            cuenta_origen.id_cuenta,

            id_cuenta_destino =
            cuenta_destino.id_cuenta,

            id_llave_destino =
            llave_breb.id_llave,

            monto =
            monto,

            descripcion =
            data.descripcion.strip()
            if data.descripcion.strip()
            else
            "Transferencia Bre-B",

            estado =
            "procesada",

            referencia =
            referencia,

            fecha_transferencia =
            datetime.utcnow()

        )


        db.add(
            transferencia
        )


        # =================================================
        # CONTROL DE TOPES
        # =================================================

        control = db.query(
            ControlTopeBreb
        ).filter(

            ControlTopeBreb.id_usuario ==
            current_user

        ).first()


        if not control:

            control = ControlTopeBreb(

                id_usuario =
                current_user,

                total_enviado =
                monto,

                cantidad_operaciones =
                1

            )

            db.add(control)

        else:

            control.total_enviado = (

                Decimal(
                    str(
                        control.total_enviado or 0
                    )
                )

                +

                monto

            )

            control.cantidad_operaciones += 1


        # =================================================
        # GUARDAR TODO
        # =================================================

        db.commit()


        # =================================================
        # ACTUALIZAR OBJETOS
        # =================================================

        db.refresh(
            cuenta_origen
        )

        db.refresh(
            cuenta_destino
        )


        # =================================================
        # RESPUESTA
        # =================================================

        return {

            "mensaje":
            "Transferencia Bre-B realizada correctamente.",

            "referencia":
            referencia,

            "destinatario":
            destinatario.nombre,

            "llave_destino":
            llave_breb.llave,

            "cuenta_origen":
            cuenta_origen.tipo_cuenta,

            "cuenta_destino":
            cuenta_destino.tipo_cuenta,

            "monto":
            float(monto),

            "saldo_origen":
            float(
                cuenta_origen.saldo
            ),

            "saldo_destino":
            float(
                cuenta_destino.saldo
            ),

            "estado":
            "procesada"

        }


    except HTTPException:

        db.rollback()

        raise


    except Exception as error:

        db.rollback()

        print(
            "ERROR BRE-B:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Error interno al realizar la transferencia Bre-B."
        )