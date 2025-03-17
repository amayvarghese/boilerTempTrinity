import React, { useState, useEffect } from 'react';
import TestImage from '/images/ICONSforMaterial/pattern4.png';
const BlindCustomizerSection = () => {
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#F5F5DC');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);

  const patterns = [
    { name: 'Semi Transparent', image: '/images/FabricP3.png', price: '200$', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern2.png' },
    { name: 'Red Pattern', image: '/images/FabricP0.png', price: '200$', filterTags: ['red', 'patterned'], patternUrl: '/images/ICONSforMaterial/red.png' }, // Replaced testPhoto.jpeg
    { name: 'Stripes Colorful', image: '/images/FabricP1.png', price: '200$', filterTags: ['patterned'], patternUrl: '/images/ICONSforMaterial/pattern3.png' },
    { name: 'Texture 2', image: '/images/FabricP2.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern4.png' },
    { name: 'Texture 2', image: '/images/FabricP4.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern5.png' },
    { name: 'Texture 2', image: '/images/FabricP5.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern6.png' },
    { name: 'Texture 2', image: '/images/FabricP6.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern7.png' },
    { name: 'Texture 2', image: '/images/FabricP7.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern2.png' },
    { name: 'Semi Transparent', image: '/images/FabricP3.png', price: '200$', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern2.png' },
    { name: 'Red Pattern', image: '/images/FabricP0.png', price: '200$', filterTags: ['red', 'patterned'], patternUrl: '/images/ICONSforMaterial/redPattern.png' }, // Replaced again
    { name: 'Stripes Colorful', image: '/images/FabricP1.png', price: '200$', filterTags: ['patterned'], patternUrl: '/images/ICONSforMaterial/pattern3.png' },
  ];

  const blindTypes = [
    { type: 'classicRoman', buttonImage: '/images/windowTypeIcons/image 12.png', overlayImage: '/images/classicRomanBlind.png' },
    { type: 'roller', buttonImage: '/images/windowTypeIcons/image 11.png', overlayImage: '/images/RollerTemp.png' },
    { type: 'roman', buttonImage: '/images/windowTypeIcons/image 13.png', overlayImage: '/images/withblind.png' },
    { type: 'plantationShutter', buttonImage: '/images/windowTypeIcons/image 15.png', overlayImage: '/images/plantationShutter.png' },
    { type: 'solar', buttonImage: '/images/windowTypeIcons/image 14.png', overlayImage: '/images/solarBlind.png' },
    { type: 'aluminumSheet', buttonImage: '/images/windowTypeIcons/image 17.png', overlayImage: '/images/aluminiumSheet.png' },
    { type: 'cellularBlinds', buttonImage: '/images/windowTypeIcons/image 18.png', overlayImage: '/images/cellularBlinds.png' },
  ];

  const getBlindOverlaySrc = (type: string | null) => {
    if (!type) return '';
    const blind = blindTypes.find(b => b.type === type);
    return blind ? blind.overlayImage : '/images/withblind.png';
  };

  const getBlindOverlayStyle = (pattern: string | null) => {
    if (!pattern) {
      return {
        maskImage: 'none',
        webkitMaskImage: 'none',
        maskRepeat: 'initial',
        maskSize: 'initial',
        maskPosition: 'initial',
        webkitMaskRepeat: 'initial',
        webkitMaskSize: 'initial',
        webkitMaskPosition: 'initial'
      };
    }
    return {
      maskImage: `url(${pattern})`,
      maskRepeat: 'repeat',
      maskSize: '50px 50px',
      maskPosition: '0 0',
      webkitMaskImage: `url(${pattern})`,
      webkitMaskRepeat: 'repeat',
      webkitMaskSize: '50px 50px',
      webkitMaskPosition: '0 0'
    };
  };

  const selectBlindType = (type: string) => {
    setSelectedBlindType(type);
  };

  const handleButtonClick = (patternUrl: string) => {
    setSelectedPattern(patternUrl);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => e.target.checked ? [...prev, value] : prev.filter(tag => tag !== value));
  };

  const filteredPatterns = patterns.filter(pattern => filters.length === 0 || pattern.filterTags.some(tag => filters.includes(tag)));

  useEffect(() => {
    const savedType = localStorage.getItem('selectedBlindType');
    if (savedType) setSelectedBlindType(savedType);
  }, []);

  useEffect(() => {
    if (selectedBlindType) {
      localStorage.setItem('selectedBlindType', selectedBlindType);
    } else {
      localStorage.removeItem('selectedBlindType');
    }
  }, [selectedBlindType]);

  useEffect(() => {
    const savedColor = localStorage.getItem('backgroundColor');
    if (savedColor) setBackgroundColor(savedColor);
  }, []);

  useEffect(() => {
    localStorage.setItem('backgroundColor', backgroundColor);
  }, [backgroundColor]);

  return (
    <div className="container max-w-7xl mx-auto min-h-screen p-4 md:p-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <section className="roman-shades flex flex-col md:flex-row items-start justify-center my-5 bg-gray-100 p-4 rounded gap-4">
        <div className="blind-type-menu w-full md:w-1/4 bg-white bg-opacity-90 shadow-lg rounded flex flex-col h-[calc(100%+5rem)]">
          <h3 className="bg-gray-100 p-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Select Type of Blind</h3>
          <div className="blind-type-content grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
            {blindTypes.map(({ type, buttonImage }) => (
              <div
                key={type}
                className="button-container flex flex-col items-center text-center cursor-pointer px-[5px]"
                onClick={() => selectBlindType(type)}
              >
                <img
                  src={buttonImage}
                  alt={type + " Blind"}
                  className="button-image w-14 h-14 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                />
                <div className="button-text flex justify-center w-full mt-1 text-gray-700 text-[11px]">
                  <span className="text-center">{type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="central-content flex flex-col items-center w-full md:w-3/4 relative">
          <div className="backgroundImage relative w-full h-[calc(100%-4rem)]">
            <div className="solid-color-layer absolute inset-0 z-10" style={{ backgroundColor }}></div>
            <img src="/images/RoomElements.png" alt="Room Background" className="main_bg relative w-full h-full object-contain z-20" />
            <img
              src={getBlindOverlaySrc(selectedBlindType)}
              alt="Blind Type"
              className={`blind_overlay absolute inset-0 w-full h-full object-contain z-30 pointer-events-none ${selectedBlindType ? '' : 'hidden'}`}
              style={getBlindOverlayStyle(selectedPattern)}
            />
            {/* Overlay for Filter Options and Available Patterns (Desktop Only) */}
            <div className=" md:block viewport absolute top-0 right-0 w-1/3 h-[calc(100%+5rem)] bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
              <div className="options-menu p-2 bg-gray-100 rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12">Filter Options</h3>
                <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {['red', 'blue', 'green', 'smooth', 'patterned'].map(filter => (
                    <div key={filter} className="option-row flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          value={filter}
                          checked={filters.includes(filter)}
                          onChange={handleFilterChange}
                          className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer"
                        />
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="scrollable-buttons flex flex-col flex-1 max-h-[400px]">
                <h3 className="bg-gray-100 pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
                <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
                  {filteredPatterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="button-container flex flex-col items-center text-center cursor-pointer px-[5px]"
                      onClick={() => handleButtonClick(pattern.patternUrl)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                      />
                      <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[9px]">
                        <span className="left-text truncate">{pattern.name}</span>
                        <span className="right-text">{pattern.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="color_picker_container flex items-center justify-start w-full mt-4 h-16">
            <label htmlFor="colorPicker" className="mr-2 text-sm text-gray-700">Background Color:</label>
            <input
              type="color"
              id="colorPicker"
              value={backgroundColor}
              className="w-12 h-12 border-none cursor-pointer bg-transparent"
              onChange={(e) => setBackgroundColor(e.target.value)}
            />
          </div>
        </div>
        {/* Separate Right Menu for Mobile */}
        <div className="md:hidden w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col h-[calc(100%)]">
          <div className="options-menu p-2 bg-gray-100 rounded shadow">
            <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">Filter Options</h3>
            <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
              {['red', 'blue', 'green', 'smooth', 'patterned'].map(filter => (
                <div key={filter} className="option-row flex items-center gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      value={filter}
                      checked={filters.includes(filter)}
                      onChange={handleFilterChange}
                      className="w-4 h-4 border-2 border-gray-400 rounded-sm checked:bg-black checked:border-black focus:outline-none cursor-pointer"
                    />
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="scrollable-buttons flex flex-col flex-1 max-h-[300px]">
            <h3 className="bg-gray-100 pt-[10px] pb-2 px-2 text-left text-sm text-gray-700 shadow h-12 flex items-center">Available Patterns</h3>
            <div className="viewport-content grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mx-5 my-5 overflow-y-auto flex-1">
              {filteredPatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="button-container flex flex-col items-center text-center cursor-pointer px-[5px]"
                  onClick={() => handleButtonClick(pattern.patternUrl)}
                >
                  <img
                    src={pattern.image}
                    alt={pattern.name}
                    className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                  />
                  <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[9px]">
                    <span className="left-text truncate">{pattern.name}</span>
                    <span className="right-text">{pattern.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="productDetail-section p-5 bg-gray-50">
        <div className="productDetail-content pb-20 max-w-3xl mx-auto">
          <h3 className="text-xl">Customize Your Curtain</h3>
          <p className="my-2 text-sm">Choose the perfect style, size, and finish to match your room.</p>
          <div className="product-options">
            {/* <h3 className="text-base">Step 1: Select Material</h3> */}
          </div>
        </div>
        <div className="fixed-bottom-bar fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 flex justify-between items-center p-2 shadow-md">
          <div className="total-container max-w-7xl mx-auto flex-1">
            <p className="text-sm">Total: <span className="total-price">$0.00</span></p>
          </div>
          <button
            className="add-to-cart bg-gray-800 text-white py-2 px-6 text-sm border-none cursor-pointer hover:bg-blue-700 transition"
            onClick={() => window.location.href = '../11Step/index.html'}
          >
            CONTINUE TO 11 STEP
          </button>
        </div>
      </section>
    </div>
  );
};

const Blindcustomizer: React.FC = () => {
  return <BlindCustomizerSection />;
};

export default Blindcustomizer;