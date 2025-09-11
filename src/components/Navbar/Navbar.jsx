import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import Logo from "../../assets/logo.png";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../UI/Button";

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout, getDashboardRoute } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
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
            
            {/* Auth-aware navigation */}
            <div className="flex flex-row lg:flex-row justify-center py-5 space-x-6">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to={getDashboardRoute()}
                    className="bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-xl text-center transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl text-center transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
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
                </>
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
        
        {/* Mobile Auth Menu */}
        <div className="mt-4 flex flex-col gap-3 w-full px-8">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardRoute()}
                className="bg-primary hover:bg-blue-700 text-white py-3 px-6 rounded-xl text-center w-full transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl text-center w-full transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="bg-[#f5c58a] text-white py-3 px-6 rounded-xl text-center w-full hover:bg-[#FF8C00]"
                to="/login"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              {location.pathname !== "/onboarding" && (
                <Link
                  className="bg-primary hover:bg-[#6871d1] text-white py-3 px-6 rounded-xl text-center w-full"
                  to="/onboarding"
                  onClick={() => setIsOpen(false)}
                >
                  Start for free
                </Link>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Navbar;