import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/registro.css";

function Registro() {
  const [tipo, setTipo] = useState("");

  // 🔥 NUEVOS STATES
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  // 🔥 FUNCIÓN PARA ENVIAR
  const registrar = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre,
          email,
          documento,
          password,
          telefono
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail);
        return;
      }

      alert("Usuario creado ✅");
      navigate("/login");

    } catch (error) {
      console.error(error);
      alert("Error conectando con el servidor");
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h1>REGISTRO</h1>

        <label>Nombre completo</label>
        <input type="text" onChange={(e) => setNombre(e.target.value)} />

        <label>Correo electrónico</label>
        <input type="email" onChange={(e) => setEmail(e.target.value)} />

        <label>Tipo de documento</label>
        <div className="input-box">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Seleccione documento</option>
            <option value="cc">Cédula</option>
            <option value="ti">Tarjeta</option>
            <option value="ce">Extranjería</option>
          </select>
        </div>

        <label>Número de documento</label>
        <input type="text" onChange={(e) => setDocumento(e.target.value)} />

        <label>Número teléfono</label>
        <input type="text" onChange={(e) => setTelefono(e.target.value)} />

        <label>Contraseña</label>
        <input type="password" onChange={(e) => setPassword(e.target.value)} />

        {/* 🔥 CAMBIO AQUÍ */}
        <button className="btn" onClick={registrar}>
          Registrar
        </button>

      </div>
    </div>
  );
}

export default Registro;