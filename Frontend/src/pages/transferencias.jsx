import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/transferencias.css";

const API_URL = "http://localhost:8000";

export default function Transferencias() {
  const [form, setForm] = useState({
    origen: "Cuenta de Ahorros",
    destino: "",
    monto: "",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const [cuentas, setCuentas] = useState([]);

  const token = localStorage.getItem("token");
  const headers = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const saldoAhorros = cuentas.find((cuenta) => cuenta.tipo === "ahorros")?.saldo || 0;
  const saldoCorriente = cuentas.find((cuenta) => cuenta.tipo === "corriente")?.saldo || 0;

  // Formato de dinero colombiano
  const formatoDinero = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const obtenerDetalleError = (error, fallback) => {
    const detalle = error.response?.data?.detail;

    if (Array.isArray(detalle)) {
      return detalle.map((item) => item.msg).join(" ");
    }

    return detalle || fallback;
  };

  const cargarCuentas = async () => {
    const response = await axios.get(`${API_URL}/cuentas/mis-cuentas`, { headers });
    setCuentas(response.data);
  };

  useEffect(() => {
    cargarCuentas().catch(() => setMensaje("No se pudieron cargar las cuentas."));
  }, []);

  // ==============================
  // REPORTAR TRANSACCIÓN FALLIDA
  // ==============================
  const reportarTransaccionFallida = async (motivo) => {
    try {
      await axios.post(
        `${API_URL}/reportes/transaccion-fallida`,
        {
          origen: form.origen,
          destino: form.destino,
          monto: parseFloat(form.monto) || 0,
          descripcion: form.descripcion,
          motivo: motivo,
        },
        { headers }
      );

      console.log("Reporte registrado correctamente");
    } catch (error) {
      console.error(
        "Error al registrar el reporte:",
        error
      );
    }
  };

  // ==============================
  // REALIZAR TRANSFERENCIA
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");

    // Validar campos
    const destino = form.destino.trim();
    const monto = Number(form.monto);

    if (!destino || !form.monto) {
      const motivo = "Todos los campos son obligatorios.";

      setMensaje(motivo);

      await reportarTransaccionFallida(motivo);

      return;
    }

    // Validar monto
    if (!Number.isInteger(Number(destino)) || Number(destino) <= 0) {
      const motivo = "La cuenta destino debe ser un número válido.";

      setMensaje(motivo);

      await reportarTransaccionFallida(motivo);

      return;
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      const motivo = "El monto debe ser mayor que cero.";

      setMensaje(motivo);

      await reportarTransaccionFallida(motivo);

      return;
    }

    // ==============================
    // VALIDAR SI LA CUENTA EXISTE
    // ==============================
    try {
      setLoading(true);

      const cuentaResponse = await axios.get(
        `${API_URL}/cuentas/existe/${destino}`,
        { headers }
      );

      if (!cuentaResponse.data.existe) {
        const motivo = "La cuenta destino no existe.";

        setMensaje(motivo);

        await reportarTransaccionFallida(motivo);

        return;
      }

      setMensaje(
        "La cuenta destino existe. Procesando transferencia..."
      );

      // ==============================
      // REALIZAR TRANSFERENCIA
      // ==============================
      const response = await axios.post(
        `${API_URL}/transferencias`,
        {
          origen: form.origen,
          destino: Number(destino),
          monto,
          descripcion: form.descripcion,
        },
        { headers }
      );

      // Transferencia exitosa
      setMensaje(
        response.data.mensaje ||
          "Transferencia realizada correctamente."
      );

      // Limpiar formulario
      setForm({
        origen: "Cuenta de Ahorros",
        destino: "",
        monto: "",
        descripcion: "",
      });

      await cargarCuentas();

    } catch (error) {
      // Obtener motivo del error
      const motivo =
        obtenerDetalleError(
          error,
          "La transferencia no pudo ser procesada."
        );

      // Mostrar mensaje
      setMensaje(
        `Transacción fallida: ${motivo}`
      );

      // Guardar reporte
      await reportarTransaccionFallida(motivo);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-container">

      <div className="transfer-card">

        <h2>Transferencias Bancarias</h2>

        <form onSubmit={handleSubmit}>

          {/* CUENTA ORIGEN */}
          <div className="input-group">

            <label>Cuenta Origen</label>

            <select
              name="origen"
              value={form.origen}
              onChange={handleChange}
            >

              <option value="Cuenta de Ahorros">
                Cuenta de Ahorros (
                {formatoDinero(saldoAhorros)}
                )
              </option>

              <option value="Cuenta Corriente">
                Cuenta Corriente (
                {formatoDinero(saldoCorriente)}
                )
              </option>

            </select>

          </div>

          {/* CUENTA DESTINO */}
          <div className="input-group">

            <label>Cuenta Destino</label>

            <select
              name="destino"
              value={form.destino}
              onChange={handleChange}
            >

              <option value="" disabled>
                Seleccione una cuenta destino
              </option>

              {cuentas.map((cuenta) => (
                <option key={cuenta.id} value={cuenta.id}>
                  {cuenta.tipo === "ahorros"
                    ? "Cuenta de Ahorros"
                    : "Cuenta Corriente"} ({cuenta.id})
                </option>
              ))}

            </select>

          </div>

          {/* MONTO */}
          <div className="input-group">

            <label>Monto</label>

            <input
              type="text"
              name="monto"
              value={
                form.monto
                  ? formatoDinero(form.monto)
                  : ""
              }
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, "");

                setForm({
                  ...form,
                  monto: valor,
                });
              }}
              placeholder="$0"
            />

          </div>

          {/* DESCRIPCIÓN */}
          <div className="input-group">

            <label>Descripción</label>

            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Ingrese una descripción"
            />

          </div>

          {/* BOTÓN */}
          <button
            className="btn-transferir"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Procesando..."
              : "Transferir"}

          </button>

        </form>

        {/* MENSAJE */}
        {mensaje && (
          <p className="mensaje">
            {mensaje}
          </p>
        )}

      </div>

    </div>
  );
}