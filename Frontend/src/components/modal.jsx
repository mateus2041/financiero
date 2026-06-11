import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Bloquear el scroll del fondo cuando el modal esté abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  //createPortal renderiza el componente directamente en el body del HTML
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      {/* FONTO TRASLÚCIDO (OVERLAY) */}
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose} 
      />

      {/* CONTENEDOR DEL MODAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden transform transition-all z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* CABECERA */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-6 text-slate-300 text-sm">
          {children}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default Modal;