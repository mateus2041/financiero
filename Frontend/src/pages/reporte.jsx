import React, { useState } from "react";
import axios from "axios";
import "../styles/reporta.css";

function Reporte() {
  const [reporte, setReporte] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const generarReporte = async () => {
    try {
      setLoading(true);
      setMensaje("");

      const token = localStorage.getItem("token");
      const historialLocal = JSON.parse(
        localStorage.getItem("historial_transferencias") || "[]"
      );
      const historialAnterior = JSON.parse(
        localStorage.getItem("historial") || "[]"
      );

      const respuesta = await axios.get(
        "http://127.0.0.1:8000/transacciones",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const datos = respuesta.data;
      const lista = Array.isArray(datos)
        ? datos
        : datos.transacciones || datos.data || [];
      const transacciones = [
        ...historialLocal,
        ...historialAnterior,
        ...lista,
      ];

      setReporte(transacciones);

      if (transacciones.length === 0) {
        setMensaje("No hay transacciones para generar el reporte.");
      }
    } catch (error) {
      console.error("Error al generar el reporte:", error);

      const historialLocal = JSON.parse(
        localStorage.getItem("historial_transferencias") || "[]"
      );
      const historialAnterior = JSON.parse(
        localStorage.getItem("historial") || "[]"
      );
      const historialCompleto = [
        ...historialLocal,
        ...historialAnterior,
      ];

      setReporte(historialCompleto);

      setMensaje(historialCompleto.length > 0
        ? "Reporte generado con los movimientos guardados localmente."
        : error.response?.data?.detail || "No se pudo obtener el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";

    const fechaConvertida = new Date(fecha);
    if (Number.isNaN(fechaConvertida.getTime())) return fecha;

    return fechaConvertida.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerTipo = (transaccion) => {
    const tipo = String(
      transaccion.tipo ||
      transaccion.tipo_transaccion ||
      transaccion.type ||
      ""
    ).toLowerCase();

    return tipo.includes("ingreso") || tipo.includes("recib") || tipo.includes("deposit")
      ? "Ingreso"
      : "Salida";
  };

  const obtenerEstado = (transaccion) => {
    const estado = String(
      transaccion.estado ||
      transaccion.estado_transferencia ||
      "completada"
    ).toLowerCase();

    if (["rechazada", "fallida", "cancelada", "error"].some((valor) => estado.includes(valor))) {
      return "Rechazada";
    }

    if (["pendiente", "procesando"].some((valor) => estado.includes(valor))) {
      return "Pendiente";
    }

    return "Procesada";
  };

  const obtenerDescripcion = (transaccion) => (
    transaccion.descripcion ||
    transaccion.concepto ||
    transaccion.nombre ||
    transaccion.destinatario ||
    transaccion.remitente ||
    "Transacción"
  );

  const obtenerMonto = (transaccion) => Number(
    transaccion.monto ||
    transaccion.valor ||
    transaccion.amount ||
    0
  );

  const formatoDinero = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  return (
    <div className="reporte-container">
      <h1>Reporte de Transacciones</h1>

      <div className="reporte-card">
        <h2>Generar reporte en tiempo real</h2>

        <p>
          Consulta las transacciones actuales de tu cuenta.
        </p>

        <button
          className="btn-reporte"
          onClick={generarReporte}
          disabled={loading}
        >
          {loading ? "Generando..." : "Generar reporte"}
        </button>

        {mensaje && (
          <p className="mensaje-reporte">
            {mensaje}
          </p>
        )}
      </div>

      {reporte.length > 0 && (
        <div className="tabla-reporte">
          <h2>Reporte actualizado</h2>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {reporte.map((transaccion, index) => (
                <tr key={transaccion.id || transaccion.id_transaccion || index}>
                  <td>
                    {formatearFecha(
                      transaccion.fecha ||
                      transaccion.fecha_transaccion ||
                      transaccion.created_at
                    )}
                  </td>

                  <td className="descripcion-reporte">
                    {obtenerDescripcion(transaccion)}
                  </td>

                  <td>
                    {obtenerTipo(transaccion)}
                  </td>

                  <td>
                    {transaccion.origen || "-"}
                  </td>

                  <td>
                    {transaccion.destino || "-"}
                  </td>

                  <td>
                    {formatoDinero(
                      obtenerMonto(transaccion)
                    )}
                  </td>

                  <td>
                    {obtenerEstado(transaccion)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reporte;