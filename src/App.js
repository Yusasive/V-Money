import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Pricing from "./pages/Pricing/Pricing";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./pages/Footer";
import Loans from "./pages/Loans/Loans";
import ScrollToTop from "./ScrollToTop";
import OnboardingForm from "./components/Navbar/OnboardingForm";

const App = () => {
  return (
    <Router>
      <Navbar />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/onboarding" element={<OnboardingForm />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
