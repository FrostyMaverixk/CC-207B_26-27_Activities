import Header from "../components/Header";
import Footer from "../components/Footer";


function LandingLayout({ children }) {
  return (
    <div className="Landing-Layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default LandingLayout;


