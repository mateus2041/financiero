import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/corriente.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const HISTORIAL_LOCAL_KEY = "historial_transferencias";

export default function Transferencia() {

  const guardarEnHistorial = (transferencia) => {

    const historial = JSON.parse(
      localStorage.getItem(HISTORIAL_LOCAL_KEY) || "[]"
    );

    localStorage.setItem(
      HISTORIAL_LOCAL_KEY,
      JSON.stringify([
        {
          id_transaccion: `local-${Date.now()}`,
          tipo: "Transferencia",
          monto: transferencia.monto,
          descripcion: transferencia.descripcion,
          estado: transferencia.estado,
          fecha: new Date().toISOString(),
        },
        ...historial,
      ])
    );
  };

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

  // =====================================================
  // FORMATO DE PESOS COLOMBIANOS
  // =====================================================

  const formatoMoneda = (valor) => {

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(valor) || 0);

  };

  // =====================================================
  // OBTENER SALDOS
  // =====================================================

  const obtenerSaldos = async () => {

    try {

      const token = localStorage.getItem("token");

      if (!token) {

        setMensaje("No hay una sesión activa.");

        return;

      }

      const res = await axios.get(
        `${API_BASE_URL}/cuentas/saldos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSaldoCorriente(
        Number(res.data.cuenta_corriente || 0)
      );

      setSaldoAhorro(
        Number(res.data.cuenta_ahorro || 0)
      );

    } catch (err) {

      console.error(
        "Error obteniendo saldos:",
        err
      );

      setMensaje(
        "No fue posible obtener los saldos."
      );

    }

  };

  // =====================================================
  // CARGAR SALDOS
  // =====================================================

  useEffect(() => {

    obtenerSaldos();

  }, []);

  // =====================================================
  // CAMBIAR CUENTA ORIGEN
  // =====================================================

  const cambiarOrigen = (e) => {

    const origen = e.target.value;

    const destino =
      origen === "corriente"
        ? "ahorro"
        : "corriente";

    setForm({
      ...form,
      origen: origen,
      destino: destino,
    });

    setMensaje("");

  };

  // =====================================================
  // CAMBIAR MONTO
  // =====================================================

  const cambiarMonto = (e) => {

    const valor = e.target.value.replace(/\D/g, "");

    setForm({
      ...form,
      monto: valor,
    });

    setMensaje("");

  };

  // =====================================================
  // CAMBIAR DESCRIPCIÓN
  // =====================================================

  const cambiarDescripcion = (e) => {

    setForm({
      ...form,
      descripcion: e.target.value,
    });

  };

  // =====================================================
  // REALIZAR TRANSFERENCIA
  // =====================================================

  const transferir = async (e) => {

    e.preventDefault();

    setMensaje("");

    // ===================================================
    // VALIDAR MONTO
    // ===================================================

    const monto = Number(form.monto);

    if (!monto || monto <= 0) {

      guardarEnHistorial({
        monto: monto || 0,
        descripcion: form.descripcion.trim() || "Transferencia entre cuentas",
        estado: "rechazada",
      });

      setMensaje(
        "Ingrese un monto válido."
      );

      return;

    }

    // ===================================================
    // OBTENER SALDO DE LA CUENTA ORIGEN
    // ===================================================

    const saldoDisponible =
      form.origen === "corriente"
        ? saldoCorriente
        : saldoAhorro;

    // ===================================================
    // VALIDAR SALDO
    // ===================================================

    if (monto > saldoDisponible) {

      guardarEnHistorial({
        monto,
        descripcion: form.descripcion.trim() || "Transferencia entre cuentas",
        estado: "rechazada",
      });

      setMensaje(

        `No tiene saldo suficiente en ${
          form.origen === "corriente"
            ? "Cuenta Corriente"
            : "Cuenta de Ahorros"
        }.`

      );

      return;

    }

    // ===================================================
    // TOKEN
    // ===================================================

    const token = localStorage.getItem("token");

    if (!token) {

      guardarEnHistorial({
        monto,
        descripcion: form.descripcion.trim() || "Transferencia entre cuentas",
        estado: "rechazada",
      });

      setMensaje(
        "No hay una sesión activa."
      );

      return;

    }

    try {

      setLoading(true);

      // =================================================
      // ENVIAR TRANSFERENCIA
      // =================================================

      const res = await axios.post(

        `${API_BASE_URL}/transferencias/entre-cuentas`,

        {
          origen: form.origen,

          destino: form.destino,

          monto: monto,

          descripcion:
            form.descripcion.trim(),
        },

        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }

      );

      // =================================================
      // MENSAJE DE ÉXITO
      // =================================================

      setMensaje(

        res.data.mensaje ||
        "Transferencia realizada correctamente."

      );

      // =================================================
      // LIMPIAR MONTO Y DESCRIPCIÓN
      // =================================================

      setForm({

        origen: form.origen,

        destino: form.destino,

        monto: "",

        descripcion: "",

      });

      // =================================================
      // ACTUALIZAR SALDOS
      // =================================================

      await obtenerSaldos();

    } catch (err) {

      console.error(
        "Error realizando transferencia:",
        err
      );

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

      guardarEnHistorial({
        monto,
        descripcion: form.descripcion.trim() || "Transferencia entre cuentas",
        estado: "rechazada",
      });

    } finally {

      setLoading(false);

    }

  };

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="transfer-container">

      <div className="transfer-card">

        <h2>
          Transferencia entre cuentas
        </h2>

        <form onSubmit={transferir}>

          {/* =================================================
              CUENTA ORIGEN
          ================================================= */}

          <label>
            Cuenta origen
          </label>

          <select
            value={form.origen}
            onChange={cambiarOrigen}
          >

            <option value="corriente">

              Cuenta Corriente -{" "}
              {formatoMoneda(saldoCorriente)}

            </option>

            <option value="ahorro">

              Cuenta de Ahorros -{" "}
              {formatoMoneda(saldoAhorro)}

            </option>

          </select>

          {/* =================================================
              CUENTA DESTINO
          ================================================= */}

          <label>
            Cuenta destino
          </label>

          <select
            value={form.destino}
            disabled
          >

            {form.destino === "corriente" ? (

              <option value="corriente">

                Cuenta Corriente -{" "}
                {formatoMoneda(saldoCorriente)}

              </option>

            ) : (

              <option value="ahorro">

                Cuenta de Ahorros -{" "}
                {formatoMoneda(saldoAhorro)}

              </option>

            )}

          </select>

          {/* =================================================
              MONTO
          ================================================= */}

          <label>
            Monto
          </label>

          <input
            type="text"
            name="monto"
            value={
              form.monto
                ? formatoMoneda(
                    Number(form.monto)
                  )
                : ""
            }
            onChange={cambiarMonto}
            placeholder="$0"
            required
          />

          {/* =================================================
              SALDO DISPONIBLE
          ================================================= */}

          <div className="saldo-disponible">

            Saldo disponible en{" "}

            {form.origen === "corriente"
              ? "Cuenta Corriente"
              : "Cuenta de Ahorros"}

            :{" "}

            {formatoMoneda(
              form.origen === "corriente"
                ? saldoCorriente
                : saldoAhorro
            )}

          </div>

          {/* =================================================
              DESCRIPCIÓN
          ================================================= */}

          <label>
            Descripción
          </label>

          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={cambiarDescripcion}
            placeholder="Descripción de la transferencia"
          />

          {/* =================================================
              BOTÓN
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Procesando..."
              : "Realizar transferencia"}

          </button>

        </form>

        {/* =================================================
            MENSAJE
        ================================================= */}

        {mensaje && (

          <p className="mensaje">

            {mensaje}

          </p>

        )}

        {/* =================================================
            VOLVER
        ================================================= */}

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
