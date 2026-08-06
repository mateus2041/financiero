import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/transferencia.css";

function Transferencia() {

  const [usuario, setUsuario] = useState(null);

  const [monto, setMonto] = useState("");

  useEffect(() => {

    const token = localStorage.getItem("token");

    fetch("http://127.0.0.1:8000/usuario", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setUsuario(data));

  }, []);

  const realizarTransferencia = async () => {

    if (Number(monto) <= 0) {
      alert("Ingrese un monto válido.");
      return;
    }

    const token = localStorage.getItem("token");

    const respuesta = await fetch(
      "http://127.0.0.1:8000/usuario/transferencia",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          monto: Number(monto)
        })
      }
    );

    const data = await respuesta.json();

    if (respuesta.ok) {

      alert("Transferencia realizada correctamente.");

      setUsuario({
        ...usuario,
        saldo_corriente: data.saldo_corriente,
        saldo_ahorro: data.saldo_ahorro
      });

      setMonto("");

    } else {

      alert(data.detail);

    }

  };

  if (!usuario) {

    return <h2>Cargando...</h2>;

  }

  return (

    <div className="transferencia-container">

      <h1>Transferencia entre Cuentas</h1>

      <div className="saldo">

        <p>
          <strong>Cuenta Corriente:</strong>
          ${Number(usuario.saldo_corriente).toLocaleString()}
        </p>

        <p>
          <strong>Cuenta de Ahorro:</strong>
          ${Number(usuario.saldo_ahorro).toLocaleString()}
        </p>

      </div>

      <input
        type="number"
        placeholder="Monto a transferir"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
      />

      <button onClick={realizarTransferencia}>
        Transferir a Cuenta de Ahorro
      </button>

    </div>

  );

}

export default Transferencia;