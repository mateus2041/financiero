import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import ChatIA from "./ChatIA";
import "../styles/corriente.css";

const API_BASE_URL = "http://127.0.0.1:8000";
const HISTORIAL_LOCAL_KEY = "historial_transferencias";

export default function Transferencia() {
  const location = useLocation();
  const montoInicial = location.state?.monto;
  const desdeAsistente = location.state?.desdeAsistente === true;
  const origenInicial =
    location.state?.origen === "corriente" ||
    location.state?.origen === "ahorro"
      ? location.state.origen
      : "";
  const montoInputRef = useRef(null);
  const origenInputRef = useRef(null);

  // =====================================================
  // ESTADOS DEL MENÚ
  // =====================================================

  const [openTransfer, setOpenTransfer] = useState(false);
  const [openCertificado, setOpenCertificado] = useState(false);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    if (!asistenteAbierto) return undefined;

    const overflowAnterior = document.body.style.overflow;
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") setAsistenteAbierto(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [asistenteAbierto]);

  useEffect(() => {
    const actualizarEstadoMenu = () => {
      setMenuAbierto(window.innerWidth > 768);
    };

    actualizarEstadoMenu();
    window.addEventListener("resize", actualizarEstadoMenu);

    return () => window.removeEventListener("resize", actualizarEstadoMenu);
  }, []);

  useEffect(() => {
    if (!desdeAsistente) return;

    setForm((actual) => ({
      ...actual,
      origen: origenInicial,
      destino:
        origenInicial === "corriente"
          ? "ahorro"
          : origenInicial === "ahorro"
            ? "corriente"
            : "",
      monto:
        Number.isSafeInteger(montoInicial) && montoInicial > 0
          ? String(montoInicial)
          : actual.monto,
    }));
  }, [desdeAsistente, location.key, montoInicial, origenInicial]);

  // =====================================================
  // FORMULARIO
  // =====================================================

  const [form, setForm] = useState({
    origen: desdeAsistente ? origenInicial : "corriente",
    destino: desdeAsistente
      ? origenInicial === "corriente"
        ? "ahorro"
        : origenInicial === "ahorro"
          ? "corriente"
          : ""
      : "ahorro",
    monto:
      Number.isSafeInteger(montoInicial) && montoInicial > 0
        ? String(montoInicial)
        : "",
    descripcion: "",
  });

  useEffect(() => {
    if (desdeAsistente) {
      if (form.origen) {
        montoInputRef.current?.focus();
      } else {
        origenInputRef.current?.focus();
      }
    }
  }, [desdeAsistente, form.origen]);

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

    window.location.href = "/";
  };

  // =====================================================
  // REALIZAR TRANSFERENCIA
  // =====================================================

  const transferir = async (e) => {
    e.preventDefault();

    setMensaje("");

    if (!form.origen) {
      setMensaje("Seleccione la cuenta de origen.");
      origenInputRef.current?.focus();
      return;
    }

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

      <button
        type="button"
        className={`menu-hamburguesa ${menuAbierto ? "activo" : ""}`}
        onClick={() => setMenuAbierto((actual) => !actual)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
      >
        ☰
      </button>

      {/* =================================================
          BARRA LATERAL
      ================================================= */}

      <aside className={`sidebar ${menuAbierto ? "sidebar-abierto" : "sidebar-cerrado"}`}>
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

                <li>
                  <Link to="/transferencias-scr">
                    📤 Registrar Llave Bre-B
                  </Link>
                </li>

              </ul>
            )}
          </li>

          {/* CERTIFICADO */}

          <li>
            <Link
              className="sidebar-link"
              to="/certificado"
            >
              📄 Certificado Bancario
            </Link>
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
            <button
              type="button"
              className="btn-nav"
              onClick={() => setAsistenteAbierto(true)}
            >
              🤖 Asistente IA
            </button>
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

          {desdeAsistente && (
            <p>
              {form.origen
                ? "Cuenta de origen seleccionada. Ingresa el monto que quieres transferir."
                : "Selecciona primero la cuenta de origen y luego ingresa el monto que quieres transferir."}
            </p>
          )}

          <form onSubmit={transferir}>

            {/* CUENTA ORIGEN */}

            <label>
              {desdeAsistente
                ? "¿De qué cuenta quieres transferir?"
                : "Cuenta origen"}
            </label>

            <select
              ref={origenInputRef}
              autoFocus={desdeAsistente}
              value={form.origen}
              onChange={cambiarOrigen}
              required
            >
              {desdeAsistente && <option value="">Selecciona una cuenta</option>}
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
              {!form.destino ? (
                <option value="">Se mostrará al elegir el origen</option>
              ) : form.destino === "corriente" ? (
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
              {desdeAsistente ? "¿De cuánto será el monto?" : "Monto"}
            </label>

            <input
              ref={montoInputRef}
              type="text"
              name="monto"
              disabled={desdeAsistente && !form.origen}
              autoFocus={desdeAsistente}
              value={
                form.monto
                  ? formatoMoneda(
                      Number(form.monto)
                    )
                  : ""
              }
              onChange={cambiarMonto}
              placeholder={desdeAsistente ? "Ingresa el monto en pesos" : "$0"}
              required
            />

            {/* SALDO DISPONIBLE */}

            <div className="saldo-disponible">
              {form.origen ? (
                <>
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
                </>
              ) : (
                "Selecciona una cuenta de origen para continuar."
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

      {asistenteAbierto && (
        <div
          className="asistente-modal-overlay"
          onClick={() => setAsistenteAbierto(false)}
        >
          <div
            className="asistente-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asistente-titulo"
            onClick={(event) => event.stopPropagation()}
          >
            <ChatIA onClose={() => setAsistenteAbierto(false)} />
          </div>
        </div>
      )}

    </div>
  );
}
