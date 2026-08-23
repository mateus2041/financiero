import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ajustes.css";

function AjustesPerfil() {
  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
    tope_ahorros: 0,
    tope_corriente: 0,
  });

  const [editando, setEditando] = useState(false);
  const [password, setPassword] = useState("");
  const [llaveBreB, setLlaveBreB] = useState("");
  const [guardandoLlave, setGuardandoLlave] = useState(false);
  const [mensajeLlave, setMensajeLlave] = useState("");
  const [mensajePerfil, setMensajePerfil] = useState("");

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          alert("No hay una sesión iniciada.");
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
        setLlaveBreB(data.llave_bre_b || "");
      } catch (error) {
        console.error(error);
        alert(
          error.message ||
            "Error al cargar los datos del usuario."
        );
      }
    };

    obtenerUsuario();
  }, []);

  const editarPerfil = () => {
    setEditando(true);
  };

  const guardarLlaveBreB = async () => {
    const llave = llaveBreB.trim();

    if (llave.length < 4) {
      setMensajeLlave("La llave Bre-B debe tener mínimo 4 caracteres.");
      return;
    }

    try {
      setGuardandoLlave(true);
      setMensajeLlave("");
      const respuesta = await fetch("http://127.0.0.1:8000/bre-b/llave", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ llave }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.detail || "No se pudo registrar la llave Bre-B.");
      }

      setLlaveBreB(data.llave || llave);
      setMensajeLlave(data.mensaje || "Llave Bre-B registrada correctamente.");
    } catch (error) {
      setMensajeLlave(error.message || "Error al registrar la llave Bre-B.");
    } finally {
      setGuardandoLlave(false);
    }
  };

  const guardarCambios = async () => {
    setMensajePerfil("");

    if (!password) {
      setMensajePerfil("Debes ingresar tu contraseña para guardar los cambios.");
      return;
    }

    if (usuario.tope_ahorros < 0 || usuario.tope_corriente < 0) {
      setMensajePerfil("Los topes no pueden ser negativos.");
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

      setMensajePerfil("Perfil actualizado correctamente.");

      setUsuario((usuarioActual) => ({
        ...usuarioActual,
        nombre: data.usuario?.nombre ?? usuarioActual.nombre,
        correo: data.usuario?.email ?? usuarioActual.correo,
        telefono: data.usuario?.telefono ?? usuarioActual.telefono,
        direccion: data.usuario?.direccion ?? usuarioActual.direccion,
        tope_ahorros: data.usuario?.tope_ahorros ?? usuarioActual.tope_ahorros,
        tope_corriente: data.usuario?.tope_corriente ?? usuarioActual.tope_corriente,
      }));
      setPassword("");
      setEditando(false);
    } catch (error) {
      console.error(error);
      setMensajePerfil(error.message || "Error al actualizar el perfil.");
    }
  };

  return (
    <div className="perfil-container">

      <h1>Ajustes del Perfil</h1>

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

      <label>Tu llave Bre-B</label>

      <input
        type="text"
        placeholder="Ej: 3001234567"
        value={llaveBreB}
        disabled={!editando}
        onChange={(e) => setLlaveBreB(e.target.value)}
      />

      {editando && (
        <button
          type="button"
          onClick={guardarLlaveBreB}
          disabled={guardandoLlave}
        >
          {guardandoLlave ? "Guardando..." : "Guardar llave Bre-B"}
        </button>
      )}

      {mensajeLlave && <p>{mensajeLlave}</p>}

      <label>Tope cuenta de ahorros</label>

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

      <label>Tope cuenta corriente</label>

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

      {mensajePerfil && <p>{mensajePerfil}</p>}

    </div>
  );
}

export default AjustesPerfil;