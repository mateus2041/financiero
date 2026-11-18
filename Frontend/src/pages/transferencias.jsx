import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import AsistenteMovil from "../components/AsistenteMovil";
import { sanitizeLocalText } from "../utils/helpers";
import FinancialSidebar from "../components/FinancialSidebar";
import AssistantModal from "../components/AssistantModal";
import useResponsiveMenu from "../hooks/useResponsiveMenu";
import useModalDismissal from "../hooks/useModalDismissal";
import "../styles/corriente.css";
import "../styles/navegacionMovil.css";

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

  const [openCertificado, setOpenCertificado] = useState(false);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useResponsiveMenu();

  useModalDismissal(asistenteAbierto, setAsistenteAbierto, true);

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
    const historialGuardado = JSON.parse(
      localStorage.getItem(HISTORIAL_LOCAL_KEY) || "[]"
    );
    if (!Array.isArray(historialGuardado)) {
      throw new TypeError("El historial local debe ser una lista");
    }

    const historial = historialGuardado
      .filter((item) => item && typeof item === "object" && !Array.isArray(item))
      .filter((item) =>
        (typeof item.monto === "number" ||
          (typeof item.monto === "string" && item.monto.trim() !== "")) &&
        Number.isFinite(Number(item.monto)) &&
        Number(item.monto) >= 0
      )
      .map((item) => ({
        id_transaccion: sanitizeLocalText(item.id_transaccion, 100),
        tipo: sanitizeLocalText(item.tipo, 50),
        monto: Number(item.monto),
        origen: sanitizeLocalText(item.origen, 100),
        destino: sanitizeLocalText(item.destino, 200),
        descripcion: sanitizeLocalText(item.descripcion),
        estado: sanitizeLocalText(item.estado, 50),
        fecha: sanitizeLocalText(item.fecha, 64),
      }));

    localStorage.setItem(
      HISTORIAL_LOCAL_KEY,
      JSON.stringify([
        {
          id_transaccion: `local-${Date.now()}`,
          tipo: "Transferencia",
          monto: Number(transferencia.monto),
          origen: "Transferencia entre cuentas",
          destino: sanitizeLocalText(
            transferencia.destino ||
            (form.destino === "ahorro"
              ? "Cuenta de Ahorros"
              : "Cuenta Corriente"),
            200
          ),
          descripcion: sanitizeLocalText(transferencia.descripcion),
          estado: sanitizeLocalText(transferencia.estado, 50),
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
    void obtenerSaldos();
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

      <AsistenteMovil onClick={() => setAsistenteAbierto(true)} />

      <FinancialSidebar
        menuAbierto={menuAbierto}
        onLogout={handleLogout}
        onAssistantOpen={() => setAsistenteAbierto(true)}
      />

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

            <label htmlFor="transferencia-origen">
              {desdeAsistente
                ? "¿De qué cuenta quieres transferir?"
                : "Cuenta origen"}
            </label>

            <select
              id="transferencia-origen"
              ref={origenInputRef}
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

            <label htmlFor="transferencia-destino">
              Cuenta destino
            </label>

            <select
              id="transferencia-destino"
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

            <label htmlFor="transferencia-monto">
              {desdeAsistente ? "¿De cuánto será el monto?" : "Monto"}
            </label>

            <input
              id="transferencia-monto"
              ref={montoInputRef}
              type="text"
              name="monto"
              disabled={desdeAsistente && !form.origen}
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

            <label htmlFor="transferencia-descripcion">
              Descripción
            </label>

            <textarea
              id="transferencia-descripcion"
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
        <AssistantModal onClose={() => setAsistenteAbierto(false)} />
      )}

    </div>
  );
}
