import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/registro.css";

function Registro() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);

  const [tipo, setTipo] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");

  // Nuevos campos
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [barrio, setBarrio] = useState("");
  const [codigoCorrespondencia, setCodigoCorrespondencia] = useState("");

  const [mensaje, setMensaje] = useState("");

  const siguiente = () => {
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

    setMensaje("");
    setPaso(2);
  };

  const registrar = async () => {
    if (
      !direccion ||
      !localidad ||
      !barrio ||
      !codigoCorrespondencia
    ) {
      setMensaje("Completa todos los campos");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          documento,
          telefono,
          password,
          tipo_documento: tipo,
          direccion,
          localidad,
          barrio,
          codigo_correspondencia: codigoCorrespondencia,
        }),
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

        {paso === 1 && (
          <>
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
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="">Seleccione documento</option>
              <option value="cc">Cédula</option>
              <option value="ti">Tarjeta de Identidad</option>
              <option value="ce">Cédula de Extranjería</option>
            </select>

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

            <button className="btn" onClick={siguiente}>
              Siguiente
            </button>
          </>
        )}

        {paso === 2 && (
          <>
            <label>Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />

            <label>Localidad</label>
            <input
              type="text"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
            />

            <label>Barrio</label>
            <input
              type="text"
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
            />

            <label>Código de correspondencia</label>
            <input
              type="text"
              value={codigoCorrespondencia}
              onChange={(e) =>
                setCodigoCorrespondencia(e.target.value)
              }
            />

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                className="btn"
                onClick={() => setPaso(1)}
              >
                Atrás
              </button>

              <button
                className="btn"
                onClick={registrar}
              >
                Registrar
              </button>
            </div>
          </>
        )}

        {mensaje && (
          <p
            style={{
              color: mensaje.includes("✅") ? "green" : "red",
              fontWeight: "bold",
              marginTop: "15px",
            }}
          >
            {mensaje}
          </p>
        )}

        <div className="footer">
          <p>
            © {new Date().getFullYear()} Financiero. Todos los
            términos de confidencialidad.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registro;