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

  // Saldos de las cuentas
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.destino || !form.monto) {
      setMensaje("Todos los campos son obligatorios.");
      return;
    }

    if (parseFloat(form.monto) <= 0) {
      setMensaje("El monto debe ser mayor que cero.");
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

      setMensaje(
        response.data.mensaje ||
          "Transferencia realizada correctamente."
      );

      setForm({
        origen: "Cuenta de Ahorros",
        destino: "",
        monto: "",
        descripcion: "",
      });
    } catch (error) {
      if (error.response) {
        setMensaje(error.response.data.detail);
      } else {
        setMensaje("No se pudo conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">
      <div className="transfer-card">

        <h2>Transferencias Bancarias</h2>

        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label>Cuenta Origen</label>

            <select
              name="origen"
              value={form.origen}
              onChange={handleChange}
            >
              <option value="Cuenta de Ahorros">
                Cuenta de Ahorros ({formatoDinero(saldoAhorros)})
              </option>

              <option value="Cuenta Corriente">
                Cuenta Corriente ({formatoDinero(saldoCorriente)})
              </option>
            </select>
          </div>

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

          <div className="input-group">
            <label>Monto</label>

            <input
              type="number"
              name="monto"
              value={form.monto}
              onChange={handleChange}
              placeholder="Ingrese el monto"
            />
          </div>

          <div className="input-group">
            <label>Descripción</label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
            />
          </div>

          <button
            className="btn-transferir"
            type="submit"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Transferir"}
          </button>

        </form>

        {mensaje && (
          <p className="mensaje">
            {mensaje}
          </p>
        )}

      </div>
    </div>
  );
}