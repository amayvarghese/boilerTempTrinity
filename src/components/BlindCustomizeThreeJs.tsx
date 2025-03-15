import React, { useState, useEffect, useRef } from 'react';
import * as THREE from './three.js-r132/build/three.module.js'; // Adjust path as needed
import { GLTFLoader } from './three.js-r132/examples/jsm/loaders/GLTFLoader.js'; // Adjust path as needed

const BlindCustomizeThreeJs: React.FC = () => {
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#F5F5DC');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const solidColorLayerRef = useRef<HTMLDivElement>(null); // Ref for the background color element

  const patterns = [
    { name: "Beige", image: "/materials/beige.png", price: "$10", filterTags: ["solid"], patternUrl: "/materials/beige.png" },
    { name: "Blanche", image: "/materials/Blanche.png", price: "$67", filterTags: ["pattern"], patternUrl: "/materials/Blanche.png" },
    { name: "Cerrulean", image: "/materials/cerulean.png", price: "$10", filterTags: ["pattern"], patternUrl: "/materials/cerulean.png" },
    { name: "Chestnut", image: "/materials/chestnut.png", price: "$100", filterTags: ["kids", "pattern"], patternUrl: "/materials/chestnut.png" },
    { name: "Driftwood", image: "/materials/driftwood.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/driftwood.png" },
    { name: "Driftwood Sand", image: "/materials/driftwoodsand.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/driftwoodsand.png" },
    { name: "Iron", image: "/materials/iron.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/iron.png" },
    { name: "Ivory", image: "/materials/ivory.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/ivory.png" },
    { name: "Kaki", image: "/materials/kaki.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/kaki.png" },
    { name: "Mocha", image: "/materials/mocha.png", price: "$45", filterTags: ["pattern", "natural"], patternUrl: "/materials/mocha.png" },
    { name: "Noir", image: "/materials/noir.png", price: "$150", filterTags: ["pattern", "natural"], patternUrl: "/materials/noir.png" },
    { name: "Oatmeal", image: "/materials/oatmeal.png", price: "$150", filterTags: ["natural", "pattern"], patternUrl: "/materials/oatmeal.png" },
    { name: "Slate", image: "/materials/slate.png", price: "$100", filterTags: ["pattern"], patternUrl: "/materials/slate.png" },
    { name: "Silver", image: "/materials/SolarSilver.png", price: "$100", filterTags: ["solid", "solar"], patternUrl: "/materials/SolarSilver.png" },
    { name: "Steel", image: "/materials/steel.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/steel.png" },
    { name: "Taupe", image: "/materials/taupe.png", price: "$45", filterTags: ["solid", "pattern"], patternUrl: "/materials/taupe.png" },
    { name: "Taupe", image: "/materials/taupeSolar.png", price: "$100", filterTags: ["solar"], patternUrl: "/materials/taupeSolar.png" },
    { name: "Tea Leaves Brown", image: "/materials/tealeaves_brown.png", price: "$150", filterTags: ["pattern", "pattern"], patternUrl: "/materials/tealeaves_brown.png" },
    { name: "Tea Leaves White", image: "/materials/tealeaves_white.png", price: "$150", filterTags: ["patterned"], patternUrl: "/materials/tealeaves_white.png" },
    { name: "Toast", image: "/materials/toast.png", price: "$45", filterTags: ["pattern"], patternUrl: "/materials/toast.png" },
    { name: "White", image: "/materials/white.png", price: "$30", filterTags: ["solid"], patternUrl: "/materials/white.png" },
  ];

  const blindTypes = [
    { 
      type: 'classicRoman', 
      buttonImage: '/images/blindTypes/romanBlindIcon.png', 
      modelUrl: '/3d/classicRoman.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 1.55, y: 2, z: 3 }, 
      basePosition: { x: -45, y: -25, z: 10 },
    },
    { 
      type: 'roller', 
      buttonImage: '/images/blindTypes/rollerBlindIcon.png', 
      modelUrl: '/3d/ROLLER_SHADES.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 1.5, y: 2.1, z: 1 }, 
      basePosition: { x: -45.5, y: -30, z: 5 },
    },
    { 
      type: 'roman', 
      buttonImage: '/images/blindTypes/romanBlindIcon.png', 
      modelUrl: '/3d/ROMAN_SHADES_01.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 1.55, y: 2, z: 1 }, 
      basePosition: { x: -45, y: -20, z: 5 },
      meshNameFabric: "polySurface1",
      meshNameWood: "polySurface3",
    },
    { 
      type: 'Sheet Blind', 
      buttonImage: '/images/blindTypes/sheetBlindIcon.png', 
      modelUrl: '/3d/sheetBlind.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 1.55, y: 2, z: 1 }, 
      basePosition: { x: -45, y: -28, z: 20 },
    },
    { 
      type: 'PlantationShutter', 
      buttonImage: '/images/blindTypes/plantationShutterIcon.png', 
      modelUrl: '/3d/PLANTATION__SHUTTER.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 150, y: 230, z: 1 }, 
      basePosition: { x: -46, y: -27, z: 5 },
      meshNameWood: "shutterWood",
    },
    { 
      type: 'VerticalSheet', 
      buttonImage: '/images/blindTypes/verticalSheetBlindIcon.png', 
      modelUrl: '/3d/vertical_sheet_blinds_02.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 1.45, y: 2.1, z: 1 }, 
      basePosition: { x: -45, y: -28, z: 5 },
      meshNameWood: "polySurface32.001",
    },
    { 
      type: 'zebraBlinds', 
      buttonImage: '/images/blindTypes/zebraBlindIcon.png', 
      modelUrl: '/3d/zebra_blinds.glb', 
      rotation: { x: 0, y: 0, z: 0 }, 
      baseScale: { x: 1.55, y: 2, z: 1 }, 
      basePosition: { x: -45, y: -20, z: 5 },
      meshNameWood: "zebra_blinds",
    },
  ];

  const selectBlindType = (type: string) => {
    console.log('Selected blind type:', type);
    setSelectedBlindType(type);
    loadModel(type);
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
    if (selectedBlindType) localStorage.setItem('selectedBlindType', selectedBlindType);
    else localStorage.removeItem('selectedBlindType');
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

    const blindType = blindTypes.find((b) => b.type === selectedBlindType) || blindTypes[0];
    const textureLoader = new THREE.TextureLoader();

    const applyMaterial = (textureUrl: string, normalUrl: string | null, repeat: number, normalScale: number, roughness: number, metalness: number, meshName?: string) => {
      const texture = textureLoader.load(textureUrl, undefined, undefined, (err) => console.error(`Texture load failed: ${textureUrl}`, err));
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeat, repeat);
      texture.colorSpace = THREE.SRGBColorSpace;

      const materialProps: THREE.MeshStandardMaterialParameters = {
        map: texture,
        roughness,
        metalness,
      };
      if (normalUrl) {
        materialProps.normalMap = textureLoader.load(normalUrl, undefined, undefined, (err) => console.error(`Normal map load failed: ${normalUrl}`, err));
        materialProps.normalScale = new THREE.Vector2(normalScale, normalScale);
      }
      const material = new THREE.MeshStandardMaterial(materialProps);

      let applied = false;
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && (!meshName || child.name === meshName)) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
            child.material = material; // Assign single material
          } else {
            child.material.dispose();
            child.material = material; // Assign single material
          }
          (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
          applied = true;
        }
      });
      if (!applied) console.warn(`No meshes found for ${meshName || 'all'} in model`);
    };

    if (!blindType.meshNameFabric && !blindType.meshNameWood) {
      applyMaterial(patternUrl, null, 8, 0, 0.5, 0.1);
    } else {
      if (blindType.meshNameFabric) {
        applyMaterial(patternUrl, "/3d/normals/RollerNormal.jpg", 8, 3, 0.3, 0.1, blindType.meshNameFabric);
      }
      if (blindType.meshNameWood) {
        applyMaterial("/materials/beige.png", "/3d/normals/wood_normal.jpg", 4, 0.5, 1, 0, blindType.meshNameWood);
      }
    }

    if (rendererRef.current && cameraRef.current && sceneRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const create3DScene = () => {
    if (!canvasRef.current || !solidColorLayerRef.current) return;

    // Cleanup previous scene
    if (sceneRef.current && modelRef.current) sceneRef.current.remove(modelRef.current);
    if (sceneRef.current && backgroundPlaneRef.current) sceneRef.current.remove(backgroundPlaneRef.current);
    if (rendererRef.current) rendererRef.current.dispose();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const { width: containerWidth, height: containerHeight } = solidColorLayerRef.current.getBoundingClientRect();
    const aspectRatio = containerWidth / containerHeight;

    const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('/images/RoomElements1.png', (texture) => {
      const planeWidth = containerWidth;
      const planeHeight = containerHeight;
      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.encoding = THREE.LinearEncoding;

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
      });
      const plane = new THREE.Mesh(geometry, material);
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -1);
      scene.add(plane);

      // Adjust camera position based on plane size
      const fovRad = camera.fov * (Math.PI / 180);
      const distance = (planeWidth / (2 * Math.tan(fovRad / 2))) * 0.45;
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
    }, undefined, (error) => {
      console.error('Error loading background texture:', error);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, .1);
    directionalLight.position.set(0, 5, 5);
    scene.add(directionalLight);

    let animationFrameId: number;
    const animate = () => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!canvasRef.current || !solidColorLayerRef.current || !rendererRef.current || !cameraRef.current) return;

      const { width: newWidth, height: newHeight } = solidColorLayerRef.current.getBoundingClientRect();
      const newAspect = newWidth / newHeight;

      // Update renderer size
      rendererRef.current.setSize(newWidth, newHeight);

      // Update camera aspect ratio and projection matrix
      cameraRef.current.aspect = newAspect;
      cameraRef.current.updateProjectionMatrix();

      // Update plane geometry to match new size
      if (backgroundPlaneRef.current) {
        const planeGeometry = new THREE.PlaneGeometry(newWidth, newHeight);
        backgroundPlaneRef.current.geometry.dispose();
        backgroundPlaneRef.current.geometry = planeGeometry;
      }

      // Recalculate camera distance to maintain view
      const fovRad = cameraRef.current.fov * (Math.PI / 180);
      const distance = (newWidth / (2 * Math.tan(fovRad / 2))) * 0.45;
      cameraRef.current.position.set(0, 0, distance);
      cameraRef.current.lookAt(0, 0, 0);

      // Update model position and scale if loaded
      if (modelRef.current && selectedBlindType) {
        const blind = blindTypes.find((b) => b.type === selectedBlindType);
        if (blind) updateScene(blind);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (rendererRef.current) rendererRef.current.dispose();
      window.removeEventListener('resize', handleResize);
    };
  };

  const updateScene = (blind?: any) => {
    if (!cameraRef.current || !backgroundPlaneRef.current || !rendererRef.current || !solidColorLayerRef.current) return;

    backgroundPlaneRef.current.position.set(0, 0, -1);

    if (blind && modelRef.current) {
      const { width: containerWidth } = solidColorLayerRef.current.getBoundingClientRect();
      const scaleFactor = containerWidth / 300; // Normalize scale based on a reference width (e.g., 300px)
      modelRef.current.scale.set(
        blind.baseScale.x * scaleFactor,
        blind.baseScale.y * scaleFactor,
        blind.baseScale.z * scaleFactor
      );
      modelRef.current.position.set(
        blind.basePosition.x * scaleFactor,
        blind.basePosition.y * scaleFactor,
        blind.basePosition.z
      );
    }
  };

  const loadModel = (type: string) => {
    if (!sceneRef.current || !cameraRef.current) return;

    if (modelRef.current) sceneRef.current.remove(modelRef.current);

    const loader = new GLTFLoader();
    const blind = blindTypes.find((b) => b.type === type);
    if (blind && blind.modelUrl) {
      loader.load(
        blind.modelUrl,
        (gltf) => {
          modelRef.current = gltf.scene;
          modelRef.current.rotation.set(blind.rotation.x, blind.rotation.y, blind.rotation.z);
          sceneRef.current.add(modelRef.current);
          updateScene(blind);
          if (selectedPattern) applyPatternToModel(selectedPattern);
        },
        undefined,
        (error) => console.error('Loading error:', error)
      );
    }
  };

  useEffect(() => {
    const cleanup = create3DScene();
    return cleanup;
  }, []);

  return (
    <div className="w-screen h-screen bg-white text-black container max-w-7xl mx-auto min-h-screen p-4 md:p-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <img
        src="/images/baelogoN.png" // Replace with your actual logo path
        alt="Logo"
        className="mx-auto h-16 w-auto mt-4"
      />
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
          <div className="backgroundImage relative w-full">
            <div
              ref={solidColorLayerRef}
              className="solid-color-layer absolute inset-0 z-10"
              style={{ backgroundColor, opacity: 0.5 }}
            ></div>
            <div className="canvas-wrapper relative w-full" style={{ paddingTop: '56.25%' /* 16:9 aspect ratio */ }}>
              <canvas
                ref={canvasRef}
                className="main_bg absolute top-0 left-0 w-full h-full object-contain z-20"
              />
            </div>
            <div className="hidden md:block viewport absolute top-0 right-0 w-1/3 h-[calc(100%+5rem)] bg-white bg-opacity-90 shadow-lg rounded flex flex-col z-40">
              <div className="options-menu p-2 bg-gray-100 rounded shadow">
                <h3 className="mb-2 text-sm text-gray-700 text-left h-12">Filter Options</h3>
                <div className="grid-container grid grid-cols-2 gap-2 mx-5 text-[13px]">
                  {['solid', 'natural', 'solar', 'pattern', 'kids'].map((filter) => (
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

export default BlindCustomizeThreeJs;