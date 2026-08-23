import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/corriente.css";

const API_BASE_URL = "http://localhost:8000";
const HISTORIAL_LOCAL_KEY = "historial_transferencias";

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

  // =====================================================
  // GUARDAR EN HISTORIAL LOCAL
  // =====================================================

  const guardarEnHistorial = (transferencia) => {

    const historial = JSON.parse(
      localStorage.getItem(HISTORIAL_LOCAL_KEY) || "[]"
    );

    const nuevaTransferencia = {
      id_transaccion: `local-${Date.now()}`,
      tipo: "Transferencia",
      monto: transferencia.monto,
      descripcion:
        transferencia.descripcion || "Transferencia Bre-B",
      estado: transferencia.estado,
      fecha: new Date().toISOString(),
      referencia: transferencia.referencia || "",
    };

    localStorage.setItem(
      HISTORIAL_LOCAL_KEY,
      JSON.stringify([
        nuevaTransferencia,
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

    obtenerSaldos();

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

    if (name === "origen") {

      setDestinatario("");
      setMensaje("");

    }

    if (name === "llave") {

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

  };

  // =====================================================
  // CONSULTAR LLAVE BRE-B
  // =====================================================

  const consultarLlave = async () => {

    const llave = form.llave.trim();

    if (!llave) {

      setMensaje(
        "Ingrese una llave Bre-B."
      );

      return;
    }

    try {

      setConsultando(true);
      setMensaje("");
      setDestinatario("");

      const token = localStorage.getItem("token");

      if (!token) {

        setMensaje(
          "No hay una sesión activa."
        );

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

      setDestinatario(
        res.data.nombre
      );

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

    // ===================================================
    // VALIDAR LLAVE
    // ===================================================

    if (!form.llave.trim()) {

      guardarEnHistorial({
        monto: Number(form.monto) || 0,
        descripcion:
          form.descripcion.trim() ||
          "Transferencia Bre-B",
        estado: "rechazada",
      });

      setMensaje(
        "Ingrese la llave Bre-B del destinatario."
      );

      return;
    }

    // ===================================================
    // VALIDAR DESTINATARIO
    // ===================================================

    if (!destinatario) {

      guardarEnHistorial({
        monto: Number(form.monto) || 0,
        descripcion:
          form.descripcion.trim() ||
          "Transferencia Bre-B",
        estado: "rechazada",
      });

      setMensaje(
        "Primero debe consultar la llave Bre-B."
      );

      return;
    }

    // ===================================================
    // VALIDAR MONTO
    // ===================================================

    const monto = Number(form.monto);

    if (!monto || monto <= 0) {

      guardarEnHistorial({
        monto: monto || 0,
        descripcion:
          "Transferencia Bre-B",
        estado: "rechazada",
      });

      setMensaje(
        "Ingrese un monto válido."
      );

      return;
    }

    // ===================================================
    // OBTENER SALDO
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
        descripcion:
          form.descripcion.trim() ||
          "Transferencia Bre-B",
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

    try {

      setLoading(true);

      const token =
        localStorage.getItem("token");

      if (!token) {

        guardarEnHistorial({
          monto,
          descripcion:
            form.descripcion.trim() ||
            "Transferencia Bre-B",
          estado: "rechazada",
        });

        setMensaje(
          "No hay una sesión activa."
        );

        return;
      }

      // =================================================
      // ENVIAR TRANSFERENCIA
      // =================================================

      const res = await axios.post(
        `${API_BASE_URL}/transferencias/bre-b`,
        {
          origen: form.origen,

          llave_destino:
            form.llave.trim(),

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
      // GUARDAR TRANSFERENCIA EXITOSA
      // =================================================

      guardarEnHistorial({
        monto: monto,

        descripcion:
          form.descripcion.trim() ||
          "Transferencia Bre-B",

        estado: "procesada",

        referencia:
          res.data.referencia || "",
      });

      // =================================================
      // MENSAJE DE ÉXITO
      // =================================================

      setMensaje(
        res.data.mensaje ||
        "Transferencia realizada correctamente."
      );

      // =================================================
      // LIMPIAR FORMULARIO
      // =================================================

      setForm({
        origen: form.origen,
        llave: "",
        monto: "",
        descripcion: "",
      });

      setDestinatario("");

      // =================================================
      // ACTUALIZAR SALDOS
      // =================================================

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
        descripcion:
          form.descripcion.trim() ||
          "Transferencia Bre-B",
        estado: "rechazada",
      });

      setMensaje(detalle);

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
          Transferencia Bre-B
        </h2>

        <form onSubmit={transferir}>

          {/* =================================================
              CUENTA ORIGEN
          ================================================= */}

          <label>
            Cuenta origen
          </label>

          <select
            name="origen"
            value={form.origen}
            onChange={cambiar}
          >

            <option value="corriente">

              Cuenta Corriente (
              {formatoMoneda(
                saldoCorriente
              )}
              )

            </option>

            <option value="ahorro">

              Cuenta de Ahorros (
              {formatoMoneda(
                saldoAhorro
              )}
              )

            </option>

          </select>

          {/* =================================================
              LLAVE BRE-B
          ================================================= */}

          <label>
            Llave Bre-B del destinatario
          </label>

          <input
            type="text"
            name="llave"
            value={form.llave}
            onChange={cambiar}
            placeholder="Ej: @maria456"
            required
          />

          {/* =================================================
              CONSULTAR DESTINATARIO
          ================================================= */}

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

          {/* =================================================
              DESTINATARIO
          ================================================= */}

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

            Saldo disponible:

            {" "}

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
            onChange={cambiar}
            placeholder="Descripción de la transferencia"
          />

          {/* =================================================
              BOTÓN TRANSFERIR
          ================================================= */}

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