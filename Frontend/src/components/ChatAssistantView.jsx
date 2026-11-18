import { Fragment } from "react";

export function ChatTranscript({
  messages,
  options,
  onSelectOption,
  isLoading,
  renderMessage,
}) {
  return (
    <div className="chat-body">
      {messages.map((message, index) => (
        <Fragment key={index}>
          {renderMessage
            ? renderMessage(message, index)
            : (
                <div className={message.tipo === "usuario" ? "usuario" : "ia"}>
                  {message.texto}
                </div>
              )}
        </Fragment>
      ))}

      {options && (
        <div className="chat-opciones" role="group" aria-label="Opciones de ayuda">
          {options.map((option) => (
            <button
              key={option.etiqueta}
              type="button"
              onClick={() => onSelectOption(option)}
              disabled={isLoading}
            >
              {option.etiqueta}
            </button>
          ))}
        </div>
      )}

      {isLoading && <div className="ia">Escribiendo...</div>}
    </div>
  );
}

export function ChatComposer({
  question,
  setQuestion,
  inputRef,
  sendQuestion,
  isLoading,
  writeEnabled,
  waitingForKey,
  onUnlock,
  lockedPlaceholder = "Escribe una pregunta...",
  lockedAriaLabel = "Escribe una pregunta para el asistente",
}) {
  const disabled = (!writeEnabled && !waitingForKey) || isLoading;

  return (
    <div className="chat-footer">
      <input
        className="chat-input"
        type="text"
        placeholder={
          waitingForKey
            ? "Escribe la llave Bre-B de la persona..."
            : writeEnabled
              ? "Escribe una pregunta..."
              : lockedPlaceholder
        }
        value={question}
        disabled={disabled}
        ref={inputRef}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (writeEnabled || waitingForKey)) {
            void sendQuestion();
          }
        }}
        aria-label={
          waitingForKey
            ? "Escribe la llave Bre-B del destinatario"
            : writeEnabled
              ? "Escribe una pregunta para el asistente"
              : lockedAriaLabel
        }
      />
      {onUnlock && (
        <button
          type="button"
          className="chat-unlock-button"
          onClick={onUnlock}
          disabled={isLoading}
          aria-pressed={writeEnabled}
        >
          {writeEnabled ? "Escritura habilitada" : "Desbloquear escritura"}
        </button>
      )}
      <button type="button" onClick={() => sendQuestion()} disabled={disabled}>
        {waitingForKey ? "Continuar" : "Enviar"}
      </button>
    </div>
  );
}
