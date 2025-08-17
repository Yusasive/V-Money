import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContent } from '../hooks/useContent';

const Hero = () => {
  const { content, loading, error } = useContent('hero');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading content</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 lg:px-16 flex items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div className="space-y-8" variants={itemVariants}>
          {content?.subtitle && (
            <motion.p
              className="text-primary font-semibold text-lg"
              variants={itemVariants}
            >
              {content.subtitle}
            </motion.p>
          )}
          
          <motion.h1
            className="text-4xl lg:text-6xl font-bold text-gray-900 font-lota leading-tight"
            variants={itemVariants}
          >
            {content?.title || 'Position your business for success with Vmonie.'}
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-600 font-lota leading-relaxed"
            variants={itemVariants}
          >
            {content?.description || 'Get access to business accounts, POS terminals, loans, and business tools to grow and scale your business operations.'}
          </motion.p>
          
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            variants={itemVariants}
          >
            <Link
              to={content?.buttonLink || '/onboarding'}
              className="bg-primary hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl text-center transition-colors duration-300 font-lota"
            >
              {content?.buttonText || 'Get Started For Free'}
            </Link>
            <Link
              to="/pricing"
              className="bg-white hover:bg-gray-50 text-primary font-semibold py-4 px-8 rounded-xl text-center border-2 border-primary transition-colors duration-300 font-lota"
            >
              View Pricing
            </Link>
          </motion.div>
        </motion.div>
        
        <motion.div
          className="relative"
          variants={itemVariants}
        >
          {content?.imageUrl ? (
            <img
              src={content.imageUrl}
              alt="Vmonie Business Solutions"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          ) : (
            <div className="w-full h-96 bg-gradient-to-br from-primary to-blue-600 rounded-2xl shadow-2xl flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">💼</div>
                <p className="text-xl font-semibold">Business Solutions</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Hero;
