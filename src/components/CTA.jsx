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

const CTA = () => {
  return (
    <motion.div
      className="bg-black text-white dark:text-black dark:bg-white px-4 lg:px-16 space-y-6 py-14 lg:mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-2xl lg:text-[54px] text-[#30333b] text-center font-bold font-lota leading-tight lg:px-40"
        variants={itemVariants}
      >
        Position your business for success with Vmonie.
      </motion.h1>
      <motion.p
        className="text-base text-center font-semibold font-lota"
        variants={itemVariants}
      >
        Join thousands of businesses who:
      </motion.p>

      <motion.p
        className="text-base text-center font-normal text-gray-600 font-lota lg:px-40"
        variants={itemVariants}
      >
        Already use Vmonie to grow and scale their business, get access to POS
        terminals, business accounts, business tools and access to top tier
        loans to grow your business.
      </motion.p>
      <motion.div
        className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0 justify-center pt-4 lg:pt-10"
        variants={itemVariants}
      >
        <Link
          className="bg-primary hover:bg-[#6871d1] text-sm font-lota font-normal text-white py-3 px-4 rounded-xl text-center"
          to="/onboarding"
        >
          Get Started For Free
        </Link>
        <Link
          className="bg-[#fcfafa] hover:bg-[#eff1fa] text-sm font-lota font-normal text-primary py-3 px-10 rounded-xl text-center"
          to="/"
        >
          Talk To Sales
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default CTA;
