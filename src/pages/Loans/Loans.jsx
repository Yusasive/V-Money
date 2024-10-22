import React from "react";
import { Link } from "react-router-dom";
import Interest from "./Interest";

const Loans = () => {
  return (
    <div className="px-4 md:px-10 pt-8">
      <div className="flex flex-col lg:flex-row items-center">
        <h1 className="text-4xl lg:text-[54px] font-bold font-lota lg:w-[70%] mb-6 md:mb-0">
          Save your business from dying. Get a business loan in 5 mins
        </h1>
        <Link
          className="text-base font-medium border-primary border-[1px] py-4 px-12 text-white bg-primary font-lota lg:ml-16 rounded-2xl"
          to="/">
          Apply for loan
        </Link>
      </div>
      <div className="w-full h-[400px] my-20 bg-cover bg-[url('https://res.cloudinary.com/ddxssowqb/image/upload/v1729604390/image_utmpga.png')]"></div>
      <div className="md:w-2/3">
        <h1 className="text-4xl lg:text-[54px] font-bold font-lota lg:w-[70%] mb-6 md:mb-0 leading-tight">
          Get the capital you need to scale your business.
        </h1>
      </div>
      <Interest />
    </div>
  );
};

export default Loans;
