import { useState } from "react";

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    mensaje: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const enviar = async (e) => {
    e.preventDefault();

    const res = await fetch("http://127.0.0.1:8000/contacto", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <form onSubmit={enviar}>
      <input
        name="nombre"
        placeholder="Nombre"
        onChange={handleChange}
        required
      />

      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        required
      />

      <textarea
        name="mensaje"
        placeholder="Mensaje"
        onChange={handleChange}
        required
      />

      <button type="submit">Enviar</button>
    </form>
  );
}