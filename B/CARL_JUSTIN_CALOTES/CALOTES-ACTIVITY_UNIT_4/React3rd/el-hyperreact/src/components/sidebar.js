function Sidebar () {
    return (
        <aside>
            <h4>Menu</h4>
            <ul className="menu-item">
                <li>Dashboard</li>
                <a href="/course"><li>Course</li></a>
                <li>Students</li>
                <li>Log Out</li>

            </ul>
        </aside>


    );

}

export default Sidebar;