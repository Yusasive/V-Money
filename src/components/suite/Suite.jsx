import React from "react";
import { FaBook } from "react-icons/fa";
const features = [
  {
    icon: <FaBook />,
    title: "Bookkeeping",
    description:
      "Track, record sales and expenses from your mobile device with our simplified bookkeeping tool. Say goodbye to pen and paper forever. ",
  },
  {
    icon: "🧾",
    title: "Invoicing",
    description:
      "Generate and send invoices to your customers, right from your phone. Collect 10X faster with Vmonie digital invoicing.",
  },
  {
    icon: <FaBook />,
    title: "Inventory Management",
    description:
      "Manage your inventories, track your stocks and get live updates on how your business is performing.",
  },
];

const Suite = () => {
  return (
    <div className="px-4 lg:px-16 py-12">
      <h1 className="text-4xl lg:text-[54px] font-bold font-lota text-center lg:px-32 leading-tight">
        A simplified suite of tools to run a smarter business.
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
        {features.map((feature, index) => (
          <div key={index} className="text-left">
            <div className="text-base mb-4 ">{feature.icon}</div>
            <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-500 text-sm">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suite;
