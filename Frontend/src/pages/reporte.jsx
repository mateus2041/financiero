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

      const respuesta = await axios.get(
        "http://127.0.0.1:8000/transacciones",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReporte(respuesta.data);

      if (respuesta.data.length === 0) {
        setMensaje("No hay transacciones para generar el reporte.");
      }
    } catch (error) {
      console.error("Error al generar el reporte:", error);

      setMensaje(
        error.response?.data?.detail ||
          "No se pudo obtener el reporte."
      );
    } finally {
      setLoading(false);
    }
  };

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
                <th>Tipo</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Monto</th>
                <th>Descripción</th>
              </tr>
            </thead>

            <tbody>
              {reporte.map((transaccion, index) => (
                <tr key={transaccion.id || index}>
                  <td>
                    {transaccion.fecha || "Sin fecha"}
                  </td>

                  <td>
                    {transaccion.tipo || "Transacción"}
                  </td>

                  <td>
                    {transaccion.origen || "-"}
                  </td>

                  <td>
                    {transaccion.destino || "-"}
                  </td>

                  <td>
                    {formatoDinero(
                      Number(transaccion.monto || 0)
                    )}
                  </td>

                  <td>
                    {transaccion.descripcion || "-"}
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