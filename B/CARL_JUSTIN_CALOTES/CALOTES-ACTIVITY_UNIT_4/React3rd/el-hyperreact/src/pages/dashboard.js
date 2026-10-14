import MainLayout from "../layouts/mainlayout";

function Dashboard() {
    return (
        <MainLayout>
            <div>
                <h4>Dashboard Content</h4>

                <div className="card-container">
                    <div className="card">
                        <p>Card 1</p>
                    </div>

                    <div className="card">
                        <p>Card 2</p>
                    </div>

                    <div className="card">
                        <p>Card 3</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}

export default Dashboard;