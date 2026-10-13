import Header from "../components/header";
import Footer from "../components/footer";
import Sidebar from "../components/sidebar";

function MainLayout({ children }) {
    return (
        <div className="main-layout">
            <Header/>

            <div className="main-layout-content">
                <Sidebar/>

                <main>
                    {children}
                </main>
            </div>

            <Footer/>
        </div>
    );
}

export default MainLayout;