import React from "react";
import { useContent } from "../../hooks/useContent";

const Transaction = () => {
  const { content, loading } = useContent('pricing');

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  const cardData = content?.pricing || [];

  return (
    <div className="px-4 lg:px-48 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 bg-[#d6e3f0]">
      {cardData.map((card) => (
        <div key={index} className="lg:pr-20">
          <h2 className="text-[54px] text-gray-600 font-bold font-lota">{card.amount}</h2>
          <h3 className="text-2xl text-primary font-medium font-lota">{card.title}</h3>
          <p className="text-base text-black font-normal font-lota ">{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default Transaction;
