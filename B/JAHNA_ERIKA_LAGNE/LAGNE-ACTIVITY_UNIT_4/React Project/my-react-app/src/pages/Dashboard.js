import MainLayout from "../layouts/MainLayout";
function Dashboard() {
    return (
        <>
        <MainLayout>
        <div>
            <h4>Dashboard Content</h4>
            <div className="card-container">
                <div className="card">
                    <h3>Pink isn't just a color, it's an attitude!</h3>
                </div>

                <div className="card">
                    <h3>I love the color pink. It makes a bold statement.</h3>
                </div>

                <div className="card">
                    <h3>Life looks better through rose-colored glasses.</h3>
                </div>
            </div>
        </div>
        </MainLayout>
        </>
    );
}

export default Dashboard;