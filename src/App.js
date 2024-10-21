import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing/Pricing";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./pages/Footer";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
