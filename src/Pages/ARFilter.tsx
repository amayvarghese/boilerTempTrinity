import React, { useState } from "react";
import FilterPageUI from "../components/FilterPageUI"; // Adjust the path as needed
import BlindCustomizeThreeJs from "../components/BlindCustomizeThreeJs"; // Adjust the path as needed

const MenuScript: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<"none" | "blindCustomize" | "filterPage">("none");

  const handleButton1Click = () => {
    setActiveComponent("blindCustomize");
  };

  const handleButton2Click = () => {
    setActiveComponent("filterPage");
  };

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center bg-gray-100">
      {activeComponent === "none" ? (
        <>
          {/* Debugging: Ensure container is visible */}
          <div className="text-center text-black text-xl mb-4">Menu Script Loaded</div>

          {/* Logo with fallback */}
          <div className="mb-12">
            <img
              src="/images/baeLogo.png" // Adjust the path as needed
              alt="Logo"
              className="w-32 h-32 object-contain"
              onError={(e) => {
                console.error("Logo failed to load");
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/128?text=Logo+Not+Found"; // Fallback image
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-6">
            <button
              className="py-3 px-8 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              onClick={handleButton1Click}
            >
              Button 1 (Blind Customize)
            </button>
            <button
              className="py-3 px-8 bg-green-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300"
              onClick={handleButton2Click}
            >
              Button 2 (Filter Page)
            </button>
          </div>
        </>
      ) : activeComponent === "blindCustomize" ? (
        <BlindCustomizeThreeJs />
      ) : (
        <FilterPageUI />
      )}
    </div>
  );
};

export default MenuScript;