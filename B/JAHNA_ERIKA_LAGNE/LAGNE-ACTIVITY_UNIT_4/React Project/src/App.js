import './App.css';
import LandingLayout from './layouts/LandingLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';

function App() {
  const path = window.location.pathname;

  if (path === "/about") {
    return (
      <MainLayout>
        <About />
      </MainLayout>
    );
  } else if (path === "/contact") {
    return (
      <MainLayout>
        <Contact />
      </MainLayout>
    );
  } else if (path === "/dashboard") {
    return (
      <MainLayout>
        <Dashboard />
      </MainLayout>
    );
  } else if (path === "/courses") {
    return (
      <MainLayout>
        <Courses />
      </MainLayout>
    );
  }

  return (
    <LandingLayout>
      <Home />
    </LandingLayout>
  );
}

export default App;