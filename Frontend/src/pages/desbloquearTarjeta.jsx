import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/desbloquearTarjeta.css";

function DesbloquearTarjeta() {

    const [tarjeta, setTarjeta] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [desbloqueando, setDesbloqueando] = useState(false);
    const [bloqueando, setBloqueando] = useState(false);
    const [solicitandoPassword, setSolicitandoPassword] = useState(false);
    const [passwordBloqueo, setPasswordBloqueo] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [vistaTarjeta, setVistaTarjeta] = useState("frontal");
    const [datosSeguridad, setDatosSeguridad] = useState({});

    const [openTransfer, setOpenTransfer] = useState(false);
    const [openCertificado, setOpenCertificado] = useState(false);
    const [menuAbierto, setMenuAbierto] = useState(() => window.innerWidth > 768);

    useEffect(() => {
        const actualizarEstadoMenu = () => {
            setMenuAbierto(window.innerWidth > 768);
        };

        actualizarEstadoMenu();
        window.addEventListener("resize", actualizarEstadoMenu);

        return () => window.removeEventListener("resize", actualizarEstadoMenu);
    }, []);

    useEffect(() => {
        cargarTarjeta();
    }, []);

    const cargarTarjeta = async () => {
        try {
            const token = localStorage.getItem("token");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/tarjeta",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudo consultar la tarjeta");
            }

            const datos = await respuesta.json();

            setTarjeta(datos);
            setDatosSeguridad({
                ultimosTres: datos.ultimos_tres,
                vencimiento: datos.fecha_expiracion,
                codigoSeguridad: datos.codigo_seguridad
            });

        } catch (error) {
            console.error(error);
            setError(
                "No fue posible consultar el estado de la tarjeta."
            );
        } finally {
            setCargando(false);
        }
    };

    const desbloquearTarjeta = async () => {

        const confirmar = window.confirm(
            "¿Estás seguro de que deseas desbloquear tu tarjeta?"
        );

        if (!confirmar) {
            return;
        }

        try {

            setDesbloqueando(true);
            setMensaje("");
            setError("");

            const token = localStorage.getItem("token");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/tarjeta/desbloquear",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail ||
                    "No fue posible desbloquear la tarjeta"
                );
            }

            setMensaje(
                datos.mensaje ||
                "Tu tarjeta fue desbloqueada correctamente."
            );

            setTarjeta((tarjetaAnterior) => ({
                ...tarjetaAnterior,
                estado: "activa"
            }));

        } catch (error) {

            console.error(error);
            setError(error.message);

        } finally {

            setDesbloqueando(false);

        }
    };

    const bloquearTarjeta = async () => {
        setError("");
        setMensaje("");
        setPasswordBloqueo("");
        setSolicitandoPassword(true);
    };

    const confirmarBloqueo = async (evento) => {
        evento.preventDefault();

        if (!passwordBloqueo) {
            setError("Ingresa tu contraseña para bloquear la tarjeta.");
            return;
        }

        try {
            setBloqueando(true);
            setMensaje("");
            setError("");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/tarjeta/bloquear",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    body: JSON.stringify({ password: passwordBloqueo })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.detail || "No fue posible bloquear la tarjeta"
                );
            }

            setMensaje(datos.mensaje || "Tu tarjeta fue bloqueada correctamente.");
            setTarjeta((tarjetaAnterior) => ({
                ...tarjetaAnterior,
                estado: "bloqueada"
            }));
            setPasswordBloqueo("");
            setSolicitandoPassword(false);
        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setBloqueando(false);
        }
    };

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("usuario_id");
        localStorage.removeItem("documento");
        localStorage.removeItem("fotoPerfil");

        window.location.href = "/login";
    };

    if (cargando) {
        return (
            <div className="tarjeta-container">
                <div className="tarjeta-mensaje">
                    Cargando información de la tarjeta...
                </div>
            </div>
        );
    }

    return (
        <div className="panel-financiero">

            <button
                type="button"
                className={`menu-hamburguesa ${menuAbierto ? "activo" : ""}`}
                onClick={() => setMenuAbierto((actual) => !actual)}
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={menuAbierto}
            >
                ☰
            </button>

            <aside className={`sidebar ${menuAbierto ? "sidebar-abierto" : "sidebar-cerrado"}`}>

                <ul>

                    <li>
                        <Link
                            to="/cuenta"
                            className="active"
                        >
                            💷 Cuenta
                        </Link>
                    </li>

                    <li>
                        <Link to="/historial">
                            📜 Historial Monetario
                        </Link>
                    </li>

                    <li>
                        <Link to="/reporte">
                            📜 Reportes
                        </Link>
                    </li>

                    <li>

                        <div
                            className="menu-item"
                            onClick={() =>
                                setOpenTransfer(!openTransfer)
                            }
                        >
                            💳 Otros

                            {openTransfer ? "▲" : "▼"}
                        </div>

                        {openTransfer && (
                            <ul className="submenu">

                                <li>
                                    <Link to="/transferencias">
                                        ➡ Enviar dinero
                                    </Link>
                                </li>

                                <li>
                                    <Link to="/corriente">
                                        🧾 Transferir
                                    </Link>
                                </li>

                                <li>
                                    <Link to="/transferencias-scr">
                                        📤 Registrar Llave Bre-B
                                    </Link>
                                </li>

                            </ul>
                        )}

                    </li>

                    <li>

                        <Link
                            className="sidebar-link"
                            to="/certificado"
                        >
                            📄 Certificado Bancario
                        </Link>

                    </li>

                    <li>

                        <Link
                            to="/ajustes"
                            className="btn-nav"
                        >
                            ⚙️ Ajustes
                        </Link>

                    </li>

                    <li>

                        <Link
                            to="/desbloquear-cuenta"
                            className="btn-nav"
                        >
                            🚫 Bloqueo de tarjeta
                        </Link>

                    </li>

                    <li>

                        <Link
                            to="/ChatIA"
                            className="btn-nav"
                        >
                            🤖 Asistente IA
                        </Link>

                    </li>

                </ul>

                <button
                    className="logout"
                    onClick={handleLogout}
                >
                    🚪 Cerrar sesión
                </button>

            </aside>

            <main className="tarjeta-container">

                <div className="tarjeta-box">

                    <h1>
                        Mi tarjeta bancaria
                    </h1>

                    <p className="tarjeta-descripcion">
                        Consulta los datos de tu cuenta corriente y controla
                        la seguridad de tu tarjeta.
                    </p>

                    {error && (
                        <div className="tarjeta-error">
                            {error}
                        </div>
                    )}

                    {mensaje && (
                        <div className="tarjeta-exito">
                            {mensaje}
                        </div>
                    )}

                    {tarjeta && (
                        <>

                            {vistaTarjeta === "frontal" ? (
                                <div
                                    className="tarjeta-visual tarjeta-clickable"
                                    onClick={() => setVistaTarjeta("trasera")}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(evento) => {
                                        if (evento.key === "Enter" || evento.key === " ") {
                                            evento.preventDefault();
                                            setVistaTarjeta("trasera");
                                        }
                                    }}
                                >

                                    <div className="tarjeta-marca">BILLETERA</div>

                                    <div className="tarjeta-chip">▦</div>

                                    <div className="tarjeta-numero">
                                        **** **** ****{" "}
                                        {datosSeguridad.ultimosTres ||
                                            tarjeta.ultimos_digitos ||
                                            tarjeta.ultimo_digito ||
                                            "000"}
                                    </div>

                                    <div className="tarjeta-tipo">
                                        BILLETERA DIGITAL
                                    </div>

                                </div>
                            ) : (
                                <div
                                    className="tarjeta-visual tarjeta-trasera tarjeta-clickable"
                                    onClick={() => setVistaTarjeta("frontal")}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(evento) => {
                                        if (evento.key === "Enter" || evento.key === " ") {
                                            evento.preventDefault();
                                            setVistaTarjeta("frontal");
                                        }
                                    }}
                                >
                                    <div className="tarjeta-trasera-header">
                                        FIRMA AUTORIZADA
                                    </div>

                                    <div className="tarjeta-trasera-licencia">
                                        <div className="tarjeta-trasera-firma-box" />
                                        <div className="tarjeta-trasera-codigo-box">
                                            {datosSeguridad.codigoSeguridad || "---"}
                                        </div>
                                    </div>

                                    <div className="tarjeta-trasera-mensaje">
                                        Las operaciones de uso de esta tarjeta y la responsabilidad en su manejo son responsabilidad del cliente.
                                    </div>

                                    <div className="tarjeta-trasera-footer">
                                        <div className="tarjeta-trasera-campo">
                                            <strong>{datosSeguridad.ultimosTres || "---"}</strong>
                                        </div>
                                        <div className="tarjeta-trasera-campo">
                                            <strong>{datosSeguridad.vencimiento || "--/--"}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="tarjeta-estado">

                                <span>
                                    Estado actual:
                                </span>

                                <strong
                                    className={
                                        String(tarjeta.estado)
                                            .toLowerCase() === "activa"
                                            ? "activa"
                                            : "bloqueada"
                                    }
                                >
                                    {tarjeta.estado || "Bloqueada"}
                                </strong>

                            </div>

                            <div className="tarjeta-acciones">
                                {String(tarjeta.estado).toLowerCase() ===
                                "bloqueada" ? (

                                <button
                                    className="btn-desbloquear"
                                    onClick={desbloquearTarjeta}
                                    disabled={desbloqueando}
                                >
                                    {desbloqueando
                                        ? "Desbloqueando..."
                                        : "🔓 Desbloquear tarjeta"}
                                </button>

                                ) : solicitandoPassword ? (
                                    <form
                                        className="formulario-bloqueo"
                                        onSubmit={confirmarBloqueo}
                                    >
                                        <label htmlFor="password-bloqueo">
                                            Confirma tu contraseña para bloquear
                                        </label>
                                        <input
                                            id="password-bloqueo"
                                            type="password"
                                            value={passwordBloqueo}
                                            onChange={(evento) =>
                                                setPasswordBloqueo(evento.target.value)
                                            }
                                            placeholder="Contraseña de usuario"
                                            autoComplete="current-password"
                                            autoFocus
                                            disabled={bloqueando}
                                        />
                                        <button
                                            type="submit"
                                            className="btn-bloquear"
                                            disabled={bloqueando}
                                        >
                                            {bloqueando
                                                ? "Bloqueando..."
                                                : "🔒 Confirmar bloqueo"}
                                        </button>
                                    </form>
                                ) : (
                                    <button
                                        className="btn-bloquear"
                                        onClick={bloquearTarjeta}
                                        disabled={bloqueando}
                                    >
                                        {bloqueando
                                            ? "Bloqueando..."
                                            : "🔒 Bloquear tarjeta por completo"}
                                    </button>
                                )}
                            </div>


                        </>
                    )}

                </div>

            </main>

            {openCertificado && (

                <div className="certificado-modal">

                    <div className="certificado-contenido">

                        <h2>
                            Certificado Bancario
                        </h2>

                        <p>
                            Puedes consultar tu certificado bancario
                            desde la sección correspondiente.
                        </p>

                        <Link
                            to="/certificado"
                            className="btn-nav"
                            onClick={() =>
                                setOpenCertificado(false)
                            }
                        >
                            📄 Ir al certificado
                        </Link>

                        <button
                            type="button"
                            onClick={() =>
                                setOpenCertificado(false)
                            }
                        >
                            Cerrar
                        </button>

                    </div>

                </div>

            )}

        </div>
    );
}

export default DesbloquearTarjeta;