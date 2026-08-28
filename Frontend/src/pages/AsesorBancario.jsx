import React, { useState } from "react";
import "../styles/asesorBancario.css";

const API_URL = "http://127.0.0.1:8000";

const AsesorBancario = () => {

    const [criterioBusqueda, setCriterioBusqueda] = useState("");
    const [tipoBusqueda, setTipoBusqueda] = useState("codigo");
    const [usuario, setUsuario] = useState(null);
    const [cuentas, setCuentas] = useState([]);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [saldosEditados, setSaldosEditados] = useState({});

    const encabezadosAutorizacion = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    });

    // ============================================================
    // BUSCAR USUARIO
    // ============================================================

    const buscarUsuario = async () => {

        if (!criterioBusqueda.trim()) {
            setError(`Ingrese el ${tipoBusqueda === "codigo" ? "código de registro" : "documento"} del usuario`);
            return;
        }

        setCargando(true);
        setError("");
        setMensaje("");
        setUsuario(null);
        setCuentas([]);

        try {

            const respuesta = await fetch(
                `${API_URL}/asesor-bancario/${tipoBusqueda}/${criterioBusqueda.trim()}`,
                {
                    headers: encabezadosAutorizacion(),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail || "No se pudo encontrar el usuario"
                );
            }

            setUsuario(datos.usuario);
            setCuentas(datos.cuentas || []);

        } catch (error) {

            setError(error.message);

        } finally {

            setCargando(false);

        }
    };

    // ============================================================
    // HABILITAR CUENTA
    // ============================================================

    const habilitarCuenta = async (idCuenta) => {

        setError("");
        setMensaje("");

        try {

            const respuesta = await fetch(
                `${API_URL}/asesor-bancario/cuenta/${idCuenta}/habilitar`,
                {
                    method: "PUT",
                    headers: encabezadosAutorizacion(),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail || "No se pudo habilitar la cuenta"
                );
            }

            setMensaje(datos.mensaje);

            setCuentas((cuentasActuales) =>
                cuentasActuales.map((cuenta) =>
                    cuenta.id_cuenta === idCuenta
                        ? {
                            ...cuenta,
                            estado: "activa"
                        }
                        : cuenta
                )
            );

        } catch (error) {

            setError(error.message);

        }
    };

    // ============================================================
    // DESHABILITAR CUENTA
    // ============================================================

    const deshabilitarCuenta = async (idCuenta) => {

        setError("");
        setMensaje("");

        try {

            const respuesta = await fetch(
                `${API_URL}/asesor-bancario/cuenta/${idCuenta}/deshabilitar`,
                {
                    method: "PUT",
                    headers: encabezadosAutorizacion(),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail ||
                    "No se pudo deshabilitar la cuenta"
                );
            }

            setMensaje(datos.mensaje);

            setCuentas((cuentasActuales) =>
                cuentasActuales.map((cuenta) =>
                    cuenta.id_cuenta === idCuenta
                        ? {
                            ...cuenta,
                            estado: "inactiva"
                        }
                        : cuenta
                )
            );

        } catch (error) {

            setError(error.message);

        }
    };

    const actualizarSaldo = async (idCuenta) => {
        setError("");
        setMensaje("");

        const saldo = Number(saldosEditados[idCuenta]);

        if (!Number.isFinite(saldo) || saldo < 0) {
            setError("Ingrese un saldo válido mayor o igual a cero.");
            return;
        }

        try {
            const respuesta = await fetch(
                `${API_URL}/asesor-bancario/cuenta/${idCuenta}/saldo`,
                {
                    method: "PUT",
                    headers: {
                        ...encabezadosAutorizacion(),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ saldo }),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.detail || "No se pudo actualizar el saldo");
            }

            setMensaje(datos.mensaje);
            setCuentas((cuentasActuales) =>
                cuentasActuales.map((cuenta) =>
                    cuenta.id_cuenta === idCuenta
                        ? { ...cuenta, saldo: datos.saldo }
                        : cuenta
                )
            );
            localStorage.setItem("cuentas-actualizadas", Date.now().toString());
            window.dispatchEvent(new Event("cuentas-actualizadas"));
        } catch (error) {
            setError(error.message);
        }
    };

    // ============================================================
    // HABILITAR TODAS LAS CUENTAS
    // ============================================================

    const habilitarTodas = async () => {

        if (!usuario) return;

        setError("");
        setMensaje("");

        try {

            const respuesta = await fetch(
                `${API_URL}/asesor-bancario/usuario/${usuario.documento}/habilitar-cuentas`,
                {
                    method: "PUT",
                    headers: encabezadosAutorizacion(),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail ||
                    "No se pudieron habilitar las cuentas"
                );
            }

            setMensaje(datos.mensaje);

            setCuentas((cuentasActuales) =>
                cuentasActuales.map((cuenta) => ({
                    ...cuenta,
                    estado: "activa",
                }))
            );

            localStorage.setItem("cuentas-actualizadas", Date.now().toString());
            window.dispatchEvent(new Event("cuentas-actualizadas"));

        } catch (error) {

            setError(error.message);

        }
    };

    // ============================================================
    // DESHABILITAR TODAS LAS CUENTAS
    // ============================================================

    const deshabilitarTodas = async () => {

        if (!usuario) return;

        setError("");
        setMensaje("");

        try {

            const respuesta = await fetch(
                `${API_URL}/asesor-bancario/usuario/${usuario.documento}/deshabilitar-cuentas`,
                {
                    method: "PUT",
                    headers: encabezadosAutorizacion(),
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail ||
                    "No se pudieron deshabilitar las cuentas"
                );
            }

            setMensaje(datos.mensaje);

            setCuentas((cuentasActuales) =>
                cuentasActuales.map((cuenta) => ({
                    ...cuenta,
                    estado: "inactiva",
                }))
            );

        } catch (error) {

            setError(error.message);

        }
    };

    // ============================================================
    // FORMATO DE DINERO
    // ============================================================

    const formatoDinero = (valor) => {

        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0,
        }).format(valor || 0);

    };

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (

        <div className="asesor-container">

            {/* ==================================================
                NAVBAR
                ================================================== */}

            <nav className="asesor-navbar">

                <div className="asesor-logo">
                    Financiero
                </div>

                <ul className="asesor-menu">

                    <li>
                        Asesor Bancario
                    </li>

                    <li>
                        Administración
                    </li>

                    <li>
                        <button
                            className="asesor-btn-salir"
                            onClick={() => {
                                localStorage.removeItem("token");
                                window.location.href = "/";
                            }}
                        >
                            Cerrar sesión
                        </button>
                    </li>

                </ul>

            </nav>

            {/* ==================================================
                ENCABEZADO
                ================================================== */}

            <section className="asesor-hero">

                <div className="asesor-hero-text">

                    <h1 className="asesor-title">
                        Asesor Bancario
                    </h1>

                    <p className="asesor-description">
                        Administración de cuentas bancarias de los usuarios.
                        Busque un usuario para consultar y administrar
                        el estado de sus cuentas.
                    </p>

                </div>

            </section>

            {/* ==================================================
                PANEL
                ================================================== */}

            <main className="asesor-panel">

                {/* ==================================================
                    BUSCADOR
                    ================================================== */}

                    <div className="asesor-verificacion">

                        <div className="asesor-verificacion-cabecera">
                            <span className="asesor-verificacion-etiqueta">
                                Rectificación de código de registro
                            </span>
                            <span className="asesor-verificacion-ayuda">
                                Verifique la identidad y consulte la ficha del usuario
                            </span>
                        </div>

                        <div className="asesor-buscador">

                    <select
                        value={tipoBusqueda}
                        onChange={(e) => setTipoBusqueda(e.target.value)}
                        aria-label="Tipo de búsqueda"
                    >
                        <option value="codigo">Código de registro</option>
                        <option value="usuario">Documento</option>
                    </select>

                    <input
                        type="text"
                        inputMode={tipoBusqueda === "codigo" ? "numeric" : "text"}
                        maxLength={tipoBusqueda === "codigo" ? 6 : undefined}
                        placeholder={tipoBusqueda === "codigo"
                            ? "Ejemplo: 042381"
                            : "Ingrese el documento del usuario"}
                        value={criterioBusqueda}
                        onChange={(e) =>
                            setCriterioBusqueda(e.target.value)
                        }
                        onKeyDown={(e) => {

                            if (e.key === "Enter") {
                                buscarUsuario();
                            }

                        }}
                    />

                    <button
                        onClick={buscarUsuario}
                        disabled={cargando}
                    >
                        {cargando
                            ? "Buscando..."
                            : "Buscar usuario"}
                    </button>

                </div>

                    </div>

                {/* ==================================================
                    MENSAJE
                    ================================================== */}

                {mensaje && (

                    <div className="asesor-mensaje">
                        {mensaje}
                    </div>

                )}

                {/* ==================================================
                    ERROR
                    ================================================== */}

                {error && (

                    <div className="asesor-error">
                        {error}
                    </div>

                )}

                {/* ==================================================
                    INFORMACIÓN DEL USUARIO
                    ================================================== */}

                {usuario && (

                    <>

                        <div className="usuario-info">

                            <h2>
                                Información del usuario
                            </h2>

                            <div className="usuario-datos">

                                <div className="usuario-dato">

                                    <span>
                                        Nombre
                                    </span>

                                    <strong>
                                        {usuario.nombre}
                                    </strong>

                                </div>

                                <div className="usuario-dato usuario-dato-codigo">
                                    <span>
                                        Código de registro verificado
                                    </span>
                                    <strong>
                                        {usuario.codigo_registro || "No disponible"}
                                    </strong>
                                </div>

                                <div className="usuario-dato">
                                    <span>
                                        Dirección
                                    </span>
                                    <strong>
                                        {usuario.direccion || "No registrada"}
                                    </strong>
                                </div>

                                <div className="usuario-dato">
                                    <span>
                                        Rol
                                    </span>
                                    <strong>
                                        {usuario.rol || "usuario"}
                                    </strong>
                                </div>

                                <div className="usuario-dato">
                                    <span>
                                        Tope de ahorros
                                    </span>
                                    <strong>
                                        {formatoDinero(usuario.tope_ahorros)}
                                    </strong>
                                </div>

                                <div className="usuario-dato">
                                    <span>
                                        Tope de cuenta corriente
                                    </span>
                                    <strong>
                                        {formatoDinero(usuario.tope_corriente)}
                                    </strong>
                                </div>

                                <div className="usuario-dato">
                                    <span>
                                        Fecha de registro
                                    </span>
                                    <strong>
                                        {usuario.fecha_creacion
                                            ? new Date(usuario.fecha_creacion).toLocaleString("es-CO")
                                            : "No disponible"}
                                    </strong>
                                </div>

                                <div className="usuario-dato">

                                    <span>
                                        Documento
                                    </span>

                                    <strong>
                                        {usuario.documento}
                                    </strong>

                                </div>

                                {usuario.email && (

                                    <div className="usuario-dato">

                                        <span>
                                            Correo electrónico
                                        </span>

                                        <strong>
                                            {usuario.email}
                                        </strong>

                                    </div>

                                )}

                                {usuario.telefono && (

                                    <div className="usuario-dato">

                                        <span>
                                            Teléfono
                                        </span>

                                        <strong>
                                            {usuario.telefono}
                                        </strong>

                                    </div>

                                )}

                            </div>

                        </div>

                        {/* ==================================================
                            ACCIONES GENERALES
                            ================================================== */}

                        <div className="cuenta-acciones">

                            <button
                                className="btn-habilitar"
                                onClick={habilitarTodas}
                            >
                                Habilitar todas las cuentas
                            </button>

                            <button
                                className="btn-deshabilitar"
                                onClick={deshabilitarTodas}
                            >
                                Deshabilitar todas las cuentas
                            </button>

                        </div>

                        {/* ==================================================
                            TÍTULO CUENTAS
                            ================================================== */}

                        <h2 className="cuentas-titulo">
                            Cuentas bancarias
                        </h2>

                        {/* ==================================================
                            SIN CUENTAS
                            ================================================== */}

                        {cuentas.length === 0 ? (

                            <div className="asesor-sin-resultados">

                                El usuario no tiene cuentas registradas.

                            </div>

                        ) : (

                            /* ==================================================
                               LISTA DE CUENTAS
                               ================================================== */

                            <div className="cuentas-grid">

                                {cuentas.map((cuenta) => (

                                    <div
                                        className="cuenta-card"
                                        key={cuenta.id_cuenta}
                                    >

                                        {/* CABECERA */}

                                        <div className="cuenta-card-header">

                                            <h3>
                                                {cuenta.tipo_cuenta === "ahorros"
                                                    ? "Cuenta de Ahorros"
                                                    : "Cuenta Corriente"
                                                }
                                            </h3>

                                            <span
                                                className={`estado ${
                                                    cuenta.estado === "activa"
                                                        ? "estado-activa"
                                                        : cuenta.estado === "bloqueada"
                                                            ? "estado-bloqueada"
                                                            : "estado-inactiva"
                                                }`}
                                            >
                                                {cuenta.estado === "activa"
                                                    ? "Activa"
                                                    : cuenta.estado === "bloqueada"
                                                        ? "Bloqueada"
                                                        : "Inactiva"
                                                }
                                            </span>

                                        </div>

                                        {/* DATOS */}

                                        <div className="cuenta-datos">

                                            <div className="cuenta-dato">

                                                <span>
                                                    Número de cuenta
                                                </span>

                                                <strong>
                                                    {cuenta.id_cuenta}
                                                </strong>

                                            </div>

                                            <div className="cuenta-dato">

                                                <span>
                                                    Tipo de cuenta
                                                </span>

                                                <strong>
                                                    {cuenta.tipo_cuenta === "ahorros"
                                                        ? "Ahorros"
                                                        : "Corriente"
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                        {/* SALDO */}

                                        <div className="cuenta-saldo">

                                            <span>
                                                Saldo disponible
                                            </span>

                                            <strong>
                                                {formatoDinero(
                                                    cuenta.saldo
                                                )}
                                            </strong>

                                            <label className="saldo-edicion">
                                                Editar saldo disponible
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={saldosEditados[cuenta.id_cuenta] ?? cuenta.saldo}
                                                    onChange={(e) =>
                                                        setSaldosEditados((saldosActuales) => ({
                                                            ...saldosActuales,
                                                            [cuenta.id_cuenta]: e.target.value,
                                                        }))
                                                    }
                                                />
                                            </label>

                                            <button
                                                className="btn-guardar-saldo"
                                                onClick={() => actualizarSaldo(cuenta.id_cuenta)}
                                            >
                                                Guardar saldo
                                            </button>

                                        </div>

                                        {/* ACCIONES */}

                                        <div className="cuenta-acciones">

                                            {cuenta.estado === "activa" ? (

                                                <button
                                                    className="btn-deshabilitar"
                                                    onClick={() =>
                                                        deshabilitarCuenta(
                                                            cuenta.id_cuenta
                                                        )
                                                    }
                                                >
                                                    Deshabilitar
                                                </button>

                                            ) : (

                                                <button
                                                    className="btn-habilitar"
                                                    onClick={() =>
                                                        habilitarCuenta(
                                                            cuenta.id_cuenta
                                                        )
                                                    }
                                                >
                                                    Habilitar
                                                </button>

                                            )}

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

                    </>

                )}

                {/* ==================================================
                    SIN USUARIO
                    ================================================== */}

                {!usuario && !cargando && !error && (

                    <div className="asesor-sin-resultados">

                        Ingrese el documento de un usuario para
                        administrar sus cuentas bancarias.

                    </div>

                )}

            </main>

        </div>

    );

};

export default AsesorBancario;
