import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useContent } from "../../hooks/useContent";

const Main4 = () => {
  const { content, loading } = useContent('main4');

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

  if (loading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row">
      <motion.div
        className="lg:w-1/2 bg-[#d6e3f0] px-4 py-20 lg:py-32 lg:px-16 space-y-6"
        variants={containerVariant}
        initial="hidden"
        animate="visible">
        <motion.h1
          className="text-[40px] font-lota font-bold leading-tight"
          variants={itemVariant}>
          {content?.title || "Manage multiple outlets in one go."}
        </motion.h1>
        <motion.p
          className="text-sm font-lota font-medium text-gray-500"
          variants={itemVariant}>
          {content?.description || "Run a franchise or branch business? No problem, create sub-account for different branches of your business, and get access to everything going on with your business."}
        </motion.p>
        <motion.div className="pt-4" variants={itemVariant}>
          <Link
            className="text-base font-medium border-primary border-[1px] py-4 px-7 text-white bg-primary font-lota rounded-2xl"
            to={content?.buttonLink || "/onboarding"}>
            {content?.buttonText || "Setup my account"}
          </Link>
        </motion.div>
      </motion.div>
      <motion.div
        className="lg:w-1/2 items-center justify-center align-middle"
        variants={imageVariant}
        initial="hidden"
        animate="visible">
        <img
          className="mx-auto "
          src={content?.imageUrl || "https://www.usebyte.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Faccount.e1f7aa13.png&w=640&q=75"}
          alt="Main4"
        />
      </motion.div>
    </div>
  );
};

export default Main4;
