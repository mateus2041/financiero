import Historial from "../pages/historial";
import RegistrarLlaveBreB from "../pages/transferenciascr";

export default function ChatAssistantDialogs({
  mostrarHistorial,
  onCloseHistorial,
  mostrarLlaveBreB,
  onCloseLlaveBreB,
}) {
  return (
    <>
      {mostrarHistorial && (
        <div
          className="historial-asistente-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseHistorial();
          }}
        >
          <div
            className="historial-asistente-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="historial-asistente-titulo"
          >
            <div className="historial-asistente-header">
              <h2 id="historial-asistente-titulo">Historial de transacciones</h2>
              <button
                type="button"
                onClick={onCloseHistorial}
                aria-label="Cerrar historial"
              >
                ×
              </button>
            </div>
            <div className="historial-asistente-body">
              <Historial isModal />
            </div>
          </div>
        </div>
      )}
      {mostrarLlaveBreB && (
        <div
          className="historial-asistente-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseLlaveBreB();
          }}
        >
          <section
            className="llave-breb-asistente-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="llave-breb-asistente-titulo"
          >
            <div className="historial-asistente-header">
              <h2 id="llave-breb-asistente-titulo">Registrar llave Bre-B</h2>
              <button
                type="button"
                onClick={onCloseLlaveBreB}
                aria-label="Cerrar registro de llave Bre-B"
              >
                ×
              </button>
            </div>
            <div className="llave-breb-asistente-body">
              <RegistrarLlaveBreB isModal />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
