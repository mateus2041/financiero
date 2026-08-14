import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ajustes.css";

function AjustesPerfil() {
  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    direccion: "",
  });

  const [editando, setEditando] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const token = localStorage.getItem("token");

        const respuesta = await fetch("http://127.0.0.1:8000/usuario", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!respuesta.ok) {
          throw new Error(
            "No se pudo obtener la información del usuario."
          );
        }

        const data = await respuesta.json();

        setUsuario({
          nombre: data.nombre || "",
          correo: data.correo || data.email || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
        });
      } catch (error) {
        console.error(error);
        alert("Error al cargar los datos del usuario.");
      }
    };

    obtenerUsuario();
  }, []);

  const editarPerfil = () => {
    setEditando(true);
  };

  const guardarCambios = async () => {
    if (!password) {
      alert("Debes ingresar tu contraseña para guardar los cambios.");
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
            ...usuario,
            password: password,
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.detail || "No se pudo actualizar el perfil."
        );
      }

      alert("Perfil actualizado correctamente.");

      setPassword("");
      setEditando(false);
    } catch (error) {
      console.error(error);
      alert(error.message || "Error al actualizar el perfil.");
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
        disabled={!editando}
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

      {editando && (
        <>
          <label>Contraseña</label>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </>
      )}

      {!editando ? (
        <button type="button" onClick={editarPerfil}>
          Editar
        </button>
      ) : (
        <button type="button" onClick={guardarCambios}>
          Guardar cambios
        </button>
      )}
    </div>
  );
}

export default AjustesPerfil;