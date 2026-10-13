import  { Link } from "react-router-dom";

function Header() {
    return (
        <header className="header">
            <p>El Hyperreact</p>

            <nav className="nav-bar">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/dashboard">Dashboard</Link>
            </nav>
        </header>
    );
}

export default Header;