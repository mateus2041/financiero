import React from 'react';
import { Facebook, Twitter, Instagram, Github, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Soluciones',
      links: ['Analítica', 'Marketing', 'Comercio', 'Perspectivas'],
    },
    {
      title: 'Soporte',
      links: ['Precios', 'Documentación', 'Guías', 'Estado API'],
    },
    {
      title: 'Compañía',
      links: ['Acerca de', 'Blog', 'Empleo', 'Prensa'],
    },
    {
      title: 'Legal',
      links: ['Privacidad', 'Términos', 'Cookies', 'Licencia'],
    },
  ];

  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 w-full">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        
        {/* SECCIÓN SUPERIOR: ENLACES Y NEWSLETTER */}
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          
          {/* Enlaces organizados en grid */}
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
                  {sections[0].title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {sections[0].links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-base hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
                  {sections[1].title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {sections[1].links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-base hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
                  {sections[2].title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {sections[2].links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-base hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
                  {sections[3].title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {sections[3].links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-base hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Formulario de Suscripción */}
          <div className="mt-8 xl:mt-0">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              Suscríbete a nuestro boletín
            </h3>
            <p className="mt-4 text-base text-slate-400">
              Las últimas noticias y actualizaciones enviadas directamente a tu bandeja de entrada.
            </p>
            <form className="mt-4 sm:flex sm:max-w-md">
              <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 text-base text-slate-900 placeholder-slate-500 bg-white border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Tu correo electrónico"
              />
              <div className="mt-3 rounded-xl sm:mt-0 sm:ml-3 sm:shrink-0">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-4 py-2 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Suscribirse
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SECCIÓN INFERIOR: COPYRIGHT Y REDES SOCIALES */}
        <div className="mt-12 pt-8 border-t border-slate-800 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Facebook size={20} /></a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github size={20} /></a>
          </div>
          <p className="mt-8 text-base text-slate-500 md:mt-0 md:order-1">
            &copy; {currentYear} TuEmpresa, Inc. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;