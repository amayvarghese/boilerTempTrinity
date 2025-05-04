import React, { useState } from "react";
import FilterPageUI from "../components/FilterPageUI"; // Adjust the path as needed
import BlindCustomizeThreeJs from "../components/BlindCustomizeThreeJs"; // Adjust the path as needed

import FilterPageAI from "../components/FilterPageAI"; // Adjust the path as needed
import BlindCustomizeThreeJs2 from "../Pages/BlindCustomizeThreeJsPage2";
import DebugComponent from "../components/DebugComponent";

const MenuScript: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<"none" | "blindCustomize" | "filterPage">("none");

  const handleButton1Click = () => {
    console.log("Button 1 clicked - Switching to BlindCustomizeThreeJs");
    setActiveComponent("blindCustomize");
  };

  const handleButton2Click = () => {
    console.log("Button 2 clicked - Switching to FilterPageUI");
    setActiveComponent("filterPage");
  };

  return (
    <div className="relative w-screen h-screen font-poppins bg-[url('/images/backgroundBlindNew.png')] bg-cover bg-center">
      {/* Darker overlay for background */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      {/* Container box */}
      <div className="w-full h-full flex flex-col p-10 items-center justify-center">
        <div className="py-10 bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full relative">
          {/* Logo */}
          <div className="p-1 relative mb-4 sm:mb-6">
            <img
              src="/images/baeLogoLong.png"
              alt="Logo"
              className="py-2 w-40 h-20 md:w-48 md:h-24 lg:w-42 lg:h-20 object-contain mx-auto"
              onError={(e) => {
                console.error("Logo failed to load");
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/64?text=Logo+Not+Found";
              }}
            />
          </div>

          {/* Title */}
          <div className="px-10 relative text-center text-gray-800 text-lg sm:text-xl mb-4 sm:mb-6 font-semibold">
            How would you like to customize your blinds?
          </div>

          {/* Smaller, Curvier, Centered Buttons */}
          <div className="flex flex-col items-center gap-3">
            <button
              className="flex items-center justify-center gap-3 py-3 px-5 bg-[#cbaa51] text-white text-base font-light rounded-2xl shadow-md hover:bg-[#e0c373] focus:outline-none focus:ring-2 focus:ring-[#cbaa51]/50 transition duration-300 w-3/4"
              onClick={handleButton1Click}
            >
              <div className="flex items-center justify-center w-8 h-8">
                <img
                  src="/images/blindVirtual.png"
                  alt="Virtual Room Icon"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/32?text=Icon+1";
                  }}
                />
              </div>
              <span className="text-center">Sample Room</span>
            </button>

            <button
              className="flex items-center justify-center gap-3 py-3 px-5 bg-[#cbaa51] text-white text-base font-light rounded-2xl shadow-md hover:bg-[#e0c373] focus:outline-none focus:ring-2 focus:ring-[#cbaa51]/50 transition duration-300 w-3/4"
              onClick={handleButton2Click}
            >
              <div className="flex items-center justify-center w-8 h-8">
                <img
                  src="/images/roomInWhit.png"
                  alt="Own Room Icon"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/32?text=Icon+2";
                  }}
                />
              </div>
              <span className="text-center">Room In My House</span>
            </button>
          </div>

          {/* Application name and version */}
          <div className="px-10 py-2 flex justify-between items-center mt-4">
            <span className="text-gray-600 text-sm">Bae Furnishing</span>
            <span className="text-gray-600 text-sm">v2.2.1</span>
          </div>
        </div>
      </div>

      {activeComponent === "blindCustomize" ? (
        <div className="w-screen h-screen bg-gray-100 absolute top-0 left-0">
          <BlindCustomizeThreeJs/>
        </div>
      ) : activeComponent === "filterPage" ? (
        <div className="w-screen h-screen bg-gray-100 absolute top-0 left-0">
          <DebugComponent/>
        </div>
      ) : null}
    </div>
  );
};

export default MenuScript;