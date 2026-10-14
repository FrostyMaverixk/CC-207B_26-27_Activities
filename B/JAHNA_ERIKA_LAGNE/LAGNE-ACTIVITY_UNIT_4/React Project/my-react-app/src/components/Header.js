import { Link } from "react-router-dom";
function Header(){
    return(
        <header className = "header">
            <p>My React Application</p>

            <nav className= "nav-bar">
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
                <Link to="/dashboard">Dashboard</Link>
            </nav>
        </header>
    );
}

export default Header;