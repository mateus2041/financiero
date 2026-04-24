import React, { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import "../styles/cuenta.css";

const PanelFinanciero = ({ usuario }) => {
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);

  useEffect(() => {
    const ingresos = 1200;
    const gastos = 500;

    setTotalIngresos(ingresos);
    setTotalGastos(gastos);

    const canvas = document.getElementById("salesChart");
    if (!canvas) return;

    // 🔥 evitar duplicación
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
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#a8b3cf",
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#a8b3cf" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          y: {
            ticks: { color: "#a8b3cf" },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },
      },
    });

    return () => {
      if (window.chart) {
        window.chart.destroy();
      }
    };
  }, []);

  const handleLogout = () => {
    console.log("Cerrar sesión");
  };

  return (
    <div className="panel-financiero">

      {/* SIDEBAR */}
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

      {/* MAIN */}
      <main className="main">

        {/* HEADER */}
        <header className="main-header">
          <div>
            <h1>
              Bienvenido <span>{usuario}</span>
            </h1>
          </div>

          <div className="profile">
            <img
              src="https://i.pinimg.com/736x/e0/06/16/e00616c1e181f83b35b157f9281bd36e.jpg"
              alt="Usuario"
            />
          </div>
        </header>

        {/* TARJETAS */}
        <section className="stats">
          <div className="card">
            <h3>Ingresos</h3>
            <span>${totalIngresos}</span>
          </div>

          <div className="card">
            <h3>monto</h3>
            <span>${totalIngresos}</span>
            <h3>XXXXXXXXXX302</h3>
          </div>

          <div className="card">
            <h3>Gastos</h3>
            <span>${totalGastos}</span>
          </div>
        </section>

        {/* 🔥 GRÁFICA */}
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