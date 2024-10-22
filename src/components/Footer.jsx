import React from "react";
import { motion } from "framer-motion";

// Variants for the footer elements
const footerVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.2 } },
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const iconVariant = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

const Footer = () => {
  return (
    <motion.footer
      initial="hidden"
      animate="visible"
      variants={footerVariant}
      className="bg-white text-black dark:text-white dark:bg-black pt-20 px-4 lg:px-16">
      
      <div className="mx-auto w-full max-w-screen-xl">
        <div className="grid grid-cols-1 gap-8 px-4 py-6 lg:py-8 md:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={itemVariant}>
            <h2 className="mb-6 text-xl font-lota font-semibold text-black dark:text-white">Products</h2>
            <ul className="text-black dark:text-white text-[15px] font-lota font-semibold">
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">About</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Careers</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Brand Center</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Blog</a>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariant}>
            <h2 className="mb-6 text-xl font-lota font-semibold text-black dark:text-white">Business Type</h2>
            <ul className="text-black dark:text-white text-[15px] font-lota font-semibold">
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Discord Server</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Twitter</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Facebook</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Contact Us</a>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariant}>
            <h2 className="mb-6 text-xl font-lota font-semibold text-black dark:text-white">Resources</h2>
            <ul className="text-black dark:text-white text-[15px] font-lota font-semibold">
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Privacy Policy</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Licensing</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="hover:underline">Terms & Conditions</a>
              </motion.li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariant}>
            <h2 className="mb-6 text-xl font-lota font-semibold text-black dark:text-white">Contact</h2>
            <ul className="text-black dark:text-white text-[15px] font-lota font-semibold">
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="https://wa.link/meq197" className="underline">WhatsApp: +234 810 747 0376</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="https://wa.link/ll6leo" className="underline">Phone: +234 915 101 9503</a>
              </motion.li>
              <motion.li className="mb-4" variants={itemVariant}>
                <a href="/" className="underline">Email: Vmonie@gmail.com</a>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        <div className="px-4 py-6 md:flex md:items-center md:justify-between border-y-[1px] border-gray-300">
          <motion.span
            variants={itemVariant}
            className="text-black dark:text-white text-[15px] font-lota font-medium sm:text-center">
            Nigeria
          </motion.span>
          
          <div className="flex mt-4 sm:justify-center md:mt-0 space-x-5 rtl:space-x-reverse">
            <motion.a
              href="/"
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              variants={iconVariant}>
              {/* Facebook Icon */}
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 8 19">
                <path fillRule="evenodd" d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z" clipRule="evenodd"/>
              </svg>
              <span className="sr-only">Facebook page</span>
            </motion.a>

            <motion.a
              href="/"
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              variants={iconVariant}>
              {/* Twitter Icon */}
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 17">
                <path fillRule="evenodd" d="M20 1.892a8.178 8.178 0 0 1-2.355.635 4.074 4.074 0 0 0 1.8-2.235 8.344 8.344 0 0 1-2.605.98A4.13 4.13 0 0 0 13.85 0a4.068 4.068 0 0 0-4.1 4.038 4 4 0 0 0 .105.919A11.705 11.705 0 0 1 1.4.734a4.006 4.006 0 0 0 1.268 5.392 4.165 4.165 0 0 1-1.859-.5v.05A4.057 4.057 0 0 0 4.1 9.635a4.19 4.19 0 0 1-1.856.07 4.108 4.108 0 0 0 3.831 2.807A8.36 8.36 0 0 1 0 14.184 11.732 11.732 0 0 0 6.291 16 11.502 11.502 0 0 0 17.964 4.5c0-.177 0-.35-.012-.523A8.143 8.143 0 0 0 20 1.892Z" clipRule="evenodd"/>
              </svg>
              <span className="sr-only">Twitter page</span>
            </motion.a>

            <motion.a
              href="/"
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              variants={iconVariant}>
              {/* GitHub Icon */}
              <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 .249a10 10 0 0 0-3.162 19.5c.5.092.682-.217.682-.483 0-.237-.008-.866-.012-1.7-2.775.601-3.362-1.336-3.362-1.336a2.643 2.643 0 0 0-1.107-1.45c-.905-.617.069-.605.069-.605a2.104 2.104 0 0 1 1.534 1.032 2.131 2.131 0 0 0 2.917.834 2.136 2.136 0 0 1 .634-1.34c-2.217-.252-4.554-1.107-4.554-4.932 0-1.089.389-1.98 1.028-2.676a3.578 3.578 0 0 1 .098-2.639s.836-.268 2.74 1.022a9.434 9.434 0 0 1 4.99 0c1.9-1.29 2.737-1.022 2.737-1.022.548 1.378.202 2.463.1 2.638.64.696 1.026 1.587 1.026 2.676 0 3.836-2.344 4.676-4.575 4.923.361.31.684.929.684 1.87 0 1.35-.012 2.44-.012 2.775 0 .27.18.583.687.482a10 10 0 0 0-3.162-19.5Z" clipRule="evenodd"/>
              </svg>
              <span className="sr-only">GitHub account</span>
            </motion.a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
