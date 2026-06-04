import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav>
      <h2>Financiero</h2>

      <ul>
        <li>
          <Link to="/">Inicio</Link>
        </li>

        <li>
          <Link to="/cuenta">Cuenta</Link>
        </li>

        <li>
          <Link to="/certificado">Certificado</Link>
        </li>

        <li>
          <Link to="/login">Login</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;