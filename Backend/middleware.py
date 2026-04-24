from fastapi import Request, HTTPException
import re

async def validar_datos(request: Request, call_next):
    if request.url.path == "/register" and request.method == "POST":
        body = await request.json()

        nombre = body.get("nombre")
        email = body.get("email")
        password = body.get("password")
        telefono = body.get("telefono")
        documento = body.get("numero_documento")

        # 🔹 Validar campos vacíos
        if not nombre or not email or not password:
            raise HTTPException(status_code=400, detail="Faltan campos obligatorios")

        # 🔹 Validar email
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise HTTPException(status_code=400, detail="Correo inválido")

        # 🔹 Validar contraseña (mínimo 6 caracteres)
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="La contraseña debe tener mínimo 6 caracteres")

        # 🔹 Validar teléfono (solo números)
        if telefono and not telefono.isdigit():
            raise HTTPException(status_code=400, detail="Teléfono inválido")

        # 🔹 Validar documento (solo números)
        if documento and not documento.isdigit():
            raise HTTPException(status_code=400, detail="Documento inválido")

    response = await call_next(request)
    return response