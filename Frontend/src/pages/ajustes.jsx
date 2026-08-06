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
          throw new Error("No se pudo obtener la información del usuario.");
        }

        const data = await respuesta.json();
        setUsuario(data);
      } catch (error) {
        console.error(error);
        alert("Error al cargar los datos del usuario.");
      }
    };

    obtenerUsuario();
  }, []);

  const guardarCambios = async () => {
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
          body: JSON.stringify(usuario),
        }
      );

      if (!respuesta.ok) {
        throw new Error("No se pudo actualizar el perfil.");
      }

      alert("Perfil actualizado correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el perfil.");
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
        onChange={(e) =>
          setUsuario({ ...usuario, nombre: e.target.value })
        }
      />

      <label>Correo</label>
      <input
        type="email"
        placeholder="Correo"
        value={usuario.correo}
        onChange={(e) =>
          setUsuario({ ...usuario, correo: e.target.value })
        }
      />

      <label>Teléfono</label>
      <input
        type="text"
        placeholder="Teléfono"
        value={usuario.telefono}
        onChange={(e) =>
          setUsuario({ ...usuario, telefono: e.target.value })
        }
      />

      <label>Dirección</label>
      <input
        type="text"
        placeholder="Dirección"
        value={usuario.direccion}
        onChange={(e) =>
          setUsuario({ ...usuario, direccion: e.target.value })
        }
      />

      <button type="button" onClick={guardarCambios}>
        Guardar Cambios
      </button>
    </div>
  );
}

export default AjustesPerfil;