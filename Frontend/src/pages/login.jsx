import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [codigoAsesor, setCodigoAsesor] = useState("");
  const [codigoAdministrador, setCodigoAdministrador] = useState("");
  const [rol, setRol] = useState("usuario");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);

  // Estados para verificación
  const [loginExitoso, setLoginExitoso] = useState(false);
  const [codigoVerificacionInput, setCodigoVerificacionInput] = useState("");
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);

  const irRegistro = () => {
    navigate("/registro");
  };

  const irRecuperar = () => {
    navigate("/recuperacion");
  };

  const solicitarVerificacion = () => {
    navigate("/verificacion-identidad");
  };

  const validarCodigoCuenta = () => {
    const codigoEsperado = localStorage.getItem("codigo_verificacion") || "";

    if (!/^\d{4}$/.test(codigoVerificacionInput)) {
      setMensaje("❌ Ingresa un código de verificación de 4 dígitos.");
      return;
    }

    if (codigoVerificacionInput !== codigoEsperado) {
      setMensaje("❌ El código de verificación no es correcto.");
      return;
    }

    setVerificandoCodigo(true);
    setMensaje("✅ Código correcto. Redirigiendo a tu cuenta...");

    setTimeout(() => {
      navigate("/cuenta");
    }, 800);
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();

    if (bloqueado) {
      setMensaje("Has superado los 3 intentos. Espera 30 segundos.");
      return;
    }

    if (rol === "asesor" && !codigoAsesor.trim()) {
      setMensaje("Ingresa el código de asesor");
      return;
    }

    if (rol === "administrador" && !codigoAdministrador.trim()) {
      setMensaje("Ingresa el código de administrador");
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
            ? { codigo_asesor: codigoAsesor }
            : esAdministrador
              ? { codigo_administrador: codigoAdministrador }
            : { documento, password, rol }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        const nuevosIntentos = intentos + 1;
        setIntentos(nuevosIntentos);

        if (nuevosIntentos >= 3) {
          setBloqueado(true);

          setMensaje(
            "❌ Has agotado los 3 intentos. Intenta nuevamente en 30 segundos."
          );

          setTimeout(() => {
            setBloqueado(false);
            setIntentos(0);
            setMensaje("");
          }, 30000);
        } else {
          setMensaje(
            `❌ ${data.detail || "Documento o contraseña incorrectos"} (Intento ${nuevosIntentos} de 3)`
          );
        }

        return;
      }

      // Login exitoso
      setIntentos(0);
      setLoginExitoso(!esAsesor && !esAdministrador);
      setMensaje(
        esAdministrador
          ? "✅ Acceso exitoso. Redirigiendo al panel de administradores..."
          : esAsesor
          ? "✅ Acceso exitoso. Redirigiendo al asesor bancario..."
          : data.codigo_verificacion
            ? "✅ Login exitoso. Se envió un código de verificación a tu correo."
            : "✅ Login exitoso"
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("documento", data.usuario.documento || documento);
      localStorage.setItem("usuario_id", data.usuario.id);
      localStorage.setItem("nombre_usuario", data.usuario.nombre);
      localStorage.setItem("rol", data.usuario.rol || "usuario");
      if (data.codigo_verificacion) {
        localStorage.setItem("codigo_verificacion", data.codigo_verificacion);
      }

      if (esAsesor && data.usuario.rol === "asesor") {
        navigate("/asesor-bancario");
        return;
      }

      if (esAdministrador && data.usuario.rol === "administrador") {
        navigate("/administradores");
        return;
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
    <div className="container">
      <form className="form-box" onSubmit={manejarSubmit}>
        <h1>Inicio de Sesión</h1>

        {!loginExitoso ? (
          <>
            {rol === "asesor" ? (
              <>
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
                  : "usuario"}.
              </p>

              <p>
                Ingresa el código de 4 dígitos enviado a tu correo para
                continuar a tu cuenta.
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

              <button
                type="button"
                className="btn"
                onClick={solicitarVerificacion}
                style={{ marginTop: "10px" }}
              >
                🪪 Solicitar verificación de identidad
              </button>
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
    </div>
  );
}

export default Login;
