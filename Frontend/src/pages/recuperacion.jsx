import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/recuperacion.css";

function Recuperacion({ isModal = false, onClose }) {
  const [paso, setPaso] = useState(1);
  const [documento, setDocumento] = useState("");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [ultimosDigitos, setUltimosDigitos] = useState("");
  const [fechaExpiracion, setFechaExpiracion] = useState("");
  const [codigoSeguridad, setCodigoSeguridad] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/recuperar-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documento,
          email: correo,
        }),
      });

      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.detail || "No fue posible enviar el código.");
      setPaso(2);
      setMensaje("Si los datos coinciden, recibirás un código en tu correo.");
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    }
  };

  const verificarCodigo = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/verificar-codigo-recuperacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documento, codigo }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.detail || "El código no es válido.");
      setToken(data.token);
      setPaso(3);
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      const verificacionTarjeta = await fetch("http://127.0.0.1:8000/verificar-tarjeta-recuperacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ultimos_digitos: ultimosDigitos,
          fecha_expiracion: fechaExpiracion,
          codigo_seguridad: codigoSeguridad,
        }),
      });
      const dataVerificacion = await verificacionTarjeta.json();
      if (!verificacionTarjeta.ok) {
        throw new Error(dataVerificacion.detail || "Los dígitos de la tarjeta no son válidos.");
      }

      setPaso(4);
      setMensaje("Datos de la tarjeta verificados correctamente.");
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    }
  };

  const actualizarPassword = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {

      const respuesta = await fetch("http://127.0.0.1:8000/restablecer-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nueva_password: password }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.detail || "No fue posible cambiar la contraseña.");
      setMensaje("Contraseña actualizada correctamente.");
      setPaso(5);
    } catch (err) {
      setError(err.message || "Error de conexión con el servidor.");
    }
  };

  return (
    <div className={isModal ? "recovery-modal-content" : "recovery-container"}>
      <div className="recovery-form-box">
        <h1 id={isModal ? "recovery-modal-title" : undefined}>Recuperar contraseña</h1>

        {paso === 1 && <>
          <p>Ingresa tu documento y correo registrado para recibir un código temporal.</p>
          <form onSubmit={enviarCodigo}>
            <label>Número de documento</label>
            <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} required />
            <label>Correo electrónico</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            <button type="submit" className="btn">Enviar código</button>
          </form>
        </>}

        {paso === 2 && <>
          <p>Escribe el código de 6 dígitos enviado a tu correo.</p>
          <form onSubmit={verificarCodigo}>
            <label>Código temporal</label>
            <input type="text" inputMode="numeric" maxLength="6" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} required />
            <button type="submit" className="btn">Verificar código</button>
          </form>
        </>}

        {paso === 3 && <>
          <p>Verifica los datos de tu tarjeta para continuar.</p>
          <form onSubmit={cambiarPassword}>
            <label>6 últimos dígitos de la tarjeta</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              pattern="[0-9]{6}"
              value={ultimosDigitos}
              onChange={(e) => setUltimosDigitos(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
            <label>Fecha de expiración de la tarjeta</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="5"
              placeholder="MM/AA"
              value={fechaExpiracion}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, "").slice(0, 4);
                setFechaExpiracion(valor.length > 2 ? `${valor.slice(0, 2)}/${valor.slice(2)}` : valor);
              }}
              required
            />
            <label>Código de seguridad (CVV)</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="3"
              pattern="[0-9]{3}"
              value={codigoSeguridad}
              onChange={(e) => setCodigoSeguridad(e.target.value.replace(/\D/g, "").slice(0, 3))}
              required
            />
            <button type="submit" className="btn">Siguiente</button>
          </form>
        </>}

        {paso === 4 && <>
          <p>Ingresa la nueva contraseña de tu cuenta.</p>
          <form onSubmit={actualizarPassword}>
            <label>Nueva contraseña</label>
            <input
              type="password"
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn">Actualizar contraseña</button>
          </form>
        </>}

        {mensaje && <p className="message">{mensaje}</p>}

        {error && <p className="error">{error}</p>}

        {(paso === 1 || paso === 5) && (
          <div className="back-login">
            {isModal ? (
              <button type="button" onClick={onClose}>Cerrar</button>
            ) : (
              <Link to="/login">Volver al inicio de sesión</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Recuperacion;