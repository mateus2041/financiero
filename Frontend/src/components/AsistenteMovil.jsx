import { Link } from "react-router-dom";
import useAssistantBenefit from "../hooks/useAssistantBenefit";

function AsistenteMovil({ onClick, to }) {
  const beneficioHabilitado = useAssistantBenefit();

  if (!beneficioHabilitado) {
    return null;
  }

  const props = {
    className: "asistente-flotante",
    "aria-label": "Abrir asistente IA",
    title: "Asistente IA",
  };

  if (to) {
    return (
      <Link to={to} {...props}>
        🤖
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} {...props}>
      🤖
    </button>
  );
}

export default AsistenteMovil;
