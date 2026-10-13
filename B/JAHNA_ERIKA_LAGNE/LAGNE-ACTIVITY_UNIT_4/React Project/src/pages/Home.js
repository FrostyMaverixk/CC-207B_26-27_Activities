import adiLogo from "../adi.webp";
import admuLogo from "../admu.png";

function Home() {
  return (
    <div className="home-content">
      <div className="logo-row">
        <img src={adiLogo} alt="Ateneo de Iloilo logo" className="school-logo" />
        <img src={admuLogo} alt="Ateneo de Manila logo" className="school-logo" />
      </div>
      <h1>In Omnibus Amare et Servire</h1>
      <p>Forming leaders through faith, excellence, and service.</p>
      <p>
        Atenean Academy provides a well-rounded education that nurtures the
        mind, character, and community spirit of every student. Our programs
        are designed to inspire curiosity, discipline, and a lifelong pursuit
        of learning.
      </p>
    </div>
  );
}

export default Home;