import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/inicio.css";
import logo from "../assets/images/logo.jpeg";
import Login from "./login";
import Registro from "./registro";
import ChatIA from "./chat";

function Home() {
  const [modalActivo, setModalActivo] = useState(null);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [politicaActiva, setPoliticaActiva] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");

  const politicas = [
    {
      nombre: "Política de privacidad",
      categoria: "Datos",
      icono: "🛡️",
      descripcion: "Cómo se informa el uso de la información recopilada en la plataforma.",
      objetivo: "Dar transparencia sobre tratamientos, finalidades y canales de contacto.",
      normativa: ["Ley 1581 de 2012", "Decreto 1377 de 2013"],
      fuente: { nombre: "Superintendencia de Industria y Comercio", url: "https://www.sic.gov.co/" },
      derechos: "Conocer, actualizar y rectificar los datos; solicitar su supresión cuando proceda; revocar autorizaciones y presentar consultas o reclamos.",
      responsabilidades: "Usuario: facilitar información veraz y proteger sus credenciales. Plataforma: limitar la recolección y responder solicitudes.",
      recomendaciones: "No compartas contraseñas ni códigos OTP. Revisa permisos y usa una contraseña única.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Financiero recopila únicamente la información necesaria para las funciones educativas y operativas demostradas por la aplicación.",
        "Los datos deben utilizarse con una finalidad informada, acceso restringido y conservación limitada a lo necesario.",
        "La plataforma no debe vender ni publicar datos personales. Cualquier tratamiento nuevo requiere informar al usuario.",
      ],
    },
    {
      nombre: "Tratamiento de datos personales",
      categoria: "Datos",
      icono: "📋",
      descripcion: "Principios y medidas aplicables a datos personales y datos sensibles.",
      objetivo: "Proteger la información personal contra usos no autorizados.",
      normativa: ["Ley 1581 de 2012", "Decreto 1074 de 2015"],
      fuente: { nombre: "Secretaría del Senado - Ley 1581", url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html" },
      derechos: "Acceso, consulta, actualización, rectificación y supresión en los casos previstos por la ley.",
      responsabilidades: "Mantener un registro de actividades y canales para consultas. El usuario debe informar cambios relevantes.",
      recomendaciones: "Verifica la URL, evita redes públicas y desconoce solicitudes de datos por canales no oficiales.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Los datos personales se tratan conforme a la autorización, la ley y las excepciones legales aplicables.",
        "Se deben aplicar deberes de seguridad, confidencialidad, finalidad y transparencia.",
        "La transferencia de datos o el uso de proveedores adicionales requiere evaluación jurídica y técnica.",
      ],
    },
    {
      nombre: "Seguridad de la información",
      categoria: "Seguridad",
      icono: "🔐",
      descripcion: "Controles básicos de confidencialidad, integridad y disponibilidad.",
      objetivo: "Reducir riesgos técnicos y evitar accesos, cambios o pérdidas no autorizadas.",
      normativa: ["Ley 1581 de 2012", "Buenas prácticas de gestión de riesgos"],
      fuente: { nombre: "Superintendencia Financiera de Colombia", url: "https://www.superfinanciera.gov.co/" },
      derechos: "Reportar incidentes sospechosos y conocer las medidas disponibles para proteger la cuenta.",
      responsabilidades: "La plataforma debe aplicar control de acceso, registros y actualización; el usuario debe cuidarlas.",
      recomendaciones: "Usa MFA, actualiza el navegador, bloquea la sesión al abandonar el equipo y revisa intentos de acceso.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "El proyecto académico debe proteger secretos, contraseñas y datos mediante controles técnicos adecuados.",
        "Los incidentes deberán contenerse, analizarse y comunicarse conforme al impacto y la normativa aplicable.",
        "Las copias, respaldos y registros deben tener acceso restringido y gestión de retención.",
      ],
    },
    {
      nombre: "Protección al consumidor financiero",
      categoria: "Protección",
      icono: "⚖️",
      descripcion: "Información clara y mecanismos para resolver inconformidades.",
      objetivo: "Promover decisiones informadas y un trato transparente.",
      normativa: ["Ley 1328 de 2009", "Decreto 1074 de 2015"],
      fuente: { nombre: "Secretaría del Senado - Ley 1328", url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1328_2009.html" },
      derechos: "Acceso a información de productos, objeciones, reclamaciones, petición de conciliación y protección ante prácticas abusivas.",
      responsabilidades: "Usuario: verificar operaciones y aportar información exacta. Plataforma: informar costos y facilitar canales.",
      recomendaciones: "Conserva comprobantes, revisa extractos y eleva solicitudes por canales oficiales.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Los productos y costos deben presentarse de manera comprensible y sin omisiones relevantes.",
        "Las reclamaciones deben admitir seguimiento y una respuesta basada en información verificable.",
        "Estas funcionalidades educativas no sustituyen la calificación ni la certificación de una entidad vigilada.",
      ],
    },
    {
      nombre: "Prevención del fraude",
      categoria: "Seguridad",
      icono: "🚨",
      descripcion: "Recomendaciones y alertas frente a suplantación y operaciones sospechosas.",
      objetivo: "Detectar, reportar y contener posibles fraudes.",
      normativa: ["Lineamientos de gestión de riesgo", "Ciberseguridad financiera"],
      fuente: { nombre: "Superintendencia Financiera - Información al usuario", url: "https://www.superfinanciera.gov.co/" },
      derechos: "Reportar movimientos no reconocidos y solicitar revisión de operaciones según los procedimientos aplicables.",
      responsabilidades: "Usuario: proteger dispositivos y no autorizar códigos desconocidos. Plataforma: registrar y avisar sobre alertas.",
      recomendaciones: "No instales apps por mensajes inesperados; verifica al destinatario y bloquea tarjetas o cuentas ante dudas.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Los avisos deben indicar operaciones inusuales sin solicitar contraseñas ni códigos por correo o llamada.",
        "Los casos reportados deben registrarse, evaluarse y derivarse a los canales internos correspondientes.",
        "Un entorno académico puede simular alertas, pero no sustituye monitoreo bancario ni seguro contra fraude.",
      ],
    },
    {
      nombre: "Políticas de cuentas bancarias",
      categoria: "Cuentas",
      icono: "🏦",
      descripcion: "Uso responsable, verificación y protección de cuentas.",
      objetivo: "Definir conductas esperadas y evitar usos indebidos.",
      normativa: ["Estatuto Orgánico del Sistema Financiero", "Requisitos de apertura y conocimiento del cliente"],
      fuente: { nombre: "Estatuto Orgánico del Sistema Financiero", url: "https://www.secretariasenado.gov.co/senado/basedoc/decreto_663_1993.html" },
      derechos: "Conocer el estado de la cuenta, movimientos y mecanismos para bloquearla o reportar irregularidades.",
      responsabilidades: "Mantener datos actualizados y revisar movimientos. La entidad, si existiera, debe verificar identidad y autorizar operaciones.",
      recomendaciones: "Configura notificaciones, revisa el extracto y reporta cualquier cuenta o usuario desconocido.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "La apertura real exige procesos regulatorios de una entidad vigilada y no puede asumirse por esta demostración académica.",
        "Las cuentas deben vincularse a personas verificadas y operaciones dentro de los límites definidos.",
        "El bloqueo preventivo puede aplicarse ante señales de riesgo, sujeto a los procedimientos que adopte la plataforma.",
      ],
    },
    {
      nombre: "Políticas de transferencias",
      categoria: "Operaciones",
      icono: "🔁",
      descripcion: "Validación y confirmación antes de enviar recursos.",
      objetivo: "Reducir errores y operaciones no autorizadas.",
      normativa: ["Gestión de riesgo operativo", "Seguridad electrónica"],
      fuente: { nombre: "Superintendencia Financiera", url: "https://www.superfinanciera.gov.co/" },
      derechos: "Revisar destino y monto, consultar el historial y reportar operaciones no reconocidas.",
      responsabilidades: "Usuario: confirmar datos. Plataforma: validar autorización y conservar trazabilidad.",
      recomendaciones: "Verifica el nombre del beneficiario, evita redireccionamientos y conserva el comprobante.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Las operaciones deben requerir autenticación apropiada y una confirmación previa que muestre datos relevantes.",
        "Los movimientos simulados no generan ni acreditan recursos en redes financieras reales.",
        "Los límites, reversos y tiempos deben mostrarse de forma visible si se implementan en el servicio.",
      ],
    },
    {
      nombre: "Políticas de tarjetas",
      categoria: "Operaciones",
      icono: "💳",
      descripcion: "Uso seguro, bloqueo y reporte de pérdida o fraude.",
      objetivo: "Proteger medios de pago frente a usos no autorizados.",
      normativa: ["Protección al consumidor financiero", "Gestión de riesgo operativo"],
      fuente: { nombre: "Superintendencia Financiera", url: "https://www.superfinanciera.gov.co/" },
      derechos: "Bloquear medios, reportar cargos desconocidos y solicitar revisión.",
      responsabilidades: "Usuario: custodiar datos y revisar cargos. Plataforma: ofrecer canales seguros y trazabilidad.",
      recomendaciones: "No fotografíes la tarjeta completa ni compartas CVV, PIN u OTP.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Los datos sensibles de tarjeta deben cifrarse, limitarse y no mostrarse completos.",
        "El bloqueo y desbloqueo deben quedar asociados a una identidad autenticada.",
        "Los certificados o documentos mostrados por el proyecto son simulaciones educativas.",
      ],
    },
    {
      nombre: "Autenticación y protección de acceso",
      categoria: "Seguridad",
      icono: "🔑",
      descripcion: "Verificación de identidad y protección de sesiones.",
      objetivo: "Impedir accesos indebidos y limitar privilegios.",
      normativa: ["Gestión de accesos", "Protección de datos personales"],
      fuente: { nombre: "Instituto Colombiano de Normas Técnicas", url: "https://www.icontec.org/" },
      derechos: "Recuperar el acceso por canales verificables y cerrar sesiones activas.",
      responsabilidades: "Usuario: autenticarse por sí mismo. Plataforma: controlar intentos, sesiones y roles.",
      recomendaciones: "No reutilices contraseñas; activa segundo factor y verifica correos de inicio de sesión.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Las contraseñas deben almacenarse mediante derivación criptográfica fuerte y nunca en texto plano.",
        "Los roles deben aplicar el principio de menor privilegio.",
        "El bloqueo temporal, el registro de eventos y el cierre de sesión son mecanismos recomendados.",
      ],
    },
    {
      nombre: "Prevención del lavado de activos",
      categoria: "Cumplimiento",
      icono: "🕵️",
      descripcion: "Conocimiento del cliente y reporte de operaciones atípicas.",
      objetivo: "Reducir el uso de la plataforma para actividades ilícitas.",
      normativa: ["SARLAFT", "Ley 1909 de 2018", "Estatuto Orgánico del Sistema Financiero"],
      fuente: { nombre: "Unidad de Información y Análisis Financiero", url: "https://www.uiaf.gov.co/" },
      derechos: "Ser informado si una operación requiere verificación adicional y conocer los canales de atención.",
      responsabilidades: "Usuario: proporcionar información veraz. Entidad vigilada: implementar KYC, debida diligencia y reportes.",
      recomendaciones: "No realices operaciones por cuenta de terceros ni ocultes el origen de fondos.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Un SARLAFT completo, listas restrictivas, perfilamiento y reportes ROS son obligaciones propias de entidades vigiladas.",
        "Esta aplicación académica no ha sido autorizada para operar ni reportar al UIAF.",
        "Las simulaciones pueden demostrar flujos de verificación sin afirmar cumplimiento regulatorio integral.",
      ],
    },
    {
      nombre: "Tarifas y comisiones",
      categoria: "Tarifas",
      icono: "💲",
      descripcion: "Presentación transparente de cualquier costo asociado.",
      objetivo: "Evitar cobros ocultos y facilitar la comparación.",
      normativa: ["Ley 1328 de 2009", "Protección al consumidor financiero"],
      fuente: { nombre: "Secretaría del Senado - Ley 1328", url: "https://www.secretariasenado.gov.co/senado/basedoc/ley_1328_2009.html" },
      derechos: "Recibir información previa, clara y verificable sobre costos antes de confirmar una operación.",
      responsabilidades: "Usuario: revisar el resumen. Plataforma: no inventar tarifas ni omitir conceptos.",
      recomendaciones: "Compara el valor enviado, el valor recibido y cualquier impuesto o comisión mostrado.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "La aplicación no publica tarifas bancarias como reales hasta que exista una fuente aplicable al servicio.",
        "Los costos de demostración deben estar identificados como tales.",
        "Los cambios de tarifas reales requieren autorización y comunicación previa según corresponda.",
      ],
    },
    {
      nombre: "Gestión de peticiones, quejas y reclamos",
      categoria: "Protección",
      icono: "📣",
      descripcion: "Canales visibles para solicitudes y inconformidades.",
      objetivo: "Orientar al usuario y dar trazabilidad a sus solicitudes.",
      normativa: ["Ley 1328 de 2009", "Ley 1755 de 2015"],
      fuente: { nombre: "Superintendencia Financiera - Protección al consumidor", url: "https://www.superfinanciera.gov.co/" },
      derechos: "Presentar peticiones, quejas y reclamos; solicitar seguimiento y conservar evidencia.",
      responsabilidades: "Usuario: describir hechos y aportar documentos. Plataforma: identificar el caso y canalizarlo.",
      recomendaciones: "Incluye fecha, operación y descripción breve sin adjuntar datos sensibles innecesarios.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Los canales mostrados deben mantenerse vigentes y diferenciar soporte académico de atención regulada.",
        "Cada solicitud debería registrar número, fecha y estado sin exponer datos personales.",
        "Los sistemas reales deben cumplir términos y tiempos establecidos por la entidad vigilada.",
      ],
    },
    {
      nombre: "Accesibilidad e inclusión financiera",
      categoria: "Inclusión",
      icono: "♿",
      descripcion: "Experiencia adaptable y comprensible para distintos usuarios.",
      objetivo: "Reducir barreras de uso y mejorar la navegación.",
      normativa: ["Principios de accesibilidad digital", "Marco de inclusión financiera"],
      fuente: { nombre: "Gobierno Digital Colombia", url: "https://www.gov.co/" },
      derechos: "Usar interfaces adaptables y solicitar formatos o apoyos razonables.",
      responsabilidades: "Usuario: informar dificultades. Plataforma: mejorar contraste, navegación y lenguaje.",
      recomendaciones: "Puedes usar zoom del navegador y navegación por teclado; reporta textos o controles difíciles de usar.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "La interfaz debe conservar contraste, etiquetas comprensibles y capacidad de adaptación móvil.",
        "Los botones y estados deben ser identificables por teclado y tecnologías de asistencia.",
        "La inclusión financiera exige lenguaje claro y comunicación accesible, pero no garantiza acceso al sistema financiero real.",
      ],
    },
    {
      nombre: "Términos y condiciones del servicio",
      categoria: "Legales",
      icono: "📄",
      descripcion: "Condiciones generales, alcance y limitaciones de uso.",
      objetivo: "Definir responsabilidades y evitar interpretaciones engañosas.",
      normativa: ["Régimen general de contratos", "Protección al consumidor"],
      fuente: { nombre: "Ministerio de Hacienda y Crédito Público", url: "https://www.minhacienda.gov.co/" },
      derechos: "Conocer el alcance del servicio y los límites de las simulaciones.",
      responsabilidades: "Usuario: usar la plataforma legalmente. Plataforma: describir su naturaleza académica y cambios relevantes.",
      recomendaciones: "No uses datos reales de cuentas o tarjetas para pruebas no autorizadas.",
      actualizacion: "27 de noviembre de 2026",
      contenido: [
        "Financiero es una aplicación educativa y puede usar datos simulados.",
        "No realiza operación bancaria real ni acredita fondos ni certificados oficiales salvo integración expresamente autorizada.",
        "El uso puede modificarse mediante actualizaciones visibles; no se considerará aceptación tácita sin una acción explícita.",
      ],
    },
  ];

  const categorias = ["Todas", ...new Set(politicas.map((politica) => politica.categoria))];
  const politicasFiltradas = politicas.filter((politica) => {
    return categoriaActiva === "Todas" || politica.categoria === categoriaActiva;
  });

  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") {
        setModalActivo(null);
        setChatAbierto(false);
        setPoliticaActiva(null);
      }
    };

    if (modalActivo || chatAbierto || politicaActiva) {
      document.addEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
      document.body.style.overflow = "";
    };
  }, [modalActivo, chatAbierto, politicaActiva]);

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="home-navbar">
        <div></div>

        <ul className="home-menu">
          <li>Cuentas</li>
          <li>Certificado</li>
          <li>Bre-Be</li>

          <li>
            <button
              className="home-btn-registro"
              type="button"
              onClick={() => setModalActivo("login")}
            >
              Inicio
            </button>
          </li>

          <li>
            <button
              className="home-btn-registro"
              type="button"
              onClick={() => setModalActivo("registro")}
            >
              Registro
            </button>
          </li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-title">Compromiso Financiero</h1>

          <p>
            Somos una compañía financiera nueva que está transformando lo ya
            existente en algo diferente. Comprender los problemas actuales de
            los usuarios y empresas es crucial para construir un servicio más
            robusto y confiable.
          </p>

          <Link to="/registro">
            <button className="home-btn">
              Regístrate aquí para nuestros servicios
            </button>
          </Link>
        </div>

        <div className="home-hero-img">
          <div className="home-circle">
            <img
              src={logo}
              alt="Logo Financiero"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
        </div>
      </section>

      {modalActivo && (
        <div
          className="home-login-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalActivo(null);
            }
          }}
        >
          <div
            className={`home-login-modal ${
              modalActivo === "registro" ? "home-register-modal" : ""
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-login-modal-title"
          >
            <div className="home-login-modal-header">
              <h2 id="home-login-modal-title">
                {modalActivo === "registro" ? "Registro" : "Inicio de sesión"}
              </h2>
              <button
                className="home-login-modal-close"
                type="button"
                aria-label="Cerrar inicio de sesión"
                onClick={() => setModalActivo(null)}
              >
                ×
              </button>
            </div>
            {modalActivo === "registro" ? (
              <Registro isModal />
            ) : (
              <Login isModal />
            )}
          </div>
        </div>
      )}

      <button
        className="home-chat-trigger"
        type="button"
        aria-label="Abrir asistente virtual"
        onClick={() => setChatAbierto(true)}
      >
        🤖
      </button>

      {chatAbierto && (
        <div
          className="asistente-modal-overlay home-chat-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setChatAbierto(false);
            }
          }}
        >
          <div
            className="asistente-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="asistente-titulo"
          >
            <ChatIA compacto onClose={() => setChatAbierto(false)} />
          </div>
        </div>
      )}

      <section className="home-politicas" aria-labelledby="titulo-politicas">
        <div className="home-politicas-header">
          <div>
            <p className="home-politicas-eyebrow">Consulta normativa y buenas prácticas</p>
            <h2 id="titulo-politicas">Políticas y Seguridad Financiera</h2>
          </div>
        </div>

        <div className="home-politicas-categorias" aria-label="Filtrar políticas por categoría">
          {categorias.map((categoria) => (
            <button
              type="button"
              key={categoria}
              className={categoriaActiva === categoria ? "active" : ""}
              aria-pressed={categoriaActiva === categoria}
              onClick={() => setCategoriaActiva(categoria)}
            >
              {categoria}
            </button>
          ))}
        </div>

        <div className="home-politicas-grid">
          {politicasFiltradas.map((politica) => (
            <article className="home-politica-card" key={politica.nombre}>
              <div className="home-politica-icono" aria-hidden="true">{politica.icono}</div>
              <div className="home-politica-contenido">
                <span className="home-politica-categoria">{politica.categoria}</span>
                <h3>{politica.nombre}</h3>
                <p>{politica.descripcion}</p>
                <button
                  type="button"
                  className="home-politica-ver"
                  onClick={() => setPoliticaActiva(politica)}
                  aria-haspopup="dialog"
                >
                  Consultar contenido completo
                </button>
              </div>
            </article>
          ))}
        </div>

        {politicasFiltradas.length === 0 && (
          <p className="home-politicas-vacio">No encontramos políticas que coincidan con tu búsqueda.</p>
        )}

        <p className="home-politicas-aviso">
          Información general con fines educativos. Financiero no afirma estar certificado ni
          cumplir integralmente una regulación bancaria sin una auditoría independiente.
        </p>
      </section>

      {politicaActiva && (
        <div
          className="home-politica-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPoliticaActiva(null);
          }}
        >
          <section
            className="home-politica-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="politica-modal-titulo"
          >
            <div className="home-politica-modal-header">
              <div>
                <span>{politicaActiva.categoria}</span>
                <h2 id="politica-modal-titulo">{politicaActiva.nombre}</h2>
              </div>
              <button
                type="button"
                aria-label={`Cerrar ${politicaActiva.nombre}`}
                onClick={() => setPoliticaActiva(null)}
              >
                ×
              </button>
            </div>

            <div className="home-politica-modal-body">
              <p className="home-politica-resumen">{politicaActiva.descripcion}</p>

              <div className="home-politica-detalle">
                <h3>Objetivo</h3>
                <p>{politicaActiva.objetivo}</p>
              </div>

              <div className="home-politica-detalle">
                <h3>Normativa y fuente de referencia</h3>
                <p>{politicaActiva.normativa.join(" · ")}</p>
                <a href={politicaActiva.fuente.url} target="_blank" rel="noreferrer">
                  Consultar fuente oficial: {politicaActiva.fuente.nombre}
                </a>
              </div>

              <div className="home-politica-detalle">
                <h3>Contenido</h3>
                <ul>
                  {politicaActiva.contenido.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="home-politica-dos-columnas">
                <div className="home-politica-detalle">
                  <h3>Derechos del usuario</h3>
                  <p>{politicaActiva.derechos}</p>
                </div>
                <div className="home-politica-detalle">
                  <h3>Responsabilidades</h3>
                  <p>{politicaActiva.responsabilidades}</p>
                </div>
              </div>

              <div className="home-politica-alerta">
                <strong>Recomendaciones de seguridad</strong>
                <p>{politicaActiva.recomendaciones}</p>
              </div>

              <p className="home-politica-fecha">
                Fecha de actualización: <strong>{politicaActiva.actualizacion}</strong>
              </p>
            </div>
          </section>
        </div>
      )}

      {/* FOOTER */}
      <footer className="home-footer">
        <p className="footer-text">
          © {new Date().getFullYear()} Financiero. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}

export default Home;