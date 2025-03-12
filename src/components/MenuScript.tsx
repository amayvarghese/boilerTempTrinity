import React, { useState } from "react";
import FilterPageUI from "../components/FilterPageUI"; // Adjust the path as needed
import BlindCustomizeThreeJs from "../components/BlindCustomizeThreeJs"; // Adjust the path as needed

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
    <div className="relative w-screen h-screen font-poppins">
      {activeComponent === "none" ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[url('/images/backgroundBlindNew.png')] bg-cover bg-center">
          {/* Darker overlay for background */}
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>

          {/* Logo */}
          <div className="relative mb-8 sm:mb-12">
            <img
              src="/images/baelogoN.png"
              alt="Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              onError={(e) => {
                console.error("Logo failed to load");
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/128?text=Logo+Not+Found";
              }}
            />
          </div>

          {/* Title */}
          <div className="relative text-center text-white text-xl sm:text-2xl mb-6 sm:mb-8 font-semibold px-4">
            How would you like to customize your blinds?
          </div>

          {/* Larger Buttons */}
          <div className="relative flex flex-col gap-6 sm:gap-8 w-full max-w-md sm:max-w-lg px-4 sm:px-0">
            <button
              className="flex items-center py-6 sm:py-8 px-6 sm:px-8 bg-white text-gray-800 text-xl sm:text-2xl font-light rounded-xl shadow-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300 w-full font-poppins"
              onClick={handleButton1Click}
            >
              <img
                src="/images/button1.png"
                alt="Virtual Room Icon"
                className="w-12 h-12 sm:w-16 sm:h-16 mr-4 sm:mr-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/48?text=Icon+1";
                }}
              />
              <span className="text-left">Virtual Room</span>
            </button>
            <button
              className="flex items-center py-6 sm:py-8 px-6 sm:px-8 bg-white text-gray-800 text-xl sm:text-2xl font-light rounded-xl shadow-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300 w-full font-poppins"
              onClick={handleButton2Click}
            >
              <img
                src="/images/button2.png"
                alt="Own Room Icon"
                className="w-12 h-12 sm:w-16 sm:h-16 mr-4 sm:mr-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/48?text=Icon+2";
                }}
              />
              <span className="text-left">Capture your room</span>
            </button>
          </div>
        </div>
      ) : activeComponent === "blindCustomize" ? (
        <div className="w-screen h-screen bg-gray-100">
          <BlindCustomizeThreeJs />
         
        </div>
      ) : (
        <div className="w-screen h-screen bg-gray-100">
          <FilterPageUI />

        </div>
      )}
    </div>
  );
};

export default MenuScript;