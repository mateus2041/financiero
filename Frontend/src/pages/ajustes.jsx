import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/ajustes.css";

function AjustesPerfil() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    llave_bre_b: "",
    tope_ahorros: 0,
    tope_corriente: 0,
  });

  const [editando, setEditando] = useState(false);
  const [password, setPassword] = useState("");
  const [guardandoLlave, setGuardandoLlave] = useState(false);
  const [mensajeLlave, setMensajeLlave] = useState("");
  const [mensajePerfil, setMensajePerfil] = useState("");

  const [fotoPerfil, setFotoPerfil] = useState(
    () => localStorage.getItem("fotoPerfil") || ""
  );

  const [openTransfer, setOpenTransfer] = useState(false);
  const [openCertificado, setOpenCertificado] = useState(false);

  // =====================================================
  // CAMBIAR FOTO DE PERFIL
  // =====================================================

  const cambiarFotoPerfil = (evento) => {
    const archivo = evento.target.files?.[0];

    if (!archivo) {
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      setMensajePerfil("Selecciona un archivo de imagen válido.");
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setMensajePerfil("La imagen no puede superar los 2 MB.");
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      const foto = lector.result;

      setFotoPerfil(foto);
      localStorage.setItem("fotoPerfil", foto);

      window.dispatchEvent(new Event("fotoPerfilCambio"));

      setMensajePerfil(
        "Foto de perfil actualizada automáticamente."
      );
    };

    lector.readAsDataURL(archivo);

    evento.target.value = "";
  };

  // =====================================================
  // QUITAR FOTO DE PERFIL
  // =====================================================

  const quitarFotoPerfil = () => {
    setFotoPerfil("");

    localStorage.removeItem("fotoPerfil");

    window.dispatchEvent(new Event("fotoPerfilCambio"));

    setMensajePerfil("Foto de perfil eliminada.");
  };

  // =====================================================
  // VOLVER
  // =====================================================

  const volver = () => {
    navigate("/cuenta");
  };

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("documento");
    localStorage.removeItem("usuario_id");

    navigate("/login");
  };

  // =====================================================
  // OBTENER INFORMACIÓN DEL USUARIO
  // =====================================================

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("No hay una sesión iniciada.");
          navigate("/login");
          return;
        }

        const respuesta = await fetch(
          "http://127.0.0.1:8000/usuario",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            data.detail ||
              "No se pudo obtener la información del usuario."
          );
        }

        console.log("Información recibida:", data);

        setUsuario({
          nombre: data.nombre || "",
          correo: data.correo || data.email || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          llave_bre_b: data.llave_bre_b || "",
          tope_ahorros: data.tope_ahorros || 0,
          tope_corriente: data.tope_corriente || 0,
        });
      } catch (error) {
        console.error(error);

        alert(
          error.message ||
            "Error al cargar los datos del usuario."
        );
      }
    };

    obtenerUsuario();
  }, [navigate]);

  // =====================================================
  // EDITAR PERFIL
  // =====================================================

  const editarPerfil = () => {
    setEditando(true);
  };

  // =====================================================
  // GUARDAR LLAVE BRE-B
  // =====================================================

  const guardarLlaveBreB = async () => {
    const llave = usuario.llave_bre_b.trim();

    if (llave.length < 4) {
      setMensajeLlave(
        "La llave Bre-B debe tener mínimo 4 caracteres."
      );
      return;
    }

    try {
      setGuardandoLlave(true);
      setMensajeLlave("");

      const respuesta = await fetch(
        "http://127.0.0.1:8000/bre-b/llave",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            llave,
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.detail ||
            "No se pudo registrar la llave Bre-B."
        );
      }

      setUsuario((usuarioActual) => ({
        ...usuarioActual,
        llave_bre_b: data.llave || llave,
      }));

      setMensajeLlave(
        data.mensaje ||
          "Llave Bre-B registrada correctamente."
      );
    } catch (error) {
      setMensajeLlave(
        error.message ||
          "Error al registrar la llave Bre-B."
      );
    } finally {
      setGuardandoLlave(false);
    }
  };

  // =====================================================
  // GUARDAR CAMBIOS DEL PERFIL
  // =====================================================

  const guardarCambios = async () => {
    setMensajePerfil("");

    if (!password) {
      setMensajePerfil(
        "Debes ingresar tu contraseña para guardar los cambios."
      );
      return;
    }

    if (
      Number(usuario.tope_ahorros) < 0 ||
      Number(usuario.tope_corriente) < 0
    ) {
      setMensajePerfil(
        "Los topes no pueden ser negativos."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const respuesta = await fetch(
        "http://127.0.0.1:8000/usuario/perfil",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nombre: usuario.nombre,
            email: usuario.correo,
            telefono: usuario.telefono,
            direccion: usuario.direccion,
            tope_ahorros: Number(usuario.tope_ahorros),
            tope_corriente: Number(usuario.tope_corriente),
            password: password,
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.detail ||
            "No se pudo actualizar el perfil."
        );
      }

      setMensajePerfil(
        "Perfil actualizado correctamente."
      );

      setUsuario((usuarioActual) => ({
        ...usuarioActual,

        nombre:
          data.usuario?.nombre ??
          usuarioActual.nombre,

        correo:
          data.usuario?.email ??
          usuarioActual.correo,

        telefono:
          data.usuario?.telefono ??
          usuarioActual.telefono,

        direccion:
          data.usuario?.direccion ??
          usuarioActual.direccion,

        tope_ahorros:
          data.usuario?.tope_ahorros ??
          usuarioActual.tope_ahorros,

        tope_corriente:
          data.usuario?.tope_corriente ??
          usuarioActual.tope_corriente,
      }));

      setPassword("");
      setEditando(false);
    } catch (error) {
      console.error(error);

      setMensajePerfil(
        error.message ||
          "Error al actualizar el perfil."
      );
    }
  };

  // =====================================================
  // VISTA
  // =====================================================

  return (
    <div className="panel-financiero">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <ul>

          <li>
            <Link
              to="/cuenta"
              className="active"
            >
              💷 Cuenta
            </Link>
          </li>

          <li>
            <Link to="/historial">
              📜 Historial Monetario
            </Link>
          </li>

          <li>
            <Link to="/reporte">
              📜 Reportes
            </Link>
          </li>

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

          <li>
            <Link
              to="/ajustes"
              className="btn-nav"
            >
              ⚙️ Ajustes
            </Link>
          </li>

          <li>
            <Link
              to="/ChatIA"
              className="btn-nav"
            >
              🤖 Asistente IA
            </Link>
          </li>

        </ul>

        <button
          className="logout"
          onClick={handleLogout}
        >
          🚪 Cerrar sesión
        </button>

      </aside>

      {/* =====================================================
          CONTENIDO DE AJUSTES
      ===================================================== */}

      <main className="perfil-container">

        <h1>Ajustes del Perfil</h1>

        {/* FOTO DE PERFIL */}

        <section
          className="foto-perfil-section"
          aria-labelledby="foto-perfil-titulo"
        >

          <div className="foto-perfil-preview">

            {fotoPerfil ? (
              <img
                src={fotoPerfil}
                alt="Foto de perfil"
              />
            ) : (
              <span>
                {usuario.nombre
                  ?.charAt(0)
                  .toUpperCase() || "U"}
              </span>
            )}

          </div>

          <div className="foto-perfil-info">

            <h2 id="foto-perfil-titulo">
              Foto de perfil
            </h2>

            <p>
              Elige una imagen para personalizar tu
              perfil. Se guarda automáticamente.
            </p>

            <div className="foto-perfil-actions">

              <label
                className="boton-foto"
                htmlFor="foto-perfil"
              >
                Cambiar foto
              </label>

              {fotoPerfil && (
                <button
                  type="button"
                  className="boton-quitar-foto"
                  onClick={quitarFotoPerfil}
                >
                  Quitar foto
                </button>
              )}

            </div>

            <input
              id="foto-perfil"
              className="input-foto-oculto"
              type="file"
              accept="image/*"
              onChange={cambiarFotoPerfil}
            />

          </div>

        </section>

        {/* NOMBRE */}

        <label>Nombre</label>

        <input
          type="text"
          placeholder="Nombre"
          value={usuario.nombre}
          disabled
          onChange={(e) =>
            setUsuario({
              ...usuario,
              nombre: e.target.value,
            })
          }
        />

        {/* CORREO */}

        <label>Correo</label>

        <input
          type="email"
          placeholder="Correo"
          value={usuario.correo}
          disabled={!editando}
          onChange={(e) =>
            setUsuario({
              ...usuario,
              correo: e.target.value,
            })
          }
        />

        {/* TELÉFONO */}

        <label>Teléfono</label>

        <input
          type="text"
          placeholder="Teléfono"
          value={usuario.telefono}
          disabled={!editando}
          onChange={(e) =>
            setUsuario({
              ...usuario,
              telefono: e.target.value,
            })
          }
        />

        {/* DIRECCIÓN */}

        <label>Dirección</label>

        <input
          type="text"
          placeholder="Dirección"
          value={usuario.direccion}
          disabled={!editando}
          onChange={(e) =>
            setUsuario({
              ...usuario,
              direccion: e.target.value,
            })
          }
        />

        {/* LLAVE BRE-B */}

        <label>Tu llave Bre-B</label>

        <input
          type="text"
          placeholder="Ej: 3001234567"
          value={usuario.llave_bre_b}
          disabled={!editando}
          onChange={(e) =>
            setUsuario({
              ...usuario,
              llave_bre_b: e.target.value,
            })
          }
        />

        {editando && (
          <button
            type="button"
            onClick={guardarLlaveBreB}
            disabled={guardandoLlave}
          >
            {guardandoLlave
              ? "Guardando..."
              : "Guardar llave Bre-B"}
          </button>
        )}

        {mensajeLlave && (
          <p>{mensajeLlave}</p>
        )}

        {/* TOPE AHORROS */}

        <label>
          Tope cuenta de ahorros
        </label>

        <input
          type="number"
          placeholder="Tope de cuenta de ahorros"
          value={usuario.tope_ahorros}
          disabled={!editando}
          min="0"
          onChange={(e) =>
            setUsuario({
              ...usuario,
              tope_ahorros: e.target.value,
            })
          }
        />

        {/* TOPE CORRIENTE */}

        <label>
          Tope cuenta corriente
        </label>

        <input
          type="number"
          placeholder="Tope de cuenta corriente"
          value={usuario.tope_corriente}
          disabled={!editando}
          min="0"
          onChange={(e) =>
            setUsuario({
              ...usuario,
              tope_corriente: e.target.value,
            })
          }
        />

        {/* CONTRASEÑA */}

        {editando && (
          <>
            <label>Contraseña</label>

            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </>
        )}

        {/* ACCIONES */}

        <div className="acciones-perfil">

          <button
            type="button"
            className="boton-volver"
            onClick={volver}
          >
            Volver
          </button>

          {!editando ? (
            <button
              type="button"
              onClick={editarPerfil}
            >
              Editar
            </button>
          ) : (
            <button
              type="button"
              onClick={guardarCambios}
            >
              Guardar cambios
            </button>
          )}

        </div>

        {mensajePerfil && (
          <p>{mensajePerfil}</p>
        )}

      </main>

      {/* =====================================================
          CERTIFICADO BANCARIO
      ===================================================== */}

      {openCertificado && (
        <div className="modal-certificado">

          <div className="modal-certificado-contenido">

            <h2>
              Certificado Bancario
            </h2>

            <p>
              Puedes consultar tu certificado bancario
              desde la sección correspondiente.
            </p>

            <button
              type="button"
              onClick={() => {
                setOpenCertificado(false);
                navigate("/certificado");
              }}
            >
              Ir al certificado
            </button>

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

export default AjustesPerfil;
