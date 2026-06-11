import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({ 
  label, 
  type = 'text', 
  error, 
  icon: Icon, // Icono opcional para la parte izquierda
  className = '', 
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {/* ETIQUETA (LABEL) */}
      {label && (
        <label className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}

      {/* CONTENEDOR DEL INPUT */}
      <div className="relative flex items-center">
        {/* Icono Izquierdo si existe */}
        {Icon && (
          <div className="absolute left-3 text-slate-500 pointer-events-none">
            <Icon size={18} />
          </div>
        )}

        {/* INPUT DE TEXTO */}
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full bg-slate-800 text-slate-100 placeholder-slate-500 text-sm rounded-xl
            py-2.5 transition-all duration-200 outline-none border
            ${Icon ? 'pl-10' : 'pl-4'} 
            ${isPassword ? 'pr-10' : 'pr-4'}
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
              : 'border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}
          `}
          {...props}
        />

        {/* Botón de Ojo para contraseñas */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {/* MENSAJE DE ERROR */}
      {error && (
        <span className="text-xs font-medium text-red-400 mt-0.5 animate-fade-in">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;