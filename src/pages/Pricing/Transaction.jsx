import React from "react";

const cardData = [
  {
    id: 1,
    amount: "0.5%",
    title: "POS Transactions",
    description:
      "We charge a small 0.5% charges on all incoming POS transaction and it’s capped at N150.00.",
  },
  {
    id: 2,
    amount: "₦0.00",
    title: "Inflow (Business account)",
    description:
      "All incoming transaction to your business account is free and we won’t charge you, you keep every penny.",
  },

  {
    id: 3,
    amount: "₦0.00",
    title: "Outflow (Transfers)",
    description:
      "Make free and instant transfer to any bank of your choice in Nigeria for free, no hidden fees.",
  },

  {
    id: 4,
    amount: "₦0.00",
    title: "Bills payment",
    description:
      "You don’t pay us we pay you, enjoy up to 10% in commission when you pay bills with Byte.",
  },
];

const Transaction = () => {
  return (
    <div className="px-4 lg:px-48 py-20 grid grid-cols-1 md:grid-cols-2 gap-10 bg-[#d6e3f0]">
      {cardData.map((card) => (
        <div key={card.id} className="lg:pr-20">
          <h2 className="text-[54px] text-black font-bold font-lota">{card.amount}</h2>
          <h3 className="text-2xl text-primary font-medium font-lota">{card.title}</h3>
          <p className="text-base text-black font-normal font-lota ">{card.description}</p>
        </div>
      ))}
    </div>
  );
};

export default Transaction;
