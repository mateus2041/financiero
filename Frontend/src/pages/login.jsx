import React, { Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import Recuperacion from "./recuperacion";
import { normalizeLoginRole } from "../utils/helpers";
import "../styles/login.css";

const Registro = React.lazy(() => import("./registro"));

const obtenerMensajeError = (detalle) => {
  if (typeof detalle === "string") {
    return detalle;
  }

  if (Array.isArray(detalle)) {
    return detalle
      .map((error) => {
        const campo = Array.isArray(error.loc)
          ? error.loc.filter((parte) => parte !== "body").join(".")
          : "";
        const mensajeError = error.msg || error.message;
        return campo && mensajeError
          ? `${campo}: ${mensajeError}`
          : mensajeError || "";
      })
      .filter(Boolean)
      .join(" ");
  }

  return "El servidor rechazó los datos enviados.";
};

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
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  // Estados para verificación
  const [loginExitoso, setLoginExitoso] = useState(false);
  const [codigoVerificacionInput, setCodigoVerificacionInput] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [usuarioPendiente, setUsuarioPendiente] = useState(null);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);

  const rolActual = normalizeLoginRole(usuarioPendiente?.rol || rol);
  const textosAcceso = {
    usuario: {
      etiqueta: "usuario",
      destino: "tu cuenta",
      instruccion: "Ingresa el código de 4 dígitos enviado a tu correo para continuar a tu cuenta.",
      boton: "🏦 Entrar a mi cuenta",
    },
    administrador: {
      etiqueta: "administrador",
      destino: "el panel de administración",
      instruccion: "Ingresa el código de 4 dígitos enviado a tu correo para acceder al panel de administración.",
      boton: "🛡️ Entrar al panel de administración",
    },
    asesor: {
      etiqueta: "asesor bancario",
      destino: "el panel de asesor",
      instruccion: "Ingresa el código de 4 dígitos enviado a tu correo para acceder al panel de asesor.",
      boton: "💼 Entrar al panel de asesor",
    },
  }[rolActual] || {
    etiqueta: "usuario",
    destino: "tu cuenta",
    instruccion: "Ingresa el código de 4 dígitos enviado a tu correo para continuar a tu cuenta.",
    boton: "🏦 Entrar a mi cuenta",
  };

  const irRegistro = () => {
    setMostrarRegistro(true);
  };

  const irRecuperar = () => {
    setMostrarRecuperacion(true);
  };

  const solicitarVerificacion = () => {
    navigate("/verificacion-identidad");
  };

  const validarCodigoCuenta = async () => {
    if (!/^\d{4}$/.test(codigoVerificacionInput)) {
      setMensaje("❌ Ingresa un código de verificación de 4 dígitos.");
      return;
    }

    if (!challengeId || !usuarioPendiente) {
      setMensaje("❌ Inicia sesión nuevamente para solicitar otro código.");
      return;
    }

    setVerificandoCodigo(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/verificar-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge_id: challengeId,
          codigo: codigoVerificacionInput,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMensaje(`❌ ${data.detail || "No se pudo validar el código."}`);
        if (res.status === 410 || res.status === 429) {
          setLoginExitoso(false);
          setChallengeId("");
          setUsuarioPendiente(null);
          setCodigoVerificacionInput("");
        }
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "documento",
        usuarioPendiente.documento || documento || documentoAdministrador
      );
      localStorage.setItem("usuario_id", usuarioPendiente.id);
      localStorage.setItem("nombre_usuario", usuarioPendiente.nombre);
      localStorage.setItem("rol", normalizeLoginRole(usuarioPendiente.rol));
      if (usuarioPendiente.rol === "asesor") {
        localStorage.setItem("nombre_asesor", usuarioPendiente.nombre);
      }
      localStorage.removeItem("codigo_verificacion");

      setMensaje(`✅ Código correcto. Redirigiendo a ${textosAcceso.destino}...`);
      setTimeout(() => {
        const rolUsuario = normalizeLoginRole(usuarioPendiente.rol);
        navigate(
          rolUsuario === "asesor"
            ? "/asesor-bancario"
            : rolUsuario === "administrador"
              ? "/administradores"
              : "/cuenta"
        );
      }, 800);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error conectando con el servidor.");
    } finally {
      setVerificandoCodigo(false);
    }
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

    if (rol === "usuario" && (!documento.trim() || !password)) {
      setMensaje("Completa todos los campos");
      return;
    }

    try {
      setIniciandoSesion(true);
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
            : { documento: documento.trim(), password, rol }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        if (!esAsesor && !esAdministrador && data.detail === "Usuario no encontrado") {
          setMensaje(
            "No hay una cuenta registrada con ese documento. Regístrate primero."
          );
          return;
        }

        if (res.status === 503) {
          setMensaje(
            data.detail ||
              "No se pudo enviar el código de verificación. Inténtalo nuevamente."
          );
          return;
        }

        if (res.status === 422) {
          setMensaje(
            `No se pudieron validar los datos: ${obtenerMensajeError(data.detail)}`
          );
          return;
        }

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
              ? `❌ ${data.detail || "No se pudo validar el acceso del asesor"}`
              : data.detail || "Documento o contraseña incorrectos";

          setMensaje(
            `${mensajeError} (Intento ${nuevosIntentos} de 3)`
          );
        }

        return;
      }

      // Login exitoso
      setIntentos(0);
      setCodigoVerificacionInput("");
      setChallengeId(data.challenge_id || "");
      setUsuarioPendiente(data.usuario || null);
      setLoginExitoso(Boolean(data.challenge_id && data.usuario));
      setMensaje("✅ Se envió un código de verificación a tu correo.");
      localStorage.removeItem("token");
      localStorage.removeItem("codigo_verificacion");

      // Mostramos las opciones al usuario normal.

    } catch (error) {
      console.error(error);
      setMensaje(
        error instanceof SyntaxError
          ? "❌ El servidor devolvió una respuesta inválida"
          : "❌ Error conectando con el servidor"
      );
    } finally {
      setIniciandoSesion(false);
    }
  };

  return (
    <div className={isModal ? "container login-modal-container" : "container"}>
      <form className="form-box" onSubmit={manejarSubmit}>
        {!loginExitoso && (
          <>
            <h1>Inicio de Sesión</h1>

            {rol === "asesor" ? (
              <>
                <label htmlFor="email-asesor">Correo electrónico del asesor</label>
                <input
                  id="email-asesor"
                  type="email"
                  value={emailAsesor}
                  onChange={(e) => setEmailAsesor(e.target.value)}
                  disabled={bloqueado || iniciandoSesion}
                  placeholder="Ingresa tu correo electrónico"
                  autoComplete="email"
                />
                <label htmlFor="codigo-asesor">Código de asesor</label>
                <input
                  id="codigo-asesor"
                  type="password"
                  value={codigoAsesor}
                  onChange={(e) => setCodigoAsesor(e.target.value)}
                  disabled={bloqueado || iniciandoSesion}
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
                  disabled={bloqueado || iniciandoSesion}
                  placeholder="Ingresa tu número de documento"
                  autoComplete="username"
                />
                <label htmlFor="codigo-administrador">Código de administrador</label>
                <input
                  id="codigo-administrador"
                  type="password"
                  value={codigoAdministrador}
                  onChange={(e) => setCodigoAdministrador(e.target.value)}
                  disabled={bloqueado || iniciandoSesion}
                  placeholder="Ingresa tu código de administrador"
                  autoComplete="off"
                />
              </>
            ) : (
              <>
                <label htmlFor="documento-usuario">Número de documento</label>

                <div className="input-icon">
                  <input
                    id="documento-usuario"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]+"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    disabled={bloqueado || iniciandoSesion}
                    placeholder="Ingresa tu número de documento"
                    autoComplete="username"
                  />
                </div>

                <label htmlFor="login-password">Contraseña</label>

                <div className="input-icon">
                  <input
                    id="login-password"
                    type={mostrarPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={bloqueado || iniciandoSesion}
                    placeholder="Ingresa tu contraseña"
                  />

                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setMostrarPass(!mostrarPass)}
                    disabled={bloqueado || iniciandoSesion}
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
              onChange={(e) => {
                const nuevoRol = normalizeLoginRole(e.target.value);
                setRol(nuevoRol);
              }}
              disabled={bloqueado || iniciandoSesion}
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
              disabled={bloqueado || iniciandoSesion}
            >
              {bloqueado
                ? "Bloqueado"
                : iniciandoSesion
                  ? "Enviando código..."
                  : "Acceder"}
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
        )}

        {!loginExitoso && (
          <div className="footer">
            <p>
              © {new Date().getFullYear()} Financiero. Todos los derechos
              reservados.
            </p>
          </div>
        )}
      </form>

      {loginExitoso && (
        <div className="login-verification-overlay" role="presentation">
          <section
            className="login-verification-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-verification-title"
          >
            <h2 id="login-verification-title">Verificación de acceso</h2>
            <p>✅ Bienvenido, {usuarioPendiente?.nombre}</p>
            <p>Has iniciado sesión como {textosAcceso.etiqueta}.</p>
            <p>{textosAcceso.instruccion}</p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void validarCodigoCuenta();
              }}
            >
              <label htmlFor="codigo-verificacion-login">
                Código de verificación
              </label>
              <input
                id="codigo-verificacion-login"
                type="text"
                value={codigoVerificacionInput}
                onChange={(e) =>
                  setCodigoVerificacionInput(
                    e.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
                maxLength={4}
                inputMode="numeric"
                autoFocus
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
                type="submit"
                className="btn"
                disabled={verificandoCodigo}
              >
                {verificandoCodigo ? "Validando..." : textosAcceso.boton}
              </button>
            </form>

            {rolActual === "usuario" && (
              <button
                type="button"
                className="btn"
                onClick={solicitarVerificacion}
              >
                🪪 Solicitar verificación de identidad
              </button>
            )}
          </section>
        </div>
      )}

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

      {mostrarRegistro && (
        <div
          className="registro-login-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMostrarRegistro(false);
            }
          }}
        >
          <div
            className="registro-login-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Registro"
          >
            <button
              type="button"
              className="registro-login-close"
              aria-label="Cerrar registro"
              onClick={() => setMostrarRegistro(false)}
            >
              ×
            </button>
            <Suspense fallback={<p className="registro-login-loading">Cargando registro...</p>}>
              <Registro
                isModal
                onClose={() => setMostrarRegistro(false)}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
