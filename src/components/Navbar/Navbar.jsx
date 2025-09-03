import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import Logo from "../../assets/logo.png";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="sticky top-0 z-50 bg-white bg-opacity-5 backdrop-blur-lg shadow-lg font-averta navbar">
      <div className="flex items-center justify-between px-4 lg:px-16  py-2">
        <div>
          <Link to="/">
            <img
              src={Logo}
              alt="Vmonie"
              className="w-[117px] lg:w-[150px] h-auto "
            />
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex space-x-4">
            <div className="md:flex space-x-6 items-center mr-16">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary text-lg font-semibold font-lota"
                    : "text-black text-lg font-semibold font-lota hover:text-primary"
                }
              >
                Product
              </NavLink>
              <NavLink
                to="/loans"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary text-lg font-semibold font-lota"
                    : "text-black text-lg font-semibold font-lota hover:text-primary"
                }
              >
                Resources
              </NavLink>
              <NavLink
                to="/company"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary text-lg font-semibold font-lota"
                    : "text-black text-lg font-semibold font-lota hover:text-primary"
                }
              >
                Company
              </NavLink>
              <NavLink
                to="/pricing"
                className={({ isActive }) =>
                  isActive
                    ? "text-primary text-lg font-semibold font-lota"
                    : "text-black text-lg font-semibold font-lota hover:text-primary"
                }
              >
                Pricing
              </NavLink>
            </div>
            <div className="flex flex-row lg:flex-row justify-center py-5 space-x-6">
              <Link
                className="bg-[#eff1fa] text-primary py-3 px-6 rounded-xl text-center hover:bg-[#e4e6ee]"
                to="/login"
              >
                Login
              </Link>
              {location.pathname !== "/onboarding" && (
                <Link
                  className="bg-primary hover:bg-[#6871d1] text-white py-3 px-6 rounded-xl text-center"
                  to="/onboarding"
                >
                  Start for free
                </Link>
              )}
            </div>
          </div>

          <button onClick={toggleMenu} className="md:hidden focus:outline-none">
            {isOpen ? (
              <IoMdClose className="w-8 h-8" />
            ) : (
              <IoMdMenu className="w-8 h-8" />
            )}
          </button>
        </div>
      </div>

      <motion.div
        className={`md:hidden ${isOpen ? "block" : "hidden"} p-4`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="flex flex-col space-y-4 items-center justify-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-primary text-start text-base font-semibold font-lota"
                : "text-gray-700 text-sm font-semibold font-lota hover:text-primary"
            }
          >
            PRODUCT
          </NavLink>
          <NavLink
            to="/loans"
            className={({ isActive }) =>
              isActive
                ? "text-primary text-start text-base font-semibold font-lota"
                : "text-gray-700 text-sm font-semibold font-lota hover:text-primary"
            }
          >
            RESOURCES
          </NavLink>
          <NavLink
            to="/company"
            className={({ isActive }) =>
              isActive
                ? "text-primary  text-base font-semibold font-lota"
                : "text-gray-700 text-sm font-semibold font-lota hover:text-primary"
            }
          >
            COMPANY
          </NavLink>
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              isActive
                ? "text-primary text-base font-semibold font-lota"
                : "text-gray-700 text-sm font-semibold font-lota hover:text-primary"
            }
          >
            PRICING
          </NavLink>
        </div>
      </motion.div>
      {isOpen && (
        <motion.div
          className="flexf flex-col space-y-5 bg-white items-center bg-opacity-10 backdrop-blur-md p-4 rounded-md mt-2 flex md:hidden px-16 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            className="bg-[#f5c58a] text-white py-3 px-6 rounded-xl text-center w-full hover:bg-[#FF8C00]"
            to="/login"
          >
            Login
          </Link>
          {location.pathname !== "/onboarding" && (
            <Link
              className="bg-primary hover:bg-[#6871d1] text-white py-3 px-6 rounded-xl text-center"
              to="/onboarding"
            >
              Start for free
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Navbar;
