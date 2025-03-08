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
        <div className="w-full h-full flex flex-col items-center justify-center bg-[url('/images/background2.avif')] bg-cover bg-center">
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>

          {/* Logo */}
          <div className="relative mb-8 sm:mb-12">
            <img
              src="/images/baeLogo.png" // Adjust the path as needed
              alt="Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              onError={(e) => {
                console.error("Logo failed to load");
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/128?text=Logo+Not+Found"; // Fallback image
              }}
            />
          </div>

          {/* Title */}
          <div className="relative text-center text-white text-xl sm:text-2xl mb-6 sm:mb-8 font-semibold px-4">
            How would you like to customize your blinds?
          </div>

          {/* Buttons */}
          <div className="relative flex flex-col gap-4 sm:gap-6 w-full max-w-xs sm:max-w-md px-4 sm:px-0">
            <button
              className="flex items-center py-4 sm:py-6 px-4 sm:px-6 bg-white text-gray-800 text-lg sm:text-xl font-light rounded-xl shadow-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300 w-full font-poppins"
              onClick={handleButton1Click}
            >
              <img
                src="/images/button1.png" // Replace with your image path
                alt="Virtual Room Icon"
                className="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/48?text=Icon+1"; // Fallback
                }}
              />
              <span className="text-left">Virtual Room</span>
            </button>
            <button
              className="flex items-center py-4 sm:py-6 px-4 sm:px-6 bg-white text-gray-800 text-lg sm:text-xl font-light rounded-xl shadow-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300 w-full font-poppins"
              onClick={handleButton2Click}
            >
              <img
                src="/images/button2.png" // Replace with your image path
                alt="Own Room Icon"
                className="w-10 h-10 sm:w-12 sm:h-12 mr-3 sm:mr-4 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/48?text=Icon+2"; // Fallback
                }}
              />
              <span className="text-left">Capture your room</span>
            </button>
          </div>
        </div>
      ) : activeComponent === "blindCustomize" ? (
        <div className="w-screen h-screen bg-gray-100">
          <BlindCustomizeThreeJs />
          <button
            className="absolute top-4 left-4 py-2 px-4 bg-white text-gray-800 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 font-poppins"
            onClick={() => setActiveComponent("none")}
          >
            Back to Menu
          </button>
        </div>
      ) : (
        <div className="w-screen h-screen bg-gray-100">
          <FilterPageUI />
          <button
            className="absolute top-4 left-4 py-2 px-4 bg-white text-gray-800 rounded-lg shadow-md hover:bg-gray-200 transition duration-300 font-poppins"
            onClick={() => setActiveComponent("none")}
          >
            Back to Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuScript;