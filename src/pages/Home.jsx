import React from "react";
import CTA from "../components/CTA";
import Main1 from "../components/MainSection/Main1";
import Main2 from "../components/MainSection/Main2";
import Main3 from "../components/MainSection/Main3";
import Main4 from "../components/MainSection/Main4";
import Suite from "../components/suite/Suite";
import Credit from "../components/Credit/Credit";
const Home = () => {
  return (
    <div>
      <CTA />
      <Main1 />
      <Main2 />
      <Main3 />
      <Main4 />
      <Suite />
      <Credit />
    </div>
  );
};

export default Home;
