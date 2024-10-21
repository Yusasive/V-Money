import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Main3 = () => {
  const containerVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeInOut", staggerChildren: 0.3 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const imageVariant = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8 } },
  };

  return (
    <div className="flex flex-col-reverse lg:flex-row">
      <motion.div
        className="lg:w-1/2 items-center justify-center align-middle lg:h-60"
        variants={imageVariant}
        initial="hidden"
        animate="visible">
        <img
          className="mx-auto "
          src="https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fpos.1228e63d.png&w=384&q=75"
          alt="Main3"
        />
      </motion.div>
      <motion.div
        className="lg:w-1/2 bg-[#f0ddc6] px-4 py-20 lg:py-32 lg:px-16 space-y-6"
        variants={containerVariant}
        initial="hidden"
        animate="visible">
        <motion.h1
          className="text-[40px] font-lota font-bold leading-tight"
          variants={itemVariant}>
          Receive payment with Vmonie POS.
        </motion.h1>
        <motion.p
          className="text-sm font-lota font-medium text-gray-500"
          variants={itemVariant}>
          Quickly accept visa and Mastercard payment from your customers, with a
          specially designed device for your business.
        </motion.p>
        <motion.div className="pt-4" variants={itemVariant}>
          <Link
            className="text-base font-medium border-primary border-[1px] py-4 px-7 text-white bg-primary font-lota rounded-2xl"
            to="/">
            Setup my account
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Main3;
