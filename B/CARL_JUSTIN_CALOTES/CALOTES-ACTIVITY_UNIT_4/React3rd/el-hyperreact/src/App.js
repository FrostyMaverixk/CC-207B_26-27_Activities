import './App.css';
import Home from './pages/home';
import About from './pages/about';
import Dashboard from './pages/dashboard';
import Course from './pages/course';
import Contact from './pages/contact';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {


    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/course" element={<Course />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
