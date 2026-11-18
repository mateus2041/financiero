import ChatIA from "../pages/ChatIA";

export default function AssistantModal({
  onClose,
  overlayClassName = "asistente-modal-overlay",
}) {
  return (
    <div
      className={overlayClassName}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="asistente-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asistente-titulo"
      >
        <ChatIA onClose={onClose} />
      </div>
    </div>
  );
}
