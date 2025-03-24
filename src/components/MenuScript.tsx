import React, { useState } from "react";
import FilterPageUI from "../components/FilterPageUI"; // Adjust the path as needed
import BlindCustomizeThreeJs from "../components/BlindCustomizeThreeJs"; // Adjust the path as needed
import FilterPageAI from "../components/FilterPageAI"; // Adjust the path as needed

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

      {/* Top logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2">
        <img
          src="/images/baelogoN.png"
          alt="Logo"
          className="w-16 h-16 object-contain"
          onError={(e) => {
            console.error("Logo failed to load");
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/48?text=Logo+Not+Found";
          }}
        />
      </div>

      {/* Container box */}
      <div className="w-full h-full flex flex-col p-10 items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full relative">
          {/* Logo */}
          <div className="relative mb-4 sm:mb-6">
            <img
              src="/images/baeLogoLong.png"
              alt="Logo"
              className="py-2 w-35 h-14 sm:w-20 sm:h-20 object-contain mx-auto"
              onError={(e) => {
                console.error("Logo failed to load");
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/64?text=Logo+Not+Found";
              }}
            />
          </div>

          {/* Title */}
          <div className="relative text-center text-gray-800 text-lg sm:text-xl mb-2 sm:mb-4 font-semibold">
            How would you like to customize your blinds?
          </div>

          {/* Larger Buttons */}
          <div className="relative flex flex-col gap-4 sm:gap-6 w-full">
            <button
              className="flex items-center py-5 sm:py-10 px-4 sm:px-10 bg-black text-white text-lg sm:text-lg font-light rounded-xl shadow-md hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300 w-full font-poppins"
              onClick={handleButton1Click}
            >
              <img
                src="/images/blindVirtual.png"
                alt="Virtual Room Icon"
                className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/32?text=Icon+1";
                }}
              />
              <span className="text-left">Sample Room</span>
            </button>
            <button
              className="flex items-center py-5 sm:py-10 px-4 sm:px-10 bg-black text-white text-lg sm:text-lg font-light rounded-xl shadow-md hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300 w-full font-poppins"
              onClick={handleButton2Click}
            >
              <img
                src="/images/room.png"
                alt="Own Room Icon"
                className="w-8 h-8 sm:w-12 sm:h-12 mr-2 sm:mr-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/32?text=Icon+2";
                }}
              />
              <span className="text-left">Room In My House</span>
            </button>
          </div>

          {/* Application name and version */}
          <div className="px-2 py-2 flex justify-between items-center mt-2">
            <span className="text-gray-600 text-sm">Bae Furnishing</span> 
            <span className="text-gray-600 text-sm">v1.2.2</span>
          </div>
        </div>
      </div>

      {activeComponent === "blindCustomize"? (
        <div className="w-screen h-screen bg-gray-100 absolute top-0 left-0">
          <BlindCustomizeThreeJs />
        </div>
      ) : activeComponent === "filterPage"? (
        <div className="w-screen h-screen bg-gray-100 absolute top-0 left-0">
          <FilterPageUI />
        </div>
      ) : null}
    </div> 
  ); 
};

export default MenuScript;