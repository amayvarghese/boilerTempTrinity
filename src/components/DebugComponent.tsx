import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Types and Constants
type Vector3D = { x: number; y: number; z: number };

type UvConfig = {
  repeatX: number;
  repeatY: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
};

type BlindType = {
  type: string;
  buttonImage: string;
  modelUrl: string;
  meshNameFabric?: string[];
  meshNameWood?: string[];
  normalWood?: string;
  normalFabric?: string;
  rotation: Vector3D;
  baseScale: Vector3D;
  basePosition: Vector3D;
  animationName?: string;
  uvMapUrlFabric?: string; // External UV map image for fabric meshes
  uvMapUrlWood?: string;   // External UV map image for wood meshes
};


type TexturePattern = {
  patternUrl: string;
  uvConfig?: UvConfig;
};


type Pattern = {
  name: string;
  image: string;
  price: string;
  filterTags: string[];
  patternUrl: string; // Mandatory base color texture
  normalUrl?: string; // Optional normal map
  heightUrl?: string; // Optional height map
  metallicUrl?: string; // Optional metallic map
  occlusionUrl?: string; // Optional occlusion map
  uvConfig?: UvConfig; // Optional UV configuration for tiling (already exists)
};

type ModelData = { model: THREE.Group; gltf?: any; mixer?: THREE.AnimationMixer; action?: THREE.AnimationAction };
type SelectionBoxParams = {
  targetWidth: number;
  targetHeight: number;
  worldStart: THREE.Vector3;
  worldEnd: THREE.Vector3;
};
type InitialModelParams = { scale: THREE.Vector3; position: THREE.Vector3 };

const BLIND_TYPES: BlindType[] = [
  { type: "classicRoman", buttonImage: "/images/blindTypes/romanBlindIcon.png", modelUrl: "/3d/animated/classicRomanAnim.glb", meshNameFabric: ["Cloth"], meshNameWood: ["Cube"], rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 3 }, basePosition: { x: -45, y: -25, z: 10 } },
  { type: "roller", buttonImage: "/images/blindTypes/rollerBlindIcon.png", modelUrl: "/3d/animated/rollerBlindAnim.glb", meshNameFabric: ["ROLLER_SHADES"], meshNameWood: ["Cube"], rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.5, y: 2.1, z: 1 }, basePosition: { x: -45.5, y: -30, z: 5 } },
  { type: "roman", buttonImage: "/images/blindTypes/romanBlindIcon.png", modelUrl: "/3d/animated/romanShades.glb",
    normalWood:"/3d/normals/normalRomanWood.jpeg",rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 1 }, basePosition: { x: -45, y: -20, z: 5 } },
  { type: "Sheet Blind", buttonImage: "/images/blindTypes/sheetBlindIcon.png", modelUrl: "/3d/animated/SheetBlindAnim.glb", meshNameFabric: ["Cloth"], meshNameWood: ["Rod"], normalFabric:"/3d/normals/newClothTex.jpeg",rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 2 }, basePosition: { x: -45, y: -28, z: 10 }, animationName: "ClothAction" },
  { type: "PlantationShutter", buttonImage: "/images/blindTypes/plantationShutterIcon.png", modelUrl: "/3d/animated/plantationShutterAnim.glb",meshNameFabric: ["polySurface1", "polySurface2", "polySurface3","polySurface4","polySurface5","polySurface6","polySurface7","polySurface8","polySurface9","polySurface10","polySurface11","polySurface12","polySurface13","polySurface14","polySurface15","polySurface16","polySurface17","polySurface18","polySurface19","polySurface20","polySurface21","polySurface22",
    "polySurface23","polySurface24","polySurface25","polySurface26","polySurface27","polySurface28","polySurface29","polySurface30","polySurface31","polySurface32","polySurface33","polySurface34","polySurface35","polySurface36","polySurface37","polySurface38","polySurface39","polySurface40","polySurface41","polySurface42","polySurface43","polySurface44","polySurface45","polySurface46","polySurface47","polySurface48","polySurface49","polySurface50"
    ,"polySurface51","polySurface52","polySurface53","polySurface54","polySurface55","polySurface56","polySurface57","polySurface58","polySurface59","polySurface60","polySurface61","polySurface62","polySurface63","polySurface64","polySurface65","polySurface66","polySurface67","polySurface68","polySurface69","polySurface70","polySurface71","polySurface72","polySurface73","polySurface74","polySurface75","polySurface76","polySurface77","polySurface78",
    "polySurface79","polySurface80","polySurface81","polySurface82","polySurface83","polySurface84","polySurface85","polySurface86","polySurface87","polySurface88","polySurface89","polySurface90","polySurface91","polySurface92"], normalFabric:"/3d/normals/plantationShutterNormal.png", uvMapUrlFabric:"/materials/plantationShutterWood.png", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.5, y: 2, z: 1 }, basePosition: { x: -46, y: -27, z: 5 } },
  { type: "VerticalBlind", buttonImage: "/images/blindTypes/verticalSheetBlindIcon.png", modelUrl: "/3d/animated/Test_Vertical_1.glb", meshNameWood:["Wood"], rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.45, y: 2.1, z: 1 }, basePosition: { x: -45, y: -28, z: 5 } },
  { type: "zebraBlinds", buttonImage: "/images/blindTypes/zebraBlindIcon.png", modelUrl: "/3d/animated/zebraBlind.glb", meshNameFabric: ["zebra_blinds"], normalFabric:"/3d/normals/zebraNorm.png", rotation: { x: 0, y: 0, z: 0 }, baseScale: { x: 1.55, y: 2, z: 1 }, basePosition: { x: -45, y: -20, z: 5 } },
];

const PATTERNS: Pattern[] = [
  { name: "Beige", image: "/materials/beige.png", price: "$10", filterTags: ["roman"], patternUrl: "/materials/romanBase.jpg" ,uvConfig: {
    repeatX: 1,
    repeatY: -1,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Blanche", image: "/materials/Blanche.png", price: "$67", filterTags: ["classicRoman"], patternUrl: "/materials/Blanche.png" },
  { name: "Cerrulean", image: "/materials/cerulean.png", price: "$10", filterTags: ["sheet Blind"], patternUrl: "/materials/cerulean.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Chestnut", image: "/materials/chestnut.png", price: "$100", filterTags: ["sheet Blind", "roller"], patternUrl: "/materials/chestnut.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Driftwood", image: "/materials/driftwood.png", price: "$100", filterTags: ["roller"], patternUrl: "/materials/driftwood.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Driftwood Sand", image: "/materials/driftwoodsand.png", price: "$100", filterTags: ["roller"], patternUrl: "/materials/driftwoodsand.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Iron", image: "/materials/iron.png", price: "$30", filterTags: ["roman"], patternUrl: "/materials/aitest.png",uvConfig: {
    repeatX: 1,
    repeatY: -1,
    offsetX: 0,
    offsetY: 0
  } },
  { name: "Ivory", image: "/materials/ivory.png", price: "$30", filterTags: ["classicRoman"], patternUrl: "/materials/ivory.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Kaki", image: "/materials/kaki.png", price: "$30", filterTags: ["vertical"], patternUrl: "/materials/kaki.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Mocha", image: "/materials/mocha.png", price: "$45", filterTags: ["vertical"], patternUrl: "/materials/mocha.png" ,uvConfig: {
    repeatX: 6,
    repeatY: 6,
    offsetX: 0,
    offsetY: 0
  }},
  { name: "Noir", image: "/materials/noir.png", price: "$150", filterTags: ["sheet Blind", "vertical"], patternUrl: "/materials/noir.png" },
  { name: "Oatmeal", image: "/materials/oatmeal.png", price: "$150", filterTags: ["roller", "sheet"], patternUrl: "/materials/oatmeal.png" },
  { name: "Slate", image: "/materials/slate.png", price: "$100", filterTags: ["sheet Blind"], patternUrl: "/materials/slate.png" },
  { name: "Silver", image: "/materials/SolarSilver.png", price: "$100", filterTags: ["sheet Blind", "classicRoman"], patternUrl: "/materials/SolarSilver.png" },
  { name: "Steel", image: "/materials/steel.png", price: "$30", filterTags: ["zebra"], patternUrl: "/materials/steel.png" },
  { name: "Taupe", image: "/materials/taupe.png", price: "$45", filterTags: ["zebra"], patternUrl: "/materials/taupe.png" },
  { name: "Taupe Solar", image: "/materials/taupeSolar.png", price: "$100", filterTags: ["zebra"], patternUrl: "/materials/taupeSolar.png" },
  { name: "Tea Leaves Brown", image: "/materials/tealeaves_brown.png", price: "$150", filterTags: ["zebra"], patternUrl: "/materials/tealeaves_brown.png" },
  { name: "Tea Leaves White", image: "/materials/tealeaves_white.png", price: "$150", filterTags: ["zebra"], patternUrl: "/materials/tealeaves_white.png" },
  { name: "Toast", image: "/materials/toast.png", price: "$45", filterTags: ["zebraBlinds", "roman"], patternUrl: "/materials/ZebraBase.png", uvConfig: {
    repeatX: 1,
    repeatY: -1,
    offsetX: 0,
    offsetY: 0 }  },
  { name: "White", image: "/materials/WhiteImage.png", price: "$30", filterTags: ["plantationShutter", "roller"], patternUrl: "/materials/plantationWhite.png", uvConfig: {
    repeatX: 1,
    repeatY: -1,
    offsetX: 0,
    offsetY: 0 } },
  { name: "Wood", image: "/materials/woodimage.png", price: "$30", filterTags: ["plantationShutter"], patternUrl: "/materials/plantationShutterWood.png", uvConfig: {
    repeatX: 1,
    repeatY: -1,
    offsetX: 0,
    offsetY: 0 },}
];

// Utility Functions
const isMesh = (object: THREE.Object3D): object is THREE.Mesh => "isMesh" in object && (object.isMesh as boolean);

const FilterPageUI: React.FC = () => {
  // State and Refs
  const [showBlindMenu, setShowBlindMenu] = useState(false);
  const [selectedBlindType, setSelectedBlindType] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCustomizerView, setIsCustomizerView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeProcess, setActiveProcess] = useState<{ id: string; instruction: string; completed: boolean }>({
    id: "initial",
    instruction: "Click 'Start Camera' or upload an image to begin.",
    completed: false,
  });
  const [isSelectionBoxUsed, setIsSelectionBoxUsed] = useState(false);
  const [isSelectionBoxDrawn, setIsSelectionBoxDrawn] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null); // New state for sidebar sections

  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const controlButtonRef = useRef<HTMLButtonElement | null>(null);
  const uploadButtonRef = useRef<HTMLButtonElement | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const redoButtonRef = useRef<HTMLButtonElement | null>(null);
  const levelIndicatorRef = useRef<HTMLDivElement | null>(null);
  const addWindowButtonRef = useRef<HTMLButtonElement | null>(null);
  const playForwardButtonRef = useRef<HTMLButtonElement | null>(null);
  const playReverseButtonRef = useRef<HTMLButtonElement | null>(null);
  const modelsRef = useRef<ModelData[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const backgroundPlaneRef = useRef<THREE.Mesh | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectionBoxParamsRef = useRef<SelectionBoxParams | null>(null);
  const initialModelParamsRef = useRef<InitialModelParams | null>(null);
  const preloadedModelsRef = useRef<Map<string, ModelData>>(new Map());
  const isProcessingRef = useRef<boolean>(false);
  const changeQueueRef = useRef<{ type: "blind" | "pattern"; value: string }[]>([]);
  const draggingModelRef = useRef<THREE.Group | null>(null);
  const overlayImage = useRef<HTMLImageElement | null>(null);
  const [customPatternUrl, setCustomPatternUrl] = useState<string | null>(null); // State for custom pattern URL
  const customFileInputRef = useRef<HTMLInputElement | null>(null); // Ref for custom pattern file input

  const filteredPatterns = PATTERNS.filter((pattern) => {
    const matchesBlindType = selectedBlindType
      ? pattern.filterTags.some((tag) => tag.toLowerCase() === selectedBlindType.toLowerCase())
      : true; // If no blind type selected, include all patterns
    const matchesFilters = filters.length === 0 || pattern.filterTags.some((tag) => filters.includes(tag));
    return matchesBlindType && matchesFilters;
  });
  const instruction = activeProcess && typeof activeProcess.completed === "boolean"
    ? (!activeProcess.completed ? activeProcess.instruction : "")
    : "";

  const setNewProcess = (id: string, instruction: string) =>
    setActiveProcess({ id, instruction, completed: false });
  const completeCurrentProcess = () =>
    setActiveProcess((prev) => ({ ...prev, completed: true }));

  useEffect(() => {
    console.log("Initial capturedImage:", capturedImage);
    console.log("Initial isCustomizerView:", isCustomizerView);
    localStorage.removeItem("capturedImage");
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/overlayFilterUpdate.png";
    img.onload = () => (overlayImage.current = img);
  }, []);

  useEffect(() => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, screenWidth / screenHeight, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition(screenWidth, screenHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(screenWidth, screenHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.LinearToneMapping;
    rendererRef.current = renderer;
    mountRef.current?.appendChild(renderer.domElement);

    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 2));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    sceneRef.current.add(directionalLight);

    const secondaryLight = new THREE.DirectionalLight(0xffffff, 1);
    secondaryLight.position.set(-5, 5, -5);
    sceneRef.current.add(secondaryLight);

    animate();

    const handleResize = () => {
      const { innerWidth: width, innerHeight: height } = window;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateCameraPosition(width, height);
      if (backgroundPlaneRef.current && capturedImage) adjustBackgroundPlane(width, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      window.removeEventListener("resize", handleResize);
      cleanupThreeJs();
      modelsRef.current.forEach(modelData => {
        if (modelData.mixer) modelData.mixer.stopAllAction();
      });
    };
  }, []);

  useEffect(() => {
    const preloadModels = async () => {
      setIsLoading(true);
      const loader = new GLTFLoader();
      try {
        await Promise.all(
          Array.from(new Set(BLIND_TYPES.map((b) => b.modelUrl))).map(
            (url) =>
              new Promise<void>((resolve, reject) =>
                loader.load(
                  url,
                  (gltf) => {
                    preloadedModelsRef.current.set(url, { model: gltf.scene.clone(), gltf });
                    resolve();
                  },
                  undefined,
                  (error) => reject(error)
                )
              )
          )
        );
      } catch (error) {
        console.error("Preloading failed:", error);
      }
      setIsLoading(false);
    };
    preloadModels();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const addElement = <T extends HTMLElement>(
      tag: keyof HTMLElementTagNameMap,
      props: Record<string, any>,
      parent: HTMLElement = document.body
    ): T => {
      const el = Object.assign(document.createElement(tag), props) as T;
      parent.appendChild(el);
      return el;
    };

    videoRef.current = addElement<HTMLVideoElement>("video", { playsinline: true, muted: true, controls: false, className: "hidden" }, mount);
    canvasRef.current = addElement<HTMLCanvasElement>("canvas", { className: "absolute inset-0 w-full h-full object-cover z-[10]" }, mount);
    controlButtonRef.current = addElement<HTMLButtonElement>("button", { id: "controlButton", textContent: "Start Camera", className: "fixed bottom-12 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#cbaa51] text-white rounded-lg shadow-md hover:bg-[#e0c373] z-[100] transition duration-300" });
    controlButtonRef.current?.addEventListener("click", handleButtonClick);
    uploadButtonRef.current = addElement<HTMLButtonElement>("button", { id: "uploadButton", textContent: "Upload Image", className: "fixed bottom-28 left-1/2 transform -translate-x-1/2 py-3 px-6 text-lg bg-[#cbaa51] text-white rounded-lg shadow-md hover:bg-[#e0c373] z-[100] transition duration-300" });
    uploadButtonRef.current?.addEventListener("click", () => fileInputRef.current?.click());
    saveButtonRef.current = addElement<HTMLButtonElement>("button", { id: "saveButton", textContent: "Save Image", className: "fixed bottom-16 right-5 py-3 px-6 text-lg bg-[#cbaa51] text-white rounded-lg shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden" });
    saveButtonRef.current?.addEventListener("click", saveImage);
    redoButtonRef.current = addElement<HTMLButtonElement>("button", { id: "redoButton", className: "fixed bottom-12 right-5 p-2 bg-[#cbaa51] text-white rounded-full shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden" });
    redoButtonRef.current?.appendChild(addElement("img", { src: "/images/refreshWhite.png", alt: "Redo Selection", className: "h-6 w-6" }));
    redoButtonRef.current?.addEventListener("click", handleRedoSelection);
    addWindowButtonRef.current = addElement<HTMLButtonElement>("button", { id: "addWindowButton", textContent: "Add Blind", className: "fixed bottom-12 left-5 py-3 px-4 text-sm text-center bg-[#cbaa51] text-white rounded-lg shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden" });
    addWindowButtonRef.current?.addEventListener("click", addAnotherWindow);

    playForwardButtonRef.current = addElement<HTMLButtonElement>("button", {
      id: "playForwardButton",
      className: "fixed bottom-28 left-10 md:left-[calc(20%+48px)] md:bottom-20 py-2 px-4 text-lg bg-[#cbaa51] text-white rounded-full shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden",
    });
    playForwardButtonRef.current.appendChild(
      addElement("img", { src: "/images/rollDF.png", alt: "Play Forward", className: "w-6 h-6 pointer-events-none select-none", draggable: false })
    );

    playReverseButtonRef.current = addElement<HTMLButtonElement>("button", {
      id: "playReverseButton",
      className: "fixed bottom-12 left-10 md:left-[calc(20%+48px)] md:bottom-8 py-2 px-4 text-lg bg-[#cbaa51] text-white rounded-full shadow-md hover:bg-[#e0c373] z-[100] transition duration-300 hidden",
    });
    playReverseButtonRef.current.appendChild(
      addElement("img", { src: "/images/rollDownF.png", alt: "Play Reverse", className: "w-6 h-6 pointer-events-none select-none", draggable: false })
    );

    addElement("button", { id: "backButton", innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>', className: "absolute top-5 left-5 p-2 bg-[#cbaa51] text-white rounded-full shadow-md hover:bg-[#e0c373] z-[100] transition duration-300" }).addEventListener("click", () => window.location.href = "/");
    levelIndicatorRef.current = addElement<HTMLDivElement>("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-2 bg-red-500 rounded-full z-[100] hidden", style: { transition: "background-color 0.3s ease, border 0.3s ease" } }, mount);
    const mobileOverlayRef = addElement<HTMLDivElement>("div", { id: "mobileOverlay", className: "fixed inset-0 z-[35] pointer-events-none hidden md:hidden" }, mount);

    return () => {
      [videoRef, canvasRef, levelIndicatorRef].forEach((ref) => ref.current && mount.removeChild(ref.current));
      [controlButtonRef, uploadButtonRef, saveButtonRef, redoButtonRef, addWindowButtonRef, playForwardButtonRef, playReverseButtonRef].forEach((ref) => ref.current && document.body.removeChild(ref.current));
      mobileOverlayRef && mount.removeChild(mobileOverlayRef);
    };
  }, []);

  const handlePlayForward = (e: Event) => {
    e.preventDefault();
    modelsRef.current.forEach((modelData) => {
      if (modelData.action) {
        modelData.action.timeScale = 1;
        modelData.action.paused = false;
        if (!modelData.action.isRunning()) modelData.action.reset().play();
        console.log(`Playing forward: ${modelData.action.getClip().name}`);
      }
    });
  };

  const handlePlayReverse = (e: Event) => {
    e.preventDefault();
    modelsRef.current.forEach((modelData) => {
      if (modelData.action) {
        modelData.action.timeScale = -1;
        modelData.action.paused = false;
        if (!modelData.action.isRunning()) modelData.action.reset().play();
        console.log(`Playing reverse: ${modelData.action.getClip().name}`);
      }
    });
  };

  const handlePause = (e: Event) => {
    e.preventDefault();
    modelsRef.current.forEach((modelData) => {
      if (modelData.action) {
        modelData.action.paused = true;
        console.log(`Paused: ${modelData.action.getClip().name} at ${modelData.action.time}s`);
      }
    });
  };

  useEffect(() => {
    const forwardBtn = playForwardButtonRef.current;
    const reverseBtn = playReverseButtonRef.current;

    if (forwardBtn) {
      forwardBtn.addEventListener("mousedown", handlePlayForward, { passive: false });
      forwardBtn.addEventListener("mouseup", handlePause, { passive: false });
      forwardBtn.addEventListener("touchstart", handlePlayForward, { passive: false });
      forwardBtn.addEventListener("touchend", handlePause, { passive: false });
      forwardBtn.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    }

    if (reverseBtn) {
      reverseBtn.addEventListener("mousedown", handlePlayReverse, { passive: false });
      reverseBtn.addEventListener("mouseup", handlePause, { passive: false });
      reverseBtn.addEventListener("touchstart", handlePlayReverse, { passive: false });
      reverseBtn.addEventListener("touchend", handlePause, { passive: false });
      reverseBtn.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    }

    const setImageStyles = (btn: HTMLButtonElement | null) => {
      const img = btn?.querySelector("img");
      if (img) {
        img.style.pointerEvents = "none";
        img.style.userSelect = "none";
        img.setAttribute("draggable", "false");
      }
    };

    setImageStyles(forwardBtn);
    setImageStyles(reverseBtn);

    return () => {
      if (forwardBtn) {
        forwardBtn.removeEventListener("mousedown", handlePlayForward);
        forwardBtn.removeEventListener("mouseup", handlePause);
        forwardBtn.removeEventListener("touchstart", handlePlayForward);
        forwardBtn.removeEventListener("touchend", handlePause);
        forwardBtn.removeEventListener("touchmove", (e) => e.preventDefault());
      }
      if (reverseBtn) {
        reverseBtn.removeEventListener("mousedown", handlePlayReverse);
        reverseBtn.removeEventListener("mouseup", handlePause);
        reverseBtn.removeEventListener("touchstart", handlePlayReverse);
        reverseBtn.removeEventListener("touchend", handlePause);
        reverseBtn.removeEventListener("touchmove", (e) => e.preventDefault());
      }
    };
  }, [modelsRef.current.length]);

  const updateCameraPosition = (width: number, height: number) => {
    if (!cameraRef.current) return;
    const distance = (height / 100 / 2) / Math.tan((cameraRef.current.fov * Math.PI / 180) / 2);
    cameraRef.current.aspect = width / height;
    cameraRef.current.position.set(0, 0, distance);
    cameraRef.current.lookAt(0, 0, 0);
    cameraRef.current.updateProjectionMatrix();
  };

  const adjustBackgroundPlane = (width: number, height: number) => {
    if (!backgroundPlaneRef.current || !cameraRef.current) return;
    const texture = (backgroundPlaneRef.current.material as THREE.MeshBasicMaterial).map;
    if (!texture) return;
    const aspect = width / height;
    const imgAspect = texture.image.width / texture.image.height;
    const [planeWidth, planeHeight] = imgAspect > aspect ? [width / 100, (width / 100) / imgAspect] : [(height / 100) * imgAspect, height / 100];
    backgroundPlaneRef.current.geometry.dispose();
    backgroundPlaneRef.current.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    backgroundPlaneRef.current.position.set(0, 0, -0.1);
    updateCameraPosition(width, height);
  };

  const startCameraStream = async () => {
    setNewProcess("camera", "Place the window like it aligns with the edges of the box");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { min: 1280, ideal: 1920, max: 3840 },
          height: { min: 720, ideal: 1080, max: 2160 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, max: 60 },
        },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current && canvasRef.current && controlButtonRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          canvas.width = window.innerWidth * window.devicePixelRatio;
          canvas.height = window.innerHeight * window.devicePixelRatio;
          canvas.style.width = `${window.innerWidth}px`;
          canvas.style.height = `${window.innerHeight}px`;
          canvas.classList.remove("hidden");
          adjustCanvasAspect();
          const drawFrame = () => {
            if (!videoRef.current || !canvasRef.current || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const videoAspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            let drawWidth, drawHeight, offsetX, offsetY;
            if (videoAspect > canvasAspect) {
              drawWidth = canvas.width;
              drawHeight = canvas.width / videoAspect;
              offsetX = 0;
              offsetY = (canvas.height - drawHeight) / 2;
            } else {
              drawWidth = canvas.height * videoAspect;
              drawHeight = canvas.height;
              offsetX = (canvas.width - drawWidth) / 2;
              offsetY = 0;
            }
            ctx.drawImage(videoRef.current, offsetX, offsetY, drawWidth, drawHeight);
            if (overlayImage.current) {
              ctx.globalAlpha = 0.7;
              ctx.drawImage(overlayImage.current, 0, 0, canvas.width, canvas.height);
              ctx.globalAlpha = 1.0;
            }
            requestAnimationFrame(drawFrame);
          };
          if (controlButtonRef.current) {
            controlButtonRef.current.textContent = "Capture";
            controlButtonRef.current.classList.remove("hidden");
            controlButtonRef.current.style.zIndex = "100";
          }
          uploadButtonRef.current?.style.setProperty("display", "none");
          levelIndicatorRef.current?.classList.remove("hidden");
          requestOrientationPermission();
          drawFrame();
        }).catch((err) => {
          console.error("Video play failed:", err);
          setNewProcess("camera-error", "Failed to start camera preview.");
        });
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setNewProcess("camera-error", "Failed to access camera. Please upload an image instead.");
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current || !videoRef.current) return;
    setNewProcess("capture", "Draw a box on the image to place the 3D model.");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.width = `${video.videoWidth}px`;
    canvas.style.height = `${video.videoHeight}px`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    console.log("Captured image data:", imageData.substring(0, 50));
    setCapturedImage(imageData);
    localStorage.setItem("capturedImage", imageData);
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    cleanupCameraStream();
    loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
    initSelectionBox();
    if (controlButtonRef.current) {
      controlButtonRef.current.textContent = "Submit";
      controlButtonRef.current.classList.add("hidden");
    }
    levelIndicatorRef.current?.classList.add("hidden");
    window.removeEventListener("deviceorientation", handleDeviceOrientation);
    completeCurrentProcess();
  };

  const handleImageUpload = (file: File) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    setNewProcess("upload", "Draw a box on the image to place the 3D model.");
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      console.log("Uploaded image data:", imageData.substring(0, 50));
      setCapturedImage(imageData);
      localStorage.setItem("capturedImage", imageData);
      cleanupCameraStream();
      loadTextureAndCreatePlane(imageData, window.innerWidth, window.innerHeight);
      initSelectionBox();
      if (controlButtonRef.current) {
        controlButtonRef.current.textContent = "Submit";
        controlButtonRef.current.classList.add("hidden");
      }
      uploadButtonRef.current?.style.setProperty("display", "none");
      redoButtonRef.current?.classList.remove("hidden");
      completeCurrentProcess();
    };
    reader.readAsDataURL(file);
  };

  const loadTextureAndCreatePlane = (imageData: string, width: number, height: number) => {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageData, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const aspect = width / height;
      const imgAspect = texture.image.width / texture.image.height;
      const [planeWidth, planeHeight] = imgAspect > aspect ? [width / 100, (width / 100) / imgAspect] : [(height / 100) * imgAspect, height / 100];
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(planeWidth, planeHeight),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
      );
      if (backgroundPlaneRef.current) sceneRef.current.remove(backgroundPlaneRef.current);
      backgroundPlaneRef.current = plane;
      plane.position.set(0, 0, -0.1);
      sceneRef.current.add(plane);
      updateCameraPosition(width, height);
    });
  };

  const initSelectionBox = () => {
    if (isSelectionBoxUsed || !mountRef.current || selectionBoxRef.current) return;

    selectionBoxRef.current = Object.assign(document.createElement("div"), {
      className: "absolute border-2 border-dashed border-[#2F3526] bg-[#2F3526] bg-opacity-20 pointer-events-auto",
      style: { zIndex: "25", transition: "none" },
    });
    mountRef.current.appendChild(selectionBoxRef.current);

    const instructionDiv = document.createElement("div");
    instructionDiv.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 p-4 rounded shadow-md z-[100] pointer-events-auto flex flex-col items-center";

    const gif = document.createElement("img");
    gif.src = "/images/drag.gif";
    gif.alt = "How to draw selection box";
    gif.className = "w-48 h-auto rounded";
    instructionDiv.appendChild(gif);

    const instructionText = document.createElement("span");
    instructionText.textContent = "Draw a box over the window to place the blind";
    instructionText.className = "mt-2 text-white text-center";
    instructionDiv.appendChild(instructionText);

    const closeButton = document.createElement("button");
    closeButton.className = "mt-3 py-2 px-4 bg-[#cbaa51] text-white rounded-lg shadow-md hover:bg-[#e0c373] transition duration-300";
    closeButton.textContent = "Close";

    let isInstructionVisible = true;

    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log("Close button clicked");
      if (instructionDiv && mountRef.current) {
        console.log("Removing instruction div");
        mountRef.current.removeChild(instructionDiv);
        isInstructionVisible = false;
        attachEventListeners();
      } else {
        console.error("Instruction div or mountRef.current is not available");
      }
    });

    closeButton.addEventListener("touchstart", (e) => e.stopPropagation());

    instructionDiv.appendChild(closeButton);
    mountRef.current.appendChild(instructionDiv);

    let startX = 0, startY = 0, isDragging = false;

    const startSelection = (e: MouseEvent | Touch) => {
      if (isInstructionVisible || isSelectionBoxUsed) return;
      console.log("Starting selection");
      const rect = mountRef.current!.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      if (selectionBoxRef.current) {
        Object.assign(selectionBoxRef.current.style, { left: `${startX}px`, top: `${startY}px`, width: "0px", height: "0px", display: "block" });
        isDragging = true;
      }
    };

    const updateSelection = (e: MouseEvent | Touch) => {
      if (!isDragging || !selectionBoxRef.current) return;
      const rect = mountRef.current!.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      requestAnimationFrame(() => {
        if (selectionBoxRef.current) {
          Object.assign(selectionBoxRef.current.style, {
            width: `${Math.abs(x - startX)}px`,
            height: `${Math.abs(y - startY)}px`,
            left: `${Math.min(startX, x)}px`,
            top: `${Math.min(startY, y)}px`,
          });
        }
      });
    };

    const endSelection = (e: MouseEvent | Touch) => {
      if (!isDragging || !selectionBoxRef.current) return;
      console.log("Ending selection");
      selectionBoxRef.current.style.display = "none";
      isDragging = false;
      const rect = mountRef.current!.getBoundingClientRect();
      createDefaultModel(startX, startY, e.clientX - rect.left, e.clientY - rect.top);
      setIsSelectionBoxUsed(true);
      setIsSelectionBoxDrawn(true);
      if (controlButtonRef.current) controlButtonRef.current.classList.remove("hidden");
      cleanupSelectionBox();
    };

    const handlers = {
      mousedown: (e: MouseEvent) => { if (e.button === 0) startSelection(e); },
      mousemove: (e: MouseEvent) => updateSelection(e),
      mouseup: (e: MouseEvent) => endSelection(e),
      touchstart: (e: TouchEvent) => startSelection(e.touches[0]),
      touchmove: (e: TouchEvent) => updateSelection(e.touches[0]),
      touchend: (e: TouchEvent) => endSelection(e.changedTouches[0]),
    };

    const attachEventListeners = () => {
      console.log("Attaching event listeners");
      Object.entries(handlers).forEach(([event, handler]) =>
        mountRef.current!.addEventListener(event, handler as EventListener, { passive: false })
      );
    };

    const cleanupSelectionBox = () => {
      console.log("Cleaning up selection box");
      Object.entries(handlers).forEach(([event, handler]) =>
        mountRef.current?.removeEventListener(event, handler as EventListener)
      );
      if (selectionBoxRef.current && mountRef.current) {
        mountRef.current.removeChild(selectionBoxRef.current);
        selectionBoxRef.current = null;
      }
    };
  };

  const createDefaultModel = async (startX: number, startY: number, endX: number, endY: number) => {
    if (isProcessingRef.current || !sceneRef.current || !cameraRef.current) return;
    isProcessingRef.current = true;
    setIsLoading(true);

    const rect = mountRef.current!.getBoundingClientRect();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const adjustedStartY = isMobile ? startY - rect.top : startY;
    const adjustedEndY = isMobile ? endY - rect.top : endY;

    const worldStart = screenToWorld(startX, adjustedStartY, -0.1);
    const worldEnd = screenToWorld(endX, adjustedEndY, -0.1);

    selectionBoxParamsRef.current = {
      targetWidth: Math.abs(worldEnd.x - worldStart.x),
      targetHeight: Math.abs(worldEnd.y - worldStart.y),
      worldStart,
      worldEnd,
    };

    const defaultBlindType = BLIND_TYPES[0];
    let modelData = preloadedModelsRef.current.get(defaultBlindType.modelUrl);
    if (!modelData) {
      modelData = await loadModel(defaultBlindType.modelUrl);
      preloadedModelsRef.current.set(defaultBlindType.modelUrl, modelData);
    }

    const model = modelData.model.clone();
    const mixer = new THREE.AnimationMixer(model);
    const newModelData = { model, gltf: modelData.gltf, mixer };

    applyTextureToModel(model, selectedPattern || "/materials/mocha.png", defaultBlindType);

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const scale = new THREE.Vector3(
      selectionBoxParamsRef.current.targetWidth / size.x,
      selectionBoxParamsRef.current.targetHeight / size.y,
      0.01
    );
    model.scale.copy(scale);

    const targetX = (worldStart.x + worldEnd.x) / 2 - center.x * scale.x;
    const targetY = (worldStart.y + worldEnd.y) / 2 - center.y * scale.y;

    const yOffset = isMobile ? -0.5 : 0;
    model.position.set(targetX, targetY + yOffset, 0.1);
    initialModelParamsRef.current = { scale, position: model.position.clone() };

    model.traverse((child) => {
      if (isMesh(child)) child.visible = true;
    });

    model.userData.isDraggable = !isSubmitted;

    sceneRef.current.add(model);
    modelsRef.current.push(newModelData);
    if (!isCustomizerView) addWindowButtonRef.current?.classList.remove("hidden");

    playModelAnimation(newModelData, defaultBlindType.animationName);
    fadeInModel(model);
    renderScene();

    isProcessingRef.current = false;
    setIsLoading(false);
    completeCurrentProcess();
    redoButtonRef.current?.classList.remove("hidden");
  };

  const addAnotherWindow = () => {
    if (modelsRef.current.length === 0) return;
    const sourceModel = modelsRef.current[modelsRef.current.length - 1].model;
    const modelData = preloadedModelsRef.current.get(BLIND_TYPES.find(b => b.type === selectedBlindType)?.modelUrl || BLIND_TYPES[0].modelUrl);
    if (!modelData) return;

    const newModel = modelData.model.clone();
    const newMixer = new THREE.AnimationMixer(newModel);
    const newModelData = { model: newModel, gltf: modelData.gltf, mixer: newMixer };

    newModel.position.copy(sourceModel.position);
    newModel.position.x += 2;
    newModel.scale.copy(sourceModel.scale);
    newModel.userData.isDraggable = !isSubmitted;

    applyTextureToModel(newModel, selectedPattern || "/materials/mocha.png", BLIND_TYPES.find(b => b.type === selectedBlindType) || BLIND_TYPES[0]);
    sceneRef.current.add(newModel);
    modelsRef.current.push(newModelData);

    const blindType = BLIND_TYPES.find(b => b.type === selectedBlindType) || BLIND_TYPES[0];
    playModelAnimation(newModelData, blindType.animationName);
    fadeInModel(newModel);
    renderScene();
  };

  const setupDragging = () => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current || isSubmitted) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let clickOffset = new THREE.Vector3();

    const findParentModel = (object: THREE.Object3D): THREE.Group | null => {
      let current: THREE.Object3D | null = object;
      while (current) {
        const model = modelsRef.current.find((m) => m.model === current);
        if (model) return model.model;
        current = current.parent;
      }
      return null;
    };

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      mouse.x = ((e.clientX - mountRef.current!.getBoundingClientRect().left) / mountRef.current!.offsetWidth) * 2 - 1;
      mouse.y = -((e.clientY - mountRef.current!.getBoundingClientRect().top) / mountRef.current!.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(modelsRef.current.map((m) => m.model), true);
      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const model = findParentModel(intersected);
        if (model && model.userData.isDraggable) {
          draggingModelRef.current = model;
          const clickWorldPos = intersects[0].point;
          clickOffset.copy(model.position).sub(clickWorldPos);
          console.log("Mouse down: Model selected at", clickWorldPos, "Offset:", clickOffset);
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingModelRef.current || !cameraRef.current) return;
      mouse.x = ((e.clientX - mountRef.current!.getBoundingClientRect().left) / mountRef.current!.offsetWidth) * 2 - 1;
      mouse.y = -((e.clientY - mountRef.current!.getBoundingClientRect().top) / mountRef.current!.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1);
      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        draggingModelRef.current.position.copy(intersectPoint.add(clickOffset));
        console.log("Mouse move: Dragging to", intersectPoint);
        renderScene();
      }
    };

    const onMouseUp = () => {
      console.log("Mouse up: Dragging stopped");
      draggingModelRef.current = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      mouse.x = ((touch.clientX - mountRef.current!.getBoundingClientRect().left) / mountRef.current!.offsetWidth) * 2 - 1;
      mouse.y = -((touch.clientY - mountRef.current!.getBoundingClientRect().top) / mountRef.current!.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const intersects = raycaster.intersectObjects(modelsRef.current.map((m) => m.model), true);
      if (intersects.length > 0) {
        const intersected = intersects[0].object;
        const model = findParentModel(intersected);
        if (model && model.userData.isDraggable) {
          draggingModelRef.current = model;
          const touchWorldPos = intersects[0].point;
          clickOffset.copy(model.position).sub(touchWorldPos);
          console.log("Touch start: Model selected at", touchWorldPos, "Offset:", clickOffset);
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!draggingModelRef.current || !cameraRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      mouse.x = ((touch.clientX - mountRef.current!.getBoundingClientRect().left) / mountRef.current!.offsetWidth) * 2 - 1;
      mouse.y = -((touch.clientY - mountRef.current!.getBoundingClientRect().top) / mountRef.current!.offsetHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef.current!);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.1);
      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
        draggingModelRef.current.position.copy(intersectPoint.add(clickOffset));
        console.log("Touch move: Dragging to", intersectPoint);
        renderScene();
      }
    };

    const onTouchEnd = () => {
      console.log("Touch end: Dragging stopped");
      draggingModelRef.current = null;
    };

    const canvas = rendererRef.current.domElement;
    canvas.addEventListener("mousedown", onMouseDown, { passive: false });
    canvas.addEventListener("mousemove", onMouseMove, { passive: false });
    canvas.addEventListener("mouseup", onMouseUp, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  };

  useEffect(() => {
    if (capturedImage && !isSelectionBoxUsed) initSelectionBox();
    const cleanupDragging = setupDragging();
    return () => cleanupDragging?.();
  }, [capturedImage, isSelectionBoxUsed, modelsRef.current.length, isSubmitted]);

  const selectBlindType = async (type: string) => {
    if (isProcessingRef.current) {
      changeQueueRef.current.push({ type: "blind", value: type });
      return;
    }
    setNewProcess("blind-select", "Loading blind type... Please wait.");
    isProcessingRef.current = true;
    setIsLoading(true);
    setSelectedBlindType(type);
  
    const blindType = BLIND_TYPES.find((b) => b.type === type);
    if (!blindType || !selectionBoxParamsRef.current || !initialModelParamsRef.current) {
      isProcessingRef.current = false;
      setIsLoading(false);
      return;
    }
  
    // Get the first available pattern for this blind type
    const availablePatterns = PATTERNS.filter((pattern) =>
      pattern.filterTags.some((tag) => tag.toLowerCase() === type.toLowerCase())
    );
    const initialPattern = availablePatterns.length > 0 ? availablePatterns[0].patternUrl : "/materials/mocha.png"; // Fallback if no patterns match
    setSelectedPattern(initialPattern); // Set the initial pattern in state
  
    const currentModels = modelsRef.current.map(({ model }) => ({
      position: model.position.clone(),
      isDraggable: model.userData.isDraggable || false,
    }));
  
    await cleanupCurrentModel();
  
    let modelData = preloadedModelsRef.current.get(blindType.modelUrl);
    if (!modelData) {
      modelData = await loadModel(blindType.modelUrl);
      preloadedModelsRef.current.set(blindType.modelUrl, modelData);
    }
  
    const updatedModels: ModelData[] = [];
    currentModels.forEach(({ position, isDraggable }) => {
      const newModel = modelData.model.clone();
      const newMixer = new THREE.AnimationMixer(newModel);
      const newModelData = { model: newModel, gltf: modelData.gltf, mixer: newMixer };
  
      newModel.position.copy(position);
      if (initialModelParamsRef.current) newModel.scale.copy(initialModelParamsRef.current.scale);
      newModel.rotation.set(blindType.rotation.x, blindType.rotation.y, blindType.rotation.z);
      newModel.userData.isDraggable = isDraggable;
      applyTextureToModel(newModel, initialPattern, blindType); // Apply the initial pattern
  
      sceneRef.current.add(newModel);
      updatedModels.push(newModelData);
  
      playModelAnimation(newModelData, blindType.animationName);
      fadeInModel(newModel);
    });
  
    if (updatedModels.length === 0) {
      const newModel = modelData.model.clone();
      const newMixer = new THREE.AnimationMixer(newModel);
      const newModelData = { model: newModel, gltf: modelData.gltf, mixer: newMixer };
  
      if (initialModelParamsRef.current) {
        newModel.scale.copy(initialModelParamsRef.current.scale);
        newModel.position.copy(initialModelParamsRef.current.position);
      }
      newModel.rotation.set(blindType.rotation.x, blindType.rotation.y, blindType.rotation.z);
      applyTextureToModel(newModel, initialPattern, blindType); // Apply the initial pattern
      sceneRef.current.add(newModel);
      updatedModels.push(newModelData);
  
      playModelAnimation(newModelData, blindType.animationName);
      fadeInModel(newModel);
    }
  
    modelsRef.current = updatedModels;
    if (!isCustomizerView) addWindowButtonRef.current?.classList.remove("hidden");
  
    renderScene();
    isProcessingRef.current = false;
    setIsLoading(false);
    completeCurrentProcess();
  
    // Process any queued changes
    if (changeQueueRef.current.length > 0) {
      const nextChange = changeQueueRef.current.shift();
      if (nextChange) {
        if (nextChange.type === "blind") selectBlindType(nextChange.value);
        else if (nextChange.type === "pattern") selectPattern(nextChange.value);
      }
    }
  };

  const selectPattern = async (patternUrl: string) => {
    setNewProcess("pattern-select", "Applying pattern... Please wait.");
    setSelectedPattern(patternUrl);
    if (modelsRef.current.length === 0) {
      changeQueueRef.current.push({ type: "pattern", value: patternUrl });
      if (selectionBoxParamsRef.current && initialModelParamsRef.current) await createDefaultModel(
        selectionBoxParamsRef.current.worldStart.x,
        selectionBoxParamsRef.current.worldStart.y,
        selectionBoxParamsRef.current.worldEnd.x,
        selectionBoxParamsRef.current.worldEnd.y
      );
      return;
    }
    setIsLoading(true);
    const blindType = BLIND_TYPES.find((b) => b.type === selectedBlindType) || BLIND_TYPES[0];
    modelsRef.current.forEach(({ model }) =>
      applyTextureToModel(model, patternUrl, blindType)
    );
    setIsLoading(false);
    completeCurrentProcess();
  };

  const handleCustomPatternUpload = (file: File) => {
    setNewProcess("custom-pattern", "Applying custom pattern... Please wait.");
    setIsLoading(true);
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      console.log("Custom pattern image data:", imageData.substring(0, 50));
      setCustomPatternUrl(imageData); // Store the custom pattern URL
  
      const blindType = BLIND_TYPES.find((b) => b.type === selectedBlindType) || BLIND_TYPES[0];
      modelsRef.current.forEach(({ model }) => {
        applyTextureToModel(model, imageData, blindType); // Apply the custom pattern
      });
  
      setIsLoading(false);
      completeCurrentProcess();
    };
    reader.onerror = () => {
      console.error("Failed to read custom pattern file");
      setNewProcess("custom-pattern-error", "Failed to load custom pattern. Please try again.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const saveImage = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !backgroundPlaneRef.current) {
      console.error("Required Three.js components are missing:", {
        renderer: rendererRef.current,
        scene: sceneRef.current,
        camera: cameraRef.current,
        backgroundPlane: backgroundPlaneRef.current,
      });
      setNewProcess("save-error", "Missing required components. Please try again.");
      return;
    }

    setNewProcess("save", "Saving image... Please wait.");
    if (!confirm("Would you like to save the customized image?")) return;

    setIsLoading(true);
    setShowBlindMenu(false);
    saveButtonRef.current?.classList.add("hidden");

    const width = window.innerWidth;
    const height = window.innerHeight;

    rendererRef.current.clear();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const sceneDataUrl = rendererRef.current.domElement.toDataURL("image/png");

    if (!sceneDataUrl || sceneDataUrl === "data:,") {
      console.error("Failed to render scene to data URL");
      setNewProcess("save-error", "Failed to render the scene. Please try again.");
      setIsLoading(false);
      setShowBlindMenu(true);
      saveButtonRef.current?.classList.remove("hidden");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context for canvas");
      setNewProcess("save-error", "Canvas context unavailable. Please try again.");
      setIsLoading(false);
      setShowBlindMenu(true);
      saveButtonRef.current?.classList.remove("hidden");
      return;
    }

    const loadImage = (src: string, description: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${description}: ${src}`));
        img.src = src;
      });

    try {
      let effectiveCapturedImage = capturedImage || localStorage.getItem("capturedImage");
      if (!effectiveCapturedImage) {
        console.error("No captured image available");
        throw new Error("No background image to save");
      }
      const backgroundImg = await loadImage(effectiveCapturedImage, "Background image");
      ctx.drawImage(backgroundImg, 0, 0, width, height);

      const sceneImg = await loadImage(sceneDataUrl, "Scene image");
      ctx.drawImage(sceneImg, 0, 0, width, height);

      const logoImg = await loadImage("/images/baelogoN.png", "Logo image");
      const logoSize = height * 0.24;
      const logoX = (width - logoSize) / 2;
      const logoY = 16;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

      const finalDataUrl = canvas.toDataURL("image/png");
      if (!finalDataUrl || finalDataUrl === "data:,") throw new Error("Final data URL is empty");

      const blob = await (await fetch(finalDataUrl)).blob();
      const file = new File([blob], "custom_blind_image.png", { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Custom Blind Image",
            text: "Check out my custom blind design!",
          });
          setNewProcess("save-success", "Image shared! Check your gallery or downloads.");
        } catch (shareError) {
          console.warn("Sharing failed, falling back to download:", shareError);
          triggerDownload(finalDataUrl);
          setNewProcess("save-success", getDownloadSuccessMessage());
        }
      } else {
        triggerDownload(finalDataUrl);
        setNewProcess("save-success", getDownloadSuccessMessage());
      }
    } catch (error) {
      console.error("Error saving image:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setNewProcess("save-error", `Failed to save image: ${errorMessage}. Please try again.`);
    } finally {
      setIsLoading(false);
      setShowBlindMenu(true);
      saveButtonRef.current?.classList.remove("hidden");
      renderScene();
    }
  };

  const restoreRenderer = (originalModelData: { model: THREE.Group; scale: THREE.Vector3; position: THREE.Vector3 }[], originalCameraPosition: THREE.Vector3) => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.position.copy(originalCameraPosition);
      cameraRef.current.updateProjectionMatrix();
      adjustBackgroundPlane(window.innerWidth, window.innerHeight);
      originalModelData.forEach(({ model, scale, position }) => {
        model.scale.copy(scale);
        model.position.copy(position);
      });
      renderScene();
    }
    setShowBlindMenu(true);
    saveButtonRef.current?.classList.remove("hidden");
    setIsLoading(false);
    completeCurrentProcess();
  };

  const getDownloadSuccessMessage = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    return isIOS
      ? "Image downloaded! Open it in Downloads and tap 'Save to Photos'."
      : isAndroid
        ? "Image downloaded! Find it in your Downloads folder or Gallery."
        : "Image downloaded! Check your Downloads folder.";
  };

  const cleanupThreeJs = () => cameraStreamRef.current?.getTracks().forEach((track) => track.stop());

  const adjustCanvasAspect = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  };

  const cleanupCameraStream = () => {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.classList.add("hidden");
    }
  };

  const screenToWorld = (x: number, y: number, depth: number = -0.1) => {
    if (!cameraRef.current || !mountRef.current) return new THREE.Vector3();
    const rect = mountRef.current.getBoundingClientRect();
    const vector = new THREE.Vector3((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1, 0);
    vector.unproject(cameraRef.current);
    const dir = vector.sub(cameraRef.current.position).normalize();
    const distance = (depth - cameraRef.current.position.z) / dir.z;
    return cameraRef.current.position.clone().add(dir.multiplyScalar(distance));
  };

  const applyTextureToModel = (model: THREE.Group, patternUrl: string, blindType: BlindType) => {
    if (!model) return;
  
    const isCustomPattern = patternUrl.startsWith("data:image");
    const selectedPatternData: TexturePattern = isCustomPattern
      ? { patternUrl, uvConfig: { repeatX: 4, repeatY: -4, offsetX: 0, offsetY: 0 } }
      : PATTERNS.find((p) => p.patternUrl === patternUrl) || PATTERNS[0];
  
    if (blindType.meshNameFabric) {
      applyPatternTextureToModel(model, selectedPatternData, blindType.meshNameFabric);
    }
    if (blindType.meshNameWood) {
      applyPatternTextureToModel(model, selectedPatternData, blindType.meshNameWood);
    }
  };

  const applyPatternTextureToModel = (
    model: THREE.Group,
    pattern: TexturePattern,
    meshNames: string[] | undefined
  ) => {
    const textureLoader = new THREE.TextureLoader();
  
    const baseTexture = textureLoader.load(
      pattern.patternUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(pattern.uvConfig?.repeatX ?? 1, pattern.uvConfig?.repeatY ?? 1);
        tex.offset.set(pattern.uvConfig?.offsetX ?? 0, pattern.uvConfig?.offsetY ?? 0);
        if (pattern.uvConfig?.rotation) tex.rotation = pattern.uvConfig.rotation;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        console.log(`Loaded base texture: ${pattern.patternUrl}, Size: ${tex.image.width}x${tex.image.height}, Repeat: ${tex.repeat.x}x${tex.repeat.y}, Offset: ${tex.offset.x},${tex.offset.y}`);
      },
      undefined,
      (error) => console.error(`Failed to load base texture: ${pattern.patternUrl}`, error)
    );
  
    const materialProps: THREE.MeshStandardMaterialParameters = {
      map: baseTexture,
      roughness: 0.7,
      metalness: 0.0,
      side: THREE.DoubleSide,
    };
  
    const material = new THREE.MeshStandardMaterial(materialProps);
  
    let applied = false;
    model.traverse((child) => {
      if (isMesh(child) && (!meshNames || meshNames.includes(child.name))) {
        console.log(`Applying material to mesh: ${child.name}`);
        if (!child.geometry.attributes.uv) {
          console.warn(`Mesh ${child.name} has no UVs. Generating...`);
          child.geometry.computeBoundingBox();
          const box = child.geometry.boundingBox!;
          child.geometry.setAttribute(
            "uv",
            new THREE.BufferAttribute(
              new Float32Array(child.geometry.attributes.position.array.length / 3 * 2).map((_, i) => {
                const idx = Math.floor(i / 2);
                const x = child.geometry.attributes.position.getX(idx);
                const y = child.geometry.attributes.position.getY(idx);
                return i % 2 === 0 ? (x - box.min.x) / (box.max.x - box.min.x) : (y - box.min.y) / (box.max.y - box.min.y);
              }),
              2
            )
          );
        }
        const uvs = child.geometry.attributes.uv?.array;
        if (uvs) {
          const minU = Math.min(...Array.from(uvs).filter((_, i) => i % 2 === 0));
          const maxU = Math.max(...Array.from(uvs).filter((_, i) => i % 2 === 0));
          const minV = Math.min(...Array.from(uvs).filter((_, i) => i % 2 === 1));
          const maxV = Math.max(...Array.from(uvs).filter((_, i) => i % 2 === 1));
          console.log(`Mesh ${child.name} UV Range: U[${minU}, ${maxU}], V[${minV}, ${maxV}]`);
        }
  
        child.material = material;
        child.material.needsUpdate = true;
        applied = true;
      }
    });
  
    if (!applied) console.warn(`No meshes found for ${meshNames?.join(", ") || "all"} in model`);
    renderScene();
  };

  const fadeInModel = (model: THREE.Group) => {
    let opacity = 0;
    const step = () => {
      opacity += 0.1;
      model.traverse((child) => {
        if (isMesh(child)) {
          (child.material as THREE.MeshStandardMaterial).opacity = opacity;
          (child.material as THREE.MeshStandardMaterial).transparent = opacity < 1;
          (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });
      if (opacity < 1) requestAnimationFrame(step);
      else renderScene();
    };
    requestAnimationFrame(step);
  };

  const cleanupCurrentModel = async () => {
    await Promise.all(modelsRef.current.map(async (modelData) => {
      await new Promise<void>((resolve) => {
        let opacity = 1;
        const fadeOut = () => {
          opacity -= 0.1;
          modelData.model.traverse((child) => {
            if (isMesh(child)) {
              (child.material as THREE.MeshStandardMaterial).opacity = opacity;
              (child.material as THREE.MeshStandardMaterial).transparent = true;
              (child.material as THREE.MeshStandardMaterial).needsUpdate = true;
            }
          });
          if (opacity > 0) requestAnimationFrame(fadeOut);
          else resolve();
        };
        requestAnimationFrame(fadeOut);
      });
      if (modelData.mixer) modelData.mixer.stopAllAction();
      sceneRef.current.remove(modelData.model);
    }));
    modelsRef.current = [];
    addWindowButtonRef.current?.classList.add("hidden");
    renderScene();
  };

  const loadModel = (modelUrl: string) => new Promise<ModelData>((resolve, reject) => {
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        const mixer = new THREE.AnimationMixer(gltf.scene);
        const modelData = { model: gltf.scene, gltf, mixer };
        console.log(`Loaded model ${modelUrl}:`);
        console.log('Available animations:', gltf.animations.map(a => ({ name: a.name, duration: a.duration })));
        resolve(modelData);
      },
      undefined,
      (err) => reject(err)
    );
  });

  const playModelAnimation = (modelData: ModelData, animationName?: string) => {
    if (!modelData.mixer || !modelData.gltf?.animations?.length) {
      console.log('No animations available for this model');
      return;
    }

    const animations = modelData.gltf.animations;
    let animationClip: THREE.AnimationClip | undefined;

    if (animationName) {
      animationClip = animations.find(a => a.name.toLowerCase() === animationName.toLowerCase());
      console.log(`Attempting to prepare specified animation: ${animationName}`);
      if (!animationClip) {
        console.warn(`Animation "${animationName}" not found. Available animations:`, animations.map(a => a.name));
        animationClip = animations[0];
      }
    } else {
      animationClip = animations[0];
      console.log('No specific animation requested, preparing first available animation');
    }

    if (animationClip) {
      const action = modelData.mixer.clipAction(animationClip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.paused = true;
      modelData.action = action;
      console.log(`Prepared animation: ${animationClip.name}, Duration: ${animationClip.duration}s`);
    } else {
      console.log('No valid animation clip found to prepare');
    }
  };

  const renderScene = () => {
    if (rendererRef.current && cameraRef.current) rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    const delta = 1/60;
    modelsRef.current.forEach(modelData => {
      if (modelData.mixer) modelData.mixer.update(delta);
    });
    renderScene();
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = "custom_blind_image.png";
    link.href = dataUrl;
    link.click();
    setNewProcess("download", "Image downloaded! On iPhone, open it and tap 'Save to Photos'.");
  };

  const handleButtonClick = () => {
    const text = controlButtonRef.current?.textContent;
    if (text === "Start Camera") startCameraStream();
    else if (text === "Capture") captureImage();
    else if (text === "Submit") submitAndShowMenu();
  };

  const submitAndShowMenu = () => {
    setNewProcess("customize", "Select a blind type and pattern, then click 'Save Image' to download.");
    setShowBlindMenu(true);
    setIsCustomizerView(true);
    setIsSubmitted(true);

    controlButtonRef.current && document.body.removeChild(controlButtonRef.current);
    uploadButtonRef.current && document.body.removeChild(uploadButtonRef.current);
    redoButtonRef.current?.classList.add("hidden");
    saveButtonRef.current?.classList.remove("hidden");
    addWindowButtonRef.current?.classList.add("hidden");

    playForwardButtonRef.current?.classList.remove("hidden");
    playReverseButtonRef.current?.classList.remove("hidden");

    if (rendererRef.current && backgroundPlaneRef.current) {
      const texture = (backgroundPlaneRef.current.material as THREE.MeshBasicMaterial).map;
      if (texture) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        rendererRef.current.setSize(width, height);
        cameraRef.current!.aspect = width / height;
        cameraRef.current!.updateProjectionMatrix();

        const aspect = width / height;
        const imgAspect = texture.image.width / texture.image.height;
        const [planeWidth, planeHeight] = imgAspect > aspect
          ? [width / 100, (width / 100) / imgAspect]
          : [(height / 100) * imgAspect, height / 100];
        backgroundPlaneRef.current.geometry.dispose();
        backgroundPlaneRef.current.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        backgroundPlaneRef.current.position.set(0, 0, -0.1);

        const distance = (height / 100 / 2) / Math.tan((cameraRef.current!.fov * Math.PI / 180) / 2);
        cameraRef.current!.position.set(0, 0, distance);
        cameraRef.current!.lookAt(0, 0, 0);

        rendererRef.current.domElement.style.width = `${width}px`;
        rendererRef.current.domElement.style.height = `${height}px`;
        rendererRef.current.domElement.style.maxWidth = "100%";
        rendererRef.current.domElement.style.maxHeight = "100%";
        rendererRef.current.domElement.style.margin = "0";
        rendererRef.current.domElement.style.display = "block";

        if (mountRef.current) {
          mountRef.current.style.overflowY = "auto";
          mountRef.current.style.overflowX = "hidden";
          mountRef.current.style.display = "block";
          mountRef.current.style.justifyContent = "unset";
          mountRef.current.style.alignItems = "unset";
          mountRef.current.style.minHeight = "100vh";
          mountRef.current.style.width = "100%";
        }

        renderScene();
      }
    }

    const mobileOverlay = document.getElementById("mobileOverlay");
    if (mobileOverlay) {
      mobileOverlay.classList.remove("hidden");
      mobileOverlay.style.pointerEvents = "none";
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((prev) => e.target.checked ? [...prev, e.target.value] : prev.filter((tag) => tag !== e.target.value));

  const handleRedoSelection = async () => {
    await cleanupCurrentModel();
    setIsSelectionBoxUsed(false);
    setIsSelectionBoxDrawn(false);
    if (controlButtonRef.current) controlButtonRef.current.classList.add("hidden");
    setNewProcess("redo", "Draw a new box on the image to place the 3D model.");
  };

  const requestOrientationPermission = async () => {
    const request = (DeviceOrientationEvent as any).requestPermission;
    if (request) {
      try {
        if (await request() === "granted") window.addEventListener("deviceorientation", handleDeviceOrientation);
      } catch (err) {
        console.error("Orientation permission error:", err);
      }
    } else window.addEventListener("deviceorientation", handleDeviceOrientation);
  };

  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (!levelIndicatorRef.current) return;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    const isLevel = Math.abs(beta) < 2 && Math.abs(gamma) < 2;
    levelIndicatorRef.current.style.backgroundColor = isLevel ? "white" : "red";
    levelIndicatorRef.current.style.border = isLevel ? "2px solid black" : "none";
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };
// ... (rest of the imports, types, constants, and logic remain unchanged)

// Inside the FilterPageUI component, after all hooks and logic:
return (
  <div
    className="relative w-screen h-auto min-h-screen overflow-x-hidden overflow-y-auto"
    style={{
      fontFamily: "Poppins, sans-serif",
      background: !capturedImage && !isCustomizerView ? "url('/images/pic-2.jpg') center/cover no-repeat" : "#FFFFFF",
      touchAction: isCustomizerView ? "pan-y" : "auto",
    }}
  >
    {/* Add the CSS styles */}
    <style>{`
      .menu-section {
        background: linear-gradient(135deg, #ffffff, #f9fafb);
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        margin-bottom: 16px;
        padding: 16px;
      }
      .menu-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 12px;
        border-bottom: 2px solid #cbaa51;
        padding-bottom: 4px;
      }
      .patterns-scroll-container {
        max-height: 300px; /* Fixed height for mobile scroll */
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
        scrollbar-width: thin; /* Firefox */
        scrollbar-color: #cbaa51 #f9fafb; /* Firefox */
      }
      .patterns-scroll-container::-webkit-scrollbar {
        width: 8px; /* Chrome, Safari */
      }
      .patterns-scroll-container::-webkit-scrollbar-thumb {
        background-color: #cbaa51;
        border-radius: 4px;
      }
      .patterns-scroll-container::-webkit-scrollbar-track {
        background: #f9fafb;
      }
      @media (min-width: 768px) {
        .patterns-scroll-container {
          max-height: none; /* Remove height restriction on desktop */
          overflow-y: visible;
        }
      }
    `}</style>

    <div
      ref={mountRef}
      className="relative w-full h-auto min-h-screen"
      style={{
        zIndex: isCustomizerView ? 0 : 20,
        touchAction: isCustomizerView ? "pan-y" : "auto",
      }}
    />
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60]">
      <img src="/images/baelogoN.png" alt="Logo" className="w-24 h-24 object-contain" />
    </div>
    {instruction && (
      <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 p-2 rounded shadow-md z-[100] text-brown-800 text-lg">
        {instruction}
      </div>
    )}
    {isLoading && (
      <div className="fixed inset-0 flex items-center justify-center z-[50] bg-black bg-opacity-50">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )}
    <input
      type="file"
      ref={fileInputRef}
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        completeCurrentProcess();
        handleImageUpload(file);
      }}
    />
    {/* Add custom pattern file input */}
    <input
      type="file"
      ref={customFileInputRef}
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        handleCustomPatternUpload(file);
      }}
    />
    {showBlindMenu && isCustomizerView && (
      <>
        {/* Mobile Layout */}
        <div className="md:hidden w-full px-4 space-y-6" style={{ zIndex: 30, pointerEvents: "auto", touchAction: "pan-y", marginTop: "20px" }}>
          {/* Select Blind Type */}
          <div className="menu-section">
            <h3 className="menu-title">Select Blind Type</h3>
            <div className="grid grid-cols-2 gap-4">
              {BLIND_TYPES.map(({ type, buttonImage }) => (
                <div key={type} className="flex flex-col items-center">
                  <button
                    onClick={() => selectBlindType(type)}
                    className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      selectedBlindType === type
                        ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-md"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <img src={buttonImage} alt={type} className="w-12 h-12 object-contain" />
                  </button>
                  <span className="mt-2 text-xs text-center text-gray-600 font-medium">
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Patterns */}
          <div className="menu-section">
            <h3 className="menu-title">Available Patterns</h3>
            <div className="patterns-scroll-container">
              <div className="grid grid-cols-2 gap-4">
                {filteredPatterns.length > 0 ? (
                  filteredPatterns.map(({ name, image, price, patternUrl }) => (
                    <div key={name} className="flex flex-col items-center">
                      <button
                        onClick={() => selectPattern(patternUrl)}
                        className={`p-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                          selectedPattern === patternUrl
                            ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-md"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <img src={image} alt={name} className="w-12 h-12 object-contain rounded" />
                      </button>
                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-600 font-medium block">{name}</span>
                        <span className="text-xs text-gray-500 font-light">{price}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-500">No patterns available for this blind type</div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Pattern */}
          <div className="menu-section">
            <h3 className="menu-title">Custom Pattern</h3>
            <div className="flex flex-col items-center">
              <button
                onClick={() => customFileInputRef.current?.click()}
                className="p-3 rounded-lg bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-md hover:bg-[#e0c373] transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-sm font-medium">Upload Custom Pattern</span>
              </button>
              {customPatternUrl && (
                <div className="mt-4">
                  <img src={customPatternUrl} alt="Custom Pattern" className="w-16 h-16 object-contain rounded" />
                  <span className="mt-2 text-xs text-gray-600 font-medium block text-center">Custom Pattern Applied</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block fixed top-0 left-0 w-1/5 min-h-screen bg-white shadow-2xl z-[40] overflow-hidden border-r border-gray-200">
          <div className="flex flex-col min-h-screen pt-16 px-6 pb-6 bg-gradient-to-b from-white to-gray-50">
            <div className="mb-8 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-[#cbaa51] to-[#e0c373] bg-clip-text text-transparent">
                Customize Blinds
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Select Blind Type */}
              <div className="relative">
                <button
                  onClick={() => toggleSection("blindType")}
                  className="w-full text-left p-4 bg-gray-100 rounded-xl shadow-md flex justify-between items-center text-gray-800 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#cbaa51]/50 border border-gray-200"
                >
                  <span className="font-semibold text-base">Select Blind Type</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${openSection === "blindType" ? "rotate-180" : ""} text-[#cbaa51]`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSection === "blindType" && (
                  <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto animate-fadeIn">
                    {BLIND_TYPES.map(({ type, buttonImage }) => (
                      <div key={type} className="flex flex-col items-center">
                        <button
                          onClick={() => selectBlindType(type)}
                          className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                            selectedBlindType === type
                              ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-lg"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <img src={buttonImage} alt={type} className="w-16 h-16 object-contain" />
                        </button>
                        <span className="mt-2 text-xs text-center text-gray-600 font-medium">{type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Patterns */}
              <div className="relative">
                <button
                  onClick={() => toggleSection("patterns")}
                  className="w-full text-left p-4 bg-gray-100 rounded-xl shadow-md flex justify-between items-center text-gray-800 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#cbaa51]/50 border border-gray-200"
                >
                  <span className="font-semibold text-base">Available Patterns</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${openSection === "patterns" ? "rotate-180" : ""} text-[#cbaa51]`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSection === "patterns" && (
                  <div className="mt-3 grid grid-cols-2 gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto animate-fadeIn">
                    {filteredPatterns.length > 0 ? (
                      filteredPatterns.map(({ name, image, price, patternUrl }) => (
                        <div key={name} className="flex flex-col items-center">
                          <button
                            onClick={() => selectPattern(patternUrl)}
                            className={`p-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                              selectedPattern === patternUrl
                                ? "bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-lg"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                            }`}
                          >
                            <img src={image} alt={name} className="w-16 h-16 object-contain" />
                          </button>
                          <span className="mt-2 text-xs text-center text-gray-600 font-medium">{name}</span>
                          <span className="text-xs text-gray-500 font-light">{price}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-gray-500">No patterns available for this blind type</div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Pattern */}
              <div className="relative">
                <button
                  onClick={() => toggleSection("customPattern")}
                  className="w-full text-left p-4 bg-gray-100 rounded-xl shadow-md flex justify-between items-center text-gray-800 hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#cbaa51]/50 border border-gray-200"
                >
                  <span className="font-semibold text-base">Custom Pattern</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform duration-300 ${openSection === "customPattern" ? "rotate-180" : ""} text-[#cbaa51]`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openSection === "customPattern" && (
                  <div className="mt-3 p-4 bg-white rounded-xl shadow-lg border border-gray-100 animate-fadeIn">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => customFileInputRef.current?.click()}
                        className="p-3 rounded-lg bg-gradient-to-r from-[#cbaa51] to-[#e0c373] text-white shadow-lg hover:bg-[#e0c373] transition-all duration-300 transform hover:scale-105"
                      >
                        <span className="text-sm font-medium">Upload Custom Pattern</span>
                      </button>
                      {customPatternUrl && (
                        <div className="mt-4">
                          <img src={customPatternUrl} alt="Custom Pattern" className="w-16 h-16 object-contain rounded" />
                          <span className="mt-2 text-xs text-gray-600 font-medium block text-center">Custom Pattern Applied</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:block md:ml-[20%] w-[80%] h-full" />
      </>
    )}
  </div>
);}
                
export default FilterPageUI;