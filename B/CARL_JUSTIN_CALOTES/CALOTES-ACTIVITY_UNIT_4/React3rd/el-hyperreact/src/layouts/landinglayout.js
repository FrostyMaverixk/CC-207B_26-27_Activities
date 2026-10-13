import Header from "../components/header";
import Footer from "../components/footer";

function LandingLayout({ children }) {
    return (
        <div className="landing-layout">
            <Header />

            <main className="main-content">
                {children}
            </main>

            <Footer />
        </div>
    );
}

export default LandingLayout;