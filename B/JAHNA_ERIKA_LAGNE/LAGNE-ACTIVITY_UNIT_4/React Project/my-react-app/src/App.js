import './App.css';
import Home from './pages/Home';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Course from './pages/Courses';
import Contact from './pages/Contact';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
    

    return (
        <BrowserRouter>
           <Routes>
             <Route path="/" element={<Home />}/>
             <Route path="/dashboard" element={<Dashboard />}/>
             <Route path="/courses" element={<Course />}/>
             <Route path="/about" element={<About />}/>
             <Route path="/contact" element={<Contact />}/>
  
           </Routes>
        
        </BrowserRouter>
    );
}

export default App;