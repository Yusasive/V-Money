import React from "react";
import CTA from "../components/CTA";
import Main1 from "../components/MainSection/Main1";
import Main2 from "../components/MainSection/Main2";
import Main3 from "../components/MainSection/Main3";
import Main4 from "../components/MainSection/Main4";
import Suite from "../components/suite/Suite";
import Credit from "../components/Credit/Credit";
import CategoryCarousel from "../components/Slides/CategoryCarousel";
import TestimonialSlider from "../components/Slides/TestimonialSlider";
const Home = () => {
  return (
    <div>
      <CTA />
      <CategoryCarousel />
      <Main1 />
      <Main2 />
      <Main3 />
      <Main4 />
      <Suite />
      <Credit />
      <TestimonialSlider />
    </div>
  );
};

export default Home;
