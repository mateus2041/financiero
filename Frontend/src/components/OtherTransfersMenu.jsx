import { useState } from "react";
import { Link } from "react-router-dom";
import { activateOnEnterOrSpace } from "../utils/helpers";

export default function OtherTransfersMenu({ breBFirst = false }) {
  const [open, setOpen] = useState(false);
  const links = breBFirst
    ? [
        { to: "/transferencias", label: "➡ Enviar dinero" },
        { to: "/transferencias-scr", label: "📤 Registrar Llave Bre-B" },
        { to: "/corriente", label: "🧾 Transferir" },
      ]
    : [
        { to: "/transferencias", label: "➡ Enviar dinero" },
        { to: "/corriente", label: "🧾 Transferir" },
        { to: "/transferencias-scr", label: "📤 Registrar Llave Bre-B" },
      ];

  return (
    <li>
      <div
        className="menu-item"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) =>
          activateOnEnterOrSpace(event, () => setOpen((isOpen) => !isOpen))
        }
      >
        💳 Otros{" "}
        {open ? "▲" : "▼"}
      </div>
      {open && (
        <ul className="submenu">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
