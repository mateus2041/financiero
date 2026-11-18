import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AsistenteMovil from "../components/AsistenteMovil";
import FinancialSidebar from "../components/FinancialSidebar";
import AssistantModal from "../components/AssistantModal";
import useResponsiveMenu from "../hooks/useResponsiveMenu";
import useModalDismissal from "../hooks/useModalDismissal";
import "../styles/desbloquearTarjeta.css";
import "../styles/navegacionMovil.css";

function TarjetaAdicional({
    tarjeta,
    onActualizar,
    onRestablecerCvv,
    onBloquear,
    onDesbloquear,
    actualizando,
    restableciendoCvv,
    bloqueando
}) {
    const [vista, setVista] = useState("frontal");
    const bloqueada = String(tarjeta.estado).toLowerCase() === "bloqueada";

    const cambiarVista = () => {
        setVista((actual) => actual === "frontal" ? "trasera" : "frontal");
    };

    const manejarTecla = (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            cambiarVista();
        }
    };

    const manejarRestablecimiento = async () => {
        if (await onRestablecerCvv(tarjeta)) {
            setVista("trasera");
        }
    };

    return (
        <div className="tarjeta-box">
            <h2 className="tarjeta-titulo-nueva">Nueva tarjeta</h2>
            <div
                className={`tarjeta-visual tarjeta-clickable${vista === "trasera" ? " tarjeta-trasera" : ""}`}
                onClick={cambiarVista}
                role="button"
                tabIndex={0}
                onKeyDown={manejarTecla}
                aria-label={`Ver reverso de la tarjeta terminada en ${tarjeta.ultimos_tres}`}
            >
                {vista === "frontal" ? (
                    <>
                        <div className="tarjeta-marca">BILLETERA</div>
                        <div className="tarjeta-chip">▦</div>
                        <div className="tarjeta-numero">
                            {(tarjeta.numero_tarjeta || "0000000000000000")
                                .replace(/(.{4})/g, "$1 ")
                                .trim()}
                        </div>
                        <div className="tarjeta-tipo">BILLETERA DIGITAL</div>
                    </>
                ) : (
                    <>
                        <div className="tarjeta-trasera-header">FIRMA AUTORIZADA</div>
                        <div className="tarjeta-trasera-licencia">
                            <div className="tarjeta-trasera-firma-box" />
                            <div className="tarjeta-trasera-codigo-box">
                                {tarjeta.codigo_seguridad || "---"}
                            </div>
                        </div>
                        <div className="tarjeta-trasera-mensaje">
                            Las operaciones de uso de esta tarjeta y la responsabilidad en su manejo son responsabilidad del cliente.
                        </div>
                        <div className="tarjeta-trasera-footer">
                            <div className="tarjeta-trasera-campo">
                                <strong>{tarjeta.ultimos_tres || "---"}</strong>
                            </div>
                            <div className="tarjeta-trasera-campo">
                                <strong>{tarjeta.fecha_expiracion || "--/--"}</strong>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="tarjeta-estado">
                <span>Estado actual:</span>
                <strong className={bloqueada ? "bloqueada" : "activa"}>
                    {tarjeta.estado || "Bloqueada"}
                </strong>
            </div>

            <div className="tarjeta-acciones">
                <button
                    type="button"
                    className={bloqueada ? "btn-desbloquear" : "btn-bloquear"}
                    onClick={() => bloqueada ? onDesbloquear() : onBloquear(tarjeta.id_tarjeta)}
                    disabled={bloqueando || actualizando || restableciendoCvv}
                >
                    {bloqueando
                        ? "Bloqueando..."
                        : bloqueada
                            ? "🔓 Desbloquear tarjeta"
                            : "🔒 Bloquear tarjeta por completo"}
                </button>
                <button
                    type="button"
                    className="btn-accion-tarjeta"
                    onClick={onActualizar}
                    disabled={actualizando || restableciendoCvv || bloqueando}
                >
                    {actualizando ? "Actualizando..." : "↻ Actualizar"}
                </button>
                <button
                    type="button"
                    className="btn-accion-tarjeta"
                    onClick={manejarRestablecimiento}
                    disabled={actualizando || restableciendoCvv || bloqueando || tarjeta.cvv_restablecido}
                >
                    {tarjeta.cvv_restablecido
                        ? "CVV ya restablecido"
                        : restableciendoCvv
                            ? "Restableciendo..."
                            : "Restablecer CVV"}
                </button>
            </div>
        </div>
    );
}

function DesbloquearTarjeta() {

    const [tarjeta, setTarjeta] = useState(null);
    const [tarjetaNueva, setTarjetaNueva] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [restableciendoCvv, setRestableciendoCvv] = useState(false);
    const [desbloqueando, setDesbloqueando] = useState(false);
    const [bloqueando, setBloqueando] = useState(false);
    const [solicitandoPassword, setSolicitandoPassword] = useState(false);
    const [passwordBloqueo, setPasswordBloqueo] = useState("");
    const [tarjetaIdBloqueo, setTarjetaIdBloqueo] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [vistaTarjeta, setVistaTarjeta] = useState("frontal");
    const [datosSeguridad, setDatosSeguridad] = useState({
        numeroTarjeta: "0000000000000000",
        ultimosTres: "000",
        vencimiento: "--/--",
        codigoSeguridad: "000"
    });

    const [openCertificado, setOpenCertificado] = useState(false);
    const [menuAbierto, setMenuAbierto] = useResponsiveMenu();
    const [asistenteAbierto, setAsistenteAbierto] = useState(false);

    useEffect(() => {
        void cargarTarjeta();
    }, []);

    useModalDismissal(asistenteAbierto, setAsistenteAbierto, true);

    const cargarTarjeta = async () => {
        try {
            setError("");
            const token = localStorage.getItem("token");
            const headers = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            };
            const respuestaAnterior = await fetch(
                "http://127.0.0.1:8000/tarjeta",
                { method: "GET", headers }
            );
            const datosAnteriores = await respuestaAnterior.json();

            if (!respuestaAnterior.ok) {
                throw new Error(datosAnteriores.detail || "No se pudo consultar la tarjeta anterior.");
            }

            const respuestaNueva = await fetch(
                "http://127.0.0.1:8000/tarjeta/ultima",
                { method: "GET", headers }
            );
            const datosNuevos = await respuestaNueva.json();

            if (!respuestaNueva.ok) {
                throw new Error(datosNuevos.detail || "No se pudo consultar la tarjeta nueva.");
            }

            const tarjetaAnterior = datosAnteriores;
            const tarjetaUltima = datosNuevos.tarjeta;
            setTarjeta(tarjetaAnterior);
            setTarjetaNueva(
                tarjetaUltima.id_tarjeta === tarjetaAnterior.id_tarjeta
                    ? null
                    : tarjetaUltima
            );
            setDatosSeguridad({
                numeroTarjeta: tarjetaAnterior.numero_tarjeta,
                ultimosTres: tarjetaAnterior.ultimos_tres,
                vencimiento: tarjetaAnterior.fecha_expiracion,
                codigoSeguridad: tarjetaAnterior.codigo_seguridad
            });

        } catch (error) {
            console.error(error);
            setTarjeta(null);
            setTarjetaNueva(null);
            setError(error.message || "No fue posible consultar el estado de la tarjeta.");
        } finally {
            setCargando(false);
        }
    };

    const actualizarTarjeta = async () => {
        setActualizando(true);
        setMensaje("");
        try {
            await cargarTarjeta();
        } finally {
            setActualizando(false);
        }
    };

    const restablecerCvv = async (tarjetaObjetivo) => {
        setError("");
        setMensaje("");

        try {
            setRestableciendoCvv(true);
            const respuesta = await fetch(
                `http://127.0.0.1:8000/tarjetas/${tarjetaObjetivo.id_tarjeta}/restablecer-cvv`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.detail || "No fue posible restablecer el CVV.");
            }

            if (tarjetaObjetivo.id_tarjeta === tarjeta.id_tarjeta) {
                setDatosSeguridad((actual) => ({
                    ...actual,
                    codigoSeguridad: datos.codigo_seguridad
                }));
                setTarjeta((actual) => ({
                    ...actual,
                    codigo_seguridad: datos.codigo_seguridad,
                    cvv_restablecido: true
                }));
                setVistaTarjeta("trasera");
            } else {
                setTarjetaNueva((actual) => ({
                    ...actual,
                    codigo_seguridad: datos.codigo_seguridad,
                    cvv_restablecido: true
                }));
            }
            setMensaje(datos.mensaje || "El CVV fue restablecido correctamente.");
            return true;
        } catch (error) {
            console.error(error);
            setError(error.message);
            return false;
        } finally {
            setRestableciendoCvv(false);
        }
    };

    const desbloquearTarjeta = () => {
        setError("");
        setMensaje(
            "Para desbloquear tu tarjeta, comunícate o acude a un punto bancario autorizado."
        );
    };

    const bloquearTarjeta = (idTarjeta) => {
        setError("");
        setMensaje("");
        setPasswordBloqueo("");
        setTarjetaIdBloqueo(idTarjeta);
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
                `http://127.0.0.1:8000/tarjetas/${tarjetaIdBloqueo}/bloquear`,
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
            const actualizarEstado = (tarjetaActual) =>
                tarjetaActual?.id_tarjeta === tarjetaIdBloqueo
                    ? { ...tarjetaActual, estado: datos.estado || "bloqueada" }
                    : tarjetaActual;
            setTarjeta(actualizarEstado);
            setTarjetaNueva(actualizarEstado);
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

    const tarjetaActual = tarjeta ?? {
        estado: "bloqueada",
        numero_tarjeta: "0000000000000000",
        ultimos_tres: "000",
        fecha_expiracion: "--/--",
        codigo_seguridad: "000"
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

            <AsistenteMovil onClick={() => setAsistenteAbierto(true)} />

            <FinancialSidebar
                menuAbierto={menuAbierto}
                onLogout={handleLogout}
                onAssistantOpen={() => setAsistenteAbierto(true)}
                reportLabel="📜 Reportes"
                cardLabel="🚫 Bloqueo de tarjeta"
            />

            <main className="tarjeta-container">

                <div className="tarjetas-lista">
                    {tarjeta ? (
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
                                    {(datosSeguridad.numeroTarjeta || "0000000000000000")
                                        .replace(/(.{4})/g, "$1 ")
                                        .trim()}
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
                                    String(tarjetaActual.estado)
                                        .toLowerCase() === "activa"
                                        ? "activa"
                                        : "bloqueada"
                                }
                            >
                                {tarjetaActual.estado || "Bloqueada"}
                            </strong>

                        </div>

                        <div className="tarjeta-acciones">
                            {String(tarjetaActual.estado).toLowerCase() ===
                            "bloqueada" ? (

                            <button
                                type="button"
                                className="btn-desbloquear"
                                onClick={desbloquearTarjeta}
                                disabled={desbloqueando}
                            >
                                {desbloqueando
                                    ? "Desbloqueando..."
                                    : "🔓 Desbloquear tarjeta"}
                            </button>

                            ) : (
                                <button
                                    type="button"
                                    className="btn-bloquear"
                                    onClick={() => bloquearTarjeta(tarjeta.id_tarjeta)}
                                    disabled={bloqueando}
                                >
                                    {bloqueando
                                        ? "Bloqueando..."
                                        : "🔒 Bloquear tarjeta por completo"}
                                </button>
                            )}
                            <button
                                type="button"
                                className="btn-accion-tarjeta"
                                onClick={actualizarTarjeta}
                                disabled={actualizando || restableciendoCvv}
                            >
                                {actualizando ? "Actualizando..." : "↻ Actualizar"}
                            </button>
                            <button
                                type="button"
                                className="btn-accion-tarjeta"
                                onClick={() => restablecerCvv(tarjeta)}
                                disabled={actualizando || restableciendoCvv || tarjetaActual.cvv_restablecido}
                            >
                                {tarjetaActual.cvv_restablecido
                                    ? "CVV ya restablecido"
                                    : restableciendoCvv
                                        ? "Restableciendo..."
                                        : "Restablecer CVV"}
                            </button>
                        </div>

                    </>

                    </div>
                    ) : (
                        <div className="tarjeta-box">
                            <div className={error ? "tarjeta-error" : "tarjeta-mensaje"}>
                                {error || "El asesor aún no ha creado una tarjeta para tu cuenta."}
                            </div>
                        </div>
                    )}
                    {tarjeta && tarjetaNueva && (
                        <TarjetaAdicional
                            tarjeta={tarjetaNueva}
                            onActualizar={actualizarTarjeta}
                            onRestablecerCvv={restablecerCvv}
                            onBloquear={bloquearTarjeta}
                            onDesbloquear={desbloquearTarjeta}
                            actualizando={actualizando}
                            restableciendoCvv={restableciendoCvv}
                            bloqueando={bloqueando}
                        />
                    )}
                </div>

            </main>

            {solicitandoPassword && (
                <div
                    className="modal-bloqueo-fondo"
                    role="presentation"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget && !bloqueando) {
                            setSolicitandoPassword(false);
                        }
                    }}
                >
                    <div
                        className="modal-bloqueo"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-bloqueo"
                    >
                        <h2 id="titulo-modal-bloqueo">Bloquear tarjeta</h2>
                        <p>Confirma tu contraseña para bloquear tu tarjeta por completo.</p>

                        <form className="formulario-bloqueo" onSubmit={confirmarBloqueo}>
                            <label htmlFor="password-bloqueo">Contraseña de usuario</label>
                            <input
                                id="password-bloqueo"
                                type="text"
                                value={passwordBloqueo}
                                onChange={(evento) => setPasswordBloqueo(evento.target.value)}
                                placeholder="Ingresa tu contraseña"
                                autoComplete="current-password"
                                autoFocus
                                disabled={bloqueando}
                            />
                            <div className="modal-bloqueo-acciones">
                                <button
                                    type="button"
                                    className="btn-cancelar-bloqueo"
                                    onClick={() => setSolicitandoPassword(false)}
                                    disabled={bloqueando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-bloquear"
                                    disabled={bloqueando}
                                >
                                    {bloqueando ? "Bloqueando..." : "🔒 Confirmar bloqueo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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

            {asistenteAbierto && (
                <AssistantModal onClose={() => setAsistenteAbierto(false)} />
            )}

        </div>
    );
}

export default DesbloquearTarjeta;