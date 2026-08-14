import { useState } from "react";
import axios from "axios";
import "../styles/transferencias.css";

export default function Transferencias() {
  const [form, setForm] = useState({
    origen: "Cuenta de Ahorros",
    destino: "",
    monto: "",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const saldoAhorros = 0;
  const saldoCorriente = 700;

  // Formato de dinero colombiano
  const formatoDinero = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==============================
  // REPORTAR TRANSACCIÓN FALLIDA
  // ==============================
  const reportarTransaccionFallida = async (motivo) => {
    try {
      await axios.post(
        "http://localhost:8000/reportes/transaccion-fallida",
        {
          origen: form.origen,
          destino: form.destino,
          monto: parseFloat(form.monto) || 0,
          descripcion: form.descripcion,
          motivo: motivo,
        }
      );

      console.log("Reporte registrado correctamente");
    } catch (error) {
      console.error(
        "Error al registrar el reporte:",
        error
      );
    }
  };

  // ==============================
  // REALIZAR TRANSFERENCIA
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");

    // Validar campos
    if (!form.destino || !form.monto) {
      const motivo = "Todos los campos son obligatorios.";

      setMensaje(motivo);

      await reportarTransaccionFallida(motivo);

      return;
    }

    // Validar monto
    if (parseFloat(form.monto) <= 0) {
      const motivo = "El monto debe ser mayor que cero.";

      setMensaje(motivo);

      await reportarTransaccionFallida(motivo);

      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8000/transferencias",
        {
          origen: form.origen,
          destino: form.destino,
          monto: parseFloat(form.monto),
          descripcion: form.descripcion,
        }
      );

      // Transferencia exitosa
      setMensaje(
        response.data.mensaje ||
          "Transferencia realizada correctamente."
      );

      // Limpiar formulario
      setForm({
        origen: "Cuenta de Ahorros",
        destino: "",
        monto: "",
        descripcion: "",
      });

    } catch (error) {
      // Obtener motivo del error
      const motivo =
        error.response?.data?.detail ||
        "La transferencia no pudo ser procesada.";

      // Mostrar mensaje
      setMensaje(
        `Transacción fallida: ${motivo}`
      );

      // Guardar reporte
      await reportarTransaccionFallida(motivo);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">

      <div className="transfer-card">

        <h2>Transferencias Bancarias</h2>

        <form onSubmit={handleSubmit}>

          {/* CUENTA ORIGEN */}
          <div className="input-group">

            <label>Cuenta Origen</label>

            <select
              name="origen"
              value={form.origen}
              onChange={handleChange}
            >

              <option value="Cuenta de Ahorros">
                Cuenta de Ahorros (
                {formatoDinero(saldoAhorros)}
                )
              </option>

              <option value="Cuenta Corriente">
                Cuenta Corriente (
                {formatoDinero(saldoCorriente)}
                )
              </option>

            </select>

          </div>

          {/* CUENTA DESTINO */}
          <div className="input-group">

            <label>Cuenta Destino</label>

            <input
              type="text"
              name="destino"
              value={form.destino}
              onChange={handleChange}
              placeholder="Ingrese la cuenta destino"
            />

          </div>

          {/* MONTO */}
          <div className="input-group">

            <label>Monto</label>

            <input
              type="number"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              placeholder="Ingrese el monto"
              min="1"
            />

          </div>

          {/* DESCRIPCIÓN */}
          <div className="input-group">

            <label>Descripción</label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ingrese una descripción"
            />

          </div>

          {/* BOTÓN */}
          <button
            className="btn-transferir"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Procesando..."
              : "Transferir"}

          </button>

        </form>

        {/* MENSAJE */}
        {mensaje && (
          <p className="mensaje">
            {mensaje}
          </p>
        )}

      </div>

    </div>
  );
}