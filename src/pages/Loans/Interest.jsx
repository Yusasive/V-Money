import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion"; 

const Interest = () => {
  const animationVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: { opacity: 1, y: 0, transition: { duration: 1 } },
  };

  return (
    <div>
      <motion.div
        className="flex flex-col lg:flex-row"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }} 
        variants={animationVariants}>
        <div className="lg:w-1/2 bg-[#d6e3f0] px-4 py-10 lg:px-16 rounded-3xl mb-4 lg:mb-0">
          <h1 className="text-[30px] font-lota font-bold mb-6">
            Get up to N1,000,000 in loan. 7 days free interest rate.
          </h1>
          <div className="pt-4">
            <Link
              className="text-base font-medium border-primary border-[1px] py-4 px-7 text-white bg-primary font-lota rounded-2xl"
              to="/">
              Request for loan
            </Link>
          </div>
        </div>
        <div className="lg:w-1/2 items-center justify-center align-middle mb-4 lg:mb-0">
          <img
            className="bg-[#f8f2e8] p-6 rounded-3xl mx-auto"
            src="https://www.usebyte.com/_next/static/media/loan-plan.7b2d2b81.svg"
            alt="Main2"
          />
        </div>
      </motion.div>
      <motion.div
        className="flex flex-col-reverse lg:flex-row lg:-mt-16 lg:z-10 lg:relative"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={animationVariants}>
        <div className="lg:w-1/2 mb-4 lg:mb-0">
          <img
            className="bg-[#f8f2e8] p-6 rounded-3xl"
            src="https://www.usebyte.com/_next/static/media/loan-plan.7b2d2b81.svg"
            alt="Main2"
          />
        </div>
        <div className="lg:w-1/2 bg-[#f3cea0] px-4 py-10 lg:px-16 rounded-3xl mb-4 lg:mb-0">
          <h1 className="text-[30px] font-lota font-bold mb-6">
            Get a POS terminal, business account and an overdraft for your
            business, payback daily in 90 days
          </h1>
          <div className="pt-4">
            <Link
              className="text-base font-medium border-primary border-[1px] py-4 px-9 text-white bg-primary font-lota rounded-2xl"
              to="/">
              Apply for credit
            </Link>
          </div>
          <p className="flex flex-row text-base font-bold font-lota text-[#7e521c] mt-4">
            {" "}
            <span>
              {" "}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM11.25 8C11.25 7.59 11.59 7.25 12 7.25C12.41 7.25 12.75 7.59 12.75 8V13C12.75 13.41 12.41 13.75 12 13.75C11.59 13.75 11.25 13.41 11.25 13V8ZM12.92 16.38C12.87 16.51 12.8 16.61 12.71 16.71C12.61 16.8 12.5 16.87 12.38 16.92C12.26 16.97 12.13 17 12 17C11.87 17 11.74 16.97 11.62 16.92C11.5 16.87 11.39 16.8 11.29 16.71C11.2 16.61 11.13 16.51 11.08 16.38C11.03 16.26 11 16.13 11 16C11 15.87 11.03 15.74 11.08 15.62C11.13 15.5 11.2 15.39 11.29 15.29C11.39 15.2 11.5 15.13 11.62 15.08C11.86 14.98 12.14 14.98 12.38 15.08C12.5 15.13 12.61 15.2 12.71 15.29C12.8 15.39 12.87 15.5 12.92 15.62C12.97 15.74 13 15.87 13 16C13 16.13 12.97 16.26 12.92 16.38Z"
                  fill="#944A05"
                />
              </svg>
            </span>{" "}
            For POS Agents only
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Interest;
