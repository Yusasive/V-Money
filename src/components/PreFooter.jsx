import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.1,
      duration: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const PreFooter = () => {
  return (
    <motion.div
      className="bg-white text-black dark:text-white dark:bg-black px-4 lg:px-16 space-y-6 py-20 lg:mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible">
      <motion.h1
        className="text-2xl lg:text-[54px] text-center font-bold font-lota"
        variants={itemVariants}>
        Start scaling with Vmonie.
      </motion.h1>
      <motion.p
        className="text-lg lg:text-2xl text-center font-semibold font-lota lg:px-40"
        variants={itemVariants}>
        Join over 1,000+ business owners who already streamline their daily
        business operations with Vmonie software.
      </motion.p>

      <motion.div
        className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0 justify-center pt-4 lg:pt-10"
        variants={itemVariants}>
        <Link
          className="bg-primary hover:bg-[#6871d1] text-sm font-lota font-normal text-white py-3 px-10 rounded-xl text-center"
          to="/">
          Get Started
        </Link>
        <Link
          className="bg-white hover:bg-[#eff1fa] text-sm font-lota font-normal text-primary py-3 px-10 rounded-xl text-center"
          to="/">
          Contact Sales
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default PreFooter;
