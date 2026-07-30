import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/transferencias.css";

export default function Transferencia() {
  const [form, setForm] = useState({
    origen: "ahorro",
    destino: "corriente",
    monto: "",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const cambiar = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const transferir = async (e) => {
    e.preventDefault();

    if (Number(form.monto) <= 0) {
      setMensaje("Ingrese un monto válido.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:8000/transferencias",
        {
          origen: form.origen,
          destino: form.destino,
          monto: Number(form.monto),
          descripcion: form.descripcion,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMensaje(res.data.mensaje);

      setForm({
        origen: "ahorro",
        destino: "corriente",
        monto: "",
        descripcion: "",
      });
    } catch (err) {
      if (err.response) {
        setMensaje(err.response.data.detail);
      } else {
        setMensaje("Error al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">
      <div className="transfer-card">
        <h2>Transferencia entre cuentas</h2>

        <form onSubmit={transferir}>
          <label>Cuenta origen</label>
          <select
            name="origen"
            value={form.origen}
            onChange={cambiar}
          >
            <option value="ahorro">Cuenta Ahorro</option>
            <option value="corriente">Cuenta Corriente</option>
          </select>

          <label>Cuenta destino</label>
          <select
            name="destino"
            value={form.destino}
            onChange={cambiar}
          >
            <option value="corriente">Cuenta Corriente</option>
            <option value="ahorro">Cuenta Ahorro</option>
          </select>

          <label>Monto</label>
          <input
            type="number"
            name="monto"
            value={form.monto}
            onChange={cambiar}
            required
          />

          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Procesando..." : "Transferir"}
          </button>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}

        <Link to="/cuenta" className="volver">
          Volver
        </Link>
      </div>
    </div>
  );
}