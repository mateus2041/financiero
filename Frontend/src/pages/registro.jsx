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

  // 🔥 NUEVO STATE MENSAJE
  const [mensaje, setMensaje] = useState("");

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
          telefono,
          tipo_documento: tipo   // 🔥 IMPORTANTE (lo que faltaba del backend)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.detail);
        return;
      }

      // ✅ MENSAJE DE ÉXITO
      setMensaje("Usuario creado ✅");

      // opcional: redirigir después de 1.5s
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(error);
      setMensaje("Error conectando con el servidor");
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

        <button className="btn" onClick={registrar}>
          Registrar
        </button>

        {/* 🔥 MENSAJE EN PANTALLA */}
        {mensaje && (
          <p style={{ marginTop: "10px", color: "green" }}>
            {mensaje}
          </p>
        )}

      </div>
    </div>
  );
}

export default Registro;