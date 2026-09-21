import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Recuperacion from "./recuperacion";
import "../styles/login.css";

function Login({ isModal = false }) {
  const navigate = useNavigate();

  const [documento, setDocumento] = useState("");
  const [documentoAdministrador, setDocumentoAdministrador] = useState("");
  const [password, setPassword] = useState("");
  const [emailAsesor, setEmailAsesor] = useState("");
  const [codigoAsesor, setCodigoAsesor] = useState("");
  const [codigoAdministrador, setCodigoAdministrador] = useState("");
  const [rol, setRol] = useState("usuario");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarEnlaceRecuperacion, setMostrarEnlaceRecuperacion] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);

  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);

  // Estados para verificación
  const [loginExitoso, setLoginExitoso] = useState(false);
  const [codigoVerificacionInput, setCodigoVerificacionInput] = useState("");
  const [codigoVerificacionEsperado, setCodigoVerificacionEsperado] = useState("");
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);

  const irRegistro = () => {
    navigate("/registro");
  };

  const irRecuperar = () => {
    setMostrarRecuperacion(true);
  };

  const solicitarVerificacion = () => {
    navigate("/verificacion-identidad");
  };

  const validarCodigoCuenta = () => {
    if (!/^\d{4}$/.test(codigoVerificacionInput)) {
      setMensaje("❌ Ingresa un código de verificación de 4 dígitos.");
      return;
    }

    if (codigoVerificacionInput !== codigoVerificacionEsperado) {
      setMensaje("❌ El código de verificación no es correcto.");
      return;
    }

    setVerificandoCodigo(true);
    setMensaje(
      `✅ Código correcto. Redirigiendo a ${localStorage.getItem("rol") === "asesor" ? "tu panel de asesor" : "tu cuenta"}...`
    );

    setTimeout(() => {
      const rolUsuario = localStorage.getItem("rol");
      navigate(
        rolUsuario === "asesor"
          ? "/asesor-bancario"
          : rolUsuario === "administrador"
            ? "/administradores"
            : "/cuenta"
      );
    }, 800);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (bloqueado) {
      setMensaje("Has superado los 3 intentos. Espera 30 segundos.");
      return;
    }

    if (rol === "asesor" && (!emailAsesor.trim() || !codigoAsesor.trim())) {
      setMensaje("Ingresa el correo y el código del asesor");
      return;
    }

    if (
      rol === "administrador" &&
      (!documentoAdministrador.trim() || !codigoAdministrador.trim())
    ) {
      setMensaje("Ingresa el documento y el código de administrador");
      return;
    }

    if (rol === "usuario" && (!documento || !password)) {
      setMensaje("Completa todos los campos");
      return;
    }

    try {
      const esAsesor = rol === "asesor";
      const esAdministrador = rol === "administrador";
      const res = await fetch(
        `http://127.0.0.1:8000/${esAsesor ? "asesor-login" : esAdministrador ? "administrador-login" : "login"}`,
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          esAsesor
            ? { email: emailAsesor, codigo_asesor: codigoAsesor }
            : esAdministrador
              ? {
                  documento: documentoAdministrador,
                  codigo_administrador: codigoAdministrador,
                }
            : { documento, password, rol }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario_id");
        localStorage.removeItem("documento");
        localStorage.removeItem("rol");

        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);

        if (nuevosIntentos >= 3) {
          setBloqueado(true);
          setMostrarEnlaceRecuperacion(true);

          setMensaje(
            "❌ Has agotado los 3 intentos. Intenta nuevamente en 30 segundos."
          );

          setTimeout(() => {
            setBloqueado(false);
            setIntentos(0);
            setMensaje("");
            setMostrarEnlaceRecuperacion(false);
          }, 30000);
        } else {
          setMostrarEnlaceRecuperacion(false);
          const mensajeError =
            esAsesor && res.status === 401
              ? "❌ El asesor está inactivo o el código no es válido. Solo los asesores activos pueden ingresar."
              : data.detail || "Documento o contraseña incorrectos";

          setMensaje(
            `${mensajeError} (Intento ${nuevosIntentos} de 3)`
          );
        }

        return;
      }

      // Login exitoso
      setIntentos(0);
      setCodigoVerificacionEsperado(data.codigo_verificacion || "");
      setCodigoVerificacionInput("");
      setLoginExitoso(Boolean(data.codigo_verificacion));
      setMensaje(
        esAdministrador
          ? data.codigo_verificacion
            ? "✅ Acceso exitoso. Se envió un código de verificación a tu correo."
            : "❌ El servidor no devolvió el código de verificación. Reinicia el backend e inténtalo nuevamente."
          : esAsesor
          ? data.codigo_verificacion
            ? "✅ Acceso exitoso. Se envió un código de verificación a tu correo."
            : "❌ El servidor no devolvió el código de verificación. Reinicia el backend e inténtalo nuevamente."
          : data.codigo_verificacion
            ? "✅ Login exitoso. Se envió un código de verificación a tu correo."
            : "✅ Login exitoso"
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "documento",
        data.usuario.documento || documento || documentoAdministrador
      );
      localStorage.setItem("usuario_id", data.usuario.id);
      localStorage.setItem("nombre_usuario", data.usuario.nombre);
      localStorage.setItem("rol", data.usuario.rol || "usuario");
      if (esAsesor) {
        localStorage.setItem("nombre_asesor", data.usuario.nombre);
      }
      if (data.codigo_verificacion) {
        localStorage.setItem("codigo_verificacion", data.codigo_verificacion);
      }

      // Mostramos las opciones al usuario normal.

    } catch (error) {
      console.error(error);
      setMensaje(
        error instanceof SyntaxError
          ? "❌ El servidor devolvió una respuesta inválida"
          : "❌ Error conectando con el servidor"
      );
    }
  };

  return (
    <div className={isModal ? "container login-modal-container" : "container"}>
      <form className="form-box" onSubmit={manejarSubmit}>
        <h1>Inicio de Sesión</h1>

        {!loginExitoso ? (
          <>
            {rol === "asesor" ? (
              <>
                <label htmlFor="email-asesor">Correo electrónico del asesor</label>
                <input
                  id="email-asesor"
                  type="email"
                  value={emailAsesor}
                  onChange={(e) => setEmailAsesor(e.target.value)}
                  disabled={bloqueado}
                  placeholder="Ingresa tu correo electrónico"
                  autoComplete="email"
                />
                <label htmlFor="codigo-asesor">Código de asesor</label>
                <input
                  id="codigo-asesor"
                  type="text"
                  value={codigoAsesor}
                  onChange={(e) => setCodigoAsesor(e.target.value)}
                  disabled={bloqueado}
                  placeholder="Ingresa tu código de asesor"
                  autoComplete="off"
                />
              </>
            ) : rol === "administrador" ? (
              <>
                <label htmlFor="documento-administrador">Número de documento</label>
                <input
                  id="documento-administrador"
                  type="text"
                  value={documentoAdministrador}
                  onChange={(e) => setDocumentoAdministrador(e.target.value)}
                  disabled={bloqueado}
                  placeholder="Ingresa tu número de documento"
                  autoComplete="username"
                />
                <label htmlFor="codigo-administrador">Código de administrador</label>
                <input
                  id="codigo-administrador"
                  type="password"
                  value={codigoAdministrador}
                  onChange={(e) => setCodigoAdministrador(e.target.value)}
                  disabled={bloqueado}
                  placeholder="Ingresa tu código de administrador"
                  autoComplete="off"
                />
              </>
            ) : (
              <>
                <label>Documento</label>

                <div className="input-icon">
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    disabled={bloqueado}
                    placeholder="Ingresa tu documento"
                  />
                </div>

                <label>Contraseña</label>

                <div className="input-icon">
                  <input
                    type={mostrarPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={bloqueado}
                    placeholder="Ingresa tu contraseña"
                  />

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    disabled={bloqueado}
                  >
                    {mostrarPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </>
            )}

            <label htmlFor="rol">Tipo de acceso</label>
            <select
              id="rol"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              disabled={bloqueado}
            >
              <option value="usuario">Usuario</option>
              <option value="asesor">Asesor bancario</option>
              <option value="administrador">Administrador</option>
            </select>

            {mensaje && (
              <p
                style={{
                  color: mensaje.includes("Login exitoso")
                    ? "green"
                    : "#ff4c4c",
                  fontWeight: "bold",
                  marginTop: "10px",
                }}
              >
                {mensaje}
              </p>
            )}

            {mostrarEnlaceRecuperacion && (
              <p className="login" style={{ marginTop: "10px" }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    irRecuperar();
                  }}
                  style={{ color: "#0d6efd", fontWeight: "bold" }}
                >
                  Recupera tu contraseña aquí
                </a>
              </p>
            )}

            <button
              type="submit"
              className="btn"
              disabled={bloqueado}
            >
              {bloqueado ? "Bloqueado" : "Acceder"}
            </button>

            <p className="login">
              ¿No tienes cuenta?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  irRegistro();
                }}
              >
                Regístrate aquí
              </a>
            </p>

            <p className="login">
              ¿Olvidaste tu contraseña?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  irRecuperar();
                }}
              >
                Recupérala aquí
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="login-success">
              <h2>✅ Bienvenido, {localStorage.getItem("nombre_usuario")}</h2>

              <p>
                Has iniciado sesión como{" "}
                  {localStorage.getItem("rol") === "asesor"
                  ? "asesor bancario"
                  : localStorage.getItem("rol") === "administrador"
                    ? "administrador"
                    : "usuario"}.
              </p>

              <p>
                Ingresa el código de 4 dígitos enviado a tu correo para continuar.
              </p>

              <label>Código de verificación</label>
              <input
                type="text"
                value={codigoVerificacionInput}
                onChange={(e) =>
                  setCodigoVerificacionInput(
                    e.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
                placeholder="0000"
                maxLength={4}
                inputMode="numeric"
                style={{ textAlign: "center", letterSpacing: "0.5rem" }}
              />

              {mensaje && (
                <p
                  style={{
                    color: mensaje.includes("✅") ? "green" : "#ff4c4c",
                    fontWeight: "bold",
                    marginTop: "10px",
                  }}
                >
                  {mensaje}
                </p>
              )}

              <button
                type="button"
                className="btn"
                onClick={validarCodigoCuenta}
                disabled={verificandoCodigo}
              >
                {verificandoCodigo ? "Validando..." : "🏦 Entrar a mi cuenta"}
              </button>

              {localStorage.getItem("rol") !== "asesor" && (
                <button
                  type="button"
                  className="btn"
                  onClick={solicitarVerificacion}
                  style={{ marginTop: "10px" }}
                >
                  🪪 Solicitar verificación de identidad
                </button>
              )}
            </div>
          </>
        )}

        <div className="footer">
          <p>
            © {new Date().getFullYear()} Financiero. Todos los derechos
            reservados.
          </p>
        </div>
      </form>

      {mostrarRecuperacion && (
        <div
          className="recovery-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMostrarRecuperacion(false);
            }
          }}
        >
          <div
            className="recovery-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recovery-modal-title"
          >
            <button
              type="button"
              className="recovery-modal-close"
              aria-label="Cerrar recuperación de contraseña"
              onClick={() => setMostrarRecuperacion(false)}
            >
              ×
            </button>
            <Recuperacion
              isModal
              onClose={() => setMostrarRecuperacion(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
