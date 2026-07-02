import { useState } from "react";
import axios from "axios";
import "../styles/transferencias.css";

export default function Transferencias() {
  const [form, setForm] = useState({
    origen: "Cuenta Principal",
    destino: "",
    monto: "",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

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

      setMensaje(response.data.mensaje || "Transferencia realizada correctamente.");

      setForm({
        origen: "Cuenta Principal",
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
            <input
              type="text"
              value={form.origen}
              readOnly
            />
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