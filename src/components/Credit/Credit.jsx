import React from "react";
import { FaCalendar, FaCamera, FaMarker, FaPercent } from "react-icons/fa";
const features = [
  {
    icon: <FaPercent />,
    title: "Get the low rate you deserve",
    description:
      "With Vmonie, low rates are guaranteed on loans for your business, create account to get access. ",
  },
  {
    icon: <FaMarker />,
    title: "Build your credit score in realtime",
    description:
      "View your business credit score and see how your score grows in real time as you perform transactions.",
  },
  {
    icon: <FaCalendar />,
    title: "Flexible Payment Schedules",
    description:
      "Paying back is easier with our flexible payment schedule, set your own time and let us handle the rest.",
  },
  {
    icon: <FaCamera />,
    title: "Up to N20,000,000 in Capital",
    description:
      "Get access to top tier loans to grow your business comes with a fair rate, flexible payment schedules.",
  },
];

const Credit = () => {
  return (
    <div className="mx-4 lg:mx-16 py-12 bg-[#d6e3f0] rounded-lg">
      <h1 className="text-[30px] lg:text-[36px] font-medium font-lota lg:px-16 px-4 lg:w-[80%]">
      <b>Get a 10X credit</b> of your business capital
      when you transact <b>with Vmonie.</b>
    
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 px-4 lg:px-16">
        {features.map((feature, index) => (
          <div key={index} className="flex flex-row text-left space-x-4">
            <div className="text-2xl mb-4 content-center">{feature.icon}</div>
            <div>
              <h3 className="text-[22px] font-bold mb-2 text-gray-800">{feature.title}</h3>
              <p className="font-normal text-sm">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Credit;
