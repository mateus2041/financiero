import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import AsistenteMovil from "../components/AsistenteMovil";
import FinancialSidebar from "../components/FinancialSidebar";
import AssistantModal from "../components/AssistantModal";
import useResponsiveMenu from "../hooks/useResponsiveMenu";
import useModalDismissal from "../hooks/useModalDismissal";
import {
  sanitizeLocalText,
  sanitizeLocalTransfer,
} from "../utils/helpers";
import "../styles/corriente.css";
import "../styles/navegacionMovil.css";

const API_BASE_URL = "http://localhost:8000";
const HISTORIAL_LOCAL_KEY = "historial_transferencias";

export default function Transferencia() {
  const location = useLocation();
  const llaveInputRef = useRef(null);

  const [form, setForm] = useState({
    origen: location.state?.origen === "ahorro" ? "ahorro" : "corriente",
    llave:
      typeof location.state?.llaveInicial === "string"
        ? location.state.llaveInicial.trim()
        : "",
    monto: "",
    descripcion: "",
  });

  const [saldoCorriente, setSaldoCorriente] = useState(0);
  const [saldoAhorro, setSaldoAhorro] = useState(0);

  const [destinatario, setDestinatario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [consultando, setConsultando] = useState(false);

  const [openCertificado, setOpenCertificado] = useState(false);
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useResponsiveMenu();

  useModalDismissal(asistenteAbierto, setAsistenteAbierto, true);

  useEffect(() => {
    if (
      typeof location.state?.llaveInicial === "string" &&
      location.state.llaveInicial.trim()
    ) {
      llaveInputRef.current?.focus();
    }
  }, [location.state]);

  // =====================================================
  // GUARDAR EN HISTORIAL LOCAL
  // =====================================================

  const guardarEnHistorial = (transferencia) => {
    const historialGuardado = JSON.parse(
      localStorage.getItem(HISTORIAL_LOCAL_KEY) || "[]"
    );
    if (!Array.isArray(historialGuardado)) {
      throw new TypeError("El historial local no contiene una lista");
    }
    const historial = historialGuardado
      .map(sanitizeLocalTransfer)
      .filter(Boolean);

    const nuevaTransferencia = {
      id_transaccion: `local-${Date.now()}`,
      tipo: "Transferencia",
      monto: sanitizeLocalText(String(transferencia.monto ?? ""), 32),
      origen: "Llave Bre-B",
      destino: sanitizeLocalText(String(transferencia.destino || (
        destinatario && form.llave.trim()
          ? `${destinatario} (Llave Bre-B: ${form.llave.trim()})`
          : form.llave.trim()
            ? `Llave Bre-B: ${form.llave.trim()}`
            : "Destinatario Bre-B"
      )), 255),
      descripcion:
        sanitizeLocalText(
          transferencia.descripcion || "Transferencia Bre-B",
          255
        ),
      estado: sanitizeLocalText(String(transferencia.estado ?? ""), 30),
      fecha: new Date().toISOString(),
      referencia: sanitizeLocalText(
        String(transferencia.referencia || ""),
        100
      ),
    };

    localStorage.setItem(
      HISTORIAL_LOCAL_KEY,
      JSON.stringify([
        sanitizeLocalTransfer(nuevaTransferencia),
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
      console.error(
        "Error obteniendo saldos:",
        err
      );

      if (err.response) {
        setMensaje(
          err.response.data.detail ||
            "No se pudieron obtener los saldos."
        );
      } else {
        setMensaje(
          "Error al conectar con el servidor."
        );
      }
    }
  };

  // =====================================================
  // CARGAR SALDOS
  // =====================================================

  useEffect(() => {
    void obtenerSaldos();
  }, []);

  // =====================================================
  // CAMBIAR CAMPOS
  // =====================================================

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "origen" || name === "llave") {
      setDestinatario("");
      setMensaje("");
    }
  };

  // =====================================================
  // CAMBIAR MONTO
  // =====================================================

  const cambiarMonto = (e) => {
    const valor = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      monto: valor,
    }));

    setMensaje("");
  };

  // =====================================================
  // CONSULTAR LLAVE BRE-B
  // =====================================================

  const consultarLlave = async () => {
    const llave = form.llave.trim();

    if (!llave) {
      setMensaje("Ingrese una llave Bre-B.");
      return;
    }

    try {
      setConsultando(true);
      setMensaje("");
      setDestinatario("");

      const token = localStorage.getItem("token");

      if (!token) {
        setMensaje("No hay una sesión activa.");
        return;
      }

      const res = await axios.get(
        `${API_BASE_URL}/bre-b/consultar/${encodeURIComponent(
          llave
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDestinatario(res.data.nombre);

      setMensaje(
        "Destinatario encontrado correctamente."
      );
    } catch (err) {
      console.error(
        "Error consultando llave:",
        err
      );

      if (err.response) {
        setMensaje(
          err.response.data.detail ||
            "No se encontró la llave Bre-B."
        );
      } else {
        setMensaje(
          "Error al conectar con el servidor."
        );
      }

      setDestinatario("");
    } finally {
      setConsultando(false);
    }
  };

  // =====================================================
  // REALIZAR TRANSFERENCIA
  // =====================================================

  const transferir = async (e) => {
    e.preventDefault();

    setMensaje("");

    const descripcion =
      form.descripcion.trim() ||
      "Transferencia Bre-B";

    if (!form.llave.trim()) {
      guardarEnHistorial({
        monto: Number(form.monto) || 0,
        descripcion,
        estado: "rechazada",
      });

      setMensaje(
        "Ingrese la llave Bre-B del destinatario."
      );

      return;
    }

    if (!destinatario) {
      guardarEnHistorial({
        monto: Number(form.monto) || 0,
        descripcion,
        estado: "rechazada",
      });

      setMensaje(
        "Primero debe consultar la llave Bre-B."
      );

      return;
    }

    const monto = Number(form.monto);

    if (!monto || monto <= 0) {
      guardarEnHistorial({
        monto: monto || 0,
        descripcion,
        estado: "rechazada",
      });

      setMensaje("Ingrese un monto válido.");

      return;
    }

    const saldoDisponible =
      form.origen === "corriente"
        ? saldoCorriente
        : saldoAhorro;

    if (monto > saldoDisponible) {
      guardarEnHistorial({
        monto,
        descripcion,
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

    const token = localStorage.getItem("token");

    if (!token) {
      guardarEnHistorial({
        monto,
        descripcion,
        estado: "rechazada",
      });

      setMensaje("No hay una sesión activa.");

      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE_URL}/transferencias/bre-b`,
        {
          origen: form.origen,
          llave_destino: form.llave.trim(),
          monto,
          descripcion,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      guardarEnHistorial({
        monto,
        descripcion,
        estado: "procesada",
        referencia: res.data.referencia || "",
      });

      setMensaje(
        res.data.mensaje ||
          "Transferencia realizada correctamente."
      );

      setForm({
        origen: form.origen,
        llave: "",
        monto: "",
        descripcion: "",
      });

      setDestinatario("");

      await obtenerSaldos();
    } catch (err) {
      console.error(
        "Error realizando transferencia:",
        err
      );

      const detalle = err.response
        ? err.response.data.detail ||
          "Error al realizar la transferencia."
        : "Error al conectar con el servidor.";

      guardarEnHistorial({
        monto,
        descripcion,
        estado: "rechazada",
      });

      setMensaje(detalle);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
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
        reportLabel="📊 Reportes"
        showCardLink={false}
      />

      {/* =================================================
          CONTENIDO DE TRANSFERENCIA
      ================================================= */}

      <main className="transfer-container">

        <div className="transfer-card">

          <h2>
            Transferencia Bre-B
          </h2>

          <form onSubmit={transferir}>

            <label htmlFor="transferencia-cuenta-origen">
              Cuenta origen
            </label>

            <select
              id="transferencia-cuenta-origen"
              name="origen"
              value={form.origen}
              onChange={cambiar}
            >
              <option value="corriente">
                Cuenta Corriente (
                {formatoMoneda(saldoCorriente)}
                )
              </option>

              <option value="ahorro">
                Cuenta de Ahorros (
                {formatoMoneda(saldoAhorro)}
                )
              </option>
            </select>

            <label htmlFor="transferencia-llave-destino">
              Llave Bre-B del destinatario
            </label>

            <input
              id="transferencia-llave-destino"
              ref={llaveInputRef}
              type="text"
              name="llave"
              value={form.llave}
              onChange={cambiar}
              placeholder="Ej: @maria456"
              required
            />

            <button
              type="button"
              onClick={consultarLlave}
              disabled={
                consultando ||
                !form.llave.trim()
              }
            >
              {consultando
                ? "Consultando..."
                : "Consultar destinatario"}
            </button>

            {destinatario && (
              <div className="destinatario">

                <strong>
                  Destinatario:
                </strong>

                <span>
                  {destinatario}
                </span>

              </div>
            )}

            <label htmlFor="transferencia-monto">
              Monto
            </label>

            <input
              id="transferencia-monto"
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

            <div className="saldo-cuenta">
              Saldo disponible:{" "}
              {formatoMoneda(
                form.origen === "corriente"
                  ? saldoCorriente
                  : saldoAhorro
              )}
            </div>

            <label htmlFor="transferencia-descripcion">
              Descripción
            </label>

            <textarea
              id="transferencia-descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={cambiar}
              placeholder="Descripción de la transferencia"
            />

            <button
              type="submit"
              disabled={
                loading ||
                consultando ||
                !destinatario
              }
            >
              {loading
                ? "Procesando..."
                : "Transferir por Bre-B"}
            </button>

          </form>

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

      </main>

      {openCertificado && (
        <div className="modal-overlay">

          <div className="modal-certificado">

            <h3>
              📄 Certificado Bancario
            </h3>

            <p>
              Aquí puedes consultar tu
              certificado bancario.
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