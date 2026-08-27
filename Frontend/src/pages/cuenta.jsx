import React, { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { useNavigate, Link } from "react-router-dom";
import "../styles/cuenta.css";

const Cuenta = () => {

  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [documento, setDocumento] = useState("");
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [saldoCorriente, setSaldoCorriente] = useState(0);
  const [saldoAhorro, setSaldoAhorro] = useState(0);
  const [numeroCuentaCorriente, setNumeroCuentaCorriente] = useState(null);
  const [numeroCuentaAhorro, setNumeroCuentaAhorro] = useState(null);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [id, setId] = useState("");



  useEffect(() => {

    const doc = localStorage.getItem("documento");
    const id_u = localStorage.getItem("usuario_id");
    const token = localStorage.getItem("token");


    if (!token || !doc) {

      navigate("/");

      return;

    }


    setDocumento(doc);

    setId(id_u);


  }, [navigate]);




  useEffect(() => {

    if (!id) return;


    const obtenerUsuario = async () => {

      try {


        const res = await fetch(
          "http://127.0.0.1:8000/usuario",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );


        const datos = await res.json();


        if (res.ok && datos.nombre) {

          setUsuario(
            datos.nombre ||
            datos.usuario ||
            datos.nombre_usuario ||
            ""
          );

        } else {

          setUsuario("Usuario");

        }


      } catch (error) {

        console.error(error);

        setUsuario("Usuario");

      }

    };


    obtenerUsuario();


  }, [id]);





  useEffect(() => {

    const cargarDatosFinancieros = async () => {
      try {
        const [respuestaSaldos, respuestaTransacciones] = await Promise.all([
          fetch("http://127.0.0.1:8000/cuentas/saldos", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }),
          fetch("http://127.0.0.1:8000/transacciones", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          })
        ]);

        if (!respuestaSaldos.ok || !respuestaTransacciones.ok) {
          throw new Error("No se pudieron obtener los datos financieros");
        }

        const datosSaldos = await respuestaSaldos.json();
        const datosTransacciones = await respuestaTransacciones.json();
        const transacciones = Array.isArray(datosTransacciones)
          ? datosTransacciones
          : datosTransacciones.transacciones || datosTransacciones.data || [];

        setSaldoCorriente(Number(datosSaldos.cuenta_corriente || 0));
        setSaldoAhorro(Number(datosSaldos.cuenta_ahorro || 0));
        setNumeroCuentaCorriente(datosSaldos.cuenta_corriente_numero);
        setNumeroCuentaAhorro(datosSaldos.cuenta_ahorro_numero);

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechas = Array.from({ length: 7 }, (_, indice) => {
          const fecha = new Date(hoy);
          fecha.setDate(hoy.getDate() - (6 - indice));
          return fecha;
        });
        const clavesFechas = fechas.map((fecha) => fecha.toISOString().slice(0, 10));
        const ingresosPorDia = Array(7).fill(0);
        const gastosPorDia = Array(7).fill(0);
        let ingresos = 0;
        let gastos = 0;

        transacciones.forEach((transaccion) => {
          const fecha = new Date(transaccion.fecha);
          const tipo = String(transaccion.tipo || "").toLowerCase();
          const monto = Number(transaccion.monto || 0);
          const indice = clavesFechas.indexOf(fecha.toISOString().slice(0, 10));

          if (tipo.includes("ingreso")) {
            ingresos += monto;
            if (indice >= 0) ingresosPorDia[indice] += monto;
          }

          if (tipo.includes("gasto") || tipo.includes("transfer")) {
            gastos += monto;
            if (indice >= 0) gastosPorDia[indice] += monto;
          }
        });

        setTotalIngresos(ingresos);
        setTotalGastos(gastos);

        const canvas = document.getElementById("salesChart");
        if (!canvas) return;

        if (window.chart) window.chart.destroy();

        window.chart = new Chart(canvas.getContext("2d"), {
          type: "line",
          data: {
            labels: fechas.map((fecha) =>
              fecha.toLocaleDateString("es-CO", { weekday: "short" })
            ),
            datasets: [
              {
                label: "Ingresos",
                data: ingresosPorDia,
                tension: 0.4,
                fill: true
              },
              {
                label: "Gastos",
                data: gastosPorDia,
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      } catch (error) {
        console.error(error);
      }
    };

    cargarDatosFinancieros();

    return () => {
      if (window.chart) {
        window.chart.destroy();
        window.chart = null;
      }
    };
  }, []);






  const handleLogout = () => {


    localStorage.removeItem("token");

    localStorage.removeItem("usuario_id");

    localStorage.removeItem("nombre_usuario");

    localStorage.removeItem("documento");


    navigate("/");


  };





  return (


    <div className="panel-financiero">


      <aside className="sidebar">


        <ul>


          <li>

            <Link
              to="/cuenta"
              className="active"
            >

              💷 Cuenta

            </Link>

          </li>





          <li>

            <Link to="/historial">

              📜 Historial Monetario

            </Link>

          </li>


          <li>

            <Link to="/reporte">

              📜 reportes

            </Link>

          </li>





          <li>


            <div

              className="menu-item"

              onClick={() =>
                setOpenTransfer(!openTransfer)
              }

            >

              💳 Otros 
              
              {openTransfer ? "▲" : "▼"}


            </div>




            {

            openTransfer && (

              <ul className="submenu">


                <li>

                  <Link to="/transferencias">

                    ➡ Enviar dinero

                  </Link>

                </li>



                <li>

                  <Link to="/corriente">

                    🧾 Transferir

                  </Link>

                </li>


              </ul>

            )

            }


          </li>





          <li>

            <Link
              to="/certificado"
              className="btn-nav"
            >

              📄 Certificado Bancario

            </Link>

          </li>





          <li>

            <Link
              to="/ajustes"
              className="btn-nav"
            >

              ⚙️ Ajustes

            </Link>

          </li>





          {/* BOTON NUEVO CHAT IA */}

          <li>

            <Link
              to="/ChatIA"
              className="btn-nav"
            >

              🤖 Asistente IA

            </Link>


          </li>



        </ul>





        <button

          className="logout"

          onClick={handleLogout}

        >

          🚪 Cerrar sesión


        </button>



      </aside>







      <main className="main">



        <header className="main-header">


          <h2>

            Bienvenido {usuario}

          </h2>




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

            <span>
              ${saldoCorriente}
            </span>

            <small>Número de cuenta: {numeroCuentaCorriente || "No disponible"}</small>


          </div>


          <div className="card">

            <h3>Ahorros</h3>

            <span>
              ${saldoAhorro}
            </span>

            <small>Número de cuenta: {numeroCuentaAhorro || "No disponible"}</small>

          </div>




          <div className="card">


            <h3>Gastos</h3>


            <span>${totalGastos}</span>


          </div>



        </section>








        <section className="chart-card">


          <h3>
            Porcentaje de dinero
          </h3>



          <div className="chart-container">


            <canvas id="salesChart"></canvas>


          </div>



        </section>



      </main>



    </div>


  );


};


export default Cuenta;