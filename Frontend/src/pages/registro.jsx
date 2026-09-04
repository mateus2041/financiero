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
  const [ciudad, setCiudad] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [barrio, setBarrio] = useState("");
  const [codigoCorrespondencia, setCodigoCorrespondencia] = useState("");
  const [codigoRegistro, setCodigoRegistro] = useState("");

  const [mensaje, setMensaje] = useState("");

  const ubicacionesPorCiudad = {
    Bogotá: {
      "Usaquén": ["Cedritos", "Santa Bárbara", "San Patricio", "Otro"],
      "Chapinero": ["Chapinero Alto", "Chapinero Central", "Rosales", "Otro"],
      "La Candelaria": ["La Catedral", "Las Aguas", "Centro Administrativo", "Otro"],
      "Santa Fe": ["Las Nieves", "San Diego", "La Perseverancia", "Otro"],
      "San Cristóbal": ["20 de Julio", "San Blas", "San Martín de Loba", "Otro"],
      Usme: ["Usme Centro", "La Flora", "Gran Yomasa", "Otro"],
      Tunjuelito: ["Venecia", "Fátima", "San Vicente Ferrer", "Otro"],
      Bosa: ["Bosa Centro", "La Despensa", "El Porvenir", "Bosa La Estación", "Bosa Nova", "Bosa Piamonte", "Ciudadela El Recreo", "El Corzo", "La Libertad", "San Bernardino", "San Pablo Bosa", "Santa Fe Bosa", "Antonia Santos", "Brasil", "Campo Verde", "Carlos Albán Holguín", "El Anhelo", "El Progreso", "Escocia", "Islandia", "Jiménez de Quesada", "La Paz Bosa", "Olarte", "Paso Ancho", "Villa del Río", "Villa Sonia", "Villa Anny", "Villas del Progreso", "Otro"],
      Kennedy: ["Ciudad Kennedy", "Castilla", "Timiza", "Otro"],
      Fontibón: ["Fontibón Centro", "Modelia", "Villemar", "Otro"],
      Engativá: ["Engativá Centro", "Las Ferias", "Boyacá Real", "Otro"],
      Suba: ["Suba Centro", "Niza", "La Campiña", "Otro"],
      "Barrios Unidos": ["Doce de Octubre", "La Castellana", "Metrópolis", "Otro"],
      Teusaquillo: ["Teusaquillo", "La Soledad", "Galerías", "Otro"],
      "Los Mártires": ["Ricaurte", "Paloquemao", "Santa Isabel", "Otro"],
      "Antonio Nariño": ["Restrepo", "Ciudad Berna", "Policarpa", "Otro"],
      "Puente Aranda": ["Ciudad Montes", "Alcalá", "Muzu", "Otro"],
      "Rafael Uribe Uribe": ["Quiroga", "Marruecos", "Diana Turbay", "Otro"],
      "Ciudad Bolívar": ["Arborizadora", "San Francisco", "Lucero", "Otro"],
      Sumapaz: ["San Juan", "Nazareth", "Betania", "Otro"],
    },
    Medellín: { Centro: ["Centro", "Boston", "Prado", "Otro"] },
    Cali: { Centro: ["Centro", "San Fernando", "Granada", "Otro"] },
    Barranquilla: { Centro: ["Centro", "El Prado", "Alto Prado", "Otro"] },
    Cartagena: { Centro: ["Centro", "Getsemaní", "Manga", "Otro"] },
    Bucaramanga: { Centro: ["Centro", "Cabecera", "San Francisco", "Otro"] },
    Pereira: { Centro: ["Centro", "Cuba", "Alamos", "Otro"] },
    Cúcuta: { Centro: ["Centro", "Caobos", "La Riviera", "Otro"] },
    Ibagué: { Centro: ["Centro", "La Pola", "Piedrapintada", "Otro"] },
    Manizales: { Centro: ["Centro", "Palogrande", "Chipre", "Otro"] },
    Armenia: { Centro: ["Centro", "Granada", "La Castellana", "Otro"] },
    Pasto: { Centro: ["Centro", "San Ignacio", "Las Cuadras", "Otro"] },
    Villavicencio: { Centro: ["Centro", "Barzal", "La Esperanza", "Otro"] },
    Neiva: { Centro: ["Centro", "Quirinal", "La Toma", "Otro"] },
    Montería: { Centro: ["Centro", "La Castellana", "La Coquera", "Otro"] },
    Sincelejo: { Centro: ["Centro", "La Pajuela", "Venecia", "Otro"] },
    Tunja: { Centro: ["Centro", "Las Nieves", "Maldonado", "Otro"] },
    Popayán: { Centro: ["Centro", "San Camilo", "El Recuerdo", "Otro"] },
    "Santa Marta": { Centro: ["Centro", "Bellavista", "El Rodadero", "Otro"] },
    Valledupar: { Centro: ["Centro", "Novalito", "Mayales", "Otro"] },
  };

  const ciudades = Object.keys(ubicacionesPorCiudad);
  const localidadesDisponibles = ciudad
    ? Object.keys(ubicacionesPorCiudad[ciudad])
    : [];
  const barriosDisponibles = ciudad && localidad
    ? ubicacionesPorCiudad[ciudad][localidad]
    : [];

  const siguiente = () => {
    if (!nombre.trim() || !email.trim() || !tipo || !documento.trim() || !telefono.trim() || !password) {
      setMensaje("Completa todos los campos");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMensaje("Ingresa un correo electrónico válido");
      return;
    }

    if (!/^\d+$/.test(documento.trim())) {
      setMensaje("El número de documento solo debe contener números");
      return;
    }

    setMensaje("");
    setPaso(2);
  };

  const registrar = async () => {
    if (!direccion.trim() || !ciudad || !localidad || !barrio || !codigoCorrespondencia.trim()) {
      setMensaje("Completa todos los campos");
      return;
    }

    if (!/^\d{6}$/.test(codigoCorrespondencia.trim())) {
      setMensaje("El código postal debe tener 6 números");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          documento: documento.trim(),
          telefono,
          password,
          tipo_documento: tipo,
          ciudad,
          direccion: direccion.trim(),
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

      setMensaje(
        "Registro enviado ✅. Tu solicitud queda pendiente de aprobación."
      );
      setCodigoRegistro(data.codigo_registro);
    } catch (error) {
      console.error(error);
      setMensaje("Error conectando con el servidor");
    }
  };

  return (
    <div className="container">
      <div className="form-box">
        <h1>REGISTRO</h1>

        {codigoRegistro && (
          <p className="codigo-registro">
            Tu código de registro es: <strong>{codigoRegistro}</strong>
          </p>
        )}

        {paso === 1 && (
          <>
            <label>Nombre completo</label>
            <input
              name="nombre"
              autoComplete="name"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />

            <label>Correo electrónico</label>
            <input
              name="email"
              autoComplete="email"
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
              name="documento"
              autoComplete="off"
              type="text"
              inputMode="numeric"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />

            <label>Número teléfono</label>
            <input
              name="telefono"
              autoComplete="tel"
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
            <label>Ciudad</label>
            <select
              value={ciudad}
              onChange={(e) => {
                setCiudad(e.target.value);
                setLocalidad("");
                setBarrio("");
              }}
            >
              <option value="">Seleccione una ciudad</option>
              {ciudades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label>Localidad</label>
            <select
              value={localidad}
              onChange={(e) => {
                setLocalidad(e.target.value);
                setBarrio("");
              }}
              disabled={!ciudad}
            >
              <option value="">Seleccione una localidad</option>
              {localidadesDisponibles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label>Barrio</label>
            <select
              value={barrio}
              onChange={(e) => setBarrio(e.target.value)}
              disabled={!localidad}
            >
              <option value="">Seleccione un barrio</option>
              {barriosDisponibles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label>Código postal </label>
            <input
              name="codigoPostal"
              autoComplete="postal-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigoCorrespondencia}
              onChange={(e) => setCodigoCorrespondencia(
                e.target.value.replace(/\D/g, "")
              )}
            />

            <label>Dirección</label>
            <input
              name="direccion"
              autoComplete="street-address"
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
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