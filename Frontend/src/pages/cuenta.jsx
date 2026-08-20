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
          `http://127.0.0.1:8000/usuario/${id}`
        );


        const data = await res.json();


        if (res.ok && data.nombre) {

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


  }, [id]);





  useEffect(() => {


    setTotalIngresos(1200);

    setTotalGastos(500);



    const canvas = document.getElementById(
      "salesChart"
    );


    if (!canvas) return;



    if (window.chart) {

      window.chart.destroy();

    }



    const ctx = canvas.getContext("2d");



    window.chart = new Chart(ctx, {


      type:"line",


      data:{


        labels:[
          "Lun",
          "Mar",
          "Mié",
          "Jue",
          "Vie",
          "Sáb",
          "Dom"
        ],


        datasets:[


          {

            label:"Ingresos",

            data:[
              45,
              60,
              50,
              80,
              65,
              90,
              100
            ],

            tension:0.4,

            fill:true

          },


          {

            label:"Gastos",

            data:[
              25,
              40,
              35,
              60,
              45,
              70,
              80
            ],

            tension:0.4,

            fill:true

          }


        ]

      },


      options:{

        responsive:true,

        maintainAspectRatio:false

      }


    });



    return()=>{

      if(window.chart){

        window.chart.destroy();

      }

    };


  },[]);






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
              ${totalIngresos-totalGastos} 
            </span> 
 
 
          </div>


          <div className="card">

            <h3>Ahorros</h3>

            <span>
              $0
            </span>

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