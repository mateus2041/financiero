import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/historial.css";

function Historial() {

    const [transacciones, setTransacciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [filtro, setFiltro] = useState("todas");
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        cargarTransacciones();
    }, []);

    const cargarTransacciones = async () => {

        try {

            const token = localStorage.getItem("token");

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

            setTransacciones(lista);

        } catch (error) {

            console.error(error);
            setError("No fue posible cargar el historial.");

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
                                            String(
                                                transaccion.estado || "Completada"
                                            ).toLowerCase()
                                        }`}
                                    >
                                        {transaccion.estado || "Completada"}
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
    );
}

export default Historial;