import React, { useState } from "react";
import { Link } from "react-router-dom";
import NavLinks from "./NavLink";
import { IoMenu, IoClose } from "react-icons/io5";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // Track dropdown open state

  return (
    <nav className="bg-white bg-opacity-40 backdrop-blur-md fixed w-full top-0 left-0 z-50 shadow-md">
      <div className="flex items-center font-medium justify-between px-4 lg:px-16">
        <div className="md:w-auto w-full flex justify-between items-center">
          <img
            className="h-12 w-32"
            src="https://res.cloudinary.com/ddxssowqb/image/upload/v1728750826/IMG-20241008-WA0063-removebg-preview_fskvzw.png"
            alt="V Money"
          />
          <div className="text-3xl md:hidden" onClick={() => setOpen(!open)}>
            {open ? <IoClose /> : <IoMenu />}
          </div>
        </div>

  
        <ul className="md:flex hidden  items-center gap-8 font-inter">
          <li
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
            className="relative">
            <button className="py-7 px-3 inline-flex items-center">
              Products
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 bg-white shadow-md rounded-md">
                <NavLinks />
              </div>
            )}
          </li>
          <li>
            <Link to="/" className="py-7 px-3 inline-block">
              Resources
            </Link>
          </li>
          <li>
            <Link to="/" className="py-7 px-3 inline-block">
              Company
            </Link>
          </li>
          <li>
            <Link to="/" className="py-7 px-3 inline-block">
              Pricing
            </Link>
          </li>
        </ul>
        <div className="flex flex-row lg:flex-row justify-center py-5 space-x-6">
          <Link
            className="bg-[#eff1fa] text-primary py-3 px-6 rounded-xl text-center hover:bg-[#e4e6ee]"
            to="/">
            Login
          </Link>
          <Link
            className="bg-primary hover:bg-[#6871d1] text-white py-3 px-6 rounded-xl text-center"
            to="/">
            Start for free
          </Link>
        </div>
        <ul
          className={`md:hidden bg-white bg-opacity-70 backdrop-blur-md fixed w-full top-0 overflow-y-auto bottom-0 py-24 pl-4 duration-500 ease-in-out ${
            open ? "left-0" : "left-[-100%]"
          }`}>
          <li className="relative">
            <button
              className="py-7 px-3 inline-flex items-center"
              onClick={() => setDropdownOpen(!dropdownOpen)}>
              Products
            </button>
            {dropdownOpen && (
              <div className="bg-white pl-5 pt-2 pb-3">
                <NavLinks />
              </div>
            )}
          </li>
          <li>
            <Link to="/" className="py-7 px-3 inline-block">
              Resources
            </Link>
          </li>
          <li>
            <Link to="/" className="py-7 px-3 inline-block">
              Company
            </Link>
          </li>
          <li>
            <Link to="/" className="py-7 px-3 inline-block">
              Pricing
            </Link>
          </li>
          <div className="flex flex-col justify-center py-5">
            <Link
              className="bg-[#eff1fa] text-[#6a78d1] py-3 px-6 rounded-xl text-center hover:bg-[#e4e6ee]"
              to="/">
              Login
            </Link>
            <Link
              className="bg-[#232846] hover:bg-[#6871d1] text-white py-3 px-6 rounded-xl text-center"
              to="/">
              Start for free
            </Link>
          </div>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
