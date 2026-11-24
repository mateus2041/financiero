import React, { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";
import AsistenteMovil from "../components/AsistenteMovil";
import FinancialSidebar from "../components/FinancialSidebar";
import AssistantModal from "../components/AssistantModal";
import useResponsiveMenu from "../hooks/useResponsiveMenu";
import useModalDismissal from "../hooks/useModalDismissal";
import "../styles/cuenta.css";
import "../styles/navegacionMovil.css";

const Cuenta = () => {

  const navigate = useNavigate();

  const ocultarNumeroCuenta = (numero) => {
    if (!numero) return "No disponible";

    const digitos = String(numero).replace(/\D/g, "");

    if (digitos.length < 4) {
      return digitos || "No disponible";
    }

    return `${"*".repeat(digitos.length - 4)}${digitos.slice(-4)}`;
  };

  const [usuario, setUsuario] = useState("");
  const [documento, setDocumento] = useState("");
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [saldoCorriente, setSaldoCorriente] = useState(0);
  const [saldoAhorro, setSaldoAhorro] = useState(0);
  const [numeroCuentaCorriente, setNumeroCuentaCorriente] = useState(null);
  const [numeroCuentaAhorro, setNumeroCuentaAhorro] = useState(null);
  const [estadoCuentaCorriente, setEstadoCuentaCorriente] = useState("inactiva");
  const [estadoCuentaAhorro, setEstadoCuentaAhorro] = useState("inactiva");
  const [tipoCuentaCorriente, setTipoCuentaCorriente] = useState(
    () => localStorage.getItem("cuenta_corriente_tipo") || "debito"
  );
  const [id, setId] = useState("");
  const [actualizando, setActualizando] = useState(false);
  const [actualizacion, setActualizacion] = useState(0);
  const [fotoPerfil, setFotoPerfil] = useState(
    () => localStorage.getItem("fotoPerfil") || ""
  );
  const [menuAbierto, setMenuAbierto] = useResponsiveMenu();
  const [asistenteAbierto, setAsistenteAbierto] = useState(false);

  const mostrarCuentaCorriente = estadoCuentaCorriente === "activa";
  const mostrarCuentaAhorro = estadoCuentaAhorro === "activa";

  useModalDismissal(asistenteAbierto, setAsistenteAbierto, true);

  useEffect(() => {

    const actualizarFotoPerfil = () => {
      setFotoPerfil(localStorage.getItem("fotoPerfil") || "");
    };

    window.addEventListener("storage", actualizarFotoPerfil);
    window.addEventListener("fotoPerfilCambio", actualizarFotoPerfil);

    return () => {
      window.removeEventListener("storage", actualizarFotoPerfil);
      window.removeEventListener("fotoPerfilCambio", actualizarFotoPerfil);
    };

  }, []);


  const aplicarTipoCuentaCorriente = (tipo) => {
    const valor = String(
      tipo || localStorage.getItem("cuenta_corriente_tipo") || "debito"
    ).toLowerCase();

    if (valor !== "debito" && valor !== "credito") return;

    setTipoCuentaCorriente(valor);
    localStorage.setItem("cuenta_corriente_tipo", valor);
  };

  useEffect(() => {
    const actualizarTipoCuentaCorriente = () => {
      const tipoGuardado = localStorage.getItem("cuenta_corriente_tipo") || "debito";
      aplicarTipoCuentaCorriente(tipoGuardado);
    };

    actualizarTipoCuentaCorriente();

    window.addEventListener("cuentas-actualizadas", actualizarTipoCuentaCorriente);
    window.addEventListener("cuenta-tipo-actualizado", actualizarTipoCuentaCorriente);
    window.addEventListener("storage", actualizarTipoCuentaCorriente);

    return () => {
      window.removeEventListener("cuentas-actualizadas", actualizarTipoCuentaCorriente);
      window.removeEventListener("cuenta-tipo-actualizado", actualizarTipoCuentaCorriente);
      window.removeEventListener("storage", actualizarTipoCuentaCorriente);
    };
  }, []);


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


    void obtenerUsuario();


  }, [id, actualizacion]);





  useEffect(() => {

    let cargaEnCurso = false;

    const cargarDatosFinancieros = async (mostrarIndicador = true) => {
      if (cargaEnCurso) return;
      cargaEnCurso = true;
      if (mostrarIndicador) setActualizando(true);

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

        const saldoCorrienteActivo = datosSaldos.cuenta_corriente_estado === "activa"
          ? Number(datosSaldos.cuenta_corriente || 0)
          : 0;
        const saldoAhorroActivo = datosSaldos.cuenta_ahorro_estado === "activa"
          ? Number(datosSaldos.cuenta_ahorro || 0)
          : 0;
        setSaldoCorriente(saldoCorrienteActivo);
        setSaldoAhorro(saldoAhorroActivo);
        setNumeroCuentaCorriente(
          datosSaldos.cuenta_corriente_estado === "activa"
            ? datosSaldos.cuenta_corriente_numero
            : null
        );
        setNumeroCuentaAhorro(
          datosSaldos.cuenta_ahorro_estado === "activa"
            ? datosSaldos.cuenta_ahorro_numero
            : null
        );
        setEstadoCuentaCorriente(datosSaldos.cuenta_corriente_estado || "inactiva");
        setEstadoCuentaAhorro(datosSaldos.cuenta_ahorro_estado || "inactiva");

        const nuevoTipoCorriente = datosSaldos.cuenta_corriente_tipo || localStorage.getItem("cuenta_corriente_tipo") || "debito";
        aplicarTipoCuentaCorriente(nuevoTipoCorriente);

        const hoy = new Date();
        const meses = Array.from({ length: 6 }, (_, indice) => {
          const mes = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - indice), 1);
          return {
            clave: `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, "0")}`,
            fecha: mes
          };
        });
        const indicesMeses = new Map(meses.map((mes, indice) => [mes.clave, indice]));
        const ingresosPorMes = Array(6).fill(0);
        const gastosPorMes = Array(6).fill(0);
        let ingresos = 0;
        let gastos = 0;

        transacciones.forEach((transaccion) => {
          const fechaTexto = String(transaccion.fecha || "");
          const coincidenciaFecha = fechaTexto.match(/^(\d{4}-\d{2})/);
          const fecha = coincidenciaFecha ? null : new Date(transaccion.fecha);
          const claveMes = coincidenciaFecha
            ? coincidenciaFecha[1]
            : Number.isNaN(fecha.getTime())
              ? null
              : `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
          const tipo = String(transaccion.tipo || "").toLowerCase();
          const monto = Number(transaccion.monto || 0);
          const indice = claveMes === null ? undefined : indicesMeses.get(claveMes);

          if (tipo.includes("ingreso")) {
            ingresos += monto;
            if (indice !== undefined) ingresosPorMes[indice] += monto;
          }

          if (tipo.includes("gasto") || tipo.includes("transfer")) {
            gastos += monto;
            if (indice !== undefined) gastosPorMes[indice] += monto;
          }
        });

        setTotalIngresos(ingresos);
        setTotalGastos(gastos);

        const canvas = document.getElementById("salesChart");
        if (!canvas) return;

        const etiquetasMeses = meses.map(({ fecha }) =>
          fecha.toLocaleDateString("es-CO", { month: "short", year: "numeric" })
        );

        if (window.chart) {
          window.chart.data.labels = etiquetasMeses;
          window.chart.data.datasets[0].data = ingresosPorMes;
          window.chart.data.datasets[1].data = gastosPorMes;
          window.chart.update();
        } else {
          window.chart = new Chart(canvas.getContext("2d"), {
            type: "line",
            data: {
              labels: etiquetasMeses,
              datasets: [
                {
                  label: "Ingresos",
                  data: ingresosPorMes,
                  tension: 0.4,
                  fill: true
                },
                {
                  label: "Gastos",
                  data: gastosPorMes,
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
        }
      } catch (error) {
        console.error(error);
      } finally {
        cargaEnCurso = false;
        if (mostrarIndicador) setActualizando(false);
      }
    };

    void cargarDatosFinancieros();

    const actualizarCuentas = () => cargarDatosFinancieros();
    const actualizarSiVisible = () => {
      if (document.visibilityState === "visible") {
        void cargarDatosFinancieros(false);
      }
    };
    const intervaloActualizacion = window.setInterval(actualizarSiVisible, 5000);

    window.addEventListener("cuentas-actualizadas", actualizarCuentas);
    window.addEventListener("storage", actualizarCuentas);
    window.addEventListener("focus", actualizarSiVisible);
    document.addEventListener("visibilitychange", actualizarSiVisible);

    return () => {
      window.clearInterval(intervaloActualizacion);
      window.removeEventListener("cuentas-actualizadas", actualizarCuentas);
      window.removeEventListener("storage", actualizarCuentas);
      window.removeEventListener("focus", actualizarSiVisible);
      document.removeEventListener("visibilitychange", actualizarSiVisible);

      if (window.chart) {
        window.chart.destroy();
        window.chart = null;
      }
    };
  }, [actualizacion]);






  const actualizarCuenta = () => {
    setDocumento(localStorage.getItem("documento") || "");
    setId(localStorage.getItem("usuario_id") || "");
    setFotoPerfil(localStorage.getItem("fotoPerfil") || "");
    setActualizacion((valor) => valor + 1);
  };

  const handleLogout = () => {


    localStorage.removeItem("token");

    localStorage.removeItem("usuario_id");

    localStorage.removeItem("nombre_usuario");

    localStorage.removeItem("documento");


    navigate("/inicio");


  };





  return (


    <div className="panel-financiero">

      <button
        type="button"
        className={`menu-hamburguesa ${menuAbierto ? "activo" : ""}`}
        onClick={() => setMenuAbierto((actual) => !actual)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
      >
        ☰
      </button>

      <AsistenteMovil onClick={() => setAsistenteAbierto(true)} />

      <FinancialSidebar
        menuAbierto={menuAbierto}
        onLogout={handleLogout}
        onAssistantOpen={() => setAsistenteAbierto(true)}
        reportLabel="📜 reportes"
      />







      <main className="main">



        <header className="main-header">


          <h2>

            Bienvenido {usuario}

          </h2>




          <div className="profile">

            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Foto de perfil" />
            ) : (
              <span className="profile-fallback" aria-label="Sin foto de perfil">
                {usuario.charAt(0).toUpperCase() || "U"}
              </span>
            )}


          </div>



        </header>






        <section className="stats">


          <div className="card">

            <h3>Ingresos</h3>

            <span>${totalIngresos}</span>


          </div>




          {mostrarCuentaCorriente && (
            <div className="card">

              <h3>Cuenta</h3>

              <small className={estadoCuentaCorriente === "activa" ? "cuenta-activa" : "cuenta-inactiva"}>
                {estadoCuentaCorriente === "activa" ? "Cuenta activa" : "Cuenta deshabilitada"}
              </small>

              <span>
                ${saldoCorriente}
              </span>

              <small>Tipo: {tipoCuentaCorriente === "credito" ? "Crédito" : "Débito"}</small>
              <small>Número de cuenta: {ocultarNumeroCuenta(numeroCuentaCorriente)}</small>


            </div>
          )}

          {mostrarCuentaAhorro && (
            <div className="card">
              <h3>Ahorros</h3>
              <small className="cuenta-activa">Cuenta activa</small>
              <span>${saldoAhorro}</span>
              <small>Número de cuenta: {ocultarNumeroCuenta(numeroCuentaAhorro)}</small>
            </div>
          )}


          <div className="card">


            <h3>Gastos</h3>


            <span>${totalGastos === 0 ? 0 : -Math.abs(totalGastos)}</span>


          </div>



        </section>








        <section className="chart-card">


          <div className="chart-header">
            <h3>Porcentaje de mes a mes</h3>
            <button
              type="button"
              className="refresh-button"
              onClick={actualizarCuenta}
              disabled={actualizando}
              aria-label="Actualizar datos financieros"
            >
              {actualizando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>



          <div className="chart-container">


            <canvas id="salesChart"></canvas>


          </div>



        </section>



      </main>

      {asistenteAbierto && (
        <AssistantModal onClose={() => setAsistenteAbierto(false)} />
      )}

    </div>


  );


};


export default Cuenta;