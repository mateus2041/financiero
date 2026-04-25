import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/transferencias.css";

const Transferencias = () => {
  const navigate = useNavigate();

  const [destino, setDestino] = useState("");
  const [monto, setMonto] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [saldo, setSaldo] = useState(0); // 👈 NUEVO
  const [mensaje, setMensaje] = useState("");

  const documento = localStorage.getItem("documento");

  // 🔥 TRAER SALDO SEGÚN CUENTA
  useEffect(() => {
    if (!tipoCuenta) return;

    const obtenerSaldo = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/saldo/${documento}/${tipoCuenta}`
        );

        const data = await res.json();

        if (res.ok) {
          setSaldo(data.saldo);
        } else {
          setSaldo(0);
        }

      } catch (error) {
        console.error(error);
        setSaldo(0);
      }
    };

    obtenerSaldo();
  }, [tipoCuenta, documento]);

  const handleTransferencia = async (e) => {
    e.preventDefault();

    if (!destino || !monto || !tipoCuenta) {
      setMensaje("⚠️ Todos los campos son obligatorios");
      return;
    }

    // 🔥 VALIDAR SALDO
    if (parseFloat(monto) > saldo) {
      setMensaje("❌ Saldo insuficiente");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/transferir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origen: documento,
          destino: destino.trim(),
          monto: parseFloat(monto),
          tipo_cuenta: tipoCuenta,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje("✅ Transferencia realizada correctamente");
        setDestino("");
        setMonto("");
        setTipoCuenta("");
        setSaldo(0);
      } else {
        setMensaje(`❌ ${data.detail}`);
      }

    } catch (error) {
      console.error(error);
      setMensaje("❌ Error en el servidor");
    }
  };

  return (
    <div className="transferencias-container">
      <div className="transferencias-box">
        <h2>💳 Transferencias</h2>

        <form onSubmit={handleTransferencia}>

          {/* TIPO CUENTA */}
          <label>Tipo de cuenta</label>
          <select
            value={tipoCuenta}
            onChange={(e) => setTipoCuenta(e.target.value)}
          >
            <option value="">Seleccione</option>
            <option value="ahorros">Ahorros</option>
            <option value="corriente">Corriente</option>
          </select>

          {/* 🔥 MOSTRAR SALDO */}
          {tipoCuenta && (
            <p className="saldo">
              💰 Saldo disponible: ${saldo}
            </p>
          )}

          {/* DESTINO */}
          <label>Documento destino</label>
          <input
            type="text"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            placeholder="Ingrese documento"
          />

          {/* MONTO */}
          <label>Monto</label>
          <input
            type="number"
            min="1"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Ingrese monto"
          />

          <button type="submit">Enviar dinero</button>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}

        <button className="volver" onClick={() => navigate("/cuenta")}>
          ⬅ Volver
        </button>
      </div>
    </div>
  );
};

export default Transferencias;