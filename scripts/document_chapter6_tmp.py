from pathlib import Path
from zipfile import ZipFile

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph


path = Path(r"C:\Users\sena\Downloads\Manual_Tecnico_Billetera.docx")
doc = Document(path)
navy, light = "123B52", "F2F6F8"
paragraphs = list(doc.paragraphs)
chapter6 = next(p for p in paragraphs if p.style.name == "Heading 1" and p.text.strip().startswith("6."))
chapter7 = next(p for p in paragraphs if p.style.name == "Heading 1" and p.text.strip().startswith("7."))
idx6, idx7 = paragraphs.index(chapter6), paragraphs.index(chapter7)
protected_before = [p.text for p in paragraphs[:idx6 + 1]]
protected_after = [p.text for p in paragraphs[idx7:]]
protected_tables = [[c.text for r in t.rows for c in r.cells] for t in doc.tables]
protected_images = len(doc.inline_shapes)

paragraphs[idx6 + 1].text = (
    "Este capítulo documenta la estructura y el comportamiento observables del código fuente "
    "en el espacio de trabajo local C:\\Users\\sena\\financiero, rama develop, revisión "
    "edd7c0d4, y contrasta el inventario con el árbol publicado en GitHub. Se identifican "
    "módulos activos, módulos auxiliares y rutas definidas pero no montadas en la aplicación principal."
)
paragraphs[idx6 + 3].text = (
    "El archivo DOCX adjunto es la base editable de esta actualización. La documentación describe "
    "el código disponible al momento de la revisión; no certifica el estado de despliegue ni sustituye "
    "la revisión de configuración privada. No se reproducen contraseñas, tokens ni claves API."
)


def insert_paragraph(target, text="", style="Normal"):
    element = OxmlElement("w:p")
    target._p.addprevious(element)
    paragraph = Paragraph(element, target._parent)
    paragraph.style = style
    if text:
        paragraph.add_run(text)
    paragraph.paragraph_format.space_after = Pt(5)
    return paragraph


def heading(target, text):
    p = insert_paragraph(target, text, "Heading 2")
    p.paragraph_format.keep_with_next = True
    return p


def body(target, text):
    return insert_paragraph(target, text, "Normal")


def bullet(target, text):
    p = insert_paragraph(target, text, "List Bullet")
    p.paragraph_format.space_after = Pt(2)
    return p


def code_block(target, text):
    p = insert_paragraph(target)
    p.paragraph_format.left_indent = Inches(0.16)
    p.paragraph_format.right_indent = Inches(0.12)
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(7)
    p.paragraph_format.keep_together = True
    shade = OxmlElement("w:shd")
    shade.set(qn("w:fill"), "F1F4F6")
    p._p.get_or_add_pPr().append(shade)
    run = p.add_run(text)
    run.font.name = "Consolas"
    run.font.size = Pt(8)
    run.font.color.rgb = RGBColor(18, 59, 82)


def table_before(target, headers, rows, font_size=8.2):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.autofit = True
    for col, value in enumerate(headers):
        table.rows[0].cells[col].text = value
    for values in rows:
        cells = table.add_row().cells
        for col, value in enumerate(values):
            cells[col].text = str(value)
    table._tbl.getparent().remove(table._tbl)
    target._p.addprevious(table._tbl)
    for row_index, row in enumerate(table.rows):
        trpr = row._tr.get_or_add_trPr()
        trpr.append(OxmlElement("w:cantSplit"))
        if row_index == 0:
            repeat = OxmlElement("w:tblHeader")
            repeat.set(qn("w:val"), "true")
            trpr.append(repeat)
        for cell in row.cells:
            cell.vertical_alignment = 1
            shading = OxmlElement("w:shd")
            shading.set(qn("w:fill"), navy if row_index == 0 else (light if row_index % 2 == 0 else "FFFFFF"))
            cell._tc.get_or_add_tcPr().append(shading)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                for run in p.runs:
                    run.font.name = "Aptos"
                    run.font.size = Pt(font_size)
                    if row_index == 0:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
    return table


heading(chapter7, "6.1 Introducción y alcance del análisis")
body(chapter7,
     "El proyecto implementa una interfaz web en React y una API principal en FastAPI. El backend "
     "persiste información mediante SQLAlchemy y configura MySQL como motor esperado; en ausencia "
     "de variables de conexión, database.py permite SQLite local. Los archivos versionados y "
     "presentes en el árbol se distinguen de los módulos alternos o sin conexión comprobada.")
body(chapter7,
     "La inspección cubrió archivos fuente versionados y disponibles de Backend, Frontend, scripts "
     "y configuración; se excluyeron bibliotecas instaladas, cachés, bytecode y el build generado, "
     "pues no son código fuente propio. El árbol remoto y el checkout local no coinciden: GitHub "
     "publica docs/ y app/, mientras que la rama local examinada no contiene esas dos carpetas. "
     "El documento adjunto usado como base está en Descargas y no se modifica ningún otro capítulo.")

heading(chapter7, "6.2 Estructura de carpetas del proyecto")
body(chapter7,
     "Las rutas de esta tabla son relativas a la raíz del repositorio C:\\Users\\sena\\financiero; "
     "la columna de disponibilidad diferencia el checkout develop revisado del árbol predeterminado "
     "consultado en GitHub.")
folder_rows = [
    (".", "Configuración de ejecución y archivos de proyecto.", "compose.yml orquesta los servicios; mysql_billetera.session.sql contiene DDL/datos auxiliares; PLAN_TRABAJO.md registra trabajo formativo.", "Conecta despliegue, esquema auxiliar y planeación.", "Presente local"),
    (".vscode\\", "Preferencias del espacio de trabajo del editor.", "settings.json guarda configuración de VS Code.", "Afecta edición local; no es runtime.", "Presente local"),
    ("Backend\\", "API y lógica principal de Billetera.", "FastAPI, SQLAlchemy, esquemas, seguridad, servicios y pruebas.", "Se comunica con MySQL, SMTP y proveedor IA.", "Presente local"),
    ("Backend\\ai\\", "Asistente bancario montado en la API principal.", "Router /ia/chat, validación de conversación, prompt, configuración y clientes LLM.", "main.py registra el router IA; usa security.py y settings.", "Presente local"),
    ("Backend\\alembic\\versions\\", "Historial de cambios relacionales.", "Cinco revisiones versionadas del esquema.", "Alembic migra el esquema configurado por database.py.", "Presente local"),
    ("Backend\\auth\\", "Autenticación alternativa heredada.", "auth.py define rutas Flask de autenticación y recuperación.", "No se importa desde el punto de entrada FastAPI principal.", "Presente local"),
    ("Backend\\base de datos billetera\\", "Prueba heredada de conectividad MySQL.", "bd.py intenta abrir una conexión y consultar la base.", "No se importa desde Backend.main.", "Presente local"),
    ("Backend\\database\\", "Configuración de conexión y sesiones ORM.", "database.py construye el engine, SessionLocal y Base declarativa.", "models.py y dependencias de API usan esta capa.", "Presente local"),
    ("Backend\\docs\\", "Documentación de diseño, operación y requisitos.", "Guías, trazabilidad, matriz, planes y subcarpetas requirements/ficha.", "Complementa arquitectura y mantenimiento; no se ejecuta en runtime.", "Presente local"),
    ("Backend\\docs\\requirements\\", "Requisitos funcionales, no funcionales, backlog e iteraciones.", "Archivos Markdown de restricciones, historias y sprints.", "Referencia formativa para módulos.", "Presente local"),
    ("Backend\\docs\\requirements\\ficha\\", "Entregables de ficha técnica.", "Dos documentos Markdown de requisitos/ficha.", "Material de análisis; independiente del runtime.", "Presente local"),
    ("Backend\\email_service\\", "Notificaciones por correo electrónico.", "email_service.py carga configuración de correo y envía mensajes SMTP.", "Lo invoca el backend en flujos que notifican por email.", "Presente local"),
    ("Backend\\middleware\\", "Validación HTTP auxiliar.", "middleware.py contiene validar_datos para solicitudes de registro.", "No aparece registrado por main.py en la configuración revisada.", "Presente local"),
    ("Backend\\routers\\", "Routers FastAPI por dominio.", "asesor_bancario.py y breb.py declaran operaciones por router.", "No se incluyen en la aplicación principal; main.py implementa rutas equivalentes propias.", "Presente local"),
    ("Backend\\tests\\", "Pruebas automatizadas del backend.", "Doce módulos de pruebas sobre usuarios, cuentas, autenticación e IA.", "Verifican reglas, esquemas y rutas del backend.", "Presente local"),
    ("Frontend\\public\\", "Documento HTML de entrada del navegador.", "index.html contiene el nodo raíz React.", "react-scripts sirve esta página.", "Presente local"),
    ("Frontend\\src\\", "Código fuente de la interfaz.", "Bootstrap, rutas, pantallas, servicios, utilidades y estilos.", "Consume la API por fetch/Axios.", "Presente local"),
    ("Frontend\\src\\assets\\images\\", "Recursos gráficos de interfaz.", "Logo JPEG.", "Usado por elementos visuales si lo importan las pantallas.", "Presente local"),
    ("Frontend\\src\\components\\", "Componentes visuales reutilizables.", "Botón, pie, navegación, input y modal.", "Presentación compartida entre pantallas.", "Presente local"),
    ("Frontend\\src\\context\\", "Contextos React de autenticación y tema.", "authContesxt.jsx y themeContext.jsx.", "Estado compartido; no se observó su montaje desde el entrypoint activo.", "Presente local"),
    ("Frontend\\src\\hooks\\", "Hooks reutilizables.", "useAuth.js y useFetch.js.", "Utilidades de interfaz; uso depende de importadores.", "Presente local"),
    ("Frontend\\src\\layouts\\", "Composiciones de navegación y estructura.", "MainLayout, barra lateral, navbar y footer.", "Agrupa componentes para pantallas.", "Presente local"),
    ("Frontend\\src\\pages\\", "Pantallas funcionales.", "Veintitrés componentes JSX, desde login hasta administradores y transferencias.", "Cada página orquesta formulario, estado y llamadas a API.", "Presente local"),
    ("Frontend\\src\\routes\\", "Declaraciones de rutas auxiliares.", "AppRoutes.jsx y privateRoutes.jsx.", "No aparecen importadas por el arranque principal observado.", "Presente local"),
    ("Frontend\\src\\services\\", "Clientes HTTP y utilidades de autenticación.", "api.js, authService.js y aserService.js.", "Coordinan llamadas HTTP; varias páginas usan fetch/Axios directamente.", "Presente local"),
    ("Frontend\\src\\styles\\", "Hojas CSS por módulo/pantalla.", "Veintidós hojas CSS.", "Define presentación de páginas React.", "Presente local"),
    ("Frontend\\src\\utils\\", "Constantes y validadores/helpers.", "constants.js, helpers.js y validators.js.", "Lógica transversal del cliente.", "Presente local"),
    ("scripts\\", "Utilidades de proyecto.", "complete_manual.py está vacío (0 bytes) en el checkout revisado.", "No aporta lógica en su estado actual.", "Presente local"),
    ("app\\", "Servicio independiente según el árbol GitHub.", "GitHub lista config.py, llm_client.py y main.py; no existe en el checkout develop revisado.", "No está orquestado por compose.yml local ni conectado al frontend examinado.", "Solo árbol GitHub"),
    ("docs\\", "Manual técnico y diagramas generales versionados en GitHub.", "GitHub lista DOCX, Markdown, PDF y diagramas Mermaid/PNG.", "En el checkout local la carpeta no está disponible; se editó el DOCX adjunto en Descargas.", "Solo árbol GitHub"),
    ("node_modules\\; Frontend\\node_modules\\", "Dependencias instaladas localmente.", "Paquetes de terceros; más de 400 000 archivos combinados observados.", "Resolución de dependencias del frontend; no es fuente propia.", "Generado/local"),
    ("Frontend\\build\\", "Compilación estática del frontend.", "Archivos producidos por el proceso de build.", "Artefacto generado; no reemplaza src/.", "Generado/local"),
    (".venv\\; .pytest_cache\\; **\\__pycache__\\; .git\\", "Entornos, cachés, bytecode y metadatos de Git.", "Archivos generados o internos de herramientas.", "No forman parte de los módulos de negocio documentados.", "Generado/local"),
]
table_before(chapter7, ["Carpeta", "Objetivo", "Contenido / función", "Relación con el sistema", "Estado"], folder_rows, 7.2)

heading(chapter7, "6.3 Backend: módulos y archivos principales")
body(chapter7,
     "Backend.main:app es el punto de entrada ejecutado por Uvicorn y concentra 73 rutas HTTP, "
     "validaciones de negocio y acceso ORM. No existe una separación completa entre controladores "
     "y servicios: varias operaciones de negocio residen directamente en main.py.")
backend_rows = [
    ("Backend\\main.py", "FastAPI; 73 endpoints directos. Implementa registro, autenticación, cuentas, administración, transacciones, Bre-B, tarjetas y notificaciones. Registra CORS e incluye el router IA.", "Aplicación principal; importa esquemas, modelos, seguridad, email y sesión DB."),
    ("Backend\\models.py", "Clases ORM TipoDocumento, Usuario, Administrador, AsesorBanco, Cuenta, Transaccion, Notificacion, Tarjeta, LlaveBreb, TransferenciaBreb y ControlTopeBreb.", "Define las once tablas y sus relaciones SQLAlchemy."),
    ("Backend\\schemas.py", "Modelos Pydantic de entrada/salida: registro, login, perfil, cuentas, transacciones, transferencias y respuestas administrativas.", "Valida/coacciona datos entre HTTP y funciones del backend."),
    ("Backend\\security.py", "hash_password, check_password, generate_token, token_required; passlib y JWT HS256 con expiración configurada.", "Protege endpoints; el valor de la clave de firma no se reproduce en el manual."),
    ("Backend\\database\\database.py", "Carga variables; construye engine MySQL/PyMySQL y SessionLocal, con SQLite como alternativa local cuando no hay conexión DB completa.", "Proporciona Base ORM para models.py."),
    ("Backend\\dependencias.py", "get_db crea una sesión por solicitud y siempre la cierra.", "Inyecta sesión SQLAlchemy mediante Depends."),
    ("Backend\\usuarios.py", "Router /usuarios con consulta de perfil obtener_perfil.", "Módulo APIRouter no incluido por Backend.main en el estado inspeccionado."),
    ("Backend\\email_service\\email_service.py", "Carga configuración SMTP, crea plantilla HTML y enviar_correo.", "Invocado por flujos que notifican al usuario; credenciales se obtienen del entorno."),
    ("Backend\\middleware\\middleware.py", "validar_datos verifica campos/formato en POST /register.", "Existe como middleware auxiliar; no se observó instalación en FastAPI principal."),
    ("Backend\\routers\\asesor_bancario.py", "Router con consulta por documento y habilitación/deshabilitación de cuentas.", "Definido por separado; no registrado en app principal."),
    ("Backend\\routers\\breb.py", "Router prefix /bre-b con registrar-llave, consultar y transferir.", "Definido por separado; la API principal implementa rutas Bre-B directamente en main.py."),
    ("Backend\\auth\\auth.py", "Módulo heredado de registro/login/recuperación basado en Flask/JWT y un modelo distinto.", "No importado por main.py ni usado como autenticación principal FastAPI."),
    ("Backend\\base de datos billetera\\bd.py", "Prueba de conexión con mysql.connector.", "Script aislado; no crea el engine que utiliza la API."),
    ("Backend\\ai\\router.py", "APIRouter /ia; POST /ia/chat, esquemas MensajeChat/RespuestaChat/Consulta y chat_bancario.", "Registrado desde Backend.main; requiere token_required."),
    ("Backend\\ai\\chains.py", "generar_respuesta valida mensaje/historial y delega a consultar_modelo.", "Puente entre endpoint IA y cliente del modelo."),
    ("Backend\\ai\\llm.py", "Cliente Groq consultar_modelo; valida respuestas, limita longitud y define _request_provider/chat_completion compatible con proveedores alternos.", "El flujo /ia/chat invoca generar_respuesta -> consultar_modelo (Groq); chat_completion alterno no es el que invoca ese endpoint."),
    ("Backend\\ai\\config.py y prompt.py", "Settings carga claves/modelos/timeout desde variables; PROMPT_BANCARIO define instrucciones del asistente.", "Se consumen desde llm.py y chains.py. prompt.py contenía marcadores de conflicto visibles dentro del texto al inspeccionarlo; revisar la redacción del prompt."),
    ("Backend\\ai\\tools.py", "Consultas ORM auxiliares obtener_usuario, obtener_cuenta y obtener_transacciones.", "No se observó llamada a estas funciones en la ruta principal de chat; no documentarlas como herramientas efectivamente conectadas al LLM."),
    ("Backend\\requirements.txt", "Dependencias FastAPI, Pydantic, SQLAlchemy, Alembic, PyMySQL, JWT, SMTP/HTTP y librerías LLM; declara paquetes LangChain.", "Manifiesto Python. No se hallaron imports de LangChain en los módulos ejecutables revisados."),
    ("Backend\\.env.example", "Nombres de configuración para proveedores LLM.", "Plantilla de entorno; no contiene configuración de producción documentada aquí."),
    ("Backend\\alembic.ini; alembic\\env.py; script.mako", "Configuración, carga del metadata ORM y plantilla de revisiones.", "Alembic usa Backend.models para evolucionar base de datos."),
    ("Backend\\alembic\\versions\\*.py", "Cinco revisiones existentes: esquema inicial, normalización, índice de listado y revisiones de adopción/eliminación de relación asesor.", "Cambios versionados; no prueban por sí solos qué versión tiene una instancia MySQL activa."),
    ("Backend\\Dockerfile; Backend\\.dockerignore", "Imagen Python 3.12; instala dependencias, copia proyecto y ejecuta Uvicorn en puerto 8000.", "Usados por el servicio backend en compose.yml."),
]
table_before(chapter7, ["Archivo / ruta relativa completa", "Responsabilidad y funciones", "Relación / estado"], backend_rows, 7.4)

heading(chapter7, "6.4 API REST: rutas y responsabilidades")
body(chapter7,
     "Las rutas siguientes se extrajeron de los decoradores en Backend/main.py. FastAPI no declara "
     "un prefijo global /api en este archivo; las rutas directas se publican desde la raíz y el router "
     "IA se monta bajo /ia. La URL final desde la interfaz depende de Frontend/src/index.js y del entorno.")
endpoint_rows = [
    ("Inicio y notificaciones", "GET /inicio; GET /notificaciones; PUT /notificaciones/leer-todas; PUT /notificaciones/{id_notificacion}/leer; DELETE /notificaciones/{id_notificacion}; DELETE /notificaciones", "Panel inicial; listar, marcar lectura y eliminar notificaciones."),
    ("Registro, autenticación y recuperación", "POST /register; POST /register-asesor; POST /login; POST /asesor-login; POST /administrador-login; POST /recuperar-password; POST /verificar-codigo-recuperacion; POST /verificar-tarjeta-recuperacion; POST /restablecer-password", "Registro y acceso de usuario/asesor/administrador; recuperación y comprobación."),
    ("Perfil, identidad y diagnóstico", "GET /perfil; GET /usuario; PUT /usuario/perfil; GET /validar-token; GET /probar-token; GET /test-db; GET /ubicaciones", "Perfil y token; verificación de conexión y catálogo de ubicaciones."),
    ("Usuarios y administración", "GET /usuarios; GET /administradores/cuentas; GET /administradores/estadisticas; POST/GET /administradores/asesores; PUT/DELETE /administradores/asesores/{id_asesor}; POST /administradores/asesores/{id_asesor}/restablecer-codigo; POST/GET /usuarios/{id_usuario}/cuentas; PUT /usuarios/{id_usuario}/perfil", "Listado y gestión administrativa con permisos evaluados en cada endpoint."),
    ("Cuentas y operación de asesoría", "GET /cuentas/existe/{id_cuenta}; GET /cuentas/mis-cuentas; GET /cuentas/saldos; GET /cuentas/destino; GET /asesor-bancario/usuarios; GET /asesor-bancario/usuario/{documento}; GET /asesor-bancario/codigo/{codigo_registro}; PUT /cuentas/{id_cuenta}/tipo-operacion; PUT /asesor-bancario/cuenta/{id_cuenta}/tipo-operacion; PUT /asesor-bancario/cuenta/{id_cuenta}/tipo-cuenta; PUT /asesor-bancario/cuenta/{id_cuenta}/saldo; PUT /asesor-bancario/cuenta/{id_cuenta}/ultimos-digitos; PUT /asesor-bancario/cuenta/{id_cuenta}/habilitar; PUT /asesor-bancario/cuenta/{id_cuenta}/deshabilitar; PUT /asesor-bancario/usuario/{documento}/habilitar-cuentas; PUT /asesor-bancario/usuario/{documento}/deshabilitar-cuentas", "Consulta de cuentas, saldos, validación de destino y administración delegada."),
    ("Administración de cuentas", "POST /usuarios/{id_usuario}/cuentas; PUT /administradores/cuenta/{id_cuenta}/saldo; PUT /administradores/cuenta/{id_cuenta}/tipo-operacion; PUT /administradores/cuenta/{id_cuenta}/ultimos-digitos; POST /administradores/cuenta/{id_cuenta}/autorizar-tipo-operacion; POST /administradores/cuenta/{id_cuenta}/autorizar-ultimos-digitos; POST /administradores/cuenta/{id_cuenta}/autorizar-saldo", "Creación/ajuste administrativo y autorizaciones de operaciones."),
    ("Transacciones y transferencias", "GET /transacciones; POST /transferencias/entre-cuentas; POST /transferencias; POST /reportes/transaccion-fallida; PUT /bre-b/llave; GET /bre-b/consultar/{llave}; POST /transferencias/bre-b", "Consulta de historial, movimientos, reportes y operaciones Bre-B."),
    ("Tarjetas", "GET /usuarios/{id_usuario}/tarjetas; GET /cuentas/{id_cuenta}/tarjetas; POST /usuarios/{id_usuario}/tarjetas; DELETE /tarjetas/{id_tarjeta}; PATCH /tarjetas/{id_tarjeta}; PATCH /tarjetas/{id_tarjeta}/activar; PATCH /tarjetas/{id_tarjeta}/desactivar; GET /administradores/tarjetas; GET /tarjeta; PUT /tarjeta/bloquear; PUT /tarjeta/desbloquear", "Consulta y administración de tarjetas asociadas a cuentas."),
    ("Asistente bancario", "POST /ia/chat (router Backend.ai.router incluido por Backend.main)", "Recibe mensaje/historial; exige JWT; valida contenido y delega al modelo."),
]
table_before(chapter7, ["Grupo de rutas", "Métodos y paths implementados", "Responsabilidad"], endpoint_rows, 7.1)
body(chapter7,
     "Nota de montaje: Backend.main importa y registra ia_router. Los APIRouter de Backend.routers.asesor_bancario, "
     "Backend.routers.breb y Backend.usuarios existen, pero no aparecen registrados en main.py; sus declaraciones "
     "no deben confundirse con rutas servidas por la app principal. Backend/routers/ puede duplicar operaciones.")

heading(chapter7, "6.5 Persistencia y modelo de datos en el código")
model_rows = [
    ("TipoDocumento", "tipo_documento", "Catálogo que clasifica la identificación de Usuario."),
    ("Usuario", "usuario", "Identidad, credenciales, rol, estado, ubicación y topes."),
    ("Administrador", "administradores", "Datos del perfil administrativo asociado a usuario."),
    ("AsesorBanco", "asesores_banco", "Información de identificación y estado de asesor."),
    ("Cuenta", "cuentas", "Titular, tipo, saldo, estado y operación."),
    ("Transaccion", "transacciones", "Movimientos asociados a una cuenta."),
    ("Notificacion", "notificaciones", "Avisos asociados a usuario."),
    ("Tarjeta", "tarjetas", "Tarjetas relacionadas con una cuenta."),
    ("LlaveBreb", "llaves_breb", "Llaves asociadas a usuario/cuenta."),
    ("TransferenciaBreb", "transferencias_breb", "Detalle Bre-B relacionado con movimiento/cuentas."),
    ("ControlTopeBreb", "control_topes_breb", "Campos de seguimiento de topes definidos por el modelo."),
]
table_before(chapter7, ["Clase ORM", "Tabla", "Función en la persistencia"], model_rows, 8)
body(chapter7,
     "Los tipos, columnas, nulabilidad, claves e índices se declaran en Backend/models.py y las revisiones Alembic. "
     "mysql_billetera.session.sql es un script auxiliar con definiciones parciales y datos de sesión; no sustituye "
     "models.py ni migrations. La base configurada en compose.yml es MySQL; el contenido de una instancia real "
     "no se inspeccionó para este capítulo.")
body(chapter7, "La dependencia de sesión observada en Backend/dependencias.py:")
code_block(chapter7, "def get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()")

heading(chapter7, "6.6 Frontend React: arranque, páginas y rutas")
body(chapter7,
     "Frontend/package.json ejecuta react-scripts start/build/test. Con ese mecanismo, Frontend/public/index.html "
     "carga Frontend/src/index.js; este importa App.js, monta BrowserRouter y configura normalización de URLs "
     "para fetch/Axios. main.jsx importa App y ofrece otro bootstrap, pero no es el script start indicado.")
body(chapter7,
     "App.js es el árbol activo de rutas del script npm: contiene 31 patrones incluyendo alias. App.jsx mantiene "
     "una definición alternativa más corta (13 patrones) que no importa index.js. routes/AppRoutes.jsx y "
     "privateRoutes.jsx están presentes, pero la búsqueda de importadores no los encontró conectados al arranque. "
     "Una página existente no implica por sí sola que esté montada o protegida en runtime.")
page_rows = [
    ("pages/inicio.jsx", "/", "/inicio", "Inicio y panel."),
    ("pages/login.jsx", "/login", "", "Formulario de acceso."),
    ("pages/registro.jsx", "/registro", "", "Alta de usuario; consulta ubicaciones."),
    ("pages/cuenta.jsx", "/cuenta", "", "Información de cuenta y saldos."),
    ("pages/transferencias.jsx", "/transferencias", "", "Flujo de transferencia."),
    ("pages/corriente.jsx", "/corriente", "", "Pantalla de cuenta corriente."),
    ("pages/certificado.jsx", "/certificado", "", "Certificado."),
    ("pages/recuperacion.jsx", "/recuperacion", "", "Recuperación y comprobación de identidad."),
    ("pages/ajustes.jsx", "/ajustes", "", "Perfil y preferencias."),
    ("pages/historial.jsx", "/historial", "", "Consulta de transacciones."),
    ("pages/reporte.jsx", "/reporte", "", "Reporte de operación."),
    ("pages/VerificacionIdentidad.jsx", "/verificacion-identidad", "", "Verificación de identidad."),
    ("pages/AsesorBancario.jsx", "/asesor-bancario", "/AsesorBancario, /asesorbancario", "Herramientas de asesoría."),
    ("pages/ChatIA.jsx", "/ChatIA", "", "Interfaz de asistente IA."),
    ("pages/Administradores.jsx", "/administradores", "/administrador, /Administradores", "Vista administrativa."),
    ("pages/ListaCuentas.jsx", "/lista-cuentas", "", "Consulta de cuentas."),
    ("pages/Listausuarios.jsx", "/lista-usuarios", "", "Consulta de usuarios."),
    ("pages/transferenciascr.jsx", "/transferencias-scr", "/transferenciascr", "Flujo alternativo de transferencia."),
    ("pages/notificaiones.jsx", "/notificaciones", "/notoficaciones", "Notificaciones; se conserva el nombre histórico."),
    ("pages/mensaje-Admin.jsx", "/mensajes", "/mensaje-Admin", "Mensajes administrativos."),
    ("pages/desbloquearTarjeta.jsx", "/desbloquear-cuenta", "", "Pantalla de bloqueo/desbloqueo de tarjeta."),
    ("pages/trageta.jsx", "/trageta", "", "Gestión de tarjetas; se conserva el nombre histórico."),
    ("pages/Listaasesores.jsx", "/lista-asesores", "", "Listado de asesores."),
]
table_before(chapter7, ["Archivo de página", "Ruta activa en App.js", "Alias activos", "Responsabilidad indicada por la pantalla"], page_rows, 7.4)

heading(chapter7, "6.7 Componentes, servicios, hooks y estilos del frontend")
frontend_rows = [
    ("components/Button.jsx", "Botón que recibe text y onClick."),
    ("components/Footer.jsx; layouts/footer.jsx", "Componentes de pie de página; ambos archivos existen."),
    ("components/Navbar.jsx; layouts/navbar.jsx; layouts/sidebar.jsx; layouts/MainLayout.jsx", "Navegación y layout reutilizable; no se asume que todos se monten."),
    ("components/input.jsx; components/modal.jsx", "Entrada y modal visual reutilizables."),
    ("context/authContesxt.jsx; context/themeContext.jsx", "Contextos de autenticación y tema; no observados en el montaje activo."),
    ("hooks/useAuth.js; hooks/useFetch.js", "Hooks reutilizables; useFetch importa apiClient desde authService."),
    ("services/api.js", "Cliente Axios con baseURL local terminada en /api."),
    ("services/authService.js", "Cliente con interceptores JWT/401; base y paths /auth/* de ejemplo no coinciden con rutas directas de FastAPI."),
    ("services/aserService.js", "Servicio separado de acceso/verificación de asesor."),
    ("utils/constants.js", "URL, almacenamiento, roles y límites; contiene import.meta.env junto a un proyecto con react-scripts."),
    ("utils/helpers.js; utils/validators.js", "Funciones auxiliares y reglas de validación reutilizables."),
    ("index.css", "Estilos globales; importado por main.jsx, no directamente por index.js."),
]
table_before(chapter7, ["Archivos", "Responsabilidad y conexión observada"], frontend_rows, 7.5)
style_rows = [
    ("Administradores.css", "Administradores.jsx"), ("ajustes.css", "ajustes.jsx"),
    ("asesorBancario.css", "AsesorBancario.jsx"), ("chatIA.css", "ChatIA.jsx"),
    ("corriente.css", "corriente.jsx"), ("cuenta.css", "cuenta.jsx"),
    ("desbloquearTarjeta.css", "desbloquearTarjeta.jsx"), ("historial.css", "historial.jsx"),
    ("inicio.css", "inicio.jsx"), ("listaasesores.css", "Listaasesores.jsx"),
    ("ListaCuentas.css", "ListaCuentas.jsx"), ("listausuarios.css", "Listausuarios.jsx"),
    ("login.css", "login.jsx"), ("mensajeAdmin.css", "mensaje-Admin.jsx"),
    ("notificaiones.css", "notificaiones.jsx"), ("recuperacion.css", "recuperacion.jsx"),
    ("registro.css", "registro.jsx"), ("reporta.css", "reporte.jsx"),
    ("trageta.css", "trageta.jsx"), ("transferencias.css", "transferencias.jsx"),
    ("VerificacionIdentidad.css", "VerificacionIdentidad.jsx"),
]
table_before(chapter7, ["Hoja CSS en Frontend/src/styles/", "Pantalla relacionada por nombre"], style_rows, 8)
body(chapter7,
     "La interfaz combina Axios y fetch. index.js configura axios.defaults.baseURL y normaliza hosts locales "
     "para ambas APIs; no agrega un prefijo universal. Algunas páginas forman URLs dentro del componente. "
     "Confirmar URL de despliegue y autenticación de cada ruta antes de cambiar el cliente común.")

heading(chapter7, "6.8 Autenticación, validación y manejo de errores")
for text in [
    "Backend/security.py genera hashes con passlib (argon2/bcrypt) y tokens JWT HS256 con expiración configurada; token_required extrae el sujeto y rechaza tokens inválidos/expirados.",
    "FastAPI valida datos mediante Pydantic (Backend/schemas.py) y controles por operación en Backend/main.py. middleware.py existe, pero no se observó agregado a la app.",
    "login.jsx usa fetch; authService.js define otro cliente e interceptores 401, pero no se encontró importación desde el entrypoint activo.",
    "Tarjetas, historial, transferencias y recuperación ejecutan llamadas directas; la autorización real debe comprobarse en el endpoint servidor, no en la navegación React.",
    "La clave de firma JWT está declarada como constante de código. Este documento no reproduce su valor; su revisión corresponde a un proceso de seguridad independiente.",
]:
    bullet(chapter7, text)

heading(chapter7, "6.9 Módulo de inteligencia artificial e integraciones")
body(chapter7,
     "Backend/ai implementa POST /ia/chat con JWT, validación de mensaje (1–4000 caracteres) e historial. "
     "chains.py delega en consultar_modelo; llm.py implementa cliente Groq, extracción de respuesta y límite "
     "de longitud. También declara chat_completion para proveedores alternativos, pero el endpoint no lo invoca "
     "directamente. Settings carga claves/modelos/timeout del entorno sin reproducir secretos.")
body(chapter7,
     "requirements.txt declara LangChain, langchain-openai y langchain-community; no se encontraron imports "
     "de LangChain en los módulos ejecutables revisados. tools.py contiene consultas ORM auxiliares, pero no "
     "se observó su registro como herramientas invocables por el endpoint.")
body(chapter7,
     "GitHub publica además app/config.py, app/llm_client.py y app/main.py para un servicio Chatbot ADSO "
     "independiente (GET /health y POST /chat). app/ no existe en el checkout develop revisado ni está "
     "orquestado por compose.yml local; no confundirlo con /ia/chat.")

heading(chapter7, "6.10 Configuración, base de datos y despliegue")
config_rows = [
    ("compose.yml", "Servicios db, backend y frontend, puertos y volúmenes Docker Compose."),
    ("Backend/Dockerfile", "Imagen Python 3.12; instala requirements y ejecuta Uvicorn en el puerto 8000."),
    ("Frontend/Dockerfile", "Imagen Node 22; instala package*.json, copia la app y ejecuta npm start en el puerto 3000."),
    ("Frontend/package.json; package-lock.json", "Dependencias y comandos React: start, build, test y eject; react-scripts 5."),
    ("Frontend/uv.lock; Frontend/__init__.py", "Archivos Python presentes en Frontend; no determinan el comando React del package.json."),
    ("Backend/requirements.txt; Backend/.env.example; Frontend/.env.example", "Dependencias y nombres de variables para DB, API, correo, asesor y LLM; no copiar valores privados al manual."),
    ("Backend/alembic.ini y Backend/alembic/", "Configuración y revisiones; requieren conexión DB y ejecución Alembic."),
    ("mysql_billetera.session.sql", "SQL auxiliar con DDL/datos parciales; no reemplaza migraciones ni confirma estado real de MySQL."),
    (".dockerignore; Backend/.dockerignore; Frontend/.dockerignore", "Excluyen entornos, dependencias, build, secretos y cachés de los contextos Docker."),
    (".gitignore", "Reglas para archivos omitidos de control de versiones."),
]
table_before(chapter7, ["Archivo de configuración", "Función y relación"], config_rows, 7.6)
body(chapter7,
     "Flujo configurado: navegador (3000) -> React -> HTTP/JSON -> Uvicorn/FastAPI (8000) -> "
     "esquemas/dependencias/seguridad -> SQLAlchemy -> MySQL. El backend también puede enviar correo "
     "por SMTP y consultar el proveedor LLM. compose.yml es el ambiente disponible; no equivale a "
     "una configuración de producción.")
code_block(chapter7,
           "Usuario\n"
           "  -> Frontend/src/pages/* (React)\n"
           "  -> fetch/Axios + Frontend/src/index.js (URL API)\n"
           "  -> Backend/main.py (FastAPI)\n"
           "  -> Backend/schemas.py + security.py + dependencias.py\n"
           "  -> Backend/models.py / SQLAlchemy\n"
           "  -> Backend/database/database.py -> MySQL\n"
           "  -> SMTP / proveedor LLM cuando aplica")

heading(chapter7, "6.11 Procesamiento de solicitudes y errores")
body(chapter7,
     "FastAPI procesa método/path y cuerpo; Pydantic valida modelos cuando se declaran; Depends obtiene "
     "token o sesión DB; la operación consulta o actualiza ORM; y el handler construye la respuesta. "
     "Las rutas generan errores HTTP y FastAPI serializa fallos de validación. El cliente gestiona fallos "
     "con fetch/Axios de forma específica por pantalla; no se observó un interceptor común conectado a todas.")

heading(chapter7, "6.12 Pruebas y documentación técnica relacionada")
test_rows = [
    ("test_administradores_asesores.py", "CRUD/operaciones de asesores."),
    ("test_administradores_cuentas.py", "Operaciones administrativas de cuentas."),
    ("test_administradores_estadisticas.py", "Estadísticas administrativas."),
    ("test_administradores_usuarios.py", "Consulta/operaciones de usuarios por rol."),
    ("test_chatbot_bancario.py", "Validación del asistente bancario."),
    ("test_cuenta_numero.py", "Reglas de número de cuenta."),
    ("test_llm.py", "Cliente de modelo y errores."),
    ("test_login_envia_correo_de_notificacion.py", "Login y correo."),
    ("test_pydantic_schemas.py", "Validación de esquemas."),
    ("test_registro_cuentas_pendientes.py", "Registro y cuenta pendiente."),
    ("test_registro_envia_correo_de_notificacion.py", "Registro y correo."),
    ("test_tipo_operacion_cuenta.py", "Tipos de operación de cuenta."),
]
table_before(chapter7, ["Archivo en Backend/tests/", "Cobertura indicada por el módulo"], test_rows, 7.8)
body(chapter7,
     "Backend/docs contiene guías de chat bancario, conexión, migraciones y entregables semanales; "
     "Backend/docs/requirements y ficha agrupan requisitos, historias y sprints. GitHub publica además "
     "docs/diagramas con seis fuentes Mermaid y seis PNG: casos de uso, clases, actividad de registro, "
     "secuencia de transferencia, componentes y modelo relacional. El checkout local no conserva docs/; "
     "por ello se actualizó el DOCX adjunto en Descargas y no la copia remota.")

heading(chapter7, "6.13 Conclusiones y asuntos por validar")
for text in [
    "La lógica bancaria central se concentra en Backend/main.py, apoyada en esquemas Pydantic, seguridad JWT, dependencias SQLAlchemy y once modelos ORM.",
    "El frontend contiene veintitrés pantallas y una ruta activa principal en App.js; existen clientes, rutas, contextos y una segunda App.jsx que no deben suponerse activos sin verificar imports.",
    "FastAPI define setenta y tres rutas directas y monta el router IA. Otros routers declarados en Backend/routers y Backend/usuarios.py no están registrados en main.py.",
    "MySQL es la base esperada en Compose, pero los modelos/migraciones son evidencia del esquema del código; no se verificó la base desplegada. El script SQL auxiliar es parcial.",
    "GitHub y el checkout local difieren en docs/ y app/. La versión editable suministrada por el usuario se actualizó en Descargas; no se recreó ni sobrescribió la carpeta docs del proyecto.",
    "LangChain figura como dependencia, pero no se encontró su importación en módulos ejecutables revisados. El asistente principal usa el flujo implementado en Backend/ai.",
]:
    bullet(chapter7, text)
insert_paragraph(chapter7,
                 "Fin del capítulo 6. La descripción refleja rutas y archivos encontrados; para despliegue, "
                 "validar integración efectiva de módulos, configuración de entorno y versión del esquema "
                 "contra la instancia autorizada.")

doc.save(path)

# Confirm that only chapter 6 changed and all original media/tables remain intact.
check = Document(path)
new_paragraphs = list(check.paragraphs)
new_ch6 = next(i for i, p in enumerate(new_paragraphs)
               if p.style.name == "Heading 1" and p.text == chapter6.text)
new_ch7 = next(i for i, p in enumerate(new_paragraphs)
               if p.style.name == "Heading 1" and p.text == chapter7.text)
assert [p.text for p in new_paragraphs[:new_ch6 + 1]] == protected_before
assert [p.text for p in new_paragraphs[new_ch7:]] == protected_after
assert len(check.tables) == len(protected_tables) + 9
for i, old in enumerate(protected_tables):
    assert [c.text for r in check.tables[i].rows for c in r.cells] == old
assert len(check.inline_shapes) == protected_images
required = [f"6.{n} " for n in range(1, 14)]
headings = [p.text for p in new_paragraphs if p.style.name == "Heading 2"]
assert all(any(h.startswith(prefix) for h in headings) for prefix in required)
with ZipFile(path) as archive:
    assert archive.testzip() is None
print("Updated:", path)
print("Bytes:", path.stat().st_size)
print("Paragraphs:", len(check.paragraphs), "Tables:", len(check.tables),
      "Images preserved:", len(check.inline_shapes))
print("Preserved chapters 1-5, chapter 7 onward, all original tables and images.")
print("Added chapter 6 subsections:", len(required))
