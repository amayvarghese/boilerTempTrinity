import React from "react";
import LOGO from "../../assets/.png";
const Navbar = () => {
  return (
    <div className="bg-black flex justify-between text-white items-center px-20 ">
      {/* <img src={LOGO} alt="" /> */}
      <div className=" gap-10 flex  items-center transition-all duration-500 max-lg:hidden">
        <button className=" border-2 border-transparent  transition-all duration-300 hover:bg-white hover:text-black hover:border-white rounded-xl p-3 "> Product</button>
        <button className=" border-2 border-transparent  transition-all duration-300 hover:bg-white hover:text-black hover:border-white rounded-xl p-3 "> Benefits</button>
        <button className=" border-2 border-transparent  transition-all duration-300 hover:bg-white hover:text-black hover:border-white rounded-xl p-3 "> Features</button>
        <button className=" border-2 border-transparent  transition-all duration-300 hover:bg-white hover:text-black hover:border-white rounded-xl p-3 "> Use Cases </button>
        <button className=" w-24 border-2  border-white rounded-xl p-3 hover:bg-white hover:font-semibold hover:text-black hover:translate-y-6 transition-all ease-linear"> Try Now</button>
      </div>
    </div>
  );
};

export default Navbar;
