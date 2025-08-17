import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useContent } from "../../hooks/useContent";

const Main1 = () => {
  const { content, loading } = useContent('main1');

  const containerVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeInOut", staggerChildren: 0.2 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (loading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <motion.div
      className="flex flex-col lg:flex-row py-10 items-center justify-between px-4 lg:px-16 space-y-4 lg:space-y-0"
      variants={containerVariant}
      initial="hidden"
      animate="visible">
      <motion.div variants={itemVariant}>
        <h1 className="text-xl text-black font-lota font-semibold text-center lg:text-left">
          {content?.title || "Everything you need to collect payment for your business"}
        </h1>
      </motion.div>
      <motion.div
        className="flex flex-col lg:flex-row lg:space-x-2 space-y-3 lg:space-y-0"
        variants={itemVariant}>
        <Link
          className="text-base text-white font-medium border-primary border-[1px] py-3 px-7 bg-primary font-lota rounded-2xl"
          to="/">
          Business account
        </Link>
        <Link
          className="text-base font-medium border-primary border-[1px] py-3 px-7 text-black hover:bg-primary font-lota rounded-2xl"
          to="/">
          POS
        </Link>
        <Link
          className="text-base font-medium border-primary border-[1px] py-3 px-7 text-black hover:bg-primary font-lota rounded-2xl"
          to="/">
          Sub accounts
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default Main1;
