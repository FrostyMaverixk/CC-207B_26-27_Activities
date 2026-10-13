function Sidebar() {
    return (
        <aside className="aside">
            <h1>Menu</h1>
            <ul className="menu-item">
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/courses">Courses</a></li>
                <li>Students</li>
                <li>Logout</li>
            </ul>
        </aside>
    );
}
export default Sidebar;