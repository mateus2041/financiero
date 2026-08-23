import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/historial.css";

const HISTORIAL_LOCAL_KEY = "historial_transferencias";
const HISTORIAL_LEGACY_KEY = "historial";

function Historial() {

    const [transacciones, setTransacciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [filtro, setFiltro] = useState("todas");
    const [busqueda, setBusqueda] = useState("");

    const [usuario, setUsuario] = useState("");
    const [openTransfer, setOpenTransfer] = useState(false);

    useEffect(() => {
        cargarTransacciones();
        cargarUsuario();
    }, []);

    const cargarUsuario = async () => {

        try {

            const token = localStorage.getItem("token");

            const respuesta = await fetch(
                "http://127.0.0.1:8000/usuario",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!respuesta.ok) {
                return;
            }

            const datos = await respuesta.json();

            setUsuario(
                datos.nombre ||
                datos.usuario ||
                datos.nombre_usuario ||
                ""
            );

        } catch (error) {

            console.error(error);

        }

    };

    const handleLogout = () => {

        localStorage.removeItem("token");

        window.location.href = "/login";

    };

    const cargarTransacciones = async () => {

        try {

            const token = localStorage.getItem("token");

            const historialLocal = JSON.parse(
                localStorage.getItem(HISTORIAL_LOCAL_KEY) || "[]"
            );
            const historialAnterior = JSON.parse(
                localStorage.getItem(HISTORIAL_LEGACY_KEY) || "[]"
            );

            const respuesta = await fetch(
                "http://127.0.0.1:8000/transacciones",
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!respuesta.ok) {
                throw new Error("No se pudieron cargar las transacciones");
            }

            const datos = await respuesta.json();

            // Permite recibir directamente un arreglo
            // o un objeto que tenga las transacciones dentro.
            const lista = Array.isArray(datos)
                ? datos
                : datos.transacciones || datos.data || [];

            setTransacciones([
                ...historialLocal,
                ...historialAnterior,
                ...lista,
            ]);

        } catch (error) {

            console.error(error);

            const historialLocal = JSON.parse(
                localStorage.getItem(HISTORIAL_LOCAL_KEY) || "[]"
            );
            const historialAnterior = JSON.parse(
                localStorage.getItem(HISTORIAL_LEGACY_KEY) || "[]"
            );
            const historialCompleto = [
                ...historialLocal,
                ...historialAnterior,
            ];

            if (historialCompleto.length > 0) {
                setTransacciones(historialCompleto);
            } else {
                setError("No fue posible cargar el historial.");
            }

        } finally {

            setCargando(false);

        }
    };

    const formatearFecha = (fecha) => {

        if (!fecha) {
            return "Fecha no disponible";
        }

        const fechaConvertida = new Date(fecha);

        if (isNaN(fechaConvertida.getTime())) {
            return fecha;
        }

        return fechaConvertida.toLocaleString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const obtenerTipo = (transaccion) => {

        const tipo = String(
            transaccion.tipo ||
            transaccion.tipo_transaccion ||
            transaccion.type ||
            ""
        ).toLowerCase();

        if (
            tipo.includes("ingreso") ||
            tipo.includes("recib") ||
            tipo.includes("deposit")
        ) {
            return "ingreso";
        }

        return "salida";
    };

    const obtenerEstado = (transaccion) => {

        const estado = String(
            transaccion.estado ||
            transaccion.estado_transferencia ||
            "completada"
        ).toLowerCase();

        if (["rechazada", "fallida", "cancelada", "error"].some(
            (estadoFallido) => estado.includes(estadoFallido)
        )) {
            return "rechazada";
        }

        if (["pendiente", "procesando"].some(
            (estadoPendiente) => estado.includes(estadoPendiente)
        )) {
            return "pendiente";
        }

        return "procesada";
    };

    const mostrarEstado = (estado) => {

        const estados = {
            procesada: "Procesada",
            rechazada: "Rechazada",
            pendiente: "Pendiente",
        };

        return estados[estado] || "Procesada";
    };

    const obtenerDescripcion = (transaccion) => {

        return (
            transaccion.descripcion ||
            transaccion.concepto ||
            transaccion.nombre ||
            transaccion.destinatario ||
            transaccion.remitente ||
            "Transacción"
        );
    };

    const obtenerMonto = (transaccion) => {

        return Number(
            transaccion.monto ||
            transaccion.valor ||
            transaccion.amount ||
            0
        );
    };

    const transaccionesFiltradas = transacciones.filter((transaccion) => {

        const tipo = obtenerTipo(transaccion);
        const descripcion = obtenerDescripcion(transaccion).toLowerCase();

        const cumpleFiltro =
            filtro === "todas" || tipo === filtro;

        const cumpleBusqueda =
            descripcion.includes(busqueda.toLowerCase());

        return cumpleFiltro && cumpleBusqueda;
    });

    const formatearMonto = (monto, tipo) => {

        return `${tipo === "ingreso" ? "+" : "-"} $${monto.toLocaleString("es-CO")}`;
    };

    return (

        <div className="panel-financiero">

            <aside className="sidebar">

                <ul>

                    <li>

                        <Link
                            to="/cuenta"
                        >

                            💷 Cuenta

                        </Link>

                    </li>


                    <li>

                        <Link
                            to="/historial"
                            className="active"
                        >

                            📜 Historial Monetario

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


                        {

                        openTransfer && (

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

                            </ul>

                        )

                        }


                    </li>


                    <li>

                        <Link
                            to="/certificado"
                            className="btn-nav"
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


                    {/* BOTON NUEVO CHAT IA */}

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


            <main className="main">


                <header className="main-header">

                    <h2>

                        Bienvenido {usuario}

                    </h2>


                    <div className="profile">

                        <img

                            src="https://i.pinimg.com/736x/e0/06/16/e00616c1e181f83b35b157f9281bd36e.jpg"

                            alt="Usuario"

                        />

                    </div>


                </header>


                <div className="historial-container">

                    <div className="historial-header">

                        <div>

                            <h1>Historial de transacciones</h1>

                            <p>
                                Consulta todos los movimientos de tu billetera.
                            </p>

                        </div>

                    </div>


                    <div className="historial-filtros">

                        <div className="buscador">

                            <input
                                type="text"
                                placeholder="Buscar transacción..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />

                        </div>


                        <div className="botones-filtro">

                            <button
                                className={filtro === "todas" ? "activo" : ""}
                                onClick={() => setFiltro("todas")}
                            >

                                Todas

                            </button>


                            <button
                                className={filtro === "ingreso" ? "activo" : ""}
                                onClick={() => setFiltro("ingreso")}
                            >

                                Ingresos

                            </button>


                            <button
                                className={filtro === "salida" ? "activo" : ""}
                                onClick={() => setFiltro("salida")}
                            >

                                Salidas

                            </button>

                        </div>

                    </div>


                    {cargando && (

                        <div className="historial-mensaje">

                            <p>Cargando transacciones...</p>

                        </div>

                    )}


                    {error && (

                        <div className="historial-error">

                            {error}

                        </div>

                    )}


                    {!cargando && !error && transaccionesFiltradas.length === 0 && (

                        <div className="historial-vacio">

                            <div className="icono-vacio">

                                💳

                            </div>

                            <h2>No hay transacciones</h2>

                            <p>
                                Todavía no tienes movimientos registrados.
                            </p>

                        </div>

                    )}


                    {!cargando && !error && transaccionesFiltradas.length > 0 && (

                        <div className="transacciones-lista">

                            {transaccionesFiltradas.map((transaccion, index) => {

                                const tipo = obtenerTipo(transaccion);
                                const monto = obtenerMonto(transaccion);
                                const estado = obtenerEstado(transaccion);

                                return (

                                    <div
                                        className="transaccion-card"
                                        key={
                                            transaccion.id ||
                                            transaccion.id_transaccion ||
                                            index
                                        }
                                    >

                                        <div
                                            className={`transaccion-icono ${tipo}`}
                                        >

                                            {tipo === "ingreso" ? "↓" : "↑"}

                                        </div>


                                        <div className="transaccion-info">

                                            <h3>
                                                {obtenerDescripcion(transaccion)}
                                            </h3>


                                            <p>

                                                {formatearFecha(
                                                    transaccion.fecha ||
                                                    transaccion.fecha_transaccion ||
                                                    transaccion.created_at
                                                )}

                                            </p>


                                            <span
                                                className={`estado ${
                                                        estado
                                                }`}
                                            >

                                                {mostrarEstado(estado)}

                                            </span>

                                        </div>


                                        <div
                                            className={`transaccion-monto ${tipo}`}
                                        >

                                            {formatearMonto(monto, tipo)}

                                        </div>


                                    </div>

                                );

                            })}

                        </div>

                    )}

                </div>


            </main>


        </div>

    );

}

export default Historial;