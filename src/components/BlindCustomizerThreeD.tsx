import React, { useState, useEffect, useRef } from 'react';
import * as THREE from './three.js-r132/build/three.module.js'; // Adjust path as needed
import { GLTFLoader } from './three.js-r132/examples/jsm/loaders/GLTFLoader.js'; // Adjust path as needed

const BlindCustomizerThreeD: React.FC = () => {
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#F5F5DC');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null); // Ref for the background image
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);

  const patterns = [
    { name: 'Semi Transparent', image: '/images/FabricP3.png', price: '200$', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern2.png' },
    { name: 'Red Pattern', image: '/images/FabricP0.png', price: '200$', filterTags: ['red', 'patterned'], patternUrl: '/images/ICONSforMaterial/red.png' },
    { name: 'Stripes Colorful', image: '/images/FabricP1.png', price: '200$', filterTags: ['patterned'], patternUrl: '/images/ICONSforMaterial/pattern3.png' },
    { name: 'Texture 2', image: '/images/FabricP2.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern4.png' },
    { name: 'Texture 2', image: '/images/FabricP4.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern5.png' },
    { name: 'Texture 2', image: '/images/FabricP5.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern6.png' },
    { name: 'Texture 2', image: '/images/FabricP6.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern7.png' },
    { name: 'Texture 2', image: '/images/FabricP7.png', price: 'Option B', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern2.png' },
    { name: 'Semi Transparent', image: '/images/FabricP3.png', price: '200$', filterTags: ['smooth'], patternUrl: '/images/ICONSforMaterial/pattern2.png' },
    { name: 'Red Pattern', image: '/images/FabricP0.png', price: '200$', filterTags: ['red', 'patterned'], patternUrl: '/images/ICONSforMaterial/redPattern.png' },
    { name: 'Stripes Colorful', image: '/images/FabricP1.png', price: '200$', filterTags: ['patterned'], patternUrl: '/images/ICONSforMaterial/pattern3.png' },
  ];

  const blindTypes = [
    { 
      type: 'classicRoman', 
      buttonImage: '/images/windowTypeIcons/image 12.png', 
      modelUrl: '/models/shadeBake.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.5, y: 0.75, z: 0.8 }, 
      basePosition: { x: -15, y: -7.5, z: 0 } 
    },
    { 
      type: 'roller', 
      buttonImage: '/images/windowTypeIcons/image 11.png', 
      modelUrl: '/models/plantationShutter.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.07, y: .1, z: .1 }, 
      basePosition: { x: -2, y: 1, z: 0 }
    },
    { 
      type: 'roman', 
      buttonImage: '/images/windowTypeIcons/image 13.png', 
      modelUrl: '/models/shadeBake.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.5, y: 0.75, z: 0.8 }, 
      basePosition: { x: -15, y: -7.5, z: 0 } 
    },
    { 
      type: 'plantationShutter', 
      buttonImage: '/images/windowTypeIcons/image 15.png', 
      modelUrl: '/models/plantationShutter.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.07, y: .1, z: .1 }, 
      basePosition: { x: -2, y: 1, z: 0 }
    },
    { 
      type: 'solar', 
      buttonImage: '/images/windowTypeIcons/image 14.png', 
      modelUrl: '/models/shadeBake.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.7, y: 0.7, z: 0.7 }, 
      basePosition: { x: -5, y: 10, z: 0 }
    },
    { 
      type: 'aluminumSheet', 
      buttonImage: '/images/windowTypeIcons/image 17.png', 
      modelUrl: '/models/plantationShutter.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.07, y: .1, z: .1 }, 
      basePosition: { x: -2, y: 1, z: 0 }
    },
    { 
      type: 'cellularBlinds', 
      buttonImage: '/images/windowTypeIcons/image 18.png', 
      modelUrl: '/models/shadeBake.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 0.85, y: 0.85, z: 0.85 }, 
      basePosition: { x: 5, y: 5, z: 0 }
    },
  ];

  const selectBlindType = (type: string) => {
    console.log('Selected blind type:', type);
    setSelectedBlindType(type);
    create3DModel(type);
  };

  const handleButtonClick = (patternUrl: string) => {
    console.log('Selected pattern:', patternUrl);
    setSelectedPattern(patternUrl);
    applyPatternToModel(patternUrl);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => (e.target.checked ? [...prev, value] : prev.filter((tag) => tag !== value)));
  };

  const filteredPatterns = patterns.filter(
    (pattern) => filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag))
  );

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

  const applyPatternToModel = (patternUrl: string) => {
    if (!modelRef.current || !sceneRef.current) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(patternUrl, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);

      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material.clone();
          material.map = texture;
          material.needsUpdate = true;
          child.material = material;
        }
      });
    }, undefined, (error) => {
      console.error('Error loading texture:', error);
    });
  };

  const updateModelScaleAndPosition = (blind: any) => {
    if (!modelRef.current || !cameraRef.current || !imageRef.current) return;

    // Use image dimensions for sticking to image
    const imageWidth = imageRef.current.clientWidth;
    const imageHeight = imageRef.current.clientHeight;

    // Compute the model's bounding box
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const size = new THREE.Vector3();
    box.getSize(size);
    const modelWidth = size.x;
    const modelHeight = size.y;

    // Calculate scale to fit within image with padding
    const padding = 0.9; // Adjust this if needed
    const scaleX = (imageWidth * padding) / modelWidth;
    const scaleY = (imageHeight * padding) / modelHeight;
    const scaleFactor = Math.min(scaleX, scaleY);

    // Apply custom baseScale adjusted by image scaleFactor
    modelRef.current.scale.set(
      blind.baseScale.x * scaleFactor,
      blind.baseScale.y * scaleFactor,
      blind.baseScale.z * scaleFactor
    );

    // Center the model and apply custom basePosition relative to image
    const center = new THREE.Vector3();
    box.getCenter(center);
    modelRef.current.position.set(
      -center.x + (blind.basePosition.x * scaleFactor),
      -center.y + (blind.basePosition.y * scaleFactor),
      blind.basePosition.z * scaleFactor
    );

    // Adjust camera to fit the scaled model
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const scaledWidth = modelWidth * scaleFactor * blind.baseScale.x;
    const scaledHeight = modelHeight * scaleFactor * blind.baseScale.y;
    const distance = Math.max(scaledWidth / (2 * Math.tan(fov / 2)), scaledHeight / (2 * Math.tan(fov / 2))) * 1.5;
    cameraRef.current.position.set(0, 0, distance);
    cameraRef.current.lookAt(0, 0, 0);

    // Update renderer size to match image
    if (rendererRef.current) {
      rendererRef.current.setSize(imageWidth, imageHeight);
    }

    // Enhanced debug logging
    console.group(`Debug for ${blind.type} at Screen Size: ${window.innerWidth}x${window.innerHeight}`);
    console.log('Image Size:', { width: imageWidth, height: imageHeight });
    console.log('Model Raw Size:', { width: modelWidth, height: modelHeight });
    console.log('Scale Factor (min of scaleX, scaleY):', scaleFactor.toFixed(4));
    console.log('Scale X Factor:', scaleX.toFixed(4), 'Scale Y Factor:', scaleY.toFixed(4));
    console.log('Base Scale:', blind.baseScale);
    console.log('Applied Scale:', {
      x: modelRef.current.scale.x.toFixed(4),
      y: modelRef.current.scale.y.toFixed(4),
      z: modelRef.current.scale.z.toFixed(4)
    });
    console.log('Base Position:', blind.basePosition);
    console.log('Applied Position:', {
      x: modelRef.current.position.x.toFixed(4),
      y: modelRef.current.position.y.toFixed(4),
      z: modelRef.current.position.z.toFixed(4)
    });
    console.log('Camera Position:', cameraRef.current.position);
    console.groupEnd();
  };

  const create3DModel = (type: string) => {
    if (!canvasRef.current || !imageRef.current) return;

    // Clean up previous scene
    if (sceneRef.current && modelRef.current) sceneRef.current.remove(modelRef.current);
    if (rendererRef.current) rendererRef.current.dispose();

    // Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize Camera
    const aspect = imageRef.current.clientWidth / imageRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 0, 10); // Initial position, adjusted later
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    renderer.setSize(imageRef.current.clientWidth, imageRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    rendererRef.current = renderer;

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Removed AxesHelper to prevent gizmo display
    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    // Load the 3D model
    const loader = new GLTFLoader();
    const blind = blindTypes.find((b) => b.type === type);
    if (blind && blind.modelUrl) {
      loader.load(
        blind.modelUrl,
        (gltf) => {
          console.log('Model loaded:', gltf);
          if (modelRef.current && sceneRef.current) sceneRef.current.remove(modelRef.current);
          modelRef.current = gltf.scene;
          modelRef.current.rotation.set(blind.rotation.x, blind.rotation.y, blind.rotation.z);
          sceneRef.current.add(modelRef.current);

          // Apply initial scale and position
          updateModelScaleAndPosition(blind);

          if (selectedPattern) applyPatternToModel(selectedPattern);
        },
        (progress) => console.log('Loading progress:', (progress.loaded / progress.total) * 100 + '%'),
        (error) => console.error('Loading error:', error)
      );
    }

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    animationFrameId = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (canvasRef.current && cameraRef.current && rendererRef.current && modelRef.current && imageRef.current) {
        const width = imageRef.current.clientWidth;
        const height = imageRef.current.clientHeight;

        // Update renderer and camera
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();

        // Update model scale and position with debug
        updateModelScaleAndPosition(blind);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (rendererRef.current) rendererRef.current.dispose();
      window.removeEventListener('resize', handleResize);
    };
  };

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
                  alt={type + ' Blind'}
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
            <img 
              ref={imageRef}
              src="/images/RoomElements.png" 
              alt="Room Background" 
              className="main_bg relative w-full h-full object-contain z-20" 
            />
            <canvas
              ref={canvasRef}
              className="blind_overlay absolute inset-0 w-full h-full z-30"
              style={{ minHeight: '400px' }}
            />
            <div className="hidden md:block viewport absolute top-0 right-0 w-1/3 h-[calc(100%+5rem)] bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
              <div className="options-menu p-2 bg-gray-100 rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12">Filter Options</h3>
                <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {['red', 'blue', 'green', 'smooth', 'patterned'].map((filter) => (
                    <div key={filter} className="option-row flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
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
                      className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                      onClick={() => handleButtonClick(pattern.patternUrl)}
                    >
                      <img
                        src={pattern.image}
                        alt={pattern.name}
                        className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                      />
                      <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
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
        <div className="md:hidden w-full bg-white bg-opacity-90 shadow-lg rounded flex flex-col h-[calc(100%)]">
          <div className="options-menu p-2 bg-gray-100 rounded shadow">
            <h3 className="mb-2 text-sm text-gray-700 text-left h-12 flex items-center">Filter Options</h3>
            <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
              {['red', 'blue', 'green', 'smooth', 'patterned'].map((filter) => (
                <div key={filter} className="option-row flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
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
                  className="button-container flex flex-col items-center text-center cursor-pointer px-[5px] hover:bg-gray-200 transition"
                  onClick={() => handleButtonClick(pattern.patternUrl)}
                >
                  <img
                    src={pattern.image}
                    alt={pattern.name}
                    className="button-image w-12 h-12 rounded shadow-md hover:scale-105 hover:shadow-lg transition object-cover"
                  />
                  <div className="button-text flex justify-between w-full mt-0.5 text-gray-700 text-[11px]">
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

export default BlindCustomizerThreeD;