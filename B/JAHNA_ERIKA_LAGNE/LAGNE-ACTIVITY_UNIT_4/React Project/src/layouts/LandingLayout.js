import Header from "../components/Header";
import Footer from "../components/Footer";

function LandingLayout({children}){
    return(
        <div className="landing-layout">
            <Header/>
                <main className="main-content">
                    {children}
                </main>
            <Footer/>
        </div>
    );
}
export default LandingLayout;