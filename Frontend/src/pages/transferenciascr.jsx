import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/transferencias.css";

const API_URL = "http://127.0.0.1:8000";

export default function RegistrarLlaveBreB() {
    const navigate = useNavigate();
    const [llave, setLlave] = useState("");
    const [cuentas, setCuentas] = useState([]);
    const [cuentaSeleccionada, setCuentaSeleccionada] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [cargandoCuentas, setCargandoCuentas] = useState(true);

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

    const chatbotActivo = true;

    useEffect(() => {
        const cargarCuentas = async () => {
            try {
                const token = localStorage.getItem("token");
                const respuesta = await axios.get(
                    `${API_URL}/cuentas/mis-cuentas`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const cuentasActivas = (respuesta.data || []).filter(
                    (cuenta) => cuenta.estado === "activa"
                );

                setCuentas(cuentasActivas);
                if (cuentasActivas.length > 0) {
                    setCuentaSeleccionada(String(cuentasActivas[0].id_cuenta));
                }
            } catch (err) {
                setError(
                    err.response?.data?.detail ||
                    "No se pudieron cargar tus cuentas."
                );
            } finally {
                setCargandoCuentas(false);
            }
        };

        cargarCuentas();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario_id");
        localStorage.removeItem("documento");

        window.location.href = "/login";
    };

    const registrarLlave = async (e) => {
        e.preventDefault();

        setMensaje("");
        setError("");

        const numeroTelefono = llave.replace(/\D/g, "");

        if (!numeroTelefono) {
            setError("Ingrese un número telefónico.");
            return;
        }

        if (!/^\d{10}$/.test(numeroTelefono)) {
            setError("El número telefónico debe tener exactamente 10 dígitos.");
            return;
        }

        if (!cuentaSeleccionada) {
            setError("Seleccione una cuenta activa.");
            return;
        }

        try {
            setCargando(true);

            const token = localStorage.getItem("token");
            const llaveCompleta = `@financiero${numeroTelefono}`;

            const respuesta = await axios.put(
                `${API_URL}/bre-b/llave`,
                {
                    llave: llaveCompleta,
                    id_cuenta: Number(cuentaSeleccionada)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMensaje(
                respuesta.data.mensaje ||
                "Llave Bre-B registrada correctamente"
            );

            setLlave("");
        } catch (err) {
            if (err.response) {
                setError(
                    err.response.data.detail ||
                    "No fue posible registrar la llave Bre-B"
                );
            } else {
                setError("No se pudo conectar con el servidor");
            }
        } finally {
            setCargando(false);
        }
    };

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
                            💳 Otros{" "}
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

                    {chatbotActivo && (
                        <li>
                            <button
                                type="button"
                                className="sidebar-link"
                                onClick={() =>
                                    alert("Asistente IA")
                                }
                            >
                                🤖 Asistente IA
                            </button>
                        </li>
                    )}

                </ul>

                <button
                    className="logout"
                    onClick={handleLogout}
                >
                    🚪 Cerrar sesión
                </button>

            </aside>

            <main className="contenido-principal">

                <section className="breb-card">
                    <h2>Registrar tu llave Bre-B</h2>
                    <p className="breb-intro">
                        Selecciona la cuenta que quieres asociar a tu llave.
                    </p>

                    {cargandoCuentas ? (
                        <p className="breb-state">Cargando tus cuentas...</p>
                    ) : cuentas.length === 0 ? (
                        <p className="breb-state breb-error">
                            No tienes cuentas activas disponibles.
                        </p>
                    ) : (
                        <form onSubmit={registrarLlave}>
                            <div className="breb-cuentas">
                                <h3>Tus cuentas</h3>
                                {cuentas.map((cuenta) => (
                                    <label
                                        className={`breb-cuenta ${String(cuentaSeleccionada) === String(cuenta.id_cuenta) ? "seleccionada" : ""}`}
                                        key={cuenta.id_cuenta}
                                    >
                                        <input
                                            type="radio"
                                            name="cuenta-breb"
                                            value={cuenta.id_cuenta}
                                            checked={String(cuentaSeleccionada) === String(cuenta.id_cuenta)}
                                            onChange={(e) => setCuentaSeleccionada(e.target.value)}
                                        />
                                        <span>
                                            <strong>{cuenta.tipo_cuenta}</strong>
                                            <small>Cuenta {cuenta.numero_cuenta || cuenta.id_cuenta}</small>
                                        </span>
                                        <b>${Number(cuenta.saldo || 0).toLocaleString("es-CO")}</b>
                                    </label>
                                ))}
                            </div>

                            <label className="breb-label" htmlFor="llave-breb">
                                Llave Bre-B
                            </label>
                            <div className="breb-llave-fields">
                                <span className="breb-prefijo">@financiero</span>
                                <input
                                    id="llave-breb"
                                    className="breb-input"
                                    type="tel"
                                    inputMode="numeric"
                                    value={llave}
                                    onChange={(e) => setLlave(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="3001234567"
                                    minLength={10}
                                    maxLength={10}
                                    disabled={cargando}
                                />
                            </div>

                            <button className="breb-button" type="submit" disabled={cargando}>
                                {cargando ? "Registrando..." : "Registrar llave"}
                            </button>
                        </form>
                    )}

                    {mensaje && <p className="breb-state breb-success">{mensaje}</p>}
                    {error && <p className="breb-state breb-error">{error}</p>}
                </section>

            </main>

            {openCertificado && (
                <div
                    className="modal-certificado-overlay"
                    role="presentation"
                    onClick={() => setOpenCertificado(false)}
                >
                    <section
                        className="modal-certificado"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="certificado-modal-title"
                        onClick={(evento) => evento.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-certificado-cerrar"
                            aria-label="Cerrar modal de certificado"
                            onClick={() => setOpenCertificado(false)}
                        >
                            ×
                        </button>

                        <h2 id="certificado-modal-title">
                            Certificado bancario
                        </h2>
                        <p>
                            Consulta y descarga tu certificado bancario.
                        </p>

                        <div className="modal-certificado-acciones">
                            <button
                                type="button"
                                className="modal-certificado-secundario"
                                onClick={() => setOpenCertificado(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="modal-certificado-principal"
                                onClick={() => {
                                    setOpenCertificado(false);
                                    navigate("/certificado");
                                }}
                            >
                                Ver certificado
                            </button>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
}