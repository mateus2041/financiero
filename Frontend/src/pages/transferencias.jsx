import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/corriente.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const HISTORIAL_LOCAL_KEY = "historial_transferencias";

export default function Transferencia() {
  // =====================================================
  // ESTADOS DEL MENÚ
  // =====================================================

  const [openTransfer, setOpenTransfer] = useState(false);
  const [openCertificado, setOpenCertificado] = useState(false);

  // =====================================================
  // FORMULARIO
  // =====================================================

  const [form, setForm] = useState({
    origen: "corriente",
    destino: "ahorro",
    monto: "",
    descripcion: "",
  });

  // =====================================================
  // SALDOS
  // =====================================================

  const [saldoCorriente, setSaldoCorriente] = useState(0);
  const [saldoAhorro, setSaldoAhorro] = useState(0);

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // GUARDAR EN HISTORIAL
  // =====================================================

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
      console.error("Error obteniendo saldos:", err);

      setMensaje(
        "No fue posible obtener los saldos."
      );
    }
  };

  // =====================================================
  // CARGAR SALDOS AL INICIAR
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
      origen,
      destino,
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
  // CERRAR SESIÓN
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    window.location.href = "/login";
  };

  // =====================================================
  // REALIZAR TRANSFERENCIA
  // =====================================================

  const transferir = async (e) => {
    e.preventDefault();

    setMensaje("");

    // -----------------------------------------------------
    // VALIDAR MONTO
    // -----------------------------------------------------

    const monto = Number(form.monto);

    if (!monto || monto <= 0) {
      guardarEnHistorial({
        monto: monto || 0,
        descripcion:
          form.descripcion.trim() ||
          "Transferencia entre cuentas",
        estado: "rechazada",
      });

      setMensaje("Ingrese un monto válido.");

      return;
    }

    // -----------------------------------------------------
    // OBTENER SALDO DE LA CUENTA ORIGEN
    // -----------------------------------------------------

    const saldoDisponible =
      form.origen === "corriente"
        ? saldoCorriente
        : saldoAhorro;

    // -----------------------------------------------------
    // VALIDAR SALDO
    // -----------------------------------------------------

    if (monto > saldoDisponible) {
      guardarEnHistorial({
        monto,
        descripcion:
          form.descripcion.trim() ||
          "Transferencia entre cuentas",
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

    // -----------------------------------------------------
    // OBTENER TOKEN
    // -----------------------------------------------------

    const token = localStorage.getItem("token");

    if (!token) {
      guardarEnHistorial({
        monto,
        descripcion:
          form.descripcion.trim() ||
          "Transferencia entre cuentas",
        estado: "rechazada",
      });

      setMensaje("No hay una sesión activa.");

      return;
    }

    try {
      setLoading(true);

      // ---------------------------------------------------
      // ENVIAR TRANSFERENCIA
      // ---------------------------------------------------

      const res = await axios.post(
        `${API_BASE_URL}/transferencias/entre-cuentas`,
        {
          origen: form.origen,
          destino: form.destino,
          monto: monto,
          descripcion: form.descripcion.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ---------------------------------------------------
      // GUARDAR TRANSFERENCIA EXITOSA
      // ---------------------------------------------------

      guardarEnHistorial({
        monto,
        descripcion:
          form.descripcion.trim() ||
          "Transferencia entre cuentas",
        estado: "exitosa",
      });

      // ---------------------------------------------------
      // MENSAJE DE ÉXITO
      // ---------------------------------------------------

      setMensaje(
        res.data.mensaje ||
          "Transferencia realizada correctamente."
      );

      // ---------------------------------------------------
      // LIMPIAR FORMULARIO
      // ---------------------------------------------------

      setForm({
        origen: form.origen,
        destino: form.destino,
        monto: "",
        descripcion: "",
      });

      // ---------------------------------------------------
      // ACTUALIZAR SALDOS
      // ---------------------------------------------------

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
        descripcion:
          form.descripcion.trim() ||
          "Transferencia entre cuentas",
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
    <div className="panel-financiero">

      {/* =================================================
          BARRA LATERAL
      ================================================= */}

      <aside className="sidebar">
        <ul>

          {/* CUENTA */}

          <li>
            <Link
              to="/cuenta"
              className="active"
            >
              💷 Cuenta
            </Link>
          </li>

          {/* HISTORIAL */}

          <li>
            <Link to="/historial">
              📜 Historial Monetario
            </Link>
          </li>

          {/* REPORTES */}

          <li>
            <Link to="/reporte">
              📊 Reportes
            </Link>
          </li>

          {/* OTROS */}

          <li>
            <div
              className="menu-item"
              onClick={() =>
                setOpenTransfer(!openTransfer)
              }
            >
              💳 Otros{" "}
              {openTransfer ? "▲" : "▼"}
            </div>

            {openTransfer && (
              <ul className="submenu">

                <li>
                  <Link to="/transferencias">
                    ➡ Enviar dinero
                  </Link>
                </li>

                <li>
                  <Link to="/corriente">
                    🧾 Transferir
                  </Link>
                </li>

              </ul>
            )}
          </li>

          {/* CERTIFICADO */}

          <li>
            <button
              type="button"
              className="sidebar-link"
              onClick={() =>
                setOpenCertificado(true)
              }
            >
              📄 Certificado Bancario
            </button>
          </li>

          {/* AJUSTES */}

          <li>
            <Link
              to="/ajustes"
              className="btn-nav"
            >
              ⚙️ Ajustes
            </Link>
          </li>

          {/* ASISTENTE IA */}

          <li>
            <Link
              to="/ChatIA"
              className="btn-nav"
            >
              🤖 Asistente IA
            </Link>
          </li>

        </ul>

        {/* CERRAR SESIÓN */}

        <button
          className="logout"
          onClick={handleLogout}
        >
          🚪 Cerrar sesión
        </button>
      </aside>

      {/* =================================================
          CONTENIDO DE TRANSFERENCIA
      ================================================= */}

      <main className="transfer-container">

        <div className="transfer-card">

          <h2>
            Transferencia entre cuentas
          </h2>

          <form onSubmit={transferir}>

            {/* CUENTA ORIGEN */}

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

            {/* CUENTA DESTINO */}

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
                  {formatoMoneda(
                    saldoCorriente
                  )}
                </option>
              ) : (
                <option value="ahorro">
                  Cuenta de Ahorros -{" "}
                  {formatoMoneda(
                    saldoAhorro
                  )}
                </option>
              )}
            </select>

            {/* MONTO */}

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

            {/* SALDO DISPONIBLE */}

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

            {/* DESCRIPCIÓN */}

            <label>
              Descripción
            </label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={cambiarDescripcion}
              placeholder="Descripción de la transferencia"
            />

            {/* BOTÓN */}

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Procesando..."
                : "Realizar transferencia"}
            </button>

          </form>

          {/* MENSAJE */}

          {mensaje && (
            <p className="mensaje">
              {mensaje}
            </p>
          )}

          {/* VOLVER */}

          <Link
            to="/cuenta"
            className="volver"
          >
            Volver
          </Link>

        </div>

      </main>

      {/* =================================================
          MODAL CERTIFICADO
      ================================================= */}

      {openCertificado && (
        <div className="modal-overlay">

          <div className="modal-certificado">

            <h3>
              📄 Certificado Bancario
            </h3>

            <p>
              Aquí puedes consultar o descargar
              tu certificado bancario.
            </p>

            <button
              type="button"
              onClick={() =>
                setOpenCertificado(false)
              }
            >
              Cerrar
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

