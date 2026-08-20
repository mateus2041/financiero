import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/transferencias.css";

export default function Transferencia() {
  const [form, setForm] = useState({
    origen: "corriente",
    destino: "ahorro",
    monto: "",
    descripcion: "",
  });

  const [saldoCorriente, setSaldoCorriente] = useState(0);
  const [saldoAhorro, setSaldoAhorro] = useState(0);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // Formato de pesos colombianos
  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(valor);
  };

  // Obtener saldos actuales
  const obtenerSaldos = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:8000/cuentas/saldos",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSaldoCorriente(res.data.cuenta_corriente);
      setSaldoAhorro(res.data.cuenta_ahorro);
    } catch (err) {
      console.error("Error obteniendo saldos:", err);
    }
  };

  // Actualizar saldos automáticamente
  useEffect(() => {
    obtenerSaldos();

    const intervalo = setInterval(() => {
      obtenerSaldos();
    }, 2000);

    return () => clearInterval(intervalo);
  }, []);

  const cambiar = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Cambiar y formatear el monto
  const cambiarMonto = (e) => {
    const valor = e.target.value.replace(/\D/g, "");

    setForm({
      ...form,
      monto: valor,
    });
  };

  const transferir = async (e) => {
    e.preventDefault();

    const monto = Number(form.monto);

    if (monto <= 0) {
      setMensaje("Ingrese un monto válido.");
      return;
    }

    if (monto > saldoCorriente) {
      setMensaje(
        "No tiene saldo suficiente en Cuenta Corriente."
      );
      return;
    }

    try {
      setLoading(true);
      setMensaje("");

      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:8000/transferencias",
        {
          origen: "corriente",
          destino: "ahorro",
          monto: monto,
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
        origen: "corriente",
        destino: "ahorro",
        monto: "",
        descripcion: "",
      });

      // Actualizar saldos inmediatamente
      await obtenerSaldos();

    } catch (err) {
      if (err.response) {
        setMensaje(
          err.response.data.detail ||
          "Error al realizar la transferencia."
        );
      } else {
        setMensaje(
          "Error al conectar con el servidor."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">

      <div className="transfer-card">

        <h2>Transferencia entre cuentas</h2>

        {/* SALDOS */}

        <div className="saldos">

          <div className="saldo-cuenta">
            <span>
              Cuenta Corriente ({formatoMoneda(saldoCorriente)})
            </span>
          </div>

          <div className="saldo-cuenta">
            <span>
              Cuenta de Ahorro ({formatoMoneda(saldoAhorro)})
            </span>
          </div>

        </div>

        <form onSubmit={transferir}>

          {/* CUENTA ORIGEN */}

          <label>Cuenta origen</label>

          <select
            name="origen"
            value={form.origen}
            onChange={cambiar}
          >
            <option value="corriente">
              Cuenta Corriente ({formatoMoneda(saldoCorriente)})
            </option>
          </select>

          {/* CUENTA DESTINO */}

          <label>Cuenta destino</label>

          <select
            name="destino"
            value={form.destino}
            onChange={cambiar}
          >
            <option value="ahorro">
              Cuenta de Ahorro ({formatoMoneda(saldoAhorro)})
            </option>
          </select>

          {/* MONTO */}

          <label>Monto</label>

          <input
            type="text"
            name="monto"
            value={
              form.monto
                ? formatoMoneda(Number(form.monto))
                : ""
            }
            onChange={cambiarMonto}
            placeholder="$0"
            required
          />

          {/* DESCRIPCIÓN */}

          <label>Descripción</label>

          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
          />

          {/* BOTÓN */}

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Procesando..." : "Transferir"}
          </button>

        </form>

        {/* MENSAJE */}

        {mensaje && (
          <p className="mensaje">
            {mensaje}
          </p>
        )}

        <Link
          to="/cuenta"
          className="volver"
        >
          Volver
        </Link>

      </div>

    </div>
  );
}