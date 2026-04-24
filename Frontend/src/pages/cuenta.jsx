import React, { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";
import "../styles/cuenta.css";

const PanelFinanciero = () => {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [documento, setDocumento] = useState("");
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);

  // 🔥 TRAER USUARIO DESDE BACKEND POR DOCUMENTO
  useEffect(() => {
    const doc = localStorage.getItem("documento");

    if (!doc) {
      navigate("/inicio");
      return;
    }

    setDocumento(doc);

    const obtenerUsuario = async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/usuario-documento/${doc}`
        );

        const data = await res.json();

        if (res.ok) {
          setUsuario(data.nombre);
        } else {
          setUsuario("Usuario");
        }

      } catch (error) {
        console.error(error);
        setUsuario("Usuario");
      }
    };

    obtenerUsuario();
  }, []);

  // 🔥 GRAFICA
  useEffect(() => {
    setTotalIngresos(1200);
    setTotalGastos(500);

    const canvas = document.getElementById("salesChart");
    if (!canvas) return;

    if (window.chart) {
      window.chart.destroy();
    }

    const ctx = canvas.getContext("2d");

    window.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
        datasets: [
          {
            label: "Ingresos",
            data: [45, 60, 50, 80, 65, 90, 100],
            borderColor: "#f2c94c",
            backgroundColor: "rgba(242, 201, 76, 0.2)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Gastos",
            data: [25, 40, 35, 60, 45, 70, 80],
            borderColor: "#355dff",
            backgroundColor: "rgba(53, 93, 255, 0.2)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    return () => {
      if (window.chart) window.chart.destroy();
    };
  }, []);

  // 🔥 BLOQUEO FLECHAS
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", blockBack);

    return () => {
      window.removeEventListener("popstate", blockBack);
    };
  }, []);

  // 🔥 LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("documento");
    navigate("/inicio");
  };

  return (
    <div className="panel-financiero">

      <aside className="sidebar">
        <ul>
          <li><a href="#cuenta" className="active">💳 Cuenta</a></li>
          <li><a href="#historial">📜 Historial Monetario</a></li>
          <li><a href="#certificado">📄 Certificado Bancario</a></li>
          <li><a href="#ajustes">⚙️ Ajustes</a></li>
        </ul>

        <button className="logout" onClick={handleLogout}>
          🚪 Cerrar sesión
        </button>
      </aside>

      <main className="main">

        <header className="main-header">
          <h1>
            Bienvenido
          </h1>

          <div className="profile">
            <img
              src="https://i.pinimg.com/736x/e0/06/16/e00616c1e181f83b35b157f9281bd36e.jpg"
              alt="Usuario"
            />
          </div>
        </header>

        <section className="stats">
          <div className="card">
            <h3>Ingresos</h3>
            <span>${totalIngresos}</span>
          </div>

          <div className="card">
            <h3>Cuenta</h3>
            <span>${totalIngresos}</span>
          </div>

          <div className="card">
            <h3>Gastos</h3>
            <span>${totalGastos}</span>
          </div>
        </section>

        <section className="chart-card">
          <h3>Porcentaje de dinero</h3>
          <div className="chart-container">
            <canvas id="salesChart"></canvas>
          </div>
        </section>

      </main>
    </div>
  );
};

export default PanelFinanciero;