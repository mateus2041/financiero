import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/registro.css";

function Registro() {
  const [tipo, setTipo] = useState("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();

  const registrar = async () => {
    if (
      !nombre ||
      !email ||
      !tipo ||
      !documento ||
      !telefono ||
      !password
    ) {
      setMensaje("Completa todos los campos");
      return;
    }

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
          tipo_documento: tipo
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.detail);
        return;
      }

      setMensaje("Usuario creado ✅");

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
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <label>Correo electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Tipo de documento</label>
        <div className="input-box">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Seleccione documento</option>
            <option value="cc">Cédula</option>
            <option value="ti">Tarjeta de Identidad</option>
            <option value="ce">Cédula de Extranjería</option>
          </select>
        </div>

        <label>Número de documento</label>
        <input
          type="text"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
        />

        <label>Número teléfono</label>
        <input
          type="text"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />

        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Mensaje de error o éxito */}
        {mensaje && (
          <p
            id="mensajeError"
            style={{
              color: mensaje.includes("✅") ? "green" : "#ff4c4c",
              fontWeight: "bold",
              marginTop: "10px"
            }}
          >
            {mensaje}
          </p>
        )}

        <button className="btn" onClick={registrar}>
          Registrar
        </button>

        <div className="footer">
          <p>
            © {new Date().getFullYear()} Financiero. Todos los termisnos de confidelizacion.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registro;