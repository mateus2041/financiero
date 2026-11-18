import { Link } from "react-router-dom";
import OtherTransfersMenu from "./OtherTransfersMenu";

export default function FinancialSidebar({
  menuAbierto,
  onLogout,
  onAssistantOpen,
  breBFirst = false,
  accountClassName = "active",
  reportLabel = "📊 Reportes",
  certificateClassName = "sidebar-link",
  cardLabel = "🚫 bloque de trajeta ",
  showCardLink = true,
  showAssistant = true,
  assistantClassName = "btn-nav asistente-sidebar-trigger",
}) {
  return (
    <aside className={`sidebar ${menuAbierto ? "sidebar-abierto" : "sidebar-cerrado"}`}>
      <ul>
        <li>
          <Link to="/cuenta" className={accountClassName || undefined}>
            💷 Cuenta
          </Link>
        </li>
        <li>
          <Link to="/historial">📜 Historial Monetario</Link>
        </li>
        <li>
          <Link to="/reporte">{reportLabel}</Link>
        </li>
        <OtherTransfersMenu breBFirst={breBFirst} />
        <li>
          <Link to="/certificado" className={certificateClassName || undefined}>
            📄 Certificado Bancario
          </Link>
        </li>
        <li>
          <Link to="/ajustes" className="btn-nav">
            ⚙️ Ajustes
          </Link>
        </li>
        {showCardLink && (
          <li>
            <Link to="/desbloquear-cuenta" className="btn-nav">
              {cardLabel}
            </Link>
          </li>
        )}
        {showAssistant && (
          <li>
            <button
              type="button"
              className={assistantClassName}
              onClick={onAssistantOpen}
            >
              🤖 Asistente IA
            </button>
          </li>
        )}
      </ul>
      <button className="logout" onClick={onLogout}>
        🚪 Cerrar sesión
      </button>
    </aside>
  );
}
