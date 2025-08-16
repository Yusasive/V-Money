import React from "react";
import FAQs from "../components/FAQs";
import PreFooter from "../components/PreFooter";
import FooterConst from "../components/Footer";
import { useLocation } from "react-router-dom";

const Footer = () => {
  const location = useLocation();

  return (
    <div>
      {/* Hide PreFooter on /onboarding */}
      {location.pathname !== "/onboarding" && <FAQs />}
      {location.pathname !== "/onboarding" && <PreFooter />}
      <FooterConst />
    </div>
  );
};

export default Footer;
