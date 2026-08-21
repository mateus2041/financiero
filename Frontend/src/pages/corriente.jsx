import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/corriente.css";

export default function Transferencia() {
  const [form, setForm] = useState({
    origen: "corriente",
    llave: "",
    monto: "",
    descripcion: "",
  });

  const [saldoCorriente, setSaldoCorriente] = useState(0);
  const [saldoAhorro, setSaldoAhorro] = useState(0);

  const [destinatario, setDestinatario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultando, setConsultando] = useState(false);

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

  // Consultar destinatario mediante llave Bre-B
  const consultarLlave = async () => {
    if (!form.llave.trim()) {
      setMensaje("Ingrese una llave Bre-B.");
      return;
    }

    try {
      setConsultando(true);
      setMensaje("");
      setDestinatario("");

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:8000/bre-b/consultar/${form.llave}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDestinatario(res.data.nombre);

      setMensaje("Destinatario encontrado correctamente.");

    } catch (err) {
      if (err.response) {
        setMensaje(
          err.response.data.detail ||
          "No se encontró la llave Bre-B."
        );
      } else {
        setMensaje("Error al conectar con el servidor.");
      }

      setDestinatario("");
    } finally {
      setConsultando(false);
    }
  };

  const transferir = async (e) => {
    e.preventDefault();

    const monto = Number(form.monto);

    if (!form.llave.trim()) {
      setMensaje("Ingrese la llave Bre-B del destinatario.");
      return;
    }

    if (!destinatario) {
      setMensaje("Primero debe consultar la llave Bre-B.");
      return;
    }

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
        "http://localhost:8000/transferencias/bre-b",
        {
          origen: "corriente",
          llave_destino: form.llave,
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
        llave: "",
        monto: "",
        descripcion: "",
      });

      setDestinatario("");

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

        <h2>Transferencia Bre-B</h2>

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

          {/* LLAVE BRE-B */}

          <label>Llave Bre-B del destinatario</label>

          <input
            type="text"
            name="llave"
            value={form.llave}
            onChange={cambiar}
            placeholder="Ej: 3001234567"
            required
          />

          <button
            type="button"
            onClick={consultarLlave}
            disabled={consultando}
          >
            {consultando
              ? "Consultando..."
              : "Consultar destinatario"}
          </button>

          {/* DESTINATARIO */}

          {destinatario && (
            <div className="destinatario">
              <strong>Destinatario:</strong>
              <span>{destinatario}</span>
            </div>
          )}

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
            placeholder="Descripción de la transferencia"
          />

          {/* BOTÓN */}

          <button
            type="submit"
            disabled={loading || !destinatario}
          >
            {loading
              ? "Procesando..."
              : "Transferir por Bre-B"}
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