import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ajustes.css";

function AjustesPerfil() {
  const [usuario, setUsuario] = useState(null);
  const [direccion, setDireccion] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerPerfil();
  }, []);

  const obtenerPerfil = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:8000/perfil", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsuario(res.data);
      setDireccion(res.data.direccion || "");
    } catch (error) {
      console.error(error);
      alert("Error al cargar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  const guardarDireccion = async () => {
    if (direccion.trim() === "") {
      alert("Ingrese una dirección válida.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        "http://localhost:8000/perfil/direccion",
        {
          direccion: direccion,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsuario({
        ...usuario,
        direccion,
      });

      alert("✅ Dirección actualizada correctamente.");
    } catch (error) {
      console.error(error);
      alert("Error al actualizar la dirección.");
    }
  };

  if (loading) {
    return <h2>Cargando...</h2>;
  }

  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <h2>Ajustes de Perfil</h2>

        <div className="campo">
          <label>Nombre</label>
          <input
            type="text"
            value={usuario?.nombre || ""}
            disabled
          />
        </div>

        <div className="campo">
          <label>Documento</label>
          <input
            type="text"
            value={usuario?.documento || ""}
            disabled
          />
        </div>

        <div className="campo">
          <label>Correo</label>
          <input
            type="email"
            value={usuario?.email || ""}
            disabled
          />
        </div>

        <div className="campo">
          <label>Teléfono</label>
          <input
            type="text"
            value={usuario?.telefono || ""}
            disabled
          />
        </div>

        <div className="campo">
          <label>Dirección</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
          />
        </div>

        <button onClick={guardarDireccion}>
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

export default AjustesPerfil;